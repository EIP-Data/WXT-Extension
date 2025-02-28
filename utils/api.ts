import axios from 'axios';


const api = axios.create({
    baseURL: import.meta.env.VITE_API_ENDPOINT,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
        'Authorization': localStorage.getItem('authToken') || ''
    },
    withCredentials: true,
});

api.interceptors.request.use(config => {
    const token = localStorage.getItem('authToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;