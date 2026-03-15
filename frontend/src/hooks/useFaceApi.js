import { useState, useEffect } from 'react';
import * as faceapi from 'face-api.js';

export const useFaceApi = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = '/models';
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
        ]);
        setIsLoaded(true);
        console.log('Face-api models loaded');
      } catch (error) {
        console.error('Error loading face-api models:', error);
      }
    };
    loadModels();
  }, []);

  return isLoaded;
};
