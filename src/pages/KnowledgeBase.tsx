import { useState } from "react";
import { ArrowLeft, Search, Mail, Phone, Heart, Monitor, DollarSign, Shield, Bot } from "lucide-react";
import { Link } from "react-router-dom";
import PandoAvatar from "@/components/PandoAvatar";

interface Article {
  id: string;
  title: string;
  summary: string;
  threatLevel: "High" | "Critical" | "Emerging";
  content: string;
}

const categories = [
  { id: "phishing", label: "Phishing", icon: Mail, color: "bg-danger/10 text-danger" },
  { id: "vishing", label: "Phone Scams", icon: Phone, color: "bg-caution/10 text-caution-foreground" },
  { id: "romance", label: "Romance Scams", icon: Heart, color: "bg-danger/10 text-danger" },
  { id: "techsupport", label: "Tech Support", icon: Monitor, color: "bg-primary/10 text-primary" },
  { id: "financial", label: "Financial Fraud", icon: DollarSign, color: "bg-danger/10 text-danger" },
  { id: "government", label: "Gov. Impersonation", icon: Shield, color: "bg-caution/10 text-caution-foreground" },
  { id: "ai", label: "AI-Powered Scams", icon: Bot, color: "bg-primary/10 text-primary" },
];

const articles: Article[] = [
  {
    id: "1",
    title: "How to Spot a Phishing Email",
    summary: "Learn the 5 telltale signs that an email is trying to trick you.",
    threatLevel: "High",
    content: "Phishing emails often have: (1) Urgent language like 'Act now!' (2) Misspelled sender domains like paypa1.com (3) Links that go somewhere different than they say (4) Requests for personal info like passwords or SSN (5) Generic greetings like 'Dear Customer' instead of your name.",
  },
  {
    id: "2",
    title: "The IRS Will Never Call You",
    summary: "Government agencies don't threaten arrest over the phone.",
    threatLevel: "Critical",
    content: "If someone calls claiming to be the IRS and threatens arrest or demands immediate payment, it's always a scam. The real IRS contacts you by mail first, never asks for gift cards or wire transfers, and will never threaten to send police.",
  },
  {
    id: "3",
    title: "Romance Scams: When Love is a Lie",
    summary: "Online dating scams cost Americans over $1 billion yearly.",
    threatLevel: "Critical",
    content: "Romance scammers build fake relationships online, then ask for money for emergencies, travel, or medical bills. Red flags: they can never video chat, they profess love very quickly, they always have excuses for not meeting in person, and they eventually ask for money or gift cards.",
  },
  {
    id: "4",
    title: "That Pop-Up is Not From Microsoft",
    summary: "Real tech companies don't show scary pop-ups asking you to call them.",
    threatLevel: "High",
    content: "Tech support scams show fake virus warnings in your browser. They want you to call a number and give remote access to your computer. Never call numbers from pop-ups. Close the browser tab. Real companies like Microsoft or Apple will never show pop-ups asking you to call.",
  },
  {
    id: "5",
    title: "AI Voice Cloning: The New Threat",
    summary: "Scammers can now clone the voice of someone you know.",
    threatLevel: "Emerging",
    content: "With AI, scammers can clone a voice from just a few seconds of audio. They may call pretending to be a grandchild or family member in trouble. Always verify: hang up and call the person back on their real number. Create a family code word that only you and your loved ones know.",
  },
];

const KnowledgeBase = () => {
  const [search, setSearch] = useState("");
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  const filtered = articles.filter(
    (a) => a.title.toLowerCase().includes(search.toLowerCase()) || a.summary.toLowerCase().includes(search.toLowerCase())
  );

  const threatColor = (level: string) => {
    if (level === "Critical") return "bg-danger/10 text-danger";
    if (level === "Emerging") return "bg-primary/10 text-primary";
    return "bg-caution/10 text-caution-foreground";
  };

  if (selectedArticle) {
    return (
      <div className="min-h-screen pb-20">
        <div className="flex items-center gap-3 p-4 border-b border-border bg-card">
          <button onClick={() => setSelectedArticle(null)} className="p-2 -m-2 active:scale-95">
            <ArrowLeft className="h-6 w-6 text-primary" />
          </button>
          <h2 className="font-bold text-lg truncate">{selectedArticle.title}</h2>
        </div>
        <div className="p-4 max-w-lg mx-auto animate-slide-up space-y-4">
          <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${threatColor(selectedArticle.threatLevel)}`}>
            {selectedArticle.threatLevel} Threat
          </span>
          <h1 className="text-display text-balance">{selectedArticle.title}</h1>
          <p className="text-body leading-relaxed">{selectedArticle.content}</p>
          <Link
            to="/chat"
            className="flex items-center justify-center gap-2 w-full rounded-lg bg-primary px-6 py-4 text-primary-foreground text-body font-bold active:scale-[0.97]"
          >
            <PandoAvatar size="sm" animate={false} className="w-8 h-8" />
            Ask Pando About This
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <div className="flex items-center gap-3 p-4 border-b border-border bg-card">
        <Link to="/" className="p-2 -m-2 active:scale-95">
          <ArrowLeft className="h-6 w-6 text-primary" />
        </Link>
        <PandoAvatar size="sm" animate={false} />
        <div>
          <h2 className="font-bold text-lg">Learn About Scams</h2>
          <p className="text-sm text-muted-foreground">Knowledge is your best defense</p>
        </div>
      </div>

      <div className="p-4 max-w-lg mx-auto space-y-4">
        {/* Search */}
        <div className="relative animate-slide-up">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search scam topics..."
            className="w-full rounded-lg border border-input bg-background pl-10 pr-4 py-3 text-body focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2 animate-slide-up" style={{ animationDelay: "100ms" }}>
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${cat.color} active:scale-95`}
            >
              <cat.icon className="h-4 w-4" />
              {cat.label}
            </button>
          ))}
        </div>

        {/* Articles */}
        <div className="space-y-3">
          {filtered.map((article, i) => (
            <button
              key={article.id}
              onClick={() => setSelectedArticle(article)}
              className="w-full text-left rounded-lg bg-card p-5 shadow-md hover:shadow-lg transition-shadow active:scale-[0.97] animate-slide-up"
              style={{ animationDelay: `${(i + 2) * 80}ms` }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold text-lg">{article.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{article.summary}</p>
                </div>
                <span className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-bold ${threatColor(article.threatLevel)}`}>
                  {article.threatLevel}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default KnowledgeBase;
