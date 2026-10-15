import React, { useEffect, useState, useCallback } from "react";
import {
  Card, CardBody, Col, Container, CardHeader, Row,
  Form, Label, Input, Button, FormGroup, Spinner
} from "reactstrap";
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import DeleteModal from "../../../Components/Common/DeleteModal";
import Loader from "../../../Components/Common/Loader";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
  fetchSiteSetting, updateSiteSetting, removeSiteLogo,
  removeShowroomImage, SiteSetting, getImageUrl
} from "../../../Components/Article/SiteSettingServices";
import { fetchCategories } from "../../../Components/Article/ArticleServices";
import { Categorie } from "../../../Components/Article/Interfaces";
import { flattenCategoryTree } from "../../../Components/Article/CategoryTree";

/** A category with its depth in the tree, for the footer menu picker. */
interface CategoryRow {
  categorie: Categorie;
  depth: number;
}

/** Kept in step with FALLBACK_CATEGORIES in the shop's Footer component. */
const FOOTER_FALLBACK_COUNT = 8;

/** The uppercase column label the shop's footer puts above À propos / Contact. */
const FT_HEADING: React.CSSProperties = {
  color: "rgba(255,255,255,.45)",
  fontSize: ".72rem",
  fontWeight: 700,
  letterSpacing: ".14em",
  textTransform: "uppercase",
  marginBottom: ".75rem",
};

