import React, { useState, useEffect, useMemo, useRef, Fragment } from 'react';
import { PDFDownloadLink, pdf } from '@react-pdf/renderer';
import { useProfile } from "Components/Hooks/UserHooks";
import logo from "../../assets/images/imglogo.png";
import { Card, CardBody, Col, Row, Container, Label, Button, Table, Badge, Modal, ModalHeader, ModalBody } from 'reactstrap';
import CountUp from "react-countup";
import Flatpickr from "react-flatpickr";
import moment from "moment";
import TrésoreriePDF from './TrésoreriePDF ';
import UnifiedDashboard from '../Ecommerce/Vente/JournalVente';

const API_BASE = process.env.REACT_APP_API_BASE;

interface PaymentMethod {
  method: string;
  amount: number;
  numero?: string;
  banque?: string;
  dateEcheance?: string;
  tauxRetention?: number;
}

interface Transaction {
  id: number;
  type: 'facture_direct' | 'encaissement' | 'paiement_bc' | 'bon_commande' | 'vente_comptoire' | 'bon_livraison' | 'paiement_bl';
  numero: string;
  date: string;
  client: Client;
  montant: number;
  paymentMethods: PaymentMethod[];
  hasRetenue?: boolean;
  montantRetenue?: number;
  source?: string;
}

interface Client {
  name: string;
}

interface GroupedTransaction extends Transaction {
  regularPayments: PaymentMethod[];
  retentionPayments: PaymentMethod[];
  retentionRate: number | null;
}

interface TrésorerieData {
  totalVentes: number;
  totalPaiementsClients: number;
  totalPaiementsFournisseurs: number;
  earnings: number;
  paymentMethods: {
    especes: number;
    cheque: number;
    virement: number;
    traite: number;
    autre: number;
    retenue: number;
  };
  paymentMethodsBySource: {
    bcPayments: {
      especes: number;
      cheque: number;
      virement: number;
      traite: number;
      autre: number;
      carte: number;
      retenue: number;
    };
    blPayments: {
      especes: number;
      cheque: number;
      virement: number;
      traite: number;
      autre: number;
      carte: number;
      retenue: number;
    };
    facturePayments: {
      especes: number;
      cheque: number;
      virement: number;
      traite: number;
      autre: number;
      carte: number;
      retenue: number;
    };
    ventePayments: {
      especes: number;
      cheque: number;
      virement: number;
      traite: number;
      autre: number;
      carte: number;
      retenue: number;
    };
  };
  transactions: Transaction[];
  counts: {
    ventes: number;
    encaissements: number;
    paiementsFournisseurs: number;
    factures: number;
    bonCommandes: number;
    paiementsBC: number;
    totalTransactions: number;
  };
}

