import React, { Fragment, useEffect, useState, useMemo, useCallback, useRef } from "react";
import {
    Card, CardBody, Col, Container, CardHeader, Row, Modal, ModalHeader, Nav,
    NavItem, NavLink, Form, ModalBody, ModalFooter, Label, Input, FormFeedback,
    Badge, Table, Button, InputGroupText, InputGroup, FormGroup
} from "reactstrap";
import { Link } from "react-router-dom";
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import TableContainer from "../../../Components/Common/TableContainer";
import DeleteModal from "../../../Components/Common/DeleteModal";
import Loader from "../../../Components/Common/Loader";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import * as Yup from "yup";
import { useFormik } from "formik";
import moment from "moment";
import Flatpickr from "react-flatpickr";
import {
    fetchBonsReceptionPaginated, createBonReception, updateBonReception, deleteBonReception,
    fetchNextReceptionNumberFromAPI
} from "../../../Components/BonReception/BonReceptionServices";
import { fetchFournisseurs, fetchCategories, searchArticles, searchFournisseurs } from "../../../Components/Article/ArticleServices";
import { createFacture, fetchNextFactureNumberFromAPI } from "../../../Components/Article/FactureServices";
import { Article, Fournisseur, BonReception, Depot } from "../../../Components/Article/Interfaces";
import { fetchDepots, findMagazinDepot } from "../Stock/DepotServices";
import classnames from "classnames";
import CreateArticleModal from "./CreateArticleModal";
import EditArticleModal from "./EditArticleModal";
import QuantiteArticleModal from "./QuantiteArticleModal";
import AchatDocumentPDFModal from "./AchatDocumentPDFModal";
import { AchatDocumentPDFProps } from "./AchatDocumentPDF";
import { calculateAchatTotals, toAchatCalcLine, toSelectedArticle } from "./AchatCalculations";
import { calculateDocumentTotals, calculateLineTotals } from "../../../Utils/CalculationEngine";
import { useProfile } from "Components/Hooks/UserHooks";
import logo from "../../../assets/images/imglogo.png";

// Status sent to the server for each tab (same as the ventes lists)
const statusForTab: Record<string, string> = {
    "1": "",
    "2": "Brouillon",
    "3": "Recu",
    "4": "Partiellement Recu",
    "5": "Annule",
};

