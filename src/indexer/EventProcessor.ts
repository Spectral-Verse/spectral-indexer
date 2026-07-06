import { prisma } from '../db/prisma';
import { parseSpectralEvent } from '../parsers/spectralEvents';
import { logger } from '../utils/logger';

/**
 * Logic for processing parsed Spectral Verse contract events and updating the derived database state.
 * All updates are performed within Prisma transactions to ensure data consistency.
 */
export class EventProcessor {
  /**
   * Main entry point for processing a batch of raw Soroban events.
   * 
   * @param events - Array of raw event objects from the RPC.
   * @param network - The network name for database indexing.
   */
  public async processEvents(events: any[], network: string) {
    for (const event of events) {
      // Parse the raw event into a structured Spectral Verse event model
      const parsed = parseSpectralEvent(event);
      if (!parsed) continue;

      logger.info({ type: parsed.type, vaultId: parsed.vaultId }, 'Processing event');

      try {
        // Execute all state updates for this event in a single database transaction
        await prisma.$transaction(async (tx) => {
          // Store the raw event XDR for auditability and future reprocessing
          await tx.rawEvent.create({
            data: {
              network,
              contractId: event.contractId,
              ledger: event.ledger,
              txHash: event.txHash,
              eventBodyXdr: event.value,
            },
          });

          // Dispatch to specific event handlers based on the event type
          switch (parsed.type) {
            case 'created':
              await this.handleVaultCreated(tx, parsed, network, event.contractId);
              break;
            case 'deposit':
              await this.handleDeposit(tx, parsed);
              break;
            case 'withdraw':
              await this.handleWithdrawal(tx, parsed);
              break;
            case 'rebalance':
              await this.handleRebalance(tx, parsed);
              break;
            case 'config':
              await this.handleConfigUpdated(tx, parsed);
              break;
            case 'fees':
              await this.handleFeesClaimed(tx, parsed);
              break;
          }
        });
      } catch (err) {
        logger.error({ err, eventId: event.id }, 'Failed to process event');
      }
    }
  }

  /**
   * Handles the 'vault created' event.
   * 
   * Initializes the base vault record in the database. Further metadata like
   * name and assets will be populated by other events or through direct
   * contract polling if necessary.
   *
   * @param tx - Prisma transaction client.
   * @param event - Parsed vault creation event.
   * @param network - The network identifier.
   * @param contractId - The address of the vault contract.
   */
  private async handleVaultCreated(tx: any, event: any, network: string, contractId: string) {
    const manager = event.data;
    
    await tx.vault.upsert({
      where: { id: event.vaultId },
      update: {
        lastUpdatedLedger: event.ledger,
      },
      create: {
        id: event.vaultId,
        contractId,
        network,
        name: "New Vault", 
        manager,
        rebalanceAuthority: manager,
        baseAsset: "XLM",
        metadataHash: "",
        managementFeeBps: 0,
        depositStatus: "Active",
        withdrawalStatus: "Active",
        totalShares: "0",
        createdLedger: event.ledger,
        createdTxHash: event.txHash,
        lastUpdatedLedger: event.ledger,
      },
    });
  }

  /**
   * Handles the 'deposit' event.
   * 
   * Updates:
   * 1. User's share position in the vault (upsert).
   * 2. Vault's total share supply.
   * 3. Specific asset balance within the vault's basket.
   * 
   * @param tx - Prisma transaction client.
   * @param event - Parsed deposit event.
   */
  private async handleDeposit(tx: any, event: any) {
    const [user, asset, amount, shares] = event.data;

    // 1. Update user position
    await tx.position.upsert({
      where: { vaultId_account: { vaultId: event.vaultId, account: user } },
      update: {
        shares: { increment: BigInt(shares).toString() },
      },
      create: {
        vaultId: event.vaultId,
        account: user,
        shares: BigInt(shares).toString(),
      },
    });

    // 2. Update vault total shares
    await tx.vault.update({
      where: { id: event.vaultId },
      data: {
        totalShares: { increment: BigInt(shares).toString() },
      },
    });

    // 3. Update asset balance
    await tx.vaultBalance.upsert({
      where: { vaultId_asset: { vaultId: event.vaultId, asset } },
      update: {
        amount: { increment: BigInt(amount).toString() },
      },
      create: {
        vaultId: event.vaultId,
        asset,
        amount: BigInt(amount).toString(),
      },
    });
  }

  /**
   * Handles the 'withdraw' event.
   * 
   * Decrements user shares and updates all asset balances that were returned
   * to the user during redemption.
   * 
   * @param tx - Prisma transaction client.
   * @param event - Parsed withdrawal event.
   */
  private async handleWithdrawal(tx: any, event: any) {
    const [user, shares, amounts] = event.data;

    // 1. Update user position
    await tx.position.update({
      where: { vaultId_account: { vaultId: event.vaultId, account: user } },
      data: {
        shares: { decrement: BigInt(shares).toString() },
      },
    });

    // 2. Update vault total shares
    await tx.vault.update({
      where: { id: event.vaultId },
      data: {
        totalShares: { decrement: BigInt(shares).toString() },
      },
    });

    // 3. Update all asset balances in the basket
    for (const [asset, amount] of amounts) {
      await tx.vaultBalance.update({
        where: { vaultId_asset: { vaultId: event.vaultId, asset } },
        data: {
          amount: { decrement: BigInt(amount).toString() },
        },
      });
    }
  }

  /**
   * Handles the 'rebalance' event.
   * 
   * Records the allocation update in the rebalance history table.
   * 
   * @param tx - Prisma transaction client.
   * @param event - Parsed rebalance event.
   */
  private async handleRebalance(tx: any, event: any) {
    const [oldHash, newHash] = event.data;
    await tx.rebalanceHistory.create({
      data: {
        vaultId: event.vaultId,
        oldHash,
        newHash,
        ledger: event.ledger,
        timestamp: new Date(), // Ideally use ledger timestamp
      },
    });
  }

  /**
   * Handles the 'config' event.
   * 
   * Updates administrative settings like manager address or operational status.
   * 
   * @param tx - Prisma transaction client.
   * @param event - Parsed config update event.
   */
  private async handleConfigUpdated(tx: any, event: any) {
    const manager = event.data;
    await tx.vault.update({
      where: { id: event.vaultId },
      data: {
        manager,
        lastUpdatedLedger: event.ledger,
      },
    });
  }

  /**
   * Handles the 'fees' event.
   * 
   * Records fee claims by the manager.
   * 
   * @param tx - Prisma transaction client.
   * @param event - Parsed fee claim event.
   */
  private async handleFeesClaimed(tx: any, event: any) {
    const [manager, amounts] = event.data;
    // Log fee claim for analytics
    logger.info({ vaultId: event.vaultId, manager, amounts }, 'Fees claimed');
  }
}
