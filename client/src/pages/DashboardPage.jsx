import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Boxes, Clock3 } from 'lucide-react';
import KpiCards from '../features/dashboard/KpiCards';
import DashboardFilters from '../features/dashboard/DashboardFilters';
import LowStockList from '../features/dashboard/LowStockList';
import PendingOperations from '../features/dashboard/PendingOperations';
import RecentMovements from '../features/dashboard/RecentMovements';
import { getDashboardSummary, getLowStockProducts, getPendingReceipts, getPendingDeliveries, getScheduledTransfers, getRecentMovements } from '../features/dashboard/dashboardApi';
import MainLayout from '../layouts/MainLayout';

const defaultFilters = {
  documentType: 'All',
  status: 'All',
  location: 'All',
  category: 'All',
};

const DashboardPage = () => {
  const [summary, setSummary] = useState({
    totalProducts: 0,
    lowStockCount: 0,
    pendingReceipts: 0,
    pendingDeliveries: 0,
    scheduledTransfers: 0,
  });
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [pendingReceipts, setPendingReceipts] = useState([]);
  const [pendingDeliveries, setPendingDeliveries] = useState([]);
  const [scheduledTransfers, setScheduledTransfers] = useState([]);
  const [recentMovements, setRecentMovements] = useState([]);
  const [filters, setFilters] = useState(defaultFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterOptions, setFilterOptions] = useState({ warehouses: [], categories: [] });

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const [summaryRes, lowStockRes, pendingReceiptsRes, pendingDeliveriesRes, scheduledTransfersRes, recentMovementsRes] = await Promise.all([
        getDashboardSummary(filters),
        getLowStockProducts(filters),
        getPendingReceipts(filters),
        getPendingDeliveries(filters),
        getScheduledTransfers(filters),
        getRecentMovements(filters),
      ]);

      const dashboard = summaryRes?.data || {
        summary: { totalProducts: 0, lowStockCount: 0, pendingReceipts: 0, pendingDeliveries: 0, scheduledTransfers: 0 },
        lowStockProducts: [],
        pendingReceipts: [],
        pendingDeliveries: [],
        scheduledTransfers: [],
        recentMovements: [],
        filters: { categories: [], warehouses: [] },
      };

      setSummary((currentSummary) => dashboard.summary || currentSummary);
      setLowStockProducts(Array.isArray(lowStockRes?.data) ? lowStockRes.data : []);
      setPendingReceipts(Array.isArray(pendingReceiptsRes?.data) ? pendingReceiptsRes.data : []);
      setPendingDeliveries(Array.isArray(pendingDeliveriesRes?.data) ? pendingDeliveriesRes.data : []);
      setScheduledTransfers(Array.isArray(scheduledTransfersRes?.data) ? scheduledTransfersRes.data : []);
      setRecentMovements(Array.isArray(recentMovementsRes?.data) ? recentMovementsRes.data : []);
      setFilterOptions({
        warehouses: Array.isArray(dashboard.filters?.warehouses) ? dashboard.filters.warehouses : [],
        categories: Array.isArray(dashboard.filters?.categories) ? dashboard.filters.categories : [],
      });
    } catch (loadError) {
      setError(loadError?.message || 'Unable to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const applyFilters = () => {
    loadDashboard();
  };

  const clearFilters = () => {
    setFilters(defaultFilters);
    setTimeout(() => loadDashboard(), 0);
  };

  const dashboardSummary = useMemo(() => ({
    totalProducts: summary.totalProducts ?? 0,
    lowStockCount: summary.lowStockCount ?? 0,
    pendingReceipts: summary.pendingReceipts ?? 0,
    pendingDeliveries: summary.pendingDeliveries ?? 0,
    scheduledTransfers: summary.scheduledTransfers ?? 0,
  }), [summary]);

  return (
    <MainLayout>
      <div className="dashboard-page">
        <div className="page-header">
          <div>
            <h1 className="page-title">Inventory Dashboard</h1>
            <p className="page-subtitle">Monitor stock levels and inventory operations at a glance.</p>
          </div>
        </div>

        {error && (
          <div className="alert alert-error">
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        <KpiCards summary={dashboardSummary} loading={loading} />

        <DashboardFilters
          filters={filters}
          onChange={setFilters}
          onApply={applyFilters}
          onClear={clearFilters}
          options={filterOptions}
        />

        <div className="dashboard-section-grid">
          <LowStockList products={lowStockProducts} loading={loading} error={error} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <PendingOperations title="Pending Receipts" records={pendingReceipts} type="Receipt" loading={loading} error={error} viewPath="/receipts" />
            <PendingOperations title="Pending Deliveries" records={pendingDeliveries} type="Delivery" loading={loading} error={error} viewPath="/delivery-orders" />
            <PendingOperations title="Scheduled Internal Transfers" records={scheduledTransfers} type="Transfer" loading={loading} error={error} viewPath="/transfers" />
          </div>
        </div>

        <RecentMovements movements={recentMovements} loading={loading} error={error} />

        <div className="info-card" style={{ padding: '1rem 1.1rem' }}>
          <div className="card-icon">
            <Boxes size={22} color="#6366f1" />
          </div>
          <h3>Inventory Overview</h3>
          <p>Dashboard data remains frontend-ready and automatically adapts to the real backend payload when it becomes available.</p>
          <div className="card-footer-tags">
            <span className="status-badge badge-info"><Clock3 size={12} style={{ marginRight: 4 }} /> Real-time ready</span>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default DashboardPage;
