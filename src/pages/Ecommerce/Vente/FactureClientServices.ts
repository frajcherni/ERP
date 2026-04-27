import axios from "axios";
import { FactureClient , EncaissementClient} from "../../../Components/Article/Interfaces";

const API_BASE = process.env.REACT_APP_API_BASE;

// ============================================================
// PAGINATED FETCH - Optimized for list view (server-side computation)
// ============================================================
export interface PaginatedFacturesResponse {
    factures: FactureClient[];
    pagination: {
        page: number;
        limit: number;
        totalCount: number;
        totalPages: number;
    };
}

export const fetchFacturesClientPaginated = async (params: {
    page?: number;
    limit?: number;
    search?: string;
    searchPhone?: string;
    status?: string;
    startDate?: string | null;
    endDate?: string | null;
} = {}): Promise<PaginatedFacturesResponse> => {
    try {
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.set('page', String(params.page));
        if (params.limit) queryParams.set('limit', String(params.limit));
        if (params.search) queryParams.set('search', params.search);
        if (params.searchPhone) queryParams.set('searchPhone', params.searchPhone);
        if (params.status) queryParams.set('status', params.status);
        if (params.startDate) queryParams.set('startDate', params.startDate);
        if (params.endDate) queryParams.set('endDate', params.endDate);

        const response = await fetch(
            `${API_BASE}/factures-client/paginated?${queryParams.toString()}`
        );
        if (!response.ok) throw new Error('Erreur lors de la récupération des factures');

        const data = await response.json();
        return {
            factures: data.factures || [],
            pagination: data.pagination || { page: 1, limit: 20, totalCount: 0, totalPages: 0 },
        };
    } catch (error) {
        console.error('Error fetching paginated factures:', error);
        return {
            factures: [],
            pagination: { page: 1, limit: 20, totalCount: 0, totalPages: 0 },
        };
    }
};

// ============================================================
// ORIGINAL FETCH - Kept for journal export / backward compat
// ============================================================
export const fetchFacturesClient = async (): Promise<FactureClient[]> => {
    try {
        const response = await fetch(`${API_BASE}/factures-client/getAllFacturesClient`);
        if (!response.ok) throw new Error('Erreur lors de la récupération des factures');
        
        const data = await response.json();
        
        // The API returns an array directly
        if (Array.isArray(data)) {
            return data;
        } else {
            console.warn('Unexpected API response structure:', data);
            return [];
        }
    } catch (error) {
        console.error('Error fetching factures:', error);
        return [];
    }
};

export const fetchFactureClientById = async (id: number): Promise<FactureClient> => {
    try {
        const response = await axios.get(`${API_BASE}/factures-client/${id}`);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Échec de la récupération de la facture client");
    }
};


export const createFacture = async (factureData: any): Promise<FactureClient> => {
    
    const response = await axios.post(
      `${API_BASE}/factures-client/addAllFacturesClient`, 
      factureData
    );
    return response.data;
};

export const updateFacture = async (id: number, factureData: Partial<FactureClient>): Promise<FactureClient> => {
    try {
        const response = await fetch(`${API_BASE}/factures-client/updateFactureClient/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(factureData),
        });
        if (!response.ok) {
            throw new Error('Failed to update client order');
        }
        return await response.json();
    } catch (error) {
        console.error('Error updating client order:', error);
        throw error;
    }
};
export const deleteFacture = async (id: number): Promise<void> => {
    try {
        await axios.delete(`${API_BASE}/factures-client/deleteFactureClient/${id}`);
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Échec de la suppression de la facture client");
    }
};

export const annulerFacture = async (id: number): Promise<void> => {
    try {
        await axios.post(`${API_BASE}/${id}/annuler`);
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Échec de l'annulation de la facture client");
    }
};

export const fetchEncaissementsClient = async (): Promise<EncaissementClient[]> => {
    try {
        const response = await fetch(`${API_BASE}/EncaissementClient/getAllEncaissements`);
        if (!response.ok) throw new Error('Erreur lors de la récupération des encaissements');
        
        const data = await response.json();
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error('Error fetching encaissements:', error);
        return [];
    }
};

export const fetchEncaissementClient = async (id: number): Promise<EncaissementClient> => {
    try {
        const response = await fetch(`${API_BASE}/EncaissementClient/${id}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('Error fetching encaissement:', error);
        throw new Error("Échec de la récupération de l'encaissement");
    }
};

export const createEncaissementClient = async (encaissementData: Partial<EncaissementClient>): Promise<EncaissementClient> => {
    try {
        const response = await fetch(`${API_BASE}/EncaissementClient/createencaissement`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                facture_id: Number(encaissementData.facture_id),
                montant: Number(encaissementData.montant),
                modePaiement: encaissementData.modePaiement,
                numeroEncaissement: encaissementData.numeroEncaissement,
                date: encaissementData.date,
                client_id: encaissementData.client_id,
                numeroCheque: encaissementData.numeroCheque,
                banque: encaissementData.banque,
                numeroTraite: encaissementData.numeroTraite,
                dateEcheance: encaissementData.dateEcheance
            })
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error creating encaissement:', error);
        throw new Error("Échec de la création de l'encaissement");
    }
};

export const updateEncaissementClient = async (id: number, encaissementData: Partial<EncaissementClient>): Promise<EncaissementClient> => {
    try {
        const response = await fetch(`${API_BASE}/EncaissementClient/updateEncaissement/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                facture_id: Number(encaissementData.facture_id),
                montant: Number(encaissementData.montant),
                modePaiement: encaissementData.modePaiement,
                numeroEncaissement: encaissementData.numeroEncaissement,
                date: encaissementData.date,
                client_id: Number(encaissementData.client_id),
                numeroCheque: encaissementData.numeroCheque,
                banque: encaissementData.banque,
                numeroTraite: encaissementData.numeroTraite,
                dateEcheance: encaissementData.dateEcheance
            })
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error updating encaissement:', error);
        throw new Error("Échec de la mise à jour de l'encaissement");
    }
};

export const deleteEncaissementClient = async (id: number): Promise<void> => {
    try {
        const response = await fetch(`${API_BASE}/EncaissementClient/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
    } catch (error) {
        console.error('Error deleting encaissement:', error);
        throw new Error("Échec de la suppression de l'encaissement");
    }
};

export const fetchNextEncaissementNumberFromAPI = async (): Promise<string> => {
    try {
        const response = await fetch(`${API_BASE}/EncaissementClient/getNextEncaissementNumber`);
        if (!response.ok) throw new Error("Failed to fetch next encaissement number");
        const data = await response.json();
        return data.numeroEncaissement || `ENC-C${new Date().getFullYear()}00001`;
    } catch (error) {
        console.error("Error fetching next encaissement number:", error);
        return `ENC-C${new Date().getFullYear()}00001`;
    }
};

export const fetchNextFactureNumberFromAPI = async (): Promise<string> => {
    try {
        const response = await fetch(`${API_BASE}/factures-client/getNextFactureNumber`);
        if (!response.ok) throw new Error("Failed to fetch next reception number");
        const data = await response.json();
        return data.numeroFacture;
    } catch (error) {
        console.error("Error fetching next reception number:", error);
        throw error;
    }
};