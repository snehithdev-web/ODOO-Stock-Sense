import React from 'react';
import MainLayout from '../layouts/MainLayout';
import ReceiptList from '../features/receipts/ReceiptList';

const ReceiptsPage = () => {
  return (
    <MainLayout>
      <ReceiptList />
    </MainLayout>
  );
};

export default ReceiptsPage;
