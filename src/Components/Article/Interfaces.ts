export interface Depot {
  id: number;
  nom: string;
  description?: string | null;
  created_at: string;
  updated_at: string;
}

export interface FactureClient {
  id: number;
  bonCommandePaiementsTotal: number;
  exoneration: string;
  bonCommandeClient_id?: number;
  bonCommandeClient?: BonCommandeClient;
  venteComptoire?: BonCommandeClient;
    depot_id: number;
  depot?: Depot;
  numeroFacture: string;
  conditionPaiement: string;
  timbreFiscal: boolean
  dateFacture: string;
  bonCommandePaiements: PaiementClient[]
  dateEcheance?: string;
  status: "Brouillon" | "Validee" | "Payee" | "Annulee" | "Partiellement Payee";
  conditions: "Net à réception" | "30 jours" | "60 jours" | "90 jours" | "Personnalisé";
  client: Client;
  vendeur?: Vendeur;
  bonLivraison?: BonLivraison;
  articles: FactureClientArticle[];
  modeReglement: "Espece" | "Cheque" | "Virement" | "Traite" | "Autre";
  totalHT: number;
  totalTVA: number;
  totalTTC: number;
  client_id: number;
  notes?: string;
  remise: number;
  remiseType?: "percentage" | "fixed";
  montantPaye: number;
  resteAPayer: number;
  hasRetenue: boolean;
  montantRetenue: number;
  totalTTCAfterRemise: number;
  paymentMethods?: Array<{
    id: string;
    method: "especes" | "cheque" | "virement" | "traite" | "retenue";
    amount: number;
    numero?: string;
    banque?: string;
    dateEcheance?: string;
  }>;
  totalPaymentAmount?: number;
  createdAt: string;

  updatedAt: string;
}
export interface Client {
  id: number;
  raison_sociale: string; //
  designation?: string;
  matricule_fiscal: string; //
  register_commerce: string;
  adresse: string; //
  ville: string;
  code_postal: string;
  telephone1: string; //
  telephone2?: string;
  email: string;
  status: "Actif" | "Inactif";
  createdAt?: string;
  updatedAt?: string;

}
export interface Article {
  on_website?: boolean;
  is_offre?: boolean;
  is_top_seller?: boolean;
  is_new_arrival?: boolean;
  website_description?: string;
  website_images?: string[];
  website_order?: number;
  code_barre: string;
  code_barre_1: string;
  code_barre_2: string; // AJOUTER CETTE LIGNE
  code_barres: string[]; // Array of barcodes
  remise: number;
  id: number;
  categorie?: Categorie;
  sousCategorie?: Categorie;
  reference: string;
  nom: string;
  image: string;
  qte: number;
  designation: string;
  pua_ttc: number;
  puv_ttc: number;
  puv_ht: number;
  createdAt: Date;
  taux_fodec: boolean;
  fournisseur: Fournisseur;
  type: 'Consigné' | 'Non Consigné';
  tva?: number; // Add this if missing
  pua_ht: number; // Add this if missing

}
export interface Vendeur {
  id: number;
  nom: string;
  prenom: string;
  telephone?: string;
  email?: string;
  commission?: number;
  createdAt?: string;
  updated_at?: string;
}
// In your interfaces file
export interface ClientWebsite {
  id: number;
  nomPrenom: string;
  telephone: string;
  email?: string;
  adresse: string;
  ville?: string;
  code_postal?: string;
  created_at: string;
}


export interface Categorie {
  id: number;
  nom: string;
  description?: string;
  parent_id?: number | null;
  createdAt: string;
  updatedAt: string;
  image?: string;
  on_website?: boolean;
  website_order?: number;
  // Relations (optional - might not come from API)
  parent?: Categorie | null;
  subcategories?: Categorie[];
  parentName?: string | null; // For display purposes
}

