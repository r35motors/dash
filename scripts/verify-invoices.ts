import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { dealershipDb } from "../src/lib/db";
import { numberToIndianWords } from "../src/lib/utils";
import React from "react";
import { pdf } from "@react-pdf/renderer";
import { InvoicePdfDocument } from "../src/components/invoices/invoice-pdf-document";

async function runVerification() {
  console.log("==========================================================");
  console.log("       INVOICE ENGINE & PDF VERIFICATION TEST SUITE       ");
  console.log("==========================================================\n");

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, details?: string) {
    totalTests++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      if (details) console.error(`   Details: ${details}`);
      throw new Error(`Assertion failed: ${testName}`);
    }
  }

  // --------------------------------------------------------------------------
  // TEST 1: Indian Numbering System Amount in Words
  // --------------------------------------------------------------------------
  console.log("--- 1. Testing Indian Numbering System (numberToIndianWords) ---");

  try {
    const existingInvoices = await dealershipDb.invoices.getAll();
    for (const inv of existingInvoices) {
      if (inv.invoice_number === "INV-2026-TEST01") {
        await dealershipDb.invoices.delete(inv.id);
      }
    }
  } catch {}

  const wordTest1 = numberToIndianWords(431500);
  assert(
    wordTest1 === "Rupees Four Lakh Thirty-One Thousand Five Hundred Only",
    "₹4,31,500 formats to 'Rupees Four Lakh Thirty-One Thousand Five Hundred Only'",
    `Received: "${wordTest1}"`
  );

  const wordTest2 = numberToIndianWords("₹4,31,500");
  assert(
    wordTest2 === "Rupees Four Lakh Thirty-One Thousand Five Hundred Only",
    "String '₹4,31,500' handles currency symbol & commas correctly",
    `Received: "${wordTest2}"`
  );

  const wordTest3 = numberToIndianWords(0);
  assert(
    wordTest3 === "Rupees Zero Only",
    "Zero amount formats to 'Rupees Zero Only'",
    `Received: "${wordTest3}"`
  );

  const wordTest4 = numberToIndianWords(10000000);
  assert(
    wordTest4 === "Rupees One Crore Only",
    "₹1,00,00,000 formats to 'Rupees One Crore Only'",
    `Received: "${wordTest4}"`
  );

  const wordTest5 = numberToIndianWords(3850000);
  assert(
    wordTest5 === "Rupees Thirty-Eight Lakh Fifty Thousand Only",
    "₹38,50,000 formats to 'Rupees Thirty-Eight Lakh Fifty Thousand Only'",
    `Received: "${wordTest5}"`
  );

  const wordTest6 = numberToIndianWords(25000.50);
  assert(
    wordTest6 === "Rupees Twenty-Five Thousand and Fifty Paise Only",
    "₹25,000.50 formats with paise correctly",
    `Received: "${wordTest6}"`
  );

  // --------------------------------------------------------------------------
  // TEST 2: Unique Invoice Number Enforcement
  // --------------------------------------------------------------------------
  console.log("\n--- 2. Testing Unique Invoice Number Enforcement ---");

  // Get all existing invoices
  const existingInvoices = await dealershipDb.invoices.getAll();
  const existingNumber = existingInvoices[0]?.invoice_number || "INV-TEST-DUPLICATE";

  // Try creating an invoice with the existing number
  let duplicateCaught = false;
  try {
    const vehicles = await dealershipDb.vehicles.getAll();
    const testVehicle = vehicles[0];
    await dealershipDb.invoices.create({
      vehicle_id: testVehicle.id,
      invoice_number: existingNumber,
      invoice_total: 500000,
    });
  } catch (err: any) {
    if (err?.message?.includes("already exists")) {
      duplicateCaught = true;
    }
  }

  assert(
    duplicateCaught,
    "Attempting to reuse existing invoice number throws 'already exists' error"
  );

  // --------------------------------------------------------------------------
  // TEST 3 & 4: Invoice Creation with Custom Items & Correct Total Calculation
  // --------------------------------------------------------------------------
  console.log("\n--- 3 & 4. Testing Invoice Creation with Custom Items & Total Calculation ---");

  const testVehicles = await dealershipDb.vehicles.getAll();
  const targetVehicle = testVehicles[0];

  const uniqueSuffix = Date.now().toString().slice(-6);
  const testInvoiceNumber = `TEST-INV-${uniqueSuffix}`;

  const vehiclePrice = 350000;
  const customItems = [
    { description: "Painting & Body Detailing", amount: 15000 },
    { description: "Mechanical Repair work & Brake Overhaul", amount: 12500 },
    { description: "Comprehensive Insurance transfer & RTO Fees", amount: 8000 },
  ];

  const calculatedTotal = vehiclePrice + 15000 + 12500 + 8000; // 3,85,500
  const expectedWords = numberToIndianWords(calculatedTotal);

  // Prepare full snapshot
  const initialSettings = await dealershipDb.settings.get();
  const invoiceSnapshot = {
    invoice_number: testInvoiceNumber,
    invoice_date: new Date().toISOString(),
    dealership: {
      business_name: initialSettings.business_name,
      logo_path: initialSettings.logo_path,
      address: initialSettings.address,
      contact_number_1: initialSettings.contact_number_1,
      contact_number_2: initialSettings.contact_number_2,
      invoice_prefix: initialSettings.invoice_prefix,
    },
    buyer: {
      name: "Rohan Varma",
    },
    vehicle: {
      id: targetVehicle.id,
      vehicle_name: targetVehicle.vehicle_name,
      registration_number: targetVehicle.registration_number,
      owner_name: targetVehicle.owner_name,
      purchase_price: targetVehicle.purchase_price,
      selling_price: vehiclePrice,
    },
    items: [
      {
        description: `Vehicle: ${targetVehicle.vehicle_name} (${targetVehicle.registration_number})`,
        amount: vehiclePrice,
      },
      ...customItems,
    ],
    total_amount: calculatedTotal,
    amount_in_words: expectedWords,
  };

  const createdInvoice = await dealershipDb.invoices.create({
    vehicle_id: targetVehicle.id,
    invoice_number: testInvoiceNumber,
    invoice_date: new Date().toISOString(),
    invoice_total: calculatedTotal,
    invoice_snapshot: invoiceSnapshot,
    items: [
      {
        description: `Vehicle: ${targetVehicle.vehicle_name} (${targetVehicle.registration_number})`,
        amount: vehiclePrice,
      },
      ...customItems,
    ],
  });

  assert(
    createdInvoice.invoice_number === testInvoiceNumber,
    "Invoice created with specified unique invoice number",
    `Created invoice number: ${createdInvoice.invoice_number}`
  );

  assert(
    parseFloat(String(createdInvoice.invoice_total)) === 385500,
    "Total calculated correctly (350000 + 15000 + 12500 + 8000 = ₹3,85,500)",
    `Received total: ${createdInvoice.invoice_total}`
  );

  assert(
    createdInvoice.items?.length === 4,
    "Invoice items saved with Vehicle + 3 Custom Line Items (Painting, Repair work, Insurance transfer)",
    `Item count: ${createdInvoice.items?.length}`
  );

  const createdSnap = createdInvoice.invoice_snapshot as any;
  assert(
    createdSnap?.amount_in_words ===
      "Rupees Three Lakh Eighty-Five Thousand Five Hundred Only",
    "Invoice snapshot stores correct amount in words",
    `Snapshot amount in words: ${createdSnap?.amount_in_words}`
  );

  // --------------------------------------------------------------------------
  // TEST 5: Historical Snapshot Preservation
  // --------------------------------------------------------------------------
  console.log("\n--- 5. Testing Historical Snapshot Preservation ---");

  // Record original dealership name in snapshot
  const originalSnapshotBusinessName =
    createdSnap?.dealership?.business_name;

  // Now, modify business settings in the database
  const alteredBusinessName = "ALTERED NAME FOR TESTING SNAPSHOTS " + Date.now();
  await dealershipDb.settings.update({
    business_name: alteredBusinessName,
    address: "Altered Address 999",
  });

  // Re-fetch the previously created invoice from DB
  const retrievedInvoice = await dealershipDb.invoices.getById(createdInvoice.id);
  const retrievedSnap = retrievedInvoice?.invoice_snapshot as any;

  assert(
    retrievedInvoice !== null,
    "Retrieved saved invoice by ID"
  );

  assert(
    retrievedSnap?.dealership?.business_name ===
      originalSnapshotBusinessName,
    "Past invoice snapshot remains 100% frozen despite live business settings update",
    `Snapshot business name: "${retrievedSnap?.dealership?.business_name}", Expected: "${originalSnapshotBusinessName}"`
  );

  assert(
    retrievedSnap?.dealership?.business_name !== alteredBusinessName,
    "Live settings alteration did NOT overwrite historical invoice snapshot",
    `Current DB Name: "${alteredBusinessName}"`
  );

  // Restore original settings
  await dealershipDb.settings.update({
    business_name: initialSettings.business_name,
    address: initialSettings.address,
    contact_number_1: initialSettings.contact_number_1,
    contact_number_2: initialSettings.contact_number_2,
    invoice_prefix: initialSettings.invoice_prefix,
  });

  console.log("   (Restored original dealership settings successfully)");

  // --------------------------------------------------------------------------
  // TEST 6: React-PDF Document Generation
  // --------------------------------------------------------------------------
  console.log("\n--- 6. Testing @react-pdf/renderer Document Generation ---");

  const pdfElement = React.createElement(InvoicePdfDocument, {
    data: retrievedInvoice as any,
  });

  const pdfInstance = pdf(pdfElement as any);
  const pdfBlob = await pdfInstance.toBlob();

  assert(
    pdfBlob !== null && pdfBlob.size > 1000,
    `PDF engine generates valid A4 document binary (size: ${pdfBlob.size} bytes)`,
    `Blob size: ${pdfBlob?.size}`
  );

  assert(
    pdfBlob.type === "application/pdf",
    "PDF Blob MIME type is 'application/pdf'",
    `Received MIME type: ${pdfBlob.type}`
  );

  // Cleanup test invoice
  try {
    if (createdInvoice?.id) {
      await dealershipDb.invoices.delete(createdInvoice.id);
      console.log(`  ✓ Cleaned up test invoice ${createdInvoice.id}`);
    }
  } catch (err) {
    console.error("Cleanup error in verify-invoices:", err);
  }

  console.log("\n==========================================================");
  console.log(`  ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY! 🚀`);
  console.log("==========================================================");
}

runVerification()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("\n❌ Verification Failed:", err);
    process.exit(1);
  });
