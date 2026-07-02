import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:8000',
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const registerUser = (data) => API.post('/auth/register', data);
export const loginUser = (data) => API.post('/auth/login', data);

export const getExpenses = () => API.get('/expenses/');
export const addExpense = (data) => API.post('/expenses/', data);
export const updateExpense = (id, data) => API.put(`/expenses/${id}`, data);
export const deleteExpense = (id) => API.delete(`/expenses/${id}`);

export const getBudgetStatus = (month) => API.get(`/budgets/status/${month}`);
export const setBudget = (data) => API.post('/budgets/', data);
export const adjustBudget = (data) => API.post('/budgets/adjust', data);