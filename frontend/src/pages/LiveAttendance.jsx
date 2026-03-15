import { useState, useRef, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useFaceApi } from '../hooks/useFaceApi';
import { Loader2, Camera, ShieldCheck, AlertCircle, MapPin, WifiOff, RefreshCcw } from 'lucide-react';
import { openDB } from 'idb';

// Geofencing is now handled dynamically via sysSettings from backend

function LiveAttendance() {
  const isModelsLoaded = useFaceApi();
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);

  const [faceMatcher, setFaceMatcher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [livenessStatus, setLivenessStatus] = useState({});
  const [userLocation, setUserLocation] = useState(null);
  const [isWithinRange, setIsWithinRange] = useState(true);
  const [offlineCount, setOfflineCount] = useState(0);
  const [sysSettings, setSysSettings] = useState(null);

  const lastMarkedRef = useRef({}); 
  const processingRef = useRef(new Set()); 
  const blinkCountRef = useRef({});
  const eyeStatesRef = useRef({}); // Tracks if eyes were 'closed' in previous frame

  const beepSuccess = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
  const beepError = new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');

  // Initialize IndexedDB
  const initDB = async () => {
    return openDB('attendance-sync', 1, {
      upgrade(db) {
        db.createObjectStore('offline-logs', { keyPath: 'id', autoIncrement: true });
      },
    });
  };

  // Fetch Settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await axios.get('/api/settings');
        setSysSettings(data);
      } catch (error) {
        console.error("Settings fetch failed:", error);
      }
    };
    fetchSettings();
  }, []);

  // Geo-fencing check
  useEffect(() => {
    if (!navigator.geolocation || !sysSettings) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLocation({ lat: latitude, lng: longitude });

        const { officeLocation, allowedRadius } = sysSettings;

        const R = 6371e3; // metres
        const φ1 = latitude * Math.PI/180;
        const φ2 = officeLocation.lat * Math.PI/180;
        const Δφ = (officeLocation.lat-latitude) * Math.PI/180;
        const Δλ = (officeLocation.lng-longitude) * Math.PI/180;

        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;

        setIsWithinRange(distance <= allowedRadius);
      },
      (err) => console.error("Location error:", err),
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [sysSettings]);

  // Offline Sync Logic
  const syncOfflineLogs = useCallback(async () => {
    if (!navigator.onLine) return;
    
    const db = await initDB();
    const logs = await db.getAll('offline-logs');
    
    if (logs.length === 0) return;
    
    setLoading(true);
    toast.loading(`Syncing ${logs.length} offline records...`, { id: 'sync' });

    for (const log of logs) {
      try {
        await axios.post('/api/attendance/mark', { 
          employeeId: log.employeeId, 
          confidence: log.confidence,
          timestamp: log.timestamp // Allow backend to use historical time
        });
        await db.delete('offline-logs', log.id);
      } catch (err) {
        console.error("Sync failed for record:", log.id, err);
      }
    }
    
    const remaining = await db.count('offline-logs');
    setOfflineCount(remaining);
    setLoading(false);
    toast.success("Offline sync complete", { id: 'sync' });
  }, []);

  useEffect(() => {
    const handleOnline = () => syncOfflineLogs();
    window.addEventListener('online', handleOnline);
    // Initial check
    const checkOfflineCount = async () => {
      const db = await initDB();
      const count = await db.count('offline-logs');
      setOfflineCount(count);
    };
    checkOfflineCount();
    
    return () => window.removeEventListener('online', handleOnline);
  }, [syncOfflineLogs]);

  // Landmarking helper
  const getEAR = (eye) => {
    const v1 = Math.sqrt(Math.pow(eye[1].x - eye[5].x, 2) + Math.pow(eye[1].y - eye[5].y, 2));
    const v2 = Math.sqrt(Math.pow(eye[2].x - eye[4].x, 2) + Math.pow(eye[2].y - eye[4].y, 2));
    const h = Math.sqrt(Math.pow(eye[0].x - eye[3].x, 2) + Math.pow(eye[0].y - eye[3].y, 2));
    return (v1 + v2) / (2.0 * h);
  };

  useEffect(() => {
    const initMatcher = async () => {
      try {
        const { data } = await axios.get('/api/clients', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });

        if (data.length === 0) {
          toast.error("No clients registered in the system.");
          setLoading(false);
          return;
        }

        const labeledDescriptors = data.map(client => {
          return new faceapi.LabeledFaceDescriptors(
            client.employeeId,
            client.faceDescriptors.map(d => new Float32Array(d))
          );
        });

        setFaceMatcher(new faceapi.FaceMatcher(labeledDescriptors, 0.6));
        setLoading(false);
      } catch (error) {
        console.error('Error initializing face matcher:', error);
        toast.error("Failed to load client data");
      }
    };

    if (isModelsLoaded) initMatcher();
  }, [isModelsLoaded]);

  const markAttendance = async (employeeId, confidence) => {
    const now = Date.now();
    
    if (!isWithinRange) {
      toast.error("Outside authorized zone!", { id: 'geo-error', duration: 2000 });
      return;
    }

    if (processingRef.current.has(employeeId)) return;

    const lastTime = lastMarkedRef.current[employeeId] || 0;
    if (now - lastTime < 10000) return;

    processingRef.current.add(employeeId);
    
    try {
      await axios.post('/api/attendance/mark', { employeeId, confidence });
      lastMarkedRef.current[employeeId] = now;
      beepSuccess.play();
      toast.success(`Marked: ${employeeId}`, { duration: 3000 });
      setLivenessStatus(prev => ({ ...prev, [employeeId]: 'idle' }));
    } catch (error) {
      // Offline Handling
      if (!navigator.onLine || error.code === 'ERR_NETWORK') {
        const db = await initDB();
        await db.add('offline-logs', { 
          employeeId, 
          confidence, 
          timestamp: new Date().toISOString() 
        });
        setOfflineCount(prev => prev + 1);
        lastMarkedRef.current[employeeId] = now;
        toast("Saved offline (Sync pending)", { icon: '💾' });
        setLivenessStatus(prev => ({ ...prev, [employeeId]: 'idle' }));
      } else if (error.response?.status === 400) {
        const suppressUntil = 5 * 60 * 1000;
        if (now - lastTime > suppressUntil) {
          toast(error.response.data.message, { icon: 'ℹ️', duration: 4000 });
          lastMarkedRef.current[employeeId] = now;
        }
      } else {
        beepError.play();
        toast.error("Recognition Error");
      }
    } finally {
      processingRef.current.delete(employeeId);
    }
  };

  const handleRecognition = useCallback(async () => {
    if (
      webcamRef.current &&
      webcamRef.current.video.readyState === 4 &&
      faceMatcher &&
      canvasRef.current
    ) {
      const video = webcamRef.current.video;
      const canvas = canvasRef.current;
      const displaySize = { width: video.videoWidth, height: video.videoHeight };
      
      faceapi.matchDimensions(canvas, displaySize);

      const detections = await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptors();

      const resizedDetections = faceapi.resizeResults(detections, displaySize);
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      resizedDetections.forEach(detection => {
        const result = faceMatcher.findBestMatch(detection.descriptor);
        const box = detection.detection.box;
        const employeeId = result.label;
        
        if (employeeId === 'unknown') {
          ctx.strokeStyle = '#ef4444';
          ctx.strokeRect(box.x, box.y, box.width, box.height);
          ctx.fillStyle = '#ef4444';
          ctx.fillText('Unknown Identity', box.x, box.y - 10);
          return;
        }

        const landmarks = detection.landmarks;
        const leftEye = landmarks.getLeftEye();
        const rightEye = landmarks.getRightEye();
        const ear = (getEAR(leftEye) + getEAR(rightEye)) / 2;

        const status = livenessStatus[employeeId] || 'idle';
        
        const color = !isWithinRange ? '#64748b' : (status === 'verified' ? '#10b981' : '#f59e0b');
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.strokeRect(box.x, box.y, box.width, box.height);
        
        ctx.fillStyle = color;
        ctx.font = 'bold 16px Inter';
        const labelText = !isWithinRange ? 'OUTSIDE RADIUS' : (status === 'verified' ? `${employeeId} (Verified)` : `${employeeId} - PLEASE BLINK`);
        ctx.fillText(labelText, box.x, box.y - 10);
        
        // Debug EAR value
        if (isWithinRange && status !== 'verified') {
          ctx.fillStyle = '#ffffff';
          ctx.font = '12px Inter';
          ctx.fillText(`EAR: ${ear.toFixed(3)}`, box.x, box.y + box.height + 20);
        }

        if (isWithinRange) {
          if (status === 'verified') {
            markAttendance(employeeId, 1 - result.distance);
          } else {
            const threshold = 0.26; // More generous threshold
            const isClosed = ear < threshold;
            const prevState = eyeStatesRef.current[employeeId] || 'open';

            if (isClosed) {
              eyeStatesRef.current[employeeId] = 'closed';
            } else if (prevState === 'closed' && ear >= threshold + 0.02) {
              // Transition: Closed -> Open detected!
              eyeStatesRef.current[employeeId] = 'open';
              blinkCountRef.current[employeeId] = (blinkCountRef.current[employeeId] || 0) + 1;
              
              if (blinkCountRef.current[employeeId] >= 1) {
                setLivenessStatus(prev => ({ ...prev, [employeeId]: 'verified' }));
                blinkCountRef.current[employeeId] = 0;
                toast.success("Liveness Verified", { id: 'liveness-success' });
              }
            }
          }
        }
      });
    }
  }, [faceMatcher, livenessStatus, isWithinRange]);

  useEffect(() => {
    let interval;
    if (faceMatcher) {
      interval = setInterval(handleRecognition, 100);
    }
    return () => clearInterval(interval);
  }, [faceMatcher, handleRecognition]);

  return (
    <div className="flex flex-col h-screen bg-slate-900 overflow-hidden relative">
      <header className="z-10 bg-slate-900/80 backdrop-blur-md border-b border-white/10 p-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-primary-500 p-2 rounded-xl text-white">
            <ShieldCheck size={24} />
          </div>
          <h1 className="text-xl font-bold text-white uppercase tracking-wider">Live Attendance System</h1>
        </div>
        <div className="flex items-center gap-6">
          {offlineCount > 0 && (
            <div className="flex items-center gap-2 bg-primary-500/20 text-primary-400 px-3 py-1 rounded-full text-xs font-bold border border-primary-500/30">
              <WifiOff size={14} />
              <span>{offlineCount} Pending Sync</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <MapPin size={18} className={isWithinRange ? 'text-emerald-500' : 'text-rose-500'} />
            <span className={`text-sm font-bold ${isWithinRange ? 'text-emerald-500' : 'text-rose-500'}`}>
              {isWithinRange ? 'In Range' : 'Out of Bounds'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${loading ? 'bg-orange-500 animate-pulse' : 'bg-emerald-500'}`}></div>
            <span className="text-slate-300 text-sm font-medium">{loading ? 'Processing...' : 'System Active'}</span>
          </div>
        </div>
      </header>

      <div className="flex-1 relative flex items-center justify-center p-8">
        <div className="relative w-full max-w-4xl aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-800">
          {!isModelsLoaded || loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white gap-4">
              <Loader2 className="animate-spin text-primary-500" size={48} />
              <p className="text-lg font-medium opacity-80">
                {offlineCount > 0 ? `Syncing Cache (${offlineCount})...` : 'Loading AI Engine...'}
              </p>
            </div>
          ) : (
            <>
              <Webcam ref={webcamRef} audio={false} className="w-full h-full object-cover" mirrored />
              <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
              <div className="absolute inset-0 pointer-events-none border-[20px] border-slate-900/20"></div>
              <div className="scanning-line"></div>
              
              <div className="absolute top-6 left-6 flex flex-col gap-2">
                <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 text-white flex items-center gap-2 text-sm">
                  <Camera size={16} className="text-primary-400" />
                  <span>Kiosk Mode Enabled</span>
                </div>
                {!isWithinRange && (
                  <div className="bg-rose-500/80 backdrop-blur-md px-4 py-2 rounded-full text-white flex items-center gap-2 text-xs font-bold animate-pulse">
                    <AlertCircle size={14} />
                    <span>Location Lock Failed</span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-full max-w-lg">
           <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-3xl text-center shadow-2xl">
              <div className="flex items-center justify-center gap-2 mb-2">
                <AlertCircle className="text-primary-400" size={20} />
                <p className="text-slate-300 text-sm font-medium">
                  {isWithinRange ? 'Please look directly into the camera' : 'Return to office zone to mark attendance'}
                </p>
              </div>
              <h2 className="text-white font-bold text-lg tracking-wide uppercase">
                {isWithinRange ? 'AI Biometric Identity Scanning' : 'Geo-Fence Active'}
              </h2>
           </div>
        </div>
      </div>
    </div>
  );
}

export default LiveAttendance;
