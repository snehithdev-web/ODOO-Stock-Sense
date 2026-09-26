import User from '../models/user.model.js';
import { generateToken } from '../utils/jwt.js';

/**
 * Register a new user
 */
export const registerUser = async ({ name, email, password, role }) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    const error = new Error('User with this email already exists.');
    error.statusCode = 400;
    throw error;
  }

  const user = await User.create({
    name,
    email,
    password,
    role: role || 'inventory_manager',
  });

  const token = generateToken(user._id, user.role);

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    token,
  };
};

/**
 * Authenticate user & login
 */
export const loginUser = async ({ email, password }) => {
  if (!email || !password) {
    const error = new Error('Please provide email and password.');
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.matchPassword(password))) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  const token = generateToken(user._id, user.role);

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    token,
  };
};

/**
 * Generate OTP for Forgot Password flow
 */
export const generateForgotPasswordOtp = async (email) => {
  const user = await User.findOne({ email });

  if (!user) {
    const error = new Error('No user account found with this email address.');
    error.statusCode = 444;
    throw error;
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expireTime = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

  user.resetPasswordOtp = otp;
  user.resetPasswordOtpExpire = expireTime;
  user.isOtpVerified = false;

  await user.save({ validateBeforeSave: false });

  console.log(`[AUTH SERVICE - DEV MODE OTP]: Email: ${email} | OTP: ${otp}`);

  return {
    message: 'OTP sent successfully to your email (Visible in Dev Mode/Console).',
    devOtp: otp,
  };
};

/**
 * Verify OTP Code
 */
export const verifyOtpCode = async ({ email, otp }) => {
  const user = await User.findOne({ email }).select('+resetPasswordOtp +resetPasswordOtpExpire');

  if (!user) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    throw error;
  }

  if (
    !user.resetPasswordOtp ||
    user.resetPasswordOtp !== otp ||
    user.resetPasswordOtpExpire < new Date()
  ) {
    const error = new Error('Invalid or expired OTP code.');
    error.statusCode = 400;
    throw error;
  }

  user.isOtpVerified = true;
  await user.save({ validateBeforeSave: false });

  return { message: 'OTP verified successfully.' };
};

/**
 * Reset password using verified OTP
 */
export const resetUserPassword = async ({ email, otp, newPassword }) => {
  const user = await User.findOne({ email }).select(
    '+resetPasswordOtp +resetPasswordOtpExpire +isOtpVerified'
  );

  if (!user) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    throw error;
  }

  if (
    !user.resetPasswordOtp ||
    user.resetPasswordOtp !== otp ||
    user.resetPasswordOtpExpire < new Date()
  ) {
    const error = new Error('Invalid or expired OTP code.');
    error.statusCode = 400;
    throw error;
  }

  user.password = newPassword;
  user.resetPasswordOtp = undefined;
  user.resetPasswordOtpExpire = undefined;
  user.isOtpVerified = undefined;

  await user.save();

  return { message: 'Password has been reset successfully. You can now login.' };
};
