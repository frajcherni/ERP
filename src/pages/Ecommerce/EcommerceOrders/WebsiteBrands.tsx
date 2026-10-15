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
  fetchBrands, createBrand, updateBrand, deleteBrand, Brand, getImageUrl
} from "../../../Components/Article/BrandServices";

const WebsiteBrands = () => {
  const [modal, setModal] = useState(false);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [brand, setBrand] = useState<Brand | null>(null);
  const [isEdit, setIsEdit] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setBrands(await fetchBrands());
    } catch {
      toast.error("Échec du chargement des marques");
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
    if (!brand) return;
    try {
      await deleteBrand(brand.id);
      setDeleteModal(false);
      setBrand(null);
      fetchData();
      toast.success("Marque supprimée");
    } catch {
      toast.error("Échec de la suppression");
    }
  };

  const handleSubmit = async (values: any) => {
    if (!isEdit && !selectedImage) {
      toast.error("Veuillez télécharger un logo");
      return;
    }
    const formData = new FormData();
    formData.append("name", values.name);
    formData.append("link", values.link || "");
    formData.append("order", String(values.order ?? 0));
    formData.append("active", String(values.active));
    if (selectedImage) formData.append("image", selectedImage);

    try {
      if (isEdit && brand) {
        await updateBrand(brand.id, formData);
        toast.success("Marque mise à jour");
      } else {
        await createBrand(formData);
        toast.success("Marque ajoutée");
      }
      setModal(false);
      setBrand(null);
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
      name: brand?.name || "",
      link: brand?.link || "",
      order: brand?.order ?? 0,
      active: brand?.active ?? true,
    },
    validationSchema: Yup.object({
      name: Yup.string().required("Le nom est obligatoire"),
    }),
    onSubmit: handleSubmit,
  });

  const columns = useMemo(() => [
    {
      header: "Logo", accessorKey: "image", enableColumnFilter: false,
      cell: (cell: any) => (
        <div style={{ background: "#f8f9fa", borderRadius: 6, padding: 6, display: "inline-block" }}>
          <img src={getImageUrl(cell.getValue())} alt="logo"
            style={{ width: 90, height: 50, objectFit: "contain" }} />
        </div>
      )
    },
    { header: "Nom", accessorKey: "name", enableColumnFilter: false },
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
                setBrand(cp.row.original); setIsEdit(true);
                setSelectedImage(null); setImagePreview(null); setModal(true);
              }}>
              <i className="ri-pencil-fill fs-16"></i>
            </Link>
          </li>
          <li className="list-inline-item">
            <Link to="#" className="text-danger d-inline-block"
              onClick={() => { setBrand(cp.row.original); setDeleteModal(true); }}>
              <i className="ri-delete-bin-5-fill fs-16"></i>
            </Link>
          </li>
        </ul>
      )
    }
  ], []);

  const toggleModal = useCallback(() => {
    if (modal) { setModal(false); setBrand(null); setSelectedImage(null); setImagePreview(null); }
    else setModal(true);
  }, [modal]);

  document.title = "Marques | Site Web";

  return (
    <div className="page-content">
      <DeleteModal show={deleteModal} onDeleteClick={handleDelete}
        onCloseClick={() => setDeleteModal(false)} />

      <Container fluid>
        <BreadCrumb title="Marques" pageTitle="Site Web" />

        <Row>
          <Col lg={12}>
            <Card>
              <CardHeader className="card-header border-0">
                <Row className="align-items-center gy-3">
                  <div className="col-sm">
                    <h5 className="card-title mb-0">Gestion des Marques</h5>
                  </div>
                  <div className="col-sm-auto">
                    <Button color="secondary"
                      onClick={() => { setIsEdit(false); setBrand(null); toggleModal(); }}>
                      <i className="ri-add-line align-bottom me-1"></i> Ajouter une Marque
                    </Button>
                  </div>
                </Row>
              </CardHeader>
              <CardBody className="pt-0">
                {loading ? <Loader /> : (
                  <TableContainer columns={columns} data={brands} isGlobalFilter={false}
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
            {isEdit ? "Modifier Marque" : "Ajouter une Marque"}
          </ModalHeader>
          <Form onSubmit={(e) => { e.preventDefault(); validation.handleSubmit(); }}>
            <ModalBody style={{ maxHeight: "78vh", overflowY: "auto" }}>
              <div className="mb-4">
                <Label className="form-label">Logo {!isEdit && <span className="text-danger">*</span>}</Label>
                <div className="border rounded p-3 text-center" style={{ background: "#f8f9fa" }}>
                  {(imagePreview || brand?.image) ? (
                    <div className="mb-2">
                      <img src={imagePreview || getImageUrl(brand?.image)} alt="Preview"
                        className="rounded mb-2"
                        style={{ maxHeight: 90, maxWidth: "100%", objectFit: "contain" }} />
                      <br />
                      <Label htmlFor="brand-img" className="btn btn-sm btn-outline-primary mt-2">
                        Changer le logo
                      </Label>
                    </div>
                  ) : (
                    <div>
                      <i className="ri-image-line fs-1 text-muted mb-2 d-block"></i>
                      <Label htmlFor="brand-img" className="btn btn-outline-primary">
                        Télécharger le logo
                      </Label>
                    </div>
                  )}
                  <Input id="brand-img" name="image" type="file" accept="image/*"
                    onChange={handleImageUpload} className="d-none" />
                </div>
              </div>

              <Row>
                <Col md={8}>
                  <div className="mb-3">
                    <Label className="form-label">Nom <span className="text-danger">*</span></Label>
                    <Input name="name" placeholder="Ex: Philips Hue"
                      onChange={validation.handleChange} onBlur={validation.handleBlur}
                      value={validation.values.name}
                      invalid={!!(validation.touched.name && validation.errors.name)} />
                    {validation.touched.name && validation.errors.name && (
                      <div className="text-danger small">{validation.errors.name as string}</div>
                    )}
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
                  <div className="mb-3">
                    <Label className="form-label">Lien (optionnel)</Label>
                    <Input name="link" placeholder="https://… (laisser vide si aucun)"
                      onChange={validation.handleChange} value={validation.values.link} />
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

export default WebsiteBrands;
