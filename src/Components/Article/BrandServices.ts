import { getImageUrl } from "../../helpers/url_helper";
export { getImageUrl };
const API_BASE = process.env.REACT_APP_API_BASE;

export interface Brand {
  id: number;
  name: string;
  image: string;
  link?: string | null;
  order: number;
  active: boolean;
  created_at?: string;
}

export const fetchBrands = async (): Promise<Brand[]> => {
  const response = await fetch(`${API_BASE}/brands`);
  if (!response.ok) throw new Error("Failed to fetch brands");
  return response.json();
};

export const createBrand = async (formData: FormData): Promise<Brand> => {
  const response = await fetch(`${API_BASE}/brands`, { method: "POST", body: formData });
  if (!response.ok) throw new Error("Failed to create brand");
  return response.json();
};

export const updateBrand = async (id: number, formData: FormData): Promise<Brand> => {
  const response = await fetch(`${API_BASE}/brands/${id}`, { method: "PUT", body: formData });
  if (!response.ok) throw new Error("Failed to update brand");
  return response.json();
};

export const deleteBrand = async (id: number): Promise<void> => {
  const response = await fetch(`${API_BASE}/brands/${id}`, { method: "DELETE" });
  if (!response.ok) throw new Error("Failed to delete brand");
};
