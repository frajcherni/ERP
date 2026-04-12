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
  fetchVendeurs,
  createVendeur,
  updateVendeur,
  deleteVendeur,
} from "../../../Components/Article/ArticleServices";

import { Vendeur } from "../../../Components/Article/Interfaces";

const VendeursList = () => {
  const [modal, setModal] = useState(false);
  const [vendeurs, setVendeurs] = useState<Vendeur[]>([]);
  const [filteredVendeurs, setFilteredVendeurs] = useState<Vendeur[]>([]);
  const [vendeur, setVendeur] = useState<Vendeur | null>(null);
  const [isEdit, setIsEdit] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("1");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [searchText, setSearchText] = useState("");

  // Fetch all data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const vendeursData = await fetchVendeurs();

      const formattedVendeurs = vendeursData.map((v: any) => ({
        ...v,
        createdAt: v.createdAt || new Date().toISOString(),
      }));

      setVendeurs(formattedVendeurs);
      setFilteredVendeurs(formattedVendeurs);
      setLoading(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Échec du chargement des vendeurs"
      );
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter vendeurs
  useEffect(() => {
    let result = [...vendeurs];

    // Filter by date range
    if (startDate && endDate) {
      const start = moment(startDate).startOf("day");
      const end = moment(endDate).endOf("day");

      result = result.filter((v) => {
        const vDate = moment(v.createdAt);
        return vDate.isBetween(start, end, null, "[]");
      });
    }

    // Filter by search text
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      result = result.filter(
        (v) =>
          v.nom?.toLowerCase().includes(searchLower) ||
          v.prenom.toLowerCase().includes(searchLower) ||
          v.telephone?.toLowerCase().includes(searchLower) ||
          v.email?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredVendeurs(result);
  }, [activeTab, startDate, endDate, searchText, vendeurs]);

  // Delete vendeur
  const handleDelete = async () => {
    if (!vendeur) return;

    try {
      await deleteVendeur(vendeur.id);
      setDeleteModal(false);
      fetchData();
      toast.success("Vendeur supprimé avec succès");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Échec de la suppression"
      );
    }
  };

  // Save or update vendeur
  const handleSubmit = async (values: any) => {
    try {
      if (isEdit && vendeur) {
        await updateVendeur(vendeur.id, values);
        toast.success("Vendeur mis à jour avec succès");
      } else {
        await createVendeur(values);
        toast.success("Vendeur ajouté avec succès");
      }
      setModal(false);
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec de l'opération");
    }
  };

  // Form validation - ONLY PRENOM IS REQUIRED
  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      nom: vendeur?.nom || "",
      prenom: vendeur?.prenom || "",
      telephone: vendeur?.telephone || "",
      email: vendeur?.email || "",
      commission: vendeur?.commission || 0,
    },
    validationSchema: Yup.object({
      nom: Yup.string(), // No longer required
      prenom: Yup.string().required("Le prénom est obligatoire"), // Only this field is required
      telephone: Yup.string(),
      email: Yup.string().email("Email invalide"), // No longer required
      commission: Yup.number().min(
        0,
        "La commission ne peut pas être négative"
      ),
    }),
    onSubmit: handleSubmit,
  });

  const columns = useMemo(
    () => [
      {
        header: "Nom",
        accessorKey: "nom",
        enableColumnFilter: false,
        cell: (cell: any) => (
          <span>
            {cell.row.original.nom} {cell.row.original.prenom}
          </span>
        ),
      },
      {
        header: "Téléphone",
        accessorKey: "telephone",
        enableColumnFilter: false,
      },
      {
        header: "Email",
        accessorKey: "email",
        enableColumnFilter: false,
      },
      {
        header: "Commission",
        accessorKey: "commission",
        enableColumnFilter: false,
        cell: (cell: any) => `${cell.getValue()}%`,
      },
      {
        header: "Total Commission",
        accessorKey: "totalCommission",
        enableColumnFilter: false,
        cell: (cell: any) => {
          const value = cell.getValue();
          return `${value ? Number(value).toFixed(2) : "0.00"} DT`;
        },
      },
      {
        header: "Date création",
        accessorKey: "createdAt",
        enableColumnFilter: false,
        cell: (cell: any) => moment(cell.getValue()).format("DD MMM YYYY"),
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
                    setVendeur(cellProps.row.original);
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
                    setVendeur(cellProps.row.original);
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
      setVendeur(null);
    } else {
      setModal(true);
    }
  }, [modal]);

  return (
    <div className="page-content">
      <DeleteModal
        show={deleteModal}
        onDeleteClick={handleDelete}
        onCloseClick={() => setDeleteModal(false)}
      />

      <Container fluid>
        <BreadCrumb title="Vendeurs" pageTitle="Gestion des vendeurs" />

        <Row>
          <Col lg={12}>
            <Card id="vendeurList">
              <CardHeader className="card-header border-0">
                <Row className="align-items-center gy-3">
                  <div className="col-sm">
                    <h5 className="card-title mb-0">Liste des Vendeurs</h5>
                  </div>
                  <div className="col-sm-auto">
                    <div className="d-flex gap-1 flex-wrap">
                      <button
                        type="button"
                        className="btn btn-secondary add-btn"
                        onClick={() => {
                          setIsEdit(false);
                          setVendeur(null);
                          toggleModal();
                        }}
                      >
                        <i className="ri-add-line align-bottom me-1"></i>{" "}
                        Nouveau Vendeur
                      </button>
                    </div>
                  </div>
                </Row>
              </CardHeader>

              <CardBody className="pt-0">
                <div>
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
                      data={filteredVendeurs}
                      isGlobalFilter={false}
                      customPageSize={10}
                      divClass="table-responsive table-card mb-1 mt-0"
                      tableClass="align-middle table-nowrap"
                      theadClass="table-light text-muted text-uppercase"
                    />
                  )}
                </div>

                <Modal isOpen={modal} toggle={toggleModal} centered size="lg">
                  <ModalHeader toggle={toggleModal}>
                    {isEdit ? "Modifier Vendeur" : "Ajouter Vendeur"}
                  </ModalHeader>
                  <Form onSubmit={validation.handleSubmit}>
                    <ModalBody>
                      <Row>
                        <Col md={6}>
                          <div className="mb-3">
                            <Label className="form-label">Nom</Label>
                            <Input
                              name="nom"
                              placeholder="Entrer le nom"
                              onChange={validation.handleChange}
                              onBlur={validation.handleBlur}
                              value={validation.values.nom}
                              invalid={
                                validation.touched.nom &&
                                !!validation.errors.nom
                              }
                            />
                            <FormFeedback>{validation.errors.nom}</FormFeedback>
                          </div>
                        </Col>
                        <Col md={6}>
                          <div className="mb-3">
                            <Label className="form-label">Prénom*</Label>
                            <Input
                              name="prenom"
                              placeholder="Entrer le prénom"
                              onChange={validation.handleChange}
                              onBlur={validation.handleBlur}
                              value={validation.values.prenom}
                              invalid={
                                validation.touched.prenom &&
                                !!validation.errors.prenom
                              }
                            />
                            <FormFeedback>
                              {validation.errors.prenom}
                            </FormFeedback>
                          </div>
                        </Col>
                      </Row>

                      <Row>
                        <Col md={6}>
                          <div className="mb-3">
                            <Label className="form-label">Téléphone</Label>
                            <Input
                              name="telephone"
                              placeholder="Entrer le téléphone"
                              onChange={validation.handleChange}
                              onBlur={validation.handleBlur}
                              value={validation.values.telephone}
                              invalid={
                                validation.touched.telephone &&
                                !!validation.errors.telephone
                              }
                            />
                            <FormFeedback>
                              {validation.errors.telephone}
                            </FormFeedback>
                          </div>
                        </Col>
                        <Col md={6}>
                          <div className="mb-3">
                            <Label className="form-label">Email</Label>
                            <Input
                              name="email"
                              type="email"
                              placeholder="Entrer l'email"
                              onChange={validation.handleChange}
                              onBlur={validation.handleBlur}
                              value={validation.values.email}
                              invalid={
                                validation.touched.email &&
                                !!validation.errors.email
                              }
                            />
                            <FormFeedback>
                              {validation.errors.email}
                            </FormFeedback>
                          </div>
                        </Col>
                      </Row>

                      <Row>
                        <Col md={6}>
                          <div className="mb-3">
                            <Label className="form-label">Commission (%)</Label>
                            <Input
                              name="commission"
                              type="number"
                              min="0"
                              max="100"
                              placeholder="Entrer le taux de commission"
                              onChange={validation.handleChange}
                              onBlur={validation.handleBlur}
                              value={validation.values.commission}
                              invalid={
                                validation.touched.commission &&
                                !!validation.errors.commission
                              }
                            />
                            <FormFeedback>
                              {validation.errors.commission}
                            </FormFeedback>
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

export default VendeursList;
