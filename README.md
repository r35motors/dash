# 🚗 R35 MOTORS - Dealership Management System

A production-ready, full-featured web application engineered for modern automobile dealerships. Manages end-to-end vehicle inventory lifecycles, purchase and sales transactions, profit calculations, dynamic GST/VAT invoicing with custom line items, Indian numbering system currency conversions, immutable historical PDF invoice generation, and comprehensive lifetime & monthly financial analytics.

Built with **Next.js 16 (App Router & Turbopack)**, **React 19**, **Tailwind CSS v4**, **@react-pdf/renderer**, and **Drizzle ORM** with native **Supabase PostgreSQL** support and a resilient zero-config local JSON fallback store.

---

## 🌟 Key Features

1. **Dashboard & Executive Overview (`/`)**
   - Real-time inventory metrics: Total Vehicles, Available Inventory, Sold Vehicles, and Total Inventory Valuation.
   - Quick preview tables for Available Stock and Recently Completed Sales with profit calculations.
   - One-click navigation to add vehicles, record sales, and view analytics.

2. **Vehicle Inventory Management (`/vehicles`)**
   - Add new vehicle acquisitions with registration number, purchase price, previous owner, and vehicle model.
   - Automatic registration number sanitization (whitespace trimming and uppercase normalization).
   - Strict duplicate registration number conflict rejection (HTTP 409 Conflict).
   - Real-time client-side and server-side search filtering by vehicle name, model, and registration number.
   - Direct quick-action links to sell any available vehicle (`/sales?vehicleId=...`).

3. **Sales & Sold Vehicles Lifecycle (`/sales`)**
   - Atomic state transitions: Recording a sale moves the vehicle from `Available` to `Sold` in a single transaction.
   - Automatic profit calculation: `Profit = Selling Price - Purchase Price`.
   - Strict duplicate sale prevention (rejects attempting to re-sell an already-sold vehicle with HTTP 409 Conflict).
   - Pre-selection support via URL query parameters (`/sales?vehicleId=<ID>`).
   - Detailed sold vehicles table showing acquisition cost, selling price, profit indicator, buyer details, and sale date.

4. **Dynamic Invoicing Engine & PDF Generation (`/invoices`)**
   - Unique sequential invoice number generation (`R35-YYYY-####`) respecting customizable dealership prefixes.
   - Support for custom itemized add-ons (e.g., Detailing & Ceramic Coating, RTO Registration Assistance, Extended Warranty, Insurance Transfer).
   - Live invoice total recalculation including vehicle base consideration and custom service items.
   - **Indian Numbering System Amount in Words**: Automatically converts amounts into official words format (e.g., `₹8,46,500` -> *"Rupees Eight Lakh Forty-Six Thousand Five Hundred Only"*).
   - **Frozen Historical Snapshots**: Deep copies dealership settings, vehicle details, and buyer info into an immutable snapshot. Changing dealership business name or address in settings never alters past generated invoices.
   - **Vector A4 PDF Generation**: Native serverless PDF rendering powered by `@react-pdf/renderer` with real-time in-browser preview and one-click direct download.

5. **Lifetime & Monthly Analytics (`/analytics`)**
   - **Lifetime Analytics**:
     - *Total Purchase Value*: Combined purchase prices of all vehicles acquired.
     - *Total Sales Value*: Total revenue from all completed sales (including additional invoice items).
     - *Total Profit*: Sales revenue minus purchase price of sold inventory.
     - *Vehicles Purchased & Sold* counts and overall profit margin percentages.
   - **Monthly Analytics & 12-Month Comparison**:
     - Filter by year and month.
     - Monthly acquisitions, revenue, and gross profit breakdown.
     - Interactive 12-month comparison chart (Jan–Dec) powered by Recharts.
     - Itemized list of sales for the selected calendar month.

6. **Dealership Business Settings (`/settings`)**
   - Manage dealership business name, logo, physical address, primary/secondary contact numbers, and invoice numbering prefix.
   - Seamless validation and persistent updates across all new invoices and PDF documents.

---

## 🛠️ Tech Stack & Architecture

- **Framework**: Next.js 16.4 (App Router, Turbopack, Partial Prerendering)
- **UI & Styling**: React 19, Tailwind CSS v4, Radix UI Dialog, Lucide React Icons
- **Data Visualization**: Recharts 3.x
- **Document Engine**: `@react-pdf/renderer` with `@react-pdf/hyphenate` patch
- **Database & ORM**: Drizzle ORM + `postgres` driver
- **Production Database**: Supabase PostgreSQL
- **Resilient Fallback**: Local JSON file store in `.data/dealership-store.json` (zero configuration needed for immediate local development and testing)

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v20+ (Node.js 20.x or 22.x recommended)
- **Package Manager**: `npm` (included with Node.js)

