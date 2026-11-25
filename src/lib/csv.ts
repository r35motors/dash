/**
 * CSV export utility with UTF-8 BOM (Excel compatible) and RFC-4180 escaping.
 */

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isOnOrBeforeDate(
  value: string | Date | null | undefined,
  tillDateStr: string
): boolean {
  if (!tillDateStr) return true;
  if (!value) return true;

  const d = typeof value === "string" ? new Date(value) : value;
  if (isNaN(d.getTime())) return true;

  const [y, m, day] = tillDateStr.split("-").map(Number);
  if (!y || !m || !day) return true;

  // Compare against the end of the selected calendar day in UTC/local safely
  const cutoff = new Date(Date.UTC(y, m - 1, day, 23, 59, 59, 999));
  return d.getTime() <= cutoff.getTime();
}

function escapeCsvCell(val: unknown): string {
  if (val === null || val === undefined) return "";
  const str = String(val);
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function downloadCsv(
  filename: string,
  headers: string[],
  rows: Array<Array<unknown>>
): void {
  const headerLine = headers.map(escapeCsvCell).join(",");
  const bodyLines = rows.map((row) => row.map(escapeCsvCell).join(","));
  const csvContent = "\uFEFF" + [headerLine, ...bodyLines].join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
