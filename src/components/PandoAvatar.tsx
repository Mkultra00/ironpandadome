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
    <div className={`relative ${sizeMap[size]} ${className}`}>
      <img
        src={pandoImg}
        alt="Pando, your Guardian AI panda"
        className="h-full w-full object-contain"
      />
      {animate && (
        <img
          src={pandoImg}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full object-contain"
          style={{
            animation: "sword-wave 1.6s ease-in-out infinite",
            transformOrigin: "28% 52%",
            clipPath: "polygon(0% 15%, 38% 15%, 38% 65%, 0% 65%)",
          }}
        />
      )}
    </div>
  );
};

export default PandoAvatar;
