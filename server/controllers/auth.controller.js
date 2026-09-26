import * as authService from '../services/auth.service.js';
import { sendSuccess } from '../utils/response.js';

const isProduction = () => process.env.NODE_ENV === 'production';

export const register = async (req, res, next) => {
  try {
    const result = await authService.registerUser(req.body);
    return sendSuccess(res, {
      message: 'User registered successfully',
      statusCode: 201,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const result = await authService.loginUser(req.body);
    return sendSuccess(res, { message: 'Login successful', data: result });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const result = await authService.generateForgotPasswordOtp(req.body.email);

    // Belt and braces: the service already withholds the code in production,
    // and this guards the response body as well so the OTP can never be
    // serialised into an API response on a production deployment.
    return sendSuccess(res, {
      message: result.message,
      ...(result.devOtp && !isProduction() ? { devOtp: result.devOtp } : {}),
    });
  } catch (error) {
    next(error);
  }
};

export const verifyOtp = async (req, res, next) => {
  try {
    const result = await authService.verifyOtpCode(req.body);
    return sendSuccess(res, { message: result.message });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const result = await authService.resetUserPassword(req.body);
    return sendSuccess(res, { message: result.message });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res) =>
  sendSuccess(res, { message: 'Current user retrieved', data: req.user });
