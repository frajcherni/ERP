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
    marginTop: 8,
    borderTop: "1pt solid #ddd",
    borderLeft: "1pt solid #ddd",
    borderRight: "1pt solid #ddd",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#00aeef",
    paddingVertical: 4,
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "1pt solid #ddd",
    height: 32,
    overflow: "hidden",
  },
  tableColHeader: {
    paddingHorizontal: 2,
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 10,
    color: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
  },
  tableCol: {
    paddingHorizontal: 4,
    fontSize: 10,
    textAlign: "center",
    justifyContent: "center",
    alignItems: "center",
  },
  colN: { width: "6%" },
  colArticle: { width: "16%", textAlign: "left" },
  colDesignation: { width: "38%", textAlign: "left" },
  colQteC: { width: "8%" },
  colQteLiv: { width: "8%" },
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
    width: "103%",
  },
  tvaHeader: {
    flexDirection: "row",
    backgroundColor: "#00aeef",
    paddingVertical: 3,
  },
  tvaRow: {
    flexDirection: "row",
    borderBottom: "1pt solid #ddd",
    paddingVertical: 5,
  },
  tvaHeaderTaux: { width: "22%", fontSize: 10, fontWeight: "bold", textAlign: "center", color: "#fff", paddingHorizontal: 4 },
  tvaHeaderBase: { width: "35%", fontSize: 10, fontWeight: "bold", textAlign: "right", color: "#fff", paddingHorizontal: 4 },
  tvaHeaderMontant: { width: "40%", fontSize: 10, fontWeight: "bold", textAlign: "right", color: "#fff", paddingHorizontal: 4 },
  tvaColTaux: { width: "22%", fontSize: 10, textAlign: "center", paddingHorizontal: 4 },
  tvaColBase: { width: "35%", fontSize: 10, textAlign: "right", paddingHorizontal: 4 },
  tvaColMontant: { width: "40%", fontSize: 10, textAlign: "right", paddingHorizontal: 4 },
  paymentBoxUnderTVA: {
    width: "103%",
    border: "1pt solid #ddd",
    borderTop: "none",
    marginTop: 25,
    alignSelf: "flex-start",
  },
  paymentHeader: {
    flexDirection: "row",
    backgroundColor: "#00aeef",
    paddingVertical: 2,
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
    padding: 8,
    border: "1pt solid #ddd",
    width: "100%",
  },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 3 },
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
    paddingVertical: 6,
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
    bottom: 115,
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
    padding: 8,
    border: "1pt solid #ddd",
  },
  amountText: { fontSize: 9, textAlign: "center" },
  pageNumber: { position: "absolute", bottom: 5, left: 20, fontSize: 8 },
  boldText: { fontWeight: "bold" },
  clientInfoContainer: {
    width: "50%",
    border: "1pt solid #ddd",
    padding: 8,
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
    border: "1pt solid #ddd",
  },
  vendeurPaymentContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  vendeurContainer: {
    width: "55%",
  },
  paymentContainerAboveTable: {
    width: "40%",
  },
});

