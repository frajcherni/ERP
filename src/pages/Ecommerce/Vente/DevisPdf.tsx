import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image,
} from "@react-pdf/renderer";
import moment from "moment";
import { BonCommandeClient } from "../../../Components/Article/Interfaces";

Font.register({
  family: "Open Sans",
  fonts: [
    {
      src: "https://cdn.jsdelivr.net/npm/open-sans-all@0.1.3/fonts/open-sans-regular.ttf",
      fontWeight: 400,
    },
    {
      src: "https://cdn.jsdelivr.net/npm/open-sans-all@0.1.3/fonts/open-sans-italic.ttf",
      fontWeight: 400,
      fontStyle: "italic",
    },
    {
      src: "https://cdn.jsdelivr.net/npm/open-sans-all@0.1.3/fonts/open-sans-600.ttf",
      fontWeight: 700,
    },
  ],
});

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#FFFFFF",
    padding: 20,
    fontSize: 11,
    fontFamily: "Open Sans",
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
    marginTop: 8, // Reduced from 16 to 8 (moves table up)
    borderTop: "1pt solid #ddd",
    borderLeft: "1pt solid #ddd",
    borderRight: "1pt solid #ddd",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#00aeef",
    paddingVertical: 4, // Reduced from 5 to 4
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "1pt solid #ddd",
    paddingVertical: 2, // Reduced from 6 to 2
    minHeight: 18, // Reduced from 24 to 18
  },
  tableColHeader: {
    paddingHorizontal: 2,
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 9, // Reduced from 10 to 9
    color: "#ffffff",
  },
  tableCol: {
    paddingHorizontal: 4,
    fontSize: 9, // Reduced from 10 to 9
    textAlign: "center",
  },
  colN: { width: "6%" }, // Increased slightly to accommodate removed column
  colArticle: { width: "16%", textAlign: "left" },
  colDesignation: { width: "38%", textAlign: "left" }, // Increased to fill space
  colQteC: { width: "8%" },
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
    marginBottom: -5, // Pull it up slightly
  },
  tvaHeader: {
    flexDirection: "row",
    backgroundColor: "#00aeef",
    paddingVertical: 3, // Reduced from 5 to 3
  },
  tvaRow: {
    flexDirection: "row",
    borderBottom: "1pt solid #ddd",
    paddingVertical: 3, // Reduced from 5 to 3
  },
  tvaHeaderTaux: { width: "22%", fontSize: 9, fontWeight: "bold", textAlign: "center", color: "#fff", paddingHorizontal: 4 },
  tvaHeaderBase: { width: "35%", fontSize: 9, fontWeight: "bold", textAlign: "right", color: "#fff", paddingHorizontal: 4 },
  tvaHeaderMontant: { width: "40%", fontSize: 9, fontWeight: "bold", textAlign: "right", color: "#fff", paddingHorizontal: 4 },
  tvaColTaux: { width: "22%", fontSize: 9, textAlign: "center", paddingHorizontal: 4 },
  tvaColBase: { width: "35%", fontSize: 9, textAlign: "right", paddingHorizontal: 4 },
  tvaColMontant: { width: "40%", fontSize: 9, textAlign: "right", paddingHorizontal: 4 },
  paymentBoxUnderTVA: {
    width: "100%",
    border: "1pt solid #ddd",
    borderTop: "none",
    marginTop: 25,
    alignSelf: 'flex-start',
  },
  paymentHeader: {
    flexDirection: "row",
    backgroundColor: "#00aeef",
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  paymentTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center",
    width: "100%",
  },
  paymentContent: {
    padding: 3,
  },
  paymentLine: {
    fontSize: 10,
    marginBottom: 2,
  },
  totalsContainer: { width: "40%" },
  totalsBox: {
    padding: 5, // Reduced from 8 to 5
    border: "1pt solid #ddd",
    width: "100%",
  },
  summaryRow: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    marginBottom: 2 // Reduced from 3 to 2
  },
  summaryLabel: { fontSize: 10 }, // Reduced from 11 to 10
  summaryValue: { fontSize: 10 }, // Reduced from 11 to 10
  netAPayerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6, // Reduced from 8 to 6
    borderTop: "2pt solid #333",
    marginHorizontal: -5,
    marginBottom: -5,
  },
  netAPayerLabel: {
    fontSize: 11, // Reduced from 12 to 11
    fontWeight: "bold",
    backgroundColor: "#00aeef",
    color: "#ffffff",
    width: "50%",
    paddingVertical: 6, // Reduced from 8 to 6
    paddingLeft: 5, // Reduced from 8 to 5
  },
  netAPayerValue: {
    fontSize: 11, // Reduced from 12 to 11
    fontWeight: "bold",
    textAlign: "right",
    width: "50%",
    paddingVertical: 4, // Reduced from 6 to 4
    paddingRight: 5, // Reduced from 8 to 5
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
    bottom: 155,
    left: 20,
    right: 20,
    padding: 6, // Reduced from 8 to 6
    border: "1pt solid #ddd",
  },
  amountText: { fontSize: 9, textAlign: "center" },
  pageNumber: { position: "absolute", bottom: 5, left: 20, fontSize: 8 },
  boldText: { fontWeight: "bold" },
  clientInfoContainer: {
    width: "50%",
    border: "1pt solid #ddd",
    padding: 6, // Reduced from 8 to 6
    alignItems: "flex-start",
    marginLeft: 200,
  },
  clientLine: { fontSize: 10, marginBottom: 1, fontWeight: "bold", flexWrap: "wrap" },
  clientLineItem: { fontSize: 10, marginBottom: 1, fontWeight: "bold" },
  continuationHeader: {
    fontSize: 10,
    textAlign: "center",
    marginBottom: 8,
    fontWeight: "bold",
    backgroundColor: "#f0f0f0",
    padding: 5,
    border: "1pt solid #ddd"
  },
  vendeurPaymentContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 2, // Reduced from 6 to 2 (moves vendeur up)
  },
  vendeurContainer: {
    width: '55%',
  },
  paymentContainerAboveTable: {
    width: '40%',
  }
});

