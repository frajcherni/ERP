import { BonCommandeClient } from "../Article/Interfaces";

const API_BASE = process.env.REACT_APP_API_BASE;


// *************************************** BON COMMANDE CLIENT
export const fetchBonsCommandeClient = async (): Promise<BonCommandeClient[]> => {
    try {
        const response = await fetch(`${API_BASE}/bons-commande-client/getAllBonCommandeClient`);
        if (!response.ok) {
            throw new Error('Failed to fetch client orders');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching client orders:', error);
        throw error;
    }
};

export const fetchBonsCommandeClientPaginated = async (params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
}): Promise<{
    bons: BonCommandeClient[];
    pagination: {
        totalCount: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}> => {
    try {
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append("page", params.page.toString());
        if (params.limit) queryParams.append("limit", params.limit.toString());
        if (params.search) queryParams.append("search", params.search);
        if (params.status) queryParams.append("status", params.status);
        if (params.startDate) queryParams.append("startDate", params.startDate);
        if (params.endDate) queryParams.append("endDate", params.endDate);

        const response = await fetch(`${API_BASE}/bons-commande-client/paginated?${queryParams.toString()}`);
        if (!response.ok) {
            throw new Error('Failed to fetch paginated client orders');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching paginated client orders:', error);
        throw error;
    }
};

export const fetchNextCommandeNumber = async (): Promise<string> => {

    const response = await fetch(`${API_BASE}/bons-commande-client/getnumbercommande`);
    if (!response.ok) throw new Error("Failed to fetch next commande number");
    const data = await response.json();
    return data.numeroCommande;
};

export const createBonCommandeClient = async (bonCommande: Omit<BonCommandeClient, 'id'>): Promise<BonCommandeClient> => {
    debugger
    try {
        const response = await fetch(`${API_BASE}/bons-commande-client/addBonCommandeClient`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(bonCommande),
        });
        console.log(bonCommande)
        if (!response.ok) {
            throw new Error('Failed to create client order');
        }
        return await response.json();
    } catch (error) {
        console.error('Error creating client order:', error);
        throw error;
    }
};

export const createBonCommandeClientBasedOnDevis = async (bonCommande: Omit<BonCommandeClient, 'id'>): Promise<BonCommandeClient> => {

    try {
        const response = await fetch(`${API_BASE}/bons-commande-client/createBonCommandeClientBasedOnDevis`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(bonCommande),
        });
        console.log(bonCommande)
        if (!response.ok) {
            throw new Error('Failed to create client order');
        }
        return await response.json();
    } catch (error) {
        console.error('Error creating client order:', error);
        throw error;
    }
};

export const updateBonCommandeClient = async (id: number, bonCommande: Partial<BonCommandeClient>): Promise<BonCommandeClient> => {
    try {
        const response = await fetch(`${API_BASE}/bons-commande-client/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(bonCommande),
        });

        if (!response.ok) {
            // Try to get the error message from backend response
            const errorData = await response.json();
            const errorMessage = errorData.message || `Failed to update client order: ${response.status} ${response.statusText}`;
            throw new Error(errorMessage);
        }

        return await response.json();
    } catch (error) {
        console.error('Error updating client order:', error);
        throw error;
    }
};
export const deleteBonCommandeClient = async (id: number): Promise<void> => {
    try {
        const response = await fetch(`${API_BASE}/bons-commande-client/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            throw new Error('Failed to delete client order');
        }
    } catch (error) {
        console.error('Error deleting client order:', error);
        throw error;
    }
};


// *************************************** BON COMMANDE CLIENT


export const createDevis = async (bonCommande: Omit<BonCommandeClient, 'id'>): Promise<BonCommandeClient> => {
    debugger
    try {
        const response = await fetch(`${API_BASE}/devis/addBonCommandeClient`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(bonCommande),
        });
        if (!response.ok) {
            throw new Error('Failed to create client order');
        }
        return await response.json();
    } catch (error) {
        console.error('Error creating client order:', error);
        throw error;
    }
};


