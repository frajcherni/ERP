// src/Components/CommandeClient/BonCommandePDFModal.tsx
import React from "react";
import { Modal, ModalHeader, ModalBody } from "reactstrap";
import { PDFViewer } from '@react-pdf/renderer';
import BonCommandePDF from "./BonCommandePDF";
import { BonCommandeClient } from "../../../Components/Article/Interfaces";

interface BonCommandePDFModalProps {
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
        gsm:string;
    };
}

const BonCommandePDFModal: React.FC<BonCommandePDFModalProps> = ({ 
    isOpen, 
    toggle, 
    bonCommande, 
    companyInfo 
}) => {
    return (
        <Modal isOpen={isOpen} toggle={toggle} size="xl" centered>
            <ModalHeader toggle={toggle}>
                Bon de Commande #{bonCommande.numeroCommande} - {bonCommande.client?.raison_sociale || bonCommande.clientWebsite?.nomPrenom}
            </ModalHeader>
            <ModalBody style={{ padding: 0, height: '80vh' }}>
                <PDFViewer width="100%" height="100%">
                    <BonCommandePDF bonCommande={bonCommande} companyInfo={companyInfo} />
                </PDFViewer>
            </ModalBody>
        </Modal>
    );
};

export default BonCommandePDFModal;