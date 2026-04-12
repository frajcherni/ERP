import React, { useEffect, useState, useMemo, useCallback , useRef} from "react";
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
    InputGroup,
    Table,
    Dropdown,
    DropdownToggle,
    DropdownMenu,
    Button,
    DropdownItem
} from "reactstrap";
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import TableContainer from "../../../Components/Common/TableContainer";
import Loader from "../../../Components/Common/Loader";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import * as Yup from "yup";
import { useFormik } from "formik";
import {
    fetchArticles,
    removeArticleWebsiteImage,
    updateArticleWebsiteSettings,
    uploadArticleWebsiteImages
} from "../../../Components/Article/ArticleServices";

import { Article } from "../../../Components/Article/Interfaces";

const WebsiteArticlesManager = () => {
    const [articles, setArticles] = useState<Article[]>([]);
    const [websiteArticles, setWebsiteArticles] = useState<Article[]>([]);
    const [searchText, setSearchText] = useState("");
    const [searchResults, setSearchResults] = useState<Article[]>([]);
    const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);
    const [settingsModal, setSettingsModal] = useState(false);
    const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
    const [loading, setLoading] = useState(true);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [selectedImages, setSelectedImages] = useState<File[]>([]);
    const searchContainerRef = useRef<HTMLDivElement>(null);
    const API_BASE = process.env.REACT_APP_API_BASE;

    // Add image preview modal state
const [previewModal, setPreviewModal] = useState(false);
const [previewImage, setPreviewImage] = useState<string>('');

// Add this function to handle image preview
const handleImagePreview = (imageUrl: string) => {
    setPreviewImage(imageUrl);
    setPreviewModal(true);
};

    // Fetch all articles
    const fetchData = useCallback(async () => {
        debugger
        try {
            setLoading(true);
            const articlesData = await fetchArticles();
             const activeArticles = articlesData

            const formattedArticles = activeArticles.map((a: any) => ({
                ...a,
                type: a.type?.toLowerCase() === "consigné" ? "Consigné" : "Non Consigné",
                createdAt: a.createdAt || new Date().toISOString(),
                taux_fodec: Boolean(a.taux_fodec),
                tva: a.tva ? a.tva.toString() : "0",
                pua_ht: Number(a.pua_ht) || 0,
                puv_ht: Number(a.puv_ht) || 0,
                // Website specific fields
                on_website: Boolean(a.on_website),
                is_offre: Boolean(a.is_offre),
                is_top_seller: Boolean(a.is_top_seller),
                is_new_arrival: Boolean(a.is_new_arrival),
                website_images: a.website_images || [], // Use website_images (not websiteImages)
                website_description: a.website_description || ""
            }));

            setArticles(formattedArticles);
            
            // Get articles that are already on website
            const websiteArticles = formattedArticles.filter((a: any) => a.on_website);
            setWebsiteArticles(websiteArticles);
            
            setLoading(false);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Échec du chargement des données");
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Search functionality with 3 characters minimum
    const handleSearch = useCallback((text: string) => {
        setSearchText(text);
        
        if (text.length >= 3) {
            const searchLower = text.toLowerCase();
            // Filter from original articles, not the current state which might be outdated
            const allArticles = articles.filter(art => !art.on_website); // Only show articles not on website
            const results = allArticles.filter(art =>
                art.reference.toLowerCase().includes(searchLower) ||
                art.designation.toLowerCase().includes(searchLower) ||
                art.designation.toLowerCase().includes(searchLower) ||
                (art.categorie?.nom && art.categorie.nom.toLowerCase().includes(searchLower))
            );
            
            setSearchResults(results);
            setSearchDropdownOpen(true);
        } else {
            setSearchResults([]);
            setSearchDropdownOpen(false);
        }
    }, [articles]); // Depend on articles array
    
    // Add article to website - FIXED to refetch data after successful add
    const handleAddToWebsite = useCallback(async (articleToAdd: Article, event?: React.MouseEvent) => {
        if (event) {
            event.stopPropagation(); // Prevent click from bubbling up
        }
        
        try {
            setSearchDropdownOpen(false); // Close dropdown immediately
            setSearchText(""); // Clear search
            
            // Update article to be on website
            await updateArticleWebsiteSettings(articleToAdd.id, {
                on_website: true,
                is_offre: false,
                is_top_seller: false,
                is_new_arrival: false,
                website_description: articleToAdd.designation || ""
            });
    
            // Refetch data to get fresh state from server
            await fetchData();
            
            toast.success(`Article "${articleToAdd.designation}" ajouté au site web`);
        } catch (err) {
            toast.error("Échec de l'ajout au site web");
            await fetchData();
            setSearchDropdownOpen(true); // Reopen dropdown on error
            setSearchText(articleToAdd.designation); // Restore search text
        }
    }, [fetchData]);

  
    // Remove article from website
    const handleRemoveFromWebsite = useCallback(async (articleId: number) => {
        try {
            await updateArticleWebsiteSettings(articleId, {
                on_website: false,
                is_offre: false,
                is_top_seller: false,
                is_new_arrival: false
            });

            setWebsiteArticles(prev => prev.filter(art => art.id !== articleId));
            setArticles(prev => prev.map(art => 
                art.id === articleId ? { ...art, on_website: false } : art
            ));
            
            toast.success("Article retiré du site web");
        } catch (err) {
            toast.error("Échec du retrait du site web");
        }
    }, []);



    // Handle image upload
    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files) {
            const newImages = Array.from(files);
            setSelectedImages(prev => [...prev, ...newImages]);
            
            // Create preview URLs
            newImages.forEach(file => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    setImagePreviews(prev => [...prev, e.target?.result as string]);
                };
                reader.readAsDataURL(file);
            });
        }
    };

