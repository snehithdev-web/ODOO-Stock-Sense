import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, Lock, Shield, UserPlus, AlertCircle } from 'lucide-react';

const RegisterForm = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('inventory_manager');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name || !email || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    try {
      setLoading(true);
      await register({ name, email, password, role });
      navigate('/products');
    } catch (err) {
      setError(err.message || 'Registration failed.');
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
        <label htmlFor="name">Full Name</label>
        <div className="input-with-icon">
          <User size={18} className="input-icon" />
          <input
            id="name"
            type="text"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="form-control"
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="email">Email Address</label>
        <div className="input-with-icon">
          <Mail size={18} className="input-icon" />
          <input
            id="email"
            type="email"
            placeholder="john@stocksense.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="form-control"
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="password">Password</label>
        <div className="input-with-icon">
          <Lock size={18} className="input-icon" />
          <input
            id="password"
            type="password"
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="form-control"
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="role">Assign Role</label>
        <div className="input-with-icon">
          <Shield size={18} className="input-icon" />
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="form-control"
          >
            <option value="inventory_manager">Inventory Manager (Full Access)</option>
            <option value="warehouse_staff">Warehouse Staff (Read Only)</option>
          </select>
        </div>
      </div>

      <button type="submit" disabled={loading} className="btn btn-primary btn-block mt-4">
        {loading ? (
          <span className="spinner-sm"></span>
        ) : (
          <>
            <UserPlus size={18} />
            <span>Register Account</span>
          </>
        )}
      </button>

      <p className="auth-footer-text">
        Already have an account?{' '}
        <Link to="/login" className="text-link">
          Sign In
        </Link>
      </p>
    </form>
  );
};

export default RegisterForm;
