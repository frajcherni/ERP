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
  fetchPaiementsClient, createPaiementClient, updatePaiementClient, deletePaiementClient,
  fetchNextPaiementNumberFromAPI
} from "./PaiementBcClientServices";
import { fetchClients } from "../../../Components/Article/ArticleServices";
import {
    fetchBonsCommandeClient,
  } from "../../../Components/CommandeClient/CommandeClientServices";
import { Client, BonCommandeClient, PaiementClient } from "../../../Components/Article/Interfaces";

const PaiementBcClientList = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const bonCommandeIdFromUrl = queryParams.get('bonCommandeId');

  const [createEditModal, setCreateEditModal] = useState(false);
  const [paiement, setPaiement] = useState<PaiementClient | null>(null);
  const [isEdit, setIsEdit] = useState(false);
  const [paiements, setPaiements] = useState<PaiementClient[]>([]);
  const [filteredPaiements, setFilteredPaiements] = useState<PaiementClient[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [bonsCommande, setBonsCommande] = useState<BonCommandeClient[]>([]);
  const [deleteModal, setDeleteModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [searchText, setSearchText] = useState("");
  const [nextPaiementNumber, setNextPaiementNumber] = useState("PAY-C202500001");
  const [clientSearch, setClientSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [selectedBonCommandeId, setSelectedBonCommandeId] = useState<number | null>(bonCommandeIdFromUrl ? Number(bonCommandeIdFromUrl) : null);
  const [numeroCheque, setNumeroCheque] = useState("");
  const [banque, setBanque] = useState("");
  const [numeroTraite, setNumeroTraite] = useState("");
  const [dateEcheance, setDateEcheance] = useState("");
  const [notes, setNotes] = useState("");

  // EXACT SAME LOGIC AS FACTURE CLIENT - Calculate final total for bon commande
 // EXACT SAME LOGIC AS FACTURE CLIENT - Calculate final total for bon commande
const getBonCommandeFinalTotal = useCallback((bonCommande: BonCommandeClient): number => {
    // EXACT SAME LOGIC AS FACTURE CLIENT
    let grandTotal = Number(bonCommande.totalTTC) || 0;
    const hasDiscount = bonCommande.remise && Number(bonCommande.remise) > 0;
    let finalTotal = grandTotal;
    
    // Apply discount - EXACT SAME LOGIC
    if (hasDiscount) {
      if (bonCommande.remiseType === "percentage") {
        finalTotal = grandTotal * (1 - Number(bonCommande.remise) / 100);
      } else {
        finalTotal = Number(bonCommande.remise);
      }
    }
    
    // Apply retention if total > 1000
    let netAPayer = finalTotal;
    if (finalTotal > 1000) {
      const retentionAmount = Math.round(finalTotal * 0.01 * 1000) / 1000;
      netAPayer = Math.round((finalTotal - retentionAmount) * 1000) / 1000;
    }
    
    // Fix floating point precision - EXACT SAME LOGIC
    const result = Math.round(netAPayer * 1000) / 1000;
    console.log("Bon Commande Final Total Calculation:", {
      grandTotal,
      hasDiscount,
      remise: bonCommande.remise,
      remiseType: bonCommande.remiseType,
      finalTotal: finalTotal,
      netAPayer: result,
      retentionApplied: finalTotal > 1000
    });
    
    return result;
  }, []);

  useEffect(() => {
    if (clientSearch.length >= 3) {
      const filtered = clients.filter(client =>
        client.raison_sociale.toLowerCase().includes(clientSearch.toLowerCase())
      );
      setFilteredClients(filtered);
    } else {
      setFilteredClients([]);
    }
  }, [clientSearch, clients]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [paiementsData, clientsData, bonsCommandeData] = await Promise.all([
        fetchPaiementsClient(),
        fetchClients(),
        fetchBonsCommandeClient(),
      ]);

      setPaiements(paiementsData);
      setFilteredPaiements(paiementsData);
      setClients(clientsData);
      setBonsCommande(bonsCommandeData);

      if (bonCommandeIdFromUrl) {
        const bonCommande = bonsCommandeData.find(b => b.id === Number(bonCommandeIdFromUrl));
        if (bonCommande) {
          setSelectedBonCommandeId(bonCommande.id);
          const client = clientsData.find(c => c.id === bonCommande.client_id);
          if (client) {
            setSelectedClient(client);
          }
        }
      }

      const nextNumber = await fetchNextPaiementNumberFromAPI();
      setNextPaiementNumber(nextNumber);

      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec du chargement des données");
      setLoading(false);
    }
  }, [bonCommandeIdFromUrl]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    let result = [...paiements];

    if (startDate && endDate) {
      const start = moment(startDate).startOf('day');
      const end = moment(endDate).endOf('day');
      result = result.filter(paiement => {
        const paiementDate = moment(paiement.date);
        return paiementDate.isBetween(start, end, null, '[]');
      });
    }

    if (searchText) {
      const searchLower = searchText.toLowerCase();
      result = result.filter(paiement =>
        paiement.numeroPaiement.toLowerCase().includes(searchLower) ||
        (getClientName(paiement) && getClientName(paiement).toLowerCase().includes(searchLower)) ||
        (getBonCommandeNumber(paiement) && getBonCommandeNumber(paiement).toLowerCase().includes(searchLower))
      );
    }

    setFilteredPaiements(result);
  }, [startDate, endDate, searchText, paiements, clients]);

  const getClientName = (paiement: PaiementClient) => {
    if (paiement.client?.raison_sociale) {
      return paiement.client.raison_sociale;
    }
    if (paiement.bonCommandeClient?.client) {
      const client = clients.find(c => c.id === paiement.bonCommandeClient?.client?.id);
      return client ? client.raison_sociale : 'N/A';
    }
    return 'N/A';
  };

  const getBonCommandeNumber = (paiement: PaiementClient) => {
    if (paiement.bonCommandeClient?.numeroCommande) {
      return paiement.bonCommandeClient.numeroCommande;
    }
    return 'N/A';
  };

  const toggleCreateEditModal = useCallback(() => {
    if (createEditModal) {
      setCreateEditModal(false);
      setPaiement(null);
      setSelectedClient(null);
      setClientSearch("");
      setSelectedBonCommandeId(bonCommandeIdFromUrl ? Number(bonCommandeIdFromUrl) : null);
      // Reset cheque and traite fields
      setNumeroCheque("");
      setBanque("");
      setNumeroTraite("");
      setDateEcheance("");
      setNotes("");
      validation.resetForm();
    } else {
      setCreateEditModal(true);
      // Only set client values for new paiements
      if (!isEdit) {
        validation.setValues({
          montant: 0,
          modePaiement: "Espece",
          numeroPaiement: nextPaiementNumber,
          date: moment().format("YYYY-MM-DD"),
          client_id: selectedClient?.id || 0,
        });
      }
    }
  }, [createEditModal, nextPaiementNumber, selectedClient, bonCommandeIdFromUrl, isEdit]);

