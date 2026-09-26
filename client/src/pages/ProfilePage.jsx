import React from 'react';
import MainLayout from '../layouts/MainLayout';
import ProfileCard from '../features/profile/ProfileCard';
import { useAuth } from '../context/AuthContext';

const ProfilePage = () => {
  const { user } = useAuth();

  return (
    <MainLayout>
      <div className="page-header compact">
        <div>
          <p className="page-kicker">Account</p>
          <h1 className="page-title">Profile</h1>
        </div>
      </div>

      <ProfileCard user={user} />
    </MainLayout>
  );
};

export default ProfilePage;
