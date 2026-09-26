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
  {
    _id: 'DEL-2004',
    reference: 'DEL-2004',
    customer: 'Harbor Logistics',
    warehouse: 'Main Warehouse',
    sourceLocation: 'Dock 2',
    status: 'CANCELED',
    createdBy: 'Samir Ali',
    createdAt: '2026-09-19T15:10:00.000Z',
    validatedAt: null,
    products: [{ product: 'Sandbags', quantity: 6, availableStock: 32 }],
  },
];

const normalizeDelivery = (delivery = {}) => ({
  _id: delivery._id || delivery.id || `DEL-${Date.now()}`,
  reference: delivery.reference || delivery._id || `DEL-${Date.now()}`,
  customer: delivery.customer || '',
  warehouse: delivery.warehouse || '',
  sourceLocation: delivery.sourceLocation || '',
  status: delivery.status || 'DRAFT',
  createdBy: delivery.createdBy || 'Current User',
  createdAt: delivery.createdAt || new Date().toISOString(),
  validatedAt: delivery.validatedAt || null,
  products: Array.isArray(delivery.products)
    ? delivery.products.map((item) => ({
        product: item.product || '',
        quantity: Number(item.quantity) || 0,
        availableStock: Number(item.availableStock) || 0,
      }))
    : [],
});

const createLocalDelivery = (deliveryData) => {
  const currentDate = new Date().toISOString();
  const newDelivery = {
    _id: deliveryData._id || `DEL-${Date.now()}`,
    reference: deliveryData.reference || `DEL-${Date.now()}`,
    customer: deliveryData.customer,
    warehouse: deliveryData.warehouse,
    sourceLocation: deliveryData.sourceLocation,
    status: deliveryData.status || 'DRAFT',
    createdBy: deliveryData.createdBy || 'Current User',
    createdAt: deliveryData.createdAt || currentDate,
    validatedAt: deliveryData.validatedAt || null,
    products: (deliveryData.products || []).map((product) => ({
      product: product.product,
      quantity: Number(product.quantity) || 0,
      availableStock: Number(product.availableStock) || 0,
    })),
  };

  return normalizeDelivery(newDelivery);
};

export const getDeliveries = async () => {
  try {
    const response = await api.get('/deliveries');
    return response.data;
  } catch {
    return {
      status: 'success',
      message: 'Using local delivery data until the backend endpoint is available.',
      data: mockDeliveries,
    };
  }
};

export const getDeliveryById = async (id) => {
  try {
    const response = await api.get(`/deliveries/${id}`);
    return response.data;
  } catch {
    const delivery = mockDeliveries.find((item) => item._id === id) || mockDeliveries[0];
    return {
      status: 'success',
      message: 'Loaded delivery from local demo data.',
      data: delivery,
    };
  }
};

export const createDelivery = async (deliveryData) => {
  try {
    const response = await api.post('/deliveries', deliveryData);
    return response.data;
  } catch {
    const createdDelivery = createLocalDelivery({
      ...deliveryData,
      status: 'DRAFT',
      createdBy: 'Current User',
    });

    return {
      status: 'success',
      message: 'Delivery saved locally in the frontend demo state.',
      data: createdDelivery,
    };
  }
};

export const updateDelivery = async (id, deliveryData) => {
  try {
    const response = await api.put(`/deliveries/${id}`, deliveryData);
    return response.data;
  } catch {
    const updatedDelivery = normalizeDelivery({
      ...deliveryData,
      _id: id,
      reference: deliveryData.reference || id,
      createdAt: deliveryData.createdAt || new Date().toISOString(),
    });

    return {
      status: 'success',
      message: 'Delivery updated locally in the frontend demo state.',
      data: updatedDelivery,
    };
  }
};

export const pickDelivery = async (id) => {
  try {
    const response = await api.patch(`/deliveries/${id}/pick`);
    return response.data;
  } catch {
    const delivery = mockDeliveries.find((item) => item._id === id) || mockDeliveries[0];
    const updated = normalizeDelivery({
      ...delivery,
      status: 'PICKED',
    });

    return {
      status: 'success',
      message: 'Delivery marked as picked locally in the frontend demo state.',
      data: updated,
    };
  }
};

export const packDelivery = async (id) => {
  try {
    const response = await api.patch(`/deliveries/${id}/pack`);
    return response.data;
  } catch {
    const delivery = mockDeliveries.find((item) => item._id === id) || mockDeliveries[0];
    const updated = normalizeDelivery({
      ...delivery,
      status: 'PACKED',
    });

    return {
      status: 'success',
      message: 'Delivery marked as packed locally in the frontend demo state.',
      data: updated,
    };
  }
};

export const validateDelivery = async (id) => {
  try {
    const response = await api.patch(`/deliveries/${id}/validate`);
    return response.data;
  } catch {
    const delivery = mockDeliveries.find((item) => item._id === id) || mockDeliveries[0];
    const updated = normalizeDelivery({
      ...delivery,
      status: 'DONE',
      validatedAt: new Date().toISOString(),
    });

    return {
      status: 'success',
      message: 'Delivery validated locally in the frontend demo state.',
      data: updated,
    };
  }
};

export const cancelDelivery = async (id) => {
  try {
    const response = await api.patch(`/deliveries/${id}/cancel`);
    return response.data;
  } catch {
    const delivery = mockDeliveries.find((item) => item._id === id) || mockDeliveries[0];
    const updated = normalizeDelivery({
      ...delivery,
      status: 'CANCELED',
      validatedAt: delivery.validatedAt || null,
    });

    return {
      status: 'success',
      message: 'Delivery canceled locally in the frontend demo state.',
      data: updated,
    };
  }
};

export { mockDeliveries };
