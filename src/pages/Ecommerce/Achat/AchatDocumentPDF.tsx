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
import { calculateLineTotals, remiseLine } from "../../../Utils/CalculationEngine";
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

// Same layout as the ventes PDFs (BonCommandePDF, FactureClientPdf…), with the fournisseur in
// place of the client. On the last page everything is pinned to the bottom of the page, from
// the footer up: footer (5) → signatures (115) → "Arrêté" box (155) → summary (SUMMARY_BOTTOM).
// The summary must stay above the "Arrêté" box, which is 28pt tall (40pt on two lines).
const SUMMARY_BOTTOM = 205;

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
    paddingHorizontal: 2,
    fontSize: 9,
    textAlign: "center",
    justifyContent: "center",
    alignItems: "center",
    // A word wider than its column is cut there instead of being drawn over the next column
    overflow: "hidden",
  },
  // Widths must add up to 100%: the row hides what overflows.
  // ARTICLE needs 16% at 9pt so codes like PLAF-DOUANE/14 stay inside it; amounts up to
  // 99999.999 still fit in 9% with the 2pt padding of the cells.
  colN: { width: "5%" },
  colArticle: { width: "16%", textAlign: "left" },
  colDesignation: { width: "32%", textAlign: "left" },
  colQte: { width: "6%" },
  colRemise: { width: "6%" },
  colPUHT: { width: "9%", textAlign: "right" },
  colTVA: { width: "5%" },
  colPUTTC: { width: "9%", textAlign: "right" },
  colMontantTTC: { width: "12%", textAlign: "right" },
  summaryArea: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: SUMMARY_BOTTOM,
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
  /** "BON DE COMMANDE" / "BON DE RÉCEPTION" / "FACTURE FOURNISSEUR" */
  title: string;
  /** "bon de commande" / "bon de réception" / "facture", used in the amount-in-words sentence */
  documentLabel: string;
  /** "Arrêtée la présente facture…" instead of "Arrêté le présent bon…" */
  feminine?: boolean;
  numero: string;
  date?: string | null;
  dateLabel: string;
  fournisseur?: Fournisseur | null;
  depot?: Depot | null;
  notes?: string | null;
  articles: any[];
  remise?: number | string | null;
  remiseType?: string | null;
  /** Adds 1.000 DT to the net à payer (factures) */
  timbreFiscal?: boolean | null;
  /** Factures: what was already paid and what is left, printed above the net à payer */
  payment?: { montantPaye: number; resteAPayer: number } | null;
  companyInfo: {
    name: string;
    address: string;
    city: string;
    phone: string;
    email: string;
    website: string;
    logo?: string;
    taxId: string;
    gsm?: string;
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

/**
 * How many articles the last page can hold above the summary: 6 like the ventes PDFs, fewer when
 * a tall summary (remise, timbre, payments…) or a long fournisseur block pushes the summary up
 * or the table down — they would otherwise be drawn over each other.
 * Sizes in pt, measured on the rendered PDF (A4 = 841.89pt tall).
 */
function lastPageCapacity(opts: {
  fournisseurLines: number;
  hasDepot: boolean;
  summaryRows: number; // rows of the totals box, without the NET À PAYER band
  tvaRates: number;
  notes?: string | null;
}): number {
  const PAGE_HEIGHT = 841.89;
  const detailsLeft = 66 + (opts.hasDepot ? 24 : 0);          // title, number, date, depot
  const detailsRight = 36.3 + 14.6 * opts.fournisseurLines;   // fournisseur box
  const tableTop = 95 + Math.max(detailsLeft, detailsRight) + 14;
  const totalsHeight = 48 + 18 * opts.summaryRows;
  const notesHeight = opts.notes ? 20 + 12.2 * Math.ceil((opts.notes.length + 8) / 55) : 0;
  const tvaHeight = 20.6 + 24.6 * Math.max(1, opts.tvaRates) + notesHeight;
  const summaryHeight = Math.max(totalsHeight, tvaHeight);
  const TABLE_HEADER = 23, ROW = 32, MARGIN = 8;
  const room = PAGE_HEIGHT - SUMMARY_BOTTOM - summaryHeight - tableTop - TABLE_HEADER - MARGIN;
  return Math.max(0, Math.min(LAST_PAGE_MAX, Math.floor(room / ROW)));
}

function buildPageGroups(articles: any[], lastPageMax: number = LAST_PAGE_MAX): PageGroup[] {
  if (!articles || articles.length === 0) {
    return [{ articles: [], isLast: true, startIndex: 0 }];
  }
  if (articles.length <= lastPageMax) {
    return [{ articles, isLast: true, startIndex: 0 }];
  }

  const groups: PageGroup[] = [];
  let cursor = 0;
  while (cursor < articles.length) {
    const remaining = articles.length - cursor;
    if (remaining <= lastPageMax) {
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

const fournisseurBoxLines = (f?: Fournisseur | null): string[] => {
  if (!f) return [];
  return [
    ...wrapTextHelper(f.raison_sociale || "", 45),
    ...(f.matricule_fiscal ? [`MF: ${f.matricule_fiscal}`] : []),
    ...wrapTextHelper([f.adresse, f.ville].filter(Boolean).join(" - "), 45),
    ...(f.telephone1 ? [`Tél: ${formatPhoneDisplay(f.telephone1, "")}`] : []),
    ...(f.telephone2 ? [`Tél: ${formatPhoneDisplay(f.telephone2, "")}`] : []),
    ...(f.email ? [`Email: ${f.email}`] : []),
  ];
};

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
  timbreFiscal,
  payment,
  feminine,
  companyInfo,
}) => {
  const lines = (articles || []).map(toAchatCalcLine);
  const { sousTotalHT, netHT, totalTax, finalTotal, discountAmount, timbre, netAPayer, tvaBreakdown } =
    calculateAchatTotals({ articles, remise, remiseType, timbreFiscal });
  const remiseRow = remiseLine(discountAmount);

  const fournisseurLines = fournisseurBoxLines(fournisseur);
  const hasPaid = !!payment && Number(payment.montantPaye) > 0;
  const lastPageMax = lastPageCapacity({
    fournisseurLines: fournisseurLines.length,
    hasDepot: !!depot?.nom,
    summaryRows: 4 + (remiseRow ? 1 : 0) + (timbre > 0 ? 1 : 0) + (hasPaid ? 1 : 0) + (payment ? 1 : 0),
    tvaRates: Object.keys(tvaBreakdown).length,
    notes,
  });
  const pageGroups = buildPageGroups(lines, lastPageMax);
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
            {remiseRow && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{remiseRow.label} sur HT:</Text>
                <Text style={styles.summaryValue}>{remiseRow.sign} {formatCurrency(remiseRow.amount)} DT</Text>
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
            {timbre > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Timbre Fiscal:</Text>
                <Text style={styles.summaryValue}>{formatCurrency(timbre)} DT</Text>
              </View>
            )}
            {hasPaid && payment && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Montant payé:</Text>
                <Text style={styles.summaryValue}>{formatCurrency(Number(payment.montantPaye))} DT</Text>
              </View>
            )}
            {payment && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Reste à payer:</Text>
                <Text style={styles.summaryValue}>{formatCurrency(Number(payment.resteAPayer) || 0)} DT</Text>
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
          {feminine ? "Arrêtée la présente" : "Arrêté le présent"} {documentLabel} à la somme de : {amountInWords}
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
            {depot?.nom ? (
              <View style={[styles.documentDetailItem, { marginTop: 4 }]}>
                <Text style={styles.documentDetailLabel}>
                  Dépôt: <Text style={styles.boldText}>{depot.nom}</Text>
                </Text>
              </View>
            ) : null}
          </View>
          <View style={styles.fournisseurInfoContainer}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 3 }}>
              <Text style={styles.sectionTitle}>FOURNISSEUR</Text>
            </View>
            {fournisseurLines.map((line, idx) => (
              <Text key={idx} style={styles.fournisseurLineItem}>{line}</Text>
            ))}
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
