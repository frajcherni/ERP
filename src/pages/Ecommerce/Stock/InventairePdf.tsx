import React from "react";
import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
} from "@react-pdf/renderer";
import moment from "moment";
import { Inventaire, InventaireItem } from "./InventaireServices";

const styles = StyleSheet.create({
    page: {
        flexDirection: "column",
        backgroundColor: "#FFFFFF",
        padding: 28,
        fontSize: 9,
        fontFamily: "Helvetica",
    },
    header: {
        borderBottomWidth: 2,
        borderBottomColor: "#00aeef",
        borderBottomStyle: "solid",
        paddingBottom: 10,
        marginBottom: 16,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-end",
    },
    title: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#1e293b",
    },
    subtitle: {
        fontSize: 9,
        color: "#64748b",
        marginTop: 2,
    },
    metaSection: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 16,
        backgroundColor: "#f8fafc",
        padding: 10,
        borderWidth: 1,
        borderColor: "#e2e8f0",
        borderStyle: "solid",
    },
    metaColumn: {
        width: "48%",
    },
    metaLabel: {
        fontWeight: "bold",
        color: "#64748b",
        fontSize: 8,
        marginBottom: 1,
    },
    metaValue: {
        color: "#0f172a",
        fontSize: 9,
        marginBottom: 6,
    },
    sectionTitle: {
        fontSize: 10,
        fontWeight: "bold",
        color: "#1e293b",
        marginBottom: 6,
        marginTop: 8,
        paddingBottom: 3,
        borderBottomWidth: 1,
        borderBottomColor: "#cbd5e1",
        borderBottomStyle: "solid",
    },
    tableContainer: {
        borderTopWidth: 1,
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderColor: "#e2e8f0",
        borderStyle: "solid",
        marginBottom: 14,
    },
    tableHeader: {
        flexDirection: "row",
        backgroundColor: "#00aeef",
        paddingVertical: 5,
    },
    tableRow: {
        flexDirection: "row",
        borderBottomWidth: 1,
        borderBottomColor: "#e2e8f0",
        borderBottomStyle: "solid",
        paddingVertical: 5,
        alignItems: "center",
    },
    tableRowConsigne: {
        flexDirection: "row",
        borderBottomWidth: 1,
        borderBottomColor: "#e2e8f0",
        borderBottomStyle: "solid",
        paddingVertical: 5,
        alignItems: "center",
        backgroundColor: "#f0fdff",
    },
    tableFoot: {
        flexDirection: "row",
        backgroundColor: "#f8fafc",
        paddingVertical: 5,
        borderTopWidth: 1,
        borderTopColor: "#cbd5e1",
        borderTopStyle: "solid",
    },
    colHeader: {
        fontWeight: "bold",
        color: "#ffffff",
        textAlign: "center",
        fontSize: 8,
        paddingHorizontal: 3,
    },
    col: {
        textAlign: "center",
        fontSize: 8,
        paddingHorizontal: 3,
    },
    colLeft: {
        textAlign: "left",
        fontSize: 8,
        paddingHorizontal: 3,
    },
    colRight: {
        textAlign: "right",
        fontSize: 8,
        paddingHorizontal: 3,
    },
    colNum: { width: "5%" },
    colDesig: { width: "30%" },
    colRef: { width: "13%" },
    colType: { width: "10%" },
    colQte: { width: "8%" },
    colPUHT: { width: "11%" },
    colTotalHT: { width: "11%" },
    colTotalTTC: { width: "12%" },

    summarySection: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 12,
        gap: 10,
    },
    summaryBox: {
        width: "48%",
        borderWidth: 1,
        borderColor: "#e2e8f0",
        borderStyle: "solid",
        padding: 10,
    },
    summaryBoxTitle: {
        fontSize: 10,
        fontWeight: "bold",
        color: "#0f172a",
        marginBottom: 7,
    },
    summaryRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 4,
        paddingBottom: 3,
        borderBottomWidth: 1,
        borderBottomColor: "#f1f5f9",
        borderBottomStyle: "solid",
    },
    summaryRowLast: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 5,
        paddingTop: 5,
        borderTopWidth: 1,
        borderTopColor: "#cbd5e1",
        borderTopStyle: "solid",
    },
    summaryLabel: { fontSize: 8, color: "#475569" },
    summaryValue: { fontSize: 8, color: "#0f172a", fontWeight: "bold" },
    highlightGreen: { color: "#16a34a" },
    highlightBlue: { color: "#0ea5e9" },
    consigneBadge: {
        fontSize: 6,
        backgroundColor: "#0ea5e9",
        color: "#ffffff",
        paddingHorizontal: 3,
        paddingVertical: 1,
        marginLeft: 3,
    },
    footer: {
        position: "absolute",
        bottom: 18,
        left: 28,
        right: 28,
        borderTopWidth: 1,
        borderTopColor: "#cbd5e1",
        borderTopStyle: "solid",
        paddingTop: 4,
        textAlign: "center",
        fontSize: 7,
        color: "#94a3b8",
    },
});

