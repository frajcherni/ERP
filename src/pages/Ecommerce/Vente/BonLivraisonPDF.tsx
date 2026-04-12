// src/Components/CommandeClient/BonLivraisonPDF.tsx
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
import { BonLivraison } from "../../../Components/Article/Interfaces";

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
  livraisonDetails: {
    marginBottom: 6,
  },
  livraisonDetailItem: {
    marginBottom: 2,
  },
  livraisonDetailLabel: {
    fontSize: 13,
  },
  N: {
    fontSize: 15,
  },
  livraisonNumberValue: {
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
  sectionTitle: {
    fontSize: 12,
    marginBottom: 3,
    fontWeight: "normal",
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
  deliveryInfoBox: {
    padding: 8,
    border: "1pt solid #ddd",
    width: "100%",
    marginBottom: 10,
  },
  deliveryInfoHeader: {
    backgroundColor: "#00aeef",
    paddingVertical: 4,
    paddingHorizontal: 8,
    margin: -8,
    marginBottom: 8,
  },
  deliveryInfoTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center",
  },
  deliveryInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  deliveryInfoItem: {
    width: "48%",
  },
  deliveryInfoLabel: {
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 2,
  },
  deliveryInfoValue: {
    fontSize: 10,
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
  clientLineItem: { fontSize: 10, marginBottom: 1, fontWeight: "bold" },
  vendeurPaymentContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  vendeurContainer: {
    width: "55%",
  },
});

