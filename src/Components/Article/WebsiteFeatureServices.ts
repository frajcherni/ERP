const API_BASE = process.env.REACT_APP_API_BASE;

/**
 * The reassurance strip on the shop's home page — the row reading
 * "Produits de qualité · Large choix · Styles pour tous · …".
 *
 * `icon` is a key from FEATURE_ICONS below rather than markup, so the shop
 * owner picks a glyph from a list and the website draws it in its own style.
 */
export interface WebsiteFeature {
  id: number;
  icon: string;
  title: string;
  description: string | null;
  order: number;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface WebsiteFeaturePayload {
  icon: string;
  title: string;
  description?: string;
  order?: number;
  active?: boolean;
}

/**
 * Must stay in step with ICONS in the website's FeatureStrip.tsx and with
 * the whitelist in the backend's WebsiteFeatureController — an unknown key
 * is stored as "shield". `ri` is the Remix icon used for the ERP preview.
 */
export const FEATURE_ICONS: { value: string; label: string; ri: string }[] = [
  { value: "award", label: "Récompense / Qualité", ri: "ri-award-line" },
  { value: "shield", label: "Bouclier / Garantie", ri: "ri-shield-check-line" },
  { value: "grid", label: "Grille / Large choix", ri: "ri-layout-grid-line" },
  { value: "sparkles", label: "Étincelles / Style", ri: "ri-sparkling-line" },
  { value: "headset", label: "Casque / Conseils", ri: "ri-customer-service-2-line" },
  { value: "truck", label: "Camion / Livraison", ri: "ri-truck-line" },
  { value: "leaf", label: "Feuille / Écologique", ri: "ri-leaf-line" },
  { value: "clock", label: "Horloge / Rapidité", ri: "ri-time-line" },
  { value: "credit-card", label: "Carte / Paiement", ri: "ri-bank-card-line" },
  { value: "gift", label: "Cadeau / Offre", ri: "ri-gift-line" },
  { value: "wrench", label: "Clé / Installation", ri: "ri-tools-line" },
  { value: "heart", label: "Cœur / Satisfaction", ri: "ri-heart-line" },
  { value: "star", label: "Étoile / Avis", ri: "ri-star-line" },
  { value: "package", label: "Colis / Emballage", ri: "ri-box-3-line" },
];

export const featureIconClass = (icon: string): string =>
  FEATURE_ICONS.find((i) => i.value === icon)?.ri || "ri-shield-check-line";

export const fetchWebsiteFeatures = async (): Promise<WebsiteFeature[]> => {
  const response = await fetch(`${API_BASE}/website-features`);
  if (!response.ok) throw new Error("Failed to fetch website features");
  return response.json();
};

export const createWebsiteFeature = async (
  payload: WebsiteFeaturePayload,
): Promise<WebsiteFeature> => {
  const response = await fetch(`${API_BASE}/website-features`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || "Failed to create feature");
  }
  return response.json();
};

export const updateWebsiteFeature = async (
  id: number,
  payload: WebsiteFeaturePayload,
): Promise<WebsiteFeature> => {
  const response = await fetch(`${API_BASE}/website-features/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || "Failed to update feature");
  }
  return response.json();
};

export const deleteWebsiteFeature = async (id: number): Promise<void> => {
  const response = await fetch(`${API_BASE}/website-features/${id}`, { method: "DELETE" });
  if (!response.ok) throw new Error("Failed to delete feature");
};