interface InventairePdfProps {
    inventaire: Inventaire;
}

const fmt = (val: any) => `${(parseFloat(val) || 0).toFixed(3)} DT`;

const InventairePdf: React.FC<InventairePdfProps> = ({ inventaire }) => {
    const items: InventaireItem[] = inventaire.items || [];

    // ── 1. Group by article_id — sum qte_reel & totals ───────────────────────
    const grouped = new Map<number, InventaireItem & { _count: number }>();
    items.forEach((item) => {
        const aid = item.article_id;
        if (grouped.has(aid)) {
            const ex = grouped.get(aid)!;
            ex.qte_reel += Number(item.qte_reel) || 0;
            ex.total_ht = (ex.total_ht || 0) + (Number(item.total_ht) || 0);
            ex.total_ttc = (ex.total_ttc || 0) + (Number(item.total_ttc) || 0);
            ex.total_tva = (ex.total_tva || 0) + (Number(item.total_tva) || 0);
            ex._count += 1;
        } else {
            grouped.set(aid, {
                ...item,
                qte_reel: Number(item.qte_reel) || 0,
                total_ht: Number(item.total_ht) || 0,
                total_ttc: Number(item.total_ttc) || 0,
                total_tva: Number(item.total_tva) || 0,
                _count: 1,
            });
        }
    });
    const rows = Array.from(grouped.values());

    // ── 2. Consigné vs Non Consigné ──────────────────────────────────────────
    let consigneHT = 0, consigneTTC = 0;
    let nonConsigneHT = 0, nonConsigneTTC = 0;

    items.forEach((item) => {
        const isConsigne = (item.article as any)?.type === "Consigné";
        const ht = Number(item.total_ht) || 0;
        const ttc = Number(item.total_ttc) || 0;
        if (isConsigne) { consigneHT += ht; consigneTTC += ttc; }
        else { nonConsigneHT += ht; nonConsigneTTC += ttc; }
    });

    // ── 3. Paginate: 10 lines per page ──────────────────────────────────────
    const LINES_PER_PAGE = 10;
    const pages: typeof rows[] = [];
    for (let i = 0; i < rows.length; i += LINES_PER_PAGE) {
        pages.push(rows.slice(i, i + LINES_PER_PAGE));
    }

    return (
        <Document>
            {/* ═ SUMMARY PAGE ═════════════════════════════════════════════════ */}
            <Page size="A4" style={styles.page} orientation="landscape">
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>INVENTAIRE PHYSIQUE</Text>
                        <Text style={styles.subtitle}>Rapport consolidé – {inventaire.numero}</Text>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                        <Text style={{ fontSize: 8, color: "#64748b" }}>Généré le {moment().format("DD/MM/YYYY HH:mm")}</Text>
                    </View>
                </View>

                {/* Meta */}
                <View style={styles.metaSection}>
                    <View style={styles.metaColumn}>
                        <Text style={styles.metaLabel}>Numéro d'inventaire</Text>
                        <Text style={[styles.metaValue, { fontWeight: "bold" }]}>{inventaire.numero}</Text>
                        <Text style={styles.metaLabel}>Dépôt / Magasin</Text>
                        <Text style={styles.metaValue}>{inventaire.depot}</Text>
                    </View>
                    <View style={styles.metaColumn}>
                        <Text style={styles.metaLabel}>Date de création</Text>
                        <Text style={styles.metaValue}>{moment(inventaire.date).format("DD/MM/YYYY")}</Text>
                        <Text style={styles.metaLabel}>Date d'inventaire</Text>
                        <Text style={styles.metaValue}>{moment(inventaire.date_inventaire).format("DD/MM/YYYY")}</Text>
                    </View>
                </View>

                {inventaire.description ? (
                    <View style={{ marginBottom: 12 }}>
                        <Text style={{ fontSize: 8, color: "#475569" }}>
                            <Text style={{ fontWeight: "bold" }}>Notes : </Text>{inventaire.description}
                        </Text>
                    </View>
                ) : null}

                {/* Summary Statistics */}
                <Text style={styles.sectionTitle}>Résumé des Totaux</Text>
                
                {/* Summary Boxes */}
                <View style={styles.summarySection}>
                    {/* Consigné breakdown */}
                    <View style={styles.summaryBox}>
                        <Text style={styles.summaryBoxTitle}>Répartition par type d'article</Text>

                        <View style={styles.summaryRow}>
                            <Text style={[styles.summaryLabel, { color: "#0ea5e9" }]}>Consigné — Total HT</Text>
                            <Text style={[styles.summaryValue, styles.highlightBlue]}>{consigneHT.toFixed(3)} DT</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={[styles.summaryLabel, { color: "#0ea5e9" }]}>Consigné — Total TTC</Text>
                            <Text style={[styles.summaryValue, styles.highlightBlue]}>{consigneTTC.toFixed(3)} DT</Text>
                        </View>

                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Non Consigné — Total HT</Text>
                            <Text style={styles.summaryValue}>{nonConsigneHT.toFixed(3)} DT</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Non Consigné — Total TTC</Text>
                            <Text style={styles.summaryValue}>{nonConsigneTTC.toFixed(3)} DT</Text>
                        </View>
                    </View>

                    {/* General totals */}
                    <View style={[styles.summaryBox, { backgroundColor: "#f8fafc" }]}>
                        <Text style={styles.summaryBoxTitle}>Totaux Généraux</Text>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Total HT</Text>
                            <Text style={styles.summaryValue}>{fmt(inventaire.total_ht)}</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Total TVA</Text>
                            <Text style={styles.summaryValue}>{fmt(inventaire.total_tva)}</Text>
                        </View>
                        <View style={styles.summaryRowLast}>
                            <Text style={[styles.summaryLabel, styles.highlightGreen, { fontWeight: "bold" }]}>Total TTC</Text>
                            <Text style={[styles.summaryValue, styles.highlightGreen, { fontSize: 10 }]}>{fmt(inventaire.total_ttc)}</Text>
                        </View>
                    </View>
                </View>

                <View style={{ marginTop: 20, fontSize: 8, color: "#94a3b8", textAlign: "center" }}>
                    <Text>Total Articles: {rows.length} | Total Lignes: {items.length}</Text>
                </View>

                {/* Footer */}
                <Text style={styles.footer}>
                    Gestion de Stock — Inventaire {inventaire.numero} — Dépôt: {inventaire.depot} — Généré le {moment().format("DD/MM/YYYY HH:mm")}
                </Text>
            </Page>

            {/* ═ DETAIL PAGES (10 lines per page) ════════════════════════════ */}
            {pages.map((pageRows, pageIdx) => (
                <Page key={pageIdx} size="A4" style={styles.page} orientation="landscape">
                    {/* Header */}
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.title}>INVENTAIRE PHYSIQUE — Détail</Text>
                            <Text style={styles.subtitle}>Page {pageIdx + 1} sur {pages.length} – {inventaire.numero}</Text>
                        </View>
                        <View style={{ alignItems: "flex-end" }}>
                            <Text style={{ fontSize: 8, color: "#64748b" }}>{moment().format("DD/MM/YYYY HH:mm")}</Text>
                        </View>
                    </View>

                    {/* Quick reference */}
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10, fontSize: 8, color: "#64748b" }}>
                        <Text>Dépôt: {inventaire.depot}</Text>
                        <Text>Date: {moment(inventaire.date_inventaire).format("DD/MM/YYYY")}</Text>
                    </View>

                    {/* Articles Table */}
                    <Text style={styles.sectionTitle}>Articles (Page {pageIdx + 1} de {pages.length})</Text>
                    <View style={styles.tableContainer}>
                        {/* Header */}
                        <View style={styles.tableHeader}>
                            <Text style={[styles.colNum, styles.colHeader]}>N°</Text>
                            <Text style={[styles.colDesig, styles.colHeader, { textAlign: "left" }]}>Désignation</Text>
                            <Text style={[styles.colRef, styles.colHeader]}>Référence</Text>
                            <Text style={[styles.colType, styles.colHeader]}>Type</Text>
                            <Text style={[styles.colQte, styles.colHeader]}>Qté</Text>
                            <Text style={[styles.colPUHT, styles.colHeader]}>PU HT</Text>
                            <Text style={[styles.colTotalHT, styles.colHeader]}>Total HT</Text>
                            <Text style={[styles.colTotalTTC, styles.colHeader]}>Total TTC</Text>
                        </View>

                        {/* Rows */}
                        {pageRows.map((item, i) => {
                            const isConsigne = (item.article as any)?.type === "Consigné";
                            const rowStyle = isConsigne ? styles.tableRowConsigne : styles.tableRow;
                            const globalIdx = pageIdx * LINES_PER_PAGE + i + 1;
                            return (
                                <View style={rowStyle} key={item.article_id}>
                                    <Text style={[styles.colNum, styles.col]}>{globalIdx}</Text>
                                    <Text style={[styles.colDesig, styles.colLeft]}>
                                        {item.article?.designation || `Art. ${item.article_id}`}
                                    </Text>
                                    <Text style={[styles.colRef, styles.col]}>{item.article?.reference || "-"}</Text>
                                    <Text style={[styles.colType, styles.col, isConsigne ? { color: "#0ea5e9" } : { color: "#64748b" }]}>
                                        {isConsigne ? "Consigné" : "Non consigné"}
                                    </Text>
                                    <Text style={[styles.colQte, styles.col, { fontWeight: "bold" }]}>{item.qte_reel}</Text>
                                    <Text style={[styles.colPUHT, styles.colRight]}>{(parseFloat(String(item.pua_ht)) || 0).toFixed(3)}</Text>
                                    <Text style={[styles.colTotalHT, styles.colRight]}>{(item.total_ht || 0).toFixed(3)}</Text>
                                    <Text style={[styles.colTotalTTC, styles.colRight, { fontWeight: "bold", color: "#16a34a" }]}>
                                        {(item.total_ttc || 0).toFixed(3)} DT
                                    </Text>
                                </View>
                            );
                        })}

                        {/* Page footer totals */}
                        {pageIdx === pages.length - 1 && (
                            <View style={styles.tableFoot}>
                                <Text style={[styles.colNum, styles.col]}></Text>
                                <Text style={[styles.colDesig, styles.colLeft, { fontWeight: "bold" }]}>TOTAUX GÉNÉRAUX</Text>
                                <Text style={[styles.colRef, styles.col]}></Text>
                                <Text style={[styles.colType, styles.col]}></Text>
                                <Text style={[styles.colQte, styles.col, { fontWeight: "bold" }]}>
                                    {rows.reduce((s, r) => s + r.qte_reel, 0)}
                                </Text>
                                <Text style={[styles.colPUHT, styles.col]}></Text>
                                <Text style={[styles.colTotalHT, styles.colRight, { fontWeight: "bold", color: "#2563eb" }]}>
                                    {fmt(inventaire.total_ht)}
                                </Text>
                                <Text style={[styles.colTotalTTC, styles.colRight, { fontWeight: "bold", color: "#16a34a" }]}>
                                    {fmt(inventaire.total_ttc)}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Footer */}
                    <Text style={styles.footer}>
                        Gestion de Stock — Inventaire {inventaire.numero} — Page {pageIdx + 1}/{pages.length} — Généré le {moment().format("DD/MM/YYYY HH:mm")}
                    </Text>
                </Page>
            ))}
        </Document>
    );
};

export default InventairePdf;
