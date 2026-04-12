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
  InputGroupText
} from "reactstrap";
import { Link } from "react-router-dom";
import classnames from "classnames";
import Flatpickr from "react-flatpickr";
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import TableContainer from "../../../Components/Common/TableContainer";
import DeleteModal from "../../../Components/Common/DeleteModal";
import Loader from "../../../Components/Common/Loader";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import * as Yup from "yup";
import { useFormik } from "formik";
import moment from "moment";

// Services
import {
  fetchClients,
  createClient,
  updateClient,
  deleteClient
} from "../../../Components/Article/ArticleServices";

import { Client } from "../../../Components/Article/Interfaces";

const ClientsList = () => {
  const [modal, setModal] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [client, setClient] = useState<Client | null>(null);
  const [isEdit, setIsEdit] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("1");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [isExportCSV, setIsExportCSV] = useState(false);
  const [searchText, setSearchText] = useState("");

  // Fetch all data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const clientsData = await fetchClients();
      
      const formattedClients = clientsData.map((c: any) => ({
        ...c,
        createdAt: c.createdAt || new Date().toISOString()
      }));
      
      setClients(formattedClients);
      setFilteredClients(formattedClients);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec du chargement des clients");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter clients
  useEffect(() => {
    let result = [...clients];
    
    // Filter by status
    if (activeTab === "2") {
      result = result.filter(c => c.status === "Actif");
    } else if (activeTab === "3") {
      result = result.filter(c => c.status === "Inactif");
    }
    
    // Filter by date range
    if (startDate && endDate) {
      const start = moment(startDate).startOf('day');
      const end = moment(endDate).endOf('day');
      
      result = result.filter(c => {
        const cDate = moment(c.createdAt);
        return cDate.isBetween(start, end, null, '[]');
      });
    }
    
    // Filter by search text
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      result = result.filter(c => 
        c.raison_sociale.toLowerCase().includes(searchLower) ||
        c.designation?.toLowerCase().includes(searchLower) ||
        c.matricule_fiscal?.toLowerCase().includes(searchLower) ||
        c.register_commerce?.toLowerCase().includes(searchLower) ||
        c.adresse?.toLowerCase().includes(searchLower) ||
        c.ville?.toLowerCase().includes(searchLower) ||
        c.telephone1?.toLowerCase().includes(searchLower) ||
        c.telephone2?.toLowerCase().includes(searchLower) ||
        c.email?.toLowerCase().includes(searchLower)
      );
    }
    
    setFilteredClients(result);
  }, [activeTab, startDate, endDate, searchText, clients]);

  // Delete client
  const handleDelete = async () => {
    if (!client) return;
    
    try {
      await deleteClient(client.id);
      setDeleteModal(false);
      fetchData();
      toast.success("Client supprimé avec succès");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec de la suppression");
    }
  };

  // Save or update client
  const handleSubmit = async (values: any) => {
    try {
      if (isEdit && client) {
        await updateClient(client.id, values);
        toast.success("Client mis à jour avec succès");
      } else {
        await createClient(values);
        toast.success("Client ajouté avec succès");
      }
      setModal(false);
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec de l'opération");
    }
  };

  // Form validation - ALL FIELDS ARE OPTIONAL
  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      raison_sociale: client?.raison_sociale || "",
      designation: client?.designation || "",
      matricule_fiscal: client?.matricule_fiscal || "",
      register_commerce: client?.register_commerce || "",
      adresse: client?.adresse || "",
      ville: client?.ville || "",
      code_postal: client?.code_postal || "",
      telephone1: client?.telephone1 || "",
      telephone2: client?.telephone2 || "",
      email: client?.email || "",
      status: client?.status || "Actif"
    },
    validationSchema: Yup.object({
      raison_sociale: Yup.string(),
      designation: Yup.string(),
      matricule_fiscal: Yup.string(),
      register_commerce: Yup.string(),
      adresse: Yup.string(),
      ville: Yup.string(),
      code_postal: Yup.string(),
      telephone1: Yup.string(),
      telephone2: Yup.string(),
      email: Yup.string().email("Email invalide"),
      status: Yup.string()
    }),
    onSubmit: handleSubmit
  });

  const columns = useMemo(
    () => [
      {
        header: "Raison Sociale",
        accessorKey: "raison_sociale",
        enableColumnFilter: false,
      },
      {
        header: "Matricule Fiscal",
        accessorKey: "matricule_fiscal",
        enableColumnFilter: false,
      },
      {
        header: "RC",
        accessorKey: "register_commerce",
        enableColumnFilter: false,
      },
      {
        header: "Ville",
        accessorKey: "ville",
        enableColumnFilter: false,
      },
      {
        header: "Téléphone",
        accessorKey: "telephone1",
        enableColumnFilter: false,
      },
      {
        header: "Email",
        accessorKey: "email",
        enableColumnFilter: false,
      },
      {
        header: "Statut",
        accessorKey: "status",
        enableColumnFilter: false,
        cell: (cell: any) => (
          <Badge 
            color={cell.getValue() === "Actif" ? "success" : "danger"}
            className="text-uppercase"
          >
            {cell.getValue()}
          </Badge>
        ),
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
                    setClient(cellProps.row.original);
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
                    setClient(cellProps.row.original);
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
      setClient(null);
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
        <BreadCrumb title="Clients" pageTitle="Gestion des clients" />
        
        <Row>
          <Col lg={12}>
            <Card id="clientList">
              <CardHeader className="card-header border-0">
                <Row className="align-items-center gy-3">
                  <div className="col-sm">
                    <h5 className="card-title mb-0">Liste des Clients</h5>
                  </div>
                  <div className="col-sm-auto">
                    <div className="d-flex gap-1 flex-wrap">
                      <button
                        type="button"
                        className="btn btn-secondary add-btn"
                        onClick={() => { 
                          setIsEdit(false); 
                          setClient(null);
                          toggleModal(); 
                        }}
                      >
                        <i className="ri-add-line align-bottom me-1"></i> Nouveau Client
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-success"
                        onClick={() => setIsExportCSV(true)}
                      >
                        <i className="ri-file-download-line align-bottom me-1"></i> Exporter
                      </button>
                    </div>
                  </div>
                </Row>
              </CardHeader>

              <CardBody className="pt-0">
                <div>
                  <Nav className="nav-tabs nav-tabs-custom nav-success" role="tablist">
                    <NavItem>
                      <NavLink
                        className={classnames({ active: activeTab === "1" })}
                        onClick={() => {
                          setActiveTab("1");
                        }}
                        href="#"
                      >
                        <i className="ri-list-check-2 me-1 align-bottom"></i> Tous
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
                        <i className="ri-checkbox-circle-line me-1 align-bottom"></i> Actifs
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
                        <i className="ri-close-circle-line me-1 align-bottom"></i> Inactifs
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
                        <i className="ri-close-line align-bottom me-1"></i> Réinitialiser
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
                      data={filteredClients}
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
                    {isEdit ? "Modifier Client" : "Ajouter Client"}
                  </ModalHeader>
                  <Form onSubmit={validation.handleSubmit}>
                    <ModalBody>
                      <Row>
                        <Col md={6}>
                          <div className="mb-3">
                            <Label className="form-label">Raison Sociale</Label>
                            <Input
                              name="raison_sociale"
                              placeholder="Entrer la raison sociale"
                              onChange={validation.handleChange}
                              onBlur={validation.handleBlur}
                              value={validation.values.raison_sociale}
                              invalid={validation.touched.raison_sociale && !!validation.errors.raison_sociale}
                            />
                            <FormFeedback>{validation.errors.raison_sociale}</FormFeedback>
                          </div>
                        </Col>
                        <Col md={6}>
                          <div className="mb-3">
                            <Label className="form-label">Désignation</Label>
                            <Input
                              name="designation"
                              placeholder="Entrer la désignation"
                              onChange={validation.handleChange}
                              onBlur={validation.handleBlur}
                              value={validation.values.designation}
                              invalid={validation.touched.designation && !!validation.errors.designation}
                            />
                            <FormFeedback>{validation.errors.designation}</FormFeedback>
                          </div>
                        </Col>
                      </Row>

                      <Row>
                        <Col md={6}>
                          <div className="mb-3">
                            <Label className="form-label">Matricule Fiscal</Label>
                            <Input
                              name="matricule_fiscal"
                              placeholder="Entrer le matricule fiscal"
                              onChange={validation.handleChange}
                              onBlur={validation.handleBlur}
                              value={validation.values.matricule_fiscal}
                              invalid={validation.touched.matricule_fiscal && !!validation.errors.matricule_fiscal}
                            />
                            <FormFeedback>{validation.errors.matricule_fiscal}</FormFeedback>
                          </div>
                        </Col>
                        <Col md={6}>
                          <div className="mb-3">
                            <Label className="form-label">Registre Commerce</Label>
                            <Input
                              name="register_commerce"
                              placeholder="Entrer le registre de commerce"
                              onChange={validation.handleChange}
                              onBlur={validation.handleBlur}
                              value={validation.values.register_commerce}
                              invalid={validation.touched.register_commerce && !!validation.errors.register_commerce}
                            />
                            <FormFeedback>{validation.errors.register_commerce}</FormFeedback>
                          </div>
                        </Col>
                      </Row>

                      <Row>
                        <Col md={6}>
                          <div className="mb-3">
                            <Label className="form-label">Adresse</Label>
                            <Input
                              name="adresse"
                              placeholder="Entrer l'adresse"
                              onChange={validation.handleChange}
                              onBlur={validation.handleBlur}
                              value={validation.values.adresse}
                              invalid={validation.touched.adresse && !!validation.errors.adresse}
                            />
                            <FormFeedback>{validation.errors.adresse}</FormFeedback>
                          </div>
                        </Col>
                        <Col md={3}>
                          <div className="mb-3">
                            <Label className="form-label">Ville</Label>
                            <Input
                              name="ville"
                              placeholder="Entrer la ville"
                              onChange={validation.handleChange}
                              onBlur={validation.handleBlur}
                              value={validation.values.ville}
                              invalid={validation.touched.ville && !!validation.errors.ville}
                            />
                            <FormFeedback>{validation.errors.ville}</FormFeedback>
                          </div>
                        </Col>
                        <Col md={3}>
                          <div className="mb-3">
                            <Label className="form-label">Code Postal</Label>
                            <Input
                              name="code_postal"
                              placeholder="Entrer le code postal"
                              onChange={validation.handleChange}
                              onBlur={validation.handleBlur}
                              value={validation.values.code_postal}
                              invalid={validation.touched.code_postal && !!validation.errors.code_postal}
                            />
                            <FormFeedback>{validation.errors.code_postal}</FormFeedback>
                          </div>
                        </Col>
                      </Row>

                      <Row>
                        <Col md={6}>
                          <div className="mb-3">
                            <Label className="form-label">Téléphone 1</Label>
                            <Input
                              name="telephone1"
                              placeholder="Entrer le téléphone principal"
                              onChange={validation.handleChange}
                              onBlur={validation.handleBlur}
                              value={validation.values.telephone1}
                              invalid={validation.touched.telephone1 && !!validation.errors.telephone1}
                            />
                            <FormFeedback>{validation.errors.telephone1}</FormFeedback>
                          </div>
                        </Col>
                        <Col md={6}>
                          <div className="mb-3">
                            <Label className="form-label">Téléphone 2</Label>
                            <Input
                              name="telephone2"
                              placeholder="Entrer le téléphone secondaire"
                              onChange={validation.handleChange}
                              onBlur={validation.handleBlur}
                              value={validation.values.telephone2}
                              invalid={validation.touched.telephone2 && !!validation.errors.telephone2}
                            />
                            <FormFeedback>{validation.errors.telephone2}</FormFeedback>
                          </div>
                        </Col>
                      </Row>

                      <Row>
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
                              invalid={validation.touched.email && !!validation.errors.email}
                            />
                            <FormFeedback>{validation.errors.email}</FormFeedback>
                          </div>
                        </Col>
                        <Col md={6}>
                          <div className="mb-3">
                            <Label className="form-label">Statut</Label>
                            <Input
                              name="status"
                              type="select"
                              onChange={validation.handleChange}
                              onBlur={validation.handleBlur}
                              value={validation.values.status}
                              invalid={validation.touched.status && !!validation.errors.status}
                            >
                              <option value="Actif">Actif</option>
                              <option value="Inactif">Inactif</option>
                            </Input>
                            <FormFeedback>{validation.errors.status}</FormFeedback>
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

export default ClientsList;