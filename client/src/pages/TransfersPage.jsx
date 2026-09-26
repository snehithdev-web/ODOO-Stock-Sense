import React from 'react';
import MainLayout from '../layouts/MainLayout';
import TransferList from '../features/transfers/TransferList';

const TransfersPage = () => {
  return (
    <MainLayout>
      <TransferList />
    </MainLayout>
  );
};

export default TransfersPage;
