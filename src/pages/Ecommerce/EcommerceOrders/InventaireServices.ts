// InventaireServices.ts
import axios from 'axios';
import { Article } from '../../../Components/Article/Interfaces';

const API_BASE = process.env.REACT_APP_API_BASE;

// Interfaces
export interface InventaireItem {
  article: Article;
  qte_reel: number;
  pua_ht: number;
  pua_ttc: number;
  tva: number;
  total_tva: number;
  total_ht: number;
  total_ttc: number;
}

export interface Inventaire {
  id: number;
  numero: string;
  date: string;
  description?: string;
  status: 'Terminé';
  articles: InventaireItem[];
  created_at: string;
  updated_at: string;
}

// Fetch all inventaires
export const fetchInventaires = async (): Promise<Inventaire[]> => {
  try {
    const response = await axios.get(`${API_BASE}/inventaireRoutes/getAllInventaires`);
    
    // If your API returns data directly
    if (Array.isArray(response.data)) {
      return response.data;
    }
    
    // If your API returns { success, data, message }
    if (response.data && response.data.success && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    
    return [];
  } catch (error: any) {
    console.error('Error fetching inventaires:', error);
    throw error.response?.data?.message || error.message || 'Network error';
  }
};

// Create inventaire (this also updates stock quantities)
export const createInventaire = async (inventaireData: {
  
  numero?: string;
  date?: string;
  description?: string;
  articles: InventaireItem[];
}): Promise<any> => {
  try {
    // Prepare data for backend
    const dataToSend = {
      numero: inventaireData.numero,
      date: inventaireData.date,
      description: inventaireData.description,
      articles: inventaireData.articles.map(item => ({
        article_id: item.article.id,  // Only send article_id and qte_reel
        qte_reel: item.qte_reel
        // Backend will calculate prices and totals
      }))
    };
    
    console.log('Creating inventaire with:', dataToSend);
    
    const response = await axios.post(`${API_BASE}/inventaireRoutes/createInventaire`, dataToSend);
    return response.data;
  } catch (error: any) {
    console.error('Error creating inventaire:', error);
    throw error.response?.data?.message || error.message || 'Network error';
  }
};

// Update inventaire
export const updateInventaire = async (
  id: number, 
  updateData: {
    numero?: string;
    date?: string;
    description?: string;
    articles: InventaireItem[];
  }
): Promise<any> => {
  try {
    const response = await axios.put(`${API_BASE}/inventaire/${id}`, updateData);
    return response.data;
  } catch (error: any) {
    console.error('Error updating inventaire:', error);
    throw error.response?.data?.message || error.message || 'Network error';
  }
};

// Fetch articles for inventaire
export const fetchArticlesForInventaire = async (): Promise<Article[]> => {
  try {
    const response = await fetch(`${API_BASE}/articles/getarticle`);
    if (!response.ok) throw new Error("Failed to fetch articles");
    
    const articles = await response.json();
    
    if (!Array.isArray(articles)) {
      console.warn('API response is not an array:', articles);
      return [];
    }
    
    // IMPORTANT: Convert string numbers to actual numbers
    return articles.map((article: any) => ({
      ...article,
      // Convert all numeric fields from string to number
      id: Number(article.id) || 0,
      qte: Number(article.qte) || 0,
      qte_reel: Number(article.qte) || 0,
      pua_ht: Number(article.pua_ht) || 0,
      puv_ht: Number(article.puv_ht) || 0,
      pua_ttc: Number(article.pua_ttc) || 0,
      puv_ttc: Number(article.puv_ttc) || 0,
      tva: Number(article.tva) || 0,
      // Ensure other fields have proper defaults
      reference: article.reference || '',
      designation: article.designation || '',
      code_barre: article.code_barre || '',
      nom: article.nom || article.designation || '',
      image: article.image || '',
      taux_fodec: Boolean(article.taux_fodec),
      type: article.type || 'Non Consigné',
      categorie: article.categorie || null,
      fournisseur: article.fournisseur || null,
      sousCategorie: article.sousCategorie || null,
      created_at: article.created_at || '',
      updated_at: article.updated_at || ''
    }));
  } catch (error: any) {
    console.error('Error fetching articles:', error);
    throw error.message;
  }
};