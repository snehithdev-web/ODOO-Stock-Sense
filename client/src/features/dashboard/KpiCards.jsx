import React from 'react';
import { Activity, AlertTriangle, Truck, PackageCheck, ArrowRightLeft } from 'lucide-react';

const cardConfig = [
  { key: 'totalProducts', label: 'Total Products in Stock', icon: PackageCheck, accent: 'primary' },
  { key: 'lowStockCount', label: 'Low / Out of Stock', icon: AlertTriangle, accent: 'warning' },
  { key: 'pendingReceipts', label: 'Pending Receipts', icon: Truck, accent: 'info' },
  { key: 'pendingDeliveries', label: 'Pending Deliveries', icon: Activity, accent: 'danger' },
  { key: 'scheduledTransfers', label: 'Internal Transfers Scheduled', icon: ArrowRightLeft, accent: 'success' },
];

const KpiCards = ({ summary, loading = false }) => {
  if (loading) {
    return (
      <div className="kpi-grid">
        {cardConfig.map((card) => (
          <div className="kpi-card skeleton-card" key={card.key}>
            <div className="skeleton-line short" />
            <div className="skeleton-line long" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="kpi-grid">
      {cardConfig.map((card) => {
        const Icon = card.icon;
        const value = summary?.[card.key] ?? 0;

        return (
          <div className={`kpi-card ${card.accent}`} key={card.key}>
            <div className="kpi-header">
              <span className="kpi-label">{card.label}</span>
              <div className="kpi-icon">
                <Icon size={18} />
              </div>
            </div>
            <div className="kpi-value">{Number(value).toLocaleString()}</div>
          </div>
        );
      })}
    </div>
  );
};

export default KpiCards;
