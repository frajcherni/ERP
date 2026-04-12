import {
  Categorie,
  Fournisseur,
  Article,
  Client,
  Vendeur
} from "./Interfaces";


const API_BASE = process.env.REACT_APP_API_BASE;


// Add to your ArticleServices.ts
export const uploadArticleWebsiteImages = async (articleId: number, images: File[]) => {
  const formData = new FormData();
  images.forEach(image => {
      formData.append('images', image);
  });
  
  const response = await fetch(`${API_BASE}/articles/${articleId}/website-images`, {
      method: 'POST',
      body: formData,
  });
  
  if (!response.ok) {
      throw new Error('Failed to upload website images');
  }
  
  return response.json();
};

export const removeArticleWebsiteImage = async (articleId: number, imageIndex: number) => {
  const response = await fetch(`${API_BASE}/articles/${articleId}/website-images/${imageIndex}`, {
      method: 'DELETE',
  });
  
  if (!response.ok) {
      throw new Error('Failed to remove website image');
  }
  
  return response.json();
};

// Add these functions to your ArticleServices.ts file

export const updateArticleWebsiteSettings = async (articleId: number, settings: any) => {
  debugger
  const response = await fetch(`${API_BASE}/articles/${articleId}/website-settings`, {
      method: 'PUT',
      headers: {
          'Content-Type': 'application/json',
      },
      body: JSON.stringify(settings),
  });
  
  if (!response.ok) {
      throw new Error('Failed to update website settings');
  }
  
  return response.json();
};


// ArticleServices.ts - Update the search function

export const searchArticles = async (params: {
  query?: string;
  page?: number;
  limit?: number;
}): Promise<{ 
  articles: Article[]; 
  total: number; 
  page: number;
  limit: number;
  totalPages: number;
}> => {
  try {
    console.log("🔍 POST Search request:", params);
    debugger
    const response = await fetch(`${API_BASE}/articles/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: params.query || '',
        page: params.page || 1,
        limit: params.limit || 50
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Search error:", errorText);
      throw new Error(`Search failed: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`✅ Search successful: ${data.total} articles found`);
    return data;
    
  } catch (error) {
    console.error("❌ Search function error:", error);
    throw error;
  }
};

// Add to your ArticleServices.ts or create a new ClientServices.ts

export const searchClients = async (params: {
  query?: string;
  page?: number;
  limit?: number;
  status?: string;
}): Promise<{ 
  clients: Client[]; 
  total: number; 
  page: number;
  limit: number;
  totalPages: number;
}> => {
  try {
    console.log("🔍 POST Client search request:", params);
    
    const response = await fetch(`${API_BASE}/clients/searchclients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: params.query || '',
        page: params.page || 1,
        limit: params.limit || 20,
        status: params.status || 'Actif'
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Client search error:", errorText);
      throw new Error(`Client search failed: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`✅ Client search successful: ${data.total} clients found`);
    return {
      clients: data.clients || data.data || [],
      total: data.total,
      page: data.page,
      limit: data.limit,
      totalPages: data.totalPages
    };
    
  } catch (error) {
    console.error("❌ Client search function error:", error);
    throw error;
  }
};

export const uploadArticleImages = async (articleId: number, images: File[]) => {
  const formData = new FormData();
  images.forEach(image => {
      formData.append('images', image);
  });
  
  const response = await fetch(`${API_BASE}/articles/${articleId}/images`, {
      method: 'POST',
      body: formData,
  });
  
  if (!response.ok) {
      throw new Error('Failed to upload images');
  }
  
  return response.json();
};
// Articles CRUD
export const fetchArticles = async (showOnlyActive = true): Promise<Article[]> => {
  const response = await fetch(`${API_BASE}/articles/getarticle`);
  if (!response.ok) throw new Error("Failed to fetch articles");
  
  const articles = await response.json();
  
  // Filter on the frontend
  if (showOnlyActive) {
    return articles.filter((article : any) => article.active !== false); // returns only active articles
  }
  
  return articles; // returns all articles
};

