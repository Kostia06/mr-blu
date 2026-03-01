import { useMemo } from 'preact/hooks';
import { renderDocumentBody, getTemplateStyles } from '@/lib/templates/render';
import type { DocumentSourceData } from '@/lib/templates/types';

interface DocumentData {
  documentType: string;
  documentNumber: string;
  client: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  from: {
    name?: string;
    businessName?: string;
    email?: string;
    phone?: string;
    address?: string;
    website?: string;
  };
  lineItems: Array<{
    description: string;
    quantity?: number;
    unit: string;
    rate?: number;
    total: number;
    measurementType?: string;
    dimensions?: string;
    notes?: string;
  }>;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  date: string;
  dueDate?: string;
  paymentTerms?: string;
  notes?: string;
  terms?: string;
  amountDue?: number;
}

interface DocumentTemplateProps {
  document: DocumentData;
  forPdf?: boolean;
}

function toSourceData(document: DocumentData): DocumentSourceData {
  return {
    documentType: document.documentType,
    documentNumber: document.documentNumber,
    client: {
      name: document.client.name,
      email: document.client.email,
      phone: document.client.phone,
      address: document.client.address,
    },
    from: {
      name: document.from.name,
      businessName: document.from.businessName,
      email: document.from.email,
      phone: document.from.phone,
      address: document.from.address,
      website: document.from.website,
    },
    lineItems: document.lineItems.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unit: item.unit,
      rate: item.rate,
      total: item.total,
      measurementType: item.measurementType as DocumentSourceData['lineItems'][number]['measurementType'],
      dimensions: item.dimensions,
      notes: item.notes,
    })),
    subtotal: document.subtotal,
    taxRate: document.taxRate,
    taxAmount: document.taxAmount,
    total: document.total,
    date: document.date,
    dueDate: document.dueDate,
    paymentTerms: document.paymentTerms,
    notes: document.notes,
    terms: document.terms,
    amountDue: document.amountDue,
  };
}

export function DocumentTemplate({ document, forPdf = false }: DocumentTemplateProps) {
  const sourceData = useMemo(() => toSourceData(document), [document]);
  const renderedHTML = useMemo(() => renderDocumentBody(sourceData, { forPdf }), [sourceData, forPdf]);
  const templateStyles = useMemo(() => getTemplateStyles(), []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: templateStyles }} />
      <div dangerouslySetInnerHTML={{ __html: renderedHTML }} />
    </>
  );
}

export type { DocumentData };
