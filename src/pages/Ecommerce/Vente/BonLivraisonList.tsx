import React, {
  Fragment,
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef
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
  FetchBonLivraison,
  createBonLivraison,
  updateBonLivraison,
  deleteBonLivraison,
  fetchNextLivraisonNumberAPI,
} from "../../../Components/CommandeClient/BonLivraisonServices";
import EditClientModal from "./EditClientModal";

import {

  fetchVendeurs,
  searchArticles,  // Add this
  searchClients,   // Add this
} from "../../../Components/Article/ArticleServices";
import {
  createFacture,
  fetchNextFactureNumberFromAPI,
} from "./FactureClientServices";
import classnames from "classnames";
import {
  createPaiementClient,
  fetchNextPaiementNumberFromAPI,
  fetchPaiementsClient
} from "./PaiementBcClientServices";
import {
  Article,
  Client,
  Vendeur,
  BonCommandeClient,
  BonLivraison,
  PaiementClient,
} from "../../../Components/Article/Interfaces";
import BonLivraisonPDFModal from "./BonLivraisonPDFModal";
import { useProfile } from "Components/Hooks/UserHooks";
import logo from "../../../assets/images/imglogo.png";
import DiscountAlertModal from "../../../Components/Common/DiscountAlertModal";

// Add these imports if not already present
import {
  createClient,
  createArticle,
  fetchFournisseurs,
  fetchCategories,
} from "../../../Components/Article/ArticleServices";
import { Categorie, Fournisseur } from "../../../Components/Article/Interfaces";

