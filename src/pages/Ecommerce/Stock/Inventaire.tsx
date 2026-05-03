import React, {
    useEffect,
    useState,
    useMemo,
    useCallback,
    useRef,
} from "react";
import {
    Card,
    CardBody,
    Col,
    Container,
    CardHeader,
    Row,
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Label,
    Input,
    Badge,
    InputGroup,
    InputGroupText,
    Button,
    Alert,
    Table,
    FormFeedback,
    Form,
    Spinner,
} from "reactstrap";
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import TableContainer from "../../../Components/Common/TableContainer";
import DeleteModal from "../../../Components/Common/DeleteModal";
import Loader from "../../../Components/Common/Loader";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import moment from "moment";
import Flatpickr from "react-flatpickr";
import * as Yup from "yup";
import { useFormik } from "formik";

import { fetchInventaires, fetchNextInventaireNumber, createInventaire, updateInventaire, deleteInventaire, fetchDepots, Inventaire } from "./InventaireServices";
import { searchArticles, fetchArticles } from "../../../Components/Article/ArticleServices";
import { Article } from "../../../Components/Article/Interfaces";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: any, d = 3) => `${(parseFloat(n) || 0).toFixed(d)} DT`;

const statusColor: Record<string, string> = {
    "Terminé": "success",
    "En cours": "warning",
    "Annulé": "danger",
};

// ─── Line row type ────────────────────────────────────────────────────────────
interface LineRow {
    key: number;
    article_id: number;
    designation: string;
    reference: string;
    qte: number;
    pua_ht: number;
    pua_ttc: number;
    tva: number;
    total_ht: number;
    total_ttc: number;
}

