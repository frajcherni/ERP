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
  fetchTestimonials, createTestimonial, updateTestimonial, deleteTestimonial,
  Testimonial, getImageUrl
} from "../../../Components/Article/TestimonialServices";

const WebsiteTestimonials = () => {
  const [modal, setModal] = useState(false);
  const [items, setItems] = useState<Testimonial[]>([]);
  const [current, setCurrent] = useState<Testimonial | null>(null);
  const [isEdit, setIsEdit] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setItems(await fetchTestimonials());
    } catch {
      toast.error("Échec du chargement des avis");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleDelete = async () => {
    if (!current) return;
    try {
      await deleteTestimonial(current.id);
      setDeleteModal(false);
      setCurrent(null);
      fetchData();
      toast.success("Avis supprimé");
    } catch {
      toast.error("Échec de la suppression");
    }
  };

  const handleSubmit = async (values: any) => {
    if (!isEdit && !selectedImage) {
      toast.error("Veuillez télécharger une image");
      return;
    }
    const formData = new FormData();
    formData.append("name", values.name || "");
    formData.append("order", String(values.order ?? 0));
    formData.append("active", String(values.active));
    if (selectedImage) formData.append("image", selectedImage);

    try {
      if (isEdit && current) {
        await updateTestimonial(current.id, formData);
        toast.success("Avis mis à jour");
      } else {
        await createTestimonial(formData);
        toast.success("Avis ajouté");
      }
      setModal(false);
      setCurrent(null);
      setSelectedImage(null);
      setImagePreview(null);
      fetchData();
    } catch (e: any) {
      toast.error(e.message || "Échec de l'opération");
    }
  };

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      name: current?.name || "",
      order: current?.order ?? 0,
      active: current?.active ?? true,
    },
    onSubmit: handleSubmit,
  });

  const columns = useMemo(() => [
    {
      header: "Image", accessorKey: "image", enableColumnFilter: false,
      cell: (cell: any) => (
        <img src={getImageUrl(cell.getValue())} alt="avis"
          className="rounded" style={{ width: 120, height: 80, objectFit: "cover" }} />
      )
    },
    {
      header: "Nom", accessorKey: "name", enableColumnFilter: false,
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
              onClick={() => {
                setCurrent(cp.row.original); setIsEdit(true);
                setSelectedImage(null); setImagePreview(null); setModal(true);
              }}>
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
    if (modal) { setModal(false); setCurrent(null); setSelectedImage(null); setImagePreview(null); }
    else setModal(true);
  }, [modal]);

  document.title = "Avis Clients | Site Web";

  return (
    <div className="page-content">
      <DeleteModal show={deleteModal} onDeleteClick={handleDelete}
        onCloseClick={() => setDeleteModal(false)} />

      <Container fluid>
        <BreadCrumb title="Avis Clients" pageTitle="Site Web" />

        <Row>
          <Col lg={12}>
            <Card>
              <CardHeader className="card-header border-0">
                <Row className="align-items-center gy-3">
                  <div className="col-sm">
                    <h5 className="card-title mb-0">Gestion des Avis Clients</h5>
                  </div>
                  <div className="col-sm-auto">
                    <Button color="secondary"
                      onClick={() => { setIsEdit(false); setCurrent(null); toggleModal(); }}>
                      <i className="ri-add-line align-bottom me-1"></i> Ajouter un Avis
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

        <Modal isOpen={modal} toggle={toggleModal} centered size="lg">
          <ModalHeader toggle={toggleModal}>
            {isEdit ? "Modifier Avis" : "Ajouter un Avis"}
          </ModalHeader>
          <Form onSubmit={(e) => { e.preventDefault(); validation.handleSubmit(); }}>
            <ModalBody style={{ maxHeight: "78vh", overflowY: "auto" }}>
              <div className="mb-4">
                <Label className="form-label">Image de l'avis {!isEdit && <span className="text-danger">*</span>}</Label>
                <div className="border rounded p-3 text-center">
                  {(imagePreview || current?.image) ? (
                    <div className="mb-2">
                      <img src={imagePreview || getImageUrl(current?.image)} alt="Preview"
                        className="img-fluid rounded mb-2"
                        style={{ maxHeight: 200, width: "100%", objectFit: "contain" }} />
                      <br />
                      <Label htmlFor="testi-img" className="btn btn-sm btn-outline-primary mt-2">
                        Changer l'image
                      </Label>
                    </div>
                  ) : (
                    <div>
                      <i className="ri-image-line fs-1 text-muted mb-2 d-block"></i>
                      <Label htmlFor="testi-img" className="btn btn-outline-primary">
                        Télécharger l'image
                      </Label>
                    </div>
                  )}
                  <Input id="testi-img" name="image" type="file" accept="image/*"
                    onChange={handleImageUpload} className="d-none" />
                </div>
              </div>

              <Row>
                <Col md={8}>
                  <div className="mb-3">
                    <Label className="form-label">Nom (optionnel)</Label>
                    <Input name="name" placeholder="Ex: Sarah M."
                      onChange={validation.handleChange} value={validation.values.name} />
                  </div>
                </Col>
                <Col md={4}>
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

export default WebsiteTestimonials;
