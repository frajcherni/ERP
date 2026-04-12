import axios from "axios";
import { FactureFournisseur, Payment } from "./Interfaces";

const API_BASE = process.env.REACT_APP_API_BASE;

// ----------------- Factures -----------------

// Fetch all factures
export const fetchFactures = async (): Promise<FactureFournisseur[]> => {
  try {
    const response = await fetch(`${API_BASE}/FacturesFournisseur/getAllFacturesFournisseur`);
    if (!response.ok) throw new Error("Erreur lors de la récupération des factures");
    return await response.json();
  } catch (error) {
    console.error("Error fetching factures:", error);
    throw error;
  }
};

// Fetch a single facture
export const fetchFacture = async (id: number): Promise<FactureFournisseur> => {
  return await axios.get(`${API_BASE}/factures/${id}`).then(res => res.data);
};

// Create a new facture
export const createFacture = async (data: any): Promise<FactureFournisseur> => {
  return await axios.post(`${API_BASE}/FacturesFournisseur/addAllFacturesFournisseur`, data).then(res => res.data);
};

// Update an existing facture
export const updateFacture = async (id: number, data: any): Promise<FactureFournisseur> => {
  return await axios.put(`${API_BASE}/FacturesFournisseur/updateFactureFournisseur/${id}`, data).then(res => res.data);
};

// Delete a facture
export const deleteFacture = async (id: number): Promise<void> => {
  await axios.delete(`${API_BASE}/FacturesFournisseur/${id}`);
};

// ----------------- Facture Number -----------------

export const fetchNextFactureNumberFromAPI = async (): Promise<string> => {
  try {
    const response = await fetch(`${API_BASE}/FacturesFournisseur/getNextFactureNumber`);
    if (!response.ok) throw new Error("Failed to fetch next facture number");
    const data = await response.json();
    return data.numeroFacture;
  } catch (error) {
    console.error("Error fetching next facture number:", error);
    throw error;
  }
};

// ----------------- Payments -----------------

export const fetchPayments = async (): Promise<Payment[]> => {
  try {
    const response = await fetch(`${API_BASE}/PaymentFournisseur/getAllPayments`);
    if (!response.ok) throw new Error("Failed to fetch payments");
    return await response.json();
  } catch (error) {
    console.error("Error fetching payments:", error);
    throw error;
  }
};

export const fetchPayment = async (id: number): Promise<Payment> => {
  try {
    const response = await fetch(`${API_BASE}/payments/${id}`);
    if (!response.ok) throw new Error("Failed to fetch payment");
    return await response.json();
  } catch (error) {
    console.error("Error fetching payment:", error);
    throw error;
  }
};

export const createPayment = async (paymentData: Partial<Payment>): Promise<Payment> => {
  try {
    const response = await fetch(`${API_BASE}/PaymentFournisseur/createpayment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(paymentData),
    });
    if (!response.ok) throw new Error("Failed to create payment");
    return await response.json();
  } catch (error) {
    console.error("Error creating payment:", error);
    throw error;
  }
};

export const updatePayment = async (id: number, paymentData: Partial<Payment>): Promise<Payment> => {
  try {
    const response = await fetch(`${API_BASE}/PaymentFournisseur/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(paymentData),
    });
    if (!response.ok) throw new Error("Failed to update payment");
    return await response.json();
  } catch (error) {
    console.error("Error updating payment:", error);
    throw error;
  }
};

export const deletePayment = async (id: number): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE}/PaymentFournisseur/${id}`, { method: "DELETE" });
    if (!response.ok) throw new Error("Failed to delete payment");
  } catch (error) {
    console.error("Error deleting payment:", error);
    throw error;
  }
};

// ----------------- Payment Number -----------------

export const fetchNextPaymentNumberFromAPI = async (): Promise<string> => {
  try {
    const response = await fetch(`${API_BASE}/PaymentFournisseur/getNextPaymentNumber`);
    if (!response.ok) throw new Error("Failed to fetch next payment number");
    const data = await response.json();
    return data.numeroPaiement;
  } catch (error) {
    console.error("Error fetching next payment number:", error);
    throw error;
  }
};
