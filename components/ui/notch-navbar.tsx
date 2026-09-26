"use client";

import React, { useState } from "react";
import { Compass, Sparkles, Map, Rocket, Menu, X, Sun, Moon, ArrowRight } from "lucide-react";
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
    className="group flex items-center gap-1.5 text-sm font-semibold text-slate-300 hover:text-cyan-300 transition-colors whitespace-nowrap"
  >
    <Icon className="w-4 h-4 text-cyan-400 opacity-75 group-hover:opacity-100 transition-opacity" />
    <span>{label}</span>
  </a>
);

// Built-in CareerPath AI Compass Logo
const CompassLogo = () => (
  <div className="flex items-center gap-2">
    <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-400 to-violet-600 flex items-center justify-center text-slate-950 shadow-[0_0_12px_rgba(0,242,254,0.4)]">
      <Compass className="w-4 h-4" />
    </div>
    <span className="font-bold text-white text-sm tracking-wide hidden sm:inline-block">
      CareerPath <span className="text-cyan-400">AI</span>
    </span>
  </div>
);

export function NotchNavbar({
  className,
  logo,
  ...props
}: React.HTMLAttributes<HTMLElement> & { logo?: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Navigation items configuration
  const items = {
    left: [
      { label: "Overview", href: "#hero", icon: Sparkles },
      { label: "Methodology", href: "#how-it-works", icon: Map },
      { label: "Careers", href: "#careers", icon: Compass },
    ],
    right: [
      { label: "Future Roadmap", href: "#future-roadmap", icon: Rocket },
      { label: "AI Atlas", href: "assessment.html", icon: Sparkles },
    ],
  };

  return (
    <>
      <header
        className={cn("fixed top-0 inset-x-0 z-50 h-16 flex px-0 select-none", className)}
        {...props}
      >
        {/* Left Side Bar - Flexible width */}
        <div className="flex-1 h-10 bg-slate-950/80 backdrop-blur-md z-20 relative min-w-0 border-b border-cyan-500/20">
          <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
            <line
              x1="0"
              y1="39.5"
              x2="100%"
              y2="39.5"
              stroke="#00F2FE"
              strokeOpacity={0.15}
              strokeWidth={0.5}
            />
          </svg>
        </div>

        {/* Responsive Notch Container - 3 Slices */}
        <div className="flex h-16 relative z-10 shrink-0 -ml-px">
          {/* Left Slice (Corner Curve) */}
          <div className="w-[50px] h-full relative shrink-0">
            <div
              className="absolute inset-0 bg-slate-950/90 backdrop-blur-lg"
              style={{ clipPath: "path('M0 0 H50 V64 C25 64 25 40 0 40 Z')" }}
            />
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox="0 0 50 64"
            >
              <path
                d="M0 39.5 C25 39.5 25 63.5 50 63.5"
                fill="none"
                stroke="#00F2FE"
                strokeOpacity={0.25}
                strokeWidth={1}
              />
            </svg>
          </div>

          {/* Center Slice (Flexible Notch Content Area) */}
          <div className="flex-1 h-full relative min-w-0 -ml-px shadow-[0_10px_25px_rgba(0,0,0,0.5)]">
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-lg">
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                preserveAspectRatio="none"
              >
                <line
                  x1="0"
                  y1="63.5"
                  x2="100%"
                  y2="63.5"
                  stroke="#00F2FE"
                  strokeOpacity={0.3}
                  strokeWidth={1}
                />
              </svg>
            </div>

            {/* Content Layer */}
            <div className="relative w-full h-full flex items-end justify-between pb-2.5 px-4 md:px-8 gap-4">
              {/* Desktop Left Nav */}
              <nav className="hidden md:flex gap-6 mb-1 shrink-0">
                {items.left.map((item) => (
                  <NavLink key={item.label} {...item} />
                ))}
              </nav>

              {/* Mobile Menu Button (Left) */}
              <button
                className="md:hidden mb-1 p-1 text-slate-300 hover:text-white transition-colors"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              {/* Brand Logo (Center Notch Anchor) */}
              <div className="flex justify-center shrink-0 mx-2 md:mx-4 mb-0.5">
                {logo || (
                  <a href="#hero" className="flex items-center justify-center relative group">
                    <CompassLogo />
                  </a>
                )}
              </div>

              {/* Desktop Right Nav & Actions */}
              <nav className="hidden md:flex gap-5 items-center shrink-0 mb-0.5">
                {items.right.map((item) => (
                  <NavLink key={item.label} {...item} />
                ))}

                <div className="flex gap-3 pl-3 border-l border-slate-700/60 shrink-0 items-center">
                  <a
                    href="login.html"
                    className="text-xs font-semibold text-slate-300 hover:text-white transition-colors whitespace-nowrap px-2 py-1"
                  >
                    Log in
                  </a>
                  <a
                    href="assessment.html"
                    className="px-3.5 py-1.5 text-xs font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full hover:brightness-110 transition-all shadow-[0_0_15px_rgba(0,242,254,0.4)] whitespace-nowrap flex items-center gap-1.5"
                  >
                    <span>Start</span>
                    <ArrowRight className="w-3 h-3" />
                  </a>
                </div>
              </nav>

              {/* Mobile CTA */}
              <div className="md:hidden flex items-center gap-2 mb-1">
                <a
                  href="assessment.html"
                  className="px-2.5 py-1 text-xs font-bold text-slate-950 bg-cyan-400 rounded-full"
                >
                  Start
                </a>
              </div>
            </div>
          </div>

          {/* Right Slice (Corner Curve) */}
          <div className="w-[50px] h-full relative shrink-0 -ml-px">
            <div
              className="absolute inset-0 bg-slate-950/90 backdrop-blur-lg"
              style={{ clipPath: "path('M0 0 H50 V40 C25 40 25 64 0 64 Z')" }}
            />
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox="0 0 50 64"
            >
              <path
                d="M0 63.5 C25 63.5 25 39.5 50 39.5"
                fill="none"
                stroke="#00F2FE"
                strokeOpacity={0.25}
                strokeWidth={1}
              />
            </svg>
          </div>
        </div>

        {/* Right Side Bar - Flexible width */}
        <div className="flex-1 h-10 bg-slate-950/80 backdrop-blur-md z-20 relative min-w-0 -ml-px border-b border-cyan-500/20">
          <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
            <line
              x1="0"
              y1="39.5"
              x2="100%"
              y2="39.5"
              stroke="#00F2FE"
              strokeOpacity={0.15}
              strokeWidth={0.5}
            />
          </svg>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-16 z-40 bg-slate-950/95 backdrop-blur-xl border-b border-cyan-500/20 p-5 md:hidden shadow-2xl"
          >
            <nav className="flex flex-col gap-3">
              {[...items.left, ...items.right].map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="flex items-center gap-3 p-2.5 rounded-lg text-slate-200 hover:text-cyan-400 hover:bg-slate-900/60 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <item.icon className="w-4 h-4 text-cyan-400" />
                  <span className="font-semibold text-sm">{item.label}</span>
                </a>
              ))}
              <div className="h-px bg-slate-800 my-1" />
              <div className="flex gap-2 pt-2">
                <a
                  href="login.html"
                  className="flex-1 py-2 text-center text-xs font-semibold text-slate-200 bg-slate-900 border border-slate-700 rounded-lg"
                >
                  Log in
                </a>
                <a
                  href="assessment.html"
                  className="flex-1 py-2 text-center text-xs font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-lg shadow-[0_0_12px_rgba(0,242,254,0.4)]"
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
