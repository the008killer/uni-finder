// client/src/services/api.js
import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// API calls for programs and filters
export const fetchFilters = () => API.get('/filters');

export const fetchPrograms = (params) => API.get('/programs', { params });

export const fetchProgramById = (id) => API.get(`/programs/${id}`);

export const fetchUniversities = (params) => API.get('/universities', { params });

export const fetchUniversityById = (id) => API.get(`/universities/${id}`);

export default API;