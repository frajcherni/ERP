import React from "react";
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';
import moment from "moment";

// Register fonts
Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf', fontWeight: 400 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf', fontWeight: 700 },
  ]
});

// Interfaces
export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate: Date;
  
  // Company info
  companyName: string;
  companyAddress: string;
  companyCity: string;
  companyPhone: string;
  companyEmail: string;
  companyLogo?: string;
  
  // Customer info
  customerName: string;
  customerAddress: string;
  customerCity: string;
  customerPhone?: string;
  customerEmail?: string;
  
  // Items
  items: InvoiceItem[];
  
  // Totals
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  
  // Additional
  notes?: string;
  paymentTerms?: string;
  currency?: string;
}

// Styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#333333',
  },
  
  // Header Section
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    paddingBottom: 20,
    borderBottom: '2pt solid #2563eb',
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  logo: {
    width: 120,
    height: 40,
    marginBottom: 10,
  },
  companyName: {
    fontSize: 18,
    fontWeight: 700,
    color: '#2563eb',
    marginBottom: 5,
  },
  companyDetails: {
    fontSize: 9,
    color: '#666666',
    lineHeight: 1.4,
  },
  
  // Invoice Title
  invoiceTitle: {
    fontSize: 24,
    fontWeight: 700,
    color: '#1e293b',
    marginBottom: 5,
  },
  invoiceNumber: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 2,
  },
  
  // Info Section
  infoSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  infoBox: {
    flex: 1,
    marginRight: 20,
  },
  infoBoxLast: {
    flex: 1,
  },
  infoBoxTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: '#1e293b',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoBoxContent: {
    fontSize: 9,
    color: '#475569',
    lineHeight: 1.5,
  },
  infoBoxContentBold: {
    fontSize: 10,
    fontWeight: 700,
    color: '#1e293b',
    marginBottom: 3,
  },
  
  // Table Section
  table: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    padding: 10,
    fontWeight: 700,
    fontSize: 9,
    color: '#1e293b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1pt solid #e2e8f0',
    padding: 10,
    minHeight: 35,
    alignItems: 'center',
  },
  tableRowEven: {
    backgroundColor: '#f8fafc',
  },
  
  // Table Columns
  colDescription: {
    flex: 3,
    paddingRight: 10,
  },
  colQuantity: {
    flex: 1,
    textAlign: 'center',
  },
  colUnitPrice: {
    flex: 1.5,
    textAlign: 'right',
  },
  colTotal: {
    flex: 1.5,
    textAlign: 'right',
    fontWeight: 700,
  },
  
  // Totals Section
  totalsSection: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  totalsBox: {
    width: 250,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 15,
  },
  totalRowFinal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#2563eb',
    color: '#FFFFFF',
    padding: 12,
    marginTop: 5,
    fontWeight: 700,
    fontSize: 12,
  },
  totalLabel: {
    fontSize: 10,
    color: '#64748b',
  },
  totalValue: {
    fontSize: 10,
    color: '#1e293b',
    fontWeight: 700,
  },
  totalLabelFinal: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: 700,
  },
  totalValueFinal: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: 700,
  },
  
  // Footer Section
  footer: {
    marginTop: 40,
    paddingTop: 20,
    borderTop: '1pt solid #e2e8f0',
  },
  footerTitle: {
    fontSize: 10,
    fontWeight: 700,
    color: '#1e293b',
    marginBottom: 5,
  },
  footerText: {
    fontSize: 9,
    color: '#64748b',
    lineHeight: 1.5,
  },
  footerBottom: {
    marginTop: 30,
    paddingTop: 15,
    borderTop: '1pt solid #e2e8f0',
    textAlign: 'center',
    fontSize: 8,
    color: '#94a3b8',
  },
});

// Format currency
const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

// Main Invoice Component
export const InvoicePDF: React.FC<{ data: InvoiceData }> = ({ data }) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {data.companyLogo && (
              <Image src={data.companyLogo} style={styles.logo} />
            )}
            <Text style={styles.companyName}>{data.companyName}</Text>
            <Text style={styles.companyDetails}>
              {data.companyAddress}{'\n'}
              {data.companyCity}{'\n'}
              {data.companyPhone}{'\n'}
              {data.companyEmail}
            </Text>
          </View>
          
          <View style={styles.headerRight}>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>#{data.invoiceNumber}</Text>
            <Text style={styles.invoiceNumber}>
              Date: {moment(data.invoiceDate).format('MMM DD, YYYY')}
            </Text>
            <Text style={styles.invoiceNumber}>
              Due Date: {moment(data.dueDate).format('MMM DD, YYYY')}
            </Text>
          </View>
        </View>

        {/* Bill To Section */}
        <View style={styles.infoSection}>
          <View style={styles.infoBox}>
            <Text style={styles.infoBoxTitle}>Bill To</Text>
            <Text style={styles.infoBoxContentBold}>{data.customerName}</Text>
            <Text style={styles.infoBoxContent}>
              {data.customerAddress}{'\n'}
              {data.customerCity}
              {data.customerPhone && `\n${data.customerPhone}`}
              {data.customerEmail && `\n${data.customerEmail}`}
            </Text>
          </View>
          
          <View style={styles.infoBoxLast}>
            <Text style={styles.infoBoxTitle}>Payment Details</Text>
            <Text style={styles.infoBoxContent}>
              Invoice Number: {data.invoiceNumber}{'\n'}
              Issue Date: {moment(data.invoiceDate).format('MMMM DD, YYYY')}{'\n'}
              Due Date: {moment(data.dueDate).format('MMMM DD, YYYY')}{'\n'}
              Currency: {data.currency || 'USD'}
            </Text>
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={styles.colDescription}>Description</Text>
            <Text style={styles.colQuantity}>Qty</Text>
            <Text style={styles.colUnitPrice}>Unit Price</Text>
            <Text style={styles.colTotal}>Total</Text>
          </View>
          
          {/* Table Rows */}
          {data.items.map((item, index) => (
            <View 
              key={item.id} 
              style={[
                styles.tableRow, 
                index % 2 === 0 ? styles.tableRowEven : {}
              ]}
            >
              <Text style={styles.colDescription}>{item.description}</Text>
              <Text style={styles.colQuantity}>{item.quantity}</Text>
              <Text style={styles.colUnitPrice}>
                {formatCurrency(item.unitPrice, data.currency)}
              </Text>
              <Text style={styles.colTotal}>
                {formatCurrency(item.total, data.currency)}
              </Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(data.subtotal, data.currency)}
              </Text>
            </View>
            
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tax ({data.taxRate}%)</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(data.taxAmount, data.currency)}
              </Text>
            </View>
            
            <View style={styles.totalRowFinal}>
              <Text style={styles.totalLabelFinal}>TOTAL</Text>
              <Text style={styles.totalValueFinal}>
                {formatCurrency(data.total, data.currency)}
              </Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          {data.paymentTerms && (
            <View style={{ marginBottom: 15 }}>
              <Text style={styles.footerTitle}>Payment Terms</Text>
              <Text style={styles.footerText}>{data.paymentTerms}</Text>
            </View>
          )}
          
          {data.notes && (
            <View>
              <Text style={styles.footerTitle}>Notes</Text>
              <Text style={styles.footerText}>{data.notes}</Text>
            </View>
          )}
          
          <Text style={styles.footerBottom}>
            Thank you for your business! • {data.companyName} • {data.companyEmail}
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default InvoicePDF;
