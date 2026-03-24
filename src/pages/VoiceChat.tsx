import { useState, useRef, useCallback, useEffect } from "react";
import { Mic, MicOff, Keyboard, ArrowLeft, Volume2 } from "lucide-react";
import { Link } from "react-router-dom";
import PandoAvatar from "@/components/PandoAvatar";
import SafetyBadge from "@/components/SafetyBadge";
import VoiceSelector, { VOICES, type Voice } from "@/components/VoiceSelector";
import { useElevenLabsTTS } from "@/hooks/useElevenLabsTTS";
import { useElevenLabsSTT } from "@/hooks/useElevenLabsSTT";

interface Message {
  role: "user" | "assistant";
  content: string;
  safetyLevel?: "safe" | "caution" | "danger";
}

const VoiceChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [stillListening, setStillListening] = useState(false);
  const hasIntroducedRef = useRef(false);
  const [selectedVoice, setSelectedVoice] = useState<Voice>(VOICES[0]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<Message[]>([]);

  const { speak, stop: stopSpeaking, isSpeaking } = useElevenLabsTTS();
  const { isRecording, isTranscribing, startRecording, stopRecording } = useElevenLabsSTT();

  const lastInputWasVoiceRef = useRef(false);
  const voiceModeRef = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSilence = useCallback(() => {
    setStillListening(true);
    setTimeout(() => setStillListening(false), 2000);
    // Restart listening after silence
    setTimeout(() => {
      if (voiceModeRef.current && !isLoading) {
        startRecording((transcript) => {
          if (transcript.trim()) {
            setStillListening(false);
            sendMessageFromVoice(transcript);
          }
        }, handleSilence).catch(() => {
          setShowKeyboard(true);
          voiceModeRef.current = false;
        });
      }
    }, 300);
  }, [startRecording, isLoading]);

  // Start listening (used for auto-resume after AI speaks)
  const startListening = useCallback(async () => {
    if (!voiceModeRef.current) return;
    try {
      await startRecording((transcript) => {
        // Auto-stop callback: send the transcript automatically
        if (transcript.trim()) {
          setStillListening(false);
          sendMessageFromVoice(transcript);
        }
      }, handleSilence);
    } catch {
      // Mic denied, fall back to keyboard
      setShowKeyboard(true);
      voiceModeRef.current = false;
    }
  }, [startRecording]);

  const sendMessageFromVoice = useCallback((text: string) => {
    if (!text.trim()) return;
    
    const userMsg: Message = { role: "user", content: text };
    messagesRef.current = [...messagesRef.current, userMsg];
    setMessages([...messagesRef.current]);
    setIsLoading(true);
    lastInputWasVoiceRef.current = true;
    scrollToBottom();

    performChat(messagesRef.current);
  }, []);

  const performChat = async (currentMessages: Message[]) => {
    try {
      let assistantText = "";
      const chatMessages = currentMessages.map((m) => ({ role: m.role, content: m.content }));

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pando-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ messages: chatMessages, voiceMode: lastInputWasVoiceRef.current }),
        }
      );

      if (!resp.ok || !resp.body) throw new Error("Failed to get response");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantText += content;
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  const updated = prev.map((m, i) =>
                    i === prev.length - 1 ? { ...m, content: assistantText } : m
                  );
                  messagesRef.current = updated;
                  return updated;
                }
                const updated = [...prev, { role: "assistant" as const, content: assistantText }];
                messagesRef.current = updated;
                return updated;
              });
            }
          } catch {}
        }
      }

      // Speak with ElevenLabs TTS only when user used voice input
      if (assistantText && lastInputWasVoiceRef.current) {
        speak(assistantText, selectedVoice.id, () => {
          // After AI finishes speaking, auto-resume listening
          startListening();
        });
      }
    } catch (e) {
      console.error(e);
      const errorMsg: Message = { role: "assistant", content: "I'm sorry, I had trouble responding. Please try again!" };
      setMessages((prev) => {
        const updated = [...prev, errorMsg];
        messagesRef.current = updated;
        return updated;
      });
      // Resume listening even on error
      if (lastInputWasVoiceRef.current) {
        startListening();
      }
    }

    setIsLoading(false);
    scrollToBottom();
  };

  const sendMessage = async (text: string, fromVoice = false) => {
    if (!text.trim() || isLoading) return;

    const userMsg: Message = { role: "user", content: text };
    messagesRef.current = [...messagesRef.current, userMsg];
    setMessages([...messagesRef.current]);
    setInput("");
    setIsLoading(true);
    lastInputWasVoiceRef.current = fromVoice;
    scrollToBottom();

    await performChat(messagesRef.current);
  };

  const handleMicToggle = async () => {
    if (isRecording) {
      try {
        const transcript = await stopRecording();
        if (transcript.trim()) {
          sendMessage(transcript, true);
        }
      } catch (e) {
        console.error("STT error:", e);
      }
    } else {
      try {
        await startRecording((transcript) => {
          if (transcript.trim()) {
            setStillListening(false);
            sendMessageFromVoice(transcript);
          }
        }, handleSilence);
      } catch {
        setShowKeyboard(true);
        voiceModeRef.current = false;
      }
    }
  };

  const enterVoiceMode = async () => {
    setShowKeyboard(false);
    voiceModeRef.current = true;
    // Immediately start listening
    try {
      await startRecording((transcript) => {
        if (transcript.trim()) {
          setStillListening(false);
          sendMessageFromVoice(transcript);
        }
      }, handleSilence);
    } catch {
      setShowKeyboard(true);
      voiceModeRef.current = false;
    }
  };

  const cleanupAll = useCallback(() => {
    voiceModeRef.current = false;
    setShowKeyboard(true);
    if (isRecording) {
      stopRecording().catch(() => {});
    }
    stopSpeaking();
  }, [isRecording, stopRecording, stopSpeaking]);

  const exitVoiceMode = () => {
    cleanupAll();
  };

  // Cleanup on unmount (navigating away)
  useEffect(() => {
    return () => {
      voiceModeRef.current = false;
      stopSpeaking();
    };
  }, [stopSpeaking]);

  // Auto-start in voice mode with AI introduction
  useEffect(() => {
    if (hasIntroducedRef.current) return;
    hasIntroducedRef.current = true;
    voiceModeRef.current = true;
    lastInputWasVoiceRef.current = true;

    const introMsg: Message = { role: "user", content: "Hi, I just opened the app. Please introduce yourself briefly." };
    messagesRef.current = [introMsg];
    setIsLoading(true);
    performChat(messagesRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col h-screen pb-16">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border bg-card">
        <Link to="/" className="p-2 -m-2 active:scale-95">
          <ArrowLeft className="h-6 w-6 text-primary" />
        </Link>
        <PandoAvatar size="xs" animate={false} />
        <div className="flex-1">
          <h2 className="font-bold text-lg">Talk to Pando</h2>
          <p className="text-sm text-muted-foreground">Your Guardian AI</p>
        </div>
        <VoiceSelector selectedVoice={selectedVoice} onSelect={setSelectedVoice} />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center animate-slide-up">
            <PandoAvatar size="md" />
            <p className="text-body text-muted-foreground mt-4 max-w-xs">
              Tap the microphone and tell me what's on your mind. I'm here to help!
            </p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-slide-up`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-body ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-sm"
                  : "bg-muted text-foreground rounded-bl-sm"
              }`}
            >
              {msg.content}
              {msg.safetyLevel && (
                <div className="mt-2">
                  <SafetyBadge level={msg.safetyLevel} />
                </div>
              )}
            </div>
          </div>
        ))}
        {(isLoading && messages[messages.length - 1]?.role !== "assistant") && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1">
              <span className="w-2 h-2 rounded-full bg-muted-foreground animate-pulse-soft" />
              <span className="w-2 h-2 rounded-full bg-muted-foreground animate-pulse-soft" style={{ animationDelay: "200ms" }} />
              <span className="w-2 h-2 rounded-full bg-muted-foreground animate-pulse-soft" style={{ animationDelay: "400ms" }} />
            </div>
          </div>
        )}
        {isTranscribing && (
          <div className="flex justify-end">
            <div className="bg-primary/20 text-primary rounded-2xl rounded-br-sm px-4 py-3 text-sm italic">
              Transcribing your voice…
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Speaking indicator */}
      {isSpeaking && (
        <div className="flex items-center justify-center gap-2 py-2 bg-primary/10 text-primary text-sm font-medium">
          <Volume2 className="h-4 w-4 animate-pulse-soft" />
          Pando is speaking…
          <button onClick={stopSpeaking} className="ml-2 underline text-xs active:scale-95">
            Stop
          </button>
        </div>
      )}

      {/* Input area */}
      <div className="p-4 border-t border-border bg-card">
        {showKeyboard ? (
          <form
            onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
            className="flex items-center gap-2"
          >
            <button
              type="button"
              onClick={enterVoiceMode}
              className="p-3 rounded-lg bg-muted text-muted-foreground active:scale-95"
              aria-label="Switch to voice input"
            >
              <Mic className="h-6 w-6" />
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 rounded-lg border border-input bg-background px-4 py-3 text-body focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="rounded-lg bg-primary px-5 py-3 text-primary-foreground font-bold active:scale-95 disabled:opacity-50"
            >
              Send
            </button>
          </form>
        ) : (
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={exitVoiceMode}
              className="p-3 rounded-lg bg-muted text-muted-foreground active:scale-95"
              aria-label="Switch to typing"
            >
              <Keyboard className="h-6 w-6" />
            </button>
            <button
              onClick={handleMicToggle}
              disabled={isTranscribing}
              className={`p-5 rounded-full shadow-lg active:scale-95 transition-colors disabled:opacity-50 ${
                isRecording
                  ? "bg-danger text-danger-foreground animate-pulse-soft"
                  : "bg-primary text-primary-foreground"
              }`}
              aria-label={isRecording ? "Stop recording" : "Start recording"}
            >
              {isRecording ? <MicOff className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
            </button>
            <div className="w-12" />
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceChat;
