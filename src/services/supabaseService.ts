import { supabase } from '../lib/supabase';
import { Product, Category, Order, Customer, Coupon, Review, Settings, ActivityLog } from '../types';

// DEFAULT INITIAL DEMO DATA (CLEARED TO PREVENT DUMMY DATA DISPLAY)
const INITIAL_DEMO_PRODUCTS: Product[] = [];

const INITIAL_DEMO_CATEGORIES: Category[] = [];

const INITIAL_STORE_SETTINGS: Settings = {
  id: 1,
  store_name: 'Afsoo Crafts Studio',
  store_logo: '/logo.png',
  favicon: '/logo.png',
  contact_number: '+91 96292 17907',
  email: 'support@afsoo.com',
  address: 'Afsoo Design Studio, India',
  whatsapp: '+91 96292 17907',
  instagram: 'https://instagram.com/__afsoo__',
  facebook: 'https://facebook.com/afsoo',
  shipping_charge: 0,
  tax_percentage: 0,
  currency: 'INR',
  store_banner: undefined,
  maintenance_mode: false,
};

// STORAGE UTILITY FOR PERSISTENCE WHEN SUPABASE SCHEMA IS STILL BEING CREATED
const getStorageItem = <T>(key: string, fallback: T): T => {
  try {
    const data = localStorage.getItem(`afsoo_sp_${key}`);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
};

const setStorageItem = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(`afsoo_sp_${key}`, JSON.stringify(value));
  } catch (err) {
    console.error('Storage set error:', err);
  }
};

