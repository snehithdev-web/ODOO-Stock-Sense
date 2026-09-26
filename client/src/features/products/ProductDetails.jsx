import React from 'react';
import StatusBadge from '../../components/StatusBadge';
import { Package, Tag, MapPin, Layers, DollarSign, Calendar, User, X } from 'lucide-react';

const ProductDetails = ({ product, onClose, onEdit }) => {
  if (!product) return null;

  const isLowStock = product.quantity <= product.reorderLevel;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <Package size={22} color="#6366f1" />
            <h3>Product Details</h3>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        <div className="product-details-content">
          <div className="details-header-banner">
            <div>
              <span className="details-sku-badge">{product.sku}</span>
              <h2 className="details-title">{product.name}</h2>
              <div className="details-tags">
                <StatusBadge type="info">{product.category}</StatusBadge>
                {isLowStock ? (
                  <StatusBadge type="warning">Low Stock</StatusBadge>
                ) : (
                  <StatusBadge type="success">In Stock</StatusBadge>
                )}
              </div>
            </div>

            <div className="details-price-tag">
              <span className="price-label">Price</span>
              <span className="price-amount">${Number(product.price).toFixed(2)}</span>
            </div>
          </div>

          <div className="details-grid">
            <div className="details-card">
              <div className="card-label">
                <Layers size={16} />
                <span>Available Stock</span>
              </div>
              <div className="card-value font-mono">
                {product.quantity} <span className="unit-label">{product.unit}</span>
              </div>
              <p className="card-subtext">Reorder Threshold: {product.reorderLevel} {product.unit}</p>
            </div>

            <div className="details-card">
              <div className="card-label">
                <MapPin size={16} />
                <span>Warehouse Location</span>
              </div>
              <div className="card-value">{product.location || 'Main Warehouse'}</div>
              <p className="card-subtext">Location Code</p>
            </div>

            <div className="details-card">
              <div className="card-label">
                <Tag size={16} />
                <span>Category</span>
              </div>
              <div className="card-value">{product.category}</div>
              <p className="card-subtext">Product Classification</p>
            </div>

            <div className="details-card">
              <div className="card-label">
                <User size={16} />
                <span>Created By</span>
              </div>
              <div className="card-value">{product.createdBy?.name || 'System'}</div>
              <p className="card-subtext">{product.createdBy?.email || 'N/A'}</p>
            </div>
          </div>

          {product.description && (
            <div className="details-description">
              <h4>Description</h4>
              <p>{product.description}</p>
            </div>
          )}

          <div className="details-meta font-mono">
            <span>Created: {new Date(product.createdAt).toLocaleString()}</span>
            <span>Last Updated: {new Date(product.updatedAt).toLocaleString()}</span>
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-secondary">
            Close
          </button>
          {onEdit && (
            <button onClick={() => { onClose(); onEdit(product); }} className="btn btn-primary">
              Edit Product
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
