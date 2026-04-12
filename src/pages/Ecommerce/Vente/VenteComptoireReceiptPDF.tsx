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
    marginBottom : 5
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
  // Calculate totals exactly like in FactureVentePDF
  const calculateTotals = (): Totals => {
    if (!bonCommande?.articles || bonCommande.articles.length === 0) {
      return {
        sousTotalHT: 0,
        netHT: 0,
        totalTax: 0,
        grandTotal: 0,
        finalTotal: 0,
        discountAmount: 0,
        globalRemise: 0,
        remiseType: "percentage",
      };
    }

    let sousTotalHTValue = 0;
    let netHTValue = 0;
    let totalTaxValue = 0;
    let grandTotalValue = 0;

    // Calculate initial totals using prix_ttc from articles
    bonCommande.articles.forEach((article) => {
      const qty = Number(article.quantite) || 0;
      const tvaRate = Number(article.tva) || 0;
      const remiseRate = Number(article.remise) || 0;
      
      // Use prix_ttc if available, otherwise calculate from prixUnitaire
      const priceHT = Number(article.prixUnitaire) || 0;
      const priceTTC = Number(article.prix_ttc) || priceHT * (1 + tvaRate / 100);

      // Calculate line amounts exactly like FactureVentePDF
      const montantSousTotalHT = Math.round(qty * priceHT * 1000) / 1000;
      const montantNetHT = Math.round(qty * priceHT * (1 - remiseRate / 100) * 1000) / 1000;
      const montantTTCLigne = Math.round(qty * priceTTC * 1000) / 1000;
      const montantTVA = Math.round((montantTTCLigne - montantNetHT) * 1000) / 1000;

      sousTotalHTValue += montantSousTotalHT;
      netHTValue += montantNetHT;
      totalTaxValue += montantTVA;
      grandTotalValue += montantTTCLigne;
    });

    sousTotalHTValue = Math.round(sousTotalHTValue * 1000) / 1000;
    netHTValue = Math.round(netHTValue * 1000) / 1000;
    totalTaxValue = Math.round(totalTaxValue * 1000) / 1000;
    grandTotalValue = Math.round(grandTotalValue * 1000) / 1000;

    let finalTotalValue = grandTotalValue;
    let discountAmountValue = 0;
    let netHTAfterDiscount = netHTValue;
    let totalTaxAfterDiscount = totalTaxValue;

    const globalRemise = Number(bonCommande.remise) || 0;
    const remiseType = bonCommande.remiseType || "percentage";

    if (globalRemise > 0) {
      if (remiseType === "percentage") {
        discountAmountValue = Math.round(netHTValue * (globalRemise / 100) * 1000) / 1000;
        netHTAfterDiscount = Math.round((netHTValue - discountAmountValue) * 1000) / 1000;
        
        const discountRatio = netHTAfterDiscount / netHTValue;
        totalTaxAfterDiscount = Math.round(totalTaxValue * discountRatio * 1000) / 1000;
        
        finalTotalValue = Math.round((netHTAfterDiscount + totalTaxAfterDiscount) * 1000) / 1000;
        
      } else if (remiseType === "fixed") {
        finalTotalValue = Math.round(Number(globalRemise) * 1000) / 1000;
        
        const tvaToHtRatio = totalTaxValue / netHTValue;
        const htAfterDiscount = Math.round(finalTotalValue / (1 + tvaToHtRatio) * 1000) / 1000;
        
        discountAmountValue = Math.round((netHTValue - htAfterDiscount) * 1000) / 1000;
        netHTAfterDiscount = htAfterDiscount;
        totalTaxAfterDiscount = Math.round(netHTAfterDiscount * tvaToHtRatio * 1000) / 1000;
      }
    }

    const displayNetHT = globalRemise > 0 ? netHTAfterDiscount : netHTValue;
    const displayTotalTax = globalRemise > 0 ? totalTaxAfterDiscount : totalTaxValue;

    return {
      sousTotalHT: Math.round(sousTotalHTValue * 1000) / 1000,
      netHT: Math.round(displayNetHT * 1000) / 1000,
      totalTax: Math.round(displayTotalTax * 1000) / 1000,
      grandTotal: Math.round(grandTotalValue * 1000) / 1000,
      finalTotal: Math.round(finalTotalValue * 1000) / 1000,
      discountAmount: Math.round(discountAmountValue * 1000) / 1000,
      globalRemise,
      remiseType,
    };
  };

  const totals = calculateTotals();

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
          {totals.globalRemise > 0 && (
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, styles.discountRow]}>
                Remise:
              </Text>
              <Text style={[styles.totalValue, styles.discountRow]}>
                - {totals.discountAmount.toFixed(3)} DT
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
              return `CHÈQUE${payment.numero ? ` N°${payment.numero}` : ""}${payment.banque ? ` (${payment.banque})` : ""}`;
            case "virement":
              return `VIREMENT${payment.numero ? ` N°${payment.numero}` : ""}`;
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
        if (method === "carte" ) return `CARTE BANCAIRE (TPE)`;
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