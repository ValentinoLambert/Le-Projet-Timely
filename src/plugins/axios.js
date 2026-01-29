import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'https://timely.edu.netlor.fr/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour injecter la clé d'API
apiClient.interceptors.request.use((config) => {
  const apiKey = localStorage.getItem('timely_api_key');
  if (apiKey) {
    config.headers.Authorization = `key=${apiKey}`;
  }
  return config;
});

export default apiClient;
