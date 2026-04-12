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

// Use the exact same styles from BonCommandePDF
const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#FFFFFF",
    padding: 20,
    fontSize: 11,
    fontFamily: "Helvetica",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    borderBottom: "1pt solid #000",
    paddingBottom: 6,
  },
  commandeDetails: {
    marginBottom: 6,
  },
  commandeDetailItem: {
    marginBottom: 2,
  },
  commandeDetailLabel: {
    fontSize: 13,
  },
  N: {
    fontSize: 15,
  },
  commandeNumberValue: {
    fontSize: 16,
    fontWeight: "bold",
  },
  companyInfo: {
    width: "60%",
  },
  logo: {
    width: 200,
    marginBottom: 5,
  },
  clientVendeurSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    marginTop: 3,
  },
  vendeurInfo: {
    width: "35%",
    alignItems: "flex-start",
  },
  sectionTitle: {
    fontSize: 12,
    marginBottom: 3,
    fontWeight: "normal",
  },
  clientText: {
    fontSize: 10,
    marginBottom: 1,
    fontWeight: "bold",
  },
  vendeurText: {
    fontSize: 10,
    marginBottom: 1,
    fontWeight: "bold",
  },
  tableContainer: {
    marginBottom: 15,
    marginTop: 6,
    borderTop: "1pt solid #ddd",
    borderLeft: "1pt solid #ddd",
    borderRight: "1pt solid #ddd",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#00aeef",
    paddingVertical: 5,
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "1pt solid #ddd",
    paddingVertical: 6,
    minHeight: 24,
  },
  tableColHeader: {
    paddingHorizontal: 4,
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 10,
    color: "#ffffff",
  },
  tableCol: {
    paddingHorizontal: 4,
    fontSize: 10,
    textAlign: "center",
  },
  colN: { width: "5%" },
  colArticle: { width: "15%", textAlign: "left" },
  colDesignation: { width: "30%", textAlign: "left" },
  colQuantite: { width: "8%" },
  colPUHT: { width: "10%", textAlign: "right" },
  colTVA: { width: "8%" },
  colPUTTC: { width: "10%", textAlign: "right" },
  colMontantTTC: { width: "10%", textAlign: "right" },
  summaryArea: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 160,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  leftColumn: {
    width: "50%",
    flexDirection: "column",
  },
  tvaTable: {
    borderTop: "1pt solid #ddd",
    borderLeft: "1pt solid #ddd",
    borderRight: "1pt solid #ddd",
    width: "100%",
  },
  tvaHeader: {
    flexDirection: "row",
    backgroundColor: "#00aeef",
    paddingVertical: 5,
  },
  tvaRow: {
    flexDirection: "row",
    borderBottom: "1pt solid #ddd",
    paddingVertical: 5,
  },
  tvaHeaderTaux: {
    width: "25%",
    fontSize: 10,
    fontWeight: "bold",
    textAlign: "center",
    color: "#fff",
    paddingHorizontal: 4,
  },
  tvaHeaderBase: {
    width: "35%",
    fontSize: 10,
    fontWeight: "bold",
    textAlign: "right",
    color: "#fff",
    paddingHorizontal: 4,
  },
  tvaHeaderMontant: {
    width: "40%",
    fontSize: 10,
    fontWeight: "bold",
    textAlign: "right",
    color: "#fff",
    paddingHorizontal: 4,
  },
  tvaColTaux: {
    width: "25%",
    fontSize: 10,
    textAlign: "center",
    paddingHorizontal: 4,
  },
  tvaColBase: {
    width: "35%",
    fontSize: 10,
    textAlign: "right",
    paddingHorizontal: 4,
  },
  tvaColMontant: {
    width: "40%",
    fontSize: 10,
    textAlign: "right",
    paddingHorizontal: 4,
  },
  totalsContainer: { width: "40%" },
  totalsBox: {
    padding: 8,
    border: "1pt solid #ddd",
    width: "100%",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  summaryLabel: { fontSize: 11 },
  summaryValue: { fontSize: 11 },
  netAPayerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    borderTop: "2pt solid #333",
    marginHorizontal: -8,
    marginBottom: -8,
  },
  netAPayerLabel: {
    fontSize: 12,
    fontWeight: "bold",
    backgroundColor: "#00aeef",
    color: "#ffffff",
    width: "50%",
    paddingVertical: 8,
    paddingLeft: 8,
  },
  netAPayerValue: {
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "right",
    width: "50%",
    paddingVertical: 6,
    paddingRight: 8,
  },
  cachetSignatureSection: {
    flexDirection: "row",
    justifyContent: "space-around",
    position: "absolute",
    bottom: 75,
    left: 20,
    right: 20,
  },
  signatureContainer: { width: "35%", alignItems: "center" },
  cachetContainer: { width: "35%", alignItems: "center" },
  signatureText: { fontSize: 11, marginBottom: 2, fontWeight: "bold" },
  cachetText: { fontSize: 11, marginBottom: 2, fontWeight: "bold" },
  subText: { fontSize: 9, fontStyle: "italic" },
  footer: {
    position: "absolute",
    bottom: 5,
    left: 20,
    right: 20,
    textAlign: "center",
    fontSize: 8,
    borderTop: "1pt solid #ddd",
    paddingTop: 3,
  },
  footerLine: {
    marginBottom: 1,
  },
  amountInWords: {
    position: "absolute",
    bottom: 115,
    left: 20,
    right: 20,
    padding: 8,
    border: "1pt solid #ddd",
  },
  amountText: { fontSize: 10, textAlign: "center" },
  pageNumber: { position: "absolute", bottom: 5, left: 20, fontSize: 8 },
  boldText: { fontWeight: "bold" },
  clientInfoContainer: {
    width: "60%",
    alignItems: "flex-start",
    left: "180",
  },
  clientLine: {
    fontSize: 10,
    marginBottom: 1,
    fontWeight: "bold",
    flexWrap: "wrap",
  },
  vendeurPaymentContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  vendeurContainer: {
    width: "55%",
  },
  paymentContainerAboveTable: {
    width: "40%",
  },
  exonerationBadge: {
    backgroundColor: "#00aeef",
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 10,
    paddingVertical: 8,
    paddingHorizontal: 6,
    marginBottom: 4,
    marginLeft: 2,
    marginTop: 2,
    alignSelf: 'flex-start',
    borderRadius: 2,
  },
});

