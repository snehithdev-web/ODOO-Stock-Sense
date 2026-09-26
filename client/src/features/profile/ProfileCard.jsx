import React from 'react';
import { Mail, ShieldCheck, UserCircle2 } from 'lucide-react';

const ProfileCard = ({ user }) => {
  const roleLabel = user?.role === 'inventory_manager' ? 'Inventory Manager' : 'Warehouse Staff';

  return (
    <div className="profile-card">
      <div className="profile-avatar-wrap">
        <div className="profile-avatar">
          <UserCircle2 size={48} />
        </div>
      </div>

      <div className="profile-card-body">
        <div className="profile-name-row">
          <h2>{user?.name || 'Inventory User'}</h2>
        </div>

        <div className="profile-info-list">
          <div className="profile-info-item">
            <span className="profile-info-label">Name</span>
            <strong>{user?.name || 'Inventory User'}</strong>
          </div>

          <div className="profile-info-item">
            <span className="profile-info-label">Email</span>
            <div className="profile-inline">
              <Mail size={16} />
              <strong>{user?.email || 'user@stocksense.com'}</strong>
            </div>
          </div>

          <div className="profile-info-item">
            <span className="profile-info-label">Role</span>
            <div className="profile-inline">
              <ShieldCheck size={16} />
              <strong>{roleLabel}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;
