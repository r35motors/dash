import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Svg,
  Path,
  Rect,
  Image,
} from "@react-pdf/renderer";
import { numberToIndianWords } from "@/lib/utils";
import type { InvoicePdfData } from "@/types/invoice";

export type { InvoicePdfData };

// Executive A4 PDF Stylesheet matching the specified template:
// - Top thick color bar removed
// - Deep Navy #14213D headers and accents
// - Gold #8A6D1F brand tag
// - Muted #566074 metadata & #8A93A5 labels
// - Paid in full green #1E7A4D badge
// - Clean dividers #DFE3EA and item borders #E6E9EF
const styles = StyleSheet.create({
  page: {
    size: "A4",
    backgroundColor: "#FFFFFF",
    paddingTop: 36,
    paddingBottom: 36,
    paddingHorizontal: 40,
    fontFamily: "Helvetica",
    fontSize: 9.5,
    color: "#1A1F2B",
    lineHeight: 1.45,
    position: "relative",
  },
  // Dealership Header
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  brandLeft: {
    maxWidth: "58%",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  // Logo block with black spade background and logo/initials overlay
  logoBlock: {
    width: 54,
    height: 54,
    borderRadius: 8,
    backgroundColor: "#0B1329",
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  logoBlockHasLogo: {
    width: 74,
    height: 44,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.2,
    borderColor: "#E2E8F0",
  },
  logoImage: {
    position: "absolute",
    width: 66,
    height: 38,
    objectFit: "contain",
  },
  logoOverlayText: {
    position: "absolute",
    color: "#F8FAFC",
    fontFamily: "Helvetica-Bold",
    fontSize: 14,
    letterSpacing: 0.5,
    textAlign: "center",
  },
  brandTitle: {
    fontSize: 15,
    fontFamily: "Helvetica-Bold",
    color: "#14213D",
    letterSpacing: -0.2,
  },
  brandTag: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: "#8A6D1F",
    letterSpacing: 1.8,
    marginTop: 2,
    textTransform: "uppercase",
  },
  brandMeta: {
    fontSize: 8.5,
    color: "#566074",
    lineHeight: 1.45,
    marginTop: 4,
  },
  headerRight: {
    alignItems: "flex-end",
    maxWidth: "40%",
  },
  invoiceTitle: {
    fontSize: 22,
    fontFamily: "Helvetica",
    color: "#14213D",
    letterSpacing: 3,
  },
  invoiceCopy: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: "#566074",
    marginTop: 2,
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  paidBadge: {
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 3.5,
    borderWidth: 1.4,
    borderColor: "#1E7A4D",
    borderRadius: 2,
    backgroundColor: "#F0FDF4",
  },
  paidBadgeText: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: "#1E7A4D",
    letterSpacing: 1.8,
  },
  // Thin Clean Divider
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#DFE3EA",
    marginVertical: 14,
  },
  // Meta Info Section
  metaSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  customerBox: {
    width: "55%",
  },
  metaLabel: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: "#8A93A5",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  customerName: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: "#14213D",
    marginBottom: 2,
  },
  customerRole: {
    fontSize: 8.5,
    color: "#566074",
  },
  kvTable: {
    width: "40%",
    alignItems: "flex-end",
  },
  kvRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingVertical: 2,
  },
  kvKey: {
    fontSize: 8.5,
    color: "#8A93A5",
  },
  kvValue: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#14213D",
    textAlign: "right",
  },
  // Items Table
  table: {
    width: "100%",
    marginTop: 10,
    marginBottom: 18,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#14213D",
    paddingVertical: 7,
    paddingHorizontal: 8,
  },
  thIndex: {
    width: "8%",
    color: "#FFFFFF",
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    letterSpacing: 1.2,
  },
  thDesc: {
    width: "66%",
    color: "#FFFFFF",
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    textAlign: "left",
    letterSpacing: 1.2,
  },
  thAmount: {
    width: "26%",
    color: "#FFFFFF",
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    textAlign: "right",
    letterSpacing: 1.2,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E6E9EF",
    alignItems: "center",
  },
  tdIndex: {
    width: "8%",
    fontSize: 8.5,
    color: "#8A93A5",
    textAlign: "center",
  },
  tdDesc: {
    width: "66%",
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#1A1F2B",
  },
  tdAmount: {
    width: "26%",
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#14213D",
    textAlign: "right",
  },
  // Bottom Financial Summary
  bottomSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginTop: 12,
  },
  wordsBox: {
    width: "55%",
  },
  wordsText: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color: "#14213D",
    lineHeight: 1.45,
  },
  totalsBox: {
    width: "40%",
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
    fontSize: 9,
    color: "#566074",
  },
  totalsRowBold: {
    fontFamily: "Helvetica-Bold",
    color: "#14213D",
  },
  grandTotalBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#14213D",
    color: "#FFFFFF",
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginTop: 6,
    borderRadius: 2,
  },
  grandTotalLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#FFFFFF",
    letterSpacing: 1.4,
  },
  grandTotalAmount: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: "#FFFFFF",
  },
  // Signature Block
  signatureBox: {
    position: "absolute",
    right: 40,
    bottom: 50,
    width: 140,
    alignItems: "center",
  },
  signatureLine: {
    width: "100%",
    borderTopWidth: 1,
    borderTopColor: "#14213D",
    paddingTop: 4,
    alignItems: "center",
  },
  signatureTitle: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: "#14213D",
  },
  signatureFor: {
    fontSize: 7.5,
    color: "#566074",
    marginTop: 2,
  },
  // Footer
  footer: {
    position: "absolute",
    left: 40,
    right: 40,
    bottom: 20,
    borderTopWidth: 1,
    borderTopColor: "#DFE3EA",
    paddingTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7.5,
    color: "#8A93A5",
  },
});

