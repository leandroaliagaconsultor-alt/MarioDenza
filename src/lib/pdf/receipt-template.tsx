import React from "react";
import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";

// Paleta de marca (tomada del logo: navy + verde)
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

  cards: { flexDirection: "row", marginBottom: 4 },
  card: { flex: 1, backgroundColor: C.soft, border: `1 solid ${C.line}`, borderRadius: 6, padding: 12 },
  cardLabel: { fontSize: 8, color: C.muted, letterSpacing: 1, fontFamily: "Helvetica-Bold", marginBottom: 6 },
  cardMain: { fontSize: 11, fontFamily: "Helvetica-Bold", color: C.ink },
  cardSub: { fontSize: 9, color: C.muted, marginTop: 3 },

  section: { marginTop: 18 },
  sectionLabel: { fontSize: 8, color: C.muted, letterSpacing: 1, fontFamily: "Helvetica-Bold", marginBottom: 6 },
  lineItem: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, borderBottom: `1 solid ${C.line}` },
  liLabel: { color: C.muted },
  liValue: { color: C.ink, fontFamily: "Helvetica-Bold" },

  totalBand: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: C.navy, borderRadius: 6, paddingVertical: 14, paddingHorizontal: 16, marginTop: 18 },
  totalLabel: { color: C.white, fontSize: 11, letterSpacing: 1, fontFamily: "Helvetica-Bold" },
  totalValue: { color: C.white, fontSize: 16, fontFamily: "Helvetica-Bold" },

  footer: { position: "absolute", bottom: 30, left: 40, right: 40, borderTop: `1 solid ${C.line}`, paddingTop: 8 },
  footerName: { fontSize: 9, fontFamily: "Helvetica-Bold", color: C.navy },
  footerText: { fontSize: 7.5, color: C.muted, marginTop: 2 },
});

interface ReceiptData {
  logo?: string | null;
  receiptNumber: string;
  date: string;
  property: { address: string; unit?: string };
  tenant: { full_name: string; dni?: string };
  owner: { full_name: string };
  period: string;
  amountDue: string;
  amountPaid: string;
  discount?: string | null;
  lateFee?: string | null;
  paymentMethod: string;
}

export function ReceiptDocument({ data }: { data: ReceiptData }) {
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
            <Text style={styles.docType}>RECIBO DE ALQUILER</Text>
            <Text style={styles.chip}>N° {data.receiptNumber}</Text>
            <Text style={styles.docDate}>{data.date}</Text>
          </View>
        </View>

        <View style={styles.rule} />
        <View style={styles.ruleGreen} />

        {/* Partes */}
        <View style={styles.cards}>
          <View style={[styles.card, { marginRight: 12 }]}>
            <Text style={styles.cardLabel}>PROPIEDAD</Text>
            <Text style={styles.cardMain}>
              {data.property.address}{data.property.unit ? ` - ${data.property.unit}` : ""}
            </Text>
            <Text style={styles.cardSub}>Propietario: {data.owner.full_name}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>INQUILINO</Text>
            <Text style={styles.cardMain}>{data.tenant.full_name}</Text>
            {data.tenant.dni ? <Text style={styles.cardSub}>DNI: {data.tenant.dni}</Text> : null}
          </View>
        </View>

        {/* Detalle */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>DETALLE DEL PAGO</Text>
          <View style={styles.lineItem}>
            <Text style={styles.liLabel}>Período</Text>
            <Text style={styles.liValue}>{data.period}</Text>
          </View>
          <View style={styles.lineItem}>
            <Text style={styles.liLabel}>Alquiler</Text>
            <Text style={styles.liValue}>{data.amountDue}</Text>
          </View>
          {data.discount ? (
            <View style={styles.lineItem}>
              <Text style={styles.liLabel}>Descuento</Text>
              <Text style={styles.liValue}>- {data.discount}</Text>
            </View>
          ) : null}
          {data.lateFee ? (
            <View style={styles.lineItem}>
              <Text style={styles.liLabel}>Recargo por mora</Text>
              <Text style={styles.liValue}>+ {data.lateFee}</Text>
            </View>
          ) : null}
          <View style={styles.lineItem}>
            <Text style={styles.liLabel}>Método de pago</Text>
            <Text style={styles.liValue}>{data.paymentMethod}</Text>
          </View>
        </View>

        {/* Total */}
        <View style={styles.totalBand}>
          <Text style={styles.totalLabel}>TOTAL PAGADO</Text>
          <Text style={styles.totalValue}>{data.amountPaid}</Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerName}>Mario Denza Propiedades</Text>
          <Text style={styles.footerText}>Mercedes, Provincia de Buenos Aires · Comprobante de pago de alquiler — no válido como factura.</Text>
          <Text style={styles.footerText}>Recibo N° {data.receiptNumber} · Emitido el {data.date}</Text>
        </View>
      </Page>
    </Document>
  );
}
