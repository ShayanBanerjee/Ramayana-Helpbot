import React from "react";

/**
 * The Grantha mark: an open manuscript (the "grantha" itself — the sacred
 * text, i.e. the trustworthy knowledge base) with a flame of knowledge
 * (jyoti) rising from its spine, and a four-point spark beside the flame
 * (the AI that helps you explore it). Ordered by meaning: book = grounded
 * in the text, flame = illumination/devotion (the diya of Diwali and Ram's
 * return), spark = AI.
 *
 * Deliberately flat filled shapes with no thin strokes, so it stays crisp
 * at sidebar sizes (13-28px). The flame's inner cut-out and the page gap
 * are negative space (evenodd), so it works on any background through
 * currentColor. The spark carries `.logoSpark` so CSS can give it a gentle
 * twinkle (disabled under prefers-reduced-motion).
 *
 * Keep `frontend/public/favicon.svg` in sync if these paths change.
 */
export default function Logo({ size = 24, className }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      role="img"
      aria-label="Grantha"
    >
      {/* open manuscript: two curved pages meeting at a spine */}
      <path
        d="M1.8 11.2C5.4 10.2 8.9 10.7 11.3 12.4V21.3C8.9 19.7 5.4 19.3 1.8 20.3Z"
        fill="currentColor"
      />
      <path
        d="M22.2 11.2C18.6 10.2 15.1 10.7 12.7 12.4V21.3C15.1 19.7 18.6 19.3 22.2 20.3Z"
        fill="currentColor"
        opacity="0.82"
      />

      {/* flame of knowledge with an inner cut-out */}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2.2C13.3 4 15.2 5.5 15.2 8.1C15.2 10.3 13.8 11.7 12 11.7C10.2 11.7 8.8 10.3 8.8 8.1C8.8 5.5 10.7 4 12 2.2ZM12 6.1C11.3 7.1 10.7 7.7 10.7 8.6C10.7 9.4 11.3 9.9 12 9.9C12.7 9.9 13.3 9.4 13.3 8.6C13.3 7.7 12.7 7.1 12 6.1Z"
        fill="currentColor"
      />

      {/* AI spark */}
      <path
        className="logoSpark"
        d="M19.2 2.2L19.9 4.1L21.8 4.8L19.9 5.5L19.2 7.4L18.5 5.5L16.6 4.8L18.5 4.1Z"
        fill="currentColor"
      />
    </svg>
  );
}
