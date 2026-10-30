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
import { BonCommandeClient } from "../../../Components/Article/Interfaces";
import { calculateDocumentTotals, remiseLine } from "../../../Utils/CalculationEngine";

const styles = StyleSheet.create({
  page: {
    padding: 12,
    fontSize: 11,
    width: "90mm",
    fontFamily: "Helvetica",
  },
  header: {
    textAlign: "center",
    marginBottom: 6,
    borderBottom: "1pt solid #000",
    paddingBottom: 5,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 4,
  },
  logo: {
    width: 130,
    marginBottom: 3,
  },
  companyName: {
    fontSize: 13,
    marginBottom: 2,
  },
  companyInfo: {
    fontSize: 9,
    marginBottom: 2,
  },
  title: {
    fontSize: 12,
    textAlign: "center",
    marginBottom: 5,
    fontWeight: "bold",
  },
  receiptInfo: {
    marginBottom: 5,
    padding: 4,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 5
  },
  divider: {
    borderBottom: "1pt solid #000",
    marginVertical: 4,
  },
  table: {
    width: "100%",
    marginBottom: 5,
  },
  tableHeader: {
    flexDirection: "row",
    padding: 4,
    borderBottom: "1pt solid #000",
  },
  tableHeaderText: {
    fontSize: 11,
    fontWeight: "bold",
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "0.5pt solid #eee",
    paddingVertical: 3,
  },
  articleCell: {
    flex: 3,
    paddingHorizontal: 3,
  },
  qtyCell: {
    flex: 1,
    paddingHorizontal: 3,
    textAlign: "center",
  },
  priceCell: {
    flex: 2,
    paddingHorizontal: 3,
    textAlign: "right",
  },
  articleName: {
    fontSize: 9,
    marginBottom: 2,
    fontWeight: "bold",
  },
  totalsSection: {
    marginTop: 6,
    padding: 5,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  totalLabel: {
    fontSize: 10,
    fontWeight: "bold",
  },
  totalValue: {
    fontSize: 10,
    fontWeight: "bold",
  },
  finalTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
    paddingTop: 3,
    borderTop: "1pt solid #bdc3c7",
    fontSize: 11,
    fontWeight: "bold",
  },
  numeroCommande: {
    fontSize: 11,
  },
  paymentMethod: {
    marginTop: 4,
    padding: 3,
    border: "1pt dashed #ccc",
  },
  paymentText: {
    fontSize: 9,
    textAlign: "center",
    fontWeight: "bold",
  },
  thankYou: {
    textAlign: "center",
    fontSize: 10,
    marginTop: 5,
    fontWeight: "bold",
  },
  footer: {
    textAlign: "center",
    marginTop: 8,
    paddingTop: 5,
    borderTop: "0.5pt solid #ccc",
    fontSize: 7,
  },
  footerInfo: {
    marginBottom: 1,
  },
  discountRow: {
    fontStyle: "italic",
  },
  dateboncommande: {
    fontWeight: "bold",
  },

  vendeurRow: {
    marginTop: 4, // Ajustez cette valeur pour plus ou moins d'espace
  },


});

interface VenteComptoireReceiptPDFProps {
  bonCommande: BonCommandeClient;
  companyInfo: {
    name: string;
    address: string;
    city: string;
    phone: string;
    gsm: string;
    email: string;
    website: string;
    taxId: string;
    logo?: string;
  };
}

interface Totals {
  sousTotalHT: number;
  netHT: number;
  totalTax: number;
  grandTotal: number;
  finalTotal: number;
  discountAmount: number;
  globalRemise: number;
  remiseType: string;
}

