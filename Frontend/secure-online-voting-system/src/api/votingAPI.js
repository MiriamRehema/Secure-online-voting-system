import axios from "axios";

const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";



export const studentLogin = async (regNumber, password) => {
  const res = await axios.post(`${BASE_URL}/students/login`, {
    regNumber,
    password
  });
  return res.data; 
};

export const verifyFace = async (studentId, faceDescriptor) => {
  const res = await axios.post(`${BASE_URL}/students/verify-face`, {
    studentId,
    faceDescriptor  
  });
  return res.data; 
};


export const castVote = async (token, candidateId) => {
  const res = await axios.post(
    `${BASE_URL}/votes/cast-vote`,
    { candidate_id: candidateId },
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );
  return res.data;
};


export const getCandidates = async () => {
  const res = await axios.get(`${BASE_URL}/candidates`);
  return res.data;
};


export const getResults = async () => {
  const res = await axios.get(`${BASE_URL}/results`);
  return res.data;
};


export const adminLogin = async (regNumber, password) => {
  const res = await axios.post(`${BASE_URL}/auth/admin-login`, {
    regNumber,
    password
  });
  return res.data.token;
};

export const getAdminStats = async (token) => {
  const res = await axios.get(`${BASE_URL}/admin/stats`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const startVotingSession = async (token) => {
  const res = await axios.post(`${BASE_URL}/admin/start-session`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const endVotingSession = async (token) => {
  const res = await axios.post(`${BASE_URL}/admin/end-session`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const publishResults = async (token) => {
  const res = await axios.post(`${BASE_URL}/admin/publish-results`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const getAuditLogs = async (token) => {
  const res = await axios.get(`${BASE_URL}/admin/audit-logs`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};