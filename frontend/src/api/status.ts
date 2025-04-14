import axios from 'axios';

const API_BASE_URL = 'http://localhost:5001';

export interface StatusResponse {
  is_running: boolean;
  status: string;
  mode: string;
  last_updated: string;
  details: Record<string, any>;
}

export const fetchStatus = async (endpoint: string): Promise<StatusResponse> => {
  try {
    const response = await axios.get(`${API_BASE_URL}${endpoint}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching status:', error);
    throw error;
  }
};