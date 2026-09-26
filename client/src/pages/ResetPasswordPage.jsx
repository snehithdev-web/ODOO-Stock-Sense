import React from 'react';
import AuthLayout from '../layouts/AuthLayout';
import ResetPasswordForm from '../features/auth/ResetPasswordForm';

const ResetPasswordPage = () => {
  return (
    <AuthLayout
      title="Reset Password"
      subtitle="Set a new password for your StockSense account"
    >
      <ResetPasswordForm />
    </AuthLayout>
  );
};

export default ResetPasswordPage;
