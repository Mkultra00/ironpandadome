import { useState } from "react";
import { ChevronDown } from "lucide-react";

export interface Voice {
  id: string;
  name: string;
  description: string;
}

export const VOICES: Voice[] = [
  { id: "JBFqnCBsd6RMkjVDRZzb", name: "George", description: "Warm & calm" },
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah", description: "Friendly & clear" },
  { id: "onwK4e9ZLuTAKqWW03F9", name: "Daniel", description: "Confident & deep" },
  { id: "pFZP5JQG7iQjIQuC4Bku", name: "Lily", description: "Soft & gentle" },
  { id: "nPczCjzI2devNBz1zQrb", name: "Brian", description: "Professional" },
  { id: "Xb7hH8MSUJpSbSDYk0k2", name: "Alice", description: "Bright & cheerful" },
];

interface VoiceSelectorProps {
  selectedVoice: Voice;
  onSelect: (voice: Voice) => void;
}

const VoiceSelector = ({ selectedVoice, onSelect }: VoiceSelectorProps) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted text-sm text-foreground active:scale-95 transition-transform"
      >
        <span className="font-medium">{selectedVoice.name}</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute bottom-full mb-2 right-0 w-56 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-50 animate-slide-up">
          <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b border-border">
            Pando's Voice
          </p>
          {VOICES.map((voice) => (
            <button
              key={voice.id}
              onClick={() => { onSelect(voice); setOpen(false); }}
              className={`w-full text-left px-3 py-2.5 flex items-center justify-between hover:bg-muted/60 transition-colors ${
                selectedVoice.id === voice.id ? "bg-primary/10 text-primary" : "text-foreground"
              }`}
            >
              <div>
                <p className="text-sm font-medium">{voice.name}</p>
                <p className="text-xs text-muted-foreground">{voice.description}</p>
              </div>
              {selectedVoice.id === voice.id && (
                <span className="text-primary text-lg">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default VoiceSelector;