// Remove image handler
const handleRemoveImage = async (index: number) => {
    try {
        const preview = imagePreviews[index];
        const isNewImage = preview.startsWith('data:');

        if (!isNewImage) {
            if (selectedArticle) {
                await removeArticleWebsiteImage(selectedArticle.id, index);
            }
        }

        // Remove from previews
        setImagePreviews(prev => prev.filter((_, i) => i !== index));

        // If new, remove from selectedImages
        if (isNewImage) {
            const newStartIndex = imagePreviews.length - selectedImages.length;
            const fileIndex = index - newStartIndex;
            setSelectedImages(prev => prev.filter((_, i) => i !== fileIndex));
        }

        // Update local article state for old images
        if (!isNewImage && selectedArticle) {
            const updatedImages = selectedArticle.website_images?.filter((_, i) => i !== index) || [];
            const updatedArticle = { ...selectedArticle, website_images: updatedImages };
            setSelectedArticle(updatedArticle);
            setArticles(prev => prev.map(a => a.id === selectedArticle.id ? updatedArticle : a));
            setWebsiteArticles(prev => prev.map(a => a.id === selectedArticle.id ? updatedArticle : a));
        }

        toast.success("Image supprimée avec succès");
    } catch (err) {
        toast.error("Échec de la suppression de l'image");
    }
};

useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
            setSearchDropdownOpen(false);
        }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
}, []);

// Also update the handleOpenSettings to ensure fresh data
const handleOpenSettings = useCallback(async (article: Article) => {
    try {
        // Refetch the specific article to ensure we have the latest data
        const freshArticles = await fetchArticles();
        const freshArticle = freshArticles.find(a => a.id === article.id);
        
        if (freshArticle) {
            setSelectedArticle(freshArticle);
            setImagePreviews(freshArticle.website_images || []);
        } else {
            setSelectedArticle(article);
            setImagePreviews(article.website_images || []);
        }
        setSelectedImages([]);
        setSettingsModal(true);
    } catch (error) {
        // Fallback to cached data
        setSelectedArticle(article);
        setImagePreviews(article.website_images || []);
        setSelectedImages([]);
        setSettingsModal(true);
    }
}, []);

    // Form validation
