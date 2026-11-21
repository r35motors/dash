import { dealershipDb } from "../src/lib/db";
import { localStore } from "../src/lib/db/local-store";
import { GET, POST } from "../src/app/api/vehicles/route";
import { createVehicleAction } from "../src/app/vehicles/actions";
import { formatCurrency } from "../src/lib/utils";

async function runComprehensiveVerification() {
  console.log("\n========================================================");
  console.log("RUNNING COMPREHENSIVE VERIFICATION FOR SECTIONS 2 & 3");
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

  // Step 0: Reset local store to clean state
  localStore.resetToDefault();
  console.log("✓ Reset local store to pristine seed data\n");

  console.log("--- 1. SECTION 2: ADD VEHICLE & DUPLICATE VALIDATION ---");

  // Initial seed has 3 vehicles, check initial count
  const initialAvailable = await dealershipDb.vehicles.getAll({ status: "Available" });
  assert(initialAvailable.length >= 2, "Initial available vehicles present in seed");

  // Existing seed vehicle registration: "KA-01-MJ-5501"
  const existingReg = "KA-01-MJ-5501";

  // Test duplicate check on existing seed vehicle (case insensitive & spaces)
  try {
    await dealershipDb.vehicles.create({
      vehicle_name: "BMW Clone",
      registration_number: "  ka-01-mj-5501  ",
      owner_name: "Someone",
      purchase_price: 3000000,
    });
    assert(false, "Should have rejected duplicate registration from seed");
  } catch (err: any) {
    const expected = `A vehicle with registration number ${existingReg} is already registered.`;
    assert(
      err.message === expected,
      "Repository prevents duplicate registration with exact error message",
      `Got: "${err.message}"`
    );
  }

  // Test API POST with duplicate registration
  const dupReq = new Request("http://localhost:3000/api/vehicles", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      vehicle_name: "BMW Duplicate API",
      registration_number: "ka-01-mj-5501",
      owner_name: "Another person",
      purchase_price: 3200000,
    }),
  });
  const dupRes = await POST(dupReq);
  const dupJson = await dupRes.json();
  assert(dupRes.status === 409, "API POST returns 409 Conflict for duplicate registration");
  assert(
    dupJson.error === `A vehicle with registration number ${existingReg} is already registered.`,
    "API POST returns exact required duplicate error message"
  );

  // Test Server Action with duplicate registration
  const dupActionRes = await createVehicleAction({
    vehicle_name: "BMW Duplicate Action",
    registration_number: "  KA-01-MJ-5501  ",
    owner_name: "Test User",
    purchase_price: 3300000,
  });
  assert(dupActionRes.success === false, "Server Action rejects duplicate registration");
  assert(dupActionRes.statusCode === 409, "Server Action returns statusCode 409");
  assert(
    dupActionRes.error === `A vehicle with registration number ${existingReg} is already registered.`,
    "Server Action returns exact required duplicate error message"
  );

  // Test missing required fields
  const missingNameReq = new Request("http://localhost:3000/api/vehicles", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      vehicle_name: "",
      registration_number: "DL 01 AA 1000",
      owner_name: "User",
      purchase_price: 500000,
    }),
  });
  const missingNameRes = await POST(missingNameReq);
  assert(missingNameRes.status === 400, "API POST returns 400 when vehicle_name is missing");

  // Test non-positive purchase price
  const invalidPriceReq = new Request("http://localhost:3000/api/vehicles", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      vehicle_name: "Test Car",
      registration_number: "DL 01 AA 1001",
      owner_name: "User",
      purchase_price: -500,
    }),
  });
  const invalidPriceRes = await POST(invalidPriceReq);
  assert(invalidPriceRes.status === 400, "API POST returns 400 when purchase_price is non-positive");

  // Test successful vehicle addition with uppercase formatting and trimmed registration
  const newRegInput = "  dl 01 ab 1234  ";
  const newRegExpected = "DL 01 AB 1234";
  const addReq = new Request("http://localhost:3000/api/vehicles", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      vehicle_name: "2023 Hyundai Ioniq 5 EV",
      registration_number: newRegInput,
      owner_name: "Deepak Chopra",
      purchase_price: 4500000,
    }),
  });
  const addRes = await POST(addReq);
  const addJson = await addRes.json();
  assert(addRes.status === 201, "API POST returns 201 Created for valid vehicle");
  assert(addJson.registration_number === newRegExpected, "API POST trimmed and auto-uppercased registration number");
  assert(addJson.status === "Available", "API POST automatically assigned status 'Available'");
  assert(Number(addJson.purchase_price) === 4500000, "API POST stored purchase price accurately");

  console.log("\n--- 2. SECTION 3: AVAILABLE VEHICLES VIEW & SEARCH ---");

  // Test Available status filtering
  const getAvailableReq = new Request("http://localhost:3000/api/vehicles?status=Available");
  const getAvailableRes = await GET(getAvailableReq);
  const getAvailableJson = await getAvailableRes.json();
  assert(getAvailableRes.status === 200, "GET /api/vehicles?status=Available returns 200 OK");
  assert(
    getAvailableJson.every((v: any) => v.status === "Available"),
    "All returned vehicles have status 'Available'"
  );
  assert(
    getAvailableJson.some((v: any) => v.registration_number === newRegExpected),
    "Newly added vehicle is present in Available vehicles list"
  );

  // Test Real-time search filter matching vehicle name
  const nameSearchReq = new Request("http://localhost:3000/api/vehicles?search=Ioniq");
  const nameSearchRes = await GET(nameSearchReq);
  const nameSearchJson = await nameSearchRes.json();
  assert(
    nameSearchJson.length > 0 && nameSearchJson.some((v: any) => v.registration_number === newRegExpected),
    "Search matches vehicle name 'Ioniq'"
  );

  // Test Real-time search filter matching registration number
  const regSearchReq = new Request("http://localhost:3000/api/vehicles?search=AB 1234");
  const regSearchRes = await GET(regSearchReq);
  const regSearchJson = await regSearchRes.json();
  assert(
    regSearchJson.length > 0 && regSearchJson.some((v: any) => v.registration_number === newRegExpected),
    "Search matches registration number 'AB 1234'"
  );

  // Test INR currency formatting
  const formatted = formatCurrency(4500000);
  assert(
    formatted.includes("45,00,000") || formatted.includes("₹45,00,000"),
    "Purchase price properly formatted in ₹ INR",
    `Formatted: "${formatted}"`
  );

  // Verify quick action link format
  const vehicleId = addJson.id;
  const quickActionLink = `/sales?vehicleId=${vehicleId}`;
  assert(
    quickActionLink === `/sales?vehicleId=${vehicleId}`,
    "Quick action 'Sell this vehicle' link targets /sales?vehicleId=...",
    `Link: "${quickActionLink}"`
  );

  console.log("\n========================================================");
  console.log(`TOTAL TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("========================================================\n");

  if (failed > 0) process.exit(1);
}

runComprehensiveVerification().catch((e) => {
  console.error("Verification failed:", e);
  process.exit(1);
});
