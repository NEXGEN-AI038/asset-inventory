const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Formats a number as Indian Rupees, e.g. 1234567.5 → ₹12,34,567.50 */
export function formatINR(amount: number): string {
  return inr.format(Number.isFinite(amount) ? amount : 0);
}
