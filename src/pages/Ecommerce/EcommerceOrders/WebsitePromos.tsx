import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  Card, CardBody, Col, Container, CardHeader, Row, Modal, ModalHeader,
  Form, ModalBody, ModalFooter, Label, Input, Button, Table
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
  fetchPromos, createPromo, updatePromo, deletePromo,
  Promo, PromoItem, getImageUrl
} from "../../../Components/Article/PromoServices";
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

/** One editable line in the modal: an article plus the discount on it. */
interface DraftItem {
  article: Article;
  discount_percent: string;
  promo_price: string;
}

const priceOf = (a: Article) => Number((a as any).puv_ttc) || 0;

/**
 * Live preview of what the shop will show for a line, using the same rule the
 * API applies: an explicit price wins and the badge is derived from it.
 */
const previewDiscount = (item: DraftItem) => {
  const base = priceOf(item.article);
  const price = item.promo_price === "" ? null : Number(item.promo_price);
  const percent = item.discount_percent === "" ? null : Number(item.discount_percent);
  if (!base) return null;
  if (price !== null && price > 0 && price < base) {
    const derived = Math.round(((base - price) / base) * 100);
    return derived < 1 ? null : { percent: derived, final: price, old: base };
  }
  if (percent !== null && percent > 0 && percent < 100) {
    return { percent, final: Number((base * (1 - percent / 100)).toFixed(3)), old: base };
  }
  return null;
};

/**
 * "Gestion Promotions" — campaigns of discounted articles.
 *
 * One promotion holds any number of articles, each with its own discount, and
 * every article across the active promotions is what the shop's "bonnes
 * affaires du moment" band renders.
 */