function formatInr(val: number | string | undefined | null): string {
  if (val === undefined || val === null || val === "") return "0";
  const num = typeof val === "number" ? val : parseFloat(String(val).replace(/,/g, ""));
  if (isNaN(num)) return "0";
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(num);
}

function formatDateDisplay(dateStr: string | undefined): string {
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

export function InvoicePdfDocument({ data }: { data: InvoicePdfData }) {
  const snapshot = data.invoice_snapshot;

  const rawLogo =
    (snapshot?.dealership?.logo_path && snapshot.dealership.logo_path !== "/dealership-logo.png"
      ? snapshot.dealership.logo_path
      : null) ||
    (data.dealership?.logo_path && data.dealership.logo_path !== "/dealership-logo.png"
      ? data.dealership.logo_path
      : null) ||
    null;

  const dealership = {
    business_name:
      snapshot?.dealership?.business_name ||
      snapshot?.dealership_name ||
      data.dealership?.business_name ||
      "R35 MOTORS",
    logo_path: rawLogo,
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
      null,
  };

  const buyerName =
    snapshot?.buyer?.name ||
    snapshot?.buyer_name ||
    data.buyer?.name ||
    "Valued Customer";

  const vehicle = snapshot?.vehicle || data.vehicle;

  // Line items
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

  // Total
  const totalAmount =
    snapshot?.invoice_total ??
    data.invoice_total ??
    items.reduce((acc, it) => acc + (parseFloat(String(it.amount)) || 0), 0);

  const totalNum = parseFloat(String(totalAmount)) || 0;

  // Amount in words
  const amountInWords =
    snapshot?.amount_in_words ||
    data.amount_in_words ||
    numberToIndianWords(totalNum);

  const invoiceNumber = data.invoice_number || snapshot?.invoice_number || "INV-1001";
  const invoiceDate = data.invoice_date || snapshot?.invoice_date || new Date().toISOString();

  const initials = dealership.business_name
    .split(/\s+/)
    .slice(0, 2)
    .map((w: string) => w[0]?.toUpperCase() || "")
    .join("") || "RM";

  const hasLogo = Boolean(
    dealership.logo_path &&
    dealership.logo_path.trim() !== "" &&
    dealership.logo_path !== "/dealership-logo.png"
  );

  return (
    <Document title={`Invoice-${invoiceNumber}`} author={dealership.business_name}>
      <Page size="A4" style={styles.page}>
        {/* Top thick color border completely removed */}

        {/* 1. Brand & Title Header */}
        <View style={styles.headerContainer}>
          <View style={styles.brandLeft}>
            <View style={styles.brandRow}>
              {/* Logo block: show uploaded logo if set, else spade + initials */}
              <View style={[styles.logoBlock, ...(hasLogo ? [styles.logoBlockHasLogo] : [])]}>
                {hasLogo ? (
                  /* Uploaded logo — render directly, fills the block */
                  <Image
                    src={dealership.logo_path!}
                    style={styles.logoImage}
                  />
                ) : (
                  /* Fallback: black spade badge with initials */
                  <>
                    <Svg width="54" height="54" viewBox="0 0 36 36">
                      {/* Black spade silhouette with gold rim */}
                      <Path
                        d="M 18 2 C 14.5 7.5 6 13.5 6 20 C 6 24.5 9.5 27.5 13.5 27.5 C 16 27.5 17.5 26.2 18 24.5 C 18.5 26.2 20 27.5 22.5 27.5 C 26.5 27.5 30 24.5 30 20 C 30 13.5 21.5 7.5 18 2 Z"
                        fill="#000000"
                        stroke="#C9A227"
                        strokeWidth="0.8"
                      />
                      <Path
                        d="M 16 26 L 20 26 L 21 33 L 15 33 Z"
                        fill="#000000"
                        stroke="#C9A227"
                        strokeWidth="0.8"
                      />
                    </Svg>
                    {/* Center initials overlay */}
                    <Text style={styles.logoOverlayText}>{initials}</Text>
                  </>
                )}
              </View>

              <View>
                <Text style={styles.brandTitle}>{dealership.business_name}</Text>
              </View>
            </View>

            <Text style={styles.brandMeta}>
              {dealership.address}
              {"\n"}
              Phone: {dealership.contact_number_1}
              {dealership.contact_number_2 ? ` | ${dealership.contact_number_2}` : ""}
            </Text>
          </View>

          <View style={styles.headerRight}>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <View style={styles.paidBadge}>
              <Text style={styles.paidBadgeText}>PAID IN FULL</Text>
            </View>
          </View>
        </View>

        {/* Thin Divider */}
        <View style={styles.divider} />

        {/* 2. Customer & Transaction Meta */}
        <View style={styles.metaSection}>
          <View style={styles.customerBox}>
            <Text style={styles.metaLabel}>Billed To (Customer)</Text>
            <Text style={styles.customerName}>{buyerName}</Text>
            <Text style={styles.customerRole}>Authorized Vehicle Purchaser</Text>
          </View>

          <View style={styles.kvTable}>
            <View style={styles.kvRow}>
              <Text style={styles.kvKey}>Invoice Number</Text>
              <Text style={styles.kvValue}>{invoiceNumber}</Text>
            </View>
            <View style={styles.kvRow}>
              <Text style={styles.kvKey}>Date of Issue</Text>
              <Text style={styles.kvValue}>{formatDateDisplay(invoiceDate)}</Text>
            </View>
          </View>
        </View>

        {/* 3. Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.thIndex}>#</Text>
            <Text style={styles.thDesc}>DESCRIPTION</Text>
            <Text style={styles.thAmount}>AMOUNT (₹)</Text>
          </View>

          {items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.tdIndex}>{index + 1}</Text>
              <Text style={styles.tdDesc}>{item.description}</Text>
              <Text style={styles.tdAmount}>₹ {formatInr(item.amount)}</Text>
            </View>
          ))}
        </View>

        {/* 4. Bottom Financial Summary */}
        <View style={styles.bottomSection}>
          <View style={styles.wordsBox}>
            <Text style={styles.metaLabel}>Amount in Words (INR)</Text>
            <Text style={styles.wordsText}>{amountInWords}</Text>
          </View>

          <View style={styles.totalsBox}>
            <View style={styles.totalsRow}>
              <Text style={styles.kvKey}>Subtotal</Text>
              <Text style={styles.totalsRowBold}>₹ {formatInr(totalNum)}</Text>
            </View>
            <View style={styles.grandTotalBox}>
              <Text style={styles.grandTotalLabel}>INVOICE TOTAL</Text>
              <Text style={styles.grandTotalAmount}>₹ {formatInr(totalNum)}</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>{dealership.business_name} • {dealership.address}</Text>
          <Text>Invoice</Text>
        </View>
      </Page>
    </Document>
  );
}

export default InvoicePdfDocument;
