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
        d="M2.4 13.2C5.7 12.4 9 12.9 11.3 14.4V21.8C9 20.4 5.7 20 2.4 20.8Z"
        fill="currentColor"
      />
      <path
        d="M21.6 13.2C18.3 12.4 15 12.9 12.7 14.4V21.8C15 20.4 18.3 20 21.6 20.8Z"
        fill="currentColor"
        opacity="0.78"
      />

      {/* flame of knowledge with an inner teardrop cut-out */}
      <path
        className="logoFlame"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 1.6C12.2 3.4 15.4 5.2 15.4 8.4C15.4 10.6 13.9 12 12 12C10.1 12 8.6 10.6 8.6 8.4C8.6 6.9 9.4 5.9 10.2 4.9C10.4 6 10.9 6.6 11.5 6.8C11.3 5.2 11.5 3.2 12 1.6ZM12 7.4C12.9 8.2 13.4 8.9 13.4 9.5C13.4 10.2 12.8 10.7 12 10.7C11.2 10.7 10.6 10.2 10.6 9.5C10.6 8.9 11.1 8.2 12 7.4Z"
        fill="currentColor"
      />

      {/* AI spark */}
      <path
        className="logoSpark"
        d="M19.6 2.6L20.2 4.2L21.8 4.8L20.2 5.4L19.6 7L19 5.4L17.4 4.8L19 4.2Z"
        fill="currentColor"
      />
    </svg>
  );
}
