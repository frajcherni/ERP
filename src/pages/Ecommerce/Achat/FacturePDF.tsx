// src/pages/Ecommerce/Achat/FacturePDF.tsx
import React from "react";
import { Font } from "@react-pdf/renderer";
import { FactureFournisseur } from "../../../Components/Article/Interfaces";
import AchatDocumentPDF, { AchatDocumentPDFProps } from "./AchatDocumentPDF";

// Not used by this file: this registration replaces the built-in "Helvetica" for the whole app,
// and the receipt PDFs, the journal and the inventory PDF (fontFamily "Helvetica") are drawn
// with it. Removing it would change how they look.
Font.register({
  family: "Helvetica",
  fonts: [
    { src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf", fontWeight: 400 },
    { src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf", fontWeight: 700 },
  ],
});

interface FacturePDFProps {
  facture: FactureFournisseur;
  companyInfo: AchatDocumentPDFProps["companyInfo"];
}

/**
 * Facture fournisseur: same layout, pagination and totals as the bons de commande / réception
 * (AchatDocumentPDF), which follow the ventes PDFs.
 */
const FacturePDF: React.FC<FacturePDFProps> = ({ facture, companyInfo }) => (
  <AchatDocumentPDF
    title="FACTURE FOURNISSEUR"
    documentLabel="facture"
    feminine
    numero={facture.numeroFacture}
    date={facture.dateFacture}
    dateLabel="Date Facture"
    fournisseur={facture.fournisseur}
    articles={facture.articles || []}
    remise={facture.remise}
    remiseType={facture.remiseType}
    timbreFiscal={facture.timbreFiscal}
    payment={{
      montantPaye: Number(facture.montantPaye) || 0,
      resteAPayer: Number(facture.resteAPayer) || 0,
    }}
    companyInfo={companyInfo}
  />
);

export default FacturePDF;
