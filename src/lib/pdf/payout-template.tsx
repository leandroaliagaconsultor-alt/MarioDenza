import React from "react";
import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";

// Paleta de marca (logo: navy + verde)
const C = {
  navy: "#23335B",
  green: "#7AB648",
  ink: "#1F2937",
  muted: "#6B7280",
  line: "#E5E7EB",
  soft: "#F8FAFC",
  white: "#FFFFFF",
};

const styles = StyleSheet.create({
  page: { paddingTop: 36, paddingHorizontal: 40, paddingBottom: 70, fontSize: 10, fontFamily: "Helvetica", color: C.ink },

  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  brand: { flexDirection: "row", alignItems: "center" },
  logo: { width: 46, height: 46, objectFit: "contain", marginRight: 10 },
  brandName: { fontSize: 13, fontFamily: "Helvetica-Bold", color: C.navy, letterSpacing: 0.5 },
  brandSub: { fontSize: 8, color: C.green, letterSpacing: 2, marginTop: 1, fontFamily: "Helvetica-Bold" },
  docBox: { alignItems: "flex-end" },
  docType: { fontSize: 11, fontFamily: "Helvetica-Bold", color: C.navy, letterSpacing: 0.5 },
  chip: { marginTop: 4, backgroundColor: C.navy, color: C.white, fontSize: 9, fontFamily: "Helvetica-Bold", paddingVertical: 3, paddingHorizontal: 8, borderRadius: 3 },
  docDate: { marginTop: 4, fontSize: 9, color: C.muted },

  rule: { height: 2, backgroundColor: C.navy, marginTop: 14 },
  ruleGreen: { height: 2, width: 64, backgroundColor: C.green, marginBottom: 18 },

  ownerCard: { backgroundColor: C.soft, border: `1 solid ${C.line}`, borderRadius: 6, padding: 12, marginBottom: 16 },
  ownerLabel: { fontSize: 8, color: C.muted, letterSpacing: 1, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  ownerName: { fontSize: 13, fontFamily: "Helvetica-Bold", color: C.ink },

  thead: { flexDirection: "row", backgroundColor: C.navy, borderRadius: 3, paddingVertical: 6, paddingHorizontal: 8 },
  th: { fontSize: 8, color: C.white, letterSpacing: 0.5, fontFamily: "Helvetica-Bold" },
  row: { flexDirection: "row", paddingVertical: 7, paddingHorizontal: 8, borderBottom: `1 solid ${C.line}` },
  rowAlt: { backgroundColor: C.soft },
  colProp: { width: "32%" },
  colTenant: { width: "24%", color: C.muted },
  colNum: { width: "14.66%", textAlign: "right" },
  cell: { fontSize: 9 },

  summary: { marginTop: 14, alignItems: "flex-end" },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", width: 240, paddingVertical: 3 },
  summaryLabel: { color: C.muted, fontSize: 9 },
  summaryValue: { color: C.ink, fontSize: 9, fontFamily: "Helvetica-Bold" },

  totalBand: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: C.navy, borderRadius: 6, paddingVertical: 14, paddingHorizontal: 16, marginTop: 14 },
  totalLabel: { color: C.white, fontSize: 11, letterSpacing: 1, fontFamily: "Helvetica-Bold" },
  totalValue: { color: C.white, fontSize: 16, fontFamily: "Helvetica-Bold" },

  footer: { position: "absolute", bottom: 30, left: 40, right: 40, borderTop: `1 solid ${C.line}`, paddingTop: 8 },
  footerName: { fontSize: 9, fontFamily: "Helvetica-Bold", color: C.navy },
  footerText: { fontSize: 7.5, color: C.muted, marginTop: 2 },
});

interface PayoutData {
  logo?: string | null;
  ownerName: string;
  period: string;
  date: string;
  rows: { address: string; tenant: string; collected: string; commission: string; payout: string }[];
  totalCollected: string;
  totalCommission: string;
  totalPayout: string;
}

export function PayoutDocument({ data }: { data: PayoutData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.brand}>
            {data.logo ? <Image style={styles.logo} src={data.logo} /> : null}
            <View>
              <Text style={styles.brandName}>MARIO DENZA</Text>
              <Text style={styles.brandSub}>PROPIEDADES</Text>
            </View>
          </View>
          <View style={styles.docBox}>
            <Text style={styles.docType}>LIQUIDACIÓN AL PROPIETARIO</Text>
            <Text style={styles.chip}>Período {data.period}</Text>
            <Text style={styles.docDate}>{data.date}</Text>
          </View>
        </View>

        <View style={styles.rule} />
        <View style={styles.ruleGreen} />

        {/* Propietario */}
        <View style={styles.ownerCard}>
          <Text style={styles.ownerLabel}>PROPIETARIO</Text>
          <Text style={styles.ownerName}>{data.ownerName}</Text>
        </View>

        {/* Tabla de propiedades */}
        <View style={styles.thead}>
          <Text style={[styles.colProp, styles.th]}>Propiedad</Text>
          <Text style={[styles.colTenant, styles.th]}>Inquilino</Text>
          <Text style={[styles.colNum, styles.th]}>Cobrado</Text>
          <Text style={[styles.colNum, styles.th]}>Comisión</Text>
          <Text style={[styles.colNum, styles.th]}>A pagar</Text>
        </View>
        {data.rows.map((r, i) => (
          <View style={i % 2 === 1 ? [styles.row, styles.rowAlt] : styles.row} key={i}>
            <Text style={[styles.colProp, styles.cell]}>{r.address}</Text>
            <Text style={[styles.colTenant, styles.cell]}>{r.tenant}</Text>
            <Text style={[styles.colNum, styles.cell]}>{r.collected}</Text>
            <Text style={[styles.colNum, styles.cell]}>{r.commission}</Text>
            <Text style={[styles.colNum, styles.cell, { fontFamily: "Helvetica-Bold" }]}>{r.payout}</Text>
          </View>
        ))}

        {/* Resumen */}
        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total cobrado</Text>
            <Text style={styles.summaryValue}>{data.totalCollected}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Comisión inmobiliaria</Text>
            <Text style={styles.summaryValue}>{data.totalCommission}</Text>
          </View>
        </View>

        {/* Total */}
        <View style={styles.totalBand}>
          <Text style={styles.totalLabel}>TOTAL A PAGAR AL PROPIETARIO</Text>
          <Text style={styles.totalValue}>{data.totalPayout}</Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerName}>Mario Denza Propiedades</Text>
          <Text style={styles.footerText}>Mercedes, Provincia de Buenos Aires · Detalle de liquidación de alquileres del período {data.period}.</Text>
          <Text style={styles.footerText}>Emitido el {data.date}.</Text>
        </View>
      </Page>
    </Document>
  );
}
