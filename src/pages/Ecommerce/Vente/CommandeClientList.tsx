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
import { calculateDocumentTotals } from "../../../Utils/CalculationEngine";
import * as Yup from "yup";
import { useFormik } from "formik";
import moment from "moment";
import Flatpickr from "react-flatpickr";
import {
  fetchBonsCommandeClient,
  fetchBonsCommandeClientPaginated,
  createBonCommandeClient,
  updateBonCommandeClient,
  deleteBonCommandeClient,
  fetchNextCommandeNumber,
} from "../../../Components/CommandeClient/CommandeClientServices";
import {
  fetchVendeurs,
  searchArticles,
  searchClients,
} from "../../../Components/Article/ArticleServices";
import {
  createBonLivraison,
  fetchNextLivraisonNumberAPI,
} from "../../../Components/CommandeClient/BonLivraisonServices";
import {
  Article,
  Client,
  Vendeur,
  BonCommandeClient,
  PaiementClient,
} from "../../../Components/Article/Interfaces";

import { fetchDepots } from "../Stock/DepotServices";
import { Depot } from "../../../Components/Article/Interfaces";
import {
  createFacture,
  fetchNextFactureNumberFromAPI,
} from "./FactureClientServices";

// Add these imports if not already present
import {
  createClient,
  createArticle,
  fetchFournisseurs,
  fetchCategories,
} from "../../../Components/Article/ArticleServices";
import { Categorie, Fournisseur } from "../../../Components/Article/Interfaces";
import classnames from "classnames";
import BonCommandePDFModal from "./BonCommandePDFModal";
import { useProfile } from "Components/Hooks/UserHooks";
import logo from "../../../assets/images/imglogo.png";
import "./InvoiceModal.css";
import EditClientModal from "./EditClientModal";
import "./ArticleTableStyles.css"; // Import unified table styles
import DiscountAlertModal from "../../../Components/Common/DiscountAlertModal";
import {
  createPaiementClient,
  fetchPaiementsClient,
  fetchNextPaiementNumberFromAPI,
} from "./PaiementBcClientServices";
const BonCommandeClientList = () => {
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
  const [paiementClients, setPaiementClients] = useState<PaiementClient[]>([]);
  const [exoneration, setExoneration] = useState<boolean>(false);
  const [searchPhone, setSearchPhone] = useState("");
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
  const [nextNumeroLivraison, setNextNumeroLivraison] = useState("");
  const [editingTTC, setEditingTTC] = useState<{ [key: number]: string }>({});
  const [editingHT, setEditingHT] = useState<{ [key: number]: string }>({});
  const [lockedPercentage, setLockedPercentage] = useState<number | null>(null);
  const [newDeliveryQuantities, setNewDeliveryQuantities] = useState<{
    [key: number]: number | "";
  }>({});
  const [paiementModal, setPaiementModal] = useState(false);
  const [nextPaiementNumber, setNextPaiementNumber] = useState("");
  const [selectedBonForPaiement, setSelectedBonForPaiement] =
    useState<BonCommandeClient | null>(null);

  // Add ref for article search input
  const articleSearchRef = useRef<HTMLInputElement>(null);
  const [phoneSearch, setPhoneSearch] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [showRetention, setShowRetention] = useState(false);
  const [retentionRate, setRetentionRate] = useState<number>(1); // Default %
  const [retentionAmount, setRetentionAmount] = useState<number>(0);
  // Add this near your other state declarations
  const [timbreFiscal, setTimbreFiscal] = useState<boolean>(false);
  const [showDiscountAlert, setShowDiscountAlert] = useState(false);
  const [isDiscountConfirmed, setIsDiscountConfirmed] = useState(false);
  // Ajouter ces états près des autres états du composant
  // Remplacer le type des méthodes de règlement
  // REPLACE the current methodesReglement state:

  // Replace your current loading states
  const [secondaryLoading, setSecondaryLoading] = useState(false);
  const [articlesLoading, setArticlesLoading] = useState(false);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  const [methodesReglement, setMethodesReglement] = useState<
    Array<{
      id: string;
      method:
      | "especes"
      | "cheque"
      | "virement"
      | "traite"
      | "carte"
      | "Carte Bancaire TPE"
      | "retenue";
      amount: string;
      date?: string;       // ← Date de paiement (défaut: aujourd'hui)
      numero?: string;
      banque?: string;
      dateEcheance?: string;
      tauxRetention?: number;
    }>
  >([]); // Empty array - no default payment method

  const [showPaymentMethods, setShowPaymentMethods] = useState(false);

  const [depots, setDepots] = useState<Depot[]>([]);
  const [selectedDepot, setSelectedDepot] = useState<Depot | null>(null);
  const [factureModal, setFactureModal] = useState(false); // For facture creation modal
  const [isCreatingFacture, setIsCreatingFacture] = useState(false);
  const [factureSubmitAttempted, setFactureSubmitAttempted] = useState(false);
  const [nextFactureNumber, setNextFactureNumber] = useState("");
  const [editingDesignation, setEditingDesignation] = useState<{
    [key: number]: string;
  }>({});

  const [espaceNotes, setEspaceNotes] = useState("");

  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [dropdownRef, setDropdownRef] = useState<HTMLDivElement | null>(null);
  const [itemRefs, setItemRefs] = useState<React.RefObject<HTMLLIElement>[]>(
    []
  );

  // Add these state variables near your existing states
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

  const [categories, setCategories] = useState<Categorie[]>([]);
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [subcategories, setSubcategories] = useState<Categorie[]>([]);

  // Add near your other state declarations
  const [barcodeInput, setBarcodeInput] = useState("");
  const [scanningTimeout, setScanningTimeout] = useState<NodeJS.Timeout | null>(
    null
  );

  const [selectedArticles, setSelectedArticles] = useState<
    {
      article_id: number;
      quantite: number | ""; // Allow empty string
      prixUnitaire: number;
      prixTTC: number; // Add prixTTC
      tva?: number | null;
      remise?: number | null;
      articleDetails?: Article;
      designation: string;

      quantiteLivree: number | "";
    }[]
  >([]);
  const [remiseType, setRemiseType] = useState<"percentage" | "fixed">("fixed");
  const [globalRemise, setGlobalRemise] = useState<number>(0);
  const [isCreatingLivraison, setIsCreatingLivraison] = useState(false);

  const [pdfModal, setPdfModal] = useState(false);
  const [selectedBonCommandeForPdf, setSelectedBonCommandeForPdf] =
    useState<BonCommandeClient | null>(null);
  const { userProfile, loading: profileLoading } = useProfile();

  // Add this helper function to safely convert to numbers
  const getSafeNumber = (value: any): number => {
    if (value === null || value === undefined) return 0;
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  };

  const calculateEffectiveTotal = (bon: any): number => {
    const totals = calculateDocumentTotals(bon);
    return totals.finalTotal;
  };

  const calculateTotalPaid = (bon: any) => {
    if (!bon) return 0;
    const paymentMethodsSum = (bon.paymentMethods || [])
      .filter((pm: any) => pm.method !== "retenue")
      .reduce((sum: number, pm: any) => sum + getSafeNumber(pm.amount), 0);

    const additionalPaymentsSum = getSafeNumber(bon.montantPaye);

    const customRound = (num: number): number => {
      if (isNaN(num) || !isFinite(num)) return 0;
      const multiplied = Math.round(num * 100000);
      const result = multiplied / 100000;
      return Math.round(result * 1000) / 1000;
    };

    // Use Math.max to avoid double counting if the backend already includes the paymentMethods in montantPaye
    return customRound(Math.max(paymentMethodsSum, additionalPaymentsSum));
  };

  // Company info for PDF
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

  const handleMontantChangePaiement = (e: any) => {
    let value = e.target.value;
    if (value === "" || /^[0-9]*[,.]?[0-9]*$/.test(value)) {
      value = value.replace(".", ",");
      const commaCount = (value.match(/,/g) || []).length;
      if (commaCount <= 1) {
        paiementValidation.setFieldValue("montant", value);
      }
    }
  };

  // Add this effect to calculate retention in real-time

  // Function to open PDF modal
  const openPdfModal = (bonCommande: BonCommandeClient) => {
    setSelectedBonCommandeForPdf(bonCommande);
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

  // Phone formatting function
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

  const openPaiementModal = async (bonCommande: BonCommandeClient) => {
    setSelectedBonForPaiement(bonCommande);
    paiementValidation.resetForm();

    try {
      const nextNumber = await fetchNextPaiementNumberFromAPI();
      setNextPaiementNumber(nextNumber);

      // Check if there's remise and use totalTTCAfterRemise, else use totalTTC
      const finalTotal = calculateEffectiveTotal(bonCommande);

      const paye = calculateTotalPaid(bonCommande);
      const retentionAmount = getSafeNumber(bonCommande.montantRetenue);

      // Calculate available amount: finalTotal - paye - retentionAmount
      const availableAmount = Math.max(0, finalTotal - paye - retentionAmount);

      // Default montant is the available amount
      let initialMontant = availableAmount.toFixed(3).replace(".", ",");

      paiementValidation.setValues({
        montant: initialMontant,
        modePaiement: "Espece",
        numeroPaiement: nextNumber,
        date: moment().format("YYYY-MM-DD"),
        numeroCheque: "",
        banque: "",
        numeroTraite: "",
        dateEcheance: "",
        notes: "",
      });

      setPaiementModal(true);
    } catch (err) {
      console.error("Failed to fetch next payment number:", err);
      const year = moment().format("YYYY");
      const defaultNumber = `PAY-C${year}${String(0 + 1).padStart(5, "0")}`;

      const finalTotal = calculateEffectiveTotal(bonCommande);

      const paye = calculateTotalPaid(bonCommande);
      const retentionAmount = getSafeNumber(bonCommande.montantRetenue);
      const availableAmount = Math.max(0, finalTotal - paye - retentionAmount);

      const initialMontant = availableAmount.toFixed(3).replace(".", ",");

      paiementValidation.setValues({
        montant: initialMontant,
        modePaiement: "Espece",
        numeroPaiement: defaultNumber,
        date: moment().format("YYYY-MM-DD"),
        numeroCheque: "",
        banque: "",
        numeroTraite: "",
        dateEcheance: "",
        notes: "",
      });

      setPaiementModal(true);
    }
  };

  const handlePaiementSubmit = async (values: any) => {
    if (!selectedBonForPaiement) return;

    if (selectedBonForPaiement.status === "Annule") {
      toast.error("Impossible d'ajouter un paiement pour une commande annulée.");
      return;
    }

    // Convert amount to number
    let paiementAmount: number;
    if (typeof values.montant === "string") {
      paiementAmount = parseFloat(values.montant.replace(",", "."));
    } else {
      paiementAmount = Number(values.montant);
    }

    // Validate amount
    if (isNaN(paiementAmount) || paiementAmount <= 0) {
      toast.error("Le montant doit être un nombre valide supérieur à 0");
      return;
    }

    // Calculate retention for "Retention" payment method
    let retentionMontant = 0;

    if (values.modePaiement === "Retention") {
      // Calculate base total (with or without remise) - THIS IS THE KEY FIX
      const hasRemise =
        selectedBonForPaiement.remise &&
        Number(selectedBonForPaiement.remise) > 0;
      const baseTotal = hasRemise
        ? getSafeNumber(selectedBonForPaiement.totalTTCAfterRemise)
        : getSafeNumber(selectedBonForPaiement.totalTTC);

      // Calculate retention from the TOTAL, not from reste à payer
      retentionMontant = (baseTotal * retentionRate) / 100;

      // Validate that the payment amount equals the retention amount
      if (Math.abs(paiementAmount - retentionMontant) > 0.001) {
        toast.error(
          `Le montant retenu doit être égal à ${retentionMontant.toFixed(3)} DT`
        );
        return;
      }
    }

    try {
      const paiementData = {
        bonCommandeClient_id: selectedBonForPaiement.id,
        client_id: selectedBonForPaiement.client_id,
        montant: paiementAmount, // Always save what user entered
        modePaiement: values.modePaiement,
        numeroPaiement: values.numeroPaiement,
        date: values.date,
        notes: values.notes,
        ...(values.modePaiement === "Cheque" && {
          numeroCheque: values.numeroCheque,
          banque: values.banque,
        }),
        ...(values.modePaiement === "Traite" && {
          numeroTraite: values.numeroTraite,
          dateEcheance: values.dateEcheance,
        }),
        ...(values.modePaiement === "Retention" && {
          tauxRetention: retentionRate,
          montantRetenue: retentionMontant,
        }),
      };

      await createPaiementClient(paiementData);
      setPaiementModal(false);
      fetchData();

      if (values.modePaiement === "Retention") {
        toast.success(
          `Retenue à la source enregistrée: ${paiementAmount.toFixed(3)} DT (${retentionRate}%)`
        );
      } else {
        toast.success("Paiement enregistré avec succès");
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Échec de l'enregistrement du paiement"
      );
    }
  };

  const paiementValidation = useFormik({
    enableReinitialize: true,
    initialValues: {
      montant: "",
      modePaiement: "Espece",
      numeroPaiement: nextPaiementNumber,
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
          "Le montant ne peut pas dépasser le reste à payer après retenue",
          function (value) {
            if (!value || !selectedBonForPaiement) return false;
            const numericValue = parseFloat(value.replace(",", "."));

            // Check if there's remise and use totalTTCAfterRemise, else use totalTTC
            const baseTotal = calculateEffectiveTotal(selectedBonForPaiement);

            const retentionAmount = getSafeNumber(
              selectedBonForPaiement.montantRetenue
            );
            const montantPaye = getSafeNumber(
              selectedBonForPaiement.montantPaye
            );
            const amountAfterRetention = baseTotal - retentionAmount;
            const availableAmount = Math.max(
              0,
              amountAfterRetention - montantPaye
            );

            const roundedValue = Math.round(numericValue * 1000) / 1000;
            const roundedAvailable = Math.round(availableAmount * 1000) / 1000;
            return roundedValue <= roundedAvailable;
          }
        )
        .required("Le montant est requis"),
      modePaiement: Yup.string().required("Le mode de paiement est requis"),
      numeroPaiement: Yup.string().required("Le numéro de paiement est requis"),
      date: Yup.date().required("La date est requise"),
    }),
    onSubmit: (values) => {
      let numericMontant: number;

      if (typeof values.montant === "string") {
        numericMontant = parseFloat(values.montant.replace(",", "."));
      } else {
        numericMontant = Number(values.montant);
      }

      handlePaiementSubmit({
        ...values,
        montant: numericMontant,
      });
    },
  });


  // Add this effect to set the montant when the payment modal opens
  useEffect(() => {
    if (paiementModal && selectedBonForPaiement) {
      const totalNet = getSafeNumber(selectedBonForPaiement.totalTTC);
      const retentionAmount = getSafeNumber(
        selectedBonForPaiement.montantRetenue
      );
      const montantPaye = getSafeNumber(selectedBonForPaiement.montantPaye);

      const amountAfterRetention = totalNet - retentionAmount;
      const initialMontant = Math.max(0, amountAfterRetention - montantPaye)
        .toFixed(3)
        .replace(".", ",");

      // Only update if the current value is still the default "0,000"
      if (paiementValidation.values.montant === "0,000") {
        paiementValidation.setFieldValue("montant", initialMontant);
      }
    }
  }, [paiementModal, selectedBonForPaiement]);

  // Update the effect to calculate retention based on resteAPayer
  // Update the effect to set montant to retention amount when mode is Retention
  // Update the effect to set montant to retention amount when mode is Retention

  // Update the effect to set montant to retention amount when mode is Retention
  useEffect(() => {
    if (
      paiementModal &&
      selectedBonForPaiement &&
      paiementValidation.values.modePaiement === "Retention"
    ) {
      // Calculate base total (with or without remise) - FROM TOTAL, not from reste à payer
      const hasRemise =
        selectedBonForPaiement.remise &&
        Number(selectedBonForPaiement.remise) > 0;
      const baseTotal = hasRemise
        ? getSafeNumber(selectedBonForPaiement.totalTTCAfterRemise)
        : getSafeNumber(selectedBonForPaiement.totalTTC);

      // Calculate retention amount based on selected rate from TOTAL
      const calculatedRetention = (baseTotal * retentionRate) / 100;

      setRetentionAmount(calculatedRetention);

      // Auto-fill the montant field with the retention amount
      paiementValidation.setFieldValue(
        "montant",
        calculatedRetention.toFixed(3).replace(".", ",")
      );
    }
  }, [
    paiementValidation.values.modePaiement,
    retentionRate,
    paiementModal,
    selectedBonForPaiement,
  ]);

  const fetchNextLivraison = useCallback(async () => {
    try {
      const numero = await fetchNextLivraisonNumberAPI();
      setNextNumeroLivraison(numero);
    } catch (err) {
      toast.error("Échec de la récupération du numéro de commande");
    }
  }, []);

  const fetchNextNumber = useCallback(async () => {
    try {
      const numero = await fetchNextCommandeNumber();
      setNextNumeroCommande(numero);
    } catch (err) {
      toast.error("Échec de la récupération du numéro de commande");
    }
  }, []);

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


  const statusForTab: Record<string, string> = {
    "1": "", // All
    "2": "Brouillon",
    "3": "Confirme",
    "4": "Partiellement Livre",
    "5": "Livre",
    "6": "Annule",
  };

  const fetchData = useCallback(
    async (page = currentPage, limit = pageSize, skipSecondary = false) => {
      try {
        setLoading(true);

        const statusParam = statusForTab[activeTab] || "";

        let paginatedResult;

        const paginatedPromise = fetchBonsCommandeClientPaginated({
          page,
          limit: limit,
          search: searchText || undefined,
          status: statusParam || undefined,
          startDate: startDate ? moment(startDate).format("YYYY-MM-DD") : undefined,
          endDate: endDate ? moment(endDate).format("YYYY-MM-DD") : undefined,
        });

        if (!skipSecondary) {
          const [resPaginated, resVendeurs, resDepots] = await Promise.all([
            paginatedPromise,
            fetchVendeurs(),
            fetchDepots(),
          ]);
          paginatedResult = resPaginated;
          setVendeurs(resVendeurs);
          setDepots(resDepots);
        } else {
          paginatedResult = await paginatedPromise;
        }

        // Use the calculated totals from the server where possible
        // The server already joined paiements and articles
        setBonsCommande(paginatedResult.bons);
        setFilteredBonsCommande(paginatedResult.bons);
        setTotalCount(paginatedResult.pagination.totalCount);
        setTotalPages(paginatedResult.pagination.totalPages);
        setCurrentPage(paginatedResult.pagination.page);
        setPageSize(limit);

        if (!skipSecondary) {
          setSecondaryLoading(true);
          try {
            // Load initial articles and clients for modal searches
            const [articlesResult, clientsResult] = await Promise.all([
              searchArticles({ query: "", page: 1, limit: 10 }),
              searchClients({ query: "", page: 1, limit: 10 }),
            ]);
            setArticles(articlesResult.articles || []);
            setClients(clientsResult.clients || []);
            setFilteredClients(clientsResult.clients || []);
          } catch (secondaryErr) {
            console.error("Secondary data loading failed:", secondaryErr);
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
      }
    },
    [searchText, startDate, endDate, activeTab, pageSize]
  );

  const isFirstRender = useRef(true);

  // Re-fetch whenever filters change (debounced)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setCurrentPage(1);
    const timer = setTimeout(() => {
      fetchData(1, pageSize, true);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchText, startDate, endDate, activeTab]);

  // Initial load
  useEffect(() => {
    fetchData(1, pageSize, false);
  }, []); // eslint-disable-line

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
        await Promise.all([loadArticles("", 1, 15), loadClients("", 1, 15)]);
      } catch (err) {
        console.error("Modal data loading failed:", err);
      } finally {
        setModalLoading(false);
      }
    }
  };

  useEffect(() => {
    let result = [...bonsCommande];

    if (activeTab === "2") {
      result = result.filter((bon) => bon.status === "Brouillon");
    } else if (activeTab === "3") {
      result = result.filter((bon) => bon.status === "Confirme");
    } else if (activeTab === "4") {
      result = result.filter((bon) => bon.status === "Livre");
    } else if (activeTab === "5") {
      result = result.filter((bon) => bon.status === "Partiellement Livre");
    } else if (activeTab === "6") {
      result = result.filter((bon) => bon.status === "Annule");
    }

    if (startDate && endDate) {
      const start = moment(startDate).startOf("day");
      const end = moment(endDate).endOf("day");
      result = result.filter((bon) => {
        const bonDate = moment(bon.dateCommande);
        return bonDate.isBetween(start, end, null, "[]");
      });
    }

    // Enhanced search functionality
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      result = result.filter(
        (bon) =>
          bon.numeroCommande.toLowerCase().includes(searchLower) ||
          (bon.client?.raison_sociale &&
            bon.client.raison_sociale.toLowerCase().includes(searchLower)) ||
          (bon.client?.designation &&
            bon.client.designation.toLowerCase().includes(searchLower))
      );
    }

    // Phone search functionality
    if (searchPhone) {
      const cleanPhoneSearch = searchPhone.replace(/\s/g, "").trim();

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
  }, [activeTab, startDate, endDate, searchText, searchPhone, bonsCommande]);

  const openDetailModal = (bonCommande: BonCommandeClient) => {
    setSelectedBonCommande(bonCommande);
    setDetailModal(true);
  };

  // Add the parseNumericInput function
  const parseNumericInput = (value: string): number => {
    if (!value || value === "") return 0;
    const cleanValue = value.replace(",", ".");
    const numericValue = parseFloat(cleanValue);
    return isNaN(numericValue) ? 0 : Math.round(numericValue * 1000) / 1000;
  };

  // Add the formatForDisplay function
  const formatForDisplay = (
    value: number | string | undefined | null
  ): string => {
    if (value === undefined || value === null) return "0,000";
    const numericValue =
      typeof value === "string" ? parseNumericInput(value) : Number(value);
    if (isNaN(numericValue)) return "0,000";
    return numericValue.toFixed(3).replace(".", ",");
  };

  // Add these functions before the return statement
  const handleCreateClient = async () => {
    try {
      // Create the client
      const createdClient = await createClient(newClient);
      toast.success("Client créé avec succès");

      // Refresh clients list using search with empty query (limited results)
      const clientsSearchResult = await searchClients({
        query: "",
        page: 1,
        limit: 10,
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

  // Add effect for auto-calculation in article modal


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
    return calculateDocumentTotals(
      {
        articles: selectedArticles,
        remise: globalRemise,
        remiseType,
        exoneration,
        timbreFiscal,
        methodesReglement,
      },
      {
        newDeliveryQuantities,
        editingHT,
        editingTTC,
        lockedPercentage,
      }
    );
  }, [
    selectedArticles,
    globalRemise,
    remiseType,
    exoneration,
    timbreFiscal,
    editingHT,
    editingTTC,
    lockedPercentage,
    methodesReglement,
    newDeliveryQuantities,
  ]);



  // Use a ref to track grandTotal to only trigger proportionality on actual item changes
  const lastGrandTotalRef = useRef(grandTotal);

  // STEP 4: Auto-update global remise if locked percentage exists
  // This effect ensures that a "Fixed" amount remains proportional to the items
  useEffect(() => {
    // Only run if the total has actually changed (items added/removed/quantities changed)
    if (Math.abs(lastGrandTotalRef.current - grandTotal) > 0.001) {
      if (remiseType === "fixed" && lockedPercentage !== null && grandTotal > 0) {
        const newTargetNet = grandTotal * (1 - lockedPercentage / 100);
        const roundedTargetNet = Math.round(newTargetNet * 1000) / 1000;
        if (Math.abs(globalRemise - roundedTargetNet) > 0.001) {
          setGlobalRemise(roundedTargetNet);
        }
      }
      lastGrandTotalRef.current = grandTotal;
    }
  }, [grandTotal, remiseType, lockedPercentage, globalRemise]);

  const handleDelete = async () => {
    if (!bonCommande) return;

    try {
      await deleteBonCommandeClient(bonCommande.id);
      setDeleteModal(false);
      fetchData();
      toast.success("Bon de commande client supprimé avec succès");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Échec de la suppression"
      );
    }
  };

  // Ajouter méthode de règlement
  const addMethodeReglement = () => {
    setMethodesReglement((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        method: "especes",
        amount: "",
        date: moment().format("YYYY-MM-DD"), // ← default: today
      },
    ]);
  };
  // Supprimer méthode de règlement
  const removeMethodeReglement = (id: string) => {
    setMethodesReglement((prev) => prev.filter((pm) => pm.id !== id));
  };

  // Mettre à jour méthode de règlement
  // REPLACE the current updateMethodeReglement function:
  const updateMethodeReglement = (id: string, field: string, value: any) => {
    setMethodesReglement((prev) =>
      prev.map((pm) => {
        if (pm.id === id) {
          if (field === "amount") {
            // Handle amount validation and formatting
            if (typeof value === "string") {
              // Allow empty string or valid numeric format
              if (value === "" || /^[0-9]*[,.]?[0-9]*$/.test(value)) {
                const formattedValue = value.replace(".", ",");
                const commaCount = (formattedValue.match(/,/g) || []).length;
                if (commaCount <= 1) {
                  return { ...pm, [field]: formattedValue };
                }
              }
              return pm; // Invalid format, don't update
            }
          }
          return { ...pm, [field]: value };
        }
        return pm;
      })
    );
  };

  // Calculer le total des méthodes de règlement
  // REPLACE the current totalReglementAmount calculation:
  // REPLACE the current totalReglementAmount calculation with this safer version:
  const totalReglementAmount = useMemo(() => {
    return methodesReglement.reduce((sum, pm) => {
      if (!pm || !pm.amount) return sum;

      // Handle both string and number types safely
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

  // Add this validation function
  const validatePaymentMethods = useCallback(() => {
    if (methodesReglement.length === 0) return true;

    const totalPaymentAmount = methodesReglement.reduce((sum, pm) => {
      if (!pm.amount) return sum;
      const amountValue =
        typeof pm.amount === "string"
          ? parseFloat(pm.amount.replace(",", ".")) || 0
          : Number(pm.amount) || 0;
      return sum + amountValue;
    }, 0);

    // Check if any individual payment method exceeds net à payer
    const hasIndividualExceed = methodesReglement.some((pm) => {
      if (!pm.amount) return false;
      const amountValue =
        typeof pm.amount === "string"
          ? parseFloat(pm.amount.replace(",", ".")) || 0
          : Number(pm.amount) || 0;
      return amountValue > netAPayer;
    });

    // Check if total exceeds net à payer
    const hasTotalExceed = totalPaymentAmount > netAPayer;

    return !hasIndividualExceed && !hasTotalExceed;
  }, [methodesReglement, netAPayer]);

  // Function to prepare facture creation
  // Update the prepareFactureCreation function
  const prepareFactureCreation = async (bonCommande: BonCommandeClient) => {
    try {
      const nextNumero = await fetchNextFactureNumberFromAPI();
      setNextFactureNumber(nextNumero);
      setFactureSubmitAttempted(false);

      setBonCommande(bonCommande);
      setSelectedClient(bonCommande.client || null);

      // Reset article search and editing states
      setArticleSearch("");
      setFilteredArticles([]);
      setEditingHT({});
      setEditingTTC({});
      setFocusedIndex(-1);

      // Set selected depot if available
      if (bonCommande.depot_id) {
        const depot = depots.find((d) => d.id === bonCommande.depot_id);
        setSelectedDepot(depot || null);
      }



      // Load articles from bon commande
      setSelectedArticles(
        bonCommande.articles.map((item: any) => ({
          article_id: item.article?.id || 0,
          quantite: item.quantite,
          prixUnitaire: parseFloat(item.prixUnitaire),
          prixTTC:
            Number(item.prix_ttc) ||
            parseFloat(item.prixUnitaire) * (1 + (item.tva || 0) / 100),
          tva: item.tva != null ? parseFloat(item.tva) : null,
          remise: item.remise != null ? parseFloat(item.remise) : null,
          quantiteLivree: item.quantiteLivree || "",
          articleDetails: item.article,
          designation: item.designation || item.article?.designation || "", // FIXED: Use article's designation
        }))
      );
      // FIXED: Convert fixed target net to percentage to avoid "big mistake" on partial delivery
      const bcTotals = calculateDocumentTotals({
        articles: bonCommande.articles.map((a: any) => ({
          ...a,
          prixUnitaire: a.prixUnitaire,
          prixTTC: a.prix_ttc || (a.prixUnitaire * (1 + (a.tva || 0) / 100))
        })),
        remise: 0,
        remiseType: "percentage"
      });
      const bcTotalTTC = bcTotals.grandTotal;
      const bcTargetNet = Number(bonCommande.remise) || 0;

      if (bonCommande.remiseType === "fixed" && bcTotalTTC > 0 && bcTargetNet > 0 && bcTargetNet < bcTotalTTC) {
        const perc = ((bcTotalTTC - bcTargetNet) / bcTotalTTC) * 100;
        setGlobalRemise(bcTargetNet);
        setRemiseType("fixed");
        setLockedPercentage(perc);
      } else {
        setGlobalRemise(bonCommande.remise || 0);
        setRemiseType(bonCommande.remiseType || "percentage");
        setLockedPercentage(null);
      }
      setShowRemise((bonCommande.remise || 0) > 0);

      // ✅ Set exoneration from the bon de commande if it exists, otherwise false
      const isBonExonere = (bonCommande as any).exoneration === "OUI" || (bonCommande as any).exoneration === true;
      setExoneration(isBonExonere);

      // Merge both payment methods (JSON) and actual payments (table) for display
      const combinedMethods: any[] = [];

      if (bonCommande.paymentMethods && Array.isArray(bonCommande.paymentMethods)) {
        bonCommande.paymentMethods.forEach((pm: any, index: number) => {
          combinedMethods.push({
            id: pm.id || `bc-pm-${index}`,
            method: pm.method,
            amount: pm.amount ? String(pm.amount).replace(".", ",") : "",
            date: pm.date || moment().format("YYYY-MM-DD"),
            numero: pm.numero || "",
            banque: pm.banque || "",
            dateEcheance: pm.dateEcheance || "",
            tauxRetention: pm.tauxRetention || 1,
          });
        });
      }

      if (bonCommande.paiements && Array.isArray(bonCommande.paiements)) {
        bonCommande.paiements.forEach((p: any, index: number) => {
          // Map backend modePaiement names to frontend method names if necessary
          let method = p.modePaiement || "especes";
          if (method === "Espece") method = "especes";
          else if (method === "Cheque") method = "cheque";
          else if (method === "Virement") method = "virement";
          else if (method === "Traite") method = "traite";
          else if (method === "Carte Bancaire TPE") method = "Carte Bancaire TPE";
          else if (method === "Retention") method = "retenue";

          combinedMethods.push({
            id: p.id || `bc-p-${index}`,
            method: method,
            amount: p.montant ? String(p.montant).replace(".", ",") : "",
            date: p.date || moment().format("YYYY-MM-DD"),
            numero: p.numeroCheque || p.numeroTraite || "",
            banque: p.banque || "",
            dateEcheance: p.dateEcheance || "",
            tauxRetention: p.tauxRetention || 1,
          });
        });
      }

      setMethodesReglement(combinedMethods);

      setIsCreatingFacture(true);
      setFactureModal(true);
    } catch (err) {
      console.error("Error preparing facture:", err);
      toast.error("Erreur lors de la préparation de la facture");
    }
  };

  // Ajoutez ce useEffect après vos autres useEffect
  useEffect(() => {
    if (factureModal) {
      const loadDepotsForFacture = async () => {
        try {
          const depotsData = await fetchDepots();
          setDepots(depotsData);
        } catch (err) {
          console.error("Failed to load depots for facture:", err);
        }
      };
      loadDepotsForFacture();
    }
  }, [factureModal]);

  // Function to submit facture
  const handleFactureSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFactureSubmitAttempted(true);

    try {
      // Validate required fields
      if (!selectedDepot) {
        toast.error("Veuillez sélectionner un dépôt");
        return;
      }

      if (!selectedClient) {
        toast.error("Veuillez sélectionner un client");
        return;
      }

      if (!validation.values.vendeur_id) {
        toast.error("Veuillez sélectionner un vendeur");
        return;
      }

      // Check for bon commande ID - use bonCommande?.id directly
      if (!bonCommande?.id) {
        toast.error("Le bon de commande n'est pas disponible");
        return;
      }

      const articles = selectedArticles.map((item) => ({
        article_id: Number(item.article_id),
        designation: item.designation || item.articleDetails?.designation || "", // ← Inclure la désignation
        quantite: Number(item.quantite === "" ? 0 : item.quantite),
        prix_unitaire: Number(item.prixUnitaire),
        prix_ttc: Number(item.prixTTC),
        tva: item.tva ? Number(item.tva) : undefined,
        remise: item.remise ? Number(item.remise) : undefined,
      }));

      if (!articles.length) {
        toast.error("Les articles sont requis");
        return;
      }

      // Create facture data EXACTLY matching what createFacture expects
      const factureData = {
        // Fields from your createFacture service function
        numeroFacture: nextFactureNumber,
        dateFacture: moment().format("YYYY-MM-DD"),
        dateEcheance: moment().add(30, "days").format("YYYY-MM-DD"),
        status: "Brouillon",
        conditions: "Net à réception",
        client_id: Number(selectedClient.id),
        vendeur_id: validation.values.vendeur_id
          ? Number(validation.values.vendeur_id)
          : undefined,
        bonLivraison_id: undefined, // Add if you have this
        articles: articles,
        modeReglement: "Espece",
        totalHT: Number(sousTotalHT),
        totalTVA: Number(totalTax),
        totalTTC: Number(grandTotal),
        totalTTCAfterRemise: Number(finalTotal),
        notes: validation.values.notes || undefined,
        remise: Number(globalRemise || 0),
        remiseType: remiseType || "percentage",
        montantPaye: 0, // IMPORTANT: Don't insert payments along, backend handles it from BC
        timbreFiscal: timbreFiscal ?? false,
        exoneration: exoneration,
        conditionPaiement: "30 jours",

        // NEW FIELD: This is what you need to send
        boncommandeclientid: Number(bonCommande.id), // <-- THIS IS CRITICAL
        depot_id: selectedDepot?.id, // <-- ADD THIS

        // Send payment methods
        paymentMethods: [], // Don't insert them along
        montantRetenue: 0,
        hasRetenue: false,
        espaceNotes: "",
        totalPaymentAmount: 0,
      };

      console.log("Sending to createFacture:", {
        boncommandeclientid: factureData.boncommandeclientid,
        type: typeof factureData.boncommandeclientid,
        bonCommandeId: bonCommande.id,
        bonCommandeExists: !!bonCommande,
      });

      // USE THE SERVICE FUNCTION
      await createFacture(factureData);

      toast.success("Facture créée avec succès");

      // Close and reset
      setFactureModal(false);
      setIsCreatingFacture(false);
      fetchData();
    } catch (err) {
      console.error("Error creating facture:", err);
      toast.error(
        err instanceof Error ? err.message : "Échec de création de la facture"
      );
    }
  };

  const handleSubmit = async (values: any) => {
    if (discountPercentage > 10 && !isDiscountConfirmed) {
      setShowDiscountAlert(true);
      return;
    }
    try {
      // ✅ ADD THIS VALIDATION: Block submission if payment amounts exceed net à payer (EXCLUDE RETENTION)
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

      const prepareArticlesForSubmission = (
        articles: typeof selectedArticles
      ) => {
        return articles.map((item) => {
          let finalQuantiteLivree =
            item.quantiteLivree === "" ? 0 : Number(item.quantiteLivree);

          // For BL creation: add new delivery to existing delivered quantity
          if (isCreatingLivraison) {
            const newDelivery = newDeliveryQuantities[item.article_id] || 0;
            finalQuantiteLivree = finalQuantiteLivree + Number(newDelivery);
          }

          return {
            article_id: item.article_id,
            designation: item.designation, // ← Utiliser la désignation modifiée
            quantite: item.quantite === "" ? 0 : Number(item.quantite),
            quantiteLivree: finalQuantiteLivree,
            prix_unitaire: Number(item.prixUnitaire),
            tva: item.tva,
            remise: item.remise,
            prix_ttc: Number(item.prixTTC),
          };
        });
      };

      const articlesForSubmission =
        prepareArticlesForSubmission(selectedArticles);

      // Check if any article has quantity 0 or empty
      const hasEmptyQuantities = articlesForSubmission.some(
        (item) => item.quantite <= 0
      );
      if (hasEmptyQuantities) {
        toast.error(
          "Tous les articles doivent avoir une quantité supérieure à 0"
        );
        return;
      }

      // ✅ ONLY FOR BL CREATION: Validate new deliveries
      if (isCreatingLivraison) {
        // Check if user entered any delivery quantities
        const hasAnyNewDelivery = Object.values(newDeliveryQuantities).some(
          (value) => value !== "" && Number(value) > 0
        );

        if (!hasAnyNewDelivery) {
          toast.error("Veuillez spécifier les quantités à livrer");
          return;
        }

        // Validate no over-delivery
        const hasOverDelivery = articlesForSubmission.some(
          (item) => item.quantiteLivree > item.quantite
        );
        if (hasOverDelivery) {
          toast.error(
            "La quantité totale livrée ne peut pas dépasser la quantité commandée"
          );
          return;
        }
      }

      // ✅ Calculate if we should auto-generate BL (your existing logic)
      const hasDeliveredQuantities = articlesForSubmission.some(
        (item) => item.quantiteLivree > 0
      );

      let shouldGenerateBL = hasDeliveredQuantities;

      if (isEdit && bonCommande) {
        const existingArticles = bonCommande.articles || [];
        let hasNewDeliveries = false;

        articlesForSubmission.forEach((newItem) => {
          const existingItem = existingArticles.find(
            (item: any) => item.article.id === newItem.article_id
          );
          if (existingItem) {
            const existingQtyLivree = existingItem.quantiteLivree || 0;
            const newQtyLivree = newItem.quantiteLivree || 0;

            if (newQtyLivree > existingQtyLivree) {
              hasNewDeliveries = true;
            }
          }
        });

        shouldGenerateBL = hasNewDeliveries;
      }

      // ✅ Using high-precision engine results from component scope
      // (netHT, totalTax, grandTotal, finalTotal, netAPayer, retentionMontant are already updated via useMemo)

      // ✅ SIMPLIFIED: Send all payment methods including "retenue"
      // The backend will handle the retention logic
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

          if (pm.method === "retenue") {
            return {
              method: pm.method,
              amount: 0,
              date: pm.date || moment().format("YYYY-MM-DD"),
              numero: pm.numero || "",
              banque: pm.banque || "",
              dateEcheance: pm.dateEcheance || "",
              tauxRetention: pm.tauxRetention || 1,
            };
          }

          return {
            method: pm.method,
            amount: amountValue,
            date: pm.date || moment().format("YYYY-MM-DD"),
            numero: pm.numero || "",
            banque: pm.banque || "",
            dateEcheance: pm.dateEcheance || "",
          };
        });

      if (isCreatingLivraison) {
        // ✅ For the Bon Livraison itself, "quantite" should be ONLY what is being delivered NOW
        const blArticles = articlesForSubmission.map(art => ({
          ...art,
          quantite: newDeliveryQuantities[art.article_id] === "" ? 0 : Number(newDeliveryQuantities[art.article_id]) || 0
        })).filter(art => art.quantite > 0);

        const livraisonData = {
          numeroLivraison: values.numeroLivraison,
          dateLivraison: values.dateLivraison,
          client_id: selectedClient?.id ?? null,
          vendeur_id: values.vendeur_id,
          status: values.status,
          notes: values.notes,
          taxMode,
          remise: globalRemise,
          remiseType: remiseType,
          lockedPercentage: lockedPercentage,
          bonCommandeClient_id: bonCommande?.id,
          articles: blArticles,
          totalHT: netHT,
          totalTVA: totalTax,
          totalTTC: grandTotal,
          totalTTCAfterRemise: finalTotal,
          montantPaye: 0,
          resteAPayer: finalTotal,
          hasPayments: false,
          totalPaymentAmount: 0,
          hasRetenue: false,
          montantRetenue: 0,
          cin: "",
          voiture: "",
          chauffeur: "",
          serie: "",
          depot_id: values.depot_id,
        };

        await createBonLivraison(livraisonData);
        toast.success("Bon de livraison créé avec succès");
        setModal(false);
        setDetailModal(false);
      } else {
        const bonCommandeData = {
          ...values,
          taxMode,
          articles: articlesForSubmission,
          remise: globalRemise,
          remiseType: remiseType,
          lockedPercentage: lockedPercentage,
          autoGenerateLivraison: shouldGenerateBL,
          totalHT: netHT,
          totalTVA: totalTax,
          totalTTC: grandTotal,
          totalTTCAfterRemise: finalTotal,
          paymentMethods: processedMethodesReglement, // Send all methods including retenue
          totalPaymentAmount: totalReglementAmount,
          espaceNotes: espaceNotes,
          dateLivBonCommande: values.dateLivBonCommande || null, // Add this line
        };

        if (isEdit && bonCommande) {
          await updateBonCommandeClient(bonCommande.id, bonCommandeData);
          toast.success("Bon de commande client mis à jour avec succès");
        } else {
          await createBonCommandeClient(bonCommandeData);
          toast.success("Bon de commande client créé avec succès");
        }
      }

      setModal(false);
      setNewDeliveryQuantities({});

      // ✅ RÉINITIALISER LES METHODES DE REGLEMENT APRÈS SOUMISSION
      setMethodesReglement([]); // Reset to empty array
      setEspaceNotes("");

      fetchData();
    } catch (err) {
      console.error("Error in handleSubmit:", err);
      toast.error(err instanceof Error ? err.message : "Échec de l'opération");
    }
  };

  useEffect(() => {
    if (modal) {
      if (!isEdit && !isCreatingLivraison) {
        fetchNextNumber(); // Fetch bon commande number
      } else if (isCreatingLivraison) {
        fetchNextLivraison(); // Fetch livraison number
      }
    }
  }, [modal, isEdit, isCreatingLivraison, fetchNextNumber, fetchNextLivraison]);

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      numeroCommande: isEdit
        ? bonCommande?.numeroCommande || ""
        : isCreatingLivraison
          ? ""
          : nextNumeroCommande,
      numeroLivraison: isCreatingLivraison ? nextNumeroLivraison : "",
      dateLivraison: isCreatingLivraison
        ? moment().format("YYYY-MM-DD")
        : bonCommande?.dateCommande
          ? moment(bonCommande.dateCommande).format("YYYY-MM-DD")
          : moment().format("YYYY-MM-DD"),
      dateLivBonCommande: isEdit
        ? bonCommande?.dateLivBonCommande
          ? moment(bonCommande.dateLivBonCommande).format("YYYY-MM-DD")
          : "" // For edit mode, use saved value or empty
        : "",
      client_id: bonCommande?.client?.id ?? "",
      vendeur_id: bonCommande?.vendeur?.id ?? "",
      depot_id: isEdit
        ? bonCommande?.depot_id || selectedDepot?.id || "" // Preserve edit mode depot
        : selectedDepot?.id ?? "", // For new mode, use selected depot

      dateCommande: bonCommande?.dateCommande
        ? moment(bonCommande.dateCommande).format("YYYY-MM-DD")
        : moment().format("YYYY-MM-DD"),
      status: bonCommande?.status ?? "Confirme",
      notes: bonCommande?.notes ?? "",
      isCreatingLivraison: isCreatingLivraison,
    },
    validationSchema: Yup.object().shape({
      dateCommande: Yup.date().when("isCreatingLivraison", {
        is: false,
        then: (schema) => schema.required("La date de commande est requise"),
      }),
      dateLivraison: Yup.date().when("isCreatingLivraison", {
        is: true,
        then: (schema) => schema.required("La date de livraison est requise"),
      }),
      numeroCommande: Yup.string().when("isCreatingLivraison", {
        is: false,
        then: (schema) => schema.required("Le numéro de commande est requis"),
      }),
      numeroLivraison: Yup.string().when("isCreatingLivraison", {
        is: true,
        then: (schema) => schema.required("Le numéro de livraison est requis"),
      }),
      client_id: Yup.number().required("Le client est requis"),
      vendeur_id: Yup.number().required("Le vendeur est requis"),
      depot_id: Yup.number().required("Le dépôt est requis"),
      isCreatingLivraison: Yup.boolean(),
    }),
    onSubmit: handleSubmit,
  });

  // Add this useEffect after your other effects
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

  // Add this effect to handle click outside
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

  // Add this effect to handle click outside
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

  // In the toggleModal function, REPLACE the payment methods reset:
  const toggleModal = useCallback(() => {
    if (modal) {
      // Clear all search results when closing modal
      setFilteredArticles([]);
      setFilteredClients([]);
      setArticleSearch("");
      setClientSearch("");
      setFocusedIndex(-1);
      setEditingDesignation({}); // ← Ajouter cette ligne
      setModal(false);
      setBonCommande(null);
      setSelectedArticles([]);
      setSelectedClient(null);
      setSelectedDepot(null);
      setGlobalRemise(0);
      setRemiseType("fixed");
      setShowRemise(false);
      setIsCreatingLivraison(false);
      setIsCreatingFacture(false);
      setNewDeliveryQuantities({});
      setMethodesReglement([]);
      setEspaceNotes("");
      setEditingHT({});
      setEditingTTC({});
      setModalLoading(false);

      validation.resetForm();
    } else {
      setModal(true);
      // Don't load modal data here - useEffect will handle it
    }
  }, [modal]);

  // Load modal data when modal opens
  useEffect(() => {
    if (modal) {
      loadModalData();
    }
  }, [modal]);

  const handleAddArticle = (articleId: string) => {
    // First, try to find the article in filteredArticles (from search results)
    let article = filteredArticles.find((a) => a.id === parseInt(articleId));

    // If not found in filteredArticles, try the main articles array
    if (!article) {
      article = articles.find((a) => a.id === parseInt(articleId));
    }

    if (article) {
      // REMOVE THE DUPLICATE CHECK - Allow adding the same article multiple times
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
          quantiteLivree: "", // Add this for Bon Commande
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

      // Optional: Show success toast
      toast.success(`Article "${article.designation}" ajouté`);
    }
  };

  const handleRemoveArticle = (articleId: number) => {
    setSelectedArticles(
      selectedArticles.filter((item) => item.article_id !== articleId)
    );
  };

  // Add this helper function near your other functions
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
            updatedItem.designation = value;
          }
          // If quantite changes, update quantiteLivree if it exceeds new quantite
          if (field === "quantite") {
            const newQuantite = value === "" ? 0 : Number(value);
            const currentQuantiteLivree = Number(item.quantiteLivree) || 0;

            if (currentQuantiteLivree > newQuantite) {
              updatedItem.quantiteLivree = newQuantite;
            }
          }

          // If quantiteLivree changes, ensure it doesn't exceed quantite
          if (field === "quantiteLivree") {
            const quantiteCommandee = Number(item.quantite) || 0;
            const newQuantiteLivree =
              value === ""
                ? 0
                : Math.max(0, Math.min(Number(value), quantiteCommandee));
            updatedItem.quantiteLivree = newQuantiteLivree;
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

            // Clear TTC editing state
            setEditingTTC((prev) => {
              const newState = { ...prev };
              delete newState[articleId];
              return newState;
            });
          }

          // Recalculate HT when TTC changes
          if (field === "prixTTC") {
            const currentTTC = Number(value) || 0;
            const currentTVA = item.tva || 0;

            let newPriceHT = currentTTC;
            if (currentTVA > 0) {
              newPriceHT = currentTTC / (1 + currentTVA / 100);
            }

            updatedItem.prixUnitaire = Math.round(newPriceHT * 1000) / 1000;

            // Clear HT editing state
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

          return updatedItem;
        }
        return item;
      })
    );
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
              quantiteLivree: 0,
              articleDetails: scannedArticle,
              designation: scannedArticle.designation || "", // Add this
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

      <Container fluid style={{ maxWidth: "100%" }}>
        <BreadCrumb title="Bons de Commande Client" pageTitle="Commandes" />

        <Row>
          <Col lg={12}>
            <Card id="bonCommandeList">
              <CardHeader className="card-header border-0">
                <Row className="align-items-center gy-3">
                  <div className="col-sm">
                    <h5 className="card-title mb-0">
                      Gestion des Bons de Commande Client
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
                          toggleModal();
                        }}
                      >
                        <i className="ri-add-line align-bottom me-1"></i>{" "}
                        Ajouter Bon
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
                    className={classnames({ active: activeTab === "3" })}
                    onClick={() => setActiveTab("3")}
                  >
                    <i className="ri-checkbox-circle-line me-1 align-bottom"></i>{" "}
                    Confirmé
                  </NavLink>
                </NavItem>
                <NavItem>
                  <NavLink
                    className={classnames({ active: activeTab === "4" })}
                    onClick={() => setActiveTab("4")}
                  >
                    <i className="ri-truck-line me-1 align-bottom"></i> Livré
                  </NavLink>
                </NavItem>
                <NavItem>
                  <NavLink
                    className={classnames({ active: activeTab === "5" })}
                    onClick={() => setActiveTab("5")}
                  >
                    <i className="ri-truck-line me-1 align-bottom"></i>{" "}
                    Partiellement Livré
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
                {/* In your CardBody, add this row above or with the existing filters */}
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
                    columns={[
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
                        cell: (cell: any) =>
                          moment(cell.getValue()).format("DD MMM YYYY"),
                      },
                      // In your columns array, update just the Client column:
                      {
                        header: "Client",
                        accessorKey: "client",
                        enableColumnFilter: false,
                        cell: (cell: any) => {
                          const bonCommande = cell.row.original;

                          // Regular client
                          if (bonCommande.client) {
                            return `${bonCommande.client.raison_sociale}`;
                          }

                          // Website client
                          if (bonCommande.clientWebsite) {
                            return (
                              <div>
                                {bonCommande.clientWebsite.nomPrenom}
                                <span className="badge bg-info ms-1">Web</span>
                              </div>
                            );
                          }

                          return "-";
                        },
                      },
                      {
                        header: "Vendeur",
                        accessorKey: "vendeur",
                        enableColumnFilter: false,
                        cell: (cell: any) =>
                          `${cell.getValue()?.nom || ""} ${cell.getValue()?.prenom || ""
                          }`,
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
                        accessorKey: "totalTTC",
                        enableColumnFilter: false,
                        cell: (cell: any) => {
                          const bon = cell.row.original;
                          const total = Number(cell.getValue()) || 0;
                          const retenue = getSafeNumber(bon.montantRetenue);
                          return `${Math.max(0, total - retenue).toFixed(3)} DT`;
                        },
                      },
                      {
                        header: "Total Après Remise",
                        accessorKey: "totalTTCAfterRemise",
                        enableColumnFilter: false,
                        cell: (cell: any) => {
                          const bon = cell.row.original;
                          const total = Number(cell.getValue()) || 0;
                          const retenue = getSafeNumber(bon.montantRetenue);
                          return `${Math.max(0, total - retenue).toFixed(3)} DT`;
                        },
                      },
                      {
                        header: "Payé",
                        accessorKey: "montantPaye",
                        enableColumnFilter: false,
                        cell: (cell: any) =>
                          `${calculateTotalPaid(cell.row.original).toFixed(3)} DT`,
                      },
                      {
                        header: "Reste à payer",
                        accessorKey: "resteAPayer",
                        enableColumnFilter: false,
                        cell: (cell: any) => {
                          const bon = cell.row.original;
                          const total = calculateEffectiveTotal(bon);
                          const paye = calculateTotalPaid(bon);
                          const retenue = getSafeNumber(bon.montantRetenue);
                          const reste = Math.max(0, total - paye - retenue);
                          return (
                            <span
                              className={
                                reste > 0
                                  ? "text-danger fw-medium"
                                  : "text-success fw-medium"
                              }
                            >
                              {reste.toFixed(3)} DT
                            </span>
                          );
                        },
                      },
                      {
                        header: "Statut",
                        accessorKey: "status",
                        enableColumnFilter: false,
                        cell: (cell: any) => (
                          <StatusBadge status={cell.getValue()} />
                        ),
                      },
                      {
                        header: "Action",
                        cell: (cellProps: any) => {
                          const bon = cellProps.row.original;
                          return (
                            <ul className="list-inline hstack gap-2 mb-0">
                              <li className="list-inline-item">
                                <Link
                                  to="#"
                                  className="text-info d-inline-block"
                                  onClick={() =>
                                    openPdfModal(cellProps.row.original)
                                  }
                                >
                                  <i className="ri-file-pdf-line fs-16"></i>
                                </Link>
                              </li>
                              <li className="list-inline-item">
                                <Link
                                  to="#"
                                  className="text-success d-inline-block"
                                  onClick={() => openPaiementModal(bon)}
                                >
                                  <i className="ri-money-dollar-circle-line fs-16"></i>
                                </Link>
                              </li>
                              <li className="list-inline-item edit">
                                <Link
                                  to="#"
                                  className="text-primary d-inline-block edit-item-btn"
                                  // In the columns action cell, update the edit click handler:
                                  // In the columns action cell, update the edit click handler:
                                  onClick={() => {
                                    setBonCommande(cellProps.row.original);
                                    // Set the depot first
                                    if (cellProps.row.original.depot_id) {
                                      const depot = depots.find(
                                        (d) =>
                                          d.id ===
                                          cellProps.row.original.depot_id
                                      );
                                      setSelectedDepot(depot || null);
                                    }
                                    setSelectedArticles(
                                      cellProps.row.original.articles.map(
                                        (item: any) => ({
                                          article_id: item.article.id,
                                          quantite: item.quantite,
                                          quantiteLivree:
                                            item.quantiteLivree || "", // ✅ Load existing delivered quantity
                                          prixUnitaire: parseFloat(
                                            item.prixUnitaire
                                          ),
                                          prixTTC:
                                            parseFloat(item.prix_ttc) ||
                                            parseFloat(item.prixUnitaire) *
                                            (1 + (item.tva || 0) / 100),

                                          tva:
                                            item.tva != null
                                              ? parseFloat(item.tva)
                                              : null,
                                          remise:
                                            item.remise != null
                                              ? parseFloat(item.remise)
                                              : null,
                                          articleDetails: item.article,
                                          designation:
                                            item.designation ||
                                            item.article?.designation ||
                                            "", // ← Priorité à la désignation modifiée
                                        })
                                      )
                                    );
                                    setSelectedClient(
                                      cellProps.row.original.client || null
                                    );
                                    setGlobalRemise(
                                      cellProps.row.original.remise || 0
                                    );
                                    // Dans le bouton d'édition, ajouter :
                                    // In the edit button onClick handler:
                                    setMethodesReglement(
                                      cellProps.row.original.paymentMethods &&
                                        cellProps.row.original.paymentMethods
                                          .length > 0
                                        ? cellProps.row.original.paymentMethods.map(
                                          (pm: any, index: number) => ({
                                            id: pm.id || `edit-${index}`,
                                            method: pm.method,
                                            amount: pm.amount
                                              ? typeof pm.amount === "number"
                                                ? pm.amount
                                                  .toFixed(3)
                                                  .replace(".", ",") // Convert number to string format
                                                : String(pm.amount)
                                              : "",
                                            numero: pm.numero || "",
                                            banque: pm.banque || "",
                                            dateEcheance:
                                              pm.dateEcheance || "",
                                          })
                                        )
                                        : [] // Empty array if no saved payments - will show only the button
                                    );
                                    setRemiseType(
                                      cellProps.row.original.remiseType ||
                                      "percentage"
                                    );
                                    setShowRemise(
                                      (cellProps.row.original.remise || 0) > 0
                                    );
                                    setIsEdit(true);
                                    setLockedPercentage(
                                      cellProps.row.original.lockedPercentage ||
                                      cellProps.row.original.locked_percentage ||
                                      null
                                    );
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
                                  onClick={() =>
                                    openDetailModal(cellProps.row.original)
                                  }
                                >
                                  <i className="ri-eye-line fs-16"></i>
                                </Link>
                              </li>
                            </ul>
                          );
                        },
                      },
                    ]}
                    data={filteredBonsCommande}
                    isGlobalFilter={false}
                    isPagination={true}
                    totalDataCount={totalCount}
                    currentPage={currentPage - 1}
                    onPageChange={(page) => fetchData(page + 1, pageSize, true)}
                    onPageSizeChange={(size) => fetchData(1, size, true)}
                    customPageSize={pageSize}
                    divClass="table-responsive table-card mb-1 mt-0"
                    tableClass="align-middle table-nowrap"
                    theadClass="table-light text-muted text-uppercase"
                  />
                )}

                <Modal
                  isOpen={factureModal}
                  toggle={() => setFactureModal(false)}
                  centered
                  size="xl"
                  className="invoice-modal"
                  style={{ maxWidth: "1200px" }}
                >
                  <ModalHeader
                    toggle={() => setFactureModal(false)}
                    className="border-0 pb-3"
                  >
                    <div className="d-flex align-items-center">
                      <div className="modal-icon-wrapper bg-primary bg-opacity-10 rounded-circle p-2 me-3">
                        <i className="ri-file-text-line text-primary fs-4"></i>
                      </div>
                      <div>
                        <h4 className="mb-0 fw-bold text-dark">
                          Créer Facture Client
                        </h4>
                        <small className="text-muted">
                          Créer une facture à partir du bon de commande #
                          {bonCommande?.numeroCommande || "N/A"}
                        </small>
                      </div>
                    </div>
                  </ModalHeader>

                  <Form onSubmit={handleFactureSubmit} className="invoice-form">
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
                                  Numéro de Facture*
                                </Label>
                                <Input
                                  value={nextFactureNumber}
                                  className="form-control-lg bg-light"
                                  placeholder="FAC-2024-001"
                                />
                              </div>
                            </Col>

                            {/* Date de Facture */}
                            <Col md={4}>
                              <div className="mb-3">
                                <Label className="form-label-lg fw-semibold">
                                  Date de Facture*
                                </Label>
                                <Input
                                  type="date"
                                  value={moment().format("YYYY-MM-DD")}
                                  className="form-control-lg bg-light"
                                />
                              </div>
                            </Col>

                            {/* Timbre Fiscal */}
                            <Col md={4}>
                              <div className="mb-3">
                                <Label className="form-label-lg fw-semibold d-block text-center mb-5"></Label>
                                <div className="d-flex justify-content-center align-items-center">
                                  <div className="form-check form-switch form-switch-lg">
                                    <Input
                                      type="checkbox"
                                      id="timbreFiscalFacture"
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
                                      for="timbreFiscalFacture"
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
                          </Row>
                        </CardBody>
                      </Card>

                      {/* Client and Vendeur Section */}
                      <Row className="g-3 mb-4">
                        <Col md={6}>
                          <Card className="border-0 shadow-sm h-100">
                            <CardBody className="p-4">
                              <h6 className="fw-semibold mb-3 text-primary">
                                <i className="ri-store-2-line me-2"></i>
                                Informations Dépôt
                              </h6>

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
                                {factureSubmitAttempted && !selectedDepot && (
                                  <small className="text-danger">
                                    Le dépôt est requis
                                  </small>
                                )}
                              </div>
                            </CardBody>
                          </Card>
                        </Col>

                        {/* Client Card */}
                        <Col md={6}>
                          <Card className="border-0 shadow-sm h-100">
                            <CardBody className="p-4">
                              <h6 className="fw-semibold mb-3 text-primary">
                                <i className="ri-user-line me-2"></i>
                                Informations Client
                              </h6>

                              <div className="mb-3 position-relative">
                                <Label className="form-label-lg fw-semibold">
                                  Client*
                                  {factureSubmitAttempted && !selectedClient && (
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
                                        setClientSearch("");
                                      } else {
                                        // Auto-format if it looks like a phone number (mostly digits)
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
                                        setClientSearch("");
                                      }}
                                      title="Changer de client"
                                    >
                                      <i className="ri-close-line fs-5"></i>
                                    </button>
                                  )}
                                  {/* Add button when no client is selected */}
                                  {factureSubmitAttempted && !selectedClient && (
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
                                {!selectedClient && clientSearch.length >= 3 && (
                                  <div
                                    className="search-results client-results mt-1"
                                    style={{
                                      position: "absolute",
                                      top: "100%",
                                      left: 0,
                                      right: 0,
                                      zIndex: 1050,
                                      backgroundColor: "#fafafa",
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
                                              {/* Raison Sociale Row with Edit Button */}
                                              <div className="d-flex justify-content-between align-items-start mb-1 w-100">
                                                {/* Client Name - Takes available space */}
                                                <div className="flex-grow-1 me-2">
                                                  <span className="fw-semibold client-info-name">
                                                    {c.raison_sociale}
                                                  </span>
                                                </div>

                                                {/* Edit button - Fixed to end right */}
                                                <div className="flex-shrink-0">
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
                                                {c.designation && (
                                                  <small className="client-info-designation">
                                                    {c.designation}
                                                  </small>
                                                )}

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
                                {factureSubmitAttempted && !selectedClient && (
                                  <div className="text-danger mt-1 fs-6">
                                    <i className="ri-error-warning-line me-1"></i>
                                    Le client est requis
                                  </div>
                                )}
                              </div>
                            </CardBody>
                          </Card>
                        </Col>

                        {/* Vendeur Card - Separated from Depot */}
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
                                  value={validation.values.vendeur_id}
                                  onChange={(e) => {
                                    const vendeurId = e.target.value;
                                    validation.setFieldValue(
                                      "vendeur_id",
                                      vendeurId
                                    );
                                  }}
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
                                {factureSubmitAttempted && !validation.values.vendeur_id && (
                                  <small className="text-danger">
                                    Le vendeur est requis
                                  </small>
                                )}
                              </div>
                            </CardBody>
                          </Card>
                        </Col>

                        {/* Depot Card - Separate */}
                      </Row>

                      {/* Articles Section - FULLY FUNCTIONAL */}
                      <Card className="border-0 shadow-sm mb-4">
                        <CardBody className="p-4">
                          {/* Enhanced Header with Exoneration Indicator */}
                          <div className="d-flex justify-content-between align-items-center mb-4">
                            <div className="d-flex align-items-center">
                              <h5 className="fw-semibold text-primary mb-0 me-3">
                                <i className="ri-shopping-cart-line me-2"></i>
                                Articles
                              </h5>
                            </div>

                            {/* Exoneration toggle */}
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
                                    width: "60px",
                                    height: "30px",
                                    cursor: "pointer",
                                  }}
                                />
                              </div>
                            </div>
                          </div>

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
                                    } else if (e.key === "Escape") {
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

                            {/* Article Dropdown Results */}
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
                                                <i className="ri-check-line me-1"></i>{" "}
                                                Ajouté
                                              </Badge>
                                            ) : (
                                              <Badge
                                                color="success"
                                                className="fs-6"
                                              >
                                                <i className="ri-add-line me-1"></i>{" "}
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
                                          className="align-middle"
                                        >
                                          {/* In your facture modal's articles table */}
                                          <td style={{ width: "25%" }}>
                                            <div className="d-flex align-items-center">
                                              <div className="flex-grow-1">
                                                <Input
                                                  type="textarea"
                                                  rows="2"
                                                  value={
                                                    editingDesignation[item.article_id] !== undefined
                                                      ? editingDesignation[item.article_id]
                                                      : item.designation || ""
                                                  }
                                                  onChange={(e) => {
                                                    setEditingDesignation((prev) => ({
                                                      ...prev,
                                                      [item.article_id]: e.target.value,
                                                    }));
                                                  }}
                                                  onBlur={() => {
                                                    if (editingDesignation[item.article_id] !== undefined) {
                                                      handleArticleChange(
                                                        item.article_id,
                                                        "designation",
                                                        editingDesignation[item.article_id]
                                                      );
                                                      setEditingDesignation((prev) => {
                                                        const newState = { ...prev };
                                                        delete newState[item.article_id];
                                                        return newState;
                                                      });
                                                    }
                                                  }}
                                                  className="form-control border-1"
                                                  style={{
                                                    resize: "none",
                                                    fontSize: "0.85rem",
                                                    minHeight: "38px",
                                                  }}
                                                />
                                                {/* Show indication if designation was modified */}

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
                                              className="table-input text-center"
                                              style={{
                                                width: "100%",
                                                fontSize: "0.9rem",
                                              }}
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
                                              className="table-input text-end"
                                              style={{
                                                width: "100%",
                                                fontSize: "0.9rem",
                                              }}
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
                                              className="table-input text-end"
                                              style={{
                                                width: "100%",
                                                fontSize: "0.9rem",
                                              }}
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
                                                className="table-input"
                                                style={{
                                                  width: "100%",
                                                  fontSize: "0.9rem",
                                                }}
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
                                          <td
                                            style={{ width: "10%" }}
                                            className="text-end fw-semibold total-cell"  // Add total-cell class for nowrap
                                          >
                                            <span className="total-amount">{montantHTLigne}</span>
                                            <span className="total-currency">DT</span>
                                          </td>
                                          <td
                                            style={{ width: "10%" }}
                                            className="text-end fw-semibold text-primary total-cell"  // Add total-cell class
                                          >
                                            <span className="total-amount">{montantTTCLigne}</span>
                                            <span className="total-currency">DT</span>
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
                          {/* Calculation Summary - EXACT SAME DESIGN */}
                          {selectedArticles.length > 0 && (
                            <div className="calculation-summary mt-4">
                              <h6 className="fw-semibold mb-3 text-primary">
                                <i className="ri-calculator-line me-2"></i>
                                Récapitulatif
                              </h6>

                              <Row>
                                {/* Left Column - Remise Controls */}
                                <Col md={6}>
                                  <div className="remise-global-section h-100">
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                      <Label className="form-label fw-semibold mb-0">
                                        Activer remise
                                      </Label>
                                      <div className="form-check form-switch">
                                        <Input
                                          type="checkbox"
                                          id="showRemiseSummaryFacture"
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
                                            value={globalRemise}
                                            // REPLACE with (remove the lockedPercentage setter entirely from manual input):
                                            // Both modal onChange handlers become simply:
                                            onChange={(e) => {
                                              const value = e.target.value;
                                              const numValue = parseFloat(value);
                                              if (value === "" || isNaN(numValue)) {
                                                setGlobalRemise(0);
                                                setLockedPercentage(null);
                                              } else {
                                                setGlobalRemise(numValue);
                                                // Only set lockedPercentage for fixed type when items change (handled by the useEffect)
                                                // Never set it here — engine derives it internally
                                                if (remiseType !== "fixed") setLockedPercentage(null);
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

                                {/* Right Column - Calculations - EXACT SAME STYLE */}
                                <Col md={6}>
                                  <div className="calculation-summary-right">
                                    <Table className="table table-borderless mb-0">
                                      <tbody>
                                        <tr className="real-time-update">
                                          <th className="text-end text-muted fs-6">Sous-total H.T.:</th>
                                          <td className="text-end fw-semibold fs-6">
                                            {sousTotalHT.toFixed(3)} DT
                                          </td>
                                        </tr>
                                        <tr className="real-time-update">
                                          <th className="text-end text-muted fs-6">Net H.T.:</th>
                                          <td className="text-end fw-semibold fs-6">
                                            {netHT.toFixed(3)} DT
                                          </td>
                                        </tr>
                                        <tr className="real-time-update">
                                          <th className="text-end text-muted fs-6">TVA:</th>
                                          <td className="text-end fw-semibold fs-6">
                                            {exoneration ? "0,000" : totalTax.toFixed(3)} DT
                                          </td>
                                        </tr>
                                        <tr className="real-time-update">
                                          <th className="text-end text-muted fs-6">Total TTC:</th>
                                          <td className="text-end fw-semibold fs-6 text-dark">
                                            {grandTotal.toFixed(3)} DT
                                          </td>
                                        </tr>
                                        {showRemise && globalRemise > 0 && (
                                          <tr className={`real-time-update ${(discountPercentage ?? 0) > 10 ? "table-danger" : "table-success"}`}>
                                            <th className={`text-end fs-6 ${(discountPercentage ?? 0) > 10 ? "text-danger" : "text-success"}`}>
                                              {remiseType === "percentage"
                                                ? `Remise (${globalRemise}%)`
                                                : `Remise (Montant fixe) ${(discountPercentage ?? 0).toFixed(8)}%`}
                                            </th>
                                            <td className={`text-end fw-bold fs-6 ${(discountPercentage ?? 0) > 10 ? "text-danger" : "text-success"}`}>
                                              - {discountAmount.toFixed(3)} DT
                                            </td>
                                          </tr>
                                        )}
                                        {retentionMontant > 0 && (
                                          <tr className="real-time-update">
                                            <th className="text-end text-muted fs-6">Retenue à la source:</th>
                                            <td className="text-end text-info fw-bold fs-6">
                                              - {retentionMontant.toFixed(3)} DT
                                            </td>
                                          </tr>
                                        )}
                                        {timbreFiscal && (
                                          <tr className="real-time-update">
                                            <th className="text-end text-muted fs-6">Timbre Fiscal:</th>
                                            <td className="text-end fw-semibold fs-6">+ 1.000 DT</td>
                                          </tr>
                                        )}
                                        <tr className="final-total real-time-update border-top">
                                          <th className="text-end fs-5">NET À PAYER:</th>
                                          <td className="text-end fw-bold fs-5 text-primary">
                                            {netAPayer.toFixed(3)} DT
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
                      <Card className="border-0 shadow-sm mb-4">
                        <CardBody className="p-4">
                          <div className="d-flex justify-content-between align-items-center">
                            <h5 className="fw-semibold text-primary mb-0">
                              <i className="ri-bank-card-line me-2"></i>
                              Modes de Règlement
                            </h5>

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

                          {methodesReglement.length > 0 ? (
                            <>
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
                                          if (newMethod === "retenue") {
                                            updateMethodeReglement(
                                              methode.id,
                                              "tauxRetention",
                                              1
                                            );
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
                                        <option value="Carte Bancaire TPE">
                                          Carte Bancaire TPE
                                        </option>
                                        <option value="retenue">
                                          Retenue à la source
                                        </option>
                                      </Input>
                                    </Col>

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
                          ) : (
                            <div className="text-muted text-center p-3">
                              <i className="ri-information-line me-2"></i>
                              Aucune méthode de règlement définie
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
                              onChange={(e) =>
                                validation.setFieldValue(
                                  "notes",
                                  e.target.value
                                )
                              }
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
                        onClick={() => setFactureModal(false)}
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
                          !selectedDepot ||
                          selectedArticles.length === 0 ||
                          !selectedClient
                        }
                      >
                        <i className="ri-file-text-line me-2"></i>
                        Créer Facture
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
                        <i className="ri-eye-line text-info fs-4"></i>
                      </div>
                      <div>
                        <h4 className="mb-0 fw-bold text-dark">
                          Bon de Commande #{selectedBonCommande?.numeroCommande}
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
                                    {selectedBonCommande.clientWebsite ? (
                                      <>
                                        <h5 className="mb-1">
                                          {
                                            selectedBonCommande.clientWebsite
                                              .nomPrenom
                                          }
                                        </h5>
                                        <Badge color="info" className="mb-2">
                                          Client Site Web
                                        </Badge>
                                        <p className="text-muted mb-1">
                                          <i className="ri-phone-line me-1"></i>
                                          {
                                            selectedBonCommande.clientWebsite
                                              .telephone
                                          }
                                        </p>
                                        {selectedBonCommande.clientWebsite
                                          .email && (
                                            <p className="text-muted mb-1">
                                              <i className="ri-mail-line me-1"></i>
                                              {
                                                selectedBonCommande.clientWebsite
                                                  .email
                                              }
                                            </p>
                                          )}
                                        <p className="text-muted mb-0">
                                          <i className="ri-map-pin-line me-1"></i>
                                          {
                                            selectedBonCommande.clientWebsite
                                              .adresse
                                          }
                                          {selectedBonCommande.clientWebsite
                                            .ville &&
                                            `, ${selectedBonCommande.clientWebsite.ville}`}
                                        </p>
                                      </>
                                    ) : selectedBonCommande.client ? (
                                      <>
                                        <h5 className="mb-1">
                                          {
                                            selectedBonCommande.client
                                              .raison_sociale
                                          }
                                        </h5>
                                        <p className="text-muted mb-1">
                                          <i className="ri-phone-line me-1"></i>
                                          {
                                            selectedBonCommande.client
                                              .telephone1
                                          }
                                        </p>
                                        <p className="text-muted mb-0">
                                          <i className="ri-map-pin-line me-1"></i>
                                          {selectedBonCommande.client.adresse}
                                        </p>
                                      </>
                                    ) : (
                                      <p className="text-muted mb-0">
                                        Aucun client associé
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </CardBody>
                            </Card>
                          </Col>

                          {/* In the detail modal's "Informations Commande" card */}
                          <Col md={6}>
                            <Card className="border-0 shadow-sm h-100">
                              <CardBody className="p-4">
                                <h6 className="fw-semibold mb-3 text-primary">
                                  <i className="ri-information-line me-2"></i>
                                  Informations Commande
                                </h6>
                                <div className="row g-2">
                                  <div className="col-6">
                                    <p className="mb-2">
                                      <span className="text-muted d-block">
                                        Date Commande:
                                      </span>
                                      <strong>
                                        {moment(
                                          selectedBonCommande.dateCommande
                                        ).format("DD MMM YYYY")}
                                      </strong>
                                    </p>
                                  </div>
                                  <div className="col-6">
                                    <p className="mb-2">
                                      <span className="text-muted d-block">
                                        Date Livraison :
                                      </span>
                                      <strong>
                                        {selectedBonCommande.dateLivBonCommande
                                          ? moment(
                                            selectedBonCommande.dateLivBonCommande
                                          ).format("DD MMM YYYY")
                                          : ""}
                                      </strong>
                                    </p>
                                  </div>
                                  <div className="col-6">
                                    <p className="mb-2">
                                      <span className="text-muted d-block">
                                        Vendeur:
                                      </span>
                                      <strong>
                                        {selectedBonCommande.vendeur?.nom}{" "}
                                        {selectedBonCommande.vendeur?.prenom}
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
                                    <th className="text-end">Qté Com</th>
                                    <th className="text-end">Qté Liv</th>
                                    <th className="text-end">Reste</th>
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
                                      const quantiteCommandee =
                                        Number(item.quantite) || 0;
                                      const quantiteLivree =
                                        Number(item.quantiteLivree) || 0;
                                      const quantiteRestante =
                                        quantiteCommandee - quantiteLivree;
                                      const priceHT =
                                        Number(item.prixUnitaire) || 0;
                                      const tvaRate = Number(item.tva ?? 0);
                                      const remiseRate = Number(
                                        item.remise || 0
                                      );

                                      // Use the same logic as bon livraison - use puv_ttc from article

                                      const priceTTC =
                                        Number(item.prix_ttc) !== 0
                                          ? Number(item.prix_ttc)
                                          : Number(item.article?.puv_ttc) ||
                                          priceHT * (1 + tvaRate / 100);

                                      const montantSousTotalHT =
                                        Math.round(
                                          quantiteCommandee * priceHT * 1000
                                        ) / 1000;
                                      const montantNetHT =
                                        Math.round(
                                          quantiteCommandee *
                                          priceHT *
                                          (1 - remiseRate / 100) *
                                          1000
                                        ) / 1000;
                                      const montantTTCLigne =
                                        Math.round(
                                          quantiteCommandee * priceTTC * 1000
                                        ) / 1000;

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
                                                    item.article?.designation ||
                                                    "-"}
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
                                            {quantiteCommandee}
                                          </td>
                                          <td className="text-end">
                                            <Badge
                                              color={
                                                quantiteLivree === 0
                                                  ? "secondary"
                                                  : quantiteLivree ===
                                                    quantiteCommandee
                                                    ? "success"
                                                    : "warning"
                                              }
                                            >
                                              {quantiteLivree}
                                            </Badge>
                                          </td>
                                          <td className="text-end">
                                            <Badge
                                              color={
                                                quantiteRestante > 0
                                                  ? "warning"
                                                  : "success"
                                              }
                                            >
                                              {quantiteRestante}
                                            </Badge>
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
                                    const totals = calculateDocumentTotals(
                                      {
                                        articles: selectedBonCommande.articles.map((a: any) => ({
                                          ...a,
                                          prixUnitaire: a.prixUnitaire,
                                          prixTTC: a.prix_ttc || (a.prixUnitaire * (1 + (a.tva || 0) / 100))
                                        })),
                                        remise: selectedBonCommande.remise,
                                        remiseType: selectedBonCommande.remiseType,
                                        lockedPercentage: selectedBonCommande.lockedPercentage || selectedBonCommande.locked_percentage || null,
                                        exoneration: !!(selectedBonCommande.client as any)?.exoneration || (selectedBonCommande.client as any)?.exoneration === "Oui",
                                        timbreFiscal: !!(selectedBonCommande as any).timbreFiscal,
                                        methodesReglement: selectedBonCommande.paymentMethods || [],
                                      }
                                    );

                                    const {
                                      sousTotalHT: sousTotalHTValue,
                                      netHT: netHTValue,
                                      totalTax: totalTaxValue,
                                      grandTotal: grandTotalValue,
                                      finalTotal: finalTotalValue,
                                      discountAmount: discountAmountValue,
                                      retentionMontant: retentionMontantValue,
                                      netAPayer: netAPayerValue,
                                    } = totals;

                                    // Calculate payments (acompte)
                                    const acompteTotal = (selectedBonCommande.paymentMethods || [])
                                      .filter((pm: any) => pm.method !== "retenue")
                                      .reduce((sum: number, pm: any) => sum + (Number(pm.amount) || 0), 0);

                                    const totalPaye = Number(selectedBonCommande.montantPaye || 0);
                                    const resteAPayerValue = Math.max(0, netAPayerValue - totalPaye);

                                    // Determine which values to display
                                    const displayNetHT = netHTValue;
                                    const displayTotalTax = totalTaxValue;

                                    return (
                                      <Table className="table-sm table-borderless mb-0">
                                        <tbody>
                                          <tr className="real-time-update">
                                            <th className="text-end text-muted fs-6">Sous-total H.T.:</th>
                                            <td className="text-end fw-semibold fs-6">
                                              {sousTotalHTValue.toFixed(3)} DT
                                            </td>
                                          </tr>
                                          <tr className="real-time-update">
                                            <th className="text-end text-muted fs-6">Net H.T.:</th>
                                            <td className="text-end fw-semibold fs-6">
                                              {displayNetHT.toFixed(3)} DT
                                            </td>
                                          </tr>
                                          <tr className="real-time-update">
                                            <th className="text-end text-muted fs-6">TVA:</th>
                                            <td className="text-end fw-semibold fs-6">
                                              {displayTotalTax.toFixed(3)} DT
                                            </td>
                                          </tr>
                                          <tr className="real-time-update">
                                            <th className="text-end text-muted fs-6">Total TTC:</th>
                                            <td className="text-end fw-semibold fs-6 text-dark">
                                              {grandTotalValue.toFixed(3)} DT
                                            </td>
                                          </tr>
                                          {discountAmountValue > 0.001 && (
                                            <tr className={`real-time-update ${discountPercentage > 10 ? "table-danger" : "table-success"}`}>
                                              <th className={`text-end fs-6 ${discountPercentage > 10 ? "text-danger" : "text-success"}`}>
                                                {selectedBonCommande.remiseType === "percentage"
                                                  ? `Remise (Global) ${Number(selectedBonCommande.remise)}%`
                                                  : `Remise (Montant fixe) ${discountPercentage}%`}
                                              </th>
                                              <td className={`text-end fw-bold fs-6 ${discountPercentage > 10 ? "text-danger" : "text-success"}`}>
                                                - {discountAmountValue.toFixed(3)} DT
                                              </td>
                                            </tr>
                                          )}
                                          {retentionMontantValue > 0 && (
                                            <tr className="real-time-update">
                                              <th className="text-end text-muted fs-6">Retenue à la source:</th>
                                              <td className="text-end text-info fw-bold fs-6">
                                                - {retentionMontantValue.toFixed(3)} DT
                                              </td>
                                            </tr>
                                          )}
                                          <tr className="final-total real-time-update border-top">
                                            <th className="text-end fs-5">NET À PAYER:</th>
                                            <td className="text-end fw-bold fs-5 text-primary">
                                              {netAPayerValue.toFixed(3)} DT
                                            </td>
                                          </tr>
                                          {acompteTotal > 0 && (
                                            <tr className="real-time-update">
                                              <th className="text-end text-muted fs-6">Acompte:</th>
                                              <td className="text-end text-success fw-bold fs-6">
                                                - {acompteTotal.toFixed(3)} DT
                                              </td>
                                            </tr>
                                          )}
                                          <tr className="final-total real-time-update border-top border-primary">
                                            <th className="text-end fs-5 text-primary">RESTE À PAYER:</th>
                                            <td className="text-end fw-bold fs-5 text-primary">
                                              {resteAPayerValue.toFixed(3)} DT
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

                          // Set the depot first
                          if (selectedBonCommande.depot_id) {
                            const depot = depots.find(
                              (d) => d.id === selectedBonCommande.depot_id
                            );
                            setSelectedDepot(depot || null);
                          }

                          // FIXED: Update the setSelectedArticles part to include article reference
                          setSelectedArticles(
                            selectedBonCommande.articles.map((item: any) => ({
                              article_id: item.article?.id || 0,
                              quantite: item.quantite,
                              quantiteLivree: item.quantiteLivree || "", // ✅ Load existing delivered quantity
                              prixUnitaire:
                                typeof item.prixUnitaire === "string"
                                  ? parseFloat(item.prixUnitaire)
                                  : item.prixUnitaire,
                              // ✅ Use prix_ttc from bon commande database
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
                              articleDetails: item.article, // ✅ This includes the article reference
                              designation:
                                item.designation ||
                                item.article?.designation ||
                                "",
                            }))
                          );

                          setSelectedClient(selectedBonCommande.client || null);
                          // FIXED: Convert fixed target net to percentage to avoid "big mistake" on partial delivery
                          const bcTotals = calculateDocumentTotals({
                            articles: selectedBonCommande.articles.map((a: any) => ({
                              ...a,
                              prixUnitaire: a.prixUnitaire,
                              prixTTC: a.prix_ttc || (a.prixUnitaire * (1 + (a.tva || 0) / 100))
                            })),
                            remise: 0,
                            remiseType: "percentage"
                          });
                          const bcTotalTTC = bcTotals.grandTotal;
                          const bcTargetNet = Number(selectedBonCommande.remise) || 0;

                          if (selectedBonCommande.remiseType === "fixed" && bcTotalTTC > 0 && bcTargetNet > 0 && bcTargetNet < bcTotalTTC) {
                            const perc = ((bcTotalTTC - bcTargetNet) / bcTotalTTC) * 100;
                            setGlobalRemise(bcTargetNet);
                            setRemiseType("fixed");
                            setLockedPercentage(perc);
                          } else {
                            setGlobalRemise(selectedBonCommande.remise || 0);
                            setRemiseType(selectedBonCommande.remiseType || "percentage");
                            setLockedPercentage(null);
                          }
                          setShowRemise((selectedBonCommande.remise || 0) > 0);
                          setIsCreatingLivraison(true);
                          setIsEdit(false);

                          validation.setValues({
                            ...validation.values,
                            numeroLivraison: nextNumeroLivraison,
                            client_id: selectedBonCommande.client?.id ?? "",
                            vendeur_id: selectedBonCommande.vendeur?.id ?? "",
                            dateLivraison: moment().format("YYYY-MM-DD"),
                            status: "Brouillon",
                            notes: selectedBonCommande.notes ?? "",
                            isCreatingLivraison: true,
                          });
                          setModal(true);
                        }
                      }}
                      className="btn-invoice btn-invoice-success me-2"
                    >
                      <i className="ri-truck-line me-2"></i> Créer Bon Livraison
                    </Button>

                    {/* Add this button in your detail modal footer */}
                    {/* Replace the "Créer Facture Client" button with this */}
                    <Button
                      color="warning"
                      onClick={() => {
                        if (selectedBonCommande) {
                          prepareFactureCreation(selectedBonCommande);
                        }
                      }}
                      className="btn-invoice btn-invoice-warning me-2"
                      disabled={!selectedBonCommande}
                    >
                      <i className="ri-file-text-line me-2"></i> Créer Facture
                      Client
                    </Button>
                    <Button
                      color="primary"
                      onClick={() =>
                        selectedBonCommande && openPdfModal(selectedBonCommande)
                      }
                      className="btn-invoice btn-invoice-primary me-2"
                      disabled={!selectedBonCommande}
                    >
                      <i className="ri-file-pdf-line me-2"></i> Imprimer PDF
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
                {/* Quick Client Creation Modal */}
                {/* Quick Client Creation Modal - COMPLETE VERSION */}
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
                  isOpen={modal}
                  toggle={toggleModal}
                  centered
                  size="xl"
                  className="invoice-modal"
                  style={{ maxWidth: "1200px" }}
                >
                  <ModalHeader
                    toggle={() => {
                      toggleModal();
                      // Additional cleanup if needed
                    }}
                    className="border-0 pb-3"
                  >
                    <div className="d-flex align-items-center">
                      <div className="modal-icon-wrapper bg-primary bg-opacity-10 rounded-circle p-2 me-3">
                        <i className="ri-file-list-3-line text-primary fs-4"></i>
                      </div>
                      <div>
                        <h4 className="mb-0 fw-bold text-dark">
                          {isCreatingLivraison
                            ? "Créer Bon de Livraison"
                            : isEdit
                              ? "Modifier Bon de Commande Client"
                              : "Créer Bon de Commande Client"}
                        </h4>
                        <small className="text-muted">
                          {isCreatingLivraison
                            ? "Créer un bon de livraison à partir de cette commande"
                            : isEdit
                              ? "Modifier les détails du bon de commande existant"
                              : "Créer un nouveau bon de commande client"}
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
                            {isCreatingLivraison ? (
                              <Col md={4}>
                                <div className="mb-3">
                                  <Label className="form-label-lg fw-semibold">
                                    Numéro de Livraison*
                                  </Label>
                                  <Input
                                    name="numeroLivraison"
                                    value={validation.values.numeroLivraison}
                                    onChange={validation.handleChange}
                                    onBlur={validation.handleBlur}
                                    invalid={
                                      validation.touched.numeroLivraison &&
                                      !!validation.errors.numeroLivraison
                                    }
                                    readOnly={!isEdit}
                                    className="form-control-lg"
                                    placeholder="LIV-2024-001"
                                  />
                                  <FormFeedback className="fs-6">
                                    {validation.errors.numeroLivraison}
                                  </FormFeedback>
                                </div>
                              </Col>
                            ) : (
                              <Col md={4}>
                                <div className="mb-3">
                                  <Label className="form-label-lg fw-semibold">
                                    Numéro de Commande*
                                  </Label>
                                  <Input
                                    name="numeroCommande"
                                    value={validation.values.numeroCommande}
                                    onChange={validation.handleChange}
                                    onBlur={validation.handleBlur}
                                    invalid={
                                      validation.touched.numeroCommande &&
                                      !!validation.errors.numeroCommande
                                    }
                                    className="form-control-lg"
                                  />
                                  <FormFeedback className="fs-6">
                                    {validation.errors.numeroCommande}
                                  </FormFeedback>
                                </div>
                              </Col>
                            )}

                            <Col md={4}>
                              <div className="mb-3">
                                <Label className="form-label-lg fw-semibold">
                                  {isCreatingLivraison
                                    ? "Date de Livraison*"
                                    : "Date de Commande*"}
                                </Label>
                                <Input
                                  className="form-control-lg"
                                  type="date"
                                  name={
                                    isCreatingLivraison
                                      ? "dateLivraison"
                                      : "dateCommande"
                                  }
                                  value={
                                    isCreatingLivraison
                                      ? validation.values.dateLivraison
                                      : validation.values.dateCommande
                                  }
                                  onChange={validation.handleChange}
                                  onBlur={validation.handleBlur}
                                  invalid={
                                    isCreatingLivraison
                                      ? validation.touched.dateLivraison &&
                                      !!validation.errors.dateLivraison
                                      : validation.touched.dateCommande &&
                                      !!validation.errors.dateCommande
                                  }
                                />
                                <FormFeedback>
                                  {isCreatingLivraison
                                    ? typeof validation.errors.dateLivraison ===
                                      "string"
                                      ? validation.errors.dateLivraison
                                      : ""
                                    : typeof validation.errors.dateCommande ===
                                      "string"
                                      ? validation.errors.dateCommande
                                      : ""}
                                </FormFeedback>
                              </div>
                            </Col>

                            {/* Date Livraison Commande - ONLY FOR BON COMMANDE (not for bon livraison) */}
                            {!isCreatingLivraison && (
                              <Col md={4}>
                                <div className="mb-3">
                                  <Label className="form-label-lg fw-semibold">
                                    Date Livraison Commande
                                  </Label>
                                  <Input
                                    className="form-control-lg"
                                    type="date"
                                    name="dateLivBonCommande"
                                    value={
                                      validation.values.dateLivBonCommande || ""
                                    }
                                    onChange={validation.handleChange}
                                    onBlur={validation.handleBlur}
                                  />
                                </div>
                              </Col>
                            )}

                            {/* Depot Field - For both modes */}
                            <Col md={4}>
                              <div className="mb-3">
                                <Label className="form-label-lg fw-semibold">
                                  Dépôt*
                                </Label>
                                <Input
                                  type="select"
                                  name="depot_id"
                                  value={validation.values.depot_id || ""}
                                  onChange={validation.handleChange}
                                  onBlur={validation.handleBlur}
                                  invalid={
                                    validation.touched.depot_id &&
                                    !!validation.errors.depot_id
                                  }
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
                                <FormFeedback className="fs-6">
                                  {validation.errors.depot_id}
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

                              {/* Enhanced Client Search Section */}
                              <div className="mb-3 position-relative">
                                <Label className="form-label-lg fw-semibold">
                                  Client*
                                  {!selectedClient && !isCreatingLivraison && (
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
                                    readOnly={!!selectedClient || isCreatingLivraison}
                                    className="form-control-lg pe-10"
                                  />

                                  {/* Clear button when client is selected */}
                                  {selectedClient && !isCreatingLivraison && (
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
                                  {!selectedClient && !isCreatingLivraison && (
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

                                {/* Dropdown Results - same enhanced style as Devis */}
                                {!isCreatingLivraison &&
                                  !selectedClient &&
                                  clientSearch.length >= 3 && (
                                    <div
                                      className="search-results client-results mt-1"
                                      style={{
                                        position: "absolute",
                                        top: "100%",
                                        left: 0,
                                        right: 0,
                                        zIndex: 1050,
                                        backgroundColor: "#fafafa",
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
                                                      zIndex: 2
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
                                  Vendeur*
                                </Label>
                                <Input
                                  type="select"
                                  name="vendeur_id"
                                  value={validation.values.vendeur_id}
                                  onChange={validation.handleChange}
                                  onBlur={validation.handleBlur}
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
                      {/* Global Discount Section :  <Card className="border-0 shadow-sm mb-4">
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
                              <Label
                                for="showRemise"
                                check
                                className="form-check-label fw-semibold fs-6"
                              >
                                Appliquer une remise
                              </Label>
                            </div>
                          </div>

                          {showRemise && (
                            <Row className="g-3 mt-3">
                              <Col md={4}>
                                <div className="mb-3">
                                  <Label className="form-label-lg fw-semibold">
                                    Type de remise
                                  </Label>
                                  <Input
                                    type="select"
                                    value={remiseType}
                                    onChange={(e) =>
                                      setRemiseType(
                                        e.target.value as "percentage" | "fixed"
                                      )
                                    }
                                    className="form-control-lg"
                                  >
                                    <option value="percentage">
                                      Pourcentage (%)
                                    </option>
                                    <option value="fixed">
                                      Montant fixe (DT)
                                    </option>
                                  </Input>
                                </div>
                              </Col>
                              <Col md={4}>
                                <div className="mb-3">
                                  <Label className="form-label-lg fw-semibold">
                                    {remiseType === "percentage"
                                      ? "Pourcentage de remise"
                                      : "Montant de remise (DT)"}
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
                                      globalRemise === 0 ? "" : globalRemise
                                    }
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
                                      remiseType === "percentage"
                                        ? "0-100%"
                                        : "Montant en DT"
                                    }
                                    className="form-control-lg"
                                  />
                                </div>
                              </Col>
                              <Col md={4}>
                                {showRemise && globalRemise > 0 && (
                                  <div className="p-3 bg-primary bg-opacity-10 rounded border">
                                    <div className="text-center">
                                      <small className="text-muted d-block">
                                        Remise appliquée
                                      </small>
                                      <strong className="fs-5 text-primary">
                                        {remiseType === "percentage"
                                          ? `${globalRemise}%`
                                          : `${Number(globalRemise).toFixed(
                                              3
                                            )} DT`}
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
                            {/* Update the article search input */}
                            <div className="search-box position-relative">
                              <Input
                                type="text"
                                placeholder="Rechercher article..."
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

                            {/* Update the dropdown container to handle scrolling with proper TypeScript */}
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
                                onKeyDown={(e) => e.stopPropagation()} // Prevent key events from bubbling
                              >
                                {filteredArticles.length > 0 ? (
                                  <ul className="list-group list-group-flush">
                                    {filteredArticles.map((article, index) => {
                                      // Create ref for each item if needed
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
                                          } // Highlight on hover
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
                                          width: "8%",
                                          minWidth: "80px",
                                        }}
                                      >
                                        Référence
                                      </th>
                                      <th
                                        style={{
                                          width: "6%",
                                          minWidth: "60px",
                                        }}
                                      >
                                        Qté Com
                                      </th>

                                      {/* ✅ ALWAYS SHOW delivery columns - even in creation mode */}
                                      <th
                                        style={{
                                          width: "6%",
                                          minWidth: "60px",
                                        }}
                                      >
                                        Qté Liv
                                      </th>
                                      <th
                                        style={{
                                          width: "6%",
                                          minWidth: "60px",
                                        }}
                                      >
                                        Reste
                                      </th>

                                      <th
                                        style={{
                                          width: "10%",
                                          minWidth: "100px",
                                        }}
                                      >
                                        Prix HT
                                      </th>
                                      <th
                                        style={{
                                          width: "10%",
                                          minWidth: "100px",
                                        }}
                                      >
                                        Prix TTC
                                      </th>
                                      <th
                                        style={{
                                          width: "8%",
                                          minWidth: "70px",
                                        }}
                                      >
                                        TVA (%)
                                      </th>
                                      <th
                                        style={{
                                          width: "9%",
                                          minWidth: "90px",
                                        }}
                                      >
                                        Total HT
                                      </th>
                                      <th
                                        style={{
                                          width: "9%",
                                          minWidth: "90px",
                                        }}
                                      >
                                        Total TTC
                                      </th>
                                      <th
                                        style={{
                                          width: "4%",
                                          minWidth: "50px",
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

                                      const qtyCommandee =
                                        Number(item.quantite) || 0;
                                      const qtyLivree =
                                        Number(item.quantiteLivree) || 0;
                                      const qtyRestante =
                                        qtyCommandee - qtyLivree;

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
                                        qtyCommandee * priceHT
                                      ).toFixed(3);
                                      const montantTTCLigne = (
                                        qtyCommandee * priceTTC
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
                                                  value={
                                                    editingDesignation[
                                                      item.article_id
                                                    ] !== undefined
                                                      ? editingDesignation[
                                                      item.article_id
                                                      ]
                                                      : item.designation ||
                                                      article?.designation ||
                                                      ""
                                                  }
                                                  onChange={(e) => {
                                                    const value =
                                                      e.target.value;
                                                    setEditingDesignation(
                                                      (prev) => ({
                                                        ...prev,
                                                        [item.article_id]:
                                                          value,
                                                      })
                                                    );
                                                  }}
                                                  onBlur={() => {
                                                    if (
                                                      editingDesignation[
                                                      item.article_id
                                                      ] !== undefined
                                                    ) {
                                                      handleArticleChange(
                                                        item.article_id,
                                                        "designation",
                                                        editingDesignation[
                                                        item.article_id
                                                        ]
                                                      );
                                                      setEditingDesignation(
                                                        (prev) => {
                                                          const newState = {
                                                            ...prev,
                                                          };
                                                          delete newState[
                                                            item.article_id
                                                          ];
                                                          return newState;
                                                        }
                                                      );
                                                    }
                                                  }}
                                                  onKeyDown={(e) => {
                                                    if (
                                                      e.key === "Enter" &&
                                                      !e.shiftKey
                                                    ) {
                                                      e.preventDefault();
                                                      if (
                                                        editingDesignation[
                                                        item.article_id
                                                        ] !== undefined
                                                      ) {
                                                        handleArticleChange(
                                                          item.article_id,
                                                          "designation",
                                                          editingDesignation[
                                                          item.article_id
                                                          ]
                                                        );
                                                        setEditingDesignation(
                                                          (prev) => {
                                                            const newState = {
                                                              ...prev,
                                                            };
                                                            delete newState[
                                                              item.article_id
                                                            ];
                                                            return newState;
                                                          }
                                                        );
                                                      }
                                                    }
                                                  }}
                                                  className="article-designation-input"
                                                  rows={2}
                                                />

                                              </div>
                                            </div>
                                          </td>
                                          <td style={{ width: "8%" }}>
                                            <Badge
                                              color="light"
                                              className="text-dark text-xs"
                                            >
                                              {article?.reference}
                                            </Badge>
                                          </td>
                                          <td style={{ width: "6%" }}>
                                            <Input
                                              type="number"
                                              min="0"
                                              step="1"
                                              value={item.quantite}
                                              onChange={(e) => {
                                                const value = e.target.value;
                                                if (value === "") {
                                                  handleArticleChange(
                                                    item?.article_id,
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
                                              readOnly={isCreatingLivraison} // ✅ MAKE READ-ONLY DURING BL CREATION
                                            />
                                          </td>

                                          {/* ✅ ALWAYS SHOW delivery columns - even in creation mode */}
                                          <td style={{ width: "6%" }}>
                                            <Input
                                              type="number"
                                              min="0"
                                              max={qtyCommandee}
                                              step="1"
                                              value={
                                                isCreatingLivraison
                                                  ? newDeliveryQuantities[
                                                  item.article_id
                                                  ] ?? ""
                                                  : item.quantiteLivree === ""
                                                    ? ""
                                                    : String(item.quantiteLivree)
                                              }
                                              onChange={(e) => {
                                                const value = e.target.value;
                                                if (isCreatingLivraison) {
                                                  // BL Creation: Store what user is typing
                                                  if (value === "") {
                                                    setNewDeliveryQuantities(
                                                      (prev) => ({
                                                        ...prev,
                                                        [item.article_id]: "",
                                                      })
                                                    );
                                                  } else {
                                                    const newDelivery =
                                                      Math.max(
                                                        0,
                                                        Number(value)
                                                      );
                                                    const currentTotalDelivered =
                                                      Number(
                                                        item.quantiteLivree
                                                      ) || 0;
                                                    const remaining =
                                                      qtyCommandee -
                                                      currentTotalDelivered;

                                                    // Validate: new delivery shouldn't exceed remaining quantity
                                                    if (
                                                      newDelivery > remaining
                                                    ) {
                                                      toast.error(
                                                        `Quantité à livrer (${newDelivery}) ne peut pas dépasser quantité restante (${remaining})`
                                                      );
                                                      setNewDeliveryQuantities(
                                                        (prev) => ({
                                                          ...prev,
                                                          [item.article_id]:
                                                            remaining,
                                                        })
                                                      );
                                                    } else {
                                                      setNewDeliveryQuantities(
                                                        (prev) => ({
                                                          ...prev,
                                                          [item.article_id]:
                                                            newDelivery,
                                                        })
                                                      );
                                                    }
                                                  }
                                                } else {
                                                  // BC Edit: Normal behavior - no error message display
                                                  if (value === "") {
                                                    handleArticleChange(
                                                      item.article_id,
                                                      "quantiteLivree",
                                                      ""
                                                    );
                                                  } else {
                                                    const newQty = Math.max(
                                                      0,
                                                      Math.min(
                                                        Number(value),
                                                        qtyCommandee
                                                      )
                                                    );
                                                    handleArticleChange(
                                                      item.article_id,
                                                      "quantiteLivree",
                                                      newQty
                                                    );
                                                  }
                                                }
                                              }}
                                              className="table-input text-center"
                                              style={{
                                                width: "100%",
                                                fontSize: "0.8rem",
                                                padding: "0.25rem",
                                                // REMOVE the border validation for BC edit, keep only for BL creation
                                                border: (() => {
                                                  if (isCreatingLivraison) {
                                                    const currentQtyLivree =
                                                      Number(
                                                        newDeliveryQuantities[
                                                        item.article_id
                                                        ] ?? 0
                                                      );
                                                    return currentQtyLivree >
                                                      qtyCommandee
                                                      ? "1px solid #f06548"
                                                      : "1px solid #ced4da";
                                                  }
                                                  return "1px solid #ced4da"; // Normal border for BC edit
                                                })(),
                                              }}
                                              placeholder="0"
                                            />
                                            {/* ONLY show error message during BL creation, not BC edit */}
                                            {isCreatingLivraison &&
                                              (() => {
                                                const currentQtyLivree = Number(
                                                  newDeliveryQuantities[
                                                  item.article_id
                                                  ] ?? 0
                                                );

                                                if (
                                                  currentQtyLivree >
                                                  qtyCommandee
                                                ) {
                                                  return (
                                                    <small
                                                      className="text-danger d-block mt-1"
                                                      style={{
                                                        fontSize: "0.7rem",
                                                      }}
                                                    >
                                                      Max: {qtyCommandee}
                                                    </small>
                                                  );
                                                }
                                                return null;
                                              })()}
                                          </td>

                                          <td
                                            style={{ width: "6%" }}
                                            className="text-center"
                                          >
                                            <Badge
                                              color={
                                                qtyRestante > 0
                                                  ? "warning"
                                                  : "success"
                                              }
                                              className="text-xs"
                                            >
                                              {isCreatingLivraison
                                                ? qtyCommandee -
                                                (Number(
                                                  item.quantiteLivree
                                                ) || 0) -
                                                (Number(
                                                  newDeliveryQuantities[
                                                  item.article_id
                                                  ]
                                                ) || 0)
                                                : qtyRestante}
                                            </Badge>
                                          </td>

                                          <td style={{ width: "10%" }}>
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
                                          <td style={{ width: "10%" }}>
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
                                          <td style={{ width: "9%" }}>
                                            <div className="article-total-cell article-total-ht">
                                              {montantHTLigne} DT
                                            </div>
                                          </td>
                                          <td style={{ width: "9%" }}>
                                            <div className="article-total-cell article-total-ttc">
                                              {montantTTCLigne} DT
                                            </div>
                                          </td>
                                          <td style={{ width: "4%" }}>
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
                                            <option value="percentage">
                                              Pourcentage (%)
                                            </option>
                                            <option value="fixed">
                                              Montant fixe (DT)
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
                                        {showRemise && discountAmount > 0.001 && (
                                          <tr className={`real-time-update ${(discountPercentage ?? 0) > 10 ? "table-danger" : "table-success"}`}>
                                            <th className={`text-end fs-6 ${(discountPercentage ?? 0) > 10 ? "text-danger" : "text-success"}`}>
                                              {remiseType === "percentage"
                                                ? `Remise (Global) ${Number(globalRemise)}%`
                                                : `Remise (Montant fixe) ${(discountPercentage ?? 0)}%`}
                                            </th>
                                            <td className={`text-end fw-bold fs-6 ${(discountPercentage ?? 0) > 10 ? "text-danger" : "text-success"}`}>
                                              - {discountAmount.toFixed(3)} DT
                                            </td>
                                          </tr>
                                        )}
                                        {retentionMontant > 0 && (
                                          <tr className="real-time-update">
                                            <th className="text-end text-muted fs-6">
                                              Retenue à la source:
                                            </th>
                                            <td className="text-end text-info fw-bold fs-6">
                                              - {retentionMontant.toFixed(3)} DT
                                            </td>
                                          </tr>
                                        )}
                                        <tr className="final-total real-time-update border-top">
                                          <th className="text-end fs-5">
                                            NET À PAYER:
                                          </th>
                                          <td className="text-end fw-bold fs-5 text-primary">
                                            {netAPayer.toFixed(3)} DT
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
                                        <option value="Carte Bancaire TPE">
                                          Carte Bancaire TPE
                                        </option>
                                        <option value="retenue">
                                          Retenue à la source
                                        </option>
                                      </Input>
                                    </Col>

                                    {/* Date de paiement */}
                                    <Col md={3}>
                                      <Label className="form-label fw-semibold">
                                        Date Paiement*
                                      </Label>
                                      <Input
                                        type="date"
                                        value={methode.date || moment().format("YYYY-MM-DD")}
                                        onChange={(e) =>
                                          updateMethodeReglement(
                                            methode.id,
                                            "date",
                                            e.target.value
                                          )
                                        }
                                        className="form-control"
                                      />
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
                <ToastContainer />
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>

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

      <Modal
        isOpen={paiementModal}
        toggle={() => setPaiementModal(false)}
        centered
        className="invoice-modal"
      >
        <ModalHeader toggle={() => setPaiementModal(false)}>
          Ajouter Paiement - Commande #{selectedBonForPaiement?.numeroCommande}
        </ModalHeader>
        <Form
          onSubmit={paiementValidation.handleSubmit}
          className="invoice-form"
        >
          <ModalBody style={{ padding: "20px" }}>
            <div className="mb-3 p-2 bg-success bg-opacity-10 rounded">
              <small className="text-muted d-block">Reste à payer:</small>
              <strong className="text-success fs-5">
                {(() => {
                  if (!selectedBonForPaiement) return "0,000";
                  const finalTotal = calculateEffectiveTotal(
                    selectedBonForPaiement
                  );
                  const paye = calculateTotalPaid(selectedBonForPaiement);
                  const retentionAmount = getSafeNumber(
                    selectedBonForPaiement.montantRetenue
                  );
                  const reste = Math.max(
                    0,
                    finalTotal - paye - retentionAmount
                  );
                  return reste.toFixed(3).replace(".", ",");
                })()}{" "}
                DT
              </strong>

              {getSafeNumber(selectedBonForPaiement?.montantRetenue) > 0 && (
                <div className="mt-1">
                  <small className="text-muted">
                    <i className="ri-information-line me-1"></i>
                    Retenue a la source: {getSafeNumber(selectedBonForPaiement?.montantRetenue).toFixed(3)} DT
                  </small>
                </div>
              )}

              {calculateTotalPaid(selectedBonForPaiement) > 0 && (
                <div className="mt-1">
                  <small className="text-success">
                    <i className="ri-information-line me-1"></i>
                    TOTAL PAYÉ: {calculateTotalPaid(selectedBonForPaiement).toFixed(3)} DT
                  </small>
                </div>
              )}
            </div>

            {/* NEW SECTION: List of regular payments (excluding retention) */}
            {selectedBonForPaiement?.paiements && selectedBonForPaiement.paiements.filter((p: any) => p.modePaiement !== "Retention").length > 0 && (
              <div className="mb-3 p-2 bg-light rounded">
                <small className="text-muted d-block mb-2">Détail des paiements:</small>
                {selectedBonForPaiement.paiements
                  .filter((p: any) => p.modePaiement !== "Retention")
                  .map((p: any, index: number) => (
                    <div key={index} className="mb-1">
                      <span className="text-muted">• </span>
                      <span>
                        {p.modePaiement} de {Number(p.montant).toFixed(3)} DT
                        {p.date && ` le ${moment(p.date).format("DD/MM/YYYY")}`}
                        {p.numeroCheque && ` (Chèque N°${p.numeroCheque})`}
                        {p.banque && ` - ${p.banque}`}
                        {p.numeroTraite && ` (Traite N°${p.numeroTraite})`}
                      </span>
                    </div>
                  ))}
              </div>
            )}

            {/* NEW SECTION: Payment methods from bon commande (excluding retention) */}
            {selectedBonForPaiement?.paymentMethods && selectedBonForPaiement.paymentMethods.filter((pm: any) => pm.method !== "retenue").length > 0 && (
              <div className="mb-3 p-2 bg-light rounded">
                <small className="text-muted d-block mb-2">Méthodes de règlement:</small>
                {selectedBonForPaiement.paymentMethods
                  .filter((pm: any) => pm.method !== "retenue")
                  .map((pm: any, index: number) => (
                    <div key={index} className="mb-1">
                      <span className="text-muted">• </span>
                      <span>
                        {pm.method} de {Number(pm.amount).toFixed(3)} DT
                        {pm.banque && ` - ${pm.banque}`}
                        {pm.numero && ` N°${pm.numero}`}
                        {pm.dateEcheance && ` échéance ${moment(pm.dateEcheance).format("DD/MM/YYYY")}`}
                      </span>
                    </div>
                  ))}
              </div>
            )}

            <Row>
              <Col md={6}>
                <div className="mb-3">
                  <Label>Montant*</Label>
                  <Input
                    type="text"
                    name="montant"
                    value={paiementValidation.values.montant}
                    onChange={handleMontantChangePaiement}
                    invalid={
                      paiementValidation.touched.montant &&
                      !!paiementValidation.errors.montant
                    }
                    placeholder="0,000"
                  />
                  <FormFeedback>
                    {paiementValidation.errors.montant}
                  </FormFeedback>
                </div>
              </Col>
              <Col md={6}>
                <div className="mb-3">
                  <Label>Mode de paiement*</Label>
                  <Input
                    type="select"
                    name="modePaiement"
                    value={paiementValidation.values.modePaiement}
                    onChange={paiementValidation.handleChange}
                    invalid={
                      paiementValidation.touched.modePaiement &&
                      !!paiementValidation.errors.modePaiement
                    }
                  >
                    <option value="Espece">En espèces</option>
                    <option value="Cheque">Chèque</option>
                    <option value="Virement">Virement</option>
                    <option value="Traite">Traite</option>
                    <option value="Carte Bancaire TPE">Carte Bancaire TPE</option>
                    <option value="Retention">Retenue à la source</option>
                    <option value="Autre">Autre</option>
                  </Input>
                  <FormFeedback>
                    {paiementValidation.errors.modePaiement}
                  </FormFeedback>
                </div>
              </Col>
            </Row>

            {/* Retention Rate Field - Only show when Retention is selected */}
            {paiementValidation.values.modePaiement === "Retention" && (
              <Row>
                <Col md={6}>
                  <div className="mb-3">
                    <Label>Taux de retenue (%)*</Label>
                    <Input
                      type="select"
                      value={retentionRate}
                      onChange={(e) => setRetentionRate(Number(e.target.value))}
                    >
                      <option value="1">1% (Taux standard)</option>
                      <option value="1.5">1.5%</option>
                      <option value="2">2%</option>
                      <option value="2.5">2.5%</option>
                      <option value="3">3%</option>
                      <option value="5">5%</option>
                      <option value="10">10%</option>
                    </Input>
                  </div>
                </Col>
              </Row>
            )}

            {/* Cheque Fields */}
            {paiementValidation.values.modePaiement === "Cheque" && (
              <Row>
                <Col md={6}>
                  <div className="mb-3">
                    <Label>Numéro du chèque*</Label>
                    <Input
                      type="text"
                      name="numeroCheque"
                      value={paiementValidation.values.numeroCheque || ""}
                      onChange={paiementValidation.handleChange}
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
                      value={paiementValidation.values.banque || ""}
                      onChange={paiementValidation.handleChange}
                      placeholder="Nom de la banque"
                    />
                  </div>
                </Col>
              </Row>
            )}

            {/* Traite Fields */}
            {paiementValidation.values.modePaiement === "Traite" && (
              <Row>
                <Col md={6}>
                  <div className="mb-3">
                    <Label>Numéro de traite*</Label>
                    <Input
                      type="text"
                      name="numeroTraite"
                      value={paiementValidation.values.numeroTraite || ""}
                      onChange={paiementValidation.handleChange}
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
                      value={paiementValidation.values.dateEcheance || ""}
                      onChange={paiementValidation.handleChange}
                      min={moment().format("YYYY-MM-DD")}
                    />
                  </div>
                </Col>
              </Row>
            )}

            <Row>
              <Col md={6}>
                <div className="mb-3">
                  <Label>Paiement n °*</Label>
                  <Input
                    type="text"
                    name="numeroPaiement"
                    value={paiementValidation.values.numeroPaiement}
                    onChange={paiementValidation.handleChange}
                    invalid={
                      paiementValidation.touched.numeroPaiement &&
                      !!paiementValidation.errors.numeroPaiement
                    }
                  />
                  <FormFeedback>
                    {paiementValidation.errors.numeroPaiement}
                  </FormFeedback>
                </div>
              </Col>
              <Col md={6}>
                <div className="mb-3">
                  <Label>Date*</Label>
                  <Input
                    type="date"
                    name="date"
                    value={paiementValidation.values.date}
                    onChange={paiementValidation.handleChange}
                    invalid={
                      paiementValidation.touched.date &&
                      !!paiementValidation.errors.date
                    }
                  />
                </div>
              </Col>
            </Row>
            <Row>
              <Col md={12}>
                <div className="mb-3">
                  <Label>Notes</Label>
                  <Input
                    type="textarea"
                    name="notes"
                    value={paiementValidation.values.notes}
                    onChange={paiementValidation.handleChange}
                    rows="2"
                    placeholder="Notes supplémentaires..."
                  />
                </div>
              </Col>
            </Row>
          </ModalBody>
          <ModalFooter>
            <Button color="light" onClick={() => setPaiementModal(false)}>
              <i className="ri-close-line align-bottom me-1"></i> Annuler
            </Button>
            <Button color="primary" type="submit">
              <i className="ri-save-line align-bottom me-1"></i> Enregistrer
              Paiement
            </Button>
          </ModalFooter>
        </Form>
      </Modal>

      {/* PDF Modal */}
      {selectedBonCommandeForPdf && (
        <BonCommandePDFModal
          isOpen={pdfModal}
          toggle={() => setPdfModal(false)}
          bonCommande={selectedBonCommandeForPdf}
          companyInfo={companyInfo}
        />
      )}

      <DiscountAlertModal
        show={showDiscountAlert}
        discountPercentage={discountPercentage}
        onConfirmClick={() => {
          setIsDiscountConfirmed(true);
          setShowDiscountAlert(false);
          setTimeout(() => {
            validation.handleSubmit();
          }, 100);
        }}
        onCloseClick={() => setShowDiscountAlert(false)}
      />
    </div>
  );
};

export default BonCommandeClientList;