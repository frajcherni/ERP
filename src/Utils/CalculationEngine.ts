
/**
 * CalculationEngine.ts — Centralized financial logic for the entire ERP.
 * 
 * DESIGN PRINCIPLES:
 * 1. THE TTC IS THE REFERENCE: what the client pays is Σ qty × P.U.TTC (or the target TTC of a
 *    fixed remise), and that is what payments and the backend are checked against.
 * 2. TVA = BASE × TAUX: the base HT of each TVA rate is taken out of its TTC. The TVA is never
 *    TTC − qty × P.U.HT: P.U.HT is stored rounded to 3 decimals (5.000 TTC at 19% → 4.202 HT),
 *    so on big quantities that difference drifts away from base × taux.
 * 3. DOCUMENT TOTALS IN WHOLE MILLIMES: they are printed, so they must add up exactly as printed
 *    (bases → Net HT, TVA rows → Total TVA, Net HT + TVA → TTC). Line amounts stay full precision.
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

type AmountsByRate = { [rate: number]: number };

/** Amount in DT → whole millimes. */
const toMillimes = (amount: number) => Math.round(amount * 1000);

const ratesOf = (byRate: { [rate: number]: unknown }) => Object.keys(byRate).map(Number);

/**
 * Shares `total` millimes between the TVA rates in proportion to `weights`, the shares
 * adding up to `total` exactly (largest remainder).
 */
const shareMillimes = (total: number, weights: AmountsByRate): AmountsByRate => {
  const rates = ratesOf(weights);
  const weightSum = rates.reduce((sum, r) => sum + weights[r], 0);
  const shares: AmountsByRate = {};
  if (rates.length === 0) return shares;

  const remainders = rates.map((r) => {
    // All prices at 0 leave nothing to be proportional to: the first rate takes it all
    const exact = weightSum !== 0 ? (total * weights[r]) / weightSum : (r === rates[0] ? total : 0);
    shares[r] = Math.floor(exact);
    return { rate: r, rest: exact - shares[r] };
  });
  remainders.sort((a, b) => b.rest - a.rest);
  let missing = total - rates.reduce((sum, r) => sum + shares[r], 0);
  for (let i = 0; missing > 0; i++, missing--) {
    shares[remainders[i % remainders.length].rate] += 1;
  }
  return shares;
};

/**
 * Splits `ttc` millimes taxed at `rate` % into a base HT and a TVA, both in whole millimes,
 * with TVA = base × rate rounded and base + TVA = ttc. A few TTC amounts have no such split
 * (1.193 DT at 19%: 1.002 + 0.190 = 1.192 but 1.003 + 0.191 = 1.194): the TVA then takes the
 * leftover millime and `exact` is false.
 */
const splitTTC = (ttc: number, rate: number) => {
  const idealBase = ttc / (1 + rate / 100);
  for (const base of [Math.floor(idealBase), Math.ceil(idealBase)]) {
    const tva = Math.round((base * rate) / 100);
    if (base + tva === ttc) return { base, tva, exact: true };
  }
  const base = Math.round(idealBase);
  return { base, tva: ttc - base, exact: false };
};

/**
 * Splits a document TTC (millimes) into base HT + TVA per rate, each rate getting its share of
 * the TTC in proportion to `weights`. A share without an exact split takes or gives one
 * millime to another rate whose share still splits exactly: the TTC of each rate is not
 * printed, only its base and TVA, which then both add up.
 */
const splitDocumentTTC = (ttc: number, weights: AmountsByRate) => {
  const shares = shareMillimes(ttc, weights);
  const rates = ratesOf(shares);

  rates.forEach((rate) => {
    if (splitTTC(shares[rate], rate).exact) return;
    for (const other of rates) {
      const moved = [1, -1].find((d) =>
        other !== rate &&
        shares[other] > 0 &&
        shares[other] - d > 0 &&
        splitTTC(shares[rate] + d, rate).exact &&
        splitTTC(shares[other] - d, other).exact
      );
      if (moved !== undefined) {
        shares[rate] += moved;
        shares[other] -= moved;
        return;
      }
    }
  });

  const split: { [rate: number]: { base: number; tva: number } } = {};
  rates.forEach((rate) => {
    const { base, tva } = splitTTC(shares[rate], rate);
    split[rate] = { base, tva };
  });
  return split;
};

