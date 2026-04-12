import React, { useState } from "react";
import { Modal, ModalHeader, ModalBody, Button } from "reactstrap";
import { PDFViewer } from '@react-pdf/renderer';
import { FactureFournisseur } from "../../../Components/Article/Interfaces";
import FacturePDF from "./FacturePDF";

interface FacturePDFModalProps {
  isOpen: boolean;
  toggle: () => void;
  facture: FactureFournisseur | null;
  companyInfo: {
    name: string;
    address: string;
    city: string;
    phone: string;
    email: string;
    website: string;
    logo?: string;
    taxId: string;
  };
}

const FacturePDFModal: React.FC<FacturePDFModalProps> = ({ 
  isOpen, 
  toggle, 
  facture, 
  companyInfo 
}) => {
  const [isClient, setIsClient] = useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  if (!facture) return null;

  return (
    <Modal isOpen={isOpen} toggle={toggle} size="lg" centered>
      <ModalHeader toggle={toggle}>
        Aperçu Facture - {facture.numeroFacture}
      </ModalHeader>
      <ModalBody style={{ height: '80vh', padding: 0 }}>
        {isClient && (
          <PDFViewer width="100%" height="100%" style={{ border: 'none' }}>
            <FacturePDF facture={facture} companyInfo={companyInfo} />
          </PDFViewer>
        )}
      </ModalBody>
    </Modal>
  );
};

export default FacturePDFModal;