### 2. Installation
```bash
git clone <repository-url>
cd r35
npm install
```

> **Note on postinstall:** The project includes an automated `postinstall` script in `package.json` that ensures `@react-pdf/hyphenate` exports are correctly mapped for seamless Turbopack and Vercel serverless execution.

### 3. Environment Variables Setup
Copy the example environment configuration:
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
# Supabase PostgreSQL Connection String (Transaction Pooler port 6543 or Direct port 5432)
DATABASE_URL="postgres://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres"

# Optional Supabase API keys
NEXT_PUBLIC_SUPABASE_URL="https://[YOUR-PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

> **Dual Storage Hybrid Mode:** If `DATABASE_URL` is omitted or points to an offline database during local development, the application automatically and gracefully operates using the built-in resilient JSON store located in `.data/dealership-store.json`. All features, API endpoints, actions, and tests work identically in both modes!

---

## 🗄️ Supabase PostgreSQL Setup Guide

To link the application to a cloud-hosted Supabase PostgreSQL database:

1. **Create a Supabase Project**:
   - Go to [supabase.com](https://supabase.com) and create a free project in your preferred region (e.g. `ap-south-1` for India).

2. **Retrieve your Database Connection String**:
   - In your Supabase Dashboard, navigate to **Project Settings** -> **Database**.
   - Under **Connection string**, select **URI**.
   - Copy the **Transaction Pooler** URI (port `6543`) or Direct Connection (port `5432`).
   - Replace `[YOUR-PASSWORD]` with your actual database password.
   - Set this URL as the `DATABASE_URL` environment variable.

3. **Initialize the Schema**:
   You can set up the tables and indices in either of two ways:
   - **Option A (SQL Editor)**: Copy the contents of [`supabase-schema.sql`](file:///c:/Users/Sreehari/OneDrive/Desktop/projects/r35/supabase-schema.sql) and execute it in the Supabase Dashboard **SQL Editor**.
   - **Option B (Drizzle Kit)**:
     ```bash
     npm run db:push
     ```

4. **Seed Initial Inventory & Sales Data**:
   ```bash
   npm run db:seed
   ```
   This seeds pristine initial records:
   - 5 luxury vehicles (BMW X1, Mercedes C-Class, Audi A4, Toyota Fortuner, Range Rover Evoque).
   - 2 completed sales records with realistic profits.
   - 2 itemized invoices with frozen historical snapshots.
   - Complete dealership business settings.

---

## 🧪 Automated Verification & Test Suite

The project includes an end-to-end automated test suite that verifies all business logic, duplicate prevention, accounting math, PDF generation, and historical snapshot integrity.

Run all tests:
```bash
npm test
```

Or run individual verification suites:
```bash
# Complete end-to-end business lifecycle simulation
npm run test:e2e

# Vehicle inventory & duplicate registration tests
npm run test:vehicles

# Sales transactions & duplicate sale prevention tests
npm run test:sales

# Invoicing engine, Indian words conversion & PDF tests
npm run test:invoices

# Dashboard metrics, lifetime & monthly analytics, and settings
npm run test:dashboard
```

### What `verify-e2e-all.ts` Tests:
1. Adds new vehicle ("Honda City 2021", reg "MH 02 CZ 9988", purchase price ₹7,50,000, owner "Kiran Rao").
2. Verifies duplicate registration rejection with HTTP 409 Conflict.
3. Verifies vehicle appearance in Available Vehicles list.
4. Records sale for ₹8,30,000 (buyer "Amit Verma"), confirming state transition to "Sold", removal from Available stock, and ₹80,000 profit calculation.
5. Verifies duplicate sale rejection with HTTP 409 Conflict.
6. Generates invoice with custom line items ("Comprehensive Detailing & Polishing": ₹12,000, "RTO Transfer Assistance": ₹4,500) totaling ₹8,46,500.
7. Verifies amount in words ("Rupees Eight Lakh Forty-Six Thousand Five Hundred Only").
8. Generates and validates binary A4 PDF document with `@react-pdf/renderer`.
9. Verifies historical snapshot immutability when dealership settings are altered.
10. Verifies accurate Lifetime and Monthly Analytics propagation for vehicle profit + custom service items.
11. Cleanly restores pristine seed state.

---

## 🏗️ Production Build

To verify and produce an optimized production build:
```bash
npm run build
```
This builds all routes with Turbopack, runs strict TypeScript type-checking, and verifies that all static and dynamic routes compile without errors or warnings.

---

## ☁️ Vercel Deployment Guide

The application is pre-configured and optimized for deployment on [Vercel](https://vercel.com).

### Method 1: Deploy with Vercel CLI (Fastest)

1. **Verify authentication**:
   ```bash
   npx vercel whoami
   ```
   *(If not authenticated, run `npx vercel login`)*

2. **Deploy to Production**:
   ```bash
   npx vercel --prod
   ```

3. **Set Environment Variables in Vercel**:
   ```bash
   npx vercel env add DATABASE_URL
   ```
   *(Paste your Supabase connection string when prompted, selecting Production, Preview, and Development)*.

### Method 2: Deploy via Vercel Web Dashboard (1-Click)

1. Push your code to a GitHub, GitLab, or Bitbucket repository.
2. Visit [vercel.com/new](https://vercel.com/new) and import your repository.
3. Vercel automatically detects Next.js settings:
   - **Framework Preset**: Next.js
   - **Build Command**: `next build`
   - **Output Directory**: Next.js default
4. In the **Environment Variables** section, add:
   - `DATABASE_URL`: Your Supabase PostgreSQL connection string.
   - `NEXT_PUBLIC_SUPABASE_URL`: (Optional) Your Supabase project URL.
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: (Optional) Your Supabase anon key.
5. Click **Deploy**. Vercel will build and assign a production URL (e.g., `https://your-dealership.vercel.app`).

---

## 📁 Project Structure

```
├── .data/
│   └── dealership-store.json        # Resilient local JSON fallback store
├── scripts/
│   ├── seed.ts                      # Database & store seed script
│   ├── verify-all-vehicles.ts       # Section 2 & 3 test suite
│   ├── verify-sales.ts              # Section 4 & 5 test suite
│   ├── verify-invoices.ts           # Section 6 test suite
│   ├── verify-dashboard-analytics-settings.ts # Sections 1, 7, 8 test suite
│   └── verify-e2e-all.ts            # Integrated end-to-end lifecycle test suite
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── analytics/route.ts   # Analytics REST endpoint
│   │   │   ├── invoices/route.ts    # Invoices list & create endpoint
│   │   │   ├── invoices/[id]/route.ts # Invoice details & PDF stream endpoint
│   │   │   ├── sales/route.ts       # Sales list & record sale endpoint
│   │   │   ├── settings/route.ts    # Settings GET & PUT endpoint
│   │   │   └── vehicles/route.ts    # Vehicles list & add vehicle endpoint
│   │   ├── analytics/page.tsx       # Lifetime & monthly analytics dashboard
│   │   ├── invoices/page.tsx        # Invoice creation, preview & download view
│   │   ├── sales/page.tsx           # Sales management & sold vehicles view
│   │   ├── settings/page.tsx        # Dealership profile & settings view
│   │   ├── vehicles/page.tsx        # Vehicle inventory & search view
│   │   ├── layout.tsx               # Root layout with sidebar navigation
│   │   └── page.tsx                 # Executive dashboard home page
│   ├── components/
│   │   ├── analytics/               # Recharts monthly charts & breakdown tables
│   │   ├── dashboard/               # Metric KPI cards & inventory tables
│   │   ├── invoices/                # PDF preview dialogs & @react-pdf document
│   │   ├── sales/                   # Record sale forms & sold vehicles tables
│   │   ├── settings/                # Business settings form
│   │   └── vehicles/                # Add vehicle modal & inventory search cards
│   └── lib/
│       ├── analytics.ts             # Lifetime & monthly calculation business logic
│       ├── db/
│       │   ├── index.ts             # Hybrid database abstraction layer
│       │   ├── schema.ts            # Drizzle ORM PostgreSQL schema
│       │   ├── local-store.ts       # Resilient JSON store engine
│       │   └── seed-data.ts         # Pristine seed dataset
│       └── utils.ts                 # Currency formatter & Indian words generator
├── supabase-schema.sql              # Supabase PostgreSQL DDL schema & indices
├── vercel.json                      # Vercel deployment configuration
├── next.config.ts                   # Next.js Turbopack & compiler configuration
└── package.json                     # Scripts & dependencies
```

---

## 📜 License

Private Dealership Software — All Rights Reserved.
