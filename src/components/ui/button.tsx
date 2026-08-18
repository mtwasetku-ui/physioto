'use client'

import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'shiny-btn inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'shiny-btn--solid rounded-full',
        destructive: 'shiny-btn--solid shiny-btn--destructive rounded-full',
        secondary: 'shiny-btn--solid shiny-btn--secondary rounded-full',
        outline:
          'shiny-btn--outline rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        ghost: 'shiny-btn--ghost rounded-md hover:bg-accent hover:text-accent-foreground',
        link: 'shiny-btn--link text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    const solid = variant === 'default' || variant === 'destructive' || variant === 'secondary' || !variant

    return (
      <>
        <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props}>
          {solid ? (
            <>
              <span className="shiny-btn__border" aria-hidden="true" />
              <span className="shiny-btn__glow" aria-hidden="true" />
              <span className="shiny-btn__surface">
                <span className="shiny-btn__dots" aria-hidden="true" />
                <span className="shiny-btn__sweep" aria-hidden="true" />
                <span className="shiny-btn__label">{children}</span>
              </span>
            </>
          ) : (
            <>
              <span className="shiny-btn__border shiny-btn__border--thin" aria-hidden="true" />
              <span className="shiny-btn__label shiny-btn__label--plain">{children}</span>
            </>
          )}
        </Comp>

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

          @keyframes shiny-sweep {
            0% {
              left: -60%;
            }
            55%,
            100% {
              left: 130%;
            }
          }

          .shiny-btn {
            position: relative;
            isolation: isolate;
            overflow: hidden;
            -webkit-tap-highlight-color: transparent;
            transition: transform 240ms cubic-bezier(0.22, 1, 0.36, 1);
          }

          .shiny-btn:hover {
            transform: scale(1.03);
          }

          .shiny-btn:active {
            transform: scale(0.97);
          }

          .shiny-btn:disabled {
            transform: none;
          }

          /* --- animated border (all variants) --- */
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
            pointer-events: none;
          }

          .shiny-btn:hover .shiny-btn__border {
            opacity: 1;
            animation-duration: 2.4s;
          }

          .shiny-btn__border--thin {
            padding: 1px;
            opacity: 0.5;
          }

          .shiny-btn:hover .shiny-btn__border--thin {
            opacity: 0.85;
          }

          /* --- ambient glow (solid variants only) --- */
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
            opacity: 0.45;
            z-index: -1;
            animation: shiny-spin 4s linear infinite;
            transition: opacity 260ms ease, filter 260ms ease;
            pointer-events: none;
          }

          .shiny-btn:hover .shiny-btn__glow {
            opacity: 0.8;
            filter: blur(18px);
            animation-duration: 2.4s;
          }

          /* --- solid dark surface (default / destructive / secondary) --- */
          .shiny-btn__surface {
            position: relative;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            overflow: hidden;
            width: 100%;
            height: 100%;
            border-radius: inherit;
            background:
              linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0) 40%),
              radial-gradient(120% 140% at 50% -20%, #262626 0%, #0a0a0a 60%),
              #050505;
            box-shadow:
              inset 0 1px 0 0 rgba(255, 255, 255, 0.14),
              inset 0 -1px 8px 0 rgba(0, 0, 0, 0.6);
          }

          .shiny-btn--destructive .shiny-btn__surface {
            background:
              linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0) 40%),
              radial-gradient(120% 140% at 50% -20%, #3a0d0d 0%, #1a0505 60%),
              #0a0202;
          }

          .shiny-btn--destructive .shiny-btn__glow {
            background: conic-gradient(
              from var(--angle, 0deg),
              transparent 0deg,
              rgba(248, 113, 113, 0.55) 90deg,
              rgba(251, 146, 60, 0.4) 160deg,
              rgba(244, 63, 94, 0.5) 260deg,
              transparent 360deg
            );
          }

          .shiny-btn--secondary .shiny-btn__surface {
            background:
              linear-gradient(180deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0) 40%),
              radial-gradient(120% 140% at 50% -20%, #33343a 0%, #17181c 60%),
              #0e0f12;
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
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            font-weight: 600;
            letter-spacing: -0.01em;
            color: #ffffff;
            white-space: nowrap;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
          }

          /* --- outline / ghost / link: keep native colors, just add the animated ring --- */
          .shiny-btn__label--plain {
            color: inherit;
            text-shadow: none;
            font-weight: 500;
          }

          .shiny-btn--ghost .shiny-btn__border,
          .shiny-btn--link .shiny-btn__border {
            display: none;
          }

          .shiny-btn--ghost:hover .shiny-btn__border {
            display: block;
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
      </>
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
