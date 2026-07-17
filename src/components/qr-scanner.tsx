"use client";

import { BrowserQRCodeReader, type IScannerControls } from "@zxing/browser";
import { Camera, CameraOff, Keyboard, ScanLine } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

export function QrScanner({
  onResult,
  onCameraDenied,
  prompt = "Scan a Unisky Pass QR code",
}: {
  onResult: (value: string) => void;
  onCameraDenied?: () => void;
  prompt?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const startGenerationRef = useRef(0);
  const mountedRef = useRef(true);
  const handledResultRef = useRef(false);
  const [running, setRunning] = useState(false);
  const [starting, setStarting] = useState(false);
  const [manual, setManual] = useState("");
  const [showManual, setShowManual] = useState(false);
  const [error, setError] = useState<string>();

  const stop = () => {
    startGenerationRef.current += 1;
    controlsRef.current?.stop();
    controlsRef.current = null;
    if (mountedRef.current) {
      setRunning(false);
      setStarting(false);
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      startGenerationRef.current += 1;
      controlsRef.current?.stop();
      controlsRef.current = null;
      BrowserQRCodeReader.releaseAllStreams();
    };
  }, []);

  async function start() {
    if (!videoRef.current || running || starting) return;
    const generation = ++startGenerationRef.current;
    handledResultRef.current = false;
    setError(undefined);
    setStarting(true);
    try {
      const reader = new BrowserQRCodeReader(undefined, { delayBetweenScanAttempts: 180 });
      const controls = await reader.decodeFromConstraints(
        { video: { facingMode: { ideal: "environment" } }, audio: false },
        videoRef.current,
        (result, scanError, activeControls) => {
          if (result && !handledResultRef.current) {
            handledResultRef.current = true;
            activeControls.stop();
            controlsRef.current = null;
            if (mountedRef.current) setRunning(false);
            onResult(result.getText());
          }
          if (scanError?.name === "NotAllowedError") {
            setError("Camera permission was denied. Allow camera access and try again.");
            onCameraDenied?.();
          }
        },
      );
      if (!mountedRef.current || generation !== startGenerationRef.current) {
        controls.stop();
        return;
      }
      controlsRef.current = controls;
      setRunning(true);
    } catch (reason) {
      if (!mountedRef.current || generation !== startGenerationRef.current) return;
      const denied =
        reason instanceof DOMException &&
        (reason.name === "NotAllowedError" || reason.name === "SecurityError");
      setError(
        denied
          ? "Camera permission was denied. Allow camera access and try again."
          : "The camera could not start. Check that no other app is using it.",
      );
      if (denied) onCameraDenied?.();
      setRunning(false);
    } finally {
      if (mountedRef.current && generation === startGenerationRef.current) {
        setStarting(false);
      }
    }
  }

  return (
    <div>
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-ink bg-ink">
        <video ref={videoRef} muted playsInline className="h-full w-full object-cover" aria-label={prompt} />
        {!running ? (
          <div className="absolute inset-0 grid place-items-center bg-ink/90 p-6 text-center text-white">
            <div>
              <span className="mx-auto grid size-14 place-items-center rounded-2xl border border-white/20 bg-white/8"><ScanLine className="size-7 text-lime" /></span>
              <p className="mt-4 text-sm font-semibold">{prompt}</p>
              <Button className="mt-4" onClick={start} disabled={starting}>
                <Camera className="size-4" /> {starting ? "Starting camera…" : "Start camera"}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="pointer-events-none absolute inset-[14%] rounded-2xl border-2 border-lime shadow-[0_0_0_999px_rgb(17_18_23/38%)]" />
            <Button variant="secondary" size="sm" className="absolute right-3 bottom-3" onClick={stop}><CameraOff className="size-4" /> Stop</Button>
          </>
        )}
      </div>
      {error ? <p role="alert" className="mt-3 text-sm font-medium text-danger">{error}</p> : null}
      <button type="button" className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-violet underline underline-offset-4" onClick={() => setShowManual((current) => !current)}>
        <Keyboard className="size-4" /> {showManual ? "Hide manual entry" : "Paste payload instead"}
      </button>
      {showManual ? (
        <form
          className="mt-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (manual.trim()) onResult(manual.trim());
          }}
        >
          <label htmlFor="manual-qr-payload" className="sr-only">QR payload</label>
          <textarea
            id="manual-qr-payload"
            value={manual}
            onChange={(event) => setManual(event.target.value)}
            placeholder="usp1.…"
            rows={3}
            className="w-full resize-none rounded-xl border border-line bg-white p-3 font-mono text-xs focus:border-violet focus:outline-none focus:ring-4 focus:ring-violet/10"
          />
          <Button type="submit" size="sm" className="mt-2" disabled={!manual.trim()}>Use payload</Button>
        </form>
      ) : null}
    </div>
  );
}