const BonReceptionList = () => {
    const [detailModal, setDetailModal] = useState(false);
    const [factureModal, setFactureModal] = useState(false);
    const [selectedBonReception, setSelectedBonReception] = useState<BonReception | null>(null);
    const [activeTab, setActiveTab] = useState("1");
    const [modal, setModal] = useState(false);
    const [bonsReception, setBonsReception] = useState<BonReception[]>([]);
    const [bonReception, setBonReception] = useState<BonReception | null>(null);
    // Server-side pagination (same as the ventes lists)
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    // Only loaded when the create/edit article modal is opened
    const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const articleModalDataLoaded = useRef(false);
    const [articlesLoading, setArticlesLoading] = useState(false);
    const [fournisseursLoading, setFournisseursLoading] = useState(false);
    // Article picked in the search, waiting for its quantity
    const [articleToAdd, setArticleToAdd] = useState<Article | null>(null);
    const [pdfDocument, setPdfDocument] = useState<AchatDocumentPDFProps | null>(null);
    const { userProfile } = useProfile();
    const [isEdit, setIsEdit] = useState(false);
    const [isCreatingFacture, setIsCreatingFacture] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [searchText, setSearchText] = useState("");
    const [articleSearch, setArticleSearch] = useState("");
    const [fournisseurSearch, setFournisseurSearch] = useState("");
    const [selectedFournisseur, setSelectedFournisseur] = useState<Fournisseur | null>(null);
    const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
    const [filteredFournisseurs, setFilteredFournisseurs] = useState<Fournisseur[]>([]);
    // Keyboard navigation for the article search dropdown (same UX as Commande/Facture/Vente)
    const [focusedIndex, setFocusedIndex] = useState(-1);
    const [dropdownRef, setDropdownRef] = useState<HTMLDivElement | null>(null);
    const [itemRefs, setItemRefs] = useState<React.RefObject<HTMLLIElement>[]>([]);
 // Add these states near your other useState declarations
const [editingTTC, setEditingTTC] = useState<{ [key: number]: string }>({});
const [editingHT, setEditingHT] = useState<{ [key: number]: string }>({});

const [selectedArticles, setSelectedArticles] = useState<{
  article_id: number;
  quantite: number | ""; // Allow empty string
  prixUnitaire: number;
  prixTTC: number; // Add this field
  tva?: number | null;
  remise?: number | null;
  articleDetails?: Article;
  designation?: string;
}[]>([]);

    const [showRemise, setShowRemise] = useState(false);
    const [remiseType, setRemiseType] = useState<"percentage" | "fixed">("percentage");
    const [globalRemise, setGlobalRemise] = useState<number>(0);
    const [nextNumeroFacture, setNextNumeroFacture] = useState("");
    const [nextNumeroReception, setNextNumeroReception] = useState("");
    const [timbreFiscal, setTimbreFiscal] = useState<boolean>(false);
    const [depots, setDepots] = useState<Depot[]>([]);
    const [selectedDepot, setSelectedDepot] = useState<Depot | null>(null);
    // "magazin": preselected on every new bon, and for old bons saved without depot
    const [defaultDepot, setDefaultDepot] = useState<Depot | null>(null);

    // Modals for article creation/edition
    const [createArticleModal, setCreateArticleModal] = useState(false);
    const [editArticleModal, setEditArticleModal] = useState(false);
    const [articleToEdit, setArticleToEdit] = useState<Article | null>(null);

    const conditionPaiementOptions = [
        { value: "7", label: "7 jours" },
        { value: "15", label: "15 jours" },
        { value: "30", label: "30 jours" },
        { value: "60", label: "60 jours" },
        { value: "90", label: "90 jours" }
    ];

    const tvaOptions = [
        { value: null, label: "Non applicable" },
        { value: 0, label: "0% (Exonéré)" },
        { value: 7, label: "7%" },
        { value: 10, label: "10%" },
        { value: 13, label: "13%" },
        { value: 19, label: "19%" },
        { value: 21, label: "21%" }
    ];

// Add these helper functions
const formatForDisplay = (value: number | string | undefined | null): string => {
    if (value === undefined || value === null) return "0,000";
    const numericValue = typeof value === "string" ? parseFloat(value.replace(",", ".")) : Number(value);
    if (isNaN(numericValue)) return "0,000";
    return numericValue.toFixed(3).replace(".", ",");
  };
  
  const parseNumericInput = (value: string): number => {
    if (!value || value === "") return 0;
    const cleanValue = value.replace(",", ".");
    const numericValue = parseFloat(cleanValue);
    return isNaN(numericValue) ? 0 : Math.round(numericValue * 1000) / 1000;
  };
  // Article search on the server, debounced (same as the ventes pages)
  useEffect(() => {
    if (articleSearch.length < 1) {
      setFilteredArticles([]);
      setFocusedIndex(-1);
      setItemRefs([]);
      return;
    }
    let active = true;
    const timer = setTimeout(async () => {
      setArticlesLoading(true);
      try {
        const result = await searchArticles({ query: articleSearch, page: 1, limit: 20 });
        if (active) setFilteredArticles(result.articles || []);
      } catch (err) {
        console.error("Failed to load articles:", err);
      } finally {
        if (active) {
          setArticlesLoading(false);
          // Reset keyboard focus whenever the result set changes
          setFocusedIndex(-1);
          setItemRefs([]);
        }
      }
    }, 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [articleSearch]);

  // Scroll the focused item into view as the user navigates with arrow keys
  useEffect(() => {
    if (focusedIndex >= 0 && itemRefs[focusedIndex]?.current && dropdownRef) {
      const item = itemRefs[focusedIndex].current!;
      const dropdown = dropdownRef;
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
  }, [focusedIndex, dropdownRef, itemRefs]);
  
  // Fournisseur search on the server, debounced (same as the ventes client search)
  useEffect(() => {
    if (fournisseurSearch.length < 1) {
      setFilteredFournisseurs([]);
      return;
    }
    let active = true;
    const timer = setTimeout(async () => {
      setFournisseursLoading(true);
      try {
        const result = await searchFournisseurs({ query: fournisseurSearch, page: 1, limit: 20 });
        if (active) setFilteredFournisseurs(result.fournisseurs || []);
      } catch (err) {
        console.error("Failed to load fournisseurs:", err);
      } finally {
        if (active) setFournisseursLoading(false);
      }
    }, 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [fournisseurSearch]);

    // One page of bons, filtered on the server (same as the ventes lists)
    const fetchData = useCallback(async (page = currentPage, limit = pageSize) => {
        try {
            setLoading(true);
            const result = await fetchBonsReceptionPaginated({
                page,
                limit,
                search: searchText || undefined,
                status: statusForTab[activeTab] || undefined,
                startDate: startDate ? moment(startDate).format("YYYY-MM-DD") : undefined,
                endDate: endDate ? moment(endDate).format("YYYY-MM-DD") : undefined,
            });

            setBonsReception(result.bons);
            setTotalCount(result.pagination.totalCount);
            setCurrentPage(result.pagination.page);
            setPageSize(limit);
            setError(null);
            setLoading(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Échec du chargement des données");
            setLoading(false);
        }
    }, [searchText, activeTab, startDate, endDate, currentPage, pageSize]);

    // Depots are few: loaded once, with the "magazin" one selected by default
    useEffect(() => {
        fetchDepots()
            .then((depotsData) => {
                setDepots(depotsData);
                const magazinDepot = findMagazinDepot(depotsData);
                setDefaultDepot(magazinDepot);
                setSelectedDepot((current) => current || magazinDepot);
            })
            .catch((err) => console.error("Failed to load depots:", err));
    }, []);

    // First load, then reload page 1 when a filter changes (debounced for the search text)
    const isFirstRender = useRef(true);
    useEffect(() => {
        const timer = setTimeout(() => fetchData(1, pageSize), isFirstRender.current ? 0 : 400);
        isFirstRender.current = false;
        return () => clearTimeout(timer);
    }, [searchText, activeTab, startDate, endDate]);

    // Fournisseurs and categories are only needed by the create/edit article modals
    const loadArticleModalData = useCallback(async () => {
        if (articleModalDataLoaded.current) return;
        try {
            const [fournisseursData, categoriesData] = await Promise.all([fetchFournisseurs(), fetchCategories()]);
            setFournisseurs(fournisseursData);
            setCategories(categoriesData);
            articleModalDataLoaded.current = true;
        } catch (err) {
            console.error("Failed to load fournisseurs/categories:", err);
        }
    }, []);

    const companyInfo = useMemo(() => ({
        name: userProfile?.company_name || "Votre Société",
        address: userProfile?.company_address || "Adresse",
        city: userProfile?.company_city || "Ville",
        phone: userProfile?.company_phone || "Téléphone",
        gsm: userProfile?.company_gsm || "Téléphone",
        email: userProfile?.company_email || "Email",
        website: userProfile?.company_website || "Site web",
        taxId: userProfile?.company_tax_id || "MF",
        logo: logo,
    }), [userProfile]);

    const openPdf = (bon: BonReception) => {
        setPdfDocument({
            title: "BON DE RÉCEPTION",
            documentLabel: "bon de réception",
            numero: bon.numeroReception,
            date: bon.dateReception,
            dateLabel: "Date Réception",
            fournisseur: bon.fournisseur,
            depot: bon.depot,
            notes: bon.notes,
            articles: bon.articles || [],
            remise: bon.remise,
            remiseType: bon.remiseType,
            companyInfo,
        });
    };

    const fetchNextFactureNumber = useCallback(async () => {
        try {
            const numero = await fetchNextFactureNumberFromAPI();
            setNextNumeroFacture(numero);
        } catch (err) {
            toast.error("Échec de la récupération du numéro de facture");
            const year = moment().format('YYYY');
            const nextNum = `FAC-${String(totalCount + 1).padStart(4, '0')}/${year}`;
            setNextNumeroFacture(nextNum);
        }
    }, [totalCount]);

    const fetchNextReceptionNumber = useCallback(async () => {
        try {
            const numero = await fetchNextReceptionNumberFromAPI();
            setNextNumeroReception(numero);
        } catch (err) {
            toast.error("Échec de la récupération du numéro de réception");
            const year = moment().format('YYYY');
            const nextNum = `REC-${String(totalCount + 1).padStart(4, '0')}/${year}`;
            setNextNumeroReception(nextNum);
        }
    }, [totalCount]);

    useEffect(() => {
        if (modal && !isEdit && !isCreatingFacture) {
            fetchNextReceptionNumber();
        }
        if (factureModal && !isEdit) {
            fetchNextFactureNumber();
        }
    }, [modal, factureModal, isEdit, isCreatingFacture, fetchNextReceptionNumber, fetchNextFactureNumber]);

    const openDetailModal = (bonReception: BonReception) => {
        setSelectedBonReception(bonReception);
        setDetailModal(true);
    };

    // Same calculation engine as the ventes pages
    const { sousTotalHT, netHT, totalTax, grandTotal, finalTotal, discountAmount, discountPercentage, netAPayer } = useMemo(
        () =>
            calculateDocumentTotals(
                {
                    articles: selectedArticles,
                    remise: showRemise ? globalRemise : 0,
                    remiseType,
                    timbreFiscal: isCreatingFacture && timbreFiscal,
                },
                { editingHT, editingTTC }
            ),
        [selectedArticles, showRemise, globalRemise, remiseType, editingHT, editingTTC, isCreatingFacture, timbreFiscal]
    );

    const handleDelete = async () => {
        if (!bonReception) return;

        try {
            await deleteBonReception(bonReception.id);
            setDeleteModal(false);
            fetchData();
            toast.success("Bon de réception supprimé avec succès");
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Échec de la suppression");
        }
    };

    const handleSubmit = async (values: any) => {
        try {
          const articlesWithQuantities = selectedArticles.map(item => ({
            ...item,
            quantite: item.quantite === "" ? 0 : Number(item.quantite) // Convert empty to 0 for submission
          }));
      
          // Check if any article has quantity 0 or empty
          const hasEmptyQuantities = articlesWithQuantities.some(item => item.quantite <= 0);
          if (hasEmptyQuantities) {
            toast.error("Tous les articles doivent avoir une quantité supérieure à 0");
            return;
          }
      
          const receptionData = {
            ...values,
            articles: articlesWithQuantities.map((item) => ({
              article_id: item.article_id,
              quantite: item.quantite,
              prix_unitaire: item.prixUnitaire,
              prix_ttc: item.prixTTC,
              tva: item.tva,
              remise: item.remise
            })),
            remise: showRemise ? globalRemise : 0,
            remiseType: remiseType,
            totalHT: sousTotalHT,
            totalTVA: totalTax,
            totalTTC: grandTotal,
            totalTTCAfterRemise: finalTotal,
            depot_id: values.depot_id || selectedDepot?.id,
            timbreFiscal: isCreatingFacture ? timbreFiscal : false
          };
      
          if (isCreatingFacture) {
            receptionData.bonReception_id = bonReception?.id;
            await createFacture(receptionData);
            toast.success("Facture créée avec succès");
          } else {
            if (isEdit && bonReception) {
              await updateBonReception(bonReception.id, receptionData);
              toast.success("Bon de réception mis à jour avec succès");
            } else {
              await createBonReception(receptionData);
              toast.success("Bon de réception créé avec succès");
            }
          }
          setModal(false);
          setFactureModal(false);
          fetchData();
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Échec de l'opération");
        }
      };

    const validation = useFormik({
        enableReinitialize: true,
        initialValues: {
            numeroReception: isEdit ? (bonReception?.numeroReception || "") : nextNumeroReception,
            numeroFacture: isCreatingFacture ? nextNumeroFacture : "",
            fournisseur_id: bonReception?.fournisseur?.id ?? "",
            dateReception: bonReception?.dateReception ? moment(bonReception.dateReception).format("YYYY-MM-DD") : moment().format("YYYY-MM-DD"),
            dateFacture: moment().format("YYYY-MM-DD"),
            //dateEcheance ,
           // conditionPaiement: "",
            notes: bonReception?.notes ?? "",
            depot_id: bonReception?.depot?.id ?? "",
            isCreatingFacture: isCreatingFacture
        },
        validationSchema: Yup.object({
            numeroReception: Yup.string().when('isCreatingFacture', {
                is: false,
                then: (schema) => schema.required("Le numéro est requis")
            }),
            numeroFacture: Yup.string().when('isCreatingFacture', {
                is: true,
                then: (schema) => schema.required("Le numéro de facture est requise")
            }),
            fournisseur_id: Yup.number().required("Le fournisseur est requis"),
            dateReception: Yup.date().when('isCreatingFacture', {
                is: false,
                then: (schema) => schema.required("La date est requise")
            }),
            dateFacture: Yup.date().when('isCreatingFacture', {
                is: true,
                then: (schema) => schema.required("La date de facture est requise")
            }),
            // The default depot is selected in the dropdown without going through the form value
            depot_id: selectedDepot ? Yup.mixed() : Yup.number().required("Le dépôt est requis"),
        }),
        onSubmit: handleSubmit
    });

    const toggleModal = useCallback(() => {
        if (modal) {
            setModal(false);
            setBonReception(null);
            setSelectedArticles([]);
            setSelectedFournisseur(null);
            setGlobalRemise(0);
            setRemiseType("percentage");
            setShowRemise(false);
            setIsCreatingFacture(false);
            setTimbreFiscal(false);
            validation.resetForm();
        } else {
            setModal(true);
        }
    }, [modal]);
    
    const toggleFactureModal = useCallback(() => {
        if (factureModal) {
            setFactureModal(false);
            setBonReception(null);
            setSelectedArticles([]);
            setSelectedFournisseur(null);
            setGlobalRemise(0);
            setRemiseType("percentage");
            setShowRemise(false);
            setIsCreatingFacture(false);
            setTimbreFiscal(false);
            validation.resetForm();
        } else {
            setFactureModal(true);
        }
    }, [factureModal]);

    // Picking an article (click or Enter) first asks its quantity in a small modal
    const handleAddArticle = (article: Article) => {
        setArticleToAdd(article);
        setArticleSearch("");
        setFilteredArticles([]);
        setFocusedIndex(-1);
    };

    const confirmAddArticle = (quantite: number) => {
        const article = articleToAdd;
        if (!article) return;
        setArticleToAdd(null);
        setSelectedArticles((prev) => {
            // Already on the bon: the quantity is added to its line
            if (prev.some((item) => item.article_id === article.id)) {
                return prev.map((item) =>
                    item.article_id === article.id
                        ? { ...item, quantite: (Number(item.quantite) || 0) + quantite }
                        : item
                );
            }
            const initialHT = Number(article.pua_ht) || 0;
            const initialTVA = article.tva || 0;
            const initialTTC = Number(article.pua_ttc) || initialHT * (1 + initialTVA / 100);
            return [
                ...prev,
                {
                    article_id: article.id,
                    quantite,
                    prixUnitaire: initialHT,
                    prixTTC: Math.round(initialTTC * 1000) / 1000,
                    tva: initialTVA,
                    remise: 0,
                    articleDetails: article,
                    designation: article.designation || ""
                }
            ];
        });
    };

    // Keyboard navigation for the article search input (Arrow Up/Down, Enter, Escape)
    const handleArticleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (filteredArticles.length === 0) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setFocusedIndex((prev) => (prev < filteredArticles.length - 1 ? prev + 1 : 0));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setFocusedIndex((prev) => (prev > 0 ? prev - 1 : filteredArticles.length - 1));
        } else if (e.key === "Enter") {
            e.preventDefault();
            // If nothing highlighted yet, pick the first result
            const article = focusedIndex >= 0 ? filteredArticles[focusedIndex] : filteredArticles[0];
            if (article) {
                handleAddArticle(article);
            }
        } else if (e.key === "Escape") {
            e.preventDefault();
            setArticleSearch("");
            setFilteredArticles([]);
            setFocusedIndex(-1);
        }
    };

    const handleRemoveArticle = (articleId: number) => {
        setSelectedArticles(selectedArticles.filter(item => item.article_id !== articleId));
    };

    const handleArticleChange = (articleId: number, field: string, value: any) => {
        setSelectedArticles(prevArticles => 
          prevArticles.map((item) => {
            if (item.article_id === articleId) {
              const updatedItem = { ...item, [field]: value };
              
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

    const StatusBadge = ({ status }: { status?: "Brouillon" | "Recu" | "Partiellement Recu" | "Annule" | "Validee" | "Payee" }) => {
        const statusConfig = {
            "Brouillon": { bgClass: "bg-warning", textClass: "text-warning", icon: "ri-time-line" },
            "Recu": { bgClass: "bg-success", textClass: "text-success", icon: "ri-checkbox-circle-line" },
            "Partiellement Recu": { bgClass: "bg-info", textClass: "text-info", icon: "ri-truck-line" },
            "Annule": { bgClass: "bg-danger", textClass: "text-danger", icon: "ri-close-circle-line" },
            "Validee": { bgClass: "bg-primary", textClass: "text-primary", icon: "ri-checkbox-circle-line" },
            "Payee": { bgClass: "bg-success", textClass: "text-success", icon: "ri-money-dollar-circle-line" }
        };

        if (!status) return null;

        const config = statusConfig[status] || statusConfig["Brouillon"];

        return (
            <span className={`badge ${config.bgClass}-subtle ${config.textClass} text-uppercase`}>
                <i className={`${config.icon} align-bottom me-1`}></i>
                {status}
            </span>
        );
    };

    const columns = useMemo(
        () => [
            {
                header: "Numéro",
                accessorKey: "numeroReception",
                enableColumnFilter: false,
                cell: (cell: any) => (
                    <Link to="#" className="text-body fw-medium" onClick={() => openDetailModal(cell.row.original)}>
                        {cell.getValue()}
                    </Link>
                ),
            },
            {
                header: "Date",
                accessorKey: "dateReception",
                enableColumnFilter: false,
                cell: (cell: any) => moment(cell.getValue()).format("DD MMM YYYY"),
            },
            {
                header: "Fournisseur",
                accessorKey: "fournisseur",
                enableColumnFilter: false,
                cell: (cell: any) => cell.getValue()?.raison_sociale || 'N/A',
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
                id: "totalTTC",
                enableColumnFilter: false,
                cell: (cell: any) => `${calculateAchatTotals(cell.row.original).grandTotal.toFixed(3)} DT`,
            },
            {
                header: "Total TTC Après Remise",
                id: "totalTTCAfterRemise",
                enableColumnFilter: false,
                cell: (cell: any) => `${calculateAchatTotals(cell.row.original).finalTotal.toFixed(3)} DT`,
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
                                        setBonReception(cellProps.row.original);
                                        setSelectedArticles(cellProps.row.original.articles.map(toSelectedArticle));
                                        setGlobalRemise(cellProps.row.original.remise || 0);
                                        setRemiseType(cellProps.row.original.remiseType || "percentage");
                                        setShowRemise((cellProps.row.original.remise || 0) > 0);
                                        setSelectedFournisseur(cellProps.row.original.fournisseur || null);
                                        setSelectedDepot(cellProps.row.original.depot || defaultDepot);
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
                                        setBonReception(cellProps.row.original);
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
                                    className="text-success d-inline-block"
                                    title="Imprimer PDF"
                                    onClick={() => openPdf(cellProps.row.original)}
                                >
                                    <i className="ri-printer-line fs-16"></i>
                                </Link>
                            </li>
                        </ul>
                    );
                },
            },
        ],
        [companyInfo, defaultDepot]
    );

    return (
        <div className="page-content">
            <DeleteModal
                show={deleteModal}
                onDeleteClick={handleDelete}
                onCloseClick={() => setDeleteModal(false)}
            />

            <Container fluid>
                <BreadCrumb title="Bons de Réception" pageTitle="Réceptions" />

                <Row>
                    <Col lg={12}>
                        <Card id="bonReceptionList">
                            <CardHeader className="card-header border-0">
                                <Row className="align-items-center gy-3">
                                    <div className="col-sm">
                                        <h5 className="card-title mb-0">Gestion des Bons de Réception</h5>
                                    </div>
                                    <div className="col-sm-auto">
                                        <div className="d-flex gap-1 flex-wrap">
                                            <Button
                                                color="secondary"
                                                onClick={() => {
                                                    setIsEdit(false);
                                                    setBonReception(null);
                                                    setSelectedDepot(defaultDepot);
                                                    toggleModal();
                                                }}
                                            >
                                                <i className="ri-add-line align-bottom me-1"></i> Ajouter Bon
                                            </Button>
                                        </div>
                                    </div>
                                </Row>
                            </CardHeader>
                            <Nav className="nav-tabs nav-tabs-custom nav-success" role="tablist">
                                <NavItem>
                                    <NavLink className={classnames({ active: activeTab === "1" })} onClick={() => setActiveTab("1")}>
                                        <i className="ri-list-check-2 me-1 align-bottom"></i> Tous
                                    </NavLink>
                                </NavItem>
                                <NavItem>
                                    <NavLink className={classnames({ active: activeTab === "2" })} onClick={() => setActiveTab("2")}>
                                        <i className="ri-time-line me-1 align-bottom"></i> Brouillon
                                    </NavLink>
                                </NavItem>
                                <NavItem>
                                    <NavLink className={classnames({ active: activeTab === "3" })} onClick={() => setActiveTab("3")}>
                                        <i className="ri-checkbox-circle-line me-1 align-bottom"></i> Reçu
                                    </NavLink>
                                </NavItem>
                                <NavItem>
                                    <NavLink className={classnames({ active: activeTab === "4" })} onClick={() => setActiveTab("4")}>
                                        <i className="ri-truck-line me-1 align-bottom"></i> Partiellement Reçu
                                    </NavLink>
                                </NavItem>
                                <NavItem>
                                    <NavLink className={classnames({ active: activeTab === "5" })} onClick={() => setActiveTab("5")}>
                                        <i className="ri-close-circle-line me-1 align-bottom"></i> Annulé
                                    </NavLink>
                                </NavItem>
                            </Nav>
                            <CardBody className="pt-3">
                                <Row className="mb-3">
                                    <Col md={4}>
                                        <div className="search-box">
                                            <Input
                                                type="text"
                                                className="form-control"
                                                placeholder="Rechercher..."
                                                value={searchText}
                                                onChange={(e) => setSearchText(e.target.value)}
                                            />
                                            <i className="ri-search-line search-icon"></i>
                                        </div>
                                    </Col>
                                    <Col md={3}>
                                        <InputGroup>
                                            <InputGroupText>De</InputGroupText>
                                            <Flatpickr
                                                className="form-control"
                                                options={{ dateFormat: "d M, Y", altInput: true, altFormat: "F j, Y" }}
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
                                                options={{ dateFormat: "d M, Y", altInput: true, altFormat: "F j, Y" }}
                                                placeholder="Date de fin"
                                                onChange={(dates) => setEndDate(dates[0])}
                                            />
                                        </InputGroup>
                                    </Col>
                                    <Col md={2}>
                                        <Button
                                            color="light"
                                            className="w-100"
                                            onClick={() => {
                                                setStartDate(null);
                                                setEndDate(null);
                                                setSearchText("");
                                            }}
                                        >
                                            <i className="ri-close-line align-bottom me-1"></i> Réinitialiser
                                        </Button>
                                    </Col>
                                </Row>

                                {loading ? (
                                    <Loader />
                                ) : error ? (
                                    <div className="text-danger">{error}</div>
                                ) : (
                                    <TableContainer
                                        columns={columns}
                                        data={bonsReception}
                                        isGlobalFilter={false}
                                        isPagination={true}
                                        totalDataCount={totalCount}
                                        currentPage={currentPage - 1}
                                        onPageChange={(page) => fetchData(page + 1, pageSize)}
                                        onPageSizeChange={(size) => fetchData(1, size)}
                                        customPageSize={pageSize}
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
  <ModalHeader toggle={() => setDetailModal(false)} className="border-0 pb-3">
    <div className="d-flex align-items-center">
      <div className="modal-icon-wrapper bg-info bg-opacity-10 rounded-circle p-2 me-3">
        <i className="ri-file-text-line text-info fs-4"></i>
      </div>
      <div>
        <h4 className="mb-0 fw-bold text-dark">
          Bon de Réception #{selectedBonReception?.numeroReception}
        </h4>
        <small className="text-muted">
          {moment(selectedBonReception?.dateReception).format("DD MMM YYYY")}
        </small>
      </div>
    </div>
  </ModalHeader>

  <ModalBody className="pt-0">
    {selectedBonReception && (
      <div className="facture-details">
        <Row className="g-3 mb-4">
          <Col md={6}>
            <Card className="border-0 shadow-sm h-100">
              <CardBody className="p-4">
                <h6 className="fw-semibold mb-3 text-primary">
                  <i className="ri-user-line me-2"></i>
                  Informations Fournisseur
                </h6>
                <div className="d-flex align-items-center">
                  <div className="flex-grow-1">
                    <h5 className="mb-1">{selectedBonReception.fournisseur?.raison_sociale}</h5>
                    <p className="text-muted mb-1">
                      <i className="ri-phone-line me-1"></i>
                      {selectedBonReception.fournisseur?.telephone1 || "N/A"}
                    </p>
                    <p className="text-muted mb-0">
                      <i className="ri-map-pin-line me-1"></i>
                      {selectedBonReception.fournisseur?.adresse || "N/A"}
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
                  Informations Réception
                </h6>
                <div className="row g-2">
                  <div className="col-6">
                    <p className="mb-2">
                      <span className="text-muted d-block">Statut:</span>
                      <StatusBadge status={selectedBonReception.status} />
                    </p>
                  </div>
                  <div className="col-6">
                    <p className="mb-2">
                      <span className="text-muted d-block">Créé le:</span>
                      <strong>{moment(selectedBonReception.createdAt).format("DD/MM/YYYY")}</strong>
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Col>
        </Row>

        {selectedBonReception.notes && (
          <Card className="border-0 shadow-sm mb-4">
            <CardBody className="p-4">
              <h6 className="fw-semibold mb-3 text-primary">
                <i className="ri-sticky-note-line me-2"></i>
                Notes
              </h6>
              <p className="mb-0 text-muted">{selectedBonReception.notes}</p>
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
                    <th className="text-end">Prix Unitaire HT</th>
                    <th className="text-end">Prix Unitaire TTC</th>
                    <th className="text-end">TVA (%)</th>
                    <th className="text-end">Total HT</th>
                    <th className="text-end pe-4">Total TTC</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedBonReception.articles.map((item, index) => {
                    const line = calculateLineTotals(toAchatCalcLine(item), index);
                    const quantite = Number(item.quantite) || 0;
                    const priceHT = line.unitHT;
                    const priceTTC = line.unitTTC;
                    const tvaRate = Number(item.tva || 0);
                    const montantNetHT = line.netHT;
                    const montantTTCLigne = line.ttc;

                    return (
                      <tr key={index} className={index % 2 === 0 ? "bg-light" : ""}>
                        <td className="ps-4">
                          <div className="d-flex align-items-center">
                            <div className="flex-grow-1">
                              <h6 className="mb-0 fw-semibold fs-6">{item.article?.designation}</h6>
                            </div>
                          </div>
                        </td>
                        <td>
                          <Badge color="light" className="text-dark">
                            {item.article?.reference || '-'}
                          </Badge>
                        </td>
                        <td className="text-end fw-semibold">{quantite}</td>
                        <td className="text-end">{priceHT.toFixed(3)} DT</td>
                        <td className="text-end">{priceTTC.toFixed(3)} DT</td>
                        <td className="text-end">{tvaRate}%</td>
                        <td className="text-end fw-semibold">{montantNetHT.toFixed(3)} DT</td>
                        <td className="text-end pe-4 fw-semibold text-primary">{montantTTCLigne.toFixed(3)} DT</td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>

            <div className="border-top p-4">
              <Row className="justify-content-end">
                <Col xs={8} sm={6} md={5} lg={4}>
                  {(() => {
                    // Same calculation engine as the ventes pages
                    const totals = calculateAchatTotals(selectedBonReception);
                    const sousTotalHTValue = totals.sousTotalHT;
                    const displayNetHT = totals.netHT;
                    const displayTotalTax = totals.totalTax;
                    const grandTotalValue = totals.grandTotal;
                    const finalTotalValue = totals.finalTotal;
                    const discountAmountValue = totals.discountAmount;
                    const discountPercentage = totals.discountPercentage.toFixed(2);
                    const remiseValue = Number(selectedBonReception.remise) || 0;
                    const remiseTypeValue = selectedBonReception.remiseType || "percentage";

                    return (
                      <Table className="table-sm table-borderless mb-0">
                        <tbody>
                          <tr className="real-time-update">
                            <th className="text-end text-muted fs-6">Sous-total H.T.:</th>
                            <td className="text-end fw-semibold fs-6">{sousTotalHTValue.toFixed(3)} DT</td>
                          </tr>
                          <tr className="real-time-update">
                            <th className="text-end text-muted fs-6">Net H.T.:</th>
                            <td className="text-end fw-semibold fs-6">{displayNetHT.toFixed(3)} DT</td>
                          </tr>
                          <tr className="real-time-update">
                            <th className="text-end text-muted fs-6">TVA:</th>
                            <td className="text-end fw-semibold fs-6">{displayTotalTax.toFixed(3)} DT</td>
                          </tr>
                          <tr className="real-time-update">
                            <th className="text-end text-muted fs-6">Total TTC:</th>
                            <td className="text-end fw-semibold fs-6 text-dark">
                              {grandTotalValue.toFixed(3)} DT
                            </td>
                          </tr>
                          {remiseValue > 0 && (
                            <tr className="real-time-update">
                              <th className="text-end text-muted fs-6">
                                {remiseTypeValue === "percentage" 
                                  ? `Remise (${remiseValue}%)` 
                                  : `Remise (Montant fixe) ${discountPercentage}%`}
                              </th>
                              <td className="text-end text-danger fw-bold fs-6">
                                - {discountAmountValue.toFixed(3)} DT
                              </td>
                            </tr>
                          )}
                          
                          {remiseValue > 0 && (
                            <tr className="final-total real-time-update border-top">
                              <th className="text-end fs-5">NET À PAYER:</th>
                              <td className="text-end fw-bold fs-5 text-primary">
                                {finalTotalValue.toFixed(3)} DT
                              </td>
                            </tr>
                          )}
                          {!remiseValue && (
                            <tr className="final-total real-time-update border-top">
                              <th className="text-end fs-5">NET À PAYER:</th>
                              <td className="text-end fw-bold fs-5 text-primary">
                                {finalTotalValue.toFixed(3)} DT
                              </td>
                            </tr>
                          )}
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
      color="primary"
      onClick={() => {
        setDetailModal(false);
        setBonReception(selectedBonReception);
        setSelectedArticles((selectedBonReception?.articles || []).map(toSelectedArticle));
        setGlobalRemise(selectedBonReception?.remise || 0);
        setRemiseType((selectedBonReception?.remiseType as "percentage" | "fixed" | undefined) ?? "percentage");
        setShowRemise((selectedBonReception?.remise || 0) > 0);
        setSelectedFournisseur(selectedBonReception?.fournisseur || null);
        setSelectedDepot(selectedBonReception?.depot || defaultDepot);
        setIsEdit(true);
        setModal(true);
      }}
      className="btn-invoice btn-invoice-primary me-2"
    >
      <i className="ri-edit-line me-2"></i> Modifier
    </Button>
    
    <Button
      color="success"
      onClick={() => {
        if (selectedBonReception) {
          setBonReception(selectedBonReception);
          setSelectedFournisseur(selectedBonReception.fournisseur || null);
          setSelectedArticles(selectedBonReception.articles.map(toSelectedArticle));
          setGlobalRemise(selectedBonReception.remise || 0);
          setRemiseType((selectedBonReception.remiseType as "percentage" | "fixed" | undefined) ?? "percentage");
          setShowRemise((selectedBonReception.remise || 0) > 0);
          setIsCreatingFacture(true);
          setIsEdit(false);

          validation.setValues({
            ...validation.values,
            numeroFacture: nextNumeroFacture,
            fournisseur_id: selectedBonReception.fournisseur?.id ?? "",
            dateFacture: moment().format("YYYY-MM-DD"),
           // dateEcheance: "",
            notes: selectedBonReception.notes ?? "",
            isCreatingFacture: true
          });

          setFactureModal(true);
        }
      }}
      className="btn-invoice btn-invoice-success me-2"
    >
      <i className="ri-file-text-line me-2"></i> Créer Facture
    </Button>

    <Button
      color="info"
      onClick={() => selectedBonReception && openPdf(selectedBonReception)}
      className="btn-invoice me-2"
    >
      <i className="ri-printer-line me-2"></i> Imprimer PDF
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
  style={{ maxWidth: '1200px' }}
>
  <ModalHeader toggle={toggleModal} className="border-0 pb-3">
    <div className="d-flex align-items-center">
      <div className="modal-icon-wrapper bg-primary bg-opacity-10 rounded-circle p-2 me-3">
        <i className="ri-file-list-3-line text-primary fs-4"></i>
      </div>
      <div>
        <h4 className="mb-0 fw-bold text-dark">
          {isEdit ? "Modifier Bon de Réception" : "Créer Nouveau Bon de Réception"}
        </h4>
        <small className="text-muted">
          {isEdit ? "Modifier les détails du bon de réception existant" : "Créer un nouveau bon de réception fournisseur"}
        </small>
      </div>
    </div>
  </ModalHeader>

  <Form onSubmit={validation.handleSubmit} className="invoice-form">
    <ModalBody className="pt-0">
      {/* Header Information Section */}
      <Card className="border-0 shadow-sm mb-4">
        <CardBody className="p-4">
          <h5 className="fw-semibold mb-4 text-primary">
            <i className="ri-information-line me-2"></i>
            Informations Générales
          </h5>
          <Row className="align-items-center">
            {/* Numéro de Réception */}
            <Col md={6}>
              <div className="mb-3">
                <Label className="form-label-lg fw-semibold">Numéro de Réception*</Label>
                <Input
                  name="numeroReception"
                  value={validation.values.numeroReception}
                  onChange={validation.handleChange}
                  invalid={
                    validation.touched.numeroReception &&
                    !!validation.errors.numeroReception
                  }
                  readOnly={isEdit}
                  className="form-control-lg"
                  placeholder="REC-2024-001"
                />
                <FormFeedback className="fs-6">
                  {validation.errors.numeroReception}
                </FormFeedback>
              </div>
            </Col>

            {/* Date de Réception */}
            <Col md={6}>
              <div className="mb-3">
                <Label className="form-label-lg fw-semibold">Date de Réception*</Label>
                <Input
                  type="date"
                  name="dateReception"
                  value={validation.values.dateReception}
                  onChange={validation.handleChange}
                  invalid={
                    validation.touched.dateReception &&
                    !!validation.errors.dateReception
                  }
                  className="form-control-lg"
                />
                {validation.touched.dateReception && validation.errors.dateReception && (
                  <div className="text-danger fs-6 mt-1">
                    {validation.errors.dateReception as string}
                  </div>
                )}
              </div>
            </Col>
          </Row>
        </CardBody>
      </Card>

      {/* Fournisseur Section */}
      <Row className="g-3 mb-4">
        <Col md={12}>
          <Card className="border-0 shadow-sm h-100">
            <CardBody className="p-4">
              <h6 className="fw-semibold mb-3 text-primary">
                <i className="ri-user-line me-2"></i>
                Informations Fournisseur
              </h6>
              <div className="mb-3">
                <Label className="form-label-lg fw-semibold">Fournisseur*</Label>
                <div className="position-relative">
                  <Input
                    type="text"
                    placeholder="Rechercher fournisseur..."
                    value={selectedFournisseur ? selectedFournisseur.raison_sociale : fournisseurSearch}
                    onChange={(e) => {
                      if (!e.target.value) {
                        setSelectedFournisseur(null);
                        validation.setFieldValue("fournisseur_id", "");
                      }
                      setFournisseurSearch(e.target.value);
                    }}
                    readOnly={!!selectedFournisseur}
                    className="form-control-lg"
                  />
                  {selectedFournisseur && (
                    <Button
                      color="link"
                      size="sm"
                      className="position-absolute end-0 top-50 translate-middle-y text-danger p-0 me-3"
                      onClick={() => {
                        setSelectedFournisseur(null);
                        validation.setFieldValue("fournisseur_id", "");
                        setFournisseurSearch("");
                      }}
                    >
                      <i className="ri-close-line fs-5"></i>
                    </Button>
                  )}
                </div>
                
                {/* Scrollable Dropdown Results */}
                {!selectedFournisseur && fournisseurSearch.length >= 1 && (
                  <div 
                    className="search-results mt-2 border rounded shadow-sm"
                    style={{ 
                      maxHeight: "200px", 
                      overflowY: "auto",
                      position: "absolute",
                      width: "100%",
                      zIndex: 1000,
                      backgroundColor: "white"
                    }}
                  >
                    {fournisseursLoading && filteredFournisseurs.length === 0 ? (
                      <div className="text-muted p-3 text-center">
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Recherche...
                      </div>
                    ) : filteredFournisseurs.length > 0 ? (
                      <ul className="list-group list-group-flush">
                        {filteredFournisseurs.map((f) => (
                          <li
                            key={f.id}
                            className="list-group-item list-group-item-action"
                            onClick={() => {
                              setSelectedFournisseur(f);
                              validation.setFieldValue("fournisseur_id", f.id);
                              setFournisseurSearch("");
                              setFilteredFournisseurs([]);
                            }}
                            style={{ cursor: "pointer", padding: "10px 15px" }}
                          >
                            <div className="d-flex justify-content-between align-items-center">
                              <span className="fw-medium">{f.raison_sociale}</span>
                              <small className="text-muted">{f.telephone1}</small>
                            </div>
                            {f.adresse && (
                              <small className="text-muted d-block mt-1">
                                <i className="ri-map-pin-line me-1"></i>
                                {f.adresse}
                              </small>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-muted p-3 text-center">
                        <i className="ri-search-line me-1"></i>
                        Aucun résultat trouvé
                      </div>
                    )}
                  </div>
                )}
                
                {validation.touched.fournisseur_id && validation.errors.fournisseur_id && (
                  <div className="text-danger mt-1 fs-6">
                    <i className="ri-error-warning-line me-1"></i>
                    {validation.errors.fournisseur_id}
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Depot Section */}
      <Row className="g-3 mb-4">
        <Col md={12}>
          <Card className="border-0 shadow-sm h-100">
            <CardBody className="p-4">
              <h6 className="fw-semibold mb-3 text-primary">
                <i className="ri-store-2-line me-2"></i>
                Dépôt de Réception
              </h6>
              <div className="mb-3">
                <Label className="form-label-lg fw-semibold">Dépôt*</Label>
                <Input
                  type="select"
                  name="depot_id"
                  value={selectedDepot?.id || ""}
                  onChange={(e) => {
                    const id = parseInt(e.target.value);
                    const depot = depots.find(d => d.id === id);
                    setSelectedDepot(depot || null);
                    validation.setFieldValue("depot_id", id);
                  }}
                  invalid={
                    validation.touched.depot_id &&
                    !!validation.errors.depot_id
                  }
                  className="form-control-lg"
                >
                  <option value="">Sélectionner un dépôt</option>
                  {depots.map((depot) => (
                    <option key={depot.id} value={depot.id}>
                      {depot.nom}
                    </option>
                  ))}
                </Input>
                {validation.touched.depot_id && validation.errors.depot_id && (
                  <div className="text-danger mt-1 small">
                    {validation.errors.depot_id}
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Remise Section */}
     

      {/* Articles Section */}
      <Card className="border-0 shadow-sm mb-4">
        <CardBody className="p-4">
          <h5 className="fw-semibold mb-4 text-primary">
            <i className="ri-shopping-cart-line me-2"></i>
            Articles
          </h5>
          
          <div className="mb-4">
            <Label className="form-label-lg fw-semibold">Rechercher Article</Label>
            <div className="d-flex gap-2">
              <div className="search-box position-relative flex-grow-1">
                <Input
                  type="text"
                  placeholder="Rechercher article..."
                  value={articleSearch}
                  onChange={(e) => {
                    setArticleSearch(e.target.value);
                    setFocusedIndex(-1);
                  }}
                  onKeyDown={handleArticleSearchKeyDown}
                  className="form-control-lg ps-5"
                />
                <i className="ri-search-line search-icon position-absolute top-50 start-0 translate-middle-y ms-3 fs-5 text-muted"></i>
              </div>
              <Button color="secondary" className="btn-icon" onClick={() => { loadArticleModalData(); setCreateArticleModal(true); }}>
                <i className="ri-add-line fs-5"></i>
              </Button>
            </div>
            
            {/* Scrollable Dropdown Results */}
            {articleSearch.length >= 1 && (
              <div
                ref={setDropdownRef}
                className="search-results mt-2 border rounded shadow-sm"
                style={{
                  maxHeight: "300px",
                  overflowY: "auto",
                  position: "relative",
                  zIndex: 1000,
                  backgroundColor: "white"
                }}
                onKeyDown={(e) => e.stopPropagation()}
              >
                {articlesLoading && filteredArticles.length === 0 ? (
                  <div className="text-muted p-3 text-center">
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Recherche...
                  </div>
                ) : filteredArticles.length > 0 ? (
                  <ul className="list-group list-group-flush">
                    {filteredArticles.map((article, index) => {
                      if (!itemRefs[index]) {
                        itemRefs[index] = React.createRef<HTMLLIElement>();
                      }
                      return (
                      <li
                        key={article.id}
                        ref={itemRefs[index]}
                        className="list-group-item list-group-item-action"
                        onClick={() => handleAddArticle(article)}
                        onMouseEnter={() => setFocusedIndex(index)}
                        style={{
                          cursor: "pointer",
                          padding: "12px 15px",
                          opacity: selectedArticles.some(item => item.article_id === article.id) ? 0.6 : 1,
                          backgroundColor: focusedIndex === index ? "#e7f1ff" : "transparent",
                          borderLeft: focusedIndex === index ? "4px solid #0d6efd" : "none"
                        }}
                      >
                        <div className="d-flex justify-content-between align-items-center">
                          <div className="flex-grow-1">
                            <div className="d-flex align-items-center mb-1">
                              <strong className="fs-6 me-2 text-primary">{article.reference}</strong>
                              <span className="badge bg-light text-dark me-2">Stock: {article.qte || 0}</span>
                            </div>
                            <small className="text-muted d-block" style={{ fontSize: "0.85rem" }}>
                              {article.designation}
                            </small>
                            <div className="mt-1">
                              <span className="badge bg-success text-white">
                                HT: {(Number(article.pua_ht) || 0).toFixed(3)} DT
                              </span>
                              {article.tva && article.tva > 0 && (
                                <span className="badge bg-info ms-1">TVA: {article.tva}%</span>
                              )}
                            </div>
                          </div>
                          <div className="d-flex align-items-center gap-2">
                            {selectedArticles.some(item => item.article_id === article.id) ? (
                              <Badge color="secondary" className="fs-6">
                                <i className="ri-check-line me-1"></i>
                                Ajouté
                              </Badge>
                            ) : (
                              <Badge color="success" className="fs-6">
                                <i className="ri-add-line me-1"></i>
                                Ajouter
                              </Badge>
                            )}
                            <Button
                              color="link" 
                              className="text-primary p-0" 
                              onClick={(e) => {
                                e.stopPropagation();
                                setArticleToEdit(article);
                                loadArticleModalData();
                                setEditArticleModal(true);
                              }}
                            >
                              <i className="ri-pencil-fill fs-5"></i>
                            </Button>
                          </div>
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
              <div className="table-responsive" style={{ maxHeight: "500px", overflow: "auto" }}>
                <Table className="table table-hover mb-0">
                  <thead className="table-dark" style={{ position: "sticky", top: 0, zIndex: 10 }}>
                    <tr>
                      <th style={{ width: "25%", minWidth: "200px" }}>Article</th>
                      <th style={{ width: "10%", minWidth: "100px" }}>Référence</th>
                      <th style={{ width: "8%", minWidth: "80px" }}>Quantité</th>
                      <th style={{ width: "12%", minWidth: "120px" }}>Prix Unitaire HT</th>
                      <th style={{ width: "12%", minWidth: "120px" }}>Prix Unitaire TTC</th>
                      <th style={{ width: "8%", minWidth: "80px" }}>TVA (%)</th>
                      <th style={{ width: "8%", minWidth: "80px" }}>Remise (%)</th>
                      <th style={{ width: "10%", minWidth: "100px" }}>Total HT</th>
                      <th style={{ width: "10%", minWidth: "100px" }}>Total TTC</th>
                      <th style={{ width: "5%", minWidth: "60px" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedArticles.map((item, index) => {
                      const article = item.articleDetails;
                      
                      // Same line calculation as the ventes pages
                      const line = calculateLineTotals(item, index, { editingHT, editingTTC });
                      const montantHTLigne = line.netHT.toFixed(3);
                      const montantTTCLigne = line.ttc.toFixed(3);

                      return (
                        <tr key={`${item.article_id}-${index}`} className="align-middle article-row">
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
                            <Badge color="light" className="text-dark">
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
                                  handleArticleChange(item.article_id, "quantite", "");
                                } else {
                                  const newQty = Math.max(0, Number(value));
                                  handleArticleChange(item.article_id, "quantite", newQty);
                                }
                              }}
                              className="table-input article-input article-input-number"
                              style={{ width: "100%", fontSize: "0.9rem" }}
                            />
                          </td>
                          <td style={{ width: "12%" }}>
                            <Input
                              type="text"
                              value={
                                editingHT[item.article_id] !== undefined
                                  ? editingHT[item.article_id]
                                  : formatForDisplay(item.prixUnitaire)
                              }
                              onChange={(e) => {
                                let value = e.target.value;
                                if (value === "" || /^[0-9]*[,.]?[0-9]*$/.test(value)) {
                                  value = value.replace(".", ",");
                                  const commaCount = (value.match(/,/g) || []).length;
                                  if (commaCount <= 1) {
                                    setEditingHT((prev) => ({
                                      ...prev,
                                      [item.article_id]: value,
                                    }));
                                    const parsed = parseNumericInput(value);
                                    if (!isNaN(parsed) && parsed >= 0) {
                                      handleArticleChange(item.article_id, "prixUnitaire", parsed);
                                    }
                                  }
                                }
                              }}
                              onBlur={() => {
                                setEditingHT((prev) => {
                                  const newState = { ...prev };
                                  delete newState[item.article_id];
                                  return newState;
                                });
                              }}
                              className="table-input article-input article-input-currency"
                              style={{ width: "100%", fontSize: "0.9rem" }}
                            />
                          </td>
                          <td style={{ width: "12%" }}>
                            <Input
                              type="text"
                              value={
                                editingTTC[item.article_id] !== undefined
                                  ? editingTTC[item.article_id]
                                  : formatForDisplay(item.prixTTC)
                              }
                              onChange={(e) => {
                                let value = e.target.value;
                                if (value === "" || /^[0-9]*[,.]?[0-9]*$/.test(value)) {
                                  value = value.replace(".", ",");
                                  const commaCount = (value.match(/,/g) || []).length;
                                  if (commaCount <= 1) {
                                    setEditingTTC((prev) => ({
                                      ...prev,
                                      [item.article_id]: value,
                                    }));
                                    const parsed = parseNumericInput(value);
                                    if (!isNaN(parsed) && parsed >= 0) {
                                      handleArticleChange(item.article_id, "prixTTC", parsed);
                                    }
                                  }
                                }
                              }}
                              onBlur={() => {
                                setEditingTTC((prev) => {
                                  const newState = { ...prev };
                                  delete newState[item.article_id];
                                  return newState;
                                });
                              }}
                              className="table-input article-input article-input-currency"
                              style={{ width: "100%", fontSize: "0.9rem" }}
                            />
                          </td>
                          <td style={{ width: "8%" }}>
                            <Input
                              type="select"
                              value={item.tva ?? ""}
                              onChange={(e) => {
                                const newTva = e.target.value === "" ? null : Number(e.target.value);
                                handleArticleChange(item.article_id, "tva", newTva);
                              }}
                              className="table-input article-input article-select"
                              style={{ width: "100%", fontSize: "0.9rem" }}
                            >
                              <option value="">Sélectionner</option>
                              {tvaOptions.map((option) => (
                                <option key={option.value ?? "null"} value={option.value ?? ""}>
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
                              onChange={(e) => handleArticleChange(item.article_id, "remise", Number(e.target.value))}
                              className="table-input text-center"
                              style={{ width: "100%", fontSize: "0.9rem" }}
                            />
                          </td>
                          <td style={{ width: "10%" }} className="text-end fw-semibold">
                            {montantHTLigne} DT
                          </td>
                          <td style={{ width: "10%" }} className="text-end fw-semibold text-primary">
                            {montantTTCLigne} DT
                          </td>
                          <td style={{ width: "5%" }}>
                            <div className="d-flex gap-2">
                              <Button
                                color="primary"
                                size="sm"
                                onClick={() => {
                                  if (article) {
                                    setArticleToEdit(article);
                                    loadArticleModalData();
                                    setEditArticleModal(true);
                                  }
                                }}
                                className="btn-invoice-primary"
                                style={{ padding: "0.25rem 0.5rem", fontSize: "0.8rem" }}
                              >
                                <i className="ri-pencil-fill"></i>
                              </Button>
                              <Button
                                color="danger"
                                size="sm"
                                onClick={() => handleRemoveArticle(item.article_id)}
                                className="btn-invoice-danger"
                                style={{ padding: "0.25rem 0.5rem", fontSize: "0.8rem" }}
                              >
                                <i className="ri-delete-bin-line"></i>
                              </Button>
                            </div>
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
                      <Label className="form-label fw-semibold mb-0">Activer remise</Label>
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
                          <Label className="form-label fw-semibold">Type de remise</Label>
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
                            placeholder={remiseType === "percentage" ? "0-100%" : "Montant"}
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
                          <th className="text-end text-muted fs-6">Sous-total H.T.:</th>
                          <td className="text-end fw-semibold fs-6">{sousTotalHT.toFixed(3)} DT</td>
                        </tr>
                        <tr className="real-time-update">
                          <th className="text-end text-muted fs-6">Net H.T.:</th>
                          <td className="text-end fw-semibold fs-6">{netHT.toFixed(3)} DT</td>
                        </tr>
                        <tr className="real-time-update">
                          <th className="text-end text-muted fs-6">TVA:</th>
                          <td className="text-end fw-semibold fs-6">{totalTax.toFixed(3)} DT</td>
                        </tr>
                        <tr className="real-time-update">
                          <th className="text-end text-muted fs-6">Total TTC:</th>
                          <td className="text-end fw-semibold fs-6 text-dark">
                            {grandTotal.toFixed(3)} DT
                          </td>
                        </tr>
                        {showRemise && globalRemise > 0 && (
                          <tr className="real-time-update">
                            <th className="text-end text-muted fs-6">
                              {remiseType === "percentage" 
                                ? `Remise (${globalRemise}%)` 
                                : `Remise (Montant fixe) ${discountPercentage.toFixed(2)}%`}
                            </th>
                            <td className="text-end text-danger fw-bold fs-6">
                              - {discountAmount.toFixed(3)} DT
                            </td>
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

      {/* Notes Section */}
      <Card className="border-0 shadow-sm">
        <CardBody className="p-4">
          <h5 className="fw-semibold mb-3 text-primary">
            <i className="ri-sticky-note-line me-2"></i>
            Notes Additionnelles
          </h5>
          <div className="mb-3">
            <Label className="form-label-lg fw-semibold">Notes</Label>
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
        disabled={selectedArticles.length === 0 || !selectedFournisseur}
      >
        <i className="ri-save-line me-2"></i> 
        {isEdit ? "Modifier le Bon" : "Créer le Bon"}
      </Button>
    </ModalFooter>
  </Form>
</Modal>

<Modal 
  isOpen={factureModal} 
  toggle={toggleFactureModal} 
  centered 
  size="xl"
  className="invoice-modal"
  style={{ maxWidth: '1200px' }}
>
  <ModalHeader toggle={toggleFactureModal} className="border-0 pb-3">
    <div className="d-flex align-items-center">
      <div className="modal-icon-wrapper bg-success bg-opacity-10 rounded-circle p-2 me-3">
        <i className="ri-file-text-line text-success fs-4"></i>
      </div>
      <div>
        <h4 className="mb-0 fw-bold text-dark">
          Créer Facture à partir du Bon de Réception
        </h4>
        <small className="text-muted">
          Créer une facture fournisseur basée sur le bon de réception
        </small>
      </div>
    </div>
  </ModalHeader>

  <Form onSubmit={validation.handleSubmit} className="invoice-form">
    <ModalBody className="pt-0">
      {/* Header Information Section */}
      {/* Header Information Section */}
<Card className="border-0 shadow-sm mb-4">
  <CardBody className="p-4">
    <h5 className="fw-semibold mb-4 text-primary">
      <i className="ri-information-line me-2"></i>
      Informations Facture
    </h5>
    
    {/* Ligne unique avec Numéro, Date et Timbre */}
    <Row className="align-items-end">
      {/* Numéro de Facture */}
      <Col md={4}>
        <div className="mb-3">
          <Label className="form-label-lg fw-semibold">Numéro de Facture*</Label>
          <Input
            name="numeroFacture"
            value={validation.values.numeroFacture}
            onChange={validation.handleChange}
            invalid={validation.touched.numeroFacture && !!validation.errors.numeroFacture}
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
          <Label className="form-label-lg fw-semibold">Date de Facture*</Label>
          <Input
            type="date"
            name="dateFacture"
            value={validation.values.dateFacture}
            onChange={validation.handleChange}
            invalid={validation.touched.dateFacture && !!validation.errors.dateFacture}
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
          <Label className="form-label-lg fw-semibold mb-2">Timbre Fiscal</Label>
          <div className="d-flex align-items-center gap-3 p-3 bg-light rounded border h-100">
            {/* Checkbox */}
            <div className="form-check mb-0">
              <Input
                type="checkbox"
                id="timbreFiscal"
                checked={timbreFiscal}
                onChange={(e) => setTimbreFiscal(e.target.checked)}
                className="form-check-input"
                style={{
                  width: "20px",
                  height: "20px",
                  cursor: "pointer"
                }}
              />
            </div>
            
            {/* Icône et texte */}
            <div className="d-flex align-items-center gap-2 flex-grow-1">
              <i className="ri-stamp-line text-warning fs-5"></i>
              <div>
                <Label for="timbreFiscal" className="form-check-label mb-0 fw-semibold fs-6 cursor-pointer">
                  Timbre Fiscal
                </Label>
                <div className="timbre-description">
                  <small className="text-muted">+1.000 DT ajouté au total</small>
                </div>
              </div>
            </div>
            
            {/* Badge du montant */}
            <div className="timbre-amount">
              <Badge 
                color={timbreFiscal ? "success" : "secondary"} 
                className="fs-6 px-3 py-2"
              >
                {timbreFiscal ? "+1.000 DT" : "Désactivé"}
              </Badge>
            </div>
          </div>
        </div>
      </Col>
    </Row>
  </CardBody>
</Card>

      {/* Fournisseur Section */}
      <Row className="g-3 mb-4">
        <Col md={12}>
          <Card className="border-0 shadow-sm h-100">
            <CardBody className="p-4">
              <h6 className="fw-semibold mb-3 text-primary">
                <i className="ri-user-line me-2"></i>
                Informations Fournisseur
              </h6>
              <div className="mb-3">
                <Label className="form-label-lg fw-semibold">Fournisseur*</Label>
                <div className="position-relative">
                  <Input
                    type="text"
                    placeholder="Rechercher fournisseur..."
                    value={selectedFournisseur ? selectedFournisseur.raison_sociale : fournisseurSearch}
                    onChange={(e) => {
                      if (!e.target.value) {
                        setSelectedFournisseur(null);
                        validation.setFieldValue("fournisseur_id", "");
                      }
                      setFournisseurSearch(e.target.value);
                    }}
                    readOnly={!!selectedFournisseur}
                    className="form-control-lg"
                  />
                  {selectedFournisseur && (
                    <Button
                      color="link"
                      size="sm"
                      className="position-absolute end-0 top-50 translate-middle-y text-danger p-0 me-3"
                      onClick={() => {
                        setSelectedFournisseur(null);
                        validation.setFieldValue("fournisseur_id", "");
                        setFournisseurSearch("");
                      }}
                    >
                      <i className="ri-close-line fs-5"></i>
                    </Button>
                  )}
                </div>
                
                {/* Scrollable Dropdown Results */}
                {!selectedFournisseur && fournisseurSearch.length >= 1 && (
                  <div 
                    className="search-results mt-2 border rounded shadow-sm"
                    style={{ 
                      maxHeight: "200px", 
                      overflowY: "auto",
                      position: "absolute",
                      width: "100%",
                      zIndex: 1000,
                      backgroundColor: "white"
                    }}
                  >
                    {fournisseursLoading && filteredFournisseurs.length === 0 ? (
                      <div className="text-muted p-3 text-center">
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Recherche...
                      </div>
                    ) : filteredFournisseurs.length > 0 ? (
                      <ul className="list-group list-group-flush">
                        {filteredFournisseurs.map((f) => (
                          <li
                            key={f.id}
                            className="list-group-item list-group-item-action"
                            onClick={() => {
                              setSelectedFournisseur(f);
                              validation.setFieldValue("fournisseur_id", f.id);
                              setFournisseurSearch("");
                              setFilteredFournisseurs([]);
                            }}
                            style={{ cursor: "pointer", padding: "10px 15px" }}
                          >
                            <div className="d-flex justify-content-between align-items-center">
                              <span className="fw-medium">{f.raison_sociale}</span>
                              <small className="text-muted">{f.telephone1}</small>
                            </div>
                            {f.adresse && (
                              <small className="text-muted d-block mt-1">
                                <i className="ri-map-pin-line me-1"></i>
                                {f.adresse}
                              </small>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-muted p-3 text-center">
                        <i className="ri-search-line me-1"></i>
                        Aucun résultat trouvé
                      </div>
                    )}
                  </div>
                )}
                
                {validation.touched.fournisseur_id && validation.errors.fournisseur_id && (
                  <div className="text-danger mt-1 fs-6">
                    <i className="ri-error-warning-line me-1"></i>
                    {validation.errors.fournisseur_id}
                  </div>
                )}
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
            <Label className="form-label-lg fw-semibold">Rechercher Article</Label>
            <div className="search-box position-relative">
              <Input
                type="text"
                placeholder="Rechercher article..."
                value={articleSearch}
                onChange={(e) => {
                  setArticleSearch(e.target.value);
                  setFocusedIndex(-1);
                }}
                onKeyDown={handleArticleSearchKeyDown}
                className="form-control-lg ps-5"
              />
              <i className="ri-search-line search-icon position-absolute top-50 start-0 translate-middle-y ms-3 fs-5 text-muted"></i>
            </div>
            
            {/* Scrollable Dropdown Results */}
            {articleSearch.length >= 1 && (
              <div
                ref={setDropdownRef}
                className="search-results mt-2 border rounded shadow-sm"
                style={{
                  maxHeight: "300px",
                  overflowY: "auto",
                  position: "relative",
                  zIndex: 1000,
                  backgroundColor: "white"
                }}
                onKeyDown={(e) => e.stopPropagation()}
              >
                {articlesLoading && filteredArticles.length === 0 ? (
                  <div className="text-muted p-3 text-center">
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Recherche...
                  </div>
                ) : filteredArticles.length > 0 ? (
                  <ul className="list-group list-group-flush">
                    {filteredArticles.map((article, index) => {
                      if (!itemRefs[index]) {
                        itemRefs[index] = React.createRef<HTMLLIElement>();
                      }
                      return (
                      <li
                        key={article.id}
                        ref={itemRefs[index]}
                        className="list-group-item list-group-item-action"
                        onClick={() => handleAddArticle(article)}
                        onMouseEnter={() => setFocusedIndex(index)}
                        style={{
                          cursor: "pointer",
                          padding: "12px 15px",
                          opacity: selectedArticles.some(item => item.article_id === article.id) ? 0.6 : 1,
                          backgroundColor: focusedIndex === index ? "#e7f1ff" : "transparent",
                          borderLeft: focusedIndex === index ? "4px solid #0d6efd" : "none"
                        }}
                      >
                        <div className="d-flex justify-content-between align-items-center">
                          <div className="flex-grow-1">
                            <div className="d-flex align-items-center mb-1">
                              <strong className="fs-6 me-2 text-primary">{article.reference}</strong>
                              <span className="badge bg-light text-dark me-2">Stock: {article.qte || 0}</span>
                            </div>
                            <small className="text-muted d-block" style={{ fontSize: "0.85rem" }}>
                              {article.designation}
                            </small>
                            <div className="mt-1">
                              <span className="badge bg-success text-white">
                                HT: {(Number(article.pua_ht) || 0).toFixed(3)} DT
                              </span>
                              {article.tva && article.tva > 0 && (
                                <span className="badge bg-info ms-1">TVA: {article.tva}%</span>
                              )}
                            </div>
                          </div>
                          {selectedArticles.some(item => item.article_id === article.id) ? (
                            <Badge color="secondary" className="fs-6">
                              <i className="ri-check-line me-1"></i>
                              Ajouté
                            </Badge>
                          ) : (
                            <Badge color="success" className="fs-6">
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
              <div className="table-responsive" style={{ maxHeight: "500px", overflow: "auto" }}>
                <Table className="table table-hover mb-0">
                  <thead className="table-dark" style={{ position: "sticky", top: 0, zIndex: 10 }}>
                    <tr>
                      <th style={{ width: "25%", minWidth: "200px" }}>Article</th>
                      <th style={{ width: "10%", minWidth: "100px" }}>Référence</th>
                      <th style={{ width: "8%", minWidth: "80px" }}>Quantité</th>
                      <th style={{ width: "12%", minWidth: "120px" }}>Prix Unitaire HT</th>
                      <th style={{ width: "12%", minWidth: "120px" }}>Prix Unitaire TTC</th>
                      <th style={{ width: "8%", minWidth: "80px" }}>TVA (%)</th>
                      <th style={{ width: "10%", minWidth: "100px" }}>Total HT</th>
                      <th style={{ width: "10%", minWidth: "100px" }}>Total TTC</th>
                      <th style={{ width: "5%", minWidth: "60px" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedArticles.map((item, index) => {
                      const article = item.articleDetails;
                      
                      // Same line calculation as the ventes pages
                      const line = calculateLineTotals(item, index, { editingHT, editingTTC });
                      const montantHTLigne = line.netHT.toFixed(3);
                      const montantTTCLigne = line.ttc.toFixed(3);

                      return (
                        <tr key={`${item.article_id}-${index}`} className="align-middle">
                          <td style={{ width: "25%" }}>
                            <div className="d-flex align-items-center">
                              <div className="flex-grow-1">
                                <h6 className="mb-0 fw-semibold fs-6">{article?.designation}</h6>
                              </div>
                            </div>
                          </td>
                          <td style={{ width: "10%" }}>
                            <Badge color="light" className="text-dark">
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
                                  handleArticleChange(item.article_id, "quantite", "");
                                } else {
                                  const newQty = Math.max(0, Number(value));
                                  handleArticleChange(item.article_id, "quantite", newQty);
                                }
                              }}
                              className="table-input text-center"
                              style={{ width: "100%", fontSize: "0.9rem" }}
                            />
                          </td>
                          <td style={{ width: "12%" }}>
                            <Input
                              type="text"
                              value={
                                editingHT[item.article_id] !== undefined
                                  ? editingHT[item.article_id]
                                  : formatForDisplay(item.prixUnitaire)
                              }
                              onChange={(e) => {
                                let value = e.target.value;
                                if (value === "" || /^[0-9]*[,.]?[0-9]*$/.test(value)) {
                                  value = value.replace(".", ",");
                                  const commaCount = (value.match(/,/g) || []).length;
                                  if (commaCount <= 1) {
                                    setEditingHT((prev) => ({
                                      ...prev,
                                      [item.article_id]: value,
                                    }));
                                    const parsed = parseNumericInput(value);
                                    if (!isNaN(parsed) && parsed >= 0) {
                                      handleArticleChange(item.article_id, "prixUnitaire", parsed);
                                    }
                                  }
                                }
                              }}
                              className="table-input text-end"
                              style={{ width: "100%", fontSize: "0.9rem" }}
                            />
                          </td>
                          <td style={{ width: "12%" }}>
                            <Input
                              type="text"
                              value={
                                editingTTC[item.article_id] !== undefined
                                  ? editingTTC[item.article_id]
                                  : formatForDisplay(item.prixTTC)
                              }
                              onChange={(e) => {
                                let value = e.target.value;
                                if (value === "" || /^[0-9]*[,.]?[0-9]*$/.test(value)) {
                                  value = value.replace(".", ",");
                                  const commaCount = (value.match(/,/g) || []).length;
                                  if (commaCount <= 1) {
                                    setEditingTTC((prev) => ({
                                      ...prev,
                                      [item.article_id]: value,
                                    }));
                                    const parsed = parseNumericInput(value);
                                    if (!isNaN(parsed) && parsed >= 0) {
                                      handleArticleChange(item.article_id, "prixTTC", parsed);
                                    }
                                  }
                                }
                              }}
                              className="table-input text-end"
                              style={{ width: "100%", fontSize: "0.9rem" }}
                            />
                          </td>
                          <td style={{ width: "8%" }}>
                            <Input
                              type="select"
                              value={item.tva ?? ""}
                              onChange={(e) => {
                                const newTva = e.target.value === "" ? null : Number(e.target.value);
                                handleArticleChange(item.article_id, "tva", newTva);
                              }}
                              className="table-input"
                              style={{ width: "100%", fontSize: "0.9rem" }}
                            >
                              <option value="">Sélectionner</option>
                              {tvaOptions.map((option) => (
                                <option key={option.value ?? "null"} value={option.value ?? ""}>
                                  {option.label}
                                </option>
                              ))}
                            </Input>
                          </td>
                          <td style={{ width: "10%" }} className="text-end fw-semibold">
                            {montantHTLigne} DT
                          </td>
                          <td style={{ width: "10%" }} className="text-end fw-semibold text-primary">
                            {montantTTCLigne} DT
                          </td>
                          <td style={{ width: "5%" }}>
                            <Button
                              color="danger"
                              size="sm"
                              onClick={() => handleRemoveArticle(item.article_id)}
                              className="btn-invoice-danger"
                              style={{ padding: "0.25rem 0.5rem", fontSize: "0.8rem" }}
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
                      <Label className="form-label fw-semibold mb-0">Activer remise</Label>
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
                          <Label className="form-label fw-semibold">Type de remise</Label>
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
                            placeholder={remiseType === "percentage" ? "0-100%" : "Montant"}
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
                          <th className="text-end text-muted fs-6">Sous-total H.T.:</th>
                          <td className="text-end fw-semibold fs-6">{sousTotalHT.toFixed(3)} DT</td>
                        </tr>
                        <tr className="real-time-update">
                          <th className="text-end text-muted fs-6">Net H.T.:</th>
                          <td className="text-end fw-semibold fs-6">{netHT.toFixed(3)} DT</td>
                        </tr>
                        <tr className="real-time-update">
                          <th className="text-end text-muted fs-6">TVA:</th>
                          <td className="text-end fw-semibold fs-6">{totalTax.toFixed(3)} DT</td>
                        </tr>
                        <tr className="real-time-update">
                          <th className="text-end text-muted fs-6">Total TTC:</th>
                          <td className="text-end fw-semibold fs-6 text-dark">
                            {grandTotal.toFixed(3)} DT
                          </td>
                        </tr>
                        {showRemise && globalRemise > 0 && (
                          <tr className="real-time-update">
                            <th className="text-end text-muted fs-6">
                              {remiseType === "percentage" 
                                ? `Remise (${globalRemise}%)` 
                                : `Remise (Montant fixe) ${discountPercentage.toFixed(2)}%`}
                            </th>
                            <td className="text-end text-danger fw-bold fs-6">
                              - {discountAmount.toFixed(3)} DT
                            </td>
                          </tr>
                        )}
                        
                        {/* Timbre Fiscal for Factures */}
                        {timbreFiscal && (
                          <tr className="real-time-update">
                            <th className="text-end text-muted fs-6">Timbre Fiscal:</th>
                            <td className="text-end fw-semibold fs-6">1.000 DT</td>
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

      {/* Notes Section */}
      <Card className="border-0 shadow-sm">
        <CardBody className="p-4">
          <h5 className="fw-semibold mb-3 text-primary">
            <i className="ri-sticky-note-line me-2"></i>
            Notes Additionnelles
          </h5>
          <div className="mb-3">
            <Label className="form-label-lg fw-semibold">Notes</Label>
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
        onClick={toggleFactureModal} 
        className="btn-invoice fs-6 px-4"
      >
        <i className="ri-close-line me-2"></i> 
        Annuler
      </Button>
      <Button 
        color="primary" 
        type="submit" 
        className="btn-invoice btn-invoice-primary fs-6 px-4"
        disabled={selectedArticles.length === 0 || !selectedFournisseur}
      >
        <i className="ri-save-line me-2"></i> 
        Créer la Facture
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

            <CreateArticleModal 
                isOpen={createArticleModal} 
                toggle={() => setCreateArticleModal(!createArticleModal)} 
                fournisseurs={fournisseurs}
                categories={categories}
                onSuccess={(newArticle) => handleAddArticle(newArticle)}
            />

            <EditArticleModal
                isOpen={editArticleModal}
                toggle={() => { setEditArticleModal(!editArticleModal); if (editArticleModal) setArticleToEdit(null); }}
                fournisseurs={fournisseurs}
                categories={categories}
                article={articleToEdit}
                onSuccess={(updatedArticle) => {
                    setFilteredArticles(prev => prev.map(a => a.id === updatedArticle.id ? updatedArticle : a));
                    setSelectedArticles(prev => prev.map(item => item.article_id === updatedArticle.id ? {
                        ...item,
                        articleDetails: updatedArticle,
                        prixUnitaire: updatedArticle.pua_ht || updatedArticle.puv_ht || item.prixUnitaire,
                        prixTTC: updatedArticle.pua_ttc || updatedArticle.puv_ttc || item.prixTTC,
                        tva: updatedArticle.tva || item.tva
                    } : item));
                }}
            />

            <QuantiteArticleModal
                article={articleToAdd}
                existingQuantity={
                    articleToAdd
                        ? Number(selectedArticles.find((item) => item.article_id === articleToAdd.id)?.quantite) || 0
                        : 0
                }
                onConfirm={confirmAddArticle}
                onCancel={() => setArticleToAdd(null)}
            />

            <AchatDocumentPDFModal
                isOpen={!!pdfDocument}
                toggle={() => setPdfDocument(null)}
                document={pdfDocument}
            />
        </div>
    );
};

export default BonReceptionList;