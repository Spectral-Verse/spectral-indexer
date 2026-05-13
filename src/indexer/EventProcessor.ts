import { prisma } from '../db/prisma';
import { parseSpectraEvent } from '../parsers/spectraEvents';
import { logger } from '../utils/logger';

export class EventProcessor {
  public async processEvents(events: any[], network: string) {
    for (const event of events) {
      const parsed = parseSpectraEvent(event);
      if (!parsed) continue;

      logger.info({ type: parsed.type, vaultId: parsed.vaultId }, 'Processing event');

      try {
        await prisma.$transaction(async (tx) => {
          // Save raw event for traceability
          await tx.rawEvent.create({
            data: {
              network,
              contractId: event.contractId,
              ledger: event.ledger,
              txHash: event.txHash,
              eventBodyXdr: event.value,
            },
          });

          // Handle specific event types
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
            // ... other cases
          }
        });
      } catch (err) {
        logger.error({ err, eventId: event.id }, 'Failed to process event');
      }
    }
  }

  private async handleVaultCreated(tx: any, event: any, network: string, contractId: string) {
    // data is the manager address in the contract event
    const manager = event.data;
    
    // In a real scenario, we'd fetch the config from the contract 
    // but for the indexer, we rely on the event data where possible.
    await tx.vault.upsert({
      where: { id: event.vaultId },
      update: {
        lastUpdatedLedger: event.ledger,
      },
      create: {
        id: event.vaultId,
        contractId,
        network,
        name: "New Vault", // Default, would be updated by metadata event
        manager,
        rebalanceAuthority: manager,
        baseAsset: "XLM", // Default
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

  private async handleDeposit(tx: any, event: any) {
    const [user, asset, amount, shares] = event.data;

    // Update position
    const position = await tx.position.findUnique({
      where: { vaultId_account: { vaultId: event.vaultId, account: user } },
    });

    const currentShares = BigInt(position?.shares || "0");
    const currentDeposited = BigInt(position?.depositedAmount || "0");

    await tx.position.upsert({
      where: { vaultId_account: { vaultId: event.vaultId, account: user } },
      update: {
        shares: (currentShares + BigInt(shares)).toString(),
        depositedAmount: (currentDeposited + BigInt(amount)).toString(),
        lastActivityAt: new Date(),
      },
      create: {
        vaultId: event.vaultId,
        account: user,
        shares: shares.toString(),
        depositedAmount: amount.toString(),
        withdrawnAmount: "0",
        lastActivityAt: new Date(),
      },
    });

    // Update vault total shares
    const vault = await tx.vault.findUnique({ where: { id: event.vaultId } });
    const totalShares = BigInt(vault?.totalShares || "0");
    await tx.vault.update({
      where: { id: event.vaultId },
      data: {
        totalShares: (totalShares + BigInt(shares)).toString(),
        lastUpdatedLedger: event.ledger,
      },
    });

    // Update vault balance
    const balance = await tx.vaultBalance.findUnique({
      where: { vaultId_asset: { vaultId: event.vaultId, asset } },
    });
    const currentBalance = BigInt(balance?.balance || "0");
    await tx.vaultBalance.upsert({
      where: { vaultId_asset: { vaultId: event.vaultId, asset } },
      update: { balance: (currentBalance + BigInt(amount)).toString() },
      create: { vaultId: event.vaultId, asset, balance: amount.toString() },
    });
  }

  private async handleWithdrawal(tx: any, event: any) {
    const [user, sharesBurned, amounts] = event.data;

    // Update position
    const position = await tx.position.findUnique({
      where: { vaultId_account: { vaultId: event.vaultId, account: user } },
    });

    if (position) {
      const currentShares = BigInt(position.shares);
      await tx.position.update({
        where: { id: position.id },
        data: {
          shares: (currentShares - BigInt(sharesBurned)).toString(),
          lastActivityAt: new Date(),
        },
      });
    }

    // Update vault total shares
    const vault = await tx.vault.findUnique({ where: { id: event.vaultId } });
    const totalShares = BigInt(vault?.totalShares || "0");
    await tx.vault.update({
      where: { id: event.vaultId },
      data: {
        totalShares: (totalShares - BigInt(sharesBurned)).toString(),
        lastUpdatedLedger: event.ledger,
      },
    });

    // Update vault balances for each withdrawn asset
    for (const [asset, amount] of amounts) {
      const balance = await tx.vaultBalance.findUnique({
        where: { vaultId_asset: { vaultId: event.vaultId, asset } },
      });
      if (balance) {
        const currentBalance = BigInt(balance.balance);
        await tx.vaultBalance.update({
          where: { id: balance.id },
          data: { balance: (currentBalance - BigInt(amount)).toString() },
        });
      }
    }
  }
}