const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
        is_offre: selectedArticle?.is_offre || false,
        is_top_seller: selectedArticle?.is_top_seller || false,
        is_new_arrival: selectedArticle?.is_new_arrival || false,
        website_description: selectedArticle?.website_description || ""
    },
    validationSchema: Yup.object({
        website_description: Yup.string().max(500, "La description ne doit pas dépasser 500 caractères")
    }),
    onSubmit: async (values) => {
        if (!selectedArticle) return;

        try {
            // First update website settings
            await updateArticleWebsiteSettings(selectedArticle.id, values);

            let updatedArticle = { 
                ...selectedArticle, 
                ...values
            };

            // Then upload new images if any
            const hadNewImages = selectedImages.length > 0;
            if (hadNewImages) {
                await uploadArticleWebsiteImages(selectedArticle.id, selectedImages);
                // Refetch to get updated images from server
                await fetchData();
            } else {
                // No new images, update local state
                setArticles(prev => prev.map(art => 
                    art.id === selectedArticle.id ? updatedArticle : art
                ));
                
                setWebsiteArticles(prev => prev.map(art => 
                    art.id === selectedArticle.id ? updatedArticle : art
                ));
            }

            setSettingsModal(false);
            setSelectedImages([]);
            setImagePreviews([]);
            toast.success("Paramètres mis à jour avec succès");
        } catch (err) {
            toast.error("Échec de la mise à jour des paramètres");
        }
    }
});

    // Columns for website articles table
    const columns = useMemo(
        () => [
            {
                header: "Image",
                accessorKey: "image",
                enableColumnFilter: false,
                cell: (cell: any) => {
                    const article = cell.row.original;
                    // Use website_images for additional images count
                    const mainImage = article.image;
                    const hasAdditionalImages = article.website_images && article.website_images.length > 0;
                    
                    return (
                        <div className="d-flex align-items-center">
                            {mainImage ? (
                                <img 
                                    src={`${API_BASE}/${mainImage.replace(/\\/g, "/")}`}
                                    alt={article.nom}
                                    className="rounded"
                                    style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                                />
                            ) : hasAdditionalImages ? (
                                <img 
                                    src={`${API_BASE}/${article.website_images[0].replace(/\\/g, "/")}`}
                                    alt={article.nom}
                                    className="rounded"
                                    style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                                />
                            ) : (
                                <div 
                                    className="rounded bg-light d-flex align-items-center justify-content-center"
                                    style={{ width: '50px', height: '50px' }}
                                >
                                    <i className="ri-image-line text-muted"></i>
                                </div>
                            )}
                            {article.website_images && article.website_images.length > 1 && (
                                <Badge color="info" className="ms-1">
                                    +{article.website_images.length - 1}
                                </Badge>
                            )}
                        </div>
                    );
                },
            },
            {
                header: "Référence",
                accessorKey: "reference",
                enableColumnFilter: false,
            },
            
            {
                header: "Désignation",
                accessorKey: "designation",
                enableColumnFilter: false,
            },
            {
                header: "Prix de vente (TTC)",
                accessorKey: "puv_ttc",
                enableColumnFilter: false,
                cell: (cell: any) => {
                    const value = cell.getValue();
                    return <>{value != null ? Number(value).toFixed(2) : '0.00'} TND</>;
                },
            },
            {
                header: "Offre",
                accessorKey: "is_offre",
                enableColumnFilter: false,
                cell: (cell: any) => (
                    <Badge color={cell.getValue() ? "success" : "secondary"}>
                        {cell.getValue() ? "✔" : "✘"}
                    </Badge>
                ),
            },
            {
                header: "Top Vente",
                accessorKey: "is_top_seller",
                enableColumnFilter: false,
                cell: (cell: any) => (
                    <Badge color={cell.getValue() ? "warning" : "secondary"}>
                        {cell.getValue() ? "✔" : "✘"}
                    </Badge>
                ),
            },
            {
                header: "Nouveauté",
                accessorKey: "is_new_arrival",
                enableColumnFilter: false,
                cell: (cell: any) => (
                    <Badge color={cell.getValue() ? "info" : "secondary"}>
                        {cell.getValue() ? "✔" : "✘"}
                    </Badge>
                ),
            },
            {
                header: "Action",
                cell: (cellProps: any) => {
                    const article = cellProps.row.original;
                    return (
                        <div className="hstack gap-2">
                            <Button
                                color="primary"
                                size="sm"
                                onClick={() => handleOpenSettings(article)}
                            >
                                <i className="ri-settings-line me-1"></i> Paramètres
                            </Button>
                            <Button
                            color="danger"
                            size="sm"
                            onClick={() => handleRemoveFromWebsite(article.id)}
                        >
                            <i className="ri-delete-bin-line me-1"></i> Retirer
                        </Button>
                        </div>
                    );
                },
            },
        ],
        [handleOpenSettings, handleRemoveFromWebsite]
    );

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title="Gestion du Site Web" pageTitle="Site Web" />

                <Row>
                    <Col lg={12}>
                        <Card>
                            <CardHeader className="card-header border-0">
                                <Row className="align-items-center gy-3">
                                    <div className="col-sm">
                                        <h5 className="card-title mb-0">Articles sur le Site Web</h5>
                                    </div>
                                    <div className="col-sm-auto">
                                        <div className="d-flex gap-1 flex-wrap">
                                            <span className="badge bg-success">
                                                {websiteArticles.length} article(s) sur le site
                                            </span>
                                        </div>
                                    </div>
                                </Row>
                            </CardHeader>

                            <CardBody className="pt-0">
                                {/* Search Section */}
                                <Row className="mb-4">
    <Col md={8}>
        <div className="position-relative" ref={searchContainerRef}>
            <Input
                type="text"
                className="form-control search-input"
                placeholder="Rechercher des articles à ajouter au site web (3 caractères minimum)..."
                value={searchText}
                onChange={(e) => handleSearch(e.target.value)}
                autoComplete="off"
                onFocus={() => {
                    if (searchText.length >= 3) {
                        setSearchDropdownOpen(true);
                    }
                }}
            />
            <i 
                className={`ri-search-line search-icon position-absolute pointer-events-none ${
                    searchText.length >= 3 ? 'text-primary' : 'text-muted'
                }`}
                style={{ 
                    right: '15px', 
                    top: '50%', 
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                    zIndex: 4 
                }}
            ></i>
            
            {/* Dropdown for search results */}
            {searchDropdownOpen && searchResults.length > 0 && (
                <div 
                    className="position-absolute w-100 shadow-lg border rounded bg-white z-3 dropdown-search-results"
                    style={{ 
                        top: 'calc(100% + 5px)', 
                        maxHeight: '300px', 
                        overflowY: 'auto',
                        background: 'white'
                    }}
                >
                    {searchResults.map(article => (
                        <div 
                            key={article.id}
                            className="p-3 border-bottom d-flex justify-content-between align-items-center search-result-item"
                            onClick={(e) => handleAddToWebsite(article, e)}
                            style={{ 
                                cursor: 'pointer',
                                transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#f8f9fa';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'white';
                            }}
                        >
                            <div className="flex-grow-1 pe-3">
                                <div className="fw-semibold text-truncate" style={{ maxWidth: '200px' }}>
                                    {article.reference} - {article.designation}
                                </div>
                                <small className="text-muted d-block">{article.designation}</small>
                                {article.categorie?.nom && (
                                    <small className="text-muted">
                                        {article.categorie.nom}
                                    </small>
                                )}
                            </div>
                            <Badge color="success">
                                <i className="ri-add-line me-1"></i> Ajouter
                            </Badge>
                        </div>
                    ))}
                </div>
            )}
            
            {/* No results message */}
            {searchDropdownOpen && searchText.length >= 3 && searchResults.length === 0 && (
                <div 
                    className="position-absolute w-100 shadow-lg border rounded bg-white z-3 p-3 text-center no-results-dropdown"
                    style={{ top: 'calc(100% + 5px)' }}
                >
                    <i className="ri-search-eye-line fs-4 text-muted mb-2 d-block"></i>
                    <div className="text-muted">Aucun article trouvé</div>
                </div>
            )}
        </div>
    </Col>
    <Col md={4}>
        <div className="text-end">
            <Button color="primary" onClick={() => fetchData()}>
                <i className="ri-refresh-line me-1"></i> Actualiser
            </Button>
        </div>
    </Col>
