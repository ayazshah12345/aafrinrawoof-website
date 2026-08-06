import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

export interface CustomerUser {
  id: number;
  full_name: string;
  email: string;
  phone?: string;
  avatar?: string;
  address?: string;
  city?: string;
  country?: string;
  postal_code?: string;
  total_orders: number;
  total_spent: number;
  created_at: string;
}

interface CustomerAuthContextType {
  customer: CustomerUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (payload: {
    full_name: string;
    email: string;
    password: string;
    phone?: string;
    address?: string;
    city?: string;
    postal_code?: string;
  }) => Promise<void>;
  logout: () => void;
}

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(undefined);

export const CustomerAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customer, setCustomer] = useState<CustomerUser | null>(() => {
    try {
      const saved = localStorage.getItem('afsoo_customer_user');
      if (!saved || saved === 'undefined') return null;
      return JSON.parse(saved);
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(() => {
    const savedToken = localStorage.getItem('afsoo_customer_token');
    return savedToken && savedToken !== 'undefined' ? savedToken : null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchMe = async () => {
      if (!token || token === 'undefined') {
        setIsLoading(false);
        return;
      }
      try {
        const savedUser = localStorage.getItem('afsoo_customer_user');
        if (savedUser && savedUser !== 'undefined') {
          const parsed = JSON.parse(savedUser);
          if (parsed && typeof parsed === 'object') {
            setCustomer(parsed);
          }
        } else {
          const res = await api.get('/auth/customer/me', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.data) {
            setCustomer(res.data);
            localStorage.setItem('afsoo_customer_user', JSON.stringify(res.data));
          }
        }
      } catch (err) {
        console.warn('Customer session fallback applied:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMe();
  }, [token]);

  const login = async (identifier: string, password: string) => {
    const res = await api.post('/auth/customer/login', { identifier, password });
    const newToken = res.data.access_token;
    const userProfile = res.data.customer;

    localStorage.setItem('afsoo_customer_token', newToken);
    localStorage.setItem('afsoo_customer_user', JSON.stringify(userProfile));
    setToken(newToken);
    setCustomer(userProfile);
  };

  const register = async (payload: {
    full_name: string;
    email: string;
    password: string;
    phone?: string;
    address?: string;
    city?: string;
    postal_code?: string;
  }) => {
    const res = await api.post('/auth/customer/register', payload);
    const newToken = res.data.access_token;
    const userProfile = res.data.customer;

    localStorage.setItem('afsoo_customer_token', newToken);
    localStorage.setItem('afsoo_customer_user', JSON.stringify(userProfile));
    setToken(newToken);
    setCustomer(userProfile);
  };

  const logout = () => {
    localStorage.removeItem('afsoo_customer_token');
    localStorage.removeItem('afsoo_customer_user');
    setToken(null);
    setCustomer(null);
  };

  return (
    <CustomerAuthContext.Provider
      value={{
        customer,
        token,
        isAuthenticated: !!customer,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </CustomerAuthContext.Provider>
  );
};

export const useCustomerAuth = () => {
  const context = useContext(CustomerAuthContext);
  if (!context) {
    throw new Error('useCustomerAuth must be used within a CustomerAuthProvider');
  }
  return context;
};
