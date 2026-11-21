export interface VehicleItem {
  id: string;
  vehicle_name: string;
  registration_number: string;
  owner_name: string;
  purchase_price: string | number;
  status: string; // 'Available' | 'Sold'
  created_at: string | Date;
  updated_at?: string | Date;
}

export interface SaleItem {
  id: string;
  vehicle_id: string;
  buyer_name: string;
  sale_date: string | Date;
  selling_price: string | number;
  created_at?: string | Date;
  vehicle?: any;
}

export interface InvoiceItemSummary {
  id?: string;
  invoice_id?: string;
  description: string;
  amount: string | number;
}

export interface InvoiceItemRecord {
  id: string;
  invoice_number: string;
  vehicle_id: string;
  sale_id: string | null;
  invoice_date: string | Date;
  invoice_total: string | number;
  items?: InvoiceItemSummary[];
}

export interface LifetimeAnalyticsResult {
  totalPurchaseValue: number; // Sum of ALL vehicle purchase prices
  totalSalesValue: number;    // Sum of completed sale invoice totals (including additional invoice items if invoiced, or selling price)
  totalProfit: number;        // Sales value minus purchase value of vehicles sold
  vehiclesPurchased: number;  // Total count of all vehicles
  vehiclesSold: number;       // Total count of sold vehicles
  totalVehicles: number;      // Count of all vehicles in inventory
  soldVehicles: number;       // Count of sold vehicles
  availableVehicles: number;
  totalVehicleValue: number;  // Combined purchase price of all vehicles in inventory, including sold
  profitMarginPercent: number; // (totalProfit / totalSalesValue) * 100
}

export interface MonthlyAnalyticsResult {
  selectedYear: number;
  selectedMonth: number; // 1-12
  monthlyPurchaseValue: number; // Sum of purchase prices of vehicles acquired in the selected month
  monthlySalesValue: number;    // Sum of completed sale invoice totals (including additional items) sold in the selected month
  monthlyProfit: number;        // Monthly sales value minus purchase value of vehicles sold in that month
  vehiclesPurchased: number;    // Vehicles purchased that month
  vehiclesSold: number;         // Vehicles sold that month
  profitMarginPercent: number;  // Monthly margin %
  salesList: Array<{
    id: string;
    vehicle_name: string;
    registration_number: string;
    buyer_name: string;
    sale_date: string;
    purchase_price: number;
    selling_price: number;
    sales_value: number;
    profit: number;
    invoice_number?: string;
  }>;
}

export interface MonthlyChartPoint {
  month: string;         // "Jan", "Feb", ...
  monthNumber: number;   // 1-12
  purchases: number;     // Monthly purchase value (acquisitions)
  sales: number;         // Monthly sales value (revenue)
  profit: number;        // Monthly gross profit
  vehiclesPurchased: number;
  vehiclesSold: number;
}

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export const MONTH_SHORT_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

/**
 * Calculates effective sales value for a sale:
 * If invoiced, uses invoice_total (which reflects vehicle base + additional invoice items).
 * If not invoiced, uses sale.selling_price.
 */
export function getSaleRevenue(
  sale: SaleItem,
  invoices: InvoiceItemRecord[]
): { revenue: number; invoice?: InvoiceItemRecord } {
  const invoice = invoices.find(
    (inv) => inv.sale_id === sale.id || inv.vehicle_id === sale.vehicle_id
  );
  if (invoice && invoice.invoice_total !== undefined && invoice.invoice_total !== null) {
    const invTotal = parseFloat(String(invoice.invoice_total));
    if (!isNaN(invTotal)) {
      return { revenue: invTotal, invoice };
    }
  }
  const salePrice = parseFloat(String(sale.selling_price));
  return { revenue: isNaN(salePrice) ? 0 : salePrice, invoice };
}

/**
 * Section 7: Lifetime Analytics Calculation
 * - Total purchase value = Sum of ALL vehicle purchase prices.
 * - Total sales value = Sum of completed sale invoice totals (including additional invoice items if invoiced, or selling price).
 * - Total profit = Sales value minus purchase value of vehicles sold.
 * - Vehicles purchased = total count.
 * - Vehicles sold = total count.
 */
export function calculateLifetimeAnalytics(
  vehicles: VehicleItem[],
  sales: SaleItem[],
  invoices: InvoiceItemRecord[]
): LifetimeAnalyticsResult {
  const vehiclesMap = new Map<string, VehicleItem>();
  let totalPurchaseValue = 0;
  let availableCount = 0;
  let soldCount = 0;

  for (const v of vehicles) {
    vehiclesMap.set(v.id, v);
    const pPrice = parseFloat(String(v.purchase_price)) || 0;
    totalPurchaseValue += pPrice;
    if (v.status === "Sold") {
      soldCount++;
    } else {
      availableCount++;
    }
  }

  let totalSalesValue = 0;
  let purchaseValueOfVehiclesSold = 0;

  for (const s of sales) {
    const { revenue } = getSaleRevenue(s, invoices);
    totalSalesValue += revenue;

    const matchedVehicle = vehiclesMap.get(s.vehicle_id) || s.vehicle;
    const vPurchasePrice = parseFloat(String(matchedVehicle?.purchase_price || "0")) || 0;
    purchaseValueOfVehiclesSold += vPurchasePrice;
  }

  const totalProfit = totalSalesValue - purchaseValueOfVehiclesSold;
  const profitMarginPercent = totalSalesValue > 0 ? (totalProfit / totalSalesValue) * 100 : 0;

  return {
    totalPurchaseValue,
    totalSalesValue,
    totalProfit,
    vehiclesPurchased: vehicles.length,
    vehiclesSold: sales.length,
    totalVehicles: vehicles.length,
    soldVehicles: sales.length,
    availableVehicles: availableCount,
    totalVehicleValue: totalPurchaseValue,
    profitMarginPercent,
  };
}

