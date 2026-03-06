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
      {/* Linde "L" script mark */}
      {showTriangle && (
        <path
          d="
            M 20,4
            C 16,3 11,10 10,20
            C 8,32 9,46 10,60
            C 11,71 11,80 9,87
            C 7,93 2,97 6,99
            C 14,99 34,94 50,84
            C 60,77 63,67 58,63
            C 54,60 43,64 33,69
            C 24,73 20,75 17,73
            C 15,68 15,54 16,40
            C 17,24 21,10 26,5
            C 28,1 24,2 20,4 Z
          "
          fill={color}
          opacity={0.88}
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
