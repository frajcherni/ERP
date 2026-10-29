import { BonReception } from "../Article/Interfaces";

const API_BASE = process.env.REACT_APP_API_BASE;

// Show the backend's reason (e.g. duplicate numero) instead of a generic message
const getServerErrorMessage = (errorText: string, fallback: string): string => {
    try {
        const data = JSON.parse(errorText);
        if (data?.message && data?.error) return `${data.message} : ${data.error}`;
        return data?.message || fallback;
    } catch {
        return fallback;
    }
};

// GET all bons de r�ception
export const fetchBonsReception = async (): Promise<BonReception[]> => {
    const response = await fetch(`${API_BASE}/bons-receptions/getbonreception`);
    if (!response.ok) {
        throw new Error("�chec du chargement des bons de r�ception");
    }
    return response.json();
};

// GET - one page of bons de réception, filtered on the server (same API shape as the ventes lists)
export const fetchBonsReceptionPaginated = async (params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
}): Promise<{
    bons: BonReception[];
    pagination: { totalCount: number; page: number; limit: number; totalPages: number };
}> => {
    const queryParams = new URLSearchParams();
    if (params.page != null) queryParams.append("page", params.page.toString());
    if (params.limit != null) queryParams.append("limit", params.limit.toString());
    if (params.search) queryParams.append("search", params.search);
    if (params.status) queryParams.append("status", params.status);
    if (params.startDate) queryParams.append("startDate", params.startDate);
    if (params.endDate) queryParams.append("endDate", params.endDate);

    const response = await fetch(`${API_BASE}/bons-receptions/paginated?${queryParams.toString()}`);
    if (!response.ok) {
        throw new Error(getServerErrorMessage(await response.text(), "Échec du chargement des bons de réception"));
    }
    return response.json();
};

// POST - create a new bon de r�ception
export const createBonReception = async (
    bonReception: Omit<BonReception, "id" | "createdAt" | "updatedAt">
): Promise<BonReception> => {
    
    const response = await fetch(`${API_BASE}/bons-receptions/addbonreception`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(bonReception),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("Erreur cr�ation BonReception:", errorText);
        throw new Error(getServerErrorMessage(errorText, "Échec de la création du bon de réception"));
    }

    return response.json();
};

// PUT - update an existing bon de r�ception
export const updateBonReception = async (
    id: number,
    bonReception: Partial<BonReception>
): Promise<BonReception> => {
    const response = await fetch(`${API_BASE}/bons-receptions/updateBonReception/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(bonReception),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("Erreur mise � jour BonReception:", errorText);
        throw new Error(getServerErrorMessage(errorText, "Échec de la mise à jour du bon de réception"));
    }

    return response.json();
};

// DELETE - delete a bon de r�ception by ID
export const deleteBonReception = async (id: number): Promise<void> => {
    const response = await fetch(`${API_BASE}/bons-receptions/deleteBonReception/${id}`, {
        method: "DELETE",
    });

    if (!response.ok) {
        throw new Error("�chec de la suppression du bon de r�ception");
    }
};

export const fetchNextReceptionNumberFromAPI = async (): Promise<string> => {
    try {
    const response = await fetch(`${API_BASE}/bons-receptions/getNextReceptionNumber`);
        if (!response.ok) throw new Error("Failed to fetch next reception number");
        const data = await response.json();
        return data.numeroReception;
    } catch (error) {
        console.error("Error fetching next reception number:", error);
        throw error;
    }
};