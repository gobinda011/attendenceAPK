import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import client from '../api/client';

// FR-003: Face Registration workflow (Admin -> Select Employee -> Camera ->
// Face Detection -> Quality Validation -> Embedding Generation -> Storage).
// This page drives the browser webcam directly; a native admin app could
// substitute a device camera the same way.
export default function FaceRegistration() {
  const { id } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [status, setStatus] = useState('idle'); // idle | streaming | submitting | success | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    let stream;
    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { width: 480, height: 360 } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setStatus('streaming');
        }
      } catch (err) {
        setStatus('error');
        setMessage('Camera access denied or unavailable.');
      }
    }
    startCamera();
    return () => stream?.getTracks().forEach((t) => t.stop());
  }, []);

  async function capture() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);

    canvas.toBlob(async (blob) => {
      setStatus('submitting');
      setMessage('');
      const form = new FormData();
      form.append('image', blob, 'face.jpg');
      form.append('label', 'primary');
      try {
        await client.post(`/employees/${id}/register-face`, form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setStatus('success');
        setMessage('Face registered successfully.');
      } catch (err) {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Registration failed. Try better lighting and one clear face.');
      }
    }, 'image/jpeg', 0.9);
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Register face — {id}</h1>
          <p className="sub">Center one face in the frame, then capture</p>
        </div>
      </div>

      <div className="panel" style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        <div>
          <video ref={videoRef} autoPlay playsInline className="camera-frame" style={{ objectFit: 'cover' }} />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          <div style={{ marginTop: 12 }}>
            <button className="btn" onClick={capture} disabled={status === 'submitting' || status === 'error' && message.includes('Camera')}>
              {status === 'submitting' ? 'Processing…' : 'Capture & register'}
            </button>
          </div>
        </div>
        <div style={{ maxWidth: 320, fontSize: 14, color: 'var(--text-muted)' }}>
          <p>For best results:</p>
          <ul>
            <li>Ensure your face is clearly lit, no strong backlight</li>
            <li>Only one person in frame</li>
            <li>Face the camera directly</li>
            <li>Remove sunglasses / masks</li>
          </ul>
          {message && (
            <p className={status === 'success' ? '' : 'error-text'} style={{ color: status === 'success' ? 'var(--present)' : undefined }}>
              {message}
            </p>
          )}
          {status === 'success' && (
            <button className="btn secondary" onClick={() => navigate(`/employees/${id}`)}>Back to employee</button>
          )}
        </div>
      </div>
    </div>
  );
}


// import React, { useEffect, useRef, useState } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import client from '../api/client';

// // FR-003: Face Registration workflow.
// // Supports:
// // 1. Use Camera
// // 2. Add Photo -> Choose from file
// export default function FaceRegistration() {
//   const { id } = useParams();
//   const navigate = useNavigate();

//   const videoRef = useRef(null);
//   const canvasRef = useRef(null);
//   const fileInputRef = useRef(null);

//   const [status, setStatus] = useState('idle');
//   const [message, setMessage] = useState('');

//   useEffect(() => {
//     let stream;

//     async function startCamera() {
//       try {
//         stream = await navigator.mediaDevices.getUserMedia({
//           video: { width: 480, height: 360 },
//         });

//         if (videoRef.current) {
//           videoRef.current.srcObject = stream;
//           setStatus('streaming');
//         }
//       } catch (err) {
//         setStatus('error');
//         setMessage('Camera access denied or unavailable.');
//       }
//     }

//     startCamera();

//     return () => stream?.getTracks().forEach((t) => t.stop());
//   }, []);

//   // Existing camera registration flow
//   async function capture() {
//     const video = videoRef.current;
//     const canvas = canvasRef.current;

//     canvas.width = video.videoWidth;
//     canvas.height = video.videoHeight;

//     canvas.getContext('2d').drawImage(video, 0, 0);

//     canvas.toBlob(async (blob) => {
//       await registerFace(blob, 'face.jpg');
//     }, 'image/jpeg', 0.9);
//   }

