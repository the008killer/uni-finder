import axios from 'axios';

const API = axios.create({
  baseURL:  import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatically inject JWT token from localStorage if available
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('unifinder_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Session
export const establishSession = (data) => API.post('/auth/session', data);
export const getMe = () => API.get('/profile');

// Profile
export const getProfile = () => API.get('/profile');
export const updateProfile = (data) => API.put('/profile', data);
export const changePassword = (data) => API.put('/profile/password', data);

// Chat API Calls
export const fetchMyChatGroups = () => API.get('/chat/my-groups');
export const joinChatGroup = (groupId) => API.post(`/chat/groups/${groupId}/join`);
export const fetchChatMessages = (groupId) => API.get(`/chat/groups/${groupId}/messages`);
export const leaveChatGroup = (groupId) => API.delete(`/chat/groups/${groupId}/leave`);
export const fetchChatMessagesBySection = (groupId, section) =>
  API.get(`/chat/groups/${groupId}/messages`, { params: { section } });

// Bookmarks
export const toggleBookmark = (programId) => API.post(`/bookmarks/toggle/${programId}`);
export const checkBookmarkStatus = (programId) => API.get(`/bookmarks/check/${programId}`);
export const fetchMyBookmarkIds = () => API.get('/bookmarks/my-ids');
export const removeBookmark = (programId) => API.delete(`/bookmarks/remove/${programId}`);

// Notifications
export const fetchNotifications = () => API.get('/notifications');
export const fetchUnreadCount = () => API.get('/notifications/unread-count');
export const markNotificationsRead = () => API.put('/notifications/mark-read');

// API calls for programs and filters
export const fetchFilters = () => API.get('/filters');
export const fetchPrograms = (params) => API.get('/programs', { params });
export const fetchProgramById = (id) => API.get(`/programs/${id}`);
export const fetchUniversities = (params) => API.get('/universities', { params });
export const fetchUniversityById = (id) => API.get(`/universities/${id}`);

export default API;