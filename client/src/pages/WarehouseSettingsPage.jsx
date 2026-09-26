import React from 'react';
import MainLayout from '../layouts/MainLayout';
import WarehouseList from '../features/warehouses/WarehouseList';

const WarehouseSettingsPage = () => {
  return (
    <MainLayout>
      <WarehouseList />
    </MainLayout>
  );
};

export default WarehouseSettingsPage;
