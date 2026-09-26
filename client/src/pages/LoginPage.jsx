import React from 'react';
import AuthLayout from '../layouts/AuthLayout';
import LoginForm from '../features/auth/LoginForm';

const LoginPage = () => {
  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in to your StockSense account to manage inventory"
    >
      <LoginForm />
    </AuthLayout>
  );
};

export default LoginPage;
