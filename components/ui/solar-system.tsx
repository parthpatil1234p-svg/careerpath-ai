"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export interface SolarSystemItem {
  id: string;
  name: string;
  category?: string;
  badge?: string;
  description?: string;
  color?: string;
  icon?: React.ReactNode;
  codeSnippet?: string;
}

export interface OrbitConfig {
  id: string;
  name: string;
  radiusClass?: string;
  radiusPx: number;
  speed: number; // Duration in seconds for full orbit rotation
  items: SolarSystemItem[];
}

export interface SolarSystemProps {
  title?: string | React.ReactNode;
  description?: string;
  logo?: React.ReactNode;
  orbits?: OrbitConfig[];
  className?: string;
  onSelectItem?: (item: SolarSystemItem) => void;
}

export const DEFAULT_ORBITS: OrbitConfig[] = [
  {
    id: "inner",
    name: "Foundation & Web Core",
    radiusPx: 120,
    speed: 28,
    items: [
      {
        id: "react",
        name: "React.js",
        category: "Frontend UI",
        badge: "Essential",
        description: "Component-driven declarative UI library for modern web applications.",
        color: "#00F2FE",
      },
      {
        id: "typescript",
        name: "TypeScript",
        category: "Type Safety",
        badge: "Industry Standard",
        description: "Typed superset of JavaScript providing enterprise-grade developer productivity.",
        color: "#3178C6",
      },
      {
        id: "nodejs",
        name: "Node.js",
        category: "Runtime",
        badge: "Core Backend",
        description: "Event-driven asynchronous I/O runtime for scalable full-stack backends.",
        color: "#22C55E",
      },
      {
        id: "tailwind",
        name: "Tailwind CSS",
        category: "Design System",
        badge: "Modern UI",
        description: "Utility-first CSS framework for rapid responsive interface development.",
        color: "#38BDF8",
      },
    ],
  },
  {
    id: "middle",
    name: "AI & Data Architecture",
    radiusPx: 200,
    speed: 46,
    items: [
      {
        id: "python-ai",
        name: "Python AI",
        category: "Machine Learning",
        badge: "High Demand",
        description: "Core programming language for LLMs, neural networks, and mathematical modeling.",
        color: "#F59E0B",
      },
      {
        id: "mongodb",
        name: "MongoDB Atlas",
        category: "Database",
        badge: "Cloud NoSQL",
        description: "Flexible, horizontally scalable document database for dynamic skill graphs.",
        color: "#10B981",
      },
      {
        id: "pytorch",
        name: "PyTorch / TensorFlow",
        category: "Deep Learning",
        badge: "AI Specialist",
        description: "GPU-accelerated tensor computation frameworks for training and inference.",
        color: "#EE4C2C",
      },
      {
        id: "express",
        name: "Express.js",
        category: "REST APIs",
        badge: "API Gateway",
        description: "Fast, unopinionated minimalist web framework for building REST & GraphQL endpoints.",
        color: "#8B5CF6",
      },
    ],
  },
  {
    id: "outer",
    name: "Cloud, DevOps & Production",
    radiusPx: 285,
    speed: 68,
    items: [
      {
        id: "docker",
        name: "Docker Containers",
        category: "Containerization",
        badge: "DevOps Core",
        description: "Lightweight container virtualization for consistent local-to-cloud deployments.",
        color: "#2496ED",
      },
      {
        id: "kubernetes",
        name: "Kubernetes",
        category: "Orchestration",
        badge: "Enterprise Scale",
        description: "Automated container deployment, scaling, and operational management at scale.",
        color: "#326CE5",
      },
      {
        id: "aws",
        name: "AWS & Cloud",
        category: "Cloud Infrastructure",
        badge: "Global Compute",
        description: "Serverless lambda, container clusters, and S3 media storage pipelines.",
        color: "#FF9900",
      },
      {
        id: "cicd",
        name: "GitHub Actions CI/CD",
        category: "Automation",
        badge: "Quality Gate",
        description: "Continuous integration, automated testing, and zero-downtime deployment pipelines.",
        color: "#EC4899",
      },
    ],
  },
];

