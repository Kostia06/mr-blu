import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import type { TemplateData } from '$lib/parsing';
import { renderDocumentHTML, prepareTemplateData } from './render';
import type { DocumentSourceData } from './types';
import { colors } from './styles';

export interface PDFOptions {
	data: TemplateData;
	outputType?: 'blob' | 'dataurl' | 'arraybuffer';
}

/**
 * Transform TemplateData (from parsing) to DocumentSourceData (for rendering)
 */
function templateDataToSourceData(data: TemplateData): DocumentSourceData {
	return {
		documentType: data.documentType,
		documentNumber: data.documentNumber,
		client: {
			name: data.billTo.name,
			email: data.billTo.email,
			phone: data.billTo.phone,
			address: data.billTo.address
		},
		from: {
			name: data.from.name,
			businessName: data.from.businessName,
			email: data.from.email,
			phone: data.from.phone,
			address: data.from.address
		},
		lineItems: data.items.map((item) => ({
			description: item.description,
			quantity: item.quantity,
			unit: item.unit,
			rate: item.rate,
			total: item.total,
			measurementType: item.measurementType,
			dimensions: item.dimensions
		})),
		subtotal: data.subtotal,
		taxRate: data.gstRate * 100, // Convert from decimal to percentage
		taxAmount: data.gstAmount,
		total: data.total,
		date: data.date,
		dueDate: data.dueDate
	};
}

/**
 * Generate the HTML for PDF rendering using the shared template
 */
function generateHTMLTemplate(data: TemplateData): string {
	const sourceData = templateDataToSourceData(data);
	return renderDocumentHTML(sourceData, { forPdf: true });
}

/**
 * Generate PDF from HTML template using html2canvas
 */
export async function generatePDF(options: PDFOptions): Promise<Blob | string | ArrayBuffer> {
	const { outputType = 'blob' } = options;
	const html = generateHTMLTemplate(options.data);

	// Use DOMParser for safe HTML parsing
	const parser = new DOMParser();
	const doc = parser.parseFromString(html, 'text/html');

	// Create a container and append the parsed content
	const container = document.createElement('div');
	container.style.position = 'absolute';
	container.style.left = '-9999px';
	container.style.top = '0';

	// Clone the body content safely
	const bodyContent = doc.body.firstElementChild;
	if (bodyContent) {
		container.appendChild(bodyContent.cloneNode(true));
	}

	// Apply styles from the parsed document
	const styles = doc.head.querySelector('style');
	if (styles) {
		const styleEl = document.createElement('style');
		styleEl.textContent = styles.textContent;
		container.prepend(styleEl);
	}

	document.body.appendChild(container);

	// Find the document template element
	const element = container.querySelector('.document-template') as HTMLElement;

	try {
		// Use html2canvas to capture the element
		const canvas = await html2canvas(element, {
			scale: 2, // Higher quality
			useCORS: true,
			allowTaint: true,
			backgroundColor: colors.bgDocument
		});

		// Create PDF from canvas
		const imgData = canvas.toDataURL('image/png');
		const pdf = new jsPDF({
			orientation: 'portrait',
			unit: 'in',
			format: 'letter'
		});

		const pageWidth = 8.5;
		const pageHeight = 11;
		const imgWidth = pageWidth;
		const imgHeight = (canvas.height * imgWidth) / canvas.width;

		pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, Math.min(imgHeight, pageHeight));

		// Output
		switch (outputType) {
			case 'dataurl':
				return pdf.output('dataurlstring');
			case 'arraybuffer':
				return pdf.output('arraybuffer');
			case 'blob':
			default:
				return pdf.output('blob');
		}
	} finally {
		// Clean up
		document.body.removeChild(container);
	}
}

/**
 * Preview PDF in new tab
 */
export async function previewPDF(data: TemplateData): Promise<void> {
	const blob = await generatePDF({ data, outputType: 'blob' });
	if (blob instanceof Blob) {
		const url = URL.createObjectURL(blob);
		window.open(url, '_blank');
		setTimeout(() => URL.revokeObjectURL(url), 60000);
	}
}

/**
 * Download PDF
 */
export async function downloadPDF(data: TemplateData, filename?: string): Promise<void> {
	const blob = await generatePDF({ data, outputType: 'blob' });
	if (blob instanceof Blob) {
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		const docType = data.documentType?.toLowerCase() || 'document';
		link.download = filename || `${docType}-${data.documentNumber || 'draft'}.pdf`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	}
}

/**
 * Get PDF as base64 for sending
 */
export async function getPDFBase64(data: TemplateData): Promise<string> {
	const result = await generatePDF({ data, outputType: 'dataurl' });
	if (typeof result === 'string') {
		return result.replace(/^data:application\/pdf;.*base64,/, '');
	}
	throw new Error('Failed to generate PDF base64');
}

/**
 * Get PDF as Blob for uploading to storage
 */
export async function getPDFBlob(data: TemplateData): Promise<Blob> {
	const result = await generatePDF({ data, outputType: 'blob' });
	if (result instanceof Blob) {
		return result;
	}
	throw new Error('Failed to generate PDF blob');
}

// Export the HTML template generator for server-side use
export { generateHTMLTemplate };
