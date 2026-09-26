import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { forgotPasswordApi, verifyOtpApi } from './authApi';
import { Mail, KeyRound, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';

const ForgotPasswordForm = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1); // 1: Request OTP, 2: Verify OTP
  const [devOtp, setDevOtp] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    try {
      setLoading(true);
      const res = await forgotPasswordApi(email);
      setSuccess(res.message);

      if (res.devOtp) {
        setDevOtp(res.devOtp);
      }

      setStep(2);
    } catch (err) {
      setError(err.message || 'Failed to request OTP. Please verify email address.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!otp) {
      setError('Please enter the 6-digit OTP code.');
      return;
    }

    try {
      setLoading(true);
      await verifyOtpApi(email, otp);
      navigate('/reset-password', { state: { email, otp } });
    } catch (err) {
      setError(err.message || 'Invalid or expired OTP code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {error && (
        <div className="alert alert-error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <CheckCircle size={18} />
          <span>{success}</span>
        </div>
      )}

      {devOtp && (
        <div className="alert alert-info">
          <KeyRound size={18} />
          <span>
            <strong>[DEV MODE OTP]:</strong> Use Code <strong>{devOtp}</strong>
          </span>
        </div>
      )}

      {step === 1 ? (
        <form onSubmit={handleSendOtp} className="auth-form">
          <p className="auth-instruction">
            Enter your registered email address and we will generate a 6-digit verification code.
          </p>

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

          <button type="submit" disabled={loading} className="btn btn-primary btn-block mt-4">
            {loading ? (
              <span className="spinner-sm"></span>
            ) : (
              <>
                <span>Send OTP Code</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="auth-form">
          <p className="auth-instruction">
            Enter the 6-digit OTP code generated for <strong>{email}</strong>.
          </p>

          <div className="form-group">
            <label htmlFor="otp">6-Digit OTP Code</label>
            <div className="input-with-icon">
              <KeyRound size={18} className="input-icon" />
              <input
                id="otp"
                type="text"
                maxLength="6"
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                className="form-control font-mono"
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary btn-block mt-4">
            {loading ? (
              <span className="spinner-sm"></span>
            ) : (
              <>
                <span>Verify OTP & Proceed</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>
      )}

      <p className="auth-footer-text">
        Remembered password?{' '}
        <Link to="/login" className="text-link">
          Back to Sign In
        </Link>
      </p>
    </div>
  );
};

export default ForgotPasswordForm;
