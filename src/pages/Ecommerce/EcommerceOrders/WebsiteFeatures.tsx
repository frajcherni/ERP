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
import * as Yup from "yup";
import { useFormik } from "formik";
import {
  fetchWebsiteFeatures, createWebsiteFeature, updateWebsiteFeature,
  deleteWebsiteFeature, featureIconClass, FEATURE_ICONS, WebsiteFeature
} from "../../../Components/Article/WebsiteFeatureServices";

/**
 * "Points forts" — the row of icons on the shop's home page reading
 * "Produits de qualité · Large choix · Styles pour tous · …".
 *
 * The strip is laid out by the website as a responsive grid, so any number of
 * rows works; five is what the design was drawn around.
 */
const WebsiteFeatures = () => {
  const [modal, setModal] = useState(false);
  const [items, setItems] = useState<WebsiteFeature[]>([]);
  const [current, setCurrent] = useState<WebsiteFeature | null>(null);
  const [isEdit, setIsEdit] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setItems(await fetchWebsiteFeatures());
    } catch {
      toast.error("Échec du chargement des points forts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async () => {
    if (!current) return;
    try {
      await deleteWebsiteFeature(current.id);
      setDeleteModal(false);
      setCurrent(null);
      fetchData();
      toast.success("Point fort supprimé");
    } catch {
      toast.error("Échec de la suppression");
    }
  };

  const handleSubmit = async (values: any) => {
    const payload = {
      icon: values.icon,
      title: values.title,
      description: values.description,
      order: Number(values.order) || 0,
      active: values.active,
    };
    try {
      if (isEdit && current) {
        await updateWebsiteFeature(current.id, payload);
        toast.success("Point fort mis à jour");
      } else {
        await createWebsiteFeature(payload);
        toast.success("Point fort ajouté");
      }
      setModal(false);
      setCurrent(null);
      fetchData();
    } catch (e: any) {
      toast.error(e.message || "Échec de l'opération");
    }
  };

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      icon: current?.icon || "award",
      title: current?.title || "",
      description: current?.description || "",
      order: current?.order ?? 0,
      active: current?.active ?? true,
    },
    validationSchema: Yup.object({
      title: Yup.string().required("Le titre est obligatoire"),
    }),
    onSubmit: handleSubmit,
  });

  const columns = useMemo(() => [
    {
      header: "Icône", accessorKey: "icon", enableColumnFilter: false,
      cell: (cell: any) => (
        <span
          className="d-inline-flex align-items-center justify-content-center rounded-circle bg-primary-subtle text-primary"
          style={{ width: 42, height: 42 }}
        >
          <i className={`${featureIconClass(cell.getValue())} fs-20`}></i>
        </span>
      )
    },
    { header: "Titre", accessorKey: "title", enableColumnFilter: false },
    {
      header: "Description", accessorKey: "description", enableColumnFilter: false,
      cell: (cell: any) => cell.getValue() || "—",
    },
    { header: "Ordre", accessorKey: "order", enableColumnFilter: false },
    {
      header: "Statut", accessorKey: "active", enableColumnFilter: false,
      cell: (cell: any) => (
        <span className={`badge ${cell.getValue() ? "bg-success-subtle text-success" : "bg-danger-subtle text-danger"} text-uppercase`}>
          {cell.getValue() ? "Actif" : "Inactif"}
        </span>
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
  ], []);

  const toggleModal = useCallback(() => {
    if (modal) { setModal(false); setCurrent(null); }
    else setModal(true);
  }, [modal]);

  document.title = "Points forts | Site Web";

  return (
    <div className="page-content">
      <DeleteModal show={deleteModal} onDeleteClick={handleDelete}
        onCloseClick={() => setDeleteModal(false)} />

      <Container fluid>
        <BreadCrumb title="Points forts" pageTitle="Site Web" />

        <Row>
          <Col lg={12}>
            <Card>
              <CardHeader className="card-header border-0">
                <Row className="align-items-center gy-3">
                  <div className="col-sm">
                    <h5 className="card-title mb-0">Gestion des Points forts</h5>
                    <p className="text-muted small mb-0">
                      La bande d'icônes affichée sur la page d'accueil, sous les promotions
                      (qualité, choix, conseils, livraison…).
                    </p>
                  </div>
                  <div className="col-sm-auto">
                    <Button color="secondary"
                      onClick={() => { setIsEdit(false); setCurrent(null); toggleModal(); }}>
                      <i className="ri-add-line align-bottom me-1"></i> Ajouter un Point fort
                    </Button>
                  </div>
                </Row>
              </CardHeader>
              <CardBody className="pt-0">
                {loading ? <Loader /> : (
                  <TableContainer columns={columns} data={items} isGlobalFilter={false}
                    customPageSize={10} divClass="table-responsive table-card mb-1 mt-0"
                    tableClass="align-middle table-nowrap"
                    theadClass="table-light text-muted text-uppercase" />
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>

        <Modal isOpen={modal} toggle={toggleModal} centered>
          <ModalHeader toggle={toggleModal}>
            {isEdit ? "Modifier le Point fort" : "Ajouter un Point fort"}
          </ModalHeader>
          <Form onSubmit={(e) => { e.preventDefault(); validation.handleSubmit(); }}>
            <ModalBody style={{ maxHeight: "78vh", overflowY: "auto" }}>
              <Row>
                <Col md={12}>
                  <div className="mb-3">
                    <Label className="form-label">Icône</Label>
                    <div className="d-flex align-items-center gap-3">
                      <span
                        className="d-inline-flex align-items-center justify-content-center rounded-circle bg-primary-subtle text-primary flex-shrink-0"
                        style={{ width: 46, height: 46 }}
                      >
                        <i className={`${featureIconClass(validation.values.icon)} fs-22`}></i>
                      </span>
                      <Input type="select" name="icon"
                        onChange={validation.handleChange} value={validation.values.icon}>
                        {FEATURE_ICONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </Input>
                    </div>
                    <small className="text-muted">
                      L'aperçu ci-dessus correspond au dessin affiché sur le site.
                    </small>
                  </div>
                </Col>

                <Col md={12}>
                  <div className="mb-3">
                    <Label className="form-label">Titre <span className="text-danger">*</span></Label>
                    <Input name="title" placeholder="Ex: Produits de qualité"
                      onChange={validation.handleChange} onBlur={validation.handleBlur}
                      value={validation.values.title}
                      invalid={!!(validation.touched.title && validation.errors.title)} />
                    {validation.touched.title && validation.errors.title && (
                      <div className="text-danger small">{validation.errors.title as string}</div>
                    )}
                  </div>
                </Col>

                <Col md={12}>
                  <div className="mb-3">
                    <Label className="form-label">Description</Label>
                    <Input type="textarea" name="description" rows={2}
                      placeholder="Ex: Des produits sélectionnés pour leur qualité et leur durabilité."
                      onChange={validation.handleChange} value={validation.values.description} />
                  </div>
                </Col>

                <Col md={6}>
                  <div className="mb-3">
                    <Label className="form-label">Ordre</Label>
                    <Input type="number" name="order"
                      onChange={validation.handleChange} value={validation.values.order} />
                  </div>
                </Col>
                <Col md={6}>
                  <div className="mb-3 mt-md-4">
                    <FormGroup switch>
                      <Input type="switch" role="switch" name="active"
                        checked={validation.values.active}
                        onChange={validation.handleChange} />
                      <Label className="form-label ms-2">Afficher sur le site</Label>
                    </FormGroup>
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

export default WebsiteFeatures;
