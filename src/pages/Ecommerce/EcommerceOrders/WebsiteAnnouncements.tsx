import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  Card, CardBody, Col, Container, CardHeader, Row, Modal, ModalHeader,
  Form, ModalBody, ModalFooter, Label, Input, Button, FormGroup
} from "reactstrap";
import { Link } from "react-router-dom";
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import TableContainer from "../../../Components/Common/TableContainer";
import DeleteModal from "../../../Components/Common/DeleteModal";
import Loader from "../../../Components/Common/Loader";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useFormik } from "formik";
import {
  fetchAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement,
  seedDefaultAnnouncements, reorderAnnouncements,
  Announcement, AnnouncementMarker, AnnouncementAccent,
  MARKER_OPTIONS, ACCENT_OPTIONS,
} from "../../../Components/Article/AnnouncementServices";

const MAX_LEN = 180;

const accentHex = (accent: AnnouncementAccent) =>
  ACCENT_OPTIONS.find(a => a.value === accent)?.hex || "#E8DC00";

const markerGlyph = (marker: AnnouncementMarker) =>
  MARKER_OPTIONS.find(m => m.value === marker)?.glyph || "✦";

const WebsiteAnnouncements = () => {
  const [modal, setModal] = useState(false);
  const [items, setItems] = useState<Announcement[]>([]);
  const [current, setCurrent] = useState<Announcement | null>(null);
  const [isEdit, setIsEdit] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setItems(await fetchAnnouncements());
    } catch {
      toast.error("Échec du chargement des annonces");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async () => {
    if (!current) return;
    try {
      await deleteAnnouncement(current.id);
      setDeleteModal(false);
      setCurrent(null);
      fetchData();
      toast.success("Annonce supprimée");
    } catch {
      toast.error("Échec de la suppression");
    }
  };

  const handleSubmit = async (values: any) => {
    const text = String(values.text || "").trim();
    if (!text) {
      toast.error("Le texte est obligatoire");
      return;
    }

    const payload = {
      text,
      marker: values.marker as AnnouncementMarker,
      accent: values.accent as AnnouncementAccent,
      order: Number(values.order) || 0,
      active: Boolean(values.active),
    };

    try {
      setSaving(true);
      if (isEdit && current) {
        await updateAnnouncement(current.id, payload);
        toast.success("Annonce mise à jour");
      } else {
        await createAnnouncement(payload);
        toast.success("Annonce ajoutée");
      }
      setModal(false);
      setCurrent(null);
      fetchData();
    } catch (e: any) {
      toast.error(e.message || "Échec de l'opération");
    } finally {
      setSaving(false);
    }
  };

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      text: current?.text || "",
      marker: (current?.marker || "sparkle") as AnnouncementMarker,
      accent: (current?.accent || "gold") as AnnouncementAccent,
      order: current?.order ?? items.length,
      active: current?.active ?? true,
    },
    onSubmit: handleSubmit,
  });

  /** Toggles visibility straight from the table, without opening the modal. */
  const toggleActive = async (item: Announcement) => {
    try {
      await updateAnnouncement(item.id, { active: !item.active });
      setItems(prev => prev.map(i => (i.id === item.id ? { ...i, active: !i.active } : i)));
    } catch {
      toast.error("Échec de la mise à jour");
    }
  };

  /** Moves a row up or down and persists the whole order in one request. */
  const move = async (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= items.length) return;

    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    const renumbered = next.map((item, i) => ({ ...item, order: i }));
    setItems(renumbered);

    try {
      await reorderAnnouncements(renumbered.map(({ id, order }) => ({ id, order })));
    } catch {
      toast.error("Échec du réordonnancement");
      fetchData();
    }
  };

  const handleSeed = async () => {
    try {
      const created = await seedDefaultAnnouncements();
      toast.success(`${created.length} annonces par défaut ajoutées`);
      fetchData();
    } catch (e: any) {
      toast.error(e.message || "Échec de l'initialisation");
    }
  };

  const columns = useMemo(() => [
    {
      header: "Aperçu", accessorKey: "text", enableColumnFilter: false,
      cell: (cell: any) => {
        const row: Announcement = cell.row.original;
        return (
          <span
            className="d-inline-flex align-items-center gap-2 px-3 py-2 rounded"
            style={{
              background: "#080808",
              color: "rgba(255,255,255,.72)",
              fontSize: ".72rem",
              letterSpacing: ".1em",
              textTransform: "uppercase",
            }}
          >
            <span style={{ color: accentHex(row.accent), fontSize: ".8rem", lineHeight: 1 }}>
              {markerGlyph(row.marker)}
            </span>
            {row.text}
          </span>
        );
      }
    },
    {
      header: "Glyphe", accessorKey: "marker", enableColumnFilter: false,
      cell: (cell: any) => (
        <span className="text-muted text-capitalize">
          {MARKER_OPTIONS.find(m => m.value === cell.getValue())?.label || cell.getValue()}
        </span>
      )
    },
    {
      header: "Couleur", accessorKey: "accent", enableColumnFilter: false,
      cell: (cell: any) => (
        <span className="d-inline-flex align-items-center gap-2">
          <span style={{
            width: 12, height: 12, borderRadius: "50%",
            background: accentHex(cell.getValue()),
            border: "1px solid rgba(0,0,0,.15)", display: "inline-block",
          }} />
          {ACCENT_OPTIONS.find(a => a.value === cell.getValue())?.label || cell.getValue()}
        </span>
      )
    },
    {
      header: "Ordre", accessorKey: "order", enableColumnFilter: false,
      cell: (cp: any) => (
        <div className="d-flex align-items-center gap-1">
          <span className="text-muted me-1">{cp.getValue()}</span>
          <Button size="sm" color="light" className="btn-icon"
            disabled={cp.row.index === 0}
            onClick={() => move(cp.row.index, -1)}>
            <i className="ri-arrow-up-s-line" />
          </Button>
          <Button size="sm" color="light" className="btn-icon"
            disabled={cp.row.index === items.length - 1}
            onClick={() => move(cp.row.index, 1)}>
            <i className="ri-arrow-down-s-line" />
          </Button>
        </div>
      )
    },
    {
      header: "Statut", accessorKey: "active", enableColumnFilter: false,
      cell: (cp: any) => (
        <Link to="#" onClick={() => toggleActive(cp.row.original)}>
          <span className={`badge ${cp.getValue()
            ? "bg-success-subtle text-success"
            : "bg-danger-subtle text-danger"} text-uppercase`}>
            {cp.getValue() ? "Actif" : "Inactif"}
          </span>
        </Link>
      )
    },
    {
      header: "Action", enableColumnFilter: false,
      cell: (cp: any) => (
        <ul className="list-inline hstack gap-2 mb-0">
          <li className="list-inline-item">
            <Link to="#" className="text-primary d-inline-block"
              onClick={() => { setCurrent(cp.row.original); setIsEdit(true); setModal(true); }}>
              <i className="ri-pencil-fill fs-16"></i>
            </Link>
          </li>
          <li className="list-inline-item">
            <Link to="#" className="text-danger d-inline-block"
              onClick={() => { setCurrent(cp.row.original); setDeleteModal(true); }}>
              <i className="ri-delete-bin-5-fill fs-16"></i>
            </Link>
          </li>
        </ul>
      )
    }
    // `move` and `toggleActive` close over `items`, so the columns must be
    // rebuilt whenever the list changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [items]);

  const toggleModal = useCallback(() => {
    if (modal) { setModal(false); setCurrent(null); }
    else setModal(true);
  }, [modal]);

  document.title = "Annonces | Site Web";

  const activeItems = items.filter(i => i.active);

  return (
    <div className="page-content">
      <DeleteModal show={deleteModal} onDeleteClick={handleDelete}
        onCloseClick={() => setDeleteModal(false)} />

      <Container fluid>
        <BreadCrumb title="Annonces" pageTitle="Site Web" />

        {/* Live preview of the actual scrolling bar */}
        <Row>
          <Col lg={12}>
            <Card>
              <CardBody>
                <h6 className="text-muted text-uppercase fs-12 mb-3">
                  Aperçu de la barre défilante
                </h6>
                <div style={{
                  background: "#080808", borderRadius: 6, overflow: "hidden",
                  height: 36, display: "flex", alignItems: "center",
                }}>
                  {activeItems.length === 0 ? (
                    <span className="px-3" style={{ color: "rgba(255,255,255,.4)", fontSize: ".72rem" }}>
                      Aucune annonce active — la barre affichera les messages par défaut.
                    </span>
                  ) : (
                    <div className="d-flex" style={{ whiteSpace: "nowrap" }}>
                      {activeItems.map(item => (
                        <span key={item.id} className="d-inline-flex align-items-center"
                          style={{
                            gap: ".55rem", padding: "0 2rem", fontSize: ".7rem",
                            fontWeight: 500, letterSpacing: ".1em", textTransform: "uppercase",
                            color: "rgba(255,255,255,.55)",
                          }}>
                          <span style={{ color: accentHex(item.accent), fontSize: ".8rem", lineHeight: 1 }}>
                            {markerGlyph(item.marker)}
                          </span>
                          {item.text}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-muted fs-12 mt-2 mb-0">
                  Sur le site, les glyphes sont animés (rotation, pulsation…) et le
                  ruban défile en boucle.
                </p>
              </CardBody>
            </Card>
          </Col>
        </Row>

        <Row>
          <Col lg={12}>
            <Card>
              <CardHeader className="card-header border-0">
                <Row className="align-items-center gy-3">
                  <div className="col-sm">
                    <h5 className="card-title mb-0">Gestion des Annonces</h5>
                  </div>
                  <div className="col-sm-auto">
                    <div className="d-flex gap-2 flex-wrap">
                      {!loading && items.length === 0 && (
                        <Button color="light" onClick={handleSeed}>
                          <i className="ri-magic-line align-bottom me-1"></i> Ajouter les annonces par défaut
                        </Button>
                      )}
                      <Button color="secondary"
                        onClick={() => { setIsEdit(false); setCurrent(null); toggleModal(); }}>
                        <i className="ri-add-line align-bottom me-1"></i> Ajouter une Annonce
                      </Button>
                    </div>
                  </div>
                </Row>
              </CardHeader>
              <CardBody className="pt-0">
                {loading ? <Loader /> : (
                  <TableContainer columns={columns} data={items} isGlobalFilter={false}
                    customPageSize={20} divClass="table-responsive table-card mb-1 mt-0"
                    tableClass="align-middle table-nowrap"
                    theadClass="table-light text-muted text-uppercase" />
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>

        <Modal isOpen={modal} toggle={toggleModal} centered size="lg">
          <ModalHeader toggle={toggleModal}>
            {isEdit ? "Modifier l'Annonce" : "Ajouter une Annonce"}
          </ModalHeader>
          <Form onSubmit={(e) => { e.preventDefault(); validation.handleSubmit(); }}>
            <ModalBody style={{ maxHeight: "78vh", overflowY: "auto" }}>

              {/* Live preview of the row being edited */}
              <div className="mb-4 p-3 rounded" style={{ background: "#080808" }}>
                <span className="d-inline-flex align-items-center"
                  style={{
                    gap: ".55rem", fontSize: ".7rem", fontWeight: 500,
                    letterSpacing: ".1em", textTransform: "uppercase",
                    color: "rgba(255,255,255,.55)",
                  }}>
                  <span style={{
                    color: accentHex(validation.values.accent),
                    fontSize: ".85rem", lineHeight: 1,
                  }}>
                    {markerGlyph(validation.values.marker)}
                  </span>
                  {validation.values.text || "Votre message ici…"}
                </span>
              </div>

              <Row>
                <Col md={12}>
                  <div className="mb-3">
                    <Label className="form-label">
                      Texte <span className="text-danger">*</span>
                    </Label>
                    <Input name="text" placeholder="Ex: Livraison gratuite dès 50 DT"
                      maxLength={MAX_LEN}
                      onChange={validation.handleChange} value={validation.values.text} />
                    <div className="text-muted fs-12 mt-1">
                      {String(validation.values.text || "").length} / {MAX_LEN} caractères
                    </div>
                  </div>
                </Col>

                <Col md={12}>
                  <div className="mb-3">
                    <Label className="form-label">Glyphe</Label>
                    <div className="d-flex flex-wrap gap-2">
                      {MARKER_OPTIONS.map(opt => {
                        const on = validation.values.marker === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => validation.setFieldValue("marker", opt.value)}
                            className={`btn btn-sm ${on ? "btn-primary" : "btn-outline-light text-body"}`}
                            style={{ minWidth: 96 }}
                          >
                            <span className="me-1" style={{ fontSize: ".95rem", lineHeight: 1 }}>
                              {opt.glyph}
                            </span>
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </Col>

                <Col md={6}>
                  <div className="mb-3">
                    <Label className="form-label">Couleur du glyphe</Label>
                    <div className="d-flex flex-wrap gap-2">
                      {ACCENT_OPTIONS.map(opt => {
                        const on = validation.values.accent === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => validation.setFieldValue("accent", opt.value)}
                            className={`btn btn-sm ${on ? "btn-primary" : "btn-outline-light text-body"}`}
                          >
                            <span className="d-inline-block me-1" style={{
                              width: 10, height: 10, borderRadius: "50%",
                              background: opt.hex, border: "1px solid rgba(0,0,0,.2)",
                            }} />
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </Col>

                <Col md={6}>
                  <div className="mb-3">
                    <Label className="form-label">Ordre</Label>
                    <Input type="number" name="order"
                      onChange={validation.handleChange} value={validation.values.order} />
                  </div>
                </Col>

                <Col md={12}>
                  <FormGroup switch className="mb-2">
                    <Input type="switch" role="switch" name="active"
                      checked={validation.values.active}
                      onChange={validation.handleChange} />
                    <Label className="form-label ms-2">Actif (visible sur le site)</Label>
                  </FormGroup>
                </Col>
              </Row>
            </ModalBody>
            <ModalFooter>
              <Button color="light" onClick={toggleModal} type="button">Annuler</Button>
              <Button color="primary" type="submit" disabled={saving}>
                {saving ? "Enregistrement…" : isEdit ? "Mettre à jour" : "Ajouter"}
              </Button>
            </ModalFooter>
          </Form>
        </Modal>
      </Container>
      <ToastContainer closeButton={false} limit={1} />
    </div>
  );
};

export default WebsiteAnnouncements;
