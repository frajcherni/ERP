import React, { useCallback, useEffect, useMemo, useState } from "react";
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
  InputGroup,
  InputGroupText,
  Table,
  Label,
} from "reactstrap";
import classnames from "classnames";
import moment from "moment";
import Flatpickr from "react-flatpickr";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import TableContainer from "../../../Components/Common/TableContainer";
import Loader from "../../../Components/Common/Loader";
import {
  fetchJournalSorties,
  fetchJournalSortieSummaryByDate,
  backfillJournalSortieHistorique,
  JournalSortieRow,
} from "../../../Components/Stock/JournalSortieServices";
import { fetchDepots } from "../Stock/DepotServices";

const TYPE_LABELS: Record<string, string> = {
  vente_comptoire: "Vente comptoir",
  bon_livraison: "Bon livraison",
  bon_commande_client: "Bon commande",
  facture_client: "Facture client",
  correction: "Correction",
  autre: "Autre",
};

const TYPE_COLORS: Record<string, string> = {
  vente_comptoire: "secondary",
  bon_livraison: "info",
  bon_commande_client: "primary",
  facture_client: "success",
  correction: "warning",
  autre: "dark",
};

const JournalSortieDashboard = ({ hideHeader = false }: { hideHeader?: boolean }) => {
  const [activeTab, setActiveTab] = useState<"detail" | "summary">("detail");
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(moment().startOf("month").toDate());
  const [endDate, setEndDate] = useState<Date | null>(moment().toDate());
  const [typeDocument, setTypeDocument] = useState("");
  const [depotId, setDepotId] = useState<string>("");
  const [depots, setDepots] = useState<{ id: number; nom: string }[]>([]);
  const [rows, setRows] = useState<JournalSortieRow[]>([]);
  const [summaryRows, setSummaryRows] = useState<Array<Record<string, string | number>>>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [backfillLoading, setBackfillLoading] = useState(false);

  const dateParams = useMemo(
    () => ({
      startDate: startDate ? moment(startDate).format("YYYY-MM-DD") : undefined,
      endDate: endDate ? moment(endDate).format("YYYY-MM-DD") : undefined,
    }),
    [startDate, endDate]
  );

  useEffect(() => {
    fetchDepots()
      .then((d) => setDepots(d || []))
      .catch(() => setDepots([]));
  }, []);

  const fetchDetail = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchJournalSorties({
        ...dateParams,
        typeDocument: typeDocument || undefined,
        depotId: depotId ? parseInt(depotId, 10) : undefined,
        page: currentPage,
        limit: pageSize,
      });
      setRows(result.data || []);
      setTotalCount(result.pagination?.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
      setRows([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [dateParams, typeDocument, depotId, currentPage, pageSize]);

  const fetchSummary = useCallback(async () => {
    try {
      setSummaryLoading(true);
      const result = await fetchJournalSortieSummaryByDate({
        ...dateParams,
        depotId: depotId ? parseInt(depotId, 10) : undefined,
        groupByArticle: false,
      });
      setSummaryRows(result.summary || []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur résumé");
      setSummaryRows([]);
    } finally {
      setSummaryLoading(false);
    }
  }, [dateParams, depotId]);

  useEffect(() => {
    if (activeTab === "detail") {
      fetchDetail();
    } else {
      fetchSummary();
    }
  }, [activeTab, fetchDetail, fetchSummary]);

  useEffect(() => {
    setCurrentPage(1);
  }, [startDate, endDate, typeDocument, depotId, activeTab]);

  const periodTotal = useMemo(() => {
    if (activeTab === "summary") {
      return summaryRows.reduce(
        (s, r) => s + parseInt(String(r.total_sortie || 0), 10),
        0
      );
    }
    return rows.reduce((s, r) => s + (r.quantite || 0), 0);
  }, [activeTab, summaryRows, rows]);

  const handleBackfill = async () => {
    if (
      !window.confirm(
        "Reconstruire le journal depuis l'historique des ventes (dépôt magazin) ? À utiliser une seule fois."
      )
    ) {
      return;
    }
    try {
      setBackfillLoading(true);
      const result = await backfillJournalSortieHistorique();
      toast.success(`${result.message} (${result.total} lignes)`);
      if (activeTab === "detail") fetchDetail();
      else fetchSummary();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec backfill");
    } finally {
      setBackfillLoading(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        header: "Date sortie",
        accessorKey: "date_sortie",
        enableColumnFilter: false,
        cell: (cell: any) =>
          moment(cell.getValue()).format("DD/MM/YYYY"),
      },
      {
        header: "Référence",
        accessorKey: "article",
        enableColumnFilter: false,
        cell: (cell: any) => {
          const a = cell.getValue();
          return (
            <span className="fw-medium">
              {a?.reference || a?.nom || "-"}
            </span>
          );
        },
      },
      {
        header: "Désignation",
        accessorKey: "article",
        id: "designation",
        enableColumnFilter: false,
        cell: (cell: any) => cell.row.original.article?.designation || "-",
      },
      {
        header: "Dépôt",
        accessorKey: "depot",
        enableColumnFilter: false,
        cell: (cell: any) => cell.getValue()?.nom || "-",
      },
      {
        header: "Quantité sortie",
        accessorKey: "quantite",
        enableColumnFilter: false,
        cell: (cell: any) => (
          <span className="text-danger fw-semibold">{cell.getValue()}</span>
        ),
      },
      {
        header: "Type document",
        accessorKey: "type_document",
        enableColumnFilter: false,
        cell: (cell: any) => {
          const t = cell.getValue();
          return (
            <Badge color={TYPE_COLORS[t] || "light"}>
              {TYPE_LABELS[t] || t}
            </Badge>
          );
        },
      },
      {
        header: "N° document",
        accessorKey: "numero_document",
        enableColumnFilter: false,
        cell: (cell: any) => cell.getValue() || "-",
      },
    ],
    []
  );

  return (
    <div className={hideHeader ? "mt-4" : "page-content"}>
      <Container fluid style={{ maxWidth: "100%" }}>
        <Row>
          <Col lg={12}>
            <Card id="journalSortieDashboard">
              <CardHeader className="card-header border-0">
                <Row className="align-items-center gy-2">
                  <div className="col-sm">
                    <h5 className="card-title mb-0">
                      <i className="ri-logout-box-line me-2 text-danger"></i>
                      Journal sorties articles
                    </h5>
                    <p className="text-muted mb-0 fs-13">
                      Suivi des quantités sorties du stock par date et par document
                    </p>
                  </div>
                  <div className="col-sm-auto d-flex flex-wrap gap-2">
                    <Button
                      color="soft-warning"
                      size="sm"
                      onClick={handleBackfill}
                      disabled={backfillLoading}
                    >
                      <i className="ri-history-line me-1"></i>
                      {backfillLoading ? "..." : "Backfill historique"}
                    </Button>
                    <Button
                      color="info"
                      size="sm"
                      onClick={() => {
                        setStartDate(moment().startOf("month").toDate());
                        setEndDate(moment().toDate());
                        setTypeDocument("");
                        setDepotId("");
                        setCurrentPage(1);
                      }}
                    >
                      <i className="ri-close-line me-1"></i> Réinitialiser
                    </Button>
                  </div>
                </Row>
              </CardHeader>

              <Nav className="nav-tabs nav-tabs-custom nav-danger px-3" role="tablist">
                <NavItem>
                  <NavLink
                    className={classnames({ active: activeTab === "detail" })}
                    onClick={() => setActiveTab("detail")}
                    href="#"
                  >
                    <i className="ri-list-unordered me-1"></i> Détail des sorties
                  </NavLink>
                </NavItem>
                <NavItem>
                  <NavLink
                    className={classnames({ active: activeTab === "summary" })}
                    onClick={() => setActiveTab("summary")}
                    href="#"
                  >
                    <i className="ri-bar-chart-grouped-line me-1"></i> Par date
                  </NavLink>
                </NavItem>
              </Nav>

              <CardBody className="pt-3">
                <Row className="mb-3 g-2">
                  <Col md={2}>
                    <Label className="form-label mb-1">Du</Label>
                    <Flatpickr
                      className="form-control"
                      options={{ dateFormat: "d M, Y" }}
                      value={startDate ? [startDate] : []}
                      onChange={(dates) => setStartDate(dates[0] || null)}
                    />
                  </Col>
                  <Col md={2}>
                    <Label className="form-label mb-1">Au</Label>
                    <Flatpickr
                      className="form-control"
                      options={{ dateFormat: "d M, Y" }}
                      value={endDate ? [endDate] : []}
                      onChange={(dates) => setEndDate(dates[0] || null)}
                    />
                  </Col>
                  <Col md={3}>
                    <Label className="form-label mb-1">Type document</Label>
                    <select
                      className="form-select"
                      value={typeDocument}
                      onChange={(e) => setTypeDocument(e.target.value)}
                    >
                      <option value="">Tous</option>
                      {Object.entries(TYPE_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </Col>
                  <Col md={3}>
                    <Label className="form-label mb-1">Dépôt</Label>
                    <select
                      className="form-select"
                      value={depotId}
                      onChange={(e) => setDepotId(e.target.value)}
                    >
                      <option value="">Tous</option>
                      {depots.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.nom}
                        </option>
                      ))}
                    </select>
                  </Col>
                  <Col md={2} className="d-flex align-items-end">
                    <div className="p-2 border rounded bg-light-subtle w-100 text-center">
                      <small className="text-muted d-block">Total période</small>
                      <strong className="text-danger fs-16">{periodTotal}</strong>
                      <small className="text-muted"> unités</small>
                    </div>
                  </Col>
                </Row>

                {activeTab === "detail" ? (
                  loading ? (
                    <Loader />
                  ) : error ? (
                    <div className="text-danger">{error}</div>
                  ) : (
                    <TableContainer
                      columns={columns}
                      data={rows}
                      isGlobalFilter={false}
                      customPageSize={pageSize}
                      divClass="table-responsive table-card mb-1 mt-0"
                      tableClass="align-middle table-nowrap"
                      theadClass="table-light text-muted text-uppercase"
                      isPagination={true}
                      totalDataCount={totalCount}
                      currentPage={currentPage - 1}
                      onPageChange={(page: number) => setCurrentPage(page + 1)}
                      onPageSizeChange={(size: number) => {
                        setPageSize(size);
                        setCurrentPage(1);
                      }}
                    />
                  )
                ) : summaryLoading ? (
                  <Loader />
                ) : (
                  <div className="table-responsive">
                    <Table hover className="align-middle mb-0">
                      <thead className="table-light text-muted text-uppercase">
                        <tr>
                          <th>Date</th>
                          <th className="text-end">Nb lignes</th>
                          <th className="text-end">Total sorties</th>
                        </tr>
                      </thead>
                      <tbody>
                        {summaryRows.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="text-center text-muted py-4">
                              Aucune sortie sur cette période
                            </td>
                          </tr>
                        ) : (
                          summaryRows.map((row, idx) => (
                            <tr key={idx}>
                              <td>
                                {moment(row.date_sortie).format("DD/MM/YYYY")}
                              </td>
                              <td className="text-end">{row.nb_lignes}</td>
                              <td className="text-end text-danger fw-semibold">
                                {row.total_sortie}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                      {summaryRows.length > 0 && (
                        <tfoot className="table-light">
                          <tr>
                            <th>Total</th>
                            <th />
                            <th className="text-end text-danger">{periodTotal}</th>
                          </tr>
                        </tfoot>
                      )}
                    </Table>
                  </div>
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

export default JournalSortieDashboard;
