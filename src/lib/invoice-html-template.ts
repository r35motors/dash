import { numberToIndianWords } from "@/lib/utils";
import { DEFAULT_DEALERSHIP_LOGO, DEFAULT_DEALERSHIP_NAME } from "@/lib/constants/branding";

export interface InvoiceTemplateData {
  invoice_number: string;
  invoice_date: string;
  dealership?: {
    business_name: string;
    logo_path?: string | null;
    address: string;
    contact_number_1: string;
    contact_number_2?: string | null;
    invoice_prefix?: string;
  };
  buyer?: {
    name: string;
  };
  vehicle?: {
    vehicle_name: string;
    registration_number: string;
    owner_name: string;
    purchase_price?: string | number;
    selling_price?: string | number;
  };
  items?: Array<{
    description: string;
    amount: string | number;
  }>;
  invoice_total?: string | number;
  amount_in_words?: string;
  invoice_snapshot?: any;
}

export function formatInr(val: string | number | undefined | null): string {
  if (val === undefined || val === null || val === "") return "0";
  const num = typeof val === "number" ? val : parseFloat(String(val).replace(/,/g, ""));
  if (isNaN(num)) return "0";
  return num.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  });
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime())
      ? dateStr
      : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return dateStr;
  }
}

export function generateInvoiceHtml(data: InvoiceTemplateData): string {
  const snapshot = data.invoice_snapshot;
  const rawLogo =
    snapshot?.dealership?.logo_path ||
    snapshot?.logo_path ||
    data.dealership?.logo_path ||
    null;

  // Use the dealership logo or fallback to R35 official emblem
  const effectiveLogo =
    rawLogo && rawLogo.trim() !== "" && rawLogo !== "/dealership-logo.svg"
      ? (rawLogo === "/dealership-logo.png" || rawLogo === "/logo.png" ? DEFAULT_DEALERSHIP_LOGO : rawLogo)
      : DEFAULT_DEALERSHIP_LOGO;

  const dealership = {
    business_name:
      snapshot?.dealership?.business_name ||
      snapshot?.dealership_name ||
      data.dealership?.business_name ||
      DEFAULT_DEALERSHIP_NAME,
    logo_path: effectiveLogo,
    address:
      snapshot?.dealership?.address ||
      snapshot?.dealership_address ||
      data.dealership?.address ||
      "Plot 42, Highline Auto Corridor, MG Road, Bangalore 560001",
    contact_number_1:
      snapshot?.dealership?.contact_number_1 ||
      snapshot?.dealership_contact_1 ||
      data.dealership?.contact_number_1 ||
      "+91 98765 43210",
    contact_number_2:
      snapshot?.dealership?.contact_number_2 ||
      snapshot?.dealership_contact_2 ||
      data.dealership?.contact_number_2 ||
      "+91 98765 43211",
  };

  const buyerName =
    snapshot?.buyer?.name ||
    snapshot?.buyer_name ||
    data.buyer?.name ||
    "Valued Customer";

  const vehicle = snapshot?.vehicle || data.vehicle;

  // Collect items
  let items: Array<{ description: string; amount: string | number }> = [];
  if (snapshot?.items && snapshot.items.length > 0) {
    items = snapshot.items;
  } else if (data.items && data.items.length > 0) {
    items = data.items;
  } else if (vehicle) {
    items = [
      {
        description: `Vehicle: ${vehicle.vehicle_name} (${vehicle.registration_number})`,
        amount: data.invoice_total || vehicle.selling_price || 0,
      },
    ];
  }

  const totalNum =
    snapshot?.invoice_total !== undefined
      ? parseFloat(String(snapshot.invoice_total))
      : data.invoice_total !== undefined
      ? parseFloat(String(data.invoice_total))
      : items.reduce((sum, item) => sum + (parseFloat(String(item.amount)) || 0), 0);

  const amountInWords =
    snapshot?.amount_in_words ||
    data.amount_in_words ||
    numberToIndianWords(totalNum);

  const invoiceNumber = data.invoice_number || snapshot?.invoice_number || "INV-1001";
  const dateFormatted = formatDate(data.invoice_date || snapshot?.invoice_date);

  // Generate dealership initials for overlay fallback (e.g., "RM")
  const initials = dealership.business_name
    .split(/\s+/)
    .slice(0, 2)
    .map((w: string) => w[0]?.toUpperCase() || "")
    .join("") || "RM";

  // Build items rows
  const itemRowsHtml = items
    .map((item, idx) => {
      return `<tr><td>${idx + 1}</td><td>${item.description}</td><td>₹${formatInr(item.amount)}</td></tr>`;
    })
    .join("\n");

  const hasLogo = Boolean(
    dealership.logo_path &&
    dealership.logo_path.trim() !== ""
  );

  return `<!doctype html><html><head><meta charset="utf-8">
<title>Invoice - ${invoiceNumber}</title>
<style>
@page{size:A4;margin:0}
*{box-sizing:border-box;margin:0;padding:0}
body{
  -webkit-text-size-adjust:none;
  font-family:'Inter',system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
  color:#1a1f2b;
  font-size:10pt;
  width:210mm;
  min-height:297mm;
  padding:16mm 16mm 12mm;
  position:relative;
  background:#ffffff;
  margin:0 auto;
}
/* Top thick color border completely removed as requested */
.head{display:flex;justify-content:space-between;align-items:flex-start;margin-top:2mm}
.brandrow{display:flex;gap:5mm;align-items:center}

/* Logo block — R35 Motors official emblem */
.logo-block{
  width:32mm;
  height:14mm;
  flex:none;
  position:relative;
  display:flex;
  align-items:center;
  justify-content:center;
  background:transparent;
}
.logo-block.has-logo{
  width:32mm;
  height:14mm;
  background:transparent;
  border:none;
  box-shadow:none;
}
.logo-overlay{
  position:relative;
  display:flex;
  align-items:center;
  justify-content:center;
  width:100%;
  height:100%;
}
.logo-overlay img{
  max-width:100%;
  max-height:100%;
  object-fit:contain;
  display:block;
}

.brand h1{font-size:15pt;font-weight:700;color:#14213d;letter-spacing:-.2px;line-height:1.2}
.brand .tag{font-size:8pt;letter-spacing:2.2px;color:#8a6d1f;font-weight:600;margin-top:2mm}
.brand p{font-size:9pt;color:#566074;margin-top:4mm;line-height:1.6}
.title{text-align:right}
.title h2{font-size:22pt;font-weight:300;letter-spacing:3px;color:#14213d}
.title .copy{font-size:8pt;letter-spacing:1.6px;color:#566074;margin-top:1.5mm}
.paid{display:inline-block;margin-top:4mm;border:1.4px solid #1e7a4d;color:#1e7a4d;font-weight:700;font-size:9pt;letter-spacing:2px;padding:1.8mm 4mm;border-radius:2px;background:#f0fdf4}
hr{border:0;border-top:1px solid #dfe3ea;margin:9mm 0 7mm}
.meta{display:flex;justify-content:space-between}
.lbl{font-size:8pt;letter-spacing:1.6px;color:#8a93a5;font-weight:600;margin-bottom:2.5mm;text-transform:uppercase}
.cust .n{font-size:12pt;font-weight:600;color:#14213d}
.cust .r{font-size:9pt;color:#566074;margin-top:1mm}
table.kv{border-collapse:collapse}
table.kv td{padding:1.4mm 0;font-size:10pt}
table.kv td:first-child{color:#8a93a5;padding-right:10mm}
table.kv td:last-child{text-align:right;font-weight:600;color:#14213d}
table.items{width:100%;border-collapse:collapse;margin-top:11mm}
.items th{background:#14213d;color:#fff;font-size:8pt;letter-spacing:1.6px;font-weight:600;text-align:left;padding:3.2mm 4mm}
.items th:last-child,.items td:last-child{text-align:right}
.items th:first-child,.items td:first-child{width:12mm;text-align:center;padding-left:0;padding-right:0}
.items td{padding:4.6mm 4mm;border-bottom:1px solid #e6e9ef;font-size:10pt}
.items td:first-child{color:#8a93a5}
.items td:last-child{font-weight:500;font-variant-numeric:tabular-nums}
.bottom{display:flex;justify-content:space-between;margin-top:9mm}
.words{width:95mm}
.words .w{text-wrap:balance;font-size:10pt;font-weight:500;color:#14213d;line-height:1.5}
.words .note{font-size:9pt;color:#566074;margin-top:6mm;line-height:1.6}
.tot{width:72mm}
.tot .row{display:flex;justify-content:space-between;padding:2mm 0;font-size:10pt;color:#566074}
.tot .row b{color:#14213d;font-weight:600}
.tot .grand{display:flex;justify-content:space-between;align-items:center;background:#14213d;color:#fff;padding:3.6mm 4mm;margin-top:2mm;border-radius:2px}
.tot .grand span{font-size:8pt;letter-spacing:1.6px;font-weight:600}
.tot .grand b{font-size:12pt;font-weight:700}
.sign{position:absolute;right:16mm;bottom:30mm;width:65mm;text-align:center}
.sign .line{border-top:1px solid #14213d;padding-top:2mm;font-size:9pt;font-weight:600;color:#14213d}
.sign .for{font-size:8pt;color:#566074;margin-top:1mm}
.foot{position:absolute;left:16mm;right:16mm;bottom:10mm;border-top:1px solid #dfe3ea;padding-top:3mm;display:flex;justify-content:space-between;font-size:8pt;color:#8a93a5}
@media print{
  body{padding:14mm 14mm 10mm}
}
</style></head><body>
<div class="head">
 <div class="brand">
   <div class="brandrow">
     <div class="logo-block has-logo">
       <div class="logo-overlay"><img src="${dealership.logo_path || DEFAULT_DEALERSHIP_LOGO}" alt="${dealership.business_name} Logo" /></div>
     </div>
     <div>
       <h1>${dealership.business_name}</h1>
     </div>
   </div>
   <p>${dealership.address}<br>Phone: ${dealership.contact_number_1}${
    dealership.contact_number_2 ? ` | ${dealership.contact_number_2}` : ""
  }</p>
 </div>
 <div class="title">
   <h2>INVOICE</h2>
   <div class="paid">PAID IN FULL</div>
 </div>
</div>
<hr>
<div class="meta">
 <div class="cust">
   <div class="lbl">BILLED TO (CUSTOMER)</div>
   <div class="n">${buyerName}</div>
   <div class="r">Authorized Vehicle Purchaser</div>
 </div>
 <table class="kv">
   <tr><td>Invoice Number</td><td>${invoiceNumber}</td></tr>
   <tr><td>Date of Issue</td><td>${dateFormatted}</td></tr>
 </table>
</div>
<table class="items">
  <thead>
    <tr>
      <th>#</th>
      <th>DESCRIPTION</th>
      <th>AMOUNT (₹)</th>
    </tr>
  </thead>
  <tbody>
    ${itemRowsHtml}
  </tbody>
</table>
<div class="bottom">
 <div class="words">
   <div class="lbl">AMOUNT IN WORDS (INR)</div>
   <div class="w">${amountInWords}</div>
 </div>
 <div class="tot">
   <div class="row"><span>Subtotal</span><b>₹${formatInr(totalNum)}</b></div>
   <div class="grand"><span>INVOICE TOTAL</span><b>₹${formatInr(totalNum)}</b></div>
 </div>
</div>
<div class="foot">
  <span>${dealership.business_name} • ${dealership.address}</span>
  <span>Invoice</span>
</div>
</body></html>`;
}
