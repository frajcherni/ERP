import React, { useEffect, useState, useMemo, useCallback } from "react";
import "./ArticlePage.css";
import {
  Card,
  CardBody,
  Col,
  Container,
  CardHeader,
  Nav,
  NavItem,
  NavLink,
  Row,
  Modal,
  ModalHeader,
  Form,
  ModalBody,
  Label,
  Input,
  FormFeedback,
  Badge,
  InputGroup,
  InputGroupText,
  Table,
  Button,
} from "reactstrap";
import Barcode from "react-barcode";

import { Link } from "react-router-dom";
import classnames from "classnames";
import Flatpickr from "react-flatpickr";
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import TableContainer from "../../../Components/Common/TableContainer";
import DeleteModal from "../../../Components/Common/DeleteModal";
import Loader from "../../../Components/Common/Loader";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import * as Yup from "yup";
import { useFormik } from "formik";
import moment from "moment";
import {
  fetchArticles,
  createArticle,
  updateArticle,
  deleteArticle,
  fetchCategories,
  fetchFournisseurs,
} from "../../../Components/Article/ArticleServices";

import {
  Categorie,
  Fournisseur,
  Article,
} from "../../../Components/Article/Interfaces";

const ArticlesList = () => {
  const [modal, setModal] = useState(false);
  const [articles, setArticles] = useState<Article[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [article, setArticle] = useState<Article | null>(null);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [isEdit, setIsEdit] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("1");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [isExportCSV, setIsExportCSV] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [detailsModal, setDetailsModal] = useState(false);
  const [subcategories, setSubcategories] = useState<Categorie[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [printModal, setPrintModal] = useState(false); // NOUVEAU: Modal pour l'impression
  const [barcodeSize, setBarcodeSize] = useState<"small" | "large">("small"); // NOUVEAU: Taille du code-barre
  const API_BASE = process.env.REACT_APP_API_BASE;
  // Add these states near your other state declarations
  const [priceInputs, setPriceInputs] = useState({
    pua_ht: "",
    puv_ht: "",
    pua_ttc: "",
    puv_ttc: "",
    tva: "",
  });


  const [printSettings, setPrintSettings] = useState({
    smallTicket: {
      showPrice: true,
    },
    smallLabel: {
      showPrice: true,
    },
    largeLabel: {
      showPrice: true,
    },
  });

  const [fournisseurCodeOverride, setFournisseurCodeOverride] = useState<string>("");


  const handlePriceInputChange = (field: string, value: string) => {
    // Allow numbers, comma, and dot
    let cleanedValue = value.replace(/[^\d,.]/g, '');

    // Ensure only one decimal separator (either comma or dot)
    const decimalSeparators = (cleanedValue.match(/[,.]/g) || []).length;
    if (decimalSeparators > 1) {
      // Keep only the first decimal separator
      const firstSeparatorIndex = Math.min(
        cleanedValue.indexOf(','),
        cleanedValue.indexOf('.')
      );
      if (firstSeparatorIndex !== -1) {
        cleanedValue = cleanedValue.substring(0, firstSeparatorIndex + 1) +
          cleanedValue.substring(firstSeparatorIndex + 1).replace(/[,.]/g, '');
      }
    }

    // Update the string input state
    setPriceInputs(prev => ({
      ...prev,
      [field]: cleanedValue
    }));

    // Calculate the numeric value (parseNumber handles both comma and dot)
    const numericValue = parseNumber(cleanedValue);

    // Update formik with the number value
    validation.setFieldValue(field, numericValue);
    validation.setFieldTouched(field, true, false);

    // Get current tax values
    const tva = parseNumber(validation.values.tva);
    const hasFodec = Boolean(validation.values.taux_fodec);



    // Calculate dependent values based on which field changed
    setTimeout(() => {
      switch (field) {
        case 'pua_ht': {
          const ttc = calculateTTCFromHT(numericValue, tva, hasFodec);
          validation.setFieldValue("pua_ttc", ttc);
          setPriceInputs(prev => ({
            ...prev,
            pua_ttc: formatPriceInput(ttc)
          }));
          break;
        }
        case 'puv_ht': {
          const ttc = calculateTTCFromHT(numericValue, tva, hasFodec);
          validation.setFieldValue("puv_ttc", ttc);
          setPriceInputs(prev => ({
            ...prev,
            puv_ttc: formatPriceInput(ttc)
          }));
          break;
        }
        case 'pua_ttc': {
          const ht = calculateHTFromTTC(numericValue, tva, hasFodec);
          validation.setFieldValue("pua_ht", ht);
          setPriceInputs(prev => ({
            ...prev,
            pua_ht: formatPriceInput(ht)
          }));
          break;
        }
        case 'puv_ttc': {
          const ht = calculateHTFromTTC(numericValue, tva, hasFodec);
          validation.setFieldValue("puv_ht", ht);
          setPriceInputs(prev => ({
            ...prev,
            puv_ht: formatPriceInput(ht)
          }));
          break;
        }
      }
    }, 10);
  };

  const handleTVAInputChange = (value: string) => {
    setPriceInputs(prev => ({ ...prev, tva: value }));
    const numericValue = parseFloat(value.replace(",", ".")) || 0;
    validation.setFieldValue("tva", numericValue);

    const hasFodec = Boolean(validation.values.taux_fodec);

    // Recalculate all TTC prices
    setTimeout(() => {
      if (validation.values.pua_ht) {
        const ttc = calculateTTCFromHT(validation.values.pua_ht, numericValue, hasFodec);
        validation.setFieldValue("pua_ttc", ttc);
        setPriceInputs(prev => ({ ...prev, pua_ttc: formatPriceInput(ttc) }));
      }

      if (validation.values.puv_ht) {
        const ttc = calculateTTCFromHT(validation.values.puv_ht, numericValue, hasFodec);
        validation.setFieldValue("puv_ttc", ttc);
        setPriceInputs(prev => ({ ...prev, puv_ttc: formatPriceInput(ttc) }));
      }
    }, 10);
  };


  // Add this near your other helper functions
  const encryptPrice = (price: string | number): string => {
    if (!price || Number(price) === 0) return "";

    const priceNum =
      typeof price === "number"
        ? price.toFixed(3)
        : Number(price.replace(",", ".")).toFixed(3);

    const [intPart, decPart] = priceNum.split(".");
    const millimesValue = Number(intPart) * 1000 + Number(decPart);

    const encryptionMap: Record<string, string> = {
      "0": "X",
      "1": "E",
      "2": "A",
      "3": "V",
      "4": "B",
      "5": "D",
      "6": "T",
      "7": "S",
      "8": "R",
      "9": "F",
    };

    const encryptedInt = intPart
      .split("")
      .map(d => encryptionMap[d])
      .join("");

    let encryptedDec = "";

    if (decPart !== "000") {
      encryptedDec = decPart
        .split("")
        .map(d => encryptionMap[d])
        .join("");
    } else if (millimesValue >= 1000) {
      encryptedDec = "XXX";
    }

    return encryptedInt + encryptedDec;
  };

  const handlePriceKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow dot (period) key
    if (e.key === '.') {
      // Allow it - we'll handle it in onChange
      return;
    }

    // Prevent multiple commas
    if (e.key === ',' && e.currentTarget.value.includes(',')) {
      e.preventDefault();
      return;
    }

    // Prevent multiple dots
    if (e.key === '.' && e.currentTarget.value.includes('.')) {
      e.preventDefault();
      return;
    }
  };


  const handleFodecChange = (checked: boolean) => {
    validation.setFieldValue("taux_fodec", checked);

    const tva = parseNumber(validation.values.tva);

    // Recalculate all TTC prices
    setTimeout(() => {
      if (validation.values.pua_ht) {
        const ttc = calculateTTCFromHT(validation.values.pua_ht, tva, checked);
        validation.setFieldValue("pua_ttc", ttc);
        setPriceInputs(prev => ({ ...prev, pua_ttc: formatPriceInput(ttc) }));
      }

      if (validation.values.puv_ht) {
        const ttc = calculateTTCFromHT(validation.values.puv_ht, tva, checked);
        validation.setFieldValue("puv_ttc", ttc);
        setPriceInputs(prev => ({ ...prev, puv_ttc: formatPriceInput(ttc) }));
      }
    }, 10);
  };

  const parseNumber = (value: any): number => {
    if (value === null || value === undefined || value === "") return 0;

    // If it's already a number, return it
    if (typeof value === "number") return Math.round(value * 1000) / 1000;

    // Handle string with comma or dot
    const strValue = String(value).trim();
    if (strValue === "") return 0;

    // Replace comma with dot for parsing
    const normalized = strValue.replace(/,/g, ".");
    const num = parseFloat(normalized);

    return isNaN(num) ? 0 : Math.round(num * 1000) / 1000;
  };

  const calculateTTCFromHT = (ht: string | number, tva: string | number, hasFodec: boolean): number => {
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

  const calculateHTFromTTC = (ttc: string | number, tva: string | number, hasFodec: boolean): number => {
    const ttcValue = parseNumber(ttc);
    const tvaRate = parseNumber(tva);

    if (tvaRate === 0 && !hasFodec) return ttcValue;

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

  // Add these functions for handling number/string conversion
  const formatPriceInput = (value: any): string => {
    const num = parseNumber(value);
    if (num === 0) return "";
    return (Math.round(num * 1000) / 1000).toFixed(3).replace(".", ",");
  };

  const parsePriceInput = (value: string): number => {
    if (!value || value === "") return 0;
    const cleanValue = value.replace(",", ".");
    const numericValue = parseFloat(cleanValue);
    return isNaN(numericValue) ? 0 : Math.round(numericValue * 1000) / 1000;
  };


  const formatNumber = (value: number): string => {
    if (value === 0) return "";
    return (Math.round(value * 1000) / 1000).toFixed(3).replace('.', ',');
  };


  // Add this effect for auto-calculation


  // Add this function to handle price changes
  const handlePriceChange = (field: string, value: string) => {
    const newValue = value.replace(',', '.');
    const tva = parseNumber(validation.values.tva);
    const hasFodec = Boolean(validation.values.taux_fodec);

    validation.setFieldValue(field, newValue);

    // Set the field as touched
    setTimeout(() => {
      validation.setFieldTouched(field, true, false);
    }, 0);

    // Calculate dependent values
    setTimeout(() => {
      switch (field) {
        case 'pua_ht': {
          const ht = parseNumber(newValue);
          const ttc = calculateTTCFromHT(ht, tva, hasFodec);
          if (!validation.touched.pua_ttc) {
            validation.setFieldValue("pua_ttc", formatNumber(ttc));
          }
          break;
        }
        case 'pua_ttc': {
          const ttc = parseNumber(newValue);
          const ht = calculateHTFromTTC(ttc, tva, hasFodec);
          if (!validation.touched.pua_ht) {
            validation.setFieldValue("pua_ht", formatNumber(ht));
          }
          break;
        }
        case 'puv_ht': {
          const ht = parseNumber(newValue);
          const ttc = calculateTTCFromHT(ht, tva, hasFodec);
          if (!validation.touched.puv_ttc) {
            validation.setFieldValue("puv_ttc", formatNumber(ttc));
          }
          break;
        }
        case 'puv_ttc': {
          const ttc = parseNumber(newValue);
          const ht = calculateHTFromTTC(ttc, tva, hasFodec);
          if (!validation.touched.puv_ht) {
            validation.setFieldValue("puv_ht", formatNumber(ht));
          }
          break;
        }
      }
    }, 10);
  };

  // Add this function to handle TVA change
  const handleTVAChange = (value: string) => {
    const oldTva = parseNumber(validation.values.tva);
    const newTva = parseNumber(value);
    const hasFodec = Boolean(validation.values.taux_fodec);

    validation.setFieldValue("tva", value);

    // Recalculate TTC from HT
    setTimeout(() => {
      if (validation.values.pua_ht && !validation.touched.pua_ttc) {
        const ht = parseNumber(validation.values.pua_ht);
        const ttc = calculateTTCFromHT(ht, newTva, hasFodec);
        validation.setFieldValue("pua_ttc", formatNumber(ttc));
      }

      if (validation.values.puv_ht && !validation.touched.puv_ttc) {
        const ht = parseNumber(validation.values.puv_ht);
        const ttc = calculateTTCFromHT(ht, newTva, hasFodec);
        validation.setFieldValue("puv_ttc", formatNumber(ttc));
      }
    }, 10);
  };

  // Add this function to handle FODEC change




  useEffect(() => {
    if (modal) {
      // Format the numbers for display
      if (validation.values.pua_ht !== undefined) {
        validation.setFieldValue("pua_ht", formatNumber(parseNumber(validation.values.pua_ht)));
      }
      if (validation.values.puv_ht !== undefined) {
        validation.setFieldValue("puv_ht", formatNumber(parseNumber(validation.values.puv_ht)));
      }
      if (validation.values.pua_ttc !== undefined) {
        validation.setFieldValue("pua_ttc", formatNumber(parseNumber(validation.values.pua_ttc)));
      }
      if (validation.values.puv_ttc !== undefined) {
        validation.setFieldValue("puv_ttc", formatNumber(parseNumber(validation.values.puv_ttc)));
      }
    }
  }, [modal]);






  // NOUVEAU: Fonction pour obtenir les 3 premières lettres du fournisseur
  const getFirstThreeLetters = (fournisseurName: string | undefined): string => {
    if (!fournisseurName) return "";
    return fournisseurName.substring(0, 3).toUpperCase();
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Fetch all data
  // Fetch all data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [articlesData, categoriesData, fournisseursData] =
        await Promise.all([
          fetchArticles(),
          fetchCategories(),
          fetchFournisseurs(),
        ]);

      const formattedArticles = articlesData.map((a: any) => ({
        ...a,
        type:
          a.type?.toLowerCase() === "consigné" ? "Consigné" : "Non Consigné",
        createdAt: a.createdAt || new Date().toISOString(),
        taux_fodec: Boolean(a.taux_fodec),
        tva: a.tva ? a.tva.toString() : "0",
        pua_ht: Number(a.pua_ht) || 0,
        puv_ht: Number(a.puv_ht) || 0,
        pua_ttc: Number(a.pua_ttc) || 0,
        puv_ttc: Number(a.puv_ttc) || 0,
        // Properly parse code_barres array
        code_barres: a.code_barres
          ? (Array.isArray(a.code_barres)
            ? a.code_barres.map((cb: any) => cb.toString().replace(/[{}]/g, '').trim())
            : [a.code_barres.toString().replace(/[{}]/g, '').trim()])
          : [],
        // Clean up code_barre field as well
        code_barre: a.code_barre
          ? a.code_barre.toString().replace(/[{}]/g, '').trim()
          : null,
      }));

      setArticles(formattedArticles);
      setFilteredArticles(formattedArticles);
      setCategories(categoriesData);
      setFournisseurs(fournisseursData);
      setLoading(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Échec du chargement des données"
      );
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);


  // Add this helper function near your other functions
  const getBarcodeValue = (article: Article | null): string => {
    if (!article) return "";

    // If code_barres exists and is an array, get the first value
    if (article.code_barres && Array.isArray(article.code_barres) && article.code_barres.length > 0) {
      // Remove any curly braces and whitespace
      let barcode = article.code_barres[0].toString().trim();
      // Remove curly braces if present
      barcode = barcode.replace(/[{}]/g, '');
      return barcode;
    }

    // Fallback to code_barre or reference
    if (article.code_barre) {
      return article.code_barre.toString().trim().replace(/[{}]/g, '');
    }

    return article.reference || "";
  };

  // Filter articles by type, date and search text
  useEffect(() => {
    let result = [...articles];

    if (activeTab === "2") {
      result = result.filter((art) => art.type === "Consigné");
    } else if (activeTab === "3") {
      result = result.filter((art) => art.type === "Non Consigné");
    }

    if (startDate && endDate) {
      const start = moment(startDate).startOf("day");
      const end = moment(endDate).endOf("day");

      result = result.filter((art) => {
        const artDate = moment(art.createdAt);
        return artDate.isBetween(start, end, null, "[]");
      });
    }

    if (searchText != null && searchText) {
      const searchLower = searchText.toLowerCase();
      result = result.filter((art) => {
        const safeToString = (value: any) => {
          if (value === null || value === undefined) return "";
          return String(value).toLowerCase();
        };

        return (
          safeToString(art.nom).includes(searchLower) ||
          safeToString(art.reference).includes(searchLower) ||
          safeToString(art.designation).includes(searchLower) ||
          safeToString(art.categorie?.nom).includes(searchLower) ||
          safeToString(art.fournisseur?.raison_sociale).includes(searchLower) ||
          safeToString(art.fournisseur?.code_barre_fournisseur).includes(searchLower) ||
          safeToString(art.code_barre).includes(searchLower) ||
          (Array.isArray(art.code_barres) && art.code_barres.some(cb => safeToString(cb).includes(searchLower)))
        );
      });
    }

    setFilteredArticles(result);
  }, [activeTab, startDate, endDate, searchText, articles]);

  // Delete article
  const handleDelete = async () => {
    if (!article) return;

    try {
      await deleteArticle(article.id);
      setDeleteModal(false);
      fetchData();
      toast.success("Article supprimé avec succès");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Échec de la suppression"
      );
    }
  };



  // Save or update article
  const handleSubmit = async (values: any) => {
    try {
      // Parse the formatted values back to numbers
      const articleData = {
        reference: values.reference,
        nom: values.nom || values.designation || values.reference,
        qte: Number(values.qte) || 0,
        designation: values.designation,
        categorie_id: Number(values.categorie_id),
        sous_categorie_id: values.sous_categorie_id
          ? Number(values.sous_categorie_id)
          : null,
        pua_ht: parseNumber(values.pua_ht),
        puv_ht: parseNumber(values.puv_ht),
        pua_ttc: parseNumber(values.pua_ttc),
        puv_ttc: parseNumber(values.puv_ttc),
        fournisseur_id: Number(values.fournisseur_id),
        type: values.type,
        taux_fodec: Boolean(values.taux_fodec),
        tva: parseNumber(values.tva),
      };

      console.log("Processed article data:", articleData);

      // Rest of the function remains the same...
      if (isEdit && article) {
        await updateArticle(
          article.id,
          articleData,
          selectedImage || undefined
        );
        toast.success("Article mis à jour avec succès");
      } else {
        await createArticle(articleData, selectedImage || undefined);
        toast.success("Article ajouté avec succès");
      }

      setModal(false);
      setSelectedImage(null);
      setImagePreview(null);
      fetchData();
    } catch (err) {
      console.error("Error in handleSubmit:", err);
      toast.error(err instanceof Error ? err.message : "Échec de l'opération");
    }
  };

  const validation = useFormik({
    enableReinitialize: true, // This should be true to reinitialize when article changes
    initialValues: {
      reference: article?.reference || "",
      designation: article?.designation || "",
      categorie_id: article?.categorie?.id
        ? String(article.categorie.id)
        : article?.sousCategorie?.parent_id
          ? String(article.sousCategorie.parent_id)
          : "",
      sous_categorie_id: article?.sousCategorie?.id
        ? String(article.sousCategorie.id)
        : "",
      pua_ht: article?.pua_ht || 0,
      puv_ht: article?.puv_ht || 0,
      pua_ttc: article?.pua_ttc || 0,
      puv_ttc: article?.puv_ttc || 0,
      fournisseur_id: article?.fournisseur?.id
        ? String(article.fournisseur.id)
        : "",
      type: article?.type || "Non Consigné",
      taux_fodec: article?.taux_fodec || false,
      tva: article?.tva || 19,
      image: article?.image || "",
    },
    validationSchema: Yup.object({
      reference: Yup.string().required("La référence est obligatoire"),
      designation: Yup.string().required("La désignation est obligatoire"),
      categorie_id: Yup.string().required("La famille est obligatoire"),
      pua_ht: Yup.number()
        .transform((value, originalValue) => {
          if (originalValue === "" || originalValue === null || originalValue === undefined) return 0;
          return parseNumber(originalValue);
        })
        .required("Le prix d'achat HT est obligatoire")
        .min(0, "Le prix doit être positif ou zéro")
        .typeError("Veuillez entrer un nombre valide (ex: 120,000 ou 120.000)"),
      puv_ht: Yup.number()
        .transform((value, originalValue) => {
          if (originalValue === "" || originalValue === null || originalValue === undefined) return 0;
          return parseNumber(originalValue);
        })
        .required("Le prix de vente HT est obligatoire")
        .min(0, "Le prix doit être positif ou zéro")
        .typeError("Veuillez entrer un nombre valide (ex: 104,624 ou 104.624)"),
      pua_ttc: Yup.number()
        .transform((value, originalValue) => {
          if (originalValue === "" || originalValue === null || originalValue === undefined) return 0;
          return parseNumber(originalValue);
        })
        .min(0, "Le prix TTC doit être positif ou zéro"),
      puv_ttc: Yup.number()
        .transform((value, originalValue) => {
          if (originalValue === "" || originalValue === null || originalValue === undefined) return 0;
          return parseNumber(originalValue);
        })
        .min(0, "Le prix TTC doit être positif ou zéro"),
      fournisseur_id: Yup.string().required("Le fournisseur est obligatoire"),
      type: Yup.string().required("Le type est obligatoire"),
      tva: Yup.number()
        .min(0, "La TVA doit être positive ou zéro")
        .max(100, "La TVA ne peut pas dépasser 100%"),
    }),
    onSubmit: handleSubmit,
  });


  useEffect(() => {
    if (modal) {
      if (article && isEdit) {
        console.log("Editing article:", article);
        console.log("Article data for form:", {
          reference: article.reference,
          designation: article.designation,
          categorie_id: article.categorie?.id,
          sous_categorie_id: article.sousCategorie?.id,
          fournisseur_id: article.fournisseur?.id,
          type: article.type,
          taux_fodec: article.taux_fodec,
          tva: article.tva,
          prices: {
            pua_ht: article.pua_ht,
            puv_ht: article.puv_ht,
            pua_ttc: article.pua_ttc,
            puv_ttc: article.puv_ttc
          }
        });

        // Update formik values
        validation.setValues({
          reference: article.reference || "",
          designation: article.designation || "",
          categorie_id: article.categorie?.id
            ? String(article.categorie.id)
            : article.sousCategorie?.parent_id
              ? String(article.sousCategorie.parent_id)
              : "",
          sous_categorie_id: article.sousCategorie?.id
            ? String(article.sousCategorie.id)
            : "",
          pua_ht: article.pua_ht || 0,
          puv_ht: article.puv_ht || 0,
          pua_ttc: article.pua_ttc || 0,
          puv_ttc: article.puv_ttc || 0,
          fournisseur_id: article.fournisseur?.id
            ? String(article.fournisseur.id)
            : "",
          type: article.type || "Non Consigné",
          taux_fodec: article.taux_fodec || false,
          tva: article.tva || 19,
          image: article.image || "",
        });

        // Set price inputs
        setPriceInputs({
          pua_ht: article.pua_ht ? formatPriceInput(article.pua_ht) : "",
          puv_ht: article.puv_ht ? formatPriceInput(article.puv_ht) : "",
          pua_ttc: article.pua_ttc ? formatPriceInput(article.pua_ttc) : "",
          puv_ttc: article.puv_ttc ? formatPriceInput(article.puv_ttc) : "",
          tva: article.tva ? String(article.tva) : "19",
        });

      } else {
        // For new article
        setPriceInputs({
          pua_ht: "",
          puv_ht: "",
          pua_ttc: "",
          puv_ttc: "",
          tva: "19",
        });

        // Reset form for new article
        validation.resetForm();
      }
    }
  }, [modal, article, isEdit]);

  useEffect(() => {
    if (!modal) {
      setSelectedImage(null);
      setImagePreview(null);
    }
  }, [modal]);



  const handlePrintBarcode = useCallback((labelSize: "small" | "large", showPrice = true, fournisseurCodeParam?: string) => {
    if (!article) return;

    // Obtenir le nom de la catégorie (priorité: sous-catégorie > catégorie)
    const categoryName = article.sousCategorie?.nom || article.categorie?.nom || "";

    const fournisseurCode = fournisseurCodeParam !== undefined
      ? fournisseurCodeParam
      : (article.fournisseur?.code_barre_fournisseur || getFirstThreeLetters(article.fournisseur?.raison_sociale));
    const barcodeValue = getBarcodeValue(article);

    // Fonction de formatage des prix avec POINT comme séparateur décimal
    const formatPrice = (price: number): string => {
      // Arrondir à 3 décimales
      const rounded = Math.round(price * 1000) / 1000;

      // Séparer partie entière et décimale
      const parts = rounded.toFixed(3).split('.');
      const integerPart = parts[0];
      const decimalPart = parts[1] || '000';

      // Ajouter des espaces pour les milliers (à partir de 1000)
      let formattedInteger = integerPart;
      if (integerPart.length > 3) {
        formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
      }

      // Retourner avec POINT comme séparateur décimal
      return `${formattedInteger}.${decimalPart}`;
    };

    const priceTTC = Number(article.puv_ttc || 0);
    const formattedPrice = formatPrice(priceTTC);

    // Prix d'achat pour le cryptage (garder 3 décimales)
    const prixAchat = Number(article.pua_ttc || 0).toFixed(3);

    // Fonction de cryptage
    const encryptPrice = (price: string | number): string => {
      if (!price || Number(price) === 0) return "";

      const priceNum =
        typeof price === "number"
          ? price.toFixed(3)
          : Number(price.replace(",", ".")).toFixed(3);

      const [intPart, decPart] = priceNum.split(".");
      const millimesValue = Number(intPart) * 1000 + Number(decPart);

      const encryptionMap: Record<string, string> = {
        "0": "X",
        "1": "E",
        "2": "A",
        "3": "V",
        "4": "B",
        "5": "D",
        "6": "T",
        "7": "S",
        "8": "R",
        "9": "F",
      };

      const encryptedInt = intPart
        .split("")
        .map(d => encryptionMap[d])
        .join("");

      let encryptedDec = "";

      if (decPart !== "000") {
        encryptedDec = decPart
          .split("")
          .map(d => encryptionMap[d])
          .join("");
      } else if (millimesValue >= 1000) {
        encryptedDec = "XXX";
      }

      return encryptedInt + encryptedDec;
    };


    const encryptedPrixAchat = encryptPrice(prixAchat);

    // Tailles des étiquettes ajustées
    const labelSizes = {
      small: {
        width: 38,
        height: 55,
        barcodeWidth: 1.2,
        barcodeHeight: 16, // Réduit de 18 à 16
        fontSize: '8pt',
        padding: '1mm',
        contentMarginTop: '2mm', // Revenu à 2mm
        lineSpacing: '0.8mm'
      },
      large: {
        width: 44,
        height: 44,
        barcodeWidth: 1,
        barcodeHeight: 12, // Réduit pour équilibrer
        fontSize: '9pt',
        padding: '0mm',
        contentMarginTop: '10mm',
        lineSpacing: '1mm'
      }


    };

    const sizeConfig = labelSizes[labelSize];

    // Convertir en majuscules
    const refUpperCase = (article.reference || '').toUpperCase();
    const fournisseurCodeUpperCase = (fournisseurCode || '').toUpperCase();
    const categoryNameUpperCase = categoryName.toUpperCase();

    const printContent = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <title>Étiquette Code-Barre</title>
    <style>
      @page {
        size: ${sizeConfig.height}mm ${sizeConfig.width}mm;
        margin: 0 !important;
        padding: 0 !important;
        size: landscape;
      }
      * {
        margin: 0 !important;
        padding: 0 !important;
        box-sizing: border-box;
      }
      html, body {
        width: ${sizeConfig.height}mm !important;
        height: ${sizeConfig.width}mm !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      body {
        font-family: Arial, sans-serif;
        font-size: ${sizeConfig.fontSize};
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden !important;
        transform: rotate(90deg);
        transform-origin: center center;
      }
      .container {
        width: ${sizeConfig.width}mm !important;
        height: ${sizeConfig.height}mm !important;
        padding: ${sizeConfig.padding} !important;
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        justify-content: flex-start !important;
        margin-top: ${sizeConfig.contentMarginTop} !important;
      }
      .label {
        width: 100% !important;
        height: 100% !important;
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        justify-content: flex-start !important;
      }
      .barcode-container {
        width: 100%;
        height: ${sizeConfig.barcodeHeight}mm;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 0 0.5mm 0 !important;
        padding: 0 !important;
        flex-shrink: 0;
      }
      .barcode-wrapper {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
        height: 100%;
      }
      #barcode {
        width: auto !important;
        height: ${sizeConfig.barcodeHeight - 1}mm !important;
        max-width: ${sizeConfig.width - 4}mm !important;
        display: block;
        margin: 0 auto;
      }
      /* Dans la section style, remplacez les styles du header et des éléments */

.ref {
  font-weight: 900;
  font-size: ${labelSize === 'small' ? '9pt' : '10pt'};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #000;
  line-height: 1.6;
  margin-bottom: 1.5mm !important; /* Espace après la référence */
  margin-top: 0.2mm !important;
}

.category {
  font-size: ${labelSize === 'small' ? '8pt' : '9pt'};
  font-weight: 600;
  color: #9932CC;
  text-transform: uppercase;
  line-height: 1.2;
  margin-bottom: 1.2mm !important; /* Espace après la catégorie */
  margin-top: 0 !important;
}

.fournisseur-line {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.8mm;
  width: 100%;
  line-height: 1.2;
  margin-bottom: 1.2mm !important; /* Espace après la ligne fournisseur */
  margin-top: 0 !important;
}

.price-line {
  text-align: center;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.8mm;
  line-height: 1.2;
  margin-top: 0.5mm !important;
}

/* Supprimez les marges du header */
.header {
  text-align: center;
  width: 100%;
  flex-shrink: 0;
}
      .supplier {
        font-size: ${labelSize === 'small' ? '8pt' : '9pt'};
        font-weight: 700;
        color: #0066cc;
        flex-shrink: 0;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .colon {
        font-size: ${labelSize === 'small' ? '8pt' : '9pt'};
        font-weight: 700;
        color: #000;
        flex-shrink: 0;
      }
      .encrypted-price {
        font-size: ${labelSize === 'small' ? '8pt' : '10pt'};
        font-weight: 700;
        color: #FF0000;
        font-family: "Courier New", monospace;
        letter-spacing: 1px;
        flex-shrink: 0;
        text-transform: uppercase;
      }
    
      .price-label {
        font-size: ${labelSize === 'small' ? '8pt' : '9pt'};
        color: #000;
        text-transform: uppercase;
        font-weight: 900;
      }
      .price-value {
        font-size: ${labelSize === 'small' ? '10pt' : '11pt'};
        color: #28a745;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        font-family: Arial, sans-serif;
      }
      @media print {
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          overflow: hidden !important;
        }
        .container {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="label">
        <!-- CODE-BARRE -->
        <div class="barcode-container">
          <div class="barcode-wrapper">
            <svg id="barcode"></svg>
          </div>
        </div>
        
        <div class="header">
          <!-- RÉFÉRENCE EN GRAS -->
          <div class="ref">${refUpperCase}</div>
          
          <!-- CATÉGORIE -->
          ${categoryNameUpperCase ? `<div class="category">${categoryNameUpperCase}</div>` : ''}
          
          <!-- FOURNISSEUR ET PRIX CRYPTÉ SUR LA MÊME LIGNE -->
          <div class="fournisseur-line">
            ${fournisseurCodeUpperCase ? `<span class="supplier">${fournisseurCodeUpperCase}</span>` : ''}
            ${fournisseurCodeUpperCase ? `<span class="colon">:</span>` : ''}
            <span class="encrypted-price">${encryptedPrixAchat}</span>
          </div>
        </div>
        
        <!-- PRIX DE VENTE (conditionnel) -->
        ${showPrice ? `
        <div class="price-line">
          <span class="price-label">PRIX :</span>
          <span class="price-value">${formattedPrice}</span>
        </div>
        ` : ''}
      </div>
    </div>
  
    <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"></script>
    <script>
      (function() {
        function initBarcode() {
          try {
            const barcodeElement = document.getElementById('barcode');
            if (!barcodeElement) {
              console.error('Élément barcode introuvable');
              return false;
            }
            
            // Nettoyer l'élément SVG existant
            while (barcodeElement.firstChild) {
              barcodeElement.removeChild(barcodeElement.firstChild);
            }
            
            // Générer le code-barre
            JsBarcode("#barcode", "${barcodeValue}", {
              format: "CODE128",
              width: ${sizeConfig.barcodeWidth},
              height: ${sizeConfig.barcodeHeight * 3}, // Ajustement pour la hauteur interne
              displayValue: false,
              margin: 2,
              background: "transparent",
              lineColor: "#000000",
              valid: function(valid) {
                if (!valid) {
                  console.warn("Valeur de code-barre non valide");
                }
              }
            });
            
            // Centrer le SVG
            const svg = document.querySelector('#barcode svg');
            if (svg) {
              svg.style.display = 'block';
              svg.style.margin = '0 auto';
              svg.style.width = 'auto';
              svg.style.maxWidth = '100%';
              svg.style.height = '${sizeConfig.barcodeHeight - 1}mm';
            }
            
            return true;
          } catch (error) {
            console.error('Erreur génération barcode:', error);
            return false;
          }
        }
        
        function startPrintProcess() {
          let attempts = 0;
          const maxAttempts = 3;
          
          function attemptGeneration() {
            attempts++;
            const success = initBarcode();
            
            if (success || attempts >= maxAttempts) {
              setTimeout(() => {
                window.print();
                setTimeout(() => {
                  window.close();
                }, 500);
              }, 150);
            } else {
              setTimeout(attemptGeneration, 100);
            }
          }
          
          attemptGeneration();
        }
        
        if (typeof JsBarcode !== 'undefined') {
          startPrintProcess();
        } else {
          const checkInterval = setInterval(() => {
            if (typeof JsBarcode !== 'undefined') {
              clearInterval(checkInterval);
              startPrintProcess();
            }
          }, 50);
          
          setTimeout(() => {
            clearInterval(checkInterval);
            if (typeof JsBarcode !== 'undefined') {
              startPrintProcess();
            } else {
              console.error('JsBarcode non chargé');
              window.close();
            }
          }, 2000);
        }
      })();
    </script>
  </body>
  </html>
  `;

    // Ouvrir la fenêtre d'impression
    const printWindow = window.open(
      '',
      '_blank',
      `width=${sizeConfig.height * 4},height=${sizeConfig.width * 4},left=100,top=100`
    );

    if (!printWindow) {
      toast.error("Veuillez autoriser les fenêtres popup pour l'impression");
      return;
    }

    printWindow.document.write(printContent);
    printWindow.document.close();
  }, [article, toast]);


  // NEW: Function specifically for small ticket printing (3.1cm × 1.5cm portrait)
  const handlePrintSmallTicket = useCallback((showPrice = true, fournisseurCodeParam?: string) => {
    if (!article) return;

    const categoryName =
      article.sousCategorie?.nom || article.categorie?.nom || "";

    const fournisseurCode = fournisseurCodeParam !== undefined
      ? fournisseurCodeParam
      : (article.fournisseur?.code_barre_fournisseur || getFirstThreeLetters(article.fournisseur?.raison_sociale));

    const barcodeValue = getBarcodeValue(article);

    const formatPrice = (price: number): string => {
      const v = Math.round(price * 1000) / 1000;
      return v.toFixed(3).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    };

    const formattedPrice = formatPrice(Number(article.puv_ttc || 0));
    const prixAchat = Number(article.pua_ttc || 0).toFixed(3);

    const encryptPrice = (price: string | number): string => {
      if (!price || Number(price) === 0) return "";

      const priceNum =
        typeof price === "number"
          ? price.toFixed(3)
          : Number(price.replace(",", ".")).toFixed(3);

      const [intPart, decPart] = priceNum.split(".");
      const millimesValue = Number(intPart) * 1000 + Number(decPart);

      const encryptionMap: Record<string, string> = {
        "0": "X",
        "1": "E",
        "2": "A",
        "3": "V",
        "4": "B",
        "5": "D",
        "6": "T",
        "7": "S",
        "8": "R",
        "9": "F",
      };

      const encryptedInt = intPart
        .split("")
        .map(d => encryptionMap[d])
        .join("");

      let encryptedDec = "";

      if (decPart !== "000") {
        encryptedDec = decPart
          .split("")
          .map(d => encryptionMap[d])
          .join("");
      } else if (millimesValue >= 1000) {
        encryptedDec = "XXX";
      }

      return encryptedInt + encryptedDec;
    };


    const encryptedPrixAchat = encryptPrice(prixAchat);

    const printContent = `
  <!DOCTYPE html>
  <html>
  <head>
  <meta charset="UTF-8">
  <title>Small Label</title>
  
 <style>
 @page {
  size: 44mm 22mm;
  margin: 0;
}

/* RESET */
* {
  box-sizing: border-box;
}

html,
body {
  width: 44mm;
  height: 22mm;
  margin: 0;
  padding: 0;
}

/* PAGE CENTERING */
body {
  display: flex;
  justify-content: center; /* horizontal center */
  align-items: center; /* vertical center */
  font-family: Arial, sans-serif;
  color: black;
  overflow: hidden;
}

/* MAIN CONTAINER */
.container {
  width: 42mm; /* slightly smaller than paper */
  height: 20mm;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;

  /* 🔧 printer mechanical bias correction + move everything UP a bit */
  transform: translate(-0.2mm, -1.5mm); /* left + upward shift */
}

/* BARCODE - HAUTEUR AUGMENTÉE POUR UN ASPECT PLUS GRAND */
.barcode {
  width: 100%;
  height: 9mm;         /* augmenté de 8mm → 9.5mm pour un code-barre plus imposant */
  margin: 0 0 0.6mm 0;    /* espace réduit en bas */
  display: flex;
  justify-content: center;
  align-items: center;
}

.barcode svg {
  width: 100% !important;
  height: 100% !important;
  max-width: 100%;
  max-height: 100%;
  display: block;
}

/* REFERENCE */
.ref {
  font-size: 8.6pt;
  line-height: 1;
  text-align: center;
  margin-top: -0.8mm;    /* tiré un peu plus haut */
  white-space: nowrap;
}

/* CATEGORY */
.category {
  font-size: 7.6pt;
  line-height: 1;
  text-align: center;
  margin-top: -0.3mm;
  white-space: nowrap;
}

/* SUPPLIER + ENCRYPTED PRICE */
.supplier-line {
  font-size: 8.2pt;
  line-height: 1;
  display: flex;
  justify-content: center;
  gap: 1mm;
  margin-top: -0.3mm;
  white-space: nowrap;
}

/* PUBLIC PRICE */
.price {
  font-size: 8.6pt;
  line-height: 1;
  text-align: center;
  margin-top: -0.2mm;    /* tiré plus haut */
  white-space: nowrap;
}
    </style>
  </head>
  
  <body>
  <div class="container">
    <div class="barcode"><svg id="barcode"></svg></div>
    <div class="ref"><strong>${(article.reference || "").toUpperCase()}</strong></div>
    ${categoryName ? `<div class="category">${categoryName.toUpperCase()}</div>` : ""}
    <div class="supplier-line">
  <span>${(fournisseurCode || "").toUpperCase()} :</span>
  <span>${encryptedPrixAchat}</span>
</div>

${showPrice ? `<div class="price"><strong>PRIX : ${formattedPrice}</strong></div>` : ""}
</div>
  
<script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"></script>
<script>
  (function() {
    function generateBarcode() {
      try {
        const barcodeElement = document.getElementById('barcode');
        if (!barcodeElement) return false;

        // Nettoyer
        while (barcodeElement.firstChild) {
          barcodeElement.removeChild(barcodeElement.firstChild);
        }

        // BARRES ENCORE PLUS ÉPAISSES ET PLUS HAUTES → aspect beaucoup plus grand et bold
        JsBarcode("#barcode", "${barcodeValue}", {
          format: "CODE128",
          width: 3,        // très épais (augmenté à 3.8 pour un effet "plus large")
          height: 70,       // hauteur interne très grande → bars remplissent plus verticalement
          displayValue: false,
          margin: 10,
          background: "transparent",
          lineColor: "#000000"
        });

        // Forcer le remplissage exact du conteneur (9.5mm) avec centrage parfait
        const svg = document.querySelector('#barcode');
        if (svg) {
          svg.removeAttribute('width');
          svg.removeAttribute('height');
          svg.setAttribute('width', '100%');
          svg.setAttribute('height', '100%');
          svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        }

        return true;
      } catch (e) {
        console.error(e);
        return false;
      }
    }

    function startPrint() {
      let attempts = 0;
      const maxAttempts = 5;

      function tryGenerate() {
        attempts++;
        const success = generateBarcode();

        if (success || attempts >= maxAttempts) {
          setTimeout(() => {
            window.print();
            setTimeout(() => window.close(), 300);
          }, 100);
        } else {
          setTimeout(tryGenerate, 100);
        }
      }

      tryGenerate();
    }

    if (typeof JsBarcode !== 'undefined') {
      startPrint();
    } else {
      const interval = setInterval(() => {
        if (typeof JsBarcode !== 'undefined') {
          clearInterval(interval);
          startPrint();
        }
      }, 50);

      setTimeout(() => clearInterval(interval), 3000);
    }
  })();
</script>
  
  </body>
  </html>
  `;

    const win = window.open("", "_blank", "width=400,height=300");
    if (!win) return toast.error("Autorisez les popups pour l'impression");
    win.document.write(printContent);
    win.document.close();
  }, [article, toast]);







  // Fixed columns - MODIFIÉ pour ajouter le bouton d'impression
  const columns = useMemo(
    () => [
      {
        header: "Référence",
        accessorKey: "reference",
        enableColumnFilter: false,
      },
      {
        header: "Désignation",
        accessorKey: "designation",
        enableColumnFilter: false,
      },
      {
        header: "Quantité",
        accessorKey: "qte",
        enableColumnFilter: false,
        cell: (cell: any) => cell.getValue() || 0,
      },
      {
        header: "Prix d'achat (TTC)",
        accessorKey: "pua_ttc",
        enableColumnFilter: false,
        cell: (cell: any) => {
          const value = cell.getValue();
          return <>{value != null ? Number(value).toFixed(3) : "0.00"} TND</>;
        },
      },
      {
        header: "Prix de vente (TTC)",
        accessorKey: "puv_ttc",
        enableColumnFilter: false,
        cell: (cell: any) => {
          const value = cell.getValue();
          return <>{value != null ? Number(value).toFixed(3) : "0.00"} TND</>;
        },
      },
      {
        header: "Fournisseur", // Changed from "Type" to "Fournisseur"
        accessorKey: "fournisseur",
        enableColumnFilter: false,
        cell: (cell: any) => {
          const fournisseur = cell.getValue();
          return (
            <span>
              {fournisseur?.raison_sociale || "—"}
            </span>
          );
        },
      },
      // {
      //   header: "Type",
      //   accessorKey: "type",
      //   enableColumnFilter: false,
      //   cell: (cell: any) => (
      //     <Badge
      //       color={
      //         cell.getValue()?.toLowerCase() === "consigné"
      //           ? "success"
      //           : "primary"
      //       }
      //       className="text-uppercase"
      //     >
      //       {cell.getValue()}
      //     </Badge>
      //   ),
      // },
      {
        header: "Action",
        cell: (cellProps: any) => {
          return (
            <ul className="list-inline hstack gap-2 mb-0">
              <li className="list-inline-item">
                <Link
                  to="#"
                  className="text-info d-inline-block"
                  onClick={() => {
                    setArticle(cellProps.row.original);
                    setDetailsModal(true);
                  }}
                >
                  <i className="ri-eye-fill fs-16"></i>
                </Link>
              </li>
              {/* NOUVEAU: Bouton d'impression */}
              <li className="list-inline-item">
                <Link
                  to="#"
                  className="text-warning d-inline-block"
                  onClick={() => {
                    const art = cellProps.row.original;
                    setArticle(art);
                    setFournisseurCodeOverride(
                      art.fournisseur?.code_barre_fournisseur || 
                      getFirstThreeLetters(art.fournisseur?.raison_sociale)
                    );
                    setPrintModal(true);
                  }}
                  title="Imprimer code-barre"
                >
                  <i className="ri-printer-line fs-16"></i>
                </Link>
              </li>
              <li className="list-inline-item edit">
                <Link
                  to="#"
                  className="text-primary d-inline-block edit-item-btn"
                  onClick={() => {
                    setArticle(cellProps.row.original);
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
                    setArticle(cellProps.row.original);
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

  const toggleModal = useCallback(() => {
    if (modal) {
      setModal(false);
      setArticle(null);
    } else {
      setModal(true);
    }
  }, [modal]);

  const toggleDetailsModal = useCallback(() => {
    setDetailsModal(!detailsModal);
  }, [detailsModal]);

  useEffect(() => {
    if (validation.values.categorie_id) {
      const categoryId = parseInt(validation.values.categorie_id.toString());
      const subs = categories.filter((cat) => cat.parent_id === categoryId);
      setSubcategories(subs);

      const currentSubId = validation.values.sous_categorie_id
        ? parseInt(validation.values.sous_categorie_id.toString())
        : null;

      if (!subs.find((sub) => sub.id === currentSubId)) {
        validation.setFieldValue("sous_categorie_id", "");
      }
    } else {
      setSubcategories([]);
      validation.setFieldValue("sous_categorie_id", "");
    }
  }, [validation.values.categorie_id, categories]);

  return (
    <div className="page-content">
      <DeleteModal
        show={deleteModal}
        onDeleteClick={handleDelete}
        onCloseClick={() => setDeleteModal(false)}
      />

      <Container fluid style={{ maxWidth: "100%" }}>
        <BreadCrumb title="Articles" pageTitle="Inventaire" />

        <Row>
          <Col lg={12}>
            <Card id="articleList">
              <CardHeader className="card-header border-0">
                <Row className="align-items-center gy-3">
                  <div className="col-sm">
                    <h5 className="card-title mb-0">Gestion des Articles</h5>
                  </div>
                  <div className="col-sm-auto">
                    <div className="text-success">
                      <span className="fw-semibold fs-16">
                        {" "}
                        nombre des articles :{filteredArticles.length} article
                        {filteredArticles.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                  <div className="col-sm-auto">
                    <div className="d-flex gap-1 flex-wrap">
                      <button
                        type="button"
                        className="btn btn-secondary add-btn"
                        onClick={() => {
                          setIsEdit(false);
                          setArticle(null);
                          toggleModal();
                        }}
                      >
                        <i className="ri-add-line align-bottom me-1"></i>{" "}
                        Ajouter Article
                      </button>
                      <button
                        type="button"
                        className="btn btn-success"
                        onClick={() => setIsExportCSV(true)}
                      >
                        <i className="ri-file-download-line align-bottom me-1"></i>{" "}
                        Exporter
                      </button>
                    </div>
                  </div>
                </Row>
              </CardHeader>

              <CardBody className="pt-0">
                <div>
                  <Nav
                    className="nav-tabs nav-tabs-custom nav-success"
                    role="tablist"
                  >
                    <NavItem>
                      <NavLink
                        className={classnames({ active: activeTab === "1" })}
                        onClick={() => {
                          setActiveTab("1");
                        }}
                        href="#"
                      >
                        <i className="ri-list-check-2 me-1 align-bottom"></i>{" "}
                        Tous
                      </NavLink>
                    </NavItem>
                    <NavItem>
                      <NavLink
                        className={classnames({ active: activeTab === "2" })}
                        onClick={() => {
                          setActiveTab("2");
                        }}
                        href="#"
                      >
                        <i className="ri-checkbox-circle-line me-1 align-bottom"></i>{" "}
                        Consigné
                      </NavLink>
                    </NavItem>
                    <NavItem>
                      <NavLink
                        className={classnames({ active: activeTab === "3" })}
                        onClick={() => {
                          setActiveTab("3");
                        }}
                        href="#"
                      >
                        <i className="ri-close-circle-line me-1 align-bottom"></i>{" "}
                        Non Consigné
                      </NavLink>
                    </NavItem>
                  </Nav>

                  <Row className="mt-3 mb-3">
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
                    <Col md={2}>
                      <button
                        className="btn btn-light w-100"
                        onClick={() => {
                          setStartDate(null);
                          setEndDate(null);
                          setSearchText("");
                        }}
                      >
                        <i className="ri-close-line align-bottom me-1"></i>{" "}
                        Réinitialiser
                      </button>
                    </Col>
                  </Row>

                  {loading ? (
                    <Loader />
                  ) : error ? (
                    <div className="text-danger">{error}</div>
                  ) : (
                    <TableContainer
                      columns={columns}
                      data={filteredArticles}
                      isGlobalFilter={false}
                      customPageSize={100}
                      divClass="table-responsive table-card mb-1 mt-0"
                      tableClass="align-middle table-nowrap"
                      theadClass="table-light text-muted text-uppercase"
                    />
                  )}
                </div>

                {/* Details Modal - MODIFIÉ pour ajouter le bouton d'impression */}
                <Modal
                  isOpen={detailsModal}
                  toggle={toggleDetailsModal}
                  centered
                  size="lg"
                  className="article-details-modal"
                >
                  <ModalHeader
                    toggle={toggleDetailsModal}
                    className="border-0 pb-2"
                  >
                    <div className="d-flex align-items-center">
                      <div className="modal-icon-wrapper bg-primary bg-opacity-10 rounded-circle p-2 me-3">
                        <i className="ri-article-line text-primary fs-4"></i>
                      </div>
                      <div>
                        <h4 className="mb-0 fw-bold text-dark">
                          Détails de l'Article
                        </h4>
                        <small className="text-muted">
                          Informations complètes
                        </small>
                      </div>
                    </div>
                  </ModalHeader>

                  <ModalBody className="pt-0">
                    {article && (
                      <div className="article-details">
                        <Row className="mb-4">
                          <Col md={3}>
                            <div className="article-image-section text-center">
                              {article.image ? (
                                <img
                                  src={`${API_BASE}/${article.image.replace(
                                    /\\/g,
                                    "/"
                                  )}`}
                                  alt={article.designation}
                                  className="img-fluid rounded shadow-sm mb-3"
                                  style={{
                                    maxHeight: "120px",
                                    objectFit: "cover",
                                    width: "100%",
                                  }}
                                />
                              ) : (
                                <div
                                  className="bg-light rounded d-flex align-items-center justify-content-center mb-3"
                                  style={{ height: "120px" }}
                                >
                                  <i className="ri-image-line fs-1 text-muted"></i>
                                </div>
                              )}
                              <Badge
                                color={
                                  article.type?.toLowerCase() === "consigné"
                                    ? "success"
                                    : "primary"
                                }
                                className="text-uppercase fs-12 "
                                style={{ padding: "1px" }}
                              >
                                {article.type}
                              </Badge>
                            </div>
                          </Col>

                          <Col md={9}>
                            <div className="article-header-info">
                              <h3 className="fw-bold text-dark mb-2">
                                {article.nom}
                              </h3>
                              <p className="text-muted mb-3 fs-15">
                                {article.designation}
                              </p>

                              <Row className="g-3">
                                <Col sm={6}>
                                  <div className="d-flex align-items-center">
                                    <i className="ri-barcode-line text-primary me-2 fs-5"></i>
                                    <div>
                                      <small className="text-muted d-block">
                                        Référence
                                      </small>
                                      <strong className="text-dark">
                                        {article.reference}
                                      </strong>
                                    </div>
                                  </div>
                                </Col>
                                <Col sm={6}>
                                  <div className="d-flex align-items-center">
                                    <i className="ri-store-2-line text-primary me-2 fs-5"></i>
                                    <div>
                                      <small className="text-muted d-block">
                                        Stock
                                      </small>
                                      <strong className="text-dark">
                                        {article.qte} unités
                                      </strong>
                                    </div>
                                  </div>
                                </Col>
                              </Row>
                            </div>
                          </Col>
                        </Row>

                        {/* Section Code-barres - MODIFIÉE */}

                        <Row className="g-3">
                          <Col md={6}>
                            <Card className="border-0 shadow-sm h-100">
                              <CardBody className="p-4">
                                <h6 className="fw-semibold mb-3 text-primary">
                                  <i className="ri-folder-info-line me-2"></i>
                                  Classification
                                </h6>
                                <div className="info-grid">
                                  <div className="info-item mb-3">
                                    <Label className="form-label-sm text-muted mb-1">
                                      Famille Principale
                                    </Label>
                                    <div className="d-flex align-items-center">
                                      <i className="ri-folder-2-line text-success me-2"></i>
                                      <span className="fw-semibold">
                                        {article.categorie?.nom ||
                                          "Non spécifiée"}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="info-item mb-3">
                                    <Label className="form-label-sm text-muted mb-1">
                                      Sous-Famille
                                    </Label>
                                    <div className="d-flex align-items-center">
                                      <i className="ri-folder-open-line text-warning me-2"></i>
                                      <span className="fw-semibold">
                                        {article.sousCategorie?.nom ||
                                          "Non spécifiée"}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="info-item">
                                    <Label className="form-label-sm text-muted mb-1">
                                      Fournisseur
                                    </Label>
                                    <div className="d-flex align-items-center">
                                      <i className="ri-truck-line text-info me-2"></i>
                                      <span className="fw-semibold">
                                        {article.fournisseur?.raison_sociale ||
                                          "Non spécifié"}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </CardBody>
                            </Card>
                          </Col>

                          <Col md={6}>
                            <Card className="border-0 shadow-sm h-100">
                              <CardBody className="p-4">
                                <h6 className="fw-semibold mb-3 text-primary">
                                  <i className="ri-money-dollar-circle-line me-2"></i>
                                  Prix et Taxes
                                </h6>
                                <div className="pricing-grid">
                                  <Row className="g-2 mb-3">
                                    <Col sm={6}>
                                      <div className="price-card  bg-opacity-10 rounded p-3 text-center">
                                        <small className="text-muted d-block">
                                          Achat HT
                                        </small>
                                        <strong className="text-primary fs-14">
                                          {Number(article.pua_ht || 0).toFixed(3)} TND
                                        </strong>
                                      </div>
                                    </Col>
                                    <Col sm={6}>
                                      <div className="price-card bg-success bg-opacity-10 rounded p-3 text-center">
                                        <small className="text-muted d-block">
                                          Vente HT
                                        </small>
                                        <strong className="text-success fs-14">
                                          {Number(article.puv_ht || 0).toFixed(3)} TND
                                        </strong>
                                      </div>
                                    </Col>
                                  </Row>
                                  <Row className="g-2 mb-3">
                                    <Col sm={6}>
                                      <div className="price-card  bg-opacity-5 rounded p-3 text-center">
                                        <small className="text-muted d-block">
                                          Achat TTC
                                        </small>
                                        <strong className="text-dark fs-14">
                                          {Number(article.pua_ttc || 0).toFixed(3)} TND
                                        </strong>
                                        {/* Encrypted price added here */}
                                        {article.pua_ttc && article.pua_ttc > 0 && (
                                          <div className="">
                                            <small className="text-danger d-block">
                                              Prix crypté: <code className="text-danger fs-18 fw-bold">
                                                {encryptPrice(article.pua_ttc)}
                                              </code>
                                            </small>

                                          </div>
                                        )}
                                      </div>
                                    </Col>
                                    <Col sm={6}>
                                      <div className="price-card  bg-opacity-5 rounded p-3 text-center">
                                        <small className="text-muted d-block">
                                          Vente TTC
                                        </small>
                                        <strong className="text-dark fs-14">
                                          {Number(article.puv_ttc || 0).toFixed(3)} TND
                                        </strong>
                                      </div>
                                    </Col>
                                  </Row>
                                  <div className="taxes-section">
                                    <Row className="g-2">
                                      <Col sm={6}>
                                        <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                                          <span className="text-black">TVA</span>
                                          {article.tva || 0}%
                                        </div>
                                      </Col>
                                      <Col sm={6}>
                                        <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                                          <span className="text-muted">FODEC</span>
                                          <Badge
                                            color={
                                              article.taux_fodec
                                                ? "success"
                                                : "secondary"
                                            }
                                          >
                                            {article.taux_fodec ? "1%" : "Non"}
                                          </Badge>
                                        </div>
                                      </Col>
                                    </Row>
                                  </div>
                                </div>
                              </CardBody>
                            </Card>
                          </Col>
                        </Row>

                        <Card className="border-0 shadow-sm mt-3">
                          <CardBody className="p-4">
                            <h6 className="fw-semibold mb-3 text-primary">
                              <i className="ri-information-line me-2"></i>
                              Informations Supplémentaires
                            </h6>
                            <Row className="g-3">
                              <Col md={6}>
                                <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                                  <span className="text-muted">
                                    Date de création
                                  </span>
                                  <strong>
                                    {moment(article.createdAt).format(
                                      "DD MMM YYYY"
                                    )}
                                  </strong>
                                </div>
                              </Col>
                            </Row>
                          </CardBody>
                        </Card>
                      </div>
                    )}
                  </ModalBody>

                  <div className="modal-footer border-0 pt-3">
                    <Button
                      color="light"
                      onClick={toggleDetailsModal}
                      className="btn-invoice"
                    >
                      <i className="ri-close-line me-2"></i>
                      Fermer
                    </Button>
                    <Button
                      color="primary"
                      onClick={() => {
                        setArticle(article);
                        setIsEdit(true);
                        setModal(true);
                        setDetailsModal(false);
                      }}
                      className="btn-invoice-primary"
                    >
                      <i className="ri-pencil-line me-2"></i>
                      Modifier l'article
                    </Button>
                  </div>
                </Modal>

                {/* NOUVEAU: Modal d'impression du code-barre */}
                <Modal isOpen={printModal} toggle={() => setPrintModal(false)} centered size="lg">
                  <ModalHeader toggle={() => setPrintModal(false)} className="border-0">
                    <div className="d-flex align-items-center">
                      <i className="ri-printer-line text-primary me-2 fs-5"></i>
                      <div>
                        <h5 className="mb-0 fw-bold">Imprimer Code-Barre</h5>
                        <small className="text-muted">Sélectionnez la taille et imprimez</small>
                      </div>
                    </div>
                  </ModalHeader>
                  <ModalBody>
                    {article && (
                      <div className="print-barcode-container">
                        <div className="row">
                          <div className="col-md-6">
                            {/* Section Grande Étiquette */}
                            <div className="mb-4 border rounded p-3">
                              <div className="d-flex justify-content-between align-items-center mb-3">
                                <div>
                                  <h6 className="mb-1 fw-semibold">Grande Étiquette</h6>
                                  <small className="text-muted">7×6 cm</small>
                                </div>
                                <div className="form-check form-switch">
                                  <Input
                                    type="checkbox"
                                    className="form-check-input"
                                    checked={printSettings.largeLabel.showPrice}
                                    onChange={(e) => setPrintSettings(prev => ({
                                      ...prev,
                                      largeLabel: { showPrice: e.target.checked }
                                    }))}
                                    id="modalLargeLabelSwitch"
                                  />
                                  <Label className="form-check-label" htmlFor="modalLargeLabelSwitch">
                                    {printSettings.largeLabel.showPrice ? 'Valorisé' : 'Non Valorisé'}
                                  </Label>
                                </div>
                              </div>
                              <Button
                                color="primary"
                                onClick={() => handlePrintBarcode('large', printSettings.largeLabel.showPrice, fournisseurCodeOverride)}
                                className="w-100"
                              >
                                <i className="ri-printer-line me-2"></i>
                                Imprimer Grande Étiquette
                              </Button>
                            </div>

                            {/* Section Petit Ticket */}
                            <div className="mb-4 border rounded p-3">
                              <div className="d-flex justify-content-between align-items-center mb-3">
                                <div>
                                  <h6 className="mb-1 fw-semibold">Petit Ticket</h6>
                                  <small className="text-muted">3.1×1.5 cm</small>
                                </div>
                                <div className="form-check form-switch">
                                  <Input
                                    type="checkbox"
                                    className="form-check-input"
                                    checked={printSettings.smallTicket.showPrice}
                                    onChange={(e) => setPrintSettings(prev => ({
                                      ...prev,
                                      smallTicket: { showPrice: e.target.checked }
                                    }))}
                                    id="modalSmallTicketSwitch"
                                  />
                                  <Label className="form-check-label" htmlFor="modalSmallTicketSwitch">
                                    {printSettings.smallTicket.showPrice ? 'Valorisé' : 'Non Valorisé'}
                                  </Label>
                                </div>
                              </div>
                              <Button
                                color="outline-secondary"
                                onClick={() => handlePrintSmallTicket(printSettings.smallTicket.showPrice, fournisseurCodeOverride)}
                                className="w-100"
                              >
                                <i className="ri-printer-line me-2"></i>
                                Imprimer Petit Ticket
                              </Button>
                            </div>
                          </div>

                          <div className="col-md-6">
                            {/* Aperçu */}
                            <Card className="border mb-3">
                              <CardBody className="p-3">
                                <Row className="g-2">
                                  <Col xs={6}>
                                    <div className="text-muted small">Référence</div>
                                    <div className="fw-semibold">{article.reference}</div>
                                  </Col>
                                  <Col xs={6}>
                                    <div className="text-muted small">Prix TTC</div>
                                    <div className="fw-semibold text-success">
                                      {Number(article.puv_ttc || 0).toFixed(3)} TND
                                    </div>
                                  </Col>
                                  <Col xs={12}>
                                    <div className="text-muted small mt-2">Désignation</div>
                                    <div className="fw-semibold">
                                      {article.designation}
                                    </div>
                                  </Col>
                                  <Col xs={12}>
                                    <div className="text-muted small mt-2">Code Fournisseur</div>
                                    <div className="d-flex align-items-center gap-2 mt-1">
                                      <Input
                                        type="text"
                                        value={fournisseurCodeOverride}
                                        onChange={(e) =>
                                          setFournisseurCodeOverride(e.target.value.toUpperCase())
                                        }
                                        placeholder="ex: ROY"
                                        className="fw-semibold text-info"
                                        style={{ width: "120px", textTransform: "uppercase" }}
                                      />
                                      {article.fournisseur?.raison_sociale && (
                                        <small className="text-muted">
                                          (défaut : {getFirstThreeLetters(article.fournisseur.raison_sociale)} — de {article.fournisseur.raison_sociale})
                                        </small>
                                      )}
                                    </div>
                                  </Col>
                                </Row>
                              </CardBody>
                            </Card>

                            <div className="alert alert-info mb-0 py-2 small">
                              <i className="ri-information-line me-2"></i>
                              Chaque format peut être imprimé avec ou sans le prix de vente (Valorisé/Non Valorisé)
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </ModalBody>
                  <div className="modal-footer border-0">
                    <Button color="light" onClick={() => setPrintModal(false)}>
                      <i className="ri-close-line me-1"></i>
                      Annuler
                    </Button>
                    <Button color="primary" onClick={() => handlePrintBarcode('large', printSettings.largeLabel.showPrice, fournisseurCodeOverride)}>
                      <i className="ri-printer-line me-1"></i>
                      Imprimer maintenant
                    </Button>
                  </div>
                </Modal>

                {/* Modal d'ajout/modification (inchangé) */}
                <Modal isOpen={modal} toggle={toggleModal} centered size="lg">
                  <ModalHeader toggle={toggleModal}>
                    {isEdit ? "Modifier Article" : "Ajouter Article"}
                  </ModalHeader>
                  <Form onSubmit={validation.handleSubmit}>
                    <ModalBody>
                      {/* Image Upload Section */}
                      <Row>
                        <Col md={12}>
                          <div className="mb-3">
                            <Label className="form-label">
                              Image de l'article
                            </Label>
                            <div className="border rounded p-3 text-center">
                              {imagePreview || article?.image ? (
                                <div className="mb-3">
                                  <img
                                    src={
                                      imagePreview ||
                                      (article?.image
                                        ? `${API_BASE}/${article.image.replace(
                                          /\\/g,
                                          "/"
                                        )}`
                                        : "")
                                    }
                                    alt="Preview"
                                    className="img-fluid rounded mb-2"
                                    style={{
                                      maxHeight: "150px",
                                      objectFit: "cover",
                                    }}
                                  />
                                  <div>
                                    <Label
                                      htmlFor="image-upload"
                                      className="btn btn-sm btn-outline-primary me-2 mb-1"
                                    >
                                      <i className="ri-upload-line align-middle me-1"></i>
                                      Changer l'image
                                    </Label>
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-outline-danger"
                                      onClick={() => {
                                        setImagePreview(null);
                                        setSelectedImage(null);
                                        validation.setFieldValue("image", "");
                                      }}
                                    >
                                      <i className="ri-delete-bin-line align-middle me-1"></i>
                                      Supprimer
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <i className="ri-image-line fs-1 text-muted mb-2 d-block"></i>
                                  <Label
                                    htmlFor="image-upload"
                                    className="btn btn-outline-primary"
                                  >
                                    <i className="ri-upload-line align-middle me-1"></i>
                                    Télécharger une image
                                  </Label>
                                </div>
                              )}
                              <Input
                                id="image-upload"
                                name="image"
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="d-none"
                              />
                              <small className="text-muted d-block mt-2">
                                Formats supportés: JPG, PNG, GIF. Taille max:
                                5MB
                              </small>
                            </div>
                          </div>
                        </Col>
                      </Row>

                      {/* Basic Information */}
                      <Row>
                        <Col md={6}>
                          <div className="mb-3">
                            <Label className="form-label">Référence*</Label>

                            <Input
                              name="reference"
                              placeholder="Entrer la référence"
                              onChange={validation.handleChange}
                              onBlur={validation.handleBlur}
                              value={validation.values.reference}
                              invalid={
                                validation.touched.reference &&
                                !!validation.errors.reference
                              }
                            />

                            <FormFeedback>
                              {validation.errors.reference}
                            </FormFeedback>
                          </div>
                        </Col>
                        <Col md={6}>
                          <div className="mb-3">
                            <Label className="form-label">Désignation*</Label>
                            <Input
                              name="designation"
                              placeholder="Entrer la désignation"
                              onChange={validation.handleChange}
                              onBlur={validation.handleBlur}
                              value={validation.values.designation}
                              invalid={
                                validation.touched.designation &&
                                !!validation.errors.designation
                              }
                            />
                            <FormFeedback>
                              {validation.errors.designation}
                            </FormFeedback>
                          </div>
                        </Col>
                      </Row>

                      {/* Categories */}
                      <Row>
                        <Col md={6}>
                          <div className="mb-3">
                            <Label className="form-label">
                              Famille Principale*
                            </Label>
                            <Input
                              name="categorie_id"
                              type="select"
                              onChange={validation.handleChange}
                              onBlur={validation.handleBlur}
                              value={validation.values.categorie_id}
                              invalid={
                                validation.touched.categorie_id &&
                                !!validation.errors.categorie_id
                              }
                            >
                              <option value="">
                                Sélectionner une famille principale
                              </option>
                              {categories
                                .filter((cat) => !cat.parent_id)
                                .map((categorie) => (
                                  <option
                                    key={categorie.id}
                                    value={categorie.id}
                                  >
                                    {categorie.nom}
                                  </option>
                                ))}
                            </Input>
                            <FormFeedback>
                              {validation.errors.categorie_id}
                            </FormFeedback>
                          </div>
                        </Col>
                        <Col md={6}>
                          <div className="mb-3">
                            <Label className="form-label">Sous-Famille</Label>
                            <Input
                              name="sous_categorie_id"
                              type="select"
                              onChange={validation.handleChange}
                              onBlur={validation.handleBlur}
                              value={validation.values.sous_categorie_id}
                              disabled={!validation.values.categorie_id}
                            >
                              <option value="">
                                Sélectionner une sous-famille
                              </option>
                              {subcategories.map((subcategorie) => (
                                <option
                                  key={subcategorie.id}
                                  value={subcategorie.id}
                                >
                                  {subcategorie.nom}
                                </option>
                              ))}
                            </Input>
                            {!validation.values.categorie_id && (
                              <small className="text-muted">
                                Sélectionnez d'abord une famille principale
                              </small>
                            )}
                          </div>
                        </Col>
                      </Row>

                      <Row>
                        <Col md={6}>
                          <div className="mb-3">
                            <Label className="form-label">Fournisseur*</Label>
                            <Input
                              name="fournisseur_id"
                              type="select"
                              onChange={validation.handleChange}
                              onBlur={validation.handleBlur}
                              value={validation.values.fournisseur_id}
                              invalid={
                                validation.touched.fournisseur_id &&
                                !!validation.errors.fournisseur_id
                              }
                            >
                              <option value="">
                                Sélectionner un fournisseur
                              </option>
                              {fournisseurs.map((fournisseur) => (
                                <option
                                  key={fournisseur.id}
                                  value={fournisseur.id}
                                >
                                  {fournisseur.raison_sociale}
                                </option>
                              ))}
                            </Input>
                            <FormFeedback>
                              {validation.errors.fournisseur_id}
                            </FormFeedback>
                          </div>
                        </Col>
                        <Col md={6}>
                          <div className="mb-3">
                            <Label className="form-label">Type*</Label>
                            <Input
                              name="type"
                              type="select"
                              onChange={validation.handleChange}
                              onBlur={validation.handleBlur}
                              value={validation.values.type}
                              invalid={
                                validation.touched.type &&
                                !!validation.errors.type
                              }
                            >
                              <option value="Non Consigné">Non Consigné</option>
                              <option value="Consigné">Consigné</option>
                            </Input>
                            <FormFeedback>
                              {validation.errors.type}
                            </FormFeedback>
                          </div>
                        </Col>
                      </Row>

                      {/* Pricing - HT */}
                      {/* Pricing - HT */}
                      {/* Pricing - HT */}
                      {/* Pricing - HT */}
                      {/* Pricing - HT */}
                      <Row>
                        <Col md={6}>
                          <div className="mb-3">
                            <Label className="form-label">Prix d'achat (HT)*</Label>
                            <Input
                              name="pua_ht"
                              type="text"
                              placeholder="0,000 ou 0.000"
                              value={priceInputs.pua_ht}
                              onChange={(e) => handlePriceInputChange('pua_ht', e.target.value)}
                              onKeyDown={handlePriceKeyDown}
                              onBlur={(e) => {
                                validation.handleBlur(e);
                                // Format with comma on blur
                                const numValue = parseNumber(priceInputs.pua_ht);
                                const formatted = formatPriceInput(numValue);
                                setPriceInputs(prev => ({ ...prev, pua_ht: formatted }));
                              }}
                              invalid={validation.touched.pua_ht && !!validation.errors.pua_ht}
                            />
                            <FormFeedback>{validation.errors.pua_ht}</FormFeedback>
                            <small className="text-muted">Prix hors taxes (utilisez . ou , comme séparateur décimal)</small>
                          </div>
                        </Col>
                        <Col md={6}>
                          <div className="mb-3">
                            <Label className="form-label">Prix de vente (HT)*</Label>
                            <Input
                              name="puv_ht"
                              type="text"
                              placeholder="0,000 ou 0.000"
                              value={priceInputs.puv_ht}
                              onChange={(e) => handlePriceInputChange('puv_ht', e.target.value)}
                              onKeyDown={handlePriceKeyDown}
                              onBlur={(e) => {
                                validation.handleBlur(e);
                                const numValue = parseNumber(priceInputs.puv_ht);
                                const formatted = formatPriceInput(numValue);
                                setPriceInputs(prev => ({ ...prev, puv_ht: formatted }));
                              }}
                              invalid={validation.touched.puv_ht && !!validation.errors.puv_ht}
                            />
                            <FormFeedback>{validation.errors.puv_ht}</FormFeedback>
                            <small className="text-muted">Prix hors taxes (utilisez . ou , comme séparateur décimal)</small>
                          </div>
                        </Col>
                      </Row>

                      {/* Pricing - TTC */}
                      <Row>
                        <Col md={6}>
                          <div className="mb-3">
                            <Label className="form-label">Prix d'achat (TTC)</Label>
                            <Input
                              name="pua_ttc"
                              type="text"
                              placeholder="0,000 ou 0.000"
                              value={priceInputs.pua_ttc}
                              onChange={(e) => handlePriceInputChange('pua_ttc', e.target.value)}
                              onKeyDown={handlePriceKeyDown}
                              onBlur={(e) => {
                                validation.handleBlur(e);
                                const numValue = parseNumber(priceInputs.pua_ttc);
                                const formatted = formatPriceInput(numValue);
                                setPriceInputs(prev => ({ ...prev, pua_ttc: formatted }));
                              }}
                            />
                            <small className="text-muted">
                              HT × {validation.values.taux_fodec ? '1.01' : '1'} × {1 + parseNumber(validation.values.tva) / 100}
                            </small>
                          </div>
                        </Col>
                        <Col md={6}>
                          <div className="mb-3">
                            <Label className="form-label">Prix de vente (TTC)</Label>
                            <Input
                              name="puv_ttc"
                              type="text"
                              placeholder="0,000 ou 0.000"
                              value={priceInputs.puv_ttc}
                              onChange={(e) => handlePriceInputChange('puv_ttc', e.target.value)}
                              onKeyDown={handlePriceKeyDown}
                              onBlur={(e) => {
                                validation.handleBlur(e);
                                const numValue = parseNumber(priceInputs.puv_ttc);
                                const formatted = formatPriceInput(numValue);
                                setPriceInputs(prev => ({ ...prev, puv_ttc: formatted }));
                              }}
                            />
                            <small className="text-muted">
                              HT × {validation.values.taux_fodec ? '1.01' : '1'} × {1 + parseNumber(validation.values.tva) / 100}
                            </small>
                          </div>
                        </Col>
                      </Row>




                      {/* Tax Settings */}
                      <Row>
                        <Col md={6}>
                          <div className="mb-3">
                            <Label className="form-label">Taux de TVA</Label>
                            <Input
                              name="tva"
                              type="select"
                              value={priceInputs.tva}
                              onChange={(e) => handleTVAInputChange(e.target.value)}
                              onBlur={validation.handleBlur}
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
                          <div className="mb-3 d-flex align-items-end" style={{ height: "100%" }}>
                            <div className="form-check form-switch">
                              <Input
                                name="taux_fodec"
                                type="checkbox"
                                className="form-check-input"
                                onChange={(e) => {
                                  validation.setFieldValue("taux_fodec", e.target.checked);
                                  const tva = parseNumber(validation.values.tva);
                                  const hasFodec = e.target.checked;

                                  // Recalculate TTC prices
                                  setTimeout(() => {
                                    if (validation.values.pua_ht) {
                                      const ttc = calculateTTCFromHT(validation.values.pua_ht, tva, hasFodec);
                                      validation.setFieldValue("pua_ttc", ttc);
                                      setPriceInputs(prev => ({
                                        ...prev,
                                        pua_ttc: formatPriceInput(ttc)
                                      }));
                                    }

                                    if (validation.values.puv_ht) {
                                      const ttc = calculateTTCFromHT(validation.values.puv_ht, tva, hasFodec);
                                      validation.setFieldValue("puv_ttc", ttc);
                                      setPriceInputs(prev => ({
                                        ...prev,
                                        puv_ttc: formatPriceInput(ttc)
                                      }));
                                    }
                                  }, 10);
                                }}
                                checked={!!validation.values.taux_fodec}
                                id="fodecSwitch"
                              />
                              <Label className="form-check-label" htmlFor="fodecSwitch">
                                Taux FODEC (1%)
                              </Label>
                            </div>
                            <small className="text-muted ms-2">Taxe FODEC sur le HT</small>
                          </div>
                        </Col>
                      </Row>

                      {/* Debug Section (remove in production) */}
                    </ModalBody>
                    <div className="modal-footer">
                      <button
                        type="button"
                        className="btn btn-light"
                        onClick={toggleModal}
                      >
                        Fermer
                      </button>
                      <button type="submit" className="btn btn-success">
                        {isEdit ? "Mettre à jour" : "Ajouter"}
                      </button>
                    </div>
                  </Form>
                </Modal>

                <ToastContainer closeButton={false} limit={1} />
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default ArticlesList; 