const BonLivraisonList = () => {
  const [detailModal, setDetailModal] = useState(false);
  const [selectedBonLivraison, setSelectedBonLivraison] =
    useState<BonLivraison | null>(null);
  const [taxMode, setTaxMode] = useState<"HT" | "TTC">("HT");
  const [activeTab, setActiveTab] = useState("1");
  const [modal, setModal] = useState(false);
  const [bonsLivraison, setBonsLivraison] = useState<BonLivraison[]>([]);
  const [filteredBonsLivraison, setFilteredBonsLivraison] = useState<
    BonLivraison[]
  >([]);
  const [bonLivraison, setBonLivraison] = useState<BonLivraison | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [vendeurs, setVendeurs] = useState<Vendeur[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [bonsCommande, setBonsCommande] = useState<BonCommandeClient[]>([]);
  const [isEdit, setIsEdit] = useState(false);
  const [isCreatingFacture, setIsCreatingFacture] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [searchText, setSearchText] = useState("");
  const [retentionRate, setRetentionRate] = useState<number>(1);
  const [paiementModal, setPaiementModal] = useState(false);
  const [nextPaiementNumber, setNextPaiementNumber] = useState("");
  const [selectedBonForPaiement, setSelectedBonForPaiement] =
    useState<BonLivraison | null>(null);

  const getSafeNumber = useCallback((value: any): number => {
    if (value === null || value === undefined) return 0;
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  }, []);

  const calculateEffectiveTotal = useCallback((bon: any) => {
    if (!bon) return 0;
    const articles = bon.articles || [];
    const remiseValue = Number(bon.remise) || 0;
    const remiseTypeValue = bon.remiseType || "percentage";

    if (articles.length === 0) return 0;

    let netHTBeforeGlobalRemise = 0;
    let totalTaxValue = 0;
    let grandTotalValue = 0;

    articles.forEach((article: any) => {
      const qty = Number(article.quantite) || 0;
      const articleRemise = Number(article.remise) || 0;
      let unitHT = Number(article.prix_unitaire || article.prixUnitaire) || 0;
      let unitTTC = Number(article.prix_ttc || article.prixTTC) || 0;

      if (unitTTC === 0) {
        const tvaRate = Number(article.tva) || 0;
        unitTTC = unitHT * (1 + tvaRate / 100);
      }

      unitHT = Math.round(unitHT * 1000) / 1000;
      unitTTC = Math.round(unitTTC * 1000) / 1000;

      const lineHT = Math.round(unitHT * 1000) / 1000;
      const lineTTC = Math.round(unitTTC * 1000) / 1000;

      const montantNetHTLigne =
        Math.round(qty * lineHT * (1 - articleRemise / 100) * 1000) / 1000;
      const montantTTCLigne = Math.round(qty * lineTTC * 1000) / 1000;
      const montantTVALigne =
        Math.round((montantTTCLigne - montantNetHTLigne) * 1000) / 1000;

      netHTBeforeGlobalRemise =
        Math.round((netHTBeforeGlobalRemise + montantNetHTLigne) * 1000) / 1000;
      totalTaxValue = Math.round((totalTaxValue + montantTVALigne) * 1000) / 1000;
      grandTotalValue =
        Math.round((grandTotalValue + montantTTCLigne) * 1000) / 1000;
    });

    let finalTotalValue = grandTotalValue;

    if (remiseValue > 0) {
      if (remiseTypeValue === "percentage") {
        const discountAmountValue =
          Math.round(netHTBeforeGlobalRemise * (remiseValue / 100) * 1000) /
          1000;
        const netHTAfterGlobalRemise =
          Math.round((netHTBeforeGlobalRemise - discountAmountValue) * 1000) /
          1000;
        let totalTaxAfterGlobalRemise = totalTaxValue;

        if (netHTBeforeGlobalRemise > 0) {
          const tvaToHtRatio =
            Math.round((totalTaxValue / netHTBeforeGlobalRemise) * 1000) / 1000;
          totalTaxAfterGlobalRemise =
            Math.round(netHTAfterGlobalRemise * tvaToHtRatio * 1000) / 1000;
        } else {
          totalTaxAfterGlobalRemise = 0;
        }
        finalTotalValue =
          Math.round(
            (netHTAfterGlobalRemise + totalTaxAfterGlobalRemise) * 1000
          ) / 1000;
      } else if (remiseTypeValue === "fixed") {
        finalTotalValue = Math.round(remiseValue * 1000) / 1000;
      }
    }

    return Math.round(finalTotalValue * 1000) / 1000;
  }, []);

  const calculateTotalPaid = useCallback((bon: any) => {
    if (!bon) return 0;

    // Sum only regular (non-retention) paymentMethods from the JSON column
    const paymentMethodsSum = (bon.paymentMethods || [])
      .filter((pm: any) => pm.method !== "retenue")
      .reduce((sum: number, pm: any) => sum + getSafeNumber(pm.amount), 0);

    // fetchData pre-aggregates both paiements table + paymentMethods into montantPaye.
    // Use Math.max to avoid double-counting: if montantPaye already includes
    // paymentMethods, we don't add them again.
    const montantPayeFromState = getSafeNumber(bon.montantPaye);

    return Math.round(
      Math.max(paymentMethodsSum, montantPayeFromState) * 1000
    ) / 1000;
  }, [getSafeNumber]);
  const [articleSearch, setArticleSearch] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [showRemise, setShowRemise] = useState(false);
  const [showDiscountAlert, setShowDiscountAlert] = useState(false);
  const [isDiscountConfirmed, setIsDiscountConfirmed] = useState(false);
  const [nextNumeroLivraison, setNextNumeroLivraison] = useState("");
  const [nextNumeroFacture, setNextNumeroFacture] = useState("");
  const [selectedBonCommande, setSelectedBonCommande] =
    useState<BonCommandeClient | null>(null);
  const [selectedArticles, setSelectedArticles] = useState<
    {
      article_id: number;
      quantite: number | "";
      prixUnitaire: number;
      prixTTC: number; // Add this
      designation?: string; // Add this line

      tva?: number | null;
      remise?: number | null;
      articleDetails?: Article;
    }[]
  >([]);
  const [remiseType, setRemiseType] = useState<"percentage" | "fixed">(
    "percentage"
  );
  const [globalRemise, setGlobalRemise] = useState(0);
  const [timbreFiscal, setTimbreFiscal] = useState<boolean>(false);
  const [editingTTC, setEditingTTC] = useState<{ [key: number]: string }>({});
  const [editingHT, setEditingHT] = useState<{ [key: number]: string }>({});

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
      numero?: string;
      banque?: string;
      dateEcheance?: string;
      tauxRetention?: number;
    }>
  >([]);
  const openPaiementModal = async (bon: BonLivraison) => {
    setSelectedBonForPaiement(bon);
    paiementValidation.resetForm();

    try {
      const nextNumber = await fetchNextPaiementNumberFromAPI();
      setNextPaiementNumber(nextNumber);

      // Use the pre-computed resteAPayer from fetchData (authoritative)
      const availableAmount = Math.max(0, getSafeNumber(bon.resteAPayer));
      const initialMontant = availableAmount.toFixed(3).replace(".", ",");

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

      const availableAmount = Math.max(0, getSafeNumber(bon.resteAPayer));
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

    let paiementAmount: number;
    if (typeof values.montant === "string") {
      paiementAmount = parseFloat(values.montant.replace(",", "."));
    } else {
      paiementAmount = Number(values.montant);
    }

    if (isNaN(paiementAmount) || paiementAmount <= 0) {
      toast.error("Le montant doit être un nombre valide supérieur à 0");
      return;
    }

    try {
      const paiementData = {
        bonLivraison_id: selectedBonForPaiement.id,
        client_id: selectedBonForPaiement.client && selectedBonForPaiement.client.id,
        montant: paiementAmount,
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
      };

      await createPaiementClient(paiementData);
      setPaiementModal(false);
      fetchData();

      toast.success("Paiement enregistré avec succès");
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Échec de l'enregistrement du paiement"
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
          "max-reste",
          "Le montant ne peut pas dépasser le reste à payer",
          function (value) {
            if (!value || !selectedBonForPaiement) return false;
            const numericValue = parseFloat(value.replace(",", "."));

            const baseTotal = calculateEffectiveTotal(selectedBonForPaiement);
            const retentionAmount = getSafeNumber(selectedBonForPaiement.montantRetenue);
            const montantPaye = getSafeNumber(selectedBonForPaiement.montantPaye);

            const availableAmount = Math.max(0, baseTotal - retentionAmount - montantPaye);

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
      handlePaiementSubmit(values);
    },
  });

  const [espaceNotes, setEspaceNotes] = useState("");

  const addMethodeReglement = () => {
    setMethodesReglement([
      ...methodesReglement,
      {
        id: Date.now().toString(),
        method: "especes",
        amount: "0,000",
      },
    ]);
  };

  const removeMethodeReglement = (id: string) => {
    setMethodesReglement(methodesReglement.filter((m) => m.id !== id));
  };

  const updateMethodeReglement = (id: string, field: string, value: any) => {
    setMethodesReglement(
      methodesReglement.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [dropdownRef, setDropdownRef] = useState<HTMLDivElement | null>(null);
  const [itemRefs, setItemRefs] = useState<React.RefObject<HTMLLIElement>[]>(
    []
  );

  // Add near your other state declarations
  const [barcodeInput, setBarcodeInput] = useState("");
  const [scanningTimeout, setScanningTimeout] = useState<NodeJS.Timeout | null>(null);
  const [phoneSearch, setPhoneSearch] = useState("");

  // Add ref for article search input
  const articleSearchRef = useRef<HTMLInputElement>(null);


  // Add these loading states
  const [secondaryLoading, setSecondaryLoading] = useState(false);
  const [articlesLoading, setArticlesLoading] = useState(false);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  // Add these with your other state declarations at the top of the component
  const [valorisationModal, setValorisationModal] = useState(false);
  const [
    selectedBonLivraisonForValorisation,
    setSelectedBonLivraisonForValorisation,
  ] = useState<BonLivraison | null>(null);
  const [isValorise, setIsValorise] = useState(true);

  // Add these state variables near your existing states
  const [clientModal, setClientModal] = useState(false);
  const [articleModal, setArticleModal] = useState(false);
  // Add with your other state declarations
  const [livraisonInfo, setLivraisonInfo] = useState({
    voiture: "",
    serie: "",
    chauffeur: "",
    cin: "",
  });
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

  const tvaOptions = [
    { value: null, label: "Non applicable" },
    { value: 0, label: "0% (Exonéré)" },
    { value: 7, label: "7%" },
    { value: 10, label: "10%" },
    { value: 13, label: "13%" },
    { value: 19, label: "19%" },
    { value: 21, label: "21%" },
  ];

  const conditionPaiementOptions = [
    { value: "7", label: "7 jours" },
    { value: "15", label: "15 jours" },
    { value: "30", label: "30 jours" },
    { value: "60", label: "60 jours" },
    { value: "90", label: "90 jours" },
  ];

  const [pdfModal, setPdfModal] = useState(false);
  const [selectedBonLivraisonForPdf, setSelectedBonLivraisonForPdf] =
    useState<BonLivraison | null>(null);
  const { userProfile, loading: profileLoading } = useProfile();

  // Company info for PDF
  const companyInfo = useMemo(
    () => ({
      name: userProfile?.company_name || "Votre Société",
      address: userProfile?.company_address || "Adresse",
      city: userProfile?.company_city || "Ville",
      phone: userProfile?.company_phone || "Téléphone",
      email: userProfile?.company_email || "Email",
      website: userProfile?.company_website || "Site web",
      taxId: userProfile?.company_tax_id || "MF",
      gsm: userProfile?.company_gsm,
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

  // Function to open PDF modal
  // Replace your current openPdfModal function with this:
  const openPdfModal = (bonLivraison: BonLivraison) => {
    setSelectedBonLivraisonForValorisation(bonLivraison);
    setValorisationModal(true);
    setIsValorise(true); // Reset to default value
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

  const fetchNextLivraisonNumberFromAPI = useCallback(async () => {
    console.log("🔍 fetchNextLivraisonNumberFromAPI called");

    try {
      console.log("📦 Making API call...");
      const numero = await fetchNextLivraisonNumberAPI();
      console.log("✅ Received numero:", numero);

      if (!numero || typeof numero !== "string") {
        throw new Error("Invalid number format received from API");
      }

      setNextNumeroLivraison(numero);
      return numero;
    } catch (err) {
      console.error("❌ Error fetching next livraison number:", err);

      // Show user-friendly error
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      toast.error(
        `Échec de la récupération du numéro de livraison: ${errorMessage}`
      );

      // Fallback: Generate a number locally
      const year = moment().format("YYYY");
      const nextNum = `LIVRAISON-${String(350 + bonsLivraison.length).padStart(
        3,
        "0"
      )}/${year}`;
      console.log("🔄 Using fallback number:", nextNum);
      setNextNumeroLivraison(nextNum);
      return nextNum;
    }
  }, [bonsLivraison]);
  const fetchNextFactureNumber = useCallback(async () => {
    try {
      const numero = await fetchNextFactureNumberFromAPI();
      setNextNumeroFacture(numero);
    } catch (err) {
      toast.error("Échec de la récupération du numéro de facture");
      const year = moment().format("YYYY");
      const nextNum = `FAC-${String(bonsLivraison.length + 1).padStart(
        4,
        "0"
      )}/${year}`;
      setNextNumeroFacture(nextNum);
    }
  }, [bonsLivraison]);

  useEffect(() => {
    if (modal && !isEdit) {
      if (isCreatingFacture) {
        fetchNextFactureNumber();
      } else {
        fetchNextLivraisonNumberFromAPI();
      }
    }
  }, [
    modal,
    isEdit,
    isCreatingFacture,
    fetchNextLivraisonNumberFromAPI,
    fetchNextFactureNumber,
  ]);


  // Replace the current useEffect for articleSearch:
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


  // Phone formatting functions - add these near the top of your component
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

  // Replace the current useEffect for clientSearch:
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

  const fetchData = useCallback(async (skipSecondary = false) => {
    try {
      setLoading(true);

      // PHASE 1: Load critical data
      const [livraisonData, vendeursData, paiementsData] = await Promise.all([
        FetchBonLivraison(),
        fetchVendeurs(),
        fetchPaiementsClient(),   // ← ADD THIS
      ]);

      // Map paiements to each bon livraison (same logic as BonCommandeClientList)
      const livraisonsWithPayments = livraisonData.map((bon: any) => {
        const relevantPaiements = paiementsData.filter(
          (paiement: PaiementClient) => paiement.bonLivraison_id === bon.id
        );



        // Regular payments from paiements table (EXCLUDING Retention)
        const regularPaiements = relevantPaiements
          .filter((p: PaiementClient) => p.modePaiement !== "Retention")
          .reduce((sum: number, p: PaiementClient) => {
            const amount =
              typeof p.montant === "string"
                ? parseFloat(p.montant) || 0
                : p.montant || 0;
            return sum + amount;
          }, 0);

        // Retention from paiements table (ONLY Retention)
        const retentionFromPaiements = relevantPaiements
          .filter((p: PaiementClient) => p.modePaiement === "Retention")
          .reduce((sum: number, p: PaiementClient) => {
            const amount =
              typeof p.montant === "string"
                ? parseFloat(p.montant) || 0
                : p.montant || 0;
            return sum + amount;
          }, 0);

        // Regular payments from paymentMethods JSON (EXCLUDING retenue)
        const regularPaymentMethods = bon.paymentMethods
          ? bon.paymentMethods
            .filter((pm: any) => pm.method !== "retenue")
            .reduce(
              (sum: number, pm: any) => sum + (Number(pm.amount) || 0),
              0
            )
          : 0;

        // Retention from paymentMethods JSON (ONLY retenue)
        let retentionFromMethods = 0;
        if (bon.paymentMethods) {
          bon.paymentMethods
            .filter((pm: any) => pm.method === "retenue")
            .forEach((pm: any) => {
              const amount = Number(pm.amount) || 0;
              if (amount === 0 && pm.tauxRetention) {
                // Calculate based on total if amount is 0 but rate exists
                // We'll recalculate after finalTotal is known
              } else {
                retentionFromMethods += amount;
              }
            });
        }

        // Calculate article totals
        let grandTotal = 0;
        bon.articles.forEach((item: any) => {
          const qty = Number(item.quantite) || 1;
          const priceHT = Number(item.prix_unitaire) || 0;
          const tvaRate = Number(item.tva ?? 0);
          const priceTTC =
            Number(item.prix_ttc) || priceHT * (1 + tvaRate / 100);
          grandTotal += Math.round(qty * priceTTC * 1000) / 1000;
        });
        grandTotal = Math.round(grandTotal * 1000) / 1000;

        // Apply global remise
        let finalTotal = grandTotal;
        const hasDiscount = bon.remise && Number(bon.remise) > 0;
        if (hasDiscount) {
          if (bon.remiseType === "percentage") {
            finalTotal = grandTotal * (1 - Number(bon.remise) / 100);
          } else {
            finalTotal = Number(bon.remise);
          }
        }
        finalTotal = Math.round(finalTotal * 1000) / 1000;

        // Now calculate retention from methods with tauxRetention if amount was 0
        let calculatedRetentionFromMethods = 0;
        if (bon.paymentMethods) {
          bon.paymentMethods
            .filter((pm: any) => pm.method === "retenue")
            .forEach((pm: any) => {
              const amount = Number(pm.amount) || 0;
              if (amount === 0 && pm.tauxRetention) {
                calculatedRetentionFromMethods +=
                  (finalTotal * pm.tauxRetention) / 100;
              } else {
                calculatedRetentionFromMethods += amount;
              }
            });
        }

        // Total retention from both sources
        const totalRetention =
          retentionFromPaiements + calculatedRetentionFromMethods;

        // Total regular payments (NO retention)
        const totalRegularPayments = regularPaiements + regularPaymentMethods;

        // Reste à payer: finalTotal - regularPayments - retention
        let resteAPayer =
          Math.round(
            (finalTotal - totalRegularPayments - totalRetention) * 1000
          ) / 1000;
        resteAPayer = Math.max(0, resteAPayer);

        return {
          ...bon,
          montantPaye: totalRegularPayments,
          montantRetenue: totalRetention,
          resteAPayer,
          hasPayments: totalRegularPayments > 0,
          hasRetention: totalRetention > 0,
          paiements: relevantPaiements,
        };
      });
      console.log(livraisonsWithPayments, "livraisonsWithPayments")

      setBonsLivraison(livraisonsWithPayments);
      setFilteredBonsLivraison(livraisonsWithPayments);
      setVendeurs(vendeursData);

      // PHASE 2: Secondary data
      if (!skipSecondary) {
        setSecondaryLoading(true);
        try {
          const [articlesResult, clientsResult] = await Promise.all([
            searchArticles({ query: "", page: 1, limit: 25 }),
            searchClients({ query: "", page: 1, limit: 25 }),
          ]);
          setArticles(articlesResult.articles || []);
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
      setSecondaryLoading(false);
    }
  }, []);

  // Initial load - only critical data
  useEffect(() => {
    fetchData(true); // true means skip secondary data initially
  }, [fetchData]);


  // Load modal data only when modal opens
  const loadModalData = async () => {
    if (modal) {
      setModalLoading(true);
      try {

        const [categoriesResult, fournisseursData] = await Promise.all([
          fetchCategories(),
          fetchFournisseurs(), // ADD THIS LINE
        ]);

        setCategories(categoriesResult);
        setFournisseurs(fournisseursData);
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

  // Load modal data when modal opens
  useEffect(() => {
    if (modal) {
      loadModalData();
    }
  }, [modal]);
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


  useEffect(() => {
    let result = [...bonsLivraison];

    if (activeTab === "2") {
      result = result.filter((bon) => bon.status === "Brouillon");
    } else if (activeTab === "3") {
      result = result.filter((bon) => bon.status === "Livree");
    } else if (activeTab === "4") {
      result = result.filter((bon) => bon.status === "Partiellement Livree");
    } else if (activeTab === "5") {
      result = result.filter((bon) => bon.status === "Annulee");
    }

    if (startDate && endDate) {
      const start = moment(startDate).startOf("day");
      const end = moment(endDate).endOf("day");
      result = result.filter((bon) => {
        const bonDate = moment(bon.dateLivraison);
        return bonDate.isBetween(start, end, null, "[]");
      });
    }

    // Apply regular text search
    if (searchText) {
      const searchLower = searchText.toLowerCase().trim();

      result = result.filter((bon) => {
        const bonNumero = bon.numeroLivraison?.toLowerCase() || "";
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

    setFilteredBonsLivraison(result);
  }, [activeTab, startDate, endDate, searchText, phoneSearch, bonsLivraison]);

  const openDetailModal = (bonLivraison: BonLivraison) => {
    setSelectedBonLivraison(bonLivraison);
    setDetailModal(true);
  };

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

    let sousTotalHTValue = 0;
    let netHTBeforeGlobalRemise = 0;
    let totalTaxValue = 0;
    let grandTotalValue = 0;

    // ✅ STEP 1: Calculate totals WITHOUT considering global remise
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
          const tvaRate = Number(article.tva) || 0;
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
          const tvaRate = Number(article.tva) || 0;
          if (tvaRate > 0) {
            const coefficient = Math.round((1 + tvaRate / 100) * 1000) / 1000;
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

      sousTotalHTValue = Math.round(
        (sousTotalHTValue + montantSousTotalHT) * 1000
      ) / 1000;
      netHTBeforeGlobalRemise = Math.round(
        (netHTBeforeGlobalRemise + montantNetHTLigne) * 1000
      ) / 1000;
      totalTaxValue = Math.round((totalTaxValue + montantTVALigne) * 1000) / 1000;
      grandTotalValue = Math.round(
        (grandTotalValue + montantTTCLigne) * 1000
      ) / 1000;
    });

    // ✅ STEP 2: Apply global remise according to principle (EXACT SAME AS FACTURE)
    let netHTAfterGlobalRemise = netHTBeforeGlobalRemise;
    let totalTaxAfterGlobalRemise = totalTaxValue;
    let finalTotalValue = grandTotalValue;
    let discountAmountValue = 0;
    let discountPercentageValue = 0;

    if (showRemise && Number(globalRemise) > 0) {
      if (remiseType === "percentage") {
        // ✅ Percentage remise: Apply on HT base
        discountAmountValue = Math.round(
          netHTBeforeGlobalRemise * (Number(globalRemise) / 100) * 1000
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
            netHTAfterGlobalRemise * tvaToHtRatio * 1000
          ) / 1000;
        } else {
          totalTaxAfterGlobalRemise = 0;
        }

        finalTotalValue = Math.round(
          (netHTAfterGlobalRemise + totalTaxAfterGlobalRemise) * 1000
        ) / 1000;
      } else if (remiseType === "fixed") {
        // ✅ Fixed remise: User enters the final TTC amount (EXACT SAME AS FACTURE)
        finalTotalValue = Math.round(Number(globalRemise) * 1000) / 1000;

        // ✅ CHECK IF SINGLE OR MULTIPLE TVA RATES
        const uniqueTvaRates = Array.from(
          new Set(selectedArticles.map((a) => Number(a.tva) || 0))
        );

        if (uniqueTvaRates.length === 1 && uniqueTvaRates[0] > 0) {
          // ✅ SINGLE TVA RATE FORMULA: Net HT = TTC / (1 + TVA rate)
          const tvaRate = uniqueTvaRates[0] / 100;
          netHTAfterGlobalRemise = Math.round((finalTotalValue / (1 + tvaRate)) * 1000) / 1000;
          totalTaxAfterGlobalRemise = Math.round((finalTotalValue - netHTAfterGlobalRemise) * 1000) / 1000;
        } else {
          // ✅ MULTIPLE TVA RATES: EXACT SAME CALCULATION AS FACTURE
          const discountCoefficient = finalTotalValue / grandTotalValue;

          let newTotalHT = 0;
          let newTotalTVA = 0;

          selectedArticles.forEach((article) => {
            const qty = article.quantite === "" ? 0 : Number(article.quantite) || 0;
            const articleRemise = Number(article.remise) || 0;
            const unitHT = Number(article.prixUnitaire) || 0;
            const tvaRate = Number(article.tva) || 0;

            const lineHTAfterDiscount = qty * unitHT * (1 - articleRemise / 100);
            const newLineHT = lineHTAfterDiscount * discountCoefficient;
            const newLineTVA = newLineHT * (tvaRate / 100);

            newTotalHT += newLineHT;
            newTotalTVA += newLineTVA;
          });

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

    // ✅ STEP 3: Calculate timbre fiscal if applicable
    let timbreAmount = 0;
    if (isCreatingFacture && timbreFiscal) {
      timbreAmount = 1.000;
      finalTotalValue = Math.round((finalTotalValue + timbreAmount) * 1000) / 1000;
    }

    // ✅ STEP 4: Calculate retention based on the final total
    let calculatedRetention = 0;
    if (methodesReglement) {
      const retentionMethod = methodesReglement.find(
        (m) => m.method === "retenue"
      );
      if (retentionMethod) {
        calculatedRetention =
          (finalTotalValue * (retentionMethod.tauxRetention || 1)) / 100;
      }
    }

    const netAPayerValue = finalTotalValue;

    return {
      sousTotalHT: sousTotalHTValue,
      netHT:
        showRemise && Number(globalRemise) > 0
          ? netHTAfterGlobalRemise
          : netHTBeforeGlobalRemise,
      totalTax:
        showRemise && Number(globalRemise) > 0
          ? totalTaxAfterGlobalRemise
          : totalTaxValue,
      grandTotal: grandTotalValue,
      finalTotal: finalTotalValue,
      discountAmount: discountAmountValue,
      discountPercentage: discountPercentageValue,
      retentionMontant: calculatedRetention,
      netAPayer: netAPayerValue,
    };
  }, [
    selectedArticles,
    showRemise,
    globalRemise,
    remiseType,
    editingHT,
    editingTTC,
    isCreatingFacture,
    timbreFiscal,
    methodesReglement,
  ]);

  const handleDelete = async () => {
    if (!bonLivraison) return;

    try {
      await deleteBonLivraison(bonLivraison.id);
      setDeleteModal(false);
      fetchData();
      toast.success("Bon de livraison supprimé avec succès");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Échec de la suppression"
      );
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
        limit: 50 // Limit to reasonable number
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
      setFilteredClients(prev => [newClientData, ...prev]);
    } catch (err) {
      console.error("Error creating client:", err);
      toast.error("Erreur lors de la création du client");
    }
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

      const livraisonData = {
        ...values,
        taxMode,
        articles: selectedArticles.map((item) => ({
          article_id: item.article_id,
          quantite: item.quantite,
          prix_unitaire: item.prixUnitaire,
          prix_ttc: item.prixTTC, // ✅ Make sure prix_ttc is included
          tva: item.tva,
          remise: item.remise,
          designation: item.designation || "", // Add this line

        })),
        remise: globalRemise,
        remiseType: remiseType,
        bonCommandeClient_id: selectedBonCommande?.id || null,
        totalHT: netHT,
        totalTVA: totalTax,
        totalTTC: grandTotal,
        totalTTCAfterRemise: finalTotal,
        montantPaye: isEdit && bonLivraison ? getSafeNumber(bonLivraison.montantPaye) : 0,
        resteAPayer: finalTotal - (isEdit && bonLivraison ? getSafeNumber(bonLivraison.montantPaye) : 0),
        hasPayments: isEdit && bonLivraison ? (bonLivraison.hasPayments || false) : false,
        totalPaymentAmount: isEdit && bonLivraison ? getSafeNumber(bonLivraison.totalPaymentAmount) : 0,
        hasRetenue: isEdit && bonLivraison ? (bonLivraison.hasRetenue || false) : false,
        montantRetenue: isEdit && bonLivraison ? getSafeNumber(bonLivraison.montantRetenue) : 0,
        timbreFiscal: isCreatingFacture ? (timbreFiscal ?? false) : false,
        paymentMethods: isCreatingFacture ? [] : processedMethodesReglement,
        espaceNotes: isCreatingFacture ? "" : (espaceNotes || ""),
        chaufeur: livraisonInfo.chauffeur || "",
        chauffeur: livraisonInfo.chauffeur || "",
        cin: livraisonInfo.cin || "",
        voiture: livraisonInfo.voiture || "",
        serie: livraisonInfo.serie || "",
      };

      if (isCreatingFacture) {
        livraisonData.bonLivraison_id = bonLivraison?.id;
        await createFacture(livraisonData);
        console.log(livraisonData, "----------");
        toast.success("Facture créée avec succès");
      } else {
        if (isEdit && bonLivraison) {
          await updateBonLivraison(bonLivraison.id, livraisonData);
          toast.success("Bon de livraison mis à jour avec succès");
        } else {
          await createBonLivraison(livraisonData);
          toast.success("Bon de livraison créé avec succès");
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
      numeroLivraison: isEdit
        ? bonLivraison?.numeroLivraison || ""
        : nextNumeroLivraison,
      numeroFacture: isCreatingFacture ? nextNumeroFacture : "",
      dateLivraison: bonLivraison?.dateLivraison
        ? moment(bonLivraison.dateLivraison).format("YYYY-MM-DD")
        : moment().format("YYYY-MM-DD"),
      dateFacture: moment().format("YYYY-MM-DD"),
      //    dateEcheance: "",
      // conditionPaiement: "",
      client_id: bonLivraison?.client?.id ?? "",
      vendeur_id: bonLivraison?.vendeur?.id ?? "",
      status: bonLivraison?.status ?? "Brouillon",
      notes: bonLivraison?.notes ?? "",
      bonCommandeClient_id: bonLivraison?.bonCommandeClient?.id ?? "",
      isCreatingFacture: isCreatingFacture,
    },
    validationSchema: Yup.object({
      numeroLivraison: Yup.string().when("isCreatingFacture", {
        is: false,
        then: (schema) => schema.required("Le numéro est requis"),
      }),
      numeroFacture: Yup.string().when("isCreatingFacture", {
        is: true,
        then: (schema) => schema.required("Le numéro de facture est requis"),
      }),
      dateLivraison: Yup.date().when("isCreatingFacture", {
        is: false,
        then: (schema) =>
          schema.required("La date est requise").typeError("Date invalide"),
      }),
      dateFacture: Yup.date().when("isCreatingFacture", {
        is: true,
        then: (schema) => schema.required("La date de facture est requise"),
      }),

      client_id: Yup.number().required("Client requis"),
      vendeur_id: Yup.number().required("Vendeur requis"),
      //  status: Yup.string().required("Statut requis"),
      bonCommandeClient_id: Yup.number().nullable(),
      isCreatingFacture: Yup.boolean(),
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
      setBonLivraison(null);
      setSelectedArticles([]);
      setSelectedClient(null);
      setSelectedBonCommande(null);
      setGlobalRemise(0);
      setRemiseType("percentage");
      setShowRemise(false);
      setIsCreatingFacture(false);
      setIsEdit(false);
      setTimbreFiscal(false);
      setModalLoading(false);
      setMethodesReglement([]);
      setEspaceNotes("");

      // Reset delivery info
      setLivraisonInfo({
        voiture: "",
        serie: "",
        chauffeur: "",
        cin: "",
      });

      validation.resetForm();
    } else {
      setModal(true);
      // Don't load modal data here - useEffect will handle it
    }
  }, [modal]);

  const handleAddArticle = (articleId: string) => {
    // First, try to find the article in filteredArticles (from search results)
    let article = filteredArticles.find((a) => a.id === parseInt(articleId));

    // If not found in filteredArticles, try the main articles array
    if (!article) {
      article = articles.find((a) => a.id === parseInt(articleId));
    }

    if (article && !selectedArticles.some((item) => item.article_id === article?.id)) {
      const initialHT = article.puv_ht || 0;
      const initialTVA = article.tva || 0;
      // USE puv_ttc FROM ARTICLE IF AVAILABLE, OTHERWISE CALCULATE
      const initialTTC = article.puv_ttc || initialHT * (1 + (initialTVA || 0) / 100);

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

      // Optional: Show success toast
      toast.success(`Article "${article.designation}" ajouté`);
    } else if (article) {
      // Article already exists - show message
      toast.info(`Article "${article.designation}" déjà ajouté`);
    }
  };

  const handleRemoveArticle = (articleId: number) => {
    setSelectedArticles(
      selectedArticles.filter((item) => item.article_id !== articleId)
    );
  };

  // Custom round function - same as used in create/edit
  const customRound = (value: number, decimals: number = 3): number => {
    return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
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
  const handleBarcodeScan = useCallback((barcode: string) => {
    if (!barcode.trim()) return;

    console.log("Code-barres scanné:", barcode);

    // Clean the barcode
    const cleanBarcode = barcode.trim();

    // Search for article by code_barre
    const scannedArticle = articles.find(article =>
      article.code_barre === cleanBarcode
    );

    if (scannedArticle) {
      const existingArticle = selectedArticles.find(
        item => item.article_id === scannedArticle.id
      );

      if (existingArticle) {
        // Increment quantity if article already exists
        handleArticleChange(
          scannedArticle.id,
          "quantite",
          (Number(existingArticle.quantite) || 0) + 1
        );
        toast.success(`Quantité augmentée pour "${scannedArticle.designation}"`);
      } else {
        // Add new article
        const initialHT = scannedArticle.puv_ht || 0;
        const initialTVA = scannedArticle.tva || 0;
        const initialTTC = scannedArticle.puv_ttc || initialHT * (1 + (initialTVA || 0) / 100);

        setSelectedArticles(prev => [
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
  }, [articles, selectedArticles, handleArticleChange]);

  // Keyboard handler for barcode scanning
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    // Check if user is typing in an input field
    const target = event.target as HTMLElement;
    const isInputField =
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable;

    if (isInputField) {
      // Allow normal typing in input fields
      return;
    }

    // Barcode scanner handling
    if (event.key === 'Enter') {
      if (barcodeInput.length > 0) {
        handleBarcodeScan(barcodeInput);
        setBarcodeInput("");
      }
    } else if (event.key.length === 1) {
      // Accumulate characters
      setBarcodeInput(prev => prev + event.key);

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
  }, [barcodeInput, scanningTimeout, handleBarcodeScan]);


  // Set up keyboard listener for barcode scanning
  useEffect(() => {
    // Always listen for barcode scanning
    document.addEventListener('keydown', handleKeyPress);
    console.log("Scanner automatique activé - prêt à scanner...");

    return () => {
      document.removeEventListener('keydown', handleKeyPress);
      if (scanningTimeout) {
        clearTimeout(scanningTimeout);
      }
    };
  }, [handleKeyPress, scanningTimeout]);



  const StatusBadge = ({
    status,
  }: {
    status?: "Brouillon" | "Livree" | "Annulee" | "Partiellement Livree";
  }) => {
    const statusConfig = {
      Brouillon: {
        bgClass: "bg-warning",
        textClass: "text-warning",
        icon: "ri-draft-line",
      },
      Livree: {
        bgClass: "bg-success",
        textClass: "text-success",
        icon: "ri-truck-line",
      },
      Annulee: {
        bgClass: "bg-danger",
        textClass: "text-danger",
        icon: "ri-close-circle-line",
      },
      "Partiellement Livree": {
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

  const handleSelectBonCommande = (bon: BonCommandeClient) => {
    setSelectedBonCommande(bon);
    setSelectedClient(bon.client || null);
    validation.setFieldValue("client_id", bon.client?.id || "");
    validation.setFieldValue("bonCommandeClient_id", bon.id);

    setSelectedArticles(
      bon.articles.map((item) => ({
        article_id: item.article?.id || 0,
        quantite: item.quantite,
        prixUnitaire:
          typeof item.prixUnitaire === "string"
            ? parseFloat(item.prixUnitaire)
            : item.prixUnitaire,
        prixTTC:
          item.article?.puv_ttc || // Use article's TTC price
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
        designation: item.designation || item.article?.designation || "", // Add this line

      }))
    );

    setGlobalRemise(bon.remise || 0);
    setRemiseType(bon.remiseType || "percentage");
    setShowRemise((bon.remise || 0) > 0);
  };


  const columns = useMemo(
    () => [
      {
        header: "Numéro",
        accessorKey: "numeroLivraison",
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
        accessorKey: "dateLivraison",
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
        header: "Commande",
        accessorKey: "bonCommandeClient",
        enableColumnFilter: false,
        cell: (cell: any) => cell.getValue()?.numeroCommande || "N/A",
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
        header: "Payé",
        accessorKey: "montantPaye",
        enableColumnFilter: false,
        cell: (cell: any) => `${calculateTotalPaid(cell.row.original).toFixed(3)} DT`,
      },
      {
        header: "Reste",
        accessorKey: "resteAPayer",
        enableColumnFilter: false,
        cell: (cell: any) => {
          const bon = cell.row.original;
          // Use the pre-computed resteAPayer from fetchData (authoritative value)
          // It equals: finalTotal - totalRegularPayments - totalRetention
          const reste = Math.max(0, getSafeNumber(bon.resteAPayer));
          return (
            <span
              className={
                reste > 0 ? "text-danger fw-medium" : "text-success fw-medium"
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
        cell: (cell: any) => <StatusBadge status={cell.getValue()} />,
      },
      /*
  {
    header: "Facture",
    accessorKey: "factures",
    enableColumnFilter: false,
    cell: (cell: any) => {
      const factures = cell.getValue();
      if (factures && factures.length > 0) {
        return factures.map((f: any) => (
          <Badge color="info" className="px-2 py-1 me-1" key={f.id}>
            <i className="ri-file-text-line me-1"></i>
            {f.numeroFacture}
          </Badge>
        ));
      }
      return <span className="text-muted small">Non Facturé</span>;
    },
  },
  */
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
                    setBonLivraison(cellProps.row.original);
                    setSelectedArticles(
                      cellProps.row.original.articles.map((item: any) => ({
                        article_id: item.article.id,
                        quantite: item.quantite,
                        prixUnitaire: parseFloat(item.prix_unitaire),
                        designation: item.designation || item.article?.designation || "", // Add this line

                        prixTTC:
                          parseFloat(item.prix_ttc) ||
                          parseFloat(item.prix_unitaire) *
                          (1 + (item.tva || 0) / 100),
                        tva: item.tva != null ? parseFloat(item.tva) : null,
                        remise:
                          item.remise != null ? parseFloat(item.remise) : null,
                        articleDetails: item.article,
                      }))
                    );
                    setGlobalRemise(cellProps.row.original.remise || 0);
                    setRemiseType(
                      cellProps.row.original.remiseType || "percentage"
                    );
                    setShowRemise((cellProps.row.original.remise || 0) > 0);
                    // In your edit button click handler, add this:
                    const currentBonLivraison = cellProps.row.original;

                    setMethodesReglement(
                      currentBonLivraison.paymentMethods &&
                        currentBonLivraison.paymentMethods.length > 0
                        ? currentBonLivraison.paymentMethods.map(
                          (pm: any, index: number) => ({
                            id: pm.id || `edit-${index}`,
                            method: pm.method,
                            amount: pm.amount
                              ? typeof pm.amount === "number"
                                ? pm.amount.toFixed(3).replace(".", ",")
                                : String(pm.amount)
                              : "",
                            numero: pm.numero || "",
                            banque: pm.banque || "",
                            dateEcheance: pm.dateEcheance || "",
                            tauxRetention: pm.tauxRetention || 1,
                          })
                        )
                        : []
                    );
                    setEspaceNotes(currentBonLivraison.espaceNotes || "");

                    setLivraisonInfo({
                      voiture: currentBonLivraison?.voiture || "",
                      serie: currentBonLivraison?.serie || "",
                      chauffeur: currentBonLivraison?.chauffeur || "",
                      cin: currentBonLivraison?.cin || "",
                    });

                    setSelectedBonCommande(
                      cellProps.row.original.bonCommandeClient || null
                    );
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
                    setBonLivraison(cellProps.row.original);
                    setDeleteModal(true);
                  }}
                >
                  <i className="ri-delete-bin-5-fill fs-16"></i>
                </Link>
              </li>
              <li className="list-inline-item">
                <Link
                  to="#"
                  className="text-success d-inline-block"
                  onClick={() => openPaiementModal(cellProps.row.original)}
                >
                  <i className="ri-money-dollar-circle-line fs-16"></i>
                </Link>
              </li>
              <li className="list-inline-item">
                <Link
                  to="#"
                  className="text-info d-inline-block"
                  onClick={() => openPdfModal(cellProps.row.original)}
                >
                  <i className="ri-file-pdf-line fs-16"></i>
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
            </ul>
          );
        },
      },
    ],
    [calculateTotalPaid, calculateEffectiveTotal, getSafeNumber]
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
          setTimeout(() => {
            validation.handleSubmit();
          }, 100);
        }}
        onCloseClick={() => setShowDiscountAlert(false)}
      />

      <Container fluid style={{ maxWidth: "100%" }}>
        <BreadCrumb title="Bons de Livraison" pageTitle="Livraisons" />

        <Row>
          <Col lg={12}>
            <Card id="bonLivraisonList">
              <CardHeader className="card-header border-0">
                <Row className="align-items-center gy-3">
                  <div className="col-sm">
                    <h5 className="card-title mb-0">
                      Gestion des Bons de Livraison
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
                        color="primary"
                        onClick={() => {
                          setIsEdit(false);
                          setBonLivraison(null);
                          setSelectedBonCommande(null);
                          setSelectedClient(null);
                          setSelectedArticles([]);
                          setIsCreatingFacture(false);
                          toggleModal();
                        }}
                      >
                        <i className="ri-add-line align-bottom me-1"></i>{" "}
                        Nouveau Bon
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
                    <i className="ri-draft-line me-1 align-bottom"></i>{" "}
                    Brouillon
                  </NavLink>
                </NavItem>
                <NavItem>
                  <NavLink
                    className={classnames({ active: activeTab === "3" })}
                    onClick={() => setActiveTab("3")}
                  >
                    <i className="ri-truck-line me-1 align-bottom"></i> Livrée
                  </NavLink>
                </NavItem>
                <NavItem>
                  <NavLink
                    className={classnames({ active: activeTab === "4" })}
                    onClick={() => setActiveTab("4")}
                  >
                    <i className="ri-truck-line me-1 align-bottom"></i>{" "}
                    Partiellement Livrée
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
                <Row className="mb-3">
                  <Col md={3}>
                    <div className="search-box">
                      <Input
                        type="text"
                        className="form-control"
                        placeholder="Rechercher par numéro, client..."
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
                    data={filteredBonsLivraison}
                    isGlobalFilter={false}
                    customPageSize={10}
                    divClass="table-responsive table-card mb-1 mt-0"
                    tableClass="align-middle table-nowrap"
                    theadClass="table-light text-muted text-uppercase"
                  />
                )}

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
                        <i className="ri-truck-line text-info fs-4"></i>
                      </div>
                      <div>
                        <h4 className="mb-0 fw-bold text-dark">
                          Bon de Livraison #
                          {selectedBonLivraison?.numeroLivraison}
                        </h4>
                        <small className="text-muted">
                          {moment(selectedBonLivraison?.dateLivraison).format(
                            "DD MMM YYYY"
                          )}
                        </small>
                      </div>
                    </div>
                  </ModalHeader>

                  <ModalBody className="pt-0">
                    {selectedBonLivraison && (
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
                                        selectedBonLivraison.client
                                          ?.raison_sociale
                                      }
                                    </h5>
                                    <p className="text-muted mb-1">
                                      <i className="ri-phone-line me-1"></i>
                                      {selectedBonLivraison.client
                                        ?.telephone1 || "N/A"}
                                    </p>
                                    <p className="text-muted mb-0">
                                      <i className="ri-map-pin-line me-1"></i>
                                      {selectedBonLivraison.client?.adresse ||
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
                                  Informations Livraison
                                </h6>
                                <div className="row g-2">
                                  <div className="col-6">
                                    <p className="mb-2">
                                      <span className="text-muted d-block">
                                        Vendeur:
                                      </span>
                                      <strong>
                                        {selectedBonLivraison.vendeur
                                          ? `${selectedBonLivraison.vendeur.nom} ${selectedBonLivraison.vendeur.prenom}`
                                          : "N/A"}
                                      </strong>
                                    </p>
                                  </div>
                                  <div className="col-6">
                                    <p className="mb-2">
                                      <span className="text-muted d-block">
                                        Commande:
                                      </span>
                                      <strong>
                                        {selectedBonLivraison.bonCommandeClient
                                          ?.numeroCommande || "N/A"}
                                      </strong>
                                    </p>
                                  </div>

                                </div>
                              </CardBody>
                            </Card>
                          </Col>
                        </Row>

                        {/* Add this in your detail modal after the existing sections */}
                        {/* Replace the current delivery info section in detail modal with this: */}
                        <Card className="border-0 shadow-sm mb-4">
                          <CardBody className="p-4">
                            <h6 className="fw-semibold mb-3 text-primary">
                              <i className="ri-truck-line me-2"></i>
                              Informations de Livraison
                            </h6>
                            <Row>
                              <Col md={6}>
                                <p className="mb-2">
                                  <span className="text-muted d-block">
                                    Voiture:
                                  </span>
                                  <strong>
                                    {selectedBonLivraison?.voiture ||
                                      "Non spécifié"}
                                  </strong>
                                </p>
                              </Col>
                              <Col md={6}>
                                <p className="mb-2">
                                  <span className="text-muted d-block">
                                    Série:
                                  </span>
                                  <strong>
                                    {selectedBonLivraison?.serie ||
                                      "Non spécifié"}
                                  </strong>
                                </p>
                              </Col>
                            </Row>
                            <Row>
                              <Col md={6}>
                                <p className="mb-2">
                                  <span className="text-muted d-block">
                                    Chauffeur:
                                  </span>
                                  <strong>
                                    {selectedBonLivraison?.chauffeur ||
                                      "Non spécifié"}
                                  </strong>
                                </p>
                              </Col>
                              <Col md={6}>
                                <p className="mb-2">
                                  <span className="text-muted d-block">
                                    CIN:
                                  </span>
                                  <strong>
                                    {selectedBonLivraison?.cin ||
                                      "Non spécifié"}
                                  </strong>
                                </p>
                              </Col>
                            </Row>
                          </CardBody>
                        </Card>
                        {selectedBonLivraison.notes && (
                          <Card className="border-0 shadow-sm mb-4">
                            <CardBody className="p-4">
                              <h6 className="fw-semibold mb-3 text-primary">
                                <i className="ri-sticky-note-line me-2"></i>
                                Notes
                              </h6>
                              <p className="mb-0 text-muted">
                                {selectedBonLivraison.notes}
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
                                  {selectedBonLivraison.articles.map(
                                    (item, index) => {
                                      const quantite =
                                        Number(item.quantite) || 0;
                                      const priceHT =
                                        Number(item.prix_unitaire) || 0;
                                      const tvaRate = Number(item.tva ?? 0);
                                      const remiseRate = Number(
                                        item.remise || 0
                                      );

                                      const priceTTC =
                                        Number(item.prix_ttc) ||
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
                                                  {item.designation || item.article?.designation} {/* Update this line */}
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
                                    if (!selectedBonLivraison) return null;

                                    // EXACT SAME CALCULATION LOGIC AS IN useMemo
                                    const articles = selectedBonLivraison.articles;
                                    const remiseValue = Number(selectedBonLivraison.remise) || 0;
                                    const remiseTypeValue = selectedBonLivraison.remiseType || "percentage";

                                    if (articles.length === 0) {
                                      return (
                                        <Table className="table-sm table-borderless mb-0">
                                          <tbody>
                                            <tr>
                                              <th className="text-end text-muted fs-6">Sous-total H.T.:</th>
                                              <td className="text-end fw-semibold fs-6">0,000 DT</td>
                                            </tr>
                                          </tbody>
                                        </Table>
                                      );
                                    }

                                    let sousTotalHTValue = 0;
                                    let netHTBeforeGlobalRemise = 0;
                                    let totalTaxValue = 0;
                                    let grandTotalValue = 0;

                                    // STEP 1: Calculate totals WITHOUT considering global remise
                                    articles.forEach((article) => {
                                      const qty = Number(article.quantite) || 0;
                                      const articleRemise = Number(article.remise) || 0;

                                      // Get unit prices
                                      let unitHT = Number(article.prix_unitaire) || 0;
                                      let unitTTC = Number(article.prix_ttc) || 0;

                                      // Handle if prix_ttc is not in database
                                      if (unitTTC === 0) {
                                        const tvaRate = Number(article.tva) || 0;
                                        unitTTC = unitHT * (1 + tvaRate / 100);
                                      }

                                      // Apply proper rounding
                                      unitHT = Math.round(unitHT * 1000) / 1000;
                                      unitTTC = Math.round(unitTTC * 1000) / 1000;

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

                                      sousTotalHTValue = Math.round(
                                        (sousTotalHTValue + montantSousTotalHT) * 1000
                                      ) / 1000;
                                      netHTBeforeGlobalRemise = Math.round(
                                        (netHTBeforeGlobalRemise + montantNetHTLigne) * 1000
                                      ) / 1000;
                                      totalTaxValue = Math.round((totalTaxValue + montantTVALigne) * 1000) / 1000;
                                      grandTotalValue = Math.round(
                                        (grandTotalValue + montantTTCLigne) * 1000
                                      ) / 1000;
                                    });

                                    // STEP 2: Apply global remise according to principle (EXACT SAME AS useMemo)
                                    let netHTAfterGlobalRemise = netHTBeforeGlobalRemise;
                                    let totalTaxAfterGlobalRemise = totalTaxValue;
                                    let finalTotalValue = grandTotalValue;
                                    let discountAmountValue = 0;
                                    let discountPercentageValue = 0;

                                    if (remiseValue > 0) {
                                      if (remiseTypeValue === "percentage") {
                                        discountPercentageValue = remiseValue;
                                        // ✅ Percentage remise: Apply on HT base
                                        discountAmountValue = Math.round(
                                          netHTBeforeGlobalRemise * (remiseValue / 100) * 1000
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
                                            netHTAfterGlobalRemise * tvaToHtRatio * 1000
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

                                        // ✅ CHECK IF SINGLE OR MULTIPLE TVA RATES
                                        const uniqueTvaRates = Array.from(
                                          new Set(articles.map((a) => Number(a.tva) || 0))
                                        );

                                        if (uniqueTvaRates.length === 1 && uniqueTvaRates[0] > 0) {
                                          // ✅ SINGLE TVA RATE FORMULA: Net HT = TTC / (1 + TVA rate)
                                          const tvaRate = uniqueTvaRates[0] / 100;
                                          netHTAfterGlobalRemise = Math.round((finalTotalValue / (1 + tvaRate)) * 1000) / 1000;
                                          totalTaxAfterGlobalRemise = Math.round((finalTotalValue - netHTAfterGlobalRemise) * 1000) / 1000;
                                        } else {
                                          // ✅ MULTIPLE TVA RATES: EXACT SAME CALCULATION
                                          const discountCoefficient = finalTotalValue / grandTotalValue;

                                          let newTotalHT = 0;
                                          let newTotalTVA = 0;

                                          articles.forEach((article) => {
                                            const qty = Number(article.quantite) || 0;
                                            const articleRemise = Number(article.remise) || 0;

                                            // Get unit prices
                                            let unitHT = Number(article.prix_unitaire) || 0;
                                            let unitTTC = Number(article.prix_ttc) || 0;

                                            // Handle if prix_ttc is not in database
                                            if (unitTTC === 0) {
                                              const tvaRate = Number(article.tva) || 0;
                                              unitTTC = unitHT * (1 + tvaRate / 100);
                                            }

                                            unitHT = Math.round(unitHT * 1000) / 1000;
                                            unitTTC = Math.round(unitTTC * 1000) / 1000;

                                            const lineHTAfterDiscount = qty * unitHT * (1 - articleRemise / 100);
                                            const newLineHT = lineHTAfterDiscount * discountCoefficient;
                                            const newLineTVA = newLineHT * (Number(article.tva) || 0) / 100;

                                            newTotalHT += newLineHT;
                                            newTotalTVA += newLineTVA;
                                          });

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

                                    // ✅ FINAL VALUES
                                    const displayNetHT = remiseValue > 0
                                      ? netHTAfterGlobalRemise
                                      : netHTBeforeGlobalRemise;

                                    const displayTotalTax = remiseValue > 0
                                      ? totalTaxAfterGlobalRemise
                                      : totalTaxValue;

                                    const displayFinalTotal = remiseValue > 0
                                      ? finalTotalValue
                                      : grandTotalValue;

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
                                            <tr className={`real-time-update ${discountPercentageValue > 10 ? "table-danger" : "table-success"}`}>
                                              <th className={`text-end fs-6 ${discountPercentageValue > 10 ? "text-danger" : "text-success"}`}>
                                                {remiseTypeValue === "percentage"
                                                  ? `Remise (${remiseValue}%)`
                                                  : `Remise (Montant fixe) ${discountPercentageValue.toFixed(2)}%`}
                                              </th>
                                              <td className={`text-end fw-bold fs-6 ${discountPercentageValue > 10 ? "text-danger" : "text-success"}`}>
                                                - {discountAmountValue.toFixed(3)} DT
                                              </td>
                                            </tr>
                                          )}
                                          <tr className="final-total real-time-update border-top">
                                            <th className="text-end fs-5">
                                              NET À PAYER:
                                            </th>
                                            <td className="text-end fw-bold fs-5 text-primary">
                                              {displayFinalTotal.toFixed(3)} DT
                                            </td>
                                          </tr>
                                          <tr className="real-time-update">
                                            <th className="text-end text-muted fs-6">
                                              Montant Payé:
                                            </th>
                                            <td className="text-end fw-semibold fs-6 text-success">
                                              {getSafeNumber(
                                                selectedBonLivraison.montantPaye
                                              ).toFixed(3)}{" "}
                                              DT
                                            </td>
                                          </tr>
                                          {getSafeNumber(selectedBonLivraison.montantRetenue) > 0 && (
                                            <tr className="real-time-update">
                                              <th className="text-end text-muted fs-6">
                                                Retenue à la source:
                                              </th>
                                              <td className="text-end text-info fw-bold fs-6">
                                                - {getSafeNumber(selectedBonLivraison.montantRetenue).toFixed(3)} DT
                                              </td>
                                            </tr>
                                          )}
                                          <tr className="real-time-update">
                                            <th className="text-end text-muted fs-6">
                                              Reste à Payer:
                                            </th>
                                            <td className="text-end fw-bold fs-6 text-danger">
                                              {Math.max(
                                                0,
                                                getSafeNumber(selectedBonLivraison.resteAPayer)
                                              ).toFixed(3)}{" "}
                                              DT
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
                        if (selectedBonLivraison) {
                          setBonLivraison(selectedBonLivraison);
                          setSelectedClient(
                            selectedBonLivraison.client || null
                          );
                          setSelectedArticles(
                            selectedBonLivraison.articles.map((item: any) => ({
                              article_id: item.article.id,
                              quantite: item.quantite,
                              prixUnitaire: parseFloat(item.prix_unitaire),
                              designation: item.designation || item.article?.designation || "", // Add this line

                              prixTTC:
                                parseFloat(item.prix_ttc) ||
                                parseFloat(item.prix_unitaire) *
                                (1 + (item.tva || 0) / 100),
                              tva:
                                item.tva != null ? parseFloat(item.tva) : null,
                              remise:
                                item.remise != null
                                  ? parseFloat(item.remise)
                                  : null,
                              articleDetails: item.article,
                            }))
                          );
                          setGlobalRemise(selectedBonLivraison.remise || 0);
                          setRemiseType(
                            (selectedBonLivraison.remiseType as
                              | "percentage"
                              | "fixed"
                              | undefined) ?? "percentage"
                          );
                          setShowRemise((selectedBonLivraison.remise || 0) > 0);
                          setIsCreatingFacture(true);
                          setIsEdit(false);
                          setTimbreFiscal(false);

                          // Initialize payment methods from BL if they exist
                          setMethodesReglement(
                            selectedBonLivraison.paymentMethods &&
                              selectedBonLivraison.paymentMethods.length > 0
                              ? selectedBonLivraison.paymentMethods.map(
                                (pm: any, index: number) => ({
                                  id: pm.id || `facture-bl-${index}`,
                                  method: pm.method,
                                  amount: pm.amount
                                    ? typeof pm.amount === "number"
                                      ? pm.amount.toFixed(3).replace(".", ",")
                                      : String(pm.amount)
                                    : "",
                                  numero: pm.numero || "",
                                  banque: pm.banque || "",
                                  dateEcheance: pm.dateEcheance || "",
                                  tauxRetention: pm.tauxRetention || 1,
                                })
                              )
                              : []
                          );
                          setEspaceNotes(selectedBonLivraison.espaceNotes || "");

                          validation.setValues({
                            ...validation.values,
                            numeroFacture: nextNumeroFacture,
                            client_id: selectedBonLivraison.client?.id ?? "",
                            vendeur_id: selectedBonLivraison.vendeur?.id ?? "",
                            dateFacture: moment().format("YYYY-MM-DD"),
                            // dateEcheance: "",
                            //  conditionPaiement: "",
                            status: "Brouillon",
                            notes: selectedBonLivraison.notes ?? "",
                            isCreatingFacture: true,
                          });

                          setModal(true);
                        }
                      }}
                      className="btn-invoice btn-invoice-success me-2"
                    >
                      <i className="ri-file-text-line me-2"></i> Créer Facture
                    </Button>

                    <Button
                      color="primary"
                      onClick={() => {
                        setSelectedBonLivraisonForValorisation(
                          selectedBonLivraison
                        );
                        setValorisationModal(true);
                      }}
                      className="btn-invoice btn-invoice-primary me-2"
                      disabled={!selectedBonLivraison}
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
                        <i className="ri-truck-line text-primary fs-4"></i>
                      </div>
                      <div>
                        <h4 className="mb-0 fw-bold text-dark">
                          {isCreatingFacture
                            ? "Créer Facture"
                            : isEdit
                              ? "Modifier Bon de Livraison"
                              : "Créer Bon de Livraison"}
                        </h4>
                        <small className="text-muted">
                          {isCreatingFacture
                            ? "Créer une facture à partir de ce bon de livraison"
                            : isEdit
                              ? "Modifier les détails du bon de livraison existant"
                              : "Créer un nouveau bon de livraison"}
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
                      {/* Header Information Section */}
                      <Card className="border-0 shadow-sm mb-4">
                        <CardBody className="p-4">
                          <h5 className="fw-semibold mb-4 text-primary">
                            <i className="ri-information-line me-2"></i>
                            Informations Générales
                          </h5>

                          {/* Ligne unique avec Numéro, Date et Timbre */}
                          <Row className="align-items-end">
                            {isCreatingFacture ? (
                              <>
                                {/* Numéro de Facture */}
                                <Col md={4}>
                                  <div className="mb-3">
                                    <Label className="form-label-lg fw-semibold">
                                      Numéro de Facture*
                                    </Label>
                                    <Input
                                      name="numeroFacture"
                                      value={validation.values.numeroFacture}
                                      onChange={validation.handleChange}
                                      invalid={
                                        validation.touched.numeroFacture &&
                                        !!validation.errors.numeroFacture
                                      }
                                      className="form-control-lg"
                                      placeholder="FAC-2024-001"
                                    />
                                    <FormFeedback className="fs-6">
                                      {validation.errors.numeroFacture}
                                    </FormFeedback>
                                  </div>
                                </Col>

                                {/* Date de Facture */}
                                <Col md={3}>
                                  <div className="mb-3">
                                    <Label className="form-label-lg fw-semibold">
                                      Date de Facture*
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
                                    <FormFeedback className="fs-6">
                                      {validation.errors.dateFacture as string}
                                    </FormFeedback>
                                  </div>
                                </Col>

                                {/* Timbre Fiscal */}
                                <Col md={5}>
                                  <div className="mb-3">
                                    <Label className="form-label-lg fw-semibold mb-2">
                                      Timbre Fiscal
                                    </Label>
                                    <div className="d-flex align-items-center gap-3 p-3 bg-light rounded border h-100">
                                      {/* Checkbox */}
                                      <div className="form-check mb-0">
                                        <Input
                                          type="checkbox"
                                          id="timbreFiscal"
                                          checked={timbreFiscal}
                                          onChange={(e) =>
                                            setTimbreFiscal(e.target.checked)
                                          }
                                          className="form-check-input"
                                          style={{
                                            width: "20px",
                                            height: "20px",
                                            cursor: "pointer",
                                          }}
                                        />
                                      </div>

                                      {/* Icône et texte */}
                                      <div className="d-flex align-items-center gap-2 flex-grow-1">
                                        <i className="ri-stamp-line text-warning fs-5"></i>
                                        <div>
                                          <Label
                                            for="timbreFiscal"
                                            className="form-check-label mb-0 fw-semibold fs-6 cursor-pointer"
                                          >
                                            Timbre Fiscal
                                          </Label>
                                          <div className="timbre-description">
                                            <small className="text-muted">
                                              +1.000 DT ajouté au total
                                            </small>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Badge du montant */}
                                      <div className="timbre-amount">
                                        <Badge
                                          color={
                                            timbreFiscal
                                              ? "success"
                                              : "secondary"
                                          }
                                          className="fs-6 px-3 py-2"
                                        >
                                          {timbreFiscal
                                            ? "+1.000 DT"
                                            : "Désactivé"}
                                        </Badge>
                                      </div>
                                    </div>
                                  </div>
                                </Col>
                              </>
                            ) : (
                              <>
                                {/* Numéro de Livraison */}
                                <Col md={4}>
                                  <div className="mb-3">
                                    <Label className="form-label-lg fw-semibold">
                                      Numéro de Livraison*
                                    </Label>
                                    <Input
                                      name="numeroLivraison"
                                      value={validation.values.numeroLivraison}
                                      onChange={validation.handleChange}
                                      invalid={
                                        validation.touched.numeroLivraison &&
                                        !!validation.errors.numeroLivraison
                                      }
                                      readOnly={isEdit}
                                      className="form-control-lg"
                                      placeholder="LIV-2024-001"
                                    />
                                    <FormFeedback className="fs-6">
                                      {validation.errors.numeroLivraison}
                                    </FormFeedback>
                                  </div>
                                </Col>

                                {/* Date de Livraison */}
                                <Col md={4}>
                                  <div className="mb-3">
                                    <Label className="form-label-lg fw-semibold">
                                      Date de Livraison*
                                    </Label>
                                    <Input
                                      type="date"
                                      name="dateLivraison"
                                      value={validation.values.dateLivraison}
                                      onChange={validation.handleChange}
                                      invalid={
                                        validation.touched.dateLivraison &&
                                        !!validation.errors.dateLivraison
                                      }
                                      className="form-control-lg"
                                    />
                                    <FormFeedback className="fs-6">
                                      {
                                        validation.errors
                                          .dateLivraison as string
                                      }
                                    </FormFeedback>
                                  </div>
                                </Col>

                                {/* Espace vide pour alignement */}
                                <Col md={4}>
                                  {/* Espace réservé pour maintenir l'alignement */}
                                </Col>
                              </>
                            )}
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
                              {/* Client Search Section */}
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

                      {/* Global Discount Section  :      <Card className="border-0 shadow-sm mb-4">
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
      </Card>*/}

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

                            {/* Article Dropdown Results */}
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
                                          className="align-middle"
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
                                                  className="form-control bg-light border-0"
                                                  style={{
                                                    resize: "none",
                                                    fontSize: "0.85rem",
                                                    minHeight: "38px",
                                                    backgroundColor: "white"
                                                  }}
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
                                              className="table-input text-end"
                                              style={{
                                                width: "100%",
                                                fontSize: "0.9rem",
                                              }}
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
                                        {showRemise && globalRemise > 0 && (
                                          <tr className={`real-time-update ${discountPercentage > 10 ? "table-danger" : "table-success"}`}>
                                            <th className={`text-end fs-6 ${discountPercentage > 10 ? "text-danger" : "text-success"}`}>
                                              {remiseType === "percentage"
                                                ? `Remise (${globalRemise}%)`
                                                : `Remise (Montant fixe) ${discountPercentage.toFixed(2)}%`}
                                            </th>
                                            <td className={`text-end fw-bold fs-6 ${discountPercentage > 10 ? "text-danger" : "text-success"}`}>
                                              - {discountAmount.toFixed(3)} DT
                                            </td>
                                          </tr>
                                        )}

                                        {/* Timbre Fiscal for Factures */}
                                        {isCreatingFacture && timbreFiscal && (
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

                      {/* Delivery Information Section */}
                      {/* Delivery Information Section */}
                      <Card className="border-0 shadow-sm">
                        <CardBody className="p-4">
                          <h5 className="fw-semibold mb-3 text-primary">
                            <i className="ri-truck-line me-2"></i>
                            Informations de Livraison
                          </h5>

                          <Row>
                            <Col md={6}>
                              <div className="mb-3">
                                <Label className="form-label-lg fw-semibold">
                                  Voiture
                                </Label>
                                <Input
                                  type="text"
                                  value={livraisonInfo.voiture}
                                  onChange={(e) =>
                                    setLivraisonInfo({
                                      ...livraisonInfo,
                                      voiture: e.target.value,
                                    })
                                  }
                                  placeholder="Ex: Berlingo"
                                  className="form-control-lg"
                                />
                              </div>
                            </Col>
                            <Col md={6}>
                              <div className="mb-3">
                                <Label className="form-label-lg fw-semibold">
                                  Série
                                </Label>
                                <Input
                                  type="text"
                                  value={livraisonInfo.serie}
                                  onChange={(e) =>
                                    setLivraisonInfo({
                                      ...livraisonInfo,
                                      serie: e.target.value,
                                    })
                                  }
                                  placeholder="Ex: 156 TN 8972"
                                  className="form-control-lg"
                                />
                              </div>
                            </Col>
                          </Row>
                          <Row>
                            <Col md={6}>
                              <div className="mb-3">
                                <Label className="form-label-lg fw-semibold">
                                  Chauffeur
                                </Label>
                                <Input
                                  type="text"
                                  value={livraisonInfo.chauffeur}
                                  onChange={(e) =>
                                    setLivraisonInfo({
                                      ...livraisonInfo,
                                      chauffeur: e.target.value,
                                    })
                                  }
                                  placeholder="Ex: Farouk Harbeuge"
                                  className="form-control-lg"
                                />
                              </div>
                            </Col>
                            <Col md={6}>
                              <div className="mb-3">
                                <Label className="form-label-lg fw-semibold">
                                  CIN
                                </Label>
                                <Input
                                  type="text"
                                  value={livraisonInfo.cin}
                                  onChange={(e) =>
                                    setLivraisonInfo({
                                      ...livraisonInfo,
                                      cin: e.target.value,
                                    })
                                  }
                                  placeholder="Ex: 12345678"
                                  className="form-control-lg"
                                />
                              </div>
                            </Col>
                          </Row>
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

                                    {/* Montant (Calculé ou saisi) */}
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
                                          // Only allow editing if not retention
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

                                    {/* Taux de retenue (uniquement si retenue) */}
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

                                    {/* Informations pour Chèque et Traite */}
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

                              {/* Espace pour les notes */}
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




      <Modal
        isOpen={paiementModal}
        toggle={() => setPaiementModal(false)}
        centered
        className="invoice-modal"
      >
        <ModalHeader toggle={() => setPaiementModal(false)}>
          Ajouter Paiement - Bon #{selectedBonForPaiement?.numeroLivraison}
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
                  // Use the pre-computed resteAPayer from fetchData (authoritative)
                  const reste = Math.max(
                    0,
                    getSafeNumber(selectedBonForPaiement.resteAPayer)
                  );
                  return reste.toFixed(3).replace(".", ",");
                })()}{" "}
                DT
              </strong>

              {getSafeNumber(selectedBonForPaiement?.montantRetenue) > 0 && (
                <div className="mt-1">
                  <small className="text-muted">
                    <i className="ri-information-line me-1"></i>
                    Retenue à la source: {getSafeNumber(selectedBonForPaiement?.montantRetenue).toFixed(3)} DT
                  </small>
                </div>
              )}

              {getSafeNumber(selectedBonForPaiement?.montantPaye) > 0 && (
                <div className="mt-1">
                  <small className="text-success">
                    <i className="ri-information-line me-1"></i>
                    TOTAL PAYÉ: {getSafeNumber(selectedBonForPaiement?.montantPaye).toFixed(3)} DT
                  </small>
                </div>
              )}
            </div>

            {/* Liste des paiements successifs enregistrés (PaiementClient) */}
            {selectedBonForPaiement?.paiements &&
              selectedBonForPaiement.paiements.filter(
                (p: any) => p.modePaiement !== "Retention"
              ).length > 0 && (
                <div className="mb-3 p-2 bg-light rounded">
                  <small className="text-muted d-block mb-2">
                    Historique des paiements:
                  </small>
                  {selectedBonForPaiement.paiements
                    .filter((p: any) => p.modePaiement !== "Retention")
                    .map((p: any, index: number) => (
                      <div key={index} className="mb-1">
                        <span className="text-muted">• </span>
                        <span>
                          {p.modePaiement} de {Number(p.montant).toFixed(3)} DT
                          {p.date &&
                            ` le ${moment(p.date).format("DD/MM/YYYY")}`}
                          {p.numeroCheque && ` (Chèque N°${p.numeroCheque})`}
                          {p.banque && ` - ${p.banque}`}
                          {p.numeroTraite && ` (Traite N°${p.numeroTraite})`}
                        </span>
                      </div>
                    ))}
                </div>
              )}

            {/* Méthodes de règlement fixées à l'avance (JSON column) */}
            {selectedBonForPaiement?.paymentMethods && selectedBonForPaiement.paymentMethods.filter((pm: any) => pm.method !== "retenue").length > 0 && (
              <div className="mb-3 p-2 bg-light rounded">
                <small className="text-muted d-block mb-2">Méthodes de règlement (fixes):</small>
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


      {/* Add this modal after your existing modals but before the PDF modal */}
      <Modal
        isOpen={valorisationModal}
        toggle={() => setValorisationModal(false)}
        centered
      >
        <ModalHeader toggle={() => setValorisationModal(false)}>
          Options d'impression
        </ModalHeader>
        <ModalBody>
          <div className="text-center">
            <h5 className="mb-4">Choisir le type de bon de livraison</h5>
            <div className="row">
              <div className="col-6">
                <div
                  className={`card border-2 ${isValorise ? "border-primary" : "border-light"
                    } cursor-pointer`}
                  onClick={() => setIsValorise(true)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="card-body text-center">
                    <i className="ri-money-euro-circle-line text-primary fs-1 mb-3"></i>
                    <h6 className="card-title">Valorisé</h6>
                    <p className="text-muted small">Avec montants et totaux</p>
                  </div>
                </div>
              </div>
              <div className="col-6">
                <div
                  className={`card border-2 ${!isValorise ? "border-primary" : "border-light"
                    } cursor-pointer`}
                  onClick={() => setIsValorise(false)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="card-body text-center">
                    <i className="ri-file-list-line text-secondary fs-1 mb-3"></i>
                    <h6 className="card-title">Non Valorisé</h6>
                    <p className="text-muted small">Sans montants ni totaux</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color="light" onClick={() => setValorisationModal(false)}>
            Annuler
          </Button>
          <Button
            color="primary"
            onClick={() => {
              if (selectedBonLivraisonForValorisation) {
                setSelectedBonLivraisonForPdf(
                  selectedBonLivraisonForValorisation
                );
                setPdfModal(true);
              }
              setValorisationModal(false);
            }}
          >
            <i className="ri-file-pdf-line me-2"></i>
            Générer PDF
          </Button>
        </ModalFooter>
      </Modal>

      {selectedBonLivraisonForPdf && (
        <BonLivraisonPDFModal
          isOpen={pdfModal}
          toggle={() => setPdfModal(false)}
          bonLivraison={selectedBonLivraisonForPdf}
          companyInfo={companyInfo}
          isValorise={isValorise}
        />
      )}
    </div>
  );
};

export default BonLivraisonList;
