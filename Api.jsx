import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// ── Request interceptor: attach access token ──
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}, Promise.reject);

// ── Response interceptor: auto refresh on 401 ──
let isRefreshing = false;
let failedQueue  = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    error ? prom.reject(error) : prom.resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && error.response?.data?.code === 'TOKEN_EXPIRED' && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        });
      }

      original._retry = true;
      isRefreshing    = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
        localStorage.setItem('accessToken', data.accessToken);
        processQueue(null, data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);

      } catch (err) {
        processQueue(err, null);
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ── Auth API ──
export const authAPI = {
  register:       (data)  => api.post('/auth/register', data),
  login:          (data)  => api.post('/auth/login', data),
  logout:         ()      => api.post('/auth/logout'),
  getMe:          ()      => api.get('/auth/me'),
  changePassword: (data)  => api.put('/auth/change-password', data),
};

// ── Products API ──
export const productAPI = {
  getAll:       (params) => api.get('/products', { params }),
  getById:      (id)     => api.get(`/products/${id}`),
  getCategories:()       => api.get('/products/categories'),
  create:       (data)   => api.post('/products', data),
  update:       (id, d)  => api.put(`/products/${id}`, d),
  delete:       (id)     => api.delete(`/products/${id}`),
  addReview:    (id, d)  => api.post(`/products/${id}/reviews`, d),
};

// ── Orders API ──
export const orderAPI = {
  getMyOrders: (params) => api.get('/orders/my', { params }),
  getById:     (id)     => api.get(`/orders/${id}`),
  cancel:      (id, d)  => api.put(`/orders/${id}/cancel`, d),
};

// ── Payment API ──
export const paymentAPI = {
  createOrder:   (data) => api.post('/payments/create-order', data),
  verifyPayment: (data) => api.post('/payments/verify', data),
};

// ── User API ──
export const userAPI = {
  updateProfile:  (data) => api.put('/users/profile', data),
  addAddress:     (data) => api.post('/users/addresses', data),
  deleteAddress:  (id)   => api.delete(`/users/addresses/${id}`),
  toggleWishlist: (pid)  => api.put(`/users/wishlist/${pid}`),
};

// ── Admin API ──
export const adminAPI = {
  getDashboard:       ()        => api.get('/admin/dashboard'),
  getAllOrders:        (params)  => api.get('/admin/orders', { params }),
  updateOrderStatus:  (id, d)   => api.put(`/admin/orders/${id}/status`, d),
  getAllUsers:         (params)  => api.get('/admin/users', { params }),
  updateUser:         (id, d)   => api.put(`/admin/users/${id}`, d),
};

export default api;