</Row>

                                {/* Website Articles Table */}
                                {loading ? (
                                    <Loader />
                                ) : websiteArticles.length > 0 ? (
                                    <TableContainer
                                        columns={columns}
                                        data={websiteArticles}
                                        isGlobalFilter={false}
                                        customPageSize={10}
                                        divClass="table-responsive table-card mb-1"
                                        tableClass="align-middle table-nowrap"
                                        theadClass="table-light text-muted text-uppercase"
                                    />
                                ) : (
                                    <div className="text-center py-5">
                                        <i className="ri-store-2-line display-4 text-muted"></i>
                                        <h5 className="mt-3">Aucun article sur le site web</h5>
                                        <p className="text-muted">
                                            Utilisez la barre de recherche ci-dessus pour ajouter des articles à votre site web.
                                        </p>
                                    </div>
                                )}
                            </CardBody>
                        </Card>
                    </Col>
                </Row>

                {/* Settings Modal */}
                <Modal isOpen={settingsModal} toggle={() => setSettingsModal(false)} centered size="lg">
                    <ModalHeader toggle={() => setSettingsModal(false)}>
                        Paramètres Site Web - {selectedArticle?.designation}
                    </ModalHeader>
                    <Form onSubmit={validation.handleSubmit}>
                        <ModalBody>
                            {selectedArticle && (
                                <>
                                    {/* Article Info */}
                                    <Row className="mb-3">
                                        <Col md={6}>
                                            <Label className="form-label fw-semibold">Référence</Label>
                                            <p>{selectedArticle.reference}</p>
                                        </Col>
                                        <Col md={6}>
                                            <Label className="form-label fw-semibold">Prix de vente TTC</Label>
                                            <p>{selectedArticle.puv_ttc ? Number(selectedArticle.puv_ttc).toFixed(2) : '0.00'} TND</p>
                                        </Col>
                                    </Row>

                                    {/* Status Settings */}
                                    <Row className="mb-3">
                                        <Col md={4}>
                                            <div className="form-check form-switch">
                                                <Input
                                                    name="is_offre"
                                                    type="checkbox"
                                                    className="form-check-input"
                                                    onChange={validation.handleChange}
                                                    checked={validation.values.is_offre}
                                                    id="offreSwitch"
                                                />
                                                <Label className="form-check-label fw-semibold" for="offreSwitch">
                                                    En Offre
                                                </Label>
                                            </div>
                                        </Col>
                                        <Col md={4}>
                                            <div className="form-check form-switch">
                                                <Input
                                                    name="is_top_seller"
                                                    type="checkbox"
                                                    className="form-check-input"
                                                    onChange={validation.handleChange}
                                                    checked={validation.values.is_top_seller}
                                                    id="topSellerSwitch"
                                                />
                                                <Label className="form-check-label fw-semibold" for="topSellerSwitch">
                                                    Top Vente
                                                </Label>
                                            </div>
                                        </Col>
                                        <Col md={4}>
                                            <div className="form-check form-switch">
                                                <Input
                                                    name="is_new_arrival"
                                                    type="checkbox"
                                                    className="form-check-input"
                                                    onChange={validation.handleChange}
                                                    checked={validation.values.is_new_arrival}
                                                    id="newArrivalSwitch"
                                                />
                                                <Label className="form-check-label fw-semibold" for="newArrivalSwitch">
                                                    Nouveauté
                                                </Label>
                                            </div>
                                        </Col>
                                    </Row>

                                    {/* Description */}
                                    <Row className="mb-3">
                                        <Col md={12}>
                                            <Label for="website_description" className="form-label fw-semibold">Description pour le site web</Label>
                                            <Input
                                                type="textarea"
                                                name="website_description"
                                                id="website_description"
                                                rows={4}
                                                value={validation.values.website_description}
                                                onChange={validation.handleChange}
                                                onBlur={validation.handleBlur}
                                                invalid={!!(validation.touched.website_description && validation.errors.website_description)}
                                            />
                                            {validation.touched.website_description && validation.errors.website_description ? (
                                                <FormFeedback type="invalid">{validation.errors.website_description}</FormFeedback>
                                            ) : null}
                                        </Col>
                                    </Row>

                                    {/* Images Management */}
                                    <Row className="mb-3">
                                        <Col md={12}>
                                            <Label className="form-label fw-semibold">Images supplémentaires</Label>
                                            
                                            {/* Current Images */}
{imagePreviews.length > 0 && (
    <div className="mb-3">
        <Row>
            {imagePreviews.map((preview, index) => (
                <Col md={3} key={index} className="mb-2">
                    <div className="position-relative">
                        <img 
                            src={preview.startsWith('data:') ? preview : `${API_BASE}/${preview.replace(/\\/g, "/")}`}
                            alt={`Preview ${index + 1}`}
                            className="img-fluid rounded border"
                            style={{ 
                                height: '80px', 
                                objectFit: 'cover', 
                                width: '100%',
                                cursor: 'pointer' 
                            }}
                            onClick={() => handleImagePreview(preview.startsWith('data:') ? preview : `${API_BASE}/${preview.replace(/\\/g, "/")}`)}
                        />
                        <Button
                            color="danger"
                            size="sm"
                            className="position-absolute top-0 end-0"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveImage(index);
                            }}
                            style={{ transform: 'translate(50%, -50%)' }}
                        >
                            <i className="ri-close-line"></i>
                        </Button>
                    </div>
                </Col>
            ))}
        </Row>
    </div>
)}

