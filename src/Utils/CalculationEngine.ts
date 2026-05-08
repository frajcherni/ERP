
/**
 * CalculationEngine.ts — Centralized high-precision financial logic for the entire ERP.
 * 
 * DESIGN PRINCIPLES:
 * 1. ZERO INTERMEDIATE ROUNDING: All calculations are performed using full IEEE-754 precision.
 * 2. CONSISTENT ACCUMULATION: Sums are calculated at the line-item level before applying global logic.
 * 3. DUAL OUTPUT: Returns both raw (full precision) and display-ready (3-decimal) values.
 */

export interface DocTotals {
  sousTotalHT: number;
  netHT: number;
  totalTax: number;
  grandTotal: number; // Gross TTC before global remise
  finalTotal: number; // Final TTC after global remise
  discountAmount: number;
  discountPercentage: number;
  retentionMontant: number;
  timbre: number;
  timbreFiscal: boolean;
  netAPayer: number;
  tvaBreakdown: { [key: number]: { base: number; montant: number } };
}

export interface LineTotals {
  unitHT: number;
  unitTTC: number;
  grossHT: number;
  netHT: number;
  taxAmount: number;
  ttc: number;
}

export const calculateLineTotals = (
  art: any,
  index: number,
  options: {
    editingHT?: { [key: number]: string | number };
    editingTTC?: { [key: number]: string | number };
    newDeliveryQuantities?: { [key: number]: number | "" };
    isExonerated?: boolean;
  } = {}
) => {
  const {
    editingHT = {},
    editingTTC = {},
    newDeliveryQuantities = {},
    isExonerated = false,
  } = options;

  const artId = art.article_id || art.article?.id || index;
  let qty = (art.quantite === "" || art.quantite === undefined) ? 0 : Number(art.quantite) || 0;

  if (newDeliveryQuantities[artId] !== undefined) {
    qty = (newDeliveryQuantities[artId] === "") ? 0 : Number(newDeliveryQuantities[artId]) || 0;
  }

  const lineRemise = Number(art.remise) || 0;
  const tvaRate = Number(art.tva ?? 0);

  // Resolve unit prices, respecting in-cell edits if provided
  let unitHT = Number(art.prixUnitaire || art.prix_unitaire) || 0;
  let unitTTC = Number(art.prixTTC || art.prix_ttc) || 0;

  if (editingHT[artId] !== undefined) {
    unitHT = Number(String(editingHT[artId]).replace(",", ".")) || 0;
    unitTTC = unitHT * (1 + tvaRate / 100);
  } else if (editingTTC[artId] !== undefined) {
    unitTTC = Number(String(editingTTC[artId]).replace(",", ".")) || 0;
    unitHT = unitTTC / (1 + tvaRate / 100);
  } else if (unitTTC === 0) {
    // Fallback if TTC isn't stored
    unitTTC = Number(art.article?.puv_ttc) || (unitHT * (1 + tvaRate / 100));
  }

  // Line amounts (Full precision)
  const lineGrossHT = qty * unitHT;
  const lineNetHT = lineGrossHT * (1 - lineRemise / 100);
  const lineTTC = isExonerated ? lineNetHT : qty * unitTTC;
  const lineTVA = isExonerated ? 0 : lineTTC - lineNetHT;

  return {
    unitHT,
    unitTTC,
    grossHT: lineGrossHT,
    netHT: lineNetHT,
    taxAmount: lineTVA,
    ttc: lineTTC
  };
};

/**
 * calculateDocumentTotals
 * 
 * Central calculation function for Order, Delivery, Invoice, and Counter Sale.
 * It strictly adheres to raw floating point math to prevent 0.001 - 0.003 rounding drift.
 */