const Trésorerie: React.FC = () => {
  const [data, setData] = useState<TrésorerieData>({
    totalVentes: 0,
    totalPaiementsClients: 0,
    totalPaiementsFournisseurs: 0,
    earnings: 0,
    paymentMethods: {
      especes: 0,
      cheque: 0,
      virement: 0,
      traite: 0,
      autre: 0,
      retenue: 0
    },
    paymentMethodsBySource: {
      bcPayments: { especes: 0, cheque: 0, virement: 0, traite: 0, autre: 0, carte: 0, retenue: 0 },
      blPayments: { especes: 0, cheque: 0, virement: 0, traite: 0, autre: 0, carte: 0, retenue: 0 },
      facturePayments: { especes: 0, cheque: 0, virement: 0, traite: 0, autre: 0, carte: 0, retenue: 0 },
      ventePayments: { especes: 0, cheque: 0, virement: 0, traite: 0, autre: 0, carte: 0, retenue: 0 }
    },
    transactions: [],
    counts: {
      ventes: 0,
      encaissements: 0,
      paiementsFournisseurs: 0,
      factures: 0,
      bonCommandes: 0,
      paiementsBC: 0,
      totalTransactions: 0
    }
  });

  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState<Date>(moment().toDate());
  const [endDate, setEndDate] = useState<Date>(moment().toDate());
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions'>('overview');
  const [pdfModal, setPdfModal] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleViewPdf = async () => {
    try {
      setGeneratingPdf(true);
      const pdfComponent = <TrésoreriePDF data={data} companyInfo={companyInfo} dateRange={{ startDate, endDate }} />;
      const pdfBlob = await pdf(pdfComponent).toBlob();
      const blobUrl = URL.createObjectURL(pdfBlob);
      setPdfUrl(blobUrl);
      setPdfModal(true);
      setGeneratingPdf(false);
    } catch (error) {
      console.error('Erreur génération PDF:', error);
      setGeneratingPdf(false);
      alert('Erreur lors de la génération du PDF');
    }
  };

  const handleDownloadFromModal = () => {
    if (pdfUrl) {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `paiements-clients-${moment().format("YYYY-MM-DD")}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  const fetchTrésorerieData = async () => {
    try {
      setLoading(true);
      const start = moment(startDate).format('YYYY-MM-DD');
      const end = moment(endDate).format('YYYY-MM-DD');

      const response = await fetch(`${API_BASE}/getpayment/data?startDate=${start}&endDate=${end}`);
      if (!response.ok) throw new Error("Failed to fetch data");

      const result = await response.json();

      if (result.success) {
        setData({
          ...result.data,
          paymentMethods: result.data.paymentMethods || {
            especes: 0, cheque: 0, virement: 0, traite: 0, autre: 0, retenue: 0
          },
          paymentMethodsBySource: result.data.paymentMethodsBySource || {
            bcPayments: { especes: 0, cheque: 0, virement: 0, traite: 0, autre: 0, carte: 0, retenue: 0 },
            blPayments: { especes: 0, cheque: 0, virement: 0, traite: 0, autre: 0, carte: 0, retenue: 0 },
            facturePayments: { especes: 0, cheque: 0, virement: 0, traite: 0, autre: 0, carte: 0, retenue: 0 },
            ventePayments: { especes: 0, cheque: 0, virement: 0, traite: 0, autre: 0, carte: 0, retenue: 0 }
          },
          transactions: result.data.transactions || [],
          counts: {
            ...result.data.counts,
            totalTransactions: (result.data.transactions || []).length
          }
        });
      }
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrésorerieData();
  }, [startDate, endDate]);

  const { userProfile } = useProfile();

  const companyInfo = useMemo(
    () => ({
      name: userProfile?.company_name || "Votre Société",
      address: userProfile?.company_address || "Adresse",
      city: userProfile?.company_city || "Ville",
      phone: userProfile?.company_phone || "Téléphone",
      email: userProfile?.company_email || "Email",
      website: userProfile?.company_website || "Site web",
      taxId: userProfile?.company_tax_id || "MF",
      logo: logo,
      gsm: userProfile?.company_gsm,
    }),
    [userProfile]
  );

  const isRetentionMethod = (method: string): boolean => {
    const methodLower = method.toLowerCase();
    return methodLower === 'retenue' || methodLower === 'retention';
  };

  const normalizeMethod = (method: string): string => {
    if (!method) return 'autre';
    const methodLower = method.toLowerCase();

    if (isRetentionMethod(method)) return 'retenue';
    if (methodLower.includes('tpe') || methodLower.includes('carte') || methodLower.includes('cb')) return 'carte';
    if (methodLower === 'especes' || methodLower === 'espece') return 'especes';
    if (methodLower === 'cheque') return 'cheque';
    if (methodLower === 'virement') return 'virement';
    if (methodLower === 'traite') return 'traite';
    return 'autre';
  };

  const calculatePaymentMethodsBySource = () => {
    const bcPayments = { especes: 0, cheque: 0, virement: 0, traite: 0, carte: 0, autre: 0, retenue: 0 };
    const blPayments = { especes: 0, cheque: 0, virement: 0, traite: 0, carte: 0, autre: 0, retenue: 0 };
    const facturePayments = { especes: 0, cheque: 0, virement: 0, traite: 0, carte: 0, autre: 0, retenue: 0 };
    const ventePayments = { especes: 0, cheque: 0, virement: 0, traite: 0, carte: 0, autre: 0, retenue: 0 };

    data.transactions.forEach((transaction: Transaction) => {
      const sourcePayments =
        transaction.type === 'paiement_bc' || transaction.type === 'bon_commande' ? bcPayments :
          transaction.type === 'paiement_bl' || transaction.type === 'bon_livraison' ? blPayments :
            transaction.type === 'facture_direct' || transaction.type === 'encaissement' ? facturePayments :
              transaction.type === 'vente_comptoire' ? ventePayments : null;

      if (sourcePayments) {
        transaction.paymentMethods.forEach((payment: PaymentMethod) => {
          const method = payment.method.toLowerCase();
          const amount = Number(payment.amount || 0);

          if (method === 'retenue' || method === 'retention') {
            sourcePayments.retenue += amount;
          } else {
            const normalizedMethod = normalizeMethod(payment.method);
            if (sourcePayments[normalizedMethod as keyof typeof sourcePayments] !== undefined) {
              (sourcePayments as any)[normalizedMethod] += amount;
            }
          }
        });
      }
    });

    return { bcPayments, blPayments, facturePayments, ventePayments };
  };

  const { bcPayments, blPayments, facturePayments, ventePayments } = calculatePaymentMethodsBySource();

  const calculateTotals = () => {
    let totalEncaissementFacture = 0;
    let totalEncaissementBC = 0;
    let totalEncaissementBL = 0;
    let totalVentesComptoire = 0;

    data.transactions.forEach((transaction: Transaction) => {
      switch (transaction.type) {
        case 'facture_direct':
        case 'encaissement':
          totalEncaissementFacture += transaction.montant;
          break;
        case 'paiement_bc':
        case 'bon_commande':
          totalEncaissementBC += transaction.montant;
          break;
        case 'paiement_bl':
        case 'bon_livraison':
          totalEncaissementBL += transaction.montant;
          break;
        case 'vente_comptoire':
          totalVentesComptoire += transaction.montant;
          break;
      }
    });

    return {
      totalEncaissementFacture,
      totalEncaissementBC,
      totalEncaissementBL,
      totalVentesComptoire
    };
  };

  const { totalEncaissementFacture, totalEncaissementBC, totalEncaissementBL, totalVentesComptoire } = calculateTotals();

  const getTransactionTypeBadge = (type: string) => {
    const types = {
      facture_direct: { color: 'success', label: 'Facture Client' },
      encaissement: { color: 'info', label: 'Encaissement' },
      paiement_bc: { color: 'primary', label: 'Paiement BC' },
      bon_commande: { color: 'warning', label: 'BC Direct' },
      paiement_bl: { color: 'info', label: 'Paiement BL' },
      bon_livraison: { color: 'info', label: 'BL Direct' },
      vente_comptoire: { color: 'secondary', label: 'Vente Comptoire' }
    };
    const typeInfo = types[type as keyof typeof types] || { color: 'secondary', label: type };
    return <Badge color={typeInfo.color}>{typeInfo.label}</Badge>;
  };

  const getPaymentMethodBadge = (method: string) => {
    const methods = {
      especes: { color: 'success', label: 'Espèces' },
      cheque: { color: 'primary', label: 'Chèque' },
      virement: { color: 'info', label: 'Virement' },
      traite: { color: 'warning', label: 'Traite' },
      retenue: { color: 'danger', label: 'Retenue' },
      autre: { color: 'secondary', label: 'Autre' },
      carte: { color: 'info', label: 'Carte' },
      tpe: { color: 'info', label: 'TPE' },
      cb: { color: 'info', label: 'CB' }
    };

    const normalizedMethod = normalizeMethod(method);
    const methodInfo = methods[normalizedMethod as keyof typeof methods] || { color: 'secondary', label: method };
    return <Badge color={methodInfo.color} className="me-1">{methodInfo.label}</Badge>;
  };

  const paymentMethodsBySource = [
    {
      title: "BC Client",
      description: "Méthodes de paiement pour les BC (direct + paiements BC)",
      methods: [
        { label: "Espèces", value: bcPayments.especes, color: "success", icon: "ri-money-dollar-box-line" },
        { label: "Chèques", value: bcPayments.cheque, color: "primary", icon: "ri-bank-card-line" },
        { label: "Virements", value: bcPayments.virement, color: "info", icon: "ri-exchange-dollar-line" },
        { label: "Traites", value: bcPayments.traite, color: "warning", icon: "ri-file-text-line" },
        { label: "Cartes Bancaire TPE", value: bcPayments.carte, color: "info", icon: "ri-bank-card-2-line" },
        { label: "Retenue", value: bcPayments.retenue, color: "danger", icon: "ri-refund-line" }
      ]
    },
    {
      title: "Facture Client",
      description: "Méthodes de paiement pour les factures (direct + encaissements)",
      methods: [
        { label: "Espèces", value: facturePayments.especes, color: "success", icon: "ri-money-dollar-box-line" },
        { label: "Chèques", value: facturePayments.cheque, color: "primary", icon: "ri-bank-card-line" },
        { label: "Virements", value: facturePayments.virement, color: "info", icon: "ri-exchange-dollar-line" },
        { label: "Traites", value: facturePayments.traite, color: "warning", icon: "ri-file-text-line" },
        { label: "Cartes Bancaire TPE", value: facturePayments.carte, color: "info", icon: "ri-bank-card-2-line" },
        { label: "Retenue", value: facturePayments.retenue, color: "danger", icon: "ri-refund-line" }
      ]
    },
    {
      title: "Vente Comptoire",
      description: "Méthodes de paiement pour les ventes au comptoire",
      methods: [
        { label: "Espèces", value: ventePayments.especes, color: "success", icon: "ri-money-dollar-box-line" },
        { label: "Chèques", value: ventePayments.cheque, color: "primary", icon: "ri-bank-card-line" },
        { label: "Virements", value: ventePayments.virement, color: "info", icon: "ri-exchange-dollar-line" },
        { label: "Traites", value: ventePayments.traite, color: "warning", icon: "ri-file-text-line" },
        { label: "Cartes Bancaire TPE", value: ventePayments.carte, color: "info", icon: "ri-bank-card-2-line" },
        { label: "Retenue", value: ventePayments.retenue, color: "danger", icon: "ri-refund-line" }
      ]
    },
    {
      title: "Bon Livraison",
      description: "Méthodes de paiement pour les bons de livraison",
      methods: [
        { label: "Espèces", value: blPayments.especes, color: "success", icon: "ri-money-dollar-box-line" },
        { label: "Chèques", value: blPayments.cheque, color: "primary", icon: "ri-bank-card-line" },
        { label: "Virements", value: blPayments.virement, color: "info", icon: "ri-exchange-dollar-line" },
        { label: "Traites", value: blPayments.traite, color: "warning", icon: "ri-file-text-line" },
        { label: "Cartes Bancaire TPE", value: blPayments.carte, color: "info", icon: "ri-bank-card-2-line" },
        { label: "Retenue", value: blPayments.retenue, color: "danger", icon: "ri-refund-line" }
      ]
    }
  ];

  // Group transactions by document to handle retention properly

  const groupTransactionsByDocument = (): GroupedTransaction[] => {
    const groupedMap = new Map<string, GroupedTransaction>();

    data.transactions.forEach((transaction: Transaction) => {
      // Clean the numero by removing "(Retenue)" suffix
      const cleanNumero = transaction.numero.replace(/\s*\(Retenue\)\s*$/, '');

      // Create a key based on type, cleaned numero, date, and client
      const key = `${transaction.type}-${cleanNumero}-${moment(transaction.date).format('YYYY-MM-DD')}-${transaction.client.name}`;

      if (!groupedMap.has(key)) {
        // Initialize new grouped transaction
        groupedMap.set(key, {
          ...transaction,
          numero: cleanNumero,
          regularPayments: [],
          retentionPayments: [],
          retentionRate: null,
          montant: 0 // We'll accumulate this
        });
      }

      const grouped = groupedMap.get(key) as GroupedTransaction;

      // Add this transaction's montant to the total
      grouped.montant += transaction.montant;

      // Process each payment method
      transaction.paymentMethods.forEach((payment: PaymentMethod) => {
        const isRetention = isRetentionMethod(payment.method);
        const amount = Number(payment.amount || 0);

        if (isRetention) {
          // Check if this is a rate-only retention (amount 0 with taux)
          if (amount === 0 && payment.tauxRetention) {
            grouped.retentionRate = payment.tauxRetention;
          } else {
            // Check if this retention payment already exists (by amount)
            const exists = grouped.retentionPayments.some(
              p => Math.abs(Number(p.amount || 0) - amount) < 0.001
            );
            if (!exists) {
              grouped.retentionPayments.push(payment);
            }
          }
        } else {
          // Check if this regular payment already exists (by method and amount)
          const exists = grouped.regularPayments.some(
            p => p.method === payment.method &&
              Math.abs(Number(p.amount || 0) - amount) < 0.001
          );
          if (!exists) {
            grouped.regularPayments.push(payment);
          }
        }
      });
    });

    return Array.from(groupedMap.values());
  };
  const groupedTransactions = groupTransactionsByDocument();

  return (
    <div className="page-content">
      <Container fluid style={{ maxWidth: "100%" }}>
        {/* Header Section */}
        <Row className="mb-2">
          <Col xs={12}>
            <div className="d-flex align-items-lg-center flex-lg-row flex-column">
              <div className="flex-grow-1">
                <h4 className="fs-16 mb-1">Tableau de Bord Trésorerie</h4>
                <p className="text-muted mb-0">Aperçu financier de votre entreprise.</p>
              </div>
              <div className="mt-2 mt-lg-0">
                <Row className="g-2 mb-0 align-items-center">
                  <div className="col-sm-auto">
                    <Label className="form-label mb-1">Date début</Label>
                    <Flatpickr className="form-control" value={[startDate]}
                      onChange={(dates: Date[]) => dates[0] && setStartDate(dates[0])}
                      options={{ dateFormat: "d M, Y", altInput: true, altFormat: "F j, Y" }} />
                  </div>
                  <div className="col-sm-auto">
                    <Label className="form-label mb-1">Date fin</Label>
                    <Flatpickr className="form-control" value={[endDate]}
                      onChange={(dates: Date[]) => dates[0] && setEndDate(dates[0])}
                      options={{ dateFormat: "d M, Y", altInput: true, altFormat: "F j, Y" }} />
                  </div>
                </Row>
              </div>
            </div>
          </Col>
        </Row>


        <Row className="mb-3">
          <Col xs={12}>
            <div className="d-flex justify-content-end">
              <Button
                color="success"
                onClick={handleViewPdf}
                disabled={generatingPdf || loading}
              >
                <i className="ri-file-pdf-line me-2"></i>
                {generatingPdf ? "Génération..." : "Voir PDF"}
              </Button> &nbsp;
              <Button color="primary" onClick={fetchTrésorerieData} disabled={loading}>
                {loading ? 'Chargement...' : 'Actualiser'}
              </Button>
            </div>
          </Col>
        </Row>

        {/* Tabs Navigation */}
        <Row className="mb-3">
          <Col xs={12}>
            <div className="d-flex border-bottom">
              <Button
                color="light"
                className={`border-0 me-2 ${activeTab === 'overview' ? 'bg-primary text-white' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                <i className="ri-dashboard-line me-1"></i> Vue d'ensemble
              </Button>
              <Button
                color="light"
                className={`border-0 ${activeTab === 'transactions' ? 'bg-primary text-white' : ''}`}
                onClick={() => setActiveTab('transactions')}
              >
                <i className="ri-list-check-2 me-1"></i> Transactions ({groupedTransactions.length})
              </Button>
            </div>
          </Col>
        </Row>

        {activeTab === 'overview' ? (
          <>
            {/* Payment Methods by Source */}
            <UnifiedDashboard hideHeader={true} />
            <Row className="mb-3">
              {paymentMethodsBySource.map((source, index) => (
                <Col xl={4} md={6} key={index} className="mb-3">
                  <Card>
                    <CardBody>
                      <h5 className="card-title mb-3">{source.title}</h5>
                      <p className="text-muted mb-3 fs-12">{source.description}</p>
                      <div className="payment-methods-list">
                        {source.methods.map((method, methodIndex) => (
                          <div key={methodIndex} className="d-flex align-items-center justify-content-between mb-3 p-2 border rounded">
                            <div className="d-flex align-items-center">
                              <div className={`avatar-xs me-3 bg-${method.color}-subtle`}>
                                <i className={`fs-5 text-${method.color} ${method.icon}`}></i>
                              </div>
                              <div>
                                <h6 className="mb-0 fs-14">{method.label}</h6>
                              </div>
                            </div>
                            <div className="text-end">
                              <h6 className="mb-0 text-primary fw-bold">
                                <CountUp
                                  start={0}
                                  suffix=" DT"
                                  separator={","}
                                  end={method.value}
                                  decimals={3}
                                  duration={2}
                                />
                              </h6>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardBody>
                  </Card>
                </Col>
              ))}
            </Row>

            {/* Retenue Information */}
            <Row>
              <Col xs={12}>
                <Card>
                  <CardBody className="p-3">
                    <h4 className="card-title mb-3">Informations Retenue</h4>
                    <div className="row text-center">
                      <div className="col-md-6">
                        <div className="border-end">
                          <h4 className="text-danger fw-bold">
                            <CountUp
                              start={0}
                              suffix=" DT"
                              separator={","}
                              end={bcPayments.retenue + blPayments.retenue + facturePayments.retenue + ventePayments.retenue}
                              decimals={3}
                              duration={2}
                            />
                          </h4>
                          <p className="text-muted mb-0">Total Retenue</p>
                          <small className="text-muted">Montants retenus sur tous les paiements</small>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div>
                          <h4 className="text-info fw-bold">
                            {groupedTransactions.filter((t: GroupedTransaction) =>
                              t.retentionPayments.length > 0 || t.retentionRate
                            ).length}
                          </h4>
                          <p className="text-muted mb-0">Documents avec Retenue</p>
                          <small className="text-muted">Nombre de documents incluant une retenue</small>
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </Col>
            </Row>
          </>
        ) : (
          /* Transactions Tab */
          <Row>
            <Col xs={12}>
              <Card>
                <CardBody>
                  <h4 className="card-title mb-3">Détail des Transactions</h4>
                  <div className="table-responsive">
                    <Table hover className="mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Date</th>
                          <th>Type</th>
                          <th>Numéro</th>
                          <th>Client</th>
                          <th>Source</th>
                          <th>Méthodes de Paiement</th>
                          <th className="text-end">Montant</th>
                        </tr>
                      </thead>
                      <tbody>
                        {groupedTransactions.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="text-center text-muted py-4">
                              Aucune transaction trouvée pour la période sélectionnée
                            </td>
                          </tr>
                        ) : (
                          // In the transactions tab section, replace with this simple mapping:
                          groupedTransactions.map((transaction: GroupedTransaction, index: number) => {
                            // Separate retention from other payments
                            const retentionPayments = transaction.paymentMethods.filter(p =>
                              p.method.toLowerCase() === 'retenue' || p.method.toLowerCase() === 'retention'
                            );

                            const regularPayments = transaction.paymentMethods.filter(p =>
                              p.method.toLowerCase() !== 'retenue' && p.method.toLowerCase() !== 'retention'
                            );

                            // Calculate regular total (excluding retention)
                            const regularTotal = regularPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

                            return (
                              <Fragment key={index}>
                                {/* Main transaction row - show only regular payments */}
                                {regularPayments.length > 0 && (
                                  <tr>
                                    <td>{moment(transaction.date).format('DD/MM/YYYY')}</td>
                                    <td>{getTransactionTypeBadge(transaction.type)}</td>
                                    <td><strong>{transaction.numero}</strong></td>
                                    <td>{transaction.client.name}</td>
                                    <td><small className="text-muted">{transaction.source || 'Direct'}</small></td>
                                    <td>
                                      <div className="d-flex flex-wrap gap-1">
                                        {regularPayments.map((payment, pIndex) => (
                                          <div key={pIndex} className="d-flex align-items-center">
                                            {getPaymentMethodBadge(payment.method)}
                                            <small className="ms-1 text-muted">
                                              ({Number(payment.amount || 0).toFixed(3)} DT)
                                            </small>
                                          </div>
                                        ))}
                                      </div>
                                    </td>
                                    <td className="text-end fw-bold">{regularTotal.toFixed(3)} DT</td>
                                  </tr>
                                )}

                                {/* Separate row for each retention payment */}
                                {retentionPayments.map((payment, pIndex) => (
                                  <tr key={`ret-${index}-${pIndex}`}>
                                    <td>{moment(transaction.date).format('DD/MM/YYYY')}</td>
                                    <td>{getTransactionTypeBadge(transaction.type)}</td>
                                    <td><strong>{transaction.numero} (Retenue)</strong></td>
                                    <td>{transaction.client.name}</td>
                                    <td><small className="text-muted">{transaction.source || 'Direct'}</small></td>
                                    <td>
                                      <div className="d-flex align-items-center">
                                        {getPaymentMethodBadge(payment.method)}
                                        {payment.tauxRetention && payment.tauxRetention > 0 && (
                                          <Badge color="light" className="ms-1">{payment.tauxRetention}%</Badge>
                                        )}
                                      </div>
                                    </td>
                                    <td className="text-end fw-bold">{Number(payment.amount || 0).toFixed(3)} DT</td>
                                  </tr>
                                ))}
                              </Fragment>
                            );
                          })
                        )}
                      </tbody>
                    </Table>
                  </div>
                </CardBody>
              </Card>
            </Col>
          </Row>
        )}

        <style>{`
          .payment-methods-list .border {
            border-color: #e9ecef !important;
            transition: all 0.2s ease;
          }
          
          .payment-methods-list .border:hover {
            border-color: #0d6efd !important;
            background-color: #f8f9fa;
          }
          
          .avatar-xs {
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 8px;
          }
          .pdf-viewer-modal .modal-content {
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0,0,0,0.15);
          }
          
          .pdf-viewer-modal .modal-header {
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            padding: 1.25rem 1.5rem;
          }
          
          .pdf-viewer-modal .modal-body {
            padding: 0;
          }
          
          .modal-icon-wrapper {
            transition: all 0.3s ease;
          }
          
          .modal-icon-wrapper:hover {
            transform: scale(1.05);
          }
        `}</style>

        <Modal
          isOpen={pdfModal}
          toggle={() => setPdfModal(false)}
          centered
          size="xl"
          className="pdf-viewer-modal"
          style={{ maxWidth: '90%', maxHeight: '90vh' }}
        >
          <ModalBody className="p-0 d-flex flex-column" style={{ minHeight: '600px' }}>
            {pdfUrl ? (
              <>
                <div className="d-flex justify-content-between align-items-center p-3 border-bottom bg-light">
                  <div></div>
                  <div className="d-flex gap-2">
                    <Button
                      color="light"
                      size="sm"
                      onClick={() => {
                        if (iframeRef.current) {
                          iframeRef.current.contentWindow?.print();
                        }
                      }}
                      title="Imprimer"
                      className="d-flex align-items-center"
                    >
                      <i className="ri-printer-line me-1"></i> Imprimer
                    </Button>
                    <Button
                      color="primary"
                      size="sm"
                      onClick={handleDownloadFromModal}
                      title="Télécharger"
                      className="d-flex align-items-center"
                    >
                      <i className="ri-download-line me-1"></i> Télécharger
                    </Button>
                  </div>
                </div>

                <div className="flex-grow-1" style={{ minHeight: '500px' }}>
                  <iframe
                    ref={iframeRef}
                    src={pdfUrl}
                    title="Rapport des Paiements Clients"
                    style={{
                      width: '100%',
                      height: '100%',
                      border: 'none',
                      minHeight: '500px'
                    }}
                  />
                </div>

                <div className="p-3 border-top bg-light">
                  <small className="text-muted">
                    <i className="ri-information-line me-1"></i>
                    Cliquez sur "Télécharger" pour enregistrer le PDF ou "Imprimer" pour l'imprimer directement.
                  </small>
                </div>
              </>
            ) : (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Chargement du PDF...</span>
                </div>
                <p className="mt-3 text-muted">Chargement du PDF...</p>
              </div>
            )}
          </ModalBody>
        </Modal>
      </Container>
    </div>
  );
};

export default Trésorerie;