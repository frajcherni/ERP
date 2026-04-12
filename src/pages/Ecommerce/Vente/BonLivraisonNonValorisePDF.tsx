// BonLivraisonNonValorisePDF.tsx
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
import { BonLivraison } from "../../../Components/Article/Interfaces";

// Use the EXACT same styles from FacturePDF
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
  colDesignation: { width: "29%", textAlign: "left" },
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
  tvaHeaderTaux: { width: "25%", fontSize: 10, fontWeight: "bold", textAlign: "center", color: "#fff", paddingHorizontal: 4 },
  tvaHeaderBase: { width: "35%", fontSize: 10, fontWeight: "bold", textAlign: "right", color: "#fff", paddingHorizontal: 4 },
  tvaHeaderMontant: { width: "40%", fontSize: 10, fontWeight: "bold", textAlign: "right", color: "#fff", paddingHorizontal: 4 },
  tvaColTaux: { width: "25%", fontSize: 10, textAlign: "center", paddingHorizontal: 4 },
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
  clientLine: { fontSize: 10, marginBottom: 1, fontWeight: "bold", flexWrap: "wrap" },
  vendeurPaymentContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  vendeurContainer: {
    width: '55%',
  },
  paymentContainerAboveTable: {
    width: '40%',
  },


deliveryInfoHeader: {
  backgroundColor: "#00aeef",
  paddingVertical: 4,
  paddingHorizontal: 8,
  margin: -8,
  marginBottom: 8,
},
deliveryInfoTitle: {
  fontSize: 11,
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
deliveryInfoBox: {
  padding: 8,
  border: "1pt solid #ddd",
  width: "100%",
  marginBottom: 10,
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

const BonLivraisonNonValorisePDF: React.FC<BonLivraisonPDFProps> = ({ bonLivraison, companyInfo }) => {
  const isLinkedToBC = !!bonLivraison.bonCommandeClient;

  // Empty values for non-valorised version
  const emptyTotals = {
    sousTotalHT: 0,
    netHT: 0,
    totalTax: 0,
    grandTotal: 0,
    finalTotal: 0,
    discountAmount: 0,
  };

  const formatCurrency = (amount: number) => {
    return amount.toFixed(3);
  };

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


  // Check if delivery information exists
const hasDeliveryInfo = bonLivraison.voiture || bonLivraison.serie || bonLivraison.chauffeur || bonLivraison.cin;

// Render delivery information box
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
          <Text style={styles.deliveryInfoValue}>{bonLivraison.voiture || "Non spécifié"}</Text>
        </View>
        <View style={styles.deliveryInfoItem}>
          <Text style={styles.deliveryInfoLabel}>Série:</Text>
          <Text style={styles.deliveryInfoValue}>{bonLivraison.serie || "Non spécifié"}</Text>
        </View>
      </View>
      <View style={styles.deliveryInfoRow}>
        <View style={styles.deliveryInfoItem}>
          <Text style={styles.deliveryInfoLabel}>Chauffeur:</Text>
          <Text style={styles.deliveryInfoValue}>{bonLivraison.chauffeur || "Non spécifié"}</Text>
        </View>
        <View style={styles.deliveryInfoItem}>
          <Text style={styles.deliveryInfoLabel}>CIN:</Text>
          <Text style={styles.deliveryInfoValue}>{bonLivraison.cin || "Non spécifié"}</Text>
        </View>
      </View>
    </View>
  );
};




  const renderSummarySection = () => {
    const bottomPos = 160;
    
    return (
      <View style={[styles.summaryArea, { bottom: bottomPos }]}>
        <View style={styles.leftColumn}>
        {renderDeliveryInfoBox()}
        </View>
        <View style={styles.totalsContainer}>
          {/* Completely remove the totals box */}
          <View style={{ width: '100%' }}>
            {/* Empty - no totals to display */}
          </View>
        </View>
      </View>
    );
  };

  const articlesPerPage = 12;
  const articleChunks = [];
  const articles = bonLivraison?.articles || [];
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
        <View style={[styles.colArticle, styles.tableColHeader, { width: '25%' }]}>
          <Text>ARTICLE</Text>
        </View>
        <View style={[styles.colDesignation, styles.tableColHeader, { width: '42%' }]}>
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
  
  return (
    <View style={styles.tableRow} key={index}>
      <View style={[styles.colN, styles.tableCol]}>
        <Text>{pageIndex * articlesPerPage + index + 1}</Text>
      </View>
      <View style={[styles.colArticle, styles.tableCol, { width: '25%' }]}>
        <Text>{item.article?.reference || " "}</Text>
      </View>
      <View style={[styles.colDesignation, styles.tableCol, { width: '42%' }]}>
      <Text>{item.designation || item.article?.designation || '-'}</Text>
      </View>
      <View style={[styles.colQuantite, styles.tableCol]}>
        <Text>{qty}</Text>
      </View>
      <View style={[styles.colPUHT, styles.tableCol]}>
        <Text> </Text>
      </View>
      <View style={[styles.colTVA, styles.tableCol]}>
        <Text> </Text>
      </View>
      <View style={[styles.colPUTTC, styles.tableCol]}>
        <Text> </Text>
      </View>
      <View style={[styles.colMontantTTC, styles.tableCol]}>
        <Text> </Text>
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

  const safeBonLivraison = bonLivraison || {};
  const safeCompanyInfo = companyInfo || {};

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
                      {safeBonLivraison.numeroLivraison || "N/A"}
                    </Text>
                  </Text>
                </View>
                <View style={styles.commandeDetailItem}>
                  <Text style={styles.commandeDetailLabel}>
                    Date:{" "}
                    <Text style={styles.boldText}>
                      {safeBonLivraison.dateLivraison
                        ? moment(safeBonLivraison.dateLivraison).format("DD/MM/YYYY")
                        : "N/A"}
                    </Text>
                  </Text>
                </View>
              </View>
              <View style={styles.clientInfoContainer}>
                <Text style={styles.sectionTitle}>CLIENT</Text>
                {safeBonLivraison.client?.raison_sociale &&
                  wrapText(safeBonLivraison.client.raison_sociale).map(
                    (line, index) => (
                      <Text
                        style={styles.clientLine}
                        key={`raison-${index}`}
                      >
                        {line}
                      </Text>
                    )
                  )}
                {safeBonLivraison.client?.matricule_fiscal && (
                  <Text style={styles.clientLine}>
                    MF: {safeBonLivraison.client.matricule_fiscal}
                  </Text>
                )}
                {safeBonLivraison.client?.adresse &&
                  wrapText(safeBonLivraison.client.adresse).map(
                    (line, index) => (
                      <Text
                        style={styles.clientLine}
                        key={`adresse-${index}`}
                      >
                        {line}
                      </Text>
                    )
                  )}
                {safeBonLivraison.client?.telephone1 && (
                  <Text style={styles.clientLine}>
                    Tél: {safeBonLivraison.client.telephone1}
                  </Text>
                )}
                  {safeBonLivraison.client?.telephone2 && (
                  <Text style={styles.clientLine}>
                    Tél: {safeBonLivraison.client.telephone2}
                  </Text>
                )}
              </View>
            </View>
          </View>
          <View style={styles.vendeurPaymentContainer}>
            <View style={styles.vendeurContainer}>
              <Text style={styles.sectionTitle}>VENDEUR</Text>
              {safeBonLivraison.vendeur && (
                <Text style={styles.vendeurText}>
                  {[safeBonLivraison.vendeur.nom, safeBonLivraison.vendeur.prenom]
                    .filter(Boolean)
                    .join(" ")}
                </Text>
              )}
            </View>
            <View style={styles.paymentContainerAboveTable}>
              {/* Empty - same as FacturePDF design */}
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
    const amountBottom = 115;
    
    return (
      <>
        {renderSummarySection()}
       
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

export default BonLivraisonNonValorisePDF