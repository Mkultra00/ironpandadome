import { useState, useRef, useCallback } from "react";

const SILENCE_THRESHOLD = 0.015; // RMS threshold for "silence"
const SILENCE_TIMEOUT_MS = 2000; // Auto-stop after 2s of silence
const MAX_RECORDING_MS = 30000; // Max 30 seconds to avoid compute limits

export const useElevenLabsSTT = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);
  const stopResolverRef = useRef<((transcript: string) => void) | null>(null);
  const isStoppingRef = useRef(false);
  const speechDetectedRef = useRef(false);

  const clearSilenceDetection = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (maxTimerRef.current) {
      clearTimeout(maxTimerRef.current);
      maxTimerRef.current = null;
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const transcribeAudio = useCallback(async (audioBlob: Blob): Promise<string> => {
    const formData = new FormData();
    formData.append("audio", audioBlob, "recording.webm");

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-stt`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: formData,
      }
    );

    if (!response.ok) throw new Error(`STT failed: ${response.status}`);
    const data = await response.json();
    return data.text || "";
  }, []);

  const stopRecording = useCallback(async (): Promise<string> => {
    return new Promise((resolve, reject) => {
      const mediaRecorder = mediaRecorderRef.current;
      if (!mediaRecorder || isStoppingRef.current) {
        reject(new Error("No active recording"));
        return;
      }

      isStoppingRef.current = true;
      clearSilenceDetection();

      mediaRecorder.onstop = async () => {
        setIsRecording(false);

        mediaRecorder.stream.getTracks().forEach((t) => t.stop());
        if (audioContextRef.current) {
          audioContextRef.current.close();
          audioContextRef.current = null;
        }

        if (!speechDetectedRef.current) {
          // No speech was detected — skip transcription
          isStoppingRef.current = false;
          resolve("");
          return;
        }

        setIsTranscribing(true);
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });

        try {
          const text = await transcribeAudio(audioBlob);
          setIsTranscribing(false);
          isStoppingRef.current = false;
          resolve(text);
        } catch (e) {
          setIsTranscribing(false);
          isStoppingRef.current = false;
          reject(e);
        }
      };

      mediaRecorder.stop();
    });
  }, [clearSilenceDetection, transcribeAudio]);

  const startRecording = useCallback(
    async (onAutoStop?: (transcript: string) => void) => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
        mediaRecorderRef.current = mediaRecorder;
        chunksRef.current = [];
        isStoppingRef.current = false;
        speechDetectedRef.current = false;

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };

        // Set up silence detection with Web Audio API
        const audioContext = new AudioContext();
        audioContextRef.current = audioContext;
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 512;
        source.connect(analyser);
        analyserRef.current = analyser;

        const dataArray = new Float32Array(analyser.fftSize);
        let lastSpeechTime = Date.now();

        const checkSilence = () => {
          if (!analyserRef.current || isStoppingRef.current) return;
          analyser.getFloatTimeDomainData(dataArray);

          // Calculate RMS
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i] * dataArray[i];
          }
          const rms = Math.sqrt(sum / dataArray.length);

          if (rms > SILENCE_THRESHOLD) {
            lastSpeechTime = Date.now();
            speechDetectedRef.current = true;
          }

          const silenceDuration = Date.now() - lastSpeechTime;
          if (silenceDuration >= SILENCE_TIMEOUT_MS && !isStoppingRef.current) {
            // Auto-stop after 3s silence
            isStoppingRef.current = true;
            clearSilenceDetection();

            mediaRecorder.onstop = async () => {
              setIsRecording(false);
              setIsTranscribing(true);
              mediaRecorder.stream.getTracks().forEach((t) => t.stop());
              if (audioContextRef.current) {
                audioContextRef.current.close();
                audioContextRef.current = null;
              }
              const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
              try {
                const text = await transcribeAudio(audioBlob);
                setIsTranscribing(false);
                isStoppingRef.current = false;
                onAutoStop?.(text);
              } catch (e) {
                setIsTranscribing(false);
                isStoppingRef.current = false;
                console.error("Auto-stop transcription error:", e);
              }
            };
            mediaRecorder.stop();
            return;
          }

          rafRef.current = requestAnimationFrame(checkSilence);
        };

        mediaRecorder.start();
        setIsRecording(true);

        // Safety: auto-stop after max duration to prevent oversized audio
        maxTimerRef.current = setTimeout(() => {
          if (!isStoppingRef.current && mediaRecorder.state === "recording") {
            console.log("Max recording duration reached, auto-stopping");
            isStoppingRef.current = true;
            clearSilenceDetection();
            mediaRecorder.onstop = async () => {
              setIsRecording(false);
              setIsTranscribing(true);
              mediaRecorder.stream.getTracks().forEach((t) => t.stop());
              if (audioContextRef.current) {
                audioContextRef.current.close();
                audioContextRef.current = null;
              }
              const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
              try {
                const text = await transcribeAudio(audioBlob);
                setIsTranscribing(false);
                isStoppingRef.current = false;
                onAutoStop?.(text);
              } catch (e) {
                setIsTranscribing(false);
                isStoppingRef.current = false;
                console.error("Max-duration transcription error:", e);
              }
            };
            mediaRecorder.stop();
          }
        }, MAX_RECORDING_MS);

        // Start silence detection after a short delay to let user begin speaking
        setTimeout(() => {
          rafRef.current = requestAnimationFrame(checkSilence);
        }, 500);
      } catch (e) {
        console.error("Mic access error:", e);
        throw new Error("Microphone access denied");
      }
    },
    [clearSilenceDetection, transcribeAudio]
  );

  return { isRecording, isTranscribing, startRecording, stopRecording };
};
