'use client';
/**
 * LindeLogo — inline SVG replicating the Linde corporate wordmark.
 * Renders the italic "Linde" script with the signature blue triangle
 * swoosh element that appears on linde.com.
 *
 * Fully inline — no external network request. Color adapts via prop.
 */
import React from 'react';

interface LindeLogoProps {
  width?: number;
  height?: number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
  showTriangle?: boolean;
}

export default function LindeLogo({
  width = 90,
  height,
  color = '#fff',
  className,
  style,
  showTriangle = true,
}: LindeLogoProps) {
  const h = height ?? Math.round(width / 2.8);

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 280 100"
      width={width}
      height={h}
      className={className}
      style={style}
      aria-label="Linde"
    >
      {/* Blue triangle / swoosh element (Linde brand mark) */}
      {showTriangle && (
        <path
          d="M0 95 L55 0 L110 95 Z"
          fill={color}
          opacity={0.18}
        />
      )}
      {/* "Linde" wordmark — italic serif */}
      <text
        x={showTriangle ? 62 : 10}
        y="78"
        fontFamily="Georgia, 'Times New Roman', 'Palatino Linotype', serif"
        fontWeight="400"
        fontStyle="italic"
        fontSize="72"
        fill={color}
        letterSpacing="-2"
      >
        Linde
      </text>
      {/* Trademark-style underline accent */}
      <line
        x1={showTriangle ? 65 : 12}
        y1="88"
        x2={showTriangle ? 268 : 215}
        y2="88"
        stroke={color}
        strokeWidth="1.5"
        opacity={0.25}
      />
    </svg>
  );
}