export const createArticle = async (articleData: any, imageFile?: File): Promise<Article> => {
  debugger
  const formData = new FormData();

  // Append all fields individually to ensure they're added
  formData.append('reference', articleData.reference || '');
  formData.append('nom', articleData.nom || articleData.designation || articleData.reference || '');
  formData.append('designation', articleData.designation || '');
  formData.append('qte', (articleData.qte || 0).toString());
  formData.append('pua_ht', (articleData.pua_ht || 0).toString());
  formData.append('puv_ht', (articleData.puv_ht || 0).toString());
  formData.append('pua_ttc', (articleData.pua_ttc || 0).toString());
  formData.append('puv_ttc', (articleData.puv_ttc || 0).toString());
  formData.append('tva', (articleData.tva || 0).toString());
  formData.append('taux_fodec', (articleData.taux_fodec || false).toString());
  formData.append('type', articleData.type || 'Non Consigné');
  formData.append('fournisseur_id', (articleData.fournisseur_id || '').toString());
  formData.append('categorie_id', (articleData.categorie_id || '').toString());
  
  if (articleData.sous_categorie_id) {
    formData.append('sous_categorie_id', articleData.sous_categorie_id.toString());
  }

  // Append image if exists
  if (imageFile) {
    formData.append('image', imageFile);
  }

  console.log('📤 Sending FormData to backend...');
  
  // Debug: Check FormData contents
  for (const [key, value] of (formData as any).entries()) {
    console.log(`🔍 ${key}:`, value);
  }

  try {
    const response = await fetch(`${API_BASE}/articles/addarticle`, {
      method: 'POST',
      body: formData,
      // Don't set Content-Type header - let browser set it with boundary
    });

    const responseText = await response.text();
    console.log('📥 Raw response:', responseText);

    if (!response.ok) {
      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch {
        errorData = { message: responseText || 'Unknown error' };
      }
      throw new Error(errorData.message || `HTTP ${response.status}: Failed to create article`);
    }

    return JSON.parse(responseText);
  } catch (error) {
    console.error('❌ Fetch error:', error);
    throw error;
  }
};


