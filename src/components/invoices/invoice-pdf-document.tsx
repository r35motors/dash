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
} from "@react-pdf/renderer";
import { numberToIndianWords } from "@/lib/utils";

// Types for Invoice PDF rendering
export interface InvoicePdfData {
  id?: string;
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
    id?: string;
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

// Executive A4 PDF Stylesheet with Navy Blue primary accents, clean typography, light grey borders
const styles = StyleSheet.create({
  page: {
    size: "A4",
    backgroundColor: "#FFFFFF",
    paddingTop: 36,
    paddingBottom: 40,
    paddingHorizontal: 40,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: "#0F172A",
    lineHeight: 1.45,
  },
  topAccentBar: {
    height: 4,
    backgroundColor: "#1E3A8A", // Deep Royal Navy Accent
    marginBottom: 20,
    borderRadius: 2,
  },
  // Dealership Header
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingBottom: 18,
    borderBottomWidth: 1.5,
    borderBottomColor: "#E2E8F0",
    marginBottom: 18,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    maxWidth: "58%",
  },
  dealershipName: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: "#0F172A",
    letterSpacing: 0.3,
    marginBottom: 3,
  },
  dealershipTagline: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#1E3A8A",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  dealershipMeta: {
    fontSize: 8.5,
    color: "#475569",
    lineHeight: 1.35,
  },
  headerRight: {
    alignItems: "flex-end",
    maxWidth: "40%",
  },
  invoiceTitle: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: "#1E3A8A",
    letterSpacing: 0.5,
  },
  invoiceSubtitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#64748B",
    marginTop: 2,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  statusBadge: {
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    borderRadius: 4,
  },
  statusBadgeText: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#065F46",
    letterSpacing: 0.5,
  },
  // Customer & Meta Info Section
  infoSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 6,
    padding: 14,
  },
  infoColLeft: {
    width: "52%",
  },
  infoColRight: {
    width: "44%",
    borderLeftWidth: 1,
    borderLeftColor: "#E2E8F0",
    paddingLeft: 14,
  },
  sectionTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#1E3A8A",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  buyerName: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: "#0F172A",
    marginBottom: 2,
  },
  buyerSub: {
    fontSize: 8.5,
    color: "#64748B",
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 2,
  },
  metaLabel: {
    fontSize: 8.5,
    color: "#64748B",
  },
  metaValue: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#0F172A",
  },
  // Itemized Table
  tableContainer: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: 18,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#0F172A", // Deep Navy Header
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  tableHeaderIndex: {
    width: "8%",
    color: "#FFFFFF",
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    letterSpacing: 0.5,
  },
  tableHeaderDesc: {
    width: "64%",
    color: "#FFFFFF",
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    textAlign: "left",
    letterSpacing: 0.5,
  },
  tableHeaderAmount: {
    width: "28%",
    color: "#FFFFFF",
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    textAlign: "right",
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    alignItems: "center",
  },
  tableRowAlt: {
    backgroundColor: "#F8FAFC",
  },
  tableColIndex: {
    width: "8%",
    fontSize: 9,
    color: "#64748B",
    textAlign: "center",
  },
  tableColDesc: {
    width: "64%",
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#1E293B",
  },
  tableColAmount: {
    width: "28%",
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color: "#0F172A",
    textAlign: "right",
  },
  // Financial Summary Section
  financialSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  wordsBox: {
    width: "54%",
    padding: 12,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 6,
  },
  wordsBoxTitle: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: "#1E3A8A",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  wordsText: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#0F172A",
    lineHeight: 1.4,
  },
  paymentNote: {
    fontSize: 7.5,
    color: "#64748B",
    marginTop: 8,
    lineHeight: 1.3,
  },
  totalsBox: {
    width: "42%",
  },
  totalSummaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3.5,
    paddingHorizontal: 6,
  },
  totalSummaryFinal: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: "#1E3A8A",
    borderRadius: 5,
    marginTop: 6,
  },
  totalSummaryFinalLabel: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
  totalSummaryFinalAmount: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: "#FFFFFF",
  },
  // Clean Corporate Signatory Block
  signatorySection: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
    paddingTop: 12,
  },
  signatoryCard: {
    width: "45%",
    alignItems: "center",
  },
  signatureLine: {
    width: "80%",
    height: 1,
    backgroundColor: "#94A3B8",
    marginBottom: 6,
  },
  signatoryTitle: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: "#0F172A",
  },
  signatorySub: {
    fontSize: 7.5,
    color: "#64748B",
    marginTop: 1,
  },
  // Clean Professional Footer Rule
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerLeft: {
    fontSize: 7.5,
    color: "#94A3B8",
  },
  footerRight: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: "#64748B",
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

