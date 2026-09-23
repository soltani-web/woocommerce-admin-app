export interface StoreConfig {
  id: string;
  name: string;
  url: string;
  consumerKey: string;
  consumerSecret: string;
  currencySymbol?: string;
  createdAt: number;
}

export interface WooProduct {
  id: number;
  name: string;
  slug: string;
  permalink: string;
  type: string;
  status: string;
  price: string;
  regular_price: string;
  sale_price: string;
  stock_status: 'instock' | 'outofstock' | 'onbackorder';
  stock_quantity: number | null;
  manage_stock: boolean;
  categories: { id: number; name: string }[];
  images: { id: number; src: string; alt?: string }[];
  sku: string;
  variations?: number[];
}

export interface WooVariation {
  id: number;
  price: string;
  regular_price: string;
  sale_price: string;
  stock_status: 'instock' | 'outofstock' | 'onbackorder';
  stock_quantity: number | null;
  attributes: { id: number; name: string; option: string }[];
  image?: { id: number; src: string };
}

export interface WooOrder {
  id: number;
  number: string;
  status: string;
  currency_symbol: string;
  date_created: string;
  total: string;
  total_tax: string;
  shipping_total: string;
  payment_method_title: string;
  billing: {
    first_name: string;
    last_name: string;
    phone: string;
    email: string;
    city: string;
    state: string;
    address_1: string;
  };
  shipping: {
    first_name: string;
    last_name: string;
    phone: string;
    city: string;
    state: string;
    address_1: string;
  };
  line_items: {
    id: number;
    name: string;
    product_id: number;
    variation_id: number;
    quantity: number;
    subtotal: string;
    total: string;
    price: number;
    image?: { id: number; src: string };
  }[];
  customer_note?: string;
}

export interface WooCustomer {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  username: string;
  avatar_url?: string;
  orders_count: number;
  total_spent: string;
  billing: {
    phone: string;
    city: string;
    address_1: string;
  };
}

export interface DashboardStats {
  totalSales: string;
  netSales: string;
  ordersCount: number;
  itemsSold: number;
  pendingOrdersCount: number;
  processingOrdersCount: number;
  lowStockCount: number;
  currencySymbol: string;
}