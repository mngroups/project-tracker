const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

/**
 * `YYYY-MM-DD` → "1 Mar 2026". Works on the string, not a `Date`, so a calendar
 * date never shifts with the viewer's timezone.
 */
export function formatProjectDate(value: string | null): string {
  if (!value) return "-";
  const [year, month, day] = value.split("-");
  return `${Number(day)} ${MONTHS[Number(month) - 1]} ${year}`;
}
