import axios, { AxiosInstance } from 'axios';
import { encode } from 'base-64';
import { StoreConfig, WooProduct, WooVariation, WooOrder, WooCustomer, DashboardStats } from '../types';

export class WooCommerceService {
  private client: AxiosInstance;
  private store: StoreConfig;

  constructor(store: StoreConfig) {
    this.store = store;
    
    // Normalize URL
    let baseUrl = store.url.trim();
    if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
      baseUrl = 'https://' + baseUrl;
    }
    baseUrl = baseUrl.replace(/\/+$/, '');

    const authHeader = 'Basic ' + encode(store.consumerKey.trim() + ':' + store.consumerSecret.trim());

    this.client = axios.create({
      baseURL: baseUrl + '/wp-json/wc/v3',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    });
  }

  // تست صحت اتصال به فروشگاه
  async testConnection(): Promise<{ success: boolean; message: string; systemStatus?: any }> {
    try {
      const response = await this.client.get('/system_status');
      return { success: true, message: 'اتصال با موفقیت برقرار شد', systemStatus: response.data };
    } catch (error: any) {
      console.error('WooCommerce connection error:', error?.response?.data || error.message);
      let errorMsg = 'خطا در اتصال به فروشگاه. لطفاً آدرس سایت و کلیدها را بررسی کنید.';
      if (error?.response?.data?.message) {
        errorMsg = error.response.data.message;
      }
      return { success: false, message: errorMsg };
    }
  }

  // آمار داشبورد
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const [salesRes, ordersProcessingRes, ordersPendingRes, lowStockRes] = await Promise.all([
        this.client.get('/reports/sales', { params: { period: 'month' } }),
        this.client.get('/orders', { params: { status: 'processing', per_page: 1 } }),
        this.client.get('/orders', { params: { status: 'pending', per_page: 1 } }),
        this.client.get('/products', { params: { stock_status: 'outofstock', per_page: 1 } }),
      ]);

      const salesData = salesRes.data?.[0] || {};
      const processingTotal = parseInt(ordersProcessingRes.headers['x-wp-total'] || '0', 10);
      const pendingTotal = parseInt(ordersPendingRes.headers['x-wp-total'] || '0', 10);
      const lowStockTotal = parseInt(lowStockRes.headers['x-wp-total'] || '0', 10);

      return {
        totalSales: salesData.total_sales || '0',
        netSales: salesData.net_sales || '0',
        ordersCount: salesData.total_orders || 0,
        itemsSold: salesData.total_items || 0,
        pendingOrdersCount: pendingTotal,
        processingOrdersCount: processingTotal,
        lowStockCount: lowStockTotal,
        currencySymbol: this.store.currencySymbol || 'تومان',
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return {
        totalSales: '0',
        netSales: '0',
        ordersCount: 0,
        itemsSold: 0,
        pendingOrdersCount: 0,
        processingOrdersCount: 0,
        lowStockCount: 0,
        currencySymbol: this.store.currencySymbol || 'تومان',
      };
    }
  }

  // سفارشات
  async getOrders(params?: { status?: string; search?: string; page?: number; per_page?: number }): Promise<WooOrder[]> {
    const response = await this.client.get('/orders', {
      params: {
        page: params?.page || 1,
        per_page: params?.per_page || 20,
        status: params?.status === 'all' ? undefined : params?.status,
        search: params?.search,
      },
    });
    return response.data;
  }

  async getOrder(id: number): Promise<WooOrder> {
    const response = await this.client.get('/orders/' + id);
    return response.data;
  }

  async updateOrderStatus(id: number, status: string): Promise<WooOrder> {
    const response = await this.client.put('/orders/' + id, { status });
    return response.data;
  }

  async addOrderNote(id: number, note: string, isCustomerNote: boolean = false): Promise<any> {
    const response = await this.client.post('/orders/' + id + '/notes', {
      note,
      customer_note: isCustomerNote,
    });
    return response.data;
  }

  // دسته‌بندی‌ها
  async getCategories(): Promise<{ id: number; name: string; count: number }[]> {
    const response = await this.client.get('/products/categories', {
      params: { per_page: 50, hide_empty: true },
    });
    return response.data;
  }

  // محصولات
  async getProducts(params?: {
    search?: string;
    category?: number | string;
    page?: number;
    per_page?: number;
    stock_status?: string;
    status?: string;
    orderby?: string;
    order?: 'asc' | 'desc';
    on_sale?: boolean;
    type?: string;
  }): Promise<WooProduct[]> {
    const response = await this.client.get('/products', {
      params: {
        page: params?.page || 1,
        per_page: params?.per_page || 20,
        search: params?.search,
        category: params?.category === 'all' || !params?.category ? undefined : params.category,
        stock_status: params?.stock_status === 'all' || !params?.stock_status ? undefined : params.stock_status,
        status: params?.status,
        orderby: params?.orderby || 'date',
        order: params?.order || 'desc',
        on_sale: params?.on_sale,
        type: params?.type === 'all' || !params?.type ? undefined : params.type,
      },
    });
    return response.data;
  }

  async updateProductPriceAndStock(id: number, data: { regular_price?: string; sale_price?: string; stock_quantity?: number | null; stock_status?: string }): Promise<WooProduct> {
    const response = await this.client.put('/products/' + id, data);
    return response.data;
  }

  async getProductVariations(productId: number): Promise<WooVariation[]> {
    const response = await this.client.get('/products/' + productId + '/variations', {
      params: { per_page: 50 },
    });
    return response.data;
  }

  async updateProductVariation(productId: number, variationId: number, data: { regular_price?: string; sale_price?: string; stock_quantity?: number | null; stock_status?: string }): Promise<WooVariation> {
    const response = await this.client.put('/products/' + productId + '/variations/' + variationId, data);
    return response.data;
  }

  async createProduct(data: any): Promise<WooProduct> {
    const response = await this.client.post('/products', data);
    return response.data;
  }

  // مشتریان
  async getCustomers(params?: { search?: string; page?: number; per_page?: number }): Promise<WooCustomer[]> {
    const response = await this.client.get('/customers', {
      params: {
        page: params?.page || 1,
        per_page: params?.per_page || 20,
        search: params?.search,
      },
    });
    return response.data;
  }
}