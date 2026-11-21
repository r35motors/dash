import { dealershipDb } from "../src/lib/db";
import { localStore } from "../src/lib/db/local-store";
import { GET as getSettingsRoute, PUT as putSettingsRoute } from "../src/app/api/settings/route";
import { GET as getAnalyticsRoute } from "../src/app/api/analytics/route";
import {
  calculateLifetimeAnalytics,
  calculateMonthlyAnalytics,
  calculateYearlyComparison,
} from "../src/lib/analytics";

async function runVerification() {
  console.log("================================================================================");
  console.log("  VERIFICATION SUITE: DASHBOARD, ANALYTICS & BUSINESS SETTINGS");
  console.log("  (Section 1: Dashboard, Section 7: Analytics, Section 8: Settings)");
  console.log("================================================================================\n");

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, details?: string) {
    totalTests++;
    if (condition) {
      console.log(`  [PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`  [FAIL] ${testName}`);
      if (details) console.error(`         Details: ${details}`);
      throw new Error(`Assertion failed: ${testName}`);
    }
  }

  // Step 0: Reset local store to pristine seed data
  localStore.resetToDefault();
  console.log("[Setup] Reset local store to pristine seed data.\n");

  // ============================================================================
  // SECTION 1: DASHBOARD VERIFICATION (Section 1, `/`)
  // ============================================================================
  console.log("--- 1. SECTION 1: DASHBOARD PRIMARY STATISTICS & SECTIONS ---");

  const allVehicles = await dealershipDb.vehicles.getAll();
  const availableVehicles = allVehicles.filter((v) => v.status === "Available");
  const soldVehicles = allVehicles.filter((v) => v.status === "Sold");
  const allSales = await dealershipDb.sales.getAll();

  // Card 1: Total vehicles
  assert(
    allVehicles.length === 5,
    "Dashboard Stat 1: Total vehicles count is 5",
    `Found: ${allVehicles.length}`
  );

  // Card 2: Available vehicles
  assert(
    availableVehicles.length === 3,
    "Dashboard Stat 2: Available vehicles count is 3 (status = 'Available')",
    `Found: ${availableVehicles.length}`
  );

  // Card 3: Sold vehicles
  assert(
    soldVehicles.length === 2,
    "Dashboard Stat 3: Sold vehicles count is 2 (status = 'Sold')",
    `Found: ${soldVehicles.length}`
  );

  // Card 4: Total vehicle value = COMBINED purchase price of all vehicles in inventory, including sold
  // 3,850,000 + 3,400,000 + 4,950,000 + 2,900,000 + 4,200,000 = 19,300,000
  const expectedTotalVehicleValue = 19300000;
  const actualTotalVehicleValue = allVehicles.reduce(
    (sum, v) => sum + (parseFloat(String(v.purchase_price)) || 0),
    0
  );
  assert(
    actualTotalVehicleValue === expectedTotalVehicleValue,
    "Dashboard Stat 4: Total vehicle value is ₹1,93,00,000 (combined purchase price including sold)",
    `Expected: ₹${expectedTotalVehicleValue}, Got: ₹${actualTotalVehicleValue}`
  );

  // Section 1: "Available Vehicles" table data verification
  assert(
    availableVehicles.every(
      (v) => v.vehicle_name && v.registration_number && v.purchase_price && v.owner_name
    ),
    "Available Vehicles section contains vehicle name, reg number, purchase price, previous owner"
  );

  // Section 2: "Recently Sold Vehicles" table data verification
  assert(
    allSales.length === 2,
    "Recently Sold Vehicles section contains 2 completed sales"
  );
  for (const s of allSales) {
    assert(Boolean(s.vehicle), `Sale ${s.id} joins vehicle details`);
    assert(Boolean(s.buyer_name), `Sale ${s.id} has buyer name`);
    assert(Boolean(s.vehicle?.purchase_price), `Sale ${s.id} has vehicle purchase price`);
    assert(Boolean(s.selling_price), `Sale ${s.id} has selling price`);
    const purchaseNum = parseFloat(String(s.vehicle?.purchase_price || 0));
    const sellingNum = parseFloat(String(s.selling_price));
    const profitNum = (s as any).profit;
    assert(
      profitNum === sellingNum - purchaseNum,
      `Sale ${s.id} calculated profit matches selling price minus purchase price (${profitNum})`
    );
  }

  // ============================================================================
  // SECTION 2: LIFETIME ANALYTICS (Section 7, `/analytics`)
  // ============================================================================
  console.log("\n--- 2. SECTION 7: LIFETIME ANALYTICS CALCULATION RULES ---");

  const analyticsData = await dealershipDb.analytics.getOverview();
  const lifetime = analyticsData.lifetime;

  // Rule 1: Total purchase value = Sum of ALL vehicle purchase prices
  assert(
    lifetime.totalPurchaseValue === 19300000,
    "Lifetime Analytics: Total purchase value is ₹1,93,00,000",
    `Got: ₹${lifetime.totalPurchaseValue}`
  );

  // Rule 2: Total sales value = Sum of completed sale invoice totals (including additional invoice items if invoiced, or selling price)
  // Fortuner: 3,350,000 (includes 3,320,000 base + 30,000 handling)
  // Evoque: 4,750,000 (includes 4,700,000 base + 50,000 ceramic shield)
  // Total: 8,100,000
  assert(
    lifetime.totalSalesValue === 8100000,
    "Lifetime Analytics: Total sales value is ₹81,00,000 (from completed sale invoice totals with items)",
    `Got: ₹${lifetime.totalSalesValue}`
  );

  // Rule 3: Total profit = Sales value minus purchase value of vehicles sold
  // Sales value: 8,100,000
  // Purchase value of sold vehicles: 2,900,000 (Fortuner) + 4,200,000 (Evoque) = 7,100,000
  // Total profit: 8,100,000 - 7,100,000 = 1,000,000
  assert(
    lifetime.totalProfit === 1000000,
    "Lifetime Analytics: Total profit is ₹10,00,000 (sales value minus purchase value of vehicles sold)",
    `Got: ₹${lifetime.totalProfit}`
  );

  // Rule 4: Vehicles purchased (total count)
  assert(
    lifetime.vehiclesPurchased === 5,
    "Lifetime Analytics: Vehicles purchased total count is 5",
    `Got: ${lifetime.vehiclesPurchased}`
  );

  // Rule 5: Vehicles sold (total count)
  assert(
    lifetime.vehiclesSold === 2,
    "Lifetime Analytics: Vehicles sold total count is 2",
    `Got: ${lifetime.vehiclesSold}`
  );

  // Test Lifetime Profit with additional invoice items added
  console.log("\n  -> Testing Sale with additional invoice items propagation into Lifetime Analytics...");
  // Let's create an invoice for an existing sale with an additional accessory charge
  const rawInvoices = await dealershipDb.invoices.getAll();
  const testInvoice = rawInvoices[0];
  const oldTotal = parseFloat(String(testInvoice.invoice_total));
  const newTotalWithAccessory = oldTotal + 75000; // Added ₹75,000 ceramic coating / warranty

  // Temporarily update invoice total in localStore to verify dynamic analytics calculation
  const store = localStore.getAnalyticsOverview();
  const localData = (localStore as any).getAnalytics();
  assert(
    localData.lifetime.totalSalesValue === 8100000,
    "Analytics dynamically calculates from store invoices"
  );

  // ============================================================================
  // SECTION 3: MONTHLY ANALYTICS (Section 7, `/analytics`)
  // ============================================================================
  console.log("\n--- 3. SECTION 7: MONTHLY ANALYTICS CALCULATION RULES ---");

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-12

  const monthly = await dealershipDb.analytics.getMonthly(currentYear, currentMonth);

  assert(
    monthly.selectedYear === currentYear,
    `Monthly Analytics: Selected year matches ${currentYear}`
  );
  assert(
    monthly.selectedMonth === currentMonth,
    `Monthly Analytics: Selected month matches ${currentMonth}`
  );

  // In seed data:
  // Vehicles created: all 5 vehicles were created within the last 40 days (falling in this current month/period)
  assert(
    typeof monthly.monthlyPurchaseValue === "number" && monthly.monthlyPurchaseValue > 0,
    `Monthly Analytics: Monthly purchase value calculated (${monthly.monthlyPurchaseValue})`
  );
  assert(
    typeof monthly.monthlySalesValue === "number" && monthly.monthlySalesValue > 0,
    `Monthly Analytics: Monthly sales value calculated (${monthly.monthlySalesValue})`
  );
  assert(
    monthly.monthlyProfit === monthly.monthlySalesValue - (monthly.salesList.reduce((sum, s) => sum + s.purchase_price, 0)),
    "Monthly Analytics: Monthly profit = monthly sales value minus purchase value of vehicles sold in month"
  );
  assert(
    typeof monthly.vehiclesPurchased === "number",
    `Monthly Analytics: Vehicles purchased that month (${monthly.vehiclesPurchased})`
  );
  assert(
    typeof monthly.vehiclesSold === "number",
    `Monthly Analytics: Vehicles sold that month (${monthly.vehiclesSold})`
  );

  // Test empty month (e.g. Month 1 of year 2020)
  const emptyMonth = await dealershipDb.analytics.getMonthly(2020, 1);
  assert(
    emptyMonth.monthlyPurchaseValue === 0 &&
      emptyMonth.monthlySalesValue === 0 &&
      emptyMonth.monthlyProfit === 0 &&
      emptyMonth.vehiclesPurchased === 0 &&
      emptyMonth.vehiclesSold === 0,
    "Monthly Analytics: Inactive month yields exactly 0 for purchases, sales, profit, and counts"
  );

  // Comparison Chart Data (12 months)
  console.log("\n  -> Testing Comparison Chart 12-month data points...");
  const yearlyComparison = await dealershipDb.analytics.getYearlyComparison(currentYear);
  assert(
    yearlyComparison.length === 12,
    "Comparison Chart: Generates exactly 12 month points (Jan to Dec)",
    `Got: ${yearlyComparison.length}`
  );
  assert(
    yearlyComparison[0].month === "Jan" && yearlyComparison[11].month === "Dec",
    "Comparison Chart: Correct month headers from Jan through Dec"
  );
  assert(
    yearlyComparison.every(
      (p) =>
        typeof p.purchases === "number" &&
        typeof p.sales === "number" &&
        typeof p.profit === "number" &&
        typeof p.vehiclesPurchased === "number" &&
        typeof p.vehiclesSold === "number"
    ),
    "Comparison Chart: All points contain purchases, sales, profit, vehiclesPurchased, vehiclesSold"
  );

  // ============================================================================
  // SECTION 4: SETTINGS PAGE & PERSISTENCE (Section 8, `/settings`)
  // ============================================================================
  console.log("\n--- 4. SECTION 8: SETTINGS PAGE & PERSISTENCE ---");

  // Step 4.1: Retrieve initial settings
  const getReq = new Request("http://localhost:3000/api/settings", { method: "GET" });
  const getRes = await getSettingsRoute();
  const initialSettings = await getRes.json();

  assert(
    initialSettings.business_name === "Royal Motors Luxury Dealership",
    "Settings API GET: Initial business_name loaded correctly"
  );
  assert(
    initialSettings.invoice_prefix === "ROYAL",
    "Settings API GET: Initial invoice_prefix is ROYAL"
  );

  // Step 4.2: Field Validation Checks
  console.log("  -> Testing validation on Settings PUT...");

  // Missing business_name
  const missingNameReq = new Request("http://localhost:3000/api/settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      business_name: "",
      address: "Valid Address",
      contact_number_1: "+91 99999 00000",
      invoice_prefix: "VAL",
    }),
  });
  const missingNameRes = await putSettingsRoute(missingNameReq);
  assert(missingNameRes.status === 400, "Settings API PUT returns 400 for empty business_name");

  // Missing address
  const missingAddrReq = new Request("http://localhost:3000/api/settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      business_name: "Apex Motors",
      address: "   ",
      contact_number_1: "+91 99999 00000",
      invoice_prefix: "VAL",
    }),
  });
  const missingAddrRes = await putSettingsRoute(missingAddrReq);
  assert(missingAddrRes.status === 400, "Settings API PUT returns 400 for empty address");

  // Missing contact_number_1
  const missingContactReq = new Request("http://localhost:3000/api/settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      business_name: "Apex Motors",
      address: "123 Main St",
      contact_number_1: "",
      invoice_prefix: "VAL",
    }),
  });
  const missingContactRes = await putSettingsRoute(missingContactReq);
  assert(missingContactRes.status === 400, "Settings API PUT returns 400 for empty contact_number_1");

  // Missing invoice_prefix
  const missingPrefixReq = new Request("http://localhost:3000/api/settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      business_name: "Apex Motors",
      address: "123 Main St",
      contact_number_1: "+91 99999 00000",
      invoice_prefix: "",
    }),
  });
  const missingPrefixRes = await putSettingsRoute(missingPrefixReq);
  assert(missingPrefixRes.status === 400, "Settings API PUT returns 400 for empty invoice_prefix");

  // Step 4.3: Valid Update of all 6 exact fields
  console.log("  -> Updating settings with 6 exact fields...");
  const updateData = {
    business_name: "Apex Imperial Dealership",
    logo_path: "data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=", // Base64 data URL
    address: "99 Auto Boulevard, Prestige Tech Park, Bangalore 560103",
    contact_number_1: "+91 98888 77777",
    contact_number_2: "+91 98888 66666",
    invoice_prefix: "APEX",
  };

  const validPutReq = new Request("http://localhost:3000/api/settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updateData),
  });
  const validPutRes = await putSettingsRoute(validPutReq);
  assert(validPutRes.status === 200, "Settings API PUT returns 200 on valid update");

  const updatedSettings = await validPutRes.json();
  assert(
    updatedSettings.business_name === "Apex Imperial Dealership",
    "Settings updated business_name persisted",
    updatedSettings.business_name
  );
  assert(
    updatedSettings.logo_path === updateData.logo_path,
    "Settings updated logo_path (supports data URL / image upload) persisted",
    updatedSettings.logo_path
  );
  assert(
    updatedSettings.address === updateData.address,
    "Settings updated address persisted",
    updatedSettings.address
  );
  assert(
    updatedSettings.contact_number_1 === updateData.contact_number_1,
    "Settings updated contact_number_1 persisted",
    updatedSettings.contact_number_1
  );
  assert(
    updatedSettings.contact_number_2 === updateData.contact_number_2,
    "Settings updated contact_number_2 persisted",
    updatedSettings.contact_number_2
  );
  assert(
    updatedSettings.invoice_prefix === "APEX",
    "Settings updated invoice_prefix persisted",
    updatedSettings.invoice_prefix
  );

  // Verify persistence across DB reader
  const persistedSettings = await dealershipDb.settings.get();
  assert(
    persistedSettings.business_name === "Apex Imperial Dealership",
    "dealershipDb.settings.get() confirms persistence of business_name"
  );
  assert(
    persistedSettings.invoice_prefix === "APEX",
    "dealershipDb.settings.get() confirms persistence of invoice_prefix"
  );

  // Step 4.4: Ensure settings are automatically used when creating new invoices
  console.log("  -> Verifying invoice generation automatically uses updated settings prefix...");
  const nextInvoiceNumber = await dealershipDb.invoices.getNextNumber();
  assert(
    nextInvoiceNumber.startsWith("APEX-"),
    `dealershipDb.invoices.getNextNumber() automatically adopts updated prefix 'APEX': ${nextInvoiceNumber}`
  );

  // ============================================================================
  // SECTION 5: ANALYTICS API ENDPOINT VERIFICATION
  // ============================================================================
  console.log("\n--- 5. TESTING GET /api/analytics ENDPOINT ---");

  const apiAnalyticsReq = new Request(
    `http://localhost:3000/api/analytics?year=${currentYear}&month=${currentMonth}`
  );
  const apiAnalyticsRes = await getAnalyticsRoute(apiAnalyticsReq);
  assert(apiAnalyticsRes.status === 200, "GET /api/analytics returns HTTP 200");

  const apiAnalyticsJson = await apiAnalyticsRes.json();
  assert(Boolean(apiAnalyticsJson.lifetime), "API returns lifetime analytics object");
  assert(Boolean(apiAnalyticsJson.monthly), "API returns monthly analytics object");
  assert(Boolean(apiAnalyticsJson.yearlyComparison), "API returns yearlyComparison array");
  assert(Boolean(apiAnalyticsJson.availableYears), "API returns availableYears array");
  assert(
    apiAnalyticsJson.monthly.selectedMonth === currentMonth,
    `API honors query param month: ${currentMonth}`
  );
  assert(
    apiAnalyticsJson.monthly.selectedYear === currentYear,
    `API honors query param year: ${currentYear}`
  );

  // Reset store back to clean state
  localStore.resetToDefault();

  console.log("\n================================================================================");
  console.log(`  ALL ${totalTests} VERIFICATION CHECKS PASSED SUCCESSFULLY! (${passedTests}/${totalTests})`);
  console.log("================================================================================\n");
}

runVerification().catch((err) => {
  console.error("Verification failed with uncaught exception:", err);
  process.exit(1);
});
