// BonsCommande CRUD Service
import { BonCommande } from "../Article/Interfaces";

const API_BASE = process.env.REACT_APP_API_BASE;

// Show the backend's reason instead of a generic message
const getServerErrorMessage = (errorText: string, fallback: string): string => {
  try {
    const data = JSON.parse(errorText);
    if (data?.message && data?.error) return `${data.message} : ${data.error}`;
    return data?.message || fallback;
  } catch {
    return fallback;
  }
};

// ✅ GET all bons de commande
export const fetchBonsCommande = async (): Promise<BonCommande[]> => {
   
  const response = await fetch(`${API_BASE}/bons-commandes/getcommande`);
  if (!response.ok) {
    throw new Error("Échec du chargement des bons de commande");
    }
  return response.json();
};

// ✅ GET one page of bons de commande, filtered on the server (same API shape as the ventes lists)
export const fetchBonsCommandePaginated = async (params: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}): Promise<{
  bons: BonCommande[];
  pagination: { totalCount: number; page: number; limit: number; totalPages: number };
}> => {
  const queryParams = new URLSearchParams();
  if (params.page != null) queryParams.append("page", params.page.toString());
  if (params.limit != null) queryParams.append("limit", params.limit.toString());
  if (params.search) queryParams.append("search", params.search);
  if (params.status) queryParams.append("status", params.status);
  if (params.startDate) queryParams.append("startDate", params.startDate);
  if (params.endDate) queryParams.append("endDate", params.endDate);

  const response = await fetch(`${API_BASE}/bons-commandes/paginated?${queryParams.toString()}`);
  if (!response.ok) {
    throw new Error(getServerErrorMessage(await response.text(), "Échec du chargement des bons de commande"));
  }
  return response.json();
};

export const createBonCommande = async (
  bonCommande: Omit<BonCommande, "id" | "createdAt" | "updatedAt">
): Promise<BonCommande> => {
  const response = await fetch(`${API_BASE}/bons-commandes/addcommande`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(bonCommande),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Erreur création BonCommande:", errorText);
    throw new Error(getServerErrorMessage(errorText, "Échec de la création du bon de commande"));
  }

  return response.json();
};

// ✅ PUT - update an existing bon de commande
export const updateBonCommande = async (
  id: number,
  bonCommande: Partial<BonCommande>
): Promise<BonCommande> => {
  const response = await fetch(`${API_BASE}/bons-commandes/updateboncommande/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(bonCommande),
  });

    if (!response.ok) {
    const errorText = await response.text();
    console.error("Erreur mise à jour BonCommande:", errorText);
    throw new Error(getServerErrorMessage(errorText, "Échec de la mise à jour du bon de commande"));
  }

  return response.json();
};

// ✅ DELETE - delete a bon de commande by ID
export const deleteBonCommande = async (id: number): Promise<void> => {
    const response = await fetch(`${API_BASE}/bons-commandes/deleteboncommande/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Échec de la suppression du bon de commande");
  }
};





export const fetchNextCommandeNumberFromAPI = async (): Promise<string> => {
    try {
        const response = await fetch(`${API_BASE}/bons-commandes/getNextCommandeNumber`);
        if (!response.ok) throw new Error("Failed to fetch next commande number");
        const data = await response.json();
        return data.numeroCommande;
    } catch (error) {
        console.error("Error fetching next commande number:", error);
        throw error;
    }
};
