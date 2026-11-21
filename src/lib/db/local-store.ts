import fs from "fs";
import path from "path";
import crypto from "crypto";
import { initialDealershipData, DealershipData } from "./seed-data";
import {
  calculateLifetimeAnalytics,
  calculateMonthlyAnalytics,
  calculateYearlyComparison,
  getAvailableYears,
} from "../analytics";

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "dealership-store.json");

// In-memory cache fallback
let memoryStore: DealershipData = JSON.parse(JSON.stringify(initialDealershipData));

function loadStore(): DealershipData {
  try {
    if (typeof window !== "undefined") {
      return memoryStore;
    }
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, "utf-8");
      return JSON.parse(content);
    } else {
      saveStore(memoryStore);
      return memoryStore;
    }
  } catch (err) {
    console.warn("[LocalStore] Falling back to memory store:", err);
    return memoryStore;
  }
}

function saveStore(data: DealershipData): void {
  try {
    memoryStore = data;
    if (typeof window !== "undefined") return;
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.warn("[LocalStore] Could not write to disk, using memory store:", err);
  }
}

export const localStore = {
  resetToDefault() {
    const data = JSON.parse(JSON.stringify(initialDealershipData));
    saveStore(data);
    return data;
  },

  // Business Settings
  getBusinessSettings() {
    const store = loadStore();
    return store.business_settings;
  },

  updateBusinessSettings(data: Partial<DealershipData["business_settings"]>) {
    const store = loadStore();
    store.business_settings = { ...store.business_settings, ...data };
    saveStore(store);
    return store.business_settings;
  },

  // Vehicles
  getVehicles(filters?: { status?: string; search?: string }) {
    const store = loadStore();
    let result = [...store.vehicles];

    if (filters?.status && filters.status !== "all") {
      result = result.filter(
        (v) => v.status.toLowerCase() === filters.status?.toLowerCase()
      );
    }

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (v) =>
          v.vehicle_name.toLowerCase().includes(q) ||
          v.registration_number.toLowerCase().includes(q) ||
          v.owner_name.toLowerCase().includes(q)
      );
    }

    return result.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  },

  getVehicleById(id: string) {
    const store = loadStore();
    return store.vehicles.find((v) => v.id === id) || null;
  },

  getVehicleByRegistration(registrationNumber: string) {
    const store = loadStore();
    const clean = registrationNumber.trim().toUpperCase();
    return (
      store.vehicles.find(
        (v) => v.registration_number.trim().toUpperCase() === clean
      ) || null
    );
  },

  createVehicle(data: {
    vehicle_name: string;
    registration_number: string;
    owner_name: string;
    purchase_price: string | number;
    status?: "Available" | "Sold";
  }) {
    const store = loadStore();
    const cleanReg = (data.registration_number || "").trim().toUpperCase();

    if (!data.vehicle_name || !data.vehicle_name.trim()) {
      throw new Error("Vehicle name is required.");
    }
    if (!cleanReg) {
      throw new Error("Registration number is required.");
    }
    if (!data.owner_name || !data.owner_name.trim()) {
      throw new Error("Previous owner's name is required.");
    }

    const price = Number(data.purchase_price);
    if (isNaN(price) || price <= 0) {
      throw new Error("Purchase price must be a positive number.");
    }

    // Check duplicate registration case-insensitively and whitespace-trimmed
    const existing = store.vehicles.find(
      (v) => v.registration_number.trim().toUpperCase() === cleanReg
    );
    if (existing) {
      throw new Error(
        `A vehicle with registration number ${cleanReg} is already registered.`
      );
    }

    const now = new Date().toISOString();
    const newVehicle = {
      id: crypto.randomUUID(),
      vehicle_name: data.vehicle_name.trim(),
      registration_number: cleanReg,
      owner_name: data.owner_name.trim(),
      purchase_price: price.toFixed(2),
      status: (data.status as "Available" | "Sold") || "Available",
      created_at: now,
      updated_at: now,
    };
    store.vehicles.unshift(newVehicle);
    saveStore(store);
    return newVehicle;
  },

  updateVehicle(
    id: string,
    data: Partial<{
      vehicle_name: string;
      registration_number: string;
      owner_name: string;
      purchase_price: string | number;
      status: "Available" | "Sold";
    }>
  ) {
    const store = loadStore();
    const index = store.vehicles.findIndex((v) => v.id === id);
    if (index === -1) return null;

    const existing = store.vehicles[index];

    if (data.registration_number !== undefined) {
      const cleanReg = data.registration_number.trim().toUpperCase();
      const duplicate = store.vehicles.find(
        (v) => v.id !== id && v.registration_number.trim().toUpperCase() === cleanReg
      );
      if (duplicate) {
        throw new Error(
          `A vehicle with registration number ${cleanReg} is already registered.`
        );
      }
    }

    const updated = {
      ...existing,
      ...data,
      vehicle_name:
        data.vehicle_name !== undefined ? data.vehicle_name.trim() : existing.vehicle_name,
      owner_name:
        data.owner_name !== undefined ? data.owner_name.trim() : existing.owner_name,
      purchase_price:
        data.purchase_price !== undefined
          ? Number(data.purchase_price).toFixed(2)
          : existing.purchase_price,
      registration_number:
        data.registration_number !== undefined
          ? data.registration_number.trim().toUpperCase()
          : existing.registration_number,
      updated_at: new Date().toISOString(),
    };
    store.vehicles[index] = updated;
    saveStore(store);
    return updated;
  },

  deleteVehicle(id: string) {
    const store = loadStore();
    const index = store.vehicles.findIndex((v) => v.id === id);
    if (index === -1) return false;
    store.vehicles.splice(index, 1);
    // Cascade delete sales and invoices
    store.sales = store.sales.filter((s) => s.vehicle_id !== id);
    const invoiceIdsToDelete = store.invoices
      .filter((inv) => inv.vehicle_id === id)
      .map((inv) => inv.id);
    store.invoices = store.invoices.filter((inv) => inv.vehicle_id !== id);
    store.invoice_items = store.invoice_items.filter(
      (item) => !invoiceIdsToDelete.includes(item.invoice_id)
    );
    saveStore(store);
    return true;
  },

  // Sales
  getSales() {
    const store = loadStore();
    return store.sales
      .map((sale) => {
        const vehicle = store.vehicles.find((v) => v.id === sale.vehicle_id);
        const invoice = store.invoices.find((inv) => inv.sale_id === sale.id);
        const purchasePrice = parseFloat(vehicle?.purchase_price || "0") || 0;
        const sellingPrice = parseFloat(sale.selling_price) || 0;
        const profit = sellingPrice - purchasePrice;
        return {
          ...sale,
          vehicle,
          invoice,
          profit,
        };
      })
      .sort(
        (a, b) => new Date(b.sale_date).getTime() - new Date(a.sale_date).getTime()
      );
  },

  getSaleById(id: string) {
    const store = loadStore();
    const sale = store.sales.find((s) => s.id === id);
    if (!sale) return null;
    const vehicle = store.vehicles.find((v) => v.id === sale.vehicle_id);
    const invoice = store.invoices.find((inv) => inv.sale_id === sale.id);
    const purchasePrice = parseFloat(vehicle?.purchase_price || "0") || 0;
    const sellingPrice = parseFloat(sale.selling_price) || 0;
    const profit = sellingPrice - purchasePrice;
    return { ...sale, vehicle, invoice, profit };
  },

  createSale(data: {
    vehicle_id: string;
    buyer_name: string;
    selling_price: string | number;
    sale_date?: string;
  }) {
    const store = loadStore();
    const vehicle = store.vehicles.find((v) => v.id === data.vehicle_id);
    if (!vehicle) throw new Error("Vehicle not found");

    // Prevent selling the same vehicle twice
    if (
      vehicle.status === "Sold" ||
      store.sales.some((s) => s.vehicle_id === data.vehicle_id)
    ) {
      throw new Error("This vehicle has already been sold.");
    }

    if (!data.buyer_name || !data.buyer_name.trim()) {
      throw new Error("Buyer name is required.");
    }

    const priceNum = Number(data.selling_price);
    if (isNaN(priceNum) || priceNum <= 0) {
      throw new Error("Selling price must be a positive number.");
    }

    const now = new Date().toISOString();
    const purchaseNum = parseFloat(vehicle.purchase_price) || 0;
    const profit = priceNum - purchaseNum;

    const newSale = {
      id: crypto.randomUUID(),
      vehicle_id: data.vehicle_id,
      buyer_name: data.buyer_name.trim(),
      sale_date: data.sale_date || now,
      selling_price: priceNum.toFixed(2),
      created_at: now,
    };

    // Mark vehicle as Sold atomically
    vehicle.status = "Sold";
    vehicle.updated_at = now;

    store.sales.unshift(newSale);
    saveStore(store);
    return { ...newSale, vehicle, profit };
  },

  // Invoices
  getInvoices() {
    const store = loadStore();
    return store.invoices
      .map((inv) => {
        const vehicle = store.vehicles.find((v) => v.id === inv.vehicle_id);
        const sale = store.sales.find((s) => s.id === inv.sale_id);
        const items = store.invoice_items.filter((item) => item.invoice_id === inv.id);
        return {
          ...inv,
          vehicle,
          sale,
          items,
        };
      })
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
  },

  getInvoiceById(id: string) {
    const store = loadStore();
    const inv = store.invoices.find((i) => i.id === id);
    if (!inv) return null;
    const vehicle = store.vehicles.find((v) => v.id === inv.vehicle_id);
    const sale = store.sales.find((s) => s.id === inv.sale_id);
    const items = store.invoice_items.filter((item) => item.invoice_id === inv.id);
    return { ...inv, vehicle, sale, items, settings: store.business_settings };
  },

  getNextInvoiceNumber(): string {
    const store = loadStore();
    const prefix = store.business_settings?.invoice_prefix || "INV";
    const year = new Date().getFullYear();
    let maxNum = 0;
    for (const inv of store.invoices) {
      const match = inv.invoice_number.match(/(\d+)$/);
      if (match) {
        const val = parseInt(match[1], 10);
        if (val > maxNum) maxNum = val;
      }
    }
    const nextVal = maxNum > 0 ? maxNum + 1 : 1;
    let candidate = `${prefix}-${year}-${nextVal.toString().padStart(4, "0")}`;
    let counter = nextVal;
    while (store.invoices.some((i) => i.invoice_number.trim().toUpperCase() === candidate.trim().toUpperCase())) {
      counter++;
      candidate = `${prefix}-${year}-${counter.toString().padStart(4, "0")}`;
    }
    return candidate;
  },

  createInvoice(data: {
    vehicle_id: string;
    sale_id?: string | null;
    invoice_number?: string;
    invoice_date?: string;
    invoice_total: string | number;
    invoice_snapshot?: any;
    items?: Array<{ description: string; amount: string | number }>;
  }) {
    const store = loadStore();
    const now = new Date().toISOString();
    const invoiceId = crypto.randomUUID();
    const invoiceNumber = (data.invoice_number || this.getNextInvoiceNumber()).trim();

    // Enforce unique invoice number
    const existing = store.invoices.find(
      (i) => i.invoice_number.trim().toUpperCase() === invoiceNumber.toUpperCase()
    );
    if (existing) {
      throw new Error(`Invoice number "${invoiceNumber}" already exists.`);
    }

    const newInvoice = {
      id: invoiceId,
      invoice_number: invoiceNumber,
      vehicle_id: data.vehicle_id,
      sale_id: data.sale_id || null,
      invoice_date: data.invoice_date || now,
      invoice_total: Number(data.invoice_total).toFixed(2),
      invoice_snapshot: data.invoice_snapshot || null,
      created_at: now,
    };

    const newItems = (data.items || []).map((item) => ({
      id: crypto.randomUUID(),
      invoice_id: invoiceId,
      description: item.description,
      amount: Number(item.amount).toFixed(2),
    }));

    store.invoices.unshift(newInvoice);
    store.invoice_items.push(...newItems);
    saveStore(store);

    const vehicle = store.vehicles.find((v) => v.id === data.vehicle_id);
    const sale = data.sale_id ? store.sales.find((s) => s.id === data.sale_id) : null;

    return {
      ...newInvoice,
      vehicle,
      sale,
      items: newItems,
    };
  },

  // Analytics
  getAnalytics(year?: number, month?: number) {
    const store = loadStore();
    const currentYear = year || new Date().getFullYear();
    const currentMonth = month || new Date().getMonth() + 1;

    const lifetime = calculateLifetimeAnalytics(
      store.vehicles,
      store.sales,
      store.invoices
    );
    const monthly = calculateMonthlyAnalytics(
      store.vehicles,
      store.sales,
      store.invoices,
      currentYear,
      currentMonth
    );
    const yearlyComparison = calculateYearlyComparison(
      store.vehicles,
      store.sales,
      store.invoices,
      currentYear
    );
    const availableYears = getAvailableYears(store.vehicles, store.sales);

    return {
      lifetime,
      monthly,
      yearlyComparison,
      availableYears,
      currentYear,
      currentMonth,
      // Backwards-compatible fields for dashboard/legacy callers
      totalVehicles: lifetime.totalVehicles,
      availableVehicles: lifetime.availableVehicles,
      soldVehicles: lifetime.soldVehicles,
      totalRevenue: lifetime.totalSalesValue,
      totalInventoryValue: lifetime.totalPurchaseValue,
      totalProfit: lifetime.totalProfit,
      recentSales: this.getSales().slice(0, 5),
      monthlyData: yearlyComparison.map((y) => ({
        month: y.month,
        sales: y.vehiclesSold,
        revenue: y.sales,
      })),
    };
  },

  getAnalyticsOverview(year?: number, month?: number) {
    return this.getAnalytics(year, month);
  },
};
