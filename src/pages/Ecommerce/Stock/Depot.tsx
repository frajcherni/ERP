import React, { useEffect, useState, useMemo, useCallback } from "react";
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
  Alert,
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
} from "reactstrap";
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

// Services
import {
  fetchDepots,
  createDepot,
  updateDepot,
  deleteDepot,
  getDepotStock,
} from "./DepotServices";
import { Depot } from "Components/Article/Interfaces";

const DepotPage = () => {
  const [modal, setModal] = useState(false);
  const [depots, setDepots] = useState<Depot[]>([]);
  const [filteredDepots, setFilteredDepots] = useState<Depot[]>([]);
  const [depot, setDepot] = useState<Depot | null>(null);
  const [isEdit, setIsEdit] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("list"); // "list" or "stock"
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [searchText, setSearchText] = useState("");

  // New states for stock viewing
  const [selectedDepotForStock, setSelectedDepotForStock] = useState<
    number | null
  >(null);
  const [stockData, setStockData] = useState<any[]>([]);
  const [stockLoading, setStockLoading] = useState(false);
  const [stockSearch, setStockSearch] = useState("");

  // Fetch all depots
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const depotsData = await fetchDepots();
      setDepots(depotsData);
      setFilteredDepots(depotsData);
      setLoading(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Échec du chargement des dépôts"
      );
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter depots
  useEffect(() => {
    let result = [...depots];

    // Filter by date range
    if (startDate && endDate) {
      const start = moment(startDate).startOf("day");
      const end = moment(endDate).endOf("day");

      result = result.filter((d) => {
        const dDate = moment(d.created_at);
        return dDate.isBetween(start, end, null, "[]");
      });
    }

    // Filter by search text
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      result = result.filter(
        (d) =>
          d.nom.toLowerCase().includes(searchLower) ||
          d.description?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredDepots(result);
  }, [startDate, endDate, searchText, depots]);

  // Load stock for selected depot
  // In your DepotPage.tsx, update the loadDepotStock function:
  // Update your loadDepotStock function
  const loadDepotStock = useCallback(async (depotId: number) => {
    try {
      setStockLoading(true);
      const response = await getDepotStock(depotId);

      console.log("Raw stock response:", response);
      console.log("Response has items?", 'items' in response);
      console.log("Response has success?", 'success' in response);
      console.log("Response has data?", 'data' in response);

      // The response is { items: [], summary: {} }
      // No success or data properties
      if (response && response.items) {
        console.log("Found items:", response.items);
        setStockData(response.items);
      } else {
        console.log("No items found in response");
        setStockData([]);
      }
      setStockLoading(false);
    } catch (err) {
      console.error("Error loading depot stock:", err);
      toast.error("Erreur de chargement du stock");
      setStockLoading(false);
    }
  }, []);

  // When a depot is selected for stock view
  useEffect(() => {
    if (selectedDepotForStock && activeTab === "stock") {
      loadDepotStock(selectedDepotForStock);
    }
  }, [selectedDepotForStock, activeTab, loadDepotStock]);

  // Filter stock data
  const filteredStock = useMemo(() => {
    if (!stockSearch) return stockData;

    const searchLower = stockSearch.toLowerCase();
    return stockData.filter(
      (item) =>
        item.article?.reference?.toLowerCase().includes(searchLower) ||
        item.article?.designation?.toLowerCase().includes(searchLower) ||
        item.article?.code_barre?.toLowerCase().includes(searchLower)
    );
  }, [stockData, stockSearch]);

  // Calculate stock totals
  const stockTotals = useMemo(() => {
    return {
      totalArticles: filteredStock.length,
      totalQuantity: filteredStock.reduce((sum, item) => sum + item.qte, 0),
      totalValueHT: filteredStock.reduce((sum, item) => {
        const price = parseFloat(item.article?.pua_ht) || 0;
        return sum + price * item.qte;
      }, 0),
      totalValueTTC: filteredStock.reduce((sum, item) => {
        const price = parseFloat(item.article?.pua_ttc) || 0;
        return sum + price * item.qte;
      }, 0),
    };
  }, [filteredStock]);

  // Delete depot
  const handleDelete = async () => {
    if (!depot) return;

    try {
      await deleteDepot(depot.id);
      setDeleteModal(false);
      fetchData();
      toast.success("Dépôt supprimé avec succès");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Échec de la suppression"
      );
    }
  };

  // Save or update depot
  const handleSubmit = async (values: any) => {
    try {
      if (isEdit && depot) {
        await updateDepot(depot.id, values);
        toast.success("Dépôt mis à jour avec succès");
      } else {
        await createDepot(values);
        toast.success("Dépôt ajouté avec succès");
      }
      setModal(false);
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec de l'opération");
    }
  };

  // Form validation
  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      nom: depot?.nom || "",
      description: depot?.description || "",
    },
    validationSchema: Yup.object({
      nom: Yup.string()
        .required("Le nom du dépôt est obligatoire")
        .min(2, "Le nom doit contenir au moins 2 caractères"),
      description: Yup.string().max(
        500,
        "La description ne doit pas dépasser 500 caractères"
      ),
    }),
    onSubmit: handleSubmit,
  });

  // Columns for depot list table
  const depotColumns = useMemo(
    () => [
      {
        header: "Nom du Dépôt",
        accessorKey: "nom",
        enableColumnFilter: false,
        cell: (cell: any) => (
          <div>
            <strong>{cell.getValue()}</strong>
            {cell.row.original.description && (
              <div className="text-muted small mt-1">
                {cell.row.original.description}
              </div>
            )}
          </div>
        ),
      },
      {
        header: "Voir Stock",
        enableColumnFilter: false,
        cell: (cell: any) => (
          <Button
            color="info"
            size="sm"
            onClick={() => {
              setSelectedDepotForStock(cell.row.original.id);
              setActiveTab("stock");
            }}
          >
            <i className="ri-eye-line me-1"></i> Voir Stock
          </Button>
        ),
      },
      {
        header: "Date création",
        accessorKey: "created_at",
        enableColumnFilter: false,
        cell: (cell: any) => (
          <div>
            <span className="text-muted">
              {moment(cell.getValue()).format("DD MMM YYYY")}
            </span>
            <div className="text-muted small">
              {moment(cell.getValue()).format("HH:mm")}
            </div>
          </div>
        ),
      },
      {
        header: "Dernière modification",
        accessorKey: "updated_at",
        enableColumnFilter: false,
        cell: (cell: any) => (
          <div>
            <span className="text-muted">
              {moment(cell.getValue()).format("DD MMM YYYY")}
            </span>
            <div className="text-muted small">
              {moment(cell.getValue()).format("HH:mm")}
            </div>
          </div>
        ),
      },
      {
        header: "Action",
        cell: (cellProps: any) => {
          return (
            <div className="d-flex gap-2">
              <Button
                color="primary"
                size="sm"
                onClick={() => {
                  setDepot(cellProps.row.original);
                  setIsEdit(true);
                  setModal(true);
                }}
              >
                <i className="ri-pencil-line"></i>
              </Button>
              <Button
                color="danger"
                size="sm"
                onClick={() => {
                  setDepot(cellProps.row.original);
                  setDeleteModal(true);
                }}
              >
                <i className="ri-delete-bin-line"></i>
              </Button>
            </div>
          );
        },
      },
    ],
    []
  );

  // Columns for stock table
  const stockColumns = useMemo(
    () => [
      {
        header: "Article",
        accessorKey: "article.designation",
        enableColumnFilter: false,
        cell: (cell: any) => (
          <div>
            <strong>{cell.getValue() || "N/A"}</strong>
            {cell.row.original.article?.type === "Consigné" && (
              <Badge color="info" className="ms-2">
                Consigné
              </Badge>
            )}
          </div>
        ),
      },
      {
        header: "Référence",
        accessorKey: "article.reference",
        enableColumnFilter: false,
        cell: (cell: any) => (
          <Badge color="light" className="text-dark">
            {cell.getValue() || "N/A"}
          </Badge>
        ),
      },
      {
        header: "Code Barre",
        accessorKey: "article.code_barre",
        enableColumnFilter: false,
        cell: (cell: any) => cell.getValue() || "-",
      },
      {
        header: "Quantité",
        accessorKey: "qte",
        enableColumnFilter: false,
        cell: (cell: any) => (
          <Badge
            color={cell.getValue() > 0 ? "success" : "danger"}
            className="fs-6"
          >
            {cell.getValue()}
          </Badge>
        ),
      },
      {
        header: "Prix U TTC",
        accessorKey: "article.pua_ttc",
        enableColumnFilter: false,
        cell: (cell: any) => {
          const price = parseFloat(cell.getValue()) || 0;
          return `${price.toFixed(3)} TND`;
        },
      },
      {
        header: "Valeur TTC",
        enableColumnFilter: false,
        cell: (cell: any) => {
          const price = parseFloat(cell.row.original.article?.pua_ttc) || 0;
          const qte = cell.row.original.qte || 0;
          const value = price * qte;
          return (
            <div className="fw-bold text-success">{value.toFixed(3)} TND</div>
          );
        },
      },
    ],
    []
  );

  const toggleModal = useCallback(() => {
    if (modal) {
      setModal(false);
      setDepot(null);
    } else {
      setModal(true);
    }
  }, [modal]);

  // Render stock view
  const renderStockView = () => {
    const selectedDepot = depots.find((d) => d.id === selectedDepotForStock);

    return (
      <Card>
        <CardHeader>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h5 className="card-title mb-0">
                Stock du Dépôt: {selectedDepot?.nom || "N/A"}
              </h5>
              {selectedDepot?.description && (
                <p className="text-muted mb-0">{selectedDepot.description}</p>
              )}
            </div>
            <div className="d-flex gap-2">
              <Button color="light" onClick={() => setActiveTab("list")}>
                <i className="ri-arrow-left-line me-1"></i> Retour
              </Button>
              <Button
                color="info"
                onClick={() =>
                  selectedDepotForStock && loadDepotStock(selectedDepotForStock)
                }
              >
                <i className="ri-refresh-line me-1"></i> Actualiser
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardBody>
          {/* Stock Summary */}
          <Row className="mb-4">
            <Col md={3}>
              <Card className="border-dashed border-primary">
                <CardBody className="p-3">
                  <div className="text-center">
                    <h6 className="text-muted mb-1">Articles en Stock</h6>
                    <h3 className="fw-bold text-primary mb-0">
                      {stockTotals.totalArticles}
                    </h3>
                  </div>
                </CardBody>
              </Card>
            </Col>

            <Col md={3}>
              <Card className="border-dashed border-success">
                <CardBody className="p-3">
                  <div className="text-center">
                    <h6 className="text-muted mb-1">Quantité Totale</h6>
                    <h3 className="fw-bold text-success mb-0">
                      {stockTotals.totalQuantity}
                    </h3>
                  </div>
                </CardBody>
              </Card>
            </Col>

            <Col md={3}>
              <Card className="border-dashed border-warning">
                <CardBody className="p-3">
                  <div className="text-center">
                    <h6 className="text-muted mb-1">Total HT (Stock)</h6>
                    <h3 className="fw-bold text-warning mb-0">
                      {stockTotals.totalValueHT.toFixed(3)} TND
                    </h3>
                  </div>
                </CardBody>
              </Card>
            </Col>

            <Col md={3}>
              <Card className="border-dashed border-info">
                <CardBody className="p-3">
                  <div className="text-center">
                    <h6 className="text-muted mb-1">Total TTC (Stock)</h6>
                    <h3 className="fw-bold text-info mb-0">
                      {stockTotals.totalValueTTC.toFixed(3)} TND
                    </h3>
                  </div>
                </CardBody>
              </Card>
            </Col>
          </Row>

          {/* Search */}
          <Row className="mb-3">
            <Col md={6}>
              <div className="search-box">
                <Input
                  type="text"
                  className="form-control"
                  placeholder="Rechercher article..."
                  value={stockSearch}
                  onChange={(e) => setStockSearch(e.target.value)}
                />
                <i className="ri-search-line search-icon"></i>
              </div>
            </Col>
          </Row>

          {/* Stock Table */}
          {stockLoading ? (
            <Loader />
          ) : filteredStock.length === 0 ? (
            <Alert color="info" className="text-center py-4">
              <i className="ri-inbox-line fs-1 mb-3"></i>
              <h5>Aucun stock trouvé</h5>
              <p>Ce dépôt ne contient pas d'articles en stock</p>
            </Alert>
          ) : (
            <div className="table-responsive">
              <Table hover className="align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Article</th>
                    <th>Référence</th>
                    <th>Code Barre</th>
                    <th className="text-center">Quantité</th>
                    <th className="text-center">PU Achat HT</th>
                    <th className="text-center">PU Achat TTC</th>
                    <th className="text-center">Total HT</th>
                    <th className="text-center">Total TTC</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStock.map((item, index) => {
                    const article = item.article;
                    const priceHT = parseFloat(article?.pua_ht) || 0;
                    const priceTTC = parseFloat(article?.pua_ttc) || 0;
                    const valueHT = priceHT * item.qte;
                    const valueTTC = priceTTC * item.qte;

                    return (
                      <tr key={`${item.article_id}-${item.depot_id}-${index}`}>
                        <td>
                          <div className="fw-medium">
                            {article?.designation || "N/A"}
                          </div>
                          {article?.type === "Consigné" && (
                            <Badge color="info" className="ms-2">
                              Consigné
                            </Badge>
                          )}
                        </td>
                        <td>
                          <Badge color="light" className="text-dark">
                            {article?.reference || "N/A"}
                          </Badge>
                        </td>
                        <td>{article?.code_barre || "-"}</td>
                        <td className="text-center">
                          <Badge
                            color={item.qte > 0 ? "success" : "danger"}
                            className="fs-6"
                          >
                            {item.qte}
                          </Badge>
                        </td>
                        <td className="text-center">{priceHT.toFixed(3)} TND</td>
                        <td className="text-center">{priceTTC.toFixed(3)} TND</td>
                        <td className="text-center">
                          <div className="fw-medium text-warning">
                            {valueHT.toFixed(3)} TND
                          </div>
                        </td>
                        <td className="text-center">
                          <div className="fw-bold text-success">
                            {valueTTC.toFixed(3)} TND
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="table-light">
                  <tr>
                    <td colSpan={3} className="text-end fw-bold">
                      Totaux:
                    </td>
                    <td className="text-center fw-bold text-primary">
                      {stockTotals.totalQuantity}
                    </td>
                    <td className="text-center fw-bold">-</td>
                    <td className="text-center fw-bold">-</td>
                    <td className="text-center fw-bold text-warning">
                      {stockTotals.totalValueHT.toFixed(3)} TND
                    </td>
                    <td className="text-center fw-bold text-success">
                      {stockTotals.totalValueTTC.toFixed(3)} TND
                    </td>
                  </tr>
                </tfoot>
              </Table>
            </div>
          )}
        </CardBody>
      </Card>
    );
  };

  // Render depot list view
  const renderDepotListView = () => (
    <Card>
      <CardHeader>
        <div className="d-flex justify-content-between align-items-center">
          <h5 className="card-title mb-0">Liste des Dépôts</h5>
          <Button color="primary" onClick={toggleModal}>
            <i className="ri-add-line align-bottom me-1"></i> Nouveau Dépôt
          </Button>
        </div>
      </CardHeader>

      <CardBody>
        {/* Filters */}
        <Row className="mb-3">
          <Col md={4}>
            <div className="search-box">
              <Input
                type="text"
                className="form-control"
                placeholder="Rechercher par nom ou description..."
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

        {/* Depot Table */}
        {loading ? (
          <Loader />
        ) : error ? (
          <Alert color="danger">{error}</Alert>
        ) : filteredDepots.length === 0 ? (
          <div className="text-center py-5">
            <i className="ri-store-2-line display-1 text-muted mb-3"></i>
            <h5 className="text-muted">Aucun dépôt trouvé</h5>
            <p className="text-muted">
              Commencez par créer votre premier dépôt
            </p>
          </div>
        ) : (
          <TableContainer
            columns={depotColumns}
            data={filteredDepots}
            isGlobalFilter={false}
            customPageSize={10}
            divClass="table-responsive table-card mb-1 mt-0"
            tableClass="align-middle table-nowrap"
            theadClass="table-light text-muted text-uppercase"
          />
        )}
      </CardBody>
    </Card>
  );

  return (
    <div className="page-content">
      <DeleteModal
        show={deleteModal}
        onDeleteClick={handleDelete}
        onCloseClick={() => setDeleteModal(false)}
      />

      <Container fluid>
        <BreadCrumb
          title={
            activeTab === "stock" ? "Stock du Dépôt" : "Gestion des Dépôts"
          }
          pageTitle="Stock"
        />

        {/* Navigation Tabs */}
        <Card className="mb-3">
          <CardBody className="p-0">
            <Nav tabs className="nav-tabs-custom">
              <NavItem>
                <NavLink
                  className={classnames({ active: activeTab === "list" })}
                  onClick={() => setActiveTab("list")}
                >
                  <i className="ri-list-check-2 me-1 align-bottom"></i> Liste
                  des Dépôts
                </NavLink>
              </NavItem>
              {activeTab === "stock" && (
                <NavItem>
                  <NavLink
                    className={classnames({ active: activeTab === "stock" })}
                  >
                    <i className="ri-archive-line me-1 align-bottom"></i> Stock
                    du Dépôt
                  </NavLink>
                </NavItem>
              )}
            </Nav>
          </CardBody>
        </Card>

        <Row>
          <Col lg={12}>
            {activeTab === "list" ? renderDepotListView() : renderStockView()}
          </Col>
        </Row>
      </Container>

      {/* Add/Edit Modal */}
      <Modal isOpen={modal} toggle={toggleModal} centered size="lg">
        <ModalHeader toggle={toggleModal}>
          {isEdit ? "Modifier Dépôt" : "Ajouter Dépôt"}
        </ModalHeader>
        <Form onSubmit={validation.handleSubmit}>
          <ModalBody>
            <Row>
              <Col md={12}>
                <div className="mb-3">
                  <Label className="form-label">Nom du Dépôt *</Label>
                  <Input
                    name="nom"
                    placeholder="Ex: Magasin Principal, Dépôt Central..."
                    onChange={validation.handleChange}
                    onBlur={validation.handleBlur}
                    value={validation.values.nom}
                    invalid={validation.touched.nom && !!validation.errors.nom}
                  />
                  <FormFeedback>{validation.errors.nom}</FormFeedback>
                  <div className="form-text">
                    Le nom doit être unique et descriptif
                  </div>
                </div>
              </Col>
            </Row>

            <Row>
              <Col md={12}>
                <div className="mb-3">
                  <Label className="form-label">Description</Label>
                  <Input
                    name="description"
                    type="textarea"
                    placeholder="Description du dépôt (emplacement, taille, spécificités...)"
                    onChange={validation.handleChange}
                    onBlur={validation.handleBlur}
                    value={validation.values.description}
                    invalid={
                      validation.touched.description &&
                      !!validation.errors.description
                    }
                    rows={3}
                  />
                  <FormFeedback>{validation.errors.description}</FormFeedback>
                </div>
              </Col>
            </Row>
          </ModalBody>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-light"
              onClick={toggleModal}
            >
              Annuler
            </button>
            <button type="submit" className="btn btn-primary">
              {isEdit ? "Mettre à jour" : "Créer"}
            </button>
          </div>
        </Form>
      </Modal>
      <ToastContainer closeButton={false} limit={1} />
    </div>
  );
};

export default DepotPage;  