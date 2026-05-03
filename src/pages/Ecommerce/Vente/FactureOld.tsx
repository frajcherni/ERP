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
  createClient,
  createArticle,
  fetchFournisseurs,
  fetchCategories,
} from "../../../Components/Article/ArticleServices";
import { Categorie, Fournisseur } from "../../../Components/Article/Interfaces";
import {
  fetchFacturesClient,
  createFacture,
  updateFacture,
  deleteFacture,
  fetchNextFactureNumberFromAPI,
  createEncaissementClient,
  fetchEncaissementsClient,
  fetchNextEncaissementNumberFromAPI,
} from "./FactureClientServices";
import {
  searchArticles,
  searchClients,
  fetchVendeurs,
} from "../../../Components/Article/ArticleServices";
import {
  Article,
  Client,
  FactureClient,
  EncaissementClient,
  Vendeur,
} from "../../../Components/Article/Interfaces";
import classnames from "classnames";
import { PDFDownloadLink } from "@react-pdf/renderer";
//import FacturePDF from "./FacturePDF";
import FacturePDFModal from "./FactureClientPdfModal";
import FactureClientPreview from "./FactureClientPreview";

import { useProfile } from "Components/Hooks/UserHooks";
import logo from "../../../assets/images/imglogo.png"; // Add this import
import backgroundImage from "../../../assets/images/backgroundImage.png"; // Add this import
import EditClientModal from "./EditClientModal";

