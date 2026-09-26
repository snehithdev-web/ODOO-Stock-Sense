import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import { fetchProductByIdApi } from '../features/products/productApi';
import ProductDetails from '../features/products/ProductDetails';

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        const res = await fetchProductByIdApi(id);
        setProduct(res.data);
      } catch (err) {
        setError(err.message || 'Product not found');
      } finally {
        setLoading(false);
      }
    };
    loadProduct();
  }, [id]);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex-center py-12">
          <div className="spinner"></div>
        </div>
      </MainLayout>
    );
  }

  if (error || !product) {
    return (
      <MainLayout>
        <div className="card text-center py-8">
          <h2 className="text-danger">Error Loading Product</h2>
          <p className="text-muted mt-2">{error || 'Product details unavailable'}</p>
          <button onClick={() => navigate('/products')} className="btn btn-primary mt-4">
            Back to Products
          </button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <ProductDetails product={product} onClose={() => navigate('/products')} />
    </MainLayout>
  );
};

export default ProductDetailPage;
