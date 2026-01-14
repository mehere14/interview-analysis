
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from './Button';

interface VideoRecorderProps {
  onRecordingComplete: (frames: string[]) => void;
  isRecording: boolean;
  setIsRecording: (recording: boolean) => void;
}

export const VideoRecorder: React.FC<VideoRecorderProps> = ({ 
  onRecordingComplete, 
  isRecording, 
  setIsRecording 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const capturedFrames = useRef<string[]>([]);
  const frameInterval = useRef<number | null>(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: 640, height: 480 },
        audio: true 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Please grant camera/microphone permissions to continue.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const captureFrame = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, 640, 480);
        const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.6);
        capturedFrames.current.push(dataUrl);
      }
    }
  }, []);

  const handleToggleRecording = () => {
    if (isRecording) {
      // Stop
      if (frameInterval.current) {
        window.clearInterval(frameInterval.current);
      }
      setIsRecording(false);
      // We send up to 10 evenly spaced frames to Gemini to stay within limits
      const total = capturedFrames.current.length;
      const sampleSize = 8;
      const sampled = [];
      if (total > sampleSize) {
        for (let i = 0; i < sampleSize; i++) {
          sampled.push(capturedFrames.current[Math.floor((i * total) / sampleSize)]);
        }
      } else {
        sampled.push(...capturedFrames.current);
      }
      onRecordingComplete(sampled);
    } else {
      // Start
      capturedFrames.current = [];
      setIsRecording(true);
      frameInterval.current = window.setInterval(captureFrame, 1000); // 1 frame per second
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-2xl">
      <div className="relative rounded-2xl overflow-hidden bg-black aspect-video w-full shadow-2xl border-4 border-indigo-100">
        <video 
          ref={videoRef} 
          autoPlay 
          muted 
          playsInline 
          className="w-full h-full object-cover scale-x-[-1]"
        />
        {isRecording && (
          <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-full animate-pulse text-sm font-bold">
            <div className="w-2 h-2 bg-white rounded-full"></div>
            REC
          </div>
        )}
        <canvas ref={canvasRef} width="640" height="480" className="hidden" />
      </div>
      
      <div className="flex gap-4">
        <Button 
          variant={isRecording ? 'danger' : 'primary'}
          onClick={handleToggleRecording}
          className="w-48 h-12 text-lg"
        >
          {isRecording ? (
            <><i className="fa-solid fa-stop"></i> Finish Answer</>
          ) : (
            <><i className="fa-solid fa-microphone"></i> Start Answer</>
          )}
        </Button>
      </div>
    </div>
  );
};
