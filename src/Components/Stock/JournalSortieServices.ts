const API_BASE = process.env.REACT_APP_API_BASE;

export interface JournalSortieRow {
  id: number;
  article_id: number;
  depot_id: number | null;
  quantite: number;
  date_sortie: string;
  type_document: string;
  document_id: number | null;
  numero_document: string | null;
  commentaire: string | null;
  article?: {
    id: number;
    reference?: string;
    designation?: string;
    nom?: string;
  };
  depot?: {
    id: number;
    nom?: string;
  };
}

export interface JournalSortieParams {
  startDate?: string;
  endDate?: string;
  articleId?: number;
  depotId?: number;
  typeDocument?: string;
  page?: number;
  limit?: number;
}

export const fetchJournalSorties = async (
  params: JournalSortieParams = {}
): Promise<{
  data: JournalSortieRow[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}> => {
  const query = new URLSearchParams();
  if (params.startDate) query.append("startDate", params.startDate);
  if (params.endDate) query.append("endDate", params.endDate);
  if (params.articleId) query.append("articleId", String(params.articleId));
  if (params.depotId) query.append("depotId", String(params.depotId));
  if (params.typeDocument) query.append("typeDocument", params.typeDocument);
  if (params.page) query.append("page", String(params.page));
  if (params.limit) query.append("limit", String(params.limit));

  const response = await fetch(`${API_BASE}/journal-sortie?${query.toString()}`);
  if (!response.ok) {
    throw new Error("Échec du chargement du journal des sorties");
  }
  return response.json();
};

export const fetchJournalSortieSummaryByDate = async (params: {
  startDate?: string;
  endDate?: string;
  articleId?: number;
  depotId?: number;
  groupByArticle?: boolean;
}): Promise<{ summary: Array<Record<string, string | number>> }> => {
  const query = new URLSearchParams();
  if (params.startDate) query.append("startDate", params.startDate);
  if (params.endDate) query.append("endDate", params.endDate);
  if (params.articleId) query.append("articleId", String(params.articleId));
  if (params.depotId) query.append("depotId", String(params.depotId));
  if (params.groupByArticle) query.append("groupByArticle", "true");

  const response = await fetch(
    `${API_BASE}/journal-sortie/summary-by-date?${query.toString()}`
  );
  if (!response.ok) {
    throw new Error("Échec du chargement du résumé des sorties");
  }
  return response.json();
};

export const backfillJournalSortieHistorique = async (): Promise<{
  message: string;
  total: number;
  inserted: { source: string; count: number }[];
}> => {
  const response = await fetch(`${API_BASE}/journal-sortie/backfill-historique`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || "Échec du backfill historique");
  }
  return response.json();
};
