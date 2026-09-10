import React from "react";

/**
 * The app's mark: a three-shikhara temple skyline referencing Ayodhya's Ram
 * Mandir (a tall central spire flanked by two shorter ones, each a stack of
 * tiered "amalaka" rings narrowing toward a kalash finial, on a plinth) —
 * rather than a single generic spire. Deliberately kept as flat filled
 * silhouettes with no thin strokes, so the tiering ("layers") stays crisp
 * and doesn't collapse into a smudge at sidebar sizes (13-28px). An earlier
 * bow-and-arrow (Kodanda) concept read as a generic "back/undo" arrow icon
 * at these sizes and was replaced; this shape was screenshot-verified to
 * still read clearly as a temple skyline at 13px. Inherits color via
 * currentColor so it works on any gradient badge.
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
      aria-label="Ramayana HelpBot"
    >
      {/* left minor shikhara */}
      <path d="M2.6 16.2H6.4L5.5 12.6H3.5L2.6 16.2Z" fill="currentColor" opacity="0.85" />
      <path d="M3.7 12.4H5.3L4.5 9.2L3.7 12.4Z" fill="currentColor" opacity="0.85" />
      <circle cx="4.5" cy="8.7" r="0.55" fill="currentColor" opacity="0.85" />

      {/* right minor shikhara */}
      <path d="M17.6 16.2H21.4L20.5 12.6H18.5L17.6 16.2Z" fill="currentColor" opacity="0.85" />
      <path d="M18.7 12.4H20.3L19.5 9.2L18.7 12.4Z" fill="currentColor" opacity="0.85" />
      <circle cx="19.5" cy="8.7" r="0.55" fill="currentColor" opacity="0.85" />

      {/* central shikhara — tiered tower */}
      <path d="M9.2 16.2H14.8L13.6 11.4H10.4L9.2 16.2Z" fill="currentColor" />
      <path d="M10.8 11H13.2L12 4.4L10.8 11Z" fill="currentColor" />
      <circle cx="12" cy="3.5" r="1" fill="currentColor" />
      {/* dhwaja finial flag */}
      <rect x="11.75" y="0.8" width="0.5" height="2.6" rx="0.25" fill="currentColor" />
      <path d="M12.25 1.1 14.1 1.85 12.25 2.6Z" fill="currentColor" opacity="0.92" />

      {/* plinth */}
      <rect x="2" y="17.5" width="20" height="1.5" rx="0.4" fill="currentColor" opacity="0.9" />
      <rect x="1.1" y="19.2" width="21.8" height="1.7" rx="0.5" fill="currentColor" opacity="0.75" />
    </svg>
  );
}
