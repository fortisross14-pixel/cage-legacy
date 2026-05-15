/**
 * SVG-based country flag, renders consistently on Chrome/Windows
 * (where regional-indicator emoji flags fall back to "DE", "US" etc.).
 *
 * Flags are inline SVGs of common patterns — not pixel-perfect official versions,
 * but visually recognizable and lightweight.
 *
 * Add new codes here as the COUNTRIES list grows.
 */
import type { CountryCode } from '@/types';

interface FlagProps {
  code: CountryCode;
  size?: number;     // height in px; width auto
  className?: string;
  title?: string;
}

export function Flag({ code, size = 16, className, title }: FlagProps) {
  const FlagSVG = FLAGS[code] ?? FlagFallback;
  return (
    <span
      className={`flag ${className ?? ''}`}
      style={{ display: 'inline-flex', height: size, width: size * 1.5, lineHeight: 0, verticalAlign: 'middle' }}
      title={title ?? code}
      aria-label={title ?? code}
    >
      <FlagSVG />
    </span>
  );
}

// Common viewBox 3:2
const VB = '0 0 30 20';

// --- Individual flag SVGs ----------------------------------------------------

function S(props: { children: any }) {
  return (
    <svg viewBox={VB} preserveAspectRatio="xMidYMid slice" width="100%" height="100%">
      {props.children}
    </svg>
  );
}

const US = () => (
  <S>
    <rect width="30" height="20" fill="#b22234" />
    {/* 6 white stripes */}
    {[1, 3, 5, 7, 9, 11].map((i) => (
      <rect key={i} y={(i * 20) / 13} width="30" height={20 / 13} fill="#fff" />
    ))}
    {/* Canton */}
    <rect width="12" height={(7 * 20) / 13} fill="#3c3b6e" />
    {/* Tiny "stars" suggested as a dot grid */}
    {Array.from({ length: 5 }).map((_, r) =>
      Array.from({ length: 6 }).map((__, c) => (
        <circle key={`${r}-${c}`} cx={1 + c * 2} cy={1 + r * 2} r="0.25" fill="#fff" />
      ))
    )}
  </S>
);

const BR = () => (
  <S>
    <rect width="30" height="20" fill="#009c3b" />
    <polygon points="15,2 28,10 15,18 2,10" fill="#ffdf00" />
    <circle cx="15" cy="10" r="4" fill="#002776" />
  </S>
);

const RU = () => (
  <S>
    <rect width="30" height="6.67" fill="#fff" />
    <rect width="30" height="6.67" y="6.67" fill="#0039a6" />
    <rect width="30" height="6.67" y="13.33" fill="#d52b1e" />
  </S>
);

const DAG = () => (
  // Synthetic — green/blue with mountain
  <S>
    <rect width="30" height="20" fill="#1a4a7a" />
    <polygon points="0,20 10,8 18,14 25,5 30,20" fill="#2d6e3e" />
    <circle cx="22" cy="5" r="2" fill="#f0e68c" />
  </S>
);

const IE = () => (
  <S>
    <rect width="10" height="20" fill="#169b62" />
    <rect width="10" height="20" x="10" fill="#fff" />
    <rect width="10" height="20" x="20" fill="#ff883e" />
  </S>
);

const GB_ENG = () => (
  <S>
    <rect width="30" height="20" fill="#fff" />
    <rect width="6" height="20" x="12" fill="#ce1124" />
    <rect width="30" height="6" y="7" fill="#ce1124" />
  </S>
);

const MX = () => (
  <S>
    <rect width="10" height="20" fill="#006847" />
    <rect width="10" height="20" x="10" fill="#fff" />
    <rect width="10" height="20" x="20" fill="#ce1126" />
    <circle cx="15" cy="10" r="2.5" fill="none" stroke="#8b4513" strokeWidth="0.4" />
  </S>
);

const JP = () => (
  <S>
    <rect width="30" height="20" fill="#fff" />
    <circle cx="15" cy="10" r="6" fill="#bc002d" />
  </S>
);

const KR = () => (
  <S>
    <rect width="30" height="20" fill="#fff" />
    <circle cx="15" cy="10" r="4.5" fill="#cd2e3a" />
    <path d="M 10.5 10 A 4.5 4.5 0 0 1 19.5 10 A 2.25 2.25 0 0 0 15 10 A 2.25 2.25 0 0 1 10.5 10 Z" fill="#0047a0" />
  </S>
);

const NG = () => (
  <S>
    <rect width="10" height="20" fill="#008751" />
    <rect width="10" height="20" x="10" fill="#fff" />
    <rect width="10" height="20" x="20" fill="#008751" />
  </S>
);

