-- ==============================================================================
-- CAR DEALERSHIP MANAGEMENT SYSTEM - DATABASE SCHEMA
-- Compatible with Supabase PostgreSQL & Drizzle ORM
-- ==============================================================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing tables in reverse dependency order if executing a full reset
-- DROP TABLE IF EXISTS invoice_items CASCADE;
-- DROP TABLE IF EXISTS invoices CASCADE;
-- DROP TABLE IF EXISTS sales CASCADE;
-- DROP TABLE IF EXISTS vehicles CASCADE;
-- DROP TABLE IF EXISTS business_settings CASCADE;

-- 1. VEHICLES TABLE
CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_name TEXT NOT NULL,
    registration_number TEXT NOT NULL UNIQUE,
    owner_name TEXT NOT NULL,
    purchase_price NUMERIC(12, 2) NOT NULL CHECK (purchase_price >= 0),
    status TEXT NOT NULL DEFAULT 'Available' CHECK (status IN ('Available', 'Sold')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast lookup and filtering
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_registration ON vehicles(registration_number);

-- 2. SALES TABLE
CREATE TABLE IF NOT EXISTS sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL UNIQUE REFERENCES vehicles(id) ON DELETE CASCADE,
    buyer_name TEXT NOT NULL,
    sale_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    selling_price NUMERIC(12, 2) NOT NULL CHECK (selling_price >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for sale date filtering and reporting
CREATE INDEX IF NOT EXISTS idx_sales_sale_date ON sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_sales_vehicle_id ON sales(vehicle_id);

-- 3. INVOICES TABLE
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number TEXT NOT NULL UNIQUE,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    sale_id UUID REFERENCES sales(id) ON DELETE SET NULL,
    invoice_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    invoice_total NUMERIC(12, 2) NOT NULL CHECK (invoice_total >= 0),
    invoice_snapshot JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_vehicle_id ON invoices(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_invoices_sale_id ON invoices(sale_id);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at);

-- 4. INVOICE ITEMS TABLE
CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0)
);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);

-- 5. BUSINESS SETTINGS TABLE
CREATE TABLE IF NOT EXISTS business_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_name TEXT NOT NULL,
    logo_path TEXT,
    address TEXT NOT NULL,
    contact_number_1 TEXT NOT NULL,
    contact_number_2 TEXT,
    invoice_prefix TEXT NOT NULL DEFAULT 'INV'
);

-- Function to automatically update updated_at timestamp on vehicles
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trigger_vehicles_updated_at ON vehicles;
CREATE TRIGGER trigger_vehicles_updated_at
    BEFORE UPDATE ON vehicles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- SEED DATA (Sample Dealership Data)
INSERT INTO business_settings (id, business_name, logo_path, address, contact_number_1, contact_number_2, invoice_prefix)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'Royal Motors Luxury Pre-Owned Dealership',
    '/dealership-logo.png',
    'Plot 42, Highline Auto Corridor, MG Road, Bangalore 560001',
    '+91 98765 43210',
    '+91 98765 43211',
    'ROYAL'
) ON CONFLICT DO NOTHING;

