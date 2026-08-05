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
  const [customer, setCustomer] = useState<CustomerUser | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('afsoo_customer_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchMe = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await api.get('/auth/customer/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCustomer(res.data);
      } catch (err) {
        console.warn('Customer session expired or invalid:', err);
        localStorage.removeItem('afsoo_customer_token');
        setToken(null);
        setCustomer(null);
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
    setToken(newToken);
    setCustomer(userProfile);
  };

  const logout = () => {
    localStorage.removeItem('afsoo_customer_token');
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
