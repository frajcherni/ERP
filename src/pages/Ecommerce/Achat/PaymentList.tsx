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
  fetchPayments, createPayment, updatePayment, deletePayment,
  fetchFactures, fetchNextPaymentNumberFromAPI
} from "../../../Components/Article/FactureServices";
import { fetchFournisseurs } from "../../../Components/Article/ArticleServices";
import { Fournisseur, FactureFournisseur, Payment } from "../../../Components/Article/Interfaces";

interface PaymentCalculation {
  amount: number;
  factureNumber: string;
  finalTotal: number;
  remainingAmount: number;
}

const PaymentList = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const factureIdFromUrl = queryParams.get('factureId');

  const [createEditModal, setCreateEditModal] = useState(false);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [isEdit, setIsEdit] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [factures, setFactures] = useState<FactureFournisseur[]>([]);
  const [deleteModal, setDeleteModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [searchText, setSearchText] = useState("");
  const [nextPaymentNumber, setNextPaymentNumber] = useState("PAY-F202500001");
  const [fournisseurSearch, setFournisseurSearch] = useState("");
  const [selectedFournisseur, setSelectedFournisseur] = useState<Fournisseur | null>(null);
  const [filteredFournisseurs, setFilteredFournisseurs] = useState<Fournisseur[]>([]);
  const [selectedFactureId, setSelectedFactureId] = useState<number | null>(factureIdFromUrl ? Number(factureIdFromUrl) : null);

  // EXACT SAME CALCULATION as in FactureList
  const getFactureFinalTotal = useCallback((facture: FactureFournisseur): number => {
    let subTotal = 0;
    let totalTax = 0;
    let grandTotal = 0;

    // Calculate from articles exactly like in FactureList
    facture.articles.forEach(item => {
      const qty = Number(item.quantite) || 1;
      const price = Number(item.prixUnitaire) || 0;
      const tvaRate = Number(item.tva ?? 0);
      const remiseRate = Number(item.remise || 0);

      const montantHTLigne = qty * price * (1 - (remiseRate / 100));
      const montantTTCLigne = montantHTLigne * (1 + (tvaRate / 100));
      const taxAmount = montantTTCLigne - montantHTLigne;

      subTotal += montantHTLigne;
      totalTax += taxAmount;
      grandTotal += montantTTCLigne;
    });

    let finalTotal = grandTotal;
    const hasDiscount = facture.remise && Number(facture.remise) > 0;
    
    // Apply discount exactly like in FactureList
    if (hasDiscount) {
      if (facture.remiseType === "percentage") {
        finalTotal = grandTotal * (1 - Number(facture.remise) / 100);
      } else {
        finalTotal = Number(facture.remise);
      }
    }
    
    // Apply timbre fiscal exactly like in FactureList
    if (facture.timbreFiscal) {
      if (hasDiscount) {
        // If there's a discount, add timbre to final total (after discount)
        finalTotal += 1;
      } else {
        // If no discount, add timbre to grand total
        grandTotal += 1;
        finalTotal = grandTotal;
      }
    }

    // Fix floating point precision
    return Math.round(finalTotal * 100) / 100;
  }, []);

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
      const [paymentsData, fournisseursData, facturesData] = await Promise.all([
        fetchPayments(),
        fetchFournisseurs(),
        fetchFactures(),
      ]);

      setPayments(paymentsData);
      setFilteredPayments(paymentsData);
      setFournisseurs(fournisseursData);
      setFactures(facturesData);

      if (factureIdFromUrl) {
        const facture = facturesData.find(f => f.id === Number(factureIdFromUrl));
        if (facture) {
          setSelectedFactureId(facture.id);
          const fournisseur = fournisseursData.find(f => f.id === facture.fournisseur_id);
          if (fournisseur) {
            setSelectedFournisseur(fournisseur);
          }
        }
      }

      const nextNumber = await fetchNextPaymentNumberFromAPI();
      setNextPaymentNumber(nextNumber);

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
    let result = [...payments];

    if (startDate && endDate) {
      const start = moment(startDate).startOf('day');
      const end = moment(endDate).endOf('day');
      result = result.filter(payment => {
        const paymentDate = moment(payment.date);
        return paymentDate.isBetween(start, end, null, '[]');
      });
    }

    if (searchText) {
      const searchLower = searchText.toLowerCase();
      result = result.filter(payment =>
        payment.numeroPaiement.toLowerCase().includes(searchLower) ||
        (getFournisseurName(payment) && getFournisseurName(payment).toLowerCase().includes(searchLower)) ||
        (getFactureNumber(payment) && getFactureNumber(payment).toLowerCase().includes(searchLower))
      );
    }

    setFilteredPayments(result);
  }, [startDate, endDate, searchText, payments, fournisseurs]);

  const getFournisseurName = (payment: Payment) => {
    if (payment.fournisseur?.raison_sociale) {
      return payment.fournisseur.raison_sociale;
    }
    if (payment.factureFournisseur?.fournisseur?.raison_sociale) {
      return payment.factureFournisseur.fournisseur.raison_sociale;
    }
    return 'N/A';
  };

  const getFactureNumber = (payment: Payment) => {
    if (payment.factureFournisseur?.numeroFacture) {
      return payment.factureFournisseur.numeroFacture;
    }
    return 'N/A';
  };

  // Calculate max allowed amount BEFORE validation to avoid circular dependency
  const calculateMaxAllowedAmount = useCallback((): PaymentCalculation => {
    if (!isEdit || !payment?.factureFournisseur) return { amount: 0, factureNumber: '', finalTotal: 0, remainingAmount: 0 };

    const facture = payment.factureFournisseur;
    
    // Use the exact same calculation as in FactureList
    const finalTotal = getFactureFinalTotal(facture);

    // Calculate total payments excluding the current payment being edited
    const otherPayments = payments
      .filter(p => p.facture_id === facture.id && p.id !== payment.id)
      .reduce((sum, p) => sum + Number(p.montant), 0);

    const maxAllowed = finalTotal - otherPayments;
    const currentMontant = payment?.montant || 0;
    
    return {
      amount: Math.max(0, maxAllowed),
      factureNumber: facture.numeroFacture || '',
      finalTotal: finalTotal,
      remainingAmount: Math.max(0, finalTotal - otherPayments - currentMontant)
    };
  }, [isEdit, payment, payments, getFactureFinalTotal]);

  const toggleCreateEditModal = useCallback(() => {
    if (createEditModal) {
      setCreateEditModal(false);
      setPayment(null);
      setSelectedFournisseur(null);
      setFournisseurSearch("");
      setSelectedFactureId(factureIdFromUrl ? Number(factureIdFromUrl) : null);
      validation.resetForm();
    } else {
      setCreateEditModal(true);
      // Only set fournisseur values for new payments
      if (!isEdit) {
        validation.setValues({
          montant: 0,
          modePaiement: "Espece",
          numeroPaiement: nextPaymentNumber,
          date: moment().format("YYYY-MM-DD"),
          fournisseur_id: selectedFournisseur?.id || 0,
        });
      }
    }
  }, [createEditModal, nextPaymentNumber, selectedFournisseur, factureIdFromUrl, isEdit]);

  const handleSubmit = async (values: any) => {
    try {
      // CRITICAL FIX: Get fournisseur_id from the facture if not directly available
      let fournisseurId = null;
      
      if (isEdit) {
        // For edits: Use existing fournisseur_id OR get from facture
        fournisseurId = payment?.fournisseur_id;
        if (!fournisseurId && payment?.factureFournisseur?.fournisseur) {
          fournisseurId = payment.factureFournisseur.fournisseur.id;
        }
      } else {
        // For creates: Use selected fournisseur OR get from selected facture
        if (selectedFournisseur) {
          fournisseurId = selectedFournisseur.id;
        } else if (selectedFactureId) {
          const selectedFacture = factures.find(f => f.id === selectedFactureId);
          fournisseurId = selectedFacture?.fournisseur_id;
        }
      }
  
      console.log("DEBUG - Determined fournisseurId:", fournisseurId);
  
      const paymentData: Partial<Payment> = {
        montant: Number(values.montant),
        modePaiement: values.modePaiement,
        numeroPaiement: values.numeroPaiement,
        date: values.date,
        facture_id: isEdit ? payment?.facture_id : (selectedFactureId || 0),
        fournisseur_id: fournisseurId || 0
      };
  
      console.log("DEBUG - Final payment data:", paymentData);
  
      if (isEdit && payment) {
        await updatePayment(payment.id, paymentData);
        toast.success("Paiement mis à jour avec succès");
      } else {
        await createPayment(paymentData);
        toast.success("Paiement créé avec succès");
      }
  
      setCreateEditModal(false);
      setSelectedFactureId(factureIdFromUrl ? Number(factureIdFromUrl) : null);
      fetchData();
    } catch (err) {
      console.error("DEBUG - Error in handleSubmit:", err);
      toast.error(err instanceof Error ? err.message : "Échec de l'opération");
    }
  };
  
  // ADD this function to automatically set fournisseur from facture
  useEffect(() => {
    if (selectedFactureId && !selectedFournisseur) {
      const selectedFacture = factures.find(f => f.id === selectedFactureId);
      if (selectedFacture?.fournisseur) {
        setSelectedFournisseur(selectedFacture.fournisseur);
        console.log("DEBUG - Auto-set fournisseur from facture:", selectedFacture.fournisseur);
      }
    }
  }, [selectedFactureId, factures, selectedFournisseur]);

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      montant: payment?.montant || 0,
      modePaiement: payment?.modePaiement || "Espece",
      numeroPaiement: payment?.numeroPaiement || nextPaymentNumber,
      date: payment?.date ? moment(payment.date).format("YYYY-MM-DD") : moment().format("YYYY-MM-DD"),
      fournisseur_id: isEdit ? (payment?.fournisseur_id || 0) : (selectedFournisseur?.id || 0),
    },
    validationSchema: Yup.object().shape({
      montant: Yup.number()
        .min(0.01, "Le montant doit être supérieur à 0")
        .test('max-amount', function (value): boolean {
          if (!isEdit || !payment?.factureFournisseur) return true;

          const { amount: maxAllowed } = calculateMaxAllowedAmount();
          const currentMontant = Number(value) || 0;

          if (currentMontant > maxAllowed) {
     
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
    if (!payment) return;

    try {
      await deletePayment(payment.id);
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
        header: "Fournisseur",
        accessorKey: "fournisseur",
        enableColumnFilter: false,
        cell: (cell: any) => getFournisseurName(cell.row.original),
      },
      {
        header: "Facture",
        accessorKey: "factureFournisseur",
        enableColumnFilter: false,
        cell: (cell: any) => getFactureNumber(cell.row.original),
      },
      {
        header: "Montant",
        accessorKey: "montant",
        enableColumnFilter: false,
        cell: (cell: any) => `${parseFloat(cell.getValue()).toFixed(2)} DT`,
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
          const payment = cellProps.row.original;
          return (
            <ul className="list-inline hstack gap-2 mb-0">
              <li className="list-inline-item edit">
              <Link
            to="#"
            className="text-primary d-inline-block edit-item-btn"
            onClick={() => {
              setPayment(payment);
              
              // AUTO-RECOVER fournisseur from facture if missing
              let fournisseurToSet = payment.fournisseur;
              if (!fournisseurToSet && payment.factureFournisseur?.fournisseur) {
                fournisseurToSet = payment.factureFournisseur.fournisseur;
              }
              
              setSelectedFournisseur(fournisseurToSet || null);
              setSelectedFactureId(payment.facture_id || null);
              setIsEdit(true);
              setCreateEditModal(true);
              
              // Set form values
              validation.setValues({
                montant: payment.montant || 0,
                modePaiement: payment.modePaiement || "Espece",
                numeroPaiement: payment.numeroPaiement || "",
                date: payment.date ? moment(payment.date).format("YYYY-MM-DD") : moment().format("YYYY-MM-DD"),
                fournisseur_id: payment.fournisseur_id || fournisseurToSet?.id || 0,
              });

              console.log("DEBUG - Edit clicked:", {
                payment,
                recoveredFournisseur: fournisseurToSet,
                factureFournisseur: payment.factureFournisseur
              });
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
                    setPayment(payment);
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
    [fournisseurs]
  );

  return (
    <div className="page-content">
      <DeleteModal
        show={deleteModal}
        onDeleteClick={handleDelete}
        onCloseClick={() => setDeleteModal(false)}
      />

      <Container fluid>
        <BreadCrumb title="Paiements Fournisseurs" pageTitle="Paiements" />

        <Row>
          <Col lg={12}>
            <Card id="paymentList">
              <CardHeader className="card-header border-0">
                <Row className="align-items-center gy-3">
                  <div className="col-sm">
                    <h5 className="card-title mb-0">Gestion des Paiements Fournisseurs</h5>
                  </div>
                  <div className="col-sm-auto">
                    <div className="d-flex gap-1 flex-wrap">
                      <Button
                        color="secondary"
                        onClick={() => {
                          setIsEdit(false);
                          setPayment(null);
                          setSelectedFournisseur(null);
                          setFournisseurSearch("");
                          setSelectedFactureId(factureIdFromUrl ? Number(factureIdFromUrl) : null);
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
                    data={filteredPayments}
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
                      {!isEdit && (
                        <Row>
                          <Col md={12}>
                            <div className="mb-3">
                              <Label>Fournisseur*</Label>
                              <Input
                                type="text"
                                placeholder="Rechercher fournisseur (min 3 caractères)"
                                value={selectedFournisseur ? selectedFournisseur.raison_sociale : fournisseurSearch}
                                onChange={(e) => {
                                  if (!e.target.value) {
                                    setSelectedFournisseur(null);
                                    validation.setFieldValue("fournisseur_id", 0);
                                  }
                                  setFournisseurSearch(e.target.value);
                                }}
                                readOnly={!!selectedFournisseur}
                              />
                              {!selectedFournisseur && fournisseurSearch.length >= 3 && (
                                <div className="search-results mt-2">
                                  {filteredFournisseurs.length > 0 ? (
                                    <ul className="list-group">
                                      {filteredFournisseurs.map(f => (
                                        <li
                                          key={f.id}
                                          className="list-group-item list-group-item-action"
                                          onClick={() => {
                                            setSelectedFournisseur(f);
                                            validation.setFieldValue("fournisseur_id", f.id);
                                          }}
                                        >
                                          {f.raison_sociale}
                                        </li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <div className="text-muted">Aucun résultat trouvé</div>
                                  )}
                                </div>
                              )}
                              {selectedFournisseur && (
                                <Button
                                  color="link"
                                  size="sm"
                                  className="mt-1 p-0"
                                  onClick={() => {
                                    setSelectedFournisseur(null);
                                    setFournisseurSearch("");
                                    validation.setFieldValue("fournisseur_id", 0);
                                  }}
                                >
                                  <i className="ri-close-line"></i> Changer de fournisseur
                                </Button>
                              )}
                              {validation.touched.fournisseur_id && validation.errors.fournisseur_id && (
                                <div className="text-danger">{validation.errors.fournisseur_id as string}</div>
                              )}
                            </div>
                          </Col>
                        </Row>
                      )}

                      {isEdit && payment?.factureFournisseur && (
                        <Row>
                          <Col md={12}>
                            <Card className="border border-warning">
                              <CardBody className="p-3">
                                <h6 className="text-warning mb-2">
                                  <i className="ri-information-line me-2"></i>
                                  Informations de paiement - Facture {payment.factureFournisseur.numeroFacture}
                                </h6>
                                <div className="row">

                                  <div className="col-6">
                                    <small className="text-muted">Total Final:</small>
                                    <p className="mb-1 fw-bold text-primary">
                                      {calculateMaxAllowedAmount().finalTotal.toFixed(2)} DT
                                    </p>
                                  </div>
                                  <div className="col-6">
                                    <small className="text-muted">Autres paiements:</small>
                                    <p className="mb-1 fw-medium">
                                      {payments
                                        .filter(p => p.facture_id === payment.facture_id && p.id !== payment.id)
                                        .reduce((sum, p) => sum + Number(p.montant), 0)
                                        .toFixed(2)} DT
                                    </p>
                                  </div>
                                  <div className="col-6">
                                    <small className="text-muted">Paiement actuel:</small>
                                    <p className="mb-1 fw-medium">{Number(validation.values.montant).toFixed(2)} DT</p>
                                  </div>
                                  <div className="col-6">
                                    <small className="text-muted">Reste à payer:</small>
                                    <p className="mb-1 fw-medium text-success">
                                      {calculateMaxAllowedAmount().remainingAmount.toFixed(2)} DT
                                    </p>
                                  </div>
                                  <div className="col-12 mt-2">
                                    <div className="alert alert-info py-2 mb-0">
                                      <small>
                                        <i className="ri-lightbulb-line me-1"></i>
                                        <strong>Limite de paiement:</strong> Vous pouvez modifier ce paiement jusqu'à {calculateMaxAllowedAmount().amount.toFixed(2)} DT maximum
                                      </small>
                                    </div>
                                  </div>
                                </div>
                              </CardBody>
                            </Card>
                          </Col>
                        </Row>
                      )}

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
                              step="0.01"
                              min="0.01"
                              max={isEdit && payment?.factureFournisseur ? calculateMaxAllowedAmount().amount : undefined}
                            />
                            {validation.touched.montant && validation.errors.montant && (
                              <div className="text-danger">{validation.errors.montant as string}</div>
                            )}
                            {isEdit && payment?.factureFournisseur && (
                              <small className="text-muted">
                                Maximum autorisé: {calculateMaxAllowedAmount().amount.toFixed(2)} DT
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
                              <option value="Autre">Autre</option>
                            </Input>
                            {validation.touched.modePaiement && validation.errors.modePaiement && (
                              <div className="text-danger">{validation.errors.modePaiement as string}</div>
                            )}
                          </div>
                        </Col>
                      </Row>

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
                    </ModalBody>
                    <ModalFooter>
                      <Button color="light" onClick={toggleCreateEditModal}>
                        <i className="ri-close-line align-bottom me-1"></i> Annuler
                      </Button>
                      <Button
                        color="primary"
                        type="submit"
                        disabled={!isEdit && !selectedFournisseur}
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

export default PaymentList;