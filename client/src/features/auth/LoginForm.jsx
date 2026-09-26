import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, LogIn, AlertCircle } from 'lucide-react';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    try {
      setLoading(true);
      await login({ email, password });
      navigate('/products');
    } catch (err) {
      setError(err.message || 'Login failed. Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      {error && (
        <div className="alert alert-error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <div className="form-group">
        <label htmlFor="email">Email Address</label>
        <div className="input-with-icon">
          <Mail size={18} className="input-icon" />
          <input
            id="email"
            type="email"
            placeholder="admin@stocksense.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="form-control"
          />
        </div>
      </div>

      <div className="form-group">
        <div className="label-with-link">
          <label htmlFor="password">Password</label>
          <Link to="/forgot-password" className="text-link-sm">
            Forgot Password?
          </Link>
        </div>
        <div className="input-with-icon">
          <Lock size={18} className="input-icon" />
          <input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="form-control"
          />
        </div>
      </div>

      <button type="submit" disabled={loading} className="btn btn-primary btn-block mt-4">
        {loading ? (
          <span className="spinner-sm"></span>
        ) : (
          <>
            <LogIn size={18} />
            <span>Sign In</span>
          </>
        )}
      </button>

      <p className="auth-footer-text">
        Don&apos;t have an account?{' '}
        <Link to="/register" className="text-link">
          Create account
        </Link>
      </p>
    </form>
  );
};

export default LoginForm;
