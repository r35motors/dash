import { pgTable, text, numeric, timestamp, uuid, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// 1. Vehicles table
export const vehicles = pgTable("vehicles", {
  id: uuid("id").defaultRandom().primaryKey(),
  vehicle_name: text("vehicle_name").notNull(),
  registration_number: text("registration_number").notNull().unique(),
  owner_name: text("owner_name").notNull(),
  purchase_price: numeric("purchase_price", { precision: 12, scale: 2 }).notNull(),
  status: text("status").notNull().default("Available"), // 'Available' | 'Sold'
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// 2. Sales table
export const sales = pgTable("sales", {
  id: uuid("id").defaultRandom().primaryKey(),
  vehicle_id: uuid("vehicle_id")
    .references(() => vehicles.id, { onDelete: "cascade" })
    .notNull()
    .unique(),
  buyer_name: text("buyer_name").notNull(),
  sale_date: timestamp("sale_date", { withTimezone: true }).defaultNow().notNull(),
  selling_price: numeric("selling_price", { precision: 12, scale: 2 }).notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 3. Invoices table
export const invoices = pgTable("invoices", {
  id: uuid("id").defaultRandom().primaryKey(),
  invoice_number: text("invoice_number").notNull().unique(),
  vehicle_id: uuid("vehicle_id")
    .references(() => vehicles.id, { onDelete: "cascade" })
    .notNull(),
  sale_id: uuid("sale_id").references(() => sales.id, { onDelete: "set null" }),
  invoice_date: timestamp("invoice_date", { withTimezone: true }).defaultNow().notNull(),
  invoice_total: numeric("invoice_total", { precision: 12, scale: 2 }).notNull(),
  invoice_snapshot: jsonb("invoice_snapshot"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 4. Invoice Items table
export const invoiceItems = pgTable("invoice_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  invoice_id: uuid("invoice_id")
    .references(() => invoices.id, { onDelete: "cascade" })
    .notNull(),
  description: text("description").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
});

// 5. Business Settings table
export const businessSettings = pgTable("business_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  business_name: text("business_name").notNull(),
  logo_path: text("logo_path"),
  address: text("address").notNull(),
  contact_number_1: text("contact_number_1").notNull(),
  contact_number_2: text("contact_number_2"),
  invoice_prefix: text("invoice_prefix").notNull().default("INV"),
});

// Relations
export const vehiclesRelations = relations(vehicles, ({ one, many }) => ({
  sale: one(sales, {
    fields: [vehicles.id],
    references: [sales.vehicle_id],
  }),
  invoices: many(invoices),
}));

export const salesRelations = relations(sales, ({ one }) => ({
  vehicle: one(vehicles, {
    fields: [sales.vehicle_id],
    references: [vehicles.id],
  }),
  invoice: one(invoices, {
    fields: [sales.id],
    references: [invoices.sale_id],
  }),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  vehicle: one(vehicles, {
    fields: [invoices.vehicle_id],
    references: [vehicles.id],
  }),
  sale: one(sales, {
    fields: [invoices.sale_id],
    references: [sales.id],
  }),
  items: many(invoiceItems),
}));

export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceItems.invoice_id],
    references: [invoices.id],
  }),
}));

// Types
export type Vehicle = typeof vehicles.$inferSelect;
export type NewVehicle = typeof vehicles.$inferInsert;

export type Sale = typeof sales.$inferSelect;
export type NewSale = typeof sales.$inferInsert;

export type Invoice = typeof invoices.$inferSelect;
export type NewInvoice = typeof invoices.$inferInsert;

export type InvoiceItem = typeof invoiceItems.$inferSelect;
export type NewInvoiceItem = typeof invoiceItems.$inferInsert;

export type BusinessSettings = typeof businessSettings.$inferSelect;
export type NewBusinessSettings = typeof businessSettings.$inferInsert;
