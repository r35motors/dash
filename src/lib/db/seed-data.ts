export interface DealershipData {
  business_settings: {
    id: string;
    business_name: string;
    logo_path: string | null;
    address: string;
    contact_number_1: string;
    contact_number_2: string | null;
    invoice_prefix: string;
  };
  vehicles: Array<{
    id: string;
    vehicle_name: string;
    registration_number: string;
    owner_name: string;
    purchase_price: string;
    status: "Available" | "Sold";
    created_at: string;
    updated_at: string;
  }>;
  sales: Array<{
    id: string;
    vehicle_id: string;
    buyer_name: string;
    sale_date: string;
    selling_price: string;
    created_at: string;
  }>;
  invoices: Array<{
    id: string;
    invoice_number: string;
    vehicle_id: string;
    sale_id: string | null;
    invoice_date: string;
    invoice_total: string;
    invoice_snapshot: any;
    created_at: string;
  }>;
  invoice_items: Array<{
    id: string;
    invoice_id: string;
    description: string;
    amount: string;
  }>;
}

export const initialDealershipData: DealershipData = {
  business_settings: {
    id: "a0000000-0000-0000-0000-000000000001",
    business_name: "Royal Motors Luxury Dealership",
    logo_path: "/dealership-logo.svg",
    address: "Plot 42, Highline Auto Corridor, MG Road, Bangalore 560001",
    contact_number_1: "+91 98765 43210",
    contact_number_2: "+91 98765 43211",
    invoice_prefix: "ROYAL",
  },
  vehicles: [
    {
      id: "b0000000-0000-0000-0000-000000000001",
      vehicle_name: "2022 BMW 3 Series 330i M Sport",
      registration_number: "KA-01-MJ-5501",
      owner_name: "Vikramaditya Rao",
      purchase_price: "3850000.00",
      status: "Available",
      created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    },
    {
      id: "b0000000-0000-0000-0000-000000000002",
      vehicle_name: "2021 Mercedes-Benz C-Class C200",
      registration_number: "MH-02-CB-1290",
      owner_name: "Ananya Sen",
      purchase_price: "3400000.00",
      status: "Available",
      created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 15 * 86400000).toISOString(),
    },
    {
      id: "b0000000-0000-0000-0000-000000000003",
      vehicle_name: "2023 Audi Q5 45 TFSI Technology",
      registration_number: "DL-04-AQ-8844",
      owner_name: "Rajesh Mehra",
      purchase_price: "4950000.00",
      status: "Available",
      created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    },
    {
      id: "b0000000-0000-0000-0000-000000000004",
      vehicle_name: "2021 Toyota Fortuner 2.8 4x4 AT",
      registration_number: "KA-05-TF-9900",
      owner_name: "Suresh Kulkarni",
      purchase_price: "2900000.00",
      status: "Sold",
      created_at: new Date(Date.now() - 35 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
    {
      id: "b0000000-0000-0000-0000-000000000005",
      vehicle_name: "2020 Range Rover Evoque R-Dynamic",
      registration_number: "TS-07-RR-7777",
      owner_name: "Pooja Hegde",
      purchase_price: "4200000.00",
      status: "Sold",
      created_at: new Date(Date.now() - 40 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    },
  ],
  sales: [
    {
      id: "c0000000-0000-0000-0000-000000000001",
      vehicle_id: "b0000000-0000-0000-0000-000000000004",
      buyer_name: "Devendra Patel",
      sale_date: new Date(Date.now() - 5 * 86400000).toISOString(),
      selling_price: "3350000.00",
      created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
    {
      id: "c0000000-0000-0000-0000-000000000002",
      vehicle_id: "b0000000-0000-0000-0000-000000000005",
      buyer_name: "Kavita Singhania",
      sale_date: new Date(Date.now() - 3 * 86400000).toISOString(),
      selling_price: "4750000.00",
      created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    },
  ],
  invoices: [
    {
      id: "d0000000-0000-0000-0000-000000000001",
      invoice_number: "ROYAL-2026-0001",
      vehicle_id: "b0000000-0000-0000-0000-000000000004",
      sale_id: "c0000000-0000-0000-0000-000000000001",
      invoice_date: new Date(Date.now() - 5 * 86400000).toISOString(),
      invoice_total: "3350000.00",
      invoice_snapshot: {
        dealership_name: "Royal Motors Luxury Dealership",
        buyer_name: "Devendra Patel",
        vehicle_name: "2021 Toyota Fortuner 2.8 4x4 AT",
        registration_number: "KA-05-TF-9900",
        base_price: 3320000,
        handling_fee: 30000,
      },
      created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
    {
      id: "d0000000-0000-0000-0000-000000000002",
      invoice_number: "ROYAL-2026-0002",
      vehicle_id: "b0000000-0000-0000-0000-000000000005",
      sale_id: "c0000000-0000-0000-0000-000000000002",
      invoice_date: new Date(Date.now() - 3 * 86400000).toISOString(),
      invoice_total: "4750000.00",
      invoice_snapshot: {
        dealership_name: "Royal Motors Luxury Dealership",
        buyer_name: "Kavita Singhania",
        vehicle_name: "2020 Range Rover Evoque R-Dynamic",
        registration_number: "TS-07-RR-7777",
        base_price: 4700000,
        handling_fee: 50000,
      },
      created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    },
  ],
  invoice_items: [
    {
      id: "e0000000-0000-0000-0000-000000000001",
      invoice_id: "d0000000-0000-0000-0000-000000000001",
      description: "Vehicle Purchase: 2021 Toyota Fortuner 2.8 4x4 AT (KA-05-TF-9900)",
      amount: "3320000.00",
    },
    {
      id: "e0000000-0000-0000-0000-000000000002",
      invoice_id: "d0000000-0000-0000-0000-000000000001",
      description: "RTO Transfer & Documentation Processing Charges",
      amount: "30000.00",
    },
    {
      id: "e0000000-0000-0000-0000-000000000003",
      invoice_id: "d0000000-0000-0000-0000-000000000002",
      description: "Vehicle Purchase: 2020 Range Rover Evoque R-Dynamic (TS-07-RR-7777)",
      amount: "4700000.00",
    },
    {
      id: "e0000000-0000-0000-0000-000000000004",
      invoice_id: "d0000000-0000-0000-0000-000000000002",
      description: "Pre-delivery Inspection, Ceramic Shield Coating & Transfer Handling",
      amount: "50000.00",
    },
  ],
};