const WebsitePromos = () => {
  const [modal, setModal] = useState(false);
  const [promos, setPromos] = useState<Promo[]>([]);
  const [promo, setPromo] = useState<Promo | null>(null);
  const [isEdit, setIsEdit] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const [items, setItems] = useState<DraftItem[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [productResults, setProductResults] = useState<Article[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productDropdownOpen, setProductDropdownOpen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setPromos(await fetchPromos());
    } catch {
      toast.error("Échec du chargement des promotions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Load the promo's existing lines into the editable draft when it opens.
  useEffect(() => {
    setItems(
      (promo?.items || [])
        .filter((it: PromoItem) => it.article)
        .map((it: PromoItem) => ({
          article: it.article as Article,
          discount_percent: it.discount_percent == null ? "" : String(it.discount_percent),
          promo_price: it.promo_price == null ? "" : String(it.promo_price),
        }))
    );
    setProductSearch("");
    setProductResults([]);
    setProductDropdownOpen(false);
  }, [promo]);

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

  const addArticle = (article: Article) => {
    if (items.some((it) => it.article.id === article.id)) {
      toast.info("Cet article est déjà dans la promotion");
    } else {
      setItems((prev) => [...prev, { article, discount_percent: "", promo_price: "" }]);
    }
    setProductSearch("");
    setProductResults([]);
    setProductDropdownOpen(false);
  };

  const patchItem = (index: number, patch: Partial<DraftItem>) =>
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));

  const removeItem = (index: number) =>
    setItems((prev) => prev.filter((_, i) => i !== index));

  const handleDelete = async () => {
    if (!promo) return;
    try {
      await deletePromo(promo.id);
      setDeleteModal(false);
      setPromo(null);
      fetchData();
      toast.success("Promotion supprimée");
    } catch {
      toast.error("Échec de la suppression");
    }
  };

  const handleSubmit = async (values: any) => {
    if (items.length === 0) {
      toast.error("Ajoutez au moins un article à la promotion");
      return;
    }
    const nullable = (v: string) => (v === "" ? null : Number(v));
    const payload = {
      title: values.title,
      status: values.status,
      date_start: values.date_start ? new Date(values.date_start).toISOString() : null,
      date_end: values.date_end ? new Date(values.date_end).toISOString() : null,
      order: Number(values.order) || 0,
      items: items.map((it, index) => ({
        article_id: it.article.id,
        discount_percent: nullable(it.discount_percent),
        promo_price: nullable(it.promo_price),
        order: index,
      })),
    };
    try {
      if (isEdit && promo) {
        await updatePromo(promo.id, payload);
        toast.success("Promotion mise à jour");
      } else {
        await createPromo(payload);
        toast.success("Promotion ajoutée");
      }
      setModal(false);
      setPromo(null);
      fetchData();
    } catch (e: any) {
      toast.error(e.message || "Échec de l'opération");
    }
  };

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      title: promo?.title || "",
      status: promo?.status || "actif",
      date_start: toInputDate(promo?.date_start),
      date_end: toInputDate(promo?.date_end),
      order: promo?.order ?? 0,
    },
    validationSchema: Yup.object({
      title: Yup.string().required("Le titre est obligatoire"),
    }),
    onSubmit: handleSubmit,
  });

  const columns = useMemo(() => [
    {
      header: "Articles", accessorKey: "items", enableColumnFilter: false,
      cell: (cell: any) => {
        const list: PromoItem[] = cell.row.original.items || [];
        return (
          <div className="d-flex align-items-center">
            {list.slice(0, 4).map((it, i) => (
              <img
                key={it.id ?? i}
                src={getImageUrl(it.article?.image)}
                alt={it.article?.designation || "article"}
                className="rounded border border-white"
                style={{
                  width: 46, height: 46, objectFit: "cover",
                  marginLeft: i === 0 ? 0 : -12, background: "#fff",
                }}
              />
            ))}
            {list.length > 4 && (
              <span className="badge bg-light text-muted ms-2">+{list.length - 4}</span>
            )}
            {list.length === 0 && <span className="text-muted">—</span>}
          </div>
        );
      }
    },
    { header: "Titre", accessorKey: "title", enableColumnFilter: false },
    {
      header: "Nb. articles", enableColumnFilter: false,
      cell: (cell: any) => (cell.row.original.items || []).length,
    },
    {
      header: "Remises", enableColumnFilter: false,
      cell: (cell: any) => {
        const list: PromoItem[] = cell.row.original.items || [];
        const percents = list
          .map((it) => it.discount_percent)
          .filter((d): d is number => d != null);
        if (percents.length === 0) return <span className="text-muted">Sans remise</span>;
        const min = Math.min(...percents);
        const max = Math.max(...percents);
        return (
          <span className="badge bg-danger">
            {min === max ? `-${min}%` : `-${min}% à -${max}%`}
          </span>
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
        const isActif = cell.getValue() === "actif";
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
              onClick={() => { setPromo(cp.row.original); setIsEdit(true); setModal(true); }}>
              <i className="ri-pencil-fill fs-16"></i>
            </Link>
          </li>
          <li className="list-inline-item">
            <Link to="#" className="text-danger d-inline-block"
              onClick={() => { setPromo(cp.row.original); setDeleteModal(true); }}>
              <i className="ri-delete-bin-5-fill fs-16"></i>
            </Link>
          </li>
        </ul>
      )
    }
  ], []);

  const toggleModal = useCallback(() => {
    if (modal) { setModal(false); setPromo(null); }
    else setModal(true);
  }, [modal]);

  document.title = "Promotions | Site Web";

  return (
    <div className="page-content">
      <DeleteModal show={deleteModal} onDeleteClick={handleDelete}
        onCloseClick={() => setDeleteModal(false)} />

      <Container fluid>
        <BreadCrumb title="Promotions" pageTitle="Site Web" />

        <Row>
          <Col lg={12}>
            <Card>
              <CardHeader className="card-header border-0">
                <Row className="align-items-center gy-3">
                  <div className="col-sm">
                    <h5 className="card-title mb-0">Gestion des Promotions</h5>
                    <p className="text-muted small mb-0">
                      Chaque promotion regroupe plusieurs articles remisés. Ils alimentent la
                      bande « Les bonnes affaires du moment » de la page d'accueil, avec leur
                      badge rouge et l'ancien prix barré.
                    </p>
                  </div>
                  <div className="col-sm-auto">
                    <Button color="secondary"
                      onClick={() => { setIsEdit(false); setPromo(null); toggleModal(); }}>
                      <i className="ri-add-line align-bottom me-1"></i> Ajouter une Promotion
                    </Button>
                  </div>
                </Row>
              </CardHeader>
              <CardBody className="pt-0">
                {loading ? <Loader /> : (
                  <TableContainer columns={columns} data={promos} isGlobalFilter={false}
                    customPageSize={10} divClass="table-responsive table-card mb-1 mt-0"
                    tableClass="align-middle table-nowrap"
                    theadClass="table-light text-muted text-uppercase" />
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>

        <Modal isOpen={modal} toggle={toggleModal} centered size="xl">
          <ModalHeader toggle={toggleModal}>
            {isEdit ? "Modifier la Promotion" : "Ajouter une Promotion"}
          </ModalHeader>
          <Form onSubmit={(e) => { e.preventDefault(); validation.handleSubmit(); }}>
            <ModalBody style={{ maxHeight: "78vh", overflowY: "auto" }}>
              <Row>
                <Col md={5}>
                  <div className="mb-3">
                    <Label className="form-label">Titre <span className="text-danger">*</span></Label>
                    <Input name="title" placeholder="Ex: Soldes d'été"
                      onChange={validation.handleChange} onBlur={validation.handleBlur}
                      value={validation.values.title}
                      invalid={!!(validation.touched.title && validation.errors.title)} />
                    {validation.touched.title && validation.errors.title && (
                      <div className="text-danger small">{validation.errors.title as string}</div>
                    )}
                    <small className="text-muted">Repère interne, non affiché sur le site.</small>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="mb-3">
                    <Label className="form-label">Statut</Label>
                    <Input type="select" name="status"
                      onChange={validation.handleChange} value={validation.values.status}>
                      <option value="actif">Actif</option>
                      <option value="inactive">Inactif</option>
                    </Input>
                  </div>
                </Col>
                <Col md={2}>
                  <div className="mb-3">
                    <Label className="form-label">Date de début</Label>
                    <Input type="datetime-local" name="date_start"
                      onChange={validation.handleChange} value={validation.values.date_start} />
                  </div>
                </Col>
                <Col md={2}>
                  <div className="mb-3">
                    <Label className="form-label">Date de fin</Label>
                    <Input type="datetime-local" name="date_end"
                      onChange={validation.handleChange} value={validation.values.date_end} />
                  </div>
                </Col>
              </Row>

              <div className="border rounded p-3 mb-3">
                <Label className="form-label fw-semibold mb-1">
                  Articles en promotion <span className="text-danger">*</span>
                </Label>
                <p className="text-muted small mb-3">
                  Recherchez un article, ajoutez-le, puis indiquez <strong>soit</strong> un
                  pourcentage <strong>soit</strong> un prix promotionnel — l'autre valeur est
                  calculée automatiquement.
                </p>

                <div className="mb-3 position-relative">
                  <Input type="text"
                    placeholder="Tapez au moins 3 caractères pour rechercher un article..."
                    value={productSearch}
                    onChange={(e) => { setProductSearch(e.target.value); setProductDropdownOpen(true); }}
                    onFocus={() => setProductDropdownOpen(true)}
                    onBlur={() => setTimeout(() => setProductDropdownOpen(false), 150)} />
                  {productDropdownOpen && productSearch.trim().length >= 3 && (
                    <div className="border rounded shadow-sm mt-1"
                      style={{ maxHeight: 250, overflowY: "auto", position: "absolute", zIndex: 1000, background: "#fff", width: "100%" }}>
                      {productsLoading ? (
                        <div className="p-2 text-muted small">Recherche...</div>
                      ) : productResults.length > 0 ? (
                        <ul className="list-group list-group-flush mb-0">
                          {productResults.map((a) => (
                            <li key={a.id} className="list-group-item list-group-item-action d-flex align-items-center gap-2"
                              style={{ cursor: "pointer" }}
                              onMouseDown={() => addArticle(a)}>
                              <img src={getImageUrl(a.image)} alt=""
                                className="rounded" style={{ width: 32, height: 32, objectFit: "cover" }} />
                              <span>
                                {a.designation} {a.reference ? `(${a.reference})` : ""}
                                <span className="text-muted ms-2">{priceOf(a).toFixed(3)} DT</span>
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="p-2 text-muted small">Aucun article trouvé</div>
                      )}
                    </div>
                  )}
                </div>

                {items.length === 0 ? (
                  <div className="text-center text-muted py-4 border rounded" style={{ background: "#f8f9fa" }}>
                    <i className="ri-price-tag-3-line fs-3 d-block mb-1"></i>
                    Aucun article pour l'instant — utilisez la recherche ci-dessus.
                  </div>
                ) : (
                  <div className="table-responsive">
                    <Table className="align-middle mb-0">
                      <thead className="table-light text-muted text-uppercase">
                        <tr>
                          <th style={{ width: 60 }}></th>
                          <th>Article</th>
                          <th style={{ width: 120 }}>Prix</th>
                          <th style={{ width: 130 }}>Remise (%)</th>
                          <th style={{ width: 150 }}>Prix promo (DT)</th>
                          <th style={{ width: 170 }}>Aperçu site</th>
                          <th style={{ width: 50 }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item, index) => {
                          const preview = previewDiscount(item);
                          return (
                            <tr key={item.article.id}>
                              <td>
                                <img src={getImageUrl(item.article.image)} alt=""
                                  className="rounded" style={{ width: 46, height: 46, objectFit: "cover" }} />
                              </td>
                              <td>
                                <div>{item.article.designation}</div>
                                {item.article.reference && (
                                  <small className="text-muted">{item.article.reference}</small>
                                )}
                              </td>
                              <td>{priceOf(item.article).toFixed(3)} DT</td>
                              <td>
                                <Input type="number" min={1} max={99} bsSize="sm"
                                  placeholder="20"
                                  value={item.discount_percent}
                                  onChange={(e) => patchItem(index, { discount_percent: e.target.value })} />
                              </td>
                              <td>
                                <Input type="number" min={0} step="0.001" bsSize="sm"
                                  placeholder="159.000"
                                  value={item.promo_price}
                                  onChange={(e) => patchItem(index, { promo_price: e.target.value })} />
                              </td>
                              <td>
                                {preview ? (
                                  <div className="d-flex align-items-center gap-2">
                                    <span className="badge bg-danger">-{preview.percent}%</span>
                                    <span>
                                      <strong>{preview.final.toFixed(3)}</strong>
                                      <s className="text-muted ms-1">{preview.old.toFixed(3)}</s>
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-muted small">Sans remise</span>
                                )}
                              </td>
                              <td>
                                <Link to="#" className="text-danger"
                                  onClick={(e) => { e.preventDefault(); removeItem(index); }}>
                                  <i className="ri-delete-bin-5-fill fs-16"></i>
                                </Link>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </Table>
                  </div>
                )}
              </div>

              <Row>
                <Col md={3}>
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

export default WebsitePromos;
