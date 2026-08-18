'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface ShinyButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

/**
 * ShinyButton
 * Premium pill button with an animated conic-gradient border, ambient glow,
 * shimmer sweep, and subtle dot texture. Pure CSS animation.
 *
 * <ShinyButton onClick={...}>Book an Appointment →</ShinyButton>
 */
const ShinyButton = React.forwardRef<HTMLButtonElement, ShinyButtonProps>(
  ({ children = 'Book an Appointment →', className, type = 'button', ...props }, ref) => {
    return (
      <>
        <button ref={ref} type={type} className={cn('shiny-btn', className)} {...props}>
          <span className="shiny-btn__border" aria-hidden="true" />
          <span className="shiny-btn__glow" aria-hidden="true" />
          <span className="shiny-btn__surface">
            <span className="shiny-btn__dots" aria-hidden="true" />
            <span className="shiny-btn__sweep" aria-hidden="true" />
            <span className="shiny-btn__label">{children}</span>
          </span>
        </button>

        <style jsx>{`
          .shiny-btn {
            position: relative;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            isolation: isolate;
            border: none;
            margin: 0;
            padding: 0;
            background: transparent;
            cursor: pointer;
            border-radius: 9999px;
            -webkit-tap-highlight-color: transparent;
            transition: transform 240ms cubic-bezier(0.22, 1, 0.36, 1);
          }

          .shiny-btn:hover {
            transform: scale(1.035);
          }

          .shiny-btn:active {
            transform: scale(0.97);
          }

          .shiny-btn:disabled {
            cursor: not-allowed;
            opacity: 0.5;
            transform: none;
          }

          .shiny-btn:focus-visible {
            outline: 2px solid #ffffff;
            outline-offset: 3px;
          }

          .shiny-btn__border {
            position: absolute;
            inset: 0;
            border-radius: inherit;
            padding: 1.5px;
            background: conic-gradient(
              from var(--angle, 0deg),
              #ffffff00 0deg,
              #a78bfa 60deg,
              #f0abfc 120deg,
              #ffffff 160deg,
              #60a5fa 220deg,
              #ffffff00 280deg,
              #ffffff00 360deg
            );
            -webkit-mask:
              linear-gradient(#000 0 0) content-box,
              linear-gradient(#000 0 0);
            -webkit-mask-composite: xor;
            mask-composite: exclude;
            animation: shiny-spin 4s linear infinite;
            opacity: 0.9;
            transition: opacity 260ms ease;
          }

          .shiny-btn:hover .shiny-btn__border {
            opacity: 1;
            animation-duration: 2.4s;
          }

          .shiny-btn__glow {
            position: absolute;
            inset: -6px;
            border-radius: inherit;
            background: conic-gradient(
              from var(--angle, 0deg),
              transparent 0deg,
              rgba(167, 139, 250, 0.55) 90deg,
              rgba(240, 171, 252, 0.45) 160deg,
              rgba(96, 165, 250, 0.5) 260deg,
              transparent 360deg
            );
            filter: blur(14px);
            opacity: 0.5;
            z-index: -1;
            animation: shiny-spin 4s linear infinite;
            transition: opacity 260ms ease, filter 260ms ease;
          }

          .shiny-btn:hover .shiny-btn__glow {
            opacity: 0.85;
            filter: blur(18px);
            animation-duration: 2.4s;
          }

          .shiny-btn__surface {
            position: relative;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            border-radius: inherit;
            padding: 0.85rem 1.75rem;
            background:
              linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0) 40%),
              radial-gradient(120% 140% at 50% -20%, #262626 0%, #0a0a0a 60%),
              #050505;
            box-shadow:
              inset 0 1px 0 0 rgba(255, 255, 255, 0.14),
              inset 0 -1px 8px 0 rgba(0, 0, 0, 0.6);
          }

          .shiny-btn__dots {
            position: absolute;
            inset: 0;
            background-image: radial-gradient(rgba(255, 255, 255, 0.5) 0.6px, transparent 0.6px);
            background-size: 10px 10px;
            opacity: 0.08;
            mix-blend-mode: screen;
            pointer-events: none;
          }

          .shiny-btn__sweep {
            position: absolute;
            top: 0;
            left: -60%;
            width: 45%;
            height: 100%;
            background: linear-gradient(
              75deg,
              transparent 0%,
              rgba(255, 255, 255, 0) 30%,
              rgba(255, 255, 255, 0.35) 50%,
              rgba(255, 255, 255, 0) 70%,
              transparent 100%
            );
            transform: skewX(-15deg);
            animation: shiny-sweep 3.2s ease-in-out infinite;
            pointer-events: none;
          }

          .shiny-btn:hover .shiny-btn__sweep {
            animation-duration: 1.6s;
          }

          .shiny-btn__label {
            position: relative;
            z-index: 1;
            font-weight: 600;
            font-size: 0.9375rem;
            line-height: 1;
            letter-spacing: -0.01em;
            color: #ffffff;
            white-space: nowrap;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
          }

          @keyframes shiny-sweep {
            0% {
              left: -60%;
            }
            55%,
            100% {
              left: 130%;
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .shiny-btn,
            .shiny-btn__border,
            .shiny-btn__glow,
            .shiny-btn__sweep {
              animation: none !important;
              transition: none !important;
            }
            .shiny-btn:hover {
              transform: none;
            }
          }
        `}</style>
        <style jsx global>{`
          @property --angle {
            syntax: '<angle>';
            initial-value: 0deg;
            inherits: false;
          }

          @keyframes shiny-spin {
            to {
              --angle: 360deg;
            }
          }
        `}</style>
      </>
    )
  }
)
ShinyButton.displayName = 'ShinyButton'

export { ShinyButton }
