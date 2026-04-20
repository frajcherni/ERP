import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import moment from "moment";

const ITEMS_PER_PAGE = 18;

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#FFFFFF",
    padding: 20,
    fontSize: 10,
    fontFamily: "Helvetica",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
    borderBottom: "1pt solid #000",
    paddingBottom: 8,
  },
  companyInfo: { width: "60%" },
  logo: { width: 150, marginBottom: 5 },

  titleSection: { marginBottom: 20, marginTop: 10 },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    color: "#00aeef",
  },
  period: { fontSize: 11, textAlign: "center" },
  count: { fontSize: 10, textAlign: "center", fontWeight: "bold" },

  tableContainer: {
    marginTop: 10,
    borderTop: "1pt solid #ddd",
    borderLeft: "1pt solid #ddd",
    borderRight: "1pt solid #ddd",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#00aeef",
    height: 32,
    alignItems: "center",
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "1pt solid #ddd",
    height: 32,
    alignItems: "center",
  },

  colNumero: { width: "20%", paddingHorizontal: 4, justifyContent: "center" },
  colDate: { width: "12%", paddingHorizontal: 4, justifyContent: "center" },
  colClient: { width: "30%", paddingHorizontal: 4, justifyContent: "center" },
  colHT: { width: "20%", paddingHorizontal: 4, textAlign: "right", justifyContent: "center" },
  colTTC: { width: "20%", paddingHorizontal: 4, textAlign: "right", justifyContent: "center" },

  headerText: { fontWeight: "bold", fontSize: 10, color: "#fff" },
  cellText: { fontSize: 9 },

  footer: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    textAlign: "center",
    fontSize: 8,
    borderTop: "1pt solid #ddd",
    paddingTop: 5,
  },

  pageNumber: {
    position: "absolute",
    bottom: 5,
    left: 20,
    fontSize: 8,
  },

  summaryContainer: {
    marginTop: 20,
    borderTop: "2pt solid #00aeef",
    paddingTop: 10,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  summaryBox: {
    width: "40%",
    backgroundColor: "#f9f9f9",
    padding: 10,
    borderRadius: 4,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#555",
  },
  summaryValue: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#00aeef",
  },

  footerLine: {
    marginBottom: 1,
  },
});

interface Props {
  factures: any[];
  startDate: Date | null;
  endDate: Date | null;
  companyInfo: any;
}