export interface Fournisseur {
  id: number;
  raison_sociale: string;
  designation?: string;
  matricule_fiscal: string;
  register_commerce: string;
  adresse: string;
  ville: string;
  code_postal: string;
  telephone1: string;
  telephone2?: string;
  email: string;
  code_barre_fournisseur?: string;
  status: "Actif" | "Inactif";
  createdAt?: string;
  updatedAt?: string;
}




// interfaces.ts
export interface BonCommande {
  remiseType: string;
  id: number;
  numeroCommande: string;
  dateCommande: string;
  status: "Brouillon" | "Confirme" | "Recu" | "Annule" | "Partiellement Recu";
  remise: number;
  notes?: string;
  fournisseur: Fournisseur;
  articles: BonCommandeArticle[];
  createdAt: string;
  taxMode: "HT" | "TTC"; // Add this if missing
  updatedAt: string;
  montant_fodec: number;

}

export interface BonCommandeArticle {
  id: number;
  quantite: number;
  prixUnitaire: number;
  tva?: number | null;  // Optional TVA
  remise?: number | null;
  taux_fodec: boolean,// Optional Remise
  article: Article;
  bonCommande?: BonCommande;
}

export interface BonReception {
  totalTVA: any;
  totalTTC: any;
  remiseType: "percentage" | "fixed";
  totalHT: any;
  id: number;
    depot_id: number;
  depot?: Depot;
  numeroReception: string;
  dateReception: string;
  status: "Brouillon" | "Recu" | "Partiellement Recu" | "Annule";
  remise: number;
  notes?: string;
  fournisseur: Fournisseur;
  articles: BonReceptionArticle[];
  createdAt: string;
  taxMode: "HT" | "TTC";
  updatedAt: string;
}

export interface BonReceptionArticle {
  id: number;
  quantite: number;
  quantiteRecue: number;
  prixUnitaire: number;
  tva?: number | null;
  remise?: number | null;
  article: Article;
  bonReception?: BonReception;
}





export interface BonLivraisonArticle {
  article_id: number;
  prix_ttc: number;
  article?: Article;
  quantite: number;
  designation?: string;
  quantiteLivree: number;
  prix_unitaire: number;
  tva?: number | null;
  remise?: number | null;
}

export interface BonLivraison {
  id: number;
  numeroLivraison: string;
    depot_id: number;
  depot?: Depot;
  dateLivraison: string;
  client?: Client;
  vendeur?: Vendeur;
  bonCommandeClient?: BonCommandeClient;
  status: "Brouillon" | "Livree" | "Partiellement Livree" | "Annulee";
  notes?: string;
  taxMode: "HT" | "TTC";
  remise: number;
  remiseType: "percentage" | "fixed";
  articles: BonLivraisonArticle[];
  createdAt?: string;
  updatedAt?: string;

  chauffeur?: string;
  cin?: string;
  voiture?: string;
  serie?: string;
  totalHT: number;
  totalTVA: number;
  totalTTC: number;
  totalTTCAfterRemise: number;
  montantPaye: number;
  resteAPayer: number;
  hasPayments: boolean;
  totalPaymentAmount: number;
  hasRetenue: boolean;
  montantRetenue: number;
  paymentMethods?: any[];
  espaceNotes?: string;
  paiements?: PaiementClient[];
}



// Add to your existing interfaces
export interface PaiementClient {
  id: number;
  montant: number;
  modePaiement: "Espece" | "Cheque" | "Virement" | "Traite" | "Autre" | "Retention";
  numeroPaiement: string;
  date: string;
  bonCommandeClient_id?: number | null;
  bonLivraison_id?: number | null;
  client_id: number;
  notes?: string;
  numeroCheque?: string;
  banque?: string;
  numeroTraite?: string;
  dateEcheance?: string;
  createdAt?: string;
  updatedAt?: string;
  bonCommandeClient?: BonCommandeClient;
  bonLivraison?: BonLivraison;
  client?: Client;
}

