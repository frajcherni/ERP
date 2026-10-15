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
import { fetchBonsCommandeClientPaginated, fetchDevisPaginated, fetchVenteComptoirePaginated } from "../../../Components/CommandeClient/CommandeClientServices";
import { fetchFacturesClientPaginated, fetchEncaissementsClient } from "./FactureClientServices";
import { FetchBonLivraisonPaginated } from "../../../Components/CommandeClient/BonLivraisonServices";
import { fetchPaiementsClient } from "./PaiementBcClientServices";
import { formatPhoneSearch } from "../../../helpers/phone_helper";

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

const UnifiedDashboard = ({ hideHeader = false }: { hideHeader?: boolean }) => {
  const [activeTab, setActiveTab] = useState("1");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(moment().toDate());
  const [endDate, setEndDate] = useState<Date | null>(moment().toDate());
  const [searchText, setSearchText] = useState("");
  const [searchPhone, setSearchPhone] = useState("");
  const [unifiedData, setUnifiedData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);

  // ── Pagination state ──────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [debouncedPhone, setDebouncedPhone] = useState("");

  // Handle debouncing for search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchText), 500);
    return () => clearTimeout(timer);
  }, [searchText]);

  // Handle debouncing for phone
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedPhone(searchPhone), 500);
    return () => clearTimeout(timer);
  }, [searchPhone]);

  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);

      const commonParams = {
        page: currentPage,
        limit: pageSize,
        search: debouncedSearch || undefined,
        searchPhone: debouncedPhone || undefined,
        startDate: startDate ? moment(startDate).format("YYYY-MM-DD") : undefined,
        endDate: endDate ? moment(endDate).format("YYYY-MM-DD") : undefined,
      };

      let processed: any[] = [];
      let total = 0;

      // Tab-specific fetching
      if (activeTab === "1") {
        const smallLimit = Math.max(5, Math.ceil(pageSize / 5));
        const [bonsRes, devisRes, facturesRes, livraisonsRes, ventesRes, paiementsData, encaissementsData] = await Promise.all([
          fetchBonsCommandeClientPaginated({ ...commonParams, limit: smallLimit }),
          fetchDevisPaginated({ ...commonParams, limit: smallLimit }),
          fetchFacturesClientPaginated({ ...commonParams, limit: smallLimit }),
          FetchBonLivraisonPaginated({ ...commonParams, limit: smallLimit }),
          fetchVenteComptoirePaginated({ ...commonParams, limit: smallLimit }),
          fetchPaiementsClient(),
          fetchEncaissementsClient(),
        ]);

        processed = [
          ...bonsRes.bons.map((bon: any) => processBonCommande(bon, paiementsData)),
          ...devisRes.devis.map((devis: any) => processDevis(devis)),
          ...facturesRes.factures.map((facture: any) => processFacture(facture, encaissementsData)),
          ...livraisonsRes.bons.map((bon: any) => processBonLivraison(bon, paiementsData)),
          ...ventesRes.bons.map((vente: any) => processVenteComptoire(vente)),
        ];
        total = bonsRes.pagination.totalCount + devisRes.pagination.totalCount + facturesRes.pagination.totalCount + livraisonsRes.pagination.totalCount + ventesRes.pagination.totalCount;
      } else if (activeTab === "2") {
        const [res, paiementsData] = await Promise.all([fetchBonsCommandeClientPaginated(commonParams), fetchPaiementsClient()]);
        processed = res.bons.map((bon: any) => processBonCommande(bon, paiementsData));
        total = res.pagination.totalCount;
      } else if (activeTab === "3") {
        const res = await fetchDevisPaginated(commonParams);
        processed = res.devis.map((devis: any) => processDevis(devis));
        total = res.pagination.totalCount;
      } else if (activeTab === "4") {
        const [res, encaissementsData] = await Promise.all([fetchFacturesClientPaginated(commonParams), fetchEncaissementsClient()]);
        processed = res.factures.map((facture: any) => processFacture(facture, encaissementsData));
        total = res.pagination.totalCount;
      } else if (activeTab === "5") {
        const [res, paiementsData] = await Promise.all([FetchBonLivraisonPaginated(commonParams), fetchPaiementsClient()]);
        processed = res.bons.map((bon: any) => processBonLivraison(bon, paiementsData));
        total = res.pagination.totalCount;
      } else if (activeTab === "6") {
        const res = await fetchVenteComptoirePaginated(commonParams);
        processed = res.bons.map((vente: any) => processVenteComptoire(vente));
        total = res.pagination.totalCount;
      }

      setUnifiedData(processed);
      setFilteredData(processed);
      setTotalCount(total);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err instanceof Error ? err.message : "Échec du chargement des données");
      setLoading(false);
    }
  }, [activeTab, currentPage, pageSize, debouncedSearch, debouncedPhone, startDate, endDate]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, debouncedSearch, debouncedPhone, startDate, endDate]);

  // Table columns - using the same pattern as existing pages
  const columns = useMemo(() => [
    {
      header: "Numéro",
      accessorKey: "displayNumero",
      enableColumnFilter: false,
      cell: (cell: any) => <span className="text-body fw-medium">{cell.getValue()}</span>,
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
      header: "Vendeur",
      accessorKey: "vendeur",
      enableColumnFilter: false,
      cell: (cell: any) => {
        const vendeur = cell.getValue();
        return vendeur ? `${vendeur.nom || ""} ${vendeur.prenom || ""}` : "-";
      },
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

  return (
    <div className={hideHeader ? "" : "page-content"}>
      <Container fluid style={{ maxWidth: "100%" }}>
        {!hideHeader && <BreadCrumb title="Tableau de Bord Unifié" pageTitle="Dashboard" />}

        <Row>
          <Col lg={12}>
            <Card id="unifiedDashboard">
              <CardHeader className="card-header border-0">
                <Row className="align-items-center gy-3">
                  <div className="col-sm">
                    <h5 className="card-title mb-0">Gestion</h5>
                  </div>
                  <div className="col-sm-auto">
                    <Button
                      color="info"
                      onClick={() => {
                        setStartDate(null);
                        setEndDate(null);
                        setSearchText("");
                        setSearchPhone("");
                        setCurrentPage(1);
                      }}
                      size="sm"
                    >
                      <i className="ri-close-line align-bottom me-1"></i> Réinitialiser
                    </Button>
                  </div>
                </Row>
              </CardHeader>

              <Nav className="nav-tabs nav-tabs-custom nav-success" role="tablist">
                <NavItem>
                  <NavLink className={classnames({ active: activeTab === "1" })} onClick={() => setActiveTab("1")}>
                    <i className="ri-apps-line me-1 align-bottom"></i> Tous
                  </NavLink>
                </NavItem>
                <NavItem>
                  <NavLink className={classnames({ active: activeTab === "2" })} onClick={() => setActiveTab("2")}>
                    <i className="ri-shopping-bag-line me-1 align-bottom"></i> Bons Commande
                  </NavLink>
                </NavItem>
                <NavItem>
                  <NavLink className={classnames({ active: activeTab === "3" })} onClick={() => setActiveTab("3")}>
                    <i className="ri-file-list-3-line me-1 align-bottom"></i> Devis
                  </NavLink>
                </NavItem>
                <NavItem>
                  <NavLink className={classnames({ active: activeTab === "4" })} onClick={() => setActiveTab("4")}>
                    <i className="ri-file-text-line me-1 align-bottom"></i> Factures
                  </NavLink>
                </NavItem>
                <NavItem>
                  <NavLink className={classnames({ active: activeTab === "5" })} onClick={() => setActiveTab("5")}>
                    <i className="ri-truck-line me-1 align-bottom"></i> Bons Livraison
                  </NavLink>
                </NavItem>
                <NavItem>
                  <NavLink className={classnames({ active: activeTab === "6" })} onClick={() => setActiveTab("6")}>
                    <i className="ri-store-line me-1 align-bottom"></i> Ventes Comptoire
                  </NavLink>
                </NavItem>
              </Nav>

              <CardBody className="pt-3">
                <Row className="mb-3">
                  <Col md={3}>
                    <InputGroup>
                      <InputGroupText><i className="ri-search-line"></i></InputGroupText>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Numéro, client..."
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                      />
                    </InputGroup>
                  </Col>
                  <Col md={3}>
                    <InputGroup>
                      <InputGroupText><i className="ri-phone-line"></i></InputGroupText>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Téléphone..."
                        value={searchPhone}
                        onChange={(e) => setSearchPhone(formatPhoneSearch(e.target.value))}
                      />
                    </InputGroup>
                  </Col>
                  <Col md={3}>
                    <InputGroup>
                      <InputGroupText>De</InputGroupText>
                      <Flatpickr
                        className="form-control"
                        options={{ dateFormat: "d M, Y" }}
                        placeholder="Date début"
                        value={startDate ? [startDate] : []}
                        onChange={(dates) => setStartDate(dates[0])}
                      />
                    </InputGroup>
                  </Col>
                  <Col md={3}>
                    <InputGroup>
                      <InputGroupText>À</InputGroupText>
                      <Flatpickr
                        className="form-control"
                        options={{ dateFormat: "d M, Y" }}
                        placeholder="Date fin"
                        value={endDate ? [endDate] : []}
                        onChange={(dates) => setEndDate(dates[0])}
                      />
                    </InputGroup>
                  </Col>
                </Row>

                {loading ? <Loader /> : error ? <div className="text-danger">{error}</div> : (
                  <TableContainer
                    columns={columns}
                    data={filteredData}
                    isGlobalFilter={false}
                    customPageSize={pageSize}
                    divClass="table-responsive table-card mb-1 mt-0"
                    tableClass="align-middle table-nowrap"
                    theadClass="table-light text-muted text-uppercase"
                    isPagination={true}
                    totalDataCount={totalCount}
                    currentPage={currentPage - 1}
                    onPageChange={(page: number) => setCurrentPage(page + 1)}
                    onPageSizeChange={(size: number) => setPageSize(size)}
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