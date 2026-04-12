import React, { Fragment, useEffect, useState, useMemo, useCallback } from "react";
import {
  Card, CardBody, Col, Container, CardHeader, Row, Modal, ModalHeader, Form, ModalBody, ModalFooter, Label, Input, FormFeedback,
  Badge, Button, InputGroupText, InputGroup
} from "reactstrap";
import { Link, useLocation } from "react-router-dom";
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
  fetchEncaissementsClient, createEncaissementClient, updateEncaissementClient, deleteEncaissementClient,
  fetchFacturesClient, fetchNextEncaissementNumberFromAPI
} from "./FactureClientServices";
import { 
  searchClients,  // Changed from fetchClients to searchClients
  createClient  // Add this import
} from "../../../Components/Article/ArticleServices";
import { Client, FactureClient, EncaissementClient } from "../../../Components/Article/Interfaces";

const EncaissementClientList = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const factureIdFromUrl = queryParams.get('factureId');

  const [createEditModal, setCreateEditModal] = useState(false);
  const [encaissement, setEncaissement] = useState<EncaissementClient | null>(null);
  const [isEdit, setIsEdit] = useState(false);
  const [encaissements, setEncaissements] = useState<EncaissementClient[]>([]);
  const [filteredEncaissements, setFilteredEncaissements] = useState<EncaissementClient[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [factures, setFactures] = useState<FactureClient[]>([]);
  const [deleteModal, setDeleteModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [searchText, setSearchText] = useState("");
  const [nextEncaissementNumber, setNextEncaissementNumber] = useState("ENC-C202500001");
  const [clientSearch, setClientSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [selectedFactureId, setSelectedFactureId] = useState<number | null>(factureIdFromUrl ? Number(factureIdFromUrl) : null);
  const [numeroCheque, setNumeroCheque] = useState("");
  const [banque, setBanque] = useState("");
  const [numeroTraite, setNumeroTraite] = useState("");
  const [dateEcheance, setDateEcheance] = useState("");
  
  // Add new client modal state
  const [clientModal, setClientModal] = useState(false);
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

  // Format phone input
  const formatPhoneInput = (value: string): string => {
    const cleaned = value.replace(/\D/g, "");
    const limited = cleaned.slice(0, 8);
    
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

  // Format phone display
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

  // Client search effect
  useEffect(() => {
    const searchClientsDebounced = async () => {
      if (clientSearch.length >= 1) {
        try {
          const result = await searchClients({ query: clientSearch, page: 1, limit: 15 });
          setFilteredClients(result.clients || []);
        } catch (err) {
          console.error("Failed to load clients:", err);
          setFilteredClients([]);
        }
      } else {
        setFilteredClients([]);
      }
    };

    const timer = setTimeout(searchClientsDebounced, 300);
    return () => clearTimeout(timer);
  }, [clientSearch]);

  // Create new client handler
  const handleCreateClient = async () => {
    try {
      // Format phone numbers before sending
      const formattedClient = {
        ...newClient,
        telephone1: newClient.telephone1 ? newClient.telephone1.replace(/\s/g, "") : "",
        telephone2: newClient.telephone2 ? newClient.telephone2.replace(/\s/g, "") : "",
      };

      // Create the client
      const createdClient = await createClient(formattedClient);
      toast.success("Client créé avec succès");

      // Auto-select the new client
      setSelectedClient(createdClient);
      validation.setFieldValue("client_id", createdClient.id);

      // Also add to filtered clients for immediate visibility
      setFilteredClients(prev => [createdClient, ...prev]);

      // Close client modal and reset form
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
        status: "Actif",
      });

    } catch (err) {
      console.error("Error creating client:", err);
      toast.error("Erreur lors de la création du client");
    }
  };

  // Helper function to calculate final total for a facture
  const getFactureFinalTotal = useCallback((facture: FactureClient): number => {
    let grandTotal = Number(facture.totalTTC) || 0;
    const hasDiscount = facture.remise && Number(facture.remise) > 0;
    let finalTotal = grandTotal;
    
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
        finalTotal = grandTotal + 1;
      }
    }
    
    return Math.round(finalTotal * 1000) / 1000;
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [encaissementsData, facturesData] = await Promise.all([
        fetchEncaissementsClient(),
        fetchFacturesClient(),
      ]);

      setEncaissements(encaissementsData);
      setFilteredEncaissements(encaissementsData);
      setFactures(facturesData);

      if (factureIdFromUrl) {
        const facture = facturesData.find(f => f.id === Number(factureIdFromUrl));
        if (facture) {
          setSelectedFactureId(facture.id);
          // For pre-selected facture, find and set the client
          const client = encaissementsData.find(e => e.facture_id === facture.id)?.client;
          if (client) {
            setSelectedClient(client);
          }
        }
      }

      const nextNumber = await fetchNextEncaissementNumberFromAPI();
      setNextEncaissementNumber(nextNumber);

      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec du chargement des données");
      setLoading(false);
    }
  }, [factureIdFromUrl]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    let result = [...encaissements];

    if (startDate && endDate) {
      const start = moment(startDate).startOf('day');
      const end = moment(endDate).endOf('day');
      result = result.filter(encaissement => {
        const encaissementDate = moment(encaissement.date);
        return encaissementDate.isBetween(start, end, null, '[]');
      });
    }

    if (searchText) {
      const searchLower = searchText.toLowerCase();
      result = result.filter(encaissement =>
        encaissement.numeroEncaissement.toLowerCase().includes(searchLower) ||
        (getClientName(encaissement) && getClientName(encaissement).toLowerCase().includes(searchLower)) ||
        (getFactureNumber(encaissement) && getFactureNumber(encaissement).toLowerCase().includes(searchLower))
      );
    }

    setFilteredEncaissements(result);
  }, [startDate, endDate, searchText, encaissements, clients]);

  const getClientName = (encaissement: EncaissementClient) => {
    if (encaissement.client?.raison_sociale) {
      return encaissement.client.raison_sociale;
    }
    if (encaissement.factureClient?.client) {
      return encaissement.factureClient.client.raison_sociale;
    }
    return 'N/A';
  };

  const getFactureNumber = (encaissement: EncaissementClient) => {
    if (encaissement.factureClient?.numeroFacture) {
      return encaissement.factureClient.numeroFacture;
    }
    return 'N/A';
  };

  const toggleCreateEditModal = useCallback(() => {
    if (createEditModal) {
      setCreateEditModal(false);
      setEncaissement(null);
      setSelectedClient(null);
      setClientSearch("");
      setSelectedFactureId(factureIdFromUrl ? Number(factureIdFromUrl) : null);
      // Reset cheque and traite fields
      setNumeroCheque("");
      setBanque("");
      setNumeroTraite("");
      setDateEcheance("");
      validation.resetForm();
    } else {
      setCreateEditModal(true);
      // Only set client values for new encaissements
      if (!isEdit) {
        validation.setValues({
          montant: 0,
          modePaiement: "Espece",
          numeroEncaissement: nextEncaissementNumber,
          date: moment().format("YYYY-MM-DD"),
          client_id: selectedClient?.id || 0,
        });
      }
    }
  }, [createEditModal, nextEncaissementNumber, selectedClient, factureIdFromUrl, isEdit]);

  const calculateMaxAllowedAmount = useCallback(() => {
    if (!isEdit || !encaissement?.factureClient) return { amount: 0, factureNumber: '', finalTotal: 0 };

    const facture = encaissement.factureClient;
    const finalTotal = getFactureFinalTotal(facture);

    const otherPayments = encaissements
      .filter(e => e.facture_id === facture.id && e.id !== encaissement.id)
      .reduce((sum, e) => sum + Number(e.montant), 0);

    const maxAllowed = finalTotal - otherPayments;
    
    console.log("Payment calculation:", {
      finalTotal,
      otherPayments,
      maxAllowed,
      factureNumber: facture.numeroFacture
    });

    return {
      amount: Math.max(0, maxAllowed),
      factureNumber: facture.numeroFacture,
      finalTotal: finalTotal
    };
  }, [isEdit, encaissement, encaissements, getFactureFinalTotal]);

  const handleSubmit = async (values: any) => {
    try {
      // CRITICAL FIX: Get client_id from selected client
      let clientId: number | null = selectedClient?.id || null;
      
      if (isEdit && !clientId) {
        // For edits: Use existing client_id OR get from facture
        clientId = encaissement?.client_id || null; // Changed this line
        if (!clientId && encaissement?.factureClient?.client) {
          clientId = encaissement.factureClient.client.id;
        }
      }
  
      console.log("DEBUG - Determined clientId:", clientId);
  
      const encaissementData: Partial<EncaissementClient> = {
        montant: Number(values.montant),
        modePaiement: values.modePaiement,
        numeroEncaissement: values.numeroEncaissement,
        date: values.date,
        facture_id: isEdit ? encaissement?.facture_id : (selectedFactureId || 0),
        client_id: clientId || 0, // This will convert null to 0
        // Add new fields for cheque
        ...(values.modePaiement === "Cheque" && {
          numeroCheque: numeroCheque,
          banque: banque,
        }),
        // Add new fields for traite
        ...(values.modePaiement === "Traite" && {
          numeroTraite: numeroTraite,
          dateEcheance: dateEcheance,
        }),
      };
  
      console.log("DEBUG - Final encaissement data:", encaissementData);
  
      if (isEdit && encaissement) {
        await updateEncaissementClient(encaissement.id, encaissementData);
        toast.success("Encaissement mis à jour avec succès");
      } else {
        await createEncaissementClient(encaissementData);
        toast.success("Encaissement créé avec succès");
      }
  
      setCreateEditModal(false);
      setSelectedFactureId(factureIdFromUrl ? Number(factureIdFromUrl) : null);
      // Reset client and fields after successful submission
      setSelectedClient(null);
      setClientSearch("");
      setNumeroCheque("");
      setBanque("");
      setNumeroTraite("");
      setDateEcheance("");
      fetchData();
    } catch (err) {
      console.error("DEBUG - Error in handleSubmit:", err);
      toast.error(err instanceof Error ? err.message : "Échec de l'opération");
    }
  };

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      montant: encaissement?.montant || 0,
      modePaiement: encaissement?.modePaiement || "Espece",
      numeroEncaissement: encaissement?.numeroEncaissement || nextEncaissementNumber,
      date: encaissement?.date ? moment(encaissement.date).format("YYYY-MM-DD") : moment().format("YYYY-MM-DD"),
      client_id: isEdit ? (encaissement?.client_id || 0) : (selectedClient?.id || 0),
    },
    validationSchema: Yup.object().shape({
      montant: Yup.number()
        .min(0.01, "Le montant doit être supérieur à 0")
        .test('max-amount', function (value) {
          if (!isEdit || !encaissement?.factureClient) return true;

          const { amount: maxAllowed } = calculateMaxAllowedAmount();
          const currentMontant = Number(value) || 0;

          if (currentMontant > maxAllowed) {
            return this.createError({
              message: `Le montant ne peut pas dépasser ${maxAllowed.toFixed(3)} DT (reste à payer)`
            });
          }

          return true;
        })
        .required("Le montant est requis"),
      modePaiement: Yup.string().required("Le mode de paiement est requis"),
      numeroEncaissement: Yup.string().required("Le numéro d'encaissement est requis"),
      date: Yup.date().required("La date est requise"),
    }),
    onSubmit: handleSubmit,
  });

  const handleDelete = async () => {
    if (!encaissement) return;

    try {
      await deleteEncaissementClient(encaissement.id);
      setDeleteModal(false);
      fetchData();
      toast.success("Encaissement supprimé avec succès");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec de la suppression");
    }
  };

  const ModePaiementBadge = ({ mode }: { mode?: string }) => {
    const modeConfig = {
      "Espece": { bgClass: "bg-success", textClass: "text-success", icon: "ri-money-dollar-circle-line" },
      "Cheque": { bgClass: "bg-info", textClass: "text-info", icon: "ri-bank-card-line" },
      "Virement": { bgClass: "bg-primary", textClass: "text-primary", icon: "ri-exchange-funds-line" },
      "Traite": { bgClass: "bg-warning", textClass: "text-warning", icon: "ri-file-text-line" },
      "Autre": { bgClass: "bg-secondary", textClass: "text-secondary", icon: "ri-more-line" },
      "tpe": { bgClass: "bg-dark", textClass: "text-dark", icon: "ri-bank-card-2-line" },
    };

    if (!mode) return null;

    const config = modeConfig[mode as keyof typeof modeConfig] || modeConfig["Autre"];

    return (
      <span className={`badge ${config.bgClass}-subtle ${config.textClass} text-uppercase`}>
        <i className={`${config.icon} align-bottom me-1`}></i>
        {mode}
      </span>
    );
  };

  const columns = useMemo(
    () => [
      {
        header: "Numéro d'Encaissement",
        accessorKey: "numeroEncaissement",
        enableColumnFilter: false,
        cell: (cell: any) => cell.getValue(),
      },
      {
        header: "Client",
        accessorKey: "client",
        enableColumnFilter: false,
        cell: (cell: any) => getClientName(cell.row.original),
      },
      {
        header: "Facture",
        accessorKey: "factureClient",
        enableColumnFilter: false,
        cell: (cell: any) => getFactureNumber(cell.row.original),
      },
      {
        header: "Montant",
        accessorKey: "montant",
        enableColumnFilter: false,
        cell: (cell: any) => `${parseFloat(cell.getValue()).toFixed(3)} DT`,
      },
      {
        header: "Mode de Paiement",
        accessorKey: "modePaiement",
        enableColumnFilter: false,
        cell: (cell: any) => <ModePaiementBadge mode={cell.getValue()} />,
      },
      {
        header: "Date",
        accessorKey: "date",
        enableColumnFilter: false,
        cell: (cell: any) => moment(cell.getValue()).format("DD MMM YYYY"),
      },
      {
        header: "Action",
        cell: (cellProps: any) => {
          const encaissement = cellProps.row.original;
          return (
            <ul className="list-inline hstack gap-2 mb-0">
              <li className="list-inline-item edit">
                <Link
                  to="#"
                  className="text-primary d-inline-block edit-item-btn"
                  onClick={() => {
                    setEncaissement(encaissement);
                    // Set client if exists
                    if (encaissement.client) {
                      setSelectedClient(encaissement.client);
                      setClientSearch(encaissement.client.raison_sociale);
                    }
                    // Populate cheque and traite fields for edit mode
                    setNumeroCheque(encaissement.numeroCheque || "");
                    setBanque(encaissement.banque || "");
                    setNumeroTraite(encaissement.numeroTraite || "");
                    setDateEcheance(encaissement.dateEcheance || "");
                    setSelectedFactureId(encaissement.facture_id || null);
                    validation.setFieldValue("client_id", encaissement.client_id || 0);
                    setIsEdit(true);
                    setCreateEditModal(true);
                  }}
                >
                  <i className="ri-pencil-fill fs-16"></i>
                </Link>
              </li>
              <li className="list-inline-item">
                <Link
                  to="#"
                  className="text-danger d-inline-block"
                  onClick={() => {
                    setEncaissement(encaissement);
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

  return (
    <div className="page-content">
      <DeleteModal
        show={deleteModal}
        onDeleteClick={handleDelete}
        onCloseClick={() => setDeleteModal(false)}
      />

      {/* Client Creation Modal */}
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
                <Label className="form-label fw-semibold">Raison Sociale*</Label>
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
                <Label className="form-label fw-semibold">Désignation</Label>
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
                <Label className="form-label fw-semibold">Matricule Fiscal</Label>
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
                <Label className="form-label fw-semibold">Registre Commerce</Label>
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
                <Label className="form-label fw-semibold">Ville</Label>
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
                <Label className="form-label fw-semibold">Code Postal</Label>
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
                <Label className="form-label fw-semibold">Téléphone 1*</Label>
                <div className="position-relative">
                  <Input
                    value={newClient.telephone1}
                    onChange={(e) => {
                      const value = e.target.value;
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
                <Label className="form-label fw-semibold">Téléphone 2</Label>
                <div className="position-relative">
                  <Input
                    value={newClient.telephone2}
                    onChange={(e) => {
                      const value = e.target.value;
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
            disabled={!newClient.raison_sociale || !newClient.telephone1}
            className="btn-invoice-primary fs-6 px-4"
          >
            <i className="ri-user-add-line me-2"></i>
            Créer Client
          </Button>
        </ModalFooter>
      </Modal>

      <Container fluid>
        <BreadCrumb title="Encaissements Clients" pageTitle="Encaissements" />

        <Row>
          <Col lg={12}>
            <Card id="encaissementList">
              <CardHeader className="card-header border-0">
                <Row className="align-items-center gy-3">
                  <div className="col-sm">
                    <h5 className="card-title mb-0">Gestion des Encaissements Clients</h5>
                  </div>
                  <div className="col-sm-auto">
                    <div className="d-flex gap-1 flex-wrap">
                      <Button
                        color="secondary"
                        onClick={() => {
                          setIsEdit(false);
                          setEncaissement(null);
                          setSelectedClient(null);
                          setClientSearch("");
                          setSelectedFactureId(factureIdFromUrl ? Number(factureIdFromUrl) : null);
                          validation.resetForm();
                          setCreateEditModal(true);
                        }}
                      >
                        <i className="ri-add-line align-bottom me-1"></i> Ajouter Encaissement
                      </Button>
                    </div>
                  </div>
                </Row>
              </CardHeader>
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
                    data={filteredEncaissements}
                    isGlobalFilter={false}
                    customPageSize={10}
                    divClass="table-responsive table-card mb-1 mt-0"
                    tableClass="align-middle table-nowrap"
                    theadClass="table-light text-muted text-uppercase"
                  />
                )}

                <Modal isOpen={createEditModal} toggle={toggleCreateEditModal} centered size="lg">
                  <ModalHeader toggle={toggleCreateEditModal}>
                    {isEdit ? "Modifier Encaissement" : "Créer Encaissement"}
                  </ModalHeader>
                  <Form onSubmit={validation.handleSubmit}>
                    <ModalBody style={{ padding: '20px' }}>
                      {/* Client Search Section */}
                      <div className="mb-4">
                        <Label className="form-label-lg fw-semibold">
                          Client <span className="text-danger"> *</span>
                          {!selectedClient && (
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
                            placeholder="Rechercher par nom, raison sociale ou téléphone..."
                            value={
                              selectedClient
                                ? selectedClient.raison_sociale
                                : clientSearch
                            }
                            onChange={(e) => {
                              const value = e.target.value;

                              if (!value) {
                                setSelectedClient(null);
                                validation.setFieldValue(
                                  "client_id",
                                  ""
                                );
                                setClientSearch("");
                              } else {
                                // Auto-format if it looks like a phone number (mostly digits)
                                const digitCount = (
                                  value.match(/\d/g) || []
                                ).length;
                                const totalLength = value.length;

                                if (digitCount >= totalLength * 0.7) {
                                  // If 70% or more are digits
                                  const formatted =
                                    formatPhoneInput(value);
                                  setClientSearch(formatted);
                                } else {
                                  setClientSearch(value);
                                }
                              }
                            }}
                            onFocus={() => {
                              if (clientSearch.length >= 1) {
                                // Optionally load initial clients
                              }
                            }}
                            readOnly={!!selectedClient}
                            className="form-control-lg pe-10"
                          />

                          {/* Clear button when client is selected */}
                          {selectedClient && (
                            <button
                              type="button"
                              className="btn btn-link text-danger position-absolute end-0 top-50 translate-middle-y p-0 me-3"
                              onClick={() => {
                                setSelectedClient(null);
                                validation.setFieldValue(
                                  "client_id",
                                  ""
                                );
                                setClientSearch("");
                              }}
                              title="Changer de client"
                            >
                              <i className="ri-close-line fs-5"></i>
                            </button>
                          )}

                          {/* Add button when no client is selected */}
                          {!selectedClient && (
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

                        {/* Enhanced Client Dropdown Results */}
                        {!selectedClient &&
                          clientSearch.length >= 1 && (
                            <div
                              className="search-results mt-2 border rounded shadow-sm"
                              style={{
                                maxHeight: "200px",
                                overflowY: "auto",
                                position: "absolute",
                                width: "100%",
                                zIndex: 1000,
                                backgroundColor: "white",
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
                                        validation.setFieldValue(
                                          "client_id",
                                          c.id
                                        );
                                        setClientSearch("");
                                        setFilteredClients([]);
                                      }}
                                      style={{
                                        cursor: "pointer",
                                        padding: "10px 15px",
                                      }}
                                    >
                                      <div className="d-flex justify-content-between align-items-center">
                                        <span className="fw-medium">
                                          {c.raison_sociale}
                                        </span>
                                        <small className="text-muted">
                                          {formatPhoneDisplay(
                                            c.telephone1
                                          )}
                                        </small>
                                      </div>
                                      <div className="d-flex justify-content-between align-items-center mt-1">
                                        <small className="text-muted">
                                          {c.designation && (
                                            <span className="me-2">
                                              {c.designation}
                                            </span>
                                          )}
                                        </small>
                                        {c.telephone2 && (
                                          <small className="text-muted">
                                            {formatPhoneDisplay(
                                              c.telephone2
                                            )}
                                          </small>
                                        )}
                                      </div>
                                      {c.adresse && (
                                        <small className="text-muted d-block mt-1">
                                          <i className="ri-map-pin-line me-1"></i>
                                          {c.adresse}
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

                        {validation.touched.client_id &&
                          validation.errors.client_id && (
                            <div className="text-danger mt-1 fs-6">
                              <i className="ri-error-warning-line me-1"></i>
                              {validation.errors.client_id}
                            </div>
                          )}
                      </div>

                      {/* Rest of the form fields remain the same */}
                      <Row>
                        <Col md={6}>
                          <div className="mb-3">
                            <Label>Montant*</Label>
                            <Input
                              type="number"
                              name="montant"
                              value={validation.values.montant}
                              onChange={validation.handleChange}
                              onBlur={validation.handleBlur}
                              invalid={validation.touched.montant && !!validation.errors.montant}
                              step="0.001"
                              min="0.001"
                              max={isEdit && encaissement?.factureClient ? calculateMaxAllowedAmount().amount : undefined}
                            />
                            {validation.touched.montant && validation.errors.montant && (
                              <div className="text-danger">{validation.errors.montant as string}</div>
                            )}
                            {isEdit && encaissement?.factureClient && (
                              <small className="text-muted">
                                Maximum autorisé: {calculateMaxAllowedAmount().amount.toFixed(3)} DT
                                (reste à payer pour la facture {calculateMaxAllowedAmount().factureNumber})
                                {Number(validation.values.montant) > calculateMaxAllowedAmount().amount && (
                                  <span className="text-danger ms-2">
                                    <i className="ri-alert-line me-1"></i>
                                    Le montant dépasse la limite autorisée
                                  </span>
                                )}
                              </small>
                            )}
                          </div>
                        </Col>
                        <Col md={6}>
                          <div className="mb-3">
                            <Label>Mode de paiement*</Label>
                            <Input
                              type="select"
                              name="modePaiement"
                              value={validation.values.modePaiement}
                              onChange={validation.handleChange}
                              onBlur={validation.handleBlur}
                              invalid={validation.touched.modePaiement && !!validation.errors.modePaiement}
                            >
                              <option value="Espece">En espèces</option>
                              <option value="Cheque">Chèque</option>
                              <option value="Virement">Virement</option>
                              <option value="Traite">Traite</option>
                              <option value="tpe">Carte Bancaire "TPE"</option>
                              <option value="Autre">Autre</option>
                            </Input>
                            {validation.touched.modePaiement && validation.errors.modePaiement && (
                              <div className="text-danger">{validation.errors.modePaiement as string}</div>
                            )}
                          </div>
                        </Col>
                      </Row>

                      {/* Cheque Fields - Conditionally displayed */}
                      {validation.values.modePaiement === "Cheque" && (
                        <Row>
                          <Col md={6}>
                            <div className="mb-3">
                              <Label>Numéro du chèque*</Label>
                              <Input
                                type="text"
                                value={numeroCheque}
                                onChange={(e) => setNumeroCheque(e.target.value)}
                                placeholder="Saisir le numéro du chèque"
                                required={validation.values.modePaiement === "Cheque"}
                              />
                            </div>
                          </Col>
                          <Col md={6}>
                            <div className="mb-3">
                              <Label>Banque*</Label>
                              <Input
                                type="text"
                                value={banque}
                                onChange={(e) => setBanque(e.target.value)}
                                placeholder="Nom de la banque"
                                required={validation.values.modePaiement === "Cheque"}
                              />
                            </div>
                          </Col>
                        </Row>
                      )}

                      {/* Traite Fields - Conditionally displayed */}
                      {validation.values.modePaiement === "Traite" && (
                        <Row>
                          <Col md={6}>
                            <div className="mb-3">
                              <Label>Numéro de traite*</Label>
                              <Input
                                type="text"
                                value={numeroTraite}
                                onChange={(e) => setNumeroTraite(e.target.value)}
                                placeholder="Saisir le numéro de traite"
                                required={validation.values.modePaiement === "Traite"}
                              />
                            </div>
                          </Col>
                          <Col md={6}>
                            <div className="mb-3">
                              <Label>Date d'échéance*</Label>
                              <Input
                                type="date"
                                value={dateEcheance}
                                onChange={(e) => setDateEcheance(e.target.value)}
                                min={validation.values.date} // Can't be before encaissement date
                                required={validation.values.modePaiement === "Traite"}
                              />
                            </div>
                          </Col>
                        </Row>
                      )}

                      <Row>
                        <Col md={6}>
                          <div className="mb-3">
                            <Label>Numéro d'encaissement*</Label>
                            <Input
                              type="text"
                              name="numeroEncaissement"
                              value={validation.values.numeroEncaissement}
                              onChange={validation.handleChange}
                              onBlur={validation.handleBlur}
                              invalid={validation.touched.numeroEncaissement && !!validation.errors.numeroEncaissement}
                            />
                            {validation.touched.numeroEncaissement && validation.errors.numeroEncaissement && (
                              <div className="text-danger">{validation.errors.numeroEncaissement as string}</div>
                            )}
                          </div>
                        </Col>
                        <Col md={6}>
                          <div className="mb-3">
                            <Label>Date*</Label>
                            <Input
                              type="date"
                              name="date"
                              value={validation.values.date}
                              onChange={validation.handleChange}
                              onBlur={validation.handleBlur}
                              invalid={validation.touched.date && !!validation.errors.date}
                            />
                            {validation.touched.date && validation.errors.date && (
                              <div className="text-danger">{validation.errors.date as string}</div>
                            )}
                          </div>
                        </Col>
                      </Row>
                    </ModalBody>
                    <ModalFooter>
                      <Button color="light" onClick={toggleCreateEditModal}>
                        <i className="ri-close-line align-bottom me-1"></i> Annuler
                      </Button>
                      <Button
                        color="primary"
                        type="submit"
                        disabled={!isEdit && !selectedClient}
                      >
                        <i className="ri-save-line align-bottom me-1"></i> {isEdit ? "Modifier" : "Enregistrer"}
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
    </div>
  );
};

export default EncaissementClientList;