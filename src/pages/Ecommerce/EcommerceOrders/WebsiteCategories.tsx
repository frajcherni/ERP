import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import {
    Card, CardBody, Col, Container, CardHeader, Row,
    Modal, ModalHeader, Form, ModalBody, Label, Input,
    Badge, Button, Alert
} from "reactstrap";
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import Loader from "../../../Components/Common/Loader";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useFormik } from "formik";
import { fetchCategories, updateCategorie } from "../../../Components/Article/ArticleServices";
import { Categorie } from "../../../Components/Article/Interfaces";
import { buildSubcategoryOptions, flattenCategoryTree, getAncestorChain } from "../../../Components/Article/CategoryTree";

/** The flags that decide whether a category shows up on the public site. */
type SiteFlag = "on_website" | "show_in_univers";

type CategoryCompare = (a: any, b: any) => number;

/** The shop sorts each level of its menu on its own: order field, then name. */
const byWebsiteOrder: CategoryCompare = (a, b) =>
    (a.website_order || 0) - (b.website_order || 0) || a.nom.localeCompare(b.nom);
const byUniversOrder: CategoryCompare = (a, b) =>
    (a.univers_order || 0) - (b.univers_order || 0) || a.nom.localeCompare(b.nom);

/** Where a category hangs in a displayed list: under its parent when that parent
 *  is in the list too, otherwise at the root — which is also where the shop puts it. */
const treeParentId = (cat: Categorie, ids: Set<number>) =>
    cat.parent_id && ids.has(Number(cat.parent_id)) ? Number(cat.parent_id) : null;

/** `cat` and the categories sharing its level in `list`, in display order. */
const siblingsOf = (list: Categorie[], cat: Categorie, compare: CategoryCompare) => {
    const ids = new Set(list.map(c => Number(c.id)));
    const parent = treeParentId(cat, ids);
    return list.filter(c => treeParentId(c, ids) === parent).sort(compare);
};

/** One row of a search-to-add dropdown: the match itself, or one of its
 *  sous-catégories shown right below it so it can be added in the same pass. */
interface SearchHit {
    categorie: Categorie;
    depth: number;
    isMatch: boolean;
}

