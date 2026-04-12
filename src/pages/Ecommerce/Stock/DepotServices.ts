// DepotServices.ts
import axios from "axios";
import { Depot } from "../../../Components/Article/Interfaces";

const API_BASE = process.env.REACT_APP_API_BASE

// Types


export interface StockItem {
  id: number;
  article_id: number;
  depot_id: number;
  qte: number;
  created_at: string;
  updated_at: string;
  article: {
    id: number;
    reference: string;
    designation: string;
    code_barre: string | null;
    pua_ttc: string;
    type: string;
    [key: string]: any;
  };
}

export interface StockResponse {
  items: StockItem[];
  summary: {
    totalArticles: number;
    totalQuantity: number;
    totalValue: number;
  };
}

// Fetch all depots
export const fetchDepots = async (): Promise<Depot[]> => {
  try {
    const response = await axios.get(`${API_BASE}/depots/fetchDepots`);
    return response.data;
  } catch (error: any) {
    console.error("Error fetching depots:", error);
    throw error.response?.data?.message || error.message || "Network error";
  }
};

// Create a new depot
export const createDepot = async (depotData: { nom: string; description?: string }): Promise<Depot> => {
  try {
    const response = await axios.post(`${API_BASE}/depots/createDepot`, depotData);
    return response.data;
  } catch (error: any) {
    console.error("Error creating depot:", error);
    throw error.response?.data?.message || error.message || "Network error";
  }
};

// Update a depot
export const updateDepot = async (id: number, depotData: { nom?: string; description?: string }): Promise<Depot> => {
  try {
    const response = await axios.put(`${API_BASE}/depots/updateDepot/${id}`, depotData);
    return response.data;
  } catch (error: any) {
    console.error("Error updating depot:", error);
    throw error.response?.data?.message || error.message || "Network error";
  }
};

// Delete a depot
export const deleteDepot = async (id: number): Promise<void> => {
  try {
    await axios.delete(`${API_BASE}/depots/deleteDepot/${id}`);
  } catch (error: any) {
    console.error("Error deleting depot:", error);
    throw error.response?.data?.message || error.message || "Network error";
  }
};

// Get depot stock - FIXED VERSION
export const getDepotStock = async (depotId: number): Promise<StockResponse> => {
  try {
    const response = await axios.get(`${API_BASE}/depots/${depotId}/stock`);

    console.log("API response for depot stock:", response.data);

    // The response structure is: { items: [], summary: {} }
    return response.data;
  } catch (error: any) {
    console.error("Error fetching depot stock:", error);
    throw error.response?.data?.message || error.message || "Network error";
  }
};