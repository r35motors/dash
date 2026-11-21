import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { dealershipDb, getDb } from "../src/lib/db";
import * as schema from "../src/lib/db/schema";
import { eq } from "drizzle-orm";
import { POST as postVehicleRoute, GET as getVehiclesRoute } from "../src/app/api/vehicles/route";
import { POST as postSaleRoute, GET as getSalesRoute } from "../src/app/api/sales/route";
import { POST as postInvoiceRoute, GET as getInvoicesRoute } from "../src/app/api/invoices/route";
import { GET as getInvoiceByIdRoute } from "../src/app/api/invoices/[id]/route";
import { numberToIndianWords, formatCurrency } from "../src/lib/utils";
import React from "react";
import { pdf } from "@react-pdf/renderer";
import { InvoicePdfDocument } from "../src/components/invoices/invoice-pdf-document";

async function runEndToEndVerification() {
  console.log("================================================================================");
  console.log("   COMPREHENSIVE END-TO-END DEALERSHIP LIFECYCLE VERIFICATION (SECTION 11)   ");
  console.log("================================================================================\n");

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, details?: string) {
    totalTests++;
    if (condition) {
      console.log(`  ✓ [PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`  ✗ [FAIL] ${testName}`);
      if (details) console.error(`         Details: ${details}`);
      throw new Error(`Assertion failed: ${testName}`);
    }
  }

  // --------------------------------------------------------------------------
  // STEP 0: Reset store to clean seed state & record baseline metrics
  // --------------------------------------------------------------------------
  console.log("--- 0. SETUP: Connecting to Supabase PostgreSQL ---");
  // Clean up any lingering test vehicle if previous run was interrupted
  try {
    const existingTest = await dealershipDb.vehicles.getByRegistration("MH 02 CZ 9988");
    if (existingTest) {
      const db = getDb();
      const existingSales = await dealershipDb.sales.getAll();
      const s = existingSales.find((x) => x.vehicle_id === existingTest.id);
      if (s) {
        await db.delete(schema.invoices).where(eq(schema.invoices.sale_id, s.id));
        await db.delete(schema.sales).where(eq(schema.sales.id, s.id));
      }
      await dealershipDb.vehicles.delete(existingTest.id);
    }
  } catch {}
  console.log("  ✓ Ready on live Supabase instance\n");

  const baselineAnalytics = await dealershipDb.analytics.getOverview();
  const baselineLifetime = baselineAnalytics.lifetime;
  const initialAvailableVehicles = await dealershipDb.vehicles.getAll({ status: "Available" });
  const initialSoldVehicles = await dealershipDb.vehicles.getAll({ status: "Sold" });

  assert(initialAvailableVehicles.length === 3, "Baseline available vehicles count is 3");
  assert(initialSoldVehicles.length === 2, "Baseline sold vehicles count is 2");
  assert(baselineLifetime.totalPurchaseValue === 19300000, "Baseline purchase value is ₹1,93,00,000");
  assert(baselineLifetime.totalSalesValue === 8100000, "Baseline sales value is ₹81,00,000");
  assert(baselineLifetime.totalProfit === 1000000, "Baseline total profit is ₹10,00,000");

  // --------------------------------------------------------------------------
  // STEP 1: Add a new vehicle ("Honda City 2021", "MH 02 CZ 9988", ₹7,50,000, "Kiran Rao")
  // --------------------------------------------------------------------------
  console.log("\n--- 1. STEP 1: Add New Vehicle ---");
  const addVehicleReq = new Request("http://localhost:3000/api/vehicles", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      vehicle_name: "Honda City 2021",
      registration_number: "MH 02 CZ 9988",
      purchase_price: 750000,
      owner_name: "Kiran Rao",
    }),
  });

  const addVehicleRes = await postVehicleRoute(addVehicleReq);
  const newVehicle = await addVehicleRes.json();

  assert(addVehicleRes.status === 201, "POST /api/vehicles returns 201 Created for Honda City 2021");
  assert(newVehicle.vehicle_name === "Honda City 2021", "Vehicle name matches 'Honda City 2021'");
  assert(newVehicle.registration_number === "MH 02 CZ 9988", "Registration number matches 'MH 02 CZ 9988'");
  assert(newVehicle.owner_name === "Kiran Rao", "Owner name matches 'Kiran Rao'");
  assert(Number(newVehicle.purchase_price) === 750000, "Purchase price stored as 750000");
  assert(newVehicle.status === "Available", "Initial status automatically set to 'Available'");

  // --------------------------------------------------------------------------
  // STEP 2: Attempt duplicate registration "MH 02 CZ 9988" -> Verify rejection (409 Conflict)
  // --------------------------------------------------------------------------
  console.log("\n--- 2. STEP 2: Duplicate Registration Prevention (409 Conflict) ---");
  const duplicateReq = new Request("http://localhost:3000/api/vehicles", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      vehicle_name: "Honda City Duplicate",
      registration_number: "  mh 02 cz 9988  ", // Mixed casing and whitespace
      purchase_price: 800000,
      owner_name: "Duplicate Tester",
    }),
  });

  const duplicateRes = await postVehicleRoute(duplicateReq);
  const duplicateJson = await duplicateRes.json();

  assert(duplicateRes.status === 409, "POST /api/vehicles returns 409 Conflict for duplicate registration");
  assert(
    duplicateJson.error === "A vehicle with registration number MH 02 CZ 9988 is already registered.",
    "Duplicate error message explicitly cites the conflicting registration number",
    `Received: "${duplicateJson.error}"`
  );

  // --------------------------------------------------------------------------
  // STEP 3: Verify vehicle appears in Available Vehicles list
  // --------------------------------------------------------------------------
  console.log("\n--- 3. STEP 3: Verify Vehicle in Available Vehicles List ---");
  const getAvailableReq = new Request("http://localhost:3000/api/vehicles?status=Available");
  const getAvailableRes = await getVehiclesRoute(getAvailableReq);
  const availableList = await getAvailableRes.json();

  const foundInAvailable = availableList.find((v: any) => v.id === newVehicle.id);
  assert(Boolean(foundInAvailable), "Honda City 2021 is present in Available Vehicles list");
  assert(
    foundInAvailable?.registration_number === "MH 02 CZ 9988",
    "Available vehicle registration number matches"
  );
  assert(
    foundInAvailable?.status === "Available",
    "Available vehicle has status 'Available'"
  );
  assert(
    availableList.length === initialAvailableVehicles.length + 1,
    `Available vehicles count incremented from ${initialAvailableVehicles.length} to ${availableList.length}`
  );

  // --------------------------------------------------------------------------
  // STEP 4: Record a sale (Buyer "Amit Verma", selling price ₹8,30,000, date today)
  // --------------------------------------------------------------------------
  console.log("\n--- 4. STEP 4: Record Sale & Verify State Transitions ---");
  const todayDate = new Date().toISOString().split("T")[0];
  const postSaleReq = new Request("http://localhost:3000/api/sales", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      vehicle_id: newVehicle.id,
      buyer_name: "Amit Verma",
      selling_price: 830000,
      sale_date: todayDate,
    }),
  });

  const postSaleRes = await postSaleRoute(postSaleReq);
  const saleRecord = await postSaleRes.json();

  assert(postSaleRes.status === 201, "POST /api/sales returns 201 Created on valid sale confirmation");
  assert(saleRecord.buyer_name === "Amit Verma", "Sale record has buyer name 'Amit Verma'");
  assert(Number(saleRecord.selling_price) === 830000, "Selling price is ₹8,30,000");

  const expectedProfit = 830000 - 750000; // 80,000
  assert(
    Number(saleRecord.profit) === expectedProfit,
    `Calculated profit matches ₹80,000 (₹8,30,000 - ₹7,50,000)`,
    `Got: ${saleRecord.profit}`
  );

  // Verify atomic vehicle status transition
  const checkVehicle = await dealershipDb.vehicles.getById(newVehicle.id);
  assert(checkVehicle?.status === "Sold", "Vehicle status transitioned to 'Sold'");

  // Verify removed from Available Vehicles list
  const refreshedAvailableRes = await getVehiclesRoute(new Request("http://localhost:3000/api/vehicles?status=Available"));
  const refreshedAvailable = await refreshedAvailableRes.json();
  assert(
    !refreshedAvailable.some((v: any) => v.id === newVehicle.id),
    "Vehicle was removed from Available Vehicles list"
  );

  // Verify vehicle appears in Sold Vehicles list
  const getSalesReqRes = await getSalesRoute();
  const salesList = await getSalesReqRes.json();
  const foundSale = salesList.find((s: any) => s.vehicle_id === newVehicle.id);
  assert(Boolean(foundSale), "Sale appears in Sold Vehicles / Sales list");
  assert(foundSale?.buyer_name === "Amit Verma", "Buyer name matches in Sold Vehicles view");
  assert(Number(foundSale?.profit) === 80000, "Profit of ₹80,000 verified in Sold Vehicles view");

  // --------------------------------------------------------------------------
  // STEP 5: Attempt duplicate sale on same vehicle -> Verify rejection (409 Conflict)
  // --------------------------------------------------------------------------
  console.log("\n--- 5. STEP 5: Strict Duplicate Sale Prevention (409 Conflict) ---");
  const duplicateSaleReq = new Request("http://localhost:3000/api/sales", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      vehicle_id: newVehicle.id,
      buyer_name: "Another Buyer",
      selling_price: 900000,
      sale_date: todayDate,
    }),
  });

  const duplicateSaleRes = await postSaleRoute(duplicateSaleReq);
  const duplicateSaleJson = await duplicateSaleRes.json();

  assert(
    duplicateSaleRes.status === 409,
    "POST /api/sales returns 409 Conflict when attempting to sell already-sold vehicle"
  );
  assert(
    duplicateSaleJson.error === "This vehicle has already been sold.",
    "Rejection error message is 'This vehicle has already been sold.'"
  );

  // --------------------------------------------------------------------------
  // STEP 6: Generate an invoice for this sale with custom items
  // --------------------------------------------------------------------------
  console.log("\n--- 6. STEP 6: Generate Invoice with Custom Line Items ---");
  const nextInvoiceNumber = await dealershipDb.invoices.getNextNumber();
  const currentSettings = await dealershipDb.settings.get();

  const vehicleLinePrice = 830000;
  const customItems = [
    { description: "Comprehensive Detailing & Polishing", amount: 12000 },
    { description: "RTO Transfer Assistance", amount: 4500 },
  ];

  const expectedInvoiceTotal = vehicleLinePrice + 12000 + 4500; // 8,46,500
  const expectedAmountInWords = numberToIndianWords(expectedInvoiceTotal);

  const fullLineItems = [
    {
      description: `Vehicle Purchase: ${newVehicle.vehicle_name} (${newVehicle.registration_number})`,
      amount: vehicleLinePrice,
    },
    ...customItems,
  ];

  const invoiceSnapshot = {
    invoice_number: nextInvoiceNumber,
    invoice_date: todayDate,
    dealership: {
      business_name: currentSettings.business_name,
      logo_path: currentSettings.logo_path,
      address: currentSettings.address,
      contact_number_1: currentSettings.contact_number_1,
      contact_number_2: currentSettings.contact_number_2,
      invoice_prefix: currentSettings.invoice_prefix,
    },
    buyer: {
      name: "Amit Verma",
    },
    vehicle: {
      id: newVehicle.id,
      vehicle_name: newVehicle.vehicle_name,
      registration_number: newVehicle.registration_number,
      owner_name: newVehicle.owner_name,
      purchase_price: newVehicle.purchase_price,
      selling_price: vehicleLinePrice,
    },
    items: fullLineItems,
    total_amount: expectedInvoiceTotal,
    amount_in_words: expectedAmountInWords,
    created_at: new Date().toISOString(),
  };

  const createInvoiceReq = new Request("http://localhost:3000/api/invoices", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      vehicle_id: newVehicle.id,
      sale_id: saleRecord.id,
      invoice_number: nextInvoiceNumber,
      invoice_date: todayDate,
      invoice_total: expectedInvoiceTotal,
      invoice_snapshot: invoiceSnapshot,
      items: fullLineItems,
    }),
  });

  const createInvoiceRes = await postInvoiceRoute(createInvoiceReq);
  const createdInvoice = await createInvoiceRes.json();

  assert(createInvoiceRes.status === 201, "POST /api/invoices returns 201 Created");
  assert(createdInvoice.invoice_number === nextInvoiceNumber, `Invoice generated with number '${nextInvoiceNumber}'`);
  assert(
    Number(createdInvoice.invoice_total) === 846500,
    "Invoice total correctly calculated to ₹8,46,500 (₹8,30,000 + ₹12,000 + ₹4,500)",
    `Received total: ${createdInvoice.invoice_total}`
  );
  assert(
    createdInvoice.items?.length === 3,
    "Invoice includes 3 line items (Vehicle + Detailing & Polishing + RTO Transfer)",
    `Item count: ${createdInvoice.items?.length}`
  );

  // --------------------------------------------------------------------------
  // STEP 7: Verify amount in words
  // --------------------------------------------------------------------------
  console.log("\n--- 7. STEP 7: Verify Indian Numbering System Amount in Words ---");
  const words = createdInvoice.invoice_snapshot?.amount_in_words;
  assert(
    words === "Rupees Eight Lakh Forty-Six Thousand Five Hundred Only",
    "Amount in words exactly matches 'Rupees Eight Lakh Forty-Six Thousand Five Hundred Only'",
    `Received: "${words}"`
  );

  // --------------------------------------------------------------------------
  // STEP 8: Generate and verify valid PDF document binary with @react-pdf/renderer
  // --------------------------------------------------------------------------
  console.log("\n--- 8. STEP 8: Generate and Verify Valid PDF Document Binary ---");
  const pdfElement = React.createElement(InvoicePdfDocument, {
    data: createdInvoice as any,
  });
  const pdfInstance = pdf(pdfElement as any);
  const pdfBlob = await pdfInstance.toBlob();

  assert(Boolean(pdfBlob), "PDF document instance generated successfully");
  assert(pdfBlob.size > 2000, `PDF size is valid and substantial (${pdfBlob.size} bytes)`);
  assert(pdfBlob.type === "application/pdf", "PDF Blob MIME type is 'application/pdf'");

  // Also test PDF endpoint via GET /api/invoices/[id]?format=pdf
  const pdfRouteReq = new Request(`http://localhost:3000/api/invoices/${createdInvoice.id}?format=pdf`);
  const pdfRouteRes = await getInvoiceByIdRoute(pdfRouteReq, {
    params: Promise.resolve({ id: createdInvoice.id }),
  });
  assert(pdfRouteRes.status === 200, "GET /api/invoices/[id]?format=pdf returns 200 OK");
  assert(
    pdfRouteRes.headers.get("content-type") === "application/pdf",
    "API endpoint returns Content-Type: application/pdf"
  );
  const arrayBuf = await pdfRouteRes.arrayBuffer();
  assert(arrayBuf.byteLength > 2000, `API endpoint returns valid binary PDF stream (${arrayBuf.byteLength} bytes)`);

  // --------------------------------------------------------------------------
  // STEP 9: Verify historical snapshot preservation
  // --------------------------------------------------------------------------
  console.log("\n--- 9. STEP 9: Verify Historical Snapshot Preservation ---");
  const originalSnapshotDealership = createdInvoice.invoice_snapshot.dealership;
  const originalBusinessName = originalSnapshotDealership.business_name;
  const originalAddress = originalSnapshotDealership.address;

  // Change dealership name and address in settings
  const modifiedBusinessName = "Grand Apex Autohaus International " + Date.now();
  const modifiedAddress = "404 New Highway, Suite 100, Bengaluru";
  await dealershipDb.settings.update({
    business_name: modifiedBusinessName,
    address: modifiedAddress,
  });

  // Fetch the invoice from DB
  const retrievedInvoice = await dealershipDb.invoices.getById(createdInvoice.id);
  const snap = retrievedInvoice?.invoice_snapshot as any;

  assert(
    snap?.dealership?.business_name === originalBusinessName,
    "Past invoice snapshot retains original dealership business name",
    `Snapshot: "${snap?.dealership?.business_name}", Expected: "${originalBusinessName}"`
  );
  assert(
    snap?.dealership?.address === originalAddress,
    "Past invoice snapshot retains original dealership address",
    `Snapshot: "${snap?.dealership?.address}", Expected: "${originalAddress}"`
  );
  assert(
    snap?.dealership?.business_name !== modifiedBusinessName,
    "Live dealership settings update did NOT affect historical invoice snapshot"
  );

  // Restore dealership settings
  await dealershipDb.settings.update({
    business_name: currentSettings.business_name,
    address: currentSettings.address,
    contact_number_1: currentSettings.contact_number_1,
    contact_number_2: currentSettings.contact_number_2,
    invoice_prefix: currentSettings.invoice_prefix,
  });

  // --------------------------------------------------------------------------
  // STEP 10: Verify Lifetime and Monthly Analytics update accurately
  // --------------------------------------------------------------------------
  console.log("\n--- 10. STEP 10: Verify Lifetime and Monthly Analytics Updates ---");
  const updatedAnalytics = await dealershipDb.analytics.getOverview();
  const updatedLifetime = updatedAnalytics.lifetime;

  // Total purchase value: baseline (19,300,000) + 750,000 = 20,050,000
  assert(
    updatedLifetime.totalPurchaseValue === 20050000,
    "Lifetime Analytics: Total purchase value updated to ₹2,00,50,000 (+₹7,50,000)",
    `Got: ₹${updatedLifetime.totalPurchaseValue}`
  );

  // Vehicles purchased count: 5 + 1 = 6
  assert(
    updatedLifetime.vehiclesPurchased === 6,
    "Lifetime Analytics: Vehicles purchased count updated to 6 (5 + 1)",
    `Got: ${updatedLifetime.vehiclesPurchased}`
  );

  // Vehicles sold count: 2 + 1 = 3
  assert(
    updatedLifetime.vehiclesSold === 3,
    "Lifetime Analytics: Vehicles sold count updated to 3 (2 + 1)",
    `Got: ${updatedLifetime.vehiclesSold}`
  );

  // Total sales value: baseline (8,100,000) + invoice total (846,500) = 8,946,500
  // Note: invoice has custom items totaling 846,500, which flows directly into sale revenue!
  assert(
    updatedLifetime.totalSalesValue === 8946500,
    "Lifetime Analytics: Total sales value updated to ₹89,46,500 (+₹8,46,500 from invoice with custom items)",
    `Got: ₹${updatedLifetime.totalSalesValue}`
  );

  // Total profit:
  // Baseline sold vehicles purchase: 2,900,000 + 4,200,000 = 7,100,000.
  // Sold vehicles purchase now: 7,100,000 + 750,000 = 7,850,000.
  // Total profit = 8,946,500 - 7,850,000 = 1,096,500.
  // (Or baseline profit 1,000,000 + (846,500 - 750,000) = 1,096,500)
  assert(
    updatedLifetime.totalProfit === 1096500,
    "Lifetime Analytics: Total profit updated to ₹10,96,500 (accurately reflecting vehicle profit + custom service items)",
    `Got: ₹${updatedLifetime.totalProfit}`
  );

  // Monthly Analytics for current month
  const now = new Date();
  const curYear = now.getFullYear();
  const curMonth = now.getMonth() + 1;
  const monthlyStats = await dealershipDb.analytics.getMonthly(curYear, curMonth);

  assert(
    monthlyStats.salesList.some((s) => s.id === saleRecord.id),
    "Monthly Analytics: Current month sales list includes new sale record"
  );
  const foundMonthlySale = monthlyStats.salesList.find((s) => s.id === saleRecord.id);
  assert(
    foundMonthlySale?.sales_value === 846500,
    "Monthly Analytics: Sale revenue accurately incorporates invoice line items (₹8,46,500)",
    `Got: ₹${foundMonthlySale?.sales_value}`
  );
  assert(
    foundMonthlySale?.profit === 96500,
    "Monthly Analytics: Sale profit reflects total invoice revenue minus vehicle purchase price (₹96,500)",
    `Got: ₹${foundMonthlySale?.profit}`
  );

  // --------------------------------------------------------------------------
  // STEP 11: Cleanly restore/ensure seed data
  // --------------------------------------------------------------------------
  console.log("\n--- 11. STEP 11: Cleanly Restore/Ensure Seed Data in Supabase ---");
  // Clean up created test records from Supabase
  try {
    const db = getDb();
    const invs = await dealershipDb.invoices.getAll();
    const testInv = invs.find((i) => i.invoice_number === "ROYAL-2026-0003");
    if (testInv) {
      await db.delete(schema.invoiceItems).where(eq(schema.invoiceItems.invoice_id, testInv.id));
      await db.delete(schema.invoices).where(eq(schema.invoices.id, testInv.id));
    }
    const sales = await dealershipDb.sales.getAll();
    const testSale = sales.find((s) => s.buyer_name === "Amit Verma");
    if (testSale) {
      await db.delete(schema.sales).where(eq(schema.sales.id, testSale.id));
    }
    const testVeh = await dealershipDb.vehicles.getByRegistration("MH 02 CZ 9988");
    if (testVeh) {
      await dealershipDb.vehicles.delete(testVeh.id);
    }
    await dealershipDb.settings.update({
      business_name: "Royal Motors Luxury Pre-Owned Dealership",
      address: "Plot 42, Highline Auto Corridor, MG Road, Bangalore 560001",
      invoice_prefix: "ROYAL",
    });
  } catch (e) {
    console.warn("Cleanup warning:", e);
  }

  const restoredVehicles = await dealershipDb.vehicles.getAll();
  const restoredSales = await dealershipDb.sales.getAll();
  const restoredInvoices = await dealershipDb.invoices.getAll();
  const restoredSettings = await dealershipDb.settings.get();
  const restoredAnalytics = await dealershipDb.analytics.getOverview();

  assert(restoredVehicles.length === 5, "Database restored: exactly 5 seed vehicles present");
  assert(restoredSales.length === 2, "Database restored: exactly 2 seed sales present");
  assert(restoredInvoices.length === 2, "Database restored: exactly 2 seed invoices present");
  assert(
    restoredSettings.business_name.includes("Royal Motors"),
    "Database restored: dealership settings pristine"
  );
  assert(
    restoredAnalytics.lifetime.totalSalesValue === 8100000,
    "Store restored: lifetime sales value pristine (₹81,00,000)"
  );
  assert(
    restoredAnalytics.lifetime.totalProfit === 1000000,
    "Store restored: lifetime profit pristine (₹10,00,000)"
  );

  console.log("\n================================================================================");
  console.log(`  ALL ${totalTests} END-TO-END BUSINESS FLOW CHECKS PASSED! (${passedTests}/${totalTests}) 🚀`);
  console.log("================================================================================\n");
}

runEndToEndVerification()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("\n❌ End-to-End Verification Failed:", err);
    process.exit(1);
  });
