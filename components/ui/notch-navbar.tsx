"use client";

import React, { useState } from "react";
import { Compass, Sparkles, Map, Zap, Layers, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// Helper component for navigation links
const NavLink = ({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) => (
  <a
    href={href}
    className="group flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-cyan-400 transition-colors whitespace-nowrap"
  >
    <Icon className="w-3.5 h-3.5 text-cyan-400/70 group-hover:text-cyan-400 transition-colors" />
    <span>{label}</span>
  </a>
);

export interface NotchNavbarProps extends React.HTMLAttributes<HTMLElement> {
  logo?: React.ReactNode;
  assessmentUrl?: string;
  loginUrl?: string;
}

export function NotchNavbar({
  className,
  logo,
  assessmentUrl = "/assessment.html",
  loginUrl = "/login.html",
  ...props
}: NotchNavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Navigation items configured for CareerPath AI
  const items = {
    left: [
      { label: "How It Works", href: "#how-it-works", icon: Compass },
      { label: "Transformation", href: "#transformation", icon: Sparkles },
      { label: "Careers", href: "#careers", icon: Map },
    ],
    right: [
      { label: "Features", href: "#features", icon: Zap },
      { label: "Future Scope", href: "#future-roadmap", icon: Layers },
    ],
  };

  return (
    <>
      <header
        className={cn("fixed top-0 inset-x-0 z-50 h-16 flex px-0 pointer-events-none", className)}
        {...props}
      >
        {/* Left Side Bar - Flexible width */}
        <div className="flex-1 h-10 bg-slate-950/80 backdrop-blur-md z-20 relative min-w-0 border-b border-cyan-500/20 pointer-events-auto">
          <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
            <line
              x1="0"
              y1="39.5"
              x2="100%"
              y2="39.5"
              stroke="rgba(0, 242, 254, 0.2)"
              strokeWidth={1}
            />
          </svg>
        </div>

        {/* Responsive Notch Container - 3 Slices */}
        <div className="flex h-16 relative z-10 shrink-0 -ml-px pointer-events-auto">
          {/* Left Slice (Corner) */}
          <div className="w-[50px] h-full relative shrink-0">
            {/* Glass Background */}
            <div
              className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl"
              style={{ clipPath: "path('M0 0 H50 V64 C25 64 25 40 0 40 Z')" }}
            />
            {/* Outlines */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox="0 0 50 64"
            >
              <path
                d="M0 39.5 C25 39.5 25 63.5 50 63.5"
                fill="none"
                stroke="rgba(0, 242, 254, 0.45)"
                strokeWidth={1}
              />
            </svg>
          </div>

          {/* Center Slice (Flexible Content Area) */}
          <div className="flex-1 h-full relative min-w-0 -ml-px">
            {/* Background & Lines Layer */}
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl">
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                preserveAspectRatio="none"
              >
                <line
                  x1="0"
                  y1="63.5"
                  x2="100%"
                  y2="63.5"
                  stroke="rgba(0, 242, 254, 0.45)"
                  strokeWidth={1}
                />
              </svg>
            </div>

            {/* Content Layer */}
            <div className="relative w-full h-full flex items-end justify-between pb-2 px-4 md:px-8">
              {/* Desktop Left Nav */}
              <nav className="hidden md:flex gap-6 mb-1 shrink-0">
                {items.left.map((item) => (
                  <NavLink key={item.label} {...item} />
                ))}
              </nav>

              {/* Mobile Menu Button (Left) */}
              <button
                className="md:hidden mb-1 p-1 text-slate-300 hover:text-cyan-400 transition-colors"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              {/* Logo (Center Notch Brand) */}
              <div className="flex justify-center shrink-0 mx-2 md:mx-4 mt-1">
                {logo || (
                  <a
                    href="/"
                    className="flex items-center gap-2 group px-2 py-1 rounded-lg hover:bg-cyan-500/10 transition-colors"
                  >
                    <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-cyan-400 to-violet-600 flex items-center justify-center text-slate-950 shadow-[0_0_12px_rgba(0,242,254,0.5)]">
                      <Compass className="w-4 h-4 text-slate-950 group-hover:rotate-45 transition-transform" />
                    </div>
                    <span className="font-extrabold text-sm text-white tracking-wide">
                      CareerPath <span className="text-cyan-400">AI</span>
                    </span>
                  </a>
                )}
              </div>

              {/* Desktop Right Nav */}
              <nav className="hidden md:flex gap-5 items-center shrink-0">
                {items.right.map((item) => (
                  <NavLink key={item.label} {...item} />
                ))}

                <div className="flex gap-3 pl-3 border-l border-cyan-500/20 shrink-0 items-center">
                  <a
                    href={loginUrl}
                    className="text-xs font-semibold text-slate-300 hover:text-cyan-400 transition-colors whitespace-nowrap"
                  >
                    Log In
                  </a>
                  <a
                    href={assessmentUrl}
                    className="px-3 py-1.5 text-xs font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full hover:shadow-[0_0_15px_rgba(0,242,254,0.6)] transition-all whitespace-nowrap"
                  >
                    Start Assessment
                  </a>
                </div>
              </nav>

              {/* Mobile Right Quick Action */}
              <div className="md:hidden flex items-center gap-2 mb-1">
                <a
                  href={assessmentUrl}
                  className="px-2.5 py-1 text-[11px] font-bold text-slate-950 bg-cyan-400 rounded-full"
                >
                  Start
                </a>
              </div>
            </div>
          </div>

          {/* Right Slice (Corner) */}
          <div className="w-[50px] h-full relative shrink-0 -ml-px">
            {/* Glass Background */}
            <div
              className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl"
              style={{ clipPath: "path('M0 0 H50 V40 C25 40 25 64 0 64 Z')" }}
            />
            {/* Outlines */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox="0 0 50 64"
            >
              <path
                d="M0 63.5 C25 63.5 25 39.5 50 39.5"
                fill="none"
                stroke="rgba(0, 242, 254, 0.45)"
                strokeWidth={1}
              />
            </svg>
          </div>
        </div>

        {/* Right Side Bar - Flexible width */}
        <div className="flex-1 h-10 bg-slate-950/80 backdrop-blur-md z-20 relative min-w-0 -ml-px border-b border-cyan-500/20 pointer-events-auto">
          <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
            <line
              x1="0"
              y1="39.5"
              x2="100%"
              y2="39.5"
              stroke="rgba(0, 242, 254, 0.2)"
              strokeWidth={1}
            />
          </svg>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-16 z-40 bg-slate-950/95 backdrop-blur-2xl border-b border-cyan-500/30 p-4 md:hidden shadow-2xl"
          >
            <nav className="flex flex-col gap-2">
              {[...items.left, ...items.right].map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-cyan-500/10 transition-colors text-slate-200"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <item.icon className="w-5 h-5 text-cyan-400" />
                  <span className="font-semibold text-sm">{item.label}</span>
                </a>
              ))}
              <div className="h-px bg-cyan-500/20 my-2" />
              <div className="flex flex-col gap-2">
                <a
                  href={loginUrl}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-cyan-500/10 transition-colors font-semibold text-slate-200"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Log In / Register
                </a>
                <a
                  href={assessmentUrl}
                  className="flex items-center justify-center gap-2 p-3 rounded-lg bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-bold mt-2 shadow-[0_0_15px_rgba(0,242,254,0.4)]"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Start Assessment
                </a>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default NotchNavbar;
