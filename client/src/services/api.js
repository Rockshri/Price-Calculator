import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL });

export const getCategories       = ()         => api.get('/categories').then(r => r.data);
export const getCategoryRules    = ()         => api.get('/categories/pricing-rules').then(r => r.data);
export const updateCategoryRule  = (id, data) => api.put(`/categories/pricing-rules/${id}`, data).then(r => r.data);

export const getProducts    = ()         => api.get('/products').then(r => r.data);
export const getProduct     = (id)       => api.get(`/products/${id}`).then(r => r.data);
export const createProduct  = (data)     => api.post('/products', data).then(r => r.data);
export const updateProduct  = (id, data) => api.put(`/products/${id}`, data).then(r => r.data);
export const deleteProduct  = (id)       => api.delete(`/products/${id}`).then(r => r.data);

export const calcSingle    = (payload) => api.post('/calculator/single', payload).then(r => r.data);
export const calcScenarios = (payload) => api.post('/calculator/scenarios', payload).then(r => r.data);
export const calcBatch     = ()         => api.post('/calculator/batch').then(r => r.data);

export const getResults        = ()   => api.get('/results').then(r => r.data);
export const getResultByProduct = (id) => api.get(`/results/${id}`).then(r => r.data);
export const clearResults      = ()   => api.delete('/results').then(r => r.data);

export const getSettings    = ()         => api.get('/settings').then(r => r.data);
export const updateSetting  = (key, val) => api.put(`/settings/${key}`, { value: val }).then(r => r.data);

export const getReferralFee = (category, price) =>
  api.get('/fees/referral', { params: { category, price } }).then(r => r.data);
export const getClosingFee  = (price, type)     =>
  api.get('/fees/closing',  { params: { price, type } }).then(r => r.data);
export const getShippingFee = (weight)           =>
  api.get('/fees/shipping', { params: { weight } }).then(r => r.data);