//   // TEMPORARY TESTING FEATURE
//   // PHOTO UPLOAD — REMOVE WHEN EXTERNAL CAMERA IS AVAILABLE
//   function choosePhoto() {
//     fileInputRef.current?.click();
//   }

//   // TEMPORARY TESTING FEATURE
//   // PHOTO UPLOAD — REMOVE WHEN EXTERNAL CAMERA IS AVAILABLE
//   async function handlePhotoSelected(event) {
//     const file = event.target.files?.[0];

//     if (!file) return;

//     setMessage('');

//     await registerFace(file, file.name);

//     // Allows selecting the same image again later
//     event.target.value = '';
//   }

//   // Common registration function used by both camera and photo upload
//   async function registerFace(imageBlob, filename) {
//     setStatus('submitting');
//     setMessage('');

//     const form = new FormData();
//     form.append('image', imageBlob, filename);
//     form.append('label', 'primary');

//     try {
//       await client.post(`/employees/${id}/register-face`, form, {
//         headers: { 'Content-Type': 'multipart/form-data' },
//       });

//       setStatus('success');
//       setMessage('Face registered successfully.');
//     } catch (err) {
//       setStatus('error');
//       setMessage(
//         err.response?.data?.message ||
//           'Registration failed. Try better lighting and one clear face.'
//       );
//     }
//   }

//   return (
//     <div>
//       <div className="page-header">
//         <div>
//           <h1>Register face — {id}</h1>
//           <p className="sub">
//             Use the camera or add a photo with one clear face
//           </p>
//         </div>
//       </div>

//       <div
//         className="panel"
//         style={{
//           display: 'flex',
//           gap: 24,
//           alignItems: 'flex-start',
//         }}
//       >
//         <div>
//           {/* Camera preview */}
//           <video
//             ref={videoRef}
//             autoPlay
//             playsInline
//             className="camera-frame"
//             style={{ objectFit: 'cover' }}
//           />

//           <canvas
//             ref={canvasRef}
//             style={{ display: 'none' }}
//           />

//           {/* Hidden file picker */}
//           <input
//             ref={fileInputRef}
//             type="file"
//             accept="image/*"
//             style={{ display: 'none' }}
//             onChange={handlePhotoSelected}
//           />

//           {/* Registration options */}
//           <div
//             style={{
//               marginTop: 16,
//               display: 'flex',
//               flexDirection: 'column',
//               gap: 10,
//               width: 220,
//             }}
//           >
//             <button
//               className="btn"
//               onClick={capture}
//               disabled={
//                 status === 'submitting' ||
//                 (status === 'error' && message.includes('Camera'))
//               }
//             >
//               {status === 'submitting'
//                 ? 'Processing…'
//                 : '📷 Use Camera'}
//             </button>

//             {/* TEMPORARY TESTING FEATURE */}
//             {/* PHOTO UPLOAD — REMOVE WHEN EXTERNAL CAMERA IS AVAILABLE */}
//             <button
//               className="btn secondary"
//               onClick={choosePhoto}
//               disabled={status === 'submitting'}
//             >
//               🖼️ Add Photo
//             </button>
//           </div>
//         </div>

//         <div
//           style={{
//             maxWidth: 320,
//             fontSize: 14,
//             color: 'var(--text-muted)',
//           }}
//         >
//           <p>For best results:</p>

//           <ul>
//             <li>Ensure your face is clearly lit, no strong backlight</li>
//             <li>Only one person in frame</li>
//             <li>Face the camera directly</li>
//             <li>Remove sunglasses / masks</li>
//           </ul>

//           {message && (
//             <p
//               className={
//                 status === 'success' ? '' : 'error-text'
//               }
//               style={{
//                 color:
//                   status === 'success'
//                     ? 'var(--present)'
//                     : undefined,
//               }}
//             >
//               {message}
//             </p>
//           )}

//           {status === 'success' && (
//             <button
//               className="btn secondary"
//               onClick={() => navigate(`/employees/${id}`)}
//             >
//               Back to employee
//             </button>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }