import React from 'react';
import AuthLayout from '../layouts/AuthLayout';
import RegisterForm from '../features/auth/RegisterForm';

const RegisterPage = () => {
  return (
    <AuthLayout
      title="Create Account"
      subtitle="Join StockSense and streamline your warehouse operations"
    >
      <RegisterForm />
    </AuthLayout>
  );
};

export default RegisterPage;
