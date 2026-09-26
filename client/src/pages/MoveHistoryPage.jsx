import React from 'react';
import MainLayout from '../layouts/MainLayout';
import MoveHistoryList from '../features/ledger/MoveHistoryList';

const MoveHistoryPage = () => {
  return (
    <MainLayout>
      <MoveHistoryList />
    </MainLayout>
  );
};

export default MoveHistoryPage;