export function SolarSystem({
  title = "Career Ecosystem Solar System",
  description = "Explore how foundational skills, AI algorithms, and cloud technologies orbit around your personal Career Atlas.",
  logo,
  orbits = DEFAULT_ORBITS,
  className,
  onSelectItem,
}: SolarSystemProps) {
  const [selectedItem, setSelectedItem] = useState<SolarSystemItem | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  const handleSelect = (item: SolarSystemItem) => {
    setSelectedItem(item);
    if (onSelectItem) onSelectItem(item);
  };

  return (
    <div
      className={cn(
        "relative w-full max-w-5xl mx-auto flex flex-col items-center justify-center p-6 select-none overflow-hidden",
        className
      )}
    >
      {/* Title & Description Header */}
      {(title || description) && (
        <div className="text-center mb-8 z-10 max-w-2xl">
          {title && (
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2 font-display">
              {title}
            </h3>
          )}
          {description && (
            <p className="text-sm sm:text-base text-slate-400">
              {description}
            </p>
          )}
        </div>
      )}

      {/* Main Solar System Canvas Viewport */}
      <div
        className="relative flex items-center justify-center w-[640px] h-[640px] max-w-full max-h-[85vw]"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Background Cosmic Star Dust / Radial Ambient Gradient */}
        <div className="absolute inset-0 pointer-events-none rounded-full bg-[radial-gradient(circle_at_center,rgba(0,242,254,0.12)_0%,rgba(59,130,246,0.06)_40%,transparent_70%)]" />

        {/* Central Sun (Core Engine / Student Profile) */}
        <div className="relative z-20 flex items-center justify-center">
          {/* Animated Solar Glow Rings */}
          <div className="absolute -inset-4 rounded-full bg-cyan-400/25 blur-xl animate-pulse" />
          <div className="absolute -inset-8 rounded-full bg-blue-600/15 blur-2xl pointer-events-none" />

          <motion.div
            className="relative flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-tr from-cyan-400 via-blue-600 to-violet-600 p-[2px] shadow-[0_0_40px_rgba(0,242,254,0.5)] cursor-pointer"
            whileHover={{ scale: 1.1 }}
            transition={{ type: "spring", stiffness: 350, damping: 20 }}
          >
            <div className="flex flex-col items-center justify-center w-full h-full rounded-full bg-slate-950/90 backdrop-blur-md text-center p-2">
              {logo ? (
                logo
              ) : (
                <>
                  <span className="text-2xl">⚡</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300 font-mono">
                    Career Core
                  </span>
                </>
              )}
            </div>
          </motion.div>
        </div>

        {/* Orbit Rings and Orbiting Technology Nodes */}
        {orbits.map((orbit) => {
          const diameter = orbit.radiusPx * 2;

          return (
            <div
              key={orbit.id}
              className="absolute rounded-full border border-cyan-500/20 border-dashed pointer-events-none"
              style={{
                width: `${diameter}px`,
                height: `${diameter}px`,
              }}
            >
              {/* Rotating Container for Nodes on this Track */}
              <div
                className="w-full h-full relative pointer-events-auto"
                style={{
                  animation: `spin-orbit ${orbit.speed}s linear infinite`,
                  animationPlayState: isPaused ? "paused" : "running",
                }}
              >
                {orbit.items.map((item, index) => {
                  const angle = (index / orbit.items.length) * 2 * Math.PI;
                  const x = orbit.radiusPx * Math.cos(angle);
                  const y = orbit.radiusPx * Math.sin(angle);

                  return (
                    <div
                      key={item.id}
                      className="absolute top-1/2 left-1/2 -ml-5 -mt-5"
                      style={{
                        transform: `translate(${x}px, ${y}px)`,
                      }}
                    >
                      {/* Counter-rotation to keep the planet upright */}
                      <div
                        style={{
                          animation: `counter-spin ${orbit.speed}s linear infinite`,
                          animationPlayState: isPaused ? "paused" : "running",
                        }}
                      >
                        <motion.button
                          type="button"
                          onClick={() => handleSelect(item)}
                          className={cn(
                            "relative group flex items-center justify-center w-10 h-10 rounded-full border transition-all duration-300",
                            "bg-slate-900/90 backdrop-blur-md shadow-lg outline-none",
                            selectedItem?.id === item.id
                              ? "border-cyan-400 scale-125 shadow-[0_0_20px_rgba(0,242,254,0.8)] z-30 ring-2 ring-cyan-400/50"
                              : "border-slate-700/80 hover:border-cyan-400 hover:scale-120 hover:shadow-[0_0_15px_rgba(0,242,254,0.5)]"
                          )}
                          style={{
                            borderColor: item.color ? `${item.color}88` : undefined,
                          }}
                          whileHover={{ scale: 1.25 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {/* Ambient halo based on node color */}
                          <div
                            className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-40 blur-md transition-opacity"
                            style={{ backgroundColor: item.color || "#00F2FE" }}
                          />

                          {/* Node Icon or First Letter Initial */}
                          <span
                            className="relative text-xs font-bold font-mono"
                            style={{ color: item.color || "#E2E8F0" }}
                          >
                            {item.icon || item.name.substring(0, 2).toUpperCase()}
                          </span>

                          {/* Floating Micro-Badge on Hover */}
                          <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-semibold text-slate-300 bg-slate-950/90 border border-slate-700 px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md z-40">
                            {item.name}
                          </span>
                        </motion.button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Item Drawer / Info Inspection Card */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.25 }}
            className="mt-6 p-4 rounded-xl max-w-md w-full bg-slate-900/90 backdrop-blur-xl border border-cyan-500/30 shadow-[0_10px_35px_rgba(0,0,0,0.6),0_0_20px_rgba(0,242,254,0.15)] flex flex-col gap-2 z-30"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full shadow-[0_0_8px_currentColor]"
                  style={{ backgroundColor: selectedItem.color, color: selectedItem.color }}
                />
                <h4 className="text-white font-bold text-base font-display">
                  {selectedItem.name}
                </h4>
              </div>
              {selectedItem.badge && (
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300">
                  {selectedItem.badge}
                </span>
              )}
            </div>

            {selectedItem.category && (
              <span className="text-xs font-mono text-cyan-400">
                Category: {selectedItem.category}
              </span>
            )}

            {selectedItem.description && (
              <p className="text-xs text-slate-300 leading-relaxed">
                {selectedItem.description}
              </p>
            )}

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="text-xs text-slate-400 hover:text-white transition-colors px-2 py-1"
              >
                Close
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global CSS Keyframes for Rotational Physics */}
      <style>{`
        @keyframes spin-orbit {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes counter-spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(-360deg);
          }
        }
      `}</style>
    </div>
  );
}

export default SolarSystem;
