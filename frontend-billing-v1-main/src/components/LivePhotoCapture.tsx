import React, { useRef, useState, useEffect } from "react";

interface LivePhotoCaptureProps {
  onCapture: (file: File, preview: string) => void;
  captured: boolean;
}

export const LivePhotoCapture: React.FC<LivePhotoCaptureProps> = ({
  onCapture,
  captured,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  // Start webcam
  const openCamera = async () => {
    setError(null);
    setIsLoading(true);
    setIsOpen(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err: any) {
      setError(
        err.name === "NotAllowedError"
          ? "Camera permission denied. Please allow camera access and try again."
          : "Could not open camera. Make sure no other app is using it."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Stop webcam
  const closeCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsOpen(false);
    setCountdown(null);
    setError(null);
  };

  // Countdown then capture
  const startCountdown = () => {
    let count = 3;
    setCountdown(count);
    const interval = setInterval(() => {
      count -= 1;
      if (count === 0) {
        clearInterval(interval);
        setCountdown(null);
        capturePhoto();
      } else {
        setCountdown(count);
      }
    }, 1000);
  };

  // Capture frame from video → File
  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Mirror the image (selfie = mirrored video)
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `live_photo_${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
        const preview = canvas.toDataURL("image/jpeg");
        onCapture(file, preview);
        closeCamera();
      },
      "image/jpeg",
      0.92
    );
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  return (
    <div>
      <label className="block text-xs mb-1 dark:text-gray-300">
        Live Photo (Camera) *
      </label>

      {/* Trigger button */}
      <button
        type="button"
        onClick={openCamera}
        className="flex items-center gap-2 px-3 py-1.5 border rounded text-xs font-medium
          hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-500 dark:text-gray-300
          transition-colors duration-150"
      >
        📷 {captured ? "Retake Photo" : "Open Camera"}
      </button>

      {captured && !isOpen && (
        <p className="text-xs text-green-600 dark:text-green-400 mt-1">✓ Photo captured</p>
      )}

      {/* Camera Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b dark:border-gray-700">
              <span className="font-semibold text-sm dark:text-white">📷 Take Live Photo</span>
              <button
                type="button"
                onClick={closeCamera}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            {/* Video area */}
            <div className="relative bg-black" style={{ aspectRatio: "4/3" }}>
              {isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                  <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span className="text-white text-xs">Starting camera...</span>
                </div>
              )}

              {error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
                  <span className="text-3xl">🚫</span>
                  <p className="text-white text-sm">{error}</p>
                  <button
                    type="button"
                    onClick={openCamera}
                    className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-xs rounded-full"
                  >
                    Try Again
                  </button>
                </div>
              )}

              {/* Mirrored video preview */}
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                style={{ transform: "scaleX(-1)", display: isLoading || error ? "none" : "block" }}
                playsInline
                muted
              />

              {/* Face guide overlay */}
              {!isLoading && !error && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div
                    className="rounded-full border-2 border-white/50 border-dashed"
                    style={{ width: "45%", aspectRatio: "1" }}
                  />
                </div>
              )}

              {/* Countdown overlay */}
              {countdown !== null && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="text-white font-black drop-shadow-lg"
                    style={{ fontSize: "6rem", lineHeight: 1 }}>
                    {countdown}
                  </span>
                </div>
              )}
            </div>

            {/* Hidden canvas for capture */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Controls */}
            <div className="px-4 py-4 flex items-center justify-center gap-3">
              {!error && (
                <>
                  <button
                    type="button"
                    onClick={startCountdown}
                    disabled={isLoading || countdown !== null}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700
                      disabled:opacity-50 text-white text-sm font-semibold rounded-full
                      transition-colors duration-150"
                  >
                    {countdown !== null ? `Capturing in ${countdown}...` : "📸 Capture"}
                  </button>
                  <button
                    type="button"
                    onClick={capturePhoto}
                    disabled={isLoading || countdown !== null}
                    className="px-4 py-2.5 border dark:border-gray-600 dark:text-gray-300
                      text-sm rounded-full hover:bg-gray-50 dark:hover:bg-gray-700
                      disabled:opacity-50 transition-colors duration-150"
                  >
                    Instant
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={closeCamera}
                className="px-4 py-2.5 border dark:border-gray-600 dark:text-gray-300
                  text-sm rounded-full hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>

            <p className="text-center text-xs text-gray-400 pb-3">
              Position your face inside the circle, then click Capture
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
