import React, { useRef } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from 'reactstrap';
import { PDFViewer, PDFDownloadLink, pdf } from '@react-pdf/renderer';
import VenteComptoirePDF from './VenteComptoirePDF';
import VenteComptoireReceiptPDF from './VenteComptoireReceiptPDF';
import { BonCommandeClient } from '../../../Components/Article/Interfaces';

interface VenteComptoirePDFModalProps {
  isOpen: boolean;
  toggle: () => void;
  bonCommande: BonCommandeClient | null;
  companyInfo: any;
  pdfType: 'facture' | 'receipt';
}

const VenteComptoirePDFModal: React.FC<VenteComptoirePDFModalProps> = ({ 
  isOpen, 
  toggle, 
  bonCommande, 
  companyInfo, 
  pdfType 
}) => {
  if (!bonCommande) return null;

  const handleTestReceipt = async () => {
    try {
      const pdfInstance = pdf(
        <VenteComptoireReceiptPDF 
          bonCommande={bonCommande} 
          companyInfo={companyInfo} 
        />
      );
      
      const blob = await pdfInstance.toBlob();
      const url = URL.createObjectURL(blob);
      
      // Ouvrir avec une taille fixe de 80mm
      const testWindow = window.open('', '_blank');
      if (testWindow) {
        testWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Test Reçu 80mm</title>
              <style>
                body { 
                  margin: 0; 
                  padding: 20px;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                }
                .container {
                  width: 80mm;
                  border: 2px dashed red;
                  background: white;
                }
                .size-info {
                  background: yellow;
                  padding: 10px;
                  margin-bottom: 10px;
                  text-align: center;
                  font-family: Arial;
                }
                embed {
                  width: 80mm;
                  height: 200mm;
                }
              </style>
            </head>
            <body>
              <div class="size-info">
                🎯 ZONE DE TEST 80mm - Le contenu doit tenir dans cette zone
              </div>
              <div class="container">
                <embed src="${url}" type="application/pdf">
              </div>
            </body>
          </html>
        `);
        testWindow.document.close();
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleMeasureReceipt = async () => {
    try {
      const pdfInstance = pdf(
        <VenteComptoireReceiptPDF 
          bonCommande={bonCommande} 
          companyInfo={companyInfo} 
        />
      );
      
      const blob = await pdfInstance.toBlob();
      const url = URL.createObjectURL(blob);
      
      const measureWindow = window.open('', '_blank');
      if (measureWindow) {
        measureWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Mesure Reçu</title>
              <style>
                .ruler {
                  width: 80mm;
                  height: 10mm;
                  background: repeating-linear-gradient(
                    90deg,
                    #000,
                    #000 1mm,
                    transparent 1mm,
                    transparent 9mm
                  );
                  border-bottom: 1px solid #000;
                  margin-bottom: 5mm;
                }
                .ruler::after {
                  content: "80mm";
                  position: absolute;
                  right: 0;
                  top: 12mm;
                  font-size: 8px;
                }
                embed {
                  width: 80mm;
                  border: 1px solid blue;
                }
              </style>
            </head>
            <body style="margin: 20px; display: flex; flex-direction: column; align-items: center;">
              <h3>📐 Test de largeur 80mm</h3>
              <div class="ruler"></div>
              <p>Le PDF doit s'aligner avec la règle de 80mm</p>
              <embed src="${url}" type="application/pdf" width="80mm" height="150mm">
            </body>
          </html>
        `);
        measureWindow.document.close();
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  // Fonction d'impression SIMPLE et FONCTIONNELLE
  const handlePrintReceipt = async () => {
    try {
      const pdfInstance = pdf(
        <VenteComptoireReceiptPDF 
          bonCommande={bonCommande} 
          companyInfo={companyInfo} 
        />
      );
      
      const blob = await pdfInstance.toBlob();
      const url = URL.createObjectURL(blob);
      
      // Ouvrir dans nouvelle fenêtre pour voir l'aperçu
      const previewWindow = window.open(url, '_blank');
      
      if (previewWindow) {
        // Optionnel : Afficher un message pour guider l'utilisateur
        previewWindow.onload = () => {
          const message = `
            ✅ Reçu thermique généré !
            
            Pour tester l'impression :
            1. Cliquez Ctrl+P (Windows) ou Cmd+P (Mac)
            2. Dans "Destination", choisir "Enregistrer au format PDF"
            3. Vérifier que le format est 80mm
            4. Enregistrer et ouvrir le fichier
            
            Le PDF devrait mesurer 80mm de large.
          `;
          console.log(message);
        };
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const PDFComponent = pdfType === 'facture' ? VenteComptoirePDF : VenteComptoireReceiptPDF;
  const fileName = pdfType === 'facture' 
    ? `Facture_${bonCommande.numeroCommande}.pdf` 
    : `Recu_${bonCommande.numeroCommande}.pdf`;

  return (
    <Modal isOpen={isOpen} toggle={toggle} size="xl" centered>
      <ModalHeader toggle={toggle}>
        {pdfType === 'facture' ? 'Facture' : 'Reçu'} #{bonCommande.numeroCommande}
      </ModalHeader>
      
      <ModalBody style={{ height: '80vh' }}>
        <PDFViewer width="100%" height="100%">
          <PDFComponent bonCommande={bonCommande} companyInfo={companyInfo} />
        </PDFViewer>
      </ModalBody>
      
     <ModalFooter>
  {pdfType === 'receipt' && (
    <>
      <Button color="warning" onClick={handleTestReceipt}>
        <i className="ri-ruler-line me-2"></i>
        Tester Format 80mm
      </Button>
      <Button color="success" onClick={handlePrintReceipt}>
        <i className="ri-printer-line me-2"></i>
        Imprimer Reçu
      </Button>
    </>
  )}
</ModalFooter>
    </Modal>
  );
};

export default VenteComptoirePDFModal;