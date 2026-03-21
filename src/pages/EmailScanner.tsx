import { useState } from "react";
import { ArrowLeft, Search, RotateCcw } from "lucide-react";
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

  const scanEmail = async () => {
    if (!emailText.trim()) return;
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
          body: JSON.stringify({ emailContent: emailText }),
        }
      );

      if (!resp.ok) throw new Error("Scan failed");
      const data = await resp.json();
      setResult(data);
    } catch (e) {
      console.error(e);
      setResult({
        level: "caution",
        verdict: "I had trouble analyzing this email. Please try again.",
        redFlags: [],
        advice: "If you're unsure about this email, don't click any links or reply to it.",
      });
    }

    setIsScanning(false);
  };

  const reset = () => {
    setEmailText("");
    setResult(null);
  };

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
          <p className="text-sm text-muted-foreground">Paste a suspicious email below</p>
        </div>
      </div>

      <div className="p-4 max-w-lg mx-auto space-y-4">
        {!result ? (
          <div className="animate-slide-up space-y-4">
            <textarea
              value={emailText}
              onChange={(e) => setEmailText(e.target.value)}
              placeholder="Paste the email content here... Include the sender, subject line, and full body text."
              className="w-full h-48 rounded-lg border border-input bg-background px-4 py-3 text-body focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
            <button
              onClick={scanEmail}
              disabled={!emailText.trim() || isScanning}
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
