import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { resetPasswordApi } from './authApi';
import { Lock, CheckCircle2, AlertCircle } from 'lucide-react';

const ResetPasswordForm = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const email = location.state?.email || '';
  const otp = location.state?.otp || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !otp) {
      setError('Missing OTP verification state. Please restart OTP flow.');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      const res = await resetPasswordApi(email, otp, newPassword);
      setSuccess(res.message || 'Password reset successfully!');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to reset password.');
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

      {success && (
        <div className="alert alert-success">
          <CheckCircle2 size={18} />
          <span>{success} Redirecting to login...</span>
        </div>
      )}

      <p className="auth-instruction">
        Set a new password for account: <strong>{email}</strong>
      </p>

      <div className="form-group">
        <label htmlFor="newPassword">New Password</label>
        <div className="input-with-icon">
          <Lock size={18} className="input-icon" />
          <input
            id="newPassword"
            type="password"
            placeholder="At least 6 characters"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            className="form-control"
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="confirmPassword">Confirm New Password</label>
        <div className="input-with-icon">
          <Lock size={18} className="input-icon" />
          <input
            id="confirmPassword"
            type="password"
            placeholder="Re-enter new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
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
            <CheckCircle2 size={18} />
            <span>Reset Password</span>
          </>
        )}
      </button>

      <p className="auth-footer-text">
        <Link to="/login" className="text-link">
          Back to Login
        </Link>
      </p>
    </form>
  );
};

export default ResetPasswordForm;
