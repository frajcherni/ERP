import React from "react";
import { Modal, ModalHeader, ModalBody } from "reactstrap";
import { PDFViewer } from "@react-pdf/renderer";
import AchatDocumentPDF, { AchatDocumentPDFProps } from "./AchatDocumentPDF";

interface AchatDocumentPDFModalProps {
  isOpen: boolean;
  toggle: () => void;
  /** null while nothing is selected: the modal renders nothing */
  document: AchatDocumentPDFProps | null;
}

const AchatDocumentPDFModal: React.FC<AchatDocumentPDFModalProps> = ({ isOpen, toggle, document }) => {
  if (!document) return null;

  return (
    <Modal isOpen={isOpen} toggle={toggle} size="xl" centered>
      <ModalHeader toggle={toggle}>
        {document.title} #{document.numero} - {document.fournisseur?.raison_sociale}
      </ModalHeader>
      <ModalBody style={{ padding: 0, height: "80vh" }}>
        <PDFViewer width="100%" height="100%">
          <AchatDocumentPDF {...document} />
        </PDFViewer>
      </ModalBody>
    </Modal>
  );
};

export default AchatDocumentPDFModal;