const FacturesListPDF: React.FC<Props> = ({
  factures,
  startDate,
  endDate,
  companyInfo,
}) => {
  const safeCompanyInfo = companyInfo || {};

  const formatCurrency = (amount: number) =>
    (amount || 0).toFixed(3);

  const getPeriodText = () => {
    if (startDate && endDate)
      return `Période: du ${moment(startDate).format("DD/MM/YYYY")} au ${moment(endDate).format("DD/MM/YYYY")}`;
    if (startDate)
      return `Période: à partir du ${moment(startDate).format("DD/MM/YYYY")}`;
    if (endDate)
      return `Période: jusqu'au ${moment(endDate).format("DD/MM/YYYY")}`;
    return "Période: Toutes les factures";
  };

  // 🔥 Split into pages
  const pages = [];
  for (let i = 0; i < factures.length; i += ITEMS_PER_PAGE) {
    pages.push(factures.slice(i, i + ITEMS_PER_PAGE));
  }

  const totalHTSum = factures.reduce((sum, f) => {
    const ht = f.remise && Number(f.remise) > 0
      ? Number(f.totalHTAfterRemise) || Number(f.totalHT) || 0
      : Number(f.totalHT) || 0;
    return sum + ht;
  }, 0);

  const totalTTCSum = factures.reduce((sum, f) => {
    const ttc = f.remise && Number(f.remise) > 0
      ? Number(f.totalTTCAfterRemise) || Number(f.totalTTC) || 0
      : Number(f.totalTTC) || 0;
    return sum + ttc;
  }, 0);

  return (
    <Document>
      {pages.map((pageData, pageIndex) => (
        <Page size="A4" style={styles.page} key={pageIndex}>

          {/* HEADER */}
          <View style={styles.header}>
            <View style={styles.companyInfo}>
              {safeCompanyInfo.logo && (
                <Image src={safeCompanyInfo.logo} style={styles.logo} />
              )}
            </View>
          </View>

          {/* TITLE */}
          {pageIndex === 0 && (
            <View style={styles.titleSection}>
              <Text style={styles.title}>JOURNAL DES FACTURES CLIENTS</Text>
              <Text style={styles.period}>{getPeriodText()}</Text>
              <Text style={styles.count}>
                Nombre de factures: {factures.length}
              </Text>
            </View>
          )}

          {/* TABLE */}
          <View style={styles.tableContainer}>
            <View style={styles.tableHeader}>
              <View style={styles.colNumero}>
                <Text style={styles.headerText}>N° FACTURE</Text>
              </View>
              <View style={styles.colDate}>
                <Text style={styles.headerText}>DATE</Text>
              </View>
              <View style={styles.colClient}>
                <Text style={styles.headerText}>CLIENT</Text>
              </View>
              <View style={styles.colHT}>
                <Text style={styles.headerText}>TOTAL HT</Text>
              </View>
              <View style={styles.colTTC}>
                <Text style={styles.headerText}>TOTAL TTC</Text>
              </View>
            </View>

            {pageData.map((facture, index) => {
              const ht =
                facture.remise && Number(facture.remise) > 0
                  ? Number(facture.totalHTAfterRemise) || Number(facture.totalHT) || 0
                  : Number(facture.totalHT) || 0;

              const ttc =
                facture.remise && Number(facture.remise) > 0
                  ? Number(facture.totalTTCAfterRemise) || Number(facture.totalTTC) || 0
                  : Number(facture.totalTTC) || 0;

              return (
                <View style={styles.tableRow} key={index}>
                  <View style={styles.colNumero}>
                    <Text style={styles.cellText}>{facture.numeroFacture}</Text>
                  </View>
                  <View style={styles.colDate}>
                    <Text style={styles.cellText}>
                      {moment(facture.dateFacture).format("DD/MM/YYYY")}
                    </Text>
                  </View>
                  <View style={styles.colClient}>
                    <Text style={styles.cellText}>
                      {facture.client?.raison_sociale || "N/A"}
                    </Text>
                  </View>
                  <View style={styles.colHT}>
                    <Text style={styles.cellText}>
                      {formatCurrency(ht)} DT
                    </Text>
                  </View>
                  <View style={styles.colTTC}>
                    <Text style={styles.cellText}>
                      {formatCurrency(ttc)} DT
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* TOTALS SUMMARY (On Last Page Only) */}
          {pageIndex === pages.length - 1 && (
            <View style={styles.summaryContainer}>
              <View style={styles.summaryBox}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>TOTAL HT GÉNÉRAL:</Text>
                  <Text style={styles.summaryValue}>{formatCurrency(totalHTSum)} DT</Text>
                </View>
                <View style={[styles.summaryRow, { marginTop: 5, borderTop: "1pt solid #ddd", paddingTop: 5 }]}>
                  <Text style={styles.summaryLabel}>TOTAL TTC GÉNÉRAL:</Text>
                  <Text style={styles.summaryValue}>{formatCurrency(totalTTCSum)} DT</Text>
                </View>
              </View>
            </View>
          )}

          {/* FOOTER */}
          <View style={styles.footer}>
            <Text style={styles.footerLine}>
              {[
                // safeCompanyInfo.name,
                safeCompanyInfo.address,
                safeCompanyInfo.city,
                safeCompanyInfo.phone,
                safeCompanyInfo.gsm,
                safeCompanyInfo.taxId,
              ]
                .filter(Boolean)
                .join(" - ")}
            </Text>
            {safeCompanyInfo.email && safeCompanyInfo.website ? (
              <Text style={styles.footerLine}>
                Email: {safeCompanyInfo.email} | Site: {safeCompanyInfo.website}
              </Text>
            ) : safeCompanyInfo.email ? (
              <Text style={styles.footerLine}>Email: {safeCompanyInfo.email}</Text>
            ) : safeCompanyInfo.website ? (
              <Text style={styles.footerLine}>Site: {safeCompanyInfo.website}</Text>
            ) : null}
          </View>

          {/* PAGE NUMBER */}
          <Text style={styles.pageNumber}>
            Page {pageIndex + 1} / {pages.length}
          </Text>
        </Page>
      ))}
    </Document>
  );
};

export default FacturesListPDF;