// Update BonCommandeClient interface to include payment info
export interface BonCommandeClient {
  id: number;
  depot_id: number;
  depot?: Depot;
  numeroCommande: string;
  clientWebsite?: ClientWebsite;
  dateCommande: string;
  dateLivBonCommande: string;
  status: "Brouillon" | "Confirme" | "Livre" | "Partiellement Livre" | "Annule";
  taxMode: "HT" | "TTC";
  remise: number;
  remiseType: "percentage" | "fixed";
  notes?: string;
  created_at?: string;
  updated_at?: string;

  client_id: number;
  vendeur_id: number;
  acompte?: number;
  client?: Client;
  hasRetenue: boolean;
  montantRetenue: number;
  vendeur?: Vendeur;
  totalTTC: number;
  totalTTCAfterRemise: number;
  totalAfterRemise: number;
  totalHT: number;
  modeReglement: "especes" | "cheque" | "virement" | "carte" | "traite" | "autre";
  numeroReglement?: string;
  dateEcheance?: string;
  banqueCheque?: string;
  espaceNotes?: string;
  montantVirement?: number;
  retentionAppliquee?: boolean;
  retentionMontant?: number;
  netAPayer?: number;
  // Add payment fields
  montantPaye: number;
  resteAPayer: number;
  hasPayments: boolean;
  articles: Array<{
    article_id: number;
    quantite: number;
    quantiteLivree: number;
    prixUnitaire: number;
    puv_ttc: number;
    prix_ttc: number;
    designation?: string; // Add this line
    tva?: number;
    remise?: number;
    article?: Article;
  }>;

  modePaiement?: "especes" | "cheque" | "virement" | "traite" | "autre";
  numeroPaiement?: string;
  banque?: string;
  notesPaiement?: string;

  paiements?: PaiementClient[];
  paymentMethods?: Array<{
    id: string;
    method: "especes" | "cheque" | "virement" | "traite";
    amount: number;
    numero?: string;
    banque?: string;
    dateEcheance?: string;
  }>;
  totalPaymentAmount?: number;

}

export interface FactureFournisseur {
  id: number;
  fournisseur_id: number,
  conditionPaiement: string;
  timbreFiscal: boolean
  numeroFacture: string;
  dateFacture: string;
  status: "Brouillon" | "Validee" | "Annulee" | "Payee" | "Partiellement Payee";
  totalHT: number;
  totalTVA: number;
  totalTTC: number;
  notes?: string;
  modeReglement?: "Espece" | "Cheque" | "Virement" | "Traite" | "Autre";
  dateEcheance?: string;
  montantPaye: number;
  resteAPayer: number;
  createdAt: string;
  remise: number;
  updatedAt: string;
  remiseType: string;
  fournisseur?: Fournisseur;
  bonReception?: BonReception;
  articles: Array<{
    article: Article;
    quantite: number;
    prixUnitaire: number;
    tva?: number | null;
    remise?: number | null;
    prix_ttc: number;
  }>;
}


export interface Payment {
  id: number;
  facture_id: number;
  montant: number;
  modePaiement: string;
  numeroPaiement: string;
  factureFournisseur?: FactureFournisseur;
  date: string;
  fournisseur: Fournisseur;
  fournisseur_id: number;


}

export interface FactureClientArticle {
  id: number;
  article: Article;
  quantite: number;
  prixUnitaire: number;
  designation: string; // ADD THIS
  prix_ttc: number;
  tva?: number;
  remise?: number;
}



export interface EncaissementClient {
  id: number;
  montant: number;
  modePaiement: string;
  numeroEncaissement: string;
  date: string; // ISO date string (e.g., "2025-09-21")
  createdAt?: string;
  updatedAt?: string;
  facture_id: number;
  client_id: number
  client?: Client;
  factureClient: FactureClient
  numeroCheque?: string;
  banque?: string;
  numeroTraite?: string;
  dateEcheance?: string;
  client_passager?: { // For passager clients
    raison_sociale: string;
    telephone: string;
    adresse?: string;
    ville?: string;
  };

}

