import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginApi, registerApi, getMeApi } from '../features/auth/authApi';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('stocksense_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('stocksense_token') || null;
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      if (token) {
        try {
          const res = await getMeApi();
          setUser(res.data);
          localStorage.setItem('stocksense_user', JSON.stringify(res.data));
        } catch (error) {
          console.error('[Auth Verification Failed]:', error.message);
          logout();
        }
      }
      setLoading(false);
    };

    verifyAuth();
  }, [token]);

  const login = async (credentials) => {
    const response = await loginApi(credentials);
    const { user: userData, token: userToken } = response.data;

    setUser(userData);
    setToken(userToken);

    localStorage.setItem('stocksense_token', userToken);
    localStorage.setItem('stocksense_user', JSON.stringify(userData));

    return response;
  };

  const register = async (userData) => {
    const response = await registerApi(userData);
    const { user: newUser, token: userToken } = response.data;

    setUser(newUser);
    setToken(userToken);

    localStorage.setItem('stocksense_token', userToken);
    localStorage.setItem('stocksense_user', JSON.stringify(newUser));

    return response;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('stocksense_token');
    localStorage.removeItem('stocksense_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
