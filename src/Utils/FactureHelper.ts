import { calculateDocumentTotals } from "./CalculationEngine";

export const calculateFactureTotals = (facture: any) => {
  if (!facture) {
    return {
      netHT: 0,
      totalTax: 0,
      totalTTC: 0,
      netAPayer: 0,
      timbre: 0
    };
  }

  const totals = calculateDocumentTotals({
    articles: facture.articles || [],
    remise: facture.remise || 0,
    remiseType: facture.remiseType || "percentage",
    exoneration: facture.exoneration === "OUI" || facture.exoneration === true,
    timbreFiscal: !!facture.timbreFiscal,
    lockedPercentage: facture.lockedPercentage || facture.locked_percentage || null,
    methodesReglement: facture.paymentMethods || []
  });

  return {
    netHT: totals.netHT,
    totalTax: totals.totalTax,
    totalTTC: totals.finalTotal,
    netAPayer: totals.netAPayer,
   // timbre: totals.timbreFiscal ? 1 : 0
  };
};
