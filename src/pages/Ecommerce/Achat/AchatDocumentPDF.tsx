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
import { Depot, Fournisseur } from "../../../Components/Article/Interfaces";
import { formatPhoneDisplay } from "../../../helpers/phone_helper";
import { calculateAchatTotals, toAchatCalcLine } from "./AchatCalculations";
import { calculateLineTotals } from "../../../Utils/CalculationEngine";
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

// Same layout as the ventes BonCommandePDF, with the fournisseur in place of the client.
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
  documentDetails: { marginBottom: 6 },
  documentDetailItem: { marginBottom: 2 },
  documentDetailLabel: { fontSize: 13 },
  documentTitle: { fontSize: 12, fontWeight: "bold", marginBottom: 2 },
  documentNumberValue: { fontSize: 16, fontWeight: "bold" },
  companyInfo: { width: "60%" },
  logo: { width: 200, marginBottom: 5 },
  sectionTitle: { fontSize: 12, marginBottom: 3, fontWeight: "normal" },
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
    fontSize: 9,
    color: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
  },
  tableCol: {
    paddingHorizontal: 4,
    fontSize: 9,
    textAlign: "center",
    justifyContent: "center",
    alignItems: "center",
  },
  // Widths must add up to 100%: the row hides what overflows
  colN: { width: "5%" },
  colArticle: { width: "13%", textAlign: "left" },
  colDesignation: { width: "32%", textAlign: "left" },
  colQte: { width: "6%" },
  colRemise: { width: "6%" },
  colPUHT: { width: "10%", textAlign: "right" },
  colTVA: { width: "6%" },
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
  leftColumn: { width: "50%", flexDirection: "column" },
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
  notesBox: {
    width: "103%",
    border: "1pt solid #ddd",
    marginTop: 10,
    padding: 4,
  },
  notesText: { fontSize: 9 },
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
  footerLine: { marginBottom: 1 },
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
  fournisseurInfoContainer: {
    minWidth: 250,
    border: "1pt solid #ddd",
    padding: 6,
    alignItems: "flex-start",
    marginLeft: "auto",
  },
  fournisseurLineItem: { fontSize: 10, marginBottom: 1, fontWeight: "bold" },
});

