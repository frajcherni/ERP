import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
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
    Table,
    Button
} from "reactstrap";
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import TableContainer from "../../../Components/Common/TableContainer";
import Loader from "../../../Components/Common/Loader";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import * as Yup from "yup";
import { useFormik } from "formik";
import {
    fetchCategories,
    updateCategorie
} from "../../../Components/Article/ArticleServices";

import { Categorie } from "../../../Components/Article/Interfaces";

const WebsiteCategoriesManager = () => {
    const [categories, setCategories] = useState<Categorie[]>([]);
    const [websiteCategories, setWebsiteCategories] = useState<Categorie[]>([]);
    const [searchText, setSearchText] = useState("");
    const [searchResults, setSearchResults] = useState<Categorie[]>([]);
    const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);
    const [settingsModal, setSettingsModal] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<Categorie | null>(null);
    const [loading, setLoading] = useState(true);
    const searchContainerRef = useRef<HTMLDivElement>(null);
    const API_BASE = process.env.REACT_APP_API_BASE;
    const IMAGE_BASE = API_BASE ? API_BASE.replace('/api', '') : 'http://localhost:5000';

    const getImageUrl = (path: string | null | undefined) => {
        if (!path) return "";
        if (path.startsWith('http')) return path;
        return `${IMAGE_BASE}/${path.replace(/\\/g, "/")}`;
    };

    // Fetch all categories
    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const data = await fetchCategories();
            
            const formatted = data.map((c: any) => ({
                ...c,
                on_website: Boolean(c.on_website),
                website_order: parseInt(c.website_order) || 0,
                description: c.description || ""
            }));

            setCategories(formatted);
            setWebsiteCategories(formatted.filter((c: any) => c.on_website));
            setLoading(false);
        } catch (err) {
            toast.error("Échec du chargement des catégories");
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSearch = useCallback((text: string) => {
        setSearchText(text);
        if (text.length >= 2) {
            const searchLower = text.toLowerCase();
            const results = categories.filter(c => 
                !c.on_website && 
                (c.nom.toLowerCase().includes(searchLower) || (c.description && c.description.toLowerCase().includes(searchLower)))
            );
            setSearchResults(results);
            setSearchDropdownOpen(true);
        } else {
            setSearchResults([]);
            setSearchDropdownOpen(false);
        }
    }, [categories]);

    const handleAddToWebsite = useCallback(async (cat: Categorie) => {
        try {
            setSearchDropdownOpen(false);
            setSearchText("");
            
            const formData = new FormData();
            formData.append('nom', cat.nom);
            formData.append('on_website', 'true');
            
            await updateCategorie(cat.id, formData);
            await fetchData();
            toast.success(`Catégorie "${cat.nom}" ajoutée au site web`);
        } catch (err) {
            toast.error("Échec de l'ajout au site web");
        }
    }, [fetchData]);

    const handleRemoveFromWebsite = useCallback(async (id: number) => {
        try {
            const formData = new FormData();
            formData.append('on_website', 'false');
            
            await updateCategorie(id, formData);
            await fetchData();
            toast.success("Catégorie retirée du site web");
        } catch (err) {
            toast.error("Échec du retrait");
        }
    }, [fetchData]);

    const handleOpenSettings = (cat: Categorie) => {
        setSelectedCategory(cat);
        setSettingsModal(true);
    };

    const validation = useFormik({
        enableReinitialize: true,
        initialValues: {
            on_website: selectedCategory?.on_website || false,
            website_order: selectedCategory?.website_order || 0,
            description: selectedCategory?.description || ""
        },
        onSubmit: async (values) => {
            if (!selectedCategory) return;
            try {
                const formData = new FormData();
                formData.append('nom', selectedCategory.nom);
                formData.append('on_website', String(values.on_website));
                formData.append('website_order', String(values.website_order));
                formData.append('description', values.description);

                await updateCategorie(selectedCategory.id, formData);
                setSettingsModal(false);
                fetchData();
                toast.success("Paramètres mis à jour");
            } catch (err) {
                toast.error("Échec de la mise à jour");
            }
        }
    });

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
                setSearchDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const columns = useMemo(() => [
        {
            header: "Image",
            accessorKey: "image",
            cell: (cell: any) => {
                const img = cell.getValue();
                return img ? (
                    <img src={getImageUrl(img)} alt="category" className="rounded" style={{ width: '40px', height: '40px', objectFit: 'cover' }} />
                ) : (
                    <div className="rounded bg-light d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}><i className="ri-image-line"></i></div>
                );
            }
        },
        { header: "Nom", accessorKey: "nom" },
        { header: "Ordre", accessorKey: "website_order" },
        {
            header: "Action",
            cell: (cellProps: any) => {
                const cat = cellProps.row.original;
                return (
                    <div className="hstack gap-2">
                        <Button color="primary" size="sm" onClick={() => handleOpenSettings(cat)}><i className="ri-settings-line me-1"></i></Button>
                        <Button color="danger" size="sm" onClick={() => handleRemoveFromWebsite(cat.id)}><i className="ri-delete-bin-line me-1"></i></Button>
                    </div>
                );
            }
        }
    ], [API_BASE, fetchData]);

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title="Catégories Site Web" pageTitle="Site Web" />
                <Row>
                    <Col lg={12}>
                        <Card>
                            <CardHeader className="border-0">
                                <h5 className="card-title mb-0">Gestion des Catégories du Site Web</h5>
                            </CardHeader>
                            <CardBody className="pt-0">
                                <Row className="mb-4">
                                    <Col md={8}>
                                        <div className="position-relative" ref={searchContainerRef}>
                                            <Input
                                                type="text"
                                                placeholder="Rechercher des catégories à ajouter (2 caractères min)..."
                                                value={searchText}
                                                onChange={(e) => handleSearch(e.target.value)}
                                            />
                                            {searchDropdownOpen && searchResults.length > 0 && (
                                                <div className="position-absolute w-100 shadow-lg border rounded bg-white z-3 mt-1 overflow-auto" style={{ maxHeight: '250px' }}>
                                                    {searchResults.map(cat => (
                                                        <div key={cat.id} className="p-2 border-bottom d-flex justify-content-between align-items-center" onClick={() => handleAddToWebsite(cat)} style={{ cursor: 'pointer' }}>
                                                            <span>{cat.nom}</span>
                                                            <Badge color="success">+ Ajouter</Badge>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </Col>
                                    <Col md={4} className="text-end">
                                        <Button color="primary" onClick={fetchData}><i className="ri-refresh-line"></i></Button>
                                    </Col>
                                </Row>

                                {loading ? <Loader /> : (
                                    <TableContainer
                                        columns={columns}
                                        data={websiteCategories}
                                        isGlobalFilter={false}
                                        customPageSize={10}
                                        divClass="table-responsive table-card"
                                        tableClass="align-middle table-nowrap"
                                        theadClass="table-light text-muted"
                                    />
                                )}
                            </CardBody>
                        </Card>
                    </Col>
                </Row>

                <Modal isOpen={settingsModal} toggle={() => setSettingsModal(false)} centered>
                    <ModalHeader toggle={() => setSettingsModal(false)}>Paramètres - {selectedCategory?.nom}</ModalHeader>
                    <Form onSubmit={validation.handleSubmit}>
                        <ModalBody>
                            <div className="mb-3">
                                <div className="form-check form-switch">
                                    <Input type="checkbox" name="on_website" id="onWebsite" className="form-check-input" checked={validation.values.on_website} onChange={validation.handleChange} />
                                    <Label for="onWebsite" className="form-check-label">Afficher sur le site</Label>
                                </div>
                            </div>
                            <div className="mb-3">
                                <Label className="form-label">Ordre d'affichage</Label>
                                <Input type="number" name="website_order" value={validation.values.website_order} onChange={validation.handleChange} />
                            </div>
                            <div className="mb-3">
                                <Label className="form-label">Description Site Web</Label>
                                <Input type="textarea" name="description" rows={3} value={validation.values.description} onChange={validation.handleChange} />
                            </div>
                        </ModalBody>
                        <div className="modal-footer">
                            <Button color="light" onClick={() => setSettingsModal(false)}>Annuler</Button>
                            <Button color="success" type="submit">Enregistrer</Button>
                        </div>
                    </Form>
                </Modal>
                <ToastContainer closeButton={false} limit={1} />
            </Container>
        </div>
    );
};

export default WebsiteCategoriesManager;
