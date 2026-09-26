import React from 'react';
import MainLayout from '../layouts/MainLayout';
import ProductList from '../features/products/ProductList';

const ProductsPage = () => {
  return (
    <MainLayout>
      <ProductList />
    </MainLayout>
  );
};

export default ProductsPage;
