import { dealershipDb } from "../src/lib/db";
import { localStore } from "../src/lib/db/local-store";
import { GET, POST } from "../src/app/api/sales/route";
import { createSaleAction } from "../src/app/sales/actions";
import { formatCurrency, formatDate } from "../src/lib/utils";

async function runSalesVerification() {
  console.log("\n========================================================");
  console.log("RUNNING COMPREHENSIVE VERIFICATION FOR SECTIONS 4 & 5");
  console.log("   (Sales Management, Sold Vehicles & Add Sale Feature)");
  console.log("========================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${testName} ${detail ? `(${detail})` : ""}`);
      failed++;
    }
  }

  // Step 0: Reset local store to pristine seed data
  localStore.resetToDefault();
  console.log("✓ Reset local store to pristine seed data\n");

  console.log("--- 1. SECTION 5: INPUT VALIDATION & AVAILABILITY CHECKS ---");

  // Missing vehicle_id
  const missingVehicleReq = new Request("http://localhost:3000/api/sales", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      buyer_name: "Rahul Verma",
      selling_price: 3500000,
    }),
  });
  const missingVehicleRes = await POST(missingVehicleReq);
  const missingVehicleJson = await missingVehicleRes.json();
  assert(missingVehicleRes.status === 400, "API POST returns 400 when vehicle_id is missing");
  assert(missingVehicleJson.error === "Vehicle is required.", "API POST returns clear error for missing vehicle");

  // Missing buyer_name
  const missingBuyerReq = new Request("http://localhost:3000/api/sales", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      vehicle_id: "b0000000-0000-0000-0000-000000000001",
      buyer_name: "   ",
      selling_price: 3500000,
    }),
  });
  const missingBuyerRes = await POST(missingBuyerReq);
  assert(missingBuyerRes.status === 400, "API POST returns 400 when buyer_name is empty");

  // Non-positive selling price
  const invalidPriceReq = new Request("http://localhost:3000/api/sales", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      vehicle_id: "b0000000-0000-0000-0000-000000000001",
      buyer_name: "Rahul Verma",
      selling_price: -1000,
    }),
  });
  const invalidPriceRes = await POST(invalidPriceReq);
  assert(invalidPriceRes.status === 400, "API POST returns 400 when selling_price is non-positive");

  // Non-existent vehicle_id
  const notFoundReq = new Request("http://localhost:3000/api/sales", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      vehicle_id: "non-existent-vehicle-id-9999",
      buyer_name: "Rahul Verma",
      selling_price: 3500000,
    }),
  });
  const notFoundRes = await POST(notFoundReq);
  assert(notFoundRes.status === 404, "API POST returns 404 when vehicle is not found");

  console.log("\n--- 2. SECTION 5: RECORDING A SALE & ATOMIC TRANSITIONS ---");

  // Check initial available vehicles count
  const initialAvailable = await dealershipDb.vehicles.getAll({ status: "Available" });
  const testVehicle = initialAvailable[0];
  assert(Boolean(testVehicle), "Target available vehicle found for sale test", testVehicle?.vehicle_name);

  const purchasePriceNum = parseFloat(String(testVehicle.purchase_price));
  const sellingPriceNum = purchasePriceNum + 450000; // Expected profit: +450,000

  // Record sale via API POST
  const recordReq = new Request("http://localhost:3000/api/sales", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      vehicle_id: testVehicle.id,
      buyer_name: "Siddharth Malhotra",
      selling_price: sellingPriceNum,
      sale_date: "2026-03-20",
    }),
  });
  const recordRes = await POST(recordReq);
  const recordJson = await recordRes.json();

  assert(recordRes.status === 201, "API POST returns 201 Created on valid sale confirmation");
  assert(recordJson.buyer_name === "Siddharth Malhotra", "Sale record has correct buyer name");
  assert(Number(recordJson.selling_price) === sellingPriceNum, "Sale record has correct selling price");

  // Calculated profit check
  const expectedProfit = sellingPriceNum - purchasePriceNum;
  assert(
    Number(recordJson.profit) === expectedProfit,
    "Calculated profit matches Selling Price - Purchase Price exactly",
    `Expected ${expectedProfit}, got ${recordJson.profit}`
  );

  // Verify atomic vehicle status transition
  const updatedVehicle = await dealershipDb.vehicles.getById(testVehicle.id);
  assert(
    updatedVehicle?.status === "Sold",
    "Vehicle status atomically transitioned from 'Available' to 'Sold'"
  );

  // Verify vehicle removed from Available vehicles list
  const availableAfterSale = await dealershipDb.vehicles.getAll({ status: "Available" });
  assert(
    !availableAfterSale.some((v) => v.id === testVehicle.id),
    "Vehicle was removed from Available Vehicles list"
  );

  // Verify vehicle present in Sold vehicles list
  const soldAfterSale = await dealershipDb.vehicles.getAll({ status: "Sold" });
  assert(
    soldAfterSale.some((v) => v.id === testVehicle.id),
    "Vehicle is now present in Sold Vehicles list"
  );

  console.log("\n--- 3. SECTION 5: STRICT DUPLICATE SALE PREVENTION ---");

  // 1. Attempt to sell the SAME vehicle twice via API POST
  const dupSaleReq = new Request("http://localhost:3000/api/sales", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      vehicle_id: testVehicle.id,
      buyer_name: "Imposter Buyer",
      selling_price: 5000000,
    }),
  });
  const dupSaleRes = await POST(dupSaleReq);
  const dupSaleJson = await dupSaleRes.json();

  assert(
    dupSaleRes.status === 409,
    "API POST returns 409 Conflict when attempting to sell an already-sold vehicle"
  );
  assert(
    dupSaleJson.error === "This vehicle has already been sold.",
    "API POST returns exact error message: 'This vehicle has already been sold.'"
  );

  // 2. Attempt to sell already-sold seed vehicle via Server Action
  const seedSoldVehicleId = "b0000000-0000-0000-0000-000000000004"; // Fortuner (already sold in seed)
  const dupActionRes = await createSaleAction({
    vehicle_id: seedSoldVehicleId,
    buyer_name: "Second Buyer",
    selling_price: 3600000,
  });

  assert(
    dupActionRes.success === false,
    "Server Action rejects selling an already sold vehicle"
  );
  assert(
    dupActionRes.statusCode === 409,
    "Server Action returns statusCode 409 for duplicate sale attempt"
  );
  assert(
    dupActionRes.error === "This vehicle has already been sold.",
    "Server Action returns exact error: 'This vehicle has already been sold.'"
  );

  // 3. Attempt directly via repository
  try {
    await dealershipDb.sales.create({
      vehicle_id: seedSoldVehicleId,
      buyer_name: "Direct DB Buyer",
      selling_price: 3700000,
    });
    assert(false, "Repository should have rejected duplicate sale");
  } catch (err: any) {
    assert(
      err.message === "This vehicle has already been sold.",
      "Database repository enforces duplicate prevention with exact error message"
    );
  }

  console.log("\n--- 4. SECTION 4: SOLD VEHICLES QUERY & REQUIRED FIELDS ---");

  // Query GET /api/sales
  const getSalesRes = await GET();
  const salesList = await getSalesRes.json();

  assert(getSalesRes.status === 200, "GET /api/sales returns 200 OK");
  assert(Array.isArray(salesList) && salesList.length >= 3, "All sold vehicles returned in sales list");

  // Check required fields on all sold vehicles:
  // 1. Vehicle name, 2. Reg number, 3. Previous owner, 4. Buyer name, 5. Purchase price, 6. Selling price, 7. Profit, 8. Sale date
  let allFieldsPresent = true;
  for (const s of salesList) {
    const hasName = Boolean(s.vehicle?.vehicle_name);
    const hasReg = Boolean(s.vehicle?.registration_number);
    const hasOwner = Boolean(s.vehicle?.owner_name);
    const hasBuyer = Boolean(s.buyer_name);
    const hasPurchase = s.vehicle?.purchase_price !== undefined;
    const hasSelling = s.selling_price !== undefined;
    const hasProfit = s.profit !== undefined;
    const hasDate = Boolean(s.sale_date);

    if (
      !hasName ||
      !hasReg ||
      !hasOwner ||
      !hasBuyer ||
      !hasPurchase ||
      !hasSelling ||
      !hasProfit ||
      !hasDate
    ) {
      allFieldsPresent = false;
      console.error("Missing field in sale record:", s);
      break;
    }
  }
  assert(
    allFieldsPresent,
    "All sold vehicles include: Vehicle Name, Reg Number, Previous Owner, Buyer Name, Purchase Price, Selling Price, Profit, Sale Date"
  );

  // Currency and profit indicator formatting checks
  const sampleSale = salesList.find((s: any) => s.vehicle_id === testVehicle.id);
  assert(Boolean(sampleSale), "Recorded test sale found in sales list");
  if (sampleSale) {
    const formattedPurchase = formatCurrency(sampleSale.vehicle.purchase_price);
    const formattedSelling = formatCurrency(sampleSale.selling_price);
    const formattedProfit = formatCurrency(sampleSale.profit);

    assert(
      formattedPurchase.startsWith("₹"),
      `Purchase price formatted in ₹ INR: "${formattedPurchase}"`
    );
    assert(
      formattedSelling.startsWith("₹"),
      `Selling price formatted in ₹ INR: "${formattedSelling}"`
    );
    assert(
      formattedProfit.startsWith("₹") && sampleSale.profit > 0,
      `Profit formatted in ₹ INR with positive amount: "${formattedProfit}"`
    );

    const formattedDate = formatDate(sampleSale.sale_date);
    assert(
      formattedDate !== "-",
      `Sale date properly formatted: "${formattedDate}"`
    );
  }

  console.log("\n--- 5. URL QUERY PARAM ?vehicleId=... PRE-SELECTION ---");

  // Verify pre-selection vehicle ID resolution
  const availableVehicles = await dealershipDb.vehicles.getAll({ status: "Available" });
  assert(availableVehicles.length > 0, "Available vehicles exist for pre-selection");
  const preselectCandidate = availableVehicles[0];

  // Lookup vehicle by preselected id
  const resolvedPreselected = await dealershipDb.vehicles.getById(preselectCandidate.id);
  assert(
    resolvedPreselected?.id === preselectCandidate.id,
    `Resolved preselected vehicle ID "${preselectCandidate.id}" matches available vehicle`
  );
  assert(
    Boolean(resolvedPreselected?.registration_number && resolvedPreselected?.owner_name && resolvedPreselected?.purchase_price),
    "Preselected vehicle contains all context fields for auto-filling (Registration, Owner, Purchase Price)"
  );

  console.log("\n========================================================");
  console.log(`TOTAL TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("========================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runSalesVerification().catch((err) => {
  console.error("Test execution encountered an unhandled error:", err);
  process.exit(1);
});
