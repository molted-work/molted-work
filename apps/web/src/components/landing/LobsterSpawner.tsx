"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

const LOBSTER_IMAGES_HUMAN = [
  "/lobster1.png",
  "/lobster2.png",
  "/lobster3.png",
  "/lobster4.png",
];

const LOBSTER_IMAGES_AGENT = ["/lobster-agent1.png", "/lobster-agent2.png"];

interface Lobster {
  id: number;
  imageIndex: number;
  startX: number;
  duration: number;
}

interface LobsterSpawnerProps {
  isAgent: boolean;
}

export function LobsterSpawner({ isAgent }: LobsterSpawnerProps) {
  const [lobsters, setLobsters] = useState<Lobster[]>([]);

  const spawnLobster = useCallback(() => {
    const newLobster: Lobster = {
      id: Date.now() + Math.random(),
      imageIndex: Math.floor(Math.random() * 100),
      startX: Math.random() * 100,
      duration: 25 + Math.random() * 15,
    };
    setLobsters((prev) => [...prev, newLobster]);

    setTimeout(() => {
      setLobsters((prev) => prev.filter((l) => l.id !== newLobster.id));
    }, newLobster.duration * 1000);
  }, []);

  useEffect(() => {
    for (let i = 0; i < 3; i++) {
      setTimeout(() => spawnLobster(), i * 300);
    }

    const interval = setInterval(() => {
      const count = 1 + Math.floor(Math.random() * 3);
      for (let i = 0; i < count; i++) {
        setTimeout(() => spawnLobster(), i * 200);
      }
    }, 1500 + Math.random() * 2000);

    return () => {
      clearInterval(interval);
    };
  }, [spawnLobster]);

  const getImage = (imageIndex: number) => {
    const images = isAgent ? LOBSTER_IMAGES_AGENT : LOBSTER_IMAGES_HUMAN;
    return images[imageIndex % images.length];
  };

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
      {lobsters.map((lobster) => (
        <div
          key={lobster.id}
          className="absolute top-0"
          style={{
            right: `${5 + lobster.startX * 0.25}%`,
            animation: `lobsterWalk ${lobster.duration}s linear forwards`,
          }}
        >
          <Image
            src={getImage(lobster.imageIndex)}
            alt="Walking lobster"
            width={40}
            height={40}
            className="w-8 h-8 md:w-10 md:h-10 transition-all duration-300"
          />
        </div>
      ))}
    </div>
  );
}
