"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type CameraStatus = "idle" | "requesting" | "live" | "denied" | "unavailable" | "captured";

/**
 * Front camera for the demo selfie step. The stream is attached to a <video>,
 * one frame is drawn to a canvas on capture, and both are torn down on
 * unmount. Nothing is uploaded or persisted: the frame lives only in the
 * component that rendered it.
 */
export function useDemoCamera() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<CameraStatus>("idle");
  const [snapshotUrl, setSnapshotUrl] = useState<string | null>(null);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  useEffect(() => stop, [stop]);

  const start = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setStatus("unavailable");
      return;
    }
    setStatus("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 640 } }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => undefined);
      }
      setStatus("live");
    } catch (error) {
      const denied = error instanceof DOMException && (error.name === "NotAllowedError" || error.name === "SecurityError");
      setStatus(denied ? "denied" : "unavailable");
    }
  }, []);

  /** Freeze one frame in the viewfinder, then release the camera. */
  const capture = useCallback(() => {
    const video = videoRef.current;
    if (video && video.videoWidth > 0) {
      const size = Math.min(video.videoWidth, video.videoHeight);
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const context = canvas.getContext("2d");
      if (context) {
        context.translate(size, 0);
        context.scale(-1, 1);
        context.drawImage(video, (video.videoWidth - size) / 2, (video.videoHeight - size) / 2, size, size, 0, 0, size, size);
        setSnapshotUrl(canvas.toDataURL("image/jpeg", 0.8));
      }
    }
    stop();
    setStatus("captured");
  }, [stop]);

  return { videoRef, status, snapshotUrl, start, capture, stop };
}
