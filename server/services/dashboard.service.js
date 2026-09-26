import Product from '../models/product.model.js';
import Receipt from '../models/receipt.model.js';
import Delivery from '../models/delivery.model.js';
import Transfer from '../models/transfer.model.js';
import Warehouse from '../models/warehouse.model.js';
import StockLedger from '../models/stockLedger.model.js';

export const getDashboardSummaryData = async () => {
  const [
    totalProducts,
    allProducts,
    pendingReceiptsDocs,
    pendingDeliveriesDocs,
    scheduledTransfersDocs,
    recentMovementsDocs,
    warehouses
  ] = await Promise.all([
    Product.countDocuments({}),
    Product.find({}).lean(),
    Receipt.find({ status: { $ne: 'done' } })
      .populate('warehouse', 'name code')
      .populate('items.product', 'name sku')
      .sort({ documentDate: -1 })
      .lean(),
    Delivery.find({ status: { $ne: 'done' } })
      .populate('warehouse', 'name code')
      .populate('items.product', 'name sku')
      .sort({ documentDate: -1 })
      .lean(),
    Transfer.find({ status: { $ne: 'done' } })
      .populate('from.warehouse', 'name code')
      .populate('to.warehouse', 'name code')
      .populate('items.product', 'name sku')
      .sort({ documentDate: -1 })
      .lean(),
    StockLedger.find({})
      .sort({ occurredAt: -1, _id: -1 })
      .limit(10)
      .populate('product', 'name sku unit')
      .populate('warehouse', 'name code')
      .populate('performedBy', 'name role')
      .lean(),
    Warehouse.find({}).select('name code locations').lean()
  ]);

  const lowStockProducts = allProducts
    .filter((p) => Number(p.quantity) <= Number(p.reorderLevel))
    .map((p) => ({
      _id: p._id,
      name: p.name,
      sku: p.sku,
      category: p.category,
      warehouse: p.location || 'Main Warehouse',
      location: p.location || 'Main Store',
      currentStock: p.quantity,
      reorderLevel: p.reorderLevel
    }));

  const categories = [...new Set(allProducts.map((p) => p.category).filter(Boolean))];
  const warehouseNames = warehouses.map((w) => w.name);

  return {
    summary: {
      totalProducts,
      lowStockCount: lowStockProducts.length,
      pendingReceipts: pendingReceiptsDocs.length,
      pendingDeliveries: pendingDeliveriesDocs.length,
      scheduledTransfers: scheduledTransfersDocs.length
    },
    lowStockProducts,
    pendingReceipts: pendingReceiptsDocs.map((r) => ({
      _id: r._id,
      reference: r.reference,
      supplier: typeof r.supplier === 'object' ? r.supplier?.name : r.supplier || 'N/A',
      warehouse: r.warehouse?.name || 'Main Warehouse',
      items: r.items || [],
      status: r.status,
      createdAt: r.createdAt || r.documentDate
    })),
    pendingDeliveries: pendingDeliveriesDocs.map((d) => ({
      _id: d._id,
      reference: d.reference,
      customer: typeof d.customer === 'object' ? d.customer?.name : d.customer || 'N/A',
      warehouse: d.warehouse?.name || 'Main Warehouse',
      items: d.items || [],
      status: d.status,
      createdAt: d.createdAt || d.documentDate
    })),
    scheduledTransfers: scheduledTransfersDocs.map((t) => ({
      _id: t._id,
      reference: t.reference,
      fromWarehouse: t.from?.warehouse?.name || 'Main Warehouse',
      toWarehouse: t.to?.warehouse?.name || 'Destination Warehouse',
      items: (t.items || []).map((i) => i.product?.name).filter(Boolean).join(', ') || `${t.items?.length || 0} items`,
      status: t.status,
      createdAt: t.createdAt || t.documentDate
    })),
    recentMovements: recentMovementsDocs.map((m) => ({
      _id: m._id,
      reference: m.operationRef,
      movementType: m.operationType,
      product: m.product ? `${m.product.name} (${m.product.sku})` : 'Unknown Product',
      quantity: m.quantity,
      fromLocation: m.quantity < 0 ? m.location : 'Supplier/External',
      toLocation: m.quantity > 0 ? m.location : 'Customer/External',
      date: m.occurredAt
    })),
    filters: {
      categories,
      warehouses: warehouseNames
    }
  };
};

export const getLowStockProductsService = async () => {
  const products = await Product.find({}).lean();
  return products
    .filter((p) => Number(p.quantity) <= Number(p.reorderLevel))
    .map((p) => ({
      _id: p._id,
      name: p.name,
      sku: p.sku,
      category: p.category,
      warehouse: p.location || 'Main Warehouse',
      location: p.location || 'Main Store',
      currentStock: p.quantity,
      reorderLevel: p.reorderLevel
    }));
};

export const getPendingReceiptsService = async () => {
  const receipts = await Receipt.find({ status: { $ne: 'done' } })
    .populate('warehouse', 'name code')
    .populate('items.product', 'name sku')
    .sort({ documentDate: -1 })
    .lean();

  return receipts.map((r) => ({
    _id: r._id,
    reference: r.reference,
    supplier: typeof r.supplier === 'object' ? r.supplier?.name : r.supplier || 'N/A',
    warehouse: r.warehouse?.name || 'Main Warehouse',
    items: r.items || [],
    status: r.status,
    createdAt: r.createdAt || r.documentDate
  }));
};

export const getPendingDeliveriesService = async () => {
  const deliveries = await Delivery.find({ status: { $ne: 'done' } })
    .populate('warehouse', 'name code')
    .populate('items.product', 'name sku')
    .sort({ documentDate: -1 })
    .lean();

  return deliveries.map((d) => ({
    _id: d._id,
    reference: d.reference,
    customer: typeof d.customer === 'object' ? d.customer?.name : d.customer || 'N/A',
    warehouse: d.warehouse?.name || 'Main Warehouse',
    items: d.items || [],
    status: d.status,
    createdAt: d.createdAt || d.documentDate
  }));
};

export const getScheduledTransfersService = async () => {
  const transfers = await Transfer.find({ status: { $ne: 'done' } })
    .populate('from.warehouse', 'name code')
    .populate('to.warehouse', 'name code')
    .populate('items.product', 'name sku')
    .sort({ documentDate: -1 })
    .lean();

  return transfers.map((t) => ({
    _id: t._id,
    reference: t.reference,
    fromWarehouse: t.from?.warehouse?.name || 'Main Warehouse',
    toWarehouse: t.to?.warehouse?.name || 'Destination Warehouse',
    items: (t.items || []).map((i) => i.product?.name).filter(Boolean).join(', ') || `${t.items?.length || 0} items`,
    status: t.status,
    createdAt: t.createdAt || t.documentDate
  }));
};

export const getRecentMovementsService = async () => {
  const movements = await StockLedger.find({})
    .sort({ occurredAt: -1, _id: -1 })
    .limit(10)
    .populate('product', 'name sku unit')
    .populate('warehouse', 'name code')
    .populate('performedBy', 'name role')
    .lean();

  return movements.map((m) => ({
    _id: m._id,
    reference: m.operationRef,
    movementType: m.operationType,
    product: m.product ? `${m.product.name} (${m.product.sku})` : 'Unknown Product',
    quantity: m.quantity,
    fromLocation: m.quantity < 0 ? m.location : 'Supplier/External',
    toLocation: m.quantity > 0 ? m.location : 'Customer/External',
    date: m.occurredAt
  }));
};
