import { useRef, useCallback, useState } from "react";

export const useElevenLabsTTS = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const onEndRef = useRef<(() => void) | null>(null);

  const speak = useCallback(async (text: string, voiceId: string, onEnd?: () => void) => {
    onEndRef.current = onEnd || null;
    // Stop any current playback
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (abortRef.current) {
      abortRef.current.abort();
    }

    setIsSpeaking(true);
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text, voiceId }),
          signal: controller.signal,
        }
      );

      if (!response.ok) throw new Error(`TTS failed: ${response.status}`);

      // Use MediaSource for streaming playback when supported, else fallback to blob
      if (typeof MediaSource !== "undefined" && MediaSource.isTypeSupported("audio/mpeg")) {
        const mediaSource = new MediaSource();
        const audioUrl = URL.createObjectURL(mediaSource);
        const audio = new Audio(audioUrl);
        audioRef.current = audio;

        mediaSource.addEventListener("sourceopen", async () => {
          const sourceBuffer = mediaSource.addSourceBuffer("audio/mpeg");
          const reader = response.body!.getReader();

          const pump = async () => {
            while (true) {
              const { done, value } = await reader.read();
              if (done) {
                if (mediaSource.readyState === "open") {
                  // Wait for sourceBuffer to finish updating before ending stream
                  if (sourceBuffer.updating) {
                    await new Promise<void>((r) => sourceBuffer.addEventListener("updateend", () => r(), { once: true }));
                  }
                  mediaSource.endOfStream();
                }
                break;
              }
              // Wait if sourceBuffer is still updating
              if (sourceBuffer.updating) {
                await new Promise<void>((r) => sourceBuffer.addEventListener("updateend", () => r(), { once: true }));
              }
              sourceBuffer.appendBuffer(value);
            }
          };

          pump().catch((e) => {
            if (e.name !== "AbortError") console.error("Stream pump error:", e);
            // If pump fails, ensure stream ends so onended fires
            try {
              if (mediaSource.readyState === "open") {
                mediaSource.endOfStream();
              }
            } catch {}
          });
        });

        audio.onended = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
          audioRef.current = null;
          onEndRef.current?.();
        };
        audio.onerror = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
          audioRef.current = null;
          onEndRef.current?.();
        };

        await audio.play();
      } else {
        // Fallback: wait for full blob
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audioRef.current = audio;

        audio.onended = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
          audioRef.current = null;
          onEndRef.current?.();
        };
        audio.onerror = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
          audioRef.current = null;
          onEndRef.current?.();
        };

        await audio.play();
      }
    } catch (e: any) {
      if (e.name !== "AbortError") {
        console.error("TTS error:", e);
      }
      setIsSpeaking(false);
      // Ensure listening resumes even on TTS failure
      if (e.name !== "AbortError") {
        onEndRef.current?.();
      }
    }
  }, []);

  const stop = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsSpeaking(false);
  }, []);

  return { speak, stop, isSpeaking };
};