const WebsiteCategoriesManager = () => {
    const [categories, setCategories] = useState<Categorie[]>([]);
    const [websiteCategories, setWebsiteCategories] = useState<Categorie[]>([]);
    const [universCategories, setUniversCategories] = useState<Categorie[]>([]);
    const [searchText, setSearchText] = useState("");
    const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);
    const searchContainerRef = useRef<HTMLDivElement>(null);
    const [univSearchText, setUnivSearchText] = useState("");
    const [univSearchDropdownOpen, setUnivSearchDropdownOpen] = useState(false);
    const univSearchContainerRef = useRef<HTMLDivElement>(null);
    const [settingsModal, setSettingsModal] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<Categorie | null>(null);
    const [loading, setLoading] = useState(true);
    const [repairing, setRepairing] = useState(false);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const API_BASE = process.env.REACT_APP_API_BASE;
    const IMAGE_BASE = API_BASE ? API_BASE.replace("/api", "") : "http://localhost:5000";

    const getImageUrl = (path: string | null | undefined) => {
        if (!path) return "";
        if (path.startsWith("http")) return path;
        return `${IMAGE_BASE}/${path.replace(/\\/g, "/")}`;
    };

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setSelectedImage(file);
            const reader = new FileReader();
            reader.onload = (e) => setImagePreview(e.target?.result as string);
            reader.readAsDataURL(file);
        }
    };

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const data = await fetchCategories();
            const formatted = data.map((c: any) => ({
                ...c,
                on_website: Boolean(c.on_website),
                show_in_univers: Boolean(c.show_in_univers),
                website_order: parseInt(c.website_order) || 0,
                univers_order: parseInt(c.univers_order) || 0,
                description: c.description || ""
            }));
            setCategories(formatted);
            setWebsiteCategories(formatted.filter((c: any) => c.on_website));
            setUniversCategories(formatted.filter((c: any) => c.show_in_univers));
        } catch (err) {
            toast.error("Echec du chargement");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleSearch = useCallback((text: string) => {
        setSearchText(text);
        setSearchDropdownOpen(text.trim().length >= 2);
    }, []);

    const handleUnivSearch = useCallback((text: string) => {
        setUnivSearchText(text);
        setUnivSearchDropdownOpen(text.trim().length >= 2);
    }, []);

    /**
     * Les résultats d'une recherche : chaque catégorie dont le nom correspond,
     * suivie de toute son arborescence de sous-catégories — comme la liste des
     * catégories et le choix famille/sous-famille de la liste des articles,
     * on ne s'arrête pas au premier niveau. Une sous-catégorie peut ainsi être
     * ajoutée directement depuis le résultat de son parent, sans la chercher
     * à part.
     */
    const buildSearchHits = useCallback((text: string): SearchHit[] => {
        const needle = text.trim().toLowerCase();
        if (needle.length < 2) return [];
        const seen = new Set<number>();
        const hits: SearchHit[] = [];
        categories
            .filter(c => c.nom.toLowerCase().includes(needle))
            .sort((a, b) => a.nom.localeCompare(b.nom))
            .forEach(cat => {
                if (seen.has(cat.id)) return;
                seen.add(cat.id);
                hits.push({ categorie: cat, depth: 0, isMatch: true });
                buildSubcategoryOptions(categories, cat.id).forEach(opt => {
                    if (seen.has(opt.id)) return;
                    const sub = categories.find(c => c.id === opt.id);
                    if (!sub) return;
                    seen.add(opt.id);
                    hits.push({ categorie: sub, depth: opt.depth + 1, isMatch: false });
                });
            });
        return hits;
    }, [categories]);

    const websiteHits = useMemo(() => buildSearchHits(searchText), [buildSearchHits, searchText]);
    const univHits = useMemo(() => buildSearchHits(univSearchText), [buildSearchHits, univSearchText]);

    /**
     * Une catégorie affichée sur le site doit avoir toute sa lignée affichée
     * aussi, sinon elle se retrouve promue à la racine du menu (le backend et
     * buildCategoryTree côté site la détachent de son parent invisible) —
     * exactement le bug que la page ERP ne doit plus laisser se reproduire.
     * Renvoie les noms des ancêtres effectivement corrigés, pour le message.
     */
    const cascadeAncestors = useCallback(async (cat: Categorie, flag: SiteFlag): Promise<string[]> => {
        const ancestors = getAncestorChain(categories, cat.id).filter((a: any) => !a[flag]);
        if (ancestors.length === 0) return [];
        await Promise.all(ancestors.map((a: any) => {
            const fd = new FormData();
            fd.append("nom", a.nom);
            fd.append(flag, "true");
            return updateCategorie(a.id, fd);
        }));
        return ancestors.map((a: any) => a.nom);
    }, [categories]);

    const handleAddToWebsite = useCallback(async (cat: Categorie) => {
        try {
            setSearchDropdownOpen(false); setSearchText("");
            const cascaded = await cascadeAncestors(cat, "on_website");
            const fd = new FormData(); fd.append("nom", cat.nom); fd.append("on_website", "true");
            await updateCategorie(cat.id, fd); await fetchData();
            toast.success(
                cascaded.length > 0
                    ? `"${cat.nom}" ajoutee (avec sa famille : ${cascaded.join(", ")})`
                    : `"${cat.nom}" ajoutee aux categories du site`
            );
        } catch { toast.error("Echec de l ajout"); }
    }, [fetchData, cascadeAncestors]);

    const handleRemoveFromWebsite = useCallback(async (id: number) => {
        try {
            const fd = new FormData(); fd.append("on_website", "false");
            await updateCategorie(id, fd); await fetchData();
            toast.success("Categorie retiree");
        } catch { toast.error("Echec du retrait"); }
    }, [fetchData]);

    const handleAddToUnivers = useCallback(async (cat: Categorie) => {
        try {
            setUnivSearchDropdownOpen(false); setUnivSearchText("");
            const cascaded = await cascadeAncestors(cat, "show_in_univers");
            const fd = new FormData(); fd.append("nom", cat.nom); fd.append("show_in_univers", "true");
            await updateCategorie(cat.id, fd); await fetchData();
            toast.success(
                cascaded.length > 0
                    ? `"${cat.nom}" ajoutee (avec sa famille : ${cascaded.join(", ")})`
                    : `"${cat.nom}" ajoutee aux univers`
            );
        } catch { toast.error("Echec de l ajout"); }
    }, [fetchData, cascadeAncestors]);

    const handleRemoveFromUnivers = useCallback(async (id: number) => {
        try {
            const fd = new FormData(); fd.append("show_in_univers", "false");
            await updateCategorie(id, fd); await fetchData();
            toast.success("Univers retire");
        } catch { toast.error("Echec du retrait"); }
    }, [fetchData]);

    /**
     * Répare les catégories déjà ajoutées dont un ancêtre ne l'est pas — le
     * cas qui a produit le bug (une sous-catégorie ajoutée seule). Code
     * seulement : relit toutes les catégories, remonte la lignée de chacune
     * et complète ce qui manque, par les mêmes requêtes que l'ajout normal.
     * Idempotent — la relancer sans rien de cassé ne fait rien.
     */
    const handleRepairOrphans = useCallback(async () => {
        setRepairing(true);
        try {
            const fixedNames = new Set<string>();
            const runCascade = async (cat: Categorie, flag: SiteFlag, done: Set<number>) => {
                const ancestors = getAncestorChain(categories, cat.id)
                    .filter((a: any) => !a[flag] && !done.has(a.id));
                for (const a of ancestors as any[]) {
                    const fd = new FormData();
                    fd.append("nom", a.nom);
                    fd.append(flag, "true");
                    await updateCategorie(a.id, fd);
                    done.add(a.id);
                    fixedNames.add(a.nom);
                }
            };
            const doneWebsite = new Set<number>();
            for (const cat of categories.filter(c => c.on_website)) await runCascade(cat, "on_website", doneWebsite);
            const doneUnivers = new Set<number>();
            for (const cat of categories.filter(c => c.show_in_univers)) await runCascade(cat, "show_in_univers", doneUnivers);
            await fetchData();
            toast.success(
                fixedNames.size > 0
                    ? `Famille completee pour : ${Array.from(fixedNames).join(", ")}`
                    : "Aucune categorie orpheline trouvee"
            );
        } catch { toast.error("Echec de la reparation"); }
        finally { setRepairing(false); }
    }, [categories, fetchData]);

    /* Both lists are drawn as trees, each family followed by its sous-categories,
       every level in the shop's order — a flat table mixed sous-categories with
       unrelated families and hid where they sit in the menu. */
    const websiteRows = useMemo(() => flattenCategoryTree(websiteCategories, byWebsiteOrder), [websiteCategories]);
    const universRows = useMemo(() => flattenCategoryTree(universCategories, byUniversOrder), [universCategories]);

    /**
     * Moves a category among its siblings only: the shop sorts each level of the
     * menu on its own, so swapping with a category of another family would change
     * nothing on the site. Only that level is renumbered.
     */
    const moveAmongSiblings = useCallback(async (
        list: Categorie[],
        cat: Categorie,
        direction: "up" | "down",
        field: "website_order" | "univers_order",
        compare: CategoryCompare
    ) => {
        const siblings = siblingsOf(list, cat, compare);
        const idx = siblings.findIndex(c => c.id === cat.id);
        const tgt = direction === "up" ? idx - 1 : idx + 1;
        if (idx === -1 || tgt < 0 || tgt >= siblings.length) return;
        [siblings[idx], siblings[tgt]] = [siblings[tgt], siblings[idx]];
        try {
            await Promise.all(siblings.map((c, i) => { const fd = new FormData(); fd.append(field, String(i)); return updateCategorie(c.id, fd); }));
            await fetchData();
        } catch { toast.error("Echec du changement d ordre"); }
    }, [fetchData]);

    const handleMoveWebsite = useCallback(
        (cat: Categorie, direction: "up" | "down") =>
            moveAmongSiblings(websiteCategories, cat, direction, "website_order", byWebsiteOrder),
        [moveAmongSiblings, websiteCategories]
    );

    const handleMoveUnivers = useCallback(
        (cat: Categorie, direction: "up" | "down") =>
            moveAmongSiblings(universCategories, cat, direction, "univers_order", byUniversOrder),
        [moveAmongSiblings, universCategories]
    );

    const handleOpenSettings = (cat: Categorie) => { setSelectedCategory(cat); setSelectedImage(null); setImagePreview(null); setSettingsModal(true); };

    const validation = useFormik({
        enableReinitialize: true,
        initialValues: {
            on_website: selectedCategory?.on_website || false,
            website_order: selectedCategory?.website_order || 0,
            show_in_univers: selectedCategory?.show_in_univers || false,
            univers_order: selectedCategory?.univers_order || 0,
            description: selectedCategory?.description || ""
        },
        onSubmit: async (values) => {
            if (!selectedCategory) return;
            try {
                const fd = new FormData();
                fd.append("nom", selectedCategory.nom);
                fd.append("on_website", String(values.on_website));
                fd.append("website_order", String(values.website_order));
                fd.append("show_in_univers", String(values.show_in_univers));
                fd.append("univers_order", String(values.univers_order));
                fd.append("description", values.description);
                if (selectedImage) fd.append("image", selectedImage);

                // Cocher la case ici équivaut à l'ajout depuis la recherche :
                // sa famille doit suivre, sinon elle réapparaît seule à la
                // racine du menu côté site.
                const cascaded: string[] = [];
                if (values.on_website) cascaded.push(...await cascadeAncestors(selectedCategory, "on_website"));
                if (values.show_in_univers) cascaded.push(...await cascadeAncestors(selectedCategory, "show_in_univers"));

                await updateCategorie(selectedCategory.id, fd);
                setSettingsModal(false); fetchData();
                toast.success(
                    cascaded.length > 0
                        ? `Parametres mis a jour (famille completee : ${Array.from(new Set(cascaded)).join(", ")})`
                        : "Parametres mis a jour"
                );
            } catch { toast.error("Echec de la mise a jour"); }
        }
    });

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) setSearchDropdownOpen(false);
            if (univSearchContainerRef.current && !univSearchContainerRef.current.contains(e.target as Node)) setUnivSearchDropdownOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    /**
     * The categories of one section drawn as a tree, like the footer menu picker
     * on the site settings page: indented by depth, families in bold,
     * sous-categories muted. The arrows move a category among its siblings.
     */
    const renderCategoryTree = (
        rows: { categorie: Categorie; depth: number }[],
        list: Categorie[],
        compare: CategoryCompare,
        onMove: (c: Categorie, d: "up" | "down") => void,
        onRemove: (id: number) => void,
        emptyText: string
    ) => {
        if (rows.length === 0) {
            return <div className="border rounded p-3 text-muted small">{emptyText}</div>;
        }
        return (
            <div className="border rounded p-2" style={{ maxHeight: 480, overflowY: "auto" }}>
                {rows.map(({ categorie: cat, depth }) => {
                    const siblings = siblingsOf(list, cat, compare);
                    const idx = siblings.findIndex(c => c.id === cat.id);
                    // A sous-categorie whose family is not shown sits at the root of the shop menu
                    const hiddenParent = depth === 0 && cat.parent_id
                        ? categories.find(c => Number(c.id) === Number(cat.parent_id))
                        : undefined;
                    return (
                        <div
                            key={cat.id}
                            className="d-flex align-items-center gap-2 py-1 border-bottom"
                            style={{ paddingLeft: depth * 24 }}
                        >
                            {cat.image
                                ? <img src={getImageUrl(cat.image)} alt="" className="rounded flex-shrink-0" style={{ width: 32, height: 32, objectFit: "cover" }} />
                                : <div className="rounded bg-light d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 32, height: 32 }}><i className="ri-image-line text-muted"></i></div>}
                            <div className="flex-grow-1 text-truncate">
                                <span className={depth === 0 ? "fw-semibold" : "text-muted"}>{cat.nom}</span>
                                {hiddenParent && (
                                    <small
                                        className="text-warning ms-2"
                                        title="Sa famille n'est pas affichee : le site montre cette categorie a la racine du menu. Le bouton Reparer les familles l'ajoute."
                                    >
                                        (famille "{hiddenParent.nom}" non affichee)
                                    </small>
                                )}
                            </div>
                            <div className="hstack gap-1 flex-shrink-0">
                                <Button color="light" size="sm" className="p-1" disabled={idx <= 0} onClick={() => onMove(cat, "up")} title="Monter"><i className="ri-arrow-up-s-line"></i></Button>
                                <Button color="light" size="sm" className="p-1" disabled={idx === -1 || idx >= siblings.length - 1} onClick={() => onMove(cat, "down")} title="Descendre"><i className="ri-arrow-down-s-line"></i></Button>
                                <Button color="primary" size="sm" className="ms-2" onClick={() => handleOpenSettings(cat)} title="Parametres"><i className="ri-settings-line"></i></Button>
                                <Button color="danger" size="sm" onClick={() => onRemove(cat.id)} title="Retirer"><i className="ri-delete-bin-line"></i></Button>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    /**
     * One row of a search-to-add dropdown. A sous-catégorie is indented under
     * its match like the famille/sous-famille choice in the article list; a
     * match that is itself a sous-catégorie shows its own lineage so adding
     * it (and the family it will pull along) is not a surprise.
     */
    const renderSearchHit = (
        hit: SearchHit,
        flag: SiteFlag,
        onAdd: (c: Categorie) => void,
        color: "success" | "warning"
    ) => {
        const { categorie: cat, depth, isMatch } = hit;
        const already = Boolean((cat as any)[flag]);
        const ancestry = isMatch ? getAncestorChain(categories, cat.id) : [];
        return (
            <div
                key={cat.id}
                className="p-2 border-bottom d-flex justify-content-between align-items-center"
                style={{
                    cursor: already ? "default" : "pointer",
                    paddingLeft: `${0.5 + depth * 1.25}rem`,
                    opacity: already ? 0.6 : 1,
                }}
                onClick={() => { if (!already) onAdd(cat); }}
            >
                <span>
                    {depth > 0 && <span className="text-muted">{"— ".repeat(depth)}</span>}
                    {cat.nom}
                    {ancestry.length > 0 && (
                        <small className="text-muted ms-2">
                            ({ancestry.map((a: any) => a.nom).join(" › ")})
                        </small>
                    )}
                </span>
                {already
                    ? <Badge color="secondary">Deja ajoutee</Badge>
                    : <Badge color={color}>+ Ajouter</Badge>}
            </div>
        );
    };

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title="Categories Site Web" pageTitle="Site Web" />

                {/* SECTION 1 */}
                <Row className="mb-4">
                    <Col lg={12}>
                        <Card>
                            <CardHeader className="border-0 d-flex align-items-center gap-3">
                                <div>
                                    <h5 className="card-title mb-0"><i className="ri-layout-grid-line me-2 text-primary"></i>Categories du Site Web</h5>
                                    <p className="text-muted small mb-0 mt-1">Ces categories s affichent dans le <strong>menu de navigation</strong> et la section <strong>"Acheter par Categorie"</strong> de la page d accueil.</p>
                                </div>
                                <Button
                                    color="light"
                                    size="sm"
                                    className="ms-auto"
                                    disabled={repairing}
                                    onClick={handleRepairOrphans}
                                    title="Complete automatiquement la famille de toute categorie deja affichee dont un parent ne l est pas (site web et univers)"
                                >
                                    <i className="ri-tools-line me-1"></i>
                                    {repairing ? "Reparation..." : "Reparer les familles"}
                                </Button>
                                <Badge color="primary" pill className="fs-6">{websiteCategories.length}</Badge>
                            </CardHeader>
                            <CardBody className="pt-0">
                                <Row className="mb-4">
                                    <Col md={8}>
                                        <div className="position-relative" ref={searchContainerRef}>
                                            <Input type="text" placeholder="Rechercher des categories a ajouter (2 caracteres min)..." value={searchText} onChange={(e) => handleSearch(e.target.value)} />
                                            {searchDropdownOpen && (
                                                websiteHits.length > 0 ? (
                                                    <div className="position-absolute w-100 shadow-lg border rounded bg-white z-3 mt-1 overflow-auto" style={{ maxHeight: 280 }}>
                                                        {websiteHits.map(hit => renderSearchHit(hit, "on_website", handleAddToWebsite, "success"))}
                                                    </div>
                                                ) : (
                                                    <div className="position-absolute w-100 shadow-lg border rounded bg-white z-3 mt-1 p-2 text-muted small">Aucune categorie trouvee</div>
                                                )
                                            )}
                                        </div>
                                    </Col>
                                    <Col md={4} className="text-end"><Button color="primary" onClick={fetchData}><i className="ri-refresh-line"></i></Button></Col>
                                </Row>
                                {loading ? <Loader /> : renderCategoryTree(
                                    websiteRows, websiteCategories, byWebsiteOrder,
                                    handleMoveWebsite, handleRemoveFromWebsite,
                                    "Aucune categorie sur le site. Utilisez la recherche ci-dessus pour en ajouter."
                                )}
                            </CardBody>
                        </Card>
                    </Col>
                </Row>

                {/* SECTION 2 */}
                <Row>
                    <Col lg={12}>
                        <Alert color="info" className="mb-3 d-flex align-items-start gap-2 border-0" style={{ background: "linear-gradient(135deg,#e8f4fd,#d0eaf9)", borderLeft: "4px solid #0d6efd", borderRadius: 8 }}>
                            <i className="ri-information-line fs-5 mt-1 text-primary flex-shrink-0"></i>
                            <div>
                                <strong>Comment fonctionne "Decouvrir nos univers" ?</strong>
                                <p className="mb-0 mt-1 text-muted small">Cette section est <strong>independante</strong> des categories de navigation ci-dessus. Elle affiche une bande thematique sur la page d accueil <em>juste apres les offres du moment</em>. Une categorie peut apparaitre dans les deux sections ou dans une seule.</p>
                            </div>
                        </Alert>
                        <Card>
                            <CardHeader className="border-0 d-flex align-items-center gap-3">
                                <div>
                                    <h5 className="card-title mb-0"><i className="ri-compass-3-line me-2 text-warning"></i>Decouvrir nos Univers</h5>
                                    <p className="text-muted small mb-0 mt-1">Ces categories s affichent dans la section <strong>"Decouvrir nos univers"</strong> de la page d accueil, apres les offres du moment.</p>
                                </div>
                                <Badge color="warning" pill className="ms-auto fs-6">{universCategories.length}</Badge>
                            </CardHeader>
                            <CardBody className="pt-0">
                                <Row className="mb-4">
                                    <Col md={8}>
                                        <div className="position-relative" ref={univSearchContainerRef}>
                                            <Input type="text" placeholder="Rechercher des categories a ajouter aux univers (2 caracteres min)..." value={univSearchText} onChange={(e) => handleUnivSearch(e.target.value)} />
                                            {univSearchDropdownOpen && (
                                                univHits.length > 0 ? (
                                                    <div className="position-absolute w-100 shadow-lg border rounded bg-white z-3 mt-1 overflow-auto" style={{ maxHeight: 280 }}>
                                                        {univHits.map(hit => renderSearchHit(hit, "show_in_univers", handleAddToUnivers, "warning"))}
                                                    </div>
                                                ) : (
                                                    <div className="position-absolute w-100 shadow-lg border rounded bg-white z-3 mt-1 p-2 text-muted small">Aucune categorie trouvee</div>
                                                )
                                            )}
                                        </div>
                                    </Col>
                                    <Col md={4} className="text-end"><Button color="primary" onClick={fetchData}><i className="ri-refresh-line"></i></Button></Col>
                                </Row>
                                {loading ? <Loader /> : renderCategoryTree(
                                    universRows, universCategories, byUniversOrder,
                                    handleMoveUnivers, handleRemoveFromUnivers,
                                    "Aucune categorie dans les univers. Utilisez la recherche ci-dessus pour en ajouter."
                                )}
                            </CardBody>
                        </Card>
                    </Col>
                </Row>

                <Modal isOpen={settingsModal} toggle={() => setSettingsModal(false)} centered>
                    <ModalHeader toggle={() => setSettingsModal(false)}>Parametres - {selectedCategory?.nom}</ModalHeader>
                    <Form onSubmit={validation.handleSubmit}>
                        <ModalBody>
                            <div className="mb-3 text-center">
                                <Label className="form-label d-block text-start">Image de la categorie</Label>
                                <div className="border rounded p-3">
                                    {(imagePreview || selectedCategory?.image) ? (
                                        <div className="mb-2">
                                            <img src={imagePreview || getImageUrl(selectedCategory?.image)} alt="Preview" className="img-fluid rounded mb-2" style={{ maxHeight: 120 }} />
                                            <div><Label htmlFor="cat-img" className="btn btn-sm btn-outline-primary me-2">Changer</Label><Button size="sm" color="outline-danger" onClick={() => { setImagePreview(null); setSelectedImage(null); }}>Supprimer</Button></div>
                                        </div>
                                    ) : (
                                        <div className="py-3"><i className="ri-image-line fs-1 text-muted mb-2 d-block"></i><Label htmlFor="cat-img" className="btn btn-sm btn-outline-primary">Telecharger</Label></div>
                                    )}
                                    <Input id="cat-img" type="file" accept="image/*" className="d-none" onChange={handleImageUpload} />
                                </div>
                            </div>
                            <div className="mb-3">
                                <div className="form-check form-switch">
                                    <Input type="checkbox" name="on_website" id="onWebsite" className="form-check-input" checked={validation.values.on_website} onChange={validation.handleChange} />
                                    <Label htmlFor="onWebsite" className="form-check-label">Afficher dans Categories du Site</Label>
                                </div>
                            </div>
                            <div className="mb-3">
                                <Label className="form-label">Ordre d affichage (Categories)</Label>
                                <Input type="number" name="website_order" value={validation.values.website_order} onChange={validation.handleChange} />
                            </div>
                            
                            <hr />
                            
                            <div className="mb-3">
                                <div className="form-check form-switch">
                                    <Input type="checkbox" name="show_in_univers" id="showInUnivers" className="form-check-input" checked={validation.values.show_in_univers} onChange={validation.handleChange} />
                                    <Label htmlFor="showInUnivers" className="form-check-label">Afficher dans nos Univers</Label>
                                </div>
                            </div>
                            <div className="mb-3">
                                <Label className="form-label">Ordre d affichage (Univers)</Label>
                                <Input type="number" name="univers_order" value={validation.values.univers_order} onChange={validation.handleChange} />
                            </div>

                            <hr />

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