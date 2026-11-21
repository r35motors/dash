import { drizzleDb, schema } from "./client";
import { localStore } from "./local-store";
import { eq, desc, and, or, like, sql } from "drizzle-orm";
import {
  calculateLifetimeAnalytics,
  calculateMonthlyAnalytics,
  calculateYearlyComparison,
  getAvailableYears,
} from "../analytics";

export * from "./schema";
export { drizzleDb } from "./client";

export const dealershipDb = {
  isPostgresConnected(): boolean {
    return !!drizzleDb;
  },

  vehicles: {
    async getAll(filters?: { status?: string; search?: string }) {
      if (!drizzleDb) {
        return localStore.getVehicles(filters);
      }
      try {
        let conditions = [];
        if (filters?.status && filters.status !== "all") {
          conditions.push(eq(schema.vehicles.status, filters.status));
        }
        if (filters?.search) {
          const q = `%${filters.search.trim()}%`;
          conditions.push(
            or(
              like(schema.vehicles.vehicle_name, q),
              like(schema.vehicles.registration_number, q),
              like(schema.vehicles.owner_name, q)
            )
          );
        }

        const query = drizzleDb.select().from(schema.vehicles);
        if (conditions.length > 0) {
          query.where(and(...conditions));
        }
        return await query.orderBy(desc(schema.vehicles.created_at));
      } catch (error) {
        console.warn("[DB] PostgreSQL query failed, using local store fallback:", error);
        return localStore.getVehicles(filters);
      }
    },

    async getById(id: string) {
      if (!drizzleDb) {
        return localStore.getVehicleById(id);
      }
      try {
        const rows = await drizzleDb
          .select()
          .from(schema.vehicles)
          .where(eq(schema.vehicles.id, id))
          .limit(1);
        return rows[0] || null;
      } catch (error) {
        console.warn("[DB] PostgreSQL query failed, using local store fallback:", error);
        return localStore.getVehicleById(id);
      }
    },

    async getByRegistration(registrationNumber: string) {
      const clean = (registrationNumber || "").trim().toUpperCase();
      if (!drizzleDb) {
        return localStore.getVehicleByRegistration(clean);
      }
      try {
        const rows = await drizzleDb
          .select()
          .from(schema.vehicles)
          .where(sql`upper(trim(${schema.vehicles.registration_number})) = ${clean}`)
          .limit(1);
        return rows[0] || null;
      } catch (error) {
        console.warn("[DB] PostgreSQL query failed, using local store fallback:", error);
        return localStore.getVehicleByRegistration(clean);
      }
    },

    async create(data: {
      vehicle_name: string;
      registration_number: string;
      owner_name: string;
      purchase_price: string | number;
      status?: "Available" | "Sold";
    }) {
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

      const priceNum = Number(data.purchase_price);
      if (isNaN(priceNum) || priceNum <= 0) {
        throw new Error("Purchase price must be a positive number.");
      }

      if (!drizzleDb) {
        return localStore.createVehicle({
          vehicle_name: data.vehicle_name.trim(),
          registration_number: cleanReg,
          owner_name: data.owner_name.trim(),
          purchase_price: priceNum,
          status: data.status || "Available",
        });
      }

      try {
        // Enforce unique registration number case-insensitively and trimmed
        const existing = await drizzleDb
          .select()
          .from(schema.vehicles)
          .where(sql`upper(trim(${schema.vehicles.registration_number})) = ${cleanReg}`)
          .limit(1);

        if (existing.length > 0) {
          throw new Error(
            `A vehicle with registration number ${cleanReg} is already registered.`
          );
        }

        const rows = await drizzleDb
          .insert(schema.vehicles)
          .values({
            vehicle_name: data.vehicle_name.trim(),
            registration_number: cleanReg,
            owner_name: data.owner_name.trim(),
            purchase_price: String(priceNum),
            status: data.status || "Available",
          })
          .returning();
        return rows[0];
      } catch (error: any) {
        if (error?.message?.includes("is already registered")) {
          throw error;
        }
        if (
          error?.code === "23505" ||
          error?.constraint?.includes("registration_number") ||
          error?.message?.includes("unique")
        ) {
          throw new Error(
            `A vehicle with registration number ${cleanReg} is already registered.`
          );
        }
        console.warn("[DB] PostgreSQL insert failed, using local store fallback:", error);
        return localStore.createVehicle({
          vehicle_name: data.vehicle_name.trim(),
          registration_number: cleanReg,
          owner_name: data.owner_name.trim(),
          purchase_price: priceNum,
          status: data.status || "Available",
        });
      }
    },

    async update(
      id: string,
      data: Partial<{
        vehicle_name: string;
        registration_number: string;
        owner_name: string;
        purchase_price: string | number;
        status: "Available" | "Sold";
      }>
    ) {
      if (!drizzleDb) {
        return localStore.updateVehicle(id, data);
      }
      try {
        const updateValues: Record<string, any> = {
          updated_at: new Date(),
        };
        if (data.vehicle_name !== undefined) updateValues.vehicle_name = data.vehicle_name;
        if (data.registration_number !== undefined)
          updateValues.registration_number = data.registration_number.toUpperCase().trim();
        if (data.owner_name !== undefined) updateValues.owner_name = data.owner_name;
        if (data.purchase_price !== undefined)
          updateValues.purchase_price = String(data.purchase_price);
        if (data.status !== undefined) updateValues.status = data.status;

        const rows = await drizzleDb
          .update(schema.vehicles)
          .set(updateValues)
          .where(eq(schema.vehicles.id, id))
          .returning();
        return rows[0] || null;
      } catch (error) {
        console.warn("[DB] PostgreSQL update failed, using local store fallback:", error);
        return localStore.updateVehicle(id, data);
      }
    },

    async delete(id: string) {
      if (!drizzleDb) {
        return localStore.deleteVehicle(id);
      }
      try {
        await drizzleDb.delete(schema.vehicles).where(eq(schema.vehicles.id, id));
        return true;
      } catch (error) {
        console.warn("[DB] PostgreSQL delete failed, using local store fallback:", error);
        return localStore.deleteVehicle(id);
      }
    },
  },

  sales: {
    async getAll() {
      if (!drizzleDb) {
        return localStore.getSales();
      }
      try {
        const rows = await drizzleDb
          .select({
            id: schema.sales.id,
            vehicle_id: schema.sales.vehicle_id,
            buyer_name: schema.sales.buyer_name,
            sale_date: schema.sales.sale_date,
            selling_price: schema.sales.selling_price,
            created_at: schema.sales.created_at,
            vehicle: schema.vehicles,
          })
          .from(schema.sales)
          .leftJoin(schema.vehicles, eq(schema.sales.vehicle_id, schema.vehicles.id))
          .orderBy(desc(schema.sales.sale_date));

        return rows.map((r) => {
          const purchase = parseFloat(r.vehicle?.purchase_price || "0") || 0;
          const selling = parseFloat(r.selling_price) || 0;
          return {
            id: r.id,
            vehicle_id: r.vehicle_id,
            buyer_name: r.buyer_name,
            sale_date: r.sale_date.toISOString(),
            selling_price: r.selling_price,
            created_at: r.created_at.toISOString(),
            vehicle: r.vehicle,
            profit: selling - purchase,
          };
        });
      } catch (error) {
        console.warn("[DB] PostgreSQL sales query failed, using local store fallback:", error);
        return localStore.getSales();
      }
    },

    async getById(id: string) {
      if (!drizzleDb) {
        return localStore.getSaleById(id);
      }
      try {
        const rows = await drizzleDb
          .select({
            id: schema.sales.id,
            vehicle_id: schema.sales.vehicle_id,
            buyer_name: schema.sales.buyer_name,
            sale_date: schema.sales.sale_date,
            selling_price: schema.sales.selling_price,
            created_at: schema.sales.created_at,
            vehicle: schema.vehicles,
          })
          .from(schema.sales)
          .leftJoin(schema.vehicles, eq(schema.sales.vehicle_id, schema.vehicles.id))
          .where(eq(schema.sales.id, id))
          .limit(1);

        if (!rows[0]) return null;
        const r = rows[0];
        const purchase = parseFloat(r.vehicle?.purchase_price || "0") || 0;
        const selling = parseFloat(r.selling_price) || 0;
        return {
          id: r.id,
          vehicle_id: r.vehicle_id,
          buyer_name: r.buyer_name,
          sale_date: r.sale_date.toISOString(),
          selling_price: r.selling_price,
          created_at: r.created_at.toISOString(),
          vehicle: r.vehicle,
          profit: selling - purchase,
        };
      } catch (error) {
        console.warn("[DB] PostgreSQL sale by id failed, using local store fallback:", error);
        return localStore.getSaleById(id);
      }
    },

    async create(data: {
      vehicle_id: string;
      buyer_name: string;
      selling_price: string | number;
      sale_date?: string;
    }) {
      if (!data.vehicle_id) {
        throw new Error("Vehicle ID is required.");
      }
      if (!data.buyer_name || !data.buyer_name.trim()) {
        throw new Error("Buyer name is required.");
      }
      const priceNum = Number(data.selling_price);
      if (isNaN(priceNum) || priceNum <= 0) {
        throw new Error("Selling price must be a positive number.");
      }

      if (!drizzleDb) {
        return localStore.createSale(data);
      }

      try {
        // First check vehicle status and existing sales in PostgreSQL
        const vehicleRows = await drizzleDb
          .select()
          .from(schema.vehicles)
          .where(eq(schema.vehicles.id, data.vehicle_id))
          .limit(1);

        if (!vehicleRows[0]) {
          throw new Error("Vehicle not found");
        }

        const vehicle = vehicleRows[0];
        if (vehicle.status === "Sold") {
          throw new Error("This vehicle has already been sold.");
        }

        const existingSale = await drizzleDb
          .select()
          .from(schema.sales)
          .where(eq(schema.sales.vehicle_id, data.vehicle_id))
          .limit(1);

        if (existingSale.length > 0) {
          throw new Error("This vehicle has already been sold.");
        }

        // Perform transaction
        const result = await drizzleDb.transaction(async (tx) => {
          const saleRows = await tx
            .insert(schema.sales)
            .values({
              vehicle_id: data.vehicle_id,
              buyer_name: data.buyer_name.trim(),
              selling_price: String(priceNum),
              sale_date: data.sale_date ? new Date(data.sale_date) : new Date(),
            })
            .returning();

          await tx
            .update(schema.vehicles)
            .set({ status: "Sold", updated_at: new Date() })
            .where(eq(schema.vehicles.id, data.vehicle_id));

          return saleRows[0];
        });

        const purchasePrice = parseFloat(vehicle.purchase_price) || 0;
        const profit = priceNum - purchasePrice;

        return {
          ...result,
          vehicle: {
            ...vehicle,
            status: "Sold",
          },
          profit,
        };
      } catch (error: any) {
        if (
          error?.message === "This vehicle has already been sold." ||
          error?.message === "Vehicle not found"
        ) {
          throw error;
        }
        if (
          error?.code === "23505" ||
          error?.constraint?.includes("vehicle_id") ||
          error?.message?.includes("sales_vehicle_id_unique")
        ) {
          throw new Error("This vehicle has already been sold.");
        }
        console.warn("[DB] PostgreSQL create sale failed, using local store fallback:", error);
        return localStore.createSale(data);
      }
    },
  },

  invoices: {
    async getAll() {
      if (!drizzleDb) {
        return localStore.getInvoices();
      }
      try {
        const rows = await drizzleDb
          .select({
            id: schema.invoices.id,
            invoice_number: schema.invoices.invoice_number,
            vehicle_id: schema.invoices.vehicle_id,
            sale_id: schema.invoices.sale_id,
            invoice_date: schema.invoices.invoice_date,
            invoice_total: schema.invoices.invoice_total,
            invoice_snapshot: schema.invoices.invoice_snapshot,
            created_at: schema.invoices.created_at,
            vehicle: schema.vehicles,
          })
          .from(schema.invoices)
          .leftJoin(schema.vehicles, eq(schema.invoices.vehicle_id, schema.vehicles.id))
          .orderBy(desc(schema.invoices.created_at));

        return rows.map((r) => ({
          id: r.id,
          invoice_number: r.invoice_number,
          vehicle_id: r.vehicle_id,
          sale_id: r.sale_id,
          invoice_date: r.invoice_date.toISOString(),
          invoice_total: r.invoice_total,
          invoice_snapshot: r.invoice_snapshot,
          created_at: r.created_at.toISOString(),
          vehicle: r.vehicle,
        }));
      } catch (error) {
        console.warn("[DB] PostgreSQL invoices query failed, using local store fallback:", error);
        return localStore.getInvoices();
      }
    },

    async getById(id: string) {
      if (!drizzleDb) {
        return localStore.getInvoiceById(id);
      }
      try {
        const invoiceRows = await drizzleDb
          .select({
            id: schema.invoices.id,
            invoice_number: schema.invoices.invoice_number,
            vehicle_id: schema.invoices.vehicle_id,
            sale_id: schema.invoices.sale_id,
            invoice_date: schema.invoices.invoice_date,
            invoice_total: schema.invoices.invoice_total,
            invoice_snapshot: schema.invoices.invoice_snapshot,
            created_at: schema.invoices.created_at,
            vehicle: schema.vehicles,
          })
          .from(schema.invoices)
          .leftJoin(schema.vehicles, eq(schema.invoices.vehicle_id, schema.vehicles.id))
          .where(eq(schema.invoices.id, id))
          .limit(1);

        if (!invoiceRows[0]) return null;

        const items = await drizzleDb
          .select()
          .from(schema.invoiceItems)
          .where(eq(schema.invoiceItems.invoice_id, id));

        const settingsRows = await drizzleDb
          .select()
          .from(schema.businessSettings)
          .limit(1);

        const r = invoiceRows[0];
        return {
          id: r.id,
          invoice_number: r.invoice_number,
          vehicle_id: r.vehicle_id,
          sale_id: r.sale_id,
          invoice_date: r.invoice_date.toISOString(),
          invoice_total: r.invoice_total,
          invoice_snapshot: r.invoice_snapshot,
          created_at: r.created_at.toISOString(),
          vehicle: r.vehicle,
          items,
          settings: settingsRows[0] || null,
        };
      } catch (error) {
        console.warn("[DB] PostgreSQL invoice by id failed, using local store fallback:", error);
        return localStore.getInvoiceById(id);
      }
    },

    async getNextNumber(): Promise<string> {
      if (!drizzleDb) {
        return localStore.getNextInvoiceNumber();
      }
      try {
        const settings = await drizzleDb.select().from(schema.businessSettings).limit(1);
        const prefix = settings[0]?.invoice_prefix || "INV";
        const year = new Date().getFullYear();
        const allInvoices = await drizzleDb
          .select({ invoice_number: schema.invoices.invoice_number })
          .from(schema.invoices);

        let maxNum = 0;
        for (const inv of allInvoices) {
          const match = inv.invoice_number.match(/(\d+)$/);
          if (match) {
            const val = parseInt(match[1], 10);
            if (val > maxNum) maxNum = val;
          }
        }
        const nextVal = maxNum > 0 ? maxNum + 1 : 1;
        let candidate = `${prefix}-${year}-${nextVal.toString().padStart(4, "0")}`;
        let counter = nextVal;
        while (
          allInvoices.some(
            (i) => i.invoice_number.trim().toUpperCase() === candidate.trim().toUpperCase()
          )
        ) {
          counter++;
          candidate = `${prefix}-${year}-${counter.toString().padStart(4, "0")}`;
        }
        return candidate;
      } catch (err) {
        return localStore.getNextInvoiceNumber();
      }
    },

    async create(data: {
      vehicle_id: string;
      sale_id?: string | null;
      invoice_number?: string;
      invoice_date?: string;
      invoice_total: string | number;
      invoice_snapshot?: any;
      items?: Array<{ description: string; amount: string | number }>;
    }) {
      const invoiceNumber = (
        data.invoice_number || (await this.getNextNumber())
      ).trim();

      if (!drizzleDb) {
        return localStore.createInvoice({ ...data, invoice_number: invoiceNumber });
      }
      try {
        // Enforce unique invoice number check
        const existing = await drizzleDb
          .select()
          .from(schema.invoices)
          .where(
            sql`upper(trim(${schema.invoices.invoice_number})) = ${invoiceNumber.toUpperCase()}`
          )
          .limit(1);

        if (existing.length > 0) {
          throw new Error(`Invoice number "${invoiceNumber}" already exists.`);
        }

        const invoiceRows = await drizzleDb
          .insert(schema.invoices)
          .values({
            invoice_number: invoiceNumber,
            vehicle_id: data.vehicle_id,
            sale_id: data.sale_id || null,
            invoice_date: data.invoice_date ? new Date(data.invoice_date) : new Date(),
            invoice_total: String(data.invoice_total),
            invoice_snapshot: data.invoice_snapshot,
          })
          .returning();

        const createdInvoice = invoiceRows[0];
        let createdItems: any[] = [];

        if (data.items && data.items.length > 0) {
          createdItems = await drizzleDb
            .insert(schema.invoiceItems)
            .values(
              data.items.map((item) => ({
                invoice_id: createdInvoice.id,
                description: item.description,
                amount: String(item.amount),
              }))
            )
            .returning();
        }

        return {
          ...createdInvoice,
          items: createdItems,
        };
      } catch (error: any) {
        if (
          error?.message?.includes("already exists") ||
          error?.code === "23505" ||
          error?.constraint?.includes("invoice_number")
        ) {
          throw new Error(`Invoice number "${invoiceNumber}" already exists.`);
        }
        console.warn("[DB] PostgreSQL create invoice failed, using local store fallback:", error);
        return localStore.createInvoice({ ...data, invoice_number: invoiceNumber });
      }
    },
  },

  settings: {
    async get() {
      if (!drizzleDb) {
        return localStore.getBusinessSettings();
      }
      try {
        const rows = await drizzleDb.select().from(schema.businessSettings).limit(1);
        if (rows[0]) return rows[0];
        return localStore.getBusinessSettings();
      } catch (error) {
        console.warn("[DB] PostgreSQL get settings failed, using local store fallback:", error);
        return localStore.getBusinessSettings();
      }
    },

    async update(data: {
      business_name?: string;
      logo_path?: string | null;
      address?: string;
      contact_number_1?: string;
      contact_number_2?: string | null;
      invoice_prefix?: string;
    }) {
      if (!drizzleDb) {
        return localStore.updateBusinessSettings(data);
      }
      try {
        const rows = await drizzleDb.select().from(schema.businessSettings).limit(1);
        if (rows[0]) {
          const updated = await drizzleDb
            .update(schema.businessSettings)
            .set(data)
            .where(eq(schema.businessSettings.id, rows[0].id))
            .returning();
          return updated[0];
        } else {
          const inserted = await drizzleDb
            .insert(schema.businessSettings)
            .values({
              business_name: data.business_name || "Royal Motors Dealership",
              logo_path: data.logo_path || null,
              address: data.address || "Dealership Address",
              contact_number_1: data.contact_number_1 || "+91 00000 00000",
              contact_number_2: data.contact_number_2 || null,
              invoice_prefix: data.invoice_prefix || "INV",
            })
            .returning();
          return inserted[0];
        }
      } catch (error) {
        console.warn("[DB] PostgreSQL update settings failed, using local store fallback:", error);
        return localStore.updateBusinessSettings(data);
      }
    },
  },

  analytics: {
    async getOverview(year?: number, month?: number) {
      if (!drizzleDb) {
        return localStore.getAnalyticsOverview(year, month);
      }
      try {
        const [vehicles, sales, invoices] = await Promise.all([
          dealershipDb.vehicles.getAll(),
          dealershipDb.sales.getAll(),
          dealershipDb.invoices.getAll(),
        ]);
        const currentYear = year || new Date().getFullYear();
        const currentMonth = month || new Date().getMonth() + 1;

        const lifetime = calculateLifetimeAnalytics(
          vehicles as any,
          sales as any,
          invoices as any
        );
        const monthly = calculateMonthlyAnalytics(
          vehicles as any,
          sales as any,
          invoices as any,
          currentYear,
          currentMonth
        );
        const yearlyComparison = calculateYearlyComparison(
          vehicles as any,
          sales as any,
          invoices as any,
          currentYear
        );
        const availableYears = getAvailableYears(vehicles as any, sales as any);

        return {
          lifetime,
          monthly,
          yearlyComparison,
          availableYears,
          currentYear,
          currentMonth,
          totalVehicles: lifetime.totalVehicles,
          availableVehicles: lifetime.availableVehicles,
          soldVehicles: lifetime.soldVehicles,
          totalRevenue: lifetime.totalSalesValue,
          totalInventoryValue: lifetime.totalPurchaseValue,
          totalProfit: lifetime.totalProfit,
          recentSales: sales.slice(0, 5),
          monthlyData: yearlyComparison.map((y) => ({
            month: y.month,
            sales: y.vehiclesSold,
            revenue: y.sales,
          })),
        };
      } catch (error) {
        console.warn("[DB] PostgreSQL analytics failed, fallback to localStore:", error);
        return localStore.getAnalyticsOverview(year, month);
      }
    },

    async getLifetime() {
      const data = await this.getOverview();
      return data.lifetime;
    },

    async getMonthly(year: number, month: number) {
      const data = await this.getOverview(year, month);
      return data.monthly;
    },

    async getYearlyComparison(year: number) {
      const data = await this.getOverview(year);
      return data.yearlyComparison;
    },
  },
};

export const db = dealershipDb;
export default dealershipDb;
