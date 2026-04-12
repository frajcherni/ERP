// src/pages/Ecommerce/Vente/DevisPDFModal.tsx
import React from "react";
import { Modal, ModalHeader, ModalBody } from "reactstrap";
import { PDFViewer } from '@react-pdf/renderer';
import DevisPDF from "./DevisPdf";
import { BonCommandeClient } from "../../../Components/Article/Interfaces";

interface DevisPDFModalProps {
    isOpen: boolean;
    toggle: () => void;
    bonCommande: BonCommandeClient;
    companyInfo: {
        name: string;
        address: string;
        city: string;
        phone: string;
        email: string;
        website: string;
        taxId: string;
        gsm: string;
    };
}

const DevisPDFModal: React.FC<DevisPDFModalProps> = ({
    isOpen,
    toggle,
    bonCommande,
    companyInfo
}) => {
    return (
        <Modal isOpen={isOpen} toggle={toggle} size="xl" centered>
            <ModalHeader toggle={toggle}>
                Devis #{bonCommande.numeroCommande} - {bonCommande.client?.raison_sociale || bonCommande.clientWebsite?.nomPrenom}
            </ModalHeader>
            <ModalBody style={{ padding: 0, height: '80vh' }}>
                <PDFViewer width="100%" height="100%">
                    <DevisPDF bonCommande={bonCommande} companyInfo={companyInfo} />
                </PDFViewer>
            </ModalBody>
        </Modal>
    );
};

export default DevisPDFModal;
