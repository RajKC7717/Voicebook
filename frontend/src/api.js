import axios from 'axios';

const BASE = 'http://localhost:8000/api';

export const getTransactions = () => axios.get(`${BASE}/transactions`);
export const getSummary = () => axios.get(`${BASE}/transactions/summary`);
export const createTransaction = (data) => axios.post(`${BASE}/transactions`, data);
export const speakConfirmation = (transaction) =>
  axios.post(`${BASE}/tts/confirm`, transaction, { responseType: 'arraybuffer' });
export const ocrPreview = (formData) =>
  axios.post(`${BASE}/ocr/preview`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

export const ocrConfirm = (entries, ocr_text) =>
  axios.post(`${BASE}/ocr/confirm`, { entries, ocr_text });