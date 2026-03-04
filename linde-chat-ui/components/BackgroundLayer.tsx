'use client';
import { useEffect, useRef } from 'react';

export default function BackgroundLayer() {
  const bgImgRef = useRef<HTMLDivElement>(null);
  const orb1Ref = useRef<HTMLDivElement>(null);
  const orb2Ref = useRef<HTMLDivElement>(null);
  const orb3Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let rafId: number;
    let targetX = 0, targetY = 0;
    let currentX = 0, currentY = 0;

    const onMouseMove = (e: MouseEvent) => {
      targetX = (e.clientX / window.innerWidth  - 0.5);
      targetY = (e.clientY / window.innerHeight - 0.5);
    };

    const animate = () => {
      // Smooth lerp
      currentX += (targetX - currentX) * 0.06;
      currentY += (targetY - currentY) * 0.06;

      if (bgImgRef.current) {
        const dx = currentX * 6;
        const dy = currentY * 6;
        bgImgRef.current.style.transform = `translate(${dx}px,${dy}px) scale(1.02)`;
      }

      // Orbs move more aggressively for a layered parallax feel
      if (orb1Ref.current) {
        orb1Ref.current.style.transform = `translate(${currentX * -20}px, ${currentY * -15}px)`;
      }
      if (orb2Ref.current) {
        orb2Ref.current.style.transform = `translate(${currentX * 16}px, ${currentY * 12}px)`;
      }
      if (orb3Ref.current) {
        orb3Ref.current.style.transform = `translate(${currentX * 10}px, ${currentY * -18}px)`;
      }

      rafId = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', onMouseMove);
    rafId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div className="bg-root">
      {/* Parallax background image layer */}
      <div ref={bgImgRef} className="bg-img-layer" />

      {/* Animated floating orbs */}
      <div
        ref={orb1Ref}
        className="bg-orb bg-orb-1"
        style={{ transition: 'transform 0.1s linear' }}
      />
      <div
        ref={orb2Ref}
        className="bg-orb bg-orb-2"
        style={{ transition: 'transform 0.1s linear' }}
      />
      <div
        ref={orb3Ref}
        className="bg-orb bg-orb-3"
        style={{ transition: 'transform 0.1s linear' }}
      />

      {/* Static ambient orbs (CSS animated) */}
      <div style={{
        position: 'absolute',
        width: '20vw', height: '20vw',
        top: '25%', left: '70%',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,181,226,0.08) 0%, transparent 70%)',
        filter: 'blur(40px)',
        animation: 'orbFloat3 16s ease-in-out infinite',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        width: '15vw', height: '15vw',
        top: '60%', left: '10%',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,71,171,0.1) 0%, transparent 70%)',
        filter: 'blur(50px)',
        animation: 'orbFloat 24s ease-in-out infinite 6s',
        pointerEvents: 'none',
      }} />
    </div>
  );
}
