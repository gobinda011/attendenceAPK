import axios from 'axios';

// Section 37: Local Development Architecture.
// This MUST be the PC's LAN IP (e.g. http:// 192.168.68.113:5000), never
// "localhost" — on the phone, localhost refers to the phone itself, not
// the computer running the backend. Update this before running on a device.
export const API_BASE_URL = 'http://192.168.68.103:5000/api';
const client = axios.create({ baseURL: API_BASE_URL, timeout: 15000 });

export default client;
