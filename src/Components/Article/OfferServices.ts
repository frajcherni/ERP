import { Article } from "./Interfaces";

export { getImageUrl } from "../../helpers/url_helper";

const API_BASE = process.env.REACT_APP_API_BASE;

export interface Offer {
  id: number;
  title: string;
  description?: string | null;
  status: "actif" | "inactive";
  date_start?: string | null;
  date_end?: string | null;
  order: number;
  product?: Article | null;
  product_id?: number | null;

  /* ── DISCOUNT ────────────────────────────────────────────────
     Fill in EITHER the percentage OR the discounted price; the API
     derives the other half and returns both, so the shop owner never
     has to do the arithmetic. */
  discount_percent?: number | null;
  promo_price?: number | null;
  /** Read-only, computed by the API: catalogue price before discount. */
  old_price?: number | null;
  /** Read-only, computed by the API: what the client actually pays. */
  final_price?: number | null;

  created_at?: string;
  updated_at?: string;
}

export interface OfferPayload {
  title: string;
  description?: string;
  status: "actif" | "inactive";
  date_start?: string | null;
  date_end?: string | null;
  order?: number;
  product_id: number;
  discount_percent?: number | null;
  promo_price?: number | null;
}

export const fetchOffers = async (): Promise<Offer[]> => {
  const response = await fetch(`${API_BASE}/offers`);
  if (!response.ok) throw new Error("Failed to fetch promos");
  return response.json();
};

export const createOffer = async (payload: OfferPayload): Promise<Offer> => {
  const response = await fetch(`${API_BASE}/offers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || "Failed to create offer");
  }
  return response.json();
};

export const updateOffer = async (id: number, payload: OfferPayload): Promise<Offer> => {
  const response = await fetch(`${API_BASE}/offers/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || "Failed to update offer");
  }
  return response.json();
};

export const deleteOffer = async (id: number): Promise<void> => {
  const response = await fetch(`${API_BASE}/offers/${id}`, { method: "DELETE" });
  if (!response.ok) throw new Error("Failed to delete offer");
};
