export function toCents(dollars: number): number {
  return Math.round(dollars * 100);
}

export function fromCents(cents: number): number {
  return cents / 100;
}

export function addCents(...amounts: number[]): number {
  return amounts.reduce((sum, n) => sum + n, 0);
}

export function formatSGD(cents: number): string {
  return new Intl.NumberFormat("en-SG", {
    style: "currency",
    currency: "SGD",
  }).format(fromCents(cents));
}