interface BonCommandePDFProps {
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

// ─────────────────────────────────────────────
// PAGINATION CONSTANTS
// ─────────────────────────────────────────────
const LAST_PAGE_MAX = 6;   // max articles on the final page (with summary)
const INTER_PAGE_MAX = 15; // max articles on intermediate pages (no summary)

interface PageGroup {
  articles: any[];
  isLast: boolean;      // true → render summary/totals on this page
  startIndex: number;   // global article index where this group starts (for row numbering)
}

/**
 * Splits the full article list into page groups following these rules:
 *
 *  • ≤ 6 articles  → single page with summary (isLast = true)
 *  • > 6 articles  → fill pages GREEDILY from the front:
 *      - Each intermediate page takes as many as possible (up to 15)
 *      - If ≤ 6 articles remain → last page (articles + summary)
 *      - If all articles are consumed by intermediate pages with nothing left
 *        → append a dedicated summary-only page (articles = [])
 *
 * Why greedy from the front?
 *   Filling forward maximises every page before moving to the next,
 *   so page 1 always holds the maximum possible articles.
 *   The old "fill-from-back" approach (interCount = remaining − LAST_MAX)
 *   produced tiny first pages (e.g. 2 articles on page 1 for N=10).
 */
function buildPageGroups(articles: any[]): PageGroup[] {
  if (!articles || articles.length === 0) {
    return [{ articles: [], isLast: true, startIndex: 0 }];
  }

  // Single-page case
  if (articles.length <= LAST_PAGE_MAX) {
    return [{ articles, isLast: true, startIndex: 0 }];
  }

  const groups: PageGroup[] = [];
  let cursor = 0;

  while (cursor < articles.length) {
    const remaining = articles.length - cursor;

    if (remaining <= LAST_PAGE_MAX) {
      // Remaining articles fit on the last page → attach summary
      groups.push({ articles: articles.slice(cursor), isLast: true, startIndex: cursor });
      cursor = articles.length;
    } else {
      // Greedily fill an intermediate page (up to INTER_PAGE_MAX)
      const take = Math.min(INTER_PAGE_MAX, remaining);
      groups.push({ articles: articles.slice(cursor, cursor + take), isLast: false, startIndex: cursor });
      cursor += take;
    }
  }

  // If every article landed on intermediate pages (none left for a last page),
  // append a dedicated summary-only page so totals/payment always appear.
  if (groups.length > 0 && !groups[groups.length - 1].isLast) {
    groups.push({ articles: [], isLast: true, startIndex: articles.length });
  }

  return groups;
}

const BonCommandePDF: React.FC<BonCommandePDFProps> = ({
  bonCommande,
  companyInfo,
}) => {

  // ─────────────────────────────────────────────
  // TOTALS CALCULATION (unchanged)
  // ─────────────────────────────────────────────
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

    let sousTotalHTValue = 0;
    let totalTaxValue = 0;
    let grandTotalValue = 0;

    const tvaBreakdownOriginal: { [key: number]: { base: number; montant: number } } = {};

    bonCommande.articles.forEach((article) => {
      const qty = Number(article.quantite) || 0;
      const articleRemise = Number(article.remise) || 0;
      const tvaRate = Number(article.tva) || 0;
      let unitHT = Number(article.prixUnitaire) || 0;
      let unitTTC = Number(article.prix_ttc) || unitHT * (1 + tvaRate / 100);

      const lineHT = Math.round(unitHT * 1000) / 1000;
      const lineTTC = Math.round(unitTTC * 1000) / 1000;
      const montantSousTotalHT = Math.round(qty * lineHT * 1000) / 1000;
      const montantNetHTLigne = Math.round(qty * lineHT * (1 - articleRemise / 100) * 1000) / 1000;
      const montantTTCLigne = Math.round(qty * lineTTC * 1000) / 1000;
      const montantTVALigne = Math.round((montantTTCLigne - montantNetHTLigne) * 1000) / 1000;

      sousTotalHTValue += montantSousTotalHT;
      totalTaxValue += montantTVALigne;
      grandTotalValue += montantTTCLigne;

      if (tvaRate > 0) {
        if (!tvaBreakdownOriginal[tvaRate]) {
          tvaBreakdownOriginal[tvaRate] = { base: 0, montant: 0 };
        }
        tvaBreakdownOriginal[tvaRate].base += montantNetHTLigne;
        tvaBreakdownOriginal[tvaRate].montant += montantTVALigne;
      }
    });

    sousTotalHTValue = Math.round(sousTotalHTValue * 1000) / 1000;
    totalTaxValue = Math.round(totalTaxValue * 1000) / 1000;
    grandTotalValue = Math.round(grandTotalValue * 1000) / 1000;

    let finalTotalValue = grandTotalValue;
    let discountAmountValue = 0;
    let netHTValue = sousTotalHTValue;
    let tvaBreakdownFinal: { [key: number]: { base: number; montant: number } } = {};

    const remiseValue = Number(bonCommande.remise) || 0;
    const remiseTypeValue = bonCommande.remiseType || "percentage";

    if (remiseValue > 0) {
      if (remiseTypeValue === "percentage") {
        discountAmountValue = Math.round((sousTotalHTValue * remiseValue / 100) * 1000) / 1000;
        netHTValue = sousTotalHTValue - discountAmountValue;
        const tvaToHtRatio = sousTotalHTValue > 0 ? totalTaxValue / sousTotalHTValue : 0;
        const newTVA = Math.round((netHTValue * tvaToHtRatio) * 1000) / 1000;
        totalTaxValue = newTVA;
        finalTotalValue = Math.round((netHTValue + newTVA) * 1000) / 1000;
        const discountRatio = netHTValue / sousTotalHTValue;
        Object.keys(tvaBreakdownOriginal).forEach(rate => {
          const tvaRate = parseFloat(rate);
          tvaBreakdownFinal[tvaRate] = {
            base: Math.round((tvaBreakdownOriginal[tvaRate].base * discountRatio) * 1000) / 1000,
            montant: Math.round((tvaBreakdownOriginal[tvaRate].montant * discountRatio) * 1000) / 1000,
          };
        });

      } else if (remiseTypeValue === "fixed") {
        finalTotalValue = Math.round(Number(remiseValue) * 1000) / 1000;
        const tvaRates = Array.from(new Set(bonCommande.articles.map((a: any) => Number(a.tva) || 0)));

        if (tvaRates.length === 1 && tvaRates[0] > 0) {
          const tvaRate = tvaRates[0];
          netHTValue = Math.round((finalTotalValue / (1 + tvaRate / 100)) * 1000) / 1000;
          totalTaxValue = Math.round((finalTotalValue - netHTValue) * 1000) / 1000;
          tvaBreakdownFinal[tvaRate] = { base: netHTValue, montant: totalTaxValue };
        } else {
          const discountCoefficient = grandTotalValue > 0 ? finalTotalValue / grandTotalValue : 0;
          netHTValue = 0;
          totalTaxValue = 0;
          bonCommande.articles.forEach((article: any) => {
            const qty = Number(article.quantite) || 0;
            const articleRemise = Number(article.remise) || 0;
            const tvaRate = Number(article.tva) || 0;
            const unitHT = Number(article.prixUnitaire) || 0;
            const montantNetHTLigne = Math.round(qty * unitHT * (1 - articleRemise / 100) * 1000) / 1000;
            const newLineHT = Math.round((montantNetHTLigne * discountCoefficient) * 1000) / 1000;
            const newLineTVA = Math.round((newLineHT * (tvaRate / 100)) * 1000) / 1000;
            netHTValue += newLineHT;
            totalTaxValue += newLineTVA;
            if (tvaRate > 0) {
              if (!tvaBreakdownFinal[tvaRate]) {
                tvaBreakdownFinal[tvaRate] = { base: 0, montant: 0 };
              }
              tvaBreakdownFinal[tvaRate].base += newLineHT;
              tvaBreakdownFinal[tvaRate].montant += newLineTVA;
            }
          });
          netHTValue = Math.round(netHTValue * 1000) / 1000;
          totalTaxValue = Math.round(totalTaxValue * 1000) / 1000;
        }
        discountAmountValue = Math.round((sousTotalHTValue - netHTValue) * 1000) / 1000;
      }

      netHTValue = Math.round(netHTValue * 1000) / 1000;
      totalTaxValue = Math.round(totalTaxValue * 1000) / 1000;
      finalTotalValue = Math.round(finalTotalValue * 1000) / 1000;
      discountAmountValue = Math.round(discountAmountValue * 1000) / 1000;

    } else {
      netHTValue = sousTotalHTValue;
      tvaBreakdownFinal = { ...tvaBreakdownOriginal };
    }

    const retentionAmountValue = Number(bonCommande.montantRetenue) || 0;
    const netAPayerValue = finalTotalValue;

    const acompteFromMethods = bonCommande.paymentMethods
      ? bonCommande.paymentMethods.reduce((sum: number, pm: any) =>
          pm.method !== "retenue" ? sum + (Number(pm.amount) || 0) : sum, 0)
      : 0;

    const acompteFromPaiements = bonCommande.paiements
      ? bonCommande.paiements
          .filter((p: any) => p.modePaiement !== "Retention")
          .reduce((sum: number, p: any) => sum + (Number(p.montant) || 0), 0)
      : 0;

    const acompteTotal = acompteFromMethods + acompteFromPaiements;

    const regularPaymentsFromPaiements = bonCommande.paiements
      ?.filter((p: any) => p.modePaiement !== "Retention")
      .reduce((sum: number, p: any) => sum + Number(p.montant), 0) || 0;

    const regularPaymentsFromMethods = bonCommande.paymentMethods
      ?.filter((pm: any) => pm.method !== "retenue")
      .reduce((sum: number, pm: any) => sum + (Number(pm.amount) || 0), 0) || 0;

    const totalRegularPayments = regularPaymentsFromPaiements + regularPaymentsFromMethods;
    const resteAPayerValue = Math.max(0, netAPayerValue - totalRegularPayments);

    return {
      sousTotalHT: Math.round(sousTotalHTValue * 1000) / 1000,
      netHT: Math.round(netHTValue * 1000) / 1000,
      totalTax: Math.round(totalTaxValue * 1000) / 1000,
      grandTotal: Math.round(grandTotalValue * 1000) / 1000,
      finalTotal: Math.round(finalTotalValue * 1000) / 1000,
      discountAmount: Math.round(discountAmountValue * 1000) / 1000,
      retentionAmount: Math.round(retentionAmountValue * 1000) / 1000,
      netAPayer: Math.round(netAPayerValue * 1000) / 1000,
      acompteTotal: Math.round(acompteTotal * 1000) / 1000,
      resteAPayer: Math.round(resteAPayerValue * 1000) / 1000,
      tvaBreakdown: tvaBreakdownFinal,
      hasRetention: bonCommande.hasRetenue || false,
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

  // ─────────────────────────────────────────────
  // PAGINATION  ← the only structural change
  // ─────────────────────────────────────────────
  const allArticles = bonCommande?.articles || [];
  const pageGroups: PageGroup[] = buildPageGroups(allArticles);
  const totalPages = pageGroups.length;

  // ─────────────────────────────────────────────
  // HELPERS (unchanged)
  // ─────────────────────────────────────────────
  const formatCurrency = (amount: number) => amount.toFixed(3);

  const numberToWords = (num: number): string => {
    const units = ["", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf"];
    const teens = ["dix", "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf"];
    const tens = ["", "dix", "vingt", "trente", "quarante", "cinquante", "soixante", "soixante-dix", "quatre-vingt", "quatre-vingt-dix"];
    const integerPart = Math.floor(num);
    if (integerPart === 0) return "Zéro dinars zéro millimes uniquement";
    let words = "";
    if (integerPart >= 1000) {
      const thousands = Math.floor(integerPart / 1000);
      words += thousands === 1 ? "mille" : numberToWords(thousands).replace(" dinars zéro millimes uniquement", "") + " mille";
      if (integerPart % 1000 > 0) words += " ";
    }
    const remainder = integerPart % 1000;
    if (remainder >= 100) {
      const hundreds = Math.floor(remainder / 100);
      words += hundreds === 1 ? "cent" : units[hundreds] + " cent";
      if (remainder % 100 > 0) words += " ";
    }
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
          words += tens[tensDigit - 1];
          if (unitsDigit === 1) words += "-et-onze";
          else if (unitsDigit > 1) words += "-" + teens[unitsDigit];
          else words += "-dix";
        } else {
          words += tens[tensDigit];
          if (unitsDigit > 0) {
            words += unitsDigit === 1 && tensDigit !== 8 ? "-et-un" : "-" + units[unitsDigit];
          }
        }
      }
    }
    words += " dinars zéro millimes";
    return words.charAt(0).toUpperCase() + words.slice(1) + " uniquement";
  };

