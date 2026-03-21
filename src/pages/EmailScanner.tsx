import { useState, useRef } from "react";
import { ArrowLeft, Search, RotateCcw, Camera, ImagePlus } from "lucide-react";
import { Link } from "react-router-dom";
import PandoAvatar from "@/components/PandoAvatar";
import SafetyBadge from "@/components/SafetyBadge";

interface ScanResult {
  level: "safe" | "caution" | "danger";
  verdict: string;
  redFlags: string[];
  advice: string;
}

const EmailScanner = () => {
  const [emailText, setEmailText] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setImagePreview(dataUrl);
      // Extract base64 portion after the comma
      setImageBase64(dataUrl.split(",")[1]);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    setImageBase64(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const scanEmail = async () => {
    if (!emailText.trim() && !imageBase64) return;
    setIsScanning(true);
    setResult(null);

    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scan-email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            emailContent: emailText || undefined,
            imageBase64: imageBase64 || undefined,
          }),
        }
      );

      if (!resp.ok) throw new Error("Scan failed");
      const data = await resp.json();
      setResult(data);
    } catch (e) {
      console.error(e);
      setResult({
        level: "caution",
        verdict: "I had trouble analyzing this. Please try again.",
        redFlags: [],
        advice: "If you're unsure about this email, don't click any links or reply to it.",
      });
    }

    setIsScanning(false);
  };

  const reset = () => {
    setEmailText("");
    setResult(null);
    removeImage();
  };

  const hasInput = emailText.trim() || imageBase64;

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border bg-card">
        <Link to="/" className="p-2 -m-2 active:scale-95">
          <ArrowLeft className="h-6 w-6 text-primary" />
        </Link>
        <PandoAvatar size="sm" animate={false} />
        <div>
          <h2 className="font-bold text-lg">Check an Email</h2>
          <p className="text-sm text-muted-foreground">Paste text or upload a screenshot</p>
        </div>
      </div>

      <div className="p-4 max-w-lg mx-auto space-y-4">
        {!result ? (
          <div className="animate-slide-up space-y-4">
            <textarea
              value={emailText}
              onChange={(e) => setEmailText(e.target.value)}
              placeholder="Paste the email content here... Include the sender, subject line, and full body text."
              className="w-full h-40 rounded-lg border border-input bg-background px-4 py-3 text-body focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />

            {/* Image upload area */}
            {imagePreview ? (
              <div className="relative rounded-lg border border-input overflow-hidden bg-muted/30">
                <img
                  src={imagePreview}
                  alt="Uploaded screenshot"
                  className="w-full max-h-56 object-contain"
                />
                <button
                  onClick={removeImage}
                  className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold active:scale-95 shadow-md"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="flex gap-3">
                {/* Upload image */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/30 px-4 py-4 text-muted-foreground hover:border-primary hover:text-primary transition-colors active:scale-[0.97]"
                >
                  <ImagePlus className="h-5 w-5" />
                  <span className="text-sm font-semibold">Upload Image</span>
                </button>

                {/* Camera capture */}
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/30 px-4 py-4 text-muted-foreground hover:border-primary hover:text-primary transition-colors active:scale-[0.97]"
                >
                  <Camera className="h-5 w-5" />
                  <span className="text-sm font-semibold">Take Photo</span>
                </button>
              </div>
            )}

            {/* Hidden file inputs */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/jpg"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageFile(file);
              }}
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageFile(file);
              }}
            />

            <button
              onClick={scanEmail}
              disabled={!hasInput || isScanning}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-4 text-primary-foreground text-body font-bold active:scale-[0.97] disabled:opacity-50 transition-transform"
            >
              <Search className="h-5 w-5" />
              {isScanning ? "Analyzing..." : "Analyze This Email"}
            </button>

            {/* Demo button */}
            <button
              onClick={() => setEmailText(`From: security@paypa1-verify.com\nSubject: URGENT: Your account has been compromised!\n\nDear Customer,\n\nWe have detected suspicious activity on your PayPal account. Your account will be permanently locked within 24 hours unless you verify your identity immediately.\n\nClick here to verify: http://paypa1-secure-login.tk/verify\n\nYou must provide your Social Security Number and bank account details to complete verification.\n\nPayPal Security Team`)}
              className="w-full text-center text-sm text-primary font-semibold active:scale-95"
            >
              Try a demo email →
            </button>
          </div>
        ) : (
          <div className="animate-slide-up space-y-4">
            <div className="flex justify-center">
              <SafetyBadge level={result.level} />
            </div>

            <div className="rounded-lg bg-card p-5 shadow-md space-y-3">
              <h3 className="text-heading">Verdict</h3>
              <p className="text-body">{result.verdict}</p>
            </div>

            {result.redFlags.length > 0 && (
              <div className="rounded-lg bg-card p-5 shadow-md space-y-3">
                <h3 className="text-heading">Red Flags Found</h3>
                <ul className="space-y-2">
                  {result.redFlags.map((flag, i) => (
                    <li key={i} className="flex gap-2 text-body">
                      <span className="text-danger shrink-0">⚠</span>
                      {flag}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="rounded-lg bg-card p-5 shadow-md space-y-3">
              <h3 className="text-heading">What To Do</h3>
              <p className="text-body">{result.advice}</p>
            </div>

            <button
              onClick={reset}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-muted px-6 py-4 text-foreground text-body font-bold active:scale-[0.97]"
            >
              <RotateCcw className="h-5 w-5" />
              Check Another Email
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailScanner;
