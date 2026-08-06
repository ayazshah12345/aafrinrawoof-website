export interface Admin {
  id: number;
  email: string;
  full_name: string;
  role: string;
  avatar_url?: string;
  is_active: bool;
  last_login?: string;
}

export type bool = boolean;

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description?: string;
  category_id?: number;
  category?: Category;
  price: number;
  discount_price?: number;
  stock: number;
  sku: string;
  images: string[];
  is_featured: boolean;
  is_new_arrival: boolean;
  is_bestseller: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: number;
  full_name: string;
  email: string;
  phone?: string;
  avatar?: string;
  address?: string;
  city?: string;
  country?: string;
  postal_code?: string;
  total_orders: number;
  total_spent: number;
  last_login?: string;
  last_login_at?: string;
  created_at: string;
}

export interface OrderItem {
  id: number;
  order_id?: number;
  product_id?: number;
  product_name: string;
  price: number;
  quantity: number;
  total: number;
}

export interface Order {
  id: number;
  order_number: string;
  customer_id: number;
  customer?: Customer;
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  order_status: 'Pending Approval' | 'Pending' | 'Confirmed' | 'Packed' | 'Shipped' | 'Delivered' | 'Cancelled';
  shipping_address?: string;
  phone?: string;
  notes?: string;
  created_at: string;
  order_items: OrderItem[];
}

export interface Invoice {
  id: number;
  invoice_number: string;
  order_id: number;
  order_number?: string;
  customer_name: string;
  amount: number;
  issued_date: string;
  payment_status?: string;
  payment_method?: string;
}

export interface Coupon {
  id: number;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_purchase: number;
  max_usage: number;
  used_count: number;
  expiry_date?: string;
  is_active: boolean;
  created_at: string;
}

export interface Review {
  id: number;
  product_id: number;
  product?: Product;
  customer_name: string;
  customer_email: string;
  rating: number;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_reply?: string;
  created_at: string;
}

export interface Settings {
  id: number;
  store_name: string;
  store_logo?: string;
  favicon?: string;
  contact_number?: string;
  email?: string;
  address?: string;
  whatsapp?: string;
  instagram?: string;
  facebook?: string;
  shipping_charge: number;
  tax_percentage: number;
  currency: string;
  store_banner?: string;
  maintenance_mode: boolean;
}

export interface ActivityLog {
  id: number;
  admin_id?: number;
  action: string;
  entity_type?: string;
  entity_id?: string;
  details?: string;
  created_at: string;
}

export interface AnalyticsSummary {
  total_products: number;
  total_orders: number;
  total_customers: number;
  total_revenue: number;
  today_revenue: number;
  monthly_revenue: number;
  pending_orders: number;
  completed_orders: number;
  cancelled_orders: number;
  low_stock_products: number;
}