const NZ = () => (
  <S>
    <rect width="30" height="20" fill="#00247d" />
    {/* Union jack quadrant */}
    <rect width="15" height="10" fill="#00247d" />
    <line x1="0" y1="0" x2="15" y2="10" stroke="#fff" strokeWidth="1.5" />
    <line x1="15" y1="0" x2="0" y2="10" stroke="#fff" strokeWidth="1.5" />
    <rect x="6.5" width="2" height="10" fill="#fff" />
    <rect y="4" width="15" height="2" fill="#fff" />
    <rect x="7" width="1" height="10" fill="#cc0000" />
    <rect y="4.5" width="15" height="1" fill="#cc0000" />
    {/* Southern Cross suggestion */}
    {[
      [22, 6],
      [25, 11],
      [22, 14],
      [27, 16],
    ].map(([cx, cy], i) => (
      <polygon
        key={i}
        points={`${cx},${cy - 1} ${cx + 0.4},${cy - 0.3} ${cx + 1},${cy} ${cx + 0.4},${cy + 0.3} ${cx},${cy + 1} ${cx - 0.4},${cy + 0.3} ${cx - 1},${cy} ${cx - 0.4},${cy - 0.3}`}
        fill="#cc0000"
      />
    ))}
  </S>
);

const AU = () => (
  <S>
    <rect width="30" height="20" fill="#00008b" />
    {/* Union jack quadrant */}
    <rect width="15" height="10" fill="#00008b" />
    <line x1="0" y1="0" x2="15" y2="10" stroke="#fff" strokeWidth="1.5" />
    <line x1="15" y1="0" x2="0" y2="10" stroke="#fff" strokeWidth="1.5" />
    <rect x="6.5" width="2" height="10" fill="#fff" />
    <rect y="4" width="15" height="2" fill="#fff" />
    <rect x="7" width="1" height="10" fill="#cc0000" />
    <rect y="4.5" width="15" height="1" fill="#cc0000" />
    {/* Commonwealth Star + Southern Cross */}
    <polygon points="7.5,16 8,14.5 9,14 8,13.5 7.5,12 7,13.5 6,14 7,14.5" fill="#fff" />
    {[
      [22, 5],
      [26, 10],
      [22, 15],
      [27, 13],
    ].map(([cx, cy], i) => (
      <polygon
        key={i}
        points={`${cx},${cy - 1} ${cx + 0.4},${cy - 0.3} ${cx + 1},${cy} ${cx + 0.4},${cy + 0.3} ${cx},${cy + 1} ${cx - 0.4},${cy + 0.3} ${cx - 1},${cy} ${cx - 0.4},${cy - 0.3}`}
        fill="#fff"
      />
    ))}
  </S>
);

const CA = () => (
  <S>
    <rect width="30" height="20" fill="#ff0000" />
    <rect x="7.5" width="15" height="20" fill="#fff" />
    {/* Maple leaf — simplified */}
    <polygon
      points="15,4 16,8 19,7 17,10 19,12 16,12 15,16 14,12 11,12 13,10 11,7 14,8"
      fill="#ff0000"
    />
  </S>
);

const PL = () => (
  <S>
    <rect width="30" height="10" fill="#fff" />
    <rect width="30" height="10" y="10" fill="#dc143c" />
  </S>
);

const SE = () => (
  <S>
    <rect width="30" height="20" fill="#006aa7" />
    <rect width="3" height="20" x="9" fill="#fecc00" />
    <rect width="30" height="3" y="8.5" fill="#fecc00" />
  </S>
);

const FR = () => (
  <S>
    <rect width="10" height="20" fill="#002395" />
    <rect width="10" height="20" x="10" fill="#fff" />
    <rect width="10" height="20" x="20" fill="#ed2939" />
  </S>
);

const DE = () => (
  <S>
    <rect width="30" height="6.67" fill="#000" />
    <rect width="30" height="6.67" y="6.67" fill="#dd0000" />
    <rect width="30" height="6.67" y="13.33" fill="#ffce00" />
  </S>
);

const NL = () => (
  <S>
    <rect width="30" height="6.67" fill="#ae1c28" />
    <rect width="30" height="6.67" y="6.67" fill="#fff" />
    <rect width="30" height="6.67" y="13.33" fill="#21468b" />
  </S>
);

const CM = () => (
  <S>
    <rect width="10" height="20" fill="#007a5e" />
    <rect width="10" height="20" x="10" fill="#ce1126" />
    <rect width="10" height="20" x="20" fill="#fcd116" />
    <polygon points="15,7 15.7,9 17.8,9 16.1,10.3 16.8,12.3 15,11 13.2,12.3 13.9,10.3 12.2,9 14.3,9" fill="#fcd116" />
  </S>
);

const KZ = () => (
  <S>
    <rect width="30" height="20" fill="#00afca" />
    <circle cx="15" cy="10" r="3.5" fill="#fec50c" stroke="#fec50c" strokeWidth="0.4" />
  </S>
);

const FlagFallback = () => (
  <S>
    <rect width="30" height="20" fill="#333" />
    <rect x="0.5" y="0.5" width="29" height="19" fill="none" stroke="#666" strokeWidth="0.5" />
  </S>
);

const FLAGS: Record<string, () => any> = {
  US, BR, RU, DAG, IE,
  'GB-ENG': GB_ENG,
  MX, JP, KR, NG, NZ, AU, CA, PL, SE, FR, DE, NL, CM, KZ,
};