export interface AchatDocumentPDFProps {
  /** "BON DE COMMANDE" / "BON DE RÉCEPTION" */
  title: string;
  /** "bon de commande" / "bon de réception", used in the amount-in-words sentence */
  documentLabel: string;
  numero: string;
  date?: string | null;
  dateLabel: string;
  fournisseur?: Fournisseur | null;
  depot?: Depot | null;
  notes?: string | null;
  articles: any[];
  remise?: number | string | null;
  remiseType?: string | null;
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
// PAGINATION (same rules as the ventes PDFs)
// ─────────────────────────────────────────────
const LAST_PAGE_MAX = 6;   // max articles on the final page (with summary)
const INTER_PAGE_MAX = 15; // max articles on intermediate pages (no summary)

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

const wrapTextHelper = (text: string, maxCharsPerLine: number = 45): string[] => {
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

const formatCurrency = (amount: number) => amount.toFixed(3);

const AchatDocumentPDF: React.FC<AchatDocumentPDFProps> = ({
  title,
  documentLabel,
  numero,
  date,
  dateLabel,
  fournisseur,
  depot,
  notes,
  articles,
  remise,
  remiseType,
  companyInfo,
}) => {
  const lines = (articles || []).map(toAchatCalcLine);
  const { sousTotalHT, netHT, totalTax, finalTotal, discountAmount, netAPayer, tvaBreakdown } =
    calculateAchatTotals({ articles, remise, remiseType });

  const pageGroups = buildPageGroups(lines);
  const totalPages = pageGroups.length;
  const amountInWords = montantEnLettres(netAPayer);

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

  const renderSummarySection = (floated: boolean) => {
    const areaStyle: any = floated
      ? styles.summaryArea
      : { flexDirection: "row", justifyContent: "space-between", marginTop: 80 };

    return (
      <View style={areaStyle}>
        <View style={styles.leftColumn}>
          {renderTVABreakdown()}
          {notes ? (
            <View style={styles.notesBox}>
              <Text style={styles.notesText}>Notes : {notes}</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.totalsContainer}>
          <View style={styles.totalsBox}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total H.T.:</Text>
              <Text style={styles.summaryValue}>{formatCurrency(sousTotalHT)} DT</Text>
            </View>
            {Number(remise) > 0 && (
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
          <View style={[styles.colQte, styles.tableColHeader]}><Text>QTE</Text></View>
          <View style={[styles.colPUHT, styles.tableColHeader]}><Text>P.U.H.T</Text></View>
          <View style={[styles.colRemise, styles.tableColHeader]}><Text>REM</Text></View>
          <View style={[styles.colTVA, styles.tableColHeader]}><Text>TVA</Text></View>
          <View style={[styles.colPUTTC, styles.tableColHeader]}><Text>P.U.TTC</Text></View>
          <View style={[styles.colMontantTTC, styles.tableColHeader]}><Text>M.TTC</Text></View>
        </View>

        {group.articles.map((item, index) => {
          const line = calculateLineTotals(item, group.startIndex + index);
          const tvaRate = Number(item.tva) || 0;
          const remiseRate = Number(item.remise) || 0;

          return (
            <View style={styles.tableRow} key={index}>
              <View style={[styles.colN, styles.tableCol]}><Text>{group.startIndex + index + 1}</Text></View>
              <View style={[styles.colArticle, styles.tableCol]}><Text>{item.articleDetails?.reference || "-"}</Text></View>
              <View style={[styles.colDesignation, styles.tableCol]}><Text>{item.designation || item.articleDetails?.designation || "-"}</Text></View>
              <View style={[styles.colQte, styles.tableCol]}><Text>{Number(item.quantite) || 0}</Text></View>
              <View style={[styles.colPUHT, styles.tableCol]}><Text>{formatCurrency(line.unitHT)}</Text></View>
              <View style={[styles.colRemise, styles.tableCol]}><Text>{remiseRate > 0 ? `${remiseRate}%` : "-"}</Text></View>
              <View style={[styles.colTVA, styles.tableCol]}><Text>{tvaRate > 0 ? `${tvaRate}%` : "-"}</Text></View>
              <View style={[styles.colPUTTC, styles.tableCol]}><Text>{formatCurrency(line.unitTTC)}</Text></View>
              <View style={[styles.colMontantTTC, styles.tableCol]}><Text>{formatCurrency(line.ttc)}</Text></View>
            </View>
          );
        })}
      </View>
    );
  };

  const renderSummaryContent = (floated: boolean) => (
    <>
      {renderSummarySection(floated)}
      <View style={styles.amountInWords}>
        <Text style={styles.amountText}>
          Arrêté le présent {documentLabel} à la somme de : {amountInWords}
        </Text>
      </View>
      <View style={styles.cachetSignatureSection}>
        <View style={styles.signatureContainer}>
          <Text style={styles.signatureText}>Fournisseur</Text>
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
      <View style={styles.documentDetails}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
          <View>
            <Text style={styles.documentTitle}>{title}</Text>
            <View style={styles.documentDetailItem}>
              <Text style={styles.documentNumberValue}>{numero || "N/A"}</Text>
            </View>
            <View style={[styles.documentDetailItem, { marginTop: 4 }]}>
              <Text style={styles.documentDetailLabel}>
                {dateLabel}:{" "}
                <Text style={styles.boldText}>{date ? moment(date).format("DD/MM/YYYY") : "N/A"}</Text>
              </Text>
            </View>
            {depot?.nom && (
              <View style={[styles.documentDetailItem, { marginTop: 4 }]}>
                <Text style={styles.documentDetailLabel}>
                  Dépôt: <Text style={styles.boldText}>{depot.nom}</Text>
                </Text>
              </View>
            )}
          </View>
          <View style={styles.fournisseurInfoContainer}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 3 }}>
              <Text style={styles.sectionTitle}>FOURNISSEUR</Text>
            </View>
            {fournisseur && (
              <>
                {fournisseur.raison_sociale &&
                  wrapTextHelper(fournisseur.raison_sociale, 45).map((line, idx) => (
                    <Text key={`rs-${idx}`} style={styles.fournisseurLineItem}>{line}</Text>
                  ))}
                {fournisseur.matricule_fiscal && (
                  <Text style={styles.fournisseurLineItem}>MF: {fournisseur.matricule_fiscal}</Text>
                )}
                {[fournisseur.adresse, fournisseur.ville].filter(Boolean).join(" - ") &&
                  wrapTextHelper([fournisseur.adresse, fournisseur.ville].filter(Boolean).join(" - "), 45).map((line, idx) => (
                    <Text key={`adr-${idx}`} style={styles.fournisseurLineItem}>{line}</Text>
                  ))}
                {fournisseur.telephone1 && (
                  <Text style={styles.fournisseurLineItem}>Tél: {formatPhoneDisplay(fournisseur.telephone1, "")}</Text>
                )}
                {fournisseur.telephone2 && (
                  <Text style={styles.fournisseurLineItem}>Tél: {formatPhoneDisplay(fournisseur.telephone2, "")}</Text>
                )}
                {fournisseur.email && (
                  <Text style={styles.fournisseurLineItem}>Email: {fournisseur.email}</Text>
                )}
              </>
            )}
          </View>
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

export default AchatDocumentPDF;
