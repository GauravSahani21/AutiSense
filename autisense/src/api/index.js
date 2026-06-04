const BASE_URL = import.meta.env.VITE_API_URL || '/api';

async function apiCall(endpoint, method = 'GET', body = null) {
  const config = {
    method,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  };

  if (body) config.body = JSON.stringify(body);

  let response;
  try {
    response = await fetch(`${BASE_URL}${endpoint}`, config);
  } catch {
    throw new Error('Cannot reach server. Is the backend running?');
  }

  let data = {};
  const text = await response.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(`Invalid server response (${response.status})`);
    }
  }

  if (!response.ok || data.success === false) {
    throw new Error(data.error || `API request failed (${response.status})`);
  }

  return data;
}

export const auth = {
  register: (data) => apiCall('/auth/register', 'POST', data),
  login: (data) => apiCall('/auth/login', 'POST', data),
  logout: () => apiCall('/auth/logout', 'POST'),
  getMe: () => apiCall('/auth/me', 'GET'),
  updateDetails: (data) => apiCall('/auth/updateDetails', 'PUT', data),
};

export const children = {
  getAll: () => apiCall('/children', 'GET'),
  getOne: (id) => apiCall(`/children/${id}`, 'GET'),
  create: (data) => apiCall('/children', 'POST', data),
  update: (id, data) => apiCall(`/children/${id}`, 'PUT', data),
  remove: (id) => apiCall(`/children/${id}`, 'DELETE'),
  getScreenings: (id) => apiCall(`/children/${id}/screenings`, 'GET'),
};

export const screenings = {
  create: (data) => apiCall('/screenings', 'POST', data),
  getAll: () => apiCall('/screenings', 'GET'),
  getOne: (id) => apiCall(`/screenings/${id}`, 'GET'),
};

export const trajectory = {
  getByChild: (childId) => apiCall(`/trajectory/${childId}`, 'GET'),
  getTrajectory: (childId) => apiCall(`/trajectory/${childId}`, 'GET'),
};

export const interventions = {
  generate: (childId) => apiCall('/interventions/generate', 'POST', { childId }),
  getByChild: (childId) => apiCall(`/interventions/${childId}`, 'GET'),
  updateAdherence: (planId, activities, outcomeNotes) =>
    apiCall(`/interventions/${planId}/adherence`, 'PUT', { activities, outcomeNotes }),
};

export const clinical = {
  getNextAction: (childId) => apiCall(`/clinical/next-action/${childId}`, 'GET'),
  getExplainability: (screeningId) => apiCall(`/clinical/explainability/${screeningId}`, 'GET'),
};

export const reports = {
  getAll: () => apiCall('/reports', 'GET'),
  getOne: (screeningId) => apiCall(`/reports/${screeningId}`, 'GET'),
  share: (id, data) => apiCall(`/reports/${id}/share`, 'PUT', data),
  updateAnalysis: (id, data) => apiCall(`/reports/${id}/analysis`, 'PUT', data),
};

export const doctor = {
  getPatients: () => apiCall('/doctor/patients', 'GET'),
  getScreenings: (childId) => apiCall(`/doctor/patients/${childId}/screenings`, 'GET'),
  addRemarks: (id, data) => apiCall(`/doctor/screenings/${id}/remarks`, 'PUT', data),
  markReviewed: (screeningId) => apiCall(`/doctor/screenings/${screeningId}/review`, 'PUT'),
  getStats: () => apiCall('/doctor/stats', 'GET'),
};

export const admin = {
  getUsers: () => apiCall('/admin/users', 'GET'),
  toggleUser: (id) => apiCall(`/admin/users/${id}/toggle`, 'PUT'),
  deleteUser: (id) => apiCall(`/admin/users/${id}`, 'DELETE'),
  getAllScreenings: () => apiCall('/admin/screenings', 'GET'),
  getStats: () => apiCall('/admin/stats', 'GET'),
  getMonthly: () => apiCall('/admin/monthly', 'GET'),
  getActivityLog: () => apiCall('/admin/activity', 'GET'),
};

export const scan = {
  analyzeDrawing: (image) => apiCall('/scan/analyze-drawing', 'POST', { image }),
  analyzeFaceEye: (metrics) => apiCall('/scan/analyze-face-eye', 'POST', metrics),
  combinedReport: (payload) => apiCall('/scan/combined-report', 'POST', payload),
};
