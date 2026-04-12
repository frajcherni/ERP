import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  Card,
  CardBody,
  Col,
  Container,
  CardHeader,
  Nav,
  NavItem,
  NavLink,
  Row,
  Modal,
  ModalHeader,
  Form,
  ModalBody,
  Label,
  Input,
  FormFeedback,
  Badge,
  InputGroup,
  InputGroupText
} from "reactstrap";
import { Link } from "react-router-dom";
import classnames from "classnames";
import Flatpickr from "react-flatpickr";
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
  fetchCategories,
  createCategorie,
  updateCategorie,
  deleteCategorie
} from "../../../Components/Article/ArticleServices";

import { Categorie } from "../../../Components/Article/Interfaces";

const CategoriesList = () => {
  const [modal, setModal] = useState(false);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Categorie[]>([]);
  const [categorie, setCategorie] = useState<Categorie | null>(null);
  const [isEdit, setIsEdit] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("1");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [isExportCSV, setIsExportCSV] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [parentCategories, setParentCategories] = useState<Categorie[]>([]);


  const [selectedImage, setSelectedImage] = useState<File | null>(null);
const [imagePreview, setImagePreview] = useState<string | null>(null);
const API_BASE = process.env.REACT_APP_API_BASE;

// Image upload handler
const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (file) {
    setSelectedImage(file);
    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }
};


  // Fetch all data
