const API_BASE = process.env.REACT_APP_API_BASE;

/** CSS-drawn glyph shown before the message on the storefront. */
export type AnnouncementMarker =
  | "sparkle" | "diamond" | "dot" | "ring" | "square" | "bar" | "plus" | "slash";

export type AnnouncementAccent = "gold" | "blue" | "white";

export interface Announcement {
  id: number;
  text: string;
  marker: AnnouncementMarker;
  accent: AnnouncementAccent;
  order: number;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

export type AnnouncementPayload = Omit<
  Announcement,
  "id" | "created_at" | "updated_at"
>;

/** Labels + a preview glyph for the picker in the admin form. */
export const MARKER_OPTIONS: { value: AnnouncementMarker; label: string; glyph: string }[] = [
  { value: "sparkle", label: "Étincelle",       glyph: "✦" },
  { value: "diamond", label: "Losange",         glyph: "◆" },
  { value: "dot",     label: "Point",           glyph: "●" },
  { value: "ring",    label: "Cercle",          glyph: "○" },
  { value: "square",  label: "Carré",           glyph: "▫" },
  { value: "bar",     label: "Tiret",           glyph: "—" },
  { value: "plus",    label: "Croix",           glyph: "✚" },
  { value: "slash",   label: "Barre oblique",   glyph: "/" },
];

export const ACCENT_OPTIONS: { value: AnnouncementAccent; label: string; hex: string }[] = [
  { value: "gold",  label: "Or",    hex: "#E8DC00" },
  { value: "blue",  label: "Bleu",  hex: "#00adee" },
  { value: "white", label: "Blanc", hex: "#c9c9c9" },
];

const asJson = async (response: Response) => {
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || "Opération échouée");
  }
  return response.json();
};

export const fetchAnnouncements = async (): Promise<Announcement[]> =>
  asJson(await fetch(`${API_BASE}/announcements`));

export const createAnnouncement = async (
  payload: AnnouncementPayload
): Promise<Announcement> =>
  asJson(
    await fetch(`${API_BASE}/announcements`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
  );

export const updateAnnouncement = async (
  id: number,
  payload: Partial<AnnouncementPayload>
): Promise<Announcement> =>
  asJson(
    await fetch(`${API_BASE}/announcements/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
  );

export const deleteAnnouncement = async (id: number): Promise<void> => {
  const response = await fetch(`${API_BASE}/announcements/${id}`, { method: "DELETE" });
  if (!response.ok) throw new Error("Échec de la suppression");
};

/** Bulk order update — one request for the whole list. */
export const reorderAnnouncements = async (
  items: { id: number; order: number }[]
): Promise<Announcement[]> =>
  asJson(
    await fetch(`${API_BASE}/announcements/reorder`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    })
  );

/** Inserts the starter set — the backend refuses if the table is not empty. */
export const seedDefaultAnnouncements = async (): Promise<Announcement[]> =>
  asJson(await fetch(`${API_BASE}/announcements/seed-defaults`, { method: "POST" }));
