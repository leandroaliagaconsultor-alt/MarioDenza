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

// Recibo compacto: entran DOS copias por hoja A4 (original para el inquilino,
// duplicado para la inmobiliaria) con una línea de corte al medio.
const styles = StyleSheet.create({
  page: { paddingTop: 22, paddingHorizontal: 34, paddingBottom: 22, fontSize: 9, fontFamily: "Helvetica", color: C.ink },

  slip: {},

  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  brand: { flexDirection: "row", alignItems: "center" },
  logo: { width: 32, height: 32, objectFit: "contain", marginRight: 8 },
  brandName: { fontSize: 11, fontFamily: "Helvetica-Bold", color: C.navy, letterSpacing: 0.5 },
  brandSub: { fontSize: 7, color: C.green, letterSpacing: 2, marginTop: 1, fontFamily: "Helvetica-Bold" },
  docBox: { alignItems: "flex-end" },
  docType: { fontSize: 9.5, fontFamily: "Helvetica-Bold", color: C.navy, letterSpacing: 0.5 },
  metaRow: { flexDirection: "row", alignItems: "center", marginTop: 3, gap: 6 },
  chip: { backgroundColor: C.navy, color: C.white, fontSize: 8, fontFamily: "Helvetica-Bold", paddingVertical: 2, paddingHorizontal: 6, borderRadius: 3 },
  copyChip: { fontSize: 7.5, fontFamily: "Helvetica-Bold", letterSpacing: 1, paddingVertical: 2, paddingHorizontal: 6, borderRadius: 3, border: `1 solid ${C.green}`, color: C.green },
  docDate: { marginTop: 3, fontSize: 8, color: C.muted },

  rule: { height: 1.5, backgroundColor: C.navy, marginTop: 8 },
  ruleGreen: { height: 1.5, width: 50, backgroundColor: C.green, marginBottom: 10 },

  cards: { flexDirection: "row" },
  card: { flex: 1, backgroundColor: C.soft, border: `1 solid ${C.line}`, borderRadius: 5, padding: 8 },
  cardLabel: { fontSize: 7, color: C.muted, letterSpacing: 1, fontFamily: "Helvetica-Bold", marginBottom: 3 },
  cardMain: { fontSize: 9.5, fontFamily: "Helvetica-Bold", color: C.ink },
  cardSub: { fontSize: 8, color: C.muted, marginTop: 2 },

  section: { marginTop: 10 },
  sectionLabel: { fontSize: 7, color: C.muted, letterSpacing: 1, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  lineItem: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3.5, borderBottom: `1 solid ${C.line}` },
  liLabel: { color: C.muted, fontSize: 8.5 },
  liValue: { color: C.ink, fontFamily: "Helvetica-Bold", fontSize: 8.5 },

  totalBand: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: C.navy, borderRadius: 5, paddingVertical: 9, paddingHorizontal: 12, marginTop: 10 },
  totalLabel: { color: C.white, fontSize: 9.5, letterSpacing: 1, fontFamily: "Helvetica-Bold" },
  totalValue: { color: C.white, fontSize: 13, fontFamily: "Helvetica-Bold" },

  slipFooter: { marginTop: 8, borderTop: `1 solid ${C.line}`, paddingTop: 5 },
  footerText: { fontSize: 7, color: C.muted, marginTop: 1 },

  cut: { marginVertical: 10 },
  cutText: { fontSize: 7.5, color: C.muted, textAlign: "center", letterSpacing: 1 },
});

interface ReceiptData {
  logo?: string | null;
  receiptNumber: string;
  date: string;
  property: { address: string; unit?: string };
  tenant: { full_name: string; dni?: string };
  owner: { full_name: string };
  period: string;
  rent: string;
  extras: { concept: string; amount: string }[];
  amountDue: string;
  amountPaid: string;
  discount?: string | null;
  lateFee?: string | null;
  paymentMethod: string;
}

function Slip({ data, copyLabel, copySub }: { data: ReceiptData; copyLabel: string; copySub: string }) {
  return (
    <View style={styles.slip}>
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
          <View style={styles.metaRow}>
            <Text style={styles.copyChip}>{copyLabel} · {copySub}</Text>
            <Text style={styles.chip}>N° {data.receiptNumber}</Text>
          </View>
          <Text style={styles.docDate}>{data.date}</Text>
        </View>
      </View>

      <View style={styles.rule} />
      <View style={styles.ruleGreen} />

      {/* Partes */}
      <View style={styles.cards}>
        <View style={[styles.card, { marginRight: 10 }]}>
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
          <Text style={styles.liValue}>{data.rent}</Text>
        </View>
        {data.extras.map((e, i) => (
          <View key={i} style={styles.lineItem}>
            <Text style={styles.liLabel}>{e.concept}</Text>
            <Text style={styles.liValue}>{e.amount}</Text>
          </View>
        ))}
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
      <View style={styles.slipFooter}>
        <Text style={styles.footerText}>Mario Denza Propiedades · Mercedes, Provincia de Buenos Aires · Comprobante de pago de alquiler — no válido como factura.</Text>
        <Text style={styles.footerText}>Recibo N° {data.receiptNumber} · Emitido el {data.date} · {copyLabel} ({copySub})</Text>
      </View>
    </View>
  );
}

export function ReceiptDocument({ data }: { data: ReceiptData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Slip data={data} copyLabel="ORIGINAL" copySub="Inquilino" />

        <View style={styles.cut}>
          <Text style={styles.cutText}>
            ✂ - - - - - - - - - - - - - - - - - - - - - - - - - - - cortar aquí - - - - - - - - - - - - - - - - - - - - - - - - - - -
          </Text>
        </View>

        <Slip data={data} copyLabel="DUPLICADO" copySub="Inmobiliaria" />
      </Page>
    </Document>
  );
}