// Fetch all data - FIXED VERSION
const fetchData = useCallback(async () => {
  try {
    setLoading(true);
    const categoriesData = await fetchCategories();
    
    console.log('Categories from backend:', categoriesData); // Debug log
    
    // Your backend already sends parentName, so use it directly
    const formattedCategories = categoriesData.map((c: any) => ({
      ...c,
      // Use the parentName that backend already calculated
      parentName: c.parentName || null,
      createdAt: c.createdAt || new Date().toISOString()
    }));
    
    // Separate parent categories and subcategories
    const parents = formattedCategories.filter((c: any) => !c.parent_id);
    
    setCategories(formattedCategories);
    setParentCategories(parents);
    setFilteredCategories(formattedCategories);
    setLoading(false);
  } catch (err) {
    setError(err instanceof Error ? err.message : "Échec du chargement des catégories");
    setLoading(false);
  }
}, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter categories
  useEffect(() => {
    let result = [...categories];
    

    
    // Filter by date range
    if (startDate && endDate) {
      const start = moment(startDate).startOf('day');
      const end = moment(endDate).endOf('day');
      
      result = result.filter(c => {
        const cDate = moment(c.createdAt);
        return cDate.isBetween(start, end, null, '[]');
      });
    }
    
    // Filter by search text
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      result = result.filter(c => 
        c.nom.toLowerCase().includes(searchLower) ||
        c.description?.toLowerCase().includes(searchLower)
      );
    }
    
    setFilteredCategories(result);
  }, [activeTab, startDate, endDate, searchText, categories]);

 
  
  const handleDelete = async () => {
    if (!categorie) return;
    
    try {
      await deleteCategorie(categorie.id);
      setDeleteModal(false);
      fetchData();
      toast.success("Catégorie supprimée avec succès");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec de la suppression");
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      const formData = new FormData();
      
      // Append all fields
      formData.append('nom', values.nom);
      formData.append('description', values.description || '');
      formData.append('parent_id', values.parent_id || '');
      
      // Append image if selected
      if (selectedImage) {
        formData.append('image', selectedImage);
      }
  
      if (isEdit && categorie) {
        await updateCategorie(categorie.id, formData);
        toast.success("Catégorie mise à jour avec succès");
      } else {
        await createCategorie(formData);
        toast.success("Catégorie ajoutée avec succès");
      }
      
      setModal(false);
      setSelectedImage(null);
      setImagePreview(null);
      fetchData();
    } catch (err) {
      console.error('Error saving category:', err);
      toast.error(err instanceof Error ? err.message : "Échec de l'opération");
    }
  };
  // Form validation
  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      nom: categorie?.nom || "",
      description: categorie?.description || "",
      parent_id: categorie?.parent_id || "",

    },
    validationSchema: Yup.object({
      nom: Yup.string().required("Le nom est obligatoire"),
    
    }),
    onSubmit: handleSubmit
  });

  const columns = useMemo(
    () => [
      {
        header: "Nom",
        accessorKey: "nom",
        enableColumnFilter: false,
      },
      {
        header: "Catégorie Parente",
        accessorKey: "parentName",
        enableColumnFilter: false,
        cell: (cell: any) => cell.getValue() || "Catégorie Principale",
      },
      {
        header: "Description",
        accessorKey: "description",
        enableColumnFilter: false,
      },
    
      {
        header: "Date création",
        accessorKey: "createdAt",
        enableColumnFilter: false,
        cell: (cell: any) => moment(cell.getValue()).format("DD MMM YYYY"),
      },
      {
        header: "Action",
        cell: (cellProps: any) => {
          return (
            <ul className="list-inline hstack gap-2 mb-0">
              <li className="list-inline-item edit">
                <Link
                  to="#"
                  className="text-primary d-inline-block edit-item-btn"
                  onClick={() => {
                    setCategorie(cellProps.row.original);
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
                  className="text-danger d-inline-block remove-item-btn"
                  onClick={() => {
                    setCategorie(cellProps.row.original);
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
      setCategorie(null);
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
        <BreadCrumb title="Catégories" pageTitle="Gestion des catégories" />
        
        <Row>
          <Col lg={12}>
            <Card id="categorieList">
              <CardHeader className="card-header border-0">
                <Row className="align-items-center gy-3">
                  <div className="col-sm">
                    <h5 className="card-title mb-0">Liste des Catégories</h5>
                  </div>
                  <div className="col-sm-auto">
                    <div className="d-flex gap-1 flex-wrap">
                      <button
                        type="button"
                        className="btn btn-secondary add-btn"
                        onClick={() => { 
                          setIsEdit(false); 
                          setCategorie(null);
                          toggleModal(); 
                        }}
                      >
                        <i className="ri-add-line align-bottom me-1"></i> Nouvelle Catégorie
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-success"
                        onClick={() => setIsExportCSV(true)}
                      >
                        <i className="ri-file-download-line align-bottom me-1"></i> Exporter
                      </button>
                    </div>
                  </div>
                </Row>
              </CardHeader>

              <CardBody className="pt-0">
                <div>
           

                  <Row className="mt-3 mb-3">
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
                          options={{
                            dateFormat: "d M, Y",
                            altInput: true,
                            altFormat: "F j, Y",
                          }}
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
                          options={{
                            dateFormat: "d M, Y",
                            altInput: true,
                            altFormat: "F j, Y",
                          }}
                          placeholder="Date de fin"
                          onChange={(dates) => setEndDate(dates[0])}
                        />
                      </InputGroup>
                    </Col>
                    <Col md={2}>
                      <button
                        className="btn btn-light w-100"
                        onClick={() => {
                          setStartDate(null);
                          setEndDate(null);
                          setSearchText("");
                        }}
                      >
                        <i className="ri-close-line align-bottom me-1"></i> Réinitialiser
                      </button>
                    </Col>
                  </Row>

                  {loading ? (
                    <Loader />
                  ) : error ? (
                    <div className="text-danger">{error}</div>
                  ) : (
                    <TableContainer
                      columns={columns}
                      data={filteredCategories}
                      isGlobalFilter={false}
                      customPageSize={10}
                      divClass="table-responsive table-card mb-1 mt-0"
                      tableClass="align-middle table-nowrap"
                      theadClass="table-light text-muted text-uppercase"
                    />
                  )}
                </div>
                
                <Modal isOpen={modal} toggle={toggleModal} centered size="lg">
      <ModalHeader toggle={toggleModal}>
        {isEdit ? "Modifier Catégorie" : "Ajouter Catégorie"}
      </ModalHeader>
      <Form onSubmit={validation.handleSubmit}>
        <ModalBody>
          {/* Image Upload Section */}
<Row>
  <Col md={12}>
    <div className="mb-3">
      <Label className="form-label">Image de la catégorie</Label>
      <div className="border rounded p-3 text-center">
        {imagePreview || categorie?.image ? (
          <div className="mb-3">
            <img 
              src={imagePreview || (categorie?.image ? `${API_BASE}/${categorie.image.replace(/\\/g, "/")}` : "")}
              alt="Preview" 
              className="img-fluid rounded mb-2"
              style={{ maxHeight: '150px', objectFit: 'cover' }}
            />
            <div>
              <Label 
                htmlFor="image-upload" 
                className="btn btn-sm btn-outline-primary me-2 mb-1"
              >
                <i className="ri-upload-line align-middle me-1"></i>
                Changer l'image
              </Label>
              <button 
                type="button" 
                className="btn btn-sm btn-outline-danger"
                onClick={() => {
                  setImagePreview(null);
                  setSelectedImage(null);
                }}
              >
                <i className="ri-delete-bin-line align-middle me-1"></i>
                Supprimer
              </button>
            </div>
          </div>
        ) : (
          <div>
            <i className="ri-image-line fs-1 text-muted mb-2 d-block"></i>
            <Label 
              htmlFor="image-upload" 
              className="btn btn-outline-primary"
            >
              <i className="ri-upload-line align-middle me-1"></i>
              Télécharger une image
            </Label>
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
        <small className="text-muted d-block mt-2">
          Formats supportés: JPG, PNG, GIF. Taille max: 5MB
        </small>
      </div>
    </div>
  </Col>
</Row>

          <Row>
            <Col md={6}>
              <div className="mb-3">
                <Label className="form-label">Nom*</Label>
                <Input
                  name="nom"
                  placeholder="Entrer le nom"
                  onChange={validation.handleChange}
                  onBlur={validation.handleBlur}
                  value={validation.values.nom}
                  invalid={validation.touched.nom && !!validation.errors.nom}
                />
                <FormFeedback>{validation.errors.nom}</FormFeedback>
              </div>
            </Col>
            <Col md={6}>
              <div className="mb-3">
                <Label className="form-label">Catégorie Parente</Label>
                <Input
                  name="parent_id"
                  type="select"
                  onChange={validation.handleChange}
                  onBlur={validation.handleBlur}
                  value={validation.values.parent_id}
                >
                  <option value="">Catégorie Principale</option>
                  {parentCategories.map(parent => (
                    <option key={parent.id} value={parent.id}>
                      {parent.nom}
                    </option>
                  ))}
                </Input>
              </div>
            </Col>
          </Row>

          <Row>
            <Col md={12}>
              <div className="mb-3">
                <Label className="form-label">Description</Label>
                <Input
                  name="description"
                  type="textarea"
                  placeholder="Entrer la description"
                  onChange={validation.handleChange}
                  onBlur={validation.handleBlur}
                  value={validation.values.description}
                />
              </div>
            </Col>
          </Row>
        </ModalBody>
        <div className="modal-footer">
          <button type="button" className="btn btn-light" onClick={toggleModal}>
            Fermer
          </button>
          <button type="submit" className="btn btn-success">
            {isEdit ? "Mettre à jour" : "Ajouter"}
          </button>
        </div>
      </Form>
    </Modal>
                <ToastContainer closeButton={false} limit={1} />
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default CategoriesList;