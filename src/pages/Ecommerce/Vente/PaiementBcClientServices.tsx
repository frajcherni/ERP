import axios from "axios";
import { PaiementClient, BonCommandeClient } from "../../../Components/Article/Interfaces";

const API_BASE = process.env.REACT_APP_API_BASE;

// Fetch all client payments for bon commande
export const fetchPaiementsClient = async (): Promise<PaiementClient[]> => {

    try {
        const response = await fetch(`${API_BASE}/paiements-client/getAllPaiementsClient`);
        if (!response.ok) throw new Error('Erreur lors de la récupération des paiements');

        const data = await response.json();
        console.log('Paiements data:', data);

        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error('Error fetching paiements:', error);
        return [];
    }
};

// Fetch specific payment by ID
export const fetchPaiementClient = async (id: number): Promise<PaiementClient> => {
    try {
        const response = await axios.get(`${API_BASE}/paiements-client/${id}`);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Échec de la récupération du paiement client");
    }
};

// Fetch payments by bon commande ID
export const fetchPaiementsByBonCommande = async (bonCommandeId: number): Promise<PaiementClient[]> => {
    try {
        const response = await fetch(`${API_BASE}/paiements-client/bon-commande/${bonCommandeId}`);
        if (!response.ok) throw new Error('Erreur lors de la récupération des paiements');

        const data = await response.json();
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error('Error fetching paiements by bon commande:', error);
        return [];
    }
};

// Fetch payments by bon livraison ID
export const fetchPaiementsByBonLivraison = async (bonLivraisonId: number): Promise<PaiementClient[]> => {
    try {
        const response = await fetch(`${API_BASE}/paiements-client/bon-livraison/${bonLivraisonId}`);
        if (!response.ok) throw new Error('Erreur lors de la récupération des paiements');

        const data = await response.json();
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error('Error fetching paiements by bon livraison:', error);
        return [];
    }
};

// Create new payment
export const createPaiementClient = async (paiementData: Partial<PaiementClient>): Promise<PaiementClient> => {
    try {
        const response = await fetch(`${API_BASE}/paiements-client/createpaiement`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                bonCommandeClient_id: paiementData.bonCommandeClient_id ? Number(paiementData.bonCommandeClient_id) : null,
                bonLivraison_id: paiementData.bonLivraison_id ? Number(paiementData.bonLivraison_id) : null,
                client_id: Number(paiementData.client_id),
                montant: Number(paiementData.montant),
                modePaiement: paiementData.modePaiement,
                numeroPaiement: paiementData.numeroPaiement,
                date: paiementData.date,
                notes: paiementData.notes,
                numeroCheque: paiementData.numeroCheque,
                banque: paiementData.banque,
                numeroTraite: paiementData.numeroTraite,
                dateEcheance: paiementData.dateEcheance
            })
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error creating paiement:', error);
        throw new Error("Échec de la création du paiement");
    }
};

// Update payment
export const updatePaiementClient = async (id: number, paiementData: Partial<PaiementClient>): Promise<PaiementClient> => {
    try {
        const response = await fetch(`${API_BASE}/paiements-client/updatePaiement/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                bonCommandeClient_id: paiementData.bonCommandeClient_id ? Number(paiementData.bonCommandeClient_id) : null,
                bonLivraison_id: paiementData.bonLivraison_id ? Number(paiementData.bonLivraison_id) : null,
                client_id: Number(paiementData.client_id),
                montant: Number(paiementData.montant),
                modePaiement: paiementData.modePaiement,
                numeroPaiement: paiementData.numeroPaiement,
                date: paiementData.date,
                notes: paiementData.notes,
                numeroCheque: paiementData.numeroCheque,
                banque: paiementData.banque,
                numeroTraite: paiementData.numeroTraite,
                dateEcheance: paiementData.dateEcheance
            })
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error updating paiement:', error);
        throw new Error("Échec de la mise à jour du paiement");
    }
};

// Delete payment
export const deletePaiementClient = async (id: number): Promise<void> => {
    try {
        const response = await fetch(`${API_BASE}/paiements-client/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
    } catch (error) {
        console.error('Error deleting paiement:', error);
        throw new Error("Échec de la suppression du paiement");
    }
};

// Fetch next payment number
export const fetchNextPaiementNumberFromAPI = async (): Promise<string> => {
    try {
        const response = await fetch(`${API_BASE}/paiements-client/getNextPaiementNumber`);
        if (!response.ok) throw new Error("Failed to fetch next paiement number");
        const data = await response.json();
        return data.numeroPaiement || `PAY-C${new Date().getFullYear()}00001`;
    } catch (error) {
        console.error("Error fetching next paiement number:", error);
        return `PAY-C${new Date().getFullYear()}00001`;
    }
};