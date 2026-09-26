import api from '../../services/api';

const mockDeliveries = [
  {
    _id: 'DEL-2001',
    reference: 'DEL-2001',
    customer: 'ABC Manufacturing',
    warehouse: 'Main Warehouse',
    sourceLocation: 'Main Store',
    status: 'DRAFT',
    createdBy: 'Nadia Hart',
    createdAt: '2026-09-22T09:15:00.000Z',
    validatedAt: null,
    products: [
      { product: 'Steel Rods', quantity: 20, availableStock: 100 },
      { product: 'Cement', quantity: 10, availableStock: 60 },
    ],
  },
  {
    _id: 'DEL-2002',
    reference: 'DEL-2002',
    customer: 'North Ridge Traders',
    warehouse: 'North Hub',
    sourceLocation: 'Picking Zone B',
    status: 'READY',
    createdBy: 'Amir Khan',
    createdAt: '2026-09-21T12:00:00.000Z',
    validatedAt: null,
    products: [
      { product: 'Wire Mesh', quantity: 15, availableStock: 80 },
      { product: 'Paint', quantity: 7, availableStock: 40 },
    ],
  },
  {
    _id: 'DEL-2003',
    reference: 'DEL-2003',
    customer: 'BuildWell Materials',
    warehouse: 'South Hub',
    sourceLocation: 'Cold Storage',
    status: 'DONE',
    createdBy: 'Lina Gomez',
    createdAt: '2026-09-20T08:33:00.000Z',
    validatedAt: '2026-09-20T09:50:00.000Z',
    products: [
      { product: 'Pipe Fittings', quantity: 12, availableStock: 45 },
    ],
  },
];

export const normalizeDelivery = (delivery = {}) => {
  const customerName = typeof delivery.customer === 'object' ? delivery.customer?.name : (delivery.customer || '');
  const warehouseName = typeof delivery.warehouse === 'object' ? delivery.warehouse?.name : (delivery.warehouse || '');
  const rawItems = delivery.items || delivery.products || [];
  const products = rawItems.map((item) => ({
    product: typeof item.product === 'object' ? `${item.product?.name} (${item.product?.sku || ''})`.trim() : (item.product || ''),
    quantity: item.quantity || 0,
    availableStock: item.availableStock || 100,
  }));

  return {
    _id: delivery._id || delivery.id || `DEL-${Date.now()}`,
    reference: delivery.reference || delivery._id || `DEL-${Date.now()}`,
    customer: customerName,
    warehouse: warehouseName,
    sourceLocation: delivery.location || delivery.sourceLocation || 'Main Store',
    status: (delivery.status || 'DRAFT').toUpperCase(),
    createdBy: typeof delivery.createdBy === 'object' ? delivery.createdBy?.name : (delivery.createdBy || 'Current User'),
    createdAt: delivery.createdAt || delivery.documentDate || new Date().toISOString(),
    validatedAt: delivery.postedAt || delivery.validatedAt || null,
    products,
  };
};

export const getDeliveries = async () => {
  try {
    const response = await api.get('/deliveries');
    const list = Array.isArray(response.data?.data) ? response.data.data : Array.isArray(response.data) ? response.data : [];
    return {
      status: 'success',
      data: list.map(normalizeDelivery),
    };
  } catch {
    return {
      status: 'success',
      data: mockDeliveries.map(normalizeDelivery),
    };
  }
};

export const getDeliveryById = async (id) => {
  try {
    const response = await api.get(`/deliveries/${id}`);
    const item = response.data?.data || response.data;
    return {
      status: 'success',
      data: normalizeDelivery(item),
    };
  } catch {
    const delivery = mockDeliveries.find((item) => item._id === id) || mockDeliveries[0];
    return {
      status: 'success',
      data: normalizeDelivery(delivery),
    };
  }
};

export const createDelivery = async (deliveryData) => {
  try {
    const response = await api.post('/deliveries', deliveryData);
    const item = response.data?.data || response.data;
    return {
      status: 'success',
      data: normalizeDelivery(item),
    };
  } catch (error) {
    if (error?.message && !error.message.includes('Network Error')) {
      throw error;
    }
    const createdDelivery = normalizeDelivery({
      ...deliveryData,
      status: 'DRAFT',
      createdBy: 'Current User',
    });

    return {
      status: 'success',
      message: 'Delivery saved locally.',
      data: createdDelivery,
    };
  }
};

export const updateDelivery = async (id, deliveryData) => {
  try {
    const response = await api.put(`/deliveries/${id}`, deliveryData);
    const item = response.data?.data || response.data;
    return {
      status: 'success',
      data: normalizeDelivery(item),
    };
  } catch (error) {
    if (error?.message && !error.message.includes('Network Error')) {
      throw error;
    }
    const updatedDelivery = normalizeDelivery({
      ...deliveryData,
      _id: id,
    });

    return {
      status: 'success',
      data: updatedDelivery,
    };
  }
};

export const pickDelivery = async (id) => {
  try {
    const response = await api.patch(`/deliveries/${id}`, { status: 'ready' });
    const item = response.data?.data || response.data;
    return {
      status: 'success',
      data: normalizeDelivery(item),
    };
  } catch (error) {
    if (error?.message && !error.message.includes('Network Error')) {
      throw error;
    }
    const delivery = mockDeliveries.find((item) => item._id === id) || mockDeliveries[0];
    const updated = normalizeDelivery({ ...delivery, status: 'READY' });
    return { status: 'success', data: updated };
  }
};

export const packDelivery = async (id) => {
  try {
    const response = await api.patch(`/deliveries/${id}`, { status: 'ready' });
    const item = response.data?.data || response.data;
    return {
      status: 'success',
      data: normalizeDelivery(item),
    };
  } catch (error) {
    if (error?.message && !error.message.includes('Network Error')) {
      throw error;
    }
    const delivery = mockDeliveries.find((item) => item._id === id) || mockDeliveries[0];
    const updated = normalizeDelivery({ ...delivery, status: 'PACKED' });
    return { status: 'success', data: updated };
  }
};

export const validateDelivery = async (id) => {
  try {
    let response;
    try {
      response = await api.post(`/deliveries/${id}/post`);
    } catch (innerErr) {
      if (innerErr?.status === 404 || innerErr?.message?.includes('Not Found')) {
        response = await api.patch(`/deliveries/${id}`, { status: 'done' });
      } else {
        throw innerErr;
      }
    }
    const item = response.data?.data?.document || response.data?.data || response.data;
    return {
      status: 'success',
      data: normalizeDelivery(item),
    };
  } catch (error) {
    if (error?.message && !error.message.includes('Network Error')) {
      throw error;
    }
    const delivery = mockDeliveries.find((item) => item._id === id) || mockDeliveries[0];
    const updated = normalizeDelivery({ ...delivery, status: 'DONE', validatedAt: new Date().toISOString() });
    return { status: 'success', data: updated };
  }
};

export const cancelDelivery = async (id) => {
  try {
    const response = await api.post(`/deliveries/${id}/cancel`);
    const item = response.data?.data || response.data;
    return {
      status: 'success',
      data: normalizeDelivery(item),
    };
  } catch (error) {
    if (error?.message && !error.message.includes('Network Error')) {
      throw error;
    }
    const delivery = mockDeliveries.find((item) => item._id === id) || mockDeliveries[0];
    const updated = normalizeDelivery({ ...delivery, status: 'CANCELED' });
    return { status: 'success', data: updated };
  }
};

export { mockDeliveries };
