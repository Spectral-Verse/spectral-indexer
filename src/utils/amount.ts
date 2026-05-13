export function formatAmount(amount: string | bigint, decimals: number = 7): string {
  const amountStr = amount.toString().padStart(decimals + 1, '0');
  const integral = amountStr.slice(0, -decimals);
  const fractional = amountStr.slice(-decimals).replace(/0+$/, '');
  return fractional ? `${integral}.${fractional}` : integral;
}

export function toBigInt(amount: string | number, decimals: number = 7): bigint {
  const [integral, fractional = ''] = amount.toString().split('.');
  const paddedFractional = fractional.padEnd(decimals, '0').slice(0, decimals);
  return BigInt(integral + paddedFractional);
}
