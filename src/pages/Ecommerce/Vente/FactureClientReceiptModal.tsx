// src/Components/FactureClient/FactureClientReceiptModal.tsx
import React from "react";
import { Modal, ModalHeader, ModalBody } from "reactstrap";
import { PDFViewer } from '@react-pdf/renderer';
import FactureClientReceiptPDF from "./FactureClientReceiptPDF";
import { FactureClient } from "../../../Components/Article/Interfaces";

interface FactureClientReceiptModalProps {
    isOpen: boolean;
    toggle: () => void;
    facture: FactureClient;
    companyInfo: {
        name: string;
        address: string;
        city: string;
        phone: string;
        gsm: string;
        email: string;
        website: string;
        taxId: string;
        logo?: string;
    };
}

const FactureClientReceiptModal: React.FC<FactureClientReceiptModalProps> = ({ 
    isOpen, 
    toggle, 
    facture, 
    companyInfo 
}) => {
    return (
        <Modal isOpen={isOpen} toggle={toggle} size="lg" centered>
            <ModalHeader toggle={toggle}>
                Reçu - Facture #{facture.numeroFacture}
            </ModalHeader>
            <ModalBody style={{ padding: 0, height: '80vh' }}>
                <PDFViewer width="100%" height="100%">
                    <FactureClientReceiptPDF facture={facture} companyInfo={companyInfo} />
                </PDFViewer>
            </ModalBody>
        </Modal>
    );
};

export default FactureClientReceiptModal;