const VenteComptoireReceiptPDF: React.FC<VenteComptoireReceiptPDFProps> = ({
  bonCommande,
  companyInfo,
}) => {
  // Same totals as the A4 document (shared engine), so the receipt prints the same amounts
  const calculateTotals = (): Totals => {
    const t = calculateDocumentTotals(bonCommande);
    return {
      sousTotalHT: t.sousTotalHT,
      netHT: t.netHT,
      totalTax: t.totalTax,
      grandTotal: t.grandTotal,
      finalTotal: t.finalTotal,
      discountAmount: t.discountAmount,
      globalRemise: Number(bonCommande?.remise) || 0,
      remiseType: bonCommande?.remiseType || "percentage",
    };
  };

  const totals = calculateTotals();
  const remiseRow = remiseLine(totals.discountAmount);

  return (
    <Document>
      <Page size={[255, 1000]} style={styles.page}>
        {/* Professional Header with Logo */}
        <View style={styles.header}>
          {companyInfo.logo && (
            <View style={styles.logoContainer}>
              <Image src={companyInfo.logo} style={styles.logo} />
            </View>
          )}
        </View>

        {/* Receipt Title */}
        <Text style={styles.title}>REÇU DE VENTE</Text>

        {/* Receipt Information */}
        {/* Receipt Information */}
        <View style={styles.receiptInfo}>
          <View style={styles.infoRow}>
            <Text style={styles.numeroCommande}>{bonCommande.numeroCommande}</Text>
            <Text style={styles.dateboncommande}>
              {moment(bonCommande.dateCommande).format("DD/MM/YYYY")}
            </Text>
          </View>
          <View style={[styles.infoRow, styles.vendeurRow]}>
            <Text>
              <Text style={styles.infoLabel}>Vendeur: </Text>
              {bonCommande.vendeur?.prenom} {bonCommande.vendeur?.nom}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Professional Articles Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.articleCell]}>
              ARTICLE
            </Text>
            <Text style={[styles.tableHeaderText, styles.qtyCell]}>QTÉ</Text>
            <Text style={[styles.tableHeaderText, styles.priceCell]}>
              P.U TTC
            </Text>
            <Text style={[styles.tableHeaderText, styles.priceCell]}>
              TOTAL
            </Text>
          </View>

          {bonCommande.articles?.map((item, index) => {
            const article = item.article;
            const qty = Number(item.quantite) || 0;
            const priceHT = Number(item.prixUnitaire) || 0;
            const tvaRate = Number(item.tva ?? 0);
            const remiseRate = Number(item.remise || 0);

            // Use prix_ttc if available, otherwise calculate from prixUnitaire
            const priceTTC = Number(item.prix_ttc) || priceHT * (1 + tvaRate / 100);

            // Calculate exactly like FactureVentePDF
            const montantNetHT = Math.round(qty * priceHT * (1 - remiseRate / 100) * 1000) / 1000;
            const montantTTCLigne = Math.round(qty * priceTTC * 1000) / 1000;

            return (
              <View style={styles.tableRow} key={index}>
                <View style={styles.articleCell}>
                  <Text style={styles.articleName}>
                    <Text>{item.designation || item.article?.designation || '-'}</Text>
                  </Text>
                </View>
                <Text style={styles.qtyCell}>{qty}</Text>
                <Text style={styles.priceCell}>{priceTTC.toFixed(3)}</Text>
                <Text style={styles.priceCell}>
                  {montantTTCLigne.toFixed(3)}
                </Text>
              </View>
            );
          })}
        </View>

        <View style={styles.divider} />

        {/* Professional Totals Section */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total H.T.:</Text>
            <Text style={styles.totalValue}>
              {totals.sousTotalHT.toFixed(3)} DT
            </Text>
          </View>

          {/* Show Remise if applicable */}
          {remiseRow && (
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, styles.discountRow]}>
                {remiseRow.label}:
              </Text>
              <Text style={[styles.totalValue, styles.discountRow]}>
                {remiseRow.sign} {remiseRow.amount.toFixed(3)} DT
              </Text>
            </View>
          )}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Net H.T.:</Text>
            <Text style={styles.totalValue}>{totals.netHT.toFixed(3)} DT</Text>
          </View>

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TVA:</Text>
            <Text style={styles.totalValue}>
              {totals.totalTax.toFixed(3)} DT
            </Text>
          </View>

          {/* Show Total TTC avec "après remise" text when applicable */}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>
              Total TTC:
            </Text>
            <Text style={styles.totalValue}>
              {totals.finalTotal.toFixed(3)} DT
            </Text>
          </View>

          {/* NET À PAYER - Same design as FactureVentePDF but simpler */}
          <View style={styles.finalTotal}>
            <Text>NET À PAYER:</Text>
            <Text>{totals.finalTotal.toFixed(3)} DT</Text>
          </View>
        </View>

        <View style={styles.paymentMethod}>
          {bonCommande.paymentMethods && bonCommande.paymentMethods.length > 0 ? (
            <View>
              {bonCommande.paymentMethods.map((payment, index) => {
                // Helper to get display text based on payment method (without amount)
                const getMethodText = (payment: any): string => {
                  switch (payment.method) {
                    case "especes":
                      return `ESPÈCES`;
                    case "cheque":
                      return `CHÈQUE${payment.numero ? ` N°${payment.numero}` : ""}${payment.banque ? ` (${payment.banque})` : ""}${payment.date ? ` le ${moment(payment.date).format("DD/MM/YY")}` : ""}`;
                    case "virement":
                      return `VIREMENT${payment.numero ? ` N°${payment.numero}` : ""}${payment.date ? ` le ${moment(payment.date).format("DD/MM/YY")}` : ""}`;
                    case "traite":
                      return `TRAITE${payment.numero ? ` N°${payment.numero}` : ""}${payment.dateEcheance ? ` Éch. ${moment(payment.dateEcheance).format("DD/MM/YY")}` : ""}`;
                    case "carte":
                    case "Carte Bancaire TPE":
                    case "tpe":
                      return `CARTE BANCAIRE (TPE)`;
                    default:
                      return payment.method.toUpperCase();
                  }
                };

                return (
                  <Text key={payment.id} style={styles.paymentText}>
                    **** {getMethodText(payment)} ****
                  </Text>
                );
              })}
            </View>
          ) : (
            <Text style={styles.paymentText}>
              **** {(() => {
                const method = bonCommande.modeReglement;
                if (method === "especes") return `ESPÈCES`;
                if (method === "cheque") return `CHÈQUE${bonCommande.numeroReglement ? ` N°${bonCommande.numeroReglement}` : ""}${bonCommande.banqueCheque ? ` (${bonCommande.banqueCheque})` : ""}`;
                if (method === "virement") return `VIREMENT${bonCommande.numeroReglement ? ` N°${bonCommande.numeroReglement}` : ""}`;
                if (method === "traite") return `TRAITE${bonCommande.numeroReglement ? ` N°${bonCommande.numeroReglement}` : ""}${bonCommande.dateEcheance ? ` Éch. ${moment(bonCommande.dateEcheance).format("DD/MM/YY")}` : ""}`;
                if (method === "carte") return `CARTE BANCAIRE (TPE)`;
                return `ESPÈCES`;
              })()} ****
            </Text>
          )}
        </View>

        {/* Thank You Message */}
        <View style={styles.thankYou}>
          <Text>MERCI POUR VOTRE CONFIANCE !</Text>
        </View>

        {/* Footer Section */}
        <View style={styles.footer}>
          <Text style={styles.footerInfo}>
            {companyInfo.address} - {companyInfo.city}
          </Text>
          <Text style={styles.footerInfo}>
            Tél: {companyInfo.phone} | Gsm: {companyInfo.gsm}
          </Text>
          <Text style={styles.footerInfo}>
            Email: {companyInfo.email} | Site: {companyInfo.website}
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default VenteComptoireReceiptPDF;