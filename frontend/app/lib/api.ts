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
  forgotPasswordEmail: (email: string) => api.post('/api/auth/forgot-password/email', { email }),
  forgotPasswordPhone: (phone: string) => api.post('/api/auth/forgot-password/phone', { phone }),
  resetPassword: (target: string, code: string, newPassword: string) =>
    api.post('/api/auth/reset-password', { target, code, newPassword }),
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
  getVariants: (id: number) => api.get(`/api/products/${id}/variants`),
  addVariant: (id: number, data: any) => api.post(`/api/products/${id}/variants`, data),
  updateVariant: (id: number, variantId: number, data: any) => api.put(`/api/products/${id}/variants/${variantId}`, data),
  deleteVariant: (id: number, variantId: number) => api.delete(`/api/products/${id}/variants/${variantId}`),
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

// Wishlist API
export const wishlistAPI = {
  get: () => api.get('/api/wishlist'),
  add: (productId: number) => api.post('/api/wishlist', { productId }),
  remove: (productId: number) => api.delete(`/api/wishlist/${productId}`),
};

// Returns API
export const returnsAPI = {
  create: (orderId: number, reason: string) => api.post('/api/returns', { orderId, reason }),
  myReturns: () => api.get('/api/returns/my'),
  allReturns: () => api.get('/api/returns/admin/all'),
  updateStatus: (id: number, status: string, adminNote?: string) =>
    api.put(`/api/returns/${id}/status`, { status, adminNote }),
};
// Coupons API
export const couponsAPI = {
  validate: (code: string, orderTotal: number) =>
    api.post('/api/coupons/validate', { code, orderTotal }),
  adminGetAll: () => api.get('/api/coupons/admin/all'),
  adminCreate: (data: any) => api.post('/api/coupons/admin', data),
  adminUpdate: (id: number, data: any) => api.put(`/api/coupons/admin/${id}`, data),
  adminDelete: (id: number) => api.delete(`/api/coupons/admin/${id}`),
};

//Reviews API
export const reviewsAPI = {
  getByProduct: (productId: number) => api.get(`/api/reviews/${productId}`),
  create: (data: { productId: number; rating: number; comment?: string }) =>
    api.post('/api/reviews', data),
  delete: (id: number) => api.delete(`/api/reviews/${id}`),
};

// Flash Sale API
export const flashSaleAPI = {
  getActive: () => api.get('/api/flash-sale/active'),
  adminGetAll: () => api.get('/api/flash-sale/admin/all'),
  adminCreate: (data: any) => api.post('/api/flash-sale/admin', data),
  adminAddItem: (id: number, data: any) => api.post(`/api/flash-sale/admin/${id}/items`, data),
  adminRemoveItem: (itemId: number) => api.delete(`/api/flash-sale/admin/items/${itemId}`),
  adminUpdate: (id: number, data: any) => api.put(`/api/flash-sale/admin/${id}`, data),
  adminDelete: (id: number) => api.delete(`/api/flash-sale/admin/${id}`),
};

export default api;