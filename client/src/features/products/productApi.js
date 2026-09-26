import api from '../../services/api';

export const fetchProductsApi = async (params = {}) => {
  const response = await api.get('/products', { params });
  return response.data;
};

/**
 * Distinct categories, locations, units and stock counts, so the filter controls
 * are built from real catalog values instead of whatever page happened to load.
 */
export const fetchProductFilterOptionsApi = async () => {
  const response = await api.get('/products/filter-options');
  return response.data;
};

export const fetchProductByIdApi = async (id) => {
  const response = await api.get(`/products/${id}`);
  return response.data;
};

export const createProductApi = async (productData) => {
  const response = await api.post('/products', productData);
  return response.data;
};

export const updateProductApi = async (id, productData) => {
  const response = await api.put(`/products/${id}`, productData);
  return response.data;
};

export const deleteProductApi = async (id) => {
  const response = await api.delete(`/products/${id}`);
  return response.data;
};
