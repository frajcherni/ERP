// src/Components/FactureClient/FactureClientReceiptPDF.tsx
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
import { FactureClient } from "../../../Components/Article/Interfaces";

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
  numeroFacture: {
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
  dateFacture: {
    fontWeight: "bold",
  },
  vendeurRow: {
    marginTop: 4,
  },
  exonerationBadge: {
    backgroundColor: "#00aeef",
    color: "#ffffff",
    fontSize: 8,
    padding: 2,
    marginLeft: 4,
    borderRadius: 2,
  },

    
  companyInfoLine: {
    fontSize: 8,
    textAlign: "center",
    marginTop: 2,
    marginBottom: 2,
  },
  
});

interface FactureClientReceiptPDFProps {
  facture: FactureClient;
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
  retentionAmount: number;
  netAPayer: number;
}

const FactureClientReceiptPDF: React.FC<FactureClientReceiptPDFProps> = ({
  facture,
  companyInfo,
}) => {
  const exoneration = facture?.exoneration || false;
  const timbreFiscal = facture?.timbreFiscal || false;

  // Calculate totals EXACTLY like in FactureClient PDF
  const calculateTotals = (): Totals => {
    if (!facture?.articles || facture.articles.length === 0) {
      return {
        sousTotalHT: 0,
        netHT: 0,
        totalTax: 0,
        grandTotal: 0,
        finalTotal: 0,
        discountAmount: 0,
        globalRemise: 0,
        remiseType: "fixed",
        retentionAmount: 0,
        netAPayer: 0,
      };
    }

    // Step 1: Calculate original totals (without document-level discount)
    let sousTotalHTValue = 0;
    let netHTBeforeGlobalRemise = 0;
    let totalTaxValue = 0;
    let grandTotalValue = 0;

    // Calculate original line amounts (with line-level discounts only)
    facture.articles.forEach((article) => {
      const qty = Number(article.quantite) || 0;
      const articleRemise = Number(article.remise) || 0;
      const tvaRate = exoneration ? 0 : Number(article.tva) || 0;

      let unitHT = Number(article.prixUnitaire) || 0;
      let unitTTC = Number(article.prix_ttc) || unitHT * (1 + tvaRate / 100);

      const montantSousTotalHT = Math.round(qty * unitHT * 1000) / 1000;
      const montantNetHTLigne = Math.round(
        qty * unitHT * (1 - articleRemise / 100) * 1000
      ) / 1000;
      const montantTTCLigne = Math.round(qty * unitTTC * 1000) / 1000;
      const montantTVALigne = Math.round(
        (montantTTCLigne - montantNetHTLigne) * 1000
      ) / 1000;

      sousTotalHTValue = Math.round((sousTotalHTValue + montantSousTotalHT) * 1000) / 1000;
      netHTBeforeGlobalRemise = Math.round((netHTBeforeGlobalRemise + montantNetHTLigne) * 1000) / 1000;
      totalTaxValue = Math.round((totalTaxValue + montantTVALigne) * 1000) / 1000;
      grandTotalValue = Math.round((grandTotalValue + montantTTCLigne) * 1000) / 1000;
    });

    // Step 2: Apply global remise according to principle
    let netHTAfterGlobalRemise = netHTBeforeGlobalRemise;
    let totalTaxAfterGlobalRemise = totalTaxValue;
    let finalTotalValue = grandTotalValue;
    let discountAmountValue = 0;

    const globalRemise = Number(facture.remise) || 0;
    const remiseType = facture.remiseType || "fixed";

    if (globalRemise > 0) {
      if (remiseType === "percentage") {
        // Percentage remise: Apply on HT base
        discountAmountValue = Math.round(
          (netHTBeforeGlobalRemise * (globalRemise / 100)) * 1000
        ) / 1000;
        netHTAfterGlobalRemise = Math.round(
          (netHTBeforeGlobalRemise - discountAmountValue) * 1000
        ) / 1000;

        if (netHTBeforeGlobalRemise > 0) {
          const tvaToHtRatio = Math.round(
            (totalTaxValue / netHTBeforeGlobalRemise) * 1000
          ) / 1000;
          totalTaxAfterGlobalRemise = Math.round(
            (netHTAfterGlobalRemise * tvaToHtRatio) * 1000
          ) / 1000;
        } else {
          totalTaxAfterGlobalRemise = 0;
        }

        finalTotalValue = Math.round(
          (netHTAfterGlobalRemise + totalTaxAfterGlobalRemise) * 1000
        ) / 1000;
      } else if (remiseType === "fixed") {
        // Fixed remise: User enters the final TTC amount
        finalTotalValue = Math.round(Number(globalRemise) * 1000) / 1000;

        // Check if single or multiple TVA rates
        const uniqueTvaRates = Array.from(
          new Set(facture.articles.map((a) => Number(a.tva) || 0))
        );

        if (uniqueTvaRates.length === 1 && uniqueTvaRates[0] > 0) {
          // SINGLE TVA RATE FORMULA: Net HT = TTC / (1 + TVA rate)
          const tvaRate = uniqueTvaRates[0] / 100;
          netHTAfterGlobalRemise = Math.round((finalTotalValue / (1 + tvaRate)) * 1000) / 1000;
          totalTaxAfterGlobalRemise = Math.round((finalTotalValue - netHTAfterGlobalRemise) * 1000) / 1000;
        } else {
          // MULTIPLE TVA RATES: Use proportional method
          const discountCoefficient = finalTotalValue / grandTotalValue;

          let newTotalHT = 0;
          let newTotalTVA = 0;

          facture.articles.forEach((article) => {
            const qty = Number(article.quantite) || 0;
            const articleRemise = Number(article.remise) || 0;
            const unitHT = Number(article.prixUnitaire) || 0;
            const tvaRate = exoneration ? 0 : Number(article.tva) || 0;

            const lineHTAfterDiscount = qty * unitHT * (1 - articleRemise / 100);
            const newLineHT = lineHTAfterDiscount * discountCoefficient;
            const newLineTVA = newLineHT * (tvaRate / 100);

            newTotalHT += newLineHT;
            newTotalTVA += newLineTVA;
          });

          netHTAfterGlobalRemise = Math.round(newTotalHT * 1000) / 1000;
          totalTaxAfterGlobalRemise = Math.round(newTotalTVA * 1000) / 1000;
        }

        discountAmountValue = Math.round(
          (netHTBeforeGlobalRemise - netHTAfterGlobalRemise) * 1000
        ) / 1000;
      }
    }

    // Step 3: Apply exoneration
    if (exoneration) {
      totalTaxAfterGlobalRemise = 0;
      finalTotalValue = netHTAfterGlobalRemise;
    }

    // Step 4: Add timbre fiscal
    if (timbreFiscal) {
      finalTotalValue = Math.round((finalTotalValue + 1) * 1000) / 1000;
    }

    // Step 5: Calculate retention
    let retentionAmount = 0;
    if (facture.paymentMethods) {
      facture.paymentMethods.forEach((pm: any) => {
        if (pm.method === "retenue") {
          const tauxRetention = pm.tauxRetention || 1;
          retentionAmount = Math.round(
            (finalTotalValue * tauxRetention) / 100 * 1000
          ) / 1000;
        }
      });
    }

    // Step 6: Calculate net à payer
    let netAPayer = Math.round((finalTotalValue - retentionAmount) * 1000) / 1000;
    netAPayer = Math.max(0, netAPayer);

    return {
      sousTotalHT: sousTotalHTValue,
      netHT: globalRemise > 0 ? netHTAfterGlobalRemise : netHTBeforeGlobalRemise,
      totalTax: exoneration ? 0 : (globalRemise > 0 ? totalTaxAfterGlobalRemise : totalTaxValue),
      grandTotal: grandTotalValue,
      finalTotal: finalTotalValue,
      discountAmount: discountAmountValue,
      globalRemise,
      remiseType,
      retentionAmount,
      netAPayer,
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
        <Text style={styles.title}>FACTURE CLIENT</Text>

        {/* Receipt Information */}
        <View style={styles.receiptInfo}>
          <View style={styles.infoRow}>
            <Text style={styles.numeroFacture}>{facture.numeroFacture}</Text>
            <Text style={styles.dateFacture}>
              {moment(facture.dateFacture).format("DD/MM/YYYY")}
            </Text>
          </View>
          
          {/* Client Info    <View style={styles.infoRow}>
            <Text>
              <Text style={styles.infoLabel}>Client: </Text>
              {facture.client?.raison_sociale}
            </Text>
          </View> */}
        
          
          {/* Matricule Fiscal if available   {facture.client?.matricule_fiscal && (
            <View style={styles.infoRow}>
              <Text>
                <Text style={styles.infoLabel}>MF: </Text>
                {facture.client.matricule_fiscal}
              </Text>
            </View>
          )} */}
        
          
          {/* Vendeur Info */}
          <View style={[styles.infoRow, styles.vendeurRow]}>
            <Text>
              <Text style={styles.infoLabel}>Vendeur: </Text>
              {facture.vendeur?.prenom} {facture.vendeur?.nom}
            </Text>
          </View>

          {/* Exoneration Badge if applicable */}
          {exoneration && (
            <View style={styles.infoRow}>
              <Text style={styles.exonerationBadge}>EXONORÉ</Text>
            </View>
          )}
        </View>

        <View style={styles.divider} />

        {/* Articles Table */}
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

          {facture.articles?.map((item, index) => {
            const qty = Number(item.quantite) || 0;
            const tvaRate = exoneration ? 0 : Number(item.tva) || 0;
            const priceHT = Number(item.prixUnitaire) || 0;
            const priceTTC = Number(item.prix_ttc) || priceHT * (1 + tvaRate / 100);
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

        {/* Totals Section */}
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

          {/* Show Timbre Fiscal if applicable */}
          {timbreFiscal && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Timbre Fiscal:</Text>
              <Text style={styles.totalValue}>1.000 DT</Text>
            </View>
          )}

          {/* Show Retention if applicable */}
          {totals.retentionAmount > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Retenue:</Text>
              <Text style={styles.totalValue}>
                - {totals.retentionAmount.toFixed(3)} DT
              </Text>
            </View>
          )}

          {/* NET À PAYER */}
          <View style={styles.finalTotal}>
            <Text>NET À PAYER:</Text>
            <Text>{totals.netAPayer.toFixed(3)} DT</Text>
          </View>
        </View>

        {/* Payment Methods Summary */}
        {facture.paymentMethods && facture.paymentMethods.length > 0 && (
          <View style={styles.paymentMethod}>
            {facture.paymentMethods
              .filter((pm: any) => pm.method !== "retenue")
              .map((pm: any, idx: number) => {
                const amount = typeof pm.amount === 'string' 
                  ? parseFloat(pm.amount.replace(',', '.')) 
                  : Number(pm.amount) || 0;
                
                let methodText = "";
                switch (pm.method) {
                  case "especes": methodText = "Espèces"; break;
                  case "cheque": methodText = "Chèque"; break;
                  case "virement": methodText = "Virement"; break;
                  case "traite": methodText = "Traite"; break;
                  case "tpe": methodText = "Carte Bancaire"; break;
                  default: methodText = pm.method;
                }
                
                return (
                  <Text key={idx} style={styles.paymentText}>
                    {methodText}: {amount.toFixed(3)} DT
                  </Text>
                );
              })}
          </View>
        )}

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
          {companyInfo.taxId && (
            <Text style={styles.footerInfo}>
              MF: {companyInfo.taxId}
            </Text>
          )}
        </View>
      </Page>
    </Document>
  );
};

export default FactureClientReceiptPDF;