/**
 * Section 7: Monthly Analytics Calculation
 * For selected Month (1-12) & Year (e.g. 2026):
 * - Monthly purchase value = Sum of purchase prices of vehicles acquired in the selected month.
 * - Monthly sales value = Sum of completed sale invoice totals (including additional items) sold in the selected month.
 * - Monthly profit = Monthly sales value minus purchase value of vehicles sold in that month.
 * - Vehicles purchased that month.
 * - Vehicles sold that month.
 */
export function calculateMonthlyAnalytics(
  vehicles: VehicleItem[],
  sales: SaleItem[],
  invoices: InvoiceItemRecord[],
  selectedYear: number,
  selectedMonth: number
): MonthlyAnalyticsResult {
  const vehiclesMap = new Map<string, VehicleItem>();
  for (const v of vehicles) {
    vehiclesMap.set(v.id, v);
  }

  // Vehicles acquired in selected month & year
  let monthlyPurchaseValue = 0;
  let vehiclesPurchased = 0;

  for (const v of vehicles) {
    const vDate = new Date(v.created_at);
    if (vDate.getFullYear() === selectedYear && vDate.getMonth() + 1 === selectedMonth) {
      monthlyPurchaseValue += parseFloat(String(v.purchase_price)) || 0;
      vehiclesPurchased++;
    }
  }

  // Sales in selected month & year
  let monthlySalesValue = 0;
  let purchaseValueOfVehiclesSoldInMonth = 0;
  let vehiclesSold = 0;
  const salesList: MonthlyAnalyticsResult["salesList"] = [];

  for (const s of sales) {
    const sDate = new Date(s.sale_date);
    if (sDate.getFullYear() === selectedYear && sDate.getMonth() + 1 === selectedMonth) {
      vehiclesSold++;
      const { revenue, invoice } = getSaleRevenue(s, invoices);
      monthlySalesValue += revenue;

      const matchedVehicle = vehiclesMap.get(s.vehicle_id) || s.vehicle;
      const vPurchasePrice = parseFloat(String(matchedVehicle?.purchase_price || "0")) || 0;
      const vSellingPrice = parseFloat(String(s.selling_price)) || 0;
      purchaseValueOfVehiclesSoldInMonth += vPurchasePrice;

      const profit = revenue - vPurchasePrice;

      salesList.push({
        id: s.id,
        vehicle_name: matchedVehicle?.vehicle_name || "Unknown Vehicle",
        registration_number: matchedVehicle?.registration_number || "-",
        buyer_name: s.buyer_name,
        sale_date: sDate.toISOString(),
        purchase_price: vPurchasePrice,
        selling_price: vSellingPrice,
        sales_value: revenue,
        profit,
        invoice_number: invoice?.invoice_number,
      });
    }
  }

  const monthlyProfit = monthlySalesValue - purchaseValueOfVehiclesSoldInMonth;
  const profitMarginPercent = monthlySalesValue > 0 ? (monthlyProfit / monthlySalesValue) * 100 : 0;

  return {
    selectedYear,
    selectedMonth,
    monthlyPurchaseValue,
    monthlySalesValue,
    monthlyProfit,
    vehiclesPurchased,
    vehiclesSold,
    profitMarginPercent,
    salesList,
  };
}

/**
 * Section 7: Yearly Comparison Chart Data (Jan to Dec for given year)
 * Compares Monthly Purchases, Sales Value, and Gross Profit across all 12 months.
 */
export function calculateYearlyComparison(
  vehicles: VehicleItem[],
  sales: SaleItem[],
  invoices: InvoiceItemRecord[],
  selectedYear: number
): MonthlyChartPoint[] {
  const result: MonthlyChartPoint[] = [];

  for (let month = 1; month <= 12; month++) {
    const monthlyStats = calculateMonthlyAnalytics(
      vehicles,
      sales,
      invoices,
      selectedYear,
      month
    );

    result.push({
      month: MONTH_SHORT_NAMES[month - 1],
      monthNumber: month,
      purchases: monthlyStats.monthlyPurchaseValue,
      sales: monthlyStats.monthlySalesValue,
      profit: monthlyStats.monthlyProfit,
      vehiclesPurchased: monthlyStats.vehiclesPurchased,
      vehiclesSold: monthlyStats.vehiclesSold,
    });
  }

  return result;
}

/**
 * Extract available years from dataset
 */
export function getAvailableYears(vehicles: VehicleItem[], sales: SaleItem[]): number[] {
  const yearSet = new Set<number>();
  yearSet.add(new Date().getFullYear());

  for (const v of vehicles) {
    const d = new Date(v.created_at);
    if (!isNaN(d.getFullYear())) yearSet.add(d.getFullYear());
  }

  for (const s of sales) {
    const d = new Date(s.sale_date);
    if (!isNaN(d.getFullYear())) yearSet.add(d.getFullYear());
  }

  return Array.from(yearSet).sort((a, b) => b - a);
}
