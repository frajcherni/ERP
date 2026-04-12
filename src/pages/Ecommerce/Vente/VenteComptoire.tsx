import React, {
  Fragment,
  useEffect,
  useState,
  useMemo,
  useRef,
  useCallback,
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
import { fetchDepots } from "../Stock/DepotServices";
import { Depot } from "../../../Components/Article/Interfaces";

import {
  createFacture,
  fetchNextFactureNumberFromAPI,
} from "./FactureClientServices";
import {
  fetchVenteComptoire,
  CreateVenteComptoire,
  updateventecomptoire,
  deleteventecomptoire,
  fetchNextVenteComptoireNumber,
} from "../../../Components/CommandeClient/CommandeClientServices";
import {
  fetchVendeurs,
  fetchFournisseurs,
  fetchCategories,
  searchArticles,
  searchClients,
  // Add this import
} from "../../../Components/Article/ArticleServices";
import {
  Article,
  Client,
  Vendeur,
  BonCommandeClient,
  Categorie,
  Fournisseur,
} from "../../../Components/Article/Interfaces";
import EditClientModal from "./EditClientModal";

import classnames from "classnames";
import VenteComptoirePDFModal from "./VenteComptoirePDFModal";
import { pdf } from "@react-pdf/renderer";
import VenteComptoirePDF from "./VenteComptoirePDF";
import VenteComptoireReceiptPDF from "./VenteComptoireReceiptPDF";
import { useProfile } from "Components/Hooks/UserHooks";
import logo from "../../../assets/images/imglogo.png";
import DiscountAlertModal from "../../../Components/Common/DiscountAlertModal";

import {
  createClient,
  createArticle,
} from "../../../Components/Article/ArticleServices";
const VenteComptoire = () => {
  const [detailModal, setDetailModal] = useState(false);
  const [selectedBonCommande, setSelectedBonCommande] =
    useState<BonCommandeClient | null>(null);
  const [taxMode, setTaxMode] = useState<"HT" | "TTC">("HT");
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
  const [nextNumeroCommande, setNextNumeroCommande] = useState("");
  const [remiseType, setRemiseType] = useState<"percentage" | "fixed">("fixed");
  const [globalRemise, setGlobalRemise] = useState<number>(0);
  const [selectedArticles, setSelectedArticles] = useState<
    {
      article_id: number;
      quantite: number | "";
      prixUnitaire: number;
      prixTTC: number;
      designation?: string;
      tva?: number | null;
      remise?: number | null;
      articleDetails?: Article;
    }[]
  >([]);
  const [pdfModal, setPdfModal] = useState(false);
  const [selectedBonCommandeForPdf, setSelectedBonCommandeForPdf] =
    useState<BonCommandeClient | null>(null);
  const { userProfile, loading: profileLoading } = useProfile();
  const [pdfType, setPdfType] = useState<"facture" | "receipt">("facture");
  const [editingTTC, setEditingTTC] = useState<{ [key: number]: string }>({});
  const [editingHT, setEditingHT] = useState<{ [key: number]: string }>({});
  const [phoneSearch, setPhoneSearch] = useState("");
  const [depots, setDepots] = useState<Depot[]>([]);
  const [selectedDepot, setSelectedDepot] = useState<Depot | null>(null);
  const [isCreatingFacture, setIsCreatingFacture] = useState(false);
  const [nextFactureNumber, setNextFactureNumber] = useState("");
  const [timbreFiscal, setTimbreFiscal] = useState<boolean>(true);

  const [exoneration, setExoneration] = useState<string>("");
  const [conditionPaiement, setConditionPaiement] =
    useState<string>("30 jours");

  const [editClientModal, setEditClientModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // === FONCTIONS DE CALCUL TVA/FODEC TUNISIEN ===
  const parseNumber = (value: string | number): number => {
    if (value === null || value === undefined || value === "") return 0;
    const strValue = String(value)
      .replace(/[^\d.,]/g, "")
      .replace(",", ".");
    const num = parseFloat(strValue);
    return isNaN(num) ? 0 : Math.round(num * 100000) / 100000;
  };

  // Formatage avec 3 décimales
  const formatNumber = (value: number): string => {
    if (value === 0) return "";
    return (Math.round(value * 1000) / 1000).toFixed(3).replace(".", ",");
  };

  // === CALCUL TTC AVEC FODEC (Norme tunisienne) ===
  // Formule : TTC = HT × 1.01 × (1 + TVA/100)
  const calculateTTCFromHT = (
    ht: number,
    tva: number,
    hasFodec: boolean
  ): number => {
    const htValue = parseNumber(ht);
    const tvaRate = parseNumber(tva);

    if (tvaRate === 0 && !hasFodec) return htValue;

    let baseTTC = htValue;

    if (hasFodec) {
      baseTTC = htValue * 1.01;
    }

    if (tvaRate > 0) {
      baseTTC = baseTTC * (1 + tvaRate / 100);
    }

    return Math.round(baseTTC * 1000) / 1000;
  };

  // === CALCUL HT À PARTIR DE TTC (Norme tunisienne) ===
  // Formule inverse : HT = TTC / (1.01 × (1 + TVA/100))
  const calculateHTFromTTC = (
    ttc: number,
    tva: number,
    hasFodec: boolean
  ): number => {
    const ttcValue = parseNumber(ttc);
    const tvaRate = parseNumber(tva);

    if (tvaRate === 0 && !hasFodec) return ttcValue;

    let factor = 1;

    if (hasFodec) {
      factor *= 1.01;
    }

    if (tvaRate > 0) {
      factor *= 1 + tvaRate / 100;
    }

    const ht = ttcValue / factor;
    return Math.round(ht * 1000) / 1000;
  };

  // Gestionnaire unifié pour les changements de prix
  const handlePriceChange = (field: keyof typeof newArticle, value: string) => {
    const newValue = value.replace(",", ".");
    const tva = parseNumber(newArticle.tva);
    const hasFodec = newArticle.taux_fodec;

    setNewArticle((prev) => ({ ...prev, [field]: newValue }));

    switch (field) {
      case "pua_ht": {
        const ht = parseNumber(newValue);
        const ttc = calculateTTCFromHT(ht, tva, hasFodec);
        setNewArticle((prev) => ({ ...prev, pua_ttc: formatNumber(ttc) }));
        break;
      }
      case "pua_ttc": {
        const ttc = parseNumber(newValue);
        const ht = calculateHTFromTTC(ttc, tva, hasFodec);
        setNewArticle((prev) => ({ ...prev, pua_ht: formatNumber(ht) }));
        break;
      }
      case "puv_ht": {
        const ht = parseNumber(newValue);
        const ttc = calculateTTCFromHT(ht, tva, hasFodec);
        setNewArticle((prev) => ({ ...prev, puv_ttc: formatNumber(ttc) }));
        break;
      }
      case "puv_ttc": {
        const ttc = parseNumber(newValue);
        const ht = calculateHTFromTTC(ttc, tva, hasFodec);
        setNewArticle((prev) => ({ ...prev, puv_ht: formatNumber(ht) }));
        break;
      }
    }
  };

  // Gestionnaire pour TVA
  const handleTVAChange = (value: string) => {
    const oldTva = parseNumber(newArticle.tva);
    const newTva = parseNumber(value);
    const hasFodec = newArticle.taux_fodec;

    setNewArticle((prev) => ({ ...prev, tva: value }));

    setTimeout(() => {
      if (newArticle.pua_ht) {
        const ht = parseNumber(newArticle.pua_ht);
        const ttc = calculateTTCFromHT(ht, newTva, hasFodec);
        setNewArticle((prev) => ({ ...prev, pua_ttc: formatNumber(ttc) }));
      }

      if (newArticle.puv_ht) {
        const ht = parseNumber(newArticle.puv_ht);
        const ttc = calculateTTCFromHT(ht, newTva, hasFodec);
        setNewArticle((prev) => ({ ...prev, puv_ttc: formatNumber(ttc) }));
      }
    }, 10);
  };

  // Gestionnaire pour FODEC
  const handleFodecChange = (checked: boolean) => {
    const tva = parseNumber(newArticle.tva);

    setNewArticle((prev) => ({ ...prev, taux_fodec: checked }));

    setTimeout(() => {
      if (newArticle.pua_ht) {
        const ht = parseNumber(newArticle.pua_ht);
        const ttc = calculateTTCFromHT(ht, tva, checked);
        setNewArticle((prev) => ({ ...prev, pua_ttc: formatNumber(ttc) }));
      }

      if (newArticle.puv_ht) {
        const ht = parseNumber(newArticle.puv_ht);
        const ttc = calculateTTCFromHT(ht, tva, checked);
        setNewArticle((prev) => ({ ...prev, puv_ttc: formatNumber(ttc) }));
      }
    }, 10);
  };
  // Add ref for article search input
  const articleSearchRef = useRef<HTMLInputElement>(null);

  // Replace your current payment states with this:
  const [paymentMethods, setPaymentMethods] = useState<
    Array<{
      id: string;
      method:
      | "especes"
      | "cheque"
      | "virement"
      | "traite"
      | "carte"
      | "Carte Bancaire TPE"
      | "retenue"
      | "autre"; // Add "tpe"
      amount: number;
      numero?: string;
      banque?: string;
      dateEcheance?: string;
    }>
  >([
    {
      id: "1",
      method: "especes",
      amount: 0,
    },
  ]);

  const [modeReglement, setModeReglement] = useState<
    | "especes"
    | "cheque"
    | "virement"
    | "carte"
    | "traite"
    | "autre"
    | "Carte Bancaire TPE" // Add "tpe"
  >("especes");
  const [numeroReglement, setNumeroReglement] = useState("");
  const [dateEcheance, setDateEcheance] = useState(
    moment().format("YYYY-MM-DD")
  );
  const [banqueCheque, setBanqueCheque] = useState("");
  const [espaceNotes, setEspaceNotes] = useState("");
  const [showDiscountAlert, setShowDiscountAlert] = useState(false);
  const [isDiscountConfirmed, setIsDiscountConfirmed] = useState(false);
  const [montantVirement, setMontantVirement] = useState<number>(0);

  // Add near your other state declarations
  const [barcodeInput, setBarcodeInput] = useState("");
  const [scanningTimeout, setScanningTimeout] = useState<NodeJS.Timeout | null>(
    null
  );

  const [categories, setCategories] = useState<Categorie[]>([]);
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [subcategories, setSubcategories] = useState<Categorie[]>([]);
  // Add near your other state declarations
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [dropdownRef, setDropdownRef] = useState<HTMLDivElement | null>(null);
  const [itemRefs, setItemRefs] = useState<React.RefObject<HTMLLIElement>[]>(
    []
  );
  const [clientModal, setClientModal] = useState(false);
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
    status: "Actif" as "Actif" | "Inactif", // Fix the type
  });

  // Add these states
  const [articleModal, setArticleModal] = useState(false);
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

  const [secondaryLoading, setSecondaryLoading] = useState(false);
  const [articlesLoading, setArticlesLoading] = useState(false);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  // Add these functions
  const handleCreateClient = async () => {
    try {
      // Create the client
      const createdClient = await createClient(newClient);
      toast.success("Client créé avec succès");

      // Refresh clients list using search with empty query (limited results)
      const clientsSearchResult = await searchClients({
        query: "",
        page: 1,
        limit: 50, // Limit to reasonable number
      });

      // Use the searched clients instead of all clients
      const newClientData = createdClient; // The API returns the created client

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

      // Also add to filtered clients for immediate visibility
      setFilteredClients((prev) => [newClientData, ...prev]);
    } catch (err) {
      console.error("Error creating client:", err);
      toast.error("Erreur lors de la création du client");
    }
  };

  const handleEditClient = (client: Client, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setEditingClient(client);
    setEditClientModal(true);
  };

  // Enhanced phone formatting function
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

  // Enhanced phone detection function
  const isPhoneNumberInput = (value: string): boolean => {
    // Remove spaces for counting
    const cleanValue = value.replace(/\s/g, "");

    // If empty, not a phone number
    if (!cleanValue) return false;

    // Count digits
    const digitCount = (cleanValue.match(/\d/g) || []).length;
    const totalLength = cleanValue.length;

    // More lenient detection: if mostly digits OR if it's exactly 8 digits with spaces
    const isMostlyDigits = digitCount >= totalLength * 0.7;
    const isEightDigitsWithSpaces = cleanValue.length === 8 && digitCount === 8;
    const hasEightDigitsTotal = digitCount === 8;

    return isMostlyDigits || isEightDigitsWithSpaces || hasEightDigitsTotal;
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
  // Function to normalize name for searching (remove accents, etc.)
  const normalizeName = (name: string): string => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove accents
      .trim();
  };

  // Add this function
  const calculateTTCForQuickCreate = (
    ht: number,
    tva: number,
    hasFodec: boolean
  ) => {
    const htValue = Number(ht) || 0;
    const tvaRate = Number(tva) || 0;
    const tvaAmount = htValue * (tvaRate / 100);
    const fodecAmount = hasFodec ? htValue * 0.01 : 0;
    return (htValue + tvaAmount + fodecAmount).toFixed(3);
  };

  // Add new payment method
  const addPaymentMethod = () => {
    setPaymentMethods((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        method: "especes",
        amount: 0,
      },
    ]);
  };

  // Remove payment method
  const removePaymentMethod = (id: string) => {
    if (paymentMethods.length > 1) {
      setPaymentMethods((prev) => prev.filter((pm) => pm.id !== id));
    }
  };

  // Update payment method
  const updatePaymentMethod = (id: string, field: string, value: any) => {
    setPaymentMethods((prev) =>
      prev.map((pm) => (pm.id === id ? { ...pm, [field]: value } : pm))
    );
  };

  const handleCreateArticle = async () => {
    try {
      const articleToCreate = {
        ...newArticle,
        pua_ht: parseNumber(newArticle.pua_ht),
        pua_ttc: parseNumber(newArticle.pua_ttc),
        puv_ht: parseNumber(newArticle.puv_ht),
        puv_ttc: parseNumber(newArticle.puv_ttc),
        qte: parseNumber(newArticle.qte),
        tva: parseNumber(newArticle.tva),
        remise: parseNumber(newArticle.remise),
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

      console.log("Creating article:", articleToCreate);

      await createArticle(articleToCreate);
      toast.success("Article créé avec succès");

      // Refresh articles list
      const articlesResult = await searchArticles({
        query: "",
        page: 1,
        limit: 25,
      });
      setArticles(articlesResult.articles || []);

      // Reset form
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
    } catch (err) {
      console.error("Error creating article:", err);
      toast.error("Erreur lors de la création de l'article");
    }
  };
  // Add this effect for auto-calculation

  // Add this effect for subcategories
  useEffect(() => {
    if (newArticle.categorie_id) {
      const categoryId = parseInt(newArticle.categorie_id);
      const subs = categories.filter((cat) => cat.parent_id === categoryId);
      setSubcategories(subs);

      // Reset subcategory if parent category changes
      if (
        !subs.find((sub) => sub.id === parseInt(newArticle.sous_categorie_id))
      ) {
        setNewArticle((prev) => ({ ...prev, sous_categorie_id: "" }));
      }
    } else {
      setSubcategories([]);
      setNewArticle((prev) => ({ ...prev, sous_categorie_id: "" }));
    }
  }, [newArticle.categorie_id, categories]);

  const handleDirectPrint = async (
    bonCommande: BonCommandeClient,
    type: "facture" | "receipt"
  ) => {
    try {
      const PDFComponent =
        type === "facture" ? VenteComptoirePDF : VenteComptoireReceiptPDF;

      // Créer le blob PDF
      const pdfBlob = await pdf(
        <PDFComponent bonCommande={bonCommande} companyInfo={companyInfo} />
      ).toBlob();

      // Créer l'URL et ouvrir dans une nouvelle fenêtre
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const printWindow = window.open(pdfUrl, "_blank");

      if (printWindow) {
        // Attendre que le PDF soit chargé puis déclencher l'impression
        setTimeout(() => {
          printWindow.print();
        }, 1000);
      }
    } catch (error) {
      console.error("Erreur impression:", error);
      toast.error("Erreur lors de l'impression");
    }
  };

  const openPdfModal = (
    bonCommande: BonCommandeClient,
    type: "facture" | "receipt"
  ) => {
    setSelectedBonCommandeForPdf(bonCommande);
    setPdfType(type);
    setPdfModal(true);
  };

  const tvaOptions = [
    { value: null, label: "Non applicable" },
    { value: 0, label: "0% (Exonéré)" },
    { value: 7, label: "7%" },
    { value: 10, label: "10%" },
    { value: 13, label: "13%" },
    { value: 19, label: "19%" },
    { value: 21, label: "21%" },
  ];

  const companyInfo = useMemo(
    () => ({
      name: userProfile?.company_name || "Votre Société",
      address: userProfile?.company_address || "Adresse",
      city: userProfile?.company_city || "Ville",
      phone: userProfile?.company_phone || "Téléphone",
      email: userProfile?.company_email || "Email",
      website: userProfile?.company_website || "Site web",
      taxId: userProfile?.company_tax_id || "MF",
      logo: logo,
      gsm: userProfile?.company_gsm,
    }),
    [userProfile]
  );
  const fetchNextNumber = useCallback(async () => {
    try {
      const numero = await fetchNextVenteComptoireNumber();
      setNextNumeroCommande(numero);
    } catch (err) {
      toast.error("Échec de la récupération du numéro de vente");

      const year = moment().format("YYYY");

      // always start from 925
      const DEFAULT_START = 925;

      // if bonsCommande exist, continue from max(bonsCommande.length + 1, 925)
      const safeSequence = Math.max(bonsCommande.length + 1, DEFAULT_START);

      const defaultNumber = `VENTE-${String(safeSequence).padStart(
        4,
        "0"
      )}/${year}`;

      setNextNumeroCommande(defaultNumber);
    }
  }, [bonsCommande.length]);

  useEffect(() => {
    if (modal && !isEdit) {
      fetchNextNumber();
    }
  }, [modal, isEdit, fetchNextNumber]);

  // Enhanced client search functionality
  // Client search functionality - same as Devis
  // Enhanced client search functionality
  // Enhanced client search functionality

  const fetchData = useCallback(async (skipSecondary = false) => {
    try {
      setLoading(true);

      // PHASE 1: Load critical data only
      const [bonsData, vendeursData] = await Promise.all([
        fetchVenteComptoire(),
        fetchVendeurs(),
      ]);

      setBonsCommande(bonsData);
      setFilteredBonsCommande(bonsData);
      setVendeurs(vendeursData);

      // PHASE 2: Load secondary data only if not skipped
      if (!skipSecondary) {
        setSecondaryLoading(true);

        try {
          // Load depot and categories first (needed for forms)
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

          // Then load articles and clients in parallel
          const [articlesResult, clientsResult, fournisseursData] =
            await Promise.all([
              searchArticles({ query: "", page: 1, limit: 25 }), // Reduced from 50
              searchClients({ query: "", page: 1, limit: 25 }), // Reduced from 50
              fetchFournisseurs(),
            ]);

          setArticles(articlesResult.articles || []);
          setFilteredClients(clientsResult.clients || []);
          setFournisseurs(fournisseursData);
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
        const [depotsResult, categoriesResult] = await Promise.all([
          fetchDepots(),
          fetchCategories(),
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

        // Load initial articles and clients for modal
        await Promise.all([loadArticles("", 1, 15), loadClients("", 1, 15)]);
      } catch (err) {
        console.error("Modal data loading failed:", err);
      } finally {
        setModalLoading(false);
      }
    }
  };

  // Initial load - only critical data
  useEffect(() => {
    fetchData(true); // true means skip secondary data initially
  }, [fetchData]);

  // Load modal data when modal opens
  useEffect(() => {
    if (modal) {
      loadModalData();
    }
  }, [modal]);

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

  // Add this near your other helper functions
  const {
    sousTotalHT,
    netHT,
    totalTax,
    grandTotal,
    finalTotal,
    discountAmount,
    discountPercentage, // ← ADD THIS TO DESTRUCTURING
  } = useMemo(() => {
    if (selectedArticles.length === 0) {
      return {
        sousTotalHT: 0,
        netHT: 0,
        totalTax: 0,
        grandTotal: 0,
        finalTotal: 0,
        discountAmount: 0,
        discountPercentage: 0, // ← ADD THIS
      };
    }

    let sousTotalHTValue = 0;
    let totalTaxValue = 0;
    let grandTotalValue = 0;
    let discountPercentageValue = 0; // ← ADD THIS VARIABLE

    // -----------------------------
    // ORIGINAL TOTALS
    // -----------------------------
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

      const montantNetHTLigne =
        Math.round(qty * lineHT * (1 - articleRemise / 100) * 1000) / 1000;

      const montantTTCLigne = Math.round(qty * lineTTC * 1000) / 1000;

      const montantTVALigne =
        Math.round((montantTTCLigne - montantNetHTLigne) * 1000) / 1000;

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

    // -----------------------------
    // GLOBAL REMISE
    // -----------------------------
    if (showRemise && Number(globalRemise) > 0) {
      // ===== % REMISE =====
      if (remiseType === "percentage") {
        discountAmountValue = (sousTotalHTValue * Number(globalRemise)) / 100;

        netHTValue = sousTotalHTValue - discountAmountValue;

        const ratio =
          sousTotalHTValue > 0 ? totalTaxValue / sousTotalHTValue : 0;

        totalTaxValue = netHTValue * ratio;
        finalTotalValue = netHTValue + totalTaxValue;

        // ← ADD THIS - Set percentage directly for percentage remise
        discountPercentageValue = Number(globalRemise);
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
          discountPercentageValue = 0; // ← ADD THIS
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

          // ← ADD THIS - Calculate percentage based on grandTotal for fixed remise
          if (grandTotalValue > 0) {
            discountPercentageValue = ((grandTotalValue - finalTotalValue) / grandTotalValue) * 100;
          } else {
            discountPercentageValue = 0;
          }
        }
      }

      // Final rounding + SAFE remise derivation
      netHTValue = Math.round(netHTValue * 1000) / 1000;
      totalTaxValue = Math.round(totalTaxValue * 1000) / 1000;
      finalTotalValue = Math.round(finalTotalValue * 1000) / 1000;

      discountAmountValue =
        Math.round((sousTotalHTValue - netHTValue) * 1000) / 1000;

      // ← ADD THIS - Round the percentage
      discountPercentageValue = Math.round(discountPercentageValue * 1000) / 1000;
    }

    return {
      sousTotalHT: sousTotalHTValue,
      netHT: netHTValue,
      totalTax: totalTaxValue,
      grandTotal: grandTotalValue,
      finalTotal: finalTotalValue,
      discountAmount: discountAmountValue,
      discountPercentage: discountPercentageValue, // ← ADD THIS
    };
  }, [selectedArticles, showRemise, globalRemise, remiseType, editingHT, editingTTC]);

  const handleDelete = async () => {
    if (!bonCommande) return;

    try {
      await deleteventecomptoire(bonCommande.id);
      setDeleteModal(false);
      fetchData();
      toast.success("Vente supprimée avec succès");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Échec de la suppression"
      );
    }
  };

  // Calculate total amount from all payment methods

  // Calculate total payment amount
  // Calculate total payment amount - auto-set single payment to finalTotal
  const totalPaymentAmount = useMemo(() => {
    if (paymentMethods.length === 1) {
      // Auto-set single payment amount to finalTotal
      const singlePayment = paymentMethods[0];
      if (singlePayment.amount !== finalTotal) {
        // Update the amount automatically
        setTimeout(() => {
          updatePaymentMethod(singlePayment.id, "amount", finalTotal);
        }, 0);
      }
      return finalTotal;
    }
    return paymentMethods.reduce((sum, pm) => sum + (pm.amount || 0), 0);
  }, [paymentMethods, finalTotal]);

  // Check if payment total matches - always valid for single payment
  const isPaymentTotalValid = useMemo(() => {
    if (paymentMethods.length === 1) return true;
    return Math.abs(totalPaymentAmount - finalTotal) < 0.001;
  }, [totalPaymentAmount, finalTotal, paymentMethods.length]);

  // Fonction pour préparer la création de facture
  // Fonction pour préparer la création de facture
  const prepareFactureCreation = async (vente: BonCommandeClient) => {
    try {
      const nextNumero = await fetchNextFactureNumberFromAPI();
      setNextFactureNumber(nextNumero);

      setBonCommande(vente);
      setSelectedClient(vente.client || null);
      setSelectedArticles(
        vente.articles.map((item: any) => ({
          article_id: item.article?.id || 0,
          quantite: item.quantite,
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
          designation: item.designation || item.article || "", // Use the UPDATED designation from vente
        }))
      );

      // ✅ AJOUTER LA REMISE ICI
      setGlobalRemise(Number(vente.remise) || 0);
      setRemiseType(vente.remiseType || "percentage");
      setShowRemise((vente.remise || 0) > 0); // Activer si > 0

      // ✅ IMPORTANT: Copy payment methods from the vente
      if (vente.paymentMethods && vente.paymentMethods.length > 0) {
        setPaymentMethods(
          vente.paymentMethods.map((pm: any, index: number) => ({
            id: pm.id || `facture-${index}`,
            method: pm.method,
            amount: Number(pm.amount) || 0,
            numero: pm.numero || "",
            banque: pm.banque || "",
            dateEcheance: pm.dateEcheance || "",
          }))
        );
      } else {
        // Fallback to the vente's payment information
        setPaymentMethods([
          {
            id: "1",
            method: vente.modeReglement || "especes",
            amount: Number(vente.totalAfterRemise) || finalTotal,
            numero: vente.numeroReglement || "",
            banque: vente.banqueCheque || "",
            dateEcheance: vente.dateEcheance || "",
          },
        ]);
      }

      setIsCreatingFacture(true);
      setIsEdit(false);

      // Set facture-specific fields
      setTimbreFiscal(true);
      setExoneration("");
      setConditionPaiement("30 jours");

      // Open the modal
      setModal(true);
    } catch (err) {
      console.error("Error preparing facture:", err);
      toast.error("Erreur lors de la préparation de la facture");
    }
  };

  useEffect(() => {
    if (modal && !isEdit && !isCreatingFacture) {
      setRemiseType("fixed");
      setGlobalRemise(0);
    }
  }, [modal, isEdit, isCreatingFacture]);
  // Fonction pour soumettre la facture
  const handleFactureSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // PREVENT DEFAULT FORM SUBMISSION

    try {
      // Valider le dépôt
      if (!selectedDepot) {
        toast.error("Veuillez sélectionner un dépôt");
        return;
      }

      // Validate required fields
      if (!selectedClient) {
        toast.error("Veuillez sélectionner un client");
        return;
      }

      // Préparer les articles
      const articlesForFacture = selectedArticles.map((item) => ({
        article_id: item.article_id,
        quantite: item.quantite === "" ? 0 : Number(item.quantite),
        prix_unitaire: Number(item.prixUnitaire),
        designation: item.designation || "", // Use the UPDATED designation from vente

        tva: item.tva,
        remise: item.remise,
        prix_ttc: Number(item.prixTTC),
      }));

      // ✅ IMPORTANT: Ne pas envoyer les paymentMethods dans la facture
      // Les paiements restent avec la vente comptoire uniquement
      // const processedPaymentMethods = []; // NE PAS envoyer

      // Calculer les totaux
      let sousTotalHTValue = 0;
      let totalTaxValue = 0;
      let grandTotalValue = 0;

      selectedArticles.forEach((article) => {
        const qty = article.quantite === "" ? 0 : Number(article.quantite) || 0;
        const tvaRate = Number(article.tva) || 0;
        const remiseRate = Number(article.remise) || 0;
        const priceHT = Number(article.prixUnitaire) || 0;
        const priceTTC = Number(article.prixTTC) || 0;

        const montantHTLigne =
          Math.round(qty * priceHT * (1 - remiseRate / 100) * 1000) / 1000;
        const montantTTCLigne = Math.round(qty * priceTTC * 1000) / 1000;
        const taxAmount =
          Math.round((montantTTCLigne - montantHTLigne) * 1000) / 1000;

        sousTotalHTValue += montantHTLigne;
        totalTaxValue += taxAmount;
        grandTotalValue += montantTTCLigne;
      });

      // Appliquer remise globale
      let finalTotalValue = grandTotalValue;
      if (showRemise && Number(globalRemise) > 0) {
        if (remiseType === "percentage") {
          finalTotalValue = grandTotalValue * (1 - Number(globalRemise) / 100);
        } else {
          finalTotalValue = Number(globalRemise);
        }
      }

      // Ajouter timbre fiscal
      if (timbreFiscal) {
        finalTotalValue += 1;
      }

      // Arrondir les totaux
      sousTotalHTValue = Math.round(sousTotalHTValue * 1000) / 1000;
      totalTaxValue = Math.round(totalTaxValue * 1000) / 1000;
      grandTotalValue = Math.round(grandTotalValue * 1000) / 1000;
      finalTotalValue = Math.round(finalTotalValue * 1000) / 1000;

      // Créer l'objet facture SANS paymentMethods
      const factureData = {
        numeroFacture: nextFactureNumber,
        dateFacture: moment().format("YYYY-MM-DD"),
        dateEcheance: moment().add(30, "days").format("YYYY-MM-DD"),
        client_id: selectedClient.id,
        vendeur_id: validation.values.vendeur_id,
        depot_id: selectedDepot.id,
        venteComptoire_id: bonCommande?.id, // ✅ C'est l'ID de la vente comptoire
        status: "Brouillon",
        conditions: "30 jours",
        modeReglement: "Espece",
        exoneration: "",
        timbreFiscal: timbreFiscal,
        articles: articlesForFacture,
        notes: validation.values.notes,
        remise: globalRemise,
        remiseType: remiseType,
        totalHT: sousTotalHTValue,
        totalTVA: totalTaxValue,
        totalTTC: grandTotalValue,
        totalTTCAfterRemise: finalTotalValue,
        // ❌ NE PAS inclure les paymentMethods ici
        // paymentMethods: [], // Pas besoin d'envoyer
        totalPaymentAmount: 0, // 0 car pas de paiements à la création
        montantPaye: 0,
        resteAPayer: finalTotalValue,
        hasRetenue: false,
        montantRetenue: 0,
      };

      console.log("Facture data being sent:", factureData);

      // Appeler l'API
      await createFacture(factureData);

      toast.success("Facture créée avec succès");

      // Fermer et réinitialiser
      toggleModal();
      setIsCreatingFacture(false);
      fetchData();
    } catch (err) {
      console.error("Error creating facture:", err);
      toast.error(
        err instanceof Error ? err.message : "Échec de création de la facture"
      );
    }
  };

  // Modifiez votre handleSubmit existant

  const handleSubmit = async (values: any) => {
    // Check if discount exceeds 10% and hasn't been confirmed yet
    if (discountPercentage > 10 && !isDiscountConfirmed) {
      setShowDiscountAlert(true);
      return;
    }

    try {
      if (isCreatingFacture) {
        await handleFactureSubmit(values);
        return;
      }
      // For single payment method, auto-set amount to finalTotal
      const processedPaymentMethods = paymentMethods.map((pm) => {
        if (paymentMethods.length === 1) {
          return { ...pm, amount: finalTotal };
        }
        return pm;
      });

      const processedTotalPaymentAmount =
        paymentMethods.length === 1 ? finalTotal : totalPaymentAmount;

      // Validate payment total only for multiple payments
      if (paymentMethods.length > 1 && !isPaymentTotalValid) {
        toast.error(
          `Le total des paiements (${processedTotalPaymentAmount.toFixed(
            3
          )} DT) ne correspond pas au montant à payer (${finalTotal.toFixed(
            3
          )} DT)`
        );
        return;
      }

      const venteData = {
        ...values,
        taxMode,
        depot_id: selectedDepot?.id, //
        client_id: selectedClient?.id,
        articles: selectedArticles.map((item) => ({
          article_id: item.article_id,
          quantite: item.quantite,
          prix_unitaire: item.prixUnitaire,
          prix_ttc: item.prixTTC,
          tva: item.tva,
          remise: item.remise,
          designation: item.designation, // Add this
        })),
        remise: globalRemise,
        remiseType: remiseType,
        totalTVA: totalTax,
        totalTTC: grandTotal,
        totalTTCAfterRemise: finalTotal,
        // Use processed payment data
        paymentMethods: processedPaymentMethods,
        totalPaymentAmount: processedTotalPaymentAmount,
        espaceNotes,
      };

      // MISSING: Actual API call to save the data
      if (isEdit && bonCommande) {
        await updateventecomptoire(bonCommande.id, venteData);
        toast.success("Vente modifiée avec succès");
      } else {
        await CreateVenteComptoire(venteData);
        toast.success("Vente créée avec succès");
      }

      // Close modal and refresh data
      toggleModal();
      fetchData();
    } catch (err) {
      console.error("Erreur sauvegarde:", err);
      toast.error(err instanceof Error ? err.message : "Échec de l'opération");
    }
  };

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      numeroCommande: isEdit
        ? bonCommande?.numeroCommande || ""
        : nextNumeroCommande,
      dateCommande: bonCommande?.dateCommande
        ? moment(bonCommande.dateCommande).format("YYYY-MM-DD")
        : moment().format("YYYY-MM-DD"),
      client_id: bonCommande?.client?.id ?? "",
      vendeur_id: bonCommande?.vendeur?.id ?? "",
      depot_id: bonCommande?.depot_id ?? "", // ADD THIS
      notes: bonCommande?.notes ?? "",
      // Add payment method fields
      modeReglement: bonCommande?.modeReglement || "especes",
      numeroReglement: bonCommande?.numeroReglement || "",
      dateEcheance: bonCommande?.dateEcheance
        ? moment(bonCommande.dateEcheance).format("YYYY-MM-DD")
        : moment().format("YYYY-MM-DD"),
      banqueCheque: bonCommande?.banqueCheque || "",
      espaceNotes: bonCommande?.espaceNotes || "",
    },
    validationSchema: Yup.object().shape({
      numeroCommande: Yup.string().required("Le numéro de vente est requis"),
      dateCommande: Yup.date().required("La date de commande est requise"),
      client_id: Yup.number().required("Le client est requis"),
      vendeur_id: Yup.number().required("Le vendeur est requis"),
      // depot_id: Yup.number().required("Le dépôt est requis"), // ADD THIS

      // Payment validation - SIMPLIFIED
      numeroReglement: Yup.string(),
      banqueCheque: Yup.string(),
      dateEcheance: Yup.string(),
    }),
    onSubmit: handleSubmit,
  });

  const toggleModal = useCallback(() => {
    if (modal) {
      // Clear all search results when closing modal
      setFilteredArticles([]);
      setFilteredClients([]);
      setArticleSearch("");
      setClientSearch("");
      setFocusedIndex(-1);

      setModal(false);
      setBonCommande(null);
      setSelectedArticles([]);
      setSelectedClient(null);
      setSelectedDepot(null);
      setGlobalRemise(0);
      setRemiseType("fixed");
      setShowRemise(false);
      setIsCreatingFacture(false);
      setTimbreFiscal(true);
      setPhoneSearch(""); // Add this line

      setExoneration("");
      setConditionPaiement("30 jours");

      // Reset payment states
      setPaymentMethods([
        {
          id: "1",
          method: "especes",
          amount: 0,
        },
      ]);
      validation.resetForm();

      // Reset modal loading state
      setModalLoading(false);
      setIsDiscountConfirmed(false);
      setShowDiscountAlert(false);
    } else {
      setModal(true);
      // Don't load modal data here - useEffect will handle it
    }
  }, [modal]);

  // Replace the current handleAddArticle function with this:
  const handleAddArticle = (articleId: string) => {
    // First, try to find the article in filteredArticles (from search results)
    let article = filteredArticles.find((a) => a.id === parseInt(articleId));

    // If not found in filteredArticles, try the main articles array
    if (!article) {
      article = articles.find((a) => a.id === parseInt(articleId));
    }

    if (
      article &&
      !selectedArticles.some((item) => item.article_id === article?.id)
    ) {
      const initialHT = article.puv_ht || 0;
      const initialTVA = article.tva || 0;
      // USE puv_ttc FROM ARTICLE IF AVAILABLE, OTHERWISE CALCULATE
      const initialTTC =
        article.puv_ttc || initialHT * (1 + (initialTVA || 0) / 100);

      setSelectedArticles([
        ...selectedArticles,
        {
          article_id: article.id,
          quantite: "", // Start with empty instead of 0
          prixUnitaire: initialHT,
          prixTTC: Math.round(initialTTC * 1000) / 1000, // Use article's puv_ttc
          tva: initialTVA,
          remise: 0,
          articleDetails: article,
          designation: article.designation || "", // Add designation
        },
      ]);

      // Clear the search input and results after adding
      setArticleSearch("");
      setFilteredArticles([]);
      setFocusedIndex(-1);

      // Optionally, focus back on the search input
      if (articleSearchRef.current) {
        articleSearchRef.current.focus();
      }
    }
  };
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
            // Allow empty string as valid value
            updatedItem.designation = value || ""; // This ensures empty string is preserved
          }

          // Recalculate HT when TVA changes
          if (field === "tva") {
            const currentTTC = item.prixTTC;
            const newTVA = value === "" ? 0 : Number(value);

            let newPriceHT = currentTTC;
            if (newTVA > 0) {
              newPriceHT = currentTTC / (1 + newTVA / 100);
            }

            // Use proper rounding
            updatedItem.prixUnitaire = Math.round(newPriceHT * 1000) / 1000;

            // Clear any editing states to use the new calculated values
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

          // Recalculate TTC when HT changes
          if (field === "prixUnitaire") {
            const currentHT = value;
            const currentTVA = item.tva || 0;

            let newPriceTTC = Number(currentHT);
            if (currentTVA > 0) {
              newPriceTTC = Number(currentHT) * (1 + currentTVA / 100);
            }

            // Use proper rounding
            updatedItem.prixTTC = Math.round(newPriceTTC * 1000) / 1000;
          }

          // Recalculate HT when TTC changes
          if (field === "prixTTC") {
            const currentTTC = value;
            const currentTVA = item.tva || 0;

            let newPriceHT = Number(currentTTC);
            if (currentTVA > 0) {
              newPriceHT = Number(currentTTC) / (1 + currentTVA / 100);
            }

            // Use proper rounding
            updatedItem.prixUnitaire = Math.round(newPriceHT * 1000) / 1000;
          }

          return updatedItem;
        }
        return item;
      })
    );

    // Keep the existing code for resetting editing states when TVA changes
    if (field === "tva") {
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
  };

  // Barcode scanning handler
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
              designation: scannedArticle.designation || "", // Add designation
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

  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      // Check if user is typing in an input field
      const target = event.target as HTMLElement;
      const isInputField =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      if (isInputField) {
        // Allow normal typing in input fields
        return;
      }

      // Barcode scanner handling
      if (event.key === "Enter") {
        if (barcodeInput.length > 0) {
          handleBarcodeScan(barcodeInput);
          setBarcodeInput("");
        }
      } else if (event.key.length === 1) {
        // Accumulate characters
        setBarcodeInput((prev) => prev + event.key);

        // Reset timeout
        if (scanningTimeout) {
          clearTimeout(scanningTimeout);
        }

        const newTimeout = setTimeout(() => {
          if (barcodeInput.length >= 3) {
            handleBarcodeScan(barcodeInput);
          }
          setBarcodeInput("");
        }, 150);

        setScanningTimeout(newTimeout);
      }
    },
    [barcodeInput, scanningTimeout, handleBarcodeScan]
  );

  // Set up keyboard listener for barcode scanning
  useEffect(() => {
    // Always listen for barcode scanning
    document.addEventListener("keydown", handleKeyPress);
    console.log("Scanner automatique activé - prêt à scanner...");

    return () => {
      document.removeEventListener("keydown", handleKeyPress);
      if (scanningTimeout) {
        clearTimeout(scanningTimeout);
      }
    };
  }, [handleKeyPress, scanningTimeout]);

  // Focus management for modal
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
  // Add these effects after your other effects
  useEffect(() => {
    // Scroll to focused item
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

  useEffect(() => {
    // Reset item refs when filtered articles change
    setItemRefs(filteredArticles.map(() => React.createRef()));
    setFocusedIndex(-1); // Reset focus
  }, [filteredArticles]);

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
        cell: (cell: any) => `${cell.getValue()?.raison_sociale || "N/A"}`,
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
      // Update the cell functions in columns:
      {
        header: "Total TTC",
        accessorKey: "articles",
        enableColumnFilter: false,
        cell: (cell: any) => {
          const total = cell.getValue().reduce((sum: number, item: any) => {
            const qty = Number(item.quantite) || 1;
            // USE prix_ttc FROM DATABASE OR CALCULATE
            const priceTTC =
              Number(item.prix_ttc) ||
              Number(item.prixUnitaire) * (1 + (item.tva || 0) / 100);
            const remiseRate = Number(item.remise || 0);

            const montantHTLigne =
              qty * Number(item.prixUnitaire) * (1 - remiseRate / 100);
            const montantTTCLigne = qty * priceTTC;

            return sum + montantTTCLigne;
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
            const qty = Number(item.quantite) || 1;
            // USE prix_ttc FROM DATABASE OR CALCULATE (SAME AS TOTAL TTC)
            const priceTTC =
              Number(item.prix_ttc) ||
              Number(item.prixUnitaire) * (1 + (item.tva || 0) / 100);
            const remiseRate = Number(item.remise || 0);

            // Use prix_ttc for calculation (consistent with Total TTC)
            const montantTTCLigne = qty * priceTTC;

            return sum + montantTTCLigne;
          }, 0);

          const globalDiscount = Number(cell.row.original.remise) || 0;
          const discountType = cell.row.original.remiseType || "percentage";

          let netAPayer = total;
          if (globalDiscount > 0) {
            if (discountType === "percentage") {
              netAPayer = total * (1 - globalDiscount / 100);
            } else {
              netAPayer = globalDiscount;
            }
          }

          return `${netAPayer.toFixed(3)} DT`;
        },
      },
      {
        header: "Action",
        cell: (cellProps: any) => {
          const bonCommande = cellProps.row.original;
          return (
            <ul className="list-inline hstack gap-2 mb-0">
              <li className="list-inline-item">
                <Link
                  to="#"
                  className="text-info d-inline-block"
                  onClick={() => openDetailModal(bonCommande)}
                >
                  <i className="ri-eye-line fs-16"></i>
                </Link>
              </li>
              <li className="list-inline-item edit">
                <Link
                  to="#"
                  className="text-primary d-inline-block edit-item-btn"
                  onClick={() => {
                    setBonCommande(bonCommande);
                    setSelectedClient(bonCommande.client);
                    // In your edit button click handler:
                    setSelectedDepot(
                      bonCommande.depot ||
                      depots.find((d) => d.id === bonCommande.depot_id) ||
                      null
                    );
                    setSelectedArticles(
                      bonCommande.articles.map((item: any) => ({
                        article_id: item.article.id,
                        quantite: item.quantite,
                        prixUnitaire: Number(item.prixUnitaire),
                        prixTTC:
                          Number(item.prix_ttc) ||
                          Number(item.article?.puv_ttc) ||
                          Number(item.prixUnitaire) *
                          (1 + (item.tva || 0) / 100), // Add prixTTC calculation

                        tva: item.tva != null ? Number(item.tva) : null,
                        remise:
                          item.remise != null ? Number(item.remise) : null,
                        articleDetails: item.article,
                        designation:
                          item.designation || item.article?.designation || "", // Ensure designation is always a string
                      }))
                    );
                    setGlobalRemise(bonCommande.remise || 0);
                    setRemiseType(bonCommande.remiseType || "percentage");
                    setShowRemise(
                      !!bonCommande.remise && bonCommande.remise > 0
                    );
                    setIsEdit(true);
                    setModal(true);
                    // In your edit button click handler, add:
                    // In your edit button click handler, replace the payment method initialization:
                    // In your edit button click handler:
                    // In your edit button click handler:
                    setPaymentMethods(
                      (bonCommande as any)?.paymentMethods &&
                        (bonCommande as any).paymentMethods.length > 0
                        ? (bonCommande as any).paymentMethods.map(
                          (pm: any, index: number) => ({
                            id: pm.id || `edit-${index}`,
                            method: pm.method,
                            amount: Number(pm.amount) || 0,
                            numero: pm.numero || "",
                            banque: pm.banque || "",
                            dateEcheance: pm.dateEcheance || "",
                          })
                        )
                        : [
                          {
                            id: "1",
                            method:
                              (bonCommande as any)?.modeReglement ||
                              "especes",
                            amount:
                              Number(bonCommande?.totalAfterRemise) ||
                              finalTotal,
                            numero:
                              (bonCommande as any)?.numeroReglement || "",
                            banque: (bonCommande as any)?.banqueCheque || "",
                            dateEcheance:
                              (bonCommande as any)?.dateEcheance || "",
                          },
                        ]
                    );
                    setModeReglement(bonCommande.modeReglement || "especes");
                    setNumeroReglement(bonCommande.numeroReglement || "");
                    setDateEcheance(
                      bonCommande.dateEcheance
                        ? moment(bonCommande.dateEcheance).format("YYYY-MM-DD")
                        : moment().format("YYYY-MM-DD")
                    );
                    setBanqueCheque(bonCommande.banqueCheque || "");
                    setEspaceNotes(bonCommande.espaceNotes || "");
                    setMontantVirement(bonCommande.montantVirement || 0);
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
                    setBonCommande(bonCommande);
                    setDeleteModal(true);
                  }}
                >
                  <i className="ri-delete-bin-5-fill fs-16"></i>
                </Link>
              </li>
            </ul>
          );
        },
      },
    ],
    []
  );

  return (
    <div className="page-content">
      <DeleteModal
        show={deleteModal}
        onDeleteClick={handleDelete}
        onCloseClick={() => setDeleteModal(false)}
      />

      <DiscountAlertModal
        show={showDiscountAlert}
        discountPercentage={discountPercentage}
        onConfirmClick={() => {
          setIsDiscountConfirmed(true);
          setShowDiscountAlert(false);
          // Small delay to ensure state update doesn't race with formik submission if we were to trigger it manually
          // but here we can just wait for the user to click the "Submit" button again or trigger it
          setTimeout(() => {
            validation.handleSubmit();
          }, 100);
        }}
        onCloseClick={() => setShowDiscountAlert(false)}
      />

      <Container fluid style={{ maxWidth: "100%" }}>
        <BreadCrumb title="Vente Comptoire" pageTitle="Commandes" />

        <Row>
          <Col lg={12}>
            <Card id="bonCommandeList">
              <CardHeader className="card-header border-0">
                <Row className="align-items-center gy-3">
                  <div className="col-sm">
                    <h5 className="card-title mb-0">
                      Gestion des Ventes Comptoire
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
                      >
                        <i className="ri-close-line align-bottom me-1"></i>{" "}
                        Réinitialiser tous les filtres
                      </Button>
                      <Button
                        color="secondary"
                        onClick={() => {
                          setIsEdit(false);
                          setBonCommande(null);
                          setSelectedArticles([]);
                          setSelectedClient(null);
                          setGlobalRemise(0);
                          setRemiseType("percentage");
                          setShowRemise(false);
                          validation.resetForm();
                          toggleModal();
                        }}
                      >
                        <i className="ri-add-line align-bottom me-1"></i>{" "}
                        Ajouter Vente Comptoire
                      </Button>
                    </div>
                  </div>
                </Row>
              </CardHeader>

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
                        <i className="ri-eye-line text-info fs-4"></i>
                      </div>
                      <div>
                        <h4 className="mb-0 fw-bold text-dark">
                          Vente Comptoire #{selectedBonCommande?.numeroCommande}
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

                                <div className="client-info">
                                  {selectedBonCommande.client ? (
                                    <>
                                      <div className="mb-2">
                                        <strong className="text-dark fs-6">
                                          {
                                            selectedBonCommande.client
                                              .raison_sociale
                                          }
                                        </strong>
                                      </div>
                                      {selectedBonCommande.client
                                        .designation && (
                                          <div className="mb-2">
                                            <small className="text-muted">
                                              {
                                                selectedBonCommande.client
                                                  .designation
                                              }
                                            </small>
                                          </div>
                                        )}
                                      {selectedBonCommande.client
                                        .telephone1 && (
                                          <div className="mb-1">
                                            <i className="ri-phone-line me-2 text-muted"></i>
                                            <span className="text-dark">
                                              {formatPhoneDisplay(
                                                selectedBonCommande.client
                                                  .telephone1
                                              )}
                                            </span>
                                          </div>
                                        )}
                                      {selectedBonCommande.client
                                        .telephone2 && (
                                          <div className="mb-1">
                                            <i className="ri-phone-line me-2 text-muted"></i>
                                            <span className="text-dark">
                                              {formatPhoneDisplay(
                                                selectedBonCommande.client
                                                  .telephone2
                                              )}
                                            </span>
                                          </div>
                                        )}
                                      {selectedBonCommande.client.email && (
                                        <div className="mb-1">
                                          <i className="ri-mail-line me-2 text-muted"></i>
                                          <span className="text-dark">
                                            {selectedBonCommande.client.email}
                                          </span>
                                        </div>
                                      )}
                                      {selectedBonCommande.client.adresse && (
                                        <div className="mb-1">
                                          <i className="ri-map-pin-line me-2 text-muted"></i>
                                          <span className="text-dark">
                                            {selectedBonCommande.client.adresse}
                                            {selectedBonCommande.client.ville &&
                                              `, ${selectedBonCommande.client.ville}`}
                                            {selectedBonCommande.client
                                              .code_postal &&
                                              `, ${selectedBonCommande.client.code_postal}`}
                                          </span>
                                        </div>
                                      )}
                                    </>
                                  ) : (
                                    <div className="text-muted">
                                      <i className="ri-user-unfollow-line me-2"></i>
                                      Aucun client associé
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
                                  <i className="ri-information-line me-2"></i>
                                  Informations Vente
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
                                        Dépôt:
                                      </span>
                                      Magazin Royal lumiere
                                    </p>
                                  </div>
                                  <div className="col-6">
                                    <p className="mb-2">
                                      <span className="text-muted d-block">
                                        Date:
                                      </span>
                                      <strong>
                                        {moment(
                                          selectedBonCommande.dateCommande
                                        ).format("DD/MM/YYYY")}
                                      </strong>
                                    </p>
                                  </div>
                                  <div className="col-6">
                                    <p className="mb-2">
                                      <span className="text-muted d-block">
                                        Numéro:
                                      </span>
                                      <strong>
                                        {selectedBonCommande.numeroCommande}
                                      </strong>
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
                                    <th className="text-end">Remise (%)</th>
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
                                          <td className="text-end">
                                            {remiseRate}%
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
                                                -{" "}
                                                {discountAmountValue.toFixed(3)}{" "}
                                                DT
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

                        {/* Informations de Paiement */}
                        <Card className="border-0 shadow-sm mt-4">
                          <CardBody className="p-4">
                            <h6 className="fw-semibold mb-3 text-primary">
                              <i className="ri-bank-card-line me-2"></i>
                              Informations de Paiement
                            </h6>

                            {selectedBonCommande.paymentMethods &&
                              selectedBonCommande.paymentMethods.length > 0 ? (
                              <div className="payment-methods">
                                {selectedBonCommande.paymentMethods.map(
                                  (payment: any, index: number) => (
                                    <div
                                      key={payment.id || index}
                                      className="border rounded p-3 mb-3 bg-light"
                                    >
                                      <div className="d-flex justify-content-between align-items-center mb-2">
                                        <h6 className="fw-semibold mb-0 text-dark">
                                          Paiement #{index + 1}
                                        </h6>
                                        <Badge
                                          color={
                                            payment.method === "especes"
                                              ? "success"
                                              : payment.method === "cheque"
                                                ? "warning"
                                                : payment.method === "virement"
                                                  ? "info"
                                                  : payment.method === "traite"
                                                    ? "primary"
                                                    : payment.method === "tpe"
                                                      ? "danger" // Add this line for tpe
                                                      : "secondary"
                                          }
                                        >
                                          {payment.method === "especes"
                                            ? "Espèces"
                                            : payment.method === "cheque"
                                              ? "Chèque"
                                              : payment.method === "virement"
                                                ? "Virement"
                                                : payment.method === "traite"
                                                  ? "Traite"
                                                  : payment.method === "tpe"
                                                    ? "Carte Bancaire (TPE)" // Add this line
                                                    : "Autre"}
                                        </Badge>
                                      </div>

                                      <div className="row">
                                        <div className="col-md-6">
                                          <strong>Montant:</strong>{" "}
                                          {Number(payment.amount || 0).toFixed(
                                            3
                                          )}{" "}
                                          DT
                                        </div>

                                        {payment.numero && (
                                          <div className="col-md-6">
                                            <strong>Numéro:</strong>{" "}
                                            {payment.numero}
                                          </div>
                                        )}

                                        {payment.banque && (
                                          <div className="col-md-6">
                                            <strong>Banque:</strong>{" "}
                                            {payment.banque}
                                          </div>
                                        )}

                                        {payment.dateEcheance && (
                                          <div className="col-md-6">
                                            <strong>Date Échéance:</strong>{" "}
                                            {moment(
                                              payment.dateEcheance
                                            ).format("DD/MM/YYYY")}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )
                                )}

                                <div className="total-payment border-top pt-3 mt-3">
                                  <div className="d-flex justify-content-between align-items-center">
                                    <strong className="fs-6">
                                      Total Paiements:
                                    </strong>
                                    <strong className="fs-5 text-primary">
                                      {selectedBonCommande.paymentMethods
                                        .reduce(
                                          (sum: number, pm: any) =>
                                            sum + (Number(pm.amount) || 0),
                                          0
                                        )
                                        .toFixed(3)}{" "}
                                      DT
                                    </strong>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="text-muted">
                                <i className="ri-information-line me-2"></i>
                                Aucune information de paiement disponible
                              </div>
                            )}
                          </CardBody>
                        </Card>
                      </div>
                    )}
                  </ModalBody>

                  <ModalFooter className="border-0 pt-4">
                    {selectedBonCommande && (
                      <>
                        <Button
                          color="primary"
                          onClick={() =>
                            openPdfModal(selectedBonCommande, "facture")
                          }
                          className="btn-invoice btn-invoice-primary me-2"
                        >
                          <i className="ri-file-pdf-line me-2"></i> Voir Vente
                          PDF
                        </Button>

                        <Button
                          color="success"
                          onClick={() =>
                            handleDirectPrint(selectedBonCommande, "receipt")
                          }
                          className="btn-invoice btn-invoice-success me-2"
                        >
                          <i className="ri-printer-line me-2"></i> Imprimer Reçu
                        </Button>

                        <Button
                          color="warning"
                          onClick={() =>
                            prepareFactureCreation(selectedBonCommande)
                          }
                          className="btn-invoice btn-invoice-warning me-2"
                        >
                          <i className="ri-file-text-line me-2"></i> Créer
                          Facture Client
                        </Button>

                        <Button
                          color="info"
                          onClick={() => {
                            setBonCommande(selectedBonCommande);
                            setSelectedClient(
                              selectedBonCommande.client || null
                            );
                            setSelectedArticles(
                              selectedBonCommande.articles.map((item: any) => ({
                                article_id: item.article?.id || 0,
                                quantite: item.quantite,
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
                                articleDetails: item.article,
                                designation:
                                  item.designation || item.article?.designation, // Map designation
                              }))
                            );
                            setGlobalRemise(selectedBonCommande.remise || 0);
                            setRemiseType(
                              selectedBonCommande.remiseType || "percentage"
                            );
                            setShowRemise(
                              (selectedBonCommande.remise || 0) > 0
                            );
                            setIsEdit(true);
                            setModal(true);
                            setDetailModal(false);
                          }}
                          className="btn-invoice btn-invoice-info me-2"
                        >
                          <i className="ri-pencil-line me-2"></i> Modifier
                        </Button>
                      </>
                    )}
                    <Button
                      color="light"
                      onClick={() => setDetailModal(false)}
                      className="btn-invoice"
                    >
                      <i className="ri-close-line me-2"></i> Fermer
                    </Button>
                  </ModalFooter>
                </Modal>

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
                        <i
                          className={
                            isCreatingFacture
                              ? "ri-file-text-line text-primary fs-4"
                              : "ri-shopping-cart-line text-primary fs-4"
                          }
                        ></i>
                      </div>
                      <div>
                        <h4 className="mb-0 fw-bold text-dark">
                          {isCreatingFacture
                            ? "Créer Facture Client"
                            : isEdit
                              ? "Modifier Vente Comptoire"
                              : "Créer Vente Comptoire"}
                        </h4>
                        <small className="text-muted">
                          {isCreatingFacture
                            ? "Créer une facture client à partir de cette vente"
                            : isEdit
                              ? "Modifier les détails de la vente comptoire existante"
                              : "Créer une nouvelle vente comptoire"}
                        </small>
                      </div>
                    </div>
                  </ModalHeader>

                  <Form
                    onSubmit={
                      isCreatingFacture
                        ? handleFactureSubmit
                        : (e) => {
                          e.preventDefault();
                          validation.handleSubmit();
                        }
                    }
                    className="invoice-form"
                  >
                    <ModalBody className="pt-0">
                      {/* Header Information Section */}
                      {/* Header Information Section */}
                      <Card className="border-0 shadow-sm mb-4">
                        <CardBody className="p-4">
                          <h5 className="fw-semibold mb-4 text-primary">
                            <i className="ri-information-line me-2"></i>
                            Informations Générales
                          </h5>

                          {isCreatingFacture ? (
                            // FACTURE INFORMATION - Display in single line
                            <Row className="align-items-center">
                              <Col md={3}>
                                <div className="mb-3">
                                  <Label className="form-label-lg fw-semibold">
                                    Numéro Facture*
                                  </Label>
                                  <Input
                                    value={nextFactureNumber}
                                    readOnly
                                    className="form-control-lg bg-light"
                                  />
                                </div>
                              </Col>

                              <Col md={3}>
                                <div className="mb-3">
                                  <Label className="form-label-lg fw-semibold">
                                    Date*
                                  </Label>
                                  <Input
                                    type="date"
                                    value={moment().format("YYYY-MM-DD")}
                                    readOnly
                                    className="form-control-lg bg-light"
                                  />
                                </div>
                              </Col>

                              <Col md={3}>
                                <div className="mb-3">
                                  <Label className="form-label-lg fw-semibold">
                                    Dépôt*
                                  </Label>
                                  <Input
                                    type="select"
                                    value={selectedDepot?.id || ""}
                                    onChange={(e) => {
                                      const depotId = e.target.value;
                                      const depot = depots.find(
                                        (d) => d.id === parseInt(depotId)
                                      );
                                      setSelectedDepot(depot || null);
                                    }}
                                    className="form-control-lg"
                                    required={true}
                                  >
                                    <option value="">
                                      Sélectionner un dépôt
                                    </option>
                                    {depots.map((depot) => (
                                      <option key={depot.id} value={depot.id}>
                                        {depot.nom}
                                      </option>
                                    ))}
                                  </Input>
                                </div>
                              </Col>

                              <Col md={3}>
                                <div className="mb-3">
                                  <Label className="form-label-lg fw-semibold">
                                    Timbre Fiscal
                                  </Label>
                                  <div className="d-flex align-items-center">
                                    <Input
                                      type="checkbox"
                                      id="timbreFiscalFacture"
                                      checked={timbreFiscal}
                                      onChange={(e) =>
                                        setTimbreFiscal(e.target.checked)
                                      }
                                      className="form-check-input me-2"
                                      style={{
                                        width: "24px",
                                        height: "24px",
                                        cursor: "pointer",
                                      }}
                                    />
                                    <Label
                                      for="timbreFiscalFacture"
                                      className="form-check-label fw-semibold"
                                    >
                                      Activé (+1.000 DT)
                                    </Label>
                                  </div>
                                </div>
                              </Col>
                            </Row>
                          ) : (
                            // VENTE COMPTOIRE INFORMATION - Display in single line

                            <Row className="align-items-center">
                              <Col md={4}>
                                <div className="mb-3">
                                  <Label className="form-label-lg fw-semibold">
                                    Numéro Vente*
                                  </Label>
                                  <Input
                                    name="numeroCommande"
                                    value={validation.values.numeroCommande}
                                    onChange={validation.handleChange}
                                    invalid={
                                      validation.touched.numeroCommande &&
                                      !!validation.errors.numeroCommande
                                    }
                                    readOnly={isEdit}
                                    className="form-control-lg"
                                    placeholder=""
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

                              <Col md={4}>
                                <div className="mb-3">
                                  <Label className="form-label-lg fw-semibold">
                                    Dépôt*
                                  </Label>
                                  <Input
                                    type="select"
                                    value={selectedDepot?.id || ""}
                                    onChange={(e) => {
                                      const depotId = e.target.value;
                                      const depot = depots.find(
                                        (d) => d.id === parseInt(depotId)
                                      );
                                      setSelectedDepot(depot || null);
                                    }}
                                    className="form-control-lg"
                                    required={true}
                                  >
                                    <option value="">
                                      Sélectionner un dépôt
                                    </option>
                                    {depots.map((depot) => (
                                      <option key={depot.id} value={depot.id}>
                                        {depot.nom}
                                      </option>
                                    ))}
                                  </Input>
                                </div>
                              </Col>
                            </Row>
                          )}
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

                              {/* Enhanced Client Search Section */}
                              <div className="mb-3 position-relative"> {/* Add position-relative wrapper */}
                                <Label className="form-label-lg fw-semibold">
                                  Client*
                                  {!selectedClient && !isCreatingFacture && (
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
                                    readOnly={!!selectedClient || isCreatingFacture}
                                    className="form-control-lg pe-10"
                                  />

                                  {/* Clear button when client is selected */}
                                  {selectedClient && !isCreatingFacture && (
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
                                  {!selectedClient && !isCreatingFacture && (
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
                                {!isCreatingFacture &&
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
                                                  <span className="text-muted client-info-designation">
                                                    {c.designation}
                                                  </span>

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

                            {articleSearch.length >= 3 && (
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
                                          width: "8%",
                                          minWidth: "80px",
                                        }}
                                      >
                                        Remise (%)
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

                                      const qty =
                                        item.quantite === ""
                                          ? 0
                                          : Number(item.quantite) || 0;
                                      const priceHT =
                                        Number(item.prixUnitaire) || 0;
                                      const priceTTC =
                                        Number(item.prixTTC) || 0;
                                      const tvaRate = Number(item.tva) || 0;
                                      const remiseRate =
                                        Number(item.remise) || 0;

                                      const montantHTLigne = (
                                        qty *
                                        priceHT *
                                        (1 - remiseRate / 100)
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
                                                    const newValue =
                                                      e.target.value;
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
                                              onBlur={() => {
                                                setEditingHT((prev) => {
                                                  const newState = { ...prev };
                                                  delete newState[
                                                    item.article_id
                                                  ];
                                                  return newState;
                                                });
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
                                              onBlur={() => {
                                                setEditingTTC((prev) => {
                                                  const newState = { ...prev };
                                                  delete newState[
                                                    item.article_id
                                                  ];
                                                  return newState;
                                                });
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
                                          <td style={{ width: "8%" }}>
                                            <Input
                                              type="number"
                                              min="0"
                                              max="100"
                                              value={item.remise ?? 0}
                                              onChange={(e) =>
                                                handleArticleChange(
                                                  item.article_id,
                                                  "remise",
                                                  Number(e.target.value)
                                                )
                                              }
                                              className="table-input text-center"
                                              style={{
                                                width: "100%",
                                                fontSize: "0.9rem",
                                              }}
                                            />
                                          </td>
                                          <td
                                            style={{ width: "10%" }}
                                            className="text-end fw-semibold"
                                          >
                                            {montantHTLigne} DT
                                          </td>
                                          <td
                                            style={{ width: "10%" }}
                                            className="text-end fw-semibold text-primary"
                                          >
                                            {montantTTCLigne} DT
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
                                              className="btn-invoice-danger"
                                              style={{
                                                padding: "0.25rem 0.5rem",
                                                fontSize: "0.8rem",
                                              }}
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
                                              setRemiseType(
                                                e.target.value as
                                                | "percentage"
                                                | "fixed"
                                              )
                                            }
                                            className="form-control-sm"
                                          >
                                            <option value="fixed">
                                              Montant fixe (DT)
                                            </option>
                                            <option value="percentage">
                                              Pourcentage (%)
                                            </option>
                                          </Input>
                                        </div>
                                        <div className="col-12">
                                          <Label className="form-label fw-semibold">
                                            {remiseType === "percentage"
                                              ? "Pourcentage"
                                              : "Montant (DT)"}
                                          </Label>
                                          <Input
                                            type="number"
                                            min="0"
                                            step={
                                              remiseType === "percentage"
                                                ? "1"
                                                : "0.001"
                                            }
                                            value={
                                              globalRemise === 0
                                                ? ""
                                                : globalRemise
                                            }
                                            onChange={(e) => {
                                              const value = e.target.value;
                                              if (value === "") {
                                                setGlobalRemise(0);
                                              } else {
                                                const numValue = Number(value);
                                                if (
                                                  !isNaN(numValue) &&
                                                  numValue >= 0
                                                ) {
                                                  setGlobalRemise(numValue);
                                                }
                                              }
                                            }}
                                            placeholder={
                                              remiseType === "percentage"
                                                ? "0-100%"
                                                : "Montant"
                                            }
                                            className="form-control-sm"
                                          />
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </Col>

                                {/* Right Side - Calculations WITH TIMBRE FISCAL */}
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
                                        {showRemise && globalRemise > 0 && (
                                          <tr className={`real-time-update ${discountPercentage > 10 ? "table-danger" : "table-success"}`}>
                                            <th className={`text-end fs-6 ${discountPercentage > 10 ? "text-danger" : "text-success"}`}>
                                              {remiseType === "percentage"
                                                ? `Remise (${globalRemise}%)`
                                                : `Remise (Montant fixe) ${discountPercentage.toFixed(
                                                  2
                                                )}%`}
                                            </th>
                                            <td className={`text-end fw-bold fs-6 ${discountPercentage > 10 ? "text-danger" : "text-success"}`}>
                                              - {discountAmount.toFixed(3)} DT
                                            </td>
                                          </tr>
                                        )}
                                        {/* TIMBRE FISCAL ROW */}
                                        {isCreatingFacture && timbreFiscal && (
                                          <tr className="real-time-update">
                                            <th className="text-end text-muted fs-6">
                                              Timbre Fiscal:
                                            </th>
                                            <td className="text-end fw-bold fs-6 text-info">
                                              + 1,000 DT
                                            </td>
                                          </tr>
                                        )}
                                        <tr className="final-total real-time-update border-top">
                                          <th className="text-end fs-5">
                                            NET À PAYER:
                                          </th>
                                          <td className="text-end fw-bold fs-5 text-primary">
                                            {isCreatingFacture && timbreFiscal
                                              ? (finalTotal + 1).toFixed(3)
                                              : finalTotal.toFixed(3)}{" "}
                                            DT
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

                      {/* Payment Method Section */}
                      <Card className="border-0 shadow-sm mb-4">
                        <CardBody className="p-4">
                          <div className="d-flex justify-content-between align-items-center mb-3">
                            <h5 className="fw-semibold text-primary mb-0">
                              <i className="ri-bank-card-line me-2"></i>
                              Modes de Règlement
                            </h5>
                            <Button
                              color="primary"
                              size="sm"
                              onClick={addPaymentMethod}
                              className="btn-invoice-primary"
                            >
                              <i className="ri-add-line me-1"></i>
                              Ajouter Paiement
                            </Button>
                          </div>

                          {/* Payment Methods List */}
                          {paymentMethods.map((payment, index) => (
                            <div
                              key={payment.id}
                              className="border rounded p-3 mb-3 bg-light"
                            >
                              <div className="d-flex justify-content-between align-items-center mb-3">
                                <h6 className="fw-semibold mb-0 text-dark">
                                  Paiement #{index + 1}
                                </h6>
                                {paymentMethods.length > 1 && (
                                  <Button
                                    color="danger"
                                    size="sm"
                                    onClick={() =>
                                      removePaymentMethod(payment.id)
                                    }
                                    className="btn-invoice-danger"
                                  >
                                    <i className="ri-close-line"></i>
                                  </Button>
                                )}
                              </div>

                              <Row className="g-3">
                                {/* Method Type */}
                                <Col md={paymentMethods.length === 1 ? 12 : 3}>
                                  <Label className="form-label fw-semibold">
                                    Type
                                  </Label>
                                  <Input
                                    type="select"
                                    value={payment.method}
                                    onChange={(e) =>
                                      updatePaymentMethod(
                                        payment.id,
                                        "method",
                                        e.target.value
                                      )
                                    }
                                    className="form-control"
                                  >
                                    <option value="especes">Espèces</option>
                                    <option value="cheque">Chèque</option>
                                    <option value="virement">Virement</option>
                                    <option value="traite">Traite</option>
                                    <option value="tpe">
                                      Carte Bancaire "TPE"
                                    </option>
                                  </Input>
                                </Col>

                                {/* Montant - Only show when multiple payment methods */}
                                {paymentMethods.length > 1 && (
                                  <Col md={3}>
                                    <Label className="form-label fw-semibold">
                                      Montant (DT)
                                    </Label>
                                    <Input
                                      type="number"
                                      step="0.001"
                                      min="0"
                                      value={
                                        payment.amount === 0
                                          ? ""
                                          : payment.amount
                                      }
                                      onChange={(e) => {
                                        const value =
                                          e.target.value === ""
                                            ? 0
                                            : Number(e.target.value);
                                        updatePaymentMethod(
                                          payment.id,
                                          "amount",
                                          value
                                        );
                                      }}
                                      placeholder="0.000"
                                      className="form-control"
                                    />
                                  </Col>
                                )}

                                {/* Numéro - Only for cheque and traite */}
                                {(payment.method === "cheque" ||
                                  payment.method === "traite") && (
                                    <Col md={paymentMethods.length === 1 ? 6 : 3}>
                                      <Label className="form-label fw-semibold">
                                        {payment.method === "cheque"
                                          ? "Numéro Chèque"
                                          : "Numéro Traite"}
                                      </Label>
                                      <Input
                                        type="text"
                                        value={payment.numero || ""}
                                        onChange={(e) =>
                                          updatePaymentMethod(
                                            payment.id,
                                            "numero",
                                            e.target.value
                                          )
                                        }
                                        placeholder={
                                          payment.method === "cheque"
                                            ? "N° chèque"
                                            : "N° traite"
                                        }
                                        className="form-control"
                                      />
                                    </Col>
                                  )}

                                {/* Banque - Only for cheque */}
                                {payment.method === "cheque" && (
                                  <Col md={paymentMethods.length === 1 ? 6 : 3}>
                                    <Label className="form-label fw-semibold">
                                      Banque
                                    </Label>
                                    <Input
                                      type="text"
                                      value={payment.banque || ""}
                                      onChange={(e) =>
                                        updatePaymentMethod(
                                          payment.id,
                                          "banque",
                                          e.target.value
                                        )
                                      }
                                      placeholder="Nom banque"
                                      className="form-control"
                                    />
                                  </Col>
                                )}

                                {/* Date Échéance - Only for traite */}
                                {payment.method === "traite" && (
                                  <Col md={paymentMethods.length === 1 ? 6 : 3}>
                                    <Label className="form-label fw-semibold">
                                      Date Échéance
                                    </Label>
                                    <Input
                                      type="date"
                                      value={
                                        payment.dateEcheance ||
                                        moment().format("YYYY-MM-DD")
                                      }
                                      onChange={(e) =>
                                        updatePaymentMethod(
                                          payment.id,
                                          "dateEcheance",
                                          e.target.value
                                        )
                                      }
                                      className="form-control"
                                    />
                                  </Col>
                                )}
                              </Row>

                              {/* Auto-set amount to finalTotal when only one payment method */}
                              {paymentMethods.length === 1 && (
                                <div className="mt-2">
                                  <small className="text-muted">
                                    <i className="ri-information-line me-1"></i>
                                    Montant automatiquement défini à:{" "}
                                    <strong>
                                      {isCreatingFacture && timbreFiscal
                                        ? (finalTotal + 1).toFixed(3)
                                        : finalTotal.toFixed(3)}{" "}
                                      DT
                                    </strong>
                                  </small>
                                </div>
                              )}
                            </div>
                          ))}

                          {/* Payment Summary - Only show when multiple payment methods */}
                          {paymentMethods.length > 1 && (
                            <Card
                              className={
                                isPaymentTotalValid
                                  ? "border-success bg-success bg-opacity-10"
                                  : "border-warning bg-warning bg-opacity-10"
                              }
                            >
                              <CardBody className="p-3">
                                <Row className="align-items-center">
                                  <Col md={8}>
                                    <div className="d-flex justify-content-between">
                                      <span className="fw-semibold">
                                        Total des Paiements:
                                      </span>
                                      <span className="fw-bold fs-5">
                                        {totalPaymentAmount.toFixed(3)} DT
                                      </span>
                                    </div>
                                    <div className="d-flex justify-content-between mt-1">
                                      <span className="fw-semibold">
                                        Montant à Payer:
                                      </span>
                                      <span className="fw-bold fs-5">
                                        {isCreatingFacture && timbreFiscal
                                          ? (finalTotal + 1).toFixed(3)
                                          : finalTotal.toFixed(3)}{" "}
                                        DT
                                      </span>
                                    </div>
                                  </Col>
                                  <Col md={4}>
                                    <div className="text-end">
                                      {isPaymentTotalValid ? (
                                        <Badge color="success" className="fs-6">
                                          <i className="ri-check-line me-1"></i>
                                          Équilibré
                                        </Badge>
                                      ) : (
                                        <Badge color="warning" className="fs-6">
                                          <i className="ri-error-warning-line me-1"></i>
                                          Différence:{" "}
                                          {(
                                            totalPaymentAmount -
                                            (isCreatingFacture && timbreFiscal
                                              ? finalTotal + 1
                                              : finalTotal)
                                          ).toFixed(3)}{" "}
                                          DT
                                        </Badge>
                                      )}
                                    </div>
                                  </Col>
                                </Row>
                              </CardBody>
                            </Card>
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
                          selectedArticles.length === 0 ||
                          !selectedClient ||
                          (isCreatingFacture && !selectedDepot)
                        }
                      >
                        <i
                          className={
                            isCreatingFacture
                              ? "ri-file-text-line me-2"
                              : "ri-save-line me-2"
                          }
                        ></i>
                        {isCreatingFacture
                          ? "Créer Facture"
                          : isEdit
                            ? "Modifier"
                            : "Enregistrer"}
                      </Button>
                    </ModalFooter>
                  </Form>
                </Modal>

                {/* Quick Client Creation Modal */}
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
                          Ajouter un nouveau client rapidement
                        </small>
                      </div>
                    </div>
                  </ModalHeader>
                  <ModalBody>
                    <Row>
                      <Col md={6}>
                        <div className="mb-3">
                          <Label className="form-label fw-semibold">
                            Raison Sociale*
                          </Label>
                          <Input
                            value={newClient.raison_sociale}
                            onChange={(e) =>
                              setNewClient({
                                ...newClient,
                                raison_sociale: e.target.value,
                              })
                            }
                            placeholder="Raison sociale"
                            className="form-control-lg"
                          />
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="mb-3">
                          <Label className="form-label fw-semibold">
                            Désignation
                          </Label>
                          <Input
                            value={newClient.designation}
                            onChange={(e) =>
                              setNewClient({
                                ...newClient,
                                designation: e.target.value,
                              })
                            }
                            placeholder="Désignation"
                            className="form-control-lg"
                          />
                        </div>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={6}>
                        <div className="mb-3">
                          <Label className="form-label fw-semibold">
                            Matricule Fiscal
                          </Label>
                          <Input
                            value={newClient.matricule_fiscal}
                            onChange={(e) =>
                              setNewClient({
                                ...newClient,
                                matricule_fiscal: e.target.value,
                              })
                            }
                            placeholder="Matricule fiscal"
                            className="form-control-lg"
                          />
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="mb-3">
                          <Label className="form-label fw-semibold">
                            Registre Commerce
                          </Label>
                          <Input
                            value={newClient.register_commerce}
                            onChange={(e) =>
                              setNewClient({
                                ...newClient,
                                register_commerce: e.target.value,
                              })
                            }
                            placeholder="Registre de commerce"
                            className="form-control-lg"
                          />
                        </div>
                      </Col>
                    </Row>

                    <div className="mb-3">
                      <Label className="form-label fw-semibold">Adresse</Label>
                      <Input
                        value={newClient.adresse}
                        onChange={(e) =>
                          setNewClient({
                            ...newClient,
                            adresse: e.target.value,
                          })
                        }
                        placeholder="Adresse complète"
                        className="form-control-lg"
                      />
                    </div>

                    <Row>
                      <Col md={6}>
                        <div className="mb-3">
                          <Label className="form-label fw-semibold">
                            Ville
                          </Label>
                          <Input
                            value={newClient.ville}
                            onChange={(e) =>
                              setNewClient({
                                ...newClient,
                                ville: e.target.value,
                              })
                            }
                            placeholder="Ville"
                            className="form-control-lg"
                          />
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="mb-3">
                          <Label className="form-label fw-semibold">
                            Code Postal
                          </Label>
                          <Input
                            value={newClient.code_postal}
                            onChange={(e) =>
                              setNewClient({
                                ...newClient,
                                code_postal: e.target.value,
                              })
                            }
                            placeholder="Code postal"
                            className="form-control-lg"
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

                              // Apply auto-space formatting for phone numbers
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

                              // Apply auto-space formatting for phone numbers
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
                      <Label className="form-label fw-semibold">Email</Label>
                      <Input
                        type="email"
                        value={newClient.email}
                        onChange={(e) =>
                          setNewClient({ ...newClient, email: e.target.value })
                        }
                        placeholder="email@example.com"
                        className="form-control-lg"
                      />
                    </div>

                    <div className="mb-3">
                      <Label className="form-label fw-semibold">Statut</Label>
                      <Input
                        type="select"
                        value={newClient.status}
                        onChange={(e) =>
                          setNewClient({
                            ...newClient,
                            status: e.target.value as "Actif" | "Inactif",
                          })
                        }
                        className="form-control-lg"
                      >
                        <option value="Actif">Actif</option>
                        <option value="Inactif">Inactif</option>
                      </Input>
                    </div>
                  </ModalBody>
                  <ModalFooter className="border-0">
                    <Button
                      color="light"
                      onClick={() => setClientModal(false)}
                      className="btn-invoice fs-6 px-4"
                    >
                      <i className="ri-close-line me-2"></i>
                      Annuler
                    </Button>
                    <Button
                      color="primary"
                      onClick={handleCreateClient}
                      className="btn-invoice-primary fs-6 px-4"
                    >
                      <i className="ri-check-line me-2"></i>
                      Créer et Sélectionner
                    </Button>
                  </ModalFooter>
                </Modal>

                {/* Quick Article Creation Modal */}
                {/* Quick Article Creation Modal */}
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
                        <h4 className="mb-0 fw-bold text-dark">
                          Nouvel Article
                        </h4>
                        <small className="text-muted">
                          Ajouter un nouveau produit
                        </small>
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
                                <Label className="form-label-lg fw-semibold">
                                  Référence
                                </Label>
                                <Input
                                  type="text"
                                  value={newArticle.reference}
                                  onChange={(e) =>
                                    setNewArticle({
                                      ...newArticle,
                                      reference: e.target.value,
                                    })
                                  }
                                  placeholder="REF"
                                  className="form-control-lg"
                                />
                                <small className="text-muted">
                                  Identifiant unique de l'article
                                </small>
                              </div>
                            </Col>

                            <Col md={6}>
                              <div className="mb-3">
                                <Label className="form-label-lg fw-semibold">
                                  Désignation
                                </Label>
                                <Input
                                  type="text"
                                  value={newArticle.designation}
                                  onChange={(e) =>
                                    setNewArticle({
                                      ...newArticle,
                                      designation: e.target.value,
                                    })
                                  }
                                  placeholder="Nom de l'article"
                                  className="form-control-lg"
                                />
                                <small className="text-muted">
                                  Nom complet du produit
                                </small>
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
                                <Label className="form-label-lg fw-semibold">
                                  Famille Principale
                                </Label>
                                <Input
                                  type="select"
                                  value={newArticle.categorie_id}
                                  onChange={(e) =>
                                    setNewArticle({
                                      ...newArticle,
                                      categorie_id: e.target.value,
                                    })
                                  }
                                  className="form-control-lg"
                                >
                                  <option value="">
                                    Sélectionner une famille principale
                                  </option>
                                  {categories
                                    .filter((c) => !c.parent_id)
                                    .map((c) => (
                                      <option key={c.id} value={c.id}>
                                        {c.nom}
                                      </option>
                                    ))}
                                </Input>
                                <small className="text-muted">
                                  Catégorie principale
                                </small>
                              </div>
                            </Col>

                            <Col md={6}>
                              <div className="mb-3">
                                <Label className="form-label-lg fw-semibold">
                                  Sous-Famille
                                </Label>
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
                                  <option value="">
                                    Sélectionner une sous-famille
                                  </option>
                                  {subcategories.map((s) => (
                                    <option key={s.id} value={s.id}>
                                      {s.nom}
                                    </option>
                                  ))}
                                </Input>
                                <small className="text-muted">
                                  Sous-catégorie
                                </small>
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
                                <Label className="form-label-lg fw-semibold">
                                  Fournisseur
                                </Label>
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
                                  <option value="">
                                    Sélectionner un fournisseur
                                  </option>
                                  {fournisseurs.map((f) => (
                                    <option key={f.id} value={f.id}>
                                      {f.raison_sociale}
                                    </option>
                                  ))}
                                </Input>
                                <small className="text-muted">
                                  Fournisseur principal
                                </small>
                              </div>
                            </Col>

                            <Col md={6}>
                              <div className="mb-3">
                                <Label className="form-label-lg fw-semibold">
                                  Type
                                </Label>
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
                                  <option value="Non Consigné">
                                    Non Consigné
                                  </option>
                                  <option value="Consigné">Consigné</option>
                                </Input>
                                <small className="text-muted">
                                  Type d'article
                                </small>
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
                                <Label className="form-label-lg fw-semibold">
                                  Prix d'achat HT (DT)
                                </Label>
                                <Input
                                  type="text"
                                  value={newArticle.pua_ht}
                                  onChange={(e) =>
                                    handlePriceChange("pua_ht", e.target.value)
                                  }
                                  placeholder="0,000"
                                  className="form-control-lg text-end"
                                />
                                <small className="text-muted">
                                  Prix hors taxes avant marge
                                </small>
                              </div>

                              <div className="mb-0">
                                <Label className="form-label-lg fw-semibold">
                                  Prix d'achat TTC (DT)
                                </Label>
                                <Input
                                  type="text"
                                  value={newArticle.pua_ttc}
                                  onChange={(e) =>
                                    handlePriceChange("pua_ttc", e.target.value)
                                  }
                                  placeholder="0,000"
                                  className="form-control-lg text-end"
                                />
                                <small className="text-muted">
                                  HT × {newArticle.taux_fodec ? "1.01" : "1"} ×{" "}
                                  {1 + parseNumber(newArticle.tva) / 100}
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
                                <Label className="form-label-lg fw-semibold">
                                  Prix de vente HT (DT)
                                </Label>
                                <Input
                                  type="text"
                                  value={newArticle.puv_ht}
                                  onChange={(e) =>
                                    handlePriceChange("puv_ht", e.target.value)
                                  }
                                  placeholder="0,000"
                                  className="form-control-lg text-end"
                                />
                                <small className="text-muted">
                                  Prix de vente hors taxes
                                </small>
                              </div>

                              <div className="mb-0">
                                <Label className="form-label-lg fw-semibold">
                                  Prix de vente TTC (DT)
                                </Label>
                                <Input
                                  type="text"
                                  value={newArticle.puv_ttc}
                                  onChange={(e) =>
                                    handlePriceChange("puv_ttc", e.target.value)
                                  }
                                  placeholder="0,000"
                                  className="form-control-lg text-end"
                                />
                                <small className="text-muted">
                                  HT × {newArticle.taux_fodec ? "1.01" : "1"} ×{" "}
                                  {1 + parseNumber(newArticle.tva) / 100}
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
                                <Label className="form-label-lg fw-semibold">
                                  Taux de TVA (%)
                                </Label>
                                <Input
                                  type="select"
                                  value={newArticle.tva}
                                  onChange={(e) =>
                                    handleTVAChange(e.target.value)
                                  }
                                  className="form-control-lg"
                                >
                                  <option value="0">0% (Exonéré)</option>
                                  <option value="7">7%</option>
                                  <option value="10">10%</option>
                                  <option value="13">13%</option>
                                  <option value="19">19% (Taux normal)</option>
                                  <option value="21">21%</option>
                                </Input>
                                <small className="text-muted">
                                  Taux de TVA applicable
                                </small>
                              </div>
                            </Col>

                            <Col md={6}>
                              <div className="mb-4">
                                <Label className="form-label-lg fw-semibold d-block">
                                  FODEC
                                </Label>
                                <div className="form-check form-switch form-switch-lg">
                                  <Input
                                    type="checkbox"
                                    className="form-check-input"
                                    checked={!!newArticle.taux_fodec}
                                    onChange={(e) =>
                                      handleFodecChange(e.target.checked)
                                    }
                                    id="fodecSwitch"
                                  />
                                  <Label
                                    className="form-check-label fw-semibold"
                                    for="fodecSwitch"
                                  >
                                    Appliquer FODEC (1%)
                                  </Label>
                                </div>
                                <small className="text-muted">
                                  Taxe FODEC de 1% sur le HT
                                </small>
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
                                <Label className="form-label-lg fw-semibold">
                                  Quantité en stock
                                </Label>
                                <Input
                                  type="text"
                                  value={newArticle.qte}
                                  onChange={(e) =>
                                    setNewArticle({
                                      ...newArticle,
                                      qte: e.target.value,
                                    })
                                  }
                                  placeholder="0"
                                  className="form-control-lg"
                                />
                                <small className="text-muted">
                                  Stock initial disponible
                                </small>
                              </div>
                            </Col>
                            <Col md={6}>
                              <div className="mb-3">
                                <Label className="form-label-lg fw-semibold">
                                  Remise (%)
                                </Label>
                                <Input
                                  type="text"
                                  value={newArticle.remise}
                                  onChange={(e) =>
                                    setNewArticle({
                                      ...newArticle,
                                      remise: e.target.value,
                                    })
                                  }
                                  placeholder="0"
                                  className="form-control-lg"
                                />
                                <small className="text-muted">
                                  Pourcentage de remise par défaut
                                </small>
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

                <EditClientModal
                  isOpen={editClientModal}
                  toggle={() => setEditClientModal(false)}
                  client={editingClient}
                  onClientUpdated={(updatedClient) => {
                    // Update the client in the clients list
                    setClients((prev) =>
                      prev.map((c) =>
                        c.id === updatedClient.id ? updatedClient : c
                      )
                    );

                    // Update filtered clients if needed
                    setFilteredClients((prev) =>
                      prev.map((c) =>
                        c.id === updatedClient.id ? updatedClient : c
                      )
                    );

                    // If the updated client is currently selected, update it
                    if (selectedClient?.id === updatedClient.id) {
                      setSelectedClient(updatedClient);
                    }

                    // Refresh clients list
                    loadClients(clientSearch, 1, 20);
                  }}
                />

                <VenteComptoirePDFModal
                  isOpen={pdfModal}
                  toggle={() => setPdfModal(false)}
                  bonCommande={selectedBonCommandeForPdf}
                  companyInfo={companyInfo}
                  pdfType={pdfType}
                />

                <ToastContainer />
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default VenteComptoire;