import "./InvoiceModal.css";
import "./ArticleTableStyles.css"; // Import unified table styles
const ListFactureClient = () => {
  const [detailModal, setDetailModal] = useState(false);
  const [encaissementModal, setEncaissementModal] = useState(false);
  const [createEditModal, setCreateEditModal] = useState(false);
  const [selectedFacture, setSelectedFacture] = useState<FactureClient | null>(
    null
  );
  const [facture, setFacture] = useState<FactureClient | null>(null);
  const [isEdit, setIsEdit] = useState(false);
  const [activeTab, setActiveTab] = useState("1");
  const [factures, setFactures] = useState<FactureClient[]>([]);
  const [filteredFactures, setFilteredFactures] = useState<FactureClient[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [deleteModal, setDeleteModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [searchText, setSearchText] = useState("");
  const [nextEncaissementNumber, setNextEncaissementNumber] = useState("");
  const [articleSearch, setArticleSearch] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [showRemise, setShowRemise] = useState(false);
  const [nextFactureNumber, setNextFactureNumber] = useState("");
  const [editingTTC, setEditingTTC] = useState<{ [key: number]: string }>({});
  const [editingHT, setEditingHT] = useState<{ [key: number]: string }>({});
  const { userProfile, loading: profileLoading } = useProfile();
  const [searchPhone, setSearchPhone] = useState("");

  const [methodesReglement, setMethodesReglement] = useState<
    Array<{
      id: string;
      method: "especes" | "cheque" | "virement" | "traite" | "tpe" | "retenue";
      amount: string;
      numero?: string;
      banque?: string;
      dateEcheance?: string;
      tauxRetention?: number;
    }>
  >([]);
  // Add near your other state declarations
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [dropdownRef, setDropdownRef] = useState<HTMLDivElement | null>(null);
  const [itemRefs, setItemRefs] = useState<React.RefObject<HTMLLIElement>[]>(
    []
  );
  const [showRetention, setShowRetention] = useState(false);
  const [retentionRate, setRetentionRate] = useState<number>(1);
  const [retentionAmount, setRetentionAmount] = useState<number>(0);

  const [showPaymentMethods, setShowPaymentMethods] = useState(false);
  const [espaceNotes, setEspaceNotes] = useState("");

  // Add these state variables near your existing states
  const [clientModal, setClientModal] = useState(false);
  const [articleModal, setArticleModal] = useState(false);

  const [editClientModal, setEditClientModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  // Add near your other state declarations
  const [barcodeInput, setBarcodeInput] = useState("");
  const [scanningTimeout, setScanningTimeout] = useState<NodeJS.Timeout | null>(
    null
  );
  const articleSearchRef = useRef<HTMLInputElement>(null); // Add this ref if not already present

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
    type: "Consigné",
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

  // Add these imports if not already present

  const [categories, setCategories] = useState<Categorie[]>([]);
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [subcategories, setSubcategories] = useState<Categorie[]>([]);

  const [selectedArticles, setSelectedArticles] = useState<
    {
      article_id: number;
      quantite: number | ""; // Allow empty string
      prixUnitaire: number;
      tva?: number | null;
      remise?: number | null;
      prixTTC: number; // Change this to allow string
      designation?: string; // Add this
      articleDetails?: Article;
    }[]
  >([]);

  // Add this near your other helper functions (around line 100-150)
  const customRound = (num: number): number => {
    if (isNaN(num) || !isFinite(num)) return 0;

    // Round to 5 decimal places first for precision
    const multiplied = Math.round(num * 100000);
    const result = multiplied / 100000;

    // Then round to 3 decimal places for display/final use
    return Math.round(result * 1000) / 1000;
  };

  // Update your parseNumericInput function to use customRound:
  // Parse numeric input function
  const parseNumericInput = (value: string): number => {
    if (!value || value === "") return 0;
    const cleanValue = value.replace(",", ".");
    const numericValue = parseFloat(cleanValue);
    return isNaN(numericValue) ? 0 : Math.round(numericValue * 1000) / 1000;
  };

  // Format for display
  const formatForDisplay = (
    value: number | string | undefined | null
  ): string => {
    if (value === undefined || value === null) return "0,000";
    const numericValue =
      typeof value === "string" ? parseNumericInput(value) : Number(value);
    if (isNaN(numericValue)) return "0,000";
    return numericValue.toFixed(3).replace(".", ",");
  };
  const [remiseType, setRemiseType] = useState<"percentage" | "fixed">("fixed");

  const [globalRemise, setGlobalRemise] = useState<number>(0);
  const [taxMode, setTaxMode] = useState<"HT" | "TTC">("HT");
  const [pdfModal, setPdfModal] = useState(false);
  const [selectedFactureForPdf, setSelectedFactureForPdf] =
    useState<FactureClient | null>(null);
  const [vendeurs, setVendeurs] = useState<Vendeur[]>([]);
  const [selectedVendeur, setSelectedVendeur] = useState<Vendeur | null>(null);
  const tvaOptions = [
    { value: null, label: "Non applicable" },
    { value: 0, label: "0% (Exonéré)" },
    { value: 7, label: "7%" },
    { value: 10, label: "10%" },
    { value: 13, label: "13%" },
    { value: 19, label: "19%" },
    { value: 21, label: "21%" },
  ];
  const [timbreFiscal, setTimbreFiscal] = useState<boolean>(true);
  const [conditionPaiement, setConditionPaiement] = useState<string>("");

  const [articlesLoading, setArticlesLoading] = useState(false);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [secondaryLoading, setSecondaryLoading] = useState(false);

  const conditionPaiementOptions = [
    { value: "", label: "Sélectionner condition" },
    { value: "7", label: "7 jours" },
    { value: "30j", label: "30 jours" },
    { value: "60j", label: "60 jours" },
    { value: "90j", label: "90 jours" },
    { value: "comptant", label: "Comptant" },
    { value: "acompte", label: "Acompte" },
  ];
  const companyInfo = useMemo(
    () => ({
      name: userProfile?.company_name,
      address: userProfile?.company_address,
      city: userProfile?.company_city,
      phone: userProfile?.company_phone,
      gsm: userProfile?.company_gsm,
      email: userProfile?.company_email,
      website: userProfile?.company_website,
      taxId: userProfile?.company_tax_id,
      logo: logo,
      backgroundImage: backgroundImage,
    }),
    [userProfile]
  );
  const openPdfModal = (facture: FactureClient) => {
    setSelectedFactureForPdf(facture);
    setPdfModal(true);
  };
  useEffect(() => {
    const fetchNextNumber = async () => {
      try {
        const nextNumber = await fetchNextFactureNumberFromAPI();
        setNextFactureNumber(nextNumber);
      } catch (err) {
        console.error("Failed to fetch next invoice number:", err);
        const year = moment().format("YYYY");
        const defaultNumber = `FAC-C${year}${String(
          factures.length + 1
        ).padStart(5, "0")}`;
        setNextFactureNumber(defaultNumber);
      }
    };
    if (!isEdit) {
      fetchNextNumber();
    }
  }, [isEdit, factures.length]);
  useEffect(() => {
    const fetchNextEncaissementNumber = async () => {
      try {
        const nextNumber = await fetchNextEncaissementNumberFromAPI();
        setNextEncaissementNumber(nextNumber);
      } catch (err) {
        console.error("Failed to fetch next encaissement number:", err);
        const year = moment().format("YYYY");
        const defaultNumber = `ENC-C${year}${String(0 + 1).padStart(5, "0")}`;
        setNextEncaissementNumber(defaultNumber);
      }
    };
    fetchNextEncaissementNumber();
  }, []);

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

  // Display formatting function (if not already present)
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

  // Update the client search useEffect
// Replace your current client search useEffect with this:
useEffect(() => {
  const searchClientsDebounced = async () => {
    if (clientSearch.length >= 1 || createEditModal) {
      await loadClients(clientSearch, 1, 15);
    } else {
      setFilteredClients([]);
    }
  };

  const timer = setTimeout(searchClientsDebounced, 300);
  return () => clearTimeout(timer);
}, [clientSearch, createEditModal]);

  // Replace the current useEffect for article search:
  useEffect(() => {
    const searchArticlesDebounced = async () => {
      if (articleSearch.length >= 3 || createEditModal) {
        setArticlesLoading(true);
        try {
          const result = await searchArticles({
            query: articleSearch,
            page: 1,
            limit: 15,
          });
          if (articleSearch === "" && !createEditModal) {
            setArticles(result.articles || []);
          }
          setFilteredArticles(result.articles || []);
        } catch (err) {
          console.error("Failed to load articles:", err);
        } finally {
          setArticlesLoading(false);
        }
      } else {
        setFilteredArticles([]);
      }
    };

    const timer = setTimeout(searchArticlesDebounced, 300);
    return () => clearTimeout(timer);
  }, [articleSearch, createEditModal]);

  const fetchData = useCallback(async (skipSecondary = false) => {
    try {
      setLoading(true);

      // PHASE 1: Load critical data only
      const [facturesData, encaissementsData, vendeursData] = await Promise.all(
        [fetchFacturesClient(), fetchEncaissementsClient(), fetchVendeurs()]
      );


      if (!skipSecondary) {
        setSecondaryLoading(true);
        
        try {
          // Load articles and clients in parallel with limit (EXACT SAME AS BL)
          const [articlesResult, clientsResult] = await Promise.all([
            searchArticles({ query: "", page: 1, limit: 25 }),
            searchClients({ query: "", page: 1, limit: 25 }),
          ]);
          
          setArticles(articlesResult.articles || []);
          setClients(clientsResult.clients || []); // ADD THIS LINE - you were missing this
          setFilteredClients(clientsResult.clients || []);
        } catch (secondaryErr) {
          console.error("Secondary data loading failed:", secondaryErr);
          // Continue without secondary data
        } finally {
          setSecondaryLoading(false);
        }
      }
      // ✅ Update the facturesWithCalculatedEncaissements calculation:
      const facturesWithCalculatedEncaissements = facturesData.map(
        (facture) => {
          // Get encaissements for this facture
          const relevantEncaissements = encaissementsData.filter(
            (encaissement) =>
              encaissement.factureClient &&
              encaissement.factureClient.id === facture.id
          );

          // Calculate total encaissements from facture
          const totalEncaissements = relevantEncaissements.reduce(
            (sum, encaissement) => {
              let encaissementAmount: number;
              if (typeof encaissement.montant === "string") {
                encaissementAmount = parseFloat(encaissement.montant) || 0;
              } else {
                encaissementAmount = encaissement.montant || 0;
              }
              return sum + encaissementAmount;
            },
            0
          );

          // ✅ 1. Get payment methods from FACTURE (excluding retention)
          const facturePaymentMethodsTotal = facture.paymentMethods
            ? facture.paymentMethods
              .filter((pm: any) => pm.method !== "retenue")
              .reduce((sum: number, pm: any) => {
                let amountValue: number;
                if (typeof pm.amount === "string") {
                  amountValue = parseFloat(pm.amount) || 0;
                } else if (typeof pm.amount === "number") {
                  amountValue = pm.amount;
                } else {
                  amountValue = 0;
                }
                return sum + amountValue;
              }, 0)
            : 0;

          // ✅ 2. Get payment methods from BON COMMANDE (excluding retention)
          const bonCommandePaymentMethodsTotal = facture.bonCommandeClient
            ?.paymentMethods
            ? facture.bonCommandeClient.paymentMethods
              .filter((pm: any) => pm.method !== "retenue")
              .reduce((sum: number, pm: any) => {
                let amountValue: number;
                if (typeof pm.amount === "string") {
                  amountValue = parseFloat(pm.amount) || 0;
                } else if (typeof pm.amount === "number") {
                  amountValue = pm.amount;
                } else {
                  amountValue = 0;
                }
                return sum + amountValue;
              }, 0)
            : 0;

          // ✅ 3. Get paiements from BON COMMANDE
          const bonCommandePaiementsTotal = facture.bonCommandeClient?.paiements
            ? facture.bonCommandeClient.paiements.reduce(
              (sum: number, paiement: any) => {
                let amountValue: number;
                if (typeof paiement.montant === "string") {
                  amountValue = parseFloat(paiement.montant) || 0;
                } else if (typeof paiement.montant === "number") {
                  amountValue = paiement.montant;
                } else {
                  amountValue = 0;
                }
                return sum + amountValue;
              },
              0
            )
            : 0;

          // ✅ 4. Get payment methods from VENTE COMPTOIRE (excluding retention)
          const venteComptoirePaymentMethodsTotal = facture.venteComptoire
            ?.paymentMethods
            ? facture.venteComptoire.paymentMethods
              .filter((pm: any) => pm.method !== "retenue")
              .reduce((sum: number, pm: any) => {
                let amountValue: number;
                if (typeof pm.amount === "string") {
                  amountValue = parseFloat(pm.amount) || 0;
                } else if (typeof pm.amount === "number") {
                  amountValue = pm.amount;
                } else {
                  amountValue = 0;
                }
                return sum + amountValue;
              }, 0)
            : 0;

          // ✅ 5. Calculate total payment methods from all sources
          const totalPaymentMethods =
            facturePaymentMethodsTotal +
            bonCommandePaymentMethodsTotal +
            venteComptoirePaymentMethodsTotal;

          // ✅ 6. Calculate retention from all sources
          // Facture retention
          const factureRetentionAmount = facture.paymentMethods
            ? facture.paymentMethods
              .filter((pm: any) => pm.method === "retenue")
              .reduce((sum: number, pm: any) => {
                const finalTotal =
                  Number(facture.totalTTCAfterRemise) ||
                  Number(facture.totalTTC) ||
                  0;
                const rate = pm.tauxRetention || 1;
                const amount = finalTotal * (rate / 100);
                return sum + amount;
              }, 0)
            : Number(facture.montantRetenue) || 0;

          // Bon commande retention
          const bonCommandeRetentionAmount = facture.bonCommandeClient
            ?.paymentMethods
            ? facture.bonCommandeClient.paymentMethods
              .filter((pm: any) => pm.method === "retenue")
              .reduce((sum: number, pm: any) => {
                const finalTotal =
                  Number(facture.totalTTCAfterRemise) ||
                  Number(facture.totalTTC) ||
                  0;
                const rate = pm.tauxRetention || 1;
                const amount = finalTotal * (rate / 100);
                return sum + amount;
              }, 0)
            : Number(facture.bonCommandeClient?.montantRetenue) || 0;

          // Vente comptoire retention
          const venteComptoireRetentionAmount = facture.venteComptoire
            ?.paymentMethods
            ? facture.venteComptoire.paymentMethods
              .filter((pm: any) => pm.method === "retenue")
              .reduce((sum: number, pm: any) => {
                const finalTotal =
                  Number(facture.totalTTCAfterRemise) ||
                  Number(facture.totalTTC) ||
                  0;
                const rate = pm.tauxRetention || 1;
                const amount = finalTotal * (rate / 100);
                return sum + amount;
              }, 0)
            : 0;

          // Total retention
          const totalRetentionAmount =
            factureRetentionAmount +
            bonCommandeRetentionAmount +
            venteComptoireRetentionAmount;

          // Calculate article totals
          let subTotal = 0;
          let totalTax = 0;
          let grandTotal = 0;

          facture.articles.forEach((item) => {
            const qty = Number(item.quantite) || 1;
            const priceHT = Number(item.prixUnitaire) || 0;
            const tvaRate = Number(item.tva ?? 0);
            const remiseRate = Number(item.remise || 0);
            const priceTTC =
              Number(item.prix_ttc) || priceHT * (1 + tvaRate / 100);

            const montantHTLigne =
              Math.round(qty * priceHT * (1 - remiseRate / 100) * 1000) / 1000;
            const montantTTCLigne = Math.round(qty * priceTTC * 1000) / 1000;
            const taxAmount =
              Math.round((montantTTCLigne - montantHTLigne) * 1000) / 1000;

            subTotal += montantHTLigne;
            totalTax += taxAmount;
            grandTotal += montantTTCLigne;
          });

          // Calculate final total with discount and timbre
          let finalTotal = grandTotal;
          const hasDiscount = facture.remise && Number(facture.remise) > 0;

          if (hasDiscount) {
            if (facture.remiseType === "percentage") {
              finalTotal = grandTotal * (1 - Number(facture.remise) / 100);
            } else {
              finalTotal = Number(facture.remise);
            }
          }

          if (facture.timbreFiscal) {
            if (hasDiscount) {
              finalTotal += 1;
            } else {
              grandTotal += 1;
              finalTotal = grandTotal;
            }
          }

          // Fix floating point issues
          subTotal = Math.round(subTotal * 1000) / 1000;
          totalTax = Math.round(totalTax * 1000) / 1000;
          grandTotal = Math.round(grandTotal * 1000) / 1000;
          finalTotal = Math.round(finalTotal * 1000) / 1000;

          // ✅ CORRECTED: Calculate total payé from ALL sources
          const totalPaye =
            totalEncaissements +
            totalPaymentMethods +
            bonCommandePaiementsTotal;

          // ✅ CORRECTED: Calculate reste à payer
          let resteAPayer =
            Math.round((finalTotal - totalRetentionAmount - totalPaye) * 1000) /
            1000;
          resteAPayer = Math.max(0, resteAPayer);

          // Determine status
          let status:
            | "Brouillon"
            | "Validee"
            | "Payee"
            | "Annulee"
            | "Partiellement Payee" = facture.status;

          if (facture.status === "Annulee") {
            status = "Annulee";
          } else if (resteAPayer === 0 && finalTotal > 0) {
            status = "Payee";
          } else if (
            totalPaye > 0 &&
            totalPaye < finalTotal - totalRetentionAmount
          ) {
            status = "Partiellement Payee";
          }

          // Combine all payment sources for display
          const allPaymentMethods = [
            ...(facture.paymentMethods || []),
            ...(facture.bonCommandeClient?.paymentMethods || []),
            ...(facture.venteComptoire?.paymentMethods || []),
          ];

          const allPaiements = [
            ...(facture.bonCommandeClient?.paiements || []),
          ];

          return {
            ...facture,
            totalHT: subTotal,
            totalTVA: totalTax,
            totalTTC: grandTotal,
            totalTTCAfterRemise: finalTotal,
            montantPaye: totalPaye,
            resteAPayer: resteAPayer,
            montantRetenue: totalRetentionAmount,
            status,
            hasPayments: totalPaye > 0,
            // Store all payment sources for display
            allPaymentMethods,
            allPaiements,
            // Keep original for reference
            paymentMethods: allPaymentMethods,
            bonCommandePaiements: allPaiements,
          };
        }
      );

      setFactures(facturesWithCalculatedEncaissements);
      setFilteredFactures(facturesWithCalculatedEncaissements);
      setVendeurs(vendeursData);

      // PHASE 2: Load secondary data
      try {
        // Load categories and fournisseurs first
        const [categoriesData, fournisseursData] = await Promise.all([
          fetchCategories(),
          fetchFournisseurs(),
        ]);

        setCategories(categoriesData);
        setFournisseurs(fournisseursData);

        // ✅ CHANGED: Use searchClients and searchArticles instead of fetchClients and fetchArticles
        const [clientsResult, articlesResult] = await Promise.all([
          searchClients({ query: "", page: 1, limit: 25 }), // ✅ Changed to searchClients
          searchArticles({ query: "", page: 1, limit: 25 }), // ✅ Changed to searchArticles
        ]);

        setClients(clientsResult.clients || []);
        setArticles(articlesResult.articles || []);
      } catch (secondaryErr) {
        console.error("Secondary data loading failed:", secondaryErr);
      }

      setLoading(false);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Échec du chargement des données"
      );
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(true); // true means skip secondary data initially
  }, [fetchData]);


  // Add this function after your fetchData function
const loadModalData = async () => {
  if (createEditModal) {
    setModalLoading(true);
    try {
      // Load categories and fournisseurs for article modal
      const [categoriesResult, fournisseursData] = await Promise.all([
        fetchCategories(),
        fetchFournisseurs(),
      ]);

      setCategories(categoriesResult);
      setFournisseurs(fournisseursData);
      
      // Load initial articles and clients for modal (EXACT SAME AS BL)
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


// Replace your current loadArticles and search logic with this:
const loadArticles = async (query = "", page = 1, limit = 15) => {
  if (createEditModal || articleSearch) {
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

// Load clients only when needed (EXACT SAME AS BL)
const loadClients = async (query = "", page = 1, limit = 15) => {
  if (createEditModal || clientSearch) {
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

// Load modal data when modal opens (EXACT SAME AS BL)
useEffect(() => {
  if (createEditModal) {
    loadModalData();
  }
}, [createEditModal]);
  // Load modal data only when modal opens

  // Update the main search useEffect for factures
  // Update your main search useEffect
  useEffect(() => {
    let result = [...factures];

    if (activeTab === "2") {
      result = result.filter((facture) => facture.status === "Brouillon");
    } else if (activeTab === "3") {
      result = result.filter((facture) => facture.status === "Validee");
    } else if (activeTab === "4") {
      result = result.filter((facture) => facture.status === "Payee");
    } else if (activeTab === "5") {
      result = result.filter((facture) => facture.status === "Annulee");
    }

    if (startDate && endDate) {
      const start = moment(startDate).startOf("day");
      const end = moment(endDate).endOf("day");
      result = result.filter((facture) => {
        const factureDate = moment(facture.dateFacture);
        return factureDate.isBetween(start, end, null, "[]");
      });
    }

    // Enhanced search functionality
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      result = result.filter(
        (facture) =>
          facture.numeroFacture.toLowerCase().includes(searchLower) ||
          (facture.client?.raison_sociale &&
            facture.client.raison_sociale
              .toLowerCase()
              .includes(searchLower)) ||
          (facture.client?.designation &&
            facture.client.designation.toLowerCase().includes(searchLower))
      );
    }

    // Phone search functionality
    if (searchPhone) {
      const cleanPhoneSearch = searchPhone.replace(/\s/g, "").trim();

      result = result.filter((facture) => {
        if (!facture.client) return false;

        const phone1 = facture.client.telephone1?.replace(/\s/g, "") || "";
        const phone2 = facture.client.telephone2?.replace(/\s/g, "") || "";

        return (
          phone1.includes(cleanPhoneSearch) || phone2.includes(cleanPhoneSearch)
        );
      });
    }

    setFilteredFactures(result);
  }, [activeTab, startDate, endDate, searchText, searchPhone, factures]);




  
  const handleEditClient = (client: Client, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setEditingClient(client);
    setEditClientModal(true);
  };
  

  

  const handleCreateClient = async () => {
    try {
      // Format phone numbers before sending
      const formattedClient = {
        ...newClient,
        telephone1: newClient.telephone1
          ? newClient.telephone1.replace(/\s/g, "")
          : "",
        telephone2: newClient.telephone2
          ? newClient.telephone2.replace(/\s/g, "")
          : "",
      };

      // Create the client
      const createdClient = await createClient(formattedClient);
      toast.success("Client créé avec succès");

      // Auto-select the new client
      setSelectedClient(createdClient);
      validation.setFieldValue("client_id", createdClient.id);

      // Also add to filtered clients for immediate visibility
      setFilteredClients((prev) => [createdClient, ...prev]);

      // Close client modal and reset form
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
        status: "Actif",
      });
      setClientSearch(""); // ← Add this line

    } catch (err) {
      console.error("Error creating client:", err);
      toast.error("Erreur lors de la création du client");
    }
  };
  ;

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
    } catch (err) {
      console.error("Error creating article:", err);
      toast.error("Erreur lors de la création de l'article");
    }
  };


  // Add effect for subcategories
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

  // In your ListFactureClient component, add this state variable
  const [exoneration, setExoneration] = useState<boolean>(false);

  // Add this near your other helper functions (around line 100-150)
  // Replace your existing getPaymentMethodsSummary function with this one:
  // Update your getPaymentMethodsSummary function:
  const getPaymentMethodsSummary = (facture: FactureClient | null) => {
    if (!facture) return null;

    // Combine all payment sources
    const factureMethods = facture.paymentMethods || [];
    const bonCommandeMethods = facture.bonCommandeClient?.paymentMethods || [];
    const bonCommandePaiements = facture.bonCommandeClient?.paiements || [];
    const venteComptoireMethods = facture.venteComptoire?.paymentMethods || []; // Add this

    // Calculate totals
    const totalFactureMethods = factureMethods.reduce(
      (sum: number, pm: any) => {
        let amountValue: number;
        if (typeof pm.amount === "string") {
          amountValue = parseFloat(pm.amount) || 0;
        } else if (typeof pm.amount === "number") {
          amountValue = pm.amount;
        } else {
          amountValue = 0;
        }
        return (pm.method as string) !== "retenue" ? sum + amountValue : sum;
      },
      0
    );

    const totalBonCommandeMethods = bonCommandeMethods.reduce(
      (sum: number, pm: any) => {
        let amountValue: number;
        if (typeof pm.amount === "string") {
          amountValue = parseFloat(pm.amount) || 0;
        } else if (typeof pm.amount === "number") {
          amountValue = pm.amount;
        } else {
          amountValue = 0;
        }
        return (pm.method as string) !== "retenue" ? sum + amountValue : sum;
      },
      0
    );

    const totalBonCommandePaiements = bonCommandePaiements.reduce(
      (sum: number, paiement: any) => {
        let amountValue: number;
        if (typeof paiement.montant === "string") {
          amountValue = parseFloat(paiement.montant) || 0;
        } else if (typeof paiement.montant === "number") {
          amountValue = paiement.montant;
        } else {
          amountValue = 0;
        }
        return sum + amountValue;
      },
      0
    );

    // ✅ ADD VENTE COMPTOIRE PAYMENTS
    const totalVenteComptoireMethods = venteComptoireMethods.reduce(
      (sum: number, pm: any) => {
        let amountValue: number;
        if (typeof pm.amount === "string") {
          amountValue = parseFloat(pm.amount) || 0;
        } else if (typeof pm.amount === "number") {
          amountValue = pm.amount;
        } else {
          amountValue = 0;
        }
        return (pm.method as string) !== "retenue" ? sum + amountValue : sum;
      },
      0
    );

    // Calculate retention - Include vente comptoire
    const totalRetention =
      facture.montantRetenue ||
      factureMethods
        .filter((pm: any) => (pm.method as string) === "retenue")
        .reduce((sum: number, pm: any) => {
          const finalTotal =
            Number(facture.totalTTCAfterRemise) ||
            Number(facture.totalTTC) ||
            0;
          const rate = pm.tauxRetention || 1;
          return sum + (finalTotal * rate) / 100;
        }, 0) +
      bonCommandeMethods
        .filter((pm: any) => (pm.method as string) === "retenue")
        .reduce((sum: number, pm: any) => {
          const finalTotal =
            Number(facture.totalTTCAfterRemise) ||
            Number(facture.totalTTC) ||
            0;
          const rate = pm.tauxRetention || 1;
          return sum + (finalTotal * rate) / 100;
        }, 0) +
      venteComptoireMethods
        .filter((pm: any) => (pm.method as string) === "retenue")
        .reduce((sum: number, pm: any) => {
          const finalTotal =
            Number(facture.totalTTCAfterRemise) ||
            Number(facture.totalTTC) ||
            0;
          const rate = pm.tauxRetention || 1;
          return sum + (finalTotal * rate) / 100;
        }, 0);

    return {
      totalFactureMethods,
      totalBonCommandeMethods,
      totalBonCommandePaiements,
      totalVenteComptoireMethods, // Add this
      totalRetention,
      totalAllPayments:
        totalFactureMethods +
        totalBonCommandeMethods +
        totalBonCommandePaiements +
        totalVenteComptoireMethods,
      hasBonCommande: !!facture.bonCommandeClient,
      hasVenteComptoire: !!facture.venteComptoire, // Add this
      bonCommandeNumber: facture.bonCommandeClient?.numeroCommande,
      venteComptoireNumber: facture.venteComptoire?.numeroCommande, // Add this
    };
  };

  useEffect(() => {
    if (createEditModal && !isEdit) {
      setRemiseType("fixed");
      setGlobalRemise(0);
    }
  }, [createEditModal, isEdit]);
  // Keep the formatPaymentMethodName function
  const formatPaymentMethodName = (method: string) => {
    switch (method) {
      case "especes":
        return "Espèces";
      case "cheque":
        return "Chèque";
      case "virement":
        return "Virement";
      case "traite":
        return "Traite";
      case "tpe":
        return "Carte Bancaire (TPE)";
      case "retenue":
        return "Retenue à la source";
      default:
        return method;
    }
  };

  const {
    sousTotalHT,
    netHT,
    totalTax,
    grandTotal,
    finalTotal,
    discountAmount,
    discountPercentage,
    retentionMontant,
    netAPayer,
  } = useMemo(() => {
    if (selectedArticles.length === 0) {
      return {
        sousTotalHT: 0,
        netHT: 0,
        totalTax: 0,
        grandTotal: 0,
        finalTotal: 0,
        discountAmount: 0,
        discountPercentage: 0,
        retentionMontant: 0,
        netAPayer: 0,
      };
    }

    // ✅ STEP 1: Calculate totals WITHOUT considering global remise
    let sousTotalHTValue = 0;
    let netHTBeforeGlobalRemise = 0;
    let totalTaxValue = 0;
    let grandTotalValue = 0;

    selectedArticles.forEach((article) => {
      const qty = article.quantite === "" ? 0 : Number(article.quantite) || 0;
      const articleRemise = Number(article.remise) || 0;

      // Get unit prices with proper handling of editing
      let unitHT = Number(article.prixUnitaire) || 0;
      let unitTTC = Number(article.prixTTC) || 0;

      // Handle manual editing
      if (editingHT[article.article_id] !== undefined) {
        const editingValue = parseNumericInput(editingHT[article.article_id]);
        if (!isNaN(editingValue) && editingValue >= 0) {
          unitHT = editingValue;
          // Recalculate TTC based on TVA rate
          const tvaRate = exoneration ? 0 : Number(article.tva) || 0;
          if (tvaRate > 0) {
            const tvaAmount = (unitHT * tvaRate) / 100;
            unitTTC = Math.round((unitHT + tvaAmount) * 1000) / 1000;
          } else {
            unitTTC = unitHT;
          }
        }
      } else if (editingTTC[article.article_id] !== undefined) {
        const editingValue = parseNumericInput(editingTTC[article.article_id]);
        if (!isNaN(editingValue) && editingValue >= 0) {
          unitTTC = editingValue;
          // Recalculate HT based on TVA rate
          const tvaRate = exoneration ? 0 : Number(article.tva) || 0;
          if (tvaRate > 0) {
            const coefficient = 1 + tvaRate / 100;
            unitHT = Math.round((unitTTC / coefficient) * 1000) / 1000;
          } else {
            unitHT = unitTTC;
          }
        }
      }

      // Calculate line amounts
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

      sousTotalHTValue = Math.round((sousTotalHTValue + montantSousTotalHT) * 1000) / 1000;
      netHTBeforeGlobalRemise = Math.round((netHTBeforeGlobalRemise + montantNetHTLigne) * 1000) / 1000;
      totalTaxValue = Math.round((totalTaxValue + montantTVALigne) * 1000) / 1000;
      grandTotalValue = Math.round((grandTotalValue + montantTTCLigne) * 1000) / 1000;
    });

    // ✅ STEP 2: Apply global remise according to principle
    let netHTAfterGlobalRemise = netHTBeforeGlobalRemise;
    let totalTaxAfterGlobalRemise = totalTaxValue;
    let finalTotalValue = grandTotalValue;
    let discountAmountValue = 0;
    let discountPercentageValue = 0;

    if (showRemise && Number(globalRemise) > 0) {
      if (remiseType === "percentage") {
        // ✅ Percentage remise: Apply on HT base
        discountAmountValue = Math.round(
          (netHTBeforeGlobalRemise * (Number(globalRemise) / 100)) * 1000
        ) / 1000;
        netHTAfterGlobalRemise = Math.round(
          (netHTBeforeGlobalRemise - discountAmountValue) * 1000
        ) / 1000;

        // ✅ Recalculate TVA proportionally
        if (netHTBeforeGlobalRemise > 0) {
          const tvaToHtRatio = Math.round(
            (totalTaxValue / netHTBeforeGlobalRemise) * 1000
          ) / 1000;
          totalTaxAfterGlobalRemise = Math.round(
            (netHTAfterGlobalRemise * tvaToHtRatio) * 1000
          ) / 1000;
        } else {
          totalTaxAfterGlobalRemise = 0;
        }

        finalTotalValue = Math.round(
          (netHTAfterGlobalRemise + totalTaxAfterGlobalRemise) * 1000
        ) / 1000;
      } else if (remiseType === "fixed") {
        // ✅ Fixed remise: User enters the final TTC amount
        finalTotalValue = Math.round(Number(globalRemise) * 1000) / 1000;

        // ✅ Check if single or multiple TVA rates
        const uniqueTvaRates = Array.from(
          new Set(selectedArticles.map((a) => Number(a.tva) || 0))
        );

        if (uniqueTvaRates.length === 1 && uniqueTvaRates[0] > 0) {
          // ✅ SINGLE TVA RATE FORMULA: Net HT = TTC / (1 + TVA rate)
          const tvaRate = uniqueTvaRates[0] / 100;
          netHTAfterGlobalRemise = Math.round((finalTotalValue / (1 + tvaRate)) * 1000) / 1000;
          totalTaxAfterGlobalRemise = Math.round((finalTotalValue - netHTAfterGlobalRemise) * 1000) / 1000;
        } else {
          // ✅ MULTIPLE TVA RATES: EXACT SAME CALCULATION AS VENTE COMPTOIRE
          // IMPORTANT: Ne pas arrondir le coefficient de réduction
          const discountCoefficient = finalTotalValue / grandTotalValue; // Pas d'arrondi ici

          let newTotalHT = 0;
          let newTotalTVA = 0;

          selectedArticles.forEach((article) => {
            const qty = article.quantite === "" ? 0 : Number(article.quantite) || 0;
            const articleRemise = Number(article.remise) || 0;
            const unitHT = Number(article.prixUnitaire) || 0;
            const tvaRate = Number(article.tva) || 0;

            // Calculer sans arrondi intermédiaire pour avoir exactement le même résultat
            const lineHTAfterDiscount = qty * unitHT * (1 - articleRemise / 100);
            const newLineHT = lineHTAfterDiscount * discountCoefficient;
            const newLineTVA = newLineHT * (tvaRate / 100);

            newTotalHT += newLineHT;
            newTotalTVA += newLineTVA;
          });

          // Arrondir seulement à la fin
          netHTAfterGlobalRemise = Math.round(newTotalHT * 1000) / 1000;
          totalTaxAfterGlobalRemise = Math.round(newTotalTVA * 1000) / 1000;
        }

        discountAmountValue = Math.round(
          (netHTBeforeGlobalRemise - netHTAfterGlobalRemise) * 1000
        ) / 1000;

        // Calculate discount percentage for display
        if (netHTBeforeGlobalRemise > 0) {
          discountPercentageValue = Math.round(
            (discountAmountValue / netHTBeforeGlobalRemise) * 100 * 1000
          ) / 1000;
        }
      }
    }

    // ✅ STEP 3: Apply exoneration - IF exoneration is true, TVA should be 0
    if (exoneration) {
      totalTaxAfterGlobalRemise = 0;
      // When exoneration is active, TTC = HT
      finalTotalValue = netHTAfterGlobalRemise;
    }

    // ✅ STEP 4: Add timbre fiscal
    if (timbreFiscal) {
      finalTotalValue = Math.round((finalTotalValue + 1) * 1000) / 1000;
    }

    // ✅ STEP 5: Calculate retention
    let retentionMontantValue = 0;
    methodesReglement.forEach((pm) => {
      if (pm.method === "retenue") {
        const tauxRetention = pm.tauxRetention || 1;
        const retentionAmount = Math.round(
          (finalTotalValue * tauxRetention) / 100 * 1000
        ) / 1000;
        retentionMontantValue = Math.round(
          (retentionMontantValue + retentionAmount) * 1000
        ) / 1000;
      }
    });

    // ✅ STEP 6: Calculate net à payer
    let netAPayerValue = Math.round((finalTotalValue - retentionMontantValue) * 1000) / 1000;
    netAPayerValue = Math.max(0, netAPayerValue);

    return {
      sousTotalHT: sousTotalHTValue,
      netHT:
        showRemise && Number(globalRemise) > 0
          ? netHTAfterGlobalRemise
          : netHTBeforeGlobalRemise,
      totalTax: exoneration
        ? 0
        : showRemise && Number(globalRemise) > 0
          ? totalTaxAfterGlobalRemise
          : totalTaxValue,
      grandTotal: grandTotalValue,
      finalTotal: finalTotalValue,
      discountAmount: discountAmountValue,
      discountPercentage: discountPercentageValue,
      retentionMontant: retentionMontantValue,
      netAPayer: netAPayerValue,
    };
  }, [
    selectedArticles,
    showRemise,
    globalRemise,
    remiseType,
    editingHT,
    editingTTC,
    methodesReglement,
    timbreFiscal,
    exoneration,
  ]);

  const handleAddArticle = (articleId: string) => {
    let article = filteredArticles.find((a) => a.id === parseInt(articleId));

    if (!article) {
      article = articles.find((a) => a.id === parseInt(articleId));
    }

    if (
      article &&
      !selectedArticles.some((item) => item.article_id === article?.id)
    ) {
      const initialHT = article.puv_ht || 0;
      const initialTVA = article.tva || 0;
      const initialTTC = article.puv_ttc || initialHT * (1 + (initialTVA || 0) / 100);

      setSelectedArticles([
        ...selectedArticles,
        {
          article_id: article.id,
          quantite: "", // Start with empty instead of 0
          prixUnitaire: initialHT,
          prixTTC: Math.round(initialTTC * 1000) / 1000,
          tva: initialTVA,
          remise: 0,
          designation: article.designation || "", // Add designation here
          articleDetails: article,
        },
      ]);

      // Clear the search input and results after adding
      setArticleSearch("");
      setFilteredArticles([]);
      setFocusedIndex(-1);

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
            updatedItem.designation = value || "";
          }

          // Recalculate TTC when HT changes
          if (field === "prixUnitaire") {
            const currentHT = Number(value) || 0;
            const currentTVA = item.tva || 0;

            let newPriceTTC = currentHT;
            if (currentTVA > 0) {
              newPriceTTC = currentHT * (1 + currentTVA / 100);
            }

            updatedItem.prixTTC = Math.round(newPriceTTC * 1000) / 1000;

            // Clear TTC editing state when HT changes
            setEditingTTC((prev) => {
              const newState = { ...prev };
              delete newState[articleId];
              return newState;
            });
          }

          // Recalculate HT when TTC changes (manual TTC edit)
          if (field === "prixTTC") {
            const currentTTC = Number(value) || 0;
            const currentTVA = item.tva || 0;

            let newPriceHT = currentTTC;
            if (currentTVA > 0) {
              newPriceHT = currentTTC / (1 + currentTVA / 100);
            }

            updatedItem.prixUnitaire = Math.round(newPriceHT * 1000) / 1000;

            // Clear HT editing state when TTC changes
            setEditingHT((prev) => {
              const newState = { ...prev };
              delete newState[articleId];
              return newState;
            });
          }

          // Recalculate both when TVA changes
          if (field === "tva") {
            const currentTVA = value === "" ? 0 : Number(value);
            const currentHT = item.prixUnitaire;

            let newPriceTTC = currentHT;
            if (currentTVA > 0) {
              newPriceTTC = currentHT * (1 + currentTVA / 100);
            }

            updatedItem.prixTTC = Math.round(newPriceTTC * 1000) / 1000;

            // Clear both editing states when TVA changes
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

          return updatedItem;
        }
        return item;
      })
    );
  };

  // Barcode scanning handler - add this near your other handler functions
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

  // Keyboard handler for barcode scanner
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

  // Set up keyboard listener for barcode scanning - add this useEffect
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
    if (createEditModal && articleSearchRef.current) {
      // Focus on article search input when modal opens
      setTimeout(() => {
        if (articleSearchRef.current) {
          articleSearchRef.current.focus();
        }
      }, 100);
    }
  }, [createEditModal]);

// Update your toggleCreateEditModal function to clear modal data:
const toggleCreateEditModal = useCallback(() => {
  if (createEditModal) {
    // Clear all search results when closing modal (EXACT SAME AS BL)
    setFilteredArticles([]);
    setFilteredClients([]);
    setArticleSearch("");
    setClientSearch("");
    setFocusedIndex(-1);
    
    setCreateEditModal(false);
    setFacture(null);
    setSelectedArticles([]);
    setSelectedClient(null);
    setGlobalRemise(0);
    setRemiseType("fixed");
    setShowRemise(false);
    setIsEdit(false);
    setTimbreFiscal(true);
    setExoneration(false);
    setConditionPaiement("");
    setMethodesReglement([]);
    setEspaceNotes("");
    setRetentionAmount(0);
    setModalLoading(false); // ADD THIS LINE
    
    validation.resetForm();
  } else {
    setCreateEditModal(true);
    // Don't load modal data here - useEffect will handle it (EXACT SAME AS BL)
  }
}, [createEditModal]);

  // Ajouter méthode de règlement
  const addMethodeReglement = () => {
    setMethodesReglement((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        method: "especes",
        amount: "",
      },
    ]);
  };

  // Supprimer méthode de règlement
  const removeMethodeReglement = (id: string) => {
    setMethodesReglement((prev) => prev.filter((pm) => pm.id !== id));
  };

  // Mettre à jour méthode de règlement
  const updateMethodeReglement = (id: string, field: string, value: any) => {
    setMethodesReglement((prev) =>
      prev.map((pm) => {
        if (pm.id === id) {
          if (field === "amount") {
            if (typeof value === "string") {
              if (value === "" || /^[0-9]*[,.]?[0-9]*$/.test(value)) {
                const formattedValue = value.replace(".", ",");
                const commaCount = (formattedValue.match(/,/g) || []).length;
                if (commaCount <= 1) {
                  return { ...pm, [field]: formattedValue };
                }
              }
              return pm;
            }
          }
          return { ...pm, [field]: value };
        }
        return pm;
      })
    );
  };

  // Calculer le total des méthodes de règlement (excluding retention)
  const totalReglementAmount = useMemo(() => {
    return methodesReglement.reduce((sum, pm) => {
      if (!pm || !pm.amount || pm.method === "retenue") return sum;

      let amountValue: number;
      if (typeof pm.amount === "string") {
        if (pm.amount === "") return sum;
        amountValue = parseFloat(pm.amount.replace(",", ".")) || 0;
      } else if (typeof pm.amount === "number") {
        amountValue = pm.amount;
      } else {
        amountValue = 0;
      }

      return sum + amountValue;
    }, 0);
  }, [methodesReglement]);

  const handleSubmit = async (values: any) => {
    try {
      // ✅ CORRECTED VALIDATION: Payment methods should not exceed finalTotal (BEFORE retention)
      // Retention is not a payment - it's a deduction from the total amount
      if (methodesReglement.length > 0) {
        // Filter out retention methods from validation - they are not real payments
        const nonRetentionPayments = methodesReglement.filter(
          (pm) => pm.method !== "retenue"
        );

        if (nonRetentionPayments.length > 0) {
          const totalPaymentAmount = nonRetentionPayments.reduce((sum, pm) => {
            if (!pm.amount || pm.amount === "") return sum;
            const amountValue =
              typeof pm.amount === "string"
                ? parseFloat(pm.amount.replace(",", ".")) || 0
                : Number(pm.amount) || 0;
            return sum + amountValue;
          }, 0);

          // Check if total payments exceed the final total (BEFORE retention)
          if (totalPaymentAmount > finalTotal) {
            toast.error(
              `Le total des règlements (${totalPaymentAmount.toFixed(
                3
              )} DT) dépasse le montant total (${finalTotal.toFixed(3)} DT)`
            );
            return;
          }

          // Check if any individual payment method exceeds the final total
          const hasIndividualExceed = nonRetentionPayments.some((pm) => {
            if (!pm.amount || pm.amount === "") return false;
            const amountValue =
              typeof pm.amount === "string"
                ? parseFloat(pm.amount.replace(",", ".")) || 0
                : Number(pm.amount) || 0;
            return amountValue > finalTotal;
          });

          if (hasIndividualExceed) {
            toast.error(
              "Le montant d'une méthode de règlement dépasse le montant total"
            );
            return;
          }
        }
      }

      // ✅ PREPARER LES METHODES DE REGLEMENT POUR LA SOUMISSION (INCLUDING RETENTION)
      const processedMethodesReglement = methodesReglement
        .filter((pm) => pm.method && (pm.method === "retenue" || pm.amount))
        .map((pm) => {
          let amountValue: number;
          if (typeof pm.amount === "string") {
            amountValue = parseFloat(pm.amount.replace(",", ".")) || 0;
          } else if (typeof pm.amount === "number") {
            amountValue = pm.amount;
          } else {
            amountValue = 0;
          }

          // For retention method, send the rate and amount as 0 (not a real payment)
          if (pm.method === "retenue") {
            return {
              method: pm.method,
              amount: 0, // Send 0 as amount since it's not a real payment
              numero: pm.numero || "",
              banque: pm.banque || "",
              dateEcheance: pm.dateEcheance || "",
              tauxRetention: pm.tauxRetention || 1,
            };
          }

          return {
            method: pm.method,
            amount: amountValue,
            numero: pm.numero || "",
            banque: pm.banque || "",
            dateEcheance: pm.dateEcheance || "",
          };
        });

      // Check if any article has quantity 0 or empty
      const articlesWithQuantities = selectedArticles.map((item) => ({
        ...item,
        quantite: item.quantite === "" ? 0 : Number(item.quantite),
      }));

      const hasEmptyQuantities = articlesWithQuantities.some(
        (item) => item.quantite <= 0
      );
      if (hasEmptyQuantities) {
        toast.error(
          "Tous les articles doivent avoir une quantité supérieure à 0"
        );
        return;
      }

      // Prepare facture data
      // In your handleSubmit function
      const factureData = {
        ...values,
        taxMode,
        client_id: selectedClient?.id,
        remise: globalRemise,
        remiseType: remiseType,
        articles: selectedArticles.map((item) => ({
          article_id: item.article_id,
          quantite: item.quantite,
          prix_unitaire: item.prixUnitaire,
          prix_ttc: item.prixTTC,
          designation: item.designation || item.articleDetails?.designation || "", // ADD THIS
          tva: item.tva,
          remise: item.remise,
          vendeur_id: selectedVendeur?.id,
        })),
        totalHT: sousTotalHT,
        totalTVA: totalTax,
        totalTTC: grandTotal,
        totalTTCAfterRemise: finalTotal,
        timbreFiscal: timbreFiscal,
        exoneration: exoneration,
        // Send payment methods
        paymentMethods: methodesReglement
          .filter((pm) => pm.method && (pm.method === "retenue" || pm.amount))
          .map((pm) => {
            let amountValue = 0;
            if (typeof pm.amount === "string") {
              amountValue = parseFloat(pm.amount.replace(",", ".")) || 0;
            } else if (typeof pm.amount === "number") {
              amountValue = pm.amount;
            }

            if (pm.method === "retenue") {
              return {
                method: pm.method,
                amount: 0,
                numero: pm.numero || "",
                banque: pm.banque || "",
                dateEcheance: pm.dateEcheance || "",
                tauxRetention: pm.tauxRetention || 1,
              };
            }

            return {
              method: pm.method,
              amount: amountValue,
              numero: pm.numero || "",
              banque: pm.banque || "",
              dateEcheance: pm.dateEcheance || "",
            };
          }),
        montantRetenue: retentionMontant,
        hasRetenue: methodesReglement.some((pm) => pm.method === "retenue"),
        espaceNotes: espaceNotes,
      };


      if (isEdit && facture) {
        await updateFacture(facture.id, factureData);
        toast.success("Facture mise à jour avec succès");
      } else {
        await createFacture(factureData);
        toast.success("Facture créée avec succès");
      }

      setCreateEditModal(false);

      // Reset payment methods after successful submission
      setMethodesReglement([]);
      setEspaceNotes("");

      fetchData();
    } catch (err) {
      console.error("Error in handleSubmit:", err);
      toast.error(err instanceof Error ? err.message : "Échec de l'opération");
    }
  };

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

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      numeroFacture: isEdit ? facture?.numeroFacture || "" : nextFactureNumber,
      dateFacture: facture?.dateFacture
        ? moment(facture.dateFacture).format("YYYY-MM-DD")
        : moment().format("YYYY-MM-DD"),
      status: facture?.status ?? "Brouillon",
      notes: facture?.notes ?? "",
      client_id: facture?.client?.id ?? "",
      // conditionPaiement: facture?.conditionPaiement ?? "",
      vendeur_id: facture?.vendeur?.id ?? "",
      modeReglement: facture?.modeReglement ?? "Espece",
      // dateEcheance: facture?.dateEcheance
      // ? moment(facture.dateEcheance).format("YYYY-MM-DD")
      // : "",
      montantPaye: facture?.montantPaye ?? 0,
    },
    validationSchema: Yup.object().shape({
      numeroFacture: Yup.string().required("Le numéro est requis"),
      dateFacture: Yup.date()
        .required("La date est requise")
        .typeError("Date invalide"),
      status: Yup.string().required("Le statut est requis"),
      client_id: Yup.number().required("Le client est requis"),
      // conditionPaiement: Yup.string().required(
      // "La condition de paiement est requise"
      // ),
      vendeur_id: Yup.number().required("Le vendeur est requis"),
      modeReglement: Yup.string().required("Le mode de règlement est requis"),
      //dateEcheance: Yup.date()
      // .required("La date d'échéance est requise")
      // .min(
      // Yup.ref("dateFacture"),
      // "La date d'échéance ne peut pas être antérieure à la date de facture"
      // )
      // .typeError("Date d'échéance invalide"),
      montantPaye: Yup.number().min(
        0,
        "Le montant payé ne peut pas être négatif"
      ),
    }),
    onSubmit: handleSubmit,
  });
  const openDetailModal = (facture: FactureClient) => {
    setSelectedFacture(facture);
    setDetailModal(true);
  };

  // In the openEncaissementModal function:
  // In the openEncaissementModal function, update the calculation:
  const openEncaissementModal = async (facture: FactureClient) => {
    setSelectedFacture(facture);
    setEncaissementModal(true);

    try {
      const nextNumber = await fetchNextEncaissementNumberFromAPI();
      setNextEncaissementNumber(nextNumber);

      // ✅ Get ALL payment sources including vente comptoire
      const paymentSummary = getPaymentMethodsSummary(facture);

      // Calculate available amount
      const hasRemise = facture.remise && Number(facture.remise) > 0;
      const finalTotal = hasRemise
        ? Number(facture.totalTTCAfterRemise) || Number(facture.totalTTC) || 0
        : Number(facture.totalTTC) || 0;

      // Include vente comptoire payments in total
      const totalRetention = paymentSummary?.totalRetention || 0;
      const totalPaye = facture.montantPaye || 0;

      // Available for encaissement: (finalTotal - retention) - totalPaye
      const availableAmount = Math.max(
        0,
        finalTotal - totalRetention - totalPaye
      );

      // Format initial value
      const initialMontant = availableAmount.toFixed(3).replace(".", ",");

      encaissementValidation.setValues({
        montant: initialMontant,
        modePaiement: "Espece",
        numeroEncaissement: nextNumber,
        date: moment().format("YYYY-MM-DD"),
        numeroCheque: "",
        banque: "",
        numeroTraite: "",
        dateEcheance: "",
        notes: "",
      });

      // Show source info if exists
      if (facture.bonCommandeClient) {
        toast.info(
          <div>
            <strong>
              Bon de Commande: {facture.bonCommandeClient.numeroCommande}
            </strong>
            <div className="small">
              Déjà payé:{" "}
              {Number(facture.bonCommandeClient.montantPaye || 0).toFixed(3)} DT
            </div>
          </div>,
          { autoClose: 5000 }
        );
      }

      // Add vente comptoire info
      if (facture.venteComptoire) {
        toast.info(
          <div>
            <strong>
              Vente Comptoire: {facture.venteComptoire.numeroCommande}
            </strong>
            <div className="small">
              Règlements:{" "}
              {paymentSummary?.totalVenteComptoireMethods?.toFixed(3) ||
                "0,000"}{" "}
              DT
            </div>
          </div>,
          { autoClose: 5000 }
        );
      }
    } catch (err) {
      console.error("Failed to fetch next encaissement number:", err);

      // Fallback calculation
      const paymentSummary = getPaymentMethodsSummary(facture);
      const totalRetention = paymentSummary?.totalRetention || 0;
      const totalPaye = facture.montantPaye || 0;

      const hasRemise = facture.remise && Number(facture.remise) > 0;
      const finalTotal = hasRemise
        ? Number(facture.totalTTCAfterRemise) || Number(facture.totalTTC) || 0
        : Number(facture.totalTTC) || 0;

      const availableAmount = Math.max(
        0,
        finalTotal - totalRetention - totalPaye
      );

      const initialMontant = availableAmount.toFixed(3).replace(".", ",");
      const year = moment().format("YYYY");
      const defaultNumber = `ENC-C${year}${String(0 + 1).padStart(5, "0")}`;

      encaissementValidation.setValues({
        montant: initialMontant,
        modePaiement: "Espece",
        numeroEncaissement: defaultNumber,
        date: moment().format("YYYY-MM-DD"),
        numeroCheque: "",
        banque: "",
        numeroTraite: "",
        dateEcheance: "",
        notes: "",
      });
    }
  };

  const handleDelete = async () => {
    if (!facture) return;
    try {
      await deleteFacture(facture.id);
      setDeleteModal(false);
      fetchData();
      toast.success("Facture supprimée avec succès");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Échec de la suppression"
      );
    }
  };
  const handleAnnuler = async (factureId: number) => {
    try {
      await updateFacture(factureId, { status: "Annulee" });
      fetchData();
      toast.success("Facture annulée avec succès");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec de l'annulation");
    }
  };

  const handleEncaissementSubmit = async (values: any) => {
    if (!selectedFacture) return;

    if (
      selectedFacture.status === "Payee" ||
      selectedFacture.status === "Annulee"
    ) {
      toast.error(
        "Impossible d'ajouter un encaissement pour une facture payée ou annulée."
      );
      return;
    }

    const encaissementAmount = values.montant;

    // ✅ USE THE EXACT SAME CALCULATION AS THE TABLE
    // Calculate payment methods total (excluding retention)
    const paymentMethodsTotal = selectedFacture.paymentMethods
      ? selectedFacture.paymentMethods
        .filter((pm: any) => pm.method !== "retenue")
        .reduce((sum: number, pm: any) => {
          let amountValue: number;
          if (typeof pm.amount === "string") {
            amountValue = parseFloat(pm.amount.replace(",", ".")) || 0;
          } else if (typeof pm.amount === "number") {
            amountValue = pm.amount;
          } else {
            amountValue = 0;
          }
          return sum + amountValue;
        }, 0)
      : 0;

    // ✅ CHECK IF THERE'S REMISE AND USE THE APPROPRIATE TOTAL
    const hasRemise =
      selectedFacture.remise && Number(selectedFacture.remise) > 0;
    const finalTotal = hasRemise
      ? Number(selectedFacture.totalTTCAfterRemise) ||
      Number(selectedFacture.totalTTC) ||
      0
      : Number(selectedFacture.totalTTC) || 0;

    const retentionAmount = Number(selectedFacture.montantRetenue) || 0;

    // ✅ EXACT SAME CALCULATION AS TABLE: (finalTotal - retentionAmount) - totalPaye
    const totalPaye = selectedFacture.montantPaye || 0;
    const availableAmount = Math.max(
      0,
      finalTotal - retentionAmount - totalPaye
    );

    if (encaissementAmount > availableAmount) {
      toast.error(
        `Le montant d'encaissement (${encaissementAmount.toFixed(
          3
        )} DT) dépasse le montant disponible (${availableAmount.toFixed(3)} DT)`
      );
      return;
    }

    try {
      const encaissementData = {
        facture_id: selectedFacture.id,
        montant: encaissementAmount,
        modePaiement: values.modePaiement,
        numeroEncaissement: values.numeroEncaissement,
        date: values.date,
        ...(values.modePaiement === "Cheque" && {
          numeroCheque: values.numeroCheque,
          banque: values.banque,
        }),
        ...(values.modePaiement === "Traite" && {
          numeroTraite: values.numeroTraite,
          dateEcheance: values.dateEcheance,
        }),
        notes: values.notes || "",
      };

      await createEncaissementClient(encaissementData);
      setEncaissementModal(false);
      fetchData();
      toast.success("Encaissement enregistré avec succès");
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Échec de l'enregistrement de l'encaissement"
      );
    }
  };

  const encaissementValidation = useFormik({
    enableReinitialize: true,
    initialValues: {
      montant: "0,000",
      modePaiement: "Espece",
      numeroEncaissement: nextEncaissementNumber,
      date: moment().format("YYYY-MM-DD"),
      numeroCheque: "",
      banque: "",
      numeroTraite: "",
      dateEcheance: "",
      notes: "",
    },
    validationSchema: Yup.object({
      montant: Yup.string()
        .test(
          "is-valid-amount",
          "Le montant doit être un nombre valide",
          function (value) {
            if (!value) return false;
            const numericValue = parseFloat(value.replace(",", "."));
            return !isNaN(numericValue) && numericValue > 0;
          }
        )
        .test(
          "min-amount",
          "Le montant doit être supérieur à 0",
          function (value) {
            if (!value) return false;
            const numericValue = parseFloat(value.replace(",", "."));
            return numericValue >= 0.01;
          }
        )
        .test(
          "max-reste",
          "Le montant ne peut pas dépasser le reste à payer",
          function (value) {
            if (!value || !selectedFacture) return false;
            const numericValue = parseFloat(value.replace(",", "."));

            // ✅ USE THE EXACT SAME CALCULATION AS TABLE - JUST USE RESTEAPAYER DIRECTLY
            const availableAmount = Number(selectedFacture.resteAPayer) || 0;

            const roundedValue = Math.round(numericValue * 1000) / 1000;
            const roundedAvailable = Math.round(availableAmount * 1000) / 1000;
            return roundedValue <= roundedAvailable;
          }
        )
        .required("Le montant est requis"),
      modePaiement: Yup.string()
        .required("Le mode de paiement est requis")
        .oneOf(
          ["Espece", "Cheque", "Virement", "Traite", "Autre", "tpe"],
          "Mode de paiement invalide"
        ),
      numeroEncaissement: Yup.string()
        .required("Le numéro d'encaissement est requis")
        .min(3, "Le numéro d'encaissement doit contenir au moins 3 caractères"),
      date: Yup.date()
        .required("La date est requise")
        .typeError("Date invalide")
        .max(new Date(), "La date ne peut pas être dans le futur"),
      numeroCheque: Yup.string().when("modePaiement", {
        is: "Cheque",
        then: (schema) =>
          schema
            .required("Le numéro du chèque est requis")
            .min(2, "Le numéro du chèque doit contenir au moins 2 caractères"),
        otherwise: (schema) => schema.notRequired(),
      }),
      banque: Yup.string().when("modePaiement", {
        is: "Cheque",
        then: (schema) =>
          schema
            .required("La banque est requise")
            .min(2, "Le nom de la banque doit contenir au moins 2 caractères"),
        otherwise: (schema) => schema.notRequired(),
      }),
      numeroTraite: Yup.string().when("modePaiement", {
        is: "Traite",
        then: (schema) =>
          schema
            .required("Le numéro de traite est requis")
            .min(2, "Le numéro de traite doit contenir au moins 2 caractères"),
        otherwise: (schema) => schema.notRequired(),
      }),
      dateEcheance: Yup.date().when("modePaiement", {
        is: "Traite",
        then: (schema) =>
          schema
            .required("La date d'échéance est requise")
            .typeError("Date d'échéance invalide")
            .min(
              Yup.ref("date"),
              "La date d'échéance ne peut pas être antérieure à la date d'encaissement"
            ),
        otherwise: (schema) => schema.notRequired(),
      }),
      notes: Yup.string()
        .max(500, "Les notes ne peuvent pas dépasser 500 caractères")
        .notRequired(),
    }),
    onSubmit: (values) => {
      const numericMontant = parseFloat(values.montant.replace(",", "."));
      handleEncaissementSubmit({
        ...values,
        montant: numericMontant,
      });
    },
  });
  // Custom handler for montant field
  const handleMontantChange = (e: any) => {
    let value = e.target.value;
    // Allow only numbers, one comma, or one dot
    if (value === "" || /^[0-9]*[,.]?[0-9]*$/.test(value)) {
      // Replace dot with comma for consistent display
      value = value.replace(".", ",");
      // Allow only one comma
      const commaCount = (value.match(/,/g) || []).length;
      if (commaCount <= 1) {
        encaissementValidation.setFieldValue("montant", value);
      }
    }
  };
  const StatusBadge = ({
    status,
  }: {
    status?:
    | "Brouillon"
    | "Validee"
    | "Payee"
    | "Annulee"
    | "Partiellement Payee";
  }) => {
    const statusConfig = {
      Brouillon: {
        bgClass: "bg-warning",
        textClass: "text-warning",
        icon: "ri-time-line",
      },
      Validee: {
        bgClass: "bg-primary",
        textClass: "text-primary",
        icon: "ri-checkbox-circle-line",
      },
      Payee: {
        bgClass: "bg-success",
        textClass: "text-success",
        icon: "ri-money-dollar-circle-line",
      },
      Annulee: {
        bgClass: "bg-danger",
        textClass: "text-danger",
        icon: "ri-close-circle-line",
      },
      "Partiellement Payee": {
        bgClass: "bg-info",
        textClass: "text-info",
        icon: "ri-wallet-line",
      },
    };
    const config =
      status && status in statusConfig
        ? statusConfig[status]
        : statusConfig["Brouillon"];
    return (
      <span
        className={`badge ${config.bgClass}-subtle ${config.textClass} text-uppercase`}
      >
        <i className={`${config.icon} align-bottom me-1`}></i>
        {status || "Brouillon"}
      </span>
    );
  };
  const columns = useMemo(
    () => [
      {
        header: "Numéro",
        accessorKey: "numeroFacture",
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
      // In your columns array, add this column:
      {
        header: "Source",
        accessorKey: "sourceInfo",
        enableColumnFilter: false,
        cell: (cell: any) => {
          const facture = cell.row.original;
          if (facture.bonCommandeClient) {
            return (
              <Badge color="info">
                <i className="ri-shopping-bag-line me-1"></i>
                {facture.bonCommandeClient.numeroCommande}
              </Badge>
            );
          } else if (facture.venteComptoire) {
            return (
              <Badge color="warning">
                <i className="ri-store-line me-1"></i>
                {facture.venteComptoire.numeroCommande}
              </Badge>
            );
          }
          return "-";
        },
      },
      {
        header: "Date Facture",
        accessorKey: "dateFacture",
        enableColumnFilter: false,
        cell: (cell: any) => moment(cell.getValue()).format("DD MMM YYYY"),
      },
      {
        header: "Client",
        accessorKey: "client",
        enableColumnFilter: false,
        cell: (cell: any) => cell.getValue()?.raison_sociale || "N/A",
      },
      {
        header: "Total TTC",
        accessorKey: "totalTTC",
        enableColumnFilter: false,
        cell: (cell: any) => {
          const total = Number(cell.getValue()) || 0;
          return `${total.toFixed(3)} DT`; // ✅ Changed to 3 decimal places
        },
      },
      {
        header: "Total TTC Après Remise",
        accessorKey: "totalTTCAfterRemise", // Use the calculated field
        enableColumnFilter: false,
        cell: (cell: any) => {
          const total = Number(cell.getValue()) || 0;
          return `${total.toFixed(3)} DT`; // ✅ Changed to 3 decimal places
        },
      },
      {
        header: "Payé",
        accessorKey: "montantPaye",
        enableColumnFilter: false,
        cell: (cell: any) => `${Number(cell.getValue()).toFixed(3)} DT`, // ✅ 3 decimal places
      },
      {
        header: "Reste à payer",
        accessorKey: "resteAPayer",
        enableColumnFilter: false,
        cell: (cell: any) => `${Number(cell.getValue()).toFixed(3)} DT`, // ✅ 3 decimal places
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
          const facture = cellProps.row.original;
          return (
            <ul className="list-inline hstack gap-2 mb-0">
              <li className="list-inline-item">
                <button
                  type="button"
                  className="btn btn-info btn-sm"
                  style={{ marginRight: "12px" }}
                  onClick={() => openDetailModal(facture)}
                  title="Voir les détails"
                >
                  Details <i className="ri-eye-line fs-12"></i>
                </button>
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
      <Container fluid style={{ maxWidth: "100%" }}>
        <BreadCrumb title="Factures Clients" pageTitle="Factures" />
        <Row>
          <Col lg={12}>
            <Card id="factureClientList">
              <CardHeader className="card-header border-0">
                <Row className="align-items-center gy-3">
                  <div className="col-sm">
                    <h5 className="card-title mb-0">
                      Gestion des Factures Clients
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
                          setSearchPhone("");
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
                          setFacture(null);
                          setSelectedArticles([]);
                          setSelectedClient(null);
                          setGlobalRemise(0);
                          setRemiseType("percentage");
                          setShowRemise(false);
                          validation.resetForm();
                          setCreateEditModal(true);
                        }}
                      >
                        <i className="ri-add-line align-bottom me-1"></i>{" "}
                        Ajouter Facture
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
                    className={classnames({ active: activeTab === "2" })}
                    onClick={() => setActiveTab("2")}
                  >
                    <i className="ri-time-line me-1 align-bottom"></i> Brouillon
                  </NavLink>
                </NavItem>
                <NavItem>
                  <NavLink
                    className={classnames({ active: activeTab === "3" })}
                    onClick={() => setActiveTab("3")}
                  >
                    <i className="ri-checkbox-circle-line me-1 align-bottom"></i>{" "}
                    Validée
                  </NavLink>
                </NavItem>
                <NavItem>
                  <NavLink
                    className={classnames({ active: activeTab === "4" })}
                    onClick={() => setActiveTab("4")}
                  >
                    <i className="ri-money-dollar-circle-line me-1 align-bottom"></i>{" "}
                    Payée
                  </NavLink>
                </NavItem>
                <NavItem>
                  <NavLink
                    className={classnames({ active: activeTab === "5" })}
                    onClick={() => setActiveTab("5")}
                  >
                    <i className="ri-close-circle-line me-1 align-bottom"></i>{" "}
                    Annulée
                  </NavLink>
                </NavItem>
              </Nav>
              <CardBody className="pt-3">
                {/* Replace your current Row with search filters with this enhanced version */}
                <Row className="mb-3">
                  <Col md={3}>
                    <div className="search-box">
                      <Input
                        type="text"
                        className="form-control"
                        placeholder="Rechercher par nom ou numéro..."
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                      />
                      <i className="ri-search-line search-icon"></i>
                    </div>
                  </Col>
                  {/* Phone Search */}
                  <Col md={3}>
                    <div className="search-box">
                      <Input
                        type="text"
                        className="form-control"
                        placeholder="Rechercher par téléphone..."
                        value={searchPhone}
                        onChange={(e) => {
                          const value = e.target.value;
                          // Apply auto-space formatting for phone numbers
                          if (value) {
                            const formatted = formatPhoneInput(value);
                            setSearchPhone(formatted);
                          } else {
                            setSearchPhone("");
                          }
                        }}
                        onKeyDown={(e) => {
                          // Allow navigation keys
                          if (
                            [
                              "Backspace",
                              "Delete",
                              "ArrowLeft",
                              "ArrowRight",
                              "Tab",
                            ].includes(e.key)
                          ) {
                            return;
                          }

                          // Only allow digits and space
                          if (
                            !/[0-9\s]/.test(e.key) &&
                            e.key !== "Backspace" &&
                            e.key !== "Delete"
                          ) {
                            e.preventDefault();
                          }
                        }}
                      />
                      <i className="ri-phone-line search-icon"></i>
                      {searchPhone && (
                        <button
                          type="button"
                          className="btn btn-link text-danger position-absolute end-0 top-50 translate-middle-y p-0 me-2"
                          onClick={() => setSearchPhone("")}
                          title="Effacer"
                        >
                          <i className="ri-close-line"></i>
                        </button>
                      )}
                    </div>
                  </Col>

                  {/* Name/Number Search */}

                  {/* Date Filters */}
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

                {/* Add Reset All Filters Button */}

                {loading ? (
                  <Loader />
                ) : error ? (
                  <div className="text-danger">{error}</div>
                ) : (
                  <TableContainer
                    columns={columns}
                    data={filteredFactures}
                    isGlobalFilter={false}
                    customPageSize={10}
                    divClass="table-responsive table-card mb-1 mt-0"
                    tableClass="align-middle table-nowrap"
                    theadClass="table-light text-muted text-uppercase"
                  />
                )}

                {/* Quick Client Creation Modal */}
                {/* Replace your current Client Creation Modal with this complete version */}
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

                    {/* Phone Fields with Auto-Space */}
                    <Row>
                      <Col md={6}>
                        <div className="mb-3">
                          <Label className="form-label fw-semibold">
                            Téléphone 1*
                          </Label>
                          <div className="position-relative">
                            <Input
                              value={newClient.telephone1}
                              onChange={(e) => {
                                const value = e.target.value;
                                // Auto-format phone number
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
                              className="form-control-lg pe-5"
                            />
                            {newClient.telephone1 && (
                              <div className="position-absolute end-0 top-50 translate-middle-y me-3">
                                <i className="ri-phone-line text-muted"></i>
                              </div>
                            )}
                          </div>
                          <small className="text-muted">
                            Format automatique: XX XXX XXX
                          </small>
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="mb-3">
                          <Label className="form-label fw-semibold">
                            Téléphone 2
                          </Label>
                          <div className="position-relative">
                            <Input
                              value={newClient.telephone2}
                              onChange={(e) => {
                                const value = e.target.value;
                                // Auto-format phone number
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
                              className="form-control-lg pe-5"
                            />
                            {newClient.telephone2 && (
                              <div className="position-absolute end-0 top-50 translate-middle-y me-3">
                                <i className="ri-phone-line text-muted"></i>
                              </div>
                            )}
                          </div>
                          <small className="text-muted">
                            Format automatique: XX XXX XXX
                          </small>
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
                      disabled={
                        !newClient.raison_sociale || !newClient.telephone1
                      }
                      className="btn-invoice-primary fs-6 px-4"
                    >
                      <i className="ri-user-add-line me-2"></i>
                      Créer Client
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
                        <h4 className="mb-0 fw-bold text-dark">Nouvel Article</h4>
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
                        <i className="ri-file-text-line text-info fs-4"></i>
                      </div>
                      <div>
                        <h4 className="mb-0 fw-bold text-dark">
                          Facture #{selectedFacture?.numeroFacture}
                        </h4>
                        <small className="text-muted">
                          {moment(selectedFacture?.dateFacture).format(
                            "DD MMM YYYY"
                          )}
                        </small>
                      </div>
                    </div>
                  </ModalHeader>
                  <ModalBody className="pt-0">
                    {selectedFacture && (
                      <div className="facture-details">
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
                                      {selectedFacture.client?.raison_sociale}
                                    </h5>
                                    <p className="text-muted mb-1">
                                      <i className="ri-phone-line me-1"></i>
                                      {selectedFacture.client?.telephone1 ||
                                        "N/A"}
                                    </p>
                                    <p className="text-muted mb-0">
                                      <i className="ri-map-pin-line me-1"></i>
                                      {selectedFacture.client?.adresse || "N/A"}
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
                                  Informations Facture
                                </h6>
                                <div className="row g-2">
                                  <div className="col-6">
                                    <p className="mb-2">
                                      <span className="text-muted d-block">
                                        Vendeur:
                                      </span>
                                      <strong>
                                        {selectedFacture.vendeur
                                          ? `${selectedFacture.vendeur.nom} ${selectedFacture.vendeur.prenom}`
                                          : "N/A"}
                                      </strong>
                                    </p>
                                  </div>
                                  <div className="col-6">
                                    <p className="mb-2">
                                      <span className="text-muted d-block">
                                        Mode règlement:
                                      </span>
                                      <strong>
                                        {selectedFacture.modeReglement || "N/A"}
                                      </strong>
                                    </p>
                                  </div>
                                  <div className="col-6">
                                    <p className="mb-2">
                                      <span className="text-muted d-block">
                                        Statut:
                                      </span>
                                      <StatusBadge
                                        status={selectedFacture.status}
                                      />
                                    </p>
                                  </div>
                                </div>
                              </CardBody>
                            </Card>
                          </Col>
                        </Row>
                        {selectedFacture.notes && (
                          <Card className="border-0 shadow-sm mb-4">
                            <CardBody className="p-4">
                              <h6 className="fw-semibold mb-3 text-primary">
                                <i className="ri-sticky-note-line me-2"></i>
                                Notes
                              </h6>
                              <p className="mb-0 text-muted">
                                {selectedFacture.notes}
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
                                  {selectedFacture.articles.map(
                                    (item, index) => {
                                      const quantite =
                                        Number(item.quantite) || 0;
                                      const priceHT =
                                        Number(item.prixUnitaire) || 0;
                                      const tvaRate = Number(item.tva || 0);
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
                                                  {item.designation || item.article?.designation}
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
                                    if (!selectedFacture) return null;

                                    const articles = selectedFacture.articles || [];
                                    const remiseValue = Number(selectedFacture.remise) || 0;
                                    const remiseTypeValue = selectedFacture.remiseType || "fixed";
                                    const isExoneration = !!selectedFacture.exoneration;
                                    const hasTimbreFiscal = !!selectedFacture.timbreFiscal;
                                    const retentionAmount = Number(selectedFacture.montantRetenue) || 0;

                                    // ✅ STEP 1: Calculate totals WITHOUT considering global remise
                                    let sousTotalHTValue = 0;
                                    let netHTBeforeGlobalRemise = 0;
                                    let totalTaxValue = 0;
                                    let grandTotalValue = 0;

                                    articles.forEach((article: any) => {
                                      const qty = Number(article.quantite) || 0;
                                      const articleRemise = Number(article.remise || 0);

                                      const priceHT = Number(article.prixUnitaire) || 0;
                                      const tvaRate = isExoneration ? 0 : Number(article.tva ?? 0);
                                      const priceTTC = Number(article.prix_ttc) ||
                                        Number(article.article?.puv_ttc) ||
                                        priceHT * (1 + tvaRate / 100);

                                      const lineHT = Math.round(priceHT * 1000) / 1000;
                                      const lineTTC = Math.round(priceTTC * 1000) / 1000;

                                      const montantSousTotalHT = Math.round(qty * lineHT * 1000) / 1000;
                                      const montantNetHTLigne = Math.round(
                                        qty * lineHT * (1 - articleRemise / 100) * 1000
                                      ) / 1000;
                                      const montantTTCLigne = Math.round(qty * lineTTC * 1000) / 1000;
                                      const montantTVALigne = Math.round(
                                        (montantTTCLigne - montantNetHTLigne) * 1000
                                      ) / 1000;

                                      sousTotalHTValue = Math.round((sousTotalHTValue + montantSousTotalHT) * 1000) / 1000;
                                      netHTBeforeGlobalRemise = Math.round((netHTBeforeGlobalRemise + montantNetHTLigne) * 1000) / 1000;
                                      totalTaxValue = Math.round((totalTaxValue + montantTVALigne) * 1000) / 1000;
                                      grandTotalValue = Math.round((grandTotalValue + montantTTCLigne) * 1000) / 1000;
                                    });

                                    // ✅ STEP 2: Apply global remise according to principle
                                    let netHTAfterGlobalRemise = netHTBeforeGlobalRemise;
                                    let totalTaxAfterGlobalRemise = totalTaxValue;
                                    let finalTotalValue = grandTotalValue;
                                    let discountAmountValue = 0;
                                    let discountPercentage = 0;

                                    if (remiseValue > 0) {
                                      if (remiseTypeValue === "percentage") {
                                        // ✅ Percentage remise: Apply on HT base
                                        discountAmountValue = Math.round(
                                          (netHTBeforeGlobalRemise * (remiseValue / 100)) * 1000
                                        ) / 1000;
                                        netHTAfterGlobalRemise = Math.round(
                                          (netHTBeforeGlobalRemise - discountAmountValue) * 1000
                                        ) / 1000;

                                        if (netHTBeforeGlobalRemise > 0) {
                                          const tvaToHtRatio = Math.round(
                                            (totalTaxValue / netHTBeforeGlobalRemise) * 1000
                                          ) / 1000;
                                          totalTaxAfterGlobalRemise = Math.round(
                                            (netHTAfterGlobalRemise * tvaToHtRatio) * 1000
                                          ) / 1000;
                                        } else {
                                          totalTaxAfterGlobalRemise = 0;
                                        }

                                        finalTotalValue = Math.round(
                                          (netHTAfterGlobalRemise + totalTaxAfterGlobalRemise) * 1000
                                        ) / 1000;
                                      } else if (remiseTypeValue === "fixed") {
                                        // ✅ Fixed remise: User enters the final TTC amount
                                        finalTotalValue = Math.round(remiseValue * 1000) / 1000;

                                        const uniqueTvaRates = Array.from(
                                          new Set(articles.map((a: any) => Number(a.tva ?? 0)))
                                        );

                                        if (uniqueTvaRates.length === 1 && uniqueTvaRates[0] > 0) {
                                          // ✅ SINGLE TVA RATE FORMULA: Net HT = TTC / (1 + TVA rate)
                                          const tvaRate = uniqueTvaRates[0] / 100;
                                          netHTAfterGlobalRemise = Math.round((finalTotalValue / (1 + tvaRate)) * 1000) / 1000;
                                          totalTaxAfterGlobalRemise = Math.round((finalTotalValue - netHTAfterGlobalRemise) * 1000) / 1000;
                                        } else {
                                          // ✅ MULTIPLE TVA RATES: EXACT SAME CALCULATION
                                          // IMPORTANT: Pas d'arrondi sur le coefficient
                                          const discountCoefficient = finalTotalValue / grandTotalValue;

                                          let newTotalHT = 0;
                                          let newTotalTVA = 0;

                                          articles.forEach((article: any) => {
                                            const qty = Number(article.quantite) || 0;
                                            const articleRemise = Number(article.remise || 0);
                                            const unitHT = Number(article.prixUnitaire) || 0;
                                            const tvaRate = Number(article.tva ?? 0) / 100;

                                            // Calcul exact sans arrondi intermédiaire
                                            const lineHTAfterDiscount = qty * unitHT * (1 - articleRemise / 100);
                                            const newLineHT = lineHTAfterDiscount * discountCoefficient;
                                            const newLineTVA = newLineHT * tvaRate;

                                            newTotalHT += newLineHT;
                                            newTotalTVA += newLineTVA;
                                          });

                                          // Arrondir seulement à la fin
                                          netHTAfterGlobalRemise = Math.round(newTotalHT * 1000) / 1000;
                                          totalTaxAfterGlobalRemise = Math.round(newTotalTVA * 1000) / 1000;
                                        }

                                        discountAmountValue = Math.round(
                                          (netHTBeforeGlobalRemise - netHTAfterGlobalRemise) * 1000
                                        ) / 1000;

                                        if (netHTBeforeGlobalRemise > 0) {
                                          discountPercentage = Math.round(
                                            (discountAmountValue / netHTBeforeGlobalRemise) * 100 * 1000
                                          ) / 1000;
                                        }
                                      }
                                    }

                                    // ✅ STEP 3: Apply exoneration - IF exoneration is true, TVA should be 0
                                    if (isExoneration) {
                                      totalTaxAfterGlobalRemise = 0;
                                      finalTotalValue = netHTAfterGlobalRemise;
                                    }

                                    // ✅ STEP 4: Add timbre fiscal
                                    if (hasTimbreFiscal) {
                                      finalTotalValue = Math.round((finalTotalValue + 1) * 1000) / 1000;
                                    }

                                    // ✅ STEP 5: Calculate net à payer (after retention)
                                    let netAPayerValue = Math.round((finalTotalValue - retentionAmount) * 1000) / 1000;
                                    netAPayerValue = Math.max(0, netAPayerValue);

                                    const displayNetHT = remiseValue > 0
                                      ? netHTAfterGlobalRemise
                                      : netHTBeforeGlobalRemise;

                                    const displayTotalTax = isExoneration
                                      ? 0
                                      : remiseValue > 0
                                        ? totalTaxAfterGlobalRemise
                                        : totalTaxValue;

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
                                              {displayNetHT.toFixed(3)} DT
                                            </td>
                                          </tr>
                                          <tr className="real-time-update">
                                            <th className="text-end text-muted fs-6">
                                              TVA:
                                            </th>
                                            <td className="text-end fw-semibold fs-6">
                                              {displayTotalTax.toFixed(3)} DT
                                              {isExoneration && (
                                                <i
                                                  className="ri-check-line text-success ms-1"
                                                  title="TVA exonérée"
                                                ></i>
                                              )}
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
                                            <tr className="real-time-update">
                                              <th className="text-end text-muted fs-6">
                                                {remiseTypeValue === "percentage"
                                                  ? `Remise (${remiseValue}%)`
                                                  : `Remise (Montant fixe) ${discountPercentage.toFixed(2)}%`}
                                              </th>
                                              <td className="text-end text-danger fw-bold fs-6">
                                                - {discountAmountValue.toFixed(3)} DT
                                              </td>
                                            </tr>
                                          )}
                                          {hasTimbreFiscal && (
                                            <tr className="real-time-update">
                                              <th className="text-end text-muted fs-6">
                                                Timbre Fiscal:
                                              </th>
                                              <td className="text-end fw-semibold fs-6">
                                                1.000 DT
                                              </td>
                                            </tr>
                                          )}
                                          {retentionAmount > 0 && (
                                            <tr className="real-time-update table-info">
                                              <th className="text-end text-muted fs-6">
                                                Montant retenu:
                                              </th>
                                              <td className="text-end fw-semibold fs-6 text-danger">
                                                - {retentionAmount.toFixed(3)} DT
                                              </td>
                                            </tr>
                                          )}
                                          <tr className="final-total real-time-update border-top">
                                            <th className="text-end fs-5">
                                              NET À PAYER:
                                            </th>
                                            <td className="text-end fw-bold fs-5 text-primary">
                                              {netAPayerValue.toFixed(3)} DT
                                              {isExoneration && (
                                                <i
                                                  className="ri-shield-check-line text-warning ms-1"
                                                  title="Facture exonérée"
                                                ></i>
                                              )}
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

                    {/* Super Simple Payment Display */}
                    {selectedFacture && (
                      <Card className="border-0 shadow-sm mb-4">
                        <CardBody className="p-4">
                          <h6 className="fw-semibold mb-3 text-primary">
                            <i className="ri-money-dollar-circle-line me-2"></i>
                            État des Paiements
                          </h6>

                          {/* Payment Summary in Boxes */}
                          <Row className="g-3 mb-3">
                            {/* Facture Payments */}
                            {selectedFacture.paymentMethods &&
                              selectedFacture.paymentMethods.filter(
                                (pm: any) =>
                                  pm.method !== "retenue" &&
                                  Number(pm.amount || 0) > 0
                              ).length > 0 && (
                                <Col md={6}>
                                  <div className="border rounded p-3 bg-primary bg-opacity-10">
                                    <div className="d-flex justify-content-between align-items-center">
                                      <div>
                                        <h6 className="fw-semibold mb-1">
                                          Règlements Facture
                                        </h6>
                                        <small className="text-muted">
                                          {
                                            selectedFacture.paymentMethods.filter(
                                              (pm: any) =>
                                                pm.method !== "retenue" &&
                                                Number(pm.amount || 0) > 0
                                            ).length
                                          }{" "}
                                          règlement(s)
                                        </small>
                                      </div>
                                      <Badge color="primary">
                                        {selectedFacture.paymentMethods
                                          .filter(
                                            (pm: any) => pm.method !== "retenue"
                                          )
                                          .reduce(
                                            (sum: number, pm: any) =>
                                              sum + (Number(pm.amount) || 0),
                                            0
                                          )
                                          .toFixed(3)}{" "}
                                        DT
                                      </Badge>
                                    </div>
                                  </div>
                                </Col>
                              )}

                            {/* Bon Commande Payments */}
                            {selectedFacture.bonCommandeClient && (
                              <Col md={6}>
                                <div className="border rounded p-3 bg-info bg-opacity-10">
                                  <div className="d-flex justify-content-between align-items-center mb-2">
                                    <div>
                                      <h6 className="fw-semibold mb-1">
                                        <i className="ri-shopping-bag-line me-1"></i>
                                        Bon de Commande
                                      </h6>
                                      <small className="text-muted">
                                        {
                                          selectedFacture.bonCommandeClient
                                            .numeroCommande
                                        }
                                      </small>
                                    </div>
                                    <Badge color="info" pill>
                                      Payé
                                    </Badge>
                                  </div>

                                  {/* Bon Commande Payment Methods */}
                                  {selectedFacture.bonCommandeClient
                                    .paymentMethods &&
                                    selectedFacture.bonCommandeClient.paymentMethods.filter(
                                      (pm: any) =>
                                        pm.method !== "retenue" &&
                                        Number(pm.amount || 0) > 0
                                    ).length > 0 && (
                                      <div className="mt-2 pt-2 border-top">
                                        <small className="text-muted d-block">
                                          Règlements:
                                        </small>
                                        <div className="small">
                                          {selectedFacture.bonCommandeClient.paymentMethods
                                            .filter(
                                              (pm: any) =>
                                                pm.method !== "retenue" &&
                                                Number(pm.amount || 0) > 0
                                            )
                                            .map((pm: any, idx: number) => (
                                              <div
                                                key={idx}
                                                className="d-flex justify-content-between"
                                              >
                                                <span>
                                                  {formatPaymentMethodName(
                                                    pm.method
                                                  )}
                                                </span>
                                                <span>
                                                  {Number(
                                                    pm.amount || 0
                                                  ).toFixed(3)}{" "}
                                                  DT
                                                </span>
                                              </div>
                                            ))}
                                        </div>
                                      </div>
                                    )}

                                  {/* Bon Commande Client Payments */}
                                  {selectedFacture.bonCommandeClient
                                    .paiements &&
                                    selectedFacture.bonCommandeClient.paiements
                                      .length > 0 && (
                                      <div className="mt-2 pt-2 border-top">
                                        <small className="text-muted d-block">
                                          Paiements Client:
                                        </small>
                                        <div className="small">
                                          {selectedFacture.bonCommandeClient.paiements
                                            .filter(
                                              (p: any) =>
                                                Number(p.montant || 0) > 0
                                            )
                                            .map(
                                              (paiement: any, idx: number) => (
                                                <div
                                                  key={idx}
                                                  className="d-flex justify-content-between"
                                                >
                                                  <span>
                                                    {paiement.modePaiement}
                                                  </span>
                                                  <span>
                                                    {Number(
                                                      paiement.montant || 0
                                                    ).toFixed(3)}{" "}
                                                    DT
                                                  </span>
                                                </div>
                                              )
                                            )}
                                        </div>
                                      </div>
                                    )}
                                </div>
                              </Col>
                            )}

                            {/* ✅ ADD VENTE COMPTOIRE PAYMENTS */}
                            {selectedFacture.venteComptoire && (
                              <Col md={6}>
                                <div className="border rounded p-3 bg-warning bg-opacity-10">
                                  <div className="d-flex justify-content-between align-items-center mb-2">
                                    <div>
                                      <h6 className="fw-semibold mb-1">
                                        <i className="ri-store-line me-1"></i>
                                        Vente Comptoire
                                      </h6>
                                      <small className="text-muted">
                                        {
                                          selectedFacture.venteComptoire
                                            .numeroCommande
                                        }
                                      </small>
                                    </div>
                                    <Badge color="warning" pill>
                                      Source
                                    </Badge>
                                  </div>

                                  {/* Vente Comptoire Payment Methods */}
                                  {selectedFacture.venteComptoire
                                    .paymentMethods &&
                                    selectedFacture.venteComptoire.paymentMethods.filter(
                                      (pm: any) =>
                                        pm.method !== "retenue" &&
                                        Number(pm.amount || 0) > 0
                                    ).length > 0 && (
                                      <div className="mt-2 pt-2 border-top">
                                        <small className="text-muted d-block">
                                          Règlements:
                                        </small>
                                        <div className="small">
                                          {selectedFacture.venteComptoire.paymentMethods
                                            .filter(
                                              (pm: any) =>
                                                pm.method !== "retenue" &&
                                                Number(pm.amount || 0) > 0
                                            )
                                            .map((pm: any, idx: number) => (
                                              <div
                                                key={idx}
                                                className="d-flex justify-content-between"
                                              >
                                                <span>
                                                  {formatPaymentMethodName(
                                                    pm.method
                                                  )}
                                                </span>
                                                <span>
                                                  {Number(
                                                    pm.amount || 0
                                                  ).toFixed(3)}{" "}
                                                  DT
                                                </span>
                                              </div>
                                            ))}
                                        </div>
                                      </div>
                                    )}

                                  {/* Show vente comptoire mode reglement */}
                                  {selectedFacture.venteComptoire
                                    .modeReglement && (
                                      <div className="mt-2 pt-2 border-top">
                                        <small className="text-muted d-block">
                                          Mode de règlement:
                                        </small>
                                        <div className="small fw-semibold">
                                          {
                                            selectedFacture.venteComptoire
                                              .modeReglement
                                          }
                                        </div>
                                      </div>
                                    )}
                                </div>
                              </Col>
                            )}
                          </Row>

                          {/* Total Summary */}
                          <div className="border-top pt-3">
                            <Row className="align-items-center">
                              <Col>
                                <div className="d-flex align-items-center">
                                  <div className="bg-success bg-opacity-10 p-2 rounded me-3">
                                    <i className="ri-wallet-line text-success fs-4"></i>
                                  </div>
                                  <div>
                                    <h6 className="mb-0 fw-semibold">
                                      Total Payé
                                    </h6>
                                    <small className="text-muted">
                                      Tous paiements confondus
                                      {selectedFacture.venteComptoire &&
                                        " (incl. vente comptoire)"}
                                    </small>
                                  </div>
                                </div>
                              </Col>
                              <Col className="text-end">
                                <h4 className="fw-bold text-success mb-0">
                                  {Number(
                                    selectedFacture.montantPaye || 0
                                  ).toFixed(3)}{" "}
                                  DT
                                </h4>
                              </Col>
                            </Row>
                          </div>
                        </CardBody>
                      </Card>
                    )}
                  </ModalBody>
                  <ModalFooter className="border-0 pt-4">
                    {/* Edit Button */}
                    {selectedFacture && (
                      <Button
                        color="primary"
                        size="md"
                        onClick={() => {
                          // Set all the data for editing
                          setFacture(selectedFacture);
                          setSelectedClient(selectedFacture.client);
                          setSelectedArticles(
                            selectedFacture.articles.map(
                              (item: FactureClient["articles"][number]) => {
                                const prixTTCFromDB = Number(item.prix_ttc);
                                return {
                                  article_id: item.article.id,
                                  quantite: item.quantite,
                                  prixUnitaire: Number(item.prixUnitaire),
                                  prixTTC: prixTTCFromDB,
                                  tva:
                                    item.tva != null ? Number(item.tva) : null,
                                  remise:
                                    item.remise != null
                                      ? Number(item.remise)
                                      : null,
                                  articleDetails: item.article,
                                  designation: item.designation || item.article?.designation || "", // Add this line

                                };
                              }
                            )
                          );
                          setGlobalRemise(selectedFacture.remise || 0);
                          setRemiseType(selectedFacture.remiseType || "fixed");
                          setShowRemise(
                            !!selectedFacture.remise &&
                            selectedFacture.remise > 0
                          );
                          setIsEdit(true);
                          setCreateEditModal(true);
                          setTimbreFiscal(
                            selectedFacture.timbreFiscal || false
                          );
                          setExoneration(!!selectedFacture.exoneration); // FIXED: Use boolean conversion
                          setMethodesReglement(
                            selectedFacture.paymentMethods &&
                              selectedFacture.paymentMethods.length > 0
                              ? selectedFacture.paymentMethods.map(
                                (pm: any, index: number) => ({
                                  id: pm.id || `edit-${index}`,
                                  method: pm.method,
                                  amount: pm.amount
                                    ? pm.amount.toFixed(3).replace(".", ",")
                                    : "",
                                  numero: pm.numero || "",
                                  banque: pm.banque || "",
                                  dateEcheance: pm.dateEcheance || "",
                                })
                              )
                              : []
                          );
                          setConditionPaiement(
                            selectedFacture.conditionPaiement
                          );
                          setSelectedVendeur(selectedFacture.vendeur || null); // FIXED: Handle undefined
                          setDetailModal(false); // Close details modal
                        }}
                        className="btn-invoice btn-invoice-primary me-2"
                      >
                        <i className="ri-pencil-fill me-2"></i> Modifier
                      </Button>
                    )}

                    {/* Encaissement Button */}
                    {selectedFacture &&
                      selectedFacture.resteAPayer > 0 &&
                      selectedFacture.status !== "Annulee" &&
                      selectedFacture.status !== "Payee" && (
                        <Button
                          color="success"
                          size="md"
                          onClick={() => {
                            openEncaissementModal(selectedFacture);
                            setDetailModal(false);
                          }}
                          className="btn-invoice btn-invoice-success me-2"
                        >
                          <i className="ri-money-dollar-circle-line me-2"></i>{" "}
                          Encaissement
                        </Button>
                      )}

                    {/* PDF Button */}
                    {selectedFacture && (
                      <Button
                        color="secondary"
                        onClick={() => {
                          openPdfModal(selectedFacture);
                          setDetailModal(false);
                        }}
                        className="btn-invoice btn-invoice-secondary me-2"
                      >
                        <i className="ri-file-pdf-line me-2"></i> Facture PDF
                      </Button>
                    )}
                    <Button
                      color="danger"
                      size="md"
                      onClick={() => {
                        setFacture(selectedFacture);
                        setDeleteModal(true);
                        setDetailModal(false);
                      }}
                      className="btn-invoice btn-invoice-danger me-2"
                    >
                      <i className="ri-delete-bin-5-fill me-2"></i> Supprimer
                    </Button>

                    {/* Cancel Invoice Button */}
                    {/* Close Button */}
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
                  isOpen={createEditModal}
                  toggle={toggleCreateEditModal}
                  centered
                  size="xl"
                  className="invoice-modal"
                  style={{ maxWidth: "1200px" }}
                >
                  <ModalHeader
                    toggle={toggleCreateEditModal}
                    className="border-0 pb-3"
                  >
                    <div className="d-flex align-items-center">
                      <div className="modal-icon-wrapper bg-primary bg-opacity-10 rounded-circle p-2 me-3">
                        <i className="ri-file-list-3-line text-primary fs-4"></i>
                      </div>
                      <div>
                        <h4 className="mb-0 fw-bold text-dark">
                          {isEdit
                            ? "Modifier Facture"
                            : "Créer Nouvelle Facture"}
                        </h4>
                        <small className="text-muted">
                          {isEdit
                            ? "Modifier les détails de la facture existante"
                            : "Créer une nouvelle facture client"}
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
                          <Row className="align-items-center">
                            {/* Numéro de Facture */}
                            <Col md={4}>
                              <div className="mb-3">
                                <Label className="form-label-lg fw-semibold">
                                  Numéro de Facture{" "}
                                  <span className="text-danger"> *</span>
                                </Label>
                                <Input
                                  name="numeroFacture"
                                  value={validation.values.numeroFacture}
                                  onChange={validation.handleChange}
                                  invalid={
                                    validation.touched.numeroFacture &&
                                    !!validation.errors.numeroFacture
                                  }
                                  readOnly={isEdit}
                                  className="form-control-lg"
                                  placeholder="FAC-2024-001"
                                />
                                <FormFeedback className="fs-6">
                                  {validation.errors.numeroFacture}
                                </FormFeedback>
                              </div>
                            </Col>
                            {/* Date de Facture */}
                            <Col md={4}>
                              <div className="mb-3">
                                <Label className="form-label-lg fw-semibold">
                                  Date de Facture
                                  <span className="text-danger"> *</span>
                                </Label>
                                <Input
                                  type="date"
                                  name="dateFacture"
                                  value={validation.values.dateFacture}
                                  onChange={validation.handleChange}
                                  invalid={
                                    validation.touched.dateFacture &&
                                    !!validation.errors.dateFacture
                                  }
                                  className="form-control-lg"
                                />
                                {validation.touched.dateFacture &&
                                  validation.errors.dateFacture && (
                                    <div className="text-danger fs-6 mt-1">
                                      {validation.errors.dateFacture as string}
                                    </div>
                                  )}
                              </div>
                            </Col>
                            {/* Timbre Fiscal - Centré et aligné */}
                            <Col md={4}>
                              <div className="mb-3">
                                <Label className="form-label-lg fw-semibold d-block text-center mb-5"></Label>
                                <div className="d-flex justify-content-center align-items-center">
                                  <div className="form-check form-switch form-switch-lg">
                                    <Input
                                      type="checkbox"
                                      id="timbreFiscal"
                                      checked={timbreFiscal}
                                      onChange={(e) =>
                                        setTimbreFiscal(e.target.checked)
                                      }
                                      className="form-check-input"
                                      style={{
                                        width: "48px",
                                        height: "24px",
                                        cursor: "pointer",
                                      }}
                                    />
                                    <Label
                                      for="timbreFiscal"
                                      className="form-check-label fw-semibold fs-6 ms-2"
                                    >
                                      Timbre Fiscal
                                    </Label>
                                  </div>
                                </div>
                                <div className="text-center mt-2">
                                  <Badge
                                    color={
                                      timbreFiscal ? "success" : "secondary"
                                    }
                                    className="fs-6"
                                  >
                                    {timbreFiscal
                                      ? "Activé (+1.000 DT)"
                                      : "Désactivé"}
                                  </Badge>
                                </div>
                              </div>
                            </Col>

                            {/* In the create/edit modal, add this after the Timbre Fiscal section */}
                          </Row>
                        </CardBody>
                      </Card>
                      {/* Client and Vendeur Section */}
                  {/* Client and Vendeur Section */}
<Row className="g-3 mb-4">
  <Col md={6}>
    <Card className="border-0 shadow-sm h-100">
      <CardBody className="p-4">
        <h6 className="fw-semibold mb-3 text-primary">
          <i className="ri-user-line me-2"></i>
          Informations Client
        </h6>

        {/* Enhanced Client Search Section - SAME AS BON COMMANDE */}
        <div className="mb-3 position-relative">
          <Label className="form-label-lg fw-semibold">
            Client <span className="text-danger"> *</span>
            {!selectedClient && (
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
              placeholder="Rechercher par nom, raison sociale ou téléphone..."
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
                  // Auto-format phone if mostly digits
                  const digitCount = (value.match(/\d/g) || []).length;
                  const totalLength = value.length;
                  if (digitCount >= totalLength * 0.7) {
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
              readOnly={!!selectedClient}
              className="form-control-lg pe-10"
            />

            {/* Clear button when client is selected */}
            {selectedClient && (
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

            {/* Add new client button when no client selected */}
            {!selectedClient && (
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

          {/* Dropdown Results - same enhanced style as Bon Commande */}
          {!selectedClient && clientSearch.length >= 3 && (
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
                        {/* Raison Sociale + Edit button */}
                        <div className="d-flex justify-content-between align-items-start mb-1 position-relative">
                          <span className="fw-semibold client-info-name">
                            {c.raison_sociale}
                          </span>

                          {/* Edit icon - positioned top-right */}
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
                              zIndex: 2,
                              position: "relative", // Changed from absolute to relative
                              marginLeft: "auto" // This pushes it to the end
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.opacity = "1";
                              e.currentTarget.style.transform = "scale(1.1)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.opacity = "0.7";
                              e.currentTarget.style.transform = "scale(1)";
                            }}
                          >
                            <i className="ri-edit-line fs-5"></i>
                          </button>
                        </div>

                        {/* Phone 1 */}
                        {c.telephone1 && (
                          <div className="mb-1">
                            <span className="client-info-phone d-flex align-items-center">
                              <i className="ri-phone-line me-1" style={{ fontSize: "0.75rem" }}></i>
                              {formatPhoneDisplay(c.telephone1)}
                            </span>
                          </div>
                        )}

                        {/* Phone 2 + Designation */}
                        <div className="d-flex justify-content-between align-items-center mt-1">
                          {c.designation && (
                            <small className="client-info-designation">
                              {c.designation}
                            </small>
                          )}
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

          {validation.touched.client_id && validation.errors.client_id && (
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
            Vendeur<span className="text-danger"> *</span>
          </Label>
          <Input
            type="select"
            name="vendeur_id"
            value={validation.values.vendeur_id}
            onChange={(e) => {
              const vendeurId = e.target.value;
              validation.setFieldValue("vendeur_id", vendeurId);
              const vendeur = vendeurs.find(
                (v) => v.id === parseInt(vendeurId)
              );
              setSelectedVendeur(vendeur || null);
            }}
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
            <option value="">Sélectionner un vendeur</option>
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
                      {/* Payment Conditions and Options */}

                      {/* Global Discount Section <Card className="border-0 shadow-sm mb-4">
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
    setRemiseType(
      e.target.value as "percentage" | "fixed"
    )
  }
  className="form-control-sm"
>
  <option value="fixed">Montant fixe (DT)</option>
  <option value="percentage">Pourcentage (%)</option>
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
  value={globalRemise === 0 ? "" : globalRemise} // Show empty when 0
  onChange={(e) => {
    const value = e.target.value;
    // Allow empty string
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
                      {/* Articles Section */}
                      <Card className="border-0 shadow-sm mb-4">
                        <CardBody className="p-4">
                          {/* Enhanced Header with Exoneration Indicator */}
                          <div className="d-flex justify-content-between align-items-center mb-4">
                            <div className="d-flex align-items-center">
                              <h5 className="fw-semibold text-primary mb-0 me-3">
                                <i className="ri-shopping-cart-line me-2"></i>
                                Articles
                              </h5>
                              {exoneration && (
                                <Badge
                                  color="warning"
                                  className="fs-6 px-3 py-2"
                                >
                                  <i className="ri-shield-check-line me-1"></i>
                                  Exonération TVA
                                </Badge>
                              )}
                            </div>

                            {/* Optional: Add a quick toggle button */}
                            <div className="d-flex align-items-center">
                              <Label
                                className="form-label fs-5 fw-semibold mb-0 me-2"
                                style={{ color: "blue" }}
                              >
                                Exonération:
                              </Label>
                              <div className="form-check form-switch">
                                <Input
                                  type="checkbox"
                                  id="quickExonerationToggle"
                                  checked={exoneration}
                                  onChange={(e) =>
                                    setExoneration(e.target.checked)
                                  }
                                  className="form-check-input"
                                  style={{
                                    width: "60px", // Increased from 48px
                                    height: "30px", // Increased from 24px
                                    cursor: "pointer",
                                  }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Rest of the Articles section remains the same */}
                          {/* Articles Search Section */}
                          <div className="mb-4">
                            <Label className="form-label-lg fw-semibold">
                              Rechercher Article
                              <button
                                type="button"
                                className="btn btn-link text-primary p-0 ms-2"
                                onClick={() => setArticleModal(true)}
                                title="Ajouter un nouvel article"
                                style={{ fontSize: "0.8rem" }}
                              >
                                <i className="ri-add-line me-1"></i>
                                Nouvel article
                              </button>
                            </Label>

                            <div className="search-box position-relative">
                              <Input
                                type="text"
                                placeholder="Rechercher article par référence ou désignation..."
                                value={articleSearch}
                                innerRef={articleSearchRef}
                                onChange={(e) => {
                                  setArticleSearch(e.target.value);
                                  setFocusedIndex(-1); // Reset focus when typing
                                }}
                                onKeyDown={(e) => {
                                  if (filteredArticles.length > 0) {
                                    // Handle arrow down
                                    if (e.key === "ArrowDown") {
                                      e.preventDefault();
                                      setFocusedIndex((prev) =>
                                        prev < filteredArticles.length - 1
                                          ? prev + 1
                                          : 0
                                      );
                                    }
                                    // Handle arrow up
                                    else if (e.key === "ArrowUp") {
                                      e.preventDefault();
                                      setFocusedIndex((prev) =>
                                        prev > 0
                                          ? prev - 1
                                          : filteredArticles.length - 1
                                      );
                                    }
                                    // Handle Enter to select focused item
                                    else if (
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
                                    }
                                    // Handle Enter to select first item when no focus
                                    else if (
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
                                    // Handle Escape to clear search
                                    else if (e.key === "Escape") {
                                      e.preventDefault();
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

                            {/* Enhanced Dropdown with Keyboard Support */}
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
                                      // Create ref for each item
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
                                              {/* Show reference first in larger font */}
                                              <div className="d-flex align-items-center mb-1">
                                                <strong className="fs-6 me-2 text-primary">
                                                  {article.reference}
                                                </strong>
                                                <span className="badge bg-light text-dark me-2">
                                                  Stock: {article.qte || 0}
                                                </span>
                                              </div>
                                              {/* Show designation in smaller font */}
                                              <small
                                                className="text-muted d-block"
                                                style={{ fontSize: "0.85rem" }}
                                              >
                                                {article.designation}
                                              </small>
                                              {/* Show TTC price prominently */}
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
                              {/* Add exoneration banner above the table */}
                              {exoneration && (
                                <div className="alert alert-warning mb-3 d-flex align-items-center">
                                  <i className="ri-information-line me-2 fs-5"></i>
                                  <div>
                                    <strong>Exonération TVA Activée</strong>
                                    <div className="small">
                                      La TVA est exclue des calculs. Les taux
                                      TVA sont affichés à titre informatif.
                                    </div>
                                  </div>
                                </div>
                              )}

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
                                        {exoneration && (
                                          <Badge
                                            color="warning"
                                            className="ms-1 fs-7"
                                            title="À titre informatif"
                                          >
                                            info
                                          </Badge>
                                        )}
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
                                          );
                                          const tvaRate = Number(item.tva) || 0;
                                          if (tvaRate > 0) {
                                            const coefficient =
                                              1 + tvaRate / 100;
                                            priceHT = parseFloat(
                                              (priceTTC / coefficient).toFixed(
                                                3
                                              )
                                            );
                                          } else {
                                            priceHT = priceTTC;
                                          }
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
                                                    handleArticleChange(item.article_id, "designation", newValue);
                                                  }}
                                                  className="article-designation-input"
                                                />
                                              </div>
                                            </div>
                                          </td>
                                          <td style={{ width: "10%" }}>
                                            <div className="d-flex align-items-center justify-content-center">
                                              <Badge
                                                color="light"
                                                className="text-dark"
                                              >
                                                {article?.reference}
                                              </Badge>
                                            </div>
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
                                            <div className="position-relative">
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
                                              {exoneration &&
                                                item.tva &&
                                                item.tva > 0 && (
                                                  <div
                                                    className="position-absolute top-0 end-0 mt-1 me-1"
                                                    title="TVA affichée à titre informatif (exonérée)"
                                                  >
                                                    <i className="ri-information-line text-warning"></i>
                                                  </div>
                                                )}
                                            </div>
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
                          {selectedArticles.length > 0 && (
                            <div className="calculation-summary mt-4">
                              <h6 className="fw-semibold mb-3 text-primary">
                                <i className="ri-calculator-line me-2"></i>
                                Récapitulatif
                                {exoneration && (
                                  <Badge color="warning" className="ms-2 fs-6">
                                    <i className="ri-shield-check-line me-1"></i>
                                    Exonération
                                  </Badge>
                                )}
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
                                                | "fixed"
                                                | "percentage"
                                              )
                                            }
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

                                {/* Right Side - Calculations */}
                                <Col md={6}>
                                  <div className="calculation-summary-right">
                                    {exoneration && (
                                      <div className="alert alert-warning mb-3 py-2">
                                        <small>
                                          <i className="ri-information-line me-1"></i>
                                          <strong>
                                            Exonération TVA activée
                                          </strong>{" "}
                                          - La TVA est exclue des calculs
                                        </small>
                                      </div>
                                    )}

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
                                            {exoneration
                                              ? "0,000"
                                              : totalTax.toFixed(3)}{" "}
                                            DT
                                            {exoneration && (
                                              <i
                                                className="ri-check-line text-success ms-1"
                                                title="TVA exonérée"
                                              ></i>
                                            )}
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
                                          <tr className="real-time-update">
                                            <th className="text-end text-muted fs-6">
                                              {remiseType === "percentage"
                                                ? `Remise (${globalRemise}%)`
                                                : `Remise (Montant fixe) ${(
                                                  (discountAmount /
                                                    grandTotal) *
                                                  100
                                                ).toFixed(2)}%`}
                                            </th>
                                            <td className="text-end text-danger fw-bold fs-6">
                                              - {discountAmount.toFixed(3)} DT
                                            </td>
                                          </tr>
                                        )}

                                        {/* Timbre Fiscal for Factures */}
                                        {timbreFiscal && (
                                          <tr className="real-time-update">
                                            <th className="text-end text-muted fs-6">
                                              Timbre Fiscal:
                                            </th>
                                            <td className="text-end fw-semibold fs-6">
                                              1.000 DT
                                            </td>
                                          </tr>
                                        )}

                                        <tr className="final-total real-time-update border-top">
                                          <th className="text-end fs-5">
                                            NET À PAYER:
                                          </th>
                                          <td className="text-end fw-bold fs-5 text-primary">
                                            {finalTotal.toFixed(3)} DT
                                            {exoneration && (
                                              <i
                                                className="ri-shield-check-line text-warning ms-1"
                                                title="Facture exonérée"
                                              ></i>
                                            )}
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

                      {/* Payment Methods Section */}
                      {/* Payment Methods Section */}
                      <Card className="border-0 shadow-sm mb-4">
                        <CardBody className="p-4">
                          <div className="d-flex justify-content-between align-items-center">
                            <h5 className="fw-semibold text-primary mb-0">
                              <i className="ri-bank-card-line me-2"></i>
                              Modes de Règlement
                            </h5>

                            {/* ALWAYS SHOW ADD BUTTON */}
                            <Button
                              color="outline-primary"
                              size="sm"
                              onClick={addMethodeReglement}
                              className="btn-invoice-outline-primary"
                            >
                              <i className="ri-add-line me-1"></i>
                              Ajouter Paiement
                            </Button>
                          </div>

                          {/* SHOW PAYMENT METHODS IF THEY EXIST */}
                          {methodesReglement.length > 0 && (
                            <>
                              {/* Liste des méthodes de règlement */}
                              {methodesReglement.map((methode, index) => (
                                <div
                                  key={methode.id}
                                  className="border rounded p-3 mb-3 bg-light"
                                >
                                  <div className="d-flex justify-content-between align-items-center mb-3">
                                    <h6 className="fw-semibold mb-0 text-dark">
                                      {methode.method === "retenue"
                                        ? "Retenue à la source"
                                        : `Règlement #${index + 1}`}
                                    </h6>

                                    <Button
                                      color="danger"
                                      size="sm"
                                      onClick={() =>
                                        removeMethodeReglement(methode.id)
                                      }
                                      className="btn-invoice-danger"
                                    >
                                      <i className="ri-close-line"></i>
                                    </Button>
                                  </div>

                                  <Row className="g-3">
                                    {/* Type de méthode */}
                                    <Col md={3}>
                                      <Label className="form-label fw-semibold">
                                        Type*
                                      </Label>
                                      <Input
                                        type="select"
                                        value={methode.method}
                                        onChange={(e) => {
                                          const newMethod = e.target.value;
                                          updateMethodeReglement(
                                            methode.id,
                                            "method",
                                            newMethod
                                          );

                                          // Set default retention rate to 1% when selecting retention
                                          if (newMethod === "retenue") {
                                            updateMethodeReglement(
                                              methode.id,
                                              "tauxRetention",
                                              1
                                            );
                                            // Set amount to 0 for retention
                                            updateMethodeReglement(
                                              methode.id,
                                              "amount",
                                              "0,000"
                                            );
                                          }
                                        }}
                                        className="form-control"
                                        required
                                      >
                                        <option value="">Sélectionner</option>
                                        <option value="especes">Espèces</option>
                                        <option value="cheque">Chèque</option>
                                        <option value="virement">
                                          Virement
                                        </option>
                                        <option value="traite">Traite</option>
                                        <option value="tpe">
                                          Carte Bancaire "TPE"
                                        </option>
                                        <option value="retenue">
                                          Retenue à la source
                                        </option>
                                      </Input>
                                    </Col>
                                    {/* Montant - Different behavior for retention */}
                                    <Col md={3}>
                                      <Label className="form-label fw-semibold">
                                        {methode.method === "retenue"
                                          ? "Montant calculé (DT)"
                                          : "Montant (DT)*"}
                                      </Label>
                                      <Input
                                        type="text"
                                        value={
                                          methode.method === "retenue"
                                            ? retentionMontant
                                              .toFixed(3)
                                              .replace(".", ",")
                                            : methode.amount
                                        }
                                        onChange={(e) => {
                                          // Only allow changes for non-retention methods
                                          if (methode.method !== "retenue") {
                                            updateMethodeReglement(
                                              methode.id,
                                              "amount",
                                              e.target.value
                                            );
                                          }
                                        }}
                                        readOnly={methode.method === "retenue"}
                                        className={`form-control text-end ${methode.method === "retenue"
                                          ? "bg-light"
                                          : ""
                                          }`}
                                        placeholder="000,000"
                                        required={methode.method !== "retenue"}
                                      />
                                      {methode.method === "retenue" && (
                                        <small className="text-muted">
                                          Calculé automatiquement à partir du
                                          taux
                                        </small>
                                      )}
                                    </Col>

                                    {/* Retention Rate Field */}
                                    {methode.method === "retenue" && (
                                      <Col md={3}>
                                        <Label className="form-label fw-semibold">
                                          Taux de retenue (%)*
                                        </Label>
                                        <Input
                                          type="select"
                                          value={methode.tauxRetention || 1}
                                          onChange={(e) =>
                                            updateMethodeReglement(
                                              methode.id,
                                              "tauxRetention",
                                              Number(e.target.value)
                                            )
                                          }
                                          className="form-control"
                                          required
                                        >
                                          <option value="1">1%</option>
                                          <option value="2">2%</option>
                                          <option value="3">3%</option>
                                          <option value="5">5%</option>
                                          <option value="10">10%</option>
                                        </Input>
                                      </Col>
                                    )}

                                    {/* Champs conditionnels pour les autres méthodes */}
                                    {(methode.method === "cheque" ||
                                      methode.method === "traite") && (
                                        <Col md={3}>
                                          <Label className="form-label fw-semibold">
                                            {methode.method === "cheque"
                                              ? "Numéro Chèque*"
                                              : "Numéro Traite*"}
                                          </Label>
                                          <Input
                                            type="text"
                                            value={methode.numero || ""}
                                            onChange={(e) =>
                                              updateMethodeReglement(
                                                methode.id,
                                                "numero",
                                                e.target.value
                                              )
                                            }
                                            placeholder={
                                              methode.method === "cheque"
                                                ? "N° chèque"
                                                : "N° traite"
                                            }
                                            className="form-control"
                                            required
                                          />
                                        </Col>
                                      )}

                                    {methode.method === "cheque" && (
                                      <Col md={3}>
                                        <Label className="form-label fw-semibold">
                                          Banque*
                                        </Label>
                                        <Input
                                          type="text"
                                          value={methode.banque || ""}
                                          onChange={(e) =>
                                            updateMethodeReglement(
                                              methode.id,
                                              "banque",
                                              e.target.value
                                            )
                                          }
                                          placeholder="Nom banque"
                                          className="form-control"
                                          required
                                        />
                                      </Col>
                                    )}

                                    {methode.method === "traite" && (
                                      <Col md={3}>
                                        <Label className="form-label fw-semibold">
                                          Date Échéance*
                                        </Label>
                                        <Input
                                          type="date"
                                          value={
                                            methode.dateEcheance ||
                                            moment().format("YYYY-MM-DD")
                                          }
                                          onChange={(e) =>
                                            updateMethodeReglement(
                                              methode.id,
                                              "dateEcheance",
                                              e.target.value
                                            )
                                          }
                                          className="form-control"
                                          required
                                        />
                                      </Col>
                                    )}
                                  </Row>
                                </div>
                              ))}

                              {/* Bouton pour ajouter une méthode supplémentaire */}
                              <div className="text-center mb-3">
                                <Button
                                  color="outline-primary"
                                  size="sm"
                                  onClick={addMethodeReglement}
                                  className="btn-invoice-outline-primary"
                                >
                                  <i className="ri-add-line me-1"></i>
                                  Ajouter une autre méthode
                                </Button>
                              </div>

                              {/* Résumé des paiements */}
                              <div className="mt-3">
                                <Label className="form-label fw-semibold">
                                  Notes Paiement
                                </Label>
                                <Input
                                  type="textarea"
                                  value={espaceNotes}
                                  onChange={(e) =>
                                    setEspaceNotes(e.target.value)
                                  }
                                  placeholder="Notes supplémentaires sur le paiement..."
                                  rows="2"
                                  className="form-control"
                                />
                              </div>
                            </>
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
                        onClick={toggleCreateEditModal}
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
                        {isEdit ? "Modifier la Facture" : "Créer la Facture"}
                      </Button>
                    </ModalFooter>
                  </Form>
                </Modal>
                <Modal
                  isOpen={encaissementModal}
                  toggle={() => setEncaissementModal(false)}
                  centered
                  className="invoice-modal"
                  size="lg"
                >
                  <ModalHeader toggle={() => setEncaissementModal(false)}>
                    Ajouter Encaissement - Facture #
                    {selectedFacture?.numeroFacture}
                  </ModalHeader>
                  <Form
                    onSubmit={encaissementValidation.handleSubmit}
                    className="invoice-form"
                  >
                    <ModalBody style={{ padding: "20px" }}>
                      {/* Show retention and payment methods information */}
                      {selectedFacture?.montantRetenue &&
                        Number(selectedFacture.montantRetenue) > 0 ? (
                        <div className="mb-3 p-2 bg-light rounded">
                          <small className="text-muted d-block">
                            <strong>Retenue à la source:</strong> -
                            {Number(selectedFacture.montantRetenue).toFixed(3)}{" "}
                            DT
                          </small>
                        </div>
                      ) : null}

                      {selectedFacture?.paymentMethods &&
                        selectedFacture.paymentMethods.filter(
                          (pm: any) =>
                            pm.method !== "retenue" && Number(pm.amount) > 0
                        ).length > 0 && (
                          <div className="mb-3 p-2 bg-info bg-opacity-10 rounded">
                            <small className="text-muted d-block">
                              <strong>Règlements enregistrés:</strong> -
                              {selectedFacture.paymentMethods
                                .filter((pm: any) => pm.method !== "retenue")
                                .reduce(
                                  (sum: number, pm: any) =>
                                    sum + (Number(pm.amount) || 0),
                                  0
                                )
                                .toFixed(3)}{" "}
                              DT
                            </small>
                          </div>
                        )}

                      <div className="mb-3 p-2 bg-success bg-opacity-10 rounded">
                        <small className="text-muted d-block">
                          Montant disponible pour encaissement:
                        </small>
                        <strong className="text-success fs-5">
                          {(() => {
                            if (!selectedFacture) return "0,000";

                            // ✅ EXACT SAME CALCULATION AS TABLE
                            const paymentMethodsTotal =
                              selectedFacture.paymentMethods
                                ? selectedFacture.paymentMethods
                                  .filter(
                                    (pm: any) => pm.method !== "retenue"
                                  )
                                  .reduce((sum: number, pm: any) => {
                                    let amountValue: number;
                                    if (typeof pm.amount === "string") {
                                      amountValue =
                                        parseFloat(
                                          pm.amount.replace(",", ".")
                                        ) || 0;
                                    } else if (
                                      typeof pm.amount === "number"
                                    ) {
                                      amountValue = pm.amount;
                                    } else {
                                      amountValue = 0;
                                    }
                                    return sum + amountValue;
                                  }, 0)
                                : 0;

                            // ✅ CHECK IF THERE'S REMISE AND USE THE APPROPRIATE TOTAL
                            const hasRemise =
                              selectedFacture.remise &&
                              Number(selectedFacture.remise) > 0;
                            const finalTotal = hasRemise
                              ? Number(selectedFacture.totalTTCAfterRemise) ||
                              Number(selectedFacture.totalTTC) ||
                              0
                              : Number(selectedFacture.totalTTC) || 0;

                            const retentionAmount =
                              Number(selectedFacture.montantRetenue) || 0;
                            const totalPaye = selectedFacture.montantPaye || 0;

                            const availableAmount = Math.max(
                              0,
                              finalTotal - retentionAmount - totalPaye
                            );

                            return availableAmount.toFixed(3).replace(".", ",");
                          })()}{" "}
                          DT
                        </strong>
                      </div>

                      {/* Rest of your form fields remain the same */}
                      <Row>
                        <Col md={6}>
                          <div className="mb-3">
                            <Label>Montant a payer*</Label>
                            <Input
                              type="text"
                              name="montant"
                              value={encaissementValidation.values.montant}
                              onChange={handleMontantChange}
                              invalid={
                                encaissementValidation.touched.montant &&
                                !!encaissementValidation.errors.montant
                              }
                              placeholder="0,000"
                            />
                            <FormFeedback>
                              {encaissementValidation.errors.montant}
                            </FormFeedback>
                          </div>
                        </Col>
                        <Col md={6}>
                          <div className="mb-3">
                            <Label>Mode de paiement*</Label>
                            <Input
                              type="select"
                              name="modePaiement"
                              value={encaissementValidation.values.modePaiement}
                              onChange={encaissementValidation.handleChange}
                              invalid={
                                encaissementValidation.touched.modePaiement &&
                                !!encaissementValidation.errors.modePaiement
                              }
                            >
                              <option value="Espece">En espèces</option>
                              <option value="Cheque">Chèque</option>
                              <option value="Virement">Virement</option>
                              <option value="Traite">Traite</option>
                              <option value="tpe">Carte Bancaire "TPE"</option>
                              <option value="Autre">Autre</option>
                            </Input>
                            <FormFeedback>
                              {encaissementValidation.errors.modePaiement}
                            </FormFeedback>
                          </div>
                        </Col>
                      </Row>

                      {/* Cheque Fields */}
                      {encaissementValidation.values.modePaiement ===
                        "Cheque" && (
                          <Row>
                            <Col md={6}>
                              <div className="mb-3">
                                <Label>Numéro du chèque*</Label>
                                <Input
                                  type="text"
                                  name="numeroCheque"
                                  value={
                                    encaissementValidation.values.numeroCheque
                                  }
                                  onChange={encaissementValidation.handleChange}
                                  placeholder="Saisir le numéro du chèque"
                                />
                              </div>
                            </Col>
                            <Col md={6}>
                              <div className="mb-3">
                                <Label>Banque*</Label>
                                <Input
                                  type="text"
                                  name="banque"
                                  value={encaissementValidation.values.banque}
                                  onChange={encaissementValidation.handleChange}
                                  placeholder="Nom de la banque"
                                />
                              </div>
                            </Col>
                          </Row>
                        )}

                      {/* Traite Fields */}
                      {encaissementValidation.values.modePaiement ===
                        "Traite" && (
                          <Row>
                            <Col md={6}>
                              <div className="mb-3">
                                <Label>Numéro de traite*</Label>
                                <Input
                                  type="text"
                                  name="numeroTraite"
                                  value={
                                    encaissementValidation.values.numeroTraite
                                  }
                                  onChange={encaissementValidation.handleChange}
                                  placeholder="Saisir le numéro de traite"
                                />
                              </div>
                            </Col>
                            <Col md={6}>
                              <div className="mb-3">
                                <Label>Date d'échéance*</Label>
                                <Input
                                  type="date"
                                  name="dateEcheance"
                                  value={
                                    encaissementValidation.values.dateEcheance
                                  }
                                  onChange={encaissementValidation.handleChange}
                                  min={moment().format("YYYY-MM-DD")}
                                />
                              </div>
                            </Col>
                          </Row>
                        )}

                      <Row>
                        <Col md={6}>
                          <div className="mb-3">
                            <Label>Encaissement n °*</Label>
                            <Input
                              type="text"
                              name="numeroEncaissement"
                              value={
                                encaissementValidation.values.numeroEncaissement
                              }
                              onChange={encaissementValidation.handleChange}
                              invalid={
                                encaissementValidation.touched
                                  .numeroEncaissement &&
                                !!encaissementValidation.errors
                                  .numeroEncaissement
                              }
                            />
                            <FormFeedback>
                              {encaissementValidation.errors.numeroEncaissement}
                            </FormFeedback>
                          </div>
                        </Col>
                        <Col md={6}>
                          <div className="mb-3">
                            <Label>Date*</Label>
                            <Input
                              type="date"
                              name="date"
                              value={encaissementValidation.values.date}
                              onChange={encaissementValidation.handleChange}
                              invalid={
                                encaissementValidation.touched.date &&
                                !!encaissementValidation.errors.date
                              }
                            />
                          </div>
                        </Col>
                      </Row>

                      <div className="mb-3">
                        <Label>Notes</Label>
                        <Input
                          type="textarea"
                          name="notes"
                          value={encaissementValidation.values.notes}
                          onChange={encaissementValidation.handleChange}
                          placeholder="Notes supplémentaires..."
                          rows="2"
                        />
                      </div>
                    </ModalBody>
                    <ModalFooter>
                      <Button
                        color="light"
                        onClick={() => setEncaissementModal(false)}
                      >
                        <i className="ri-close-line align-bottom me-1"></i>{" "}
                        Annuler
                      </Button>
                      <Button color="primary" type="submit">
                        <i className="ri-save-line align-bottom me-1"></i>{" "}
                        Enregistrer Encaissement
                      </Button>
                    </ModalFooter>
                  </Form>
                </Modal>
                <ToastContainer />
              </CardBody>
            </Card>
          </Col>
        </Row>
        {selectedFactureForPdf && (
          <FacturePDFModal
            isOpen={pdfModal}
            toggle={() => setPdfModal(false)}
            facture={selectedFactureForPdf}
            companyInfo={companyInfo}
          />
        )}

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

      </Container>


      
    </div >
  );
};
export default ListFactureClient;