import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  Card, CardBody, Col, Container, CardHeader, Row, Modal, ModalHeader,
  Form, ModalBody, ModalFooter, Label, Input, Button
} from "reactstrap";
import { Link } from "react-router-dom";
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import TableContainer from "../../../Components/Common/TableContainer";
import DeleteModal from "../../../Components/Common/DeleteModal";
import Loader from "../../../Components/Common/Loader";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import * as Yup from "yup";
import { useFormik } from "formik";
import {
  fetchOffers, createOffer, updateOffer, deleteOffer, Offer, getImageUrl
} from "../../../Components/Article/OfferServices";
import { searchArticles } from "../../../Components/Article/ArticleServices";
import { Article } from "../../../Components/Article/Interfaces";

// Format an ISO/date string for <input type="datetime-local">
const toInputDate = (value?: string | null) => {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const WebsiteOffers = () => {
  const [modal, setModal] = useState(false);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [offer, setOffer] = useState<Offer | null>(null);
  const [isEdit, setIsEdit] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [productSearch, setProductSearch] = useState("");
  const [productResults, setProductResults] = useState<Article[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productDropdownOpen, setProductDropdownOpen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const p = await fetchOffers();
      setOffers(p);
    } catch {
      toast.error("Échec du chargement des offres");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Prefill the product search box with the current offer's product when editing
  useEffect(() => {
    const product = offer?.product as Article | undefined;
    setProductSearch(product ? `${product.designation}${product.reference ? ` (${product.reference})` : ""}` : "");
    setProductResults([]);
    setProductDropdownOpen(false);
  }, [offer]);

  // Search products only once the user has typed at least 3 characters
  useEffect(() => {
    const query = productSearch.trim();
    if (query.length < 3) {
      setProductResults([]);
      return;
    }
    setProductsLoading(true);
    const timer = setTimeout(async () => {
      try {
        const result = await searchArticles({ query, limit: 20 });
        setProductResults(result.articles || []);
      } catch {
        setProductResults([]);
      } finally {
        setProductsLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [productSearch]);

  const handleSelectProduct = (article: Article) => {
    validation.setFieldValue("product_id", article.id);
    setProductSearch(`${article.designation}${article.reference ? ` (${article.reference})` : ""}`);
    setProductResults([]);
    setProductDropdownOpen(false);
  };

  const handleDelete = async () => {
    if (!offer) return;
    try {
      await deleteOffer(offer.id);
      setDeleteModal(false);
      setOffer(null);
      fetchData();
      toast.success("Offre supprimée");
    } catch {
      toast.error("Échec de la suppression");
    }
  };

  const handleSubmit = async (values: any) => {
    if (!values.product_id) {
      toast.error("Veuillez sélectionner un produit");
      return;
    }
    // Empty means "no discount on this side" — sent as null so the API knows
    // to derive it from the other field rather than treating it as zero.
    const nullable = (v: any) =>
      v === "" || v === null || v === undefined ? null : Number(v);

    const payload = {
      title: values.title,
      description: values.description,
      status: values.status,
      date_start: values.date_start ? new Date(values.date_start).toISOString() : null,
      date_end: values.date_end ? new Date(values.date_end).toISOString() : null,
      order: Number(values.order) || 0,
      product_id: Number(values.product_id),
      discount_percent: nullable(values.discount_percent),
      promo_price: nullable(values.promo_price),
    };
    try {
      if (isEdit && offer) {
        await updateOffer(offer.id, payload);
        toast.success("Offre mise à jour");
      } else {
        await createOffer(payload);
        toast.success("Offre ajoutée");
      }
      setModal(false);
      setOffer(null);
      fetchData();
    } catch (e: any) {
      toast.error(e.message || "Échec de l'opération");
    }
  };

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      title: offer?.title || "",
      description: offer?.description || "",
      status: offer?.status || "actif",
      date_start: toInputDate(offer?.date_start),
      date_end: toInputDate(offer?.date_end),
      order: offer?.order ?? 0,
      product_id: offer?.product?.id || "",
      discount_percent: offer?.discount_percent ?? "",
      promo_price: offer?.promo_price ?? "",
    },
    validationSchema: Yup.object({
      title: Yup.string().required("Le titre est obligatoire"),
      product_id: Yup.number().required("Le produit est obligatoire"),
      discount_percent: Yup.number()
        .transform((v, o) => (o === "" ? undefined : v))
        .min(1, "Entre 1 et 99 %").max(99, "Entre 1 et 99 %"),
      promo_price: Yup.number()
        .transform((v, o) => (o === "" ? undefined : v))
        .min(0, "Le prix ne peut pas être négatif"),
    }),
    onSubmit: handleSubmit,
  });

  const columns = useMemo(() => [
    {
      header: "Image", accessorKey: "product", enableColumnFilter: false,
      cell: (cell: any) => {
        const product = cell.row.original.product;
        return (
          <img
            src={getImageUrl(product?.image)}
            alt={product?.designation || "produit"}
            className="rounded"
            style={{ width: 70, height: 70, objectFit: "cover" }}
          />
        );
      }
    },
    { header: "Titre", accessorKey: "title", enableColumnFilter: false },
    {
      header: "Produit", accessorKey: "product.designation", enableColumnFilter: false,
      cell: (cell: any) => cell.row.original.product?.designation || "—",
    },
    {
      header: "Remise", enableColumnFilter: false,
      cell: (cell: any) => {
        const p = cell.row.original;
        if (p.discount_percent == null) {
          return <span className="text-muted">Sans remise</span>;
        }
        return (
          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-danger">-{p.discount_percent}%</span>
            <span>
              <strong>{Number(p.final_price).toFixed(3)} DT</strong>
              {p.old_price != null && (
                <s className="text-muted ms-1">{Number(p.old_price).toFixed(3)} DT</s>
              )}
            </span>
          </div>
        );
      }
    },
    {
      header: "Période", enableColumnFilter: false,
      cell: (cell: any) => {
        const p = cell.row.original;
        const fmt = (d?: string | null) => d ? new Date(d).toLocaleDateString() : "—";
        return <span>{fmt(p.date_start)} → {fmt(p.date_end)}</span>;
      }
    },
    {
      header: "Statut", accessorKey: "status", enableColumnFilter: false,
      cell: (cell: any) => {
        const status = cell.getValue();
        const isActif = status === "actif";
        return (
          <span className={`badge ${isActif ? "bg-success-subtle text-success" : "bg-danger-subtle text-danger"} text-uppercase`}>
            {isActif ? "Actif" : "Inactif"}
          </span>
        );
      }
    },
    {
      header: "Action", enableColumnFilter: false,
      cell: (cp: any) => (
        <ul className="list-inline hstack gap-2 mb-0">
          <li className="list-inline-item">
            <Link to="#" className="text-primary d-inline-block"
              onClick={() => { setOffer(cp.row.original); setIsEdit(true); setModal(true); }}>
              <i className="ri-pencil-fill fs-16"></i>
            </Link>
          </li>
          <li className="list-inline-item">
            <Link to="#" className="text-danger d-inline-block"
              onClick={() => { setOffer(cp.row.original); setDeleteModal(true); }}>
              <i className="ri-delete-bin-5-fill fs-16"></i>
            </Link>
          </li>
        </ul>
      )
    }
  ], []);

  const toggleModal = useCallback(() => {
    if (modal) { setModal(false); setOffer(null); }
    else setModal(true);
  }, [modal]);

  document.title = "Offres | Site Web";

  return (
    <div className="page-content">
      <DeleteModal show={deleteModal} onDeleteClick={handleDelete}
        onCloseClick={() => setDeleteModal(false)} />

      <Container fluid>
        <BreadCrumb title="Offres" pageTitle="Site Web" />

        <Row>
          <Col lg={12}>
            <Card>
              <CardHeader className="card-header border-0">
                <Row className="align-items-center gy-3">
                  <div className="col-sm">
                    <h5 className="card-title mb-0">Gestion des Offres</h5>
                    <p className="text-muted small mb-0">
                      La bannière mise en avant en haut de la page d'accueil : un produit,
                      son accroche et son compte à rebours.
                    </p>
                  </div>
                  <div className="col-sm-auto">
                    <Button color="secondary"
                      onClick={() => { setIsEdit(false); setOffer(null); toggleModal(); }}>
                      <i className="ri-add-line align-bottom me-1"></i> Ajouter une Offre
                    </Button>
                  </div>
                </Row>
              </CardHeader>
              <CardBody className="pt-0">
                {loading ? <Loader /> : (
                  <TableContainer columns={columns} data={offers} isGlobalFilter={false}
                    customPageSize={10} divClass="table-responsive table-card mb-1 mt-0"
                    tableClass="align-middle table-nowrap"
                    theadClass="table-light text-muted text-uppercase" />
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>

        <Modal isOpen={modal} toggle={toggleModal} centered size="lg">
          <ModalHeader toggle={toggleModal}>
            {isEdit ? "Modifier l'Offre" : "Ajouter une Offre"}
          </ModalHeader>
          <Form onSubmit={(e) => { e.preventDefault(); validation.handleSubmit(); }}>
            <ModalBody style={{ maxHeight: "78vh", overflowY: "auto" }}>
              <Row>
                <Col md={8}>
                  <div className="mb-3">
                    <Label className="form-label">Titre <span className="text-danger">*</span></Label>
                    <Input name="title" placeholder="Ex: Offre de la semaine"
                      onChange={validation.handleChange} onBlur={validation.handleBlur}
                      value={validation.values.title}
                      invalid={!!(validation.touched.title && validation.errors.title)} />
                    {validation.touched.title && validation.errors.title && (
                      <div className="text-danger small">{validation.errors.title as string}</div>
                    )}
                  </div>
                </Col>
                <Col md={4}>
                  <div className="mb-3">
                    <Label className="form-label">Statut</Label>
                    <Input type="select" name="status"
                      onChange={validation.handleChange} value={validation.values.status}>
                      <option value="actif">Actif</option>
                      <option value="inactive">Inactif</option>
                    </Input>
                  </div>
                </Col>

                <Col md={12}>
                  <div className="mb-3 position-relative">
                    <Label className="form-label">Produit <span className="text-danger">*</span></Label>
                    <Input type="text" name="product_search"
                      placeholder="Tapez au moins 3 caractères pour rechercher un produit..."
                      value={productSearch}
                      onChange={(e) => {
                        setProductSearch(e.target.value);
                        setProductDropdownOpen(true);
                        validation.setFieldValue("product_id", "");
                      }}
                      onFocus={() => setProductDropdownOpen(true)}
                      onBlur={() => {
                        validation.setFieldTouched("product_id", true);
                        setTimeout(() => setProductDropdownOpen(false), 150);
                      }}
                      invalid={!!(validation.touched.product_id && validation.errors.product_id)} />
                    {productDropdownOpen && productSearch.trim().length >= 3 && (
                      <div className="border rounded shadow-sm mt-1"
                        style={{ maxHeight: 250, overflowY: "auto", position: "absolute", zIndex: 1000, background: "#fff", width: "100%" }}>
                        {productsLoading ? (
                          <div className="p-2 text-muted small">Recherche...</div>
                        ) : productResults.length > 0 ? (
                          <ul className="list-group list-group-flush mb-0">
                            {productResults.map((a) => (
                              <li key={a.id} className="list-group-item list-group-item-action"
                                style={{ cursor: "pointer" }}
                                onMouseDown={() => handleSelectProduct(a)}>
                                {a.designation} {a.reference ? `(${a.reference})` : ""}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className="p-2 text-muted small">Aucun produit trouvé</div>
                        )}
                      </div>
                    )}
                    {validation.touched.product_id && validation.errors.product_id && (
                      <div className="text-danger small">{validation.errors.product_id as string}</div>
                    )}
                    <small className="text-muted">L'image de ce produit sera affichée sur le site web.</small>
                  </div>
                </Col>

                {/* Only one of the two needs filling in — the API derives the
                    other so the website can show both the red badge and the
                    struck-through catalogue price. */}
                <Col md={12}>
                  <div className="border rounded p-3 mb-3" style={{ background: "#f8f9fa" }}>
                    <Label className="form-label fw-semibold mb-1">Remise</Label>
                    <p className="text-muted small mb-3">
                      Renseignez <strong>soit</strong> le pourcentage, <strong>soit</strong> le prix
                      promotionnel — l'autre valeur est calculée automatiquement. Laissez les deux
                      vides pour une promotion sans remise chiffrée.
                    </p>
                    <Row>
                      <Col md={6}>
                        <div className="mb-2">
                          <Label className="form-label">Pourcentage de remise (%)</Label>
                          <Input type="number" name="discount_percent" min={1} max={99}
                            placeholder="Ex: 20"
                            onChange={validation.handleChange} onBlur={validation.handleBlur}
                            value={validation.values.discount_percent}
                            invalid={!!(validation.touched.discount_percent && validation.errors.discount_percent)} />
                          {validation.touched.discount_percent && validation.errors.discount_percent && (
                            <div className="text-danger small">{validation.errors.discount_percent as string}</div>
                          )}
                          <small className="text-muted">Affiché en badge rouge sur le site.</small>
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="mb-2">
                          <Label className="form-label">Prix promotionnel (DT)</Label>
                          <Input type="number" name="promo_price" min={0} step="0.001"
                            placeholder="Ex: 159.000"
                            onChange={validation.handleChange} onBlur={validation.handleBlur}
                            value={validation.values.promo_price}
                            invalid={!!(validation.touched.promo_price && validation.errors.promo_price)} />
                          {validation.touched.promo_price && validation.errors.promo_price && (
                            <div className="text-danger small">{validation.errors.promo_price as string}</div>
                          )}
                          <small className="text-muted">Prioritaire sur le pourcentage s'il est renseigné.</small>
                        </div>
                      </Col>
                    </Row>
                  </div>
                </Col>

                <Col md={12}>
                  <div className="mb-3">
                    <Label className="form-label">Description</Label>
                    <Input type="textarea" name="description" rows={3}
                      placeholder="Description de l'offre"
                      onChange={validation.handleChange} value={validation.values.description} />
                  </div>
                </Col>

                <Col md={4}>
                  <div className="mb-3">
                    <Label className="form-label">Date de début</Label>
                    <Input type="datetime-local" name="date_start"
                      onChange={validation.handleChange} value={validation.values.date_start} />
                  </div>
                </Col>
                <Col md={4}>
                  <div className="mb-3">
                    <Label className="form-label">Date de fin</Label>
                    <Input type="datetime-local" name="date_end"
                      onChange={validation.handleChange} value={validation.values.date_end} />
                  </div>
                </Col>
                <Col md={4}>
                  <div className="mb-3">
                    <Label className="form-label">Ordre</Label>
                    <Input type="number" name="order"
                      onChange={validation.handleChange} value={validation.values.order} />
                  </div>
                </Col>
              </Row>
            </ModalBody>
            <ModalFooter>
              <Button color="light" onClick={toggleModal} type="button">Annuler</Button>
              <Button color="primary" type="submit">
                {isEdit ? "Mettre à jour" : "Ajouter"}
              </Button>
            </ModalFooter>
          </Form>
        </Modal>
      </Container>
      <ToastContainer closeButton={false} limit={1} />
    </div>
  );
};

export default WebsiteOffers;
