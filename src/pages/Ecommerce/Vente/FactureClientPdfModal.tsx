// src/Components/FactureClient/FacturePDFModal.tsx
import React from "react";
import { Modal, ModalHeader, ModalBody } from "reactstrap";
import { PDFViewer } from '@react-pdf/renderer';
import FacturePDF from "./FactureClientPdf";
import { FactureClient } from "../../../Components/Article/Interfaces";

interface FacturePDFModalProps {
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
        backgroundImage : string;
       
    };
}

const FacturePDFModal: React.FC<FacturePDFModalProps> = ({ 
    isOpen, 
    toggle, 
    facture, 
    companyInfo 
}) => {
    return (
        <Modal isOpen={isOpen} toggle={toggle} size="xl" centered>
            <ModalHeader toggle={toggle}>
                Facture #{facture.numeroFacture} - {facture.client?.raison_sociale}
            </ModalHeader>
            <ModalBody style={{ padding: 0, height: '80vh' }}>
                <PDFViewer width="100%" height="100%">
                    <FacturePDF facture={facture} companyInfo={companyInfo} />
                </PDFViewer>
            </ModalBody>
        </Modal>
    );
};

export default FacturePDFModal;