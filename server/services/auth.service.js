import User from '../models/user.model.js';
import ApiError from '../utils/ApiError.js';
import { generateToken } from '../utils/jwt.js';

/** Failed verify-otp attempts allowed before the code is discarded. */
const MAX_OTP_ATTEMPTS = 5;

/** Lifetime of a generated OTP. */
const OTP_TTL_MS = 10 * 60 * 1000;

/**
 * Generic reply used for every forgot-password request.
 *
 * The endpoint used to answer 444 for an unknown address and 200 for a known
 * one, which let anyone enumerate registered accounts. Both cases now return
 * the same body so the response reveals nothing.
 */
const GENERIC_OTP_MESSAGE =
  'If an account exists for that email, an OTP has been sent.';

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
});

/**
 * Register a new user
 */
export const registerUser = async ({ name, email, password, role }) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw ApiError.conflict('User with this email already exists.');
  }

  const user = await User.create({
    name,
    email,
    password,
    role: role || 'inventory_manager',
  });

  return {
    user: publicUser(user),
    token: generateToken(user._id, user.role),
  };
};

/**
 * Authenticate user & login
 */
export const loginUser = async ({ email, password }) => {
  if (!email || !password) {
    throw ApiError.badRequest('Please provide email and password.');
  }

  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.matchPassword(password))) {
    throw ApiError.unauthorized('Invalid email or password.');
  }

  return {
    user: publicUser(user),
    token: generateToken(user._id, user.role),
  };
};

/**
 * Generate OTP for Forgot Password flow
 *
 * The OTP itself is only handed back to the caller outside production. In
 * development it is returned so the flow can be tested without a mail
 * transport; in production it must never leave the server.
 */
export const generateForgotPasswordOtp = async (email) => {
  const user = email ? await User.findOne({ email }) : null;

  if (!user) {
    // Same response as the success path, so the endpoint cannot be used to
    // discover which addresses are registered.
    return { message: GENERIC_OTP_MESSAGE };
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  user.resetPasswordOtp = otp;
  user.resetPasswordOtpExpire = new Date(Date.now() + OTP_TTL_MS);
  user.resetPasswordOtpAttempts = 0;
  user.isOtpVerified = false;

  await user.save({ validateBeforeSave: false });

  console.log(`[AUTH SERVICE - DEV MODE OTP]: Email: ${email} | OTP: ${otp}`);

  return {
    message: GENERIC_OTP_MESSAGE,
    ...(isProduction() ? {} : { devOtp: otp }),
  };
};

/**
 * Verify OTP Code
 *
 * Each failure increments a counter on the user document. Once the counter
 * reaches MAX_OTP_ATTEMPTS the stored code is cleared, so a six digit code
 * cannot be exhausted by brute force within its expiry window.
 */
export const verifyOtpCode = async ({ email, otp }) => {
  const user = await User.findOne({ email }).select(
    '+resetPasswordOtp +resetPasswordOtpExpire +resetPasswordOtpAttempts'
  );

  if (!user) {
    throw ApiError.badRequest('Invalid or expired OTP code.');
  }

  if (
    !user.resetPasswordOtp ||
    user.resetPasswordOtpExpire < new Date() ||
    user.resetPasswordOtpAttempts >= MAX_OTP_ATTEMPTS
  ) {
    throw ApiError.badRequest('Invalid or expired OTP code.');
  }

  if (user.resetPasswordOtp !== String(otp)) {
    user.resetPasswordOtpAttempts += 1;

    // Discard the code once the budget is used up so the remaining
    // combinations in the window become unreachable.
    if (user.resetPasswordOtpAttempts >= MAX_OTP_ATTEMPTS) {
      user.resetPasswordOtp = undefined;
      user.resetPasswordOtpExpire = undefined;
    }

    await user.save({ validateBeforeSave: false });

    const attemptsLeft = Math.max(MAX_OTP_ATTEMPTS - user.resetPasswordOtpAttempts, 0);
    throw ApiError.badRequest(
      attemptsLeft > 0
        ? `Invalid or expired OTP code. ${attemptsLeft} attempt(s) remaining.`
        : 'Invalid or expired OTP code. Request a new one.'
    );
  }

  user.isOtpVerified = true;
  await user.save({ validateBeforeSave: false });

  return { message: 'OTP verified successfully.' };
};

/**
 * Reset password using verified OTP
 *
 * The code must have been confirmed through verifyOtpCode first. Previously
 * this only re-checked the code value, so the verification step could be
 * skipped entirely and the unused isOtpVerified flag was dead state.
 */
export const resetUserPassword = async ({ email, otp, newPassword }) => {
  if (!newPassword || String(newPassword).length < 6) {
    throw ApiError.badRequest('Password must be at least 6 characters.');
  }

  const user = await User.findOne({ email }).select(
    '+resetPasswordOtp +resetPasswordOtpExpire +isOtpVerified +resetPasswordOtpAttempts'
  );

  if (!user) {
    throw ApiError.badRequest('Invalid or expired OTP code.');
  }

  const codeIsValid =
    user.resetPasswordOtp &&
    user.resetPasswordOtpExpire >= new Date() &&
    user.resetPasswordOtpAttempts < MAX_OTP_ATTEMPTS;

  if (!codeIsValid || user.resetPasswordOtp !== String(otp) || !user.isOtpVerified) {
    throw ApiError.badRequest('Invalid or expired OTP code.');
  }

  user.password = newPassword;
  user.resetPasswordOtp = undefined;
  user.resetPasswordOtpExpire = undefined;
  user.resetPasswordOtpAttempts = 0;
  user.isOtpVerified = false;

  await user.save();

  return { message: 'Password has been reset successfully. You can now login.' };
};

function isProduction() {
  return process.env.NODE_ENV === 'production';
}