/**
 * calculateDocumentTotals
 * 
 * Central calculation function for Order, Delivery, Invoice, and Counter Sale.
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

  // STEP 1: Accumulate line-by-line, per TVA rate (Full precision)
  let sousTotalHTAcc = 0;
  let netHTBeforeAcc = 0;
  let grandTTCAcc = 0;
  const ttcByRate: AmountsByRate = {};
  const netHTByRate: AmountsByRate = {};

  articles.forEach((art: any, index: number) => {
    // Do NOT pass isExonerated here — the real TTC is needed to turn a fixed remise
    // (a target TTC) into its ratio, exonerated or not.
    const line = calculateLineTotals(art, index, options);
    const tvaRate = Number(art.tva ?? 0);

    sousTotalHTAcc += line.grossHT;
    netHTBeforeAcc += line.netHT;
    grandTTCAcc += line.ttc;
    ttcByRate[tvaRate] = (ttcByRate[tvaRate] || 0) + line.ttc;
    netHTByRate[tvaRate] = (netHTByRate[tvaRate] || 0) + line.netHT;
  });

  // STEP 2: Global remise — the ratio it applies to every amount of the document
  let remiseRatio = 1;
  let finalTTC = grandTTCAcc;
  let discPerc = 0;

  const effectiveLockedPerc = (lockedPercentage !== null) ? lockedPercentage : (doc.lockedPercentage ?? doc.locked_percentage ?? null);

  if (globalRemise > 0 || (effectiveLockedPerc !== null && effectiveLockedPerc > 0)) {
    if (remiseType === "percentage" || effectiveLockedPerc !== null) {
      // Percentage mode OR locked proportional mode
      discPerc = (effectiveLockedPerc !== null) ? effectiveLockedPerc : globalRemise;
      remiseRatio = 1 - discPerc / 100;
      finalTTC = grandTTCAcc * remiseRatio;
    } else {
      // Fixed amount — globalRemise IS the exact target TTC
      finalTTC = globalRemise;
      remiseRatio = grandTTCAcc > 0 ? finalTTC / grandTTCAcc : 1;
      // This is the HT-based percentage — same base as percentage mode
      discPerc = grandTTCAcc > 0 ? (1 - remiseRatio) * 100 : 0;
    }
  }

  // STEP 3: Split into HT + TVA per rate (whole millimes)
  const tvaBreakdownAcc: { [key: number]: { base: number; montant: number } } = {};
  let sousTotalHTMil: number;
  let netHTMil = 0;
  let totalTVAMil = 0;
  let finalTTCMil: number;

  if (isExonerated) {
    // No TVA is charged: the client pays the HT, which stays qty × P.U.HT. The table still
    // shows the TVA each base would have carried.
    finalTTCMil = netHTMil = toMillimes(netHTBeforeAcc * remiseRatio);
    sousTotalHTMil = toMillimes(sousTotalHTAcc);
    const bases = shareMillimes(netHTMil, netHTByRate);
    ratesOf(bases).forEach((rate) => {
      if (rate > 0) {
        tvaBreakdownAcc[rate] = { base: bases[rate] / 1000, montant: Math.round((bases[rate] * rate) / 100) / 1000 };
      }
    });
  } else {
    finalTTCMil = toMillimes(finalTTC);
    // With a remise, Total HT stays Σ qty × P.U.HT — what an accountant recomputes from the
    // printed lines — and the TTC is shared between the rates like that HT is: the remise
    // amount, which nothing printed lets anyone recompute, absorbs the rounding of P.U.HT.
    // Without a remise there is nothing to absorb it: Total HT = Net HT, out of the TTC.
    const hasRemise = finalTTCMil !== toMillimes(grandTTCAcc);
    const weights: AmountsByRate = {};
    ratesOf(ttcByRate).forEach((rate) => {
      weights[rate] = toMillimes(hasRemise ? netHTByRate[rate] * (1 + rate / 100) : ttcByRate[rate]);
    });

    const split = splitDocumentTTC(finalTTCMil, weights);
    ratesOf(split).forEach((rate) => {
      netHTMil += split[rate].base;
      totalTVAMil += split[rate].tva;
      if (rate > 0) {
        tvaBreakdownAcc[rate] = { base: split[rate].base / 1000, montant: split[rate].tva / 1000 };
      }
    });
    sousTotalHTMil = hasRemise ? toMillimes(sousTotalHTAcc) : netHTMil;
  }

  // STEP 4: Retention (WITHHOLDING TAX) — informational only, it is NOT deducted
  // from the net à payer. Callers computing what is left to collect subtract it themselves.
  let retentionVal = 0;
  const pmSource = doc.paymentMethods || doc.methodesReglement || [];
  if (pmSource && Array.isArray(pmSource)) {
    const pm = pmSource.find((m: any) => m.method === "retenue");
    if (pm) {
      retentionVal = (finalTTCMil / 1000 * (Number(pm.tauxRetention) || 1)) / 100;
    }
  }

  // STEP 5: Timbre Fiscal
  let timbreVal = 0;
  if (hasTimbre && finalTTCMil > 0) {
    timbreVal = 1.0;
  }

  // STEP 6: Net à Payer (retenue à la source is not subtracted)
  const netAPayer = (finalTTCMil + timbreVal * 1000) / 1000;

  return {
    sousTotalHT: sousTotalHTMil / 1000,
    netHT: netHTMil / 1000,
    totalTax: totalTVAMil / 1000,
    grandTotal: grandTTCAcc,
    finalTotal: finalTTCMil / 1000,
    discountAmount: (sousTotalHTMil - netHTMil) / 1000,
    discountPercentage: discPerc,
    retentionMontant: retentionVal,
    timbre: timbreVal,
    timbreFiscal: hasTimbre,
    netAPayer: Math.max(0, netAPayer),
    tvaBreakdown: tvaBreakdownAcc
  };
};
