import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  Card,
  CardBody,
  Col,
  Container,
  CardHeader,
  Row,
  Nav,
  NavItem,
  NavLink,
  Badge,
  Button,
  InputGroupText,
  InputGroup,
} from "reactstrap";
import { Link } from "react-router-dom";
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import TableContainer from "../../../Components/Common/TableContainer";
import DeleteModal from "../../../Components/Common/DeleteModal";
import Loader from "../../../Components/Common/Loader";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import moment from "moment";
import Flatpickr from "react-flatpickr";
import classnames from "classnames";

// Import all services
import { fetchBonsCommandeClient } from "../../../Components/CommandeClient/CommandeClientServices";
import { fetchDevis } from "../../../Components/CommandeClient/CommandeClientServices";
import { fetchFacturesClient } from "./FactureClientServices";
import { FetchBonLivraison } from "../../../Components/CommandeClient/BonLivraisonServices";
import { fetchVenteComptoire } from "../../../Components/CommandeClient/CommandeClientServices";
import { fetchPaiementsClient } from "./PaiementBcClientServices";
import { fetchEncaissementsClient } from "./FactureClientServices";

// Helper functions (same as existing components)
const getSafeNumber = (value: any): number => {
  if (value === null || value === undefined) return 0;
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

const customRound = (num: number): number => {
  if (isNaN(num) || !isFinite(num)) return 0;
  const multiplied = Math.round(num * 100000);
  const result = multiplied / 100000;
  return Math.round(result * 1000) / 1000;
};

// Calculate totals (same logic as existing components)
const calculateTotals = (articles: any[], remise: number, remiseType: string, timbreFiscal: boolean = false) => {
  if (!articles || articles.length === 0) {
    return { totalHT: 0, totalTVA: 0, totalTTC: 0, totalAfterRemise: 0 };
  }

  let totalHT = 0;
  let totalTVA = 0;
  let totalTTC = 0;

  articles.forEach((article: any) => {
    const qty = getSafeNumber(article.quantite);
    const priceHT = getSafeNumber(article.prixUnitaire || article.prix_unitaire);
    const tvaRate = getSafeNumber(article.tva);
    const remiseRate = getSafeNumber(article.remise);
    const priceTTC = getSafeNumber(article.prix_ttc) || priceHT * (1 + tvaRate / 100);

    const montantHTLigne = customRound(qty * priceHT * (1 - remiseRate / 100));
    const montantTTCLigne = customRound(qty * priceTTC);
    const montantTVALigne = customRound(montantTTCLigne - montantHTLigne);

    totalHT = customRound(totalHT + montantHTLigne);
    totalTVA = customRound(totalTVA + montantTVALigne);
    totalTTC = customRound(totalTTC + montantTTCLigne);
  });

  let totalAfterRemise = totalTTC;
  const remiseValue = getSafeNumber(remise);

  if (remiseValue > 0) {
    if (remiseType === "percentage") {
      totalAfterRemise = customRound(totalTTC * (1 - remiseValue / 100));
    } else if (remiseType === "fixed") {
      totalAfterRemise = customRound(remiseValue);
    }
  }

  if (timbreFiscal) {
    totalAfterRemise = customRound(totalAfterRemise + 1);
  }

  return { totalHT, totalTVA, totalTTC, totalAfterRemise };
};

const calculatePaidFromMethods = (paymentMethods: any[]): number => {
  if (!paymentMethods || paymentMethods.length === 0) return 0;
  return paymentMethods
    .filter((pm: any) => pm.method !== "retenue")
    .reduce((sum: number, pm: any) => customRound(sum + getSafeNumber(pm.amount)), 0);
};

const calculatePaidFromPaiements = (paiements: any[]): number => {
  if (!paiements || paiements.length === 0) return 0;
  return paiements
    .filter((p: any) => p.modePaiement !== "Retention")
    .reduce((sum: number, p: any) => customRound(sum + getSafeNumber(p.montant)), 0);
};

// Process each document type
const processBonCommande = (bon: any, paiementsData: any[]) => {
  const relevantPaiements = paiementsData.filter((p: any) => p.bonCommandeClient_id === bon.id);
  const { totalAfterRemise } = calculateTotals(bon.articles, bon.remise, bon.remiseType, false);

  const paidFromMethods = calculatePaidFromMethods(bon.paymentMethods);
  const paidFromPaiements = calculatePaidFromPaiements(relevantPaiements);
  const totalPaid = customRound(paidFromMethods + paidFromPaiements);

  let retention = 0;
  if (bon.paymentMethods) {
    bon.paymentMethods
      .filter((pm: any) => pm.method === "retenue")
      .forEach((pm: any) => {
        const amount = getSafeNumber(pm.amount);
        if (amount === 0 && pm.tauxRetention) {
          retention = customRound(retention + (totalAfterRemise * pm.tauxRetention) / 100);
        } else {
          retention = customRound(retention + amount);
        }
      });
  }

  const reste = Math.max(0, customRound(totalAfterRemise - totalPaid - retention));

  return {
    ...bon,
    displayNumero: bon.numeroCommande,
    displayDate: bon.dateCommande,
    displayTotal: totalAfterRemise,
    displayPaid: totalPaid,
    displayReste: reste,
    displayRetention: retention,
    sourceType: "Bon Commande",
    sourceIcon: "ri-shopping-bag-line",
    sourceColor: "primary",
  };
};

const processDevis = (devis: any) => {
  const { totalAfterRemise } = calculateTotals(devis.articles, devis.remise, devis.remiseType, false);

  return {
    ...devis,
    displayNumero: devis.numeroCommande,
    displayDate: devis.dateCommande,
    displayTotal: totalAfterRemise,
    displayPaid: 0,
    displayReste: totalAfterRemise,
    displayRetention: 0,
    sourceType: "Devis",
    sourceIcon: "ri-file-list-3-line",
    sourceColor: "secondary",
  };
};

const processFacture = (facture: any, encaissementsData: any[]) => {
  const relevantEncaissements = encaissementsData.filter((e: any) => e.facture_id === facture.id);
  const { totalAfterRemise } = calculateTotals(
    facture.articles,
    facture.remise,
    facture.remiseType,
    facture.timbreFiscal || false
  );

  const paidFromMethods = calculatePaidFromMethods(facture.paymentMethods);
  const paidFromEncaissements = relevantEncaissements.reduce(
    (sum: number, e: any) => customRound(sum + getSafeNumber(e.montant)), 0
  );
  const totalPaid = customRound(paidFromMethods + paidFromEncaissements);
  const retention = getSafeNumber(facture.montantRetenue);
  const reste = Math.max(0, customRound(totalAfterRemise - totalPaid - retention));

  let status = facture.status;
  if (facture.status !== "Annulee") {
    if (reste === 0 && totalAfterRemise > 0) {
      status = "Payee";
    } else if (totalPaid > 0 && totalPaid < totalAfterRemise - retention) {
      status = "Partiellement Payee";
    }
  }

  return {
    ...facture,
    displayNumero: facture.numeroFacture,
    displayDate: facture.dateFacture,
    displayTotal: totalAfterRemise,
    displayPaid: totalPaid,
    displayReste: reste,
    displayRetention: retention,
    displayStatus: status,
    sourceType: "Facture",
    sourceIcon: "ri-file-text-line",
    sourceColor: "success",
  };
};

const processBonLivraison = (bon: any, paiementsData: any[]) => {
  const relevantPaiements = paiementsData.filter((p: any) => p.bonLivraison_id === bon.id);
  const { totalAfterRemise } = calculateTotals(bon.articles, bon.remise, bon.remiseType, false);

  const paidFromMethods = calculatePaidFromMethods(bon.paymentMethods);
  const paidFromPaiements = calculatePaidFromPaiements(relevantPaiements);
  const totalPaid = customRound(paidFromMethods + paidFromPaiements);
  const retention = getSafeNumber(bon.montantRetenue);
  const reste = Math.max(0, customRound(totalAfterRemise - totalPaid - retention));

  return {
    ...bon,
    displayNumero: bon.numeroLivraison,
    displayDate: bon.dateLivraison,
    displayTotal: totalAfterRemise,
    displayPaid: totalPaid,
    displayReste: reste,
    displayRetention: retention,
    sourceType: "Bon Livraison",
    sourceIcon: "ri-truck-line",
    sourceColor: "info",
  };
};

const processVenteComptoire = (vente: any) => {
  const { totalAfterRemise } = calculateTotals(vente.articles, vente.remise, vente.remiseType, false);
  const totalPaid = calculatePaidFromMethods(vente.paymentMethods);
  const reste = Math.max(0, customRound(totalAfterRemise - totalPaid));

  return {
    ...vente,
    displayNumero: vente.numeroCommande,
    displayDate: vente.dateCommande,
    displayTotal: totalAfterRemise,
    displayPaid: totalPaid,
    displayReste: reste,
    displayRetention: 0,
    sourceType: "Vente Comptoire",
    sourceIcon: "ri-store-line",
    sourceColor: "warning",
  };
};

// Status Badge Component
const StatusBadge = ({ status }: { status?: string }) => {
  const statusConfig: Record<string, { bgClass: string; textClass: string; icon: string }> = {
    Brouillon: { bgClass: "bg-warning", textClass: "text-warning", icon: "ri-draft-line" },
    Confirme: { bgClass: "bg-primary", textClass: "text-primary", icon: "ri-checkbox-circle-line" },
    Livre: { bgClass: "bg-success", textClass: "text-success", icon: "ri-truck-line" },
    Livree: { bgClass: "bg-success", textClass: "text-success", icon: "ri-truck-line" },
    Annule: { bgClass: "bg-danger", textClass: "text-danger", icon: "ri-close-circle-line" },
    Annulee: { bgClass: "bg-danger", textClass: "text-danger", icon: "ri-close-circle-line" },
    "Partiellement Livre": { bgClass: "bg-info", textClass: "text-info", icon: "ri-truck-line" },
    "Partiellement Livree": { bgClass: "bg-info", textClass: "text-info", icon: "ri-truck-line" },
    Validee: { bgClass: "bg-primary", textClass: "text-primary", icon: "ri-checkbox-circle-line" },
    Payee: { bgClass: "bg-success", textClass: "text-success", icon: "ri-money-dollar-circle-line" },
    "Partiellement Payee": { bgClass: "bg-info", textClass: "text-info", icon: "ri-wallet-line" },
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

// Phone formatting
const formatPhoneInput = (value: string): string => {
  const cleaned = value.replace(/\D/g, "");
  const limited = cleaned.slice(0, 8);
  if (limited.length <= 2) return limited;
  if (limited.length <= 5) return `${limited.substring(0, 2)} ${limited.substring(2)}`;
  return `${limited.substring(0, 2)} ${limited.substring(2, 5)} ${limited.substring(5, 8)}`;
};

const formatPhoneDisplay = (phone: string | null | undefined): string => {
  if (!phone) return "N/A";
  const cleanPhone = phone.replace(/\D/g, "");
  if (cleanPhone.length === 8) {
    return `${cleanPhone.substring(0, 2)} ${cleanPhone.substring(2, 5)} ${cleanPhone.substring(5, 8)}`;
  }
  return phone;
};

const UnifiedDashboard = () => {
  const [activeTab, setActiveTab] = useState("1");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [searchText, setSearchText] = useState("");
  const [searchPhone, setSearchPhone] = useState("");
  const [unifiedData, setUnifiedData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);

  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);

      const [bonsData, devisData, facturesData, livraisonsData, ventesData, paiementsData, encaissementsData] = await Promise.all([
        fetchBonsCommandeClient(),
        fetchDevis(),
        fetchFacturesClient(),
        FetchBonLivraison(),
        fetchVenteComptoire(),
        fetchPaiementsClient(),
        fetchEncaissementsClient(),
      ]);

      const processed = [
        ...bonsData.map((bon: any) => processBonCommande(bon, paiementsData)),
        ...devisData.map((devis: any) => processDevis(devis)),
        ...facturesData.map((facture: any) => processFacture(facture, encaissementsData)),
        ...livraisonsData.map((bon: any) => processBonLivraison(bon, paiementsData)),
        ...ventesData.map((vente: any) => processVenteComptoire(vente)),
      ];

      setUnifiedData(processed);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err instanceof Error ? err.message : "Échec du chargement des données");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Filter data
  useEffect(() => {
    let result = [...unifiedData];

    // Filter by tab
    if (activeTab === "2") {
      result = result.filter((item) => item.sourceType === "Bon Commande");
    } else if (activeTab === "3") {
      result = result.filter((item) => item.sourceType === "Devis");
    } else if (activeTab === "4") {
      result = result.filter((item) => item.sourceType === "Facture");
    } else if (activeTab === "5") {
      result = result.filter((item) => item.sourceType === "Bon Livraison");
    } else if (activeTab === "6") {
      result = result.filter((item) => item.sourceType === "Vente Comptoire");
    }

    // Filter by date
    if (startDate && endDate) {
      const start = moment(startDate).startOf("day");
      const end = moment(endDate).endOf("day");
      result = result.filter((item) => {
        const itemDate = moment(item.displayDate);
        return itemDate.isBetween(start, end, null, "[]");
      });
    }

    // Filter by search text
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      result = result.filter((item) => {
        const numero = (item.displayNumero || "").toLowerCase();
        const clientName = (item.client?.raison_sociale || "").toLowerCase();
        const clientDesignation = (item.client?.designation || "").toLowerCase();
        return numero.includes(searchLower) || clientName.includes(searchLower) || clientDesignation.includes(searchLower);
      });
    }

    // Filter by phone
    if (searchPhone) {
      const cleanPhoneSearch = searchPhone.replace(/\s/g, "").trim();
      result = result.filter((item) => {
        if (!item.client) return false;
        const phone1 = (item.client.telephone1 || "").replace(/\s/g, "");
        const phone2 = (item.client.telephone2 || "").replace(/\s/g, "");
        return phone1.includes(cleanPhoneSearch) || phone2.includes(cleanPhoneSearch);
      });
    }

    setFilteredData(result);
  }, [activeTab, startDate, endDate, searchText, searchPhone, unifiedData]);

  // Table columns - using the same pattern as existing pages
  const columns = useMemo(() => [
    {
      header: "Source",
      accessorKey: "sourceType",
      enableColumnFilter: false,
      cell: (cell: any) => {
        const item = cell.row.original;
        return (
          <Badge color={item.sourceColor} className="px-2 py-1">
            <i className={`${item.sourceIcon} me-1 fs-11`}></i>
            {item.sourceType}
          </Badge>
        );
      },
    },
    {
      header: "Numéro",
      accessorKey: "displayNumero",
      enableColumnFilter: false,
      cell: (cell: any) => (
        <span className="text-body fw-medium">
          {cell.getValue()}
        </span>
      ),
    },
    {
      header: "Date",
      accessorKey: "displayDate",
      enableColumnFilter: false,
      cell: (cell: any) => moment(cell.getValue()).format("DD MMM YYYY"),
    },
    {
      header: "Client",
      accessorKey: "client",
      enableColumnFilter: false,
      cell: (cell: any) => cell.getValue()?.raison_sociale || "-",
    },
    {
      header: "Téléphone",
      accessorKey: "client",
      enableColumnFilter: false,
      cell: (cell: any) => formatPhoneDisplay(cell.getValue()?.telephone1) || "-",
    },
    {
      header: "Vendeur",
      accessorKey: "vendeur",
      enableColumnFilter: false,
      cell: (cell: any) => {
        const vendeur = cell.getValue();
        return vendeur ? `${vendeur.nom || ""} ${vendeur.prenom || ""}` : "-";
      },
    },
    {
      header: "Articles",
      accessorKey: "articles",
      enableColumnFilter: false,
      cell: (cell: any) => (
        <Badge color="success" className="text-uppercase">
          {cell.getValue()?.length || 0} articles
        </Badge>
      ),
    },
    {
      header: "Net à Payer",
      accessorKey: "displayTotal",
      enableColumnFilter: false,
      cell: (cell: any) => `${(cell.getValue() || 0).toFixed(3)} DT`,
    },
    {
      header: "Payé",
      accessorKey: "displayPaid",
      enableColumnFilter: false,
      cell: (cell: any) => `${(cell.getValue() || 0).toFixed(3)} DT`,
    },
    {
      header: "Reste",
      accessorKey: "displayReste",
      enableColumnFilter: false,
      cell: (cell: any) => {
        const reste = cell.getValue() || 0;
        return (
          <span className={reste > 0 ? "text-danger fw-medium" : "text-success fw-medium"}>
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
  ], []);

  // Calculate statistics
  const stats = {
    total: filteredData.length,
    totalAmount: filteredData.reduce((sum, item) => sum + (item.displayTotal || 0), 0),
    totalPaid: filteredData.reduce((sum, item) => sum + (item.displayPaid || 0), 0),
    totalReste: filteredData.reduce((sum, item) => sum + (item.displayReste || 0), 0),
    totalArticles: filteredData.reduce((sum, item) => sum + (item.articles?.length || 0), 0),
    uniqueClients: new Set(filteredData.map((item) => item.client?.id).filter(Boolean)).size,
  };

  return (
    <div className="page-content">
      <Container fluid style={{ maxWidth: "100%" }}>
        <BreadCrumb title="Tableau de Bord Unifié" pageTitle="Dashboard" />

        <Row>
          <Col lg={12}>
            <Card id="unifiedDashboard">
              <CardHeader className="card-header border-0">
                <Row className="align-items-center gy-3">
                  <div className="col-sm">
                    <h5 className="card-title mb-0">
                      Gestion des Documents
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
                    </div>
                  </div>
                </Row>
              </CardHeader>

              <Nav className="nav-tabs nav-tabs-custom nav-success" role="tablist">
                <NavItem>
                  <NavLink
                    className={classnames({ active: activeTab === "1" })}
                    onClick={() => setActiveTab("1")}
                  >
                    <i className="ri-apps-line me-1 align-bottom"></i> Tous ({unifiedData.length})
                  </NavLink>
                </NavItem>
                <NavItem>
                  <NavLink
                    className={classnames({ active: activeTab === "2" })}
                    onClick={() => setActiveTab("2")}
                  >
                    <i className="ri-shopping-bag-line me-1 align-bottom"></i> Bons Commande
                  </NavLink>
                </NavItem>
                <NavItem>
                  <NavLink
                    className={classnames({ active: activeTab === "3" })}
                    onClick={() => setActiveTab("3")}
                  >
                    <i className="ri-file-list-3-line me-1 align-bottom"></i> Devis
                  </NavLink>
                </NavItem>
                <NavItem>
                  <NavLink
                    className={classnames({ active: activeTab === "4" })}
                    onClick={() => setActiveTab("4")}
                  >
                    <i className="ri-file-text-line me-1 align-bottom"></i> Factures
                  </NavLink>
                </NavItem>
                <NavItem>
                  <NavLink
                    className={classnames({ active: activeTab === "5" })}
                    onClick={() => setActiveTab("5")}
                  >
                    <i className="ri-truck-line me-1 align-bottom"></i> Bons Livraison
                  </NavLink>
                </NavItem>
                <NavItem>
                  <NavLink
                    className={classnames({ active: activeTab === "6" })}
                    onClick={() => setActiveTab("6")}
                  >
                    <i className="ri-store-line me-1 align-bottom"></i> Ventes Comptoire
                  </NavLink>
                </NavItem>
              </Nav>

              <CardBody className="pt-3">
                {/* Filters Row */}
                <Row className="mb-3">
                  <Col md={3}>
                    <div className="search-box">
                      <InputGroup>
                        <InputGroupText>
                          <i className="ri-search-line"></i>
                        </InputGroupText>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Rechercher par numéro, client..."
                          value={searchText}
                          onChange={(e) => setSearchText(e.target.value)}
                        />
                      </InputGroup>
                    </div>
                  </Col>
                  <Col md={3}>
                    <div className="search-box">
                      <InputGroup>
                        <InputGroupText>
                          <i className="ri-phone-line"></i>
                        </InputGroupText>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Rechercher par téléphone..."
                          value={searchPhone}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value) {
                              const formatted = formatPhoneInput(value);
                              setSearchPhone(formatted);
                            } else {
                              setSearchPhone("");
                            }
                          }}
                        />
                      </InputGroup>
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

                {/* Statistics Row */}
                <Row className="mb-4">
                  <Col md={2}>
                    <div className="card border-0 shadow-sm bg-primary bg-opacity-10">
                      <div className="card-body text-center py-2">
                        <h6 className="text-muted mb-1">Documents</h6>
                        <h4 className="mb-0 text-primary">{stats.total}</h4>
                      </div>
                    </div>
                  </Col>
                  <Col md={2}>
                    <div className="card border-0 shadow-sm bg-success bg-opacity-10">
                      <div className="card-body text-center py-2">
                        <h6 className="text-muted mb-1">Montant Total</h6>
                        <h6 className="mb-0 text-success">{stats.totalAmount.toFixed(3)} DT</h6>
                      </div>
                    </div>
                  </Col>
                  <Col md={2}>
                    <div className="card border-0 shadow-sm bg-info bg-opacity-10">
                      <div className="card-body text-center py-2">
                        <h6 className="text-muted mb-1">Total Payé</h6>
                        <h6 className="mb-0 text-info">{stats.totalPaid.toFixed(3)} DT</h6>
                      </div>
                    </div>
                  </Col>
                  <Col md={2}>
                    <div className="card border-0 shadow-sm bg-danger bg-opacity-10">
                      <div className="card-body text-center py-2">
                        <h6 className="text-muted mb-1">Reste à Payer</h6>
                        <h6 className="mb-0 text-danger">{stats.totalReste.toFixed(3)} DT</h6>
                      </div>
                    </div>
                  </Col>
                  <Col md={2}>
                    <div className="card border-0 shadow-sm bg-warning bg-opacity-10">
                      <div className="card-body text-center py-2">
                        <h6 className="text-muted mb-1">Articles</h6>
                        <h4 className="mb-0 text-warning">{stats.totalArticles}</h4>
                      </div>
                    </div>
                  </Col>
                  <Col md={2}>
                    <div className="card border-0 shadow-sm bg-secondary bg-opacity-10">
                      <div className="card-body text-center py-2">
                        <h6 className="text-muted mb-1">Clients</h6>
                        <h4 className="mb-0 text-secondary">{stats.uniqueClients}</h4>
                      </div>
                    </div>
                  </Col>
                </Row>

                {/* Data Table */}
                {loading ? (
                  <Loader />
                ) : error ? (
                  <div className="text-danger">{error}</div>
                ) : (
                  <TableContainer
                    columns={columns}
                    data={filteredData}
                    isGlobalFilter={false}
                    customPageSize={10}
                    divClass="table-responsive table-card mb-1 mt-0"
                    tableClass="align-middle table-nowrap"
                    theadClass="table-light text-muted text-uppercase"
                  />
                )}

                <ToastContainer />
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default UnifiedDashboard;