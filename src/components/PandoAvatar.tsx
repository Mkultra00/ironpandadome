import pandoImg from "@/assets/pando-mascot.png";

interface PandoAvatarProps {
  size?: "sm" | "md" | "lg" | "xl";
  animate?: boolean;
  className?: string;
}

const sizeMap = {
  sm: "w-48 h-48",
  md: "w-72 h-72",
  lg: "w-96 h-96",
  xl: "w-[36rem] h-[36rem]",
};

const PandoAvatar = ({ size = "md", animate = true, className = "" }: PandoAvatarProps) => {
  return (
    <img
      src={pandoImg}
      alt="Pando, your Guardian AI panda"
      className={`${sizeMap[size]} object-contain ${className}`}
      style={animate ? { animation: "sword-wave 2.5s ease-in-out infinite", transformOrigin: "center bottom" } : {}}
    />
  );
};

export default PandoAvatar;
