import React, { useEffect, useState, useMemo, useCallback } from "react";
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
    fetchFactures, createFacture, updateFacture, deleteFacture,
    fetchNextFactureNumberFromAPI, createPayment, fetchPayments, fetchNextPaymentNumberFromAPI
} from "../../../Components/Article/FactureServices";
import { fetchArticles, fetchFournisseurs } from "../../../Components/Article/ArticleServices";
import { Article, Fournisseur, FactureFournisseur, Payment } from "../../../Components/Article/Interfaces";
import classnames from "classnames";
import FacturePDFModal from "./FacturePDFModal";
import { useProfile } from "Components/Hooks/UserHooks";
import logo from '../../../assets/images/imglogo.png'
const FactureList = () => {
    const [detailModal, setDetailModal] = useState(false);
    const [paymentModal, setPaymentModal] = useState(false);
    const [createEditModal, setCreateEditModal] = useState(false);
    const [selectedFacture, setSelectedFacture] = useState<FactureFournisseur | null>(null);
    const [facture, setFacture] = useState<FactureFournisseur | null>(null);
    const [isEdit, setIsEdit] = useState(false);
    const [activeTab, setActiveTab] = useState("1");
    const [factures, setFactures] = useState<FactureFournisseur[]>([]);
    const [filteredFactures, setFilteredFactures] = useState<FactureFournisseur[]>([]);
    const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
    const [articles, setArticles] = useState<Article[]>([]);
    const [deleteModal, setDeleteModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [searchText, setSearchText] = useState("");
    const [nextPaymentNumber, setNextPaymentNumber] = useState("");
    const [articleSearch, setArticleSearch] = useState("");
    const [fournisseurSearch, setFournisseurSearch] = useState("");
    const [selectedFournisseur, setSelectedFournisseur] = useState<Fournisseur | null>(null);
    const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
    const [filteredFournisseurs, setFilteredFournisseurs] = useState<Fournisseur[]>([]);
    const [showRemise, setShowRemise] = useState(false);
// Add these states near your other useState declarations
const [editingTTC, setEditingTTC] = useState<{ [key: number]: string }>({});
const [editingHT, setEditingHT] = useState<{ [key: number]: string }>({});
    //
    const { userProfile, loading: profileLoading } = useProfile();
    const [nextFactureNumber, setNextFactureNumber] = useState("");
    const [selectedArticles, setSelectedArticles] = useState<{
        article_id: number;
        quantite: number | ""; // Allow empty string
        prixUnitaire: number;
        prixTTC: number; // Add this field
        tva?: number | null;
        remise?: number | null;
        articleDetails?: Article;
      }[]>([]);
     
      const parseNumericInput = (value: string): number => {
        if (!value || value === "") return 0;
        const cleanValue = value.replace(",", ".");
        const numericValue = parseFloat(cleanValue);
        return isNaN(numericValue) ? 0 : Math.round(numericValue * 1000) / 1000;
      };
   
      
    const [remiseType, setRemiseType] = useState<"percentage" | "fixed">("percentage");
    const [globalRemise, setGlobalRemise] = useState<number>(0);
    const [taxMode, setTaxMode] = useState<"HT" | "TTC">("HT");
    const [timbreFiscal, setTimbreFiscal] = useState<boolean>(false);
    const tvaOptions = [
        { value: null, label: "Non applicable" },
        { value: 0, label: "0% (Exonéré)" },
        { value: 7, label: "7%" },
        { value: 10, label: "10%" },
        { value: 13, label: "13%" },
        { value: 19, label: "19%" },
        { value: 21, label: "21%" }
    ];
    const [pdfModal, setPdfModal] = useState(false);
    const [selectedFactureForPdf, setSelectedFactureForPdf] = useState<FactureFournisseur | null>(null);
    const companyInfo = useMemo(() => ({
        name: userProfile?.company_name ,
        address: userProfile?.company_address ,
        city: userProfile?.company_city ,
        phone: userProfile?.company_phone ,
        email: userProfile?.company_email ,
        website: userProfile?.company_website ,
        taxId: userProfile?.company_tax_id,
        logo: logo,
    }), [userProfile]);
    const openPdfModal = (facture: FactureFournisseur) => {
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
                const year = moment().format('YYYY');
                const defaultNumber = `FAC-${year}${String(factures.length + 1).padStart(5, '0')}`;
                setNextFactureNumber(defaultNumber);
            }
        };
        if (!isEdit) {
            fetchNextNumber();
        }
    }, [isEdit, factures.length]);
    useEffect(() => {
        const fetchNextPaymentNumber = async () => {
            try {
                const nextNumber = await fetchNextPaymentNumberFromAPI();
                setNextPaymentNumber(nextNumber);
            } catch (err) {
                console.error("Failed to fetch next payment number:", err);
                const year = moment().format('YYYY');
                const defaultNumber = `PAY-P${year}${String(0 + 1).padStart(5, '0')}`;
                setNextPaymentNumber(defaultNumber);
            }
        };
        fetchNextPaymentNumber();
    }, []);
   // Fix the article search useEffect