interface BonLivraisonPDFProps {
  bonLivraison: BonLivraison;
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

function buildPageGroups(articles: any[]): PageGroup[] {
  if (!articles || articles.length === 0) {
    return [{ articles: [], isLast: true, startIndex: 0 }];
  }
  if (articles.length <= LAST_PAGE_MAX) {
    return [{ articles, isLast: true, startIndex: 0 }];
  }
  const groups: PageGroup[] = [];
  let cursor = 0;
  while (cursor < articles.length) {
    const remaining = articles.length - cursor;
    if (remaining <= LAST_PAGE_MAX) {
      groups.push({ articles: articles.slice(cursor), isLast: true, startIndex: cursor });
      cursor = articles.length;
    } else {
      const take = Math.min(INTER_PAGE_MAX, remaining);
      groups.push({ articles: articles.slice(cursor, cursor + take), isLast: false, startIndex: cursor });
      cursor += take;
    }
  }
  if (groups.length > 0 && !groups[groups.length - 1].isLast) {
    groups.push({ articles: [], isLast: true, startIndex: articles.length });
  }
  return groups;
}

const BonLivraisonPDF: React.FC<BonLivraisonPDFProps> = ({
  bonLivraison,
  companyInfo,
}) => {
  const isLinkedToBC = !!bonLivraison.bonCommandeClient;
  const hasDeliveryInfo = !!(bonLivraison.voiture || bonLivraison.serie || bonLivraison.chauffeur || bonLivraison.cin);

  const calculateTotals = () => {
    if (!bonLivraison?.articles || bonLivraison.articles.length === 0) {
      return { sousTotalHT: 0, netHT: 0, totalTax: 0, grandTotal: 0, finalTotal: 0, discountAmount: 0 };
    }
    let sousTotalHTValue = 0;
    let totalTaxValue = 0;
    let grandTotalValue = 0;

    bonLivraison.articles.forEach((article) => {
      const qty = Number(article.quantite) || 0;
      const articleRemise = Number(article.remise) || 0;
      const tvaRate = Number(article.tva) || 0;
      const unitHT = Number(article.prix_unitaire) || 0;
      const unitTTC = Number(article.prix_ttc) || unitHT * (1 + tvaRate / 100);
      const lineHT = Math.round(unitHT * 1000) / 1000;
      const lineTTC = Math.round(unitTTC * 1000) / 1000;
      const montantSousTotalHT = Math.round(qty * lineHT * 1000) / 1000;
      const montantNetHTLigne = Math.round(qty * lineHT * (1 - articleRemise / 100) * 1000) / 1000;
      const montantTTCLigne = Math.round(qty * lineTTC * 1000) / 1000;
      const montantTVALigne = Math.round((montantTTCLigne - montantNetHTLigne) * 1000) / 1000;
      sousTotalHTValue += montantSousTotalHT;
      totalTaxValue += montantTVALigne;
      grandTotalValue += montantTTCLigne;
    });

    sousTotalHTValue = Math.round(sousTotalHTValue * 1000) / 1000;
    totalTaxValue = Math.round(totalTaxValue * 1000) / 1000;
    grandTotalValue = Math.round(grandTotalValue * 1000) / 1000;

    let finalTotalValue = grandTotalValue;
    let discountAmountValue = 0;
    let netHTValue = sousTotalHTValue;

    const remiseValue = Number(bonLivraison.remise) || 0;
    const remiseTypeValue = bonLivraison.remiseType || "percentage";

    if (remiseValue > 0) {
      if (remiseTypeValue === "percentage") {
        discountAmountValue = Math.round((sousTotalHTValue * remiseValue / 100) * 1000) / 1000;
        netHTValue = sousTotalHTValue - discountAmountValue;
        const tvaToHtRatio = sousTotalHTValue > 0 ? totalTaxValue / sousTotalHTValue : 0;
        const newTVA = Math.round((netHTValue * tvaToHtRatio) * 1000) / 1000;
        totalTaxValue = newTVA;
        finalTotalValue = Math.round((netHTValue + newTVA) * 1000) / 1000;
      } else if (remiseTypeValue === "fixed") {
        finalTotalValue = Math.round(Number(remiseValue) * 1000) / 1000;
        const tvaRates = Array.from(new Set(bonLivraison.articles.map(a => Number(a.tva) || 0)));
        if (tvaRates.length === 1 && tvaRates[0] > 0) {
          const tvaRate = tvaRates[0];
          netHTValue = Math.round((finalTotalValue / (1 + tvaRate / 100)) * 1000) / 1000;
          totalTaxValue = Math.round((finalTotalValue - netHTValue) * 1000) / 1000;
        } else {
          const discountCoefficient = grandTotalValue > 0 ? finalTotalValue / grandTotalValue : 0;
          netHTValue = 0;
          totalTaxValue = 0;
          bonLivraison.articles.forEach((article) => {
            const qty = Number(article.quantite) || 0;
            const articleRemise = Number(article.remise) || 0;
            const tvaRate = Number(article.tva) || 0;
            const unitHT = Number(article.prix_unitaire) || 0;
            const montantNetHTLigne = Math.round(qty * unitHT * (1 - articleRemise / 100) * 1000) / 1000;
            const newLineHT = Math.round((montantNetHTLigne * discountCoefficient) * 1000) / 1000;
            const newLineTVA = Math.round((newLineHT * (tvaRate / 100)) * 1000) / 1000;
            netHTValue += newLineHT;
            totalTaxValue += newLineTVA;
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
    }
    return { sousTotalHT: sousTotalHTValue, netHT: netHTValue, totalTax: totalTaxValue, grandTotal: grandTotalValue, finalTotal: finalTotalValue, discountAmount: discountAmountValue };
  };

  const { sousTotalHT, netHT, totalTax, finalTotal, discountAmount } = calculateTotals();
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
      if (smallRemainder < 10) words += units[smallRemainder];
      else if (smallRemainder < 20) words += teens[smallRemainder - 10];
      else {
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

  const amountInWords = numberToWords(finalTotal);

  const wrapClientText = (text: string, maxCharsPerLine: number = 40): string[] => {
    if (!text || text.trim() === "") return [];
    const cleanText = text.trim();
    if (cleanText.length <= maxCharsPerLine) return [cleanText];
    const words = cleanText.split(" ");
    const lines: string[] = [];
    let currentLine = "";
    words.forEach((word) => {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      if (testLine.length <= maxCharsPerLine) currentLine = testLine;
      else { if (currentLine) lines.push(currentLine); currentLine = word; }
    });
    if (currentLine) lines.push(currentLine);
    return lines;
  };

  const renderDeliveryInfoBox = () => {
    if (!hasDeliveryInfo) return null;
    return (
      <View style={styles.deliveryInfoBox}>
        <View style={styles.deliveryInfoHeader}>
          <Text style={styles.deliveryInfoTitle}>INFORMATIONS DE LIVRAISON</Text>
        </View>
        <View style={styles.deliveryInfoRow}>
          <View style={styles.deliveryInfoItem}>
            <Text style={styles.deliveryInfoLabel}>Voiture:</Text>
            <Text style={styles.deliveryInfoValue}>{bonLivraison.voiture || "N/A"}</Text>
          </View>
          <View style={styles.deliveryInfoItem}>
            <Text style={styles.deliveryInfoLabel}>Série:</Text>
            <Text style={styles.deliveryInfoValue}>{bonLivraison.serie || "N/A"}</Text>
          </View>
        </View>
        <View style={styles.deliveryInfoRow}>
          <View style={styles.deliveryInfoItem}>
            <Text style={styles.deliveryInfoLabel}>Chauffeur:</Text>
            <Text style={styles.deliveryInfoValue}>{bonLivraison.chauffeur || "N/A"}</Text>
          </View>
          <View style={styles.deliveryInfoItem}>
            <Text style={styles.deliveryInfoLabel}>CIN:</Text>
            <Text style={styles.deliveryInfoValue}>{bonLivraison.cin || "N/A"}</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderSummarySection = (summaryBottom: number, floated: boolean = true) => {
    const areaStyle: any = floated
      ? [styles.summaryArea, { bottom: summaryBottom }]
      : { flexDirection: "row", justifyContent: "space-between", marginTop: 80 };
    return (
      <View style={areaStyle}>
        <View style={styles.leftColumn}>
          {renderDeliveryInfoBox()}
        </View>
        <View style={styles.totalsContainer}>
          <View style={styles.totalsBox}>
            <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Total H.T.:</Text><Text style={styles.summaryValue}>{formatCurrency(sousTotalHT)} DT</Text></View>
            {Number(bonLivraison.remise) > 0 && (<View style={styles.summaryRow}><Text style={styles.summaryLabel}>Remise:</Text><Text style={styles.summaryValue}>- {formatCurrency(discountAmount)} DT</Text></View>)}
            <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Net H.T.:</Text><Text style={styles.summaryValue}>{formatCurrency(netHT)} DT</Text></View>
            <View style={styles.summaryRow}><Text style={styles.summaryLabel}>TVA:</Text><Text style={styles.summaryValue}>{formatCurrency(totalTax)} DT</Text></View>
            <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Total TTC:</Text><Text style={styles.summaryValue}>{formatCurrency(finalTotal)} DT</Text></View>
            <View style={styles.netAPayerContainer}><Text style={styles.netAPayerLabel}>NET À PAYER:</Text><Text style={styles.netAPayerValue}>{formatCurrency(finalTotal)} DT</Text></View>
          </View>
        </View>
      </View>
    );
  };

  const renderTable = (group: PageGroup) => {
    if (group.articles.length === 0) return null;
    return (
      <View style={styles.tableContainer}>
        <View style={styles.tableHeader}>
          <View style={[styles.colN, styles.tableColHeader]}><Text>N°</Text></View>
          <View style={[styles.colArticle, styles.tableColHeader]}><Text>ARTICLE</Text></View>
          <View style={[styles.colDesignation, styles.tableColHeader]}><Text>DESIGNATION</Text></View>
          <View style={[styles.colQteLiv, styles.tableColHeader]}><Text>QTE L</Text></View>
          <View style={[styles.colPUHT, styles.tableColHeader]}><Text>P.U.H.T</Text></View>
          <View style={[styles.colTVA, styles.tableColHeader]}><Text>TVA</Text></View>
          <View style={[styles.colPUTTC, styles.tableColHeader]}><Text>P.U.TTC</Text></View>
          <View style={[styles.colMontantTTC, styles.tableColHeader]}><Text>M.TTC</Text></View>
        </View>
        {group.articles.map((item, index) => {
          const globalRowNumber = group.startIndex + index + 1;
          const qty = Number(item.quantite) || 0;
          const priceHT = Number(item.prix_unitaire) || 0;
          const tvaRate = Number(item.tva) || 0;
          const prixTTC = Number(item.prix_ttc) || priceHT * (1 + tvaRate / 100);
          const montantTTC = Math.round(qty * prixTTC * 1000) / 1000;
          return (
            <View style={styles.tableRow} key={index}>
              <View style={[styles.colN, styles.tableCol]}><Text>{globalRowNumber}</Text></View>
              <View style={[styles.colArticle, styles.tableCol]}><Text>{item.article?.reference || "-"}</Text></View>
              <View style={[styles.colDesignation, styles.tableCol]}><Text>{item.designation || item.article?.designation || '-'}</Text></View>
              <View style={[styles.colQteLiv, styles.tableCol]}><Text>{qty}</Text></View>
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

  const renderPageHeader = () => (
    <>
      <View style={styles.header}>
        <View style={styles.companyInfo}>
          {companyInfo.logo && <Image src={companyInfo.logo} style={styles.logo} />}
        </View>
      </View>
      <View style={styles.livraisonDetails}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
          <View>
            <View style={styles.livraisonDetailItem}><Text style={styles.N}><Text style={styles.livraisonNumberValue}>{bonLivraison.numeroLivraison || "N/A"}</Text></Text></View>
            <View style={styles.livraisonDetailItem}><Text style={styles.livraisonDetailLabel}>Date: <Text style={styles.boldText}>{bonLivraison.dateLivraison ? moment(bonLivraison.dateLivraison).format("DD/MM/YYYY") : "N/A"}</Text></Text></View>
            {isLinkedToBC && (<View style={styles.livraisonDetailItem}><Text style={styles.livraisonDetailLabel}>Commande: <Text style={styles.boldText}>{bonLivraison.bonCommandeClient?.numeroCommande || "N/A"}</Text></Text></View>)}
          </View>
          <View style={styles.clientInfoContainer}>
            <Text style={styles.sectionTitle}>CLIENT</Text>
            {bonLivraison.client && (
              <>
                {bonLivraison.client.raison_sociale && wrapClientText(bonLivraison.client.raison_sociale, 35).map((line, idx) => (<Text key={`rs-${idx}`} style={styles.clientLineItem}>{line}</Text>))}
                {bonLivraison.client.matricule_fiscal && (<Text style={styles.clientLineItem}>MF: {bonLivraison.client.matricule_fiscal}</Text>)}
                {bonLivraison.client.adresse && (<Text style={styles.clientLineItem}>{bonLivraison.client.adresse}</Text>)}
                {bonLivraison.client.telephone1 && (<Text style={styles.clientLineItem}>Tél: {bonLivraison.client.telephone1}</Text>)}
                {bonLivraison.client.telephone2 && (<Text style={styles.clientLineItem}>Tél: {bonLivraison.client.telephone2}</Text>)}
              </>
            )}
          </View>
        </View>
      </View>
      <View style={styles.vendeurPaymentContainer}>
        <View style={styles.vendeurContainer}>
          <Text style={styles.sectionTitle}>VENDEUR</Text>
          {bonLivraison.vendeur && (
            <Text style={styles.vendeurText}>
              {[bonLivraison.vendeur.nom, bonLivraison.vendeur.prenom].filter(Boolean).join(" ")}
            </Text>
          )}
        </View>
      </View>
    </>
  );

  const renderFooter = () => (
    <View style={styles.footer}>
      <Text style={styles.footerLine}>
        {[companyInfo.name, companyInfo.address, companyInfo.city, companyInfo.phone, companyInfo.gsm, companyInfo.taxId]
          .filter(Boolean)
          .join(" - ")}
      </Text>
      {companyInfo.email || companyInfo.website ? (
        <Text style={styles.footerLine}>
          {companyInfo.email ? `Email: ${companyInfo.email}` : ""}
          {companyInfo.email && companyInfo.website ? " | " : ""}
          {companyInfo.website ? `Site: ${companyInfo.website}` : ""}
        </Text>
      ) : null}
    </View>
  );

  const renderSummaryContent = (floated: boolean = true) => (
    <>
      {renderSummarySection(205, floated)}
      <View style={[styles.amountInWords, { bottom: 155 }]}><Text style={styles.amountText}>Arrêté le présent bon de livraison à la somme de : {amountInWords}</Text></View>
      <View style={styles.cachetSignatureSection}>
        <View style={styles.signatureContainer}><Text style={styles.signatureText}>Client</Text><Text style={styles.subText}>Signature</Text></View>
        <View style={styles.cachetContainer}><Text style={styles.cachetText}> Signature & Cachet</Text><Text style={styles.subText}>Du Responsable </Text></View>
      </View>
    </>
  );

  const allArticles = bonLivraison?.articles || [];
  const pageGroups = buildPageGroups(allArticles);
  const totalPages = pageGroups.length;

  return (
    <Document>
      {pageGroups.map((group, pageIdx) => (
        <Page key={pageIdx} size="A4" style={styles.page}>
          {renderPageHeader()}
          {renderTable(group)}
          {group.isLast && renderSummaryContent(group.articles.length > 0)}
          {renderFooter()}
          <Text style={styles.pageNumber}>Page {pageIdx + 1} sur {totalPages}</Text>
        </Page>
      ))}
    </Document>
  );
};

export default BonLivraisonPDF;