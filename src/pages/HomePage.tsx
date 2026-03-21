import { Mic, Mail, Phone, BookOpen } from "lucide-react";
import PandoAvatar from "@/components/PandoAvatar";
import ActionCard from "@/components/ActionCard";

const HomePage = () => {
  return (
    <div className="min-h-screen pb-20">
      {/* Hero */}
      <div className="flex flex-col items-center pt-10 pb-6 px-6 animate-slide-up">
        <PandoAvatar size="lg" />
        <h1 className="text-display text-center mt-4 text-balance">
          Iron Panda Dome
        </h1>
        <p className="text-body text-muted-foreground text-center mt-2 max-w-sm text-balance">
          Hi! I'm <strong>Pando</strong>, your Guardian AI. How can I help you stay safe today?
        </p>
      </div>

      {/* Action Cards */}
      <div className="px-4 max-w-lg mx-auto space-y-3">
        <ActionCard
          to="/chat"
          icon={Mic}
          title="Talk to Pando"
          description="Ask me anything about staying safe online"
          delay={100}
        />
        <ActionCard
          to="/email"
          icon={Mail}
          title="Check an Email"
          description="Paste a suspicious email and I'll analyze it"
          delay={200}
        />
        <ActionCard
          to="/learn"
          icon={BookOpen}
          title="Learn About Scams"
          description="Browse our scam education library"
          delay={300}
        />
      </div>
    </div>
  );
};

export default HomePage;
