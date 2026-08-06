import { supabaseService } from '../services/supabaseService';

// Direct Supabase API Adapter with generic type support for TypeScript
export const api = {
  async get<T = any>(url: string, config?: any): Promise<{ data: T }> {
    const u = url.replace('/api/v1', '');
    
    if (u.startsWith('/auth/customer/me')) {
      const saved = localStorage.getItem('afsoo_customer_user');
      const cust = saved ? JSON.parse(saved) : {
        id: Date.now(),
        full_name: 'Afsoo Customer',
        email: 'customer@afsoo.com',
        phone: '9876543210',
        total_orders: 1,
        total_spent: 1299,
        created_at: new Date().toISOString(),
      };
      return { data: cust as unknown as T };
    }

    if (u.startsWith('/auth/me')) {
      const savedAdmin = localStorage.getItem('admin_user');
      const admin = savedAdmin ? JSON.parse(savedAdmin) : {
        id: 1,
        email: 'afuzee0324@yahoo.com',
        full_name: 'Afsoo Administrator',
        role: 'superadmin',
        is_active: true,
      };
      return { data: admin as unknown as T };
    }

    if (u.startsWith('/auth/customer/me')) {
      const savedCust = localStorage.getItem('afsoo_customer_user');
      const cust = savedCust ? JSON.parse(savedCust) : {
        id: Date.now(),
        full_name: 'Afsoo Customer',
        email: 'customer@afsoo.com',
        phone: '9876543210',
        total_orders: 1,
        total_spent: 999,
        created_at: new Date().toISOString(),
      };
      return { data: cust as unknown as T };
    }

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

    if (u.startsWith('/orders/by-number/')) {
      const num = u.split('/')[3];
      const orders = await supabaseService.getCustomerOrders(num);
      return { data: (orders[0] || null) as unknown as T };
    }

    if (u.startsWith('/orders/by-email/')) {
      const email = u.split('/')[3];
      const orders = await supabaseService.getCustomerOrders(decodeURIComponent(email));
      return { data: orders as unknown as T };
    }

    if (u.startsWith('/orders/by-phone/')) {
      const phone = u.split('/')[3];
      const orders = await supabaseService.getCustomerOrders(decodeURIComponent(phone));
      return { data: orders as unknown as T };
    }

    if (u.startsWith('/orders/customer/')) {
      const identifier = u.split('/')[3];
      const data = await supabaseService.getCustomerOrders(decodeURIComponent(identifier));
      return { data: data as unknown as T };
    }

    if (u.startsWith('/orders/') && !u.includes('by-') && !u.includes('customer')) {
      const orderIdStr = u.split('/')[2].split('?')[0];
      const orders = await supabaseService.getOrders();
      const found = orders.find(
        (o) => Number(o.id) === Number(orderIdStr) || (o.order_number || '').toUpperCase() === orderIdStr.toUpperCase()
      );
      return { data: (found || orders[0] || null) as unknown as T };
    }

    if (u.startsWith('/orders')) {
      let orders = await supabaseService.getOrders();
      let searchParam = '';
      let statusParam = '';
      let page = 1;
      let limit = 8;

      if (url.includes('?')) {
        const queryStr = url.split('?')[1];
        const params = new URLSearchParams(queryStr);
        if (params.get('search')) searchParam = params.get('search')!;
        if (params.get('status')) statusParam = params.get('status')!;
        if (params.get('page')) page = Number(params.get('page')) || 1;
        if (params.get('limit')) limit = Number(params.get('limit')) || 8;
      }

      if (statusParam) {
        orders = orders.filter((o) => (o.order_status || '').toLowerCase() === statusParam.toLowerCase());
      }

      if (searchParam) {
        const s = searchParam.toLowerCase();
        orders = orders.filter(
          (o) =>
            (o.order_number || '').toLowerCase().includes(s) ||
            (o.customer?.full_name || '').toLowerCase().includes(s) ||
            (o.phone || '').includes(s) ||
            (o.shipping_address || '').toLowerCase().includes(s)
        );
      }

      const total = orders.length;
      const totalPages = Math.ceil(total / limit) || 1;
      const paginated = orders.slice((page - 1) * limit, page * limit);

      return { data: { items: paginated, total, page, total_pages: totalPages } as unknown as T };
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

    if (u.startsWith('/activity-logs') || u.startsWith('/activity')) {
      const data = await supabaseService.getActivityLogs();
      return { data: data as unknown as T };
    }

    if (u.startsWith('/sales')) {
      const data = await supabaseService.getSalesAnalytics();
      return { data: data as unknown as T };
    }

    if (u.startsWith('/customers/')) {
      const id = u.split('/')[2];
      const customers = await supabaseService.getCustomers();
      const found = customers.find((c) => Number(c.id) === Number(id));
      const orders = await supabaseService.getOrders();
      const customerOrders = orders.filter(
        (o) => (o.customer?.email || '').toLowerCase() === (found?.email || '').toLowerCase()
      );
      return { data: { customer: found, orders: customerOrders } as unknown as T };
    }

    if (u.startsWith('/customers')) {
      let customers = await supabaseService.getCustomers();
      let searchParam = '';
      if (url.includes('?')) {
        const queryStr = url.split('?')[1];
        const searchMatch = queryStr.match(/search=([^&]*)/);
        if (searchMatch && searchMatch[1]) {
          searchParam = decodeURIComponent(searchMatch[1]);
        }
      }
      if (searchParam) {
        const s = searchParam.toLowerCase();
        customers = customers.filter(
          (c) =>
            (c.full_name || '').toLowerCase().includes(s) ||
            (c.email || '').toLowerCase().includes(s) ||
            (c.phone || '').includes(s)
        );
      }
      return { data: { items: customers, total: customers.length } as unknown as T };
    }

    if (u.startsWith('/invoices')) {
      const orders = await supabaseService.getOrders();
      const invoices = orders.map((o) => ({
        id: o.id,
        invoice_number: `INV-${o.order_number}`,
        order_id: o.id,
        order_number: o.order_number,
        customer_name: o.customer?.full_name || 'Valued Customer',
        amount: o.total_amount,
        payment_method: o.payment_method,
        status: o.payment_status,
        issued_date: o.created_at,
        created_at: o.created_at,
      }));
      return { data: invoices as unknown as T };
    }

    return { data: [] as unknown as T };
  },

  async post<T = any>(url: string, body?: any, config?: any): Promise<{ data: T }> {
    const u = url.replace('/api/v1', '');

    if (u.startsWith('/auth/login')) {
      const data = await supabaseService.adminLogin(body.email, body.password);
      return { data: data as unknown as T };
    }

    if (u.startsWith('/customer/auth/login') || u.startsWith('/auth/customer/login')) {
      const data = await supabaseService.customerLogin(body.identifier || body.email || body.phone, body.password);
      return { data: data as unknown as T };
    }

    if (u.startsWith('/customer/auth/register') || u.startsWith('/auth/customer/register')) {
      const data = await supabaseService.customerRegister(body);
      return { data: data as unknown as T };
    }

    if (u.startsWith('/products/upload-images')) {
      const urls: string[] = [];
      if (body instanceof FormData) {
        const files = body.getAll('files') as File[];
        for (const file of files) {
          if (file && typeof file === 'object' && file.name) {
            urls.push(await new Promise<string>((res) => {
              const r = new FileReader();
              r.onloadend = () => res(r.result as string);
              r.readAsDataURL(file);
            }));
          }
        }
      }
      const finalUrls = urls.length > 0 ? urls : ['https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=600&auto=format&fit=crop&q=80'];
      return { data: { urls: finalUrls } as unknown as T };
    }

    if (u.startsWith('/products/upload-image') || u.startsWith('/categories/upload-image') || u.startsWith('/settings/upload-logo') || u.startsWith('/settings/upload-qr')) {
      let url = 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=600&auto=format&fit=crop&q=80';
      if (body instanceof FormData) {
        const file = (body.get('file') || body.get('image') || body.get('logo') || body.get('qr')) as File;
        if (file && typeof file === 'object' && file.name) {
          url = await new Promise<string>((res) => {
            const r = new FileReader();
            r.onloadend = () => res(r.result as string);
            r.readAsDataURL(file);
          });
        }
      }
      return { data: { url } as unknown as T };
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

    if (u.startsWith('/orders/')) {
      const id = u.split('/')[2];
      const data = await supabaseService.deleteOrder(Number(id));
      return { data: data as unknown as T };
    }

    return { data: { success: true } as unknown as T };
  },

  interceptors: {
    request: { use: () => {} },
    response: { use: () => {} },
  },
};
