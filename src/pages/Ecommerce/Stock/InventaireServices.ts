// InventaireServices.ts
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_BASE;

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface Article {
    id: number;
    reference: string;
    designation: string;
    code_barre?: string | null;
    pua_ht: string;
    pua_ttc: string;
    tva: number;
    qte?: number;
    [key: string]: any;
}

export interface InventaireItem {
    id?: number;
    inventaire_id?: number;
    article_id: number;
    ligne_numero?: number;
    qte_avant?: number;
    qte_reel: number;
    qte_ajustement?: number;
    pua_ht?: number;
    pua_ttc?: number;
    tva?: number;
    total_ht?: number;
    total_ttc?: number;
    total_tva?: number;
    article?: Article;
}

export interface Inventaire {
    id: number;
    numero: string;
    date: string;
    date_inventaire: string;
    description?: string;
    depot: string;
    status: "En cours" | "Terminé" | "Annulé";
    total_ht: number;
    total_ttc: number;
    total_tva: number;
    article_count: number;
    items?: InventaireItem[];
    created_at: string;
    updated_at: string;
}

export interface CreateInventairePayload {
    numero: string;
    date: string;
    date_inventaire: string;
    depot: string;
    description?: string;
    articles: {
        article_id: number;
        qte_reel: number;
        ligne_numero: number;
    }[];
}

// ─── API calls ────────────────────────────────────────────────────────────────

/** GET /api/inventaire/getAllInventaires */
export const fetchInventaires = async (): Promise<Inventaire[]> => {
    try {
        const response = await axios.get(`${API_BASE}/inventaire/getAllInventaires`);
        return response.data?.data ?? response.data;
    } catch (error: any) {
        throw error.response?.data?.message || error.message || "Network error";
    }
};

/** GET /api/inventaire/getNextInventaireNumberEnhanced */
export const fetchNextInventaireNumber = async (): Promise<string> => {
    try {
        const response = await axios.get(
            `${API_BASE}/inventaire/getNextInventaireNumberEnhanced`
        );
        return response.data?.data ?? response.data;
    } catch (error: any) {
        throw error.response?.data?.message || error.message || "Network error";
    }
};

/** POST /api/inventaire/createInventaire */
export const createInventaire = async (
    payload: CreateInventairePayload
): Promise<Inventaire> => {
    try {
        const response = await axios.post(
            `${API_BASE}/inventaire/createInventaire`,
            payload
        );
        return response.data?.data ?? response.data;
    } catch (error: any) {
        throw error.response?.data?.message || error.message || "Network error";
    }
};

/** PUT /api/inventaire/update/:id */
export const updateInventaire = async (
    id: number,
    payload: Partial<CreateInventairePayload>
): Promise<Inventaire> => {
    try {
        const response = await axios.put(
            `${API_BASE}/inventaire/update/${id}`,
            payload
        );
        return response.data?.data ?? response.data;
    } catch (error: any) {
        throw error.response?.data?.message || error.message || "Network error";
    }
};

/** DELETE /api/inventaire/deleteInventaire/:id */
export const deleteInventaire = async (id: number): Promise<void> => {
    try {
        await axios.delete(`${API_BASE}/inventaire/deleteInventaire/${id}`);
    } catch (error: any) {
        throw error.response?.data?.message || error.message || "Network error";
    }
};

/** GET /api/articles - reuse existing articles endpoint */
export const fetchAllArticles = async (): Promise<Article[]> => {
    try {
        const response = await axios.get(`${API_BASE}/articles/getarticle`);
        // backend returns array directly or { data: [...] }
        const raw = response.data?.data ?? response.data;
        return Array.isArray(raw) ? raw : [];
    } catch (error: any) {
        throw error.response?.data?.message || error.message || "Network error";
    }
};

/** GET /api/depots/fetchDepots */
export const fetchDepots = async (): Promise<{ id: number; nom: string }[]> => {
    try {
        const response = await axios.get(`${API_BASE}/depots/fetchDepots`);
        const raw = response.data?.data ?? response.data;
        return Array.isArray(raw) ? raw : [];
    } catch (error: any) {
        throw error.response?.data?.message || error.message || "Network error";
    }
};