useEffect(() => {
    if (articleSearch.length >= 3) {
      const filtered = articles.filter(
        (article) =>
          (article.designation?.toLowerCase() || "").includes(articleSearch.toLowerCase()) ||
          (article.reference?.toLowerCase() || "").includes(articleSearch.toLowerCase())
      );
      setFilteredArticles(filtered);
    } else {
      setFilteredArticles([]);
    }
  }, [articleSearch, articles]);
 
  // Fix the fournisseur search useEffect
  useEffect(() => {
    if (fournisseurSearch.length >= 3) {
      const filtered = fournisseurs.filter(
        (fournisseur) =>
          (fournisseur.raison_sociale?.toLowerCase() || "").includes(fournisseurSearch.toLowerCase())
      );
      setFilteredFournisseurs(filtered);
    } else {
      setFilteredFournisseurs([]);
    }
  }, [fournisseurSearch, fournisseurs]);
    useEffect(() => {
        if (fournisseurSearch.length >= 3) {
            const filtered = fournisseurs.filter(fournisseur =>
                fournisseur.raison_sociale.toLowerCase().includes(fournisseurSearch.toLowerCase())
            );
            setFilteredFournisseurs(filtered);
        } else {
            setFilteredFournisseurs([]);
        }
    }, [fournisseurSearch, fournisseurs]);
    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [facturesData, fournisseursData, articlesData, paymentsData] = await Promise.all([
                fetchFactures(),
                fetchFournisseurs(),
                fetchArticles(),
                fetchPayments()
            ]);
   
            const facturesWithCalculatedPayments = facturesData.map(facture => {
                const relevantPayments = paymentsData.filter(payment =>
                    payment.factureFournisseur && payment.factureFournisseur.id === facture.id
                );
   
                const totalPayments = relevantPayments.reduce((sum, payment) => {
                    let paymentAmount: number;
                    if (typeof payment.montant === 'string') {
                        paymentAmount = parseFloat(payment.montant) || 0;
                    } else {
                        paymentAmount = payment.montant || 0;
                    }
                    return sum + paymentAmount;
                }, 0);
   
                let status: "Brouillon" | "Validee" | "Payee" | "Annulee" | "Partiellement Payee" = facture.status;
                let subTotal = 0;
                let totalTax = 0;
                let grandTotal = 0;
   
                facture.articles.forEach(item => {
                    const qty = Number(item.quantite) || 1;
                    const priceHT = Number(item.prixUnitaire) || 0;
                    const tvaRate = Number(item.tva ?? 0);
                    const remiseRate = Number(item.remise || 0);
                    const priceTTC = Number(item.prix_ttc) || priceHT * (1 + tvaRate / 100);
   
                    const montantHTLigne = Math.round(qty * priceHT * (1 - remiseRate / 100) * 1000) / 1000;
                    const montantTTCLigne = Math.round(qty * priceTTC * 1000) / 1000;
                    const taxAmount = Math.round((montantTTCLigne - montantHTLigne) * 1000) / 1000;
   
                    subTotal += montantHTLigne;
                    totalTax += taxAmount;
                    grandTotal += montantTTCLigne;
                });
   
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
               
                let resteAPayer = Math.round((finalTotal - totalPayments) * 1000) / 1000;
               
                // Ensure no negative values
                resteAPayer = Math.max(0, resteAPayer);
   
                // Update status logic
                if (facture.status === "Annulee") {
                    status = "Annulee";
                } else if (Math.abs(resteAPayer) < 0.001 && finalTotal > 0) {
                    status = "Payee";
                } else if (totalPayments > 0 && totalPayments < finalTotal) {
                    status = "Partiellement Payee";
                }
   
                return {
                    ...facture,
                    totalHT: subTotal,
                    totalTVA: totalTax,
                    totalTTC: grandTotal,
                    totalTTCAfterRemise: finalTotal,
                    montantPaye: totalPayments,
                    resteAPayer: resteAPayer,
                    status: status,
                    hasPayments: totalPayments > 0
                };
            });
   
            setFactures(facturesWithCalculatedPayments);
            setFilteredFactures(facturesWithCalculatedPayments);
            setFournisseurs(fournisseursData);
            setArticles(articlesData);
            setLoading(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Échec du chargement des données");
            setLoading(false);
        }
    }, []);
    useEffect(() => {
        fetchData();
    }, [fetchData]);
   
    useEffect(() => {
        let result = [...factures];
        if (activeTab === "2") {
            result = result.filter(facture => facture.status === "Brouillon");
        } else if (activeTab === "3") {
            result = result.filter(facture => facture.status === "Validee");
        } else if (activeTab === "4") {
            result = result.filter(facture => facture.status === "Payee");
        } else if (activeTab === "5") {
            result = result.filter(facture => facture.status === "Annulee");
        }
        if (startDate && endDate) {
            const start = moment(startDate).startOf('day');
            const end = moment(endDate).endOf('day');
            result = result.filter(facture => {
                const factureDate = moment(facture.dateFacture);
                return factureDate.isBetween(start, end, null, '[]');
            });
        }
        if (searchText) {
            const searchLower = searchText.toLowerCase();
            result = result.filter(facture =>
                facture.numeroFacture.toLowerCase().includes(searchLower) ||
                (facture.fournisseur?.raison_sociale && facture.fournisseur.raison_sociale.toLowerCase().includes(searchLower))
            );
        }
        setFilteredFactures(result);
    }, [activeTab, startDate, endDate, searchText, factures]);
      // Replace the current useMemo calculation with this:
