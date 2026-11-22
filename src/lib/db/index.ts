import { getDb, schema, drizzleDb } from "./client";
import { dbCache } from "./cache";
import { eq, desc, and, or, like, sql } from "drizzle-orm";
import {
  calculateLifetimeAnalytics,
  calculateMonthlyAnalytics,
  calculateYearlyComparison,
  getAvailableYears,
} from "../analytics";

export * from "./schema";
export { getDb, drizzleDb } from "./client";

function isValidUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

export const dealershipDb = {
  isPostgresConnected(): boolean {
    return !!process.env.DATABASE_URL;
  },

  vehicles: {
    async getAll(filters?: { status?: string; search?: string }) {
      const cacheKey = `vehicles_${filters?.status || "all"}_${filters?.search || ""}`;
      return dbCache.getOrSet(
        cacheKey,
        async () => {
          try {
            const db = getDb();
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

            const query = db.select().from(schema.vehicles);
            if (conditions.length > 0) {
              query.where(and(...conditions));
            }
            return await query.orderBy(desc(schema.vehicles.created_at));
          } catch (err) {
            console.warn("[DB] Failed to fetch vehicles during query/build:", err);
            return [];
          }
        },
        15
      );
    },

    async getById(id: string) {
      if (!isValidUuid(id)) return null;
      const db = getDb();
      const rows = await db
        .select()
        .from(schema.vehicles)
        .where(eq(schema.vehicles.id, id))
        .limit(1);
      return rows[0] || null;
    },

    async getByRegistration(registrationNumber: string) {
      const db = getDb();
      const clean = (registrationNumber || "").trim().toUpperCase();
      const rows = await db
        .select()
        .from(schema.vehicles)
        .where(sql`upper(trim(${schema.vehicles.registration_number})) = ${clean}`)
        .limit(1);
      return rows[0] || null;
    },

    async create(data: {
      vehicle_name: string;
      registration_number: string;
      owner_name: string;
      purchase_price: string | number;
      status?: "Available" | "Sold";
    }) {
      const db = getDb();
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

      // Enforce unique registration number case-insensitively and trimmed
      const existing = await db
        .select()
        .from(schema.vehicles)
        .where(sql`upper(trim(${schema.vehicles.registration_number})) = ${cleanReg}`)
        .limit(1);

      if (existing.length > 0) {
        throw new Error(
          `A vehicle with registration number ${cleanReg} is already registered.`
        );
      }

      try {
        const rows = await db
          .insert(schema.vehicles)
          .values({
            vehicle_name: data.vehicle_name.trim(),
            registration_number: cleanReg,
            owner_name: data.owner_name.trim(),
            purchase_price: String(priceNum),
            status: data.status || "Available",
          })
          .returning();
        dbCache.invalidate("vehicles");
        dbCache.invalidate("analytics");
        return rows[0];
      } catch (error: any) {
        if (
          error?.code === "23505" ||
          error?.constraint?.includes("registration_number") ||
          error?.message?.includes("unique")
        ) {
          throw new Error(
            `A vehicle with registration number ${cleanReg} is already registered.`
          );
        }
        throw error;
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
      const db = getDb();
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

      const rows = await db
        .update(schema.vehicles)
        .set(updateValues)
        .where(eq(schema.vehicles.id, id))
        .returning();
      dbCache.invalidate("vehicles");
      dbCache.invalidate("analytics");
      return rows[0] || null;
    },

    async delete(id: string) {
      const db = getDb();
      await db.delete(schema.vehicles).where(eq(schema.vehicles.id, id));
      dbCache.invalidate("vehicles");
      dbCache.invalidate("analytics");
      return true;
    },
  },

  sales: {
    async getAll() {
      return dbCache.getOrSet(
        "sales_all",
        async () => {
          try {
            const db = getDb();
            const rows = await db
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
              const saleDate = r.sale_date instanceof Date && !isNaN(r.sale_date.getTime())
                ? r.sale_date.toISOString()
                : new Date().toISOString();
              const createdAt = r.created_at instanceof Date && !isNaN(r.created_at.getTime())
                ? r.created_at.toISOString()
                : new Date().toISOString();
              return {
                id: r.id,
                vehicle_id: r.vehicle_id,
                buyer_name: r.buyer_name,
                sale_date: saleDate,
                selling_price: r.selling_price,
                created_at: createdAt,
                vehicle: r.vehicle,
                profit: selling - purchase,
              };
            });
          } catch (err) {
            console.warn("[DB] Failed to fetch sales during query/build:", err);
            return [];
          }
        },
        15
      );
    },

    async getById(id: string) {
      if (!isValidUuid(id)) return null;
      const db = getDb();
      const rows = await db
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
    },

    async create(data: {
      vehicle_id: string;
      buyer_name: string;
      selling_price: string | number;
      sale_date?: string;
    }) {
      const db = getDb();
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

      if (!isValidUuid(data.vehicle_id)) {
        throw new Error("Vehicle not found");
      }

      // Check vehicle status and existing sales in Supabase
      const vehicleRows = await db
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

      const existingSale = await db
        .select()
        .from(schema.sales)
        .where(eq(schema.sales.vehicle_id, data.vehicle_id))
        .limit(1);

      if (existingSale.length > 0) {
        throw new Error("This vehicle has already been sold.");
      }

      try {
        const result = await db.transaction(async (tx) => {
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

        dbCache.invalidate("sales");
        dbCache.invalidate("vehicles");
        dbCache.invalidate("analytics");

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
          error?.code === "23505" ||
          error?.constraint?.includes("vehicle_id") ||
          error?.message?.includes("sales_vehicle_id_unique")
        ) {
          throw new Error("This vehicle has already been sold.");
        }
        throw error;
      }
    },

    async delete(id: string) {
      if (!isValidUuid(id)) return false;
      const db = getDb();
      await db.delete(schema.sales).where(eq(schema.sales.id, id));
      dbCache.invalidate("sales");
      dbCache.invalidate("vehicles");
      dbCache.invalidate("analytics");
      return true;
    },
  },

  invoices: {
    async getAll() {
      return dbCache.getOrSet(
        "invoices_all",
        async () => {
          try {
            const db = getDb();
            const rows = await db
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
              invoice_date: r.invoice_date instanceof Date && !isNaN(r.invoice_date.getTime())
                ? r.invoice_date.toISOString()
                : new Date().toISOString(),
              invoice_total: r.invoice_total,
              invoice_snapshot: r.invoice_snapshot,
              created_at: r.created_at instanceof Date && !isNaN(r.created_at.getTime())
                ? r.created_at.toISOString()
                : new Date().toISOString(),
              vehicle: r.vehicle,
            }));
          } catch (err) {
            console.warn("[DB] Failed to fetch invoices during query/build:", err);
            return [];
          }
        },
        15
      );
    },

    async getById(id: string) {
      if (!isValidUuid(id)) return null;
      const db = getDb();
      const invoiceRows = await db
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

      const items = await db
        .select()
        .from(schema.invoiceItems)
        .where(eq(schema.invoiceItems.invoice_id, id));

      const settingsRows = await db
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
    },

    async getNextNumber(): Promise<string> {
      const db = getDb();
      const settings = await db.select().from(schema.businessSettings).limit(1);
      const prefix = settings[0]?.invoice_prefix || "R35";
      const year = new Date().getFullYear();
      const allInvoices = await db
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
      const db = getDb();
      const invoiceNumber = (
        data.invoice_number || (await this.getNextNumber())
      ).trim();

      // Enforce unique invoice number check
      const existing = await db
        .select()
        .from(schema.invoices)
        .where(
          sql`upper(trim(${schema.invoices.invoice_number})) = ${invoiceNumber.toUpperCase()}`
        )
        .limit(1);

      if (existing.length > 0) {
        throw new Error(`Invoice number "${invoiceNumber}" already exists.`);
      }

      try {
        const invoiceRows = await db
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
          createdItems = await db
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

        dbCache.invalidate("invoices");
        dbCache.invalidate("analytics");

        return {
          ...createdInvoice,
          items: createdItems,
        };
      } catch (error: any) {
        if (
          error?.code === "23505" ||
          error?.constraint?.includes("invoice_number") ||
          error?.message?.includes("already exists")
        ) {
          throw new Error(`Invoice number "${invoiceNumber}" already exists.`);
        }
        throw error;
      }
    },

    async delete(id: string) {
      if (!isValidUuid(id)) return false;
      const db = getDb();
      await db.delete(schema.invoiceItems).where(eq(schema.invoiceItems.invoice_id, id));
      await db.delete(schema.invoices).where(eq(schema.invoices.id, id));
      dbCache.invalidate("invoices");
      dbCache.invalidate("analytics");
      return true;
    },
  },

  settings: {
    async get() {
      return dbCache.getOrSet(
        "settings_data",
        async () => {
          try {
            const db = getDb();
            const rows = await db.select().from(schema.businessSettings).limit(1);
            if (rows[0]) return rows[0];

            // Insert default if empty
            const inserted = await db
              .insert(schema.businessSettings)
              .values({
                business_name: "R35 MOTORS",
                logo_path: "/dealership-logo.png",
                address: "Plot 42, Highline Auto Corridor, MG Road, Bangalore 560001",
                contact_number_1: "+91 98765 43210",
                contact_number_2: "+91 98765 43211",
                invoice_prefix: "R35",
              })
              .returning();
            return inserted[0];
          } catch (err) {
            console.warn("[DB] Could not fetch settings from DB (using defaults):", err);
            return {
              id: "00000000-0000-0000-0000-000000000001",
              business_name: "R35 MOTORS",
              logo_path: "/dealership-logo.png",
              address: "Plot 42, Highline Auto Corridor, MG Road, Bangalore 560001",
              contact_number_1: "+91 98765 43210",
              contact_number_2: "+91 98765 43211",
              invoice_prefix: "R35",
            };
          }
        },
        60
      );
    },

    async update(data: {
      business_name?: string;
      logo_path?: string | null;
      address?: string;
      contact_number_1?: string;
      contact_number_2?: string | null;
      invoice_prefix?: string;
    }) {
      const db = getDb();
      const rows = await db.select().from(schema.businessSettings).limit(1);
      let res;
      if (rows[0]) {
        const updated = await db
          .update(schema.businessSettings)
          .set(data)
          .where(eq(schema.businessSettings.id, rows[0].id))
          .returning();
        res = updated[0];
      } else {
        const inserted = await db
          .insert(schema.businessSettings)
          .values({
            business_name: data.business_name || "R35 MOTORS",
            logo_path: data.logo_path || null,
            address: data.address || "Dealership Address",
            contact_number_1: data.contact_number_1 || "+91 00000 00000",
            contact_number_2: data.contact_number_2 || null,
            invoice_prefix: data.invoice_prefix || "R35",
          })
          .returning();
        res = inserted[0];
      }
      dbCache.invalidate("settings");
      return res;
    },
  },

  analytics: {
    async getOverview(year?: number, month?: number) {
      const cacheKey = `analytics_${year || "cur"}_${month || "cur"}`;
      return dbCache.getOrSet(
        cacheKey,
        async () => {
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
        },
        15
      );
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
