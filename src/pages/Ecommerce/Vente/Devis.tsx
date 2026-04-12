import React, {
  Fragment,
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
} from "react";
import {
  Card,
  CardBody,
  Col,
  Container,
  CardHeader,
  Row,
  Modal,
  ModalHeader,
  Nav,
  NavItem,
  NavLink,
  Form,
  ModalBody,
  ModalFooter,
  Label,
  Input,
  FormFeedback,
  Badge,
  Table,
  Button,
  InputGroupText,
  InputGroup,
  FormGroup,
} from "reactstrap";
import { Link } from "react-router-dom";
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import TableContainer from "../../../Components/Common/TableContainer";
import DeleteModal from "../../../Components/Common/DeleteModal";
import Loader from "../../../Components/Common/Loader";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import * as Yup from "yup";
import { useFormik } from "formik";
import moment from "moment";
import Flatpickr from "react-flatpickr";
import {
  fetchDevis,
  createDevis,
  updateDevis,
  deleteDevis,
  createBonCommandeClientBasedOnDevis,
  fetchNextCommandeNumber,
} from "../../../Components/CommandeClient/CommandeClientServices";
import {
  fetchArticles,
  fetchClients,
  fetchVendeurs,
  fetchFournisseurs,
  fetchCategories,
  createArticle,
  createClient,
  searchArticles,
  searchClients,
} from "../../../Components/Article/ArticleServices";
import {
  Article,
  Client,
  Vendeur,
  BonCommandeClient,
  Fournisseur,
  Categorie,
  Depot,
} from "../../../Components/Article/Interfaces";
import classnames from "classnames";
import { PDFDownloadLink } from "@react-pdf/renderer";
import DevisPDFModal from "./DevisPDFModal"; // Import the modal
import logo from "../../../assets/images/imglogo.png";
import "./InvoiceModal.css";
import "./ArticleTableStyles.css"; // Import unified table styles
import { useProfile } from "Components/Hooks/UserHooks";
import { fetchDepots } from "../Stock/DepotServices";
import EditClientModal from "./EditClientModal";
import DiscountAlertModal from "../../../Components/Common/DiscountAlertModal";