interface DevisPDFProps {
  bonCommande: BonCommandeClient;
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

const DevisPDF: React.FC<DevisPDFProps> = ({
  bonCommande,
  companyInfo,
}) => {
  const calculateTotals = () => {
    if (!bonCommande?.articles || bonCommande.articles.length === 0) {
      return {
        sousTotalHT: 0,
        netHT: 0,
        totalTax: 0,
        grandTotal: 0,
        finalTotal: 0,
        discountAmount: 0,
        retentionAmount: 0,
        netAPayer: 0,
        acompteTotal: 0,
        resteAPayer: 0,
        totalPaye: 0,
        tvaBreakdown: {} as { [key: number]: { base: number; montant: number } },
        hasRetention: false,
      };
    }

    // Step 1: Calculate original totals (without document-level discount)
    let sousTotalHTValue = 0;
    let totalTaxValue = 0;
    let grandTotalValue = 0;

    // Store line details for proportional calculation
    const lineDetails: Array<{
      ht: number;
      tvaRate: number;
      tvaAmount: number;
      ttc: number;
      qty: number;
    }> = [];

    // Store TVA breakdown for original amounts
    const tvaBreakdownOriginal: { [key: number]: { base: number; montant: number } } = {};

    // Calculate original line amounts (with line-level discounts only)
    bonCommande.articles.forEach((article) => {
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

      // Store line details
      lineDetails.push({
        ht: montantNetHTLigne,
        tvaRate: tvaRate,
        tvaAmount: montantTVALigne,
        ttc: montantTTCLigne,
        qty: qty
      });

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
    const remiseValue = Number(bonCommande.remise) || 0;
    const remiseTypeValue = bonCommande.remiseType || "percentage";

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
        const tvaRates = Array.from(new Set(bonCommande.articles.map(a => Number(a.tva) || 0)));

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
          bonCommande.articles.forEach((article) => {
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

    // For Devis, we don't have payments, retention, etc.
    const netAPayerValue = finalTotalValue;

    return {
      sousTotalHT: Math.round(sousTotalHTValue * 1000) / 1000,
      netHT: Math.round(netHTValue * 1000) / 1000,
      totalTax: Math.round(totalTaxValue * 1000) / 1000,
      grandTotal: Math.round(grandTotalValue * 1000) / 1000,
      finalTotal: Math.round(finalTotalValue * 1000) / 1000,
      discountAmount: Math.round(discountAmountValue * 1000) / 1000,
      retentionAmount: 0,
      netAPayer: Math.round(netAPayerValue * 1000) / 1000,
      acompteTotal: 0,
      resteAPayer: 0,
      tvaBreakdown: tvaBreakdownFinal,
      hasRetention: false,
    };
  };

  const {
    sousTotalHT,
    netHT,
    totalTax,
    grandTotal,
    finalTotal,
    discountAmount,
    retentionAmount,
    netAPayer,
    acompteTotal,
    resteAPayer,
    tvaBreakdown,
    hasRetention,
  } = calculateTotals();

  // Keep the formatCurrency function with .toFixed(3):
  const formatCurrency = (amount: number) => {
    return amount.toFixed(3);
  };

  const numberToWords = (num: number): string => {
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
    if (integerPart === 0) return "Zéro dinars zéro millimes uniquement";

    let words = "";

    // Handle thousands
    if (integerPart >= 1000) {
      const thousands = Math.floor(integerPart / 1000);
      if (thousands === 1) {
        words += "mille";
      } else {
        words += numberToWords(thousands).replace(" dinars zéro millimes uniquement", "") + " mille";
      }
      if (integerPart % 1000 > 0) words += " ";
    }

    const remainder = integerPart % 1000;

    // Handle hundreds
    if (remainder >= 100) {
      const hundreds = Math.floor(remainder / 100);
      if (hundreds === 1) {
        words += "cent";
      } else {
        words += units[hundreds] + " cent";
      }
      if (remainder % 100 > 0) words += " ";
    }

    // Handle tens and units
    const smallRemainder = remainder % 100;
    if (smallRemainder > 0) {
      if (smallRemainder < 10) {
        words += units[smallRemainder];
      } else if (smallRemainder < 20) {
        words += teens[smallRemainder - 10];
      } else {
        const tensDigit = Math.floor(smallRemainder / 10);
        const unitsDigit = smallRemainder % 10;

        if (tensDigit === 7 || tensDigit === 9) {
          // Special cases for 70-79 and 90-99
          words += tens[tensDigit - 1];
          if (unitsDigit === 1) {
            words += "-et-onze";
          } else if (unitsDigit > 1) {
            words += "-" + teens[unitsDigit];
          } else {
            words += "-dix";
          }
        } else {
          words += tens[tensDigit];
          if (unitsDigit > 0) {
            if (unitsDigit === 1 && tensDigit !== 8 && tensDigit !== 9) {
              words += "-et-un";
            } else {
              words += "-" + units[unitsDigit];
            }
          }
        }
      }
    }

    words += " dinars zéro millimes";
    return words.charAt(0).toUpperCase() + words.slice(1) + " uniquement";
  };

  const amountInWords = numberToWords(netAPayer);

  // PAGINATION LOGIC - EXACT SAME AS BONCOMMANDEPDF
  const totalArticles = bonCommande?.articles?.length || 0;

  // Determine pagination based on total articles
  let articlesFirstPage: any[] = [];
  let articlesSecondPage: any[] = [];
  let needsSecondPage = false;
  let totalPages = 1;

  if (totalArticles <= 10) {
    // 1-4 articles: Single page with ALL content
    articlesFirstPage = bonCommande?.articles?.slice(0, 10) || [];
    needsSecondPage = false;
    totalPages = 1;
  } else if (totalArticles <= 13) {
    // 5-13 articles: ALL articles on first page, second page for summary only
    articlesFirstPage = bonCommande?.articles?.slice(0, 13) || [];
    articlesSecondPage = []; // No articles on second page
    needsSecondPage = true; // Force second page for summary content
    totalPages = 2;
  } else {
    // 14+ articles: Split articles across pages
    articlesFirstPage = bonCommande?.articles?.slice(0, 13) || [];
    articlesSecondPage = bonCommande?.articles?.slice(13) || [];
    needsSecondPage = true;
    totalPages = 2;
  }

  // Function to wrap client info text
  const wrapClientText = (text: string, maxCharsPerLine: number = 40): string[] => {
    if (!text || text.trim() === '') return [];
    
    const cleanText = text.trim();
    
    // If text is shorter than max line length, return as is
    if (cleanText.length <= maxCharsPerLine) return [cleanText];
    
    const words = cleanText.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    words.forEach((word) => {
      // Try to add word to current line
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      
      if (testLine.length <= maxCharsPerLine) {
        currentLine = testLine;
      } else {
        // Current line is full, push it and start new line with this word
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    });
    
    // Add the last line
    if (currentLine) lines.push(currentLine);
    
    return lines;
  };

  const renderTVABreakdown = () => {
    const tvaRates = Object.keys(tvaBreakdown).map(rate => parseFloat(rate)).sort((a, b) => a - b);

    if (tvaRates.length === 0) {
      return (
        <View style={styles.tvaTable}>
          <View style={styles.tvaHeader}>
            <Text style={styles.tvaHeaderTaux}>Taux TVA</Text>
            <Text style={styles.tvaHeaderBase}>Base HT</Text>
            <Text style={styles.tvaHeaderMontant}>Montant TVA</Text>
          </View>
          <View style={styles.tvaRow}>
            <Text style={styles.tvaColTaux}>-</Text>
            <Text style={styles.tvaColBase}>0.000 DT</Text>
            <Text style={styles.tvaColMontant}>0.000 DT</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.tvaTable}>
        <View style={styles.tvaHeader}>
          <Text style={styles.tvaHeaderTaux}>Taux TVA</Text>
          <Text style={styles.tvaHeaderBase}>Base HT</Text>
          <Text style={styles.tvaHeaderMontant}>Montant TVA</Text>
        </View>

        {tvaRates.map(rate => (
          <View style={styles.tvaRow} key={rate}>
            <Text style={styles.tvaColTaux}>{rate}%</Text>
            <Text style={styles.tvaColBase}>
              {formatCurrency(tvaBreakdown[rate].base)} DT
            </Text>
            <Text style={styles.tvaColMontant}>
              {formatCurrency(tvaBreakdown[rate].montant)} DT
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const renderPaymentBoxUnderTVA = () => {
    // For Devis, we don't show payment info typically
    return null;
  };

  const renderSummarySection = (summaryBottom: number, amountBottom: number) => {
    return (
      <View style={[styles.summaryArea, { bottom: summaryBottom }]}>
        <View style={styles.leftColumn}>
          {renderTVABreakdown()}
          {renderPaymentBoxUnderTVA()}
        </View>
        <View style={styles.totalsContainer}>
          <View style={styles.totalsBox}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total H.T.:</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(sousTotalHT)} DT
              </Text>
            </View>
            {Number(bonCommande.remise) > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Remise HT:</Text>
                <Text style={styles.summaryValue}>
                  - {formatCurrency(discountAmount)} DT
                </Text>
              </View>
            )}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Net H.T:</Text>
              <Text style={styles.summaryValue}>{formatCurrency(netHT)} DT</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>TVA:</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(totalTax)} DT
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total TTC:</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(finalTotal)} DT
              </Text>
            </View>

            {/* NET À PAYER */}
            <View style={styles.netAPayerContainer}>
              <Text style={styles.netAPayerLabel}>NET À PAYER:</Text>
              <Text style={styles.netAPayerValue}>
                {formatCurrency(netAPayer)} DT
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderTable = (articles: any[], pageIndex: number, isContinuation: boolean = false) => (
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
        <View style={[styles.colQteC, styles.tableColHeader]}>
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
        const prixTTC = Number(item.prix_ttc) || priceHT * (1 + tvaRate / 100);
        const montantTTC = Math.round(qty * prixTTC * 1000) / 1000;

        // Calculate global index based on pagination
        let globalIndex;
        if (pageIndex === 0) {
          globalIndex = index;
        } else {
          // For second page, start from 14 (since first page shows 13 articles)
          globalIndex = 13 + index;
        }

        return (
          <View style={styles.tableRow} key={index}>
            <View style={[styles.colN, styles.tableCol]}>
              <Text>{globalIndex + 1}</Text>
            </View>
            <View style={[styles.colArticle, styles.tableCol]}>
              <Text>{item.article?.reference || "-"}</Text>
            </View>
            <View style={[styles.colDesignation, styles.tableCol]}>
              <Text>{item.designation || item.article?.designation || '-'}</Text>
            </View>
            <View style={[styles.colQteC, styles.tableCol]}>
              <Text>{qty}</Text>
            </View>
            <View style={[styles.colPUHT, styles.tableCol]}>
              <Text>{formatCurrency(priceHT)}</Text>
            </View>
            <View style={[styles.colTVA, styles.tableCol]}>
              <Text>{tvaRate > 0 ? `${tvaRate}%` : "-"}</Text>
            </View>
            <View style={[styles.colPUTTC, styles.tableCol]}>
              <Text>{formatCurrency(prixTTC)}</Text>
            </View>
            <View style={[styles.colMontantTTC, styles.tableCol]}>
              <Text>{formatCurrency(montantTTC)}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );

  const safeBonCommande = bonCommande || {};
  const safeCompanyInfo = companyInfo || {};

  const renderPageHeader = (pageIndex: number) => (
    <>
      <View style={styles.header}>
        <View style={styles.companyInfo}>
          {companyInfo.logo && (
            <Image src={companyInfo.logo} style={styles.logo} />
          )}
        </View>
      </View>
      <View style={styles.commandeDetails}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
          <View>
            <View style={styles.commandeDetailItem}>
              <Text style={styles.N}>
                <Text style={styles.commandeNumberValue}>{bonCommande.numeroCommande || "N/A"}</Text>
              </Text>
            </View>
            <View style={[styles.commandeDetailItem, { marginTop: 4 }]}>
              <Text style={styles.commandeDetailLabel}>
                Date Devis: <Text style={styles.boldText}>
                  {bonCommande.dateCommande ? moment(bonCommande.dateCommande).format("DD/MM/YYYY") : "N/A"}
                </Text>
              </Text>
            </View>
            {bonCommande.dateLivBonCommande && (
              <View style={[styles.commandeDetailItem, { marginTop: 4 }]}>
                <Text style={styles.commandeDetailLabel}>
                  Date Livraison: <Text style={styles.boldText}>
                    {moment(bonCommande.dateLivBonCommande).format("DD/MM/YYYY")}
                  </Text>
                </Text>
              </View>
            )}
          </View>
          <View style={styles.clientInfoContainer}>
            <Text style={styles.sectionTitle}>CLIENT</Text>
            {bonCommande.client && (
              <>
                {/* Raison sociale - keep wrapping if needed */}
                {bonCommande.client.raison_sociale && 
                  wrapClientText(bonCommande.client.raison_sociale, 35).map((line, idx) => (
                    <Text key={`rs-${idx}`} style={styles.clientLineItem}>
                      {line}
                    </Text>
                  ))
                }
                
                {/* Matricule fiscal */}
                {bonCommande.client.matricule_fiscal && (
                  <Text style={styles.clientLineItem}>
                    MF: {bonCommande.client.matricule_fiscal}
                  </Text>
                )}
                
                {/* Adresse */}
                {bonCommande.client.adresse && (
                  <Text style={styles.clientLineItem}>
                    {bonCommande.client.adresse}
                  </Text>
                )}
                
                {/* Phones */}
                {bonCommande.client.telephone1 && (
                  <Text style={styles.clientLineItem}>
                    Tél: {bonCommande.client.telephone1}
                  </Text>
                )}
                {bonCommande.client.telephone2 && (
                  <Text style={styles.clientLineItem}>
                    Tél: {bonCommande.client.telephone2}
                  </Text>
                )}
              </>
            )}
          </View>
        </View>
      </View>
      <View style={styles.vendeurPaymentContainer}>
        <View style={styles.vendeurContainer}>
          <Text style={styles.sectionTitle}>VENDEUR</Text>
          {bonCommande.vendeur && (
            <Text style={styles.vendeurText}>
              {[bonCommande.vendeur.nom, bonCommande.vendeur.prenom].filter(Boolean).join(" ")}
            </Text>
          )}
        </View>
      </View>
    </>
  );

  const renderFooter = () => (
    <View style={styles.footer}>
      <Text style={styles.footerLine}>
        {[
          safeCompanyInfo.name,
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
    const totalArticles = bonCommande?.articles?.length || 0;
    
    // Calculate bottom position based on article count
    const summaryBottom = totalArticles < 3 ? 240 : 190; // Reduced from 255/205
    const amountBottom = totalArticles < 3 ? 190 : 140; // Reduced from 205/155

    return (
      <>
        {renderSummarySection(summaryBottom, amountBottom)}
        <View style={[styles.amountInWords, { bottom: amountBottom }]}>
          <Text style={styles.amountText}>
            Arrêté le présent devis à la somme de : {amountInWords}
          </Text>
        </View>
        <View style={[styles.cachetSignatureSection, { bottom: amountBottom - 40 }]}>
          <View style={styles.signatureContainer}>
            <Text style={styles.signatureText}>Client</Text>
            <Text style={styles.subText}>Signature</Text>
          </View>
          <View style={styles.cachetContainer}>
            <Text style={styles.cachetText}> Signature & Cachet</Text>
            <Text style={styles.subText}>Du Responsable </Text>
          </View>
        </View>
      </>
    );
  };

  return (
    <Document>
      {/* FIRST PAGE */}
      <Page key={0} size="A4" style={styles.page}>
        {renderPageHeader(0)}
        {renderTable(articlesFirstPage, 0)}
        {/* Show summary on first page ONLY for 1-4 articles */}
        {totalArticles <= 10 && renderSummaryContent()}
        {renderFooter()}
        <Text style={styles.pageNumber}>Page 1 sur {totalPages}</Text>
      </Page>

      {/* SECOND PAGE - For 5+ articles */}
      {needsSecondPage && (
        <Page key={1} size="A4" style={styles.page}>
          {renderPageHeader(1)}
          {/* Show table only if there are articles for second page (14+ articles case) */}
          {articlesSecondPage.length > 0 && renderTable(articlesSecondPage, 1, true)}
          {/* ALWAYS show summary on second page for 5+ articles */}
          {renderSummaryContent()}
          {renderFooter()}
          <Text style={styles.pageNumber}>Page 2 sur {totalPages}</Text>
        </Page>
      )}
    </Document>
  );
};

export default DevisPDF;