export const updateArticle = async (id: number, articleData: any, imageFile?: File): Promise<Article> => {
  debugger
  const formData = new FormData();

  // Append all fields individually
  formData.append('reference', articleData.reference || '');
  formData.append('nom', articleData.nom || articleData.designation || articleData.reference || '');
  formData.append('designation', articleData.designation || '');
  formData.append('qte', (articleData.qte || 0).toString());
  formData.append('pua_ht', (articleData.pua_ht || 0).toString());
  formData.append('puv_ht', (articleData.puv_ht || 0).toString());
  formData.append('pua_ttc', (articleData.pua_ttc || 0).toString());
  formData.append('puv_ttc', (articleData.puv_ttc || 0).toString());
  formData.append('tva', (articleData.tva || 0).toString());
  formData.append('taux_fodec', (articleData.taux_fodec || false).toString());
  formData.append('type', articleData.type || 'Non Consigné');
  formData.append('fournisseur_id', (articleData.fournisseur_id || '').toString());
  formData.append('categorie_id', (articleData.categorie_id || '').toString());
  
  if (articleData.sous_categorie_id) {
    formData.append('sous_categorie_id', articleData.sous_categorie_id.toString());
  }

  // Append image if exists
  if (imageFile) {
    formData.append('image', imageFile);
  }

  const response = await fetch(`${API_BASE}/articles/updatearticle/${id}`, {
    method: 'PUT',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to update article');
  }

  return await response.json();
};


export const deleteArticle = async (id: number): Promise<void> => {
  const response = await fetch(`${API_BASE}/articles/deletearticle/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Failed to delete article");
};

// *******************************
export const fetchCategories = async (): Promise<Categorie[]> => {
  try {
    console.log('Fetching from:', `${API_BASE}/categories/getcategorie`);
    
    const response = await fetch(`${API_BASE}/categories/getcategorie`);
    if (!response.ok) throw new Error("Failed to fetch categories");
    
    const categories = await response.json();
    
    console.log('Frontend received categories:', categories);
    
    return categories.map((category: any) => ({
      ...category,
      parent_id: category.parent_id || null,
      parentName: category.parentName || null, // Use what backend sends
      description: category.description || '',
      createdAt: category.createdAt || new Date().toISOString(),
      updatedAt: category.updatedAt || new Date().toISOString()
    }));
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

export const createCategorie = async (formData: FormData): Promise<Categorie> => {
  console.log('Sending FormData to backend...');
  
  // Debug: Check FormData contents
  for (const [key, value] of (formData as any).entries()) {
    console.log(`🔍 ${key}:`, value);
  }

  const response = await fetch(`${API_BASE}/categories/addcategorie`, {
    method: "POST",
    body: formData,
    // Don't set Content-Type header - let browser set it with boundary
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Backend error:', errorText);
    throw new Error("Échec de la création de la catégorie");
  }
  
  return response.json();
};

export const updateCategorie = async (id: number, formData: FormData): Promise<Categorie> => {
  console.log('Sending update FormData to backend...');
  
  // Debug: Check FormData contents
  for (const [key, value] of (formData as any).entries()) {
    console.log(`🔍 ${key}:`, value);
  }

  const response = await fetch(`${API_BASE}/categories/updatecategorie/${id}`, {
    method: "PUT",
    body: formData,
    // Don't set Content-Type header - let browser set it with boundary
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Backend error:', errorText);
    throw new Error("Échec de la mise à jour de la catégorie");
  }
  
  return response.json();
};

export const deleteCategorie = async (id: number): Promise<void> => {
  const response = await fetch(`${API_BASE}/categories/deletecategorie/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Échec de la suppression de la catégorie");
};


// ******************************* //

export const fetchFournisseurs = async (): Promise<Fournisseur[]> => {
  const response = await fetch(`${API_BASE}/fournisseurs/getfournisseur`);
  if (!response.ok) throw new Error("Failed to fetch fournisseurs");
  return response.json();
};


export const createFournisseur = async (fournisseur: Omit<Fournisseur, "id" | "createdAt" | "updatedAt">): Promise<Fournisseur> => {
  const response = await fetch(`${API_BASE}/fournisseurs/addfournisseur`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(fournisseur),
  });
  if (!response.ok) throw new Error("Échec de la création du fournisseur");
  return response.json();
};

export const updateFournisseur = async (id: number, fournisseur: Partial<Fournisseur>): Promise<Fournisseur> => {
  const response = await fetch(`${API_BASE}/fournisseurs/updateFournisseur/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(fournisseur),
  });
  if (!response.ok) throw new Error("Échec de la mise à jour du fournisseur");
  return response.json();
};

export const deleteFournisseur = async (id: number): Promise<void> => {
  const response = await fetch(`${API_BASE}/fournisseurs/deletefournisseur/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Échec de la suppression du fournisseur");
};


// *******************************

// Clients CRUD
export const fetchClients = async (): Promise<Client[]> => {
  const response = await fetch(`${API_BASE}/clients/getclient`);
  if (!response.ok) throw new Error("Échec du chargement des clients");
  return response.json();
};

export const createClient = async (client: Omit<Client, "id" | "createdAt" | "updatedAt">): Promise<Client> => {
  const response = await fetch(`${API_BASE}/clients/addclient`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(client),
  });
  if (!response.ok) throw new Error("Échec de la création du client");
  return response.json();
};

export const updateClient = async (id: number, client: Partial<Client>): Promise<Client> => {
  const response = await fetch(`${API_BASE}/clients/updateclient/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(client),
  });
  if (!response.ok) throw new Error("Échec de la mise à jour du client");
  return response.json();
};

export const deleteClient = async (id: number): Promise<void> => {
  const response = await fetch(`${API_BASE}/clients/deleteclient/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Échec de la suppression du client");
};



export const fetchVendeurs = async (): Promise<Vendeur[]> => {
    try {
        const response = await fetch(`${API_BASE}/vendeurs/getvendeur`);
        if (!response.ok) {
            throw new Error('Failed to fetch vendeurs');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching vendeurs:', error);
        throw error;
    }
};



export const createVendeur = async (client: Omit<Vendeur, "id" | "createdAt" | "updatedAt">): Promise<Client> => {
    const response = await fetch(`${API_BASE}/vendeurs/addvendeur`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(client),
    });
    if (!response.ok) throw new Error("Échec de la création du vendeur");
    return response.json();
};

export const updateVendeur = async (id: number, client: Partial<Vendeur>): Promise<Client> => {
    const response = await fetch(`${API_BASE}/vendeurs/updatevendeur/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(client),
    });
    if (!response.ok) throw new Error("Échec de la mise à jour du vendeur");
    return response.json();
};

export const deleteVendeur = async (id: number): Promise<void> => {
  debugger
    const response = await fetch(`${API_BASE}/vendeurs/deletevendeur/${id}`, {
        method: "DELETE",
    });
    if (!response.ok) throw new Error("Échec de la suppression du vendeur");
};