const { sousTotalHT, netHT, totalTax, grandTotal, finalTotal, discountAmount } = useMemo(() => {
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
    let netHTValue = 0;
    let totalTaxValue = 0;
    let grandTotalValue = 0;
 
    // Calculate initial totals with proper rounding
    selectedArticles.forEach((article) => {
      const qty = article.quantite === "" ? 0 : Number(article.quantite) || 0;
      const tvaRate = Number(article.tva) || 0;
      const remiseRate = Number(article.remise) || 0;
     
      let priceHT = Number(article.prixUnitaire) || 0;
      let priceTTC = Number(article.prixTTC) || 0;
     
      if (editingHT[article.article_id] !== undefined) {
        const editingValue = parseNumericInput(editingHT[article.article_id]);
        if (!isNaN(editingValue) && editingValue >= 0) {
          priceHT = parseFloat(editingValue.toFixed(3));
          const tvaAmount = tvaRate > 0 ? parseFloat(((priceHT * tvaRate) / 100).toFixed(3)) : 0;
          priceTTC = parseFloat((priceHT + tvaAmount).toFixed(3));
        }
      } else if (editingTTC[article.article_id] !== undefined) {
        const editingValue = parseNumericInput(editingTTC[article.article_id]);
        if (!isNaN(editingValue) && editingValue >= 0) {
          priceTTC = parseFloat(editingValue.toFixed(3));
          if (tvaRate > 0) {
            const coefficient = 1 + tvaRate / 100;
            priceHT = parseFloat((priceTTC / coefficient).toFixed(3));
          } else {
            priceHT = priceTTC;
          }
        }
      }
     
      // Calculate line amounts
      const montantSousTotalHT = Math.round(qty * priceHT * 1000) / 1000;
      const montantNetHT = Math.round(qty * priceHT * (1 - remiseRate / 100) * 1000) / 1000;
      const montantTTCLigne = Math.round(qty * priceTTC * 1000) / 1000;
      const montantTVA = Math.round((montantTTCLigne - montantNetHT) * 1000) / 1000;
 
      sousTotalHTValue += montantSousTotalHT;
      netHTValue += montantNetHT;
      totalTaxValue += montantTVA;
      grandTotalValue += montantTTCLigne;
    });
 
    // Round accumulated values
    sousTotalHTValue = Math.round(sousTotalHTValue * 1000) / 1000;
    netHTValue = Math.round(netHTValue * 1000) / 1000;
    totalTaxValue = Math.round(totalTaxValue * 1000) / 1000;
    grandTotalValue = Math.round(grandTotalValue * 1000) / 1000;
 
    let finalTotalValue = grandTotalValue;
    let discountAmountValue = 0;
    let netHTAfterDiscount = netHTValue;
    let totalTaxAfterDiscount = totalTaxValue;
 
    // Apply remise logic with proper rounding
    if (showRemise && Number(globalRemise) > 0) {
      if (remiseType === "percentage") {
        discountAmountValue = Math.round(netHTValue * (Number(globalRemise) / 100) * 1000) / 1000;
        netHTAfterDiscount = Math.round((netHTValue - discountAmountValue) * 1000) / 1000;
       
        const discountRatio = netHTAfterDiscount / netHTValue;
        totalTaxAfterDiscount = Math.round(totalTaxValue * discountRatio * 1000) / 1000;
       
        finalTotalValue = Math.round((netHTAfterDiscount + totalTaxAfterDiscount) * 1000) / 1000;
       
      } else if (remiseType === "fixed") {
        finalTotalValue = Math.round(Number(globalRemise) * 1000) / 1000;
       
        const tvaToHtRatio = totalTaxValue / netHTValue;
        const htAfterDiscount = Math.round(finalTotalValue / (1 + tvaToHtRatio) * 1000) / 1000;
       
        discountAmountValue = Math.round((netHTValue - htAfterDiscount) * 1000) / 1000;
        netHTAfterDiscount = htAfterDiscount;
        totalTaxAfterDiscount = Math.round(netHTAfterDiscount * tvaToHtRatio * 1000) / 1000;
      }
    }
 
    // Add timbre fiscal
    if (timbreFiscal) {
      finalTotalValue = Math.round((finalTotalValue + 1) * 1000) / 1000;
    }
 
    // Use discounted values for final display
    const displayNetHT = showRemise && Number(globalRemise) > 0 ? netHTAfterDiscount : netHTValue;
    const displayTotalTax = showRemise && Number(globalRemise) > 0 ? totalTaxAfterDiscount : totalTaxValue;
 
    return {
      sousTotalHT: Math.round(sousTotalHTValue * 1000) / 1000,
      netHT: Math.round(displayNetHT * 1000) / 1000,
      totalTax: Math.round(displayTotalTax * 1000) / 1000,
      grandTotal: Math.round(grandTotalValue * 1000) / 1000,
      finalTotal: Math.round(finalTotalValue * 1000) / 1000,
      discountAmount: Math.round(discountAmountValue * 1000) / 1000,
    };
  }, [selectedArticles, showRemise, globalRemise, remiseType, timbreFiscal, editingHT, editingTTC]);
  const handleAddArticle = (articleId: string) => {
    const article = articles.find(a => a.id === parseInt(articleId));
    if (article && !selectedArticles.some(item => item.article_id === article.id)) {
      const initialHT = article.pua_ht || 0;
      const initialTVA = article.tva || 0;
      const initialTTC = article.pua_ttc || initialHT * (1 + (initialTVA || 0) / 100);
 
      setSelectedArticles([
        ...selectedArticles,
        {
          article_id: article.id,
          quantite: "", // Start with empty instead of 0
          prixUnitaire: initialHT,
          prixTTC: Math.round(initialTTC * 1000) / 1000, // Ensure proper rounding
          tva: initialTVA,
          remise: 0,
          articleDetails: article
        }
      ]);
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
    const toggleCreateEditModal = useCallback(() => {
        if (createEditModal) {
            setCreateEditModal(false);
            setFacture(null);
            setSelectedArticles([]);
            setGlobalRemise(0);
            setRemiseType("percentage");
            setShowRemise(false);
            setTimbreFiscal(false);
            setSelectedFournisseur(null);
            validation.resetForm();
        } else {
            setCreateEditModal(true);
        }
    }, [createEditModal]);
    const handleSubmit = async (values: any) => {
        try {
            const factureData = {
                ...values,
                taxMode,
                fournisseur_id: selectedFournisseur?.id,
                remise: globalRemise,
                remiseType: remiseType,
                articles: selectedArticles.map(item => ({
                    article_id: item.article_id,
                    quantite: item.quantite,
                    prix_unitaire: item.prixUnitaire,
                    prix_ttc: item.prixTTC,
                    tva: item.tva,
                    remise: item.remise
                })),
               // totalHT: subTotal,
                totalTVA: totalTax,
                totalTTC: Number(grandTotal),
                timbreFiscal: timbreFiscal
            };
            if (isEdit && facture) {
                await updateFacture(facture.id, factureData);
                toast.success("Facture mise à jour avec succès");
            } else {
                await createFacture(factureData);
                toast.success("Facture créée avec succès");
            }
            setCreateEditModal(false);
            fetchData();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Échec de l'opération");
        }
    };
    const validation = useFormik({
        enableReinitialize: true,
        initialValues: {
            numeroFacture: isEdit ? (facture?.numeroFacture || "") : nextFactureNumber,
            dateFacture: facture?.dateFacture ? moment(facture.dateFacture).format("YYYY-MM-DD") : moment().format("YYYY-MM-DD"),
            status: facture?.status ?? "Brouillon",
            notes: facture?.notes ?? "",
            fournisseur_id: facture?.fournisseur?.id ?? "",
            modeReglement: facture?.modeReglement ?? "Espece",
            dateEcheance: facture?.dateEcheance ? moment(facture.dateEcheance).format("YYYY-MM-DD") : "",
            montantPaye: facture?.montantPaye ?? 0,
            conditionPaiement: facture?.conditionPaiement ?? ""
        },
        validationSchema: Yup.object().shape({
            numeroFacture: Yup.string().required("Le numéro est requis"),
            dateFacture: Yup.date().required("La date est requise"),
            status: Yup.string().required("Le statut est requis"),
            fournisseur_id: Yup.number().required("Le fournisseur est requis"),
            modeReglement: Yup.string().required("Le mode de règlement est requis"),
            dateEcheance: Yup.date().nullable(),
            montantPaye: Yup.number().min(0, "Le montant payé ne peut pas être négatif"),
            conditionPaiement: Yup.string().nullable()
        }),
        onSubmit: handleSubmit
    });
    const openDetailModal = (facture: FactureFournisseur) => {
        setSelectedFacture(facture);
        setDetailModal(true);
    };
    const openPaymentModal = async (facture: FactureFournisseur) => {
        setSelectedFacture(facture);
        setPaymentModal(true);
   
        try {
            const nextNumber = await fetchNextPaymentNumberFromAPI();
            setNextPaymentNumber(nextNumber);
           
            // Reset form with current values
            setTimeout(() => {
                const initialMontant = facture.resteAPayer.toFixed(3).replace('.', ',');
                paymentValidation.setValues({
                    montant: initialMontant,
                    modePaiement: "Espece",
                    numeroPaiement: nextNumber,
                    date: moment().format("YYYY-MM-DD")
                });
            }, 100);
        } catch (err) {
            console.error("Failed to fetch next payment number:", err);
            setTimeout(() => {
                const initialMontant = facture.resteAPayer.toFixed(3).replace('.', ',');
                paymentValidation.setValues({
                    montant: initialMontant,
                    modePaiement: "Espece",
                    numeroPaiement: nextPaymentNumber,
                    date: moment().format("YYYY-MM-DD")
                });
            }, 100);
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
            toast.error(err instanceof Error ? err.message : "Échec de la suppression");
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
    
    const handlePaymentSubmit = async (values: any) => {
        if (!selectedFacture) return;
   
        if (selectedFacture.status === "Payee" || selectedFacture.status === "Annulee") {
            toast.error("Impossible d'ajouter un paiement pour une facture payée ou annulée.");
            return;
        }
   
        // values.montant is now already converted to number in the onSubmit
        const paymentAmount = values.montant;
       
        // Fix floating point comparison
        const roundedAmount = Math.round(paymentAmount * 1000) / 1000;
        const roundedReste = Math.round(selectedFacture.resteAPayer * 1000) / 1000;
       
        if (roundedAmount > roundedReste) {
            toast.error("Le montant du paiement ne peut pas dépasser le reste à payer.");
            return;
        }
   
        try {
            const paymentData = {
                facture_id: selectedFacture.id,
                montant: paymentAmount,
                modePaiement: values.modePaiement,
                numeroPaiement: values.numeroPaiement,
                date: values.date,
            };
   
            await createPayment(paymentData);
            setPaymentModal(false);
            fetchData();
            toast.success("Paiement enregistré avec succès");
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Échec de l'enregistrement du paiement");
        }
    };
   
    const paymentValidation = useFormik({
        enableReinitialize: true,
        initialValues: {
            montant: "0,000",
            modePaiement: "Espece",
            numeroPaiement: nextPaymentNumber,
            date: moment().format("YYYY-MM-DD")
        },
        validationSchema: Yup.object({
            montant: Yup.string()
                .test('is-valid-amount', "Le montant doit être un nombre valide", function (value) {
                    if (!value) return false;
                   
                    // Replace comma with dot for validation
                    const numericValue = parseFloat(value.replace(',', '.'));
                    return !isNaN(numericValue) && numericValue > 0;
                })
                .test('min-amount', "Le montant doit être supérieur à 0", function (value) {
                    if (!value) return false;
                    const numericValue = parseFloat(value.replace(',', '.'));
                    return numericValue >= 0.001;
                })
                .test('max-reste', "Le montant ne peut pas dépasser le reste à payer", function (value) {
                    if (!value) return false;
                    const numericValue = parseFloat(value.replace(',', '.'));
                    const reste = selectedFacture?.resteAPayer || 0;
                   
                    // Round both values to 3 decimal places for precise comparison
                    const roundedValue = Math.round(numericValue * 1000) / 1000;
                    const roundedReste = Math.round(reste * 1000) / 1000;
                   
                    return roundedValue <= roundedReste;
                })
                .required("Le montant est requis"),
            modePaiement: Yup.string().required("Le mode de paiement est requis"),
            numeroPaiement: Yup.string().required("Le numéro de paiement est requis"),
            date: Yup.date().required("La date est requise")
        }),
        onSubmit: (values) => {
            // Convert string to number before submitting
            const numericMontant = parseFloat(values.montant.replace(',', '.'));
            handlePaymentSubmit({
                ...values,
                montant: numericMontant
            });
        }
    });
    // Add these helper functions at the top of your component
const formatForDisplay = (value: number | string | undefined | null): string => {
    if (value === undefined || value === null) return "0,000";
   
    const numericValue = typeof value === "string" ? parseFloat(value.replace(",", ".")) : Number(value);
   
    if (isNaN(numericValue)) return "0,000";
   
    return numericValue.toFixed(3).replace(".", ",");
  };
 
 
    // Custom handler for montant field
    const handleMontantChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value;
       
        // Allow only numbers, one comma, or one dot
        if (value === '' || /^[0-9]*[,.]?[0-9]*$/.test(value)) {
            // Replace dot with comma for consistent display
            value = value.replace('.', ',');
           
            // Allow only one comma
            const commaCount = (value.match(/,/g) || []).length;
            if (commaCount <= 1) {
                paymentValidation.setFieldValue('montant', value);
            }
        }
    };
   
    const handleMontantBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        let value = e.target.value;
       
        if (value) {
            // Ensure comma as decimal separator
            value = value.replace('.', ',');
           
            // Format to 3 decimal places
            const parts = value.split(',');
            if (parts.length === 1) {
                // No decimal part
                value = value + ',000';
            } else if (parts.length === 2) {
                // Has decimal part
                const integerPart = parts[0] || '0';
                let decimalPart = parts[1];
               
                // Ensure exactly 3 decimal digits
                if (decimalPart.length === 0) {
                    decimalPart = '000';
                } else if (decimalPart.length === 1) {
                    decimalPart = decimalPart + '00';
                } else if (decimalPart.length === 2) {
                    decimalPart = decimalPart + '0';
                } else if (decimalPart.length > 3) {
                    decimalPart = decimalPart.substring(0, 3);
                }
               
                value = integerPart + ',' + decimalPart;
            }
           
            paymentValidation.setFieldValue('montant', value);
        }
    };
    const StatusBadge = ({ status }: { status?: "Brouillon" | "Validee" | "Payee" | "Annulee" | "Partiellement Payee" }) => {
        const statusConfig = {
            "Brouillon": { bgClass: "bg-warning", textClass: "text-warning", icon: "ri-time-line" },
            "Validee": { bgClass: "bg-primary", textClass: "text-primary", icon: "ri-checkbox-circle-line" },
            "Payee": { bgClass: "bg-success", textClass: "text-success", icon: "ri-money-dollar-circle-line" },
            "Annulee": { bgClass: "bg-danger", textClass: "text-danger", icon: "ri-close-circle-line" },
            "Partiellement Payee": { bgClass: "bg-info", textClass: "text-info", icon: "ri-wallet-line" }
        };
   
        const config = status && status in statusConfig ? statusConfig[status] : statusConfig["Brouillon"];
   
        return (
            <span className={`badge ${config.bgClass}-subtle ${config.textClass} text-uppercase`}>
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
                    <Link to="#" className="text-body fw-medium" onClick={() => openDetailModal(cell.row.original)}>
                        {cell.getValue()}
                    </Link>
                ),
            },
            {
                header: "Date Facture",
                accessorKey: "dateFacture",
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
                header: "Total TTC",
                accessorKey: "totalTTC",
                enableColumnFilter: false,
                cell: (cell: any) => {
                    const total = Number(cell.getValue()) || 0;
                    return `${total.toFixed(3)} DT`;
                },
            },
            {
                header: "Total TTC Après Remise",
                accessorKey: "totalTTCAfterRemise", // Use the calculated field
                enableColumnFilter: false,
                cell: (cell: any) => {
                    const total = Number(cell.getValue()) || 0;
                    return `${total.toFixed(3)} DT`;
                },
            },
            {
                header: "Payé",
                accessorKey: "montantPaye",
                enableColumnFilter: false,
                cell: (cell: any) => `${Number(cell.getValue()).toFixed(3)} DT`,
            },
            {
                header: "Reste à payer",
                accessorKey: "resteAPayer",
                enableColumnFilter: false,
                cell: (cell: any) => {
                    const value = Number(cell.getValue());
                    const displayValue = Math.abs(value).toFixed(3);
                    return `${displayValue} DT`;
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
                    const facture = cellProps.row.original;
                    const hasPayments = facture.montantPaye > 0;
                   
                    return (
                        <ul className="list-inline hstack gap-2 mb-0">
                            {/* View Detail - Always visible */}
                            <li className="list-inline-item">
                                <Link to="#" className="text-info d-inline-block" onClick={() => openDetailModal(facture)}>
                                    <i className="ri-eye-line fs-16"></i>
                                </Link>
                            </li>
                           
                            {/* PDF - Always visible */}
                            <li className="list-inline-item">
                                <Link to="#" className="text-info d-inline-block" onClick={() => openPdfModal(facture)}>
                                    <i className="ri-file-pdf-line fs-16"></i>
                                </Link>
                            </li>
                           
                            {/* Edit - Only show if no payments and not cancelled */}
                          
                            {!hasPayments && facture.status !== "Annulee" && (
                                <li className="list-inline-item edit">
                                    <Link to="#" className="text-primary d-inline-block edit-item-btn" onClick={() => {
                                        setFacture(facture);
                                        setSelectedFournisseur(facture.fournisseur);
                                        setSelectedArticles(facture.articles.map((item: FactureFournisseur['articles'][number]) => ({
                                            article_id: item.article.id,
                                            quantite: item.quantite,
                                            prixUnitaire: Number(item.prixUnitaire),
                                            prixTTC: Number(item.prix_ttc) || Number(item.prixUnitaire) * (1 + (item.tva || 0) / 100),
                                            tva: item.tva != null ? Number(item.tva) : null,
                                            remise: item.remise != null ? Number(item.remise) : null,
                                            articleDetails: item.article
                                        })));
                                        setGlobalRemise(facture.remise || 0);
                                        setRemiseType(facture.remiseType || "percentage");
                                        setShowRemise(!!facture.remise && facture.remise > 0);
                                        setTimbreFiscal(facture.timbreFiscal || false);
                                        setIsEdit(true);
                                        setCreateEditModal(true);
                                    }}>
                                        <i className="ri-pencil-fill fs-16"></i>
                                    </Link>
                                </li>
                            )}
                           
                            {/* Add Payment - Only show if not cancelled and has remaining amount */}
                            {facture.status !== "Annulee" && facture.resteAPayer > 0 && (
                                <li className="list-inline-item">
                                    <Link to="#" className="text-success d-inline-block" onClick={() => openPaymentModal(facture)}>
                                        <i className="ri-money-dollar-circle-line fs-16"></i>
                                    </Link>
                                </li>
                            )}
                           
                            {/* Delete - Only show if no payments and not cancelled */}
                            {!hasPayments && facture.status !== "Annulee" && (
                                <li className="list-inline-item">
                                    <Link to="#" className="text-danger d-inline-block" onClick={() => {
                                        setFacture(facture);
                                        setDeleteModal(true);
                                    }}>
                                        <i className="ri-delete-bin-5-fill fs-16"></i>
                                    </Link>
                                </li>
                            )}
                           
                            {/* Cancel : {facture.status !== "Annulee" && facture.status !== "Payee" && (
                                <li className="list-inline-item">
                                    <Link to="#" className="text-danger d-inline-block" onClick={() => handleAnnuler(facture.id)}>
                                        <i className="ri-close-circle-line fs-16"></i>
                                    </Link>
                                </li>
                            )}*/}
                     
                        </ul>
                    );
                },
            },
        ],
        []
    );
    return (
        <div className="page-content">
            <DeleteModal show={deleteModal} onDeleteClick={handleDelete} onCloseClick={() => setDeleteModal(false)} />
            <Container fluid>
                <BreadCrumb title="Factures Fournisseurs" pageTitle="Factures" />
                <Row>
                    <Col lg={12}>
                        <Card id="factureList">
                            <CardHeader className="card-header border-0">
                                <Row className="align-items-center gy-3">
                                    <div className="col-sm">
                                        <h5 className="card-title mb-0">Gestion des Factures Fournisseurs</h5>
                                    </div>
                                    <div className="col-sm-auto">
                                        <Button color="secondary" onClick={() => {
                                            setIsEdit(false);
                                            setFacture(null);
                                            setSelectedArticles([]);
                                            setSelectedFournisseur(null);
                                            setGlobalRemise(0);
                                            setRemiseType("percentage");
                                            setShowRemise(false);
                                            setTimbreFiscal(false);
                                            validation.resetForm();
                                            setCreateEditModal(true);
                                        }}>
                                            <i className="ri-add-line align-bottom me-1"></i> Ajouter Facture
                                        </Button>
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
                                        <i className="ri-checkbox-circle-line me-1 align-bottom"></i> Validée
                                    </NavLink>
                                </NavItem>
                                <NavItem>
                                    <NavLink className={classnames({ active: activeTab === "4" })} onClick={() => setActiveTab("4")}>
                                        <i className="ri-money-dollar-circle-line me-1 align-bottom"></i> Payée
                                    </NavLink>
                                </NavItem>
                                <NavItem>
                                    <NavLink className={classnames({ active: activeTab === "5" })} onClick={() => setActiveTab("5")}>
                                        <i className="ri-close-circle-line me-1 align-bottom"></i> Annulée
                                    </NavLink>
                                </NavItem>
                            </Nav>
                            <CardBody className="pt-3">
                                <Row className="mb-3">
                                    <Col md={4}>
                                        <div className="search-box">
                                            <Input type="text" className="form-control" placeholder="Rechercher..." value={searchText} onChange={(e) => setSearchText(e.target.value)} />
                                            <i className="ri-search-line search-icon"></i>
                                        </div>
                                    </Col>
                                    <Col md={3}>
                                        <InputGroup>
                                            <InputGroupText>De</InputGroupText>
                                            <Flatpickr className="form-control" options={{ dateFormat: "d M, Y", altInput: true, altFormat: "F j, Y" }} placeholder="Date de début" onChange={(dates) => setStartDate(dates[0])} />
                                        </InputGroup>
                                    </Col>
                                    <Col md={3}>
                                        <InputGroup>
                                            <InputGroupText>À</InputGroupText>
                                            <Flatpickr className="form-control" options={{ dateFormat: "d M, Y", altInput: true, altFormat: "F j, Y" }} placeholder="Date de fin" onChange={(dates) => setEndDate(dates[0])} />
                                        </InputGroup>
                                    </Col>
                                    <Col md={2}>
                                        <Button color="light" className="w-100" onClick={() => { setStartDate(null); setEndDate(null); setSearchText(""); }}>
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
                                        data={filteredFactures}
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
  <ModalHeader toggle={() => setDetailModal(false)} className="border-0 pb-3">
    <div className="d-flex align-items-center">
      <div className="modal-icon-wrapper bg-info bg-opacity-10 rounded-circle p-2 me-3">
        <i className="ri-file-text-line text-info fs-4"></i>
      </div>
      <div>
        <h4 className="mb-0 fw-bold text-dark">
          Facture #{selectedFacture?.numeroFacture}
        </h4>
        <small className="text-muted">
          {moment(selectedFacture?.dateFacture).format("DD MMM YYYY")}
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
                  Informations Fournisseur
                </h6>
                <div className="d-flex align-items-center">
                  <div className="flex-grow-1">
                    <h5 className="mb-1">{selectedFacture.fournisseur?.raison_sociale}</h5>
                    <p className="text-muted mb-1">
                      <i className="ri-phone-line me-1"></i>
                      {selectedFacture.fournisseur?.telephone1 || "N/A"}
                    </p>
                    <p className="text-muted mb-0">
                      <i className="ri-map-pin-line me-1"></i>
                      {selectedFacture.fournisseur?.adresse || "N/A"}
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
                      <span className="text-muted d-block">Mode règlement:</span>
                      <strong>{selectedFacture.modeReglement || "N/A"}</strong>
                    </p>
                  </div>
                  <div className="col-6">
                    <p className="mb-2">
                      <span className="text-muted d-block">Statut:</span>
                      <StatusBadge status={selectedFacture.status} />
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
              <p className="mb-0 text-muted">{selectedFacture.notes}</p>
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
                  {selectedFacture.articles.map((item, index) => {
                    const quantite = Number(item.quantite) || 0;
                    const priceHT = Number(item.prixUnitaire) || 0;
                    const tvaRate = Number(item.tva || 0);
                    const remiseRate = Number(item.remise || 0);
                    const priceTTC = Number(item.prix_ttc) || priceHT * (1 + tvaRate / 100);
                   
                    const montantSousTotalHT = Math.round(quantite * priceHT * 1000) / 1000;
                    const montantNetHT = Math.round(quantite * priceHT * (1 - remiseRate / 100) * 1000) / 1000;
                    const montantTTCLigne = Math.round(quantite * priceTTC * 1000) / 1000;
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
                    let sousTotalHTValue = 0;
                    let netHTValue = 0;
                    let totalTaxValue = 0;
                    let grandTotalValue = 0;
                    selectedFacture.articles.forEach((article) => {
                      const qty = Number(article.quantite) || 0;
                      const tvaRate = Number(article.tva || 0);
                      const remiseRate = Number(article.remise || 0);
                     
                      const priceHT = Number(article.prixUnitaire) || 0;
                      const priceTTC = Number(article.prix_ttc) || priceHT * (1 + tvaRate / 100);
                      const montantSousTotalHT = Math.round(qty * priceHT * 1000) / 1000;
                      const montantNetHT = Math.round(qty * priceHT * (1 - remiseRate / 100) * 1000) / 1000;
                      const montantTTCLigne = Math.round(qty * priceTTC * 1000) / 1000;
                      const montantTVA = Math.round((montantTTCLigne - montantNetHT) * 1000) / 1000;
                      sousTotalHTValue += montantSousTotalHT;
                      netHTValue += montantNetHT;
                      totalTaxValue += montantTVA;
                      grandTotalValue += montantTTCLigne;
                    });
                    sousTotalHTValue = Math.round(sousTotalHTValue * 1000) / 1000;
                    netHTValue = Math.round(netHTValue * 1000) / 1000;
                    totalTaxValue = Math.round(totalTaxValue * 1000) / 1000;
                    grandTotalValue = Math.round(grandTotalValue * 1000) / 1000;
                    const remiseValue = Number(selectedFacture.remise) || 0;
                    const remiseTypeValue = selectedFacture.remiseType || "percentage";
                   
                    let finalTotalValue = grandTotalValue;
                    let discountAmountValue = 0;
                    let netHTAfterDiscount = netHTValue;
                    let totalTaxAfterDiscount = totalTaxValue;
                    let discountPercentage = 0;
                    if (remiseValue > 0) {
                      if (remiseTypeValue === "percentage") {
                        discountAmountValue = Math.round(netHTValue * (remiseValue / 100) * 1000) / 1000;
                        netHTAfterDiscount = Math.round((netHTValue - discountAmountValue) * 1000) / 1000;
                       
                        const discountRatio = netHTAfterDiscount / netHTValue;
                        totalTaxAfterDiscount = Math.round(totalTaxValue * discountRatio * 1000) / 1000;
                       
                        finalTotalValue = Math.round((netHTAfterDiscount + totalTaxAfterDiscount) * 1000) / 1000;
                       
                      } else if (remiseTypeValue === "fixed") {
                        finalTotalValue = Math.round(Number(remiseValue) * 1000) / 1000;
                       
                        const tvaToHtRatio = totalTaxValue / netHTValue;
                        const htAfterDiscount = Math.round(finalTotalValue / (1 + tvaToHtRatio) * 1000) / 1000;
                       
                        discountAmountValue = Math.round((netHTValue - htAfterDiscount) * 1000) / 1000;
                        netHTAfterDiscount = htAfterDiscount;
                        totalTaxAfterDiscount = Math.round(netHTAfterDiscount * tvaToHtRatio * 1000) / 1000;
                       
                        discountPercentage = Math.round((discountAmountValue / netHTValue) * 100 * 100) / 100;
                      }
                    }
                    // Add timbre fiscal
                    if (selectedFacture.timbreFiscal) {
                      finalTotalValue = Math.round((finalTotalValue + 1) * 1000) / 1000;
                    }
                    const displayNetHT = remiseValue > 0 ? netHTAfterDiscount : netHTValue;
                    const displayTotalTax = remiseValue > 0 ? totalTaxAfterDiscount : totalTaxValue;
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
                          {selectedFacture.timbreFiscal && (
                            <tr className="real-time-update">
                              <th className="text-end text-muted fs-6">Timbre Fiscal:</th>
                              <td className="text-end fw-semibold fs-6">1.000 DT</td>
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
                          {/* Payment Information */}
                          <tr className="real-time-update">
                            <th className="text-end text-muted fs-6">Montant payé:</th>
                            <td className="text-end fw-semibold fs-6">
                              {Number(selectedFacture.montantPaye).toFixed(3)} DT
                            </td>
                          </tr>
                          <tr className={`real-time-update ${Number(selectedFacture.resteAPayer) > 0 ? "table-warning" : "table-success"}`}>
                            <th className="text-end text-muted fs-6">Reste à payer:</th>
                            <td className="text-end fw-bold fs-6">
                              {Number(selectedFacture.resteAPayer).toFixed(3)} DT
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
    {selectedFacture &&
      selectedFacture.resteAPayer > 0 &&
      selectedFacture.status !== "Annulee" &&
      selectedFacture.status !== "Payee" && (
        <Button
          color="success"
          size="md"
          onClick={() => openPaymentModal(selectedFacture)}
          className="btn-invoice btn-invoice-success me-2"
        >
          <i className="ri-money-dollar-circle-line me-2"></i> Paiement
        </Button>
      )}
   
    <Button
      color="primary"
      onClick={() => selectedFacture && openPdfModal(selectedFacture)}
      className="btn-invoice btn-invoice-primary me-2"
      disabled={!selectedFacture}
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
  isOpen={createEditModal}
  toggle={toggleCreateEditModal}
  centered
  size="xl"
  className="invoice-modal"
  style={{ maxWidth: '1200px' }}
>
  <ModalHeader toggle={toggleCreateEditModal} className="border-0 pb-3">
    <div className="d-flex align-items-center">
      <div className="modal-icon-wrapper bg-primary bg-opacity-10 rounded-circle p-2 me-3">
        <i className="ri-file-list-3-line text-primary fs-4"></i>
      </div>
      <div>
        <h4 className="mb-0 fw-bold text-dark">
          {isEdit ? "Modifier Facture" : "Créer Nouvelle Facture"}
        </h4>
        <small className="text-muted">
          {isEdit ? "Modifier les détails de la facture existante" : "Créer une nouvelle facture fournisseur"}
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
            {/* Numéro de Facture */}
            <Col md={4}>
              <div className="mb-3">
                <Label className="form-label-lg fw-semibold">Numéro de Facture*</Label>
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
                <Label className="form-label-lg fw-semibold">Date de Facture*</Label>
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
                {validation.touched.dateFacture && validation.errors.dateFacture && (
                  <div className="text-danger fs-6 mt-1">
                    {validation.errors.dateFacture as string}
                  </div>
                )}
              </div>
            </Col>
            {/* Timbre Fiscal */}
            <Col md={4}>
        <div className="mb-3">
          <Label className="form-label-lg fw-semibold d-block text-center mb-5">
          </Label>
          <div className="d-flex justify-content-center align-items-center">
            <div className="form-check form-switch form-switch-lg">
              <Input
                type="checkbox"
                id="timbreFiscal"
                checked={timbreFiscal}
                onChange={(e) => setTimbreFiscal(e.target.checked)}
                className="form-check-input"
                style={{
                  width: "48px",
                  height: "24px",
                  cursor: "pointer"
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
              color={timbreFiscal ? "success" : "secondary"}
              className="fs-6"
            >
              {timbreFiscal ? "Activé (+1.000 DT)" : "Désactivé"}
            </Badge>
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
                    onFocus={() => {
                      if (fournisseurSearch.length >= 1) {
                        setFilteredFournisseurs(fournisseurs);
                      }
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
                    {filteredFournisseurs.length > 0 ? (
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
      {/* <Card className="border-0 shadow-sm mb-4">
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
         
       {/* Enhanced Search Results for Facture Modal */}
<div className="mb-4">
  <Label className="form-label-lg fw-semibold">Rechercher Article</Label>
  <div className="search-box position-relative">
    <Input
      type="text"
      placeholder="Rechercher article..."
      value={articleSearch}
      onChange={(e) => setArticleSearch(e.target.value)}
      className="form-control-lg ps-5"
    />
    <i className="ri-search-line search-icon position-absolute top-50 start-0 translate-middle-y ms-3 fs-5 text-muted"></i>
  </div>
 
  {/* Scrollable Dropdown Results */}
  {articleSearch.length >= 1 && (
    <div
      className="search-results mt-2 border rounded shadow-sm"
      style={{
        maxHeight: "300px",
        overflowY: "auto",
        position: "relative",
        zIndex: 1000,
        backgroundColor: "white"
      }}
    >
      {filteredArticles.length > 0 ? (
        <ul className="list-group list-group-flush">
          {filteredArticles.map((article) => (
            <li
              key={article.id}
              className="list-group-item list-group-item-action"
              onClick={() => {
                handleAddArticle(article.id.toString());
                setArticleSearch("");
                setFilteredArticles([]);
              }}
              style={{
                cursor: "pointer",
                padding: "12px 15px",
                opacity: selectedArticles.some(item => item.article_id === article.id) ? 0.6 : 1
              }}
            >
              <div className="d-flex justify-content-between align-items-center">
                <div className="flex-grow-1">
                  <strong className="d-block">{article.designation}</strong>
                  <small className="text-muted">
                    Réf: {article.reference} | Stock: {article.qte} |
                    HT: {(Number(article.pua_ht) || 0).toFixed(3)} DT
                  </small>
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
          ))}
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
            const article = articles.find((a) => a.id === item.article_id) || item.articleDetails;
           
            const qty = item.quantite === "" ? 0 : Number(item.quantite) || 0;
           
            let priceHT = Number(item.prixUnitaire) || 0;
            let priceTTC = Number(item.prixTTC) || 0;
           
            if (editingHT[item.article_id] !== undefined) {
              const editingValue = parseNumericInput(editingHT[item.article_id]);
              if (!isNaN(editingValue) && editingValue >= 0) {
                priceHT = parseFloat(editingValue.toFixed(3));
                const tvaRate = Number(item.tva) || 0;
                const tvaAmount = tvaRate > 0 ? parseFloat((priceHT * tvaRate / 100).toFixed(3)) : 0;
                priceTTC = parseFloat((priceHT + tvaAmount).toFixed(3));
              }
            } else if (editingTTC[item.article_id] !== undefined) {
              const editingValue = parseNumericInput(editingTTC[item.article_id]);
              if (!isNaN(editingValue) && editingValue >= 0) {
                priceTTC = parseFloat(editingValue.toFixed(3));
                const tvaRate = Number(item.tva) || 0;
                if (tvaRate > 0) {
                  const coefficient = 1 + (tvaRate / 100);
                  priceHT = parseFloat((priceTTC / coefficient).toFixed(3));
                } else {
                  priceHT = priceTTC;
                }
              }
            }
            const montantHTLigne = (qty * priceHT).toFixed(3);
            const montantTTCLigne = (qty * priceTTC).toFixed(3);
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
                                : `Remise (Montant fixe) ${((discountAmount / netHT) * 100).toFixed(1)}%`}
                            </th>
                            <td className="text-end text-danger fw-bold fs-6">
                              - {discountAmount.toFixed(3)} DT
                            </td>
                          </tr>
                        )}
                       
                        {/* Timbre Fiscal */}
                        {timbreFiscal && (
                          <tr className="real-time-update">
                            <th className="text-end text-muted fs-6">Timbre Fiscal:</th>
                            <td className="text-end fw-semibold fs-6">1.000 DT</td>
                          </tr>
                        )}
                        <tr className="final-total real-time-update border-top">
                          <th className="text-end fs-5">NET À PAYER:</th>
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
        disabled={selectedArticles.length === 0 || !selectedFournisseur}
      >
        <i className="ri-save-line me-2"></i>
        {isEdit ? "Modifier la Facture" : "Créer la Facture"}
      </Button>
    </ModalFooter>
  </Form>
</Modal>
                                <Modal isOpen={paymentModal} toggle={() => setPaymentModal(false)} centered>
    <ModalHeader toggle={() => setPaymentModal(false)}>Ajouter Paiement - Facture #{selectedFacture?.numeroFacture}</ModalHeader>
    <Form onSubmit={paymentValidation.handleSubmit}>
        <ModalBody style={{ padding: '20px' }}>
            <Row>
                <Col md={6}>
                    <div className="mb-3">
                        <Label>Montant payé*</Label>
                        <Input
                            type="text"
                            name="montant"
                            value={paymentValidation.values.montant}
                            onChange={handleMontantChange}
                            onBlur={handleMontantBlur}
                            invalid={paymentValidation.touched.montant && !!paymentValidation.errors.montant}
                            placeholder="0,000"
                        />
                        <FormFeedback>{paymentValidation.errors.montant}</FormFeedback>
                        <small className="text-muted">
                            Reste à payer: {selectedFacture?.resteAPayer?.toFixed(3).replace('.', ',')} DT
                        </small>
                    </div>
                </Col>
                <Col md={6}>
                    <div className="mb-3">
                        <Label>Mode de paiement*</Label>
                        <Input
                            type="select"
                            name="modePaiement"
                            value={paymentValidation.values.modePaiement}
                            onChange={paymentValidation.handleChange}
                            onBlur={paymentValidation.handleBlur}
                            invalid={paymentValidation.touched.modePaiement && !!paymentValidation.errors.modePaiement}
                        >
                            <option value="Espece">En espèces</option>
                            <option value="Cheque">Chèque</option>
                            <option value="Virement">Virement</option>
                            <option value="Traite">Traite</option>
                            <option value="Autre">Autre</option>
                        </Input>
                        <FormFeedback>{paymentValidation.errors.modePaiement}</FormFeedback>
                    </div>
                </Col>
            </Row>
            <Row>
                <Col md={6}>
                    <div className="mb-3">
                        <Label>Paiement n°*</Label>
                        <Input
                            type="text"
                            name="numeroPaiement"
                            value={paymentValidation.values.numeroPaiement}
                            onChange={paymentValidation.handleChange}
                            onBlur={paymentValidation.handleBlur}
                            invalid={paymentValidation.touched.numeroPaiement && !!paymentValidation.errors.numeroPaiement}
                        />
                        <FormFeedback>{paymentValidation.errors.numeroPaiement}</FormFeedback>
                    </div>
                </Col>
                <Col md={6}>
                    <div className="mb-3">
                        <Label>Date*</Label>
                        <Input
                            type="date"
                            name="date"
                            value={paymentValidation.values.date}
                            onChange={paymentValidation.handleChange}
                            onBlur={paymentValidation.handleBlur}
                            invalid={paymentValidation.touched.date && !!paymentValidation.errors.date}
                        />
                    </div>
                </Col>
            </Row>
        </ModalBody>
        <ModalFooter>
            <Button color="light" onClick={() => setPaymentModal(false)}>
                <i className="ri-close-line align-bottom me-1"></i> Annuler
            </Button>
            <Button color="primary" type="submit">
                <i className="ri-save-line align-bottom me-1"></i> Enregistrer Paiement
            </Button>
        </ModalFooter>
    </Form>
</Modal>
                                <ToastContainer />
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
                <FacturePDFModal isOpen={pdfModal} toggle={() => setPdfModal(false)} facture={selectedFactureForPdf} companyInfo={companyInfo} />
            </Container>
        </div>
    );
};
export default FactureList;