const Devis = () => {
  const [detailModal, setDetailModal] = useState(false);
  const [selectedBonCommande, setSelectedBonCommande] =
    useState<BonCommandeClient | null>(null);
  const [taxMode, setTaxMode] = useState<"HT" | "TTC">("HT");
  // PDF Modal State
  const [pdfModal, setPdfModal] = useState(false);
  const [selectedPdfDevis, setSelectedPdfDevis] = useState<BonCommandeClient | null>(null);

  const [activeTab, setActiveTab] = useState("1");
  const [modal, setModal] = useState(false);
  const [bonsCommande, setBonsCommande] = useState<BonCommandeClient[]>([]);
  const [filteredBonsCommande, setFilteredBonsCommande] = useState<
    BonCommandeClient[]
  >([]);
  const [bonCommande, setBonCommande] = useState<BonCommandeClient | null>(
    null
  );
  const [clients, setClients] = useState<Client[]>([]);
  const [vendeurs, setVendeurs] = useState<Vendeur[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [isEdit, setIsEdit] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [searchText, setSearchText] = useState("");
  const [articleSearch, setArticleSearch] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [showRemise, setShowRemise] = useState(false);
  // Ajoutez ces états au début de votre composant
  const [barcodeInput, setBarcodeInput] = useState("");
  const [scanningTimeout, setScanningTimeout] = useState<NodeJS.Timeout | null>(
    null
  );
  const [lastKeyPressTime, setLastKeyPressTime] = useState<number>(0);
  const [phoneSearch, setPhoneSearch] = useState("");

  const [selectedDepot, setSelectedDepot] = useState<Depot | null>(null);


  const articleSearchRef = useRef<HTMLInputElement>(null);
  const { userProfile } = useProfile();

  // Add near your other state declarations
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [dropdownRef, setDropdownRef] = useState<HTMLDivElement | null>(null);
  const [itemRefs, setItemRefs] = useState<React.RefObject<HTMLLIElement>[]>(
    []
  );


  // Ajoutez ces états près de vos autres déclarations d'état
  const [depots, setDepots] = useState<Depot[]>([]);

  // Ajoutez cette fonction pour charger les dépôts

  const [editClientModal, setEditClientModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [showDiscountAlert, setShowDiscountAlert] = useState(false);
  const [isDiscountConfirmed, setIsDiscountConfirmed] = useState(false);

  const companyInfo = useMemo(
    () => ({
      name: userProfile?.company_name || "Votre Société",
      address: userProfile?.company_address || "Adresse",
      city: userProfile?.company_city || "Ville",
      phone: userProfile?.company_phone || "Téléphone",
      gsm: userProfile?.company_gsm || "Téléphone",
      email: userProfile?.company_email || "Email",
      website: userProfile?.company_website || "Site web",
      taxId: userProfile?.company_tax_id || "MF",
      logo: logo,
    }),
    [userProfile]
  );
  const [selectedArticles, setSelectedArticles] = useState<
    {
      article_id: number;
      quantite: number | "";
      prixUnitaire: number;
      prixTTC: number; // Keep this
      tva?: number | null;
      remise?: number | null;
      designation?: string; // Add this field
      articleDetails?: Article;
    }[]
  >([]);
  // Add these states to your devis page component
  const [clientModal, setClientModal] = useState(false);
  const [articleModal, setArticleModal] = useState(false);
  const [newClient, setNewClient] = useState({
    raison_sociale: "",
    designation: "",
    matricule_fiscal: "",
    register_commerce: "",
    adresse: "",
    ville: "",
    code_postal: "",
    telephone1: "",
    telephone2: "",
    email: "",
    status: "Actif" as "Actif" | "Inactif",
  });


  const [newArticle, setNewArticle] = useState({
    reference: "",
    code_barre: "",
    nom: "",
    designation: "",
    puv_ht: "",
    puv_ttc: "",
    pua_ht: "",
    pua_ttc: "",
    qte: "",
    tva: "19",
    remise: "0",
    taux_fodec: false,
    type: "Non Consigné",
    image: "",
    on_website: false,
    is_offre: false,
    is_top_seller: false,
    is_new_arrival: false,
    website_description: "",
    website_images: [],
    website_order: 0,
    categorie_id: "",
    sous_categorie_id: "",
    fournisseur_id: "",
  });



  // 2. Fonction de formatage
  // === FONCTIONS DE CALCUL TVA/FODEC TUNISIEN ===
  const parseNumber = (value: string | number): number => {
    if (value === null || value === undefined || value === "") return 0;
    const strValue = String(value).replace(/[^\d.,]/g, '').replace(',', '.');
    const num = parseFloat(strValue);
    return isNaN(num) ? 0 : Math.round(num * 100000) / 100000; // 5 décimales pour précision
  };

  // Formatage avec 3 décimales
  const formatNumber = (value: number): string => {
    if (value === 0) return "";
    return (Math.round(value * 1000) / 1000).toFixed(3).replace('.', ',');
  };

  // === CALCUL TTC AVEC FODEC (Norme tunisienne) ===
  // Formule : TTC = HT × 1.01 × (1 + TVA/100)
  const calculateTTCFromHT = (ht: number, tva: number, hasFodec: boolean): number => {
    const htValue = parseNumber(ht);
    const tvaRate = parseNumber(tva);

    // Si pas de TVA ni FODEC
    if (tvaRate === 0 && !hasFodec) return htValue;

    // Calcul selon norme tunisienne
    let baseTTC = htValue;

    // 1. Ajouter FODEC (1%) au HT si applicable
    if (hasFodec) {
      baseTTC = htValue * 1.01;
    }

    // 2. Ajouter TVA sur la base (HT + FODEC)
    if (tvaRate > 0) {
      baseTTC = baseTTC * (1 + tvaRate / 100);
    }

    return Math.round(baseTTC * 1000) / 1000;
  };

  // === CALCUL HT À PARTIR DE TTC (Norme tunisienne) ===
  // Formule inverse : HT = TTC / (1.01 × (1 + TVA/100))
  const calculateHTFromTTC = (ttc: number, tva: number, hasFodec: boolean): number => {
    const ttcValue = parseNumber(ttc);
    const tvaRate = parseNumber(tva);

    // Si pas de TVA ni FODEC
    if (tvaRate === 0 && !hasFodec) return ttcValue;

    // Facteur total
    let factor = 1;

    if (hasFodec) {
      factor *= 1.01;
    }

    if (tvaRate > 0) {
      factor *= (1 + tvaRate / 100);
    }

    const ht = ttcValue / factor;
    return Math.round(ht * 1000) / 1000;
  };

  // === FACTEUR MULTIPLICATEUR POUR AFFICHAGE ===
  // === FACTEUR MULTIPLICATEUR POUR AFFICHAGE ===

  // 6. Effet pour recalculer quand TVA ou FODEC change
  useEffect(() => {
    const tva = parseNumber(newArticle.tva);
    const hasFodec = newArticle.taux_fodec;

    // Recalculer les TTC à partir des HT existants
    if (newArticle.pua_ht) {
      const ht = parseNumber(newArticle.pua_ht);
      const ttc = calculateTTCFromHT(ht, tva, hasFodec);
      setNewArticle(prev => ({ ...prev, pua_ttc: formatNumber(ttc) }));
    }

    if (newArticle.puv_ht) {
      const ht = parseNumber(newArticle.puv_ht);
      const ttc = calculateTTCFromHT(ht, tva, hasFodec);
      setNewArticle(prev => ({ ...prev, puv_ttc: formatNumber(ttc) }));
    }

    // Si pas de HT mais TTC existe, recalculer HT
    if (newArticle.pua_ttc && !newArticle.pua_ht) {
      const ttc = parseNumber(newArticle.pua_ttc);
      const ht = calculateHTFromTTC(ttc, tva, hasFodec);
      setNewArticle(prev => ({ ...prev, pua_ht: formatNumber(ht) }));
    }

    if (newArticle.puv_ttc && !newArticle.puv_ht) {
      const ttc = parseNumber(newArticle.puv_ttc);
      const ht = calculateHTFromTTC(ttc, tva, hasFodec);
      setNewArticle(prev => ({ ...prev, puv_ht: formatNumber(ht) }));
    }
  }, [newArticle.tva, newArticle.taux_fodec]);


  const handleTVAChange = (value: string) => {
    const oldTva = parseNumber(newArticle.tva);
    const newTva = parseNumber(value);
    const hasFodec = newArticle.taux_fodec;

    setNewArticle(prev => ({ ...prev, tva: value }));

    // Recalculer tous les TTC à partir des HT
    setTimeout(() => {
      if (newArticle.pua_ht) {
        const ht = parseNumber(newArticle.pua_ht);
        const ttc = calculateTTCFromHT(ht, newTva, hasFodec);
        setNewArticle(prev => ({ ...prev, pua_ttc: formatNumber(ttc) }));
      }

      if (newArticle.puv_ht) {
        const ht = parseNumber(newArticle.puv_ht);
        const ttc = calculateTTCFromHT(ht, newTva, hasFodec);
        setNewArticle(prev => ({ ...prev, puv_ttc: formatNumber(ttc) }));
      }
    }, 10);
  };

  // Gestionnaire pour FODEC - recalculer tous les prix
  const handleFodecChange = (checked: boolean) => {
    const tva = parseNumber(newArticle.tva);

    setNewArticle(prev => ({ ...prev, taux_fodec: checked }));

    // Recalculer tous les TTC à partir des HT
    setTimeout(() => {
      if (newArticle.pua_ht) {
        const ht = parseNumber(newArticle.pua_ht);
        const ttc = calculateTTCFromHT(ht, tva, checked);
        setNewArticle(prev => ({ ...prev, pua_ttc: formatNumber(ttc) }));
      }

      if (newArticle.puv_ht) {
        const ht = parseNumber(newArticle.puv_ht);
        const ttc = calculateTTCFromHT(ht, tva, checked);
        setNewArticle(prev => ({ ...prev, puv_ttc: formatNumber(ttc) }));
      }
    }, 10);
  };



  const handleEditClient = (client: Client, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setEditingClient(client);
    setEditClientModal(true);
  };



  // Effet pour garantir que tous les prix sont synchronisés
  useEffect(() => {
    const tva = parseNumber(newArticle.tva);
    const hasFodec = newArticle.taux_fodec;

    // Recalculer TTC si HT existe
    if (newArticle.pua_ht && !newArticle.pua_ttc) {
      const ht = parseNumber(newArticle.pua_ht);
      const ttc = calculateTTCFromHT(ht, tva, hasFodec);
      setNewArticle(prev => ({ ...prev, pua_ttc: formatNumber(ttc) }));
    }

    if (newArticle.puv_ht && !newArticle.puv_ttc) {
      const ht = parseNumber(newArticle.puv_ht);
      const ttc = calculateTTCFromHT(ht, tva, hasFodec);
      setNewArticle(prev => ({ ...prev, puv_ttc: formatNumber(ttc) }));
    }

    // Recalculer HT si TTC existe
    if (newArticle.pua_ttc && !newArticle.pua_ht) {
      const ttc = parseNumber(newArticle.pua_ttc);
      const ht = calculateHTFromTTC(ttc, tva, hasFodec);
      setNewArticle(prev => ({ ...prev, pua_ht: formatNumber(ht) }));
    }

    if (newArticle.puv_ttc && !newArticle.puv_ht) {
      const ttc = parseNumber(newArticle.puv_ttc);
      const ht = calculateHTFromTTC(ttc, tva, hasFodec);
      setNewArticle(prev => ({ ...prev, puv_ht: formatNumber(ht) }));
    }
  }, [newArticle.tva, newArticle.taux_fodec]);
  // Gestionnaire unifié pour les changements de prix
  const handlePriceChange = (field: keyof typeof newArticle, value: string) => {
    const newValue = value.replace(',', '.');
    const tva = parseNumber(newArticle.tva);
    const hasFodec = newArticle.taux_fodec;

    // Mettre à jour la valeur
    setNewArticle(prev => ({ ...prev, [field]: newValue }));

    // Calculs automatiques basés sur le champ modifié
    switch (field) {
      case 'pua_ht': {
        const ht = parseNumber(newValue);
        const ttc = calculateTTCFromHT(ht, tva, hasFodec);
        setNewArticle(prev => ({ ...prev, pua_ttc: formatNumber(ttc) }));
        break;
      }
      case 'pua_ttc': {
        const ttc = parseNumber(newValue);
        const ht = calculateHTFromTTC(ttc, tva, hasFodec);
        setNewArticle(prev => ({ ...prev, pua_ht: formatNumber(ht) }));
        break;
      }
      case 'puv_ht': {
        const ht = parseNumber(newValue);
        const ttc = calculateTTCFromHT(ht, tva, hasFodec);
        setNewArticle(prev => ({ ...prev, puv_ttc: formatNumber(ttc) }));
        break;
      }
      case 'puv_ttc': {
        const ttc = parseNumber(newValue);
        const ht = calculateHTFromTTC(ttc, tva, hasFodec);
        setNewArticle(prev => ({ ...prev, puv_ht: formatNumber(ht) }));
        break;
      }
    }
  };



  // Gestionnaire pour FODEC - recalculer tous les prix

  // Add categories and fournisseurs states if not already present
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [subcategories, setSubcategories] = useState<Categorie[]>([]);
  // Add ref for article search input
  // Phone formatting function

  // Add these states near your other state declarations
  const [secondaryLoading, setSecondaryLoading] = useState(false);
  const [articlesLoading, setArticlesLoading] = useState(false);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  // Add these functions to your devis page component
  const handleCreateClient = async () => {
    try {
      // Create the client
      const createdClient = await createClient(newClient);
      toast.success("Client créé avec succès");

      // Refresh clients list
      const clientsData = await fetchClients();
      setClients(clientsData);

      // Find the newly created client in the refreshed list
      const newClientData = clientsData.find(
        (client) => client.id === createdClient.id
      );

      if (newClientData) {
        // Auto-select the new client
        setSelectedClient(newClientData);
        validation.setFieldValue("client_id", newClientData.id);
      }

      // Close modal and reset form
      setClientModal(false);
      setNewClient({
        raison_sociale: "",
        designation: "",
        matricule_fiscal: "",
        register_commerce: "",
        adresse: "",
        ville: "",
        code_postal: "",
        telephone1: "",
        telephone2: "",
        email: "",
        status: "Actif" as "Actif" | "Inactif",
      });
    } catch (err) {
      console.error("Error creating client:", err);
      toast.error("Erreur lors de la création du client");
    }
  };

  // Modifiez handleCreateArticle pour ne pas générer en front
  const handleCreateArticle = async () => {
    try {
      const articleToCreate = {
        ...newArticle,
        // NE PAS générer code_barre ici - la DB s'en chargera
        puv_ht: parseNumber(newArticle.puv_ht),
        puv_ttc: parseNumber(newArticle.puv_ttc),
        pua_ht: parseNumber(newArticle.pua_ht),
        pua_ttc: parseNumber(newArticle.pua_ttc),
        qte: parseNumber(newArticle.qte),
        tva: parseNumber(newArticle.tva),

        categorie_id: newArticle.categorie_id
          ? Number(newArticle.categorie_id)
          : null,
        sous_categorie_id: newArticle.sous_categorie_id
          ? Number(newArticle.sous_categorie_id)
          : null,
        fournisseur_id: newArticle.fournisseur_id
          ? Number(newArticle.fournisseur_id)
          : null,
      };

      await createArticle(articleToCreate);
      toast.success("Article créé avec succès");
      setArticleModal(false);
      setNewArticle({
        reference: "",
        code_barre: "", // Toujours vide par défaut
        nom: "",
        designation: "",
        puv_ht: "",
        puv_ttc: "",
        pua_ht: "",
        pua_ttc: "",
        qte: "",
        tva: "",
        remise: "",
        taux_fodec: false,
        type: "Non Consigné",
        image: "",
        on_website: false,
        is_offre: false,
        is_top_seller: false,
        is_new_arrival: false,
        website_description: "",
        website_images: [],
        website_order: 0,
        categorie_id: "",
        sous_categorie_id: "",
        fournisseur_id: "",
      });

      // Refresh articles list pour récupérer le code-barres généré
      const articlesData = await fetchArticles();
      setArticles(articlesData);
    } catch (err) {
      toast.error("Erreur création article");
    }
  };




  const [remiseType, setRemiseType] = useState<"percentage" | "fixed">(
    "percentage"
  );
  const [globalRemise, setGlobalRemise] = useState<number>(0);
  const [isCreatingCommande, setIsCreatingCommande] = useState(false);
  const [nextNumeroCommande, setNextNumeroCommande] = useState("");
  const [editingTTC, setEditingTTC] = useState<{ [key: number]: string }>({});
  const [editingHT, setEditingHT] = useState<{ [key: number]: string }>({});
  const tvaOptions = [
    { value: null, label: "Non applicable" },
    { value: 0, label: "0% (Exonéré)" },
    { value: 7, label: "7%" },
    { value: 10, label: "10%" },
    { value: 13, label: "13%" },
    { value: 19, label: "19%" },
    { value: 21, label: "21%" },
  ];

  const generateNextNumber = (
    bonsCommande: BonCommandeClient[],
    currentYear: string,
    type: "devis" | "bonCommande"
  ) => {
    const prefix = type === "devis" ? "DEVIS" : "BC";
    const regex = new RegExp(`^${prefix}-(\\d{3})/${currentYear}$`);

    // Pour les devis, commencer à 001
    // Pour les bons de commande, commencer à 150
    const DEFAULT_START = type === "devis" ? 1 : 150;

    // Filter only entries for this prefix
    const relevantBons = bonsCommande.filter((bon) =>
      bon.numeroCommande.startsWith(`${prefix}-`)
    );

    // Extract numbers for current year
    const numbers = relevantBons
      .map((bon) => {
        const match = bon.numeroCommande.match(regex);
        return match ? parseInt(match[1], 10) : null;
      })
      .filter((num): num is number => num !== null);

    // Trouver le prochain numéro
    let nextSequence = DEFAULT_START;

    if (numbers.length > 0) {
      const maxNumber = Math.max(...numbers);
      nextSequence = maxNumber + 1;
    }

    // Formater avec 3 chiffres (001, 002, etc.)
    return `${prefix}-${nextSequence
      .toString()
      .padStart(3, "0")}/${currentYear}`;
  };
  const fetchNextCommandeNumberFromAPI = useCallback(async () => {
    try {
      const numero = await fetchNextCommandeNumber();
      setNextNumeroCommande(numero);
    } catch (err) {
      toast.error("Échec de la récupération du numéro de commande");
      setNextNumeroCommande(
        generateNextNumber(bonsCommande, moment().format("YYYY"), "bonCommande")
      );
    }
  }, [bonsCommande]);


  const formatPhoneInput = (value: string): string => {
    // Remove all non-digit characters
    const cleaned = value.replace(/\D/g, "");

    // Limit to 8 digits (Tunisian phone number length)
    const limited = cleaned.slice(0, 8);

    // Format as XX XXX XXX
    if (limited.length <= 2) {
      return limited;
    } else if (limited.length <= 5) {
      return `${limited.substring(0, 2)} ${limited.substring(2)}`;
    } else {
      return `${limited.substring(0, 2)} ${limited.substring(
        2,
        5
      )} ${limited.substring(5, 8)}`;
    }
  };



  // Display formatting function
  const formatPhoneDisplay = (phone: string | null | undefined): string => {
    if (!phone) return "N/A";

    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length === 8) {
      return `${cleanPhone.substring(0, 2)} ${cleanPhone.substring(
        2,
        5
      )} ${cleanPhone.substring(5, 8)}`;
    }
    return phone;
  };


  useEffect(() => {
    if (modal && !isEdit && isCreatingCommande) {
      fetchNextCommandeNumberFromAPI();
    }
  }, [modal, isEdit, isCreatingCommande, fetchNextCommandeNumberFromAPI]);



  // Fix the client search functionality
  // Also add this helper function for better phone display

  const fetchData = useCallback(async (skipSecondary = false) => {
    try {
      setLoading(true);

      // PHASE 1: Load critical data only
      const [bonsData, vendeursData] = await Promise.all([
        fetchDevis(), // This should be your devis fetching function
        fetchVendeurs(),
      ]);

      setBonsCommande(bonsData);
      setFilteredBonsCommande(bonsData);
      setVendeurs(vendeursData);

      // PHASE 2: Load secondary data only if not skipped
      if (!skipSecondary) {
        setSecondaryLoading(true);

        try {
          // Load depot first (needed for forms)
          const [depotsData, categoriesData] = await Promise.all([
            fetchDepots(),
            fetchCategories(),
          ]);

          setDepots(depotsData);
          setCategories(categoriesData);

          // Auto-select "magazin" depot if not already selected
          if (depotsData.length > 0 && !selectedDepot) {
            const magazinDepot = depotsData.find(d =>
              d.nom.toLowerCase().includes("magazin")
            );
            if (magazinDepot) {
              setSelectedDepot(magazinDepot);
            }
          }

          // Then load articles and clients in parallel with limit
          const [articlesResult, clientsResult] = await Promise.all([
            searchArticles({ query: "", page: 1, limit: 25 }),
            searchClients({ query: "", page: 1, limit: 25 }),
          ]);

          setArticles(articlesResult.articles || []);
          setFilteredClients(clientsResult.clients || []);
        } catch (secondaryErr) {
          console.error("Secondary data loading failed:", secondaryErr);
          // Continue without secondary data
        } finally {
          setSecondaryLoading(false);
        }
      }

      setLoading(false);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Échec du chargement des données"
      );
      setLoading(false);
      setSecondaryLoading(false);
    }
  }, []);

  // Initial load - only critical data
  useEffect(() => {
    fetchData(true); // true means skip secondary data initially
  }, [fetchData]);

  // Load articles only when needed (modal opens or search)
  const loadArticles = async (query = "", page = 1, limit = 15) => {
    if (modal || articleSearch) {
      setArticlesLoading(true);
      try {
        const result = await searchArticles({ query, page, limit });
        if (query === "" && page === 1) {
          setArticles(result.articles || []);
        }
        setFilteredArticles(result.articles || []);
      } catch (err) {
        console.error("Failed to load articles:", err);
      } finally {
        setArticlesLoading(false);
      }
    }
  };

  // Load clients only when needed
  const loadClients = async (query = "", page = 1, limit = 15) => {
    if (modal || clientSearch) {
      setClientsLoading(true);
      try {
        const result = await searchClients({ query, page, limit });
        if (query === "" && page === 1) {
          setFilteredClients(result.clients || []);
        } else {
          setFilteredClients(result.clients || []);
        }
      } catch (err) {
        console.error("Failed to load clients:", err);
      } finally {
        setClientsLoading(false);
      }
    }
  };

  // Load modal data only when modal opens
  const loadModalData = async () => {
    if (modal) {
      setModalLoading(true);
      try {
        // Load only what's needed for the modal
        const [depotsResult, categoriesResult, fournisseursData] = await Promise.all([
          fetchDepots(),
          fetchCategories(),
          fetchFournisseurs(), // ADD THIS LINE

        ]);

        setDepots(depotsResult);
        setCategories(categoriesResult);

        // Auto-select "magazin" depot if not already selected
        if (depotsResult.length > 0 && !selectedDepot) {
          const magazinDepot = depotsResult.find(d =>
            d.nom.toLowerCase().includes("magazin")
          );
          if (magazinDepot) {
            setSelectedDepot(magazinDepot);
          }
        }
        setFournisseurs(fournisseursData); // ADD THIS LINE


        // Load initial articles and clients for modal
        await Promise.all([
          loadArticles("", 1, 15),
          loadClients("", 1, 15),
        ]);
      } catch (err) {
        console.error("Modal data loading failed:", err);
      } finally {
        setModalLoading(false);
      }
    }
  };

  // Update article search to use the new function
  useEffect(() => {
    const searchArticlesDebounced = async () => {
      if (articleSearch.length >= 3 || modal) {
        await loadArticles(articleSearch, 1, 20);
      } else {
        setFilteredArticles([]);
      }
    };

    const timer = setTimeout(searchArticlesDebounced, 300);
    return () => clearTimeout(timer);
  }, [articleSearch, modal]);

  // Update client search to use the new function
  useEffect(() => {
    const searchClientsDebounced = async () => {
      if (clientSearch.length >= 1 || modal) {
        await loadClients(clientSearch, 1, 20);
      } else {
        setFilteredClients([]);
      }
    };

    const timer = setTimeout(searchClientsDebounced, 300);
    return () => clearTimeout(timer);
  }, [clientSearch, modal]);

  // Load modal data when modal opens
  useEffect(() => {
    if (modal) {
      loadModalData();
    }
  }, [modal]);


  useEffect(() => {
    let result = [...bonsCommande];

    if (startDate && endDate) {
      const start = moment(startDate).startOf("day");
      const end = moment(endDate).endOf("day");
      result = result.filter((bon) => {
        const bonDate = moment(bon.dateCommande);
        return bonDate.isBetween(start, end, null, "[]");
      });
    }

    // Apply regular text search
    if (searchText) {
      const searchLower = searchText.toLowerCase().trim();

      result = result.filter((bon) => {
        const bonNumero = bon.numeroCommande?.toLowerCase() || "";
        const clientName = bon.client?.raison_sociale?.toLowerCase() || "";
        const clientDesignation = bon.client?.designation?.toLowerCase() || "";

        return (
          bonNumero.includes(searchLower) ||
          clientName.includes(searchLower) ||
          clientDesignation.includes(searchLower)
        );
      });
    }

    // Apply phone number search separately
    if (phoneSearch) {
      const cleanPhoneSearch = phoneSearch.replace(/\s/g, "").trim();

      result = result.filter((bon) => {
        if (!bon.client) return false;

        const phone1 = bon.client.telephone1?.replace(/\s/g, "") || "";
        const phone2 = bon.client.telephone2?.replace(/\s/g, "") || "";

        return (
          phone1.includes(cleanPhoneSearch) || phone2.includes(cleanPhoneSearch)
        );
      });
    }

    setFilteredBonsCommande(result);
  }, [startDate, endDate, searchText, phoneSearch, bonsCommande]);

  const openDetailModal = (bonCommande: BonCommandeClient) => {
    setSelectedBonCommande(bonCommande);
    setDetailModal(true);
  };

  // Scroll to focused item
  useEffect(() => {
    if (focusedIndex >= 0 && itemRefs[focusedIndex]?.current && dropdownRef) {
      const item = itemRefs[focusedIndex].current;
      const dropdown = dropdownRef;

      if (item && dropdown) {
        const itemTop = item.offsetTop;
        const itemBottom = itemTop + item.offsetHeight;
        const dropdownTop = dropdown.scrollTop;
        const dropdownBottom = dropdownTop + dropdown.clientHeight;

        if (itemTop < dropdownTop) {
          dropdown.scrollTop = itemTop;
        } else if (itemBottom > dropdownBottom) {
          dropdown.scrollTop = itemBottom - dropdown.clientHeight;
        }
      }
    }
  }, [focusedIndex, dropdownRef, itemRefs]);

  // Reset item refs when filtered articles change
  useEffect(() => {
    setItemRefs(filteredArticles.map(() => React.createRef()));
    setFocusedIndex(-1); // Reset focus
  }, [filteredArticles]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef && !dropdownRef.contains(e.target as Node)) {
        setFilteredArticles([]);
        setFocusedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);


  // Add these helper functions
  const parseNumericInput = (value: string): number => {
    if (!value || value === "") return 0;
    const cleanValue = value.replace(",", ".");
    const numericValue = parseFloat(cleanValue);
    return isNaN(numericValue) ? 0 : Math.round(numericValue * 1000) / 1000;
  };

  const formatForDisplay = (
    value: number | string | undefined | null
  ): string => {
    if (value === undefined || value === null) return "0,000";
    const numericValue =
      typeof value === "string" ? parseNumericInput(value) : Number(value);
    if (isNaN(numericValue)) return "0,000";
    return numericValue.toFixed(3).replace(".", ",");
  };

  // Replace the existing useMemo calculation with this
  const {
    sousTotalHT,
    netHT,
    totalTax,
    grandTotal,
    finalTotal,
    discountAmount,
  } = useMemo(() => {
    if (selectedArticles.length === 0) {
      return {
        sousTotalHT: 0,
        netHT: 0,
        totalTax: 0,
        grandTotal: 0,
        finalTotal: 0,
        discountAmount: 0,
      };
    }

    let sousTotalHTValue = 0;
    let totalTaxValue = 0;
    let grandTotalValue = 0;

    // ORIGINAL TOTALS
    selectedArticles.forEach((article) => {
      const qty = article.quantite === "" ? 0 : Number(article.quantite) || 0;
      const articleRemise = Number(article.remise) || 0;

      let unitHT = Number(article.prixUnitaire) || 0;
      let unitTTC = Number(article.prixTTC) || 0;

      // HT editing
      if (editingHT[article.article_id] !== undefined) {
        const v = parseNumericInput(editingHT[article.article_id]);
        if (!isNaN(v) && v >= 0) {
          unitHT = v;
          const tvaRate = Number(article.tva) || 0;
          unitTTC = unitHT * (1 + tvaRate / 100);
        }
      }
      // TTC editing
      else if (editingTTC[article.article_id] !== undefined) {
        const v = parseNumericInput(editingTTC[article.article_id]);
        if (!isNaN(v) && v >= 0) {
          unitTTC = v;
          const tvaRate = Number(article.tva) || 0;
          unitHT = tvaRate > 0 ? unitTTC / (1 + tvaRate / 100) : unitTTC;
        }
      }

      const lineHT = Math.round(unitHT * 1000) / 1000;
      const lineTTC = Math.round(unitTTC * 1000) / 1000;

      const montantSousTotalHT = Math.round(qty * lineHT * 1000) / 1000;
      const montantNetHTLigne = Math.round(
        qty * lineHT * (1 - articleRemise / 100) * 1000
      ) / 1000;
      const montantTTCLigne = Math.round(qty * lineTTC * 1000) / 1000;
      const montantTVALigne = Math.round(
        (montantTTCLigne - montantNetHTLigne) * 1000
      ) / 1000;

      sousTotalHTValue += montantSousTotalHT;
      totalTaxValue += montantTVALigne;
      grandTotalValue += montantTTCLigne;
    });

    // Base rounding
    sousTotalHTValue = Math.round(sousTotalHTValue * 1000) / 1000;
    totalTaxValue = Math.round(totalTaxValue * 1000) / 1000;
    grandTotalValue = Math.round(grandTotalValue * 1000) / 1000;

    let netHTValue = sousTotalHTValue;
    let finalTotalValue = grandTotalValue;
    let discountAmountValue = 0;

    // GLOBAL REMISE - APPLIED ON HT
    if (showRemise && Number(globalRemise) > 0) {
      // ===== % REMISE =====
      if (remiseType === "percentage") {
        discountAmountValue = (sousTotalHTValue * Number(globalRemise)) / 100;

        netHTValue = sousTotalHTValue - discountAmountValue;

        const ratio = sousTotalHTValue > 0 ? totalTaxValue / sousTotalHTValue : 0;

        totalTaxValue = netHTValue * ratio;
        finalTotalValue = netHTValue + totalTaxValue;
      }

      // ===== FIXED TTC =====
      else if (remiseType === "fixed") {
        finalTotalValue = Number(globalRemise);

        // 🛑 LOGICAL GUARD: TTC unchanged → NO REMISE
        if (
          Math.round(finalTotalValue * 1000) ===
          Math.round(grandTotalValue * 1000)
        ) {
          netHTValue = sousTotalHTValue;
          discountAmountValue = 0;
        } else {
          const tvaRates = Array.from(
            new Set(selectedArticles.map((a) => Number(a.tva) || 0))
          );

          // Single TVA
          if (tvaRates.length === 1 && tvaRates[0] > 0) {
            const tvaRate = tvaRates[0];
            netHTValue = finalTotalValue / (1 + tvaRate / 100);
            totalTaxValue = finalTotalValue - netHTValue;
          }
          // Multiple TVA
          else {
            const coeff =
              grandTotalValue > 0 ? finalTotalValue / grandTotalValue : 1;

            let newHT = 0;
            let newTVA = 0;

            selectedArticles.forEach((article) => {
              const qty =
                article.quantite === "" ? 0 : Number(article.quantite) || 0;
              const unitHT = Number(article.prixUnitaire) || 0;
              const tvaRate = Number(article.tva) || 0;

              const lineHT = qty * unitHT * coeff;
              const lineTVA = lineHT * (tvaRate / 100);

              newHT += lineHT;
              newTVA += lineTVA;
            });

            netHTValue = newHT;
            totalTaxValue = newTVA;
          }
        }

        // Final rounding + SAFE remise derivation
        netHTValue = Math.round(netHTValue * 1000) / 1000;
        totalTaxValue = Math.round(totalTaxValue * 1000) / 1000;
        finalTotalValue = Math.round(finalTotalValue * 1000) / 1000;

        discountAmountValue = Math.round(
          (sousTotalHTValue - netHTValue) * 1000
        ) / 1000;
      }
    }

    return {
      sousTotalHT: sousTotalHTValue,
      netHT: netHTValue,
      totalTax: totalTaxValue,
      grandTotal: grandTotalValue,
      finalTotal: finalTotalValue,
      discountAmount: discountAmountValue,
    };
  }, [selectedArticles, showRemise, globalRemise, remiseType]);


  const handleDelete = async () => {
    if (!bonCommande) return;

    try {
      await deleteDevis(bonCommande.id);
      setDeleteModal(false);
      fetchData();
      toast.success("Devis supprimé avec succès");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Échec de la suppression"
      );
    }
  };

  const handleSubmit = async (values: any) => {
    const discountPercentage = sousTotalHT > 0 ? (discountAmount / sousTotalHT) * 100 : 0;

    if (discountPercentage > 10 && !isDiscountConfirmed) {
      setShowDiscountAlert(true);
      return;
    }
    try {
      if (isCreatingCommande) {
        const commandeData = {
          numeroCommande: values.numeroCommande,
          dateCommande: values.dateCommande,
          dateLivBonCommande: moment().format("YYYY-MM-DD"),
          client_id: selectedClient!.id,
          vendeur_id: values.vendeur_id,
          status: "Confirme" as "Confirme", // Add type assertion
          notes: values.notes,
          taxMode: taxMode, // Corrigé : utiliser l'état existant
          remise: globalRemise,
          remiseType: remiseType,
          devis_id: bonCommande?.id,
          depot_id: selectedDepot?.id || 1, // Utiliser selectedDepot
          hasRetenue: false,
          montantRetenue: 0,
          modeReglement: "especes" as "especes",
          acompte: 0,
          totalHT: netHT,
          totalTTC: finalTotal,
          totalTTCAfterRemise: finalTotal,
          totalAfterRemise: finalTotal,
          montantPaye: 0,
          resteAPayer: finalTotal,
          hasPayments: false,
          articles: selectedArticles.map((item) => ({
            article_id: item.article_id,
            quantite: item.quantite === "" ? 0 : Number(item.quantite),
            quantiteLivree: 0,
            prixUnitaire: item.prixUnitaire,
            puv_ttc: item.prixTTC,
            prix_ttc: item.prixTTC,
            tva: item.tva ?? undefined,
            remise: item.remise ?? undefined,
            designation: item.designation, // Add this

          })),
        };

        await createBonCommandeClientBasedOnDevis(commandeData);
        toast.success("Bon de commande créé avec succès");
      }
      else {
        const bonCommandeData = {
          ...values,
          taxMode,
          articles: selectedArticles.map((item) => ({
            article_id: item.article_id,
            quantite: item.quantite === "" ? 0 : Number(item.quantite), // Convert empty string to 0 here too
            prix_unitaire: item.prixUnitaire,
            prix_ttc: item.prixTTC,

            tva: item.tva ?? undefined,
            remise: item.remise ?? undefined,
            designation: item.designation, // Add this

          })),
          remise: globalRemise,
          remiseType: remiseType,
        };

        if (isEdit && bonCommande) {
          await updateDevis(bonCommande.id, bonCommandeData);
          toast.success("Devis mis à jour avec succès");
        } else {
          await createDevis(bonCommandeData);
          toast.success("Devis créé avec succès");
        }
      }

      setModal(false);
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec de l'opération");
    }
  };

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      numeroCommande: isEdit
        ? bonCommande?.numeroCommande || ""
        : isCreatingCommande
          ? nextNumeroCommande
          : generateNextNumber(bonsCommande, moment().format("YYYY"), "devis"),
      client_id: bonCommande?.client?.id ?? "",
      vendeur_id: bonCommande?.vendeur?.id ?? "",
      dateCommande: bonCommande?.dateCommande
        ? moment(bonCommande.dateCommande).format("YYYY-MM-DD")
        : moment().format("YYYY-MM-DD"),
      status: bonCommande?.status ?? "Confirme",
      notes: bonCommande?.notes ?? "",
    },
    validationSchema: Yup.object().shape({
      dateCommande: Yup.date().required("La date est requise"),
      numeroCommande: Yup.string().required("Le numéro est requis"),
      client_id: Yup.number().required("Le client est requis"),
      vendeur_id: Yup.number().required("Le vendeur est requis"),
      status: Yup.string().required("Le statut est requis"),
    }),
    onSubmit: handleSubmit,
  });

  const columns = useMemo(
    () => [
      {
        header: "Numéro",
        accessorKey: "numeroCommande",
        enableColumnFilter: false,
        cell: (cell: any) => (
          <Link
            to="#"
            className="text-body fw-medium"
            onClick={() => openDetailModal(cell.row.original)}
          >
            {cell.getValue()}
          </Link>
        ),
      },
      {
        header: "Date",
        accessorKey: "dateCommande",
        enableColumnFilter: false,
        cell: (cell: any) => moment(cell.getValue()).format("DD MMM YYYY"),
      },
      {
        header: "Client",
        accessorKey: "client",
        enableColumnFilter: false,
        cell: (cell: any) => `${cell.getValue()?.raison_sociale || ""}`,
      },
      {
        header: "Vendeur",
        accessorKey: "vendeur",
        enableColumnFilter: false,
        cell: (cell: any) =>
          `${cell.getValue()?.nom || ""} ${cell.getValue()?.prenom || ""}`,
      },
      {
        header: "Articles",
        accessorKey: "articles",
        enableColumnFilter: false,
        cell: (cell: any) => (
          <Badge color="success" className="text-uppercase">
            {cell.getValue().length} articles
          </Badge>
        ),
      },
      {
        header: "Total TTC",
        accessorKey: "articles",
        enableColumnFilter: false,
        cell: (cell: any) => {
          const total = cell.getValue().reduce((sum: number, item: any) => {
            const itemTotal = item.quantite * item.prixUnitaire;
            const itemDiscount = item.remise
              ? itemTotal * (item.remise / 100)
              : 0;
            const taxableAmount = itemTotal - itemDiscount;
            const itemTax = item.tva ? taxableAmount * (item.tva / 100) : 0;
            return sum + taxableAmount + itemTax;
          }, 0);
          return `${total.toFixed(3)} DT`;
        },
      },
      {
        header: "Total Après Remise",
        accessorKey: "articles",
        enableColumnFilter: false,
        cell: (cell: any) => {
          const total = cell.getValue().reduce((sum: number, item: any) => {
            const itemTotal = Number(item.quantite) * Number(item.prixUnitaire);
            const itemDiscount = item.remise
              ? itemTotal * (Number(item.remise) / 100)
              : 0;
            const taxableAmount = itemTotal - itemDiscount;
            const itemTax = item.tva
              ? taxableAmount * (Number(item.tva) / 100)
              : 0;
            return sum + taxableAmount + itemTax;
          }, 0);

          const globalDiscount = Number(cell.row.original.remise) || 0;
          const discountType = cell.row.original.remiseType || "percentage";

          let netAPayer: number = total;
          if (globalDiscount > 0) {
            if (discountType === "percentage") {
              netAPayer = total * (1 - globalDiscount / 100);
            } else {
              // For fixed amount, the globalDiscount IS the final amount
              netAPayer = globalDiscount;
            }
          }

          return `${netAPayer.toFixed(3)} DT`;
        },
      },
      {
        header: "Statut",
        accessorKey: "status",
        enableColumnFilter: false,
        cell: (cell: any) => <StatusBadge status={cell.getValue()} />,
      },
      {
        header: "Action",
        cell: (cellProps: any) => {
          return (
            <ul className="list-inline hstack gap-2 mb-0">
              <li className="list-inline-item edit">
                <Link
                  to="#"
                  className="text-primary d-inline-block edit-item-btn"
                  onClick={() => {
                    setBonCommande(cellProps.row.original);
                    setSelectedArticles(
                      cellProps.row.original.articles.map((item: any) => ({
                        article_id: item.article.id,
                        quantite: item.quantite,
                        prixUnitaire: parseFloat(item.prixUnitaire),
                        // USE prix_ttc FROM DATABASE OR CALCULATE FROM ARTICLE puv_ttc
                        prixTTC:
                          parseFloat(item.prix_ttc) ||
                          parseFloat(item.article?.puv_ttc) ||
                          parseFloat(item.prixUnitaire) *
                          (1 + (item.tva || 0) / 100),
                        tva: item.tva != null ? parseFloat(item.tva) : null,
                        remise:
                          item.remise != null ? parseFloat(item.remise) : null,
                        articleDetails: item.article,
                        designation: item.designation || item.article?.designation || "", // Add this

                      }))
                    );
                    setGlobalRemise(cellProps.row.original.remise || 0);
                    setRemiseType(
                      cellProps.row.original.remiseType || "percentage"
                    );
                    setShowRemise((cellProps.row.original.remise || 0) > 0);
                    setSelectedClient(cellProps.row.original.client || null);
                    setIsEdit(true);
                    setModal(true);
                  }}
                >
                  <i className="ri-pencil-fill fs-16"></i>
                </Link>
              </li>
              <li className="list-inline-item">
                <Link
                  to="#"
                  className="text-danger d-inline-block remove-item-btn"
                  onClick={() => {
                    setBonCommande(cellProps.row.original);
                    setDeleteModal(true);
                  }}
                >
                  <i className="ri-delete-bin-5-fill fs-16"></i>
                </Link>
              </li>
              <li className="list-inline-item">
                <Link
                  to="#"
                  className="text-info d-inline-block"
                  onClick={() => openDetailModal(cellProps.row.original)}
                >
                  <i className="ri-eye-line fs-16"></i>
                </Link>
              </li>
              <li className="list-inline-item">
                <Link
                  to="#"
                  className="text-secondary d-inline-block"
                  onClick={() => {
                    setSelectedPdfDevis(cellProps.row.original);
                    setPdfModal(true);
                  }}
                  title="Télécharger PDF"
                >
                  <i className="ri-file-pdf-fill fs-16"></i>
                </Link>
              </li>

            </ul>
          );
        },
      },
    ],
    []
  );

  const toggleModal = useCallback(() => {
    if (modal) {
      setModal(false);
      setBonCommande(null);
      setSelectedArticles([]);
      setGlobalRemise(0);
      setRemiseType("percentage");
      setShowRemise(false);
      setIsCreatingCommande(false);
      setSelectedClient(null);
      setClientSearch("");
      setArticleSearch("");
      setFilteredArticles([]);
      setFilteredClients([]);
      validation.resetForm();
    } else {
      setModal(true);
      // Reset form for new devis
      if (!isEdit && !isCreatingCommande) {
        validation.setValues({
          numeroCommande: generateNextNumber(
            bonsCommande,
            moment().format("YYYY"),
            "devis"
          ),
          client_id: "",
          vendeur_id: "",
          dateCommande: moment().format("YYYY-MM-DD"),
          status: "Brouillon",
          notes: "",
        });
      }
    }
  }, [modal, isEdit, isCreatingCommande, bonsCommande]);

  const handleAddArticle = useCallback((articleId: string | number) => {
    console.log("handleAddArticle called with ID:", articleId);

    // Try to find the article in multiple sources
    const articleIdNum = typeof articleId === 'string' ? parseInt(articleId) : articleId;

    // Search in this order: filteredArticles, articles, item.articleDetails
    let article = filteredArticles.find((a) => a.id === articleIdNum);

    if (!article) {
      article = articles.find((a) => a.id === articleIdNum);
    }

    if (!article) {
      // Try to find it in existing selected articles (articleDetails)
      const existingItem = selectedArticles.find(item => item.article_id === articleIdNum);
      if (existingItem?.articleDetails) {
        article = existingItem.articleDetails;
      }
    }

    if (!article) {
      console.error("Article not found with ID:", articleIdNum);
      toast.error(`Article avec ID ${articleIdNum} non trouvé`);
      return;
    }

    // Check if article already exists in selectedArticles
    const alreadyExists = selectedArticles.some((item) => item.article_id === article?.id);

    if (alreadyExists) {
      console.log("Article already exists, incrementing quantity");
      // Increment quantity if article already exists
      setSelectedArticles(prev =>
        prev.map(item => {
          if (item.article_id === article?.id) {
            const currentQty = item.quantite === "" ? 0 : Number(item.quantite);
            return {
              ...item,
              quantite: currentQty + 1
            };
          }
          return item;
        })
      );
      toast.info(`Quantité augmentée pour "${article.designation}"`);
    } else {
      console.log("Adding new article:", article.designation);
      const initialHT = article.puv_ht || 0;
      const initialTVA = article.tva || 0;
      const initialTTC = article.puv_ttc || initialHT * (1 + (initialTVA || 0) / 100);

      setSelectedArticles(prev => [
        ...prev,
        {
          article_id: article.id,
          quantite: 1, // Start with 1 instead of empty
          prixUnitaire: initialHT,
          prixTTC: Math.round(initialTTC * 1000) / 1000,
          tva: initialTVA,
          remise: 0,
          quantiteLivree: "",
          articleDetails: article,
          designation: article.designation || "", // Add this

        },
      ]);
      toast.success(`Article "${article.designation}" ajouté`);
    }

    // Clear search and reset focus
    setArticleSearch("");
    setFilteredArticles([]);
    setFocusedIndex(-1);

    // Refocus on search input
    setTimeout(() => {
      if (articleSearchRef.current) {
        articleSearchRef.current.focus();
      }
    }, 100);

  }, [filteredArticles, articles, selectedArticles, articleSearchRef]);

  const handleRemoveArticle = (articleId: number) => {
    setSelectedArticles(
      selectedArticles.filter((item) => item.article_id !== articleId)
    );
  };

  const handleArticleChange = (
    articleId: number,
    field: string,
    value: any
  ) => {
    setSelectedArticles((prevArticles) =>
      prevArticles.map((item) => {
        if (item.article_id === articleId) {
          const updatedItem = { ...item, [field]: value };


          if (field === "designation") {
            updatedItem.designation = value || "";
          }

          // Handle TVA change - recalculate HT from TTC
          if (field === "tva") {
            const currentTTC = item.prixTTC;
            const newTVA = value === "" ? 0 : Number(value);

            // Recalculate HT from existing TTC
            let newPriceHT = currentTTC;
            if (newTVA > 0) {
              newPriceHT = currentTTC / (1 + newTVA / 100);
            }

            updatedItem.prixUnitaire = Math.round(newPriceHT * 1000) / 1000;
            updatedItem.tva = newTVA;

            // Clear editing states
            setEditingHT((prev) => {
              const newState = { ...prev };
              delete newState[articleId];
              return newState;
            });
            setEditingTTC((prev) => {
              const newState = { ...prev };
              delete newState[articleId];
              return newState;
            });
          }

          // Handle HT change - recalculate TTC
          if (field === "prixUnitaire") {
            const currentHT = Number(value) || 0;
            const currentTVA = item.tva || 0;

            let newPriceTTC = currentHT;
            if (currentTVA > 0) {
              newPriceTTC = currentHT * (1 + currentTVA / 100);
            }

            updatedItem.prixTTC = Math.round(newPriceTTC * 1000) / 1000;
          }

          // Handle TTC change - recalculate HT
          if (field === "prixTTC") {
            const currentTTC = Number(value) || 0;
            const currentTVA = item.tva || 0;

            let newPriceHT = currentTTC;
            if (currentTVA > 0) {
              newPriceHT = currentTTC / (1 + currentTVA / 100);
            }

            updatedItem.prixUnitaire = Math.round(newPriceHT * 1000) / 1000;
          }

          return updatedItem;
        }
        return item;
      })
    );
  };

  const handleBarcodeScan = useCallback(
    (barcode: string) => {
      if (!barcode.trim()) return;

      console.log("Code-barres scanné:", barcode);

      // Clean the barcode
      const cleanBarcode = barcode.trim();

      // Search for article by code_barre
      const scannedArticle = articles.find(
        (article) => article.code_barre === cleanBarcode
      );

      if (scannedArticle) {
        const existingArticle = selectedArticles.find(
          (item) => item.article_id === scannedArticle.id
        );

        if (existingArticle) {
          // Increment quantity if article already exists
          handleArticleChange(
            scannedArticle.id,
            "quantite",
            (Number(existingArticle.quantite) || 0) + 1
          );
          toast.success(
            `Quantité augmentée pour "${scannedArticle.designation}"`
          );
        } else {
          // Add new article
          const initialHT = scannedArticle.puv_ht || 0;
          const initialTVA = scannedArticle.tva || 0;
          const initialTTC =
            scannedArticle.puv_ttc || initialHT * (1 + (initialTVA || 0) / 100);

          setSelectedArticles((prev) => [
            ...prev,
            {
              article_id: scannedArticle.id,
              quantite: 1,
              prixUnitaire: initialHT,
              tva: initialTVA,
              remise: 0,
              prixTTC: Math.round(initialTTC * 1000) / 1000,
              articleDetails: scannedArticle,
            },
          ]);
          toast.success(`Article "${scannedArticle.designation}" ajouté`);
        }

        // Focus on article search input after scanning
        if (articleSearchRef.current) {
          articleSearchRef.current.focus();
        }
      } else {
        toast.error(`Article avec code ${cleanBarcode} non trouvé`);
      }
    },
    [articles, selectedArticles, handleArticleChange]
  );

  useEffect(() => {
    if (modal && articleSearchRef.current) {
      // Focus on article search input when modal opens
      setTimeout(() => {
        if (articleSearchRef.current) {
          articleSearchRef.current.focus();
        }
      }, 100);
    }
  }, [modal]);
  // 3. Modifier le gestionnaire de clavier pour détection automatique
  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      // Ignorer si on est dans un champ de saisie (input, textarea, select)
      const target = event.target as HTMLElement;
      const isInputField =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable;

      if (isInputField) {
        // Si l'utilisateur tape dans un champ, ne pas traiter comme un scan
        return;
      }

      const currentTime = Date.now();
      const timeSinceLastKey = currentTime - lastKeyPressTime;

      // Si plus de 100ms se sont écoulés depuis la dernière touche, réinitialiser
      if (timeSinceLastKey > 100) {
        setBarcodeInput("");
      }

      setLastKeyPressTime(currentTime);

      // Les scanners envoient généralement les données suivies par "Enter"
      if (event.key === "Enter") {
        if (barcodeInput.length >= 3) {
          // Minimum 3 caractères pour un code-barres
          handleBarcodeScan(barcodeInput);
          setBarcodeInput("");
          event.preventDefault(); // Empêcher tout comportement par défaut de Enter
        }
      } else if (
        event.key.length === 1 &&
        !event.ctrlKey &&
        !event.altKey &&
        !event.metaKey
      ) {
        // Accumuler les caractères (uniquement caractères simples, pas de combinaisons)
        setBarcodeInput((prev) => prev + event.key);

        // Réinitialiser le timeout précédent
        if (scanningTimeout) {
          clearTimeout(scanningTimeout);
        }

        // Détecter automatiquement après un délai (pour les scanners qui n'envoient pas de Enter)
        const newTimeout = setTimeout(() => {
          if (barcodeInput.length >= 8) {
            // Longueur minimale typique pour un code-barres
            handleBarcodeScan(barcodeInput);
            setBarcodeInput("");
          }
        }, 50); // Délai très court pour détection rapide

        setScanningTimeout(newTimeout);
      }
    },
    [barcodeInput, scanningTimeout, lastKeyPressTime, handleBarcodeScan]
  );

  // 4. Modifier l'effet pour toujours écouter les frappes
  useEffect(() => {
    document.addEventListener("keydown", handleKeyPress);

    return () => {
      document.removeEventListener("keydown", handleKeyPress);
      if (scanningTimeout) {
        clearTimeout(scanningTimeout);
      }
    };
  }, [handleKeyPress]);

  const StatusBadge = ({
    status,
  }: {
    status?:
    | "Brouillon"
    | "Confirme"
    | "Livre"
    | "Annule"
    | "Partiellement Livre";
  }) => {
    const statusConfig = {
      Brouillon: {
        bgClass: "bg-warning",
        textClass: "text-warning",
        icon: "ri-draft-line",
      },
      Confirme: {
        bgClass: "bg-primary",
        textClass: "text-primary",
        icon: "ri-checkbox-circle-line",
      },
      Livre: {
        bgClass: "bg-success",
        textClass: "text-success",
        icon: "ri-truck-line",
      },
      Annule: {
        bgClass: "bg-danger",
        textClass: "text-danger",
        icon: "ri-close-circle-line",
      },
      "Partiellement Livre": {
        bgClass: "bg-info",
        textClass: "text-info",
        icon: "ri-truck-line",
      },
    };

    if (!status) return null;

    const config = statusConfig[status] || statusConfig["Brouillon"];

    return (
      <span
        className={`badge ${config.bgClass}-subtle ${config.textClass} text-uppercase`}
      >
        <i className={`${config.icon} align-bottom me-1`}></i>
        {status}
      </span>
    );
  };

  return (
    <div className="page-content">
      <DeleteModal
        show={deleteModal}
        onDeleteClick={handleDelete}
        onCloseClick={() => setDeleteModal(false)}
      />

      <DiscountAlertModal
        show={showDiscountAlert}
        discountPercentage={
          sousTotalHT > 0
            ? (discountAmount / sousTotalHT) * 100
            : 0
        }
        onConfirmClick={() => {
          setIsDiscountConfirmed(true);
          setShowDiscountAlert(false);
          setTimeout(() => {
            validation.handleSubmit();
          }, 100);
        }}
        onCloseClick={() => setShowDiscountAlert(false)}
      />

      <Container fluid>
        <BreadCrumb title="Offre De Prix" pageTitle="Commandes" />

        <Row>
          <Col lg={12}>
            <Card id="bonCommandeList">
              <CardHeader className="card-header border-0">
                <Row className="align-items-center gy-3">
                  <div className="col-sm">
                    <h5 className="card-title mb-0">
                      Gestion des Offre De Prix
                    </h5>
                  </div>
                  <div className="col-sm-auto">
                    <div className="d-flex gap-1 flex-wrap">
                      <Button
                        color="info"
                        onClick={() => {
                          setStartDate(null);
                          setEndDate(null);
                          setSearchText("");
                          setPhoneSearch("");
                        }}
                        size="sm"
                      >
                        <i className="ri-close-line align-bottom me-1"></i>
                        Réinitialiser tous les filtres
                      </Button>

                      <Button
                        color="secondary"
                        onClick={() => {
                          setIsEdit(false);
                          setBonCommande(null);
                          toggleModal();
                        }}
                      >
                        <i className="ri-add-line align-bottom me-1"></i>{" "}
                        Ajouter Offre
                      </Button>
                    </div>
                  </div>
                </Row>
              </CardHeader>
              <Nav
                className="nav-tabs nav-tabs-custom nav-success"
                role="tablist"
              >
                <NavItem>
                  <NavLink
                    className={classnames({ active: activeTab === "1" })}
                    onClick={() => setActiveTab("1")}
                  >
                    <i className="ri-list-check-2 me-1 align-bottom"></i> Tous
                  </NavLink>
                </NavItem>
                <NavItem>
                  <NavLink
                    className={classnames({ active: activeTab === "4" })}
                    onClick={() => setActiveTab("4")}
                  >
                    <i className="ri-checkbox-circle-line me-1 align-bottom"></i>{" "}
                    Accepté
                  </NavLink>
                </NavItem>
                <NavItem>
                  <NavLink
                    className={classnames({ active: activeTab === "6" })}
                    onClick={() => setActiveTab("6")}
                  >
                    <i className="ri-close-circle-line me-1 align-bottom"></i>{" "}
                    Annulé
                  </NavLink>
                </NavItem>
              </Nav>
              <CardBody className="pt-3">
                <Row className="mb-3">
                  <Col md={3}>
                    <div className="search-box">
                      <Input
                        type="text"
                        className="form-control"
                        placeholder="Rechercher par numéro vente, client..."
                        value={searchText}
                        onChange={(e) => {
                          setSearchText(e.target.value);
                        }}
                      />
                      <i className="ri-search-line search-icon"></i>
                    </div>
                  </Col>

                  {/* Add this phone search input */}
                  <Col md={3}>
                    <div className="search-box">
                      <Input
                        type="text"
                        className="form-control"
                        placeholder="Rechercher par téléphone..."
                        value={phoneSearch}
                        onChange={(e) => {
                          const value = e.target.value;
                          // Apply auto-space formatting for phone numbers
                          if (value) {
                            const formatted = formatPhoneInput(value);
                            setPhoneSearch(formatted);
                          } else {
                            setPhoneSearch("");
                          }
                        }}
                      />
                      <i className="ri-phone-line search-icon"></i>
                    </div>
                  </Col>

                  <Col md={3}>
                    <InputGroup>
                      <InputGroupText>De</InputGroupText>
                      <Flatpickr
                        className="form-control"
                        options={{
                          dateFormat: "d M, Y",
                          altInput: true,
                          altFormat: "F j, Y",
                        }}
                        placeholder="Date de début"
                        onChange={(dates) => setStartDate(dates[0])}
                      />
                    </InputGroup>
                  </Col>
                  <Col md={3}>
                    <InputGroup>
                      <InputGroupText>À</InputGroupText>
                      <Flatpickr
                        className="form-control"
                        options={{
                          dateFormat: "d M, Y",
                          altInput: true,
                          altFormat: "F j, Y",
                        }}
                        placeholder="Date de fin"
                        onChange={(dates) => setEndDate(dates[0])}
                      />
                    </InputGroup>
                  </Col>
                </Row>

                {loading ? (
                  <Loader />
                ) : error ? (
                  <div className="text-danger">{error}</div>
                ) : (
                  <TableContainer
                    columns={columns}
                    data={filteredBonsCommande}
                    isGlobalFilter={false}
                    customPageSize={10}
                    divClass="table-responsive table-card mb-1 mt-0"
                    tableClass="align-middle table-nowrap"
                    theadClass="table-light text-muted text-uppercase"
                  />
                )}

                <Modal
                  isOpen={modal}
                  toggle={toggleModal}
                  centered
                  size="xl"
                  className="invoice-modal"
                  style={{ maxWidth: "1200px" }}
                >
                  <ModalHeader toggle={toggleModal} className="border-0 pb-3">
                    <div className="d-flex align-items-center">
                      <div className="modal-icon-wrapper bg-primary bg-opacity-10 rounded-circle p-2 me-3">
                        <i className="ri-file-list-3-line text-primary fs-4"></i>
                      </div>
                      <div>
                        <h4 className="mb-0 fw-bold text-dark">
                          {isCreatingCommande
                            ? "Créer Bon de Commande Client"
                            : isEdit
                              ? "Modifier Devis"
                              : "Créer Devis"}
                        </h4>
                        <small className="text-muted">
                          {isCreatingCommande
                            ? "Créer un bon de commande à partir de ce devis"
                            : isEdit
                              ? "Modifier les détails du devis existant"
                              : "Créer un nouveau devis"}
                        </small>
                      </div>
                    </div>
                  </ModalHeader>

                  <Form
                    onSubmit={validation.handleSubmit}
                    className="invoice-form"
                  >
                    <ModalBody className="pt-0">
                      {/* Header Information Section */}
                      <Card className="border-0 shadow-sm mb-4">
                        <CardBody className="p-4">
                          <h5 className="fw-semibold mb-4 text-primary">
                            <i className="ri-information-line me-2"></i>
                            Informations Générales
                          </h5>
                          <Row>
                            <Col md={4}>
                              <div className="mb-3">
                                <Label className="form-label-lg fw-semibold">
                                  Numéro*
                                </Label>
                                <Input
                                  name="numeroCommande"
                                  value={validation.values.numeroCommande}
                                  onChange={validation.handleChange}
                                  invalid={
                                    validation.touched.numeroCommande &&
                                    !!validation.errors.numeroCommande
                                  }
                                  readOnly={!isEdit && !isCreatingCommande}
                                  className="form-control-lg"
                                  placeholder="DEVIS-0001/2024"
                                />
                                <FormFeedback className="fs-6">
                                  {validation.errors.numeroCommande}
                                </FormFeedback>
                              </div>
                            </Col>
                            <Col md={4}>
                              <div className="mb-3">
                                <Label className="form-label-lg fw-semibold">
                                  Date*
                                </Label>
                                <Input
                                  type="date"
                                  name="dateCommande"
                                  value={validation.values.dateCommande}
                                  onChange={validation.handleChange}
                                  invalid={
                                    validation.touched.dateCommande &&
                                    !!validation.errors.dateCommande
                                  }
                                  className="form-control-lg"
                                />
                                <FormFeedback className="fs-6">
                                  {validation.errors.dateCommande as string}
                                </FormFeedback>
                              </div>
                            </Col>

                          </Row>
                        </CardBody>
                      </Card>

                      {/* Client and Vendeur Section */}
                      <Row className="g-3 mb-4">
                        <Col md={6}>
                          <Card className="border-0 shadow-sm h-100">
                            <CardBody className="p-4">
                              <h6 className="fw-semibold mb-3 text-primary">
                                <i className="ri-user-line me-2"></i>
                                Informations Client
                              </h6>
                              {/* In your Devis page modal, replace the client search section with this: */}
                              <div className="mb-3 position-relative">
                                <Label className="form-label-lg fw-semibold">
                                  Client*
                                  {!selectedClient && !isCreatingCommande && (
                                    <button
                                      type="button"
                                      className="btn btn-link text-primary p-0 ms-2"
                                      onClick={() => setClientModal(true)}
                                      title="Ajouter un nouveau client"
                                      style={{ fontSize: "0.8rem" }}
                                    >
                                      <i className="ri-add-line me-1"></i>
                                      Nouveau client
                                    </button>
                                  )}
                                </Label>

                                <div className="position-relative">
                                  <Input
                                    type="text"
                                    placeholder="Rechercher client par nom, raison sociale ou téléphone..."
                                    value={
                                      selectedClient
                                        ? selectedClient.raison_sociale
                                        : clientSearch
                                    }
                                    onChange={(e) => {
                                      const value = e.target.value;

                                      if (!value) {
                                        setSelectedClient(null);
                                        validation.setFieldValue("client_id", "");
                                        setClientSearch("");
                                      } else {
                                        // Auto-format if it looks like a phone number (mostly digits)
                                        const digitCount = (value.match(/\d/g) || []).length;
                                        const totalLength = value.length;

                                        if (digitCount >= totalLength * 0.7) {
                                          // If 70% or more are digits
                                          const formatted = formatPhoneInput(value);
                                          setClientSearch(formatted);
                                        } else {
                                          setClientSearch(value);
                                        }
                                      }
                                    }}
                                    onFocus={() => {
                                      if (clientSearch.length >= 1) {
                                        setFilteredClients(clients);
                                      }
                                    }}
                                    readOnly={!!selectedClient || isCreatingCommande}
                                    className="form-control-lg pe-10"
                                  />

                                  {/* Clear button when client is selected */}
                                  {selectedClient && !isCreatingCommande && (
                                    <button
                                      type="button"
                                      className="btn btn-link text-danger position-absolute end-0 top-50 translate-middle-y p-0 me-3"
                                      onClick={() => {
                                        setSelectedClient(null);
                                        validation.setFieldValue("client_id", "");
                                        setClientSearch("");
                                      }}
                                      title="Changer de client"
                                    >
                                      <i className="ri-close-line fs-5"></i>
                                    </button>
                                  )}

                                  {/* Add button when no client is selected */}
                                  {!selectedClient && !isCreatingCommande && (
                                    <button
                                      type="button"
                                      className="btn btn-link text-primary position-absolute end-0 top-50 translate-middle-y p-0 me-3"
                                      onClick={() => setClientModal(true)}
                                      title="Ajouter un nouveau client"
                                    >
                                      <i className="ri-add-line fs-5"></i>
                                    </button>
                                  )}
                                </div>

                                {/* Enhanced Client Dropdown Results - ABSOLUTELY POSITIONED */}
                                {/* Enhanced Client Dropdown Results - ABSOLUTELY POSITIONED */}
                                {!isCreatingCommande &&
                                  !selectedClient &&
                                  clientSearch.length >= 3 && (
                                    <div
                                      className="search-results client-results mt-1"
                                      style={{
                                        position: "absolute",
                                        top: "100%", // Position below the input
                                        left: 0,
                                        right: 0,
                                        zIndex: 1050,
                                        backgroundColor: "#fafafa", // Light grey background
                                        border: "1px solid #e9ecef",
                                        borderRadius: "0.375rem",
                                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
                                        maxHeight: "400px",
                                        overflowY: "auto"
                                      }}
                                    >
                                      {filteredClients.length > 0 ? (
                                        <ul className="list-group list-group-flush">
                                          {filteredClients.map((c) => (
                                            <li
                                              key={c.id}
                                              className="list-group-item list-group-item-action"
                                              onClick={() => {
                                                setSelectedClient(c);
                                                validation.setFieldValue("client_id", c.id);
                                                setClientSearch("");
                                                setFilteredClients([]);
                                              }}
                                              style={{
                                                cursor: "pointer",
                                                padding: "12px 16px",
                                                position: "relative",
                                                transition: "all 0.15s ease",
                                                backgroundColor: "transparent",
                                                borderBottom: "1px solid #f1f3f5"
                                              }}
                                              onMouseEnter={(e) => {
                                                e.currentTarget.style.backgroundColor = "#f5f5f5";
                                                e.currentTarget.style.borderLeft = "3px solid #0d6efd";
                                              }}
                                              onMouseLeave={(e) => {
                                                e.currentTarget.style.backgroundColor = "transparent";
                                                e.currentTarget.style.borderLeft = "none";
                                              }}
                                            >
                                              {/* Client Main Info */}
                                              <div className="d-flex flex-column">
                                                {/* Raison Sociale */}
                                                <div className="d-flex justify-content-between align-items-start mb-1">
                                                  <span className="fw-semibold client-info-name">
                                                    {c.raison_sociale}
                                                  </span>

                                                  {/* Edit button positioned at the end right */}
                                                  <button
                                                    type="button"
                                                    className="btn btn-link text-primary p-0 edit-client-btn"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      e.preventDefault();
                                                      handleEditClient(c, e);
                                                    }}
                                                    title="Modifier ce client"
                                                    style={{
                                                      position: "absolute",
                                                      right: "15px",
                                                      top: "12px",
                                                      opacity: 0.6,
                                                      transition: "opacity 0.2s, transform 0.2s",
                                                      background: "white",
                                                      borderRadius: "50%",
                                                      width: "28px",
                                                      height: "28px",
                                                      display: "flex",
                                                      alignItems: "center",
                                                      justifyContent: "center",
                                                      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                                                      zIndex: 2
                                                    }}
                                                    onMouseEnter={(e) => {
                                                      e.currentTarget.style.opacity = "1";
                                                      e.currentTarget.style.transform = "scale(1.05)";
                                                      e.currentTarget.style.background = "#f8f9fa";
                                                    }}
                                                    onMouseLeave={(e) => {
                                                      e.currentTarget.style.opacity = "0.6";
                                                      e.currentTarget.style.transform = "scale(1)";
                                                      e.currentTarget.style.background = "white";
                                                    }}
                                                  >
                                                    <i className="ri-edit-line fs-5"></i>
                                                  </button>
                                                </div>

                                                {/* Telephone directly under raison sociale */}
                                                {c.telephone1 && (
                                                  <div className="mb-1">
                                                    <span className="client-info-phone d-flex align-items-center">
                                                      <i className="ri-phone-line me-1" style={{ fontSize: "0.75rem" }}></i>
                                                      {formatPhoneDisplay(c.telephone1)}
                                                    </span>
                                                  </div>
                                                )}

                                                {/* Additional Info Row */}
                                                <div className="d-flex justify-content-between align-items-center mt-1">
                                                  {/* Designation */}

                                                  {/* Second Phone (if exists) */}
                                                  {c.telephone2 && (
                                                    <small className="client-info-phone">
                                                      <i className="ri-phone-line me-1" style={{ fontSize: "0.75rem" }}></i>
                                                      {formatPhoneDisplay(c.telephone2)}
                                                    </small>
                                                  )}
                                                </div>

                                                {/* Address */}
                                                {c.adresse && (
                                                  <small className="client-info-address d-block mt-1">
                                                    <i className="ri-map-pin-line me-1"></i>
                                                    {c.adresse}
                                                  </small>
                                                )}
                                              </div>
                                            </li>
                                          ))}
                                        </ul>
                                      ) : (
                                        <div className="text-muted p-3 text-center">
                                          <i className="ri-search-line me-2"></i>
                                          Aucun résultat trouvé
                                        </div>
                                      )}
                                    </div>
                                  )}

                                {validation.touched.client_id &&
                                  validation.errors.client_id && (
                                    <div className="text-danger mt-1 fs-6">
                                      <i className="ri-error-warning-line me-1"></i>
                                      {validation.errors.client_id}
                                    </div>
                                  )}
                              </div>
                            </CardBody>
                          </Card>
                        </Col>

                        <Col md={6}>
                          <Card className="border-0 shadow-sm h-100">
                            <CardBody className="p-4">
                              <h6 className="fw-semibold mb-3 text-primary">
                                <i className="ri-team-line me-2"></i>
                                Informations Vendeur
                              </h6>
                              <div className="mb-3">
                                <Label className="form-label-lg fw-semibold">
                                  Vendeur*
                                </Label>
                                <Input
                                  type="select"
                                  name="vendeur_id"
                                  value={validation.values.vendeur_id}
                                  onChange={validation.handleChange}
                                  invalid={
                                    validation.touched.vendeur_id &&
                                    !!validation.errors.vendeur_id
                                  }
                                  className="form-control-lg"
                                  style={{
                                    maxHeight: "200px",
                                    overflowY: "auto",
                                  }}
                                >
                                  <option value="">
                                    Sélectionner un vendeur
                                  </option>
                                  {vendeurs.map((vendeur) => (
                                    <option key={vendeur.id} value={vendeur.id}>
                                      {vendeur.nom} {vendeur.prenom}
                                    </option>
                                  ))}
                                </Input>
                                <FormFeedback className="fs-6">
                                  {validation.errors.vendeur_id}
                                </FormFeedback>
                              </div>
                            </CardBody>
                          </Card>
                        </Col>
                      </Row>

                      {/* Global Discount Section    <Card className="border-0 shadow-sm mb-4">
        <CardBody className="p-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="fw-semibold text-primary mb-0">
              <i className="ri-coupon-line me-2"></i>
              Remise Globale
            </h5>
            <div className="form-check form-switch form-switch-lg">
              <Input
                type="checkbox"
                id="showRemise"
                checked={showRemise}
                onChange={(e) => {
                  setShowRemise(e.target.checked);
                  if (!e.target.checked) {
                    setGlobalRemise(0);
                  }
                }}
                className="form-check-input"
              />
              <Label for="showRemise" check className="form-check-label fw-semibold fs-6">
                Appliquer une remise
              </Label>
            </div>
          </div>

          {showRemise && (
            <Row className="g-3 mt-3">
              <Col md={4}>
                <div className="mb-3">
                  <Label className="form-label-lg fw-semibold">Type de remise</Label>
                  <Input
                    type="select"
                    value={remiseType}
                    onChange={(e) =>
                      setRemiseType(e.target.value as "percentage" | "fixed")
                    }
                    className="form-control-lg"
                  >
                    <option value="percentage">Pourcentage (%)</option>
                    <option value="fixed">Montant fixe (DT)</option>
                  </Input>
                </div>
              </Col>
              <Col md={4}>
                <div className="mb-3">
                  <Label className="form-label-lg fw-semibold">
                    {remiseType === "percentage" ? "Pourcentage de remise" : "Montant de remise (DT)"}
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    step={remiseType === "percentage" ? "1" : "0.001"}
                    value={globalRemise === 0 ? "" : globalRemise}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === "") {
                        setGlobalRemise(0);
                      } else {
                        const numValue = Number(value);
                        if (!isNaN(numValue) && numValue >= 0) {
                          setGlobalRemise(numValue);
                        }
                      }
                    }}
                    placeholder={remiseType === "percentage" ? "0-100%" : "Montant en DT"}
                    className="form-control-lg"
                  />
                </div>
              </Col>
              <Col md={4}>
                {showRemise && globalRemise > 0 && (
                  <div className="p-3 bg-primary bg-opacity-10 rounded border">
                    <div className="text-center">
                      <small className="text-muted d-block">Remise appliquée</small>
                      <strong className="fs-5 text-primary">
                        {remiseType === "percentage" 
                          ? `${globalRemise}%` 
                          : `${Number(globalRemise).toFixed(3)} DT`}
                      </strong>
                    </div>
                  </div>
                )}
              </Col>
            </Row>
          )}
        </CardBody>
      </Card> */}

                      {/* Articles Section */}
                      <Card className="border-0 shadow-sm mb-4">
                        <CardBody className="p-4">
                          <h5 className="fw-semibold mb-4 text-primary">
                            <i className="ri-shopping-cart-line me-2"></i>
                            Articles
                          </h5>

                          <div className="mb-4">
                            <Label className="form-label-lg fw-semibold">
                              Rechercher Article
                            </Label>

                            <div className="search-box position-relative">
                              <Input
                                type="text"
                                placeholder="Rechercher article..."
                                value={articleSearch}
                                innerRef={articleSearchRef}
                                onChange={(e) => {
                                  setArticleSearch(e.target.value);
                                  setFocusedIndex(-1);
                                }}
                                onKeyDown={(e) => {
                                  if (filteredArticles.length > 0) {
                                    if (e.key === "ArrowDown") {
                                      e.preventDefault();
                                      setFocusedIndex((prev) =>
                                        prev < filteredArticles.length - 1
                                          ? prev + 1
                                          : 0
                                      );
                                    } else if (e.key === "ArrowUp") {
                                      e.preventDefault();
                                      setFocusedIndex((prev) =>
                                        prev > 0
                                          ? prev - 1
                                          : filteredArticles.length - 1
                                      );
                                    } else if (
                                      e.key === "Enter" &&
                                      focusedIndex >= 0
                                    ) {
                                      e.preventDefault();
                                      const article =
                                        filteredArticles[focusedIndex];
                                      handleAddArticle(article.id.toString());
                                      setArticleSearch("");
                                      setFilteredArticles([]);
                                      setFocusedIndex(-1);
                                    } else if (
                                      e.key === "Enter" &&
                                      filteredArticles.length > 0 &&
                                      focusedIndex === -1
                                    ) {
                                      e.preventDefault();
                                      const firstArticle = filteredArticles[0];
                                      handleAddArticle(
                                        firstArticle.id.toString()
                                      );
                                      setArticleSearch("");
                                      setFilteredArticles([]);
                                      setFocusedIndex(-1);
                                    }
                                  }
                                }}
                                className="form-control-lg ps-5 pe-5"
                              />
                              <i className="ri-search-line search-icon position-absolute top-50 start-0 translate-middle-y ms-3"></i>
                              <button
                                type="button"
                                className="btn btn-link text-primary position-absolute end-0 top-50 translate-middle-y p-0 me-3"
                                onClick={() => setArticleModal(true)}
                                title="Ajouter un nouvel article"
                              >
                                <i className="ri-add-line fs-5"></i>
                              </button>
                            </div>

                            {articleSearch.length >= 1 && (
                              <div
                                ref={setDropdownRef}
                                className="search-results mt-2 border rounded shadow-sm"
                                style={{
                                  maxHeight: "400px",
                                  overflowY: "auto",
                                  overflowX: "hidden",
                                  position: "relative",
                                  zIndex: 1000,
                                  backgroundColor: "white",
                                }}
                                onKeyDown={(e) => e.stopPropagation()}
                              >
                                {filteredArticles.length > 0 ? (
                                  <ul className="list-group list-group-flush">
                                    {filteredArticles.map((article, index) => {
                                      const itemRef =
                                        React.createRef<HTMLLIElement>();
                                      if (!itemRefs[index]) {
                                        itemRefs[index] = itemRef;
                                      }

                                      return (
                                        <li
                                          key={article.id}
                                          ref={itemRefs[index]}
                                          className={`list-group-item list-group-item-action ${focusedIndex === index
                                            ? "active"
                                            : ""
                                            }`}
                                          onClick={() => {
                                            handleAddArticle(
                                              article.id.toString()
                                            );
                                            setArticleSearch("");
                                            setFilteredArticles([]);
                                            setFocusedIndex(-1);
                                          }}
                                          style={{
                                            cursor: "pointer",
                                            padding: "12px 15px",
                                            opacity: selectedArticles.some(
                                              (item) =>
                                                item.article_id === article.id
                                            )
                                              ? 0.6
                                              : 1,
                                            backgroundColor:
                                              focusedIndex === index
                                                ? "#e7f1ff"
                                                : "transparent",
                                            borderLeft:
                                              focusedIndex === index
                                                ? "4px solid #0d6efd"
                                                : "none",
                                          }}
                                          onMouseEnter={() =>
                                            setFocusedIndex(index)
                                          }
                                        >
                                          <div className="d-flex justify-content-between align-items-center">
                                            <div className="flex-grow-1">
                                              <div className="d-flex align-items-center mb-1">
                                                <strong className="fs-6 me-2 text-primary">
                                                  {article.reference}
                                                </strong>
                                                <span className="badge bg-light text-dark me-2">
                                                  Stock: {article.qte || 0}
                                                </span>
                                              </div>
                                              <small
                                                className="text-muted d-block"
                                                style={{ fontSize: "0.85rem" }}
                                              >
                                                {article.designation}
                                              </small>
                                              <div className="mt-1">
                                                <span className="badge bg-success text-white">
                                                  TTC:{" "}
                                                  {(
                                                    Number(article.puv_ttc) || 0
                                                  ).toFixed(3)}{" "}
                                                  DT
                                                </span>
                                                {article.tva &&
                                                  article.tva > 0 && (
                                                    <span className="badge bg-info ms-1">
                                                      TVA: {article.tva}%
                                                    </span>
                                                  )}
                                              </div>
                                            </div>
                                            {selectedArticles.some(
                                              (item) =>
                                                item.article_id === article.id
                                            ) ? (
                                              <Badge
                                                color="secondary"
                                                className="fs-6"
                                              >
                                                <i className="ri-check-line me-1"></i>
                                                Ajouté
                                              </Badge>
                                            ) : (
                                              <Badge
                                                color="success"
                                                className="fs-6"
                                              >
                                                <i className="ri-add-line me-1"></i>
                                                Ajouter
                                              </Badge>
                                            )}
                                          </div>
                                        </li>
                                      );
                                    })}
                                  </ul>
                                ) : (
                                  <div className="text-muted p-3 text-center">
                                    <i className="ri-search-line me-2"></i>
                                    Aucun article trouvé
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Articles Table */}
                          {selectedArticles.length > 0 && (
                            <div className="articles-table">
                              <div
                                className="table-responsive"
                                style={{ maxHeight: "500px", overflow: "auto" }}
                              >
                                <Table className="table table-hover mb-0">
                                  <thead
                                    className="table-dark"
                                    style={{
                                      position: "sticky",
                                      top: 0,
                                      zIndex: 10,
                                    }}
                                  >
                                    <tr>
                                      <th
                                        style={{
                                          width: "25%",
                                          minWidth: "200px",
                                        }}
                                      >
                                        Article
                                      </th>
                                      <th
                                        style={{
                                          width: "10%",
                                          minWidth: "100px",
                                        }}
                                      >
                                        Référence
                                      </th>
                                      <th
                                        style={{
                                          width: "8%",
                                          minWidth: "80px",
                                        }}
                                      >
                                        Quantité
                                      </th>
                                      <th
                                        style={{
                                          width: "12%",
                                          minWidth: "120px",
                                        }}
                                      >
                                        Prix Unitaire HT
                                      </th>
                                      <th
                                        style={{
                                          width: "12%",
                                          minWidth: "120px",
                                        }}
                                      >
                                        Prix Unitaire TTC
                                      </th>
                                      <th
                                        style={{
                                          width: "8%",
                                          minWidth: "80px",
                                        }}
                                      >
                                        TVA (%)
                                      </th>
                                      <th
                                        style={{
                                          width: "10%",
                                          minWidth: "100px",
                                        }}
                                      >
                                        Total HT
                                      </th>
                                      <th
                                        style={{
                                          width: "10%",
                                          minWidth: "100px",
                                        }}
                                      >
                                        Total TTC
                                      </th>
                                      <th
                                        style={{
                                          width: "5%",
                                          minWidth: "60px",
                                        }}
                                      >
                                        Action
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {selectedArticles.map((item, index) => {
                                      const article =
                                        articles.find(
                                          (a) => a.id === item.article_id
                                        ) || item.articleDetails;

                                      const qty = Number(item.quantite) || 0;

                                      let priceHT =
                                        Number(item.prixUnitaire) || 0;
                                      let priceTTC = Number(item.prixTTC) || 0;
                                      // Replace the problematic section in Devis component with this:

                                      if (
                                        editingTTC[item.article_id] !==
                                        undefined
                                      ) {
                                        const editingValue = parseNumericInput(
                                          editingTTC[item.article_id]
                                        );
                                        if (
                                          !isNaN(editingValue) &&
                                          editingValue >= 0
                                        ) {
                                          priceTTC = parseFloat(
                                            editingValue.toFixed(3)
                                          ); // ✅ Add this line
                                          const tvaRate = Number(item.tva) || 0;
                                          if (tvaRate > 0) {
                                            const coefficient =
                                              1 + tvaRate / 100;
                                            priceHT = parseFloat(
                                              (priceTTC / coefficient).toFixed(
                                                3
                                              )
                                            ); // ✅ Use same method
                                          } else {
                                            priceHT = priceTTC;
                                          }
                                        }
                                      } else if (
                                        editingTTC[item.article_id] !==
                                        undefined
                                      ) {
                                        const editingValue = parseNumericInput(
                                          editingTTC[item.article_id]
                                        );
                                        if (
                                          !isNaN(editingValue) &&
                                          editingValue >= 0
                                        ) {
                                          priceTTC = editingValue;
                                          const tvaRate = Number(item.tva) || 0;
                                          priceHT =
                                            tvaRate > 0
                                              ? priceTTC / (1 + tvaRate / 100)
                                              : priceTTC;
                                        }
                                      }

                                      const montantHTLigne = (
                                        qty * priceHT
                                      ).toFixed(3);
                                      const montantTTCLigne = (
                                        qty * priceTTC
                                      ).toFixed(3);

                                      return (
                                        <tr
                                          key={`${item.article_id}-${index}`}
                                          className="article-row align-middle"
                                        >
                                          <td style={{ width: "25%" }}>
                                            <div className="d-flex align-items-center">
                                              <div className="flex-grow-1">
                                                <Input
                                                  type="textarea"
                                                  rows="2"
                                                  value={item.designation || ""}
                                                  onChange={(e) => {
                                                    const newValue = e.target.value;
                                                    handleArticleChange(
                                                      item.article_id,
                                                      "designation",
                                                      newValue
                                                    );
                                                  }}
                                                  className="article-designation-input"
                                                />
                                              </div>
                                            </div>
                                          </td>
                                          <td style={{ width: "10%" }}>
                                            <Badge
                                              color="light"
                                              className="text-dark"
                                            >
                                              {article?.reference}
                                            </Badge>
                                          </td>
                                          <td style={{ width: "8%" }}>
                                            <Input
                                              type="number"
                                              min="0"
                                              step="1"
                                              value={item.quantite}
                                              onChange={(e) => {
                                                const value = e.target.value;
                                                if (value === "") {
                                                  handleArticleChange(
                                                    item.article_id,
                                                    "quantite",
                                                    ""
                                                  );
                                                } else {
                                                  const newQty = Math.max(
                                                    0,
                                                    Number(value)
                                                  );
                                                  handleArticleChange(
                                                    item.article_id,
                                                    "quantite",
                                                    newQty
                                                  );
                                                }
                                              }}
                                              className="table-input article-input article-input-number"
                                            />
                                          </td>
                                          <td style={{ width: "12%" }}>
                                            <Input
                                              type="text"
                                              value={
                                                editingHT[item.article_id] !==
                                                  undefined
                                                  ? editingHT[item.article_id]
                                                  : formatForDisplay(
                                                    item.prixUnitaire
                                                  )
                                              }
                                              onChange={(e) => {
                                                let value = e.target.value;
                                                if (
                                                  value === "" ||
                                                  /^[0-9]*[,.]?[0-9]*$/.test(
                                                    value
                                                  )
                                                ) {
                                                  value = value.replace(
                                                    ".",
                                                    ","
                                                  );
                                                  const commaCount = (
                                                    value.match(/,/g) || []
                                                  ).length;
                                                  if (commaCount <= 1) {
                                                    setEditingHT((prev) => ({
                                                      ...prev,
                                                      [item.article_id]: value,
                                                    }));
                                                    const parsed =
                                                      parseNumericInput(value);
                                                    if (
                                                      !isNaN(parsed) &&
                                                      parsed >= 0
                                                    ) {
                                                      handleArticleChange(
                                                        item.article_id,
                                                        "prixUnitaire",
                                                        parsed
                                                      );
                                                    }
                                                  }
                                                }
                                              }}
                                              className="table-input article-input article-input-currency"
                                            />
                                          </td>
                                          <td style={{ width: "12%" }}>
                                            <Input
                                              type="text"
                                              value={
                                                editingTTC[item.article_id] !==
                                                  undefined
                                                  ? editingTTC[item.article_id]
                                                  : formatForDisplay(
                                                    item.prixTTC
                                                  )
                                              }
                                              onChange={(e) => {
                                                let value = e.target.value;
                                                if (
                                                  value === "" ||
                                                  /^[0-9]*[,.]?[0-9]*$/.test(
                                                    value
                                                  )
                                                ) {
                                                  value = value.replace(
                                                    ".",
                                                    ","
                                                  );
                                                  const commaCount = (
                                                    value.match(/,/g) || []
                                                  ).length;
                                                  if (commaCount <= 1) {
                                                    setEditingTTC((prev) => ({
                                                      ...prev,
                                                      [item.article_id]: value,
                                                    }));
                                                    const parsed =
                                                      parseNumericInput(value);
                                                    if (
                                                      !isNaN(parsed) &&
                                                      parsed >= 0
                                                    ) {
                                                      handleArticleChange(
                                                        item.article_id,
                                                        "prixTTC",
                                                        parsed
                                                      );
                                                    }
                                                  }
                                                }
                                              }}
                                              className="table-input article-input article-input-currency"
                                            />
                                          </td>
                                          <td style={{ width: "8%" }}>
                                            <Input
                                              type="select"
                                              value={item.tva ?? ""}
                                              onChange={(e) => {
                                                const newTva =
                                                  e.target.value === ""
                                                    ? null
                                                    : Number(e.target.value);
                                                handleArticleChange(
                                                  item.article_id,
                                                  "tva",
                                                  newTva
                                                );
                                              }}
                                              className="table-input article-input article-select"
                                            >
                                              <option value="">
                                                Sélectionner
                                              </option>
                                              {tvaOptions.map((option) => (
                                                <option
                                                  key={option.value ?? "null"}
                                                  value={option.value ?? ""}
                                                >
                                                  {option.label}
                                                </option>
                                              ))}
                                            </Input>
                                          </td>
                                          <td style={{ width: "10%" }}>
                                            <div className="article-total-cell article-total-ht">
                                              {montantHTLigne} DT
                                            </div>
                                          </td>
                                          <td style={{ width: "10%" }}>
                                            <div className="article-total-cell article-total-ttc">
                                              {montantTTCLigne} DT
                                            </div>
                                          </td>
                                          <td style={{ width: "5%" }}>
                                            <Button
                                              color="danger"
                                              size="sm"
                                              onClick={() =>
                                                handleRemoveArticle(
                                                  item.article_id
                                                )
                                              }
                                              className="article-action-btn btn-invoice-danger"
                                            >
                                              <i className="ri-delete-bin-line"></i>
                                            </Button>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </Table>
                              </div>
                            </div>
                          )}

                          {/* Calculation Summary */}
                          {/* Calculation Summary */}
                          {/* Calculation Summary */}
                          {selectedArticles.length > 0 && (
                            <div className="calculation-summary mt-4">
                              <h6 className="fw-semibold mb-3 text-primary">
                                <i className="ri-calculator-line me-2"></i>
                                Récapitulatif
                              </h6>

                              <Row>
                                {/* Left Side - Remise Global */}
                                <Col md={6}>
                                  <div className="remise-global-section h-100">
                                    <h6 className="fw-semibold">
                                      <i className="ri-coupon-line me-2"></i>
                                      Remise Globale
                                    </h6>
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                      <Label className="form-label fw-semibold mb-0">
                                        Activer remise
                                      </Label>
                                      <div className="form-check form-switch">
                                        <Input
                                          type="checkbox"
                                          id="showRemiseSummary"
                                          checked={showRemise}
                                          onChange={(e) => {
                                            setShowRemise(e.target.checked);
                                            if (!e.target.checked) {
                                              setGlobalRemise(0);
                                            }
                                          }}
                                          className="form-check-input"
                                        />
                                      </div>
                                    </div>

                                    {showRemise && (
                                      <div className="row g-2">
                                        <div className="col-12">
                                          <Label className="form-label fw-semibold">
                                            Type de remise
                                          </Label>
                                          <Input
                                            type="select"
                                            value={remiseType}
                                            onChange={(e) =>
                                              setRemiseType(e.target.value as "percentage" | "fixed")
                                            }
                                            className="form-control-sm"
                                          >
                                            <option value="percentage">Pourcentage (%)</option>
                                            <option value="fixed">Montant fixe (DT)</option>
                                          </Input>
                                        </div>
                                        <div className="col-12">
                                          <Label className="form-label fw-semibold">
                                            {remiseType === "percentage" ? "Pourcentage" : "Montant (DT)"}
                                          </Label>
                                          <Input
                                            type="number"
                                            min="0"
                                            step={remiseType === "percentage" ? "1" : "0.001"}
                                            value={globalRemise === 0 ? "" : globalRemise}
                                            onChange={(e) => {
                                              const value = e.target.value;
                                              if (value === "") {
                                                setGlobalRemise(0);
                                              } else {
                                                const numValue = Number(value);
                                                if (!isNaN(numValue) && numValue >= 0) {
                                                  setGlobalRemise(numValue);
                                                }
                                              }
                                            }}
                                            placeholder={
                                              remiseType === "percentage" ? "0-100%" : "Montant"
                                            }
                                            className="form-control-sm"
                                          />
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </Col>

                                {/* Right Side - Calculations */}
                                <Col md={6}>
                                  <div className="calculation-summary-right">
                                    <Table className="table table-borderless mb-0">
                                      <tbody>
                                        <tr className="real-time-update">
                                          <th className="text-end text-muted fs-6">
                                            Sous-total H.T.:
                                          </th>
                                          <td className="text-end fw-semibold fs-6">
                                            {sousTotalHT.toFixed(3)} DT
                                          </td>
                                        </tr>
                                        <tr className="real-time-update">
                                          <th className="text-end text-muted fs-6">
                                            Net H.T.:
                                          </th>
                                          <td className="text-end fw-semibold fs-6">
                                            {netHT.toFixed(3)} DT
                                          </td>
                                        </tr>
                                        <tr className="real-time-update">
                                          <th className="text-end text-muted fs-6">
                                            TVA:
                                          </th>
                                          <td className="text-end fw-semibold fs-6">
                                            {totalTax.toFixed(3)} DT
                                          </td>
                                        </tr>
                                        <tr className="real-time-update">
                                          <th className="text-end text-muted fs-6">
                                            Total TTC:
                                          </th>
                                          <td className="text-end fw-semibold fs-6 text-dark">
                                            {grandTotal.toFixed(3)} DT
                                          </td>
                                        </tr>
                                        {showRemise && globalRemise > 0 && (() => {
                                          const computedPercentage = grandTotal > 0 ? (discountAmount / grandTotal) * 100 : 0;
                                          const isHigh = computedPercentage > 10;
                                          return (
                                            <tr className={`real-time-update ${isHigh ? "table-danger" : "table-success"}`}>
                                              <th className={`text-end fs-6 ${isHigh ? "text-danger" : "text-success"}`}>
                                                {remiseType === "percentage"
                                                  ? `Remise (${globalRemise}%)`
                                                  : `Remise (Montant fixe) ${computedPercentage.toFixed(2)}%`}
                                              </th>
                                              <td className={`text-end fw-bold fs-6 ${isHigh ? "text-danger" : "text-success"}`}>
                                                - {discountAmount.toFixed(3)} DT
                                              </td>
                                            </tr>
                                          );
                                        })()}
                                        <tr className="final-total real-time-update border-top">
                                          <th className="text-end fs-5">
                                            NET À PAYER:
                                          </th>
                                          <td className="text-end fw-bold fs-5 text-primary">
                                            {finalTotal.toFixed(3)} DT
                                          </td>
                                        </tr>
                                      </tbody>
                                    </Table>
                                  </div>
                                </Col>
                              </Row>
                            </div>
                          )}
                        </CardBody>
                      </Card>

                      {/* Notes Section */}
                      <Card className="border-0 shadow-sm">
                        <CardBody className="p-4">
                          <h5 className="fw-semibold mb-3 text-primary">
                            <i className="ri-sticky-note-line me-2"></i>
                            Notes Additionnelles
                          </h5>
                          <div className="mb-3">
                            <Label className="form-label-lg fw-semibold">
                              Notes
                            </Label>
                            <Input
                              type="textarea"
                              name="notes"
                              value={validation.values.notes}
                              onChange={validation.handleChange}
                              rows="3"
                              className="form-control-lg"
                              placeholder="Ajoutez des notes ou commentaires supplémentaires..."
                            />
                          </div>
                        </CardBody>
                      </Card>
                    </ModalBody>

                    <ModalFooter className="border-0 pt-4">
                      <Button
                        color="light"
                        onClick={toggleModal}
                        className="btn-invoice fs-6 px-4"
                      >
                        <i className="ri-close-line me-2"></i>
                        Annuler
                      </Button>
                      <Button
                        color="primary"
                        type="submit"
                        className="btn-invoice btn-invoice-primary fs-6 px-4"
                        disabled={
                          selectedArticles.length === 0 || !selectedClient
                        }
                      >
                        <i className="ri-save-line me-2"></i>
                        {isEdit ? "Modifier" : "Enregistrer"}
                      </Button>
                    </ModalFooter>
                  </Form>
                </Modal>

                {/* Add this modal at the end of your devis page component, before the closing </div> */}
                {/* Quick Client Creation Modal */}
                <Modal
                  isOpen={clientModal}
                  toggle={() => setClientModal(false)}
                  centered
                  size="lg"
                >
                  <ModalHeader toggle={() => setClientModal(false)}>
                    <div className="d-flex align-items-center">
                      <div className="modal-icon-wrapper bg-primary bg-opacity-10 rounded-circle p-2 me-3">
                        <i className="ri-user-add-line text-primary fs-4"></i>
                      </div>
                      <div>
                        <h4 className="mb-0 fw-bold text-dark">
                          Nouveau Client
                        </h4>
                        <small className="text-muted">
                          Créer un nouveau client rapidement
                        </small>
                      </div>
                    </div>
                  </ModalHeader>
                  <ModalBody>
                    <Row>
                      <Col md={6}>
                        <div className="mb-3">
                          <Label>Raison Sociale*</Label>
                          <Input
                            value={newClient.raison_sociale}
                            onChange={(e) =>
                              setNewClient({
                                ...newClient,
                                raison_sociale: e.target.value,
                              })
                            }
                            placeholder="Raison sociale"
                            className="form-control"
                          />
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="mb-3">
                          <Label>Désignation</Label>
                          <Input
                            value={newClient.designation}
                            onChange={(e) =>
                              setNewClient({
                                ...newClient,
                                designation: e.target.value,
                              })
                            }
                            placeholder="Désignation"
                            className="form-control"
                          />
                        </div>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={6}>
                        <div className="mb-3">
                          <Label>Matricule Fiscal</Label>
                          <Input
                            value={newClient.matricule_fiscal}
                            onChange={(e) =>
                              setNewClient({
                                ...newClient,
                                matricule_fiscal: e.target.value,
                              })
                            }
                            placeholder="Matricule fiscal"
                            className="form-control"
                          />
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="mb-3">
                          <Label>Registre Commerce</Label>
                          <Input
                            value={newClient.register_commerce}
                            onChange={(e) =>
                              setNewClient({
                                ...newClient,
                                register_commerce: e.target.value,
                              })
                            }
                            placeholder="Registre de commerce"
                            className="form-control"
                          />
                        </div>
                      </Col>
                    </Row>

                    <div className="mb-3">
                      <Label>Adresse</Label>
                      <Input
                        value={newClient.adresse}
                        onChange={(e) =>
                          setNewClient({
                            ...newClient,
                            adresse: e.target.value,
                          })
                        }
                        placeholder="Adresse"
                        className="form-control"
                      />
                    </div>

                    <Row>
                      <Col md={6}>
                        <div className="mb-3">
                          <Label>Ville</Label>
                          <Input
                            value={newClient.ville}
                            onChange={(e) =>
                              setNewClient({
                                ...newClient,
                                ville: e.target.value,
                              })
                            }
                            placeholder="Ville"
                            className="form-control"
                          />
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="mb-3">
                          <Label>Code Postal</Label>
                          <Input
                            value={newClient.code_postal}
                            onChange={(e) =>
                              setNewClient({
                                ...newClient,
                                code_postal: e.target.value,
                              })
                            }
                            placeholder="Code postal"
                            className="form-control"
                          />
                        </div>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={6}>
                        <div className="mb-3">
                          <Label className="form-label fw-semibold">
                            Téléphone 1
                          </Label>
                          <Input
                            value={newClient.telephone1}
                            onChange={(e) => {
                              const value = e.target.value;
                              // Apply auto-space formatting
                              if (value) {
                                const formatted = formatPhoneInput(value);
                                setNewClient({
                                  ...newClient,
                                  telephone1: formatted,
                                });
                              } else {
                                setNewClient({
                                  ...newClient,
                                  telephone1: value,
                                });
                              }
                            }}
                            placeholder="22 222 222"
                            className="form-control-lg"
                          />
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="mb-3">
                          <Label className="form-label fw-semibold">
                            Téléphone 2
                          </Label>
                          <Input
                            value={newClient.telephone2}
                            onChange={(e) => {
                              const value = e.target.value;
                              // Apply auto-space formatting
                              if (value) {
                                const formatted = formatPhoneInput(value);
                                setNewClient({
                                  ...newClient,
                                  telephone2: formatted,
                                });
                              } else {
                                setNewClient({
                                  ...newClient,
                                  telephone2: value,
                                });
                              }
                            }}
                            placeholder="22 222 222"
                            className="form-control-lg"
                          />
                        </div>
                      </Col>
                    </Row>

                    <div className="mb-3">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={newClient.email}
                        onChange={(e) =>
                          setNewClient({ ...newClient, email: e.target.value })
                        }
                        placeholder="Email"
                        className="form-control"
                      />
                    </div>
                  </ModalBody>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-light"
                      onClick={() => setClientModal(false)}
                    >
                      <i className="ri-close-line me-1"></i>
                      Annuler
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleCreateClient}
                      disabled={
                        !newClient.raison_sociale || !newClient.telephone1
                      }
                    >
                      <i className="ri-user-add-line me-1"></i>
                      Créer Client
                    </button>
                  </div>
                </Modal>

                <Modal
                  isOpen={articleModal}
                  toggle={() => setArticleModal(false)}
                  centered
                  size="lg"
                >
                  <ModalHeader toggle={() => setArticleModal(false)}>
                    <div className="d-flex align-items-center">
                      <div className="modal-icon-wrapper bg-success bg-opacity-10 rounded-circle p-2 me-3">
                        <i className="ri-add-box-line text-success fs-4"></i>
                      </div>
                      <div>
                        <h4 className="mb-0 fw-bold text-dark">Nouvel Article</h4>
                        <small className="text-muted">Ajouter un nouveau produit</small>
                      </div>
                    </div>
                  </ModalHeader>

                  <Form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleCreateArticle();
                    }}
                  >
                    <ModalBody>
                      {/* ================= BASIC INFORMATION ================= */}
                      <Card className="border-0 shadow-sm mb-4">
                        <CardBody className="p-4">
                          <h5 className="fw-semibold mb-4 text-primary">
                            <i className="ri-information-line me-2"></i>
                            Informations de Base
                          </h5>
                          <Row>
                            <Col md={6}>
                              <div className="mb-3">
                                <Label className="form-label-lg fw-semibold">Référence</Label>
                                <Input
                                  type="text"
                                  value={newArticle.reference}
                                  onChange={(e) =>
                                    setNewArticle({ ...newArticle, reference: e.target.value })
                                  }
                                  placeholder="REF"
                                  className="form-control-lg"
                                />
                                <small className="text-muted">Identifiant unique de l'article</small>
                              </div>
                            </Col>

                            <Col md={6}>
                              <div className="mb-3">
                                <Label className="form-label-lg fw-semibold">Désignation</Label>
                                <Input
                                  type="text"
                                  value={newArticle.designation}
                                  onChange={(e) =>
                                    setNewArticle({ ...newArticle, designation: e.target.value })
                                  }
                                  placeholder="Nom de l'article"
                                  className="form-control-lg"
                                />
                                <small className="text-muted">Nom complet du produit</small>
                              </div>
                            </Col>
                          </Row>
                        </CardBody>
                      </Card>

                      {/* ================= CATEGORIES ================= */}
                      <Card className="border-0 shadow-sm mb-4">
                        <CardBody className="p-4">
                          <h5 className="fw-semibold mb-4 text-primary">
                            <i className="ri-folder-line me-2"></i>
                            Catégorisation
                          </h5>
                          <Row>
                            <Col md={6}>
                              <div className="mb-3">
                                <Label className="form-label-lg fw-semibold">Famille Principale</Label>
                                <Input
                                  type="select"
                                  value={newArticle.categorie_id}
                                  onChange={(e) =>
                                    setNewArticle({ ...newArticle, categorie_id: e.target.value })
                                  }
                                  className="form-control-lg"
                                >
                                  <option value="">Sélectionner une famille principale</option>
                                  {categories
                                    .filter((c) => !c.parent_id)
                                    .map((c) => (
                                      <option key={c.id} value={c.id}>
                                        {c.nom}
                                      </option>
                                    ))}
                                </Input>
                                <small className="text-muted">Catégorie principale</small>
                              </div>
                            </Col>

                            <Col md={6}>
                              <div className="mb-3">
                                <Label className="form-label-lg fw-semibold">Sous-Famille</Label>
                                <Input
                                  type="select"
                                  value={newArticle.sous_categorie_id}
                                  onChange={(e) =>
                                    setNewArticle({
                                      ...newArticle,
                                      sous_categorie_id: e.target.value,
                                    })
                                  }
                                  className="form-control-lg"
                                >
                                  <option value="">Sélectionner une sous-famille</option>
                                  {subcategories.map((s) => (
                                    <option key={s.id} value={s.id}>
                                      {s.nom}
                                    </option>
                                  ))}
                                </Input>
                                <small className="text-muted">Sous-catégorie</small>
                              </div>
                            </Col>
                          </Row>
                        </CardBody>
                      </Card>

                      {/* ================= SUPPLIER / TYPE ================= */}
                      <Card className="border-0 shadow-sm mb-4">
                        <CardBody className="p-4">
                          <h5 className="fw-semibold mb-4 text-primary">
                            <i className="ri-truck-line me-2"></i>
                            Fournisseur & Type
                          </h5>
                          <Row>
                            <Col md={6}>
                              <div className="mb-3">
                                <Label className="form-label-lg fw-semibold">Fournisseur</Label>
                                <Input
                                  type="select"
                                  value={newArticle.fournisseur_id}
                                  onChange={(e) =>
                                    setNewArticle({
                                      ...newArticle,
                                      fournisseur_id: e.target.value,
                                    })
                                  }
                                  className="form-control-lg"
                                >
                                  <option value="">Sélectionner un fournisseur</option>
                                  {fournisseurs.map((f) => (
                                    <option key={f.id} value={f.id}>
                                      {f.raison_sociale}
                                    </option>
                                  ))}
                                </Input>
                                <small className="text-muted">Fournisseur principal</small>
                              </div>
                            </Col>

                            <Col md={6}>
                              <div className="mb-3">
                                <Label className="form-label-lg fw-semibold">Type</Label>
                                <Input
                                  type="select"
                                  value={newArticle.type}
                                  onChange={(e) =>
                                    setNewArticle({
                                      ...newArticle,
                                      type: e.target.value,
                                    })
                                  }
                                  className="form-control-lg"
                                >
                                  <option value="Non Consigné">Non Consigné</option>
                                  <option value="Consigné">Consigné</option>
                                </Input>
                                <small className="text-muted">Type d'article</small>
                              </div>
                            </Col>
                          </Row>
                        </CardBody>
                      </Card>

                      {/* ================= PRICING SECTION ================= */}
                      <Row className="mb-4">
                        <Col md={6}>
                          <Card className="border-0 shadow-sm h-100">
                            <CardBody className="p-4">
                              <h6 className="fw-semibold mb-4 text-primary">
                                <i className="ri-shopping-bag-line me-2"></i>
                                Prix d'Achat
                              </h6>

                              <div className="mb-4">
                                <Label className="form-label-lg fw-semibold">Prix d'achat HT (DT)</Label>
                                <Input
                                  type="text"
                                  value={newArticle.pua_ht}
                                  onChange={(e) => handlePriceChange('pua_ht', e.target.value)}
                                  placeholder="0,000"
                                  className="form-control-lg text-end"
                                />
                                <small className="text-muted">Prix hors taxes avant marge</small>
                              </div>

                              <div className="mb-0">
                                <Label className="form-label-lg fw-semibold">Prix d'achat TTC (DT)</Label>
                                <Input
                                  type="text"
                                  value={newArticle.pua_ttc}
                                  onChange={(e) => handlePriceChange('pua_ttc', e.target.value)}
                                  placeholder="0,000"
                                  className="form-control-lg text-end"
                                />
                                <small className="text-muted">
                                  HT × {newArticle.taux_fodec ? '1.01' : '1'} × {1 + parseNumber(newArticle.tva) / 100}
                                </small>
                              </div>
                            </CardBody>
                          </Card>
                        </Col>

                        <Col md={6}>
                          <Card className="border-0 shadow-sm h-100">
                            <CardBody className="p-4">
                              <h6 className="fw-semibold mb-4 text-primary">
                                <i className="ri-price-tag-3-line me-2"></i>
                                Prix de Vente
                              </h6>

                              <div className="mb-4">
                                <Label className="form-label-lg fw-semibold">Prix de vente HT (DT)</Label>
                                <Input
                                  type="text"
                                  value={newArticle.puv_ht}
                                  onChange={(e) => handlePriceChange('puv_ht', e.target.value)}
                                  placeholder="0,000"
                                  className="form-control-lg text-end"
                                />
                                <small className="text-muted">Prix de vente hors taxes</small>
                              </div>

                              <div className="mb-0">
                                <Label className="form-label-lg fw-semibold">Prix de vente TTC (DT)</Label>
                                <Input
                                  type="text"
                                  value={newArticle.puv_ttc}
                                  onChange={(e) => handlePriceChange('puv_ttc', e.target.value)}
                                  placeholder="0,000"
                                  className="form-control-lg text-end"
                                />
                                <small className="text-muted">
                                  HT × {newArticle.taux_fodec ? '1.01' : '1'} × {1 + parseNumber(newArticle.tva) / 100}
                                </small>
                              </div>
                            </CardBody>
                          </Card>
                        </Col>
                      </Row>

                      {/* ================= TAX SETTINGS ================= */}
                      <Card className="border-0 shadow-sm mb-4">
                        <CardBody className="p-4">
                          <h5 className="fw-semibold mb-4 text-primary">
                            <i className="ri-percent-line me-2"></i>
                            Paramètres Fiscaux
                          </h5>

                          <Row>
                            <Col md={6}>
                              <div className="mb-4">
                                <Label className="form-label-lg fw-semibold">Taux de TVA (%)</Label>
                                <Input
                                  type="select"
                                  value={newArticle.tva}
                                  onChange={(e) => handleTVAChange(e.target.value)}
                                  className="form-control-lg"
                                >
                                  <option value="0">0% (Exonéré)</option>
                                  <option value="7">7%</option>
                                  <option value="10">10%</option>
                                  <option value="13">13%</option>
                                  <option value="19">19% (Taux normal)</option>
                                  <option value="21">21%</option>
                                </Input>
                                <small className="text-muted">Taux de TVA applicable</small>
                              </div>
                            </Col>

                            <Col md={6}>
                              <div className="mb-4">
                                <Label className="form-label-lg fw-semibold d-block">FODEC</Label>
                                <div className="form-check form-switch form-switch-lg">
                                  <Input
                                    type="checkbox"
                                    className="form-check-input"
                                    checked={!!newArticle.taux_fodec}
                                    onChange={(e) => handleFodecChange(e.target.checked)}
                                    id="fodecSwitch"
                                  />
                                  <Label className="form-check-label fw-semibold" for="fodecSwitch">
                                    Appliquer FODEC (1%)
                                  </Label>
                                </div>
                                <small className="text-muted">Taxe FODEC de 1% sur le HT</small>
                              </div>
                            </Col>
                          </Row>
                        </CardBody>
                      </Card>

                      {/* ================= INVENTORY & DETAILS ================= */}
                      <Card className="border-0 shadow-sm mb-4">
                        <CardBody className="p-4">
                          <h5 className="fw-semibold mb-4 text-primary">
                            <i className="ri-store-line me-2"></i>
                            Stock & Détails
                          </h5>
                          <Row>
                            <Col md={6}>
                              <div className="mb-3">
                                <Label className="form-label-lg fw-semibold">Quantité en stock</Label>
                                <Input
                                  type="text"
                                  value={newArticle.qte}
                                  onChange={(e) =>
                                    setNewArticle({ ...newArticle, qte: e.target.value })
                                  }
                                  placeholder="0"
                                  className="form-control-lg"
                                />
                                <small className="text-muted">Stock initial disponible</small>
                              </div>
                            </Col>
                            <Col md={6}>
                              <div className="mb-3">
                                <Label className="form-label-lg fw-semibold">Remise (%)</Label>
                                <Input
                                  type="text"
                                  value={newArticle.remise}
                                  onChange={(e) =>
                                    setNewArticle({ ...newArticle, remise: e.target.value })
                                  }
                                  placeholder="0"
                                  className="form-control-lg"
                                />
                                <small className="text-muted">Pourcentage de remise par défaut</small>
                              </div>
                            </Col>
                          </Row>
                        </CardBody>
                      </Card>
                    </ModalBody>

                    <ModalFooter className="border-0 pt-4">
                      <Button
                        color="light"
                        onClick={() => setArticleModal(false)}
                        className="btn-invoice fs-6 px-4"
                      >
                        <i className="ri-close-line me-2"></i>
                        Annuler
                      </Button>
                      <Button
                        color="success"
                        type="submit"
                        className="btn-invoice btn-invoice-success fs-6 px-4"
                      >
                        <i className="ri-add-line me-2"></i>
                        Créer Article
                      </Button>
                    </ModalFooter>
                  </Form>
                </Modal>


                <Modal
                  isOpen={detailModal}
                  toggle={() => setDetailModal(false)}
                  size="xl"
                  centered
                  className="invoice-modal"
                >
                  <ModalHeader
                    toggle={() => setDetailModal(false)}
                    className="border-0 pb-3"
                  >
                    <div className="d-flex align-items-center">
                      <div className="modal-icon-wrapper bg-info bg-opacity-10 rounded-circle p-2 me-3">
                        <i className="ri-file-list-3-line text-info fs-4"></i>
                      </div>
                      <div>
                        <h4 className="mb-0 fw-bold text-dark">
                          Devis #{selectedBonCommande?.numeroCommande}
                        </h4>
                        <small className="text-muted">
                          {moment(selectedBonCommande?.dateCommande).format(
                            "DD MMM YYYY"
                          )}
                        </small>
                      </div>
                    </div>
                  </ModalHeader>

                  <ModalBody className="pt-0">
                    {selectedBonCommande && (
                      <div className="bon-livraison-details">
                        <Row className="g-3 mb-4">
                          <Col md={6}>
                            <Card className="border-0 shadow-sm h-100">
                              <CardBody className="p-4">
                                <h6 className="fw-semibold mb-3 text-primary">
                                  <i className="ri-user-line me-2"></i>
                                  Informations Client
                                </h6>
                                <div className="d-flex align-items-center">
                                  <div className="flex-grow-1">
                                    <h5 className="mb-1">
                                      {
                                        selectedBonCommande.client
                                          ?.raison_sociale
                                      }
                                    </h5>
                                    <p className="text-muted mb-1">
                                      <i className="ri-phone-line me-1"></i>
                                      {selectedBonCommande.client?.telephone1 ||
                                        "N/A"}
                                    </p>
                                    <p className="text-muted mb-0">
                                      <i className="ri-map-pin-line me-1"></i>
                                      {selectedBonCommande.client?.adresse ||
                                        "N/A"}
                                    </p>
                                  </div>
                                </div>
                              </CardBody>
                            </Card>
                          </Col>

                          <Col md={6}>
                            <Card className="border-0 shadow-sm h-100">
                              <CardBody className="p-4">
                                <h6 className="fw-semibold mb-3 text-primary">
                                  <i className="ri-information-line me-2"></i>
                                  Informations Devis
                                </h6>
                                <div className="row g-2">
                                  <div className="col-6">
                                    <p className="mb-2">
                                      <span className="text-muted d-block">
                                        Vendeur:
                                      </span>
                                      <strong>
                                        {selectedBonCommande.vendeur
                                          ? `${selectedBonCommande.vendeur.nom} ${selectedBonCommande.vendeur.prenom}`
                                          : "N/A"}
                                      </strong>
                                    </p>
                                  </div>
                                  <div className="col-6">
                                    <p className="mb-2">
                                      <span className="text-muted d-block">
                                        Statut:
                                      </span>
                                      <StatusBadge
                                        status={selectedBonCommande.status}
                                      />
                                    </p>
                                  </div>
                                </div>
                              </CardBody>
                            </Card>
                          </Col>
                        </Row>

                        {selectedBonCommande.notes && (
                          <Card className="border-0 shadow-sm mb-4">
                            <CardBody className="p-4">
                              <h6 className="fw-semibold mb-3 text-primary">
                                <i className="ri-sticky-note-line me-2"></i>
                                Notes
                              </h6>
                              <p className="mb-0 text-muted">
                                {selectedBonCommande.notes}
                              </p>
                            </CardBody>
                          </Card>
                        )}

                        <Card className="border-0 shadow-sm">
                          <CardBody className="p-0">
                            <div className="table-responsive">
                              <Table className="table table-hover mb-0">
                                <thead className="table-dark">
                                  <tr>
                                    <th className="ps-4">Article</th>
                                    <th>Référence</th>
                                    <th className="text-end">Quantité</th>
                                    <th className="text-end">
                                      Prix Unitaire HT
                                    </th>
                                    <th className="text-end">
                                      Prix Unitaire TTC
                                    </th>
                                    <th className="text-end">TVA (%)</th>
                                    <th className="text-end">Total HT</th>
                                    <th className="text-end pe-4">Total TTC</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {selectedBonCommande.articles.map(
                                    (item, index) => {
                                      const quantite =
                                        Number(item.quantite) || 0;
                                      const priceHT =
                                        Number(item.prixUnitaire) || 0;
                                      const tvaRate = Number(item.tva ?? 0);
                                      const remiseRate = Number(
                                        item.remise || 0
                                      );

                                      // USE prix_ttc FROM DATABASE OR CALCULATE FROM ARTICLE puv_ttc
                                      const priceTTC =
                                        Number(item.prix_ttc) ||
                                        Number(item.article?.puv_ttc) ||
                                        priceHT * (1 + tvaRate / 100);

                                      const montantSousTotalHT =
                                        Math.round(quantite * priceHT * 1000) /
                                        1000;
                                      const montantNetHT =
                                        Math.round(
                                          quantite *
                                          priceHT *
                                          (1 - remiseRate / 100) *
                                          1000
                                        ) / 1000;
                                      const montantTTCLigne =
                                        Math.round(quantite * priceTTC * 1000) /
                                        1000;

                                      return (
                                        <tr
                                          key={index}
                                          className={
                                            index % 2 === 0 ? "bg-light" : ""
                                          }
                                        >
                                          <td className="ps-4">
                                            <div className="d-flex align-items-center">
                                              <div className="flex-grow-1">
                                                <h6 className="mb-0 fw-semibold fs-6">
                                                  {item.designation ||
                                                    item.article?.designation}
                                                </h6>
                                              </div>
                                            </div>
                                          </td>
                                          <td>
                                            <Badge
                                              color="light"
                                              className="text-dark"
                                            >
                                              {item.article?.reference || "-"}
                                            </Badge>
                                          </td>
                                          <td className="text-end fw-semibold">
                                            {quantite}
                                          </td>
                                          <td className="text-end">
                                            {priceHT.toFixed(3)} DT
                                          </td>
                                          <td className="text-end">
                                            {priceTTC.toFixed(3)} DT
                                          </td>
                                          <td className="text-end">
                                            {tvaRate}%
                                          </td>
                                          <td className="text-end fw-semibold">
                                            {montantNetHT.toFixed(3)} DT
                                          </td>
                                          <td className="text-end pe-4 fw-semibold text-primary">
                                            {montantTTCLigne.toFixed(3)} DT
                                          </td>
                                        </tr>
                                      );
                                    }
                                  )}
                                </tbody>
                              </Table>
                            </div>
                            <div className="border-top p-4">
                              <Row className="justify-content-end">
                                <Col xs={8} sm={6} md={5} lg={4}>
                                  {(() => {
                                    let sousTotalHTValue = 0;
                                    let totalTaxValue = 0;
                                    let grandTotalValue = 0;

                                    // Calculate original totals
                                    selectedBonCommande.articles.forEach(
                                      (article: any) => {
                                        const qty =
                                          Number(article.quantite) || 0;
                                        const articleRemise =
                                          Number(article.remise) || 0;

                                        const unitHT =
                                          Number(article.prixUnitaire) || 0;
                                        const tvaRate = Number(
                                          article.tva ?? 0
                                        );
                                        const unitTTC =
                                          Number(article.prix_ttc) !== 0
                                            ? Number(article.prix_ttc)
                                            : Number(
                                              article.article?.puv_ttc
                                            ) || unitHT * (1 + tvaRate / 100);

                                        // Round to 3 decimals
                                        const round = (num: number) =>
                                          Math.round(num * 1000) / 1000;

                                        const montantSousTotalHT = round(
                                          qty * unitHT
                                        );
                                        const montantNetHTLigne = round(
                                          qty *
                                          unitHT *
                                          (1 - articleRemise / 100)
                                        );
                                        const montantTTCLigne = round(
                                          qty * unitTTC
                                        );
                                        const montantTVALigne = round(
                                          montantTTCLigne - montantNetHTLigne
                                        );

                                        sousTotalHTValue += montantSousTotalHT;
                                        totalTaxValue += montantTVALigne;
                                        grandTotalValue += montantTTCLigne;
                                      }
                                    );

                                    // Round totals
                                    sousTotalHTValue =
                                      Math.round(sousTotalHTValue * 1000) /
                                      1000;
                                    totalTaxValue =
                                      Math.round(totalTaxValue * 1000) / 1000;
                                    grandTotalValue =
                                      Math.round(grandTotalValue * 1000) / 1000;

                                    const remiseValue =
                                      Number(selectedBonCommande.remise) || 0;
                                    const remiseTypeValue =
                                      selectedBonCommande.remiseType ||
                                      "percentage";

                                    let finalTotalValue = grandTotalValue;
                                    let discountAmountValue = 0;
                                    let netHTValue = sousTotalHTValue;
                                    let displayTotalTax = totalTaxValue;
                                    let discountPercentage = 0;

                                    if (remiseValue > 0) {
                                      if (remiseTypeValue === "percentage") {
                                        // Percentage discount
                                        discountAmountValue =
                                          (sousTotalHTValue * remiseValue) /
                                          100;
                                        netHTValue =
                                          sousTotalHTValue -
                                          discountAmountValue;

                                        const tvaToHtRatio =
                                          sousTotalHTValue > 0
                                            ? totalTaxValue / sousTotalHTValue
                                            : 0;
                                        displayTotalTax =
                                          netHTValue * tvaToHtRatio;
                                        finalTotalValue =
                                          netHTValue + displayTotalTax;

                                        discountPercentage = remiseValue;
                                      } else if (remiseTypeValue === "fixed") {
                                        // Fixed discount
                                        finalTotalValue = remiseValue;

                                        // Find unique TVA rates
                                        const tvaRates = Array.from(
                                          new Set(
                                            selectedBonCommande.articles.map(
                                              (a: any) => Number(a.tva ?? 0)
                                            )
                                          )
                                        );

                                        if (
                                          tvaRates.length === 1 &&
                                          tvaRates[0] > 0
                                        ) {
                                          // Single TVA rate: HT = TTC / (1 + TVA rate)
                                          const tvaRate = tvaRates[0] / 100;
                                          netHTValue =
                                            finalTotalValue / (1 + tvaRate);
                                          displayTotalTax =
                                            finalTotalValue - netHTValue;
                                        } else {
                                          // Multiple TVA rates: proportional method
                                          const discountCoefficient =
                                            finalTotalValue / grandTotalValue;

                                          let newTotalHT = 0;
                                          let newTotalTVA = 0;

                                          selectedBonCommande.articles.forEach(
                                            (article: any) => {
                                              const qty =
                                                Number(article.quantite) || 0;
                                              const unitHT =
                                                Number(article.prixUnitaire) ||
                                                0;
                                              const tvaRate =
                                                Number(article.tva ?? 0) / 100;

                                              const newLineHT =
                                                qty *
                                                unitHT *
                                                discountCoefficient;
                                              const newLineTVA =
                                                newLineHT * tvaRate;

                                              newTotalHT += newLineHT;
                                              newTotalTVA += newLineTVA;
                                            }
                                          );

                                          netHTValue = newTotalHT;
                                          displayTotalTax = newTotalTVA;
                                        }

                                        discountAmountValue =
                                          sousTotalHTValue - netHTValue;
                                        discountPercentage =
                                          (discountAmountValue /
                                            grandTotalValue) *
                                          100;
                                      }

                                      // Round final values
                                      netHTValue =
                                        Math.round(netHTValue * 1000) / 1000;
                                      displayTotalTax =
                                        Math.round(displayTotalTax * 1000) /
                                        1000;
                                      finalTotalValue =
                                        Math.round(finalTotalValue * 1000) /
                                        1000;
                                      discountAmountValue =
                                        Math.round(discountAmountValue * 1000) /
                                        1000;
                                      discountPercentage =
                                        Math.round(discountPercentage * 1000) /
                                        1000;
                                    }

                                    return (
                                      <Table className="table-sm table-borderless mb-0">
                                        <tbody>
                                          <tr className="real-time-update">
                                            <th className="text-end text-muted fs-6">
                                              Sous-total H.T.:
                                            </th>
                                            <td className="text-end fw-semibold fs-6">
                                              {sousTotalHTValue.toFixed(3)} DT
                                            </td>
                                          </tr>
                                          <tr className="real-time-update">
                                            <th className="text-end text-muted fs-6">
                                              Net H.T.:
                                            </th>
                                            <td className="text-end fw-semibold fs-6">
                                              {netHTValue.toFixed(3)} DT
                                            </td>
                                          </tr>
                                          <tr className="real-time-update">
                                            <th className="text-end text-muted fs-6">
                                              TVA:
                                            </th>
                                            <td className="text-end fw-semibold fs-6">
                                              {displayTotalTax.toFixed(3)} DT
                                            </td>
                                          </tr>
                                          <tr className="real-time-update">
                                            <th className="text-end text-muted fs-6">
                                              Total TTC:
                                            </th>
                                            <td className="text-end fw-semibold fs-6 text-dark">
                                              {grandTotalValue.toFixed(3)} DT
                                            </td>
                                          </tr>
                                          {remiseValue > 0 && (
                                            <tr className={`real-time-update ${discountPercentage > 10 ? "table-danger" : "table-success"}`}>
                                              <th className={`text-end fs-6 ${discountPercentage > 10 ? "text-danger" : "text-success"}`}>
                                                {remiseTypeValue ===
                                                  "percentage"
                                                  ? `Remise (${remiseValue}%)`
                                                  : `Remise (Montant fixe) ${discountPercentage.toFixed(
                                                    2
                                                  )}%`}
                                              </th>
                                              <td className={`text-end fw-bold fs-6 ${discountPercentage > 10 ? "text-danger" : "text-success"}`}>
                                                - {discountAmountValue.toFixed(3)} DT
                                              </td>
                                            </tr>
                                          )}
                                          <tr className="final-total real-time-update border-top">
                                            <th className="text-end fs-5">
                                              NET À PAYER:
                                            </th>
                                            <td className="text-end fw-bold fs-5 text-primary">
                                              {finalTotalValue.toFixed(3)} DT
                                            </td>
                                          </tr>
                                        </tbody>
                                      </Table>
                                    );
                                  })()}
                                </Col>
                              </Row>
                            </div>
                          </CardBody>
                        </Card>
                      </div>
                    )}
                  </ModalBody>

                  <ModalFooter className="border-0 pt-4">
                    <Button
                      color="success"
                      size="md"
                      onClick={() => {
                        if (selectedBonCommande) {
                          setBonCommande(selectedBonCommande);
                          setSelectedClient(
                            selectedBonCommande?.client ?? null
                          );
                          // In the create bon commande button click handler:
                          setSelectedArticles(
                            selectedBonCommande.articles.map((item) => ({
                              article_id: item.article?.id || 0,
                              quantite: item.quantite,
                              articleDetails: item.article, // ✅ This includes the article reference
                              prixUnitaire:
                                typeof item.prixUnitaire === "string"
                                  ? parseFloat(item.prixUnitaire)
                                  : item.prixUnitaire,
                              prixTTC:
                                Number(item.prix_ttc) ||
                                Number(item.article?.puv_ttc) ||
                                (typeof item.prixUnitaire === "string"
                                  ? parseFloat(item.prixUnitaire)
                                  : item.prixUnitaire) *
                                (1 + (item.tva || 0) / 100),
                              tva:
                                item.tva != null
                                  ? typeof item.tva === "string"
                                    ? parseFloat(item.tva)
                                    : item.tva
                                  : null,
                              remise:
                                item.remise != null
                                  ? typeof item.remise === "string"
                                    ? parseFloat(item.remise)
                                    : item.remise
                                  : null,
                              designation: item.designation || item.article?.designation || "", // Add this line

                            }))
                          );
                          setGlobalRemise(selectedBonCommande.remise || 0);
                          setRemiseType(
                            selectedBonCommande.remiseType || "percentage"
                          );
                          setShowRemise((selectedBonCommande.remise || 0) > 0);
                          setIsCreatingCommande(true);
                          setIsEdit(false);
                          validation.setValues({
                            ...validation.values,
                            numeroCommande: nextNumeroCommande,
                            client_id: selectedBonCommande.client?.id ?? "",
                            vendeur_id: selectedBonCommande.vendeur?.id ?? "",
                            dateCommande: moment().format("YYYY-MM-DD"),
                            status: "Confirme",
                            notes: selectedBonCommande.notes ?? "",
                          });
                          setModal(true);
                        }
                      }}
                      className="btn-invoice btn-invoice-success me-2"
                    >
                      <i className="ri-file-list-3-line me-2"></i> Créer Bon de
                      Commande
                    </Button>

                    <Button
                      color="light"
                      onClick={() => setDetailModal(false)}
                      className="btn-invoice"
                    >
                      <i className="ri-close-line me-2"></i> Fermer
                    </Button>
                  </ModalFooter>
                </Modal>

                <ToastContainer />
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Edit Client Modal */}
      <EditClientModal
        isOpen={editClientModal}
        toggle={() => setEditClientModal(false)}
        client={editingClient}
        onClientUpdated={(updatedClient) => {
          // Update the client in the clients list
          setClients(prev => prev.map(c =>
            c.id === updatedClient.id ? updatedClient : c
          ));

          // Update filtered clients if needed
          setFilteredClients(prev => prev.map(c =>
            c.id === updatedClient.id ? updatedClient : c
          ));

          // If the updated client is currently selected, update it
          if (selectedClient?.id === updatedClient.id) {
            setSelectedClient(updatedClient);
          }

          // Refresh clients list
          loadClients(clientSearch, 1, 20);
        }}
      />

      {/* PDF Modal */}
      {selectedPdfDevis && (
        <DevisPDFModal
          isOpen={pdfModal}
          toggle={() => setPdfModal(!pdfModal)}
          bonCommande={selectedPdfDevis}
          companyInfo={companyInfo}
        />
      )}
    </div>
  );
};

export default Devis;
