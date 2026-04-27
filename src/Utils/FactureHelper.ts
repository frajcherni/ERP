
export const calculateFactureTotals = (facture: any) => {
  if (!facture || !facture.articles || facture.articles.length === 0) {
    return {
      sousTotalHT: 0,
      netHT: 0,
      totalTax: 0,
      totalTTC: 0,
      netAPayer: 0,
    };
  }

  const articles = facture.articles;
  const isExonerated = facture.exoneration === "OUI" || facture.exoneration === true;
  const showRemise = Number(facture.remise) > 0;
  const globalRemise = Number(facture.remise) || 0;
  const remiseType = facture.remiseType || "fixed";
  const hasTimbre = !!facture.timbreFiscal;

  let netHTBeforeGlobalRemise = 0;
  let totalTaxValueVirtual = 0; // Use virtual tax to match user target logic
  let grandTotalValueVirtual = 0;

  // STEP 1: Calculate line-by-line totals
  articles.forEach((art: any) => {
    const qty = Number(art.quantite) || 0;
    const articleRemise = Number(art.remise) || 0;

    const unitHT = Number(art.prixUnitaire) || 0;
    const tvaRate = Number(art.tva) || 0; // Always use nominal TVA for proportion logic

    // Use stored prix_ttc when available (matches modal behavior), fallback to recalculation
    const storedTTC = Number(art.prix_ttc) || 0;
    const unitTTCVirtual = storedTTC > 0
      ? Math.round(storedTTC * 1000) / 1000
      : Math.round(unitHT * (1 + tvaRate / 100) * 1000) / 1000;

    const lineHT = Math.round(unitHT * 1000) / 1000;
    const lineTTCVirtual = Math.round(unitTTCVirtual * 1000) / 1000;

    const montantNetHTLigne = Math.round(qty * lineHT * (1 - articleRemise / 100) * 1000) / 1000;
    const montantTTCLigneVirtual = Math.round(qty * lineTTCVirtual * 1000) / 1000;
    const montantTVALigneVirtual = Math.round((montantTTCLigneVirtual - montantNetHTLigne) * 1000) / 1000;

    netHTBeforeGlobalRemise += montantNetHTLigne;
    totalTaxValueVirtual += montantTVALigneVirtual;
    grandTotalValueVirtual += montantTTCLigneVirtual;
  });

  // STEP 2: Apply global remise
  let netHTAfterGlobalRemise = netHTBeforeGlobalRemise;
  let totalTaxAfterGlobalRemise = isExonerated ? 0 : totalTaxValueVirtual;
  let finalTTCValue = isExonerated ? netHTBeforeGlobalRemise : grandTotalValueVirtual;

  if (showRemise) {
    if (remiseType === "percentage") {
      const discountAmount = Math.round((netHTBeforeGlobalRemise * (globalRemise / 100)) * 1000) / 1000;
      netHTAfterGlobalRemise = Math.round((netHTBeforeGlobalRemise - discountAmount) * 1000) / 1000;

      const tvaRatio = netHTBeforeGlobalRemise > 0 ? (totalTaxValueVirtual / netHTBeforeGlobalRemise) : 0;
      const virtualTva = Math.round((netHTAfterGlobalRemise * tvaRatio) * 1000) / 1000;

      totalTaxAfterGlobalRemise = isExonerated ? 0 : virtualTva;
      finalTTCValue = Math.round((netHTAfterGlobalRemise + (isExonerated ? 0 : virtualTva)) * 1000) / 1000;
    } else if (remiseType === "fixed") {
      // The Target is always compared against the Virtual TTC (as if TVA exists)
      const virtualTtcTarget = Math.round(globalRemise * 1000) / 1000;

      // Check if single or multiple TVA rates (same logic as modal/detail)
      const uniqueTvaRates: number[] = Array.from(
        new Set(articles.map((a: any) => Number(a.tva) || 0))
      );

      if (uniqueTvaRates.length === 1 && uniqueTvaRates[0] > 0) {
        // SINGLE TVA RATE FORMULA: Net HT = TTC / (1 + TVA rate) -- matches modal exactly
        const tvaRate = uniqueTvaRates[0] / 100;
        netHTAfterGlobalRemise = Math.round((virtualTtcTarget / (1 + tvaRate)) * 1000) / 1000;
        totalTaxAfterGlobalRemise = isExonerated ? 0 : Math.round((virtualTtcTarget - netHTAfterGlobalRemise) * 1000) / 1000;
        finalTTCValue = Math.round((netHTAfterGlobalRemise + totalTaxAfterGlobalRemise) * 1000) / 1000;
      } else {
        // MULTIPLE TVA RATES: Use discount coefficient approach
        const discountCoefficient = grandTotalValueVirtual > 0 ? (virtualTtcTarget / grandTotalValueVirtual) : 0;

        let newTotalHT = 0;
        let newTotalTVA = 0;

        articles.forEach((art: any) => {
          const qty = Number(art.quantite) || 0;
          const artRemise = Number(art.remise) || 0;
          const unitHT = Number(art.prixUnitaire) || 0;
          const tvaR = Number(art.tva) || 0;

          const lineHTAfterDiscount = qty * unitHT * (1 - artRemise / 100);
          const newLineHT = lineHTAfterDiscount * discountCoefficient;
          const newLineTVA = newLineHT * (tvaR / 100);

          newTotalHT += newLineHT;
          newTotalTVA += newLineTVA;
        });

        netHTAfterGlobalRemise = Math.round(newTotalHT * 1000) / 1000;
        totalTaxAfterGlobalRemise = isExonerated ? 0 : (Math.round(newTotalTVA * 1000) / 1000);
        finalTTCValue = Math.round((netHTAfterGlobalRemise + totalTaxAfterGlobalRemise) * 1000) / 1000;
      }
    }
  }

  // STEP 4: Timbre
  let netAPayerValue = finalTTCValue;
  if (hasTimbre) {
    netAPayerValue = Math.round((netAPayerValue + 1) * 1000) / 1000;
  }

  // STEP 5: Retention
  let retentionValue = 0;
  if (facture.paymentMethods && facture.paymentMethods.length > 0) {
    facture.paymentMethods.forEach((pm: any) => {
      if (pm.method === "retenue") {
        const rate = Number(pm.tauxRetention) || 1;
        // Retenue must be calculated on the TTC amount BEFORE timbre fiscal
        retentionValue += Math.round((finalTTCValue * rate / 100) * 1000) / 1000;
      }
    });
  }

  // Fallback for older factures that might not have it in paymentMethods but saved it in montantRetenue
  if (retentionValue === 0 && facture.montantRetenue) {
    retentionValue = Number(facture.montantRetenue) || 0;
  }

  // Final Net a Payer is after retention
  const finalNetAPayer = Math.max(0, Math.round((netAPayerValue - retentionValue) * 1000) / 1000);

  return {
    netHT: Math.round(netHTAfterGlobalRemise * 1000) / 1000,
    totalTax: Math.round(totalTaxAfterGlobalRemise * 1000) / 1000,
    totalTTC: Math.round(finalTTCValue * 1000) / 1000,
    netAPayer: finalNetAPayer,
    timbre: hasTimbre ? 1 : 0
  };
};
