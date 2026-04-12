import React, { useRef, useState } from "react";
import { Modal, ModalHeader, ModalBody, Button } from "reactstrap";
import { FactureClient } from "../../../Components/Article/Interfaces";
import moment from "moment";
import './FactureClientPreview.css'

interface FactureClientPreviewProps {
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
        backgroundImage: string;
    };
}

const FactureClientPreview: React.FC<FactureClientPreviewProps> = ({
    isOpen,
    toggle,
    facture,
    companyInfo
}) => {
    const [isPrinting, setIsPrinting] = useState(false);
    const printRef = useRef<HTMLDivElement>(null);
    
    const exoneration = facture?.exoneration || false;

    // UPDATED calculateTotals function - SAME as FacturePDF
    const calculateTotals = () => {
        if (!facture?.articles || facture.articles.length === 0) {
            return {
                sousTotalHT: 0,
                netHT: 0,
                totalTax: 0,
                grandTotal: 0,
                finalTotal: 0,
                discountAmount: 0,
                tvaBreakdown: {},
            };
        }

        // Step 1: Calculate original totals (without document-level discount)
        let sousTotalHTValue = 0;
        let totalTaxValue = 0;
        let grandTotalValue = 0;

        // Store TVA breakdown for original amounts
        const tvaBreakdownOriginal: { [key: number]: { base: number; montant: number } } = {};

        // Calculate original line amounts (with line-level discounts only)
        facture.articles.forEach((article) => {
            const qty = Number(article.quantite) || 0;
            const articleRemise = Number(article.remise) || 0;
            const tvaRate = Number(article.tva) || 0;

            let unitHT = Number(article.prixUnitaire) || 0;
            let unitTTC = Number(article.prix_ttc) || unitHT * (1 + tvaRate / 100);

            // Calculate line amounts
            const lineHT = Math.round(unitHT * 1000) / 1000;
            const lineTTC = Math.round(unitTTC * 1000) / 1000;

            const montantSousTotalHT = Math.round(qty * lineHT * 1000) / 1000;
            const montantNetHTLigne = Math.round(
                qty * lineHT * (1 - articleRemise / 100) * 1000
            ) / 1000;
            const montantTTCLigne = Math.round(qty * lineTTC * 1000) / 1000;
            const montantTVALigne = Math.round(
                (montantTTCLigne - montantNetHTLigne) * 1000
            ) / 1000;

            sousTotalHTValue += montantSousTotalHT;
            totalTaxValue += montantTVALigne;
            grandTotalValue += montantTTCLigne;

            // Store original TVA breakdown
            if (tvaRate > 0) {
                if (!tvaBreakdownOriginal[tvaRate]) {
                    tvaBreakdownOriginal[tvaRate] = { base: 0, montant: 0 };
                }
                tvaBreakdownOriginal[tvaRate].base += montantNetHTLigne;
                tvaBreakdownOriginal[tvaRate].montant += montantTVALigne;
            }
        });

        // Round original totals
        sousTotalHTValue = Math.round(sousTotalHTValue * 1000) / 1000;
        totalTaxValue = Math.round(totalTaxValue * 1000) / 1000;
        grandTotalValue = Math.round(grandTotalValue * 1000) / 1000;

        let finalTotalValue = grandTotalValue;
        let discountAmountValue = 0;
        let netHTValue = sousTotalHTValue;

        // Initialize final TVA breakdown
        let tvaBreakdownFinal: { [key: number]: { base: number; montant: number } } = {};

        // Apply document-level remise if exists
        const remiseValue = Number(facture.remise) || 0;
        const remiseTypeValue = facture.remiseType || "percentage";

        if (remiseValue > 0) {
            if (remiseTypeValue === "percentage") {
                // ✅ SIMPLE FORMULA: Apply percentage discount on HT
                discountAmountValue = Math.round((sousTotalHTValue * remiseValue / 100) * 1000) / 1000;
                netHTValue = sousTotalHTValue - discountAmountValue;

                // Calculate new TVA proportionally
                const tvaToHtRatio = sousTotalHTValue > 0 ? totalTaxValue / sousTotalHTValue : 0;
                const newTVA = Math.round((netHTValue * tvaToHtRatio) * 1000) / 1000;

                totalTaxValue = newTVA;
                finalTotalValue = Math.round((netHTValue + newTVA) * 1000) / 1000;

                // Calculate TVA breakdown proportionally
                const discountRatio = netHTValue / sousTotalHTValue;

                Object.keys(tvaBreakdownOriginal).forEach(rate => {
                    const tvaRate = parseFloat(rate);
                    tvaBreakdownFinal[tvaRate] = {
                        base: Math.round((tvaBreakdownOriginal[tvaRate].base * discountRatio) * 1000) / 1000,
                        montant: Math.round((tvaBreakdownOriginal[tvaRate].montant * discountRatio) * 1000) / 1000
                    };
                });

            } else if (remiseTypeValue === "fixed") {
                // ✅ FIXED DISCOUNT FORMULA: TTC is given, calculate HT
                finalTotalValue = Math.round(Number(remiseValue) * 1000) / 1000;

                // Find all unique TVA rates
                const tvaRates = Array.from(new Set(facture.articles.map(a => Number(a.tva) || 0)));

                if (tvaRates.length === 1 && tvaRates[0] > 0) {
                    // ✅ SINGLE TVA RATE: HT = TTC / (1 + TVA rate)
                    const tvaRate = tvaRates[0];
                    netHTValue = Math.round((finalTotalValue / (1 + tvaRate / 100)) * 1000) / 1000;
                    totalTaxValue = Math.round((finalTotalValue - netHTValue) * 1000) / 1000;

                    // For single rate, TVA breakdown is simple
                    tvaBreakdownFinal[tvaRate] = {
                        base: netHTValue,
                        montant: totalTaxValue
                    };

                } else {
                    // ✅ MULTIPLE TVA RATES: Use proportional method
                    const discountCoefficient = grandTotalValue > 0 ? finalTotalValue / grandTotalValue : 0;

                    // Reset values
                    netHTValue = 0;
                    totalTaxValue = 0;

                    // Recalculate each line proportionally
                    facture.articles.forEach((article) => {
                        const qty = Number(article.quantite) || 0;
                        const articleRemise = Number(article.remise) || 0;
                        const tvaRate = Number(article.tva) || 0;
                        let unitHT = Number(article.prixUnitaire) || 0;

                        // Calculate original line amounts
                        const montantNetHTLigne = Math.round(
                            qty * unitHT * (1 - articleRemise / 100) * 1000
                        ) / 1000;

                        // Apply coefficient to get new amounts
                        const newLineHT = Math.round((montantNetHTLigne * discountCoefficient) * 1000) / 1000;
                        const newLineTVA = Math.round((newLineHT * (tvaRate / 100)) * 1000) / 1000;

                        netHTValue += newLineHT;
                        totalTaxValue += newLineTVA;

                        // Update TVA breakdown
                        if (tvaRate > 0) {
                            if (!tvaBreakdownFinal[tvaRate]) {
                                tvaBreakdownFinal[tvaRate] = { base: 0, montant: 0 };
                            }
                            tvaBreakdownFinal[tvaRate].base += newLineHT;
                            tvaBreakdownFinal[tvaRate].montant += newLineTVA;
                        }
                    });

                    // Round final values
                    netHTValue = Math.round(netHTValue * 1000) / 1000;
                    totalTaxValue = Math.round(totalTaxValue * 1000) / 1000;
                }

                discountAmountValue = Math.round((sousTotalHTValue - netHTValue) * 1000) / 1000;
            }

            // Final rounding
            netHTValue = Math.round(netHTValue * 1000) / 1000;
            totalTaxValue = Math.round(totalTaxValue * 1000) / 1000;
            finalTotalValue = Math.round(finalTotalValue * 1000) / 1000;
            discountAmountValue = Math.round(discountAmountValue * 1000) / 1000;

        } else {
            // No document-level discount - use original values
            netHTValue = sousTotalHTValue;
            tvaBreakdownFinal = { ...tvaBreakdownOriginal };
        }

        // Apply exoneration if needed
        if (exoneration) {
            // For exoneration, keep TVA breakdown for display but set final TVA to 0
            totalTaxValue = 0;
            finalTotalValue = netHTValue; // TTC = HT when TVA is 0
        }

        // Add timbre fiscal if needed
        if (facture.timbreFiscal) {
            finalTotalValue = Math.round((finalTotalValue + 1) * 1000) / 1000;
        }

        return {
            sousTotalHT: Math.round(sousTotalHTValue * 1000) / 1000,
            netHT: Math.round(netHTValue * 1000) / 1000,
            totalTax: Math.round(totalTaxValue * 1000) / 1000,
            grandTotal: Math.round(grandTotalValue * 1000) / 1000,
            finalTotal: Math.round(finalTotalValue * 1000) / 1000,
            discountAmount: Math.round(discountAmountValue * 1000) / 1000,
            tvaBreakdown: tvaBreakdownFinal,
        };
    };

    const {
        sousTotalHT,
        netHT,  // Will be 152.364 (in your example)
        totalTax,  // Will be 27.637 (in your example)
        grandTotal,
        finalTotal,  // Will be 180.000 (if fixed discount of 180.000 is entered)
        discountAmount,
        tvaBreakdown,
    } = calculateTotals();

    const calculateTVATable = () => {
        try {
            let totalBase = 0;
            let totalMontant = 0;

            Object.keys(tvaBreakdown).forEach(rate => {
                const tvaRate = parseFloat(rate);
                totalBase += tvaBreakdown[tvaRate].base;
                totalMontant += tvaBreakdown[tvaRate].montant;
            });

            return {
                tvaBreakdown: tvaBreakdown,
                totalBase: Math.round(totalBase * 1000) / 1000,
                totalMontant: Math.round(totalMontant * 1000) / 1000,
            };
        } catch (error) {
            console.error("Error calculating TVA table:", error);
            return {
                tvaBreakdown: {},
                totalBase: 0,
                totalMontant: 0,
            };
        }
    };

    const tvaTableData = calculateTVATable();

    const formatCurrency = (amount: number) => {
        return amount.toFixed(3);
    };

    const numberToWords = (num: number): string => {
        try {
            const units = ["", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf"];
            const teens = ["dix", "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf"];
            const tens = ["", "dix", "vingt", "trente", "quarante", "cinquante", "soixante", "soixante-dix", "quatre-vingt", "quatre-vingt-dix"];

            const integerPart = Math.floor(num);
            if (integerPart === 0) return "Zéro dinars zéro millime uniquement";

            let words = "";

            if (integerPart >= 1000) {
                const thousands = Math.floor(integerPart / 1000);
                if (thousands === 1) words += "mille";
                else if (thousands < 10) words += units[thousands] + " mille";
                else if (thousands < 20) words += teens[thousands - 10] + " mille";
                else if (thousands < 100) {
                    const ten = Math.floor(thousands / 10);
                    const unit = thousands % 10;
                    words += tens[ten];
                    if (unit > 0) {
                        if (ten === 7 || ten === 9) words += "-" + teens[unit];
                        else words += "-" + units[unit];
                    }
                    words += " mille";
                }
                const remainder = integerPart % 1000;
                if (remainder > 0) words += " ";
            }

            const remainder = integerPart % 1000;
            if (remainder >= 100) {
                const hundreds = Math.floor(remainder / 100);
                if (hundreds === 1) words += "cent";
                else words += units[hundreds] + " cent";
                const smallRemainder = remainder % 100;
                if (smallRemainder > 0) words += " ";
            }

            const smallRemainder = remainder % 100;
            if (smallRemainder > 0) {
                if (smallRemainder < 10) words += units[smallRemainder];
                else if (smallRemainder < 20) words += teens[smallRemainder - 10];
                else {
                    const ten = Math.floor(smallRemainder / 10);
                    const unit = smallRemainder % 10;
                    words += tens[ten];
                    if (unit > 0) {
                        if (ten === 7 || ten === 9) words += "-" + teens[unit];
                        else words += "-" + units[unit];
                    }
                }
            }

            words += " dinars zéro millime";
            return words.charAt(0).toUpperCase() + words.slice(1) + " uniquement";
        } catch (error) {
            console.error("Error converting number to words:", error);
            return "Montant en dinars uniquement";
        }
    };

    const amountInWords = numberToWords(finalTotal);

    const formatPhoneNumber = (phone: string | null | undefined): string => {
        if (!phone) return "";
        const cleaned = phone.replace(/\D/g, "");
        if (cleaned.length === 8) {
            return `${cleaned.substring(0, 2)} ${cleaned.substring(2, 5)} ${cleaned.substring(5, 8)}`;
        }
        return phone;
    };

    const tvaRates = Object.keys(tvaTableData.tvaBreakdown)
        .map((rate) => parseFloat(rate))
        .filter((rate) => !isNaN(rate))
        .sort((a, b) => a - b);

    // IMPORTANT: Calculate totalTTCWithoutTimbre for display
    // This should match the logic from FacturePDF's summarySection
    const totalTTCWithoutTimbre = facture.timbreFiscal ? finalTotal - 1 : finalTotal;

    // INLINE CSS for Print/PDF - Keep your original styles
    const getPrintStyles = () => `
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
        }
        
        @page {
            size: A4;
            margin: 15mm 20mm;
        }
        
        @page :first {
            margin-top: 15mm;
        }
        
        @page :last {
            margin-bottom: 15mm;
        }
        
        html, body {
            width: 210mm !important;
            height: 297mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
        }
        
        .invoice-a4 {
            width: 210mm !important;
            min-height: 297mm !important;
            background: #ffffff !important;
            position: relative;
            overflow: hidden;
            margin: 0 auto !important;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
        }
        
        /* Header */
        .invoice-header {
            color: black !important;
            padding: 25px 40px !important;
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 40px !important;
            align-items: center !important;
            border-bottom: 1px solid #e5e7eb !important;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
        }
        
        .company-logo img {
            width: 280px !important;
            height: auto !important;
            max-width: 100% !important;
        }
        
        .invoice-meta {
            text-align: right !important;
        }
        
        .invoice-meta .number {
            font-size: 26px !important;
            font-weight: 700 !important;
            margin-bottom: 12px !important;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
        }
        
        .invoice-meta .date {
            font-size: 14px !important;
            opacity: 0.9 !important;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
        }
        
        /* Info Section */
        .info-section {
            padding: 22px 40px 18px 40px !important;
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 50px !important;
            border-bottom: 1px solid #e5e7eb !important;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
        }
        
        .info-box h3 {
            font-size: 10px !important;
            font-weight: 600 !important;
            text-transform: uppercase !important;
            letter-spacing: 1.2px !important;
            color: #0f3a7d !important;
            margin-bottom: 10px !important;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
        }
        
        .info-box p {
            font-size: 12px !important;
            color: #374151 !important;
            margin-bottom: 4px !important;
            line-height: 1.5 !important;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
        }
        
        .info-box p strong {
            color: #111827 !important;
            display: block !important;
            margin-bottom: 2px !important;
            font-size: 12px !important;
            font-weight: 600 !important;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
        }
        
        /* Articles Table */
        .articles-section {
            padding: 22px 40px 8px 40px !important;
        }
        
        .articles-title {
            font-size: 10px !important;
            font-weight: 600 !important;
            text-transform: uppercase !important;
            letter-spacing: 1.2px !important;
            color: #0f3a7d !important;
            margin-bottom: 12px !important;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
        }
        
        .articles-table {
            width: 100% !important;
            border-collapse: collapse !important;
            margin-bottom: 12px !important;
            font-size: 12px !important;
            table-layout: fixed !important;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
        }
        
        .articles-table thead {
            background: #f3f4f6 !important;
            border-top: 2px solid #0f3a7d !important;
            border-bottom: 2px solid #0f3a7d !important;
        }
        
        .articles-table th {
            padding: 11px 8px !important;
            text-align: left !important;
            font-weight: 500 !important;
            color: #0f3a7d !important;
            font-size: 11px !important;
            text-transform: uppercase !important;
            letter-spacing: 0.5px !important;
            background: #f3f4f6 !important;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
        }
        
        .articles-table td {
            padding: 11px 8px !important;
            border-bottom: 1px solid #e5e7eb !important;
            color: #374151 !important;
            vertical-align: top !important;
            font-weight: normal !important;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
        }
        
        /* Fixed column widths - SAME as modal */
        .articles-table th:nth-child(1),
        .articles-table td:nth-child(1) {
            width: 5% !important;
            text-align: center !important;
        }
        
        .articles-table th:nth-child(2),
        .articles-table td:nth-child(2) {
            width: 15% !important;
            text-align: left !important;
        }
        
        .articles-table th:nth-child(3),
        .articles-table td:nth-child(3) {
            width: 30% !important;
            text-align: left !important;
        }
        
        .articles-table th:nth-child(4),
        .articles-table td:nth-child(4) {
            width: 10% !important;
            text-align: center !important;
        }
        
        .articles-table th:nth-child(5),
        .articles-table td:nth-child(5) {
            width: 12% !important;
            text-align: right !important;
        }
        
        .articles-table th:nth-child(6),
        .articles-table td:nth-child(6) {
            width: 8% !important;
            text-align: center !important;
        }
        
        .articles-table th:nth-child(7),
        .articles-table td:nth-child(7) {
            width: 13% !important;
            text-align: right !important;
        }
        
        /* Totals Container */
        .totals-container {
            padding: 18px 40px 12px 40px !important;
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 30px !important;
            border-top: none !important;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
        }
        
        /* TVA Table */
        .tva-summary table {
            width: 100% !important;
            border-collapse: collapse !important;
            font-size: 11px !important;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
        }
        
        .tva-summary thead {
            background: #f3f4f6 !important;
            border-top: 2px solid #0f3a7d !important;
            border-bottom: 2px solid #0f3a7d !important;
        }
        
        .tva-summary th {
            background: #f3f4f6 !important;
            color: #0f3a7d !important;
            padding: 11px 12px !important;
            text-align: left !important;
            font-weight: 500 !important;
            font-size: 10px !important;
            text-transform: uppercase !important;
            letter-spacing: 0.5px !important;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
        }
        
        .tva-summary td {
            padding: 11px 12px !important;
            border-bottom: 1px solid #e5e7eb !important;
            color: #374151 !important;
            font-weight: normal !important;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
        }
        
        .tva-summary th:nth-child(1),
        .tva-summary td:nth-child(1) {
            width: 30% !important;
            text-align: left !important;
        }
        
        .tva-summary th:nth-child(2),
        .tva-summary td:nth-child(2) {
            width: 35% !important;
            text-align: right !important;
        }
        
        .tva-summary th:nth-child(3),
        .tva-summary td:nth-child(3) {
            width: 35% !important;
            text-align: right !important;
        }
        
        .tva-summary tr:last-child td {
            border-bottom: none !important;
            background: #f3f4f6 !important;
            font-weight: 500 !important;
            color: #0f3a7d !important;
            border-top: 2px solid #0f3a7d !important;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
        }
        
        /* Totals Box with BLUE BORDER */
        .totals-box {
            background: #ffffff !important;
            padding: 18px 22px 0 22px !important;
            color: #374151 !important;
            display: flex !important;
            flex-direction: column !important;
            border: 2px solid #0f3a7d !important;
            height: auto !important;
            min-height: 220px !important;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
        }
        
        .total-line {
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            margin-bottom: 0 !important;
            font-size: 12px !important;
            padding: 9px 0 !important;
            border-bottom: 1px solid #f0f0f0 !important;
            background: #ffffff !important;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
        }
        
        .total-line:last-child {
            border-bottom: none !important;
            margin-bottom: 0 !important;
        }
        
        .total-line.final {
            background: linear-gradient(135deg, #0f3a7d 0%, #1a5199 100%) !important;
            padding: 14px !important;
            margin: 10px -22px 0 -22px !important;
            border-bottom: none !important;
            border-top: 2px solid #0f3a7d !important;
            color: white !important;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
        }
        
        .total-line.final .label {
            font-size: 12px !important;
            font-weight: 500 !important;
            letter-spacing: 0.5px !important;
            color: white !important;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
        }
        
        .total-line.final .amount {
            font-size: 22px !important;
            font-weight: 500 !important;
            color: white !important;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
        }
        
        .total-line .label {
            font-weight: 400 !important;
            color: #6b7280 !important;
            font-size: 11px !important;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
        }
        
        .total-line .amount {
            text-align: right !important;
            font-weight: 500 !important;
            color: #111827 !important;
            font-size: 13px !important;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
        }
        
        /* Amount in Words */
        .amount-spelled {
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%) !important;
            border-left: 4px solid #d97706 !important;
            padding: 12px 14px !important;
            margin: 18px 40px 0 40px !important;
            border-radius: 8px !important;
            font-size: 13px !important;
            color: #78350f !important;
            min-height: 40px !important;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
        }
        
        .amount-spelled strong {
            display: block !important;
            margin-bottom: 10px !important;
            font-weight: 500 !important;
            font-size: 10px !important;
            text-transform: uppercase !important;
            letter-spacing: 1.2px !important;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
        }
        
        .amount-spelled .amount-text {
            font-weight: 400 !important;
            line-height: 1.7 !important;
            font-size: 13px !important;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
        }
        
        /* Signatures */
        .signatures {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 40px !important;
            padding: 35px 40px 25px 40px !important;
            text-align: center !important;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
        }
        
        .signature-block h4 {
            font-size: 10px !important;
            font-weight: 500 !important;
            text-transform: uppercase !important;
            letter-spacing: 1.2px !important;
            color: #0f3a7d !important;
            margin-bottom: 45px !important;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
        }
        
        .signature-line {
            border-top: 1px solid #374151 !important;
            padding-top: 6px !important;
            font-size: 10px !important;
            color: #6b7280 !important;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
        }
        
        /* Footer */
        .footer {
            background: linear-gradient(135deg, #0f3a7d 0%, #1a5199 100%) !important;
            padding: 12px 40px !important;
            text-align: center !important;
            font-size: 9px !important;
            color: white !important;
            line-height: 1.5 !important;
            border-top: 2px solid #e5e7eb !important;
            position: absolute !important;
            bottom: 0 !important;
            left: 0 !important;
            right: 0 !important;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
        }
        
        .footer p {
            margin: 3px 0 !important;
            font-weight: 400 !important;
            letter-spacing: 0.3px !important;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
        }
        
        .footer p strong {
            color: white !important;
            font-weight: 500 !important;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
        }
        
        .text-center { text-align: center !important; }
        .text-right { text-align: right !important; }
        
        /* Print-specific optimizations */
        @media print {
            .invoice-a4 {
                box-shadow: none !important;
                page-break-after: always !important;
                page-break-inside: avoid !important;
            }
            
            table thead {
                display: table-header-group !important;
            }
            
            table tbody {
                display: table-row-group !important;
            }
            
            tr {
                page-break-inside: avoid !important;
            }
            
            .totals-container,
            .amount-spelled,
            .signatures {
                page-break-inside: avoid !important;
            }
        }
    </style>
`;

    const getPrintHTML = () => {
        return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Facture ${facture.numeroFacture}</title>
    ${getPrintStyles()}
</head>
<body>
    <div class="invoice-a4">
        <!-- Header -->
        <div class="invoice-header">
            <div class="company-logo">
                ${companyInfo.logo ? 
                    `<img src="${companyInfo.logo}" alt="${companyInfo.name}" />` : 
                    ''
                }
            </div>
            <div class="invoice-meta">
                <div class="number">${facture.numeroFacture}</div>
                <span class="date">Date: ${moment(facture.dateFacture).format('DD/MM/YYYY')}</span>
            </div>
        </div>

        <!-- Client & Vendor -->
        <div class="info-section">
            <div class="info-box">
                <h3>VENDEUR</h3>
                <p><strong>${facture.vendeur ? `${facture.vendeur.nom} ${facture.vendeur.prenom}` : ""}</strong></p>
            </div>
            <div class="info-box">
                <h3>CLIENT</h3>
                <p><strong>${facture.client?.raison_sociale || ''}</strong></p>
                ${facture.client?.matricule_fiscal ? `<p>MF: ${facture.client.matricule_fiscal}</p>` : ''}
                ${facture.client?.telephone1 ? `<p>Tél: ${formatPhoneNumber(facture.client.telephone1)}</p>` : ''}
                ${facture.client?.telephone2 ? `<p>Tél: ${formatPhoneNumber(facture.client.telephone2)}</p>` : ''}
            </div>
        </div>

        <!-- Articles Table -->
        <div class="articles-section">
            <div class="articles-title">Articles</div>
            <table class="articles-table">
                <thead>
                    <tr>
                        <th>N°</th>
                        <th>ARTICLE</th>
                        <th>DESIGNATION</th>
                        <th class="text-center">QTE</th>
                        <th class="text-right">P.U.H.T</th>
                        <th class="text-center">TVA</th>
                        <th class="text-right">M.TTC</th>
                    </tr>
                </thead>
                <tbody>
                    ${facture.articles && facture.articles.map((item, index) => {
                        const qty = Number(item.quantite) || 0;
                        const priceHT = Number(item.prixUnitaire) || 0;
                        const tvaRate = Number(item.tva) || 0;
                        const priceTTC = Number(item.prix_ttc) || priceHT * (1 + tvaRate / 100);
                        const montantTTCLigne = Math.round(qty * priceTTC * 1000) / 1000;

                        return `
                            <tr>
                                <td class="text-center">${index + 1}</td>
                                <td>${item.article?.reference || '-'}</td>
                                <td>${item.designation || item.article?.designation || '-'}</td>
                                <td class="text-center">${qty}</td>
                                <td class="text-right">${formatCurrency(priceHT)} DT</td>
                                <td class="text-center">${tvaRate > 0 ? `${tvaRate}%` : '-'}</td>
                                <td class="text-right">${formatCurrency(montantTTCLigne)} DT</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>

        <!-- TVA & Totals -->
        <div class="totals-container">
            <!-- TVA Summary -->
            <div class="tva-summary">
                <table>
                    <thead>
                        <tr>
                            <th>Taux</th>
                            <th>Base H.T</th>
                            <th>Total TVA</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tvaRates.map((rate) => `
                            <tr>
                                <td>${rate}%</td>
                                <td class="text-right">${formatCurrency(tvaTableData.tvaBreakdown[rate].base)} DT</td>
                                <td class="text-right">${formatCurrency(tvaTableData.tvaBreakdown[rate].montant)} DT</td>
                            </tr>
                        `).join('')}
                        ${exoneration && tvaRates.length > 0 ? `
                            <tr>
                                <td>Exonoré</td>
                                <td class="text-right">${formatCurrency(tvaTableData.totalBase)} DT</td>
                                <td class="text-right">${formatCurrency(tvaTableData.totalMontant)} DT</td>
                            </tr>
                        ` : ''}
                    </tbody>
                </table>
            </div>

            <!-- Totals Box with BLUE BORDER -->
            <div class="totals-box">
                <div class="total-line">
                    <span class="label">Total H.T.</span>
                    <span class="amount">${formatCurrency(sousTotalHT)} DT</span>
                </div>
                ${Number(facture.remise) > 0 ? `
                    <div class="total-line">
                        <span class="label">Remise</span>
                        <span class="amount">-${formatCurrency(discountAmount)} DT</span>
                    </div>
                ` : ''}
                <div class="total-line">
                    <span class="label">Total Net H.T.</span>
                    <span class="amount">${formatCurrency(netHT)} DT</span>
                </div>
                <div class="total-line">
                    <span class="label">Total TVA</span>
                    <span class="amount">${exoneration ? '0,000' : formatCurrency(totalTax)} DT</span>
                </div>
                <div class="total-line">
                    <span class="label">Total TTC</span>
                    <span class="amount">${exoneration ? formatCurrency(netHT) : formatCurrency(facture.timbreFiscal ? totalTTCWithoutTimbre : grandTotal)} DT</span>
                </div>
                ${facture.timbreFiscal ? `
                    <div class="total-line">
                        <span class="label">Timbre Fiscal</span>
                        <span class="amount">1.000 DT</span>
                    </div>
                ` : ''}
                <div class="total-line final">
                    <span class="label">NET À PAYER</span>
                    <span class="amount">${formatCurrency(finalTotal)} DT</span>
                </div>
            </div>
        </div>

        <!-- Amount in Words -->
        <div class="amount-spelled">
            <strong>Arrêtée la présente facture à la somme de:</strong>
            <span class="amount-text">${amountInWords}</span>
        </div>

        <!-- Signatures -->
        <div class="signatures">
            <div class="signature-block">
                <h4>Signature &amp; Cachet<br />Du Responsable</h4>
                <div class="signature-line"></div>
            </div>
            <div class="signature-block">
                <h4>Le Client<br />Reçu Conforme</h4>
                <div class="signature-line"></div>
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <p>
                <strong>${companyInfo.name}</strong> | 
                ${companyInfo.address} - ${companyInfo.city} | 
                Tél: ${companyInfo.phone} | 
                GSM: ${companyInfo.gsm} | 
                ${companyInfo.email} | 
                MF: ${companyInfo.taxId}
            </p>
        </div>
    </div>
    
    <script>
        window.onload = function() {
            // Force colors for print
            document.querySelectorAll('.force-print-colors, .articles-table thead, .tva-summary thead, .total-line.final, .amount-spelled, .footer').forEach(el => {
                el.style.webkitPrintColorAdjust = 'exact';
                el.style.printColorAdjust = 'exact';
            });
        };
    </script>
</body>
</html>
        `;
    };

    // Render content for modal
    const renderInvoiceContent = () => {
        return (
            <div className="invoice-a4">
                {/* Header */}
                <div className="invoice-header">
                    <div className="company-logo">
                        {companyInfo.logo && (
                            <img
                                src={companyInfo.logo}
                                alt={companyInfo.name}
                                crossOrigin="anonymous"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                }}
                            />
                        )}
                    </div>
                    <div className="invoice-meta">
                        <div className="number">{facture.numeroFacture}</div>
                        <span className="date">
                            Date: {moment(facture.dateFacture).format('DD/MM/YYYY')}
                        </span>
                    </div>
                </div>

                {/* Client & Vendor */}
                <div className="info-section">
                    <div className="info-box">
                        <h3>VENDEUR</h3>
                        <p>
                            <strong>
                                {facture.vendeur ?
                                    `${facture.vendeur.nom} ${facture.vendeur.prenom}` : ""
                                }
                            </strong>
                        </p>
                    </div>
                    <div className="info-box">
                        <h3>CLIENT</h3>
                        <p><strong>{facture.client?.raison_sociale || ''}</strong></p>
                        {facture.client?.matricule_fiscal && (
                            <p>MF: {facture.client.matricule_fiscal}</p>
                        )}
                        {facture.client?.telephone1 && (
                            <p>Tél: {formatPhoneNumber(facture.client.telephone1)}</p>
                        )}
                        {facture.client?.telephone2 && (
                            <p>Tél: {formatPhoneNumber(facture.client.telephone2)}</p>
                        )}
                    </div>
                </div>

                {/* Articles Table */}
                <div className="articles-section">
                    <div className="articles-title">Articles</div>
                    <table className="articles-table">
                        <thead>
                            <tr>
                                <th>N°</th>
                                <th>ARTICLE</th>
                                <th>DESIGNATION</th>
                                <th className="text-center">QTE</th>
                                <th className="text-right">P.U.H.T</th>
                                <th className="text-center">TVA</th>
                                <th className="text-right">M.TTC</th>
                            </tr>
                        </thead>
                        <tbody>
                            {facture.articles && facture.articles.map((item, index) => {
                                const qty = Number(item.quantite) || 0;
                                const priceHT = Number(item.prixUnitaire) || 0;
                                const tvaRate = Number(item.tva) || 0;
                                const priceTTC = Number(item.prix_ttc) || priceHT * (1 + tvaRate / 100);
                                const montantTTCLigne = Math.round(qty * priceTTC * 1000) / 1000;

                                return (
                                    <tr key={index}>
                                        <td className="text-center">{index + 1}</td>
                                        <td>{item.article?.reference || '-'}</td>
                                        <td>{item.designation || item.article?.designation || '-'}</td>
                                        <td className="text-center">{qty}</td>
                                        <td className="text-right">{formatCurrency(priceHT)} DT</td>
                                        <td className="text-center">{tvaRate > 0 ? `${tvaRate}%` : '-'}</td>
                                        <td className="text-right">{formatCurrency(montantTTCLigne)} DT</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* TVA & Totals */}
                <div className="totals-container">
                    {/* TVA Summary */}
                    <div className="tva-summary">
                        <table>
                            <thead>
                                <tr>
                                    <th>Taux</th>
                                    <th>Base H.T</th>
                                    <th>Total TVA</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tvaRates.map((rate) => (
                                    <tr key={rate}>
                                        <td>{rate}%</td>
                                        <td className="text-right">
                                            {formatCurrency(tvaTableData.tvaBreakdown[rate].base)} DT
                                        </td>
                                        <td className="text-right">
                                            {formatCurrency(tvaTableData.tvaBreakdown[rate].montant)} DT
                                        </td>
                                    </tr>
                                ))}
                                {exoneration && tvaRates.length > 0 && (
                                    <tr>
                                        <td>Exonoré</td>
                                        <td className="text-right">
                                            {formatCurrency(tvaTableData.totalBase)} DT
                                        </td>
                                        <td className="text-right">
                                            {formatCurrency(tvaTableData.totalMontant)} DT
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Totals Box with BLUE BORDER */}
                    <div className="totals-box">
                        <div className="total-line">
                            <span className="label">Total H.T.</span>
                            <span className="amount">{formatCurrency(sousTotalHT)} DT</span>
                        </div>
                        {Number(facture.remise) > 0 && (
                            <div className="total-line">
                                <span className="label">Remise</span>
                                <span className="amount">-{formatCurrency(discountAmount)} DT</span>
                            </div>
                        )}
                        <div className="total-line">
                            <span className="label">Total Net H.T.</span>
                            <span className="amount">{formatCurrency(netHT)} DT</span>
                        </div>
                        <div className="total-line">
                            <span className="label">Total TVA</span>
                            <span className="amount">
                                {exoneration ? '0,000' : formatCurrency(totalTax)} DT
                            </span>
                        </div>
                        <div className="total-line">
                            <span className="label">Total TTC</span>
                            <span className="amount">
                                {exoneration ? formatCurrency(netHT) : formatCurrency(facture.timbreFiscal ? totalTTCWithoutTimbre : grandTotal)} DT
                            </span>
                        </div>
                        {facture.timbreFiscal && (
                            <div className="total-line">
                                <span className="label">Timbre Fiscal</span>
                                <span className="amount">1.000 DT</span>
                            </div>
                        )}
                        <div className="total-line final">
                            <span className="label">NET À PAYER</span>
                            <span className="amount">{formatCurrency(finalTotal)} DT</span>
                        </div>
                    </div>
                </div>

                {/* Amount in Words */}
                <div className="amount-spelled">
                    <strong>Arrêtée la présente facture à la somme de:</strong>
                    <span className="amount-text">{amountInWords}</span>
                </div>

                {/* Signatures */}
                <div className="signatures">
                    <div className="signature-block">
                        <h4>Signature &amp; Cachet<br />Du Responsable</h4>
                        <div className="signature-line"></div>
                    </div>
                    <div className="signature-block">
                        <h4>Le Client<br />Reçu Conforme</h4>
                        <div className="signature-line"></div>
                    </div>
                </div>

                {/* Footer */}
                <div className="footer">
                    <p>
                        <strong>{companyInfo.name}</strong> |
                        {companyInfo.address} - {companyInfo.city} |
                        Tél: {companyInfo.phone} |
                        GSM: {companyInfo.gsm} |
                        {companyInfo.email} |
                        MF: {companyInfo.taxId}
                    </p>
                </div>
            </div>
        );
    };

    const handlePrint = () => {
        setIsPrinting(true);
        
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(getPrintHTML());
            printWindow.document.close();
            
            setTimeout(() => {
                printWindow.focus();
                printWindow.print();
                setTimeout(() => {
                    printWindow.close();
                    setIsPrinting(false);
                }, 500);
            }, 1000);
        } else {
            alert('Veuillez autoriser les popups pour imprimer la facture.');
            setIsPrinting(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            toggle={toggle}
            size="xl"
            centered
            className="facture-preview-modal"
            style={{ maxWidth: '90vw' }}
        >
            <ModalHeader toggle={toggle} className="no-print bg-light">
                <div className="d-flex justify-content-between align-items-center w-100">
                    <span className="fw-bold">
                        Facture #{facture.numeroFacture} - {facture.client?.raison_sociale}
                    </span>
                    <div className="d-flex gap-2">
                        <Button
                            color="primary"
                            size="sm"
                            onClick={handlePrint}
                            disabled={isPrinting}
                            className="d-flex align-items-center gap-1"
                        >
                            {isPrinting ? (
                                <>
                                    <span className="spinner-border spinner-border-sm"></span>
                                    Impression...
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-printer"></i>
                                    Imprimer
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </ModalHeader>
            <ModalBody
                style={{
                    padding: '10px',
                    overflow: 'auto',
                    maxHeight: '80vh',
                    backgroundColor: '#f5f5f5'
                }}
            >
                <div ref={printRef}>
                    {renderInvoiceContent()}
                </div>
            </ModalBody>
        </Modal>
    );
};

export default FactureClientPreview;