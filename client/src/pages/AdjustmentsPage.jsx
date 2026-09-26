import React from 'react';
import MainLayout from '../layouts/MainLayout';
import AdjustmentList from '../features/adjustments/AdjustmentList';

const AdjustmentsPage = () => {
  return (
    <MainLayout>
      <AdjustmentList />
    </MainLayout>
  );
};

export default AdjustmentsPage;
