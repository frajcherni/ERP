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
    ModalBody,
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

import {
    fetchInventaires,
    fetchNextInventaireNumber,
    createInventaire,
    updateInventaire,
    deleteInventaire,
    fetchAllArticles,
    fetchDepots,
    Inventaire,
    InventaireItem,
    Article,
} from "./InventaireServices";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: any, d = 3) =>
    `${(parseFloat(n) || 0).toFixed(d)} DT`;

const statusColor: Record<string, string> = {
    "Terminé": "success",
    "En cours": "warning",
    "Annulé": "danger",
};

// ─── Empty row factory ────────────────────────────────────────────────────────
interface LineRow {
    key: number;
    article_id: number | "";
    qte_reel: number | "";
    pua_ht: number;
    pua_ttc: number;
    tva: number;
    total_ht: number;
    total_ttc: number;
}

const emptyLine = (key: number): LineRow => ({
    key,
    article_id: "",
    qte_reel: "",
    pua_ht: 0,
    pua_ttc: 0,
    tva: 0,
    total_ht: 0,
    total_ttc: 0,
});

// ─── Component ────────────────────────────────────────────────────────────────
const InventairePage: React.FC = () => {
    // ── List state ───────────────────────────────────────────────────────────
    const [inventaires, setInventaires] = useState<Inventaire[]>([]);
    const [filtered, setFiltered] = useState<Inventaire[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchText, setSearchText] = useState("");
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);

    // ── Modals ───────────────────────────────────────────────────────────────
    const [formModal, setFormModal] = useState(false);
    const [detailModal, setDetailModal] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);

    // ── Selected record ───────────────────────────────────────────────────────
    const [selected, setSelected] = useState<Inventaire | null>(null);
    const [isEdit, setIsEdit] = useState(false);

    // ── Form / lookup data ────────────────────────────────────────────────────
    const [articles, setArticles] = useState<Article[]>([]);
    const [depots, setDepots] = useState<{ id: number; nom: string }[]>([]);
    const [lines, setLines] = useState<LineRow[]>([emptyLine(1)]);
    const [nextKey, setNextKey] = useState(2);
    const [loadingLookups, setLoadingLookups] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // ── Article search inside modal ───────────────────────────────────────────
    const [articleSearch, setArticleSearch] = useState("");

    // ─── Fetch list ───────────────────────────────────────────────────────────
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

    useEffect(() => {
        loadInventaires();
    }, [loadInventaires]);

    // ─── Filter ───────────────────────────────────────────────────────────────
    useEffect(() => {
        let result = [...inventaires];

        if (startDate && endDate) {
            const s = moment(startDate).startOf("day");
            const e = moment(endDate).endOf("day");
            result = result.filter((inv) =>
                moment(inv.date).isBetween(s, e, null, "[]")
            );
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

    // ─── Load lookups (articles + depots) when modal opens ───────────────────
    const loadLookups = useCallback(async () => {
        if (articles.length > 0 && depots.length > 0) return; // already loaded
        setLoadingLookups(true);
        try {
            const [arts, deps] = await Promise.all([
                fetchAllArticles(),
                fetchDepots(),
            ]);
            setArticles(arts);
            setDepots(deps);
        } catch {
            toast.error("Erreur de chargement des données de référence");
        } finally {
            setLoadingLookups(false);
        }
    }, [articles.length, depots.length]);

    // ─── Open Create modal ────────────────────────────────────────────────────
    const openCreate = useCallback(async () => {
        setIsEdit(false);
        setSelected(null);
        setLines([emptyLine(1)]);
        setNextKey(2);
        await loadLookups();
        // Auto-fill numero
        try {
            const next = await fetchNextInventaireNumber();
            validation.setFieldValue("numero", next);
        } catch {
            /* ignore */
        }
        setFormModal(true);
    }, [loadLookups]); // eslint-disable-line react-hooks/exhaustive-deps

    // ─── Open Edit modal ──────────────────────────────────────────────────────
    const openEdit = useCallback(
        async (inv: Inventaire) => {
            setIsEdit(true);
            setSelected(inv);
            await loadLookups();

            // Rebuild lines from existing items
            if (inv.items && inv.items.length > 0) {
                const rebuilt: LineRow[] = inv.items.map((item, idx) => ({
                    key: idx + 1,
                    article_id: item.article_id,
                    qte_reel: Number(item.qte_reel),
                    pua_ht: Number(item.pua_ht) || 0,
                    pua_ttc: Number(item.pua_ttc) || 0,
                    tva: Number(item.tva) || 0,
                    total_ht: Number(item.total_ht) || 0,
                    total_ttc: Number(item.total_ttc) || 0,
                }));
                setLines(rebuilt);
                setNextKey(rebuilt.length + 1);
            } else {
                setLines([emptyLine(1)]);
                setNextKey(2);
            }
            setFormModal(true);
        },
        [loadLookups]
    );

    // ─── Line helpers ─────────────────────────────────────────────────────────
    const updateLine = useCallback(
        (key: number, field: keyof LineRow, value: any) => {
            setLines((prev) =>
                prev.map((l) => {
                    if (l.key !== key) return l;
                    const updated = { ...l, [field]: value };
                    // If article changed, fill prices from the article record directly
                    if (field === "article_id") {
                        const art = articles.find((a) => a.id === Number(value));
                        if (art) {
                            updated.pua_ht = parseFloat(art.pua_ht) || 0;
                            updated.pua_ttc = parseFloat(art.pua_ttc) || 0;
                            updated.tva = art.tva || 0;
                        }
                    }
                    // Recalculate totals
                    const qty =
                        field === "qte_reel"
                            ? Number(value) || 0
                            : Number(updated.qte_reel) || 0;
                    updated.total_ht = qty * updated.pua_ht;
                    updated.total_ttc = qty * updated.pua_ttc;
                    return updated;
                })
            );
        },
        [articles]
    );

    const addLine = () => {
        setLines((prev) => [...prev, emptyLine(nextKey)]);
        setNextKey((k) => k + 1);
    };

    const removeLine = (key: number) => {
        setLines((prev) => prev.filter((l) => l.key !== key));
    };

    // ─── Line totals ──────────────────────────────────────────────────────────
    const grandTotals = useMemo(() => {
        return lines.reduce(
            (acc, l) => ({
                ht: acc.ht + l.total_ht,
                ttc: acc.ttc + l.total_ttc,
                tva: acc.tva + (l.total_ttc - l.total_ht),
            }),
            { ht: 0, ttc: 0, tva: 0 }
        );
    }, [lines]);

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
            numero: Yup.string().required("Le numéro est obligatoire"),
            date: Yup.string().required("La date est obligatoire"),
            date_inventaire: Yup.string().required("La date d'inventaire est obligatoire"),
            depot: Yup.string().required("Le dépôt est obligatoire"),
        }),
        onSubmit: async (values) => {
            // Validate lines
            const validLines = lines.filter(
                (l) => l.article_id !== "" && Number(l.qte_reel) > 0
            );
            if (validLines.length === 0) {
                toast.error("Ajoutez au moins un article avec une quantité > 0");
                return;
            }

            const payload = {
                ...values,
                articles: validLines.map((l, idx) => ({
                    article_id: Number(l.article_id),
                    qte_reel: Number(l.qte_reel),
                    ligne_numero: idx + 1,
                })),
            };

            setSubmitting(true);
            try {
                if (isEdit && selected) {
                    await updateInventaire(selected.id, payload);
                    toast.success("Inventaire mis à jour avec succès");
                } else {
                    await createInventaire(payload);
                    toast.success("Inventaire créé avec succès");
                }
                setFormModal(false);
                validation.resetForm();
                loadInventaires();
            } catch (err: any) {
                toast.error(err.toString());
            } finally {
                setSubmitting(false);
            }
        },
    });

    // ─── Delete ───────────────────────────────────────────────────────────────
    const handleDelete = async () => {
        if (!selected) return;
        try {
            await deleteInventaire(selected.id);
            toast.success("Inventaire supprimé avec succès");
            setDeleteModal(false);
            loadInventaires();
        } catch (err: any) {
            toast.error(err.toString());
        }
    };

    // ─── Filtered articles for modal search ───────────────────────────────────
    const filteredArticles = useMemo(() => {
        if (!articleSearch.trim()) return articles.slice(0, 50);
        const q = articleSearch.toLowerCase();
        return articles
            .filter(
                (a) =>
                    a.designation?.toLowerCase().includes(q) ||
                    a.reference?.toLowerCase().includes(q) ||
                    a.code_barre?.toLowerCase().includes(q)
            )
            .slice(0, 50);
    }, [articles, articleSearch]);

    // ─── Stats ────────────────────────────────────────────────────────────────
    const stats = useMemo(() => ({
        total: filtered.length,
        totalHT: filtered.reduce((s, inv) => s + (parseFloat(String(inv.total_ht)) || 0), 0),
        totalTTC: filtered.reduce((s, inv) => s + (parseFloat(String(inv.total_ttc)) || 0), 0),
        totalArticles: filtered.reduce((s, inv) => s + (inv.article_count || 0), 0),
        termine: filtered.filter((inv) => inv.status === "Terminé").length,
        enCours: filtered.filter((inv) => inv.status === "En cours").length,
    }), [filtered]);

    // ─── Table columns ────────────────────────────────────────────────────────
    const columns = useMemo(
        () => [
            {
                header: "#",
                accessorKey: "id",
                enableColumnFilter: false,
                cell: (cell: any) => (
                    <span className="text-muted fw-medium">#{cell.getValue()}</span>
                ),
            },
            {
                header: "Numéro",
                accessorKey: "numero",
                enableColumnFilter: false,
                cell: (cell: any) => (
                    <span className="fw-bold text-primary">{cell.getValue()}</span>
                ),
            },
            {
                header: "Date",
                accessorKey: "date",
                enableColumnFilter: false,
                cell: (cell: any) =>
                    cell.getValue()
                        ? moment(cell.getValue()).format("DD/MM/YYYY")
                        : "-",
            },
            {
                header: "Date Inventaire",
                accessorKey: "date_inventaire",
                enableColumnFilter: false,
                cell: (cell: any) =>
                    cell.getValue()
                        ? moment(cell.getValue()).format("DD/MM/YYYY")
                        : "-",
            },
            {
                header: "Dépôt",
                accessorKey: "depot",
                enableColumnFilter: false,
                cell: (cell: any) => (
                    <Badge color="info" className="text-uppercase">
                        <i className="ri-store-2-line me-1" />
                        {cell.getValue() || "-"}
                    </Badge>
                ),
            },
            {
                header: "Articles",
                accessorKey: "article_count",
                enableColumnFilter: false,
                cell: (cell: any) => (
                    <Badge color="secondary">{cell.getValue() || 0} art.</Badge>
                ),
            },
            {
                header: "Total HT",
                accessorKey: "total_ht",
                enableColumnFilter: false,
                cell: (cell: any) => (
                    <span className="fw-medium">{fmt(cell.getValue())}</span>
                ),
            },
            {
                header: "Total TTC",
                accessorKey: "total_ttc",
                enableColumnFilter: false,
                cell: (cell: any) => (
                    <span className="fw-bold text-success">{fmt(cell.getValue())}</span>
                ),
            },
            {
                header: "Statut",
                accessorKey: "status",
                enableColumnFilter: false,
                cell: (cell: any) => {
                    const s = cell.getValue() as string;
                    return (
                        <Badge color={statusColor[s] || "secondary"} className="text-uppercase">
                            {s || "-"}
                        </Badge>
                    );
                },
            },
            {
                header: "Actions",
                enableColumnFilter: false,
                cell: (cellProps: any) => {
                    const inv: Inventaire = cellProps.row.original;
                    return (
                        <div className="d-flex gap-2">
                            {/* View details */}
                            <Button
                                color="soft-info"
                                size="sm"
                                title="Voir détail"
                                onClick={() => {
                                    setSelected(inv);
                                    setDetailModal(true);
                                }}
                            >
                                <i className="ri-eye-line" />
                            </Button>

                            {/* Edit */}
                            <Button
                                color="soft-primary"
                                size="sm"
                                title="Modifier"
                                onClick={() => openEdit(inv)}
                            >
                                <i className="ri-pencil-line" />
                            </Button>

                            {/* Delete */}
                            <Button
                                color="soft-danger"
                                size="sm"
                                title="Supprimer"
                                onClick={() => {
                                    setSelected(inv);
                                    setDeleteModal(true);
                                }}
                            >
                                <i className="ri-delete-bin-line" />
                            </Button>
                        </div>
                    );
                },
            },
        ],
        [openEdit]
    );

    // ─── JSX ──────────────────────────────────────────────────────────────────
    return (
        <div className="page-content">
            <ToastContainer position="top-right" autoClose={3000} />

            <DeleteModal
                show={deleteModal}
                onDeleteClick={handleDelete}
                onCloseClick={() => setDeleteModal(false)}
            />

            <Container fluid>
                <BreadCrumb title="Gestion des Inventaires" pageTitle="Stock" />

                {/* ── Stats ─────────────────────────────────────────────────────── */}
                <Row className="mb-4">
                    {[
                        {
                            label: "Total Inventaires",
                            value: stats.total,
                            icon: "ri-clipboard-line",
                            color: "primary",
                        },
                        {
                            label: "Total HT (Global)",
                            value: `${stats.totalHT.toFixed(3)} DT`,
                            icon: "ri-price-tag-3-line",
                            color: "warning",
                        },
                        {
                            label: "Total TTC (Global)",
                            value: `${stats.totalTTC.toFixed(3)} DT`,
                            icon: "ri-money-dollar-circle-line",
                            color: "success",
                        },
                        {
                            label: "Articles Comptés",
                            value: stats.totalArticles,
                            icon: "ri-archive-line",
                            color: "info",
                        },
                        {
                            label: "Terminés",
                            value: stats.termine,
                            icon: "ri-checkbox-circle-line",
                            color: "success",
                        },
                        {
                            label: "En Cours",
                            value: stats.enCours,
                            icon: "ri-time-line",
                            color: "warning",
                        },
                    ].map((s, i) => (
                        <Col key={i} xl={2} md={4} sm={6} className="mb-3">
                            <Card className={`border-0 shadow-sm bg-${s.color} bg-opacity-10 h-100`}>
                                <CardBody className="d-flex align-items-center gap-3 p-3">
                                    <div
                                        className={`avatar-sm rounded-circle bg-${s.color} bg-opacity-20 d-flex align-items-center justify-content-center flex-shrink-0`}
                                    >
                                        <i className={`${s.icon} fs-4 text-${s.color}`} />
                                    </div>
                                    <div>
                                        <p className="text-muted mb-1 fs-12">{s.label}</p>
                                        <h5 className={`mb-0 text-${s.color} fw-bold`}>
                                            {s.value}
                                        </h5>
                                    </div>
                                </CardBody>
                            </Card>
                        </Col>
                    ))}
                </Row>

                {/* ── Main card ─────────────────────────────────────────────────── */}
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
                                {/* Filters */}
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
                                        <Button
                                            color="light"
                                            className="w-100"
                                            onClick={() => {
                                                setSearchText("");
                                                setStartDate(null);
                                                setEndDate(null);
                                            }}
                                        >
                                            <i className="ri-close-line me-1" />
                                            Réinitialiser
                                        </Button>
                                    </Col>
                                </Row>

                                {/* Table */}
                                {loading ? (
                                    <Loader />
                                ) : error ? (
                                    <Alert color="danger">{error}</Alert>
                                ) : filtered.length === 0 ? (
                                    <div className="text-center py-5">
                                        <i className="ri-clipboard-line display-1 text-muted" />
                                        <h5 className="text-muted mt-3">Aucun inventaire trouvé</h5>
                                        <p className="text-muted">
                                            Créez votre premier inventaire en cliquant sur «&nbsp;Nouvel Inventaire&nbsp;»
                                        </p>
                                    </div>
                                ) : (
                                    <TableContainer
                                        columns={columns}
                                        data={filtered}
                                        isGlobalFilter={false}
                                        customPageSize={15}
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

            {/* ═══════════════════════════════════════════════════════════════════════
           CREATE / EDIT MODAL
      ══════════════════════════════════════════════════════════════════════════ */}
            <Modal
                isOpen={formModal}
                toggle={() => {
                    setFormModal(false);
                    validation.resetForm();
                }}
                size="xl"
                centered
                scrollable
            >
                <ModalHeader
                    toggle={() => {
                        setFormModal(false);
                        validation.resetForm();
                    }}
                    className="bg-light"
                >
                    <span className="d-flex align-items-center gap-2">
                        <i className={`ri-${isEdit ? "edit" : "add"}-line text-primary fs-4`} />
                        {isEdit ? "Modifier l'Inventaire" : "Nouvel Inventaire"}
                    </span>
                </ModalHeader>

                <ModalBody>
                    {loadingLookups ? (
                        <Loader />
                    ) : (
                        <Form onSubmit={validation.handleSubmit}>
                            {/* ── Header fields ────────────────────────────────────────── */}
                            <Row className="g-3 mb-4">
                                <Col md={3}>
                                    <Label className="fw-semibold">
                                        Numéro <span className="text-danger">*</span>
                                    </Label>
                                    <Input
                                        name="numero"
                                        value={validation.values.numero}
                                        onChange={validation.handleChange}
                                        onBlur={validation.handleBlur}
                                        invalid={
                                            validation.touched.numero && !!validation.errors.numero
                                        }
                                        disabled={isEdit}
                                        className="fw-bold"
                                    />
                                    <FormFeedback>{String(validation.errors.numero ?? "")}</FormFeedback>
                                </Col>

                                <Col md={3}>
                                    <Label className="fw-semibold">
                                        Date <span className="text-danger">*</span>
                                    </Label>
                                    <Input
                                        type="date"
                                        name="date"
                                        value={validation.values.date}
                                        onChange={validation.handleChange}
                                        onBlur={validation.handleBlur}
                                        invalid={
                                            validation.touched.date && !!validation.errors.date
                                        }
                                    />
                                    <FormFeedback>{String(validation.errors.date ?? "")}</FormFeedback>
                                </Col>

                                <Col md={3}>
                                    <Label className="fw-semibold">
                                        Date d'Inventaire <span className="text-danger">*</span>
                                    </Label>
                                    <Input
                                        type="date"
                                        name="date_inventaire"
                                        value={validation.values.date_inventaire}
                                        onChange={validation.handleChange}
                                        onBlur={validation.handleBlur}
                                        invalid={
                                            validation.touched.date_inventaire &&
                                            !!validation.errors.date_inventaire
                                        }
                                    />
                                    <FormFeedback>{String(validation.errors.date_inventaire ?? "")}</FormFeedback>
                                </Col>

                                <Col md={3}>
                                    <Label className="fw-semibold">
                                        Dépôt <span className="text-danger">*</span>
                                    </Label>
                                    <Input
                                        type="select"
                                        name="depot"
                                        value={validation.values.depot}
                                        onChange={validation.handleChange}
                                        onBlur={validation.handleBlur}
                                        invalid={
                                            validation.touched.depot && !!validation.errors.depot
                                        }
                                        disabled={isEdit}
                                    >
                                        <option value="">-- Sélectionner un dépôt --</option>
                                        {depots.map((d) => (
                                            <option key={d.id} value={d.nom}>
                                                {d.nom}
                                            </option>
                                        ))}
                                    </Input>
                                    <FormFeedback>{String(validation.errors.depot ?? "")}</FormFeedback>
                                </Col>

                                <Col md={12}>
                                    <Label className="fw-semibold">Description</Label>
                                    <Input
                                        type="textarea"
                                        name="description"
                                        rows={2}
                                        placeholder="Remarques ou notes sur cet inventaire..."
                                        value={validation.values.description}
                                        onChange={validation.handleChange}
                                    />
                                </Col>
                            </Row>

                            {/* ── Articles section ─────────────────────────────────────── */}
                            <hr className="my-3" />
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h6 className="mb-0 fw-bold">
                                    <i className="ri-list-check-2 me-2 text-primary" />
                                    Lignes d'Articles ({lines.length})
                                </h6>
                                <div className="d-flex gap-2 align-items-center">
                                    <div className="search-box" style={{ width: 220 }}>
                                        <Input
                                            type="text"
                                            placeholder="Rechercher article..."
                                            value={articleSearch}
                                            onChange={(e) => setArticleSearch(e.target.value)}
                                            bsSize="sm"
                                        />
                                        <i className="ri-search-line search-icon" />
                                    </div>
                                    <Button color="success" size="sm" onClick={addLine}>
                                        <i className="ri-add-line me-1" />
                                        Ajouter ligne
                                    </Button>
                                </div>
                            </div>

                            <div className="table-responsive" style={{ maxHeight: 360, overflowY: "auto" }}>
                                <Table bordered hover size="sm" className="align-middle mb-0">
                                    <thead className="table-light sticky-top">
                                        <tr>
                                            <th style={{ width: 40 }}>#</th>
                                            <th style={{ minWidth: 260 }}>Article</th>
                                            <th style={{ width: 120 }}>Réf.</th>
                                            <th style={{ width: 110 }}>Qté Réelle</th>
                                            <th style={{ width: 110 }}>PU Achat HT</th>
                                            <th style={{ width: 110 }}>PU Achat TTC</th>
                                            <th style={{ width: 60 }}>TVA %</th>
                                            <th style={{ width: 120 }}>Total HT</th>
                                            <th style={{ width: 120 }}>Total TTC</th>
                                            <th style={{ width: 50 }}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {lines.map((line, idx) => {
                                            const art = articles.find(
                                                (a) => a.id === Number(line.article_id)
                                            );
                                            // For article dropdown: show all if no article selected for this line,
                                            // or show filtered by search + currently selected article
                                            const dropdownOptions =
                                                line.article_id !== ""
                                                    ? articles // show all when already selected so user can re-choose
                                                    : filteredArticles;

                                            return (
                                                <tr key={line.key}>
                                                    <td className="text-muted text-center">{idx + 1}</td>
                                                    <td>
                                                        <Input
                                                            type="select"
                                                            bsSize="sm"
                                                            value={line.article_id}
                                                            onChange={(e) =>
                                                                updateLine(line.key, "article_id", e.target.value)
                                                            }
                                                        >
                                                            <option value="">-- Article --</option>
                                                            {dropdownOptions.map((a) => (
                                                                <option key={a.id} value={a.id}>
                                                                    {a.designation}
                                                                    {a.reference ? ` (${a.reference})` : ""}
                                                                </option>
                                                            ))}
                                                        </Input>
                                                    </td>
                                                    <td>
                                                        <span className="text-muted small">
                                                            {art?.reference || "-"}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <Input
                                                            type="number"
                                                            bsSize="sm"
                                                            min={0}
                                                            step="0.01"
                                                            placeholder="0"
                                                            value={line.qte_reel}
                                                            onChange={(e) =>
                                                                updateLine(line.key, "qte_reel", e.target.value)
                                                            }
                                                            className={
                                                                Number(line.qte_reel) > 0
                                                                    ? "border-success"
                                                                    : ""
                                                            }
                                                        />
                                                    </td>
                                                    <td>
                                                        <span className="text-muted small">
                                                            {line.pua_ht.toFixed(3)}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className="fw-medium text-info small">
                                                            {line.pua_ttc.toFixed(3)}
                                                        </span>
                                                    </td>
                                                    <td className="text-center">
                                                        <Badge color="secondary">{line.tva}%</Badge>
                                                    </td>
                                                    <td className="text-end">
                                                        <span className="fw-medium">
                                                            {line.total_ht.toFixed(3)}
                                                        </span>
                                                    </td>
                                                    <td className="text-end">
                                                        <span className="fw-bold text-success">
                                                            {line.total_ttc.toFixed(3)}
                                                        </span>
                                                    </td>
                                                    <td className="text-center">
                                                        <Button
                                                            color="soft-danger"
                                                            size="sm"
                                                            onClick={() => removeLine(line.key)}
                                                            disabled={lines.length === 1}
                                                        >
                                                            <i className="ri-delete-bin-line" />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    <tfoot className="table-light">
                                        <tr>
                                            <td colSpan={7} className="text-end fw-bold">
                                                Totaux :
                                            </td>
                                            <td className="text-end fw-bold text-primary">
                                                {grandTotals.ht.toFixed(3)} DT
                                            </td>
                                            <td className="text-end fw-bold text-success">
                                                {grandTotals.ttc.toFixed(3)} DT
                                            </td>
                                            <td />
                                        </tr>
                                    </tfoot>
                                </Table>
                            </div>

                            {/* ── Summary bar ──────────────────────────────────────────── */}
                            <Row className="mt-3 g-2">
                                {[
                                    { label: "Total HT", value: grandTotals.ht, color: "primary" },
                                    { label: "Total TVA", value: grandTotals.tva, color: "warning" },
                                    { label: "Total TTC", value: grandTotals.ttc, color: "success" },
                                ].map((t, i) => (
                                    <Col key={i} md={4}>
                                        <div
                                            className={`border border-${t.color} rounded p-2 text-center bg-${t.color} bg-opacity-10`}
                                        >
                                            <div className="text-muted small">{t.label}</div>
                                            <div className={`fw-bold text-${t.color} fs-5`}>
                                                {t.value.toFixed(3)} DT
                                            </div>
                                        </div>
                                    </Col>
                                ))}
                            </Row>

                            {/* ── Footer buttons ───────────────────────────────────────── */}
                            <div className="d-flex justify-content-end gap-2 mt-4">
                                <Button
                                    type="button"
                                    color="light"
                                    onClick={() => {
                                        setFormModal(false);
                                        validation.resetForm();
                                    }}
                                    disabled={submitting}
                                >
                                    <i className="ri-close-line me-1" />
                                    Annuler
                                </Button>
                                <Button
                                    type="submit"
                                    color="primary"
                                    disabled={submitting}
                                >
                                    {submitting ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" />
                                            Enregistrement...
                                        </>
                                    ) : (
                                        <>
                                            <i className="ri-save-line me-1" />
                                            {isEdit ? "Mettre à jour" : "Créer l'inventaire"}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </Form>
                    )}
                </ModalBody>
            </Modal>

            {/* ═══════════════════════════════════════════════════════════════════════
           DETAIL VIEW MODAL
      ══════════════════════════════════════════════════════════════════════════ */}
            <Modal
                isOpen={detailModal}
                toggle={() => setDetailModal(false)}
                size="xl"
                centered
                scrollable
            >
                <ModalHeader
                    toggle={() => setDetailModal(false)}
                    className="bg-light"
                >
                    <span className="d-flex align-items-center gap-2">
                        <i className="ri-clipboard-check-line text-success fs-4" />
                        Détail Inventaire — {selected?.numero}
                    </span>
                </ModalHeader>

                <ModalBody>
                    {selected && (
                        <>
                            {/* Meta info */}
                            <Row className="g-3 mb-4">
                                {[
                                    { label: "Numéro", value: selected.numero, icon: "ri-hashtag" },
                                    {
                                        label: "Date",
                                        value: moment(selected.date).format("DD/MM/YYYY"),
                                        icon: "ri-calendar-line",
                                    },
                                    {
                                        label: "Date Inventaire",
                                        value: moment(selected.date_inventaire).format("DD/MM/YYYY"),
                                        icon: "ri-calendar-check-line",
                                    },
                                    { label: "Dépôt", value: selected.depot, icon: "ri-store-2-line" },
                                    {
                                        label: "Statut",
                                        value: (
                                            <Badge color={statusColor[selected.status] || "secondary"}>
                                                {selected.status}
                                            </Badge>
                                        ),
                                        icon: "ri-information-line",
                                    },
                                    {
                                        label: "Articles",
                                        value: selected.article_count,
                                        icon: "ri-archive-line",
                                    },
                                ].map((m, i) => (
                                    <Col key={i} md={2} sm={4} xs={6}>
                                        <div className="border rounded p-2 h-100">
                                            <div className="text-muted small mb-1">
                                                <i className={`${m.icon} me-1`} />
                                                {m.label}
                                            </div>
                                            <div className="fw-semibold">{m.value}</div>
                                        </div>
                                    </Col>
                                ))}

                                {selected.description && (
                                    <Col md={12}>
                                        <Alert color="light" className="mb-0">
                                            <i className="ri-sticky-note-line me-2 text-info" />
                                            {selected.description}
                                        </Alert>
                                    </Col>
                                )}
                            </Row>

                            {/* Items table */}
                            <h6 className="fw-bold mb-3">
                                <i className="ri-list-check-2 me-2 text-primary" />
                                Lignes d'inventaire ({selected.items?.length || 0})
                            </h6>

                            {!selected.items || selected.items.length === 0 ? (
                                <Alert color="info" className="text-center">
                                    Aucune ligne trouvée pour cet inventaire.
                                </Alert>
                            ) : (
                                <div className="table-responsive">
                                    <Table hover bordered size="sm" className="align-middle">
                                        <thead className="table-light">
                                            <tr>
                                                <th>#</th>
                                                <th>Article</th>
                                                <th>Référence</th>
                                                <th className="text-center">Qté Avant</th>
                                                <th className="text-center">Qté Réelle</th>
                                                <th className="text-center">Ajustement</th>
                                                <th className="text-end">PU Achat HT</th>
                                                <th className="text-end">PU Achat TTC</th>
                                                <th className="text-center">TVA %</th>
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
                                                        <td className="fw-medium">
                                                            {item.article?.designation || `Art. ${item.article_id}`}
                                                        </td>
                                                        <td>
                                                            <Badge color="light" className="text-dark">
                                                                {item.article?.reference || "-"}
                                                            </Badge>
                                                        </td>
                                                        <td className="text-center">
                                                            {(Number(item.qte_avant) || 0).toFixed(2)}
                                                        </td>
                                                        <td className="text-center">
                                                            <span className="fw-bold text-primary">
                                                                {(Number(item.qte_reel) || 0).toFixed(2)}
                                                            </span>
                                                        </td>
                                                        <td className="text-center">
                                                            <Badge
                                                                color={
                                                                    adj > 0
                                                                        ? "success"
                                                                        : adj < 0
                                                                            ? "danger"
                                                                            : "secondary"
                                                                }
                                                            >
                                                                {adj > 0 ? "+" : ""}
                                                                {adj.toFixed(2)}
                                                            </Badge>
                                                        </td>
                                                        <td className="text-end">
                                                            {fmt(item.pua_ht)}
                                                        </td>
                                                        <td className="text-end text-info fw-medium">
                                                            {fmt(item.pua_ttc)}
                                                        </td>
                                                        <td className="text-center">
                                                            <Badge color="secondary">
                                                                {item.tva || 0}%
                                                            </Badge>
                                                        </td>
                                                        <td className="text-end">
                                                            {fmt(item.total_ht)}
                                                        </td>
                                                        <td className="text-end fw-bold text-success">
                                                            {fmt(item.total_ttc)}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                        <tfoot className="table-light">
                                            <tr>
                                                <td colSpan={9} className="text-end fw-bold">
                                                    Totaux
                                                </td>
                                                <td className="text-end fw-bold text-primary">
                                                    {fmt(selected.total_ht)}
                                                </td>
                                                <td className="text-end fw-bold text-success">
                                                    {fmt(selected.total_ttc)}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </Table>
                                </div>
                            )}

                            {/* Summary */}
                            <Row className="mt-4 g-2">
                                {[
                                    {
                                        label: "Total HT",
                                        value: fmt(selected.total_ht),
                                        color: "primary",
                                        icon: "ri-price-tag-3-line",
                                    },
                                    {
                                        label: "Total TVA",
                                        value: fmt(selected.total_tva),
                                        color: "warning",
                                        icon: "ri-percent-line",
                                    },
                                    {
                                        label: "Total TTC",
                                        value: fmt(selected.total_ttc),
                                        color: "success",
                                        icon: "ri-money-dollar-circle-line",
                                    },
                                ].map((s, i) => (
                                    <Col key={i} md={4}>
                                        <Card
                                            className={`border-${s.color} bg-${s.color} bg-opacity-10 mb-0`}
                                        >
                                            <CardBody className="py-2 text-center">
                                                <i className={`${s.icon} me-1 text-${s.color}`} />
                                                <span className="text-muted small">{s.label}</span>
                                                <div className={`fw-bold fs-5 text-${s.color}`}>
                                                    {s.value}
                                                </div>
                                            </CardBody>
                                        </Card>
                                    </Col>
                                ))}
                            </Row>

                            <div className="d-flex justify-content-between mt-4">
                                <div className="text-muted small">
                                    <i className="ri-time-line me-1" />
                                    Créé le {moment(selected.created_at).format("DD/MM/YYYY HH:mm")}
                                    &nbsp;&nbsp;|&nbsp;&nbsp;
                                    <i className="ri-edit-line me-1" />
                                    Modifié le {moment(selected.updated_at).format("DD/MM/YYYY HH:mm")}
                                </div>
                                <div className="d-flex gap-2">
                                    <Button
                                        color="primary"
                                        size="sm"
                                        onClick={() => {
                                            setDetailModal(false);
                                            openEdit(selected);
                                        }}
                                    >
                                        <i className="ri-pencil-line me-1" />
                                        Modifier
                                    </Button>
                                    <Button
                                        color="light"
                                        size="sm"
                                        onClick={() => setDetailModal(false)}
                                    >
                                        Fermer
                                    </Button>
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
