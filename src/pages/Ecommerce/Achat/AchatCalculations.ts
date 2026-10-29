import { calculateDocumentTotals, DocTotals } from "../../../Utils/CalculationEngine";
import { Article } from "../../../Components/Article/Interfaces";

/**
 * A saved achat line (BonCommandeArticle / BonReceptionArticle) in the shape the
 * ventes calculation engine expects. The article goes in `articleDetails`, not
 * `article`: on a 0-price line the engine would otherwise fall back to the
 * article's sale price (article.puv_ttc), wrong for a purchase.
 */
export const toAchatCalcLine = (item: any) => {
  const prixUnitaire = Number(item.prixUnitaire) || 0;
  const tva = item.tva != null ? Number(item.tva) : null;
  return {
    article_id: item.article?.id ?? item.article_id,
    quantite: Number(item.quantite) || 0,
    prixUnitaire,
    prixTTC: Number(item.prix_ttc) || prixUnitaire * (1 + (tva || 0) / 100),
    tva,
    remise: item.remise != null ? Number(item.remise) : null,
    designation: item.designation,
    articleDetails: item.article ?? item.articleDetails,
  };
};

/** A saved line → a row of the articles table of the bon form. */
export const toSelectedArticle = (item: any) => {
  const line = toAchatCalcLine(item);
  return {
    article_id: line.article_id as number,
    quantite: line.quantite as number | "",
    prixUnitaire: line.prixUnitaire,
    prixTTC: line.prixTTC,
    tva: line.tva,
    remise: line.remise,
    articleDetails: line.articleDetails as Article | undefined,
    designation: (item.designation || item.article?.designation || "") as string,
  };
};

/** Totals of a saved bon de commande / réception, exactly as the ventes pages compute them. */
export const calculateAchatTotals = (bon: {
  articles?: any[];
  remise?: number | string | null;
  remiseType?: string | null;
}): DocTotals =>
  calculateDocumentTotals({
    articles: (bon.articles || []).map(toAchatCalcLine),
    remise: Number(bon.remise) || 0,
    remiseType: bon.remiseType || "percentage",
  });
