// services/TresorieServices.ts
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_BASE;

// Define interfaces
export interface VenteComptoire {
  id: number;
  numeroCommande: string;
  dateCommande: string;
  status: string;
  taxMode: string;
  remise: number;
  remiseType: string;
  notes: string;
  totalAfterRemise: number;
  createdAt: string;
  updatedAt: string;
  client: any;
  vendeur: any;
  articles: any[];
}

export interface EncaissementClient {
  id: number;
  montant: number;
  modePaiement: string;
  numeroEncaissement: string;
  date: string;
  client_id: number;
  facture_id: number;
  createdAt: string;
  updatedAt: string;
  client: any;
  factureClient: any;
}

export interface FactureFournisseurPayment {
  id: number;
  montant: number;
  modePaiement: string;
  numeroPaiement: string;
  datePaiement: string;
  facture_id: number;
  fournisseur_id: number;
  createdAt: string;
  updatedAt: string;
  factureFournisseur: any;
  fournisseur: any;
}

// Vente Comptoire Services
export const fetchVenteComptoire = async (): Promise<VenteComptoire[]> => {
  const response = await axios.get(`${API_BASE}/getpayment/ventecomptoire`);
  return response.data;
};

// Encaissement Client Services
export const fetchEncaissementsClient = async (): Promise<EncaissementClient[]> => {
  const response = await axios.get(`${API_BASE}/getpayment/client`);
  return response.data;
};

// Facture Fournisseur Payment Services
export const fetchFactureFournisseurPayments = async (): Promise<FactureFournisseurPayment[]> => {
  const response = await axios.get(`${API_BASE}/getpayment/fournisseur`);
  return response.data;
};