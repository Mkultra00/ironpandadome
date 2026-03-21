import { useEffect, useState, useCallback } from "react";

const WORDS = [
  "SCAM", "PHISHING", "FRAUD", "MALWARE", "SPAM",
  "HACKED", "RANSOMWARE", "VISHING", "SPOOF", "TROJAN",
  "IDENTITY THEFT", "DATA BREACH", "CATFISH", "DEEPFAKE",
];

interface Particle {
  id: number;
  word: string;
  x: number;
  delay: number;
  duration: number;
  fontSize: number;
  opacity: number;
  fallDistance: number;
}

interface Explosion {
  id: number;
  x: number;
  y: number;
  word: string;
}

let nextId = 0;

const ScamRain = () => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [explosions, setExplosions] = useState<Explosion[]>([]);

  const createParticle = useCallback((): Particle => {
    return {
      id: nextId++,
      word: WORDS[Math.floor(Math.random() * WORDS.length)],
      x: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 2.5 + Math.random() * 2.5,
      fontSize: 10 + Math.random() * 6,
      opacity: 0.12 + Math.random() * 0.15,
      fallDistance: 35 + Math.random() * 15,
    };
  }, []);

  useEffect(() => {
    const initial: Particle[] = [];
    for (let i = 0; i < 18; i++) {
      initial.push(createParticle());
    }
    setParticles(initial);
  }, [createParticle]);

  const handleAnimationEnd = (p: Particle) => {
    const expId = nextId++;
    setExplosions((prev) => [
      ...prev,
      { id: expId, x: p.x, y: 48 + Math.random() * 4, word: p.word },
    ]);
    setTimeout(() => {
      setExplosions((prev) => prev.filter((e) => e.id !== expId));
    }, 600);

    setParticles((prev) =>
      prev.map((particle) =>
        particle.id === p.id ? createParticle() : particle
      )
    );
  };

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute font-bold text-destructive select-none"
          style={{
            left: `${p.x}%`,
            top: "-5%",
            fontSize: `${p.fontSize}px`,
            opacity: p.opacity,
            animation: `scam-fall ${p.duration}s ${p.delay}s linear forwards`,
            letterSpacing: "0.05em",
          }}
          onAnimationEnd={() => handleAnimationEnd(p)}
        >
          {p.word}
        </span>
      ))}
      {explosions.map((e) => (
        <span
          key={e.id}
          className="absolute font-bold text-destructive select-none"
          style={{
            left: `${e.x}%`,
            top: `${e.y}%`,
            fontSize: "12px",
            animation: "scam-explode 0.6s ease-out forwards",
          }}
        >
          💥
        </span>
      ))}
    </div>
  );
};

export default ScamRain;