interface FacturePDFProps {
  facture: FactureClient;
  companyInfo: {
    name: string;
    address: string;
    city: string;
    phone: string;
    email: string;
    website: string;
    logo?: string;
    taxId: string;
    gsm: string;
  };
}

const FacturePDF: React.FC<FacturePDFProps> = ({ facture, companyInfo }) => {
  const exoneration = facture?.exoneration || false;


  // Replace the calculateTotals function with this:

  // Replace the calculateTotals function in FacturePDF.tsx with this EXACT SAME function:
  // Replace the calculateTotals function with this EXACT COPY from FactureVentePDF:

  const calculateTotals = () => {
    if (!facture?.articles || facture.articles.length === 0) {
      return {
        sousTotalHT: 0,
        netHT: 0,
        totalTax: 0,
        grandTotal: 0,
        finalTotal: 0,
        discountAmount: 0,
        tvaBreakdown: {},
      };
    }

    // Step 1: Calculate original totals (without document-level discount)
    let sousTotalHTValue = 0;
    let totalTaxValue = 0;
    let grandTotalValue = 0;

    // Store TVA breakdown for original amounts
    const tvaBreakdownOriginal: { [key: number]: { base: number; montant: number } } = {};

    // Calculate original line amounts (with line-level discounts only)
    facture.articles.forEach((article) => {
      const qty = Number(article.quantite) || 0;
      const articleRemise = Number(article.remise) || 0;
      const tvaRate = Number(article.tva) || 0;

      let unitHT = Number(article.prixUnitaire) || 0;
      let unitTTC = Number(article.prix_ttc) || unitHT * (1 + tvaRate / 100);

      // Calculate line amounts
      const lineHT = Math.round(unitHT * 1000) / 1000;
      const lineTTC = Math.round(unitTTC * 1000) / 1000;

      const montantSousTotalHT = Math.round(qty * lineHT * 1000) / 1000;
      const montantNetHTLigne = Math.round(
        qty * lineHT * (1 - articleRemise / 100) * 1000
      ) / 1000;
      const montantTTCLigne = Math.round(qty * lineTTC * 1000) / 1000;
      const montantTVALigne = Math.round(
        (montantTTCLigne - montantNetHTLigne) * 1000
      ) / 1000;

      sousTotalHTValue += montantSousTotalHT;
      totalTaxValue += montantTVALigne;
      grandTotalValue += montantTTCLigne;

      // Store original TVA breakdown
      if (tvaRate > 0) {
        if (!tvaBreakdownOriginal[tvaRate]) {
          tvaBreakdownOriginal[tvaRate] = { base: 0, montant: 0 };
        }
        tvaBreakdownOriginal[tvaRate].base += montantNetHTLigne;
        tvaBreakdownOriginal[tvaRate].montant += montantTVALigne;
      }
    });

    // Round original totals
    sousTotalHTValue = Math.round(sousTotalHTValue * 1000) / 1000;
    totalTaxValue = Math.round(totalTaxValue * 1000) / 1000;
    grandTotalValue = Math.round(grandTotalValue * 1000) / 1000;

    let finalTotalValue = grandTotalValue;
    let discountAmountValue = 0;
    let netHTValue = sousTotalHTValue;

    // Initialize final TVA breakdown
    let tvaBreakdownFinal: { [key: number]: { base: number; montant: number } } = {};

    // Apply document-level remise if exists
    const remiseValue = Number(facture.remise) || 0;
    const remiseTypeValue = facture.remiseType || "percentage";

    if (remiseValue > 0) {
      if (remiseTypeValue === "percentage") {
        // ✅ SIMPLE FORMULA: Apply percentage discount on HT
        discountAmountValue = Math.round((sousTotalHTValue * remiseValue / 100) * 1000) / 1000;
        netHTValue = sousTotalHTValue - discountAmountValue;

        // Calculate new TVA proportionally
        const tvaToHtRatio = sousTotalHTValue > 0 ? totalTaxValue / sousTotalHTValue : 0;
        const newTVA = Math.round((netHTValue * tvaToHtRatio) * 1000) / 1000;

        totalTaxValue = newTVA;
        finalTotalValue = Math.round((netHTValue + newTVA) * 1000) / 1000;

        // Calculate TVA breakdown proportionally
        const discountRatio = netHTValue / sousTotalHTValue;

        Object.keys(tvaBreakdownOriginal).forEach(rate => {
          const tvaRate = parseFloat(rate);
          tvaBreakdownFinal[tvaRate] = {
            base: Math.round((tvaBreakdownOriginal[tvaRate].base * discountRatio) * 1000) / 1000,
            montant: Math.round((tvaBreakdownOriginal[tvaRate].montant * discountRatio) * 1000) / 1000
          };
        });

      } else if (remiseTypeValue === "fixed") {
        // ✅ FIXED DISCOUNT FORMULA: TTC is given, calculate HT
        finalTotalValue = Math.round(Number(remiseValue) * 1000) / 1000;

        // Find all unique TVA rates
        const tvaRates = Array.from(new Set(facture.articles.map(a => Number(a.tva) || 0)));

        if (tvaRates.length === 1 && tvaRates[0] > 0) {
          // ✅ SINGLE TVA RATE: HT = TTC / (1 + TVA rate)
          const tvaRate = tvaRates[0];
          netHTValue = Math.round((finalTotalValue / (1 + tvaRate / 100)) * 1000) / 1000;
          totalTaxValue = Math.round((finalTotalValue - netHTValue) * 1000) / 1000;

          // For single rate, TVA breakdown is simple
          tvaBreakdownFinal[tvaRate] = {
            base: netHTValue,
            montant: totalTaxValue
          };

        } else {
          // ✅ MULTIPLE TVA RATES: Use proportional method
          const discountCoefficient = grandTotalValue > 0 ? finalTotalValue / grandTotalValue : 0;

          // Reset values
          netHTValue = 0;
          totalTaxValue = 0;

          // Recalculate each line proportionally
          facture.articles.forEach((article) => {
            const qty = Number(article.quantite) || 0;
            const articleRemise = Number(article.remise) || 0;
            const tvaRate = Number(article.tva) || 0;
            let unitHT = Number(article.prixUnitaire) || 0;

            // Calculate original line amounts
            const montantNetHTLigne = Math.round(
              qty * unitHT * (1 - articleRemise / 100) * 1000
            ) / 1000;

            // Apply coefficient to get new amounts
            const newLineHT = Math.round((montantNetHTLigne * discountCoefficient) * 1000) / 1000;
            const newLineTVA = Math.round((newLineHT * (tvaRate / 100)) * 1000) / 1000;

            netHTValue += newLineHT;
            totalTaxValue += newLineTVA;

            // Update TVA breakdown
            if (tvaRate > 0) {
              if (!tvaBreakdownFinal[tvaRate]) {
                tvaBreakdownFinal[tvaRate] = { base: 0, montant: 0 };
              }
              tvaBreakdownFinal[tvaRate].base += newLineHT;
              tvaBreakdownFinal[tvaRate].montant += newLineTVA;
            }
          });

          // Round final values
          netHTValue = Math.round(netHTValue * 1000) / 1000;
          totalTaxValue = Math.round(totalTaxValue * 1000) / 1000;
        }

        discountAmountValue = Math.round((sousTotalHTValue - netHTValue) * 1000) / 1000;
      }

      // Final rounding
      netHTValue = Math.round(netHTValue * 1000) / 1000;
      totalTaxValue = Math.round(totalTaxValue * 1000) / 1000;
      finalTotalValue = Math.round(finalTotalValue * 1000) / 1000;
      discountAmountValue = Math.round(discountAmountValue * 1000) / 1000;

    } else {
      // No document-level discount - use original values
      netHTValue = sousTotalHTValue;
      tvaBreakdownFinal = { ...tvaBreakdownOriginal };
    }

    // Apply exoneration if needed
    if (exoneration) {
      // For exoneration, keep TVA breakdown for display but set final TVA to 0
      totalTaxValue = 0;
      finalTotalValue = netHTValue; // TTC = HT when TVA is 0
    }

    // Add timbre fiscal if needed
    if (facture.timbreFiscal) {
      finalTotalValue = Math.round((finalTotalValue + 1) * 1000) / 1000;
    }

    return {
      sousTotalHT: Math.round(sousTotalHTValue * 1000) / 1000,
      netHT: Math.round(netHTValue * 1000) / 1000,
      totalTax: Math.round(totalTaxValue * 1000) / 1000,
      grandTotal: Math.round(grandTotalValue * 1000) / 1000,
      finalTotal: Math.round(finalTotalValue * 1000) / 1000,
      discountAmount: Math.round(discountAmountValue * 1000) / 1000,
      tvaBreakdown: tvaBreakdownFinal,
    };
  };

  // Then use the results:
  const {
    sousTotalHT,
    netHT,  // Will be 152.364
    totalTax,  // Will be 27.637
    grandTotal,
    finalTotal,  // Will be 180.000 (if fixed discount of 180.000 is entered)
    discountAmount,
    tvaBreakdown,
  } = calculateTotals();

  // Keep your original renderTVABreakdown and calculateTVATable functions
  // But update calculateTVATable to use the tvaBreakdown from calculateTotals:
  const calculateTVATable = () => {
    try {
      // Use the tvaBreakdown from calculateTotals
      let totalBase = 0;
      let totalMontant = 0;

      Object.keys(tvaBreakdown).forEach(rate => {
        const tvaRate = parseFloat(rate);
        totalBase += tvaBreakdown[tvaRate].base;
        totalMontant += tvaBreakdown[tvaRate].montant;
      });

      return {
        tvaBreakdown: tvaBreakdown,
        totalBase: Math.round(totalBase * 1000) / 1000,
        totalMontant: Math.round(totalMontant * 1000) / 1000,
      };
    } catch (error) {
      console.error("Error calculating TVA table:", error);
      return {
        tvaBreakdown: {},
        totalBase: 0,
        totalMontant: 0,
      };
    }
  };



  // Calculate TVA table
  const tvaTableData = calculateTVATable();

  // Update renderTVABreakdown to use the new TVA table data
  const renderTVABreakdown = () => {
    const tvaRates = Object.keys(tvaTableData.tvaBreakdown)
      .map((rate) => parseFloat(rate))
      .filter((rate) => !isNaN(rate))
      .sort((a, b) => a - b);

    return (
      <View style={styles.tvaTable}>
        <View style={styles.tvaHeader}>
          <Text style={styles.tvaHeaderTaux}>Taux TVA</Text>
          <Text style={styles.tvaHeaderBase}>Base Net HT</Text>
          <Text style={styles.tvaHeaderMontant}>Total TVA</Text>
        </View>

        {/* Individual TVA rates breakdown */}
        {tvaRates.map((rate) => (
          <View style={styles.tvaRow} key={rate}>
            <Text style={styles.tvaColTaux}>{rate}%</Text>
            <Text style={styles.tvaColBase}>
              {formatCurrency(tvaTableData.tvaBreakdown[rate].base)} DT
            </Text>
            <Text style={styles.tvaColMontant}>
              {formatCurrency(tvaTableData.tvaBreakdown[rate].montant)} DT
            </Text>
          </View>
        ))}

        {/* Exonoré row - shows the netHT value and total TVA */}
        {exoneration && tvaRates.length > 0 && (
          <View style={styles.tvaRow}>
            <Text style={styles.tvaColTaux}>Exonoré</Text>
            <Text style={styles.tvaColBase}>
              {formatCurrency(tvaTableData.totalBase)} DT{" "}
              {/* This should be 5629.000 DT */}
            </Text>
            <Text style={styles.tvaColMontant}>
              {formatCurrency(tvaTableData.totalMontant)} DT
            </Text>
          </View>
        )}
      </View>
    );
  };

  const formatCurrency = (amount: number) => {
    return amount.toFixed(3);
  };

  const numberToWords = (num: number): string => {
    try {
      const units = [
        "",
        "un",
        "deux",
        "trois",
        "quatre",
        "cinq",
        "six",
        "sept",
        "huit",
        "neuf",
      ];
      const teens = [
        "dix",
        "onze",
        "douze",
        "treize",
        "quatorze",
        "quinze",
        "seize",
        "dix-sept",
        "dix-huit",
        "dix-neuf",
      ];
      const tens = [
        "",
        "dix",
        "vingt",
        "trente",
        "quarante",
        "cinquante",
        "soixante",
        "soixante-dix",
        "quatre-vingt",
        "quatre-vingt-dix",
      ];

      const integerPart = Math.floor(num);

      if (integerPart === 0) {
        return "Zéro dinars zéro millime uniquement";
      }

      let words = "";

      if (integerPart >= 1000) {
        const thousands = Math.floor(integerPart / 1000);
        if (thousands === 1) {
          words += "mille";
        } else if (thousands < 10) {
          words += units[thousands] + " mille";
        } else if (thousands < 20) {
          words += teens[thousands - 10] + " mille";
        } else if (thousands < 100) {
          const ten = Math.floor(thousands / 10);
          const unit = thousands % 10;
          words += tens[ten];
          if (unit > 0) {
            if (ten === 7 || ten === 9) {
              words += "-" + teens[unit];
            } else {
              words += "-" + units[unit];
            }
          }
          words += " mille";
        }

        const remainder = integerPart % 1000;
        if (remainder > 0) {
          words += " ";
        }
      }

      const remainder = integerPart % 1000;
      if (remainder >= 100) {
        const hundreds = Math.floor(remainder / 100);
        if (hundreds === 1) {
          words += "cent";
        } else {
          words += units[hundreds] + " cent";
        }
        const smallRemainder = remainder % 100;
        if (smallRemainder > 0) {
          words += " ";
        }
      }

      const smallRemainder = remainder % 100;
      if (smallRemainder > 0) {
        if (smallRemainder < 10) {
          words += units[smallRemainder];
        } else if (smallRemainder < 20) {
          words += teens[smallRemainder - 10];
        } else {
          const ten = Math.floor(smallRemainder / 10);
          const unit = smallRemainder % 10;
          words += tens[ten];
          if (unit > 0) {
            if (ten === 7 || ten === 9) {
              words += "-" + teens[unit];
            } else {
              words += "-" + units[unit];
            }
          }
        }
      }

      words += " dinars zéro millime";

      return words.charAt(0).toUpperCase() + words.slice(1) + " uniquement";
    } catch (error) {
      console.error("Error converting number to words:", error);
      return "Montant en dinars uniquement";
    }
  };

  const amountInWords = numberToWords(finalTotal);

  const wrapText = (text: string, maxLength: number = 25): string[] => {
    if (!text || text.length <= maxLength) {
      return [text];
    }

    const words = text.split(" ");
    const lines: string[] = [];
    let currentLine = "";

    words.forEach((word) => {
      if ((currentLine + " " + word).length > maxLength) {
        if (currentLine) {
          lines.push(currentLine);
        }
        currentLine = word;
      } else {
        currentLine = currentLine ? currentLine + " " + word : word;
      }
    });

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  };

  // Updated renderTVABreakdown function

  const renderSummarySection = () => {
    const bottomPos = 160;
    const hasRemise = Number(facture?.remise) > 0;
    const hasTimbre = facture?.timbreFiscal;

    // DON'T calculate totalTTC as netHT + totalTax
    // Instead, use finalTotal for Total TTC (same as FactureVentePDF)
    //const totalTTC = finalTotal; // ← This is the key change!


    const totalTTCWithoutTimbre = hasTimbre ? finalTotal - 1 : finalTotal;


    return (
      <View style={[styles.summaryArea, { bottom: bottomPos }]}>
        <View style={styles.leftColumn}>
          {renderTVABreakdown()}
        </View>
        <View style={styles.totalsContainer}>
          <View style={styles.totalsBox}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total H.T.:</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(sousTotalHT)} DT
              </Text>
            </View>
            {hasRemise && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Remise:</Text>
                <Text style={styles.summaryValue}>
                  - {formatCurrency(discountAmount)} DT
                </Text>
              </View>
            )}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Net H.T.:</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(netHT)} DT {/* 152.364 DT */}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total TVA:</Text>
              <Text style={styles.summaryValue}>
                {exoneration ? "0.000" : formatCurrency(totalTax)} DT {/* 27.637 DT */}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total TTC:</Text>
              <Text style={styles.summaryValue}>
                {exoneration ? "0.000" : formatCurrency(totalTTCWithoutTimbre)} DT {/* Now 180.000 DT, not 180.001 DT */}
              </Text>
            </View>
            {facture?.timbreFiscal && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Timbre Fiscal:</Text>
                <Text style={styles.summaryValue}>1.000 DT</Text>
              </View>
            )}
            <View style={styles.netAPayerContainer}>
              <Text style={styles.netAPayerLabel}>NET À PAYER:</Text>
              <Text style={styles.netAPayerValue}>
                {formatCurrency(finalTotal)} DT {/* 180.000 DT */}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const articlesPerPage = 12;
  const articleChunks = [];
  const articles = facture?.articles || [];
  for (let i = 0; i < articles.length; i += articlesPerPage) {
    articleChunks.push(articles.slice(i, i + articlesPerPage));
  }

  if (articleChunks.length === 0) {
    articleChunks.push([]);
  }

  const renderTable = (articles: any[], pageIndex: number) => (
    <View style={styles.tableContainer}>
      <View style={styles.tableHeader}>
        <View style={[styles.colN, styles.tableColHeader]}>
          <Text>N°</Text>
        </View>
        <View style={[styles.colArticle, styles.tableColHeader]}>
          <Text>ARTICLE</Text>
        </View>
        <View style={[styles.colDesignation, styles.tableColHeader]}>
          <Text>DESIGNATION</Text>
        </View>
        <View style={[styles.colQuantite, styles.tableColHeader]}>
          <Text>QTE</Text>
        </View>
        <View style={[styles.colPUHT, styles.tableColHeader]}>
          <Text>P.U.H.T</Text>
        </View>
        <View style={[styles.colTVA, styles.tableColHeader]}>
          <Text>TVA</Text>
        </View>
        <View style={[styles.colPUTTC, styles.tableColHeader]}>
          <Text>P.U.TTC</Text>
        </View>
        <View style={[styles.colMontantTTC, styles.tableColHeader]}>
          <Text>M.TTC</Text>
        </View>
      </View>
      {articles.map((item, index) => {
        const qty = Number(item.quantite) || 0;
        const priceHT = Number(item.prixUnitaire) || 0;
        const tvaRate = Number(item.tva) || 0;
        const remiseRate = Number(item.remise || 0);
        const priceTTC = Number(item.prix_ttc) || priceHT * (1 + tvaRate / 100);
        const montantTTCLigne = Math.round(qty * priceTTC * 1000) / 1000;

        return (
          <View style={styles.tableRow} key={index}>
            <View style={[styles.colN, styles.tableCol]}>
              <Text>{pageIndex * articlesPerPage + index + 1}</Text>
            </View>
            <View style={[styles.colArticle, styles.tableCol]}>
              <Text>{item.article?.reference || "-"}</Text>
            </View>
            <View style={[styles.colDesignation, styles.tableCol]}>
              <Text>{item.designation || item.article?.designation || '-'}</Text>
            </View>
            <View style={[styles.colQuantite, styles.tableCol]}>
              <Text>{qty}</Text>
            </View>
            <View style={[styles.colPUHT, styles.tableCol]}>
              <Text>{formatCurrency(priceHT)}</Text>
            </View>
            <View style={[styles.colTVA, styles.tableCol]}>
              <Text>{tvaRate > 0 ? `${tvaRate}%` : "-"}</Text>
            </View>
            <View style={[styles.colPUTTC, styles.tableCol]}>
              <Text>{formatCurrency(priceTTC)}</Text>
            </View>
            <View style={[styles.colMontantTTC, styles.tableCol]}>
              <Text>{formatCurrency(montantTTCLigne)}</Text>
            </View>
          </View>
        );
      })}
      {articles.length === 0 && (
        <View style={styles.tableRow}>
          <View
            style={[styles.colDesignation, styles.tableCol, { width: "100%" }]}
          >
            <Text>Aucun article</Text>
          </View>
        </View>
      )}
    </View>
  );

  const safeFacture = facture || {};
  const safeCompanyInfo = companyInfo || {};

  const formatPhoneNumber = (phone: string | null | undefined): string => {
    if (!phone) return "";

    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, "");

    // Tunisian phone number format
    if (cleaned.length === 8) {
      return `${cleaned.substring(0, 2)} ${cleaned.substring(
        2,
        5
      )} ${cleaned.substring(5, 8)}`;
    }

    // If already formatted with spaces, just return it
    if (phone.includes(" ") && phone.replace(/\s/g, "").length === 8) {
      return phone;
    }

    // Handle other lengths
    if (cleaned.length === 10) {
      return `${cleaned.substring(0, 2)} ${cleaned.substring(
        2,
        5
      )} ${cleaned.substring(5, 10)}`;
    }

    // Return original if can't format
    return phone;
  };

  const renderPageHeader = (pageIndex: number) => (
    <>
      <View style={styles.header}>
        <View style={styles.companyInfo}>
          {safeCompanyInfo.logo && (
            <Image src={safeCompanyInfo.logo} style={styles.logo} />
          )}
        </View>
      </View>
      {pageIndex === 0 && (
        <>
          <View style={styles.commandeDetails}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <View>
                <View style={styles.commandeDetailItem}>
                  <Text style={styles.N}>
                    <Text style={styles.commandeNumberValue}>
                      {facture.numeroFacture || "N/A"}
                    </Text>
                  </Text>
                </View>
                <View style={styles.commandeDetailItem}>
                  <Text style={styles.commandeDetailLabel}>
                    Date:{" "}
                    <Text style={styles.boldText}>
                      {safeFacture.dateFacture
                        ? moment(safeFacture.dateFacture).format("DD/MM/YYYY")
                        : "N/A"}
                    </Text>
                  </Text>
                </View>
                {facture.bonLivraison && (
                  <View style={styles.commandeDetailItem}>
                    <Text style={styles.commandeDetailLabel}>
                      Source:{" "}
                      <Text style={styles.boldText}>
                        BL #{facture.bonLivraison.numeroLivraison}
                      </Text>
                    </Text>
                  </View>
                )}
                {facture.bonCommandeClient && (
                  <View style={styles.commandeDetailItem}>
                    <Text style={styles.commandeDetailLabel}>
                      Source:{" "}
                      <Text style={styles.boldText}>
                        BC #{facture.bonCommandeClient.numeroCommande}
                      </Text>
                    </Text>
                  </View>
                )}
                {facture.venteComptoire && (
                  <View style={styles.commandeDetailItem}>
                    <Text style={styles.commandeDetailLabel}>
                      Source:{" "}
                      <Text style={styles.boldText}>
                        Vente #{facture.venteComptoire.numeroCommande || facture.venteComptoire.id}
                      </Text>
                    </Text>
                  </View>
                )}
              </View>
              <View style={styles.clientInfoContainer}>
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                  <Text style={styles.sectionTitle}>CLIENT</Text>

                  {exoneration && (
                    <Text style={styles.exonerationBadge}>
                      EXONORÉ
                    </Text>
                  )}
                </View>
                {/* Client Name */}
                {safeFacture.client?.raison_sociale &&
                  wrapText(safeFacture.client.raison_sociale).map(
                    (line, index) => (
                      <Text style={styles.clientLine} key={`raison-${index}`}>
                        {line}
                      </Text>
                    )
                  )}

                {/* Matricule Fiscal */}
                {safeFacture.client?.matricule_fiscal && (
                  <Text style={styles.clientLine}>
                    MF: {safeFacture.client.matricule_fiscal}
                  </Text>
                )}

                {/* Address */}
                {safeFacture.client?.adresse &&
                  wrapText(safeFacture.client.adresse).map((line, index) => (
                    <Text style={styles.clientLine} key={`adresse-${index}`}>
                      {line}
                    </Text>
                  ))}

                {/* Telephone 1 - Formatted */}
                {safeFacture.client?.telephone1 && (
                  <Text style={styles.clientLine}>
                    Tél: {formatPhoneNumber(safeFacture.client.telephone1)}
                  </Text>
                )}

                {/* Telephone 2 - Formatted */}
                {safeFacture.client?.telephone2 && (
                  <Text style={styles.clientLine}>
                    Tél: {formatPhoneNumber(safeFacture.client.telephone2)}
                  </Text>
                )}
              </View>
            </View>
          </View>
          <View style={styles.vendeurPaymentContainer}>
            <View style={styles.vendeurContainer}>
              <Text style={styles.sectionTitle}>VENDEUR</Text>
              {safeFacture.vendeur && (
                <Text style={styles.vendeurText}>
                  {[safeFacture.vendeur.nom, safeFacture.vendeur.prenom]
                    .filter(Boolean)
                    .join(" ")}
                </Text>
              )}
            </View>
            <View style={styles.paymentContainerAboveTable}>
              {/* Empty - same as BC design */}
            </View>
          </View>
        </>
      )}
    </>
  );

  const renderFooter = () => (
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
  );

  const renderSummaryContent = () => {
    const amountBottom = 115;

    return (
      <>
        {renderSummarySection()}
        <View style={[styles.amountInWords, { bottom: amountBottom }]}>
          <Text style={styles.amountText}>
            Arrêtée la présente facture à la somme de : {amountInWords}
          </Text>
        </View>
        <View style={styles.cachetSignatureSection}>
          <View style={styles.signatureContainer}>
            <Text style={styles.signatureText}>Signature & Cachet</Text>
            <Text style={styles.subText}>Du Responsable</Text>
          </View>
          <View style={styles.cachetContainer}>
            <Text style={styles.cachetText}>Le Client</Text>
            <Text style={styles.subText}>Reçu conforme</Text>
            <Text style={styles.subText}>Signature & Cachet</Text>
          </View>
        </View>
      </>
    );
  };

  let addExtraSummaryPage = false;

  if (articleChunks.length > 1) {
    addExtraSummaryPage = true;
  } else if (articleChunks.length === 1) {
    const articlesOnLastPage = articleChunks[0].length;
    const maxArticlesForSinglePage = 10;

    if (articlesOnLastPage > maxArticlesForSinglePage) {
      addExtraSummaryPage = true;
    }
  }

  const totalPages = articleChunks.length + (addExtraSummaryPage ? 1 : 0);

  return (
    <Document>
      {articleChunks.map((articles, pageIndex) => (
        <Page key={pageIndex} size="A4" style={styles.page}>
          {renderPageHeader(pageIndex)}
          {renderTable(articles, pageIndex)}
          {!addExtraSummaryPage &&
            pageIndex === articleChunks.length - 1 &&
            renderSummaryContent()}
          {renderFooter()}
          <Text style={styles.pageNumber}>
            Page {pageIndex + 1} sur {totalPages}
          </Text>
        </Page>
      ))}
      {addExtraSummaryPage && (
        <Page key={articleChunks.length} size="A4" style={styles.page}>
          {renderPageHeader(articleChunks.length)}
          {renderSummaryContent()}
          {renderFooter()}
          <Text style={styles.pageNumber}>
            Page {articleChunks.length + 1} sur {totalPages}
          </Text>
        </Page>
      )}
    </Document>
  );
};

export default FacturePDF;