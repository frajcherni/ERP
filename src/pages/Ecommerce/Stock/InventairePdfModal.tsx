import React from "react";
import { Modal, ModalHeader, ModalBody } from "reactstrap";
import { PDFViewer } from "@react-pdf/renderer";
import InventairePdf from "./InventairePdf";
import { Inventaire } from "./InventaireServices";

interface InventairePdfModalProps {
    isOpen: boolean;
    toggle: () => void;
    inventaire: Inventaire | null;
}

const InventairePdfModal: React.FC<InventairePdfModalProps> = ({
    isOpen,
    toggle,
    inventaire,
}) => {
    if (!inventaire) return null;

    return (
        <Modal isOpen={isOpen} toggle={toggle} size="xl" centered>
            <ModalHeader toggle={toggle}>
                <i className="ri-file-pdf-line me-2 text-danger" />
                Rapport PDF — Inventaire {inventaire.numero}
            </ModalHeader>
            <ModalBody style={{ padding: 0, height: "80vh" }}>
                <PDFViewer width="100%" height="100%" style={{ border: "none" }}>
                    <InventairePdf inventaire={inventaire} />
                </PDFViewer>
            </ModalBody>
        </Modal>
    );
};

export default InventairePdfModal;
