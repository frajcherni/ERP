import { BonReception } from "../Article/Interfaces";

const API_BASE = process.env.REACT_APP_API_BASE;

// GET all bons de r�ception
export const fetchBonsReception = async (): Promise<BonReception[]> => {
    const response = await fetch(`${API_BASE}/bons-receptions/getbonreception`);
    if (!response.ok) {
        throw new Error("�chec du chargement des bons de r�ception");
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

    console.log(bonReception);

    if (!response.ok) {
        const errorText = await response.text();
        console.error("Erreur cr�ation BonReception:", errorText);
        throw new Error("�chec de la cr�ation du bon de r�ception");
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
        throw new Error("�chec de la mise � jour du bon de r�ception");
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