export const deleteDevis = async (id: number): Promise<void> => {
    try {
        const response = await fetch(`${API_BASE}/devis/deleteDevisClient/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            throw new Error('Failed to delete client order');
        }
    } catch (error) {
        console.error('Error deleting client order:', error);
        throw error;
    }
};

export const fetchDevis = async (): Promise<BonCommandeClient[]> => {

    try {
        const response = await fetch(`${API_BASE}/devis/getAllBonCommandeClient`);
        if (!response.ok) {
            throw new Error('Failed to fetch client orders');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching client orders:', error);
        throw error;
    }
};

export const fetchDevisPaginated = async (params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
}): Promise<{
    devis: BonCommandeClient[];
    pagination: {
        totalCount: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}> => {
    try {
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append("page", params.page.toString());
        if (params.limit) queryParams.append("limit", params.limit.toString());
        if (params.search) queryParams.append("search", params.search);
        if (params.status) queryParams.append("status", params.status);
        if (params.startDate) queryParams.append("startDate", params.startDate);
        if (params.endDate) queryParams.append("endDate", params.endDate);

        const response = await fetch(`${API_BASE}/devis/paginated?${queryParams.toString()}`);
        if (!response.ok) {
            throw new Error('Failed to fetch paginated devis');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching paginated devis:', error);
        throw error;
    }
};

export const updateDevis = async (id: number, bonCommande: Partial<BonCommandeClient>): Promise<BonCommandeClient> => {
    debugger
    try {
        const response = await fetch(`${API_BASE}/devis/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(bonCommande),
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










//************************************************ fetchVenteComptoire

export const fetchVenteComptoire = async (): Promise<BonCommandeClient[]> => {
    try {
        const response = await fetch(`${API_BASE}/VenteComptoire/getAllVenteComptoire`);
        if (!response.ok) {
            throw new Error('Failed to fetch client orders');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching client orders:', error);
        throw error;
    }
};

export const fetchVenteComptoirePaginated = async (params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
}): Promise<{
    bons: BonCommandeClient[];
    pagination: {
        totalCount: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}> => {
    try {
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append("page", params.page.toString());
        if (params.limit) queryParams.append("limit", params.limit.toString());
        if (params.search) queryParams.append("search", params.search);
        if (params.status) queryParams.append("status", params.status);
        if (params.startDate) queryParams.append("startDate", params.startDate);
        if (params.endDate) queryParams.append("endDate", params.endDate);

        const response = await fetch(`${API_BASE}/VenteComptoire/paginated?${queryParams.toString()}`);
        if (!response.ok) {
            throw new Error('Failed to fetch paginated vente comptoire');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching paginated vente comptoire:', error);
        throw error;
    }
};


export const CreateVenteComptoire = async (bonCommande: Omit<BonCommandeClient, 'id'>): Promise<BonCommandeClient> => {
    try {
        debugger
        const response = await fetch(`${API_BASE}/VenteComptoire/addVenteComptoire`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(bonCommande),
        });
        if (!response.ok) {
            throw new Error('Failed to create client order');
        }
        return await response.json();
    } catch (error) {
        console.error('Error creating client order:', error);
        throw error;
    }
};


export const updateventecomptoire = async (id: number, bonCommande: Partial<BonCommandeClient>): Promise<BonCommandeClient> => {
    try {
        const response = await fetch(`${API_BASE}/VenteComptoire/updateventecomptoire/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(bonCommande),
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


export const deleteventecomptoire = async (id: number): Promise<void> => {
    try {
        const response = await fetch(`${API_BASE}/VenteComptoire/deleteventecomptoire/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            throw new Error('Failed to delete client order');
        }
    } catch (error) {
        console.error('Error deleting client order:', error);
        throw error;
    }
};






export const fetchNextVenteComptoireNumber = async (): Promise<string> => {
    const response = await fetch(`${API_BASE}/VenteComptoire/fetchNextVenteComptoireNumber`);
    if (!response.ok) throw new Error("Failed to fetch next commande number");
    const data = await response.json();
    return data.numeroCommande;
};

