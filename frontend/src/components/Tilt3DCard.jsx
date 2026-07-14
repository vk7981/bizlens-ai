import React, { useState, useEffect, useRef } from 'react';

export default function Tilt3DCard({ children, className = '' }) {
  const cardRef = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0, scale: 1 });
  const [scrollYOffset, setScrollYOffset] = useState(0);
  const [shine, setShine] = useState({ x: 50, y: 50, opacity: 0 });

  useEffect(() => {
    // 3D PARALLAX SCROLL EFFECT
    const handleScroll = () => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      
      // Calculate how far the card is from the center of the screen (-1 to 1)
      const cardCenter = rect.top + rect.height / 2;
      const screenCenter = viewportHeight / 2;
      const distanceFromCenter = (cardCenter - screenCenter) / screenCenter;
      
      // Apply a subtle rotation based on scroll position
      // As you scroll down (distance > 0), tilt backwards (negative rotateX)
      // As you scroll up (distance < 0), tilt forwards (positive rotateX)
      const targetScrollY = distanceFromCenter * -12; // max 12 deg tilt
      
      setScrollYOffset(targetScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Run once on mount to establish position
    handleScroll();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 3D MOUSE HOVER TILT EFFECT
  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    
    // Relative coordinates of cursor inside the card
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Convert to percentage coordinates (-0.5 to 0.5)
    const pctX = (x / rect.width) - 0.5;
    const pctY = (y / rect.height) - 0.5;
    
    // Tilt calculations (max 10 degrees)
    // Moving mouse to the right (pctX > 0) rotates Y positively (tilts right)
    // Moving mouse down (pctY > 0) rotates X negatively (tilts down)
    const tiltX = pctY * -12;
    const tiltY = pctX * 12;
    
    setTilt({ x: tiltX, y: tiltY, scale: 1.02 });
    
    // Update shine overlay position
    const shineX = (x / rect.width) * 100;
    const shineY = (y / rect.height) * 100;
    setShine({ x: shineX, y: shineY, opacity: 0.15 });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0, scale: 1 });
    setShine(prev => ({ ...prev, opacity: 0 }));
  };

  // Combine scroll-driven rotation and mouse hover rotation
  const rotateX = tilt.x + scrollYOffset;
  const rotateY = tilt.y;

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`perspective-1000 relative overflow-hidden transition-all duration-300 ${className}`}
      style={{
        transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${tilt.scale})`,
        transformStyle: 'preserve-3d',
        transition: 'transform 0.15s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.3s ease',
      }}
    >
      {/* Dynamic Shine overlay */}
      <div 
        className="absolute inset-0 pointer-events-none mix-blend-screen transition-opacity duration-300"
        style={{
          opacity: shine.opacity,
          background: `radial-gradient(circle 200px at ${shine.x}% ${shine.y}%, rgba(255, 255, 255, 0.4) 0%, transparent 80%)`,
        }}
      />
      {children}
    </div>
  );
}