// EXACT SAME LOGIC AS FACTURE CLIENT - Calculate max allowed amount
const calculateMaxAllowedAmount = useCallback(() => {
    if (!isEdit || !paiement?.bonCommandeClient) return { amount: 0, bonCommandeNumber: '', finalTotal: 0 };
  
    const bonCommande = paiement.bonCommandeClient;
    
    // Use the getBonCommandeFinalTotal function which now includes retention
    const maxAmount = getBonCommandeFinalTotal(bonCommande);
  
    // Calculate total payments excluding the current paiement being edited
    const otherPayments = paiements
      .filter(p => p.bonCommandeClient_id === bonCommande.id && p.id !== paiement.id)
      .reduce((sum, p) => sum + Number(p.montant), 0);
  
    const maxAllowed = maxAmount - otherPayments;
    
    console.log("Paiement calculation for Bon Commande:", {
      maxAmount,
      otherPayments,
      maxAllowed,
      bonCommandeNumber: bonCommande.numeroCommande,
      retentionApplied: getBonCommandeFinalTotal(bonCommande) < (bonCommande.totalTTC)
    });
  
    return {
      amount: Math.max(0, maxAllowed),
      bonCommandeNumber: bonCommande.numeroCommande,
      finalTotal: maxAmount
    };
  }, [isEdit, paiement, paiements, getBonCommandeFinalTotal]);

  const handleSubmit = async (values: any) => {
    try {
      // EXACT SAME LOGIC AS FACTURE CLIENT - Get client_id
      let clientId = null;
      
      if (isEdit) {
        // For edits: Use existing client_id OR get from bon commande
        clientId = paiement?.client_id;
        if (!clientId && paiement?.bonCommandeClient?.client) {
          clientId = paiement.bonCommandeClient.client.id;
        }
      } else {
        // For creates: Use selected client OR get from selected bon commande
        if (selectedClient) {
          clientId = selectedClient.id;
        } else if (selectedBonCommandeId) {
          const selectedBonCommande = bonsCommande.find(b => b.id === selectedBonCommandeId);
          clientId = selectedBonCommande?.client_id;
        }
      }
  
      console.log("DEBUG - Determined clientId:", clientId);
  
      const paiementData: Partial<PaiementClient> = {
        montant: Number(values.montant),
        modePaiement: values.modePaiement,
        numeroPaiement: values.numeroPaiement,
        date: values.date,
        bonCommandeClient_id: isEdit ? paiement?.bonCommandeClient_id : (selectedBonCommandeId || 0),
        client_id: clientId || 0,
        notes: notes,
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
  
      console.log("DEBUG - Final paiement data:", paiementData);
  
      if (isEdit && paiement) {
        await updatePaiementClient(paiement.id, paiementData);
        toast.success("Paiement mis à jour avec succès");
      } else {
        await createPaiementClient(paiementData);
        toast.success("Paiement créé avec succès");
      }
  
      setCreateEditModal(false);
      setSelectedBonCommandeId(bonCommandeIdFromUrl ? Number(bonCommandeIdFromUrl) : null);
      // Reset cheque and traite fields after successful submission
      setNumeroCheque("");
      setBanque("");
      setNumeroTraite("");
      setDateEcheance("");
      setNotes("");
      fetchData();
    } catch (err) {
      console.error("DEBUG - Error in handleSubmit:", err);
      toast.error(err instanceof Error ? err.message : "Échec de l'opération");
    }
  };

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      montant: paiement?.montant || 0,
      modePaiement: paiement?.modePaiement || "Espece",
      numeroPaiement: paiement?.numeroPaiement || nextPaiementNumber,
      date: paiement?.date ? moment(paiement.date).format("YYYY-MM-DD") : moment().format("YYYY-MM-DD"),
      client_id: isEdit ? (paiement?.client_id || 0) : (selectedClient?.id || 0),
    },
    validationSchema: Yup.object().shape({
        montant: Yup.number()
        .min(0.01, "Le montant doit être supérieur à 0")
        .test('max-amount', function (value) {
          if (!isEdit || !paiement?.bonCommandeClient) return true;
    
          const { amount: maxAllowed, bonCommandeNumber } = calculateMaxAllowedAmount();
          const currentMontant = Number(value) || 0;
          const bonCommande = paiement.bonCommandeClient;
    
          if (currentMontant > maxAllowed) {
            return this.createError({
              message: `Le montant ne peut pas dépasser ${maxAllowed.toFixed(3)} DT (reste à payer${
                bonCommande.retentionAppliquee ? ' après retention' : ''
              })`
            });
          }
    
          return true;
        })
        .required("Le montant est requis"),
      modePaiement: Yup.string().required("Le mode de paiement est requis"),
      numeroPaiement: Yup.string().required("Le numéro de paiement est requis"),
      date: Yup.date().required("La date est requise"),
    }),
    onSubmit: handleSubmit,
  });

  const handleDelete = async () => {
    if (!paiement) return;

    try {
      await deletePaiementClient(paiement.id);
      setDeleteModal(false);
      fetchData();
      toast.success("Paiement supprimé avec succès");
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
        header: "Numéro de Paiement",
        accessorKey: "numeroPaiement",
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
        header: "Bon de Commande",
        accessorKey: "bonCommandeClient",
        enableColumnFilter: false,
        cell: (cell: any) => getBonCommandeNumber(cell.row.original),
      },
      {
        header: "Montant Total",
        accessorKey: "bonCommandeClient",
        enableColumnFilter: false,
        cell: (cell: any) => {
          const bonCommande = cell.row.original.bonCommandeClient;
          // Ensure it's a number
          const total = Number(bonCommande?.totalTTCAfterRemise) || Number(bonCommande?.totalTTC) || 0;
          return `${total.toFixed(3)} DT`;
        },
      },

      {
        header: "Net à Payer",
        accessorKey: "bonCommandeClient",
        enableColumnFilter: false,
        cell: (cell: any) => {
          const bonCommande = cell.row.original.bonCommandeClient;
          // Ensure it's a number - use netAPayer or calculate from total
          let netAPayer = Number(bonCommande?.netAPayer) || 0;
          if (!netAPayer && bonCommande) {
            const total = Number(bonCommande.totalTTCAfterRemise) || Number(bonCommande.totalTTC) || 0;
            // Apply retention calculation if needed
            netAPayer = total > 1000 ? total * 0.99 : total;
          }
          return `${netAPayer.toFixed(3)} DT`;
        },
      },
      {
        header: "Montant Payé",
        accessorKey: "montant",
        enableColumnFilter: false,
        cell: (cell: any) => {
          // Ensure it's a number
          const montant = Number(cell.getValue()) || 0;
          return `${montant.toFixed(3)} DT`;
        },
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
          const paiement = cellProps.row.original;
          return (
            <ul className="list-inline hstack gap-2 mb-0">
              <li className="list-inline-item edit">
                <Link
                  to="#"
                  className="text-primary d-inline-block edit-item-btn"
                  onClick={() => {
                    setPaiement(paiement);
                    setNumeroCheque(paiement.numeroCheque || "");
                    setBanque(paiement.banque || "");
                    setNumeroTraite(paiement.numeroTraite || "");
                    setDateEcheance(paiement.dateEcheance || "");
                    setNotes(paiement.notes || "");
                    setSelectedBonCommandeId(paiement.bonCommandeClient_id || null);
                    validation.setFieldValue("client_id", paiement.client_id || 0);
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
                    setPaiement(paiement);
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
    [clients, paiements]
  );

  return (
    <div className="page-content">
      <DeleteModal
        show={deleteModal}
        onDeleteClick={handleDelete}
        onCloseClick={() => setDeleteModal(false)}
      />

      <Container fluid>
        <BreadCrumb title="Paiements Clients" pageTitle="Paiements" />

        <Row>
          <Col lg={12}>
            <Card id="paiementList">
              <CardHeader className="card-header border-0">
                <Row className="align-items-center gy-3">
                  <div className="col-sm">
                    <h5 className="card-title mb-0">Gestion des Paiements Clients</h5>
                  </div>
                  <div className="col-sm-auto">
                    <div className="d-flex gap-1 flex-wrap">
                      <Button
                        color="secondary"
                        onClick={() => {
                          setIsEdit(false);
                          setPaiement(null);
                          setSelectedClient(null);
                          setClientSearch("");
                          setSelectedBonCommandeId(bonCommandeIdFromUrl ? Number(bonCommandeIdFromUrl) : null);
                          validation.resetForm();
                          setCreateEditModal(true);
                        }}
                      >
                        <i className="ri-add-line align-bottom me-1"></i> Ajouter Paiement
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
                    data={filteredPaiements}
                    isGlobalFilter={false}
                    customPageSize={10}
                    divClass="table-responsive table-card mb-1 mt-0"
                    tableClass="align-middle table-nowrap"
                    theadClass="table-light text-muted text-uppercase"
                  />
                )}

                <Modal isOpen={createEditModal} toggle={toggleCreateEditModal} centered size="lg">
                  <ModalHeader toggle={toggleCreateEditModal}>
                    {isEdit ? "Modifier Paiement" : "Créer Paiement"}
                  </ModalHeader>
                  <Form onSubmit={validation.handleSubmit}>
                    <ModalBody style={{ padding: '20px' }}>
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
      max={isEdit && paiement?.bonCommandeClient ? calculateMaxAllowedAmount().amount : undefined}
    />
    {validation.touched.montant && validation.errors.montant && (
      <div className="text-danger">{validation.errors.montant as string}</div>
    )}
    {isEdit && paiement?.bonCommandeClient && (
      <small className="text-muted">
        Maximum autorisé: {calculateMaxAllowedAmount().amount.toFixed(3)} DT
        (reste à payer pour le bon de commande {calculateMaxAllowedAmount().bonCommandeNumber})
        {paiement.bonCommandeClient.retentionAppliquee && (
          <span className="text-info d-block">
            <i className="ri-information-line me-1"></i>
            Retention appliquée: {paiement.bonCommandeClient.retentionMontant?.toFixed(3)} DT
          </span>
        )}
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
                                min={validation.values.date} // Can't be before paiement date
                                required={validation.values.modePaiement === "Traite"}
                              />
                            </div>
                          </Col>
                        </Row>
                      )}

                      <Row>
                        <Col md={6}>
                          <div className="mb-3">
                            <Label>Numéro de paiement*</Label>
                            <Input
                              type="text"
                              name="numeroPaiement"
                              value={validation.values.numeroPaiement}
                              onChange={validation.handleChange}
                              onBlur={validation.handleBlur}
                              invalid={validation.touched.numeroPaiement && !!validation.errors.numeroPaiement}
                            />
                            {validation.touched.numeroPaiement && validation.errors.numeroPaiement && (
                              <div className="text-danger">{validation.errors.numeroPaiement as string}</div>
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

                      <Row>
                        <Col md={12}>
                          <div className="mb-3">
                            <Label>Notes</Label>
                            <Input
                              type="textarea"
                              value={notes}
                              onChange={(e) => setNotes(e.target.value)}
                              rows="3"
                              placeholder="Notes supplémentaires..."
                            />
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

export default PaiementBcClientList;