import React from 'react';
import AuthLayout from '../layouts/AuthLayout';
import ForgotPasswordForm from '../features/auth/ForgotPasswordForm';

const ForgotPasswordPage = () => {
  return (
    <AuthLayout
      title="Forgot Password"
      subtitle="Request a verification OTP code to recover your account"
    >
      <ForgotPasswordForm />
    </AuthLayout>
  );
};

export default ForgotPasswordPage;
