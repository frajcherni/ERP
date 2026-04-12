// BonLivraisonPDFModal.tsx
import React from "react";
import { Modal, ModalHeader, ModalBody, Badge } from "reactstrap";
import { PDFViewer } from '@react-pdf/renderer';
import BonLivraisonPDF from "./BonLivraisonPDF";
import BonLivraisonNonValorisePDF from "./BonLivraisonNonValorisePDF";
import { BonLivraison } from "../../../Components/Article/Interfaces";

interface BonLivraisonPDFModalProps {
    isOpen: boolean;
    toggle: () => void;
    bonLivraison: BonLivraison;
    companyInfo: {
        name: string;
        address: string;
        city: string;
        phone: string;
        gsm: string;
        email: string;
        website: string;
        taxId: string;
        logo: string;
    };
    isValorise?: boolean;
}

const BonLivraisonPDFModal: React.FC<BonLivraisonPDFModalProps> = ({ 
    isOpen, 
    toggle, 
    bonLivraison, 
    companyInfo,
    isValorise = true 
}) => {
    return (
        <Modal isOpen={isOpen} toggle={toggle} size="xl" centered>
            <ModalHeader toggle={toggle}>
                Bon de Livraison #{bonLivraison.numeroLivraison} - {bonLivraison.client?.raison_sociale}
                <Badge color={isValorise ? "success" : "secondary"} className="ms-2">
                    {isValorise ? "Valorisé" : "Non Valorisé"}
                </Badge>
            </ModalHeader>
            <ModalBody style={{ padding: 0, height: '80vh' }}>
                <PDFViewer width="100%" height="100%">
                    {isValorise ? (
                        <BonLivraisonPDF bonLivraison={bonLivraison} companyInfo={companyInfo} />
                    ) : (
                        <BonLivraisonNonValorisePDF bonLivraison={bonLivraison} companyInfo={companyInfo} />
                    )}
                </PDFViewer>
            </ModalBody>
        </Modal>
    );
};

export default BonLivraisonPDFModal;