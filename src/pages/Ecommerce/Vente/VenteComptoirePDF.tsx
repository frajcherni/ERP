import React from "react";
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';
import moment from "moment";
import { BonCommandeClient } from "../../../Components/Article/Interfaces";

Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf', fontWeight: 400 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf', fontWeight: 700 },
  ]
});

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 20,
    fontSize: 11,
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    borderBottom: '1pt solid #000',
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
    fontWeight: 'bold',
  },
  companyInfo: {
    width: '60%'
  },
  logo: {
    width: 200,
    marginBottom: 5
  },
  clientVendeurSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    marginTop: 3,
  },
  vendeurInfo: {
    width: '35%',
    alignItems: 'flex-start'
  },
  sectionTitle: {
    fontSize: 12,
    marginBottom: 3,
    fontWeight: 'normal',
  },
  clientText: {
    fontSize: 10,
    marginBottom: 1,
    fontWeight: 'bold',
  },
  vendeurText: {
    fontSize: 10,
    marginBottom: 1,
    fontWeight: 'bold',
  },
  tableContainer: {
    marginBottom: 15,
    marginTop: 6,
    borderTop: '1pt solid #ddd',
    borderLeft: '1pt solid #ddd',
    borderRight: '1pt solid #ddd',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#00aeef',
    paddingVertical: 5,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1pt solid #ddd',
    paddingVertical: 6,
    minHeight: 24,
  },
  tableColHeader: {
    paddingHorizontal: 4,
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 10,
    color: '#ffffff',
  },
  tableCol: {
    paddingHorizontal: 4,
    fontSize: 10,
    textAlign: 'center',
  },
  colN: { width: '5%' },
  colArticle: { width: '15%', textAlign: 'left' },
  colDesignation: { width: '29%', textAlign: 'left' },
  colQuantite: { width: '8%' },
  colPUHT: { width: '10%', textAlign: 'right' },
  colTVA: { width: '8%' },
  colPUTTC: { width: '10%', textAlign: 'right' },
  colMontantTTC: { width: '10%', textAlign: 'right' },
  summaryArea: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 160,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  leftColumn: {
    width: '50%',
    flexDirection: 'column',
  },
  tvaTable: {
    borderTop: '1pt solid #ddd',
    borderLeft: '1pt solid #ddd',
    borderRight: '1pt solid #ddd',
    width: '100%',
  },
  tvaHeader: {
    flexDirection: 'row',
    backgroundColor: '#00aeef',
    paddingVertical: 5,
  },
  tvaRow: {
    flexDirection: 'row',
    borderBottom: '1pt solid #ddd',
    paddingVertical: 5,
  },
  tvaHeaderTaux: { width: '25%', fontSize: 10, fontWeight: 'bold', textAlign: 'center', color: '#fff', paddingHorizontal: 4 },
  tvaHeaderBase: { width: '35%', fontSize: 10, fontWeight: 'bold', textAlign: 'right', color: '#fff', paddingHorizontal: 4 },
  tvaHeaderMontant: { width: '40%', fontSize: 10, fontWeight: 'bold', textAlign: 'right', color: '#fff', paddingHorizontal: 4 },
  tvaColTaux: { width: '25%', fontSize: 10, textAlign: 'center', paddingHorizontal: 4 },
  tvaColBase: { width: '35%', fontSize: 10, textAlign: 'right', paddingHorizontal: 4 },
  tvaColMontant: { width: '40%', fontSize: 10, textAlign: 'right', paddingHorizontal: 4 },
  totalsContainer: { width: '40%' },
  totalsBox: {
    padding: 8,
    border: '1pt solid #ddd',
    width: '100%',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3
  },
  summaryLabel: {
    fontSize: 11,
  },
  summaryValue: {
    fontSize: 11,
  },
  netAPayerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    borderTop: '2pt solid #333',
    marginHorizontal: -8,
    marginBottom: -8,
  },
  netAPayerLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    backgroundColor: '#00aeef',
    color: '#ffffff',
    width: '50%',
    paddingVertical: 8,
    paddingLeft: 8,
  },
  netAPayerValue: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'right',
    width: '50%',
    paddingVertical: 6,
    paddingRight: 8,
  },
  cachetSignatureSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    position: 'absolute',
    bottom: 75,
    left: 20,
    right: 20,
  },
  signatureContainer: {
    width: '35%',
    alignItems: 'center',
  },
  cachetContainer: {
    width: '35%',
    alignItems: 'center',
  },
  signatureText: {
    fontSize: 11,
    marginBottom: 2,
    fontWeight: 'bold',
  },
  cachetText: {
    fontSize: 11,
    marginBottom: 2,
    fontWeight: 'bold',
  },
  subText: {
    fontSize: 9,
    fontStyle: 'italic',
  },
  footer: {
    position: 'absolute',
    bottom: 5,
    left: 20,
    right: 20,
    textAlign: 'center',
    fontSize: 8,
    borderTop: '1pt solid #ddd',
    paddingTop: 3,
  },
  footerLine: {
    marginBottom: 1
  },
  amountInWords: {
    position: 'absolute',
    bottom: 115,
    left: 20,
    right: 20,
    padding: 8,
    border: '1pt solid #ddd',
  },
  amountText: {
    fontSize: 10,
    textAlign: 'center',
  },
  pageNumber: {
    position: 'absolute',
    bottom: 5,
    left: 20,
    fontSize: 8,
  },
  boldText: {
    fontWeight: 'bold',
  },
  clientInfoContainer: {
    width: '60%',
    alignItems: 'flex-start',
    left: '180'
  },
  clientLine: {
    fontSize: 10,
    marginBottom: 1,
    fontWeight: 'bold',
    flexWrap: 'wrap'
  },
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
  }
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

