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

Font.register({
  family: "Roboto",
  fonts: [
    { src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf" },
    { src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf", fontWeight: 700 },
    { src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf", fontWeight: 300 },
    { src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-italic-webfont.ttf", fontStyle: "italic" },
  ],
});

// Brand colors
const COLORS = {
  primary: '#2c3e50',
  secondary: '#34495e',
  accent: '#e67e22',
  headerBg: '#f0f4f8',
  borderColor: '#bdc3c7',
  text: '#2c3e50',
  white: '#ffffff',
  groupHeaderBg: '#d6eaf8'
};

const styles = StyleSheet.create({
  page: {
    padding: 20,
    fontFamily: "Roboto",
    fontSize: 8,
    backgroundColor: "#ffffff",
    lineHeight: 1.2,
    color: COLORS.text
  },
  header: {
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: `2pt solid ${COLORS.primary}`,
    paddingBottom: 5
  },
  logo: {
    width: 120,
    height: 60,
    objectFit: "contain",
  },
  companyInfo: {
    fontSize: 9,
    lineHeight: 1.2,
    textAlign: "right",
    color: COLORS.secondary
  },
  titleContainer: {
    marginBottom: 8,
    alignItems: 'center'
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    color: COLORS.primary,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 2
  },
  period: {
    fontSize: 12,
    color: "black",
    paddingVertical: 2,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignSelf: 'center',
    marginTop: 5
  },
  tableContainer: {
    width: "100%",
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    borderRadius: 4,
    marginTop: 15,
    overflow: 'hidden'
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: COLORS.primary,
    color: COLORS.white,
    paddingVertical: 6,
    alignItems: 'center'
  },
  headerCell: {
    fontSize: 9,
    fontWeight: "bold",
    textAlign: "center",
    paddingHorizontal: 2
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
    minHeight: 20,
    alignItems: "center",
    paddingVertical: 4
  },
  rowEven: {
    backgroundColor: '#fbfcfc'
  },
  cell: {
    fontSize: 8,
    paddingHorizontal: 2,
    textAlign: 'center',
    color: COLORS.text
  },
  // Column widths - removed colRefDate
  colDate: { width: "12%" },
  colNum: { width: "23%" },
  colClient: { width: "25%", textAlign: "left", paddingLeft: 4 },
  colMode: { width: "20%", textAlign: "left", paddingLeft: 4 },
  colAmount: { width: "12%", textAlign: "right", paddingRight: 4, fontWeight: 'bold' },
  colType: { width: "8%" },

  // Group total row
  groupTotalRow: {
    flexDirection: "row",
    backgroundColor: '#fafafa',
    borderTopWidth: 1,
    borderTopColor: COLORS.primary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderColor,
    alignItems: "center",
    paddingVertical: 6
  },
  groupTotalLabel: {
    width: "80%",
    textAlign: "right",
    paddingRight: 10,
    fontSize: 8,
    fontWeight: "bold",
    color: COLORS.secondary,
    textTransform: 'uppercase'
  },
  groupTotalValue: {
    width: "12%",
    textAlign: "right",
    paddingRight: 4,
    fontSize: 9,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  totalRow: {
    flexDirection: "row",
    backgroundColor: COLORS.primary,
    color: COLORS.white,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginTop: 15,
    borderRadius: 4,
    justifyContent: "space-between",
    alignItems: "center"
  },
  totalLabel: {
    fontSize: 10,
    fontWeight: "bold",
    textTransform: 'uppercase'
  },
  totalValue: {
    fontSize: 12,
    fontWeight: "bold"
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderColor,
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  footerText: {
    fontSize: 6,
    color: '#7f8c8d',
  },
  pageNumber: {
    fontSize: 6,
    color: '#7f8c8d'
  },
  groupHeaderCash: {
    backgroundColor: '#e6f7ff',
    paddingVertical: 6,
    paddingHorizontal: 8,
    fontSize: 9,
    fontWeight: "bold",
    color: COLORS.primary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderColor,
    marginTop: 0
  },
  groupHeaderCheck: {
    backgroundColor: '#e6f2ff',
    paddingVertical: 6,
    paddingHorizontal: 8,
    fontSize: 9,
    fontWeight: "bold",
    color: COLORS.primary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderColor,
    marginTop: 0
  },
  groupHeaderTransfer: {
    backgroundColor: '#f0f8ff',
    paddingVertical: 6,
    paddingHorizontal: 8,
    fontSize: 9,
    fontWeight: "bold",
    color: COLORS.primary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderColor,
    marginTop: 0
  },
  groupHeaderCard: {
    backgroundColor: '#f5fbff',
    paddingVertical: 6,
    paddingHorizontal: 8,
    fontSize: 9,
    fontWeight: "bold",
    color: COLORS.primary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderColor,
    marginTop: 0
  },
  groupHeaderOther: {
    backgroundColor: '#f8fcff',
    paddingVertical: 6,
    paddingHorizontal: 8,
    fontSize: 9,
    fontWeight: "bold",
    color: COLORS.primary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderColor,
    marginTop: 0
  },
  groupHeaderRetention: {
    backgroundColor: '#ffe6e6', // Light red for retention
    paddingVertical: 6,
    paddingHorizontal: 8,
    fontSize: 9,
    fontWeight: "bold",
    color: COLORS.primary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderColor,
    marginTop: 0
  },
});

const TrésoreriePDF: React.FC<any> = ({ data, companyInfo, dateRange }) => {
  // Safe format amount function
  const formatAmount = (value: any) => {
    if (value === null || value === undefined) return "0.000";
    const num = typeof value === 'number' ? value : parseFloat(value);
    if (isNaN(num)) return "0.000";
    return num.toFixed(3).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const allTransactions = data?.transactions || [];

  const getClientName = (transaction: any) => {
    if (!transaction) return "N/A";

    if (transaction.client) {
      if (typeof transaction.client === 'string') return transaction.client.trim();
      if (typeof transaction.client === 'object') {
        return (
          transaction.client.name ||
          transaction.client.raison_sociale ||
          transaction.client.designation ||
          'Client'
        ).trim();
      }
    }

    if (transaction.clientName && typeof transaction.clientName === 'string') {
      return transaction.clientName.trim();
    }

    if (transaction.type === 'vente_comptoire') return 'Comptoir';
    return 'Client';
  };

  // Helper to get payment label
  const getPaymentLabel = (pm: any, docNumber: string) => {
    if (!pm || !pm.method) return "Espèces";
    const method = pm.method.toLowerCase();

    if (method.includes("retenue") || method.includes("retention")) {
      return docNumber; // Show document number for retention
    }
    if (method.includes("cheque") || method.includes("chèque")) {
      const banque = pm.banque ? `${pm.banque} ` : '';
      const numero = pm.numero ? `N°${pm.numero}` : '';
      return `Chèque ${banque}${numero}`.trim();
    }
    if (method.includes("traite")) {
      const numero = pm.numero ? `N°${pm.numero}` : '';
      const dateEcheance = pm.dateEcheance ? moment(pm.dateEcheance).format("DD/MM/YY") : '';
      return `Traite ${numero} ${dateEcheance}`.trim();
    }
    if (method.includes("virement")) return "Virement bancaire";
    if (method.includes("tpe") || method.includes("carte")) return "Carte Bancaire";
    if (method.includes("autre")) return "Autre";
    return "Espèces";
  };

  // Helper to categorize payment group
  const getPaymentGroup = (pm: any) => {
    if (!pm || !pm.method) return "Espèces";
    const method = pm.method.toLowerCase();

    if (method.includes("retenue") || method.includes("retention")) return "Retenue";
    if (method.includes("cheque") || method.includes("chèque")) return "Chèque";
    if (method.includes("traite")) return "Traite";
    if (method.includes("virement")) return "Virement";
    if (method.includes("tpe") || method.includes("carte")) return "Carte";
    if (method.includes("autre")) return "Autre";
    return "Espèces";
  };

  const getDocumentNumber = (transaction: any) => {
    let docNumber = '';
    switch (transaction.type) {
      case 'facture_direct':
        docNumber = transaction.numeroFacture || transaction.numero || '';
        break;
      case 'encaissement':
        if (transaction.source && transaction.source.includes('Facture')) {
          docNumber = transaction.source.replace('Facture ', '');
        } else {
          docNumber = transaction.numero || '';
        }
        break;
      case 'bon_commande':
        docNumber = transaction.numeroCommande || transaction.numero || '';
        break;
      case 'paiement_bc':
        if (transaction.source && transaction.source.includes('BC')) {
          docNumber = transaction.source.replace('BC ', '');
        } else {
          docNumber = transaction.numero || '';
        }
        break;
      case 'vente_comptoire':
        docNumber = transaction.numeroCommande || transaction.numero || '';
        break;
      case 'bon_livraison':
        docNumber = transaction.numeroLivraison || transaction.numero || '';
        break;
      case 'paiement_bl':
        if (transaction.source && transaction.source.includes('BL')) {
          docNumber = transaction.source.replace('BL ', '');
        } else {
          docNumber = transaction.numero || '';
        }
        break;
      default:
        docNumber = transaction.numero || '';
    }
    return docNumber;
  };

  const getTypeRef = (transaction: any) => {
    if (!transaction) return "F";
    if (transaction.type) {
      if (['vente_comptoire'].includes(transaction.type)) return "V";
      if (['bon_commande', 'paiement_bc'].includes(transaction.type)) return "C";
      if (['bon_livraison', 'paiement_bl'].includes(transaction.type)) return "L";
    }
    const docNumber = transaction.numero || transaction.numeroCommande || '';
    if (docNumber.toUpperCase().includes('COMMANDE') || docNumber.toUpperCase().includes('BC')) return "C";
    return "F";
  };

  // Process transactions - ONE ROW PER PAYMENT METHOD
  const processTransactions = () => {
    const processedRows: any[] = [];

    allTransactions.forEach((transaction: any) => {  // Add :any here
      if (!transaction || !transaction.paymentMethods) return;

      const clientName = getClientName(transaction);
      const docNumber = getDocumentNumber(transaction);
      const typeRef = getTypeRef(transaction);
      const transactionDate = transaction.date;

      // Create one row per payment method
      transaction.paymentMethods.forEach((pm: any, idx: number) => {
        const amount = parseFloat(pm.amount) || 0;
        if (amount <= 0) return; // Skip zero amounts

        const group = getPaymentGroup(pm);
        const label = getPaymentLabel(pm, docNumber);
        
        // Use payment-specific date if it exists, otherwise fallback to transaction date
        const rowDate = pm.dateEcheance || transactionDate;

        processedRows.push({
          id: `${transaction.id}_${idx}`,
          date: rowDate,
          documentNumber: docNumber,
          clientName,
          paymentLabel: label,
          paymentGroup: group,
          montant: amount,
          typeRef,
          tauxRetention: pm.tauxRetention
        });
      });
    });

    return processedRows;
  };

  const processedRows = processTransactions();

  // Group by payment method
  const grouped = processedRows.reduce((acc: any, row: any) => {
    const group = row.paymentGroup;
    if (!acc[group]) acc[group] = [];
    acc[group].push(row);
    return acc;
  }, {});

  const groupOrder = ["Espèces", "Chèque", "Virement", "Traite", "Carte", "Autre", "Retenue"];
  const sortedGroups = Object.keys(grouped).sort((a, b) => {
    const ia = groupOrder.indexOf(a);
    const ib = groupOrder.indexOf(b);
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
  });

  const totalGeneral = processedRows.reduce((sum, row) => sum + row.montant, 0);

  if (allTransactions.length === 0) {
    return (
      <Document>
        <Page size="A4" style={styles.page}>
          <View style={styles.header}>
            <View>
              {companyInfo.logo && <Image src={companyInfo.logo} style={styles.logo} />}
            </View>
          </View>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>RECETTE</Text>
            <Text style={styles.period}>
              Du {moment(dateRange.startDate).format("DD/MM/YYYY")} au {moment(dateRange.endDate).format("DD/MM/YYYY")}
            </Text>
          </View>
          <View style={{ marginTop: 100, alignItems: 'center' }}>
            <Text style={{ color: COLORS.secondary }}>Aucune transaction trouvée pour cette période.</Text>
          </View>
        </Page>
      </Document>
    );
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            {companyInfo.logo && <Image src={companyInfo.logo} style={styles.logo} />}
          </View>
        </View>

        <View style={styles.titleContainer}>
          <Text style={styles.title}>RECETTE</Text>
          <Text style={styles.period}>
            DU {moment(dateRange.startDate).format("DD/MM/YYYY")} AU {moment(dateRange.endDate).format("DD/MM/YYYY")}
          </Text>
        </View>

        <View style={styles.tableContainer}>
          <View style={styles.tableHeader}>
            <Text style={[styles.headerCell, styles.colDate]}>DATE</Text>
            <Text style={[styles.headerCell, styles.colNum]}>DOCUMENT</Text>
            <Text style={[styles.headerCell, styles.colClient]}>CLIENT</Text>
            <Text style={[styles.headerCell, styles.colMode]}>DETAILS PAIEMENT</Text>
            <Text style={[styles.headerCell, styles.colAmount]}>MONTANT</Text>
            <Text style={[styles.headerCell, styles.colType]}>TYPE</Text>
          </View>

          {sortedGroups.map((groupKey) => {
            const transactions = grouped[groupKey] || [];
            if (transactions.length === 0) return null;

            const groupSum = transactions.reduce((s: number, t: any) => s + t.montant, 0);
            const operationCount = transactions.length;

            let groupHeaderStyle;
            switch (groupKey) {
              case 'Espèces': groupHeaderStyle = styles.groupHeaderCash; break;
              case 'Chèque': groupHeaderStyle = styles.groupHeaderCheck; break;
              case 'Virement': groupHeaderStyle = styles.groupHeaderTransfer; break;
              case 'Traite': groupHeaderStyle = styles.groupHeaderTransfer; break;
              case 'Carte': groupHeaderStyle = styles.groupHeaderCard; break;
              case 'Retenue': groupHeaderStyle = styles.groupHeaderRetention; break;
              default: groupHeaderStyle = styles.groupHeaderOther;
            }

            const groupDisplayName = groupKey === "Retenue" ? "RETENUE À LA SOURCE" :
              groupKey === "Carte" ? "CARTES BANCAIRE" :
                groupKey.toUpperCase();

            return (
              <View key={groupKey}>
                <Text style={groupHeaderStyle}>
                  {groupDisplayName}S ({operationCount} opération{operationCount > 1 ? 's' : ''})
                </Text>

                {transactions.map((t: any, i: number) => (
                  <View key={t.id} style={[styles.row, i % 2 === 1 ? styles.rowEven : {}]}>
                    <Text style={[styles.cell, styles.colDate]}>
                      {t.date ? moment(t.date).format("DD/MM/YY") : "-"}
                    </Text>
                    <Text style={[styles.cell, styles.colNum]}>
                      {t.documentNumber || "-"}
                    </Text>
                    <Text style={[styles.cell, styles.colClient]}>
                      {t.clientName}
                    </Text>
                    <Text style={[styles.cell, styles.colMode]}>
                      {t.paymentLabel}
                    </Text>
                    <Text style={[styles.cell, styles.colAmount]}>
                      {formatAmount(t.montant)} DT
                    </Text>
                    <Text style={[styles.cell, styles.colType]}>
                      {t.typeRef}
                    </Text>
                  </View>
                ))}

                <View style={styles.groupTotalRow}>
                  <Text style={styles.groupTotalLabel}>
                    TOTAL {groupKey === "Retenue" ? "RETENUE" : groupKey.toUpperCase()} :
                  </Text>
                  <Text style={styles.groupTotalValue}>
                    {formatAmount(groupSum)} DT
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>TOTAL GÉNÉRAL DES RECETTES</Text>
          <Text style={styles.totalValue}>{formatAmount(totalGeneral)} DT</Text>
        </View>

        <View style={styles.footer} fixed>
          <View>
            <Text style={styles.footerText}>
              Généré le {moment().format("DD/MM/YYYY HH:mm")} par {companyInfo.name}
            </Text>
          </View>
          <View>
            <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `Page ${pageNumber} sur ${totalPages}`} />
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default TrésoreriePDF;