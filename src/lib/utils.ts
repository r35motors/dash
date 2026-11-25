import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || amount === "") return "₹0";
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "₹0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
}

export function numberToIndianWords(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || amount === "") {
    return "Rupees Zero Only";
  }

  // Clean string input if any
  const strVal = typeof amount === "number" ? amount.toString() : String(amount);
  const cleanStr = strVal.replace(/[₹,\s]/g, "");
  const num = parseFloat(cleanStr);

  if (isNaN(num) || num === 0) {
    return "Rupees Zero Only";
  }

  const isNegative = num < 0;
  const absNum = Math.abs(num);

  const integerPart = Math.floor(absNum);
  const decimalPart = Math.round((absNum - integerPart) * 100);

  const units = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
  ];

  const tens = [
    "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
  ];

  function convertTwoDigits(n: number): string {
    if (n === 0) return "";
    if (n < 20) return units[n];
    const t = Math.floor(n / 10);
    const u = n % 10;
    return u > 0 ? `${tens[t]}-${units[u]}` : tens[t];
  }

  function convertThreeDigits(n: number): string {
    const hundred = Math.floor(n / 100);
    const rem = n % 100;
    const parts: string[] = [];
    if (hundred > 0) {
      parts.push(`${units[hundred]} Hundred`);
    }
    if (rem > 0) {
      parts.push(convertTwoDigits(rem));
    }
    return parts.join(" ");
  }

  function convertInteger(n: number): string {
    if (n === 0) return "Zero";

    const parts: string[] = [];

    // Crore (1,00,00,000 = 10^7)
    const crore = Math.floor(n / 10000000);
    n %= 10000000;
    if (crore > 0) {
      parts.push(`${convertInteger(crore)} Crore`);
    }

    // Lakh (1,00,000 = 10^5)
    const lakh = Math.floor(n / 100000);
    n %= 100000;
    if (lakh > 0) {
      parts.push(`${convertTwoDigits(lakh)} Lakh`);
    }

    // Thousand (1,000 = 10^3)
    const thousand = Math.floor(n / 1000);
    n %= 1000;
    if (thousand > 0) {
      parts.push(`${convertTwoDigits(thousand)} Thousand`);
    }

    // Hundreds and tens/units
    if (n > 0) {
      parts.push(convertThreeDigits(n));
    }

    return parts.join(" ");
  }

  const words = convertInteger(integerPart);
  let result = `Rupees ${words}`;

  if (decimalPart > 0) {
    result += ` and ${convertTwoDigits(decimalPart)} Paise`;
  }

  result += " Only";
  if (isNegative) {
    result = `Minus ${result}`;
  }

  return result;
}