-- Insert 5 realistic sample vehicles
INSERT INTO vehicles (id, vehicle_name, registration_number, owner_name, purchase_price, status, created_at, updated_at)
VALUES 
(
    'b0000000-0000-0000-0000-000000000001',
    '2022 BMW 3 Series 330i M Sport',
    'KA-01-MJ-5501',
    'Vikramaditya Rao',
    3850000.00,
    'Available',
    NOW() - INTERVAL '20 days',
    NOW() - INTERVAL '20 days'
),
(
    'b0000000-0000-0000-0000-000000000002',
    '2021 Mercedes-Benz C-Class C200 Progressive',
    'MH-02-CB-1290',
    'Ananya Sen',
    3400000.00,
    'Available',
    NOW() - INTERVAL '15 days',
    NOW() - INTERVAL '15 days'
),
(
    'b0000000-0000-0000-0000-000000000003',
    '2023 Audi Q5 45 TFSI Technology',
    'DL-04-AQ-8844',
    'Rajesh Mehra',
    4950000.00,
    'Available',
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '10 days'
),
(
    'b0000000-0000-0000-0000-000000000004',
    '2021 Toyota Fortuner 2.8 4x4 AT',
    'KA-05-TF-9900',
    'Suresh Kulkarni',
    2900000.00,
    'Sold',
    NOW() - INTERVAL '35 days',
    NOW() - INTERVAL '5 days'
),
(
    'b0000000-0000-0000-0000-000000000005',
    '2020 Range Rover Evoque R-Dynamic SE',
    'TS-07-RR-7777',
    'Pooja Hegde',
    4200000.00,
    'Sold',
    NOW() - INTERVAL '40 days',
    NOW() - INTERVAL '3 days'
) ON CONFLICT (registration_number) DO NOTHING;

-- Insert sales for the 2 sold vehicles
INSERT INTO sales (id, vehicle_id, buyer_name, sale_date, selling_price, created_at)
VALUES 
(
    'c0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000004',
    'Devendra Patel',
    NOW() - INTERVAL '5 days',
    3350000.00,
    NOW() - INTERVAL '5 days'
),
(
    'c0000000-0000-0000-0000-000000000002',
    'b0000000-0000-0000-0000-000000000005',
    'Kavita Singhania',
    NOW() - INTERVAL '3 days',
    4750000.00,
    NOW() - INTERVAL '3 days'
) ON CONFLICT (vehicle_id) DO NOTHING;

-- Insert Invoices
INSERT INTO invoices (id, invoice_number, vehicle_id, sale_id, invoice_date, invoice_total, invoice_snapshot, created_at)
VALUES 
(
    'd0000000-0000-0000-0000-000000000001',
    'ROYAL-2026-0001',
    'b0000000-0000-0000-0000-000000000004',
    'c0000000-0000-0000-0000-000000000001',
    NOW() - INTERVAL '5 days',
    3350000.00,
    '{"buyer_name": "Devendra Patel", "vehicle_name": "2021 Toyota Fortuner 2.8 4x4 AT", "registration_number": "KA-05-TF-9900", "base_price": 3320000, "handling_fee": 30000}'::jsonb,
    NOW() - INTERVAL '5 days'
),
(
    'd0000000-0000-0000-0000-000000000002',
    'ROYAL-2026-0002',
    'b0000000-0000-0000-0000-000000000005',
    'c0000000-0000-0000-0000-000000000002',
    NOW() - INTERVAL '3 days',
    4750000.00,
    '{"buyer_name": "Kavita Singhania", "vehicle_name": "2020 Range Rover Evoque R-Dynamic SE", "registration_number": "TS-07-RR-7777", "base_price": 4700000, "handling_fee": 50000}'::jsonb,
    NOW() - INTERVAL '3 days'
) ON CONFLICT (invoice_number) DO NOTHING;

-- Insert Invoice items
INSERT INTO invoice_items (id, invoice_id, description, amount)
VALUES 
(
    'e0000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000001',
    'Vehicle Purchase: 2021 Toyota Fortuner 2.8 4x4 AT (KA-05-TF-9900)',
    3320000.00
),
(
    'e0000000-0000-0000-0000-000000000002',
    'd0000000-0000-0000-0000-000000000001',
    'RTO Transfer & Documentation Processing Charges',
    30000.00
),
(
    'e0000000-0000-0000-0000-000000000003',
    'd0000000-0000-0000-0000-000000000002',
    'Vehicle Purchase: 2020 Range Rover Evoque R-Dynamic SE (TS-07-RR-7777)',
    4700000.00
),
(
    'e0000000-0000-0000-0000-000000000004',
    'd0000000-0000-0000-0000-000000000002',
    'Pre-delivery Inspection, Ceramic Shield Coating & Transfer Handling',
    50000.00
) ON CONFLICT DO NOTHING;