  const amountInWords = numberToWords(netAPayer);

  const wrapClientText = (text: string, maxCharsPerLine: number = 40): string[] => {
    if (!text || text.trim() === "") return [];
    const cleanText = text.trim();
    if (cleanText.length <= maxCharsPerLine) return [cleanText];
    const words = cleanText.split(" ");
    const lines: string[] = [];
    let currentLine = "";
    words.forEach((word) => {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      if (testLine.length <= maxCharsPerLine) {
        currentLine = testLine;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    });
    if (currentLine) lines.push(currentLine);
    return lines;
  };

  const getMethodLabel = (method: string): string => {
    const labels: { [key: string]: string } = {
      especes: "Espèces",
      cheque: "Chèque",
      virement: "Virement",
      traite: "Traite",
      carte: "Carte",
      tpe: "TPE",
      retenue: "Retenue à la source",
    };
    return labels[method] || method;
  };

  const getPaymentModeLabel = (mode: string): string => {
    const labels: { [key: string]: string } = {
      Espece: "Espèces",
      Cheque: "Chèque",
      Virement: "Virement",
      Traite: "Traite",
      Retention: "Retention à la source",
      Autre: "Autre",
    };
    return labels[mode] || mode;
  };

  // ─────────────────────────────────────────────
  // RENDERERS (unchanged except renderTable signature)
  // ─────────────────────────────────────────────

  const renderTVABreakdown = () => {
    const tvaRates = Object.keys(tvaBreakdown).map((r) => parseFloat(r)).sort((a, b) => a - b);
    return (
      <View style={styles.tvaTable}>
        <View style={styles.tvaHeader}>
          <Text style={styles.tvaHeaderTaux}>Taux TVA</Text>
          <Text style={styles.tvaHeaderBase}>Base HT</Text>
          <Text style={styles.tvaHeaderMontant}>Montant TVA</Text>
        </View>
        {tvaRates.length === 0 ? (
          <View style={styles.tvaRow}>
            <Text style={styles.tvaColTaux}>-</Text>
            <Text style={styles.tvaColBase}>0.000 DT</Text>
            <Text style={styles.tvaColMontant}>0.000 DT</Text>
          </View>
        ) : (
          tvaRates.map((rate) => (
            <View style={styles.tvaRow} key={rate}>
              <Text style={styles.tvaColTaux}>{rate}%</Text>
              <Text style={styles.tvaColBase}>{formatCurrency(tvaBreakdown[rate].base)} DT</Text>
              <Text style={styles.tvaColMontant}>{formatCurrency(tvaBreakdown[rate].montant)} DT</Text>
            </View>
          ))
        )}
      </View>
    );
  };

  const renderPaymentBoxUnderTVA = () => {
    const paiements = bonCommande.paiements || [];
    const paymentMethods = bonCommande.paymentMethods || [];
    if (paiements.length === 0 && paymentMethods.length === 0) return null;

    const paymentLines: JSX.Element[] = [];
    const regularDescs: JSX.Element[][] = [];
    const retentionDescs: JSX.Element[][] = [];
    let hasRegularPayments = false;

    paiements.forEach((p: any) => {
      if (p.modePaiement === "Retention") {
        retentionDescs.push([
          <Text key="retenue">Retenue à la source d&apos;un montant de </Text>,
          <Text key="retenueAmount" style={styles.boldText}>{formatCurrency(Number(p.montant))} DT</Text>,
        ]);
      } else {
        hasRegularPayments = true;
        const elements: JSX.Element[] = [];
        const date = p.date ? moment(p.date).format("DD/MM/YYYY") : null;
        if (p.modePaiement === "Cheque") {
          elements.push(<Text key="cheque">chèque </Text>);
          elements.push(<Text key="banque" style={styles.boldText}>{p.banque}</Text>);
          elements.push(<Text key="n"> N° </Text>);
          elements.push(<Text key="numero" style={styles.boldText}>{p.numeroCheque}</Text>);
          if (date) { elements.push(<Text key="d1"> du </Text>); elements.push(<Text key="d2" style={styles.boldText}>{date}</Text>); }
        } else if (p.modePaiement === "Traite") {
          elements.push(<Text key="traite">traite N° </Text>);
          elements.push(<Text key="numero" style={styles.boldText}>{p.numeroTraite}</Text>);
          elements.push(<Text key="e1"> échéance </Text>);
          elements.push(<Text key="e2" style={styles.boldText}>{p.dateEcheance ? moment(p.dateEcheance).format("DD/MM/YYYY") : "Non spécifiée"}</Text>);
        } else {
          elements.push(<Text key="mode" style={styles.boldText}>{getPaymentModeLabel(p.modePaiement)}</Text>);
          if (date) { elements.push(<Text key="d1"> du </Text>); elements.push(<Text key="d2" style={styles.boldText}>{date}</Text>); }
        }
        elements.push(<Text key="m1"> d&apos;un montant de </Text>);
        elements.push(<Text key="m2" style={styles.boldText}>{formatCurrency(Number(p.montant))} DT</Text>);
        regularDescs.push(elements);
      }
    });

    paymentMethods.forEach((pm: any) => {
      if (pm.method === "retenue") {
        const amount = Number(pm.amount) || (finalTotal * (pm.tauxRetention || 1)) / 100;
        retentionDescs.push([
          <Text key="retenue">Retenue à la source d&apos;un montant de </Text>,
          <Text key="retenueAmount" style={styles.boldText}>{formatCurrency(amount)} DT</Text>,
        ]);
      } else {
        hasRegularPayments = true;
        const amount = Number(pm.amount) || 0;
        const date = pm.date ? moment(pm.date).format("DD/MM/YYYY")
          : pm.datePaiement ? moment(pm.datePaiement).format("DD/MM/YYYY")
          : pm.createdAt ? moment(pm.createdAt).format("DD/MM/YYYY")
          : null;
        const elements: JSX.Element[] = [];
        if (pm.method === "cheque") {
          elements.push(<Text key="cheque">chèque </Text>);
          elements.push(<Text key="banque" style={styles.boldText}>{pm.banque || ""}</Text>);
          elements.push(<Text key="n"> N° </Text>);
          elements.push(<Text key="numero" style={styles.boldText}>{pm.numero || ""}</Text>);
          if (date) { elements.push(<Text key="d1"> du </Text>); elements.push(<Text key="d2" style={styles.boldText}>{date}</Text>); }
        } else if (pm.method === "traite") {
          elements.push(<Text key="traite">traite N° </Text>);
          elements.push(<Text key="numero" style={styles.boldText}>{pm.numero || ""}</Text>);
          elements.push(<Text key="e1"> échéance </Text>);
          elements.push(<Text key="e2" style={styles.boldText}>{pm.dateEcheance ? moment(pm.dateEcheance).format("DD/MM/YYYY") : "Non spécifiée"}</Text>);
        } else {
          elements.push(<Text key="mode" style={styles.boldText}>{getMethodLabel(pm.method)}</Text>);
          if (date) { elements.push(<Text key="d1"> du </Text>); elements.push(<Text key="d2" style={styles.boldText}>{date}</Text>); }
        }
        elements.push(<Text key="m1"> d&apos;un montant de </Text>);
        elements.push(<Text key="m2" style={styles.boldText}>{formatCurrency(amount)} DT</Text>);
        regularDescs.push(elements);
      }
    });

    regularDescs.forEach((desc, index) => {
      paymentLines.push(
        <Text key={`regular-${index}`} style={styles.paymentLine}>
          <Text style={styles.boldText}>Acompte {index + 1}: </Text>
          {desc}
        </Text>
      );
    });
    retentionDescs.forEach((desc, index) => {
      paymentLines.push(
        <Text key={`retention-${index}`} style={styles.paymentLine}>{desc}</Text>
      );
    });

    return (
      <View style={styles.paymentBoxUnderTVA}>
        <View style={styles.paymentHeader}>
          <Text style={styles.paymentTitle}>INFORMATIONS DE PAIEMENTS</Text>
        </View>
        <View style={styles.paymentContent}>{paymentLines}</View>
      </View>
    );
  };

  const renderSummarySection = (summaryBottom: number, amountBottom: number, floated: boolean = true) => {
    const retentionAmt = Number(bonCommande.montantRetenue) || 0;
    const netAPayerWithRetention = Math.max(0, finalTotal - retentionAmt);
    const resteAPayerWithRetention = Math.max(0, netAPayerWithRetention - acompteTotal);

    const areaStyle: any = floated
      ? [styles.summaryArea, { bottom: summaryBottom }]
      : { flexDirection: "row", justifyContent: "space-between", marginTop: 80 };

    return (
      <View style={areaStyle}>
        <View style={styles.leftColumn}>
          {renderTVABreakdown()}
          {renderPaymentBoxUnderTVA()}
        </View>
        <View style={styles.totalsContainer}>
          <View style={styles.totalsBox}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total H.T.:</Text>
              <Text style={styles.summaryValue}>{formatCurrency(sousTotalHT)} DT</Text>
            </View>
            {Number(bonCommande.remise) > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Remise HT:</Text>
                <Text style={styles.summaryValue}>- {formatCurrency(discountAmount)} DT</Text>
              </View>
            )}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Net H.T:</Text>
              <Text style={styles.summaryValue}>{formatCurrency(netHT)} DT</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>TVA:</Text>
              <Text style={styles.summaryValue}>{formatCurrency(totalTax)} DT</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total TTC:</Text>
              <Text style={styles.summaryValue}>{formatCurrency(finalTotal)} DT</Text>
            </View>
            {acompteTotal > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Acompte:</Text>
                <Text style={styles.summaryValue}>{formatCurrency(acompteTotal)} DT</Text>
              </View>
            )}
            {retentionAmt > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Retenue à la source:</Text>
                <Text style={styles.summaryValue}>- {formatCurrency(retentionAmt)} DT</Text>
              </View>
            )}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Reste à payer:</Text>
              <Text style={styles.summaryValue}>{formatCurrency(resteAPayerWithRetention)} DT</Text>
            </View>
            <View style={styles.netAPayerContainer}>
              <Text style={styles.netAPayerLabel}>NET À PAYER:</Text>
              <Text style={styles.netAPayerValue}>{formatCurrency(netAPayerWithRetention)} DT</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  /**
   * Renders the article table for a given page group.
   * Returns null on summary-only pages (empty articles) so the
   * blue header row is never painted without data below it.
   */
  const renderTable = (group: PageGroup) => {
    if (group.articles.length === 0) return null;

    return (
      <View style={styles.tableContainer}>
        <View style={styles.tableHeader}>
          <View style={[styles.colN, styles.tableColHeader]}><Text>N°</Text></View>
          <View style={[styles.colArticle, styles.tableColHeader]}><Text>ARTICLE</Text></View>
          <View style={[styles.colDesignation, styles.tableColHeader]}><Text>DESIGNATION</Text></View>
          <View style={[styles.colQteC, styles.tableColHeader]}><Text>QTE C</Text></View>
          <View style={[styles.colQteLiv, styles.tableColHeader]}><Text>QTE L</Text></View>
          <View style={[styles.colPUHT, styles.tableColHeader]}><Text>P.U.H.T</Text></View>
          <View style={[styles.colTVA, styles.tableColHeader]}><Text>TVA</Text></View>
          <View style={[styles.colPUTTC, styles.tableColHeader]}><Text>P.U.TTC</Text></View>
          <View style={[styles.colMontantTTC, styles.tableColHeader]}><Text>M.TTC</Text></View>
        </View>

        {group.articles.map((item, index) => {
          const globalRowNumber = group.startIndex + index + 1;
          const qty = Number(item.quantite) || 0;
          const qteLiv = Number(item.quantiteLivree) || 0;
          const priceHT = Number(item.prixUnitaire) || 0;
          const tvaRate = Number(item.tva) || 0;
          const prixTTC = Number(item.prix_ttc) || priceHT * (1 + tvaRate / 100);
          const montantTTC = Math.round(qty * prixTTC * 1000) / 1000;

          return (
            <View style={styles.tableRow} key={index}>
              <View style={[styles.colN, styles.tableCol]}><Text>{globalRowNumber}</Text></View>
              <View style={[styles.colArticle, styles.tableCol]}><Text>{item.article?.reference || "-"}</Text></View>
              <View style={[styles.colDesignation, styles.tableCol]}><Text>{item.designation || item.article?.designation || "-"}</Text></View>
              <View style={[styles.colQteC, styles.tableCol]}><Text>{qty}</Text></View>
              <View style={[styles.colQteLiv, styles.tableCol]}><Text>{qteLiv}</Text></View>
              <View style={[styles.colPUHT, styles.tableCol]}><Text>{formatCurrency(priceHT)}</Text></View>
              <View style={[styles.colTVA, styles.tableCol]}><Text>{tvaRate > 0 ? `${tvaRate}%` : "-"}</Text></View>
              <View style={[styles.colPUTTC, styles.tableCol]}><Text>{formatCurrency(prixTTC)}</Text></View>
              <View style={[styles.colMontantTTC, styles.tableCol]}><Text>{formatCurrency(montantTTC)}</Text></View>
            </View>
          );
        })}
      </View>
    );
  };