const FactureVentePDF: React.FC<FactureVentePDFProps> = ({ bonCommande, companyInfo }) => {
  const calculateTotals = () => {
    if (!bonCommande?.articles || bonCommande.articles.length === 0) {
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

    // Initialize final TVA breakdown - use let instead of const
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

  const { sousTotalHT, netHT, totalTax, grandTotal, finalTotal, discountAmount, tvaBreakdown } = calculateTotals();

  // Format currency function
  const formatCurrency = (amount: number) => {
    return amount.toFixed(3);
  };

  // Calculate TVA table totals for verification
  const calculateTVATableTotals = () => {
    let totalBase = 0;
    let totalMontant = 0;

    Object.keys(tvaBreakdown).forEach(rate => {
      const tvaRate = parseFloat(rate);
      totalBase += tvaBreakdown[tvaRate].base;
      totalMontant += tvaBreakdown[tvaRate].montant;
    });

    return {
      totalBase: Math.round(totalBase * 1000) / 1000,
      totalMontant: Math.round(totalMontant * 1000) / 1000,
      netHT: Math.round(netHT * 1000) / 1000,
      totalTax: Math.round(totalTax * 1000) / 1000
    };
  };

  // Render TVA breakdown table
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
              {formatCurrency(Math.round(tvaBreakdown[rate].base * 1000) / 1000)} DT
            </Text>
            <Text style={styles.tvaColMontant}>
              {formatCurrency(Math.round(tvaBreakdown[rate].montant * 1000) / 1000)} DT
            </Text>
          </View>
        ))}


      </View>
    );
  };

  const tvaTableTotals = calculateTVATableTotals();


  const numberToWords = (num: number): string => {
    const units = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
    const teens = ['dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
    const tens = ['', 'dix', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingt', 'quatre-vingt-dix'];

    const integerPart = Math.floor(num);

    if (integerPart === 0) {
      return 'Zéro dinars zéro millime uniquement';
    }

    let words = '';

    if (integerPart >= 1000) {
      const thousands = Math.floor(integerPart / 1000);
      if (thousands === 1) {
        words += 'mille';
      } else if (thousands < 10) {
        words += units[thousands] + ' mille';
      } else if (thousands < 20) {
        words += teens[thousands - 10] + ' mille';
      } else if (thousands < 100) {
        const ten = Math.floor(thousands / 10);
        const unit = thousands % 10;
        words += tens[ten];
        if (unit > 0) {
          if (ten === 7 || ten === 9) {
            words += '-' + teens[unit];
          } else {
            words += '-' + units[unit];
          }
        }
        words += ' mille';
      }

      const remainder = integerPart % 1000;
      if (remainder > 0) {
        words += ' ';
      }
    }

    const remainder = integerPart % 1000;
    if (remainder >= 100) {
      const hundreds = Math.floor(remainder / 100);
      if (hundreds === 1) {
        words += 'cent';
      } else {
        words += units[hundreds] + ' cent';
      }
      const smallRemainder = remainder % 100;
      if (smallRemainder > 0) {
        words += ' ';
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
            words += '-' + teens[unit];
          } else {
            words += '-' + units[unit];
          }
        }
      }
    }

    words += ' dinars zéro millime';

    return words.charAt(0).toUpperCase() + words.slice(1) + ' uniquement';
  };

  const amountInWords = numberToWords(finalTotal);

  const wrapText = (text: string, maxLength: number = 25): string[] => {
    if (!text || text.length <= maxLength) return [text];
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    words.forEach(word => {
      if ((currentLine + ' ' + word).length > maxLength) {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = currentLine ? currentLine + ' ' + word : word;
      }
    });

    if (currentLine) lines.push(currentLine);
    return lines;
  };

  const articlesPerPage = 12;
  const articleChunks: any[][] = [];
  const articles = bonCommande?.articles || [];

  for (let i = 0; i < articles.length; i += articlesPerPage) {
    articleChunks.push(articles.slice(i, i + articlesPerPage));
  }

  if (articleChunks.length === 0) {
    articleChunks.push([]);
  }

  const renderTable = (articles: any[], pageIndex: number) => (
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

      {articles.map((item, index) => {
        const qty = Number(item.quantite) || 0;
        const priceHT = Number(item.prixUnitaire) || 0;
        const tvaRate = Number(item.tva) || 0;
        const remiseRate = Number(item.remise) || 0;

        const prixTTC = Number(item.prix_ttc) || priceHT * (1 + tvaRate / 100);
        const montantSousTotalHT = Math.round(qty * priceHT * 1000) / 1000;
        const montantNetHT = Math.round(qty * priceHT * (1 - remiseRate / 100) * 1000) / 1000;
        const montantTTCLigne = Math.round(qty * prixTTC * 1000) / 1000;


        return (
          <View style={styles.tableRow} key={index}>
            <View style={[styles.colN, styles.tableCol]}><Text>{pageIndex * articlesPerPage + index + 1}</Text></View>
            <View style={[styles.colArticle, styles.tableCol]}>
              <Text>{item.article?.reference || '-'}</Text>
            </View>
            <View style={[styles.colDesignation, styles.tableCol]}>
              <Text>{item.designation || item.article?.designation || '-'}</Text>
            </View>
            <View style={[styles.colQuantite, styles.tableCol]}><Text>{qty}</Text></View>
            <View style={[styles.colPUHT, styles.tableCol]}><Text>{formatCurrency(priceHT)}</Text></View>
            <View style={[styles.colTVA, styles.tableCol]}>
              <Text>{tvaRate > 0 ? `${tvaRate}%` : '-'}</Text>
            </View>
            <View style={[styles.colPUTTC, styles.tableCol]}><Text>{formatCurrency(prixTTC)}</Text></View>
            <View style={[styles.colMontantTTC, styles.tableCol]}><Text>{formatCurrency(montantTTCLigne)}</Text></View>
          </View>
        );
      })}

      {articles.length === 0 && (
        <View style={styles.tableRow}>
          <View style={[styles.colDesignation, styles.tableCol, { width: '100%' }]}>
            <Text>Aucun article</Text>
          </View>
        </View>
      )}
    </View>
  );



  const renderSummarySection = () => {
    const bottomPos = 160;
    const hasRemise = Number(bonCommande.remise) > 0;

    // Verify that totals match
    const shouldMatchNetHT = tvaTableTotals.totalBase;
    const shouldMatchTotalTax = tvaTableTotals.totalMontant;

    return (
      <View style={[styles.summaryArea, { bottom: bottomPos }]}>
        <View style={styles.leftColumn}>
          {renderTVABreakdown()}
        </View>
        <View style={styles.totalsContainer}>
          <View style={styles.totalsBox}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total H.T.:</Text>
              <Text style={styles.summaryValue}>{formatCurrency(sousTotalHT)} DT</Text>
            </View>

            {hasRemise && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Remise:</Text>
                <Text style={styles.summaryValue}>- {formatCurrency(discountAmount)} DT</Text>
              </View>
            )}

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Net H.T.:</Text>
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

            {/* NET À PAYER as table - Same design as BC */}
            <View style={styles.netAPayerContainer}>
              <Text style={styles.netAPayerLabel}>NET À PAYER:</Text>
              <Text style={styles.netAPayerValue}>{formatCurrency(finalTotal)} DT</Text>
            </View>
          </View>
        </View>
      </View>
    );
  }
  const safeBonCommande = bonCommande || {};
  const safeCompanyInfo = companyInfo || {};

  const renderPageHeader = (pageIndex: number) => (
    <>
      <View style={styles.header}>
        <View style={styles.companyInfo}>
          {safeCompanyInfo.logo && <Image src={safeCompanyInfo.logo} style={styles.logo} />}
        </View>
      </View>

      {pageIndex === 0 && (
        <>
          <View style={styles.commandeDetails}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View>
                <View style={styles.commandeDetailItem}>
                  <Text style={styles.N}>
                    <Text style={styles.commandeNumberValue}>{safeBonCommande.numeroCommande || 'N/A'}</Text>
                  </Text>
                </View>
                <View style={styles.commandeDetailItem}>
                  <Text style={styles.commandeDetailLabel}>
                    Date: <Text style={styles.boldText}>
                      {safeBonCommande.dateCommande ? moment(safeBonCommande.dateCommande).format("DD/MM/YYYY") : 'N/A'}
                    </Text>
                  </Text>
                </View>
              </View>

              <View style={styles.clientInfoContainer}>
                <Text style={styles.sectionTitle}>CLIENT</Text>
                {safeBonCommande.clientWebsite ? (
                  <>
                    {safeBonCommande.clientWebsite.nomPrenom &&
                      wrapText(safeBonCommande.clientWebsite.nomPrenom).map((line, index) => (
                        <Text style={styles.clientLine} key={`nomPrenom-${index}`}>{line}</Text>
                      ))
                    }
                    {safeBonCommande.clientWebsite.telephone && (
                      <Text style={styles.clientLine}>Tél: {safeBonCommande.clientWebsite.telephone}</Text>
                    )}
                    {safeBonCommande.clientWebsite.email && (
                      <Text style={styles.clientLine}>Email: {safeBonCommande.clientWebsite.email}</Text>
                    )}
                  </>
                ) : safeBonCommande.client ? (
                  <>
                    {safeBonCommande.client.raison_sociale &&
                      wrapText(safeBonCommande.client.raison_sociale).map((line, index) => (
                        <Text style={styles.clientLine} key={`raison-${index}`}>{line}</Text>
                      ))
                    }
                    {safeBonCommande.client.matricule_fiscal && (
                      <Text style={styles.clientLine}>MF: {safeBonCommande.client.matricule_fiscal}</Text>
                    )}
                    {safeBonCommande.client.adresse &&
                      wrapText(safeBonCommande.client.adresse).map((line, index) => (
                        <Text style={styles.clientLine} key={`adresse-${index}`}>{line}</Text>
                      ))
                    }
                    {safeBonCommande.client.telephone1 && (
                      <Text style={styles.clientLine}>Tél: {safeBonCommande.client.telephone1}</Text>
                    )}
                    {safeBonCommande.client.telephone2 && (
                      <Text style={styles.clientLine}>Tél: {safeBonCommande.client.telephone2}</Text>
                    )}
                  </>
                ) : null}
              </View>
            </View>
          </View>

          <View style={styles.vendeurPaymentContainer}>
            <View style={styles.vendeurContainer}>
              <Text style={styles.sectionTitle}>VENDEUR</Text>
              {safeBonCommande.vendeur && (
                <Text style={styles.vendeurText}>
                  {[safeBonCommande.vendeur.nom, safeBonCommande.vendeur.prenom].filter(Boolean).join(' ')}
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
        {[safeCompanyInfo.name, safeCompanyInfo.address, safeCompanyInfo.city, safeCompanyInfo.phone, safeCompanyInfo.gsm, safeCompanyInfo.taxId]
          .filter(Boolean)
          .join(' - ')}
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
            Arrêtée la présente vente à la somme de : {amountInWords}
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

export default FactureVentePDF;