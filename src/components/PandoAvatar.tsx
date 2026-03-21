import pandoImg from "@/assets/pando-mascot.png";

interface PandoAvatarProps {
  size?: "sm" | "md" | "lg" | "xl";
  animate?: boolean;
  className?: string;
}

const sizeMap = {
  sm: "w-16 h-16",
  md: "w-24 h-24",
  lg: "w-32 h-32",
  xl: "w-48 h-48",
};

const PandoAvatar = ({ size = "md", animate = true, className = "" }: PandoAvatarProps) => {
  return (
    <img
      src={pandoImg}
      alt="Pando, your Guardian AI panda"
      className={`${sizeMap[size]} object-contain ${animate ? "animate-float" : ""} ${className}`}
    />
  );
};

export default PandoAvatar;