  const renderSummaryContent = (floated: boolean = true) => (
    <>
      {renderSummarySection(205, 155, floated)}
      {/* Amount in words — always absolute at bottom */}
      <View style={[styles.amountInWords, { bottom: 155 }]}>
        <Text style={styles.amountText}>
          Arrêté le présent bon de commande à la somme de : {amountInWords}
        </Text>
      </View>
      {/* Signature / cachet — always absolute at bottom */}
      <View style={styles.cachetSignatureSection}>
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

  const renderPageHeader = () => (
    <>
      <View style={styles.header}>
        <View style={styles.companyInfo}>
          {companyInfo.logo && <Image src={companyInfo.logo} style={styles.logo} />}
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
                Date Commande:{" "}
                <Text style={styles.boldText}>
                  {bonCommande.dateCommande ? moment(bonCommande.dateCommande).format("DD/MM/YYYY") : "N/A"}
                </Text>
              </Text>
            </View>
            {bonCommande.dateLivBonCommande && (
              <View style={[styles.commandeDetailItem, { marginTop: 4 }]}>
                <Text style={styles.commandeDetailLabel}>
                  Date Livraison:{" "}
                  <Text style={styles.boldText}>
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
                {bonCommande.client.raison_sociale &&
                  wrapClientText(bonCommande.client.raison_sociale, 35).map((line, idx) => (
                    <Text key={`rs-${idx}`} style={styles.clientLineItem}>{line}</Text>
                  ))}
                {bonCommande.client.matricule_fiscal && (
                  <Text style={styles.clientLineItem}>MF: {bonCommande.client.matricule_fiscal}</Text>
                )}
                {bonCommande.client.adresse && (
                  <Text style={styles.clientLineItem}>{bonCommande.client.adresse}</Text>
                )}
                {bonCommande.client.telephone1 && (
                  <Text style={styles.clientLineItem}>Tél: {bonCommande.client.telephone1}</Text>
                )}
                {bonCommande.client.telephone2 && (
                  <Text style={styles.clientLineItem}>Tél: {bonCommande.client.telephone2}</Text>
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
          companyInfo.name,
          companyInfo.address,
          companyInfo.city,
          companyInfo.phone,
          companyInfo.gsm,
          companyInfo.taxId,
        ]
          .filter(Boolean)
          .join(" - ")}
      </Text>
      {companyInfo.email && companyInfo.website ? (
        <Text style={styles.footerLine}>Email: {companyInfo.email} | Site: {companyInfo.website}</Text>
      ) : companyInfo.email ? (
        <Text style={styles.footerLine}>Email: {companyInfo.email}</Text>
      ) : companyInfo.website ? (
        <Text style={styles.footerLine}>Site: {companyInfo.website}</Text>
      ) : null}
    </View>
  );

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────
  return (
    <Document>
      {pageGroups.map((group, pageIdx) => (
        <Page key={pageIdx} size="A4" style={styles.page}>
          {/* Header is repeated on every page */}
          {renderPageHeader()}

          {/* Article table for this page's group */}
          {renderTable(group)}

          {/* Summary block ONLY on the last page */}
          {group.isLast && renderSummaryContent(group.articles.length > 0)}

          {renderFooter()}

          <Text style={styles.pageNumber}>
            Page {pageIdx + 1} sur {totalPages}
          </Text>
        </Page>
      ))}
    </Document>
  );
};

export default BonCommandePDF;