// ─── Component ────────────────────────────────────────────────────────────────
const InventairePage: React.FC = () => {
    // ── List state ────────────────────────────────────────────────────────────
    const [inventaires, setInventaires] = useState<Inventaire[]>([]);
    const [filtered, setFiltered] = useState<Inventaire[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchText, setSearchText] = useState("");
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);

    // ── Modals ────────────────────────────────────────────────────────────────
    const [formModal, setFormModal] = useState(false);
    const [detailModal, setDetailModal] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const [allArticles, setAllArticles] = useState<Article[]>([]);
    const [loadingArticles, setLoadingArticles] = useState(false);

    const scanInputRef = useRef<HTMLInputElement>(null);
    const qteInputRef = useRef<HTMLInputElement>(null);
    const scanTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Load articles on mount to have them ready for local search (barcode scanning)
    useEffect(() => {
        const load = async () => {
            setLoadingArticles(true);
            try {
                const data = await fetchArticles();
                setAllArticles(data);
            } catch (err) {
                console.error("Failed to load articles for search", err);
            } finally {
                setLoadingArticles(false);
            }
        };
        load();
    }, []);

    // ── Edit / selected ───────────────────────────────────────────────────────
    const [selected, setSelected] = useState<Inventaire | null>(null);
    const [isEdit, setIsEdit] = useState(false);

    // ── Form data ─────────────────────────────────────────────────────────────
    const [depots, setDepots] = useState<{ id: number; nom: string }[]>([]);
    const [lines, setLines] = useState<LineRow[]>([]);
    const [nextKey, setNextKey] = useState(1);
    const [submitting, setSubmitting] = useState(false);
    const [loadingDepots, setLoadingDepots] = useState(false);
    // ─── Load inventaires ─────────────────────────────────────────────────────
    const loadInventaires = useCallback(async () => {
        try {
            setLoading(true);
            const data = await fetchInventaires();
            setInventaires(data);
            setFiltered(data);
        } catch (err: any) {
            setError(err.toString());
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadInventaires(); }, [loadInventaires]);

    // ─── Filter ───────────────────────────────────────────────────────────────
    useEffect(() => {
        let result = [...inventaires];
        if (startDate && endDate) {
            const s = moment(startDate).startOf("day");
            const e = moment(endDate).endOf("day");
            result = result.filter((inv) => moment(inv.date).isBetween(s, e, null, "[]"));
        }
        if (searchText.trim()) {
            const q = searchText.toLowerCase();
            result = result.filter(
                (inv) =>
                    inv.numero?.toLowerCase().includes(q) ||
                    inv.depot?.toLowerCase().includes(q) ||
                    inv.description?.toLowerCase().includes(q)
            );
        }
        setFiltered(result);
    }, [startDate, endDate, searchText, inventaires]);

    // ─── Scan State ───────────────────────────────────────────────────────────
    const [scanQuery, setScanQuery] = useState("");
    const [scanResults, setScanResults] = useState<Article[]>([]);
    const [qteModal, setQteModal] = useState(false);
    const [pendingArticle, setPendingArticle] = useState<Article | null>(null);
    const [pendingQte, setPendingQte] = useState<number>(1);

    // ─── Load depots ──────────────────────────────────────────────────────────
    const loadDepots = useCallback(async () => {
        if (depots.length > 0) return;
        setLoadingDepots(true);
        try {
            const deps = await fetchDepots();
            setDepots(Array.isArray(deps) ? deps : []);
        } catch (e) {
            toast.error("Impossible de charger les dépôts");
        } finally {
            setLoadingDepots(false);
        }
    }, [depots.length]);

    // ─── Focus management ─────────────────────────────────────────────────────
    useEffect(() => {
        if (formModal && !qteModal) {
            const t = setTimeout(() => scanInputRef.current?.focus(), 200);
            return () => clearTimeout(t);
        }
    }, [formModal, qteModal]);

    useEffect(() => {
        if (qteModal) {
            const t = setTimeout(() => qteInputRef.current?.focus(), 150);
            return () => clearTimeout(t);
        }
    }, [qteModal]);

    // ─── Article selected from results ────────────────────────────────────────
    const pickArticle = useCallback((art: Article) => {
        setPendingArticle(art);
        setPendingQte(1);
        setScanResults([]);
        setScanQuery("");
        setQteModal(true);
    }, []);

    // ─── Local scan search ────────────────────────────────────────────────────
    const doSearch = useCallback((q: string) => {
        const query = q.trim().toLowerCase();
        if (!query) {
            setScanResults([]);
            return;
        }

        // Search in designation, reference, and barcode fields
        const results = allArticles.filter((art) => {
            const code_barre = (art.code_barre || "").toLowerCase();
            const code_barre_1 = (art.code_barre_1 || "").toLowerCase();
            const code_barre_2 = (art.code_barre_2 || "").toLowerCase();
            const reference = (art.reference || "").toLowerCase();
            const designation = (art.designation || art.nom || "").toLowerCase();

            return (
                code_barre.includes(query) ||
                code_barre_1.includes(query) ||
                code_barre_2.includes(query) ||
                reference.includes(query) ||
                designation.includes(query) ||
                (art.code_barres && art.code_barres.some((cb: string) => cb.toLowerCase().includes(query)))
            );
        });

        setScanResults(results);

        // Check for EXACT match to auto-pick (ideal for scanners)
        const exactMatch = results.find(art => {
            const query = q.trim().toLowerCase();
            const clean = (val: any) => String(val || "").replace(/[{}]/g, "").toLowerCase();

            return (
                clean(art.code_barre) === query ||
                clean(art.code_barre_1) === query ||
                clean(art.code_barre_2) === query ||
                clean(art.reference) === query ||
                (art.code_barres && art.code_barres.some((cb: string) => clean(cb) === query))
            );
        });

        if (exactMatch && query.length >= 3) {
            pickArticle(exactMatch);
        }
    }, [allArticles, pickArticle]);

    // ─── Confirm quantity and add line ────────────────────────────────────────
    const confirmAdd = () => {
        if (!pendingArticle) return;
        const pua_ht = Number(pendingArticle.pua_ht) || 0;
        const pua_ttc = Number(pendingArticle.pua_ttc) || 0;
        const tva = Number(pendingArticle.tva) || 0;
        const qty = Math.max(0, Math.round(Number(pendingQte) || 0));
        const newLine: LineRow = {
            key: nextKey,
            article_id: pendingArticle.id,
            designation: pendingArticle.designation || pendingArticle.nom || "",
            reference: pendingArticle.reference || "",
            qte: qty,
            pua_ht,
            pua_ttc,
            tva,
            total_ht: qty * pua_ht,
            total_ttc: qty * pua_ttc,
        };
        setLines((prev) => [newLine, ...prev]); // newest on top
        setNextKey((k) => k + 1);
        setQteModal(false);
        setPendingArticle(null);
        setPendingQte(1);
        // Refocus scan bar
        setTimeout(() => scanInputRef.current?.focus(), 100);
    };

    // ─── Update qte in existing line ──────────────────────────────────────────
    const updateLineQte = (key: number, newQte: number) => {
        setLines((prev) =>
            prev.map((l) => {
                if (l.key !== key) return l;
                const q = Math.max(0, Math.round(newQte));
                return { ...l, qte: q, total_ht: q * l.pua_ht, total_ttc: q * l.pua_ttc };
            })
        );
    };

    const removeLine = (key: number) => setLines((prev) => prev.filter((l) => l.key !== key));

    // ─── Totals ───────────────────────────────────────────────────────────────
    const grandTotals = useMemo(() => lines.reduce(
        (acc, l) => ({ ht: acc.ht + l.total_ht, ttc: acc.ttc + l.total_ttc }),
        { ht: 0, ttc: 0 }
    ), [lines]);

    // ─── Formik ───────────────────────────────────────────────────────────────
    const validation = useFormik({
        enableReinitialize: true,
        initialValues: {
            numero: selected?.numero || "",
            date: selected?.date || moment().format("YYYY-MM-DD"),
            date_inventaire: selected?.date_inventaire || moment().format("YYYY-MM-DD"),
            depot: selected?.depot || "",
            description: selected?.description || "",
        },
        validationSchema: Yup.object({
            numero: Yup.string().required("Numéro obligatoire"),
            date: Yup.string().required("Date obligatoire"),
            date_inventaire: Yup.string().required("Date d'inventaire obligatoire"),
            depot: Yup.string().required("Dépôt obligatoire"),
        }),
        onSubmit: async (values) => {
            const validLines = lines.filter((l) => l.qte > 0);
            if (validLines.length === 0) {
                toast.error("Scannez au moins un article avec une quantité > 0");
                return;
            }
            const payload = {
                ...values,
                articles: validLines.map((l, idx) => ({
                    article_id: l.article_id,
                    qte_reel: l.qte,
                    ligne_numero: idx + 1,
                })),
            };
            setSubmitting(true);
            try {
                if (isEdit && selected) {
                    await updateInventaire(selected.id, payload);
                    toast.success("Inventaire mis à jour ✓");
                } else {
                    await createInventaire(payload);
                    toast.success("Inventaire créé ✓");
                }
                setFormModal(false);
                validation.resetForm();
                setLines([]);
                loadInventaires();
            } catch (err: any) {
                toast.error(String(err));
            } finally {
                setSubmitting(false);
            }
        },
    });

    // ─── Open Create ──────────────────────────────────────────────────────────
    const openCreate = useCallback(async () => {
        setIsEdit(false);
        setSelected(null);
        setLines([]);
        setNextKey(1);
        setScanQuery("");
        setScanResults([]);
        await loadDepots();
        try {
            const next = await fetchNextInventaireNumber();
            validation.setFieldValue("numero", next);
        } catch { /* ignore */ }
        setFormModal(true);
    }, [loadDepots]); // eslint-disable-line react-hooks/exhaustive-deps

    // ─── Open Edit ────────────────────────────────────────────────────────────
    const openEdit = useCallback(async (inv: Inventaire) => {
        setIsEdit(true);
        setSelected(inv);
        setScanQuery("");
        setScanResults([]);
        
        // Populate form fields
        validation.setValues({
            numero: inv.numero || "",
            date: inv.date ? moment(inv.date).format("YYYY-MM-DD") : "",
            date_inventaire: inv.date_inventaire ? moment(inv.date_inventaire).format("YYYY-MM-DD") : "",
            depot: inv.depot || "",
            description: inv.description || "",
        });

        await loadDepots();

        if (inv.items && inv.items.length > 0) {
            const rebuilt: LineRow[] = inv.items.map((item, idx) => ({
                key: idx + 1,
                article_id: item.article_id,
                designation: item.article?.designation || `Art. ${item.article_id}`,
                reference: item.article?.reference || "",
                qte: Number(item.qte_reel) || 0,
                pua_ht: Number(item.pua_ht) || 0,
                pua_ttc: Number(item.pua_ttc) || 0,
                tva: Number(item.tva) || 0,
                total_ht: Number(item.total_ht) || 0,
                total_ttc: Number(item.total_ttc) || 0,
            }));
            setLines(rebuilt);
            setNextKey(rebuilt.length + 1);
        } else {
            setLines([]);
            setNextKey(1);
        }
        setFormModal(true);
    }, [loadDepots, validation]);

    // ─── Delete ───────────────────────────────────────────────────────────────
    const handleDelete = async () => {
        if (!selected) return;
        try {
            await deleteInventaire(selected.id);
            toast.success("Inventaire supprimé ✓");
            setDeleteModal(false);
            loadInventaires();
        } catch (err: any) {
            toast.error(String(err));
        }
    };

    // ─── Stats ────────────────────────────────────────────────────────────────
    const stats = useMemo(() => ({
        total: filtered.length,
        totalHT: filtered.reduce((s, inv) => s + (parseFloat(String(inv.total_ht)) || 0), 0),
        totalTTC: filtered.reduce((s, inv) => s + (parseFloat(String(inv.total_ttc)) || 0), 0),
        termine: filtered.filter((inv) => inv.status === "Terminé").length,
        enCours: filtered.filter((inv) => inv.status === "En cours").length,
    }), [filtered]);

    // ─── Table columns ────────────────────────────────────────────────────────
    const columns = useMemo(() => [
        {
            header: "#",
            accessorKey: "id",
            enableColumnFilter: false,
            cell: (cell: any) => <span className="text-muted fw-medium">#{cell.getValue()}</span>,
        },
        {
            header: "Numéro",
            accessorKey: "numero",
            enableColumnFilter: false,
            cell: (cell: any) => <span className="fw-bold text-primary">{cell.getValue()}</span>,
        },
        {
            header: "Date",
            accessorKey: "date",
            enableColumnFilter: false,
            cell: (cell: any) => cell.getValue() ? moment(cell.getValue()).format("DD/MM/YYYY") : "-",
        },
        {
            header: "Date Inventaire",
            accessorKey: "date_inventaire",
            enableColumnFilter: false,
            cell: (cell: any) => cell.getValue() ? moment(cell.getValue()).format("DD/MM/YYYY") : "-",
        },
        {
            header: "Dépôt",
            accessorKey: "depot",
            enableColumnFilter: false,
            cell: (cell: any) => (
                <Badge color="info" className="text-uppercase">
                    <i className="ri-store-2-line me-1" />{cell.getValue() || "-"}
                </Badge>
            ),
        },
        {
            header: "Articles",
            accessorKey: "article_count",
            enableColumnFilter: false,
            cell: (cell: any) => <Badge color="secondary">{cell.getValue() || 0} art.</Badge>,
        },
        {
            header: "Total HT",
            accessorKey: "total_ht",
            enableColumnFilter: false,
            cell: (cell: any) => <span className="fw-medium">{fmt(cell.getValue())}</span>,
        },
        {
            header: "Total TTC",
            accessorKey: "total_ttc",
            enableColumnFilter: false,
            cell: (cell: any) => <span className="fw-bold text-success">{fmt(cell.getValue())}</span>,
        },
        {
            header: "Statut",
            accessorKey: "status",
            enableColumnFilter: false,
            cell: (cell: any) => {
                const s = cell.getValue() as string;
                return <Badge color={statusColor[s] || "secondary"} className="text-uppercase">{s || "-"}</Badge>;
            },
        },
        {
            header: "Actions",
            enableColumnFilter: false,
            cell: (cellProps: any) => {
                const inv: Inventaire = cellProps.row.original;
                return (
                    <div className="d-flex gap-2">
                        <Button color="soft-info" size="sm" title="Voir" onClick={() => { setSelected(inv); setDetailModal(true); }}>
                            <i className="ri-eye-line" />
                        </Button>
                        <Button color="soft-primary" size="sm" title="Modifier" onClick={() => openEdit(inv)}>
                            <i className="ri-pencil-line" />
                        </Button>
                        <Button color="soft-danger" size="sm" title="Supprimer" onClick={() => { setSelected(inv); setDeleteModal(true); }}>
                            <i className="ri-delete-bin-line" />
                        </Button>
                    </div>
                );
            },
        },
    ], [openEdit]);

    // ─── JSX ──────────────────────────────────────────────────────────────────
    return (
        <div className="page-content">
            <ToastContainer position="top-right" autoClose={3000} />
            <DeleteModal show={deleteModal} onDeleteClick={handleDelete} onCloseClick={() => setDeleteModal(false)} />

            <Container fluid>
                <BreadCrumb title="Gestion des Inventaires" pageTitle="Stock" />

                {/* Stats */}
                <Row className="mb-4">
                    {[
                        { label: "Total Inventaires", value: stats.total, icon: "ri-clipboard-line", color: "primary" },
                        { label: "Total HT (Global)", value: `${stats.totalHT.toFixed(3)} DT`, icon: "ri-price-tag-3-line", color: "warning" },
                        { label: "Total TTC (Global)", value: `${stats.totalTTC.toFixed(3)} DT`, icon: "ri-money-dollar-circle-line", color: "success" },
                        { label: "Terminés", value: stats.termine, icon: "ri-checkbox-circle-line", color: "success" },
                        { label: "En Cours", value: stats.enCours, icon: "ri-time-line", color: "warning" },
                    ].map((s, i) => (
                        <Col key={i} xl={2} md={4} sm={6} className="mb-3">
                            <Card className={`border-0 shadow-sm bg-${s.color} bg-opacity-10 h-100`}>
                                <CardBody className="d-flex align-items-center gap-3 p-3">
                                    <div className={`avatar-sm rounded-circle bg-${s.color} bg-opacity-20 d-flex align-items-center justify-content-center flex-shrink-0`}>
                                        <i className={`${s.icon} fs-4 text-${s.color}`} />
                                    </div>
                                    <div>
                                        <p className="text-muted mb-1 fs-12">{s.label}</p>
                                        <h5 className={`mb-0 text-${s.color} fw-bold`}>{s.value}</h5>
                                    </div>
                                </CardBody>
                            </Card>
                        </Col>
                    ))}
                </Row>

                {/* Main table */}
                <Row>
                    <Col lg={12}>
                        <Card>
                            <CardHeader className="border-0">
                                <Row className="align-items-center gy-3">
                                    <Col sm>
                                        <h5 className="card-title mb-0">
                                            <i className="ri-clipboard-check-line me-2 text-primary" />
                                            Liste des Inventaires
                                        </h5>
                                    </Col>
                                    <Col sm="auto">
                                        <Button color="primary" onClick={openCreate}>
                                            <i className="ri-add-line align-bottom me-1" />
                                            Nouvel Inventaire
                                        </Button>
                                    </Col>
                                </Row>
                            </CardHeader>
                            <CardBody>
                                <Row className="mb-3 g-2">
                                    <Col md={4}>
                                        <div className="search-box">
                                            <Input
                                                type="text"
                                                className="form-control"
                                                placeholder="Rechercher par numéro, dépôt, description..."
                                                value={searchText}
                                                onChange={(e) => setSearchText(e.target.value)}
                                            />
                                            <i className="ri-search-line search-icon" />
                                        </div>
                                    </Col>
                                    <Col md={3}>
                                        <InputGroup>
                                            <InputGroupText>De</InputGroupText>
                                            <Flatpickr
                                                className="form-control"
                                                options={{ dateFormat: "Y-m-d", altInput: true, altFormat: "d M Y" }}
                                                placeholder="Date début"
                                                onChange={(dates) => setStartDate(dates[0] || null)}
                                            />
                                        </InputGroup>
                                    </Col>
                                    <Col md={3}>
                                        <InputGroup>
                                            <InputGroupText>À</InputGroupText>
                                            <Flatpickr
                                                className="form-control"
                                                options={{ dateFormat: "Y-m-d", altInput: true, altFormat: "d M Y" }}
                                                placeholder="Date fin"
                                                onChange={(dates) => setEndDate(dates[0] || null)}
                                            />
                                        </InputGroup>
                                    </Col>
                                    <Col md={2}>
                                        <Button color="light" className="w-100" onClick={() => { setSearchText(""); setStartDate(null); setEndDate(null); }}>
                                            <i className="ri-close-line me-1" />Réinitialiser
                                        </Button>
                                    </Col>
                                </Row>
                                {loading ? <Loader /> : error ? <Alert color="danger">{error}</Alert> :
                                    filtered.length === 0 ? (
                                        <div className="text-center py-5">
                                            <i className="ri-clipboard-line display-1 text-muted" />
                                            <h5 className="text-muted mt-3">Aucun inventaire trouvé</h5>
                                            <p className="text-muted">Créez votre premier inventaire en cliquant sur «&nbsp;Nouvel Inventaire&nbsp;»</p>
                                        </div>
                                    ) : (
                                        <TableContainer
                                            columns={columns}
                                            data={filtered}
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
            </Container>

            {/* ═══════════════════════════════════════════════════════════════
            CREATE / EDIT MODAL — SCAN-FIRST UX
            ═══════════════════════════════════════════════════════════════ */}
            <Modal
                isOpen={formModal}
                toggle={() => { setFormModal(false); validation.resetForm(); setScanResults([]); setScanQuery(""); }}
                size="xl"
                centered
                scrollable
                backdrop="static"
                keyboard={false}
            >
                <ModalHeader
                    toggle={() => { setFormModal(false); validation.resetForm(); setScanResults([]); setScanQuery(""); }}
                    className="bg-light"
                >
                    <span className="d-flex align-items-center gap-2">
                        <i className={`ri-${isEdit ? "edit" : "clipboard-line"} text-primary fs-4`} />
                        {isEdit ? "Modifier l'Inventaire" : "Nouvel Inventaire"}
                    </span>
                </ModalHeader>

                <ModalBody>
                    {/* ── Header fields ──────────────────────────────────────── */}
                    <Row className="g-3 mb-4 pb-3 border-bottom">
                        <Col md={3}>
                            <Label className="fw-semibold">Numéro <span className="text-danger">*</span></Label>
                            <Input
                                name="numero"
                                value={validation.values.numero}
                                onChange={validation.handleChange}
                                onBlur={validation.handleBlur}
                                invalid={validation.touched.numero && !!validation.errors.numero}
                                disabled={isEdit}
                                className="fw-bold"
                            />
                            <FormFeedback>{String(validation.errors.numero ?? "")}</FormFeedback>
                        </Col>
                        <Col md={2}>
                            <Label className="fw-semibold">Date <span className="text-danger">*</span></Label>
                            <Input
                                type="date"
                                name="date"
                                value={validation.values.date}
                                onChange={validation.handleChange}
                                onBlur={validation.handleBlur}
                                invalid={validation.touched.date && !!validation.errors.date}
                            />
                            <FormFeedback>{String(validation.errors.date ?? "")}</FormFeedback>
                        </Col>
                        <Col md={2}>
                            <Label className="fw-semibold">Date Inventaire <span className="text-danger">*</span></Label>
                            <Input
                                type="date"
                                name="date_inventaire"
                                value={validation.values.date_inventaire}
                                onChange={validation.handleChange}
                                onBlur={validation.handleBlur}
                                invalid={validation.touched.date_inventaire && !!validation.errors.date_inventaire}
                            />
                            <FormFeedback>{String(validation.errors.date_inventaire ?? "")}</FormFeedback>
                        </Col>
                        <Col md={3}>
                            <Label className="fw-semibold">Dépôt <span className="text-danger">*</span></Label>
                            {loadingDepots ? (
                                <div className="d-flex align-items-center gap-2 mt-1">
                                    <Spinner size="sm" /> <span className="text-muted">Chargement...</span>
                                </div>
                            ) : (
                                <Input
                                    type="select"
                                    name="depot"
                                    value={validation.values.depot}
                                    onChange={validation.handleChange}
                                    onBlur={validation.handleBlur}
                                    invalid={validation.touched.depot && !!validation.errors.depot}
                                    disabled={isEdit}
                                >
                                    <option value="">-- Sélectionner un dépôt --</option>
                                    {depots.map((d) => (
                                        <option key={d.id} value={d.nom}>{d.nom}</option>
                                    ))}
                                </Input>
                            )}
                            <FormFeedback>{String(validation.errors.depot ?? "")}</FormFeedback>
                        </Col>
                        <Col md={2}>
                            <Label className="fw-semibold">Description</Label>
                            <Input
                                type="text"
                                name="description"
                                placeholder="Remarques..."
                                value={validation.values.description}
                                onChange={validation.handleChange}
                            />
                        </Col>
                    </Row>

                    {/* ── SCAN BAR — always visible, auto-focused ─────────────── */}
                    <div className="mb-3">
                        <Label className="fw-bold fs-6 d-flex align-items-center gap-2">
                            <i className="ri-barcode-line text-info fs-5" />
                            Scanner ou saisir une référence
                        </Label>
                        <InputGroup>
                            <InputGroupText className="bg-info bg-opacity-10 border-info">
                                <i className="ri-barcode-line text-info fs-5" />
                            </InputGroupText>
                            <Input
                                innerRef={scanInputRef}
                                placeholder="Référence, désignation ou code barre..."
                                value={scanQuery}
                                onChange={(e) => {
                                    setScanQuery(e.target.value);
                                    doSearch(e.target.value);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        if (scanResults.length === 1) {
                                            pickArticle(scanResults[0]);
                                        } else if (scanResults.length > 1) {
                                            // Maybe pick the first one if it's an exact barcode match
                                            const query = scanQuery.trim().toLowerCase();
                                            const exactMatch = scanResults.find(art =>
                                                (art.code_barre || "").toLowerCase() === query ||
                                                (art.code_barre_1 || "").toLowerCase() === query ||
                                                (art.code_barre_2 || "").toLowerCase() === query ||
                                                (art.reference || "").toLowerCase() === query
                                            );
                                            if (exactMatch) {
                                                pickArticle(exactMatch);
                                            }
                                        }
                                    }
                                }}
                                className="border-info"
                                autoComplete="off"
                            />
                            {loadingArticles && (
                                <InputGroupText><Spinner size="sm" /></InputGroupText>
                            )}
                        </InputGroup>

                        {/* Dropdown results */}
                        {scanResults.length > 0 && (
                            <div className="border rounded shadow-sm mt-1" style={{ maxHeight: 240, overflowY: "auto", position: "relative", zIndex: 1050, background: "#fff" }}>
                                <Table hover size="sm" className="align-middle mb-0">
                                    <thead className="table-light sticky-top">
                                        <tr>
                                            <th>Référence</th>
                                            <th>Désignation</th>
                                            <th>Code Barre</th>
                                            <th className="text-end">PU HT</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {scanResults.map((art) => (
                                            <tr
                                                key={art.id}
                                                style={{ cursor: "pointer" }}
                                                onClick={() => pickArticle(art)}
                                            >
                                                <td><Badge color="light" className="text-dark">{art.reference}</Badge></td>
                                                <td className="fw-medium">{art.designation || art.nom}</td>
                                                <td className="text-muted small">{art.code_barre || "-"}</td>
                                                <td className="text-end">{(Number(art.pua_ht) || 0).toFixed(3)}</td>
                                                <td>
                                                    <Button color="primary" size="sm" onClick={(e) => { e.stopPropagation(); pickArticle(art); }}>
                                                        <i className="ri-add-line" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </div>
                        )}
                    </div>

                    {/* ── Articles Table ──────────────────────────────────────── */}
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <h6 className="mb-0 fw-bold">
                            <i className="ri-list-check-2 me-2 text-primary" />
                            Articles scannés ({lines.length})
                        </h6>
                        {lines.length > 0 && (
                            <div className="text-muted small">
                                HT: <strong>{grandTotals.ht.toFixed(3)} DT</strong>
                                &nbsp;|&nbsp;TTC: <strong className="text-success">{grandTotals.ttc.toFixed(3)} DT</strong>
                            </div>
                        )}
                    </div>

                    <div className="table-responsive" style={{ maxHeight: 500, overflowY: "auto" }}>
                        {lines.length === 0 ? (
                            <div className="text-center text-muted py-5 border rounded">
                                <i className="ri-barcode-line display-4 text-info opacity-50" />
                                <p className="mt-2 mb-0">Scannez ou saisissez une référence pour ajouter des articles</p>
                            </div>
                        ) : (
                            <Table bordered hover size="sm" className="align-middle mb-0">
                                <thead className="table-light sticky-top">
                                    <tr>
                                        <th style={{ width: 40 }}>#</th>
                                        <th>Article</th>
                                        <th style={{ width: 120 }}>Réf.</th>
                                        <th style={{ width: 110 }}>Qté</th>
                                        <th style={{ width: 110 }}>PU HT</th>
                                        <th style={{ width: 110 }}>PU TTC</th>
                                        <th style={{ width: 55 }}>TVA%</th>
                                        <th style={{ width: 115 }}>Total HT</th>
                                        <th style={{ width: 115 }}>Total TTC</th>
                                        <th style={{ width: 50 }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {lines.map((line, idx) => (
                                        <tr key={line.key}>
                                            <td className="text-muted text-center">{lines.length - idx}</td>
                                            <td className="fw-medium">{line.designation}</td>
                                            <td><Badge color="light" className="text-dark">{line.reference || "-"}</Badge></td>
                                            <td>
                                                <Input
                                                    type="number"
                                                    bsSize="sm"
                                                    min={0}
                                                    step={1}
                                                    value={line.qte}
                                                    onChange={(e) => updateLineQte(line.key, Number(e.target.value))}
                                                    className={line.qte > 0 ? "border-success" : ""}
                                                    style={{ width: 80 }}
                                                />
                                            </td>
                                            <td className="text-muted small">{line.pua_ht.toFixed(3)}</td>
                                            <td className="text-info fw-medium small">{line.pua_ttc.toFixed(3)}</td>
                                            <td className="text-center"><Badge color="secondary">{line.tva}%</Badge></td>
                                            <td className="text-end fw-medium">{line.total_ht.toFixed(3)}</td>
                                            <td className="text-end fw-bold text-success">{line.total_ttc.toFixed(3)}</td>
                                            <td className="text-center">
                                                <Button color="soft-danger" size="sm" onClick={() => removeLine(line.key)}>
                                                    <i className="ri-delete-bin-line" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="table-light">
                                    <tr>
                                        <td colSpan={7} className="text-end fw-bold">Totaux :</td>
                                        <td className="text-end fw-bold text-primary">{grandTotals.ht.toFixed(3)} DT</td>
                                        <td className="text-end fw-bold text-success">{grandTotals.ttc.toFixed(3)} DT</td>
                                        <td />
                                    </tr>
                                </tfoot>
                            </Table>
                        )}
                    </div>
                </ModalBody>

                <ModalFooter className="border-top">
                    <Button
                        type="button"
                        color="light"
                        onClick={() => { setFormModal(false); validation.resetForm(); setScanResults([]); setScanQuery(""); }}
                        disabled={submitting}
                    >
                        <i className="ri-close-line me-1" />Annuler
                    </Button>
                    <Button
                        type="button"
                        color="primary"
                        disabled={submitting}
                        onClick={() => validation.handleSubmit()}
                    >
                        {submitting ? (
                            <><span className="spinner-border spinner-border-sm me-2" />Enregistrement...</>
                        ) : (
                            <><i className="ri-save-line me-1" />{isEdit ? "Mettre à jour" : "Créer l'inventaire"}</>
                        )}
                    </Button>
                </ModalFooter>
            </Modal>

            {/* ═══════════════════════════════════════════════════════════════
            QTE CONFIRMATION MINI-MODAL
            ═══════════════════════════════════════════════════════════════ */}
            <Modal isOpen={qteModal} toggle={() => { setQteModal(false); setTimeout(() => scanInputRef.current?.focus(), 100); }} size="sm" centered>
                <ModalHeader toggle={() => { setQteModal(false); setTimeout(() => scanInputRef.current?.focus(), 100); }} className="bg-light">
                    <i className="ri-stack-line me-2 text-primary" />Quantité
                </ModalHeader>
                <ModalBody>
                    {pendingArticle && (
                        <>
                            <div className="mb-3 p-2 border rounded bg-light">
                                <div className="fw-bold">{pendingArticle.designation || pendingArticle.nom}</div>
                                <div className="text-muted small">Réf: {pendingArticle.reference}</div>
                                <div className="text-info small">PU HT: {(Number(pendingArticle.pua_ht) || 0).toFixed(3)} DT</div>
                            </div>
                            <Label className="fw-semibold">Quantité comptée <span className="text-danger">*</span></Label>
                            <Input
                                innerRef={qteInputRef}
                                type="number"
                                min={0}
                                step={1}
                                value={pendingQte}
                                onChange={(e) => setPendingQte(Number(e.target.value))}
                                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); confirmAdd(); } }}
                                className="fs-4 text-center fw-bold"
                            />
                        </>
                    )}
                </ModalBody>
                <ModalFooter>
                    <Button color="light" size="sm" onClick={() => { setQteModal(false); setTimeout(() => scanInputRef.current?.focus(), 100); }}>
                        Annuler
                    </Button>
                    <Button color="primary" className="w-100" onClick={confirmAdd}>
                        <i className="ri-check-line me-1" />Confirmer &amp; Suivant
                    </Button>
                </ModalFooter>
            </Modal>

            {/* ═══════════════════════════════════════════════════════════════
            DETAIL VIEW MODAL
            ═══════════════════════════════════════════════════════════════ */}
            <Modal isOpen={detailModal} toggle={() => setDetailModal(false)} size="xl" centered scrollable>
                <ModalHeader toggle={() => setDetailModal(false)} className="bg-light">
                    <span className="d-flex align-items-center gap-2">
                        <i className="ri-clipboard-check-line text-success fs-4" />
                        Détail Inventaire — {selected?.numero}
                    </span>
                </ModalHeader>
                <ModalBody>
                    {selected && (
                        <>
                            <Row className="g-3 mb-4">
                                {[
                                    { label: "Numéro", value: selected.numero, icon: "ri-hashtag" },
                                    { label: "Date", value: moment(selected.date).format("DD/MM/YYYY"), icon: "ri-calendar-line" },
                                    { label: "Date Inventaire", value: moment(selected.date_inventaire).format("DD/MM/YYYY"), icon: "ri-calendar-check-line" },
                                    { label: "Dépôt", value: selected.depot, icon: "ri-store-2-line" },
                                    { label: "Statut", value: <Badge color={statusColor[selected.status] || "secondary"}>{selected.status}</Badge>, icon: "ri-information-line" },
                                    { label: "Articles", value: selected.article_count, icon: "ri-archive-line" },
                                ].map((m, i) => (
                                    <Col key={i} md={2} sm={4} xs={6}>
                                        <div className="border rounded p-2 h-100">
                                            <div className="text-muted small mb-1"><i className={`${m.icon} me-1`} />{m.label}</div>
                                            <div className="fw-semibold">{m.value}</div>
                                        </div>
                                    </Col>
                                ))}
                                {selected.description && (
                                    <Col md={12}>
                                        <Alert color="light" className="mb-0">
                                            <i className="ri-sticky-note-line me-2 text-info" />{selected.description}
                                        </Alert>
                                    </Col>
                                )}
                            </Row>

                            <h6 className="fw-bold mb-3">
                                <i className="ri-list-check-2 me-2 text-primary" />
                                Lignes d'inventaire ({selected.items?.length || 0})
                            </h6>

                            {!selected.items || selected.items.length === 0 ? (
                                <Alert color="info" className="text-center">Aucune ligne trouvée.</Alert>
                            ) : (
                                <div className="table-responsive">
                                    <Table hover bordered size="sm" className="align-middle">
                                        <thead className="table-light">
                                            <tr>
                                                <th>#</th>
                                                <th>Article</th>
                                                <th>Référence</th>
                                                <th className="text-center">Qté Avant</th>
                                                <th className="text-center">Qté</th>
                                                <th className="text-center">Ajustement</th>
                                                <th className="text-end">PU HT</th>
                                                <th className="text-end">PU TTC</th>
                                                <th className="text-center">TVA%</th>
                                                <th className="text-end">Total HT</th>
                                                <th className="text-end">Total TTC</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selected.items.map((item, idx) => {
                                                const adj = Number(item.qte_ajustement) || 0;
                                                return (
                                                    <tr key={item.id || idx}>
                                                        <td className="text-muted">{idx + 1}</td>
                                                        <td className="fw-medium">{item.article?.designation || `Art. ${item.article_id}`}</td>
                                                        <td><Badge color="light" className="text-dark">{item.article?.reference || "-"}</Badge></td>
                                                        <td className="text-center">{(Number(item.qte_avant) || 0).toFixed(0)}</td>
                                                        <td className="text-center"><span className="fw-bold text-primary">{(Number(item.qte_reel) || 0).toFixed(0)}</span></td>
                                                        <td className="text-center">
                                                            <Badge color={adj > 0 ? "success" : adj < 0 ? "danger" : "secondary"}>
                                                                {adj > 0 ? "+" : ""}{adj.toFixed(0)}
                                                            </Badge>
                                                        </td>
                                                        <td className="text-end">{fmt(item.pua_ht)}</td>
                                                        <td className="text-end text-info fw-medium">{fmt(item.pua_ttc)}</td>
                                                        <td className="text-center"><Badge color="secondary">{item.tva || 0}%</Badge></td>
                                                        <td className="text-end">{fmt(item.total_ht)}</td>
                                                        <td className="text-end fw-bold text-success">{fmt(item.total_ttc)}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                        <tfoot className="table-light">
                                            <tr>
                                                <td colSpan={9} className="text-end fw-bold">Totaux</td>
                                                <td className="text-end fw-bold text-primary">{fmt(selected.total_ht)}</td>
                                                <td className="text-end fw-bold text-success">{fmt(selected.total_ttc)}</td>
                                            </tr>
                                        </tfoot>
                                    </Table>
                                </div>
                            )}

                            <Row className="mt-4 g-2">
                                {[
                                    { label: "Total HT", value: fmt(selected.total_ht), color: "primary", icon: "ri-price-tag-3-line" },
                                    { label: "Total TVA", value: fmt(selected.total_tva), color: "warning", icon: "ri-percent-line" },
                                    { label: "Total TTC", value: fmt(selected.total_ttc), color: "success", icon: "ri-money-dollar-circle-line" },
                                ].map((s, i) => (
                                    <Col key={i} md={4}>
                                        <Card className={`border-${s.color} bg-${s.color} bg-opacity-10 mb-0`}>
                                            <CardBody className="py-2 text-center">
                                                <i className={`${s.icon} me-1 text-${s.color}`} />
                                                <span className="text-muted small">{s.label}</span>
                                                <div className={`fw-bold fs-5 text-${s.color}`}>{s.value}</div>
                                            </CardBody>
                                        </Card>
                                    </Col>
                                ))}
                            </Row>

                            <div className="d-flex justify-content-between mt-4">
                                <div className="text-muted small">
                                    <i className="ri-time-line me-1" />Créé le {moment(selected.created_at).format("DD/MM/YYYY HH:mm")}
                                    &nbsp;&nbsp;|&nbsp;&nbsp;
                                    <i className="ri-edit-line me-1" />Modifié le {moment(selected.updated_at).format("DD/MM/YYYY HH:mm")}
                                </div>
                                <div className="d-flex gap-2">
                                    <Button color="primary" size="sm" onClick={() => { setDetailModal(false); openEdit(selected); }}>
                                        <i className="ri-pencil-line me-1" />Modifier
                                    </Button>
                                    <Button color="light" size="sm" onClick={() => setDetailModal(false)}>Fermer</Button>
                                </div>
                            </div>
                        </>
                    )}
                </ModalBody>
            </Modal>
        </div>
    );
};

export default InventairePage;
