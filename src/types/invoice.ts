export interface InvoicePdfData {
  id?: string;
  invoice_number: string;
  invoice_date: string;
  dealership?: {
    business_name: string;
    logo_path?: string | null;
    address: string;
    contact_number_1: string;
    contact_number_2?: string | null;
    invoice_prefix?: string;
  };
  buyer?: {
    name: string;
  };
  vehicle?: {
    id?: string;
    vehicle_name: string;
    registration_number: string;
    owner_name: string;
    purchase_price?: string | number;
    selling_price?: string | number;
  };
  items?: Array<{
    description: string;
    amount: string | number;
  }>;
  invoice_total?: string | number;
  amount_in_words?: string;
  invoice_snapshot?: any;
}
