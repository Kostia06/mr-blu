export const INVOICE_STATUSES = {
  draft: { label: 'Draft', color: 'gray' },
  sent: { label: 'Sent', color: 'blue' },
  paid: { label: 'Paid', color: 'green' },
  overdue: { label: 'Overdue', color: 'red' },
  cancelled: { label: 'Cancelled', color: 'gray' },
} as const;

export const TAX_RATES = [
  { label: 'No Tax', value: 0 },
  { label: '5%', value: 5 },
  { label: '7%', value: 7 },
  { label: '10%', value: 10 },
  { label: '13%', value: 13 },
  { label: '15%', value: 15 },
] as const;

export const CURRENCY_OPTIONS = [
  { label: 'USD ($)', value: 'USD' },
  { label: 'CAD ($)', value: 'CAD' },
  { label: 'EUR (€)', value: 'EUR' },
  { label: 'GBP (£)', value: 'GBP' },
] as const;
