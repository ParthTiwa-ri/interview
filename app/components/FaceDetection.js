"use client";

import { useState, useEffect, useRef } from "react";
import { AlertTriangle } from 'lucide-react';

const FaceDetection = ({ onMaxWarningsReached }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [isLookingAway, setIsLookingAway] = useState(false);
  const [warningCount, setWarningCount] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [faceapi, setFaceapi] = useState(null);
  
  const lookAwayTimerRef = useRef(null);
  const detectionsRef = useRef([]);
  const detectionIntervalRef = useRef(null);
  
  const MAX_WARNINGS = 3;
  const LOOK_AWAY_THRESHOLD = 2000; // 3 seconds threshold for looking away

  useEffect(() => {
    // Dynamically import face-api.js
    const loadFaceAPI = async () => {
      try {
        const faceApiModule = await import('face-api.js');
        setFaceapi(faceApiModule);
        return faceApiModule;
      } catch (error) {
        console.error('Error importing face-api.js:', error);
        return null;
      }
    };

    const loadModels = async () => {
      try {
        const faceApiModule = await loadFaceAPI();
        if (!faceApiModule) return;
        
        // Path to models - you may need to update this based on your project structure
        const MODEL_URL = '/models';
        
        // Load required face-api models
        await Promise.all([
          faceApiModule.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceApiModule.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceApiModule.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
        ]);
        
        setModelsLoaded(true);
        console.log('Face detection models loaded successfully');
      } catch (error) {
        console.error('Error loading face detection models:', error);
      }
    };

    loadModels();
    
    return () => {
      if (lookAwayTimerRef.current) {
        clearTimeout(lookAwayTimerRef.current);
      }
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (modelsLoaded) {
      setupCamera();
    }
  }, [modelsLoaded]);

  const setupCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "user" } 
      });
      
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        
        // Wait for video to be ready
        videoRef.current.addEventListener('play', startFaceDetection);
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      setPermissionDenied(true);
    }
  };

  const startFaceDetection = () => {
    if (!videoRef.current || !modelsLoaded || !faceapi) return;
    
    // Create canvas overlay for detection visualization
    if (canvasRef.current) {
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
    }

    // Simplify the detection logic for more reliability
    detectionIntervalRef.current = setInterval(async () => {
      if (videoRef.current && videoRef.current.readyState === 4) {
        try {
          // Detect faces with reduced thresholds for better sensitivity
          const detections = await faceapi.detectAllFaces(
            videoRef.current, 
            new faceapi.TinyFaceDetectorOptions({
              scoreThreshold: 0.3 // Lower threshold to detect faces more easily
            })
          );
          
          detectionsRef.current = detections;
          
          // Draw face detection box for visual feedback
          // if (canvasRef.current) {
          //   const displaySize = { 
          //     width: videoRef.current.videoWidth, 
          //     height: videoRef.current.videoHeight 
          //   };
          //   faceapi.matchDimensions(canvasRef.current, displaySize);
            
          //   const resizedDetections = faceapi.resizeResults(detections, displaySize);
          //   const ctx = canvasRef.current.getContext('2d');
          //   ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          //   faceapi.draw.drawDetections(canvasRef.current, resizedDetections);
          // }

          // Directly check if face is detected
          const faceDetected = detections.length > 0;
          console.log(`Face detected: ${faceDetected}`);
          
          // Update user attention state
          if (!faceDetected && !isLookingAway) {
            // User has started looking away
            console.log('User is looking away - starting timer');
            setIsLookingAway(true);
            
            // Start timer for look away threshold
            if (lookAwayTimerRef.current) {
              clearTimeout(lookAwayTimerRef.current);
            }
            
            lookAwayTimerRef.current = setTimeout(() => {
              console.log('Look away threshold reached - triggering warning');
              triggerWarning();
            }, LOOK_AWAY_THRESHOLD);
          } else if (faceDetected && isLookingAway) {
            // User has returned
            console.log('User returned - canceling timer');
            setIsLookingAway(false);
            
            // Clear the timer
            if (lookAwayTimerRef.current) {
              clearTimeout(lookAwayTimerRef.current);
              lookAwayTimerRef.current = null;
            }
          }
        } catch (error) {
          console.error("Face detection error:", error);
        }
      }
    }, 300); // Reduce interval for more responsive detection
  };

  // Add useEffect to handle reaching max warnings
  useEffect(() => {
    if (warningCount >= MAX_WARNINGS) {
      console.log('Max warnings reached, calling onMaxWarningsReached');
      onMaxWarningsReached();
      
      // Clean up resources
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
    }
  }, [warningCount, MAX_WARNINGS, onMaxWarningsReached, stream]);

  const triggerWarning = () => {
    console.log('Triggering warning');
    
    setWarningCount(prevCount => {
      const newCount = prevCount + 1;
      console.log(`Warning count increased to ${newCount}`);
      
      return newCount;
    });
    
    setShowWarning(true);
    
    // Reset looking away state so we can detect it again
    setIsLookingAway(false);
    
    // Hide warning after 3 seconds
    setTimeout(() => {
      setShowWarning(false);
    }, 3000);
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
      if (lookAwayTimerRef.current) {
        clearTimeout(lookAwayTimerRef.current);
      }
    };
  }, [stream]);

  if (permissionDenied) {
    return (
      <div className="bg-red-50 p-4 rounded-lg text-red-600">
        <div className="flex items-center mb-2">
          <AlertTriangle className="mr-2" />
          <strong>Camera access required</strong>
        </div>
        <p>Please allow camera access to continue with the interview. The system needs to verify you're not looking away during the interview.</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Webcam feed in top-right corner - moved further to the edge and made smaller */}
      <div className="absolute top-4 right-4 w-24 h-18 rounded-lg overflow-hidden border-2 border-blue-500 bg-gray-100 shadow-lg z-10">
        <video 
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        <canvas 
          ref={canvasRef} 
          className="absolute top-0 left-0 w-full h-full"
        />
      </div>
      
      {/* Warning display - moved to top of page */}
      {showWarning && (
        <div className="fixed top-0 left-1/2 transform -translate-x-1/2 bg-red-100 px-6 py-4 rounded-b-lg border-2 border-t-0 border-red-400 shadow-xl animate-pulse z-50 max-w-md">
          <div className="flex items-center text-red-700">
            <AlertTriangle size={24} className="mr-3 flex-shrink-0" />
            <div>
              <p className="font-bold text-lg">Warning {warningCount}/{MAX_WARNINGS}</p>
              <p className="text-base">Please keep looking at the camera. Looking away from the screen may result in termination of your interview.</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Warning count indicator - moved under webcam */}
      <div className="absolute top-24 right-4 bg-gray-100 px-3 py-1 rounded-md text-xs font-medium border border-gray-300">
        Warnings: {warningCount}/{MAX_WARNINGS}
      </div>

      {/* Status indicator - moved to right side and made more compact */}
      <div className={`absolute top-32 right-4 px-2 py-1 rounded-md text-xs font-medium flex items-center ${isLookingAway ? 'bg-red-100 text-red-700 border border-red-300' : 'bg-green-100 text-green-700 border border-green-300'}`}>
        <div className={`w-2 h-2 rounded-full mr-1 ${isLookingAway ? 'bg-red-500' : 'bg-green-500'}`}></div>
        {isLookingAway ? 'Looking away' : 'Face detected'}
      </div>
    </div>
  );
};

export default FaceDetection; 