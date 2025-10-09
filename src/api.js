import axios from 'axios';

const api = axios.create({
    // For local development, use localhost. For live deployment, change this.
    baseURL: 'http://localhost:5000/api', 
});

export default api;