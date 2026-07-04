import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import './GridMotion.css';

interface GridMotionProps {
  items?: (string | { type: 'image'; src: string } | { type: 'text'; content: string })[];
  gradientColor?: string;
}

const GridMotion = ({ items = [], gradientColor = 'black' }: GridMotionProps) => {
  const gridRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const mouseXRef = useRef<number>(0);

  const totalItems = 28;
  const defaultItems = Array.from({ length: totalItems }, (_, index) => `Item ${index + 1}`);
  const combinedItems = items.length > 0 ? items.slice(0, totalItems) : defaultItems;

  useEffect(() => {
    // Guard for SSR
    if (typeof window === 'undefined') return;

    // Initialize mouse position to center
    mouseXRef.current = window.innerWidth / 2;

    const previousLagSmoothing = gsap.ticker.lagSmoothing();
    gsap.ticker.lagSmoothing(0);

    const handleMouseMove = (e: MouseEvent) => {
      mouseXRef.current = e.clientX;
    };

    const updateMotion = () => {
      const maxMoveAmount = 300;
      const baseDuration = 0.8;
      const inertiaFactors = [0.6, 0.4, 0.3, 0.2];

      rowRefs.current.forEach((row, index) => {
        if (row) {
          const direction = index % 2 === 0 ? 1 : -1;
          const moveAmount = ((mouseXRef.current / window.innerWidth) * maxMoveAmount - maxMoveAmount / 2) * direction;

          gsap.to(row, {
            x: moveAmount,
            duration: baseDuration + inertiaFactors[index % inertiaFactors.length],
            ease: 'power3.out',
            overwrite: 'auto'
          });
        }
      });
    };

    const removeAnimationLoop = gsap.ticker.add(updateMotion);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      removeAnimationLoop();
      gsap.ticker.lagSmoothing(previousLagSmoothing); // Restore previous value
    };
  }, []);

  const getContent = (item: unknown): { isImage: boolean; value: string } => {
    if (typeof item === 'string') {
      return { isImage: item.startsWith('http'), value: item };
    }
    return { isImage: false, value: String(item) };
  };

  return (
    <div className="noscroll loading" ref={gridRef}>
      <section
        className="intro"
        style={{
          background: `radial-gradient(circle, ${gradientColor} 0%, transparent 100%)`
        }}
      >
        <div className="gridMotion-container">
          {[...Array(4)].map((_, rowIndex) => (
            <div 
              key={rowIndex} 
              className="row" 
              ref={(el) => { rowRefs.current[rowIndex] = el; }}
            >
              {[...Array(7)].map((_, itemIndex) => {
                const content = combinedItems[rowIndex * 7 + itemIndex];
                const { isImage, value } = getContent(content);
                
                return (
                  <div key={`${rowIndex}-${itemIndex}`} className="row__item">
                    <div className="row__item-inner" style={{ backgroundColor: '#f472b6' }}>
                      {isImage ? (
                        <div
                          className="row__item-img"
                          style={{
                            backgroundImage: `url(${value})`
                          }}
                        />
                      ) : (
                        <div className="row__item-content">{value}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <div className="fullview" />
      </section>
    </div>
  );
};

export default GridMotion;