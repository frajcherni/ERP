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
import { calculateDocumentTotals } from "../../../Utils/CalculationEngine";

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
  colQuantite: { width: "12%" },
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
    fontSize: 9,
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

interface FactureVentePDFProps {
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

const FactureVentePDF: React.FC<FactureVentePDFProps> = ({
  bonCommande,
  companyInfo,
}) => {
  // ─────────────────────────────────────────────
  // TOTALS CALCULATION
  // ─────────────────────────────────────────────
  const totals = calculateDocumentTotals(bonCommande);
  const {
    sousTotalHT,
    netHT,
    totalTax,
    finalTotal,
    discountAmount,
    tvaBreakdown = {},
  } = totals as any;


  // ─────────────────────────────────────────────
  // HELPERS
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

  const amountInWords = numberToWords(finalTotal);

  const wrapText = (text: string, maxCharsPerLine: number = 40): string[] => {
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

  // ─────────────────────────────────────────────
  // RENDERERS
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

  const renderSummarySection = (summaryBottom: number, floated: boolean = true) => {
    const areaStyle: any = floated
      ? [styles.summaryArea, { bottom: summaryBottom }]
      : { flexDirection: "row", justifyContent: "space-between", marginTop: 80 };

    return (
      <View style={areaStyle}>
        <View style={styles.leftColumn}>
          {renderTVABreakdown()}
        </View>
        <View style={styles.totalsContainer}>
          <View style={styles.totalsBox}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total H.T.:</Text>
              <Text style={styles.summaryValue}>{formatCurrency(sousTotalHT)} DT</Text>
            </View>
            {Number(bonCommande.remise) > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Remise sur HT:</Text>
                <Text style={styles.summaryValue}>- {formatCurrency(discountAmount)} DT</Text>
              </View>
            )}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Net H.T:</Text>
              <Text style={styles.summaryValue}>{formatCurrency(netHT)} DT</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total TVA:</Text>
              <Text style={styles.summaryValue}>{formatCurrency(totalTax)} DT</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total TTC:</Text>
              <Text style={styles.summaryValue}>{formatCurrency(finalTotal)} DT</Text>
            </View>
            <View style={styles.netAPayerContainer}>
              <Text style={styles.netAPayerLabel}>NET À PAYER:</Text>
              <Text style={styles.netAPayerValue}>{formatCurrency(finalTotal)} DT</Text>
            </View>
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
          <View style={[styles.colQuantite, styles.tableColHeader]}><Text>QTE</Text></View>
          <View style={[styles.colPUHT, styles.tableColHeader]}><Text>P.U.H.T</Text></View>
          <View style={[styles.colTVA, styles.tableColHeader]}><Text>TVA</Text></View>
          <View style={[styles.colPUTTC, styles.tableColHeader]}><Text>P.U.TTC</Text></View>
          <View style={[styles.colMontantTTC, styles.tableColHeader]}><Text>M.TTC</Text></View>
        </View>

        {group.articles.map((item, index) => {
          const globalRowNumber = group.startIndex + index + 1;
          const qty = Number(item.quantite) || 0;
          const priceHT = Number(item.prixUnitaire) || 0;
          const tvaRate = Number(item.tva) || 0;
          const prixTTC = Number(item.prix_ttc) || priceHT * (1 + tvaRate / 100);
          const montantTTC = Math.round(qty * prixTTC * 1000) / 1000;

          return (
            <View style={styles.tableRow} key={index}>
              <View style={[styles.colN, styles.tableCol]}><Text>{globalRowNumber}</Text></View>
              <View style={[styles.colArticle, styles.tableCol]}><Text>{item.article?.reference || "-"}</Text></View>
              <View style={[styles.colDesignation, styles.tableCol]}><Text>{item.designation || item.article?.designation || "-"}</Text></View>
              <View style={[styles.colQuantite, styles.tableCol]}><Text>{qty}</Text></View>
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
      {renderSummarySection(205, floated)}
      {/* Amount in words — same design as BC */}
      <View style={[styles.amountInWords, { bottom: 155 }]}>
        <Text style={styles.amountText}>
          Arrêtée la présente vente à la somme de : {amountInWords}
        </Text>
      </View>
      {/* Signature / cachet — same layout and labels as BC */}
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
                Date:{" "}
                <Text style={styles.boldText}>
                  {bonCommande.dateCommande ? moment(bonCommande.dateCommande).format("DD/MM/YYYY") : "N/A"}
                </Text>
              </Text>
            </View>
          </View>
          <View style={styles.clientInfoContainer}>
            <Text style={styles.sectionTitle}>CLIENT</Text>
            {bonCommande.clientWebsite ? (
              <>
                {bonCommande.clientWebsite.nomPrenom &&
                  wrapText(bonCommande.clientWebsite.nomPrenom, 35).map((line, idx) => (
                    <Text key={`rs-web-${idx}`} style={styles.clientLineItem}>{line}</Text>
                  ))}
                {bonCommande.clientWebsite.telephone && (
                  <Text style={styles.clientLineItem}>Tél: {bonCommande.clientWebsite.telephone}</Text>
                )}
                {bonCommande.clientWebsite.email && (
                  <Text style={styles.clientLineItem}>Email: {bonCommande.clientWebsite.email}</Text>
                )}
              </>
            ) : bonCommande.client ? (
              <>
                {bonCommande.client.raison_sociale &&
                  wrapText(bonCommande.client.raison_sociale, 35).map((line, idx) => (
                    <Text key={`rs-${idx}`} style={styles.clientLineItem}>{line}</Text>
                  ))}
                {bonCommande.client.matricule_fiscal && (
                  <Text style={styles.clientLineItem}>MF: {bonCommande.client.matricule_fiscal}</Text>
                )}
                {bonCommande.client.adresse &&
                  wrapText(bonCommande.client.adresse, 35).map((line, idx) => (
                    <Text key={`adr-${idx}`} style={styles.clientLineItem}>{line}</Text>
                  ))}
                {bonCommande.client.telephone1 && (
                  <Text style={styles.clientLineItem}>Tél: {bonCommande.client.telephone1}</Text>
                )}
                {bonCommande.client.telephone2 && (
                  <Text style={styles.clientLineItem}>Tél: {bonCommande.client.telephone2}</Text>
                )}
              </>
            ) : null}
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
          companyInfo.taxId ? "MF: " + companyInfo.taxId : "",
        ]
          .filter(Boolean)
          .join(" - ")}
      </Text>
      {companyInfo.email && companyInfo.website ? (
        <Text style={styles.footerLine}>
          Email: {companyInfo.email} | Site: {companyInfo.website.replace(/^https?:\/\//, "")}
        </Text>
      ) : companyInfo.email ? (
        <Text style={styles.footerLine}>Email: {companyInfo.email}</Text>
      ) : companyInfo.website ? (
        <Text style={styles.footerLine}>Site: {companyInfo.website.replace(/^https?:\/\//, "")}</Text>
      ) : null}
    </View>
  );

  const pageGroups = buildPageGroups(bonCommande?.articles || []);
  const totalPages = pageGroups.length;

  return (
    <Document>
      {pageGroups.map((group, pageIdx) => (
        <Page key={pageIdx} size="A4" style={styles.page}>
          {renderPageHeader()}
          {renderTable(group)}
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

export default FactureVentePDF;