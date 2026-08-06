import { supabaseService } from '../services/supabaseService';

// Direct Supabase API Adapter with generic type support for TypeScript
export const api = {
  async get<T = any>(url: string, config?: any): Promise<{ data: T }> {
    const u = url.replace('/api/v1', '');
    
    if (u.startsWith('/products/')) {
      const id = u.split('/')[2];
      const data = await supabaseService.getProductById(Number(id));
      return { data: data as unknown as T };
    }

    if (u.startsWith('/products')) {
      const params = config?.params || {};
      const data = await supabaseService.getProducts(params);
      return { data: data as unknown as T };
    }

    if (u.startsWith('/categories')) {
      const data = await supabaseService.getCategories();
      return { data: { items: data } as unknown as T };
    }

    if (u.startsWith('/orders/customer/')) {
      const identifier = u.split('/')[3];
      const data = await supabaseService.getCustomerOrders(identifier);
      return { data: data as unknown as T };
    }

    if (u.startsWith('/orders')) {
      const data = await supabaseService.getOrders();
      return { data: { items: data } as unknown as T };
    }

    if (u.startsWith('/settings')) {
      const data = await supabaseService.getSettings();
      return { data: data as unknown as T };
    }

    if (u.startsWith('/coupons')) {
      const data = await supabaseService.getCoupons();
      return { data: { items: data } as unknown as T };
    }

    if (u.startsWith('/reviews')) {
      const data = await supabaseService.getReviews();
      return { data: { items: data } as unknown as T };
    }

    if (u.startsWith('/activity')) {
      const data = await supabaseService.getActivityLogs();
      return { data: { items: data } as unknown as T };
    }

    if (u.startsWith('/sales')) {
      const data = await supabaseService.getSalesAnalytics();
      return { data: data as unknown as T };
    }

    if (u.startsWith('/customers')) {
      const orders = await supabaseService.getOrders();
      const customersMap = new Map();
      orders.forEach((o) => {
        const email = o.customer?.email || 'customer@example.com';
        if (!customersMap.has(email)) {
          customersMap.set(email, {
            id: o.id,
            full_name: o.customer?.full_name || 'Customer',
            email: email,
            phone: o.customer?.phone || o.phone || '',
            total_orders: 1,
            total_spent: o.total_amount,
            created_at: o.created_at,
          });
        } else {
          const existing = customersMap.get(email);
          existing.total_orders += 1;
          existing.total_spent += o.total_amount;
        }
      });
      return { data: { items: Array.from(customersMap.values()) } as unknown as T };
    }

    if (u.startsWith('/invoices')) {
      const orders = await supabaseService.getOrders();
      const invoices = orders.map((o) => ({
        id: o.id,
        invoice_number: `INV-${o.order_number}`,
        order_id: o.id,
        order_number: o.order_number,
        customer_name: o.customer?.full_name || 'Customer',
        total_amount: o.total_amount,
        status: o.payment_status,
        created_at: o.created_at,
      }));
      return { data: { items: invoices } as unknown as T };
    }

    return { data: [] as unknown as T };
  },

  async post<T = any>(url: string, body?: any, config?: any): Promise<{ data: T }> {
    const u = url.replace('/api/v1', '');

    if (u.startsWith('/auth/login')) {
      const data = await supabaseService.adminLogin(body.email, body.password);
      return { data: data as unknown as T };
    }

    if (u.startsWith('/customer/auth/login')) {
      const data = await supabaseService.customerLogin(body.identifier, body.password);
      return { data: data as unknown as T };
    }

    if (u.startsWith('/customer/auth/register')) {
      const data = await supabaseService.customerRegister(body);
      return { data: data as unknown as T };
    }

    if (u.startsWith('/products/upload-images')) {
      return { data: { urls: ['/logo.png'] } as unknown as T };
    }

    if (u.startsWith('/products/upload-image') || u.startsWith('/categories/upload-image') || u.startsWith('/settings/upload-logo') || u.startsWith('/settings/upload-qr')) {
      return { data: { url: '/logo.png' } as unknown as T };
    }

    if (u.startsWith('/products')) {
      const data = await supabaseService.createProduct(body);
      return { data: data as unknown as T };
    }

    if (u.startsWith('/categories')) {
      const data = await supabaseService.createCategory(body);
      return { data: data as unknown as T };
    }

    if (u.startsWith('/orders')) {
      const data = await supabaseService.createOrder(body);
      return { data: data as unknown as T };
    }

    return { data: body as unknown as T };
  },

  async put<T = any>(url: string, body?: any): Promise<{ data: T }> {
    const u = url.replace('/api/v1', '');

    if (u.startsWith('/products/')) {
      const id = u.split('/')[2];
      const data = await supabaseService.updateProduct(Number(id), body);
      return { data: data as unknown as T };
    }

    if (u.startsWith('/orders/') && u.endsWith('/status')) {
      const id = u.split('/')[2];
      const data = await supabaseService.updateOrderStatus(Number(id), body.status);
      return { data: data as unknown as T };
    }

    if (u.startsWith('/settings')) {
      const data = await supabaseService.updateSettings(body);
      return { data: data as unknown as T };
    }

    return { data: body as unknown as T };
  },

  async patch<T = any>(url: string, body?: any): Promise<{ data: T }> {
    return this.put<T>(url, body);
  },

  async delete<T = any>(url: string): Promise<{ data: T }> {
    const u = url.replace('/api/v1', '');

    if (u.startsWith('/products/')) {
      const id = u.split('/')[2];
      const data = await supabaseService.deleteProduct(Number(id));
      return { data: data as unknown as T };
    }

    return { data: { success: true } as unknown as T };
  },

  interceptors: {
    request: { use: () => {} },
    response: { use: () => {} },
  },
};
