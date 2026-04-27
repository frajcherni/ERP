import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  Card,
  CardBody,
  Col,
  Container,
  CardHeader,
  Row,
  Modal,
  ModalHeader,
  Form,
  ModalBody,
  Label,
  Input,
  FormFeedback,
  Badge,
  Button
} from "reactstrap";
import { Link } from "react-router-dom";
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
  fetchCarouselSlides,
  createCarouselSlide,
  updateCarouselSlide,
  deleteCarouselSlide,
  CarouselSlide
} from "../../../Components/Article/CarouselServices";

const WebsiteCarousel = () => {
  const [modal, setModal] = useState(false);
  const [slides, setSlides] = useState<CarouselSlide[]>([]);
  const [slide, setSlide] = useState<CarouselSlide | null>(null);
  const [isEdit, setIsEdit] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const API_BASE = process.env.REACT_APP_API_BASE;

  // Image upload handler
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchCarouselSlides();
      setSlides(data);
      setLoading(false);
    } catch (err) {
      toast.error("Échec du chargement des bannières");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async () => {
    if (!slide) return;
    try {
      await deleteCarouselSlide(slide.id);
      setDeleteModal(false);
      fetchData();
      toast.success("Bannière supprimée");
    } catch (err) {
      toast.error("Échec de la suppression");
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      const formData = new FormData();
      formData.append('title', values.title || '');
      formData.append('subtitle', values.subtitle || '');
      formData.append('link', values.link || '');
      formData.append('order', (values.order || 0).toString());
      formData.append('active', (values.active || false).toString());
      
      if (selectedImage) {
        formData.append('image', selectedImage);
      } else if (!isEdit) {
        toast.error("Une image est obligatoire pour une nouvelle bannière");
        return;
      }

      if (isEdit && slide) {
        await updateCarouselSlide(slide.id, formData);
        toast.success("Bannière mise à jour");
      } else {
        await createCarouselSlide(formData);
        toast.success("Bannière ajoutée");
      }
      
      setModal(false);
      setSelectedImage(null);
      setImagePreview(null);
      fetchData();
    } catch (err) {
      toast.error("Échec de l'opération");
    }
  };

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      title: slide?.title || "",
      subtitle: slide?.subtitle || "",
      link: slide?.link || "",
      order: slide?.order || 0,
      active: slide?.active ?? true,
    },
    validationSchema: Yup.object({
      title: Yup.string(),
    }),
    onSubmit: handleSubmit
  });

  const columns = useMemo(
    () => [
      {
        header: "Image",
        accessorKey: "image",
        enableColumnFilter: false,
        cell: (cell: any) => (
          <img 
            src={cell.getValue()} 
            alt="slide" 
            className="rounded" 
            style={{ width: '120px', height: '60px', objectFit: 'cover' }} 
          />
        )
      },
      {
        header: "Titre",
        accessorKey: "title",
        enableColumnFilter: false,
      },
      {
        header: "Ordre",
        accessorKey: "order",
        enableColumnFilter: false,
      },
      {
        header: "Statut",
        accessorKey: "active",
        enableColumnFilter: false,
        cell: (cell: any) => (
          <Badge color={cell.getValue() ? "success" : "danger"}>
            {cell.getValue() ? "Actif" : "Inactif"}
          </Badge>
        )
      },
      {
        header: "Action",
        cell: (cellProps: any) => {
          return (
            <ul className="list-inline hstack gap-2 mb-0">
              <li className="list-inline-item edit">
                <Link
                  to="#"
                  className="text-primary d-inline-block"
                  onClick={() => {
                    setSlide(cellProps.row.original);
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
                  className="text-danger d-inline-block"
                  onClick={() => {
                    setSlide(cellProps.row.original);
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
      setSlide(null);
      setSelectedImage(null);
      setImagePreview(null);
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
        <BreadCrumb title="Carousel" pageTitle="Site Web" />
        
        <Row>
          <Col lg={12}>
            <Card>
              <CardHeader className="card-header border-0">
                <Row className="align-items-center gy-3">
                  <div className="col-sm">
                    <h5 className="card-title mb-0">Gestion du Carousel Accueil</h5>
                  </div>
                  <div className="col-sm-auto">
                    <Button
                      color="secondary"
                      onClick={() => { 
                        setIsEdit(false); 
                        setSlide(null);
                        toggleModal(); 
                      }}
                    >
                      <i className="ri-add-line align-bottom me-1"></i> Ajouter une Image
                    </Button>
                  </div>
                </Row>
              </CardHeader>

              <CardBody className="pt-0">
                {loading ? (
                  <Loader />
                ) : (
                  <TableContainer
                    columns={columns}
                    data={slides}
                    isGlobalFilter={false}
                    customPageSize={10}
                    divClass="table-responsive table-card mb-1 mt-0"
                    tableClass="align-middle table-nowrap"
                    theadClass="table-light text-muted text-uppercase"
                  />
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>

        <Modal isOpen={modal} toggle={toggleModal} centered size="lg">
          <ModalHeader toggle={toggleModal}>
            {isEdit ? "Modifier Bannière" : "Ajouter une Bannière"}
          </ModalHeader>
          <Form onSubmit={validation.handleSubmit}>
            <ModalBody>
              <Row>
                <Col md={12}>
                  <div className="mb-3">
                    <Label className="form-label">Image (Format recommandé: 1920x800)*</Label>
                    <div className="border rounded p-3 text-center">
                      {(imagePreview || slide?.image) ? (
                        <div className="mb-3">
                          <img 
                            src={imagePreview || slide?.image}
                            alt="Preview" 
                            className="img-fluid rounded mb-2"
                            style={{ maxHeight: '200px', width: '100%', objectFit: 'cover' }}
                          />
                          <div>
                            <Label htmlFor="image-upload" className="btn btn-sm btn-outline-primary me-2">Changer</Label>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <i className="ri-image-line fs-1 text-muted mb-2 d-block"></i>
                          <Label htmlFor="image-upload" className="btn btn-outline-primary">Télécharger l'image</Label>
                        </div>
                      )}
                      <Input
                        id="image-upload"
                        name="image"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="d-none"
                      />
                    </div>
                  </div>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <div className="mb-3">
                    <Label className="form-label">Titre Principal</Label>
                    <Input
                      name="title"
                      placeholder="Ex: Nouvelle Collection"
                      onChange={validation.handleChange}
                      value={validation.values.title}
                    />
                  </div>
                </Col>
                <Col md={6}>
                  <div className="mb-3">
                    <Label className="form-label">Sous-titre</Label>
                    <Input
                      name="subtitle"
                      placeholder="Ex: Printemps 2025"
                      onChange={validation.handleChange}
                      value={validation.values.subtitle}
                    />
                  </div>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <div className="mb-3">
                    <Label className="form-label">Lien (URL)</Label>
                    <Input
                      name="link"
                      placeholder="Ex: /shop"
                      onChange={validation.handleChange}
                      value={validation.values.link}
                    />
                  </div>
                </Col>
                <Col md={3}>
                  <div className="mb-3">
                    <Label className="form-label">Ordre</Label>
                    <Input
                      name="order"
                      type="number"
                      onChange={validation.handleChange}
                      value={validation.values.order}
                    />
                  </div>
                </Col>
                <Col md={3}>
                  <div className="mb-3 mt-4">
                    <div className="form-check form-switch">
                      <Input
                        name="active"
                        type="checkbox"
                        className="form-check-input"
                        onChange={validation.handleChange}
                        checked={validation.values.active}
                        id="activeSwitch"
                      />
                      <Label className="form-check-label" for="activeSwitch">Actif</Label>
                    </div>
                  </div>
                </Col>
              </Row>
            </ModalBody>
            <div className="modal-footer">
              <Button type="button" color="light" onClick={toggleModal}>Fermer</Button>
              <Button type="submit" color="success">{isEdit ? "Mettre à jour" : "Ajouter"}</Button>
            </div>
          </Form>
        </Modal>
        <ToastContainer />
      </Container>
    </div>
  );
};

export default WebsiteCarousel;
