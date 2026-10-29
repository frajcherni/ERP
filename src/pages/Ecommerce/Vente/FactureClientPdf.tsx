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
import { FactureClient } from "../../../Components/Article/Interfaces";
import { formatPhoneDisplay } from "../../../helpers/phone_helper";
import { calculateDocumentTotals, calculateLineTotals } from "../../../Utils/CalculationEngine";
import { montantEnLettres } from "../../../Utils/montantEnLettres";

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
    fontSize: 11,
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
    paddingHorizontal: 2,
    fontSize: 10,
    textAlign: "center",
    justifyContent: "center",
    alignItems: "center",
    // A word wider than its column is cut there instead of being drawn over the next column
    overflow: "hidden",
  },
  // Widths must add up to 100%: the row hides what overflows.
  // ARTICLE needs 17% so codes like PLAF-DOUANE/14 stay inside it; amounts up to 99999.999
  // still fit in 10% with the 2pt padding of the cells.
  colN: { width: "5%" },
  colArticle: { width: "17%", textAlign: "left" },
  colDesignation: { width: "35%", textAlign: "left" },
  colQuantite: { width: "6%" },
  colPUHT: { width: "10%", textAlign: "right" },
  colTVA: { width: "5%" },
  colPUTTC: { width: "10%", textAlign: "right" },
  colMontantTTC: { width: "12%", textAlign: "right" },
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
    minWidth: 250,
    border: "1pt solid #ddd",
    padding: 6,
    alignItems: "flex-start",
    marginLeft: "auto",
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
  exonerationBadge: {
    backgroundColor: "#00aeef",
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 10,
    paddingVertical: 4,
    paddingHorizontal: 6,
    marginLeft: 8,
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

// ─────────────────────────────────────────────
// PAGINATION CONSTANTS
// ─────────────────────────────────────────────
const LAST_PAGE_MAX = 6;
const INTER_PAGE_MAX = 15;

interface PageGroup {
  articles: any[];
  isLast: boolean;
  startIndex: number;
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

const FacturePDF: React.FC<FacturePDFProps> = ({
  facture,
  companyInfo,
}) => {
  const isExonerated = !!facture?.exoneration;

  // ─────────────────────────────────────────────
  // TOTALS CALCULATION
  // ─────────────────────────────────────────────
  const totals = calculateDocumentTotals(facture, { isCreatingFacture: true });
  const {
    sousTotalHT,
    netHT,
    totalTax,
    finalTotal,
    discountAmount,
    timbre,
    netAPayer,
    tvaBreakdown = {},
  } = totals;


  // ─────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────
  const formatCurrency = (amount: number) => amount.toFixed(3);

  const amountInWords = montantEnLettres(netAPayer);

  const wrapTextHelper = (text: string, maxCharsPerLine: number = 40): string[] => {
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

  const formatPhoneNumber = (phone: string | null | undefined): string =>
    formatPhoneDisplay(phone, "");

  // ─────────────────────────────────────────────
  // RENDERERS
  // ─────────────────────────────────────────────
  const renderTVABreakdown = () => {
    const tvaRates = Object.keys(tvaBreakdown).map((r) => parseFloat(r)).sort((a, b) => a - b);
    return (
      <View style={styles.tvaTable}>
        <View style={styles.tvaHeader}>
          <Text style={styles.tvaHeaderTaux}>Taux TVA</Text>
          <Text style={styles.tvaHeaderBase}>Base Net HT</Text>
          <Text style={styles.tvaHeaderMontant}>Total TVA</Text>
        </View>
        {tvaRates.length === 0 && (
          <View style={styles.tvaRow}>
            <Text style={styles.tvaColTaux}>-</Text>
            <Text style={styles.tvaColBase}>0.000 DT</Text>
            <Text style={styles.tvaColMontant}>0.000 DT</Text>
          </View>
        )}
        {tvaRates.length > 0 && tvaRates.map((rate) => (
          <View style={styles.tvaRow} key={rate}>
            <Text style={styles.tvaColTaux}>{rate}%</Text>
            <Text style={styles.tvaColBase}>{formatCurrency(tvaBreakdown[rate].base)} DT</Text>
            <Text style={styles.tvaColMontant}>{formatCurrency(tvaBreakdown[rate].montant)} DT</Text>
          </View>
        ))}
        {isExonerated && tvaRates.length > 0 && (
          <View style={styles.tvaRow}>
            <Text style={styles.tvaColTaux}>Exonoré</Text>
            <Text style={styles.tvaColBase}>
              {formatCurrency(tvaRates.reduce((acc, r) => acc + tvaBreakdown[r].base, 0))} DT
            </Text>
            <Text style={styles.tvaColMontant}>
              {formatCurrency(tvaRates.reduce((acc, r) => acc + tvaBreakdown[r].montant, 0))} DT
            </Text>
          </View>
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
            {Number(facture.remise) > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Remise sur HT:</Text>
                <Text style={styles.summaryValue}>- {formatCurrency(discountAmount)} DT</Text>
              </View>
            )}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Net H.T:</Text>
              <Text style={styles.summaryValue}>{formatCurrency(netHT)} DT</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total TVA:</Text>
              <Text style={styles.summaryValue}>{isExonerated ? "0.000" : formatCurrency(totalTax)} DT</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total TTC:</Text>
              <Text style={styles.summaryValue}>{isExonerated ? "0.000" : formatCurrency(finalTotal)} DT</Text>
            </View>
            {timbre > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Timbre Fiscal:</Text>
                <Text style={styles.summaryValue}>{formatCurrency(timbre)} DT</Text>
              </View>
            )}
            <View style={styles.netAPayerContainer}>
              <Text style={styles.netAPayerLabel}>NET À PAYER:</Text>
              <Text style={styles.netAPayerValue}>{formatCurrency(netAPayer)} DT</Text>
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
          const line = calculateLineTotals(item, group.startIndex + index, { isExonerated });
          // Real TTC (tax included) for the M.TTC column, shown even when exonerated
          // so the user can see the true TTC price. Totals are unaffected.
          const realLine = calculateLineTotals(item, group.startIndex + index, {});
          const tvaRate = Number(item.tva) || 0;

          return (
            <View style={styles.tableRow} key={index}>
              <View style={[styles.colN, styles.tableCol]}><Text>{globalRowNumber}</Text></View>
              <View style={[styles.colArticle, styles.tableCol]}><Text>{item.article?.reference || "-"}</Text></View>
              <View style={[styles.colDesignation, styles.tableCol]}><Text>{item.designation || item.article?.designation || "-"}</Text></View>
              <View style={[styles.colQuantite, styles.tableCol]}><Text>{Number(item.quantite) || 0}</Text></View>
              <View style={[styles.colPUHT, styles.tableCol]}><Text>{formatCurrency(line.unitHT)}</Text></View>
              <View style={[styles.colTVA, styles.tableCol]}><Text>{tvaRate > 0 ? `${tvaRate}%` : "-"}</Text></View>
              <View style={[styles.colPUTTC, styles.tableCol]}><Text>{formatCurrency(line.unitTTC)}</Text></View>
              <View style={[styles.colMontantTTC, styles.tableCol]}><Text>{formatCurrency(realLine.ttc)}</Text></View>
            </View>
          );
        })}
      </View>
    );
  };

  const renderSummaryContent = (floated: boolean = true) => (
    <>
      {renderSummarySection(205, floated)}
      <View style={[styles.amountInWords, { bottom: 155 }]}>
        <Text style={styles.amountText}>
          Arrêtée la présente facture à la somme de : {amountInWords}
        </Text>
      </View>
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
                <Text style={styles.commandeNumberValue}>{facture.numeroFacture || "N/A"}</Text>
              </Text>
            </View>
            <View style={[styles.commandeDetailItem, { marginTop: 4 }]}>
              <Text style={styles.commandeDetailLabel}>
                Date:{" "}
                <Text style={styles.boldText}>
                  {facture.dateFacture ? moment(facture.dateFacture).format("DD/MM/YYYY") : "N/A"}
                </Text>
              </Text>
            </View>
          </View>
          <View style={styles.clientInfoContainer}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 3 }}>
              <Text style={styles.sectionTitle}>CLIENT</Text>
              {isExonerated && <Text style={styles.exonerationBadge}>EXONORÉ</Text>}
            </View>
            {facture.client && (
              <>
                {facture.client.raison_sociale &&
                  wrapTextHelper(facture.client.raison_sociale, 45).map((line, idx) => (
                    <Text key={`rs-${idx}`} style={styles.clientLineItem}>{line}</Text>
                  ))}
                {facture.client.matricule_fiscal && (
                  <Text style={styles.clientLineItem}>MF: {facture.client.matricule_fiscal}</Text>
                )}
                {[facture.client.adresse, facture.client.ville].filter(Boolean).join(" - ") &&
                  wrapTextHelper([facture.client.adresse, facture.client.ville].filter(Boolean).join(" - "), 45).map((line, idx) => (
                    <Text key={`adr-${idx}`} style={styles.clientLineItem}>{line}</Text>
                  ))}
                {facture.client.telephone1 && (
                  <Text style={styles.clientLineItem}>Tél: {formatPhoneNumber(facture.client.telephone1)}</Text>
                )}
                {facture.client.telephone2 && (
                  <Text style={styles.clientLineItem}>Tél: {formatPhoneNumber(facture.client.telephone2)}</Text>
                )}
              </>
            )}
          </View>
        </View>
      </View>
      <View style={styles.vendeurPaymentContainer}>
        <View style={styles.vendeurContainer}>
          <Text style={styles.sectionTitle}>VENDEUR</Text>
          {facture.vendeur && (
            <Text style={styles.vendeurText}>
              {[facture.vendeur.nom, facture.vendeur.prenom].filter(Boolean).join(" ")}
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

  const pageGroups = buildPageGroups(facture?.articles || []);
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

export default FacturePDF;