import { Link } from "react-router-dom";
import { LucideIcon } from "lucide-react";

interface ActionCardProps {
  to: string;
  icon: LucideIcon;
  title: string;
  description: string;
  delay?: number;
}

const ActionCard = ({ to, icon: Icon, title, description, delay = 0 }: ActionCardProps) => {
  return (
    <Link
      to={to}
      className="group block rounded-lg bg-card p-6 shadow-md hover:shadow-lg transition-shadow duration-200 active:scale-[0.97] animate-slide-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-7 w-7 text-primary" />
        </div>
        <div>
          <h3 className="text-heading text-lg">{title}</h3>
          <p className="text-muted-foreground text-sm mt-0.5">{description}</p>
        </div>
      </div>
    </Link>
  );
};

export default ActionCard;
