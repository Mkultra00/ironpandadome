interface SafetyBadgeProps {
  level: "safe" | "caution" | "danger";
  className?: string;
}

const config = {
  safe: { label: "Safe", bg: "bg-safe", text: "text-safe-foreground", icon: "✓" },
  caution: { label: "Caution", bg: "bg-caution", text: "text-caution-foreground", icon: "⚠" },
  danger: { label: "Danger", bg: "bg-danger", text: "text-danger-foreground", icon: "✕" },
};

const SafetyBadge = ({ level, className = "" }: SafetyBadgeProps) => {
  const c = config[level];
  return (
    <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-body font-bold ${c.bg} ${c.text} ${className}`}>
      <span>{c.icon}</span>
      {c.label}
    </span>
  );
};

export default SafetyBadge;
