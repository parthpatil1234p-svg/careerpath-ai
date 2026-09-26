"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";

export interface GenerateButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** 
   * The hue value (0-360) for the button's highlight color.
   * Default is 210 (Blue).
   */
  hue?: number;
  /**
   * If true, forces the button into its "Generating" state.
   * By default, the button also enters this state when focused or clicked.
   */
  isGenerating?: boolean;
}

export function GenerateButton({
  hue = 210,
  isGenerating: controlledIsGenerating,
  className,
  onClick,
  ...props
}: GenerateButtonProps) {
  const [isFocused, setIsFocused] = useState(false);
  
  const isGenerating = controlledIsGenerating !== undefined ? controlledIsGenerating : isFocused;

  return (
    <div className="relative inline-block group">
      <style>{`
        .gen-btn {
          --border-radius: 9999px;
          --padding: 3px;
          --transition: 0.35s cubic-bezier(0.4, 0, 0.2, 1);
          --btn-gradient: linear-gradient(135deg, #00F2FE 0%, #2563EB 50%, #7C3AED 100%);
          --highlight-color-hue: ${hue}deg;

          user-select: none;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 0.65rem 1.6rem;
          font-family: "Outfit", "Space Grotesk", sans-serif;
          font-size: 0.95rem;
          font-weight: 700;
          color: #FFFFFF;

          background: var(--btn-gradient);
          background-size: 200% 200%;

          box-shadow:
            0 0 20px rgba(0, 242, 254, 0.35),
            0 4px 16px rgba(37, 99, 235, 0.4),
            inset 0 1px 1px rgba(255, 255, 255, 0.65);

          border: solid 1px rgba(255, 255, 255, 0.4);
          border-radius: var(--border-radius);
          cursor: pointer;

          transition: all var(--transition);
        }
        
        .gen-btn::before {
          content: "";
          position: absolute;
          top: calc(0px - var(--padding));
          left: calc(0px - var(--padding));
          width: calc(100% + var(--padding) * 2);
          height: calc(100% + var(--padding) * 2);
          border-radius: calc(var(--border-radius) + var(--padding));
          pointer-events: none;
          transition: box-shadow var(--transition);
        }

        .gen-btn::after {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border-radius: var(--border-radius);
          background: radial-gradient(circle at 50% 0%, hsla(var(--highlight-color-hue), 100%, 75%, 0.4), transparent 70%);
          opacity: 0;
          transition: opacity var(--transition);
          pointer-events: none;
        }

        .gen-btn-letter {
          display: inline-block;
          color: #e5e7eb;
          transition: transform 0.3s, filter 0.3s;
        }

        @keyframes gen-letter-anim {
          50% {
            text-shadow: 0 0 3px rgba(255,255,255,0.533);
            color: #fff;
          }
        }

        .gen-btn-svg {
          width: 20px;
          height: 20px;
          margin-right: 0.5rem;
          fill: #38BDF8;
          animation: gen-flicker 2s linear infinite;
          animation-delay: 0.5s;
          filter: drop-shadow(0 0 4px rgba(56, 189, 248, 0.6));
          transition: fill var(--transition), filter var(--transition), opacity var(--transition);
        }
        
        @keyframes gen-flicker {
          50% { opacity: 0.4; }
        }

        .gen-txt-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          min-width: 6.5em;
        }
        
        .gen-txt-1,
        .gen-txt-2 {
          position: absolute;
          white-space: nowrap;
        }
        
        .gen-txt-1 {
          animation: gen-appear-anim 0.5s ease-in-out forwards;
        }
        
        .gen-txt-2 {
          opacity: 0;
        }
        
        @keyframes gen-appear-anim {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        
        /* Generating State */
        .gen-btn[data-generating="true"] .gen-txt-1 {
          animation: gen-opacity-anim 0.3s ease-in-out forwards;
        }
        .gen-btn[data-generating="true"] .gen-txt-2 {
          animation: gen-opacity-anim 0.3s ease-in-out reverse forwards;
        }
        
        @keyframes gen-opacity-anim {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }

        .gen-btn[data-generating="true"] .gen-btn-letter {
          animation: gen-focused-letter-anim 1s ease-in-out forwards, gen-letter-anim 1.2s ease-in-out infinite;
        }
        
        @keyframes gen-focused-letter-anim {
          0%, 100% { filter: blur(0px); }
          50% {
            transform: scale(1.15);
            filter: blur(2px) brightness(150%) drop-shadow(0 0 10px hsl(var(--highlight-color-hue), 100%, 70%));
          }
        }
        
        .gen-btn[data-generating="true"]::before {
          box-shadow: 0 -8px 12px -6px rgba(255,255,255,0.2) inset,
            0 -16px 16px -8px hsla(var(--highlight-color-hue), 100%, 70%, 25%) inset,
            1px 1px 1px rgba(255,255,255,0.2), 
            2px 2px 2px rgba(255,255,255,0.067), 
            -1px -1px 1px rgba(0,0,0,0.133);
        }
        
        .gen-btn[data-generating="true"]::after {
          opacity: 0.7;
          mask-image: linear-gradient(0deg, #fff, transparent);
        }

        .gen-btn:hover {
          border: solid 1px hsla(var(--highlight-color-hue), 100%, 80%, 40%);
          box-shadow: 0 0 20px rgba(56, 189, 248, 0.25);
        }
        .gen-btn:hover::before {
          box-shadow: 0 -8px 8px -6px rgba(255,255,255,0.667) inset,
            0 -16px 16px -8px hsla(var(--highlight-color-hue), 100%, 70%, 30%) inset;
        }
        .gen-btn:hover::after {
          opacity: 1;
        }
        .gen-btn:hover .gen-btn-svg {
          fill: #fff;
          filter: drop-shadow(0 0 6px hsl(var(--highlight-color-hue), 100%, 70%));
        }
      `}</style>

      <button
        type="button"
        className={cn("gen-btn", className)}
        data-generating={isGenerating}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onClick={(e) => {
          setIsFocused(true);
          onClick?.(e);
        }}
        {...props}
      >
        <svg className="gen-btn-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z"></path>
        </svg>

        <div className="gen-txt-wrapper">
          <div className="gen-txt-1">
            {"Generate".split("").map((letter, i) => (
              <span key={`t1-${i}`} className="gen-btn-letter">{letter}</span>
            ))}
          </div>
          <div className="gen-txt-2">
            {"Generating".split("").map((letter, i) => (
              <span key={`t2-${i}`} className="gen-btn-letter">{letter}</span>
            ))}
          </div>
        </div>
      </button>
    </div>
  );
}

export default GenerateButton;
