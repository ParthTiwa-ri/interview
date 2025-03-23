"use client";

import { useState, useRef } from "react";
import { useInterviewContext } from "../context/InterviewContext";

const AudioRecorder = ({ questionId, onAnswerChange }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/wav" });
        await transcribeAudio(audioBlob);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      setError("Error accessing microphone: " + err.message);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const transcribeAudio = async (audioBlob) => {
    setIsTranscribing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("audio", audioBlob);

      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Transcription failed");
      }

      const data = await response.json();
      onAnswerChange(questionId, data.text);
    } catch (err) {
      setError("Error transcribing audio: " + err.message);
    } finally {
      setIsTranscribing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isTranscribing}
          className={`px-6 py-3 rounded-full font-medium transition-all duration-200 ${
            isRecording
              ? "bg-red-500 hover:bg-red-600 text-white"
              : "bg-blue-500 hover:bg-blue-600 text-white"
          } ${isTranscribing ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {isRecording ? (
            <div className="flex items-center">
              <div className="w-3 h-3 bg-white rounded-full animate-pulse mr-2"></div>
              Stop Recording
            </div>
          ) : isTranscribing ? (
            "Transcribing..."
          ) : (
            "Start Recording"
          )}
        </button>
      </div>

      {error && (
        <div className="text-red-500 text-sm mt-2">{error}</div>
      )}
    </div>
  );
};

export default AudioRecorder; 