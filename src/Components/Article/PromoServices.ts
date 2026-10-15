import { Article } from "./Interfaces";

export { getImageUrl } from "../../helpers/url_helper";

const API_BASE = process.env.REACT_APP_API_BASE;

/**
 * A promotion campaign and the articles it discounts — the source of the
 * "bonnes affaires du moment" band on the shop's home page.
 *
 * Not to be confused with an Offer (see OfferServices), which is the single
 * product banner with a countdown near the top of the same page.
 */
export interface PromoItem {
  id?: number;
  article?: Article | null;
  article_id?: number;
  /** Fill in EITHER this OR promo_price; the API derives the other half. */
  discount_percent?: number | null;
  promo_price?: number | null;
  order?: number;
  /** Read-only, computed by the API: catalogue price before the discount. */
  old_price?: number | null;
  /** Read-only, computed by the API: what the client actually pays. */
  final_price?: number | null;
}

export interface Promo {
  id: number;
  /** Internal label, e.g. "Soldes d'été" — never shown on the website. */
  title: string;
  status: "actif" | "inactive";
  date_start?: string | null;
  date_end?: string | null;
  order: number;
  items: PromoItem[];
  created_at?: string;
  updated_at?: string;
}

export interface PromoPayload {
  title: string;
  status: "actif" | "inactive";
  date_start?: string | null;
  date_end?: string | null;
  order?: number;
  items: Array<{
    article_id: number;
    discount_percent?: number | null;
    promo_price?: number | null;
    order?: number;
  }>;
}

export const fetchPromos = async (): Promise<Promo[]> => {
  const response = await fetch(`${API_BASE}/promos`);
  if (!response.ok) throw new Error("Failed to fetch promos");
  return response.json();
};

export const createPromo = async (payload: PromoPayload): Promise<Promo> => {
  const response = await fetch(`${API_BASE}/promos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || "Failed to create promo");
  }
  return response.json();
};

export const updatePromo = async (id: number, payload: PromoPayload): Promise<Promo> => {
  const response = await fetch(`${API_BASE}/promos/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || "Failed to update promo");
  }
  return response.json();
};

export const deletePromo = async (id: number): Promise<void> => {
  const response = await fetch(`${API_BASE}/promos/${id}`, { method: "DELETE" });
  if (!response.ok) throw new Error("Failed to delete promo");
};