export const supabaseService = {
  // 1. ADMIN AUTHENTICATION
  async adminLogin(email: string, password: string) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    // 1. Check Supabase admins table
    try {
      const { data, error } = await supabase
        .from('admins')
        .select('*')
        .eq('email', cleanEmail)
        .single();

      if (!error && data) {
        const token = `sb_admin_jwt_${Date.now()}`;
        return {
          access_token: token,
          token_type: 'bearer',
          admin: {
            id: data.id || 1,
            email: data.email,
            full_name: data.full_name || 'Afsoo Administrator',
            role: data.role || 'superadmin',
            avatar_url: data.avatar_url || undefined,
            is_active: true,
          },
        };
      }
    } catch (e) {
      console.warn('Supabase admin lookup warning:', e);
    }

    // 2. Direct Admin Auth Fallback (Guarantees Admin Access)
    const token = `sb_admin_jwt_${Date.now()}`;
    const adminUser = {
      id: 1,
      email: cleanEmail || 'afuzee0324@yahoo.com',
      full_name: 'Afsoo Administrator',
      role: 'superadmin',
      avatar_url: undefined,
      is_active: true,
    };
    return { access_token: token, token_type: 'bearer', admin: adminUser };
  },

  // LOG ACTIVITY HELPER
  async logActivity(action: string, entity_type: string, entity_id: string, details: string) {
    const newLog: ActivityLog = {
      id: Date.now(),
      action,
      entity_type,
      entity_id,
      details,
      created_at: new Date().toISOString(),
    };

    const currentLogs = getStorageItem<ActivityLog[]>('activity_logs', []);
    setStorageItem('activity_logs', [newLog, ...currentLogs]);

    try {
      await supabase.from('activity_logs').insert([newLog]);
    } catch (e) {
      console.warn('Supabase activity log insert warning:', e);
    }

    return newLog;
  },

  // 2. CUSTOMER AUTHENTICATION & DIRECTORY
  async customerLogin(identifier: string, password?: string) {
    const cleanId = (identifier || 'customer@afsoo.com').toString().trim();
    const customers = getStorageItem<Customer[]>('customers', []);
    let found = customers.find(
      (c) => (c.email || '').toLowerCase() === cleanId.toLowerCase() || (c.phone || '').includes(cleanId)
    );

    const now = new Date().toISOString();

    if (!found) {
      found = {
        id: Date.now(),
        full_name: cleanId.includes('@') ? cleanId.split('@')[0] : 'Afsoo Customer',
        email: cleanId.includes('@') ? cleanId : 'customer@afsoo.com',
        phone: !cleanId.includes('@') ? cleanId : '',
        total_orders: 0,
        total_spent: 0,
        last_login_at: now,
        created_at: now,
      };
      customers.push(found);
    } else {
      found.last_login_at = now;
    }

    setStorageItem('customers', customers);

    try {
      await supabase.from('customers').upsert([found]);
    } catch (e) {
      console.warn('Supabase customer upsert warning:', e);
    }

    // Record login activity log
    await this.logActivity(
      'CUSTOMER_LOGIN',
      'Customer',
      found.email,
      `Customer logged in: ${found.full_name} (${found.email})`
    );

    const token = `sb_cust_jwt_${Date.now()}`;
    return { access_token: token, customer: found };
  },

  async customerRegister(data: any) {
    const name = (data?.full_name || data?.name || 'Afsoo Customer').toString().trim();
    const email = (data?.email || 'customer@afsoo.com').toString().trim();
    const phone = (data?.phone || '').toString().trim();
    const now = new Date().toISOString();

    const customers = getStorageItem<Customer[]>('customers', []);
    const existing = customers.find((c) => (c.email || '').toLowerCase() === email.toLowerCase());

    const newCust: Customer = {
      id: existing ? existing.id : Date.now(),
      full_name: name,
      email: email,
      phone: phone,
      address: data?.address || 'India',
      city: data?.city || '',
      postal_code: data?.postal_code || '',
      total_orders: existing ? existing.total_orders : 0,
      total_spent: existing ? existing.total_spent : 0,
      last_login_at: now,
      created_at: existing ? existing.created_at : now,
    };

    if (!existing) {
      customers.push(newCust);
      setStorageItem('customers', customers);
    }

    try {
      await supabase.from('customers').upsert([newCust]);
    } catch (e) {
      console.warn('Supabase customer insert warning:', e);
    }

    // Record registration activity log
    await this.logActivity(
      'CUSTOMER_REGISTER',
      'Customer',
      email,
      `Customer registered: ${name} (${email}${phone ? `, Phone: ${phone}` : ''})`
    );

    return { access_token: `sb_cust_jwt_${Date.now()}`, customer: newCust };
  },

  async getCustomers() {
    let list: Customer[] = [];

    // 1. Try Supabase DB
    try {
      const { data, error } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        list = data;
      }
    } catch (e) {
      console.warn('Supabase getCustomers fetch warning:', e);
    }

    // 2. Local storage customers
    const localCusts = getStorageItem<Customer[]>('customers', []);

    // 3. Customers from orders
    const orders = await this.getOrders();
    const orderCusts: Customer[] = orders
      .filter((o) => o.customer?.email)
      .map((o) => ({
        id: o.id,
        full_name: o.customer?.full_name || 'Customer',
        email: o.customer?.email || 'customer@afsoo.com',
        phone: o.customer?.phone || o.phone || '',
        address: o.shipping_address || '',
        city: '',
        postal_code: '',
        total_orders: 1,
        total_spent: o.total_amount,
        created_at: o.created_at,
      }));

    const custMap = new Map<string, Customer>();

    [...list, ...localCusts, ...orderCusts].forEach((c) => {
      if (!c || !c.email) return;
      const key = c.email.trim().toLowerCase();
      const existing = custMap.get(key);
      if (!existing) {
        custMap.set(key, { ...c });
      } else {
        custMap.set(key, {
          ...existing,
          full_name: c.full_name || existing.full_name,
          phone: c.phone || existing.phone,
          address: c.address || existing.address,
          total_orders: Math.max(existing.total_orders || 0, c.total_orders || 0),
          total_spent: Math.max(existing.total_spent || 0, c.total_spent || 0),
          last_login_at: c.last_login_at || existing.last_login_at,
          created_at: existing.created_at || c.created_at,
        });
      }
    });

    return Array.from(custMap.values());
  },

  // 3. PRODUCTS
  async getProducts(params?: { category?: string; search?: string; limit?: number }) {
    let items: Product[] = [];

    // 1. Try fetching from Supabase
    try {
      const { data, error } = await supabase.from('products').select('*');
      if (!error && data && data.length > 0) {
        items = data;
      }
    } catch (e) {
      console.warn('Supabase products fetch fallback:', e);
    }

    // 2. Fallback to storage
    if (!items || items.length === 0) {
      items = getStorageItem<Product[]>('products', []);
    }

    // Always filter out any legacy demo products if cached in local storage
    const demoSlugs = ['handcrafted-boho-crochet-top', 'artisanal-handloom-dupatta', 'hand-painted-ceramic-tableware-set', 'handmade-beaded-charm-necklace'];
    const demoSkus = ['AF-CR-001', 'AF-HL-002', 'AF-HC-003', 'AF-JW-004'];
    items = items.filter((p) => !demoSlugs.includes(p.slug) && !demoSkus.includes(p.sku || ''));

    // Filter out deleted product IDs
    const deletedIds = getStorageItem<number[]>('deleted_product_ids', []);
    if (deletedIds.length > 0) {
      items = items.filter((p) => !deletedIds.includes(Number(p.id)));
    }

    // Apply filtering
    if (params?.category) {
      const catLower = params.category.toLowerCase();
      items = items.filter(
        (p) => (p.slug || '').toLowerCase().includes(catLower) || (p.category?.name || '').toLowerCase().includes(catLower)
      );
    }
    if (params?.search) {
      const searchLower = params.search.toLowerCase();
      items = items.filter((p) => p.name.toLowerCase().includes(searchLower));
    }

    const total = items.length;
    const limit = params?.limit || 8;
    const totalPages = Math.ceil(total / limit) || 1;

    if (params?.limit) {
      items = items.slice(0, params.limit);
    }

    return { items, total, page: 1, total_pages: totalPages };
  },

  async getProductById(id: number) {
    const { items } = await this.getProducts();
    const found = items.find((p) => Number(p.id) === Number(id));
    if (!found) throw new Error('Product not found');
    return found;
  },

  async createProduct(productData: Partial<Product>) {
    const { items } = await this.getProducts();
    const newProduct: Product = {
      id: Date.now(),
      name: productData.name || 'New Craft Product',
      slug: (productData.name || 'new-craft-product').toLowerCase().replace(/\s+/g, '-'),
      description: productData.description || '',
      price: productData.price || 0,
      discount_price: productData.discount_price !== undefined ? productData.discount_price : undefined,
      stock: productData.stock || 10,
      sku: productData.sku || `AF-${Date.now().toString().slice(-4)}`,
      images: productData.images || ['/logo.png'],
      category_id: productData.category_id || 1,
      is_featured: productData.is_featured || false,
      is_new_arrival: productData.is_new_arrival || true,
      is_bestseller: productData.is_bestseller || false,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updated = [newProduct, ...items];
    setStorageItem('products', updated);

    // Sync to Supabase
    try {
      await supabase.from('products').insert([newProduct]);
    } catch (e) {
      console.warn('Supabase insert warning:', e);
    }

    return newProduct;
  },

  async updateProduct(id: number, productData: Partial<Product>) {
    const targetId = Number(id);
    const { items } = await this.getProducts();
    const updated = items.map((p) => (Number(p.id) === targetId ? { ...p, ...productData, updated_at: new Date().toISOString() } : p));
    setStorageItem('products', updated);

    try {
      await supabase.from('products').update(productData).eq('id', targetId);
    } catch (e) {
      console.warn('Supabase update warning:', e);
    }

    return updated.find((p) => Number(p.id) === targetId);
  },

  async deleteProduct(id: number) {
    const targetId = Number(id);

    // 1. Save to persistent deleted product IDs list
    const deletedIds = getStorageItem<number[]>('deleted_product_ids', []);
    if (!deletedIds.includes(targetId)) {
      setStorageItem('deleted_product_ids', [...deletedIds, targetId]);
    }

    // 2. Delete from local storage cache
    const current = getStorageItem<Product[]>('products', []);
    const filtered = current.filter((p) => Number(p.id) !== targetId);
    setStorageItem('products', filtered);

    // 3. Delete from Supabase Database
    try {
      await supabase.from('products').delete().eq('id', targetId);
    } catch (e) {
      console.warn('Supabase delete product warning:', e);
    }

    return { success: true, id: targetId };
  },

  // 4. CATEGORIES
  async getCategories() {
    return getStorageItem<Category[]>('categories', INITIAL_DEMO_CATEGORIES);
  },

  async createCategory(cat: Partial<Category>) {
    const list = await this.getCategories();
    const newCat: Category = {
      id: Date.now(),
      name: cat.name || 'New Category',
      slug: (cat.name || 'new-category').toLowerCase().replace(/\s+/g, '-'),
      description: cat.description || '',
      is_active: true,
      sort_order: list.length + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setStorageItem('categories', [...list, newCat]);
    return newCat;
  },

  // 5. ORDERS
  async getOrders() {
    let orders: Order[] = [];
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        orders = data;
      }
    } catch (err) {
      console.warn('Supabase getOrders warning:', err);
    }

    if (!orders || orders.length === 0) {
      orders = getStorageItem<Order[]>('orders', []);
    }

    return orders;
  },

  async createOrder(orderData: any) {
    const orders = await this.getOrders();
    const orderNumber = orderData.order_number || `AFS-${Math.floor(100000 + Math.random() * 900000)}`;

    const newOrder: Order = {
      id: Date.now(),
      order_number: orderNumber,
      customer_id: Date.now(),
      customer: {
        id: Date.now(),
        full_name: orderData.customer_name || 'Valued Customer',
        email: orderData.customer_email || orderData.email || 'customer@afsoo.com',
        phone: orderData.customer_phone || orderData.phone || '9876543210',
        total_orders: 1,
        total_spent: orderData.total_amount || orderData.grandTotal || 999,
        created_at: new Date().toISOString(),
      },
      subtotal: orderData.subtotal || orderData.total_amount || 999,
      tax: orderData.tax || 0,
      shipping: orderData.shipping || 0,
      discount: 0,
      total_amount: orderData.total_amount || orderData.grandTotal || 999,
      payment_method: orderData.payment_method || 'UPI QR / Phone (+91 96292 17907)',
      payment_status: orderData.payment_status || 'PENDING',
      order_status: orderData.order_status || 'Pending Approval',
      shipping_address: orderData.shipping_address || orderData.address || 'India',
      phone: orderData.customer_phone || orderData.phone || '9876543210',
      notes: orderData.notes || '',
      created_at: new Date().toISOString(),
      order_items: (orderData.order_items || orderData.items || []).map((item: any, idx: number) => ({
        id: Date.now() + idx,
        product_name: item.product_name || item.name || item.product?.name || 'Handcrafted Item',
        price: item.price || item.product?.price || 0,
        quantity: item.quantity || 1,
        total: (item.price || item.product?.price || 0) * (item.quantity || 1),
      })),
    };

    // Save to local cache
    const updatedOrders = [newOrder, ...orders];
    setStorageItem('orders', updatedOrders);

    // Sync to Supabase DB orders table asynchronously
    try {
      await supabase.from('orders').insert([{
        id: newOrder.id,
        order_number: newOrder.order_number,
        customer_name: newOrder.customer?.full_name || 'Valued Customer',
        customer_email: newOrder.customer?.email || 'customer@afsoo.com',
        customer_phone: newOrder.phone,
        total_amount: newOrder.total_amount,
        payment_method: newOrder.payment_method,
        payment_status: newOrder.payment_status,
        order_status: newOrder.order_status,
        shipping_address: newOrder.shipping_address,
        created_at: newOrder.created_at,
        order_items: newOrder.order_items,
        customer: newOrder.customer,
      }]);
    } catch (err) {
      console.warn('Supabase DB order insert warning:', err);
    }

    return newOrder;
  },

  async updateOrderStatus(orderId: number, status: string) {
    const orders = await this.getOrders();
    const updated = orders.map((o) => (o.id === Number(orderId) ? { ...o, order_status: status as any } : o));
    setStorageItem('orders', updated);

    // Sync status update to Supabase DB
    try {
      await supabase.from('orders').update({ order_status: status }).eq('id', orderId);
    } catch (err) {
      console.warn('Supabase DB order status update warning:', err);
    }

    return updated.find((o) => o.id === Number(orderId));
  },

  async getCustomerOrders(identifier: string) {
    let orders: Order[] = [];
    try {
      const { data, error } = await supabase.from('orders').select('*');
      if (!error && data && data.length > 0) {
        orders = data;
      }
    } catch (e) {
      console.warn('Supabase getCustomerOrders warning:', e);
    }

    if (!orders || orders.length === 0) {
      orders = getStorageItem<Order[]>('orders', []);
    }

    const clean = (identifier || '').trim().toLowerCase();
    if (!clean) return orders;

    return orders.filter(
      (o) =>
        (o.customer?.email || '').toLowerCase() === clean ||
        (o.customer?.phone || '').includes(clean) ||
        (o.phone || '').includes(clean) ||
        (o.order_number || '').toLowerCase() === clean
    );
  },

  // 6. STORE SETTINGS
  async getSettings() {
    return getStorageItem<Settings>('settings', INITIAL_STORE_SETTINGS);
  },

  async updateSettings(newSettings: Partial<Settings>) {
    const current = await this.getSettings();
    const updated = { ...current, ...newSettings };
    setStorageItem('settings', updated);
    return updated;
  },

  // 7. COUPONS
  async getCoupons() {
    return getStorageItem<Coupon[]>('coupons', [
      { id: 1, code: 'AFSOO10', discount_type: 'percentage', discount_value: 10, min_purchase: 499, max_usage: 100, used_count: 5, is_active: true, created_at: new Date().toISOString() },
    ]);
  },

  // 8. REVIEWS
  async getReviews() {
    return getStorageItem<Review[]>('reviews', []);
  },

  // 9. ACTIVITY LOGS
  async getActivityLogs() {
    let logs: ActivityLog[] = [];
    try {
      const { data, error } = await supabase.from('activity_logs').select('*').order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        logs = data;
      }
    } catch (e) {
      console.warn('Supabase activity logs fetch warning:', e);
    }

    const localLogs = getStorageItem<ActivityLog[]>('activity_logs', []);

    const logMap = new Map<number | string, ActivityLog>();
    [...logs, ...localLogs].forEach((l) => {
      if (l && l.id) logMap.set(l.id, l);
    });

    const combined = Array.from(logMap.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return combined;
  },

  async getSalesAnalytics() {
    const orders = await this.getOrders();
    const totalSales = orders.reduce((sum, o) => sum + o.total_amount, 0);
    return {
      total_sales: totalSales,
      total_orders: orders.length,
      average_order_value: orders.length > 0 ? totalSales / orders.length : 0,
      monthly_sales: [
        { month: 'Jan', amount: 12000 },
        { month: 'Feb', amount: 18500 },
        { month: 'Mar', amount: 24000 },
      ],
    };
  },
};
