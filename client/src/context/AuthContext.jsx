import { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser]     = useState(null);
  const [token, setToken]   = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      axios.get(`${import.meta.env.VITE_API_URL}/api/auth/me`)
        .then(res => setUser(res.data))
        .catch(() => {
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password) => {
    const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/login`, { email, password });
    setToken(res.data.token);
    setUser(res.data.user);
    localStorage.setItem('token', res.data.token);
    return res.data.user;
  };

  // Returns { email, phone } — user is not logged in until both OTPs are verified
  const register = async (name, email, password, phone) => {
    const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/register`, { name, email, password, phone });
    return res.data;
  };

  const sendPhoneOtp = async (phone) => {
    const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/send-phone-otp`, { phone });
    return res.data;
  };

  // Verifies SMS OTP → marks phone_verified → sends email OTP → returns { email }
  const verifyPhoneOtp = async (phone, code) => {
    const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/verify-phone-otp`, { phone, code });
    return res.data;
  };

  // Called after user submits the 6-digit code — logs the user in
  const verifyOtp = async (email, code) => {
    const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/verify-otp`, { email, code });
    setToken(res.data.token);
    setUser(res.data.user);
    localStorage.setItem('token', res.data.token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
    return res.data.user;
  };

  const resendOtp = async (email) => {
    await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/resend-otp`, { email });
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
  };

  const updateUser = (data) => setUser(prev => ({ ...prev, ...data }));

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, verifyOtp, resendOtp, sendPhoneOtp, verifyPhoneOtp, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};