function formatDateDisplay(d: string | Date | undefined | null): string {
  if (!d) return "-";
  const dateObj = typeof d === "string" ? new Date(d) : d;
  if (isNaN(dateObj.getTime())) return "-";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(dateObj);
}

export function InvoicePdfDocument({ data }: { data: InvoicePdfData }) {
  // CRITICAL: Extract from snapshot if available to ensure 100% frozen historical preservation
  const snapshot = data.invoice_snapshot || null;

  const dealership = snapshot?.dealership || data.dealership || {
    business_name: snapshot?.dealership_name || "Royal Motors Luxury Dealership",
    address: snapshot?.dealership_address || "",
    contact_number_1: snapshot?.dealership_contact_1 || "",
    contact_number_2: snapshot?.dealership_contact_2 || null,
  };

  const buyerName = snapshot?.buyer?.name || snapshot?.buyer_name || data.buyer?.name || "Valued Customer";

  const vehicle = snapshot?.vehicle || data.vehicle || {
    vehicle_name: snapshot?.vehicle_name || "Vehicle",
    registration_number: snapshot?.registration_number || "-",
    owner_name: snapshot?.owner_name || "-",
  };

  // Line items
  const items: Array<{ description: string; amount: string | number }> =
    snapshot?.items ||
    data.items ||
    (snapshot?.base_price !== undefined
      ? [
          {
            description: `Vehicle: ${vehicle.vehicle_name} (${vehicle.registration_number})`,
            amount: snapshot.base_price,
          },
          ...(snapshot.handling_fee
            ? [{ description: "Documentation & Handling Charges", amount: snapshot.handling_fee }]
            : []),
        ]
      : [
          {
            description: `Vehicle: ${vehicle.vehicle_name} (${vehicle.registration_number})`,
            amount: data.invoice_total || 0,
          },
        ]);

  // Total
  const totalAmount =
    snapshot?.total_amount ??
    snapshot?.invoice_total ??
    data.invoice_total ??
    items.reduce((acc, it) => acc + (parseFloat(String(it.amount)) || 0), 0);

  const totalNum = parseFloat(String(totalAmount)) || 0;

  // Amount in words
  const amountInWords =
    snapshot?.amount_in_words ||
    data.amount_in_words ||
    numberToIndianWords(totalNum);

  const invoiceNumber = data.invoice_number || snapshot?.invoice_number || "INV-0001";
  const invoiceDate = data.invoice_date || snapshot?.invoice_date || new Date().toISOString();

  return (
    <Document title={`Invoice-${invoiceNumber}`} author={dealership.business_name}>
      <Page size="A4" style={styles.page}>
        {/* Navy Blue Top Accent Bar */}
        <View style={styles.topAccentBar} />

        {/* 1. Executive Dealership Header */}
        <View style={styles.headerContainer}>
          <View style={styles.headerLeft}>
            {/* Luxury Automotive Emblem SVG */}
            <Svg width="40" height="40" viewBox="0 0 36 36">
              <Rect width="36" height="36" rx="6" fill="#0F172A" />
              <Path
                d="M 18 7 L 23 13 L 29 10 L 26 21 L 10 21 L 7 10 L 13 13 Z"
                fill="#F8FAFC"
              />
              <Rect x="10" y="23" width="16" height="2" fill="#F8FAFC" rx="1" />
              <Rect x="12" y="26.5" width="12" height="1.5" fill="#38BDF8" rx="0.75" />
            </Svg>

            <View>
              <Text style={styles.dealershipName}>{dealership.business_name}</Text>
              <Text style={styles.dealershipTagline}>Pre-Owned Luxury Automobiles</Text>
              {dealership.address ? (
                <Text style={styles.dealershipMeta}>{dealership.address}</Text>
              ) : null}
              <Text style={styles.dealershipMeta}>
                Phone: {dealership.contact_number_1 || "N/A"}
                {dealership.contact_number_2 ? ` | ${dealership.contact_number_2}` : ""}
              </Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            <Text style={styles.invoiceTitle}>TAX INVOICE</Text>
            <Text style={styles.invoiceSubtitle}>Original for Recipient</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>PAID IN FULL</Text>
            </View>
          </View>
        </View>

        {/* 2. Customer & Transaction Details Section */}
        <View style={styles.infoSection}>
          <View style={styles.infoColLeft}>
            <Text style={styles.sectionTitle}>Billed To (Customer)</Text>
            <Text style={styles.buyerName}>{buyerName}</Text>
            <Text style={styles.buyerSub}>Authorized Vehicle Purchaser</Text>
          </View>

          <View style={styles.infoColRight}>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Invoice Number:</Text>
              <Text style={styles.metaValue}>{invoiceNumber}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Date of Issue:</Text>
              <Text style={styles.metaValue}>{formatDateDisplay(invoiceDate)}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Payment Status:</Text>
              <Text style={[styles.metaValue, { color: "#16A34A" }]}>Full Settlement</Text>
            </View>
          </View>
        </View>

        {/* 3. Itemized Charges Table */}
        <View style={styles.tableContainer}>
          <View style={styles.tableHeader}>
            <Text style={styles.tableHeaderIndex}>#</Text>
            <Text style={styles.tableHeaderDesc}>Description</Text>
            <Text style={styles.tableHeaderAmount}>Amount (₹)</Text>
          </View>

          {items.map((item, index) => (
            <View
              key={index}
              style={[
                styles.tableRow,
                index % 2 === 1 ? styles.tableRowAlt : {},
              ]}
            >
              <Text style={styles.tableColIndex}>{index + 1}</Text>
              <Text style={styles.tableColDesc}>{item.description}</Text>
              <Text style={styles.tableColAmount}>₹ {formatInr(item.amount)}</Text>
            </View>
          ))}
        </View>

        {/* 4. Financial Summary & Amount in Words */}
        <View style={styles.financialSection}>
          <View style={styles.wordsBox}>
            <Text style={styles.wordsBoxTitle}>Amount in Words (INR)</Text>
            <Text style={styles.wordsText}>{amountInWords}</Text>
            <Text style={styles.paymentNote}>
              This document serves as an official confirmation of receipt for the vehicle and associated services listed above.
            </Text>
          </View>

          <View style={styles.totalsBox}>
            <View style={styles.totalSummaryRow}>
              <Text style={styles.metaLabel}>Subtotal:</Text>
              <Text style={styles.metaValue}>₹ {formatInr(totalNum)}</Text>
            </View>
            <View style={styles.totalSummaryRow}>
              <Text style={styles.metaLabel}>Taxes & Fees:</Text>
              <Text style={styles.metaValue}>Inclusive</Text>
            </View>
            <View style={styles.totalSummaryFinal}>
              <Text style={styles.totalSummaryFinalLabel}>Invoice Total</Text>
              <Text style={styles.totalSummaryFinalAmount}>₹ {formatInr(totalNum)}</Text>
            </View>
          </View>
        </View>

        {/* 5. Clean Corporate Signatory Block */}
        <View style={styles.signatorySection}>
          <View style={styles.signatoryCard}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatoryTitle}>Authorized Signatory</Text>
            <Text style={styles.signatorySub}>For {dealership.business_name}</Text>
          </View>
        </View>

        {/* 6. Professional Footer Rule */}
        <View style={styles.footer}>
          <Text style={styles.footerLeft}>
            {dealership.business_name} • {dealership.address}
          </Text>
          <Text style={styles.footerRight}>Tax Invoice</Text>
        </View>
      </Page>
    </Document>
  );
}

export default InvoicePdfDocument;
