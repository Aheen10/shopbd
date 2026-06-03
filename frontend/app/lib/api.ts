import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('shopbd_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Auth API
export const authAPI = {
  register: (data: { name: string; email?: string; phone?: string; password: string }) =>
    api.post('/api/auth/register', data),
  login: (data: { emailOrPhone: string; password: string }) =>
    api.post('/api/auth/login', data),
  profile: () => api.get('/api/auth/profile'),
  updateProfile: (data: { name: string; phone?: string }) =>
    api.put('/api/auth/profile', data),
};

// Products API
export const productsAPI = {
  getAll: (params?: { search?: string; category?: string; page?: number; minPrice?: string; maxPrice?: string; limit?: number }) =>
  api.get('/api/products', { params }),
  getOne: (id: number) => api.get(`/api/products/${id}`),
  create: (data: FormData) =>
    api.post('/api/products', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  update: (id: number, data: any) =>
    api.put(`/api/products/${id}`, data, {
      headers: data instanceof FormData
        ? { 'Content-Type': 'multipart/form-data' }
        : { 'Content-Type': 'application/json' },
    }),
  delete: (id: number) => api.delete(`/api/products/${id}`),
};

// Cart API
export const cartAPI = {
  get: () => api.get('/api/cart'),
  add: (productId: number, quantity: number) =>
    api.post('/api/cart/add', { productId, quantity }),
  remove: (productId: number) => api.delete(`/api/cart/remove/${productId}`),
  clear: () => api.delete('/api/cart/clear'),
};

// Orders API
export const ordersAPI = {
  place: (items: { productId: number; quantity: number }[], phone?: string, address?: any) =>
    api.post('/api/orders', { items, phone, address }),
  myOrders: () => api.get('/api/orders/my'),
  allOrders: () => api.get('/api/orders/admin/all'),
  updateStatus: (id: number, status: string) =>
    api.put(`/api/orders/${id}/status`, { status }),
};

// Settings API
export const settingsAPI = {
  get: () => api.get('/api/settings'),
  update: (data: any) => api.put('/api/settings', data),
  uploadBannerImage: (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/api/settings/banner-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
// Payment API
export const paymentAPI = {
  bkash: (data: { orderId: number; phone: string; amount: number }) =>
    api.post('/api/payment/bkash', data),
  nagad: (data: { orderId: number; phone: string; amount: number }) =>
    api.post('/api/payment/nagad', data),
  cod: (orderId: number) => api.post('/api/payment/cod', { orderId }),
};

export default api;