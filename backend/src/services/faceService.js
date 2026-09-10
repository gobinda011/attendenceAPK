const axios = require('axios');
const env = require('../config/environment');

// This is the ONLY module in the backend that talks to the Python AI service.
// It exists so that identity verification stays cleanly separated from
// business rules (Section 48: "AI identifies the person; the backend decides
// whether the attendance action is valid").

const client = axios.create({ baseURL: env.faceServiceUrl, timeout: 10000 });

/**
 * Sends a face image to the AI service to generate + store an embedding
 * for a specific employee (FR-003).
 */
async function registerFace(employeeId, imageBuffer, label = 'primary') {
  const form = new (require('form-data'))();
  form.append('employee_id', employeeId);
  form.append('label', label);
  form.append('image', imageBuffer, { filename: 'face.jpg' });

  const { data } = await client.post('/api/face/register', form, {
    headers: form.getHeaders(),
  });
  return data; // { success, embedding, quality }
}

/**
 * Sends a captured face image + the full set of registered embeddings to
 * the AI service, and gets back the best match and its confidence score
 * (FR-004). The backend never trusts a bare employeeId from the client -
 * it always re-derives identity from the image itself.
 */
async function recognizeFace(imageBuffer, registeredEmployees) {
  const form = new (require('form-data'))();
  form.append('image', imageBuffer, { filename: 'capture.jpg' });
  form.append('registered_employees', JSON.stringify(registeredEmployees));

  const { data } = await client.post('/api/face/recognize', form, {
    headers: form.getHeaders(),
  });
  return data; // { matched, employeeId, confidence }
}

module.exports = { registerFace, recognizeFace };
