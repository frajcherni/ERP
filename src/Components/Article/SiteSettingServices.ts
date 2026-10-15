import { getImageUrl } from "../../helpers/url_helper";
export { getImageUrl };
const API_BASE = process.env.REACT_APP_API_BASE;

export interface SiteSetting {
  id: number;
  /** Relative path of the uploaded logo, or null when the wordmark is used. */
  logo: string | null;
  brand_name: string;
  show_name: boolean;
  logo_height: number;
  /** Home page promo band, shown between the testimonials and the footer. */
  promo_title: string;
  promo_description: string;
  /** Relative path of the uploaded background image, or null for the built-in default. */
  promo_image: string | null;

  /* ── HOME PAGE SECTION HEADINGS ─────────────────────────────
     Every band title/intro on the shop's home page. The API fills
     these with its built-in copy when the column is still empty. */
  novelties_title: string;
  novelties_description: string;
  novelties_link_label: string;
  categories_title: string;
  categories_description: string;
  deals_title: string;
  deals_description: string;
  deals_btn_label: string;

  /* ── SHOWROOM BAND ──────────────────────────────────────────
     Full-width invitation shown just above the shop's footer. */
  showroom_active: boolean;
  showroom_title: string;
  showroom_description: string;
  showroom_btn_label: string;
  showroom_btn_link: string;
  /** Relative path of the uploaded photo, or null for the built-in default. */
  showroom_image: string | null;

  /** Footer "About us" block. */
  footer_about_title: string;
  footer_about_text: string;
  /** Categories listed in the shop's footer menu, in display order. May hold
   *  sub-category ids as well as root ones. Empty = the shop falls back to
   *  its first root categories. */
  footer_category_ids: number[];
  /** Social links shown in the footer. Icon is hidden on the site when its URL is empty. */
  facebook_url: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;
  contact_address: string;
  contact_phone: string;
  contact_email: string;
  working_hours_week: string;
  working_hours_friday: string;
  created_at?: string;
  updated_at?: string;
}

export const fetchSiteSetting = async (): Promise<SiteSetting> => {
  const response = await fetch(`${API_BASE}/site-settings`);
  if (!response.ok) throw new Error("Failed to fetch site settings");
  return response.json();
};

export const updateSiteSetting = async (formData: FormData): Promise<SiteSetting> => {
  const response = await fetch(`${API_BASE}/site-settings`, {
    method: "PUT",
    body: formData,
  });
  if (!response.ok) throw new Error("Failed to update site settings");
  return response.json();
};

export const removeSiteLogo = async (): Promise<SiteSetting> => {
  const response = await fetch(`${API_BASE}/site-settings/logo`, { method: "DELETE" });
  if (!response.ok) throw new Error("Failed to remove logo");
  return response.json();
};

export const removePromoImage = async (): Promise<SiteSetting> => {
  const response = await fetch(`${API_BASE}/site-settings/promo-image`, { method: "DELETE" });
  if (!response.ok) throw new Error("Failed to remove promo image");
  return response.json();
};

export const removeShowroomImage = async (): Promise<SiteSetting> => {
  const response = await fetch(`${API_BASE}/site-settings/showroom-image`, { method: "DELETE" });
  if (!response.ok) throw new Error("Failed to remove showroom image");
  return response.json();
};
