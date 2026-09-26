import React from 'react';
import MainLayout from '../layouts/MainLayout';
import DeliveryList from '../features/deliveries/DeliveryList';

const DeliveryOrdersPage = () => {
  return (
    <MainLayout>
      <DeliveryList />
    </MainLayout>
  );
};

export default DeliveryOrdersPage;
