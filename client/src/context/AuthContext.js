import React, { createContext, useContext, useReducer, useEffect } from 'react';
import api from '../utils/api';
import i18n from '../i18n/i18n';

const AuthContext = createContext(null);

const initialState = {
  user: null,
  token: localStorage.getItem('zeal_token'),
  loading: true,
  error: null,
};

const reducer = (state, action) => {
  switch (action.type) {
    case 'SET_USER':    return { ...state, user: action.payload, loading: false, error: null };
    case 'LOGIN':
      localStorage.setItem('zeal_token', action.payload.token);
      return { ...state, user: action.payload.user, token: action.payload.token, loading: false, error: null };
    case 'LOGOUT':
      localStorage.removeItem('zeal_token');
      return { ...state, user: null, token: null, loading: false };
    case 'SET_LOADING': return { ...state, loading: action.payload };
    case 'SET_ERROR':   return { ...state, error: action.payload, loading: false };
    default:            return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const token = localStorage.getItem('zeal_token');
    if (!token) { dispatch({ type: 'SET_LOADING', payload: false }); return; }

    api.get('/auth/me')
      .then(({ data }) => {
        dispatch({ type: 'SET_USER', payload: data });
        i18n.changeLanguage(data.language === 'es' ? 'es' : 'en');
      })
      .catch(() => dispatch({ type: 'LOGOUT' }));
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    dispatch({ type: 'LOGIN', payload: data });
    i18n.changeLanguage(data.user.language === 'es' ? 'es' : 'en');
    return data.user;
  };

  const register = async (formData) => {
    const { data } = await api.post('/auth/register', formData);
    dispatch({ type: 'LOGIN', payload: data });
    i18n.changeLanguage(formData.language === 'es' ? 'es' : 'en');
    return data.user;
  };

  const logout = () => dispatch({ type: 'LOGOUT' });

  const updateUser = (updates) =>
    dispatch({ type: 'SET_USER', payload: { ...state.user, ...updates } });

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
