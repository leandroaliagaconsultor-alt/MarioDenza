import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 11, fontFamily: "Helvetica" },
  header: { marginBottom: 20, borderBottom: "1 solid #0d9488", paddingBottom: 15 },
  title: { fontSize: 18, fontWeight: "bold", color: "#0d9488" },
  subtitle: { fontSize: 10, color: "#666", marginTop: 4 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  label: { color: "#666", width: "40%" },
  value: { fontWeight: "bold", width: "60%", textAlign: "right" },
  section: { marginTop: 15, marginBottom: 10 },
  sectionTitle: { fontSize: 12, fontWeight: "bold", color: "#333", marginBottom: 8, borderBottom: "1 solid #eee", paddingBottom: 4 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 15, paddingTop: 10, borderTop: "2 solid #0d9488" },
  totalLabel: { fontSize: 14, fontWeight: "bold", color: "#333" },
  totalValue: { fontSize: 14, fontWeight: "bold", color: "#0d9488" },
  footer: { position: "absolute", bottom: 30, left: 40, right: 40, textAlign: "center", fontSize: 8, color: "#999" },
});

interface ReceiptData {
  receiptNumber: string;
  date: string;
  property: { address: string; unit?: string };
  tenant: { full_name: string; dni?: string };
  owner: { full_name: string };
  period: string;
  amountDue: string;
  amountPaid: string;
  discount: string;
  lateFee: string;
  commission: string;
  ownerPayout: string;
  paymentMethod: string;
  currency: string;
}

export function ReceiptDocument({ data }: { data: ReceiptData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Recibo de Alquiler</Text>
          <Text style={styles.subtitle}>
            N° {data.receiptNumber} — {data.date}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Propiedad</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Direccion</Text>
            <Text style={styles.value}>
              {data.property.address}{data.property.unit ? ` - ${data.property.unit}` : ""}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Propietario</Text>
            <Text style={styles.value}>{data.owner.full_name}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Inquilino</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Nombre</Text>
            <Text style={styles.value}>{data.tenant.full_name}</Text>
          </View>
          {data.tenant.dni && (
            <View style={styles.row}>
              <Text style={styles.label}>DNI</Text>
              <Text style={styles.value}>{data.tenant.dni}</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detalle del Pago</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Periodo</Text>
            <Text style={styles.value}>{data.period}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Alquiler</Text>
            <Text style={styles.value}>{data.currency} {data.amountDue}</Text>
          </View>
          {data.discount !== "0" && (
            <View style={styles.row}>
              <Text style={styles.label}>Descuento</Text>
              <Text style={styles.value}>-{data.currency} {data.discount}</Text>
            </View>
          )}
          {data.lateFee !== "0" && (
            <View style={styles.row}>
              <Text style={styles.label}>Recargo mora</Text>
              <Text style={styles.value}>+{data.currency} {data.lateFee}</Text>
            </View>
          )}
          <View style={styles.row}>
            <Text style={styles.label}>Metodo de pago</Text>
            <Text style={styles.value}>{data.paymentMethod}</Text>
          </View>
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total Pagado</Text>
          <Text style={styles.totalValue}>{data.currency} {data.amountPaid}</Text>
        </View>

        <Text style={styles.footer}>
          Este recibo fue generado electronicamente y no requiere firma.
        </Text>
      </Page>
    </Document>
  );
}