{/* Main Image from Article */}
{selectedArticle.image && (
    <div className="mb-3">
        <Label className="form-label">Image principale:</Label>
        <div className="border rounded p-2">
            <img 
                src={`${API_BASE}/${selectedArticle.image.replace(/\\/g, "/")}`}
                alt={selectedArticle.nom}
                className="img-fluid rounded"
                style={{ 
                    maxHeight: '150px', 
                    objectFit: 'cover',
                    cursor: 'pointer'
                }}
                onClick={() => handleImagePreview(`${API_BASE}/${selectedArticle.image.replace(/\\/g, "/")}`)}
            />
            <small className="text-muted d-block mt-1">
                Image principale de l'article
            </small>
        </div>
    </div>
)}

                                            {/* Add More Images */}
                                            <div className="border rounded p-3 text-center">
                                                <i className="ri-image-line fs-1 text-muted mb-2 d-block"></i>
                                                <Label htmlFor="additional-images" className="btn btn-outline-primary">
                                                    <i className="ri-upload-line align-middle me-1"></i>
                                                    Ajouter des images supplémentaires
                                                </Label>
                                                <Input
                                                    id="additional-images"
                                                    name="additionalImages"
                                                    type="file"
                                                    accept="image/*"
                                                    multiple
                                                    onChange={handleImageUpload}
                                                    className="d-none"
                                                />
                                                <small className="text-muted d-block mt-2">
                                                    Formats supportés: JPG, PNG, GIF. Taille max: 5MB par image
                                                </small>
                                            </div>
                                        </Col>
                                    </Row>
                                </>
                            )}
                        </ModalBody>
                        <div className="modal-footer">
                            <Button
                                type="button"
                                color="light"
                                onClick={() => setSettingsModal(false)}
                            >
                                Annuler
                            </Button>
                            <Button type="submit" color="success">
                                <i className="ri-save-line me-1"></i> Enregistrer
                            </Button>
                        </div>
                    </Form>
                </Modal>
{/* Image Preview Modal */}
<Modal isOpen={previewModal} toggle={() => setPreviewModal(false)} size="lg" centered>
    <ModalHeader toggle={() => setPreviewModal(false)}>
        Aperçu de l'image
    </ModalHeader>
    <ModalBody className="text-center">
        <img 
            src={previewImage} 
            alt="Preview" 
            className="img-fluid"
            style={{ maxHeight: '70vh', objectFit: 'contain' }}
        />
    </ModalBody>
    <div className="modal-footer">
        <Button color="secondary" onClick={() => setPreviewModal(false)}>
            Fermer
        </Button>
    </div>
</Modal>
                <ToastContainer closeButton={false} limit={1} />
            </Container>
        </div>
    );
};

export default WebsiteArticlesManager;