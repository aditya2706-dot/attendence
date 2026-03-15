import { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useFaceApi } from '../hooks/useFaceApi';
import { Camera, Save, User, Hash, School, Loader2, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

function Register() {
  const isModelsLoaded = useFaceApi();
  const webcamRef = useRef(null);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    employeeId: '',
    department: ''
  });

  const [isCapturing, setIsCapturing] = useState(false);
  const [descriptors, setDescriptors] = useState([]);
  const [progress, setProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const captureRequired = 5;

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const applyGuestTemplate = () => {
    const guestId = `GUEST-${Math.floor(1000 + Math.random() * 9000)}`;
    setFormData({
      name: '',
      employeeId: guestId,
      department: 'Visitors'
    });
    toast.success('Guest Template Applied');
  };

  const startRegistration = async () => {
    if (!formData.name || !formData.employeeId || !formData.department) {
      return toast.error('Please fill name before starting');
    }
    setIsCapturing(true);
    setDescriptors([]);
    setProgress(0);
  };

  useEffect(() => {
    let interval;
    if (isCapturing && descriptors.length < captureRequired) {
      interval = setInterval(async () => {
        if (webcamRef.current && isModelsLoaded) {
          const video = webcamRef.current.video;
          const detection = await faceapi.detectSingleFace(
            video, 
            new faceapi.TinyFaceDetectorOptions()
          ).withFaceLandmarks().withFaceDescriptor();

          if (detection) {
            setDescriptors(prev => {
              const newDescriptors = [...prev, Array.from(detection.descriptor)];
              setProgress((newDescriptors.length / captureRequired) * 100);
              if (newDescriptors.length === captureRequired) {
                setIsCapturing(false);
                toast.success('Face data captured successfully!');
              }
              return newDescriptors;
            });
          }
        }
      }, 800);
    }
    return () => clearInterval(interval);
  }, [isCapturing, descriptors, isModelsLoaded]);

  const handleSubmit = async () => {
    if (descriptors.length < captureRequired) {
      return toast.error(`Please capture at least ${captureRequired} images`);
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/clients', {
        ...formData,
        faceDescriptors: descriptors
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Client registered successfully!');
      navigate('/clients');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <header className="mb-8 p-0">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">New Client Registration</h1>
            <p className="text-slate-500 mt-2">Enter details and capture face data for biometric identification.</p>
          </div>
          <button 
            onClick={applyGuestTemplate}
            className="px-4 py-2 bg-amber-50 text-amber-600 border border-amber-200 rounded-xl text-sm font-bold hover:bg-amber-100 transition-colors flex items-center gap-2"
          >
            <User size={16} />
            Quick Guest Pass
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="card space-y-6">
            <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-4">Personal Details</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-600 mb-2 block">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    name="name"
                    required
                    placeholder="E.g. John Doe"
                    className="input-field pl-11"
                    value={formData.name}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-600 mb-2 block">Employee / Roll ID</label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    name="employeeId"
                    required
                    placeholder="E.g. EMP-001"
                    className="input-field pl-11"
                    value={formData.employeeId}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-600 mb-2 block">Department</label>
                <div className="relative">
                  <School className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    name="department"
                    required
                    placeholder="E.g. Computer Science"
                    className="input-field pl-11"
                    value={formData.department}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-primary-50 border-primary-100">
            <h3 className="text-lg font-bold text-primary-800 mb-2">Instructions</h3>
            <ul className="text-sm text-primary-700 space-y-2 list-disc ml-5">
              <li>Ensure good lighting on the face.</li>
              <li>Stay within the camera frame.</li>
              <li>Look directly at the camera.</li>
              <li>Wait for the capture progress to reach 100%.</li>
            </ul>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card overflow-hidden bg-slate-900 aspect-video relative flex items-center justify-center">
            {isModelsLoaded ? (
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                className="w-full h-full object-cover rounded-xl"
                mirrored
              />
            ) : (
              <div className="text-white text-center">
                <Loader2 className="animate-spin mx-auto mb-2 text-primary-500" size={32} />
                <p>Loading AI Models...</p>
              </div>
            )}
            
            {isCapturing && (
              <div className="absolute inset-0 border-4 border-primary-500 animate-pulse pointer-events-none">
                <div className="scanning-line"></div>
              </div>
            )}

            {progress === 100 && !isCapturing && (
              <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center backdrop-blur-[2px]">
                <div className="bg-white p-4 rounded-2xl flex items-center gap-3 shadow-2xl">
                  <CheckCircle2 className="text-emerald-500" size={24} />
                  <span className="font-bold text-slate-800">Face Captured</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <motion.div 
                className="bg-primary-500 h-full"
                animate={{ width: `${progress}%` }}
              />
            </div>
            
            <div className="flex gap-4">
              <button
                disabled={!isModelsLoaded || isCapturing || progress === 100}
                onClick={startRegistration}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                <Camera size={20} />
                {isCapturing ? 'Capturing...' : 'Start Capture'}
              </button>

              <button
                disabled={progress < 100 || submitting}
                onClick={handleSubmit}
                className="bg-slate-800 hover:bg-slate-900 text-white font-semibold py-2 px-6 rounded-lg transition-all active:scale-95 flex items-center justify-center gap-2 flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                <span>Save Client</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