const WebsiteLogo = () => {
  const [setting, setSetting] = useState<SiteSetting | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  /* ── FOOTER CATEGORY MENU ──────────────────────────────────────
     Kept outside Formik: the value is an ordered id list driven by
     checkboxes, not a text input, and the order is meaningful. */
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [footerCatIds, setFooterCatIds] = useState<number[]>([]);
  const [catSearch, setCatSearch] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [removeModal, setRemoveModal] = useState(false);

  const [selectedShowroomImage, setSelectedShowroomImage] = useState<File | null>(null);
  const [showroomImagePreview, setShowroomImagePreview] = useState<string | null>(null);
  const [removeShowroomModal, setRemoveShowroomModal] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchSiteSetting();
      setSetting(data);
      setFooterCatIds(data.footer_category_ids || []);
    } catch {
      toast.error("Échec du chargement des paramètres du site");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* Categories load on their own: the footer menu picker is one card on this
     page, so a failing category list must not blank out the whole form. */
  useEffect(() => {
    let alive = true;
    fetchCategories()
      .then((data) => { if (alive) setCategories(data); })
      .catch(() => toast.error("Échec du chargement des catégories"));
    return () => { alive = false; };
  }, []);

  /* A previously saved id can point at a category that is no longer eligible
     (on_website/show_in_univers turned off since) — the shop's footer would
     drop it silently, so it is unchecked here too the moment the real
     category list is known, instead of staying "checked" but invisible. */
  useEffect(() => {
    if (categories.length === 0) return;
    setFooterCatIds((prev) => {
      const next = prev.filter((id) => {
        const c = categories.find((cat) => Number(cat.id) === Number(id));
        return c ? !!(c.on_website || c.show_in_univers) : true;
      });
      return next.length === prev.length ? prev : next;
    });
  }, [categories]);

  /* The category list lets a category sit under any other, at any depth, so
     the picker walks the whole tree instead of stopping at root + children:
     a third-level category was simply unreachable here. The shop's own order
     (website_order, then name) is kept, since this list mirrors the band. */
  const categoryRows: CategoryRow[] = React.useMemo(() => {
    const byOrder = (a: Categorie, b: Categorie) =>
      (a.website_order || 0) - (b.website_order || 0) || a.nom.localeCompare(b.nom);
    return flattenCategoryTree(categories, byOrder) as CategoryRow[];
  }, [categories]);

  /** id → category, so the preview can resolve the picked ids in order. */
  const categoryById = React.useMemo(() => {
    const map = new Map<number, Categorie>();
    categories.forEach((c) => map.set(Number(c.id), c));
    return map;
  }, [categories]);

  /* The shop's footer only ever sees categories the API serves with
     ?onWebsite=true — i.e. flagged on_website or show_in_univers (see
     categorieController.getAll). A category outside that set can be checked
     here but will never resolve on the site, so the picker must not offer it
     as if it were a real choice. */
  const isFooterEligible = (c: Categorie) => !!(c.on_website || c.show_in_univers);

  /** Rows narrowed by the search box. A match keeps its whole branch below
      it, and keeps the parents above it so the indentation still reads. */
  const visibleRows = React.useMemo(() => {
    const q = catSearch.trim().toLowerCase();
    if (!q) return categoryRows;
    const hit = categoryRows.map((r) => r.categorie.nom.toLowerCase().includes(q));

    // A category that matches takes its descendants with it.
    const ancestors: boolean[] = [];
    const underHit = categoryRows.map((r, i) => {
      ancestors.length = r.depth;
      const inherited = ancestors.some(Boolean);
      ancestors[r.depth] = hit[i] || inherited;
      return inherited;
    });

    // A match deeper down keeps the parents that lead to it.
    const overHit = categoryRows.map((r, i) => {
      for (let j = i + 1; j < categoryRows.length; j++) {
        if (categoryRows[j].depth <= r.depth) break;
        if (hit[j]) return true;
      }
      return false;
    });

    return categoryRows.filter((_, i) => hit[i] || underHit[i] || overHit[i]);
  }, [categoryRows, catSearch]);

  /** Adds to the end of the list (order = display order) or removes. */
  const toggleFooterCat = (id: number) =>
    setFooterCatIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const moveFooterCat = (index: number, dir: -1 | 1) =>
    setFooterCatIds((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

  /** Ids whose category has since been deleted are dropped from the preview. */
  const pickedCategories = footerCatIds
    .map((id) => categoryById.get(Number(id)))
    .filter((c): c is Categorie => !!c);

  /* With nothing picked the site falls back to its first root categories, so the
     preview shows that same list rather than an empty box. Mirrors the shop:
     roots flagged on_website, in the order the API returns them. */
  const fallbackCategories = React.useMemo(
    () => categories.filter((c) => !c.parent_id && c.on_website).slice(0, FOOTER_FALLBACK_COUNT),
    [categories]
  );

  /** Exactly what the footer band will render, picked list or fallback. */
  const previewCategories =
    pickedCategories.length > 0 ? pickedCategories : fallbackCategories;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleShowroomImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedShowroomImage(file);
      setShowroomImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (values: any) => {
    const formData = new FormData();
    formData.append("brand_name", values.brand_name);
    formData.append("show_name", String(values.show_name));
    formData.append("logo_height", String(values.logo_height ?? 34));
    formData.append("deals_title", values.deals_title);
    formData.append("deals_description", values.deals_description);
    formData.append("deals_btn_label", values.deals_btn_label);
    formData.append("showroom_active", String(values.showroom_active));
    formData.append("showroom_title", values.showroom_title);
    formData.append("showroom_description", values.showroom_description);
    formData.append("showroom_btn_label", values.showroom_btn_label);
    formData.append("showroom_btn_link", values.showroom_btn_link);
    formData.append("footer_about_title", values.footer_about_title);
    formData.append("footer_about_text", values.footer_about_text);
    // Multipart can't carry an array — the API parses this back on receipt.
    formData.append("footer_category_ids", JSON.stringify(footerCatIds));
    formData.append("facebook_url", values.facebook_url);
    formData.append("instagram_url", values.instagram_url);
    formData.append("tiktok_url", values.tiktok_url);
    formData.append("contact_address", values.contact_address);
    formData.append("contact_phone", values.contact_phone);
    formData.append("contact_email", values.contact_email);
    formData.append("working_hours_week", values.working_hours_week);
    formData.append("working_hours_friday", values.working_hours_friday);
    if (selectedImage) formData.append("logo", selectedImage);
    if (selectedShowroomImage) formData.append("showroom_image", selectedShowroomImage);

    try {
      setSaving(true);
      const updated = await updateSiteSetting(formData);
      setSetting(updated);
      setFooterCatIds(updated.footer_category_ids || []);
      setSelectedImage(null);
      setImagePreview(null);
      setSelectedShowroomImage(null);
      setShowroomImagePreview(null);
      toast.success("Paramètres du site mis à jour");
    } catch (e: any) {
      toast.error(e.message || "Échec de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveLogo = async () => {
    try {
      const updated = await removeSiteLogo();
      setSetting(updated);
      setSelectedImage(null);
      setImagePreview(null);
      setRemoveModal(false);
      toast.success("Logo supprimé — le site affiche de nouveau le texte");
    } catch {
      toast.error("Échec de la suppression du logo");
    }
  };

  const handleRemoveShowroomImage = async () => {
    try {
      const updated = await removeShowroomImage();
      setSetting(updated);
      setSelectedShowroomImage(null);
      setShowroomImagePreview(null);
      setRemoveShowroomModal(false);
      toast.success("Photo supprimée — le site affiche de nouveau l'image par défaut");
    } catch {
      toast.error("Échec de la suppression de la photo");
    }
  };

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      brand_name: setting?.brand_name || "",
      show_name: setting?.show_name ?? true,
      logo_height: setting?.logo_height ?? 34,
      deals_title: setting?.deals_title || "",
      deals_description: setting?.deals_description || "",
      deals_btn_label: setting?.deals_btn_label || "",
      showroom_active: setting?.showroom_active ?? true,
      showroom_title: setting?.showroom_title || "",
      showroom_description: setting?.showroom_description || "",
      showroom_btn_label: setting?.showroom_btn_label || "",
      showroom_btn_link: setting?.showroom_btn_link || "",
      footer_about_title: setting?.footer_about_title || "",
      footer_about_text: setting?.footer_about_text || "",
      facebook_url: setting?.facebook_url || "",
      instagram_url: setting?.instagram_url || "",
      tiktok_url: setting?.tiktok_url || "",
      contact_address: setting?.contact_address || "",
      contact_phone: setting?.contact_phone || "",
      contact_email: setting?.contact_email || "",
      working_hours_week: setting?.working_hours_week || "",
      working_hours_friday: setting?.working_hours_friday || "",
    },
    validationSchema: Yup.object({
      brand_name: Yup.string().required("Le nom de la marque est obligatoire"),
      logo_height: Yup.number()
        .min(16, "Minimum 16px").max(120, "Maximum 120px")
        .required("La hauteur est obligatoire"),
      deals_title: Yup.string().required("Le titre est obligatoire"),
      showroom_title: Yup.string().required("Le titre est obligatoire"),
      showroom_btn_link: Yup.string().url("URL invalide"),
      footer_about_title: Yup.string().required("Le titre est obligatoire"),
      facebook_url: Yup.string().url("URL invalide"),
      instagram_url: Yup.string().url("URL invalide"),
      tiktok_url: Yup.string().url("URL invalide"),
      contact_address: Yup.string().required("L'adresse de localisation est obligatoire"),
      contact_phone: Yup.string().required("Le numéro de téléphone est obligatoire"),
      contact_email: Yup.string().email("E-mail invalide").required("L'adresse e-mail est obligatoire"),
      working_hours_week: Yup.string().required("Les horaires de semaine sont obligatoires"),
      working_hours_friday: Yup.string().required("Les horaires du vendredi sont obligatoires"),
    }),
    onSubmit: handleSubmit,
  });

  const currentLogo = imagePreview || (setting?.logo ? getImageUrl(setting.logo) : null);
  const currentShowroomImage = showroomImagePreview || (setting?.showroom_image ? getImageUrl(setting.showroom_image) : null);

  document.title = "Logo | Site Web";

  return (
    <div className="page-content">
      <DeleteModal
        show={removeModal}
        onDeleteClick={handleRemoveLogo}
        onCloseClick={() => setRemoveModal(false)}
      />
      <DeleteModal
        show={removeShowroomModal}
        onDeleteClick={handleRemoveShowroomImage}
        onCloseClick={() => setRemoveShowroomModal(false)}
      />

      <Container fluid>
        <BreadCrumb title="Paramètres du Site" pageTitle="Site Web" />

        {loading ? <Loader /> : (
          <Form onSubmit={(e) => { e.preventDefault(); validation.handleSubmit(); }}>
            <Row>
              <Col lg={7}>
                <Card>
                  <CardHeader className="border-0">
                    <h5 className="card-title mb-0">Identité de la boutique</h5>
                  </CardHeader>
                  <CardBody className="pt-0">
                    <div className="mb-4">
                      <Label className="form-label">Logo</Label>
                      <div className="border rounded p-4 text-center" style={{ background: "#f8f9fa" }}>
                        {currentLogo ? (
                          <div>
                            <img
                              src={currentLogo}
                              alt="Logo du site"
                              className="rounded mb-2"
                              style={{ maxHeight: 110, maxWidth: "100%", objectFit: "contain" }}
                            />
                            <br />
                            <Label htmlFor="site-logo" className="btn btn-sm btn-outline-primary mt-2 me-2">
                              Changer le logo
                            </Label>
                            {setting?.logo && !imagePreview && (
                              <Button
                                type="button" size="sm" color="outline-danger"
                                className="mt-2"
                                onClick={() => setRemoveModal(true)}
                              >
                                Supprimer
                              </Button>
                            )}
                            {imagePreview && (
                              <Button
                                type="button" size="sm" color="outline-secondary"
                                className="mt-2"
                                onClick={() => { setSelectedImage(null); setImagePreview(null); }}
                              >
                                Annuler la sélection
                              </Button>
                            )}
                          </div>
                        ) : (
                          <div>
                            <i className="ri-image-add-line fs-1 text-muted mb-2 d-block"></i>
                            <Label htmlFor="site-logo" className="btn btn-outline-primary">
                              Télécharger un logo
                            </Label>
                          </div>
                        )}
                        <Input
                          id="site-logo" name="logo" type="file" accept="image/*"
                          onChange={handleImageUpload} className="d-none"
                        />
                        <div className="text-muted small mt-3 mb-0">
                          PNG ou SVG avec fond transparent recommandé. Sans logo, le site
                          affiche le nom de la marque en texte.
                        </div>
                      </div>
                    </div>

                    <Row>
                      <Col md={8}>
                        <div className="mb-3">
                          <Label className="form-label">
                            Nom de la marque <span className="text-danger">*</span>
                          </Label>
                          <Input
                            name="brand_name" placeholder="Ex: LUMIÈRE"
                            onChange={validation.handleChange} onBlur={validation.handleBlur}
                            value={validation.values.brand_name}
                            invalid={!!(validation.touched.brand_name && validation.errors.brand_name)}
                          />
                          {validation.touched.brand_name && validation.errors.brand_name && (
                            <div className="text-danger small">{validation.errors.brand_name as string}</div>
                          )}
                        </div>
                      </Col>
                      <Col md={4}>
                        <div className="mb-3">
                          <Label className="form-label">Hauteur du logo (px)</Label>
                          <Input
                            type="number" name="logo_height" min={16} max={120}
                            onChange={validation.handleChange} onBlur={validation.handleBlur}
                            value={validation.values.logo_height}
                            invalid={!!(validation.touched.logo_height && validation.errors.logo_height)}
                          />
                          {validation.touched.logo_height && validation.errors.logo_height && (
                            <div className="text-danger small">{validation.errors.logo_height as string}</div>
                          )}
                        </div>
                      </Col>
                      <Col md={12}>
                        <FormGroup switch className="mb-2">
                          <Input
                            type="switch" role="switch" name="show_name"
                            checked={validation.values.show_name}
                            onChange={validation.handleChange}
                          />
                          <Label className="form-label ms-2">
                            Afficher le nom de la marque à côté du logo
                          </Label>
                        </FormGroup>
                      </Col>
                    </Row>
                  </CardBody>
                </Card>

                <Card>
                  <CardHeader className="border-0">
                    <h5 className="card-title mb-0">Bande promotions (page d'accueil)</h5>
                    <p className="text-muted small mb-0">
                      Le titre, le texte et le bouton de la bande « bonnes affaires ». Les produits
                      qui y figurent sont gérés depuis Gestion Promotions.
                    </p>
                  </CardHeader>
                  <CardBody className="pt-0">
                    <Row>
                      <Col md={7}>
                        <div className="mb-3">
                          <Label className="form-label">
                            Titre <span className="text-danger">*</span>
                          </Label>
                          <Input
                            name="deals_title" placeholder="Ex: Les bonnes affaires du moment"
                            onChange={validation.handleChange} onBlur={validation.handleBlur}
                            value={validation.values.deals_title}
                            invalid={!!(validation.touched.deals_title && validation.errors.deals_title)}
                          />
                          {validation.touched.deals_title && validation.errors.deals_title && (
                            <div className="text-danger small">{validation.errors.deals_title as string}</div>
                          )}
                        </div>
                      </Col>
                      <Col md={5}>
                        <div className="mb-3">
                          <Label className="form-label">Libellé du bouton</Label>
                          <Input
                            name="deals_btn_label" placeholder="Ex: Voir toutes les promotions"
                            onChange={validation.handleChange} onBlur={validation.handleBlur}
                            value={validation.values.deals_btn_label}
                          />
                        </div>
                      </Col>
                      <Col md={12}>
                        <div className="mb-2">
                          <Label className="form-label">Description</Label>
                          <Input
                            type="textarea" rows={2} name="deals_description"
                            placeholder="Ex: Découvrez nos produits actuellement en promotion."
                            onChange={validation.handleChange} onBlur={validation.handleBlur}
                            value={validation.values.deals_description}
                          />
                        </div>
                        <div className="text-muted small mb-0">
                          Les produits de cette bande viennent de <strong>Gestion Promotions</strong> :
                          seules les promotions actives portant une remise (pourcentage ou prix
                          promotionnel) y apparaissent, avec leur badge rouge.
                        </div>
                      </Col>
                    </Row>
                  </CardBody>
                </Card>

                <Card>
                  <CardHeader className="border-0">
                    <h5 className="card-title mb-0">Bandeau showroom</h5>
                    <p className="text-muted small mb-0">
                      Bande pleine largeur affichée juste au-dessus du pied de page, invitant
                      les clients à venir sur place.
                    </p>
                  </CardHeader>
                  <CardBody className="pt-0">
                    <FormGroup switch className="mb-4">
                      <Input
                        type="switch" role="switch" name="showroom_active"
                        checked={validation.values.showroom_active}
                        onChange={validation.handleChange}
                      />
                      <Label className="form-label ms-2">Afficher le bandeau sur le site</Label>
                    </FormGroup>

                    <div className="mb-4">
                      <Label className="form-label">Photo du showroom</Label>
                      <div className="border rounded p-4 text-center" style={{ background: "#f8f9fa" }}>
                        {currentShowroomImage ? (
                          <div>
                            <img
                              src={currentShowroomImage}
                              alt="Photo du showroom"
                              className="rounded mb-2"
                              style={{ maxHeight: 140, maxWidth: "100%", objectFit: "cover" }}
                            />
                            <br />
                            <Label htmlFor="showroom-image" className="btn btn-sm btn-outline-primary mt-2 me-2">
                              Changer la photo
                            </Label>
                            {setting?.showroom_image && !showroomImagePreview && (
                              <Button
                                type="button" size="sm" color="outline-danger"
                                className="mt-2"
                                onClick={() => setRemoveShowroomModal(true)}
                              >
                                Supprimer
                              </Button>
                            )}
                            {showroomImagePreview && (
                              <Button
                                type="button" size="sm" color="outline-secondary"
                                className="mt-2"
                                onClick={() => { setSelectedShowroomImage(null); setShowroomImagePreview(null); }}
                              >
                                Annuler la sélection
                              </Button>
                            )}
                          </div>
                        ) : (
                          <div>
                            <i className="ri-image-add-line fs-1 text-muted mb-2 d-block"></i>
                            <Label htmlFor="showroom-image" className="btn btn-outline-primary">
                              Télécharger une photo
                            </Label>
                          </div>
                        )}
                        <Input
                          id="showroom-image" name="showroom_image" type="file" accept="image/*"
                          onChange={handleShowroomImageUpload} className="d-none"
                        />
                        <div className="text-muted small mt-3 mb-0">
                          Photo large (paysage) recommandée : elle occupe toute la largeur de l'écran.
                        </div>
                      </div>
                    </div>

                    <Row>
                      <Col md={12}>
                        <div className="mb-3">
                          <Label className="form-label">
                            Titre <span className="text-danger">*</span>
                          </Label>
                          <Input
                            name="showroom_title" placeholder="Ex: Visitez notre showroom"
                            onChange={validation.handleChange} onBlur={validation.handleBlur}
                            value={validation.values.showroom_title}
                            invalid={!!(validation.touched.showroom_title && validation.errors.showroom_title)}
                          />
                          {validation.touched.showroom_title && validation.errors.showroom_title && (
                            <div className="text-danger small">{validation.errors.showroom_title as string}</div>
                          )}
                        </div>
                      </Col>
                      <Col md={12}>
                        <div className="mb-3">
                          <Label className="form-label">Description</Label>
                          <Input
                            type="textarea" rows={2} name="showroom_description"
                            placeholder="Ex: Venez découvrir nos collections en personne…"
                            onChange={validation.handleChange} onBlur={validation.handleBlur}
                            value={validation.values.showroom_description}
                          />
                        </div>
                      </Col>
                      <Col md={5}>
                        <div className="mb-3">
                          <Label className="form-label">Libellé du bouton</Label>
                          <Input
                            name="showroom_btn_label" placeholder="Ex: Découvrir notre showroom"
                            onChange={validation.handleChange} onBlur={validation.handleBlur}
                            value={validation.values.showroom_btn_label}
                          />
                        </div>
                      </Col>
                      <Col md={7}>
                        <div className="mb-2">
                          <Label className="form-label">Lien du bouton</Label>
                          <Input
                            name="showroom_btn_link" placeholder="https://maps.google.com/…"
                            onChange={validation.handleChange} onBlur={validation.handleBlur}
                            value={validation.values.showroom_btn_link}
                            invalid={!!(validation.touched.showroom_btn_link && validation.errors.showroom_btn_link)}
                          />
                          {validation.touched.showroom_btn_link && validation.errors.showroom_btn_link && (
                            <div className="text-danger small">{validation.errors.showroom_btn_link as string}</div>
                          )}
                          <small className="text-muted">
                            Sans lien, le bouton renvoie vers la page Contact du site.
                          </small>
                        </div>
                      </Col>
                    </Row>
                  </CardBody>
                </Card>

                <Card>
                  <CardHeader className="border-0">
                    <h5 className="card-title mb-0">Pied de page</h5>
                  </CardHeader>
                  <CardBody className="pt-0">
                    <div className="mb-3">
                      <Label className="form-label">
                        Titre "À propos" <span className="text-danger">*</span>
                      </Label>
                      <Input
                        name="footer_about_title" placeholder="Ex: À propos"
                        onChange={validation.handleChange} onBlur={validation.handleBlur}
                        value={validation.values.footer_about_title}
                        invalid={!!(validation.touched.footer_about_title && validation.errors.footer_about_title)}
                      />
                      {validation.touched.footer_about_title && validation.errors.footer_about_title && (
                        <div className="text-danger small">{validation.errors.footer_about_title as string}</div>
                      )}
                    </div>
                    <div className="mb-3">
                      <Label className="form-label">Texte "À propos"</Label>
                      <Input
                        type="textarea" rows={3} name="footer_about_text"
                        placeholder="Courte description affichée dans le pied de page"
                        onChange={validation.handleChange} onBlur={validation.handleBlur}
                        value={validation.values.footer_about_text}
                      />
                    </div>

                    <Row>
                      <Col md={4}>
                        <div className="mb-3">
                          <Label className="form-label">Facebook</Label>
                          <Input
                            name="facebook_url" placeholder="https://facebook.com/…"
                            onChange={validation.handleChange} onBlur={validation.handleBlur}
                            value={validation.values.facebook_url}
                            invalid={!!(validation.touched.facebook_url && validation.errors.facebook_url)}
                          />
                          {validation.touched.facebook_url && validation.errors.facebook_url && (
                            <div className="text-danger small">{validation.errors.facebook_url as string}</div>
                          )}
                        </div>
                      </Col>
                      <Col md={4}>
                        <div className="mb-3">
                          <Label className="form-label">Instagram</Label>
                          <Input
                            name="instagram_url" placeholder="https://instagram.com/…"
                            onChange={validation.handleChange} onBlur={validation.handleBlur}
                            value={validation.values.instagram_url}
                            invalid={!!(validation.touched.instagram_url && validation.errors.instagram_url)}
                          />
                          {validation.touched.instagram_url && validation.errors.instagram_url && (
                            <div className="text-danger small">{validation.errors.instagram_url as string}</div>
                          )}
                        </div>
                      </Col>
                      <Col md={4}>
                        <div className="mb-3">
                          <Label className="form-label">TikTok</Label>
                          <Input
                            name="tiktok_url" placeholder="https://tiktok.com/@…"
                            onChange={validation.handleChange} onBlur={validation.handleBlur}
                            value={validation.values.tiktok_url}
                            invalid={!!(validation.touched.tiktok_url && validation.errors.tiktok_url)}
                          />
                          {validation.touched.tiktok_url && validation.errors.tiktok_url && (
                            <div className="text-danger small">{validation.errors.tiktok_url as string}</div>
                          )}
                        </div>
                      </Col>
                    </Row>
                    <div className="text-muted small mb-0">
                      Une icône n'apparaît dans le pied de page du site que si son lien est renseigné.
                    </div>

                    {/* ── Footer category menu ─────────────────────────── */}
                    <h5 className="font-size-14 mb-1 mt-4">Menu catégories du pied de page</h5>
                    <p className="text-muted small mb-3">
                      Choisissez les catégories — et sous-catégories — listées en bas du pied
                      de page du site, juste au-dessus de la ligne de copyright. Sans
                      sélection, le site affiche automatiquement ses premières catégories
                      principales. Seules les catégories déjà visibles sur le site (« Afficher
                      sur le site » ou « Univers ») peuvent être choisies ici.
                    </p>

                    <Row>
                      <Col lg={7}>
                        <div className="mb-2 d-flex align-items-center gap-2">
                          <Input
                            type="search"
                            bsSize="sm"
                            placeholder="Rechercher une catégorie…"
                            value={catSearch}
                            onChange={(e) => setCatSearch(e.target.value)}
                          />
                          {footerCatIds.length > 0 && (
                            <Button
                              type="button" size="sm" color="light"
                              className="text-nowrap"
                              onClick={() => setFooterCatIds([])}
                            >
                              Tout décocher
                            </Button>
                          )}
                        </div>

                        <div
                          className="border rounded p-2"
                          style={{ maxHeight: 340, overflowY: "auto" }}
                        >
                          {categories.length === 0 ? (
                            <div className="text-muted small p-2">
                              Aucune catégorie disponible.
                            </div>
                          ) : visibleRows.length === 0 ? (
                            <div className="text-muted small p-2">
                              Aucune catégorie ne correspond à « {catSearch.trim()} ».
                            </div>
                          ) : (
                            visibleRows.map(({ categorie, depth }) => {
                              const eligible = isFooterEligible(categorie);
                              return (
                                <FormGroup
                                  check
                                  key={categorie.id}
                                  className="mb-1"
                                  style={{ marginLeft: depth * 24 }}
                                >
                                  <Input
                                    type="checkbox"
                                    id={`ftcat-${categorie.id}`}
                                    checked={footerCatIds.includes(Number(categorie.id))}
                                    disabled={!eligible}
                                    onChange={() => toggleFooterCat(Number(categorie.id))}
                                  />
                                  <Label
                                    check
                                    for={`ftcat-${categorie.id}`}
                                    className={
                                      depth === 0
                                        ? eligible
                                          ? "fw-semibold"
                                          : "fw-semibold text-muted"
                                        : "text-muted"
                                    }
                                    style={{ cursor: eligible ? "pointer" : "not-allowed" }}
                                    title={eligible ? undefined : "Non visible sur le site : activez « Afficher sur le site » ou « Univers » pour cette catégorie."}
                                  >
                                    {categorie.nom}
                                    {!eligible && (
                                      <span className="text-muted fw-normal small ms-1">
                                        (masquée sur le site)
                                      </span>
                                    )}
                                  </Label>
                                </FormGroup>
                              );
                            })
                          )}
                        </div>
                        <div className="text-muted small mt-2">
                          {footerCatIds.length} catégorie{footerCatIds.length > 1 ? "s" : ""} sélectionnée
                          {footerCatIds.length > 1 ? "s" : ""}.
                        </div>
                      </Col>

                      {/* Ordering lives next to the picker, so the preview below can stay a
                          plain rendering of the band with no controls on top of it. */}
                      <Col lg={5}>
                        <Label className="form-label">Ordre d'affichage</Label>
                        <div
                          className="border rounded p-2"
                          style={{ maxHeight: 340, overflowY: "auto" }}
                        >
                          {pickedCategories.length === 0 ? (
                            <div className="text-muted small p-2">
                              Aucune sélection — le site affichera ses premières catégories
                              principales.
                            </div>
                          ) : (
                            pickedCategories.map((cat, i) => (
                              <div
                                key={cat.id}
                                className="d-flex align-items-center justify-content-between gap-2 py-1"
                              >
                                <span className="text-truncate">
                                  <span className="text-muted me-2">{i + 1}.</span>
                                  {cat.nom}
                                </span>
                                <span className="d-flex flex-shrink-0" style={{ gap: 2 }}>
                                  <Button
                                    type="button" size="sm" color="light"
                                    className="py-0 px-1"
                                    disabled={i === 0}
                                    onClick={() => moveFooterCat(i, -1)}
                                    title="Monter"
                                  >
                                    <i className="ri-arrow-up-s-line" />
                                  </Button>
                                  <Button
                                    type="button" size="sm" color="light"
                                    className="py-0 px-1"
                                    disabled={i === pickedCategories.length - 1}
                                    onClick={() => moveFooterCat(i, 1)}
                                    title="Descendre"
                                  >
                                    <i className="ri-arrow-down-s-line" />
                                  </Button>
                                  <Button
                                    type="button" size="sm" color="danger" outline
                                    className="py-0 px-1"
                                    onClick={() => toggleFooterCat(Number(cat.id))}
                                    title="Retirer"
                                  >
                                    <i className="ri-close-line" />
                                  </Button>
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                        <div className="text-muted small mt-2">
                          L'ordre ci-dessus est celui affiché sur le site.
                        </div>
                      </Col>
                    </Row>

                    {/* Live preview — the three footer columns on their real dark ground,
                        so the categories are judged in the place they will occupy rather
                        than as a bare list. The brand and contact columns are drawn from
                        the values in this same form. */}
                    <Label className="form-label mt-3">Aperçu du pied de page</Label>
                    <div
                      className="rounded"
                      style={{ background: "#080808", padding: "1.75rem 1.75rem 0" }}
                    >
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1.25fr)",
                          gap: "2rem",
                          alignItems: "start",
                        }}
                      >
                        <div>
                          <div style={FT_HEADING}>
                            {validation.values.footer_about_title || "À propos"}
                          </div>
                          <div
                            style={{
                              color: "rgba(255,255,255,.38)",
                              fontSize: ".78rem",
                              fontWeight: 300,
                              lineHeight: 1.75,
                            }}
                          >
                            {validation.values.footer_about_text || "—"}
                          </div>
                        </div>

                        {/* The column being configured. */}
                        <div>
                          {previewCategories.length === 0 ? (
                            <div
                              style={{
                                color: "rgba(255,255,255,.3)",
                                fontSize: ".8rem",
                                fontStyle: "italic",
                              }}
                            >
                              Aucune catégorie à afficher.
                            </div>
                          ) : (
                            <div
                              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
                            >
                              {previewCategories.map((cat) => (
                                <span
                                  key={cat.id}
                                  style={{
                                    color: "rgba(255,255,255,.55)",
                                    fontSize: ".88rem",
                                    fontWeight: 300,
                                    letterSpacing: ".01em",
                                    lineHeight: 1.45,
                                  }}
                                >
                                  {cat.nom}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div style={{ justifySelf: "end" }}>
                          <div style={FT_HEADING}>Contact</div>
                          {[
                            validation.values.contact_address,
                            validation.values.contact_phone,
                            validation.values.contact_email,
                          ]
                            .filter(Boolean)
                            .map((line, i) => (
                              <div
                                key={i}
                                style={{
                                  color: "rgba(255,255,255,.45)",
                                  fontSize: ".82rem",
                                  fontWeight: 300,
                                  marginBottom: ".5rem",
                                }}
                              >
                                {line}
                              </div>
                            ))}
                        </div>
                      </div>

                      <div
                        style={{
                          borderTop: "1px solid rgba(255,255,255,.07)",
                          marginTop: "1.75rem",
                          padding: "1.1rem 0 1.4rem",
                          textAlign: "center",
                          color: "rgba(255,255,255,.22)",
                          fontSize: ".73rem",
                          fontWeight: 300,
                        }}
                      >
                        © {new Date().getFullYear()} ROYAL LUMIÈRE . Tous droits réservés.
                      </div>
                    </div>
                    <div className="text-muted small mt-2">
                      {pickedCategories.length > 0
                        ? "Les catégories occupent la colonne centrale, entre « À propos » et les coordonnées."
                        : "Sélection vide : voici les catégories que le site affichera automatiquement."}
                    </div>

                    <h5 className="font-size-14 mb-3 mt-4">Informations de Contact & Horaires</h5>
                    <Row>
                      <Col md={6}>
                        <div className="mb-3">
                          <Label className="form-label">Adresse de Localisation</Label>
                          <Input
                            name="contact_address" placeholder="Ex: 15 Rue du Faubourg Saint-Honoré, 75008 Paris"
                            onChange={validation.handleChange} onBlur={validation.handleBlur}
                            value={validation.values.contact_address}
                            invalid={!!(validation.touched.contact_address && validation.errors.contact_address)}
                          />
                          {validation.touched.contact_address && validation.errors.contact_address && (
                            <div className="text-danger small">{validation.errors.contact_address as string}</div>
                          )}
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="mb-3">
                          <Label className="form-label">Numéro de Téléphone</Label>
                          <Input
                            name="contact_phone" placeholder="Ex: +216 20 123 456"
                            onChange={validation.handleChange} onBlur={validation.handleBlur}
                            value={validation.values.contact_phone}
                            invalid={!!(validation.touched.contact_phone && validation.errors.contact_phone)}
                          />
                          {validation.touched.contact_phone && validation.errors.contact_phone && (
                            <div className="text-danger small">{validation.errors.contact_phone as string}</div>
                          )}
                        </div>
                      </Col>
                    </Row>
                    <Row>
                      <Col md={12}>
                        <div className="mb-3">
                          <Label className="form-label">Adresse E-mail</Label>
                          <Input
                            name="contact_email" placeholder="Ex: contact@royallumiere.tn"
                            onChange={validation.handleChange} onBlur={validation.handleBlur}
                            value={validation.values.contact_email}
                            invalid={!!(validation.touched.contact_email && validation.errors.contact_email)}
                          />
                          {validation.touched.contact_email && validation.errors.contact_email && (
                            <div className="text-danger small">{validation.errors.contact_email as string}</div>
                          )}
                        </div>
                      </Col>
                    </Row>
                    <Row>
                      <Col md={6}>
                        <div className="mb-3">
                          <Label className="form-label">Horaires de Travail (Semaine)</Label>
                          <Input
                            name="working_hours_week" placeholder="Ex: Lun - Jeu: 09:00 - 18:00"
                            onChange={validation.handleChange} onBlur={validation.handleBlur}
                            value={validation.values.working_hours_week}
                            invalid={!!(validation.touched.working_hours_week && validation.errors.working_hours_week)}
                          />
                          {validation.touched.working_hours_week && validation.errors.working_hours_week && (
                            <div className="text-danger small">{validation.errors.working_hours_week as string}</div>
                          )}
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="mb-3">
                          <Label className="form-label">Horaires de Travail (Vendredi)</Label>
                          <Input
                            name="working_hours_friday" placeholder="Ex: Ven: 09:00 - 12:00, 14:00 - 18:00"
                            onChange={validation.handleChange} onBlur={validation.handleBlur}
                            value={validation.values.working_hours_friday}
                            invalid={!!(validation.touched.working_hours_friday && validation.errors.working_hours_friday)}
                          />
                          {validation.touched.working_hours_friday && validation.errors.working_hours_friday && (
                            <div className="text-danger small">{validation.errors.working_hours_friday as string}</div>
                          )}
                        </div>
                      </Col>
                    </Row>

                    <div className="text-end mt-3">
                      <Button color="primary" type="submit" disabled={saving}>
                        {saving && <Spinner size="sm" className="me-2" />}
                        Enregistrer
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              </Col>

              {/* Live preview of the shop header so the admin sees the result */}
              <Col lg={5}>
                <Card>
                  <CardHeader className="border-0">
                    <h5 className="card-title mb-0">Aperçu</h5>
                  </CardHeader>
                  <CardBody className="pt-0">
                    <div
                      className="border rounded d-flex align-items-center gap-2 px-3"
                      style={{ background: "#fff", height: 72 }}
                    >
                      {currentLogo && (
                        <img
                          src={currentLogo}
                          alt="Aperçu du logo"
                          style={{
                            height: validation.values.logo_height || 34,
                            width: "auto", objectFit: "contain",
                          }}
                        />
                      )}
                      {(validation.values.show_name || !currentLogo) && (
                        <span
                          style={{
                            fontFamily: "'Cormorant Garamond', Georgia, serif",
                            fontSize: "1.6rem", fontWeight: 500, letterSpacing: "0.22em",
                            color: "#03111f", textTransform: "uppercase",
                          }}
                        >
                          {validation.values.brand_name || "LUMIÈRE"}
                        </span>
                      )}
                    </div>
                    <p className="text-muted small mt-3 mb-0">
                      Rendu approximatif de l'en-tête de la boutique. Le logo est aussi
                      utilisé dans le pied de page et l'écran de chargement.
                    </p>

                  </CardBody>
                </Card>
              </Col>
            </Row>
          </Form>
        )}
      </Container>
      <ToastContainer closeButton={false} limit={1} />
    </div>
  );
};

export default WebsiteLogo;