export const calculateDocumentTotals = (
  doc: any,
  options: {
    isCreatingFacture?: boolean;
    lockedPercentage?: number | null;
    editingHT?: { [key: number]: string | number };
    editingTTC?: { [key: number]: string | number };
    newDeliveryQuantities?: { [key: number]: number | "" };
  } = {}
): DocTotals => {
  const {
    isCreatingFacture = false,
    lockedPercentage = null,
    editingHT = {},
    editingTTC = {},
    newDeliveryQuantities = {},
  } = options;

  if (!doc || !doc.articles || doc.articles.length === 0) {
    return {
      sousTotalHT: 0, netHT: 0, totalTax: 0, grandTotal: 0,
      finalTotal: 0, discountAmount: 0, discountPercentage: 0,
      retentionMontant: 0, timbre: 0, timbreFiscal: false, netAPayer: 0,
      tvaBreakdown: {}
    };
  }

  const articles = doc.articles;
  const isExonerated = doc.exoneration === "OUI" || doc.exoneration === true;
  const globalRemise = Number(doc.remise) || 0;
  const remiseType = doc.remiseType || "percentage";
  const hasTimbre = !!doc.timbreFiscal;

  // STEP 1: Accumulate line-by-line (Full precision)
  let sousTotalHTAcc = 0;
  let netHTBeforeAcc = 0;
  let totalTVAAcc = 0;
  let grandTTCAcc = 0;

  articles.forEach((art: any, index: number) => {
    // Do NOT pass isExonerated here — accumulate raw TVA so STEP 2 fixed-remise
    // back-calculation always has the correct avgTvaRate available.
    const line = calculateLineTotals(art, index, options);

    sousTotalHTAcc += line.grossHT;
    netHTBeforeAcc += line.netHT;
    totalTVAAcc += line.taxAmount;
    grandTTCAcc += line.ttc;
  });

  // PRE-CALCULATE TVA BREAKDOWN (Full precision)
  const tvaBreakdownAcc: { [key: number]: { base: number; montant: number } } = {};
  articles.forEach((art: any, index: number) => {
    // Same: raw TVA breakdown (exoneration only affects STEP 3, not per-line accumulation)
    const line = calculateLineTotals(art, index, options);
    const tvaRate = Number(art.tva ?? 0);

    if (tvaRate > 0) {
      if (!tvaBreakdownAcc[tvaRate]) tvaBreakdownAcc[tvaRate] = { base: 0, montant: 0 };
      tvaBreakdownAcc[tvaRate].base += line.netHT;
      tvaBreakdownAcc[tvaRate].montant += line.taxAmount;
    }
  });

  // STEP 2: Apply global remise
  let netHTAfter = netHTBeforeAcc;
  let totalTVAAfter = totalTVAAcc;
  let finalTTC = grandTTCAcc;
  let discAmount = 0;
  let discPerc = 0;

  const effectiveLockedPerc = (lockedPercentage !== null) ? lockedPercentage : (doc.lockedPercentage ?? doc.locked_percentage ?? null);

  if (globalRemise > 0 || (effectiveLockedPerc !== null && effectiveLockedPerc > 0)) {
    if (remiseType === "percentage" || effectiveLockedPerc !== null) {
      // Percentage mode OR locked proportional mode
      discPerc = (effectiveLockedPerc !== null) ? effectiveLockedPerc : globalRemise;
      netHTAfter = netHTBeforeAcc * (1 - discPerc / 100);
      totalTVAAfter = netHTBeforeAcc > 0 ? totalTVAAcc * (netHTAfter / netHTBeforeAcc) : 0;
      finalTTC = netHTAfter + totalTVAAfter;
      discAmount = netHTBeforeAcc - netHTAfter;
    } else {
      // Fixed amount — globalRemise IS the exact target TTC.
      // Reverse-derive the HT discount that produces this TTC.
      // avgTvaRate = totalTVA / netHT, so TTC = netHT * (1 + avgTvaRate)
      // => newNetHT = targetTTC / (1 + avgTvaRate)
      finalTTC = globalRemise;
      const avgTvaRate = netHTBeforeAcc > 0 ? totalTVAAcc / netHTBeforeAcc : 0;
      netHTAfter = (1 + avgTvaRate) > 0 ? finalTTC / (1 + avgTvaRate) : finalTTC;
      totalTVAAfter = finalTTC - netHTAfter;
      discAmount = netHTBeforeAcc - netHTAfter;
      // This is the HT-based percentage — same base as percentage mode
      discPerc = netHTBeforeAcc > 0 ? (discAmount / netHTBeforeAcc) * 100 : 0;
    }

    // Apply global discount to TVA breakdown proportionally
    const discountRatio = netHTBeforeAcc > 0 ? netHTAfter / netHTBeforeAcc : 1;
    Object.keys(tvaBreakdownAcc).forEach(rate => {
      const r = parseFloat(rate);
      tvaBreakdownAcc[r].base *= discountRatio;
      tvaBreakdownAcc[r].montant *= discountRatio;
    });
  }

  // STEP 3: Handle Exoneration
  if (isExonerated) {
    totalTVAAfter = 0;
    finalTTC = netHTAfter;
  }

  // STEP 4: Retention (WITHHOLDING TAX)
  let retentionVal = 0;
  const pmSource = doc.paymentMethods || doc.methodesReglement || [];
  if (pmSource && Array.isArray(pmSource)) {
    const pm = pmSource.find((m: any) => m.method === "retenue");
    if (pm) {
      retentionVal = (finalTTC * (Number(pm.tauxRetention) || 1)) / 100;
    }
  }

  // STEP 5: Timbre Fiscal
  let timbreVal = 0;
  if (hasTimbre && finalTTC > 0) {
    timbreVal = 1.0;
  }

  // STEP 6: Net à Payer
  const netAPayer = finalTTC + timbreVal - retentionVal;

  return {
    sousTotalHT: sousTotalHTAcc,
    netHT: netHTAfter,
    totalTax: totalTVAAfter,
    grandTotal: grandTTCAcc,
    finalTotal: finalTTC,
    discountAmount: discAmount,
    discountPercentage: discPerc,
    retentionMontant: retentionVal,
    timbre: timbreVal,
    timbreFiscal: hasTimbre,
    netAPayer: Math.max(0, netAPayer),
    tvaBreakdown: tvaBreakdownAcc
  };
};
