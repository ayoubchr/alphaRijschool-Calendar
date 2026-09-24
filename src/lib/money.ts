export function formatEuro(cents: number) {
  const euros = cents / 100;
  if (Number.isInteger(euros)) return `€${euros}`;
  return `€${euros.toFixed(2).replace(".", ",")}`;
}
