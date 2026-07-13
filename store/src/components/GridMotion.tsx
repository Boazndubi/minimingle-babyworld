import { useEffect, useRef, useCallback, isValidElement, ReactNode } from 'react';
import { gsap } from 'gsap';
import './GridMotion.css';

type GridItem = string | ReactNode;

interface GridMotionProps {
  items?: GridItem[];
  gradientColor?: string;
}

const GridMotion = ({ items = [], gradientColor = 'black' }: GridMotionProps) => {
  const gridRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const autoScrollTweens = useRef<gsap.core.Tween[]>([]);

  const totalItems = 28;
  const defaultItems = Array.from({ length: totalItems }, (_, index) => `Item ${index + 1}`);
  const combinedItems = items.length > 0 ? items.slice(0, totalItems) : defaultItems;

  const setRowRef = useCallback((el: HTMLDivElement | null, index: number) => {
    rowRefs.current[index] = el;
  }, []);

  // Continuous auto-scroll — starts immediately on mount, no mouse needed
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Kill any existing tweens before creating new ones
    autoScrollTweens.current.forEach(tween => tween.kill());
    autoScrollTweens.current = [];

    const autoScrollSpeed = 80; // HIGHER = FASTER (was 30, now 80)

    rowRefs.current.forEach((row, index) => {
      if (!row) return;

      // Set initial position so animation starts from visible area
      const rowWidth = row.scrollWidth / 2;
      const direction = index % 2 === 0 ? -1 : 1;

      // Start from 0 so content is immediately visible
      gsap.set(row, { x: 0 });

      const tween = gsap.to(row, {
        x: direction * rowWidth,
        duration: rowWidth / autoScrollSpeed,
        ease: 'none',
        repeat: -1,
        modifiers: {
          x: gsap.utils.unitize((x: number) => {
            const currentX = parseFloat(String(x));
            if (direction === -1) {
              // Moving left: wrap from -width to 0
              return ((currentX % rowWidth) + rowWidth) % rowWidth - rowWidth;
            } else {
              // Moving right: wrap from 0 to width
              return ((currentX % rowWidth) + rowWidth) % rowWidth;
            }
          })
        }
      });

      autoScrollTweens.current.push(tween);
    });

    return () => {
      autoScrollTweens.current.forEach(tween => tween.kill());
      autoScrollTweens.current = [];
    };
  }, [combinedItems]);

  const renderItem = (item: GridItem): ReactNode => {
    if (isValidElement(item)) {
      return item;
    }
    if (typeof item === 'string' && item.startsWith('http')) {
      return (
        <div
          className="row__item-img"
          style={{ backgroundImage: `url(${item})` }}
        />
      );
    }
    return <div className="row__item-content">{String(item)}</div>;
  };

  return (
    <div className="noscroll loading" ref={gridRef}>
      <section
        className="intro"
        style={{
          background: `radial-gradient(circle, ${gradientColor} 0%, transparent 100%)`,
        }}
      >
        <div className="gridMotion-container">
          {[...Array(4)].map((_, rowIndex) => (
            <div
              key={rowIndex}
              className="row"
              ref={(el) => setRowRef(el, rowIndex)}
            >
              {/* Original 7 items */}
              {[...Array(7)].map((_, itemIndex) => {
                const content = combinedItems[rowIndex * 7 + itemIndex];
                return (
                  <div key={`a-${rowIndex}-${itemIndex}`} className="row__item">
                    <div className="row__item-inner" style={{ backgroundColor: '#f472b6' }}>
                      {renderItem(content)}
                    </div>
                  </div>
                );
              })}
              {/* Duplicated 7 items for seamless loop */}
              {[...Array(7)].map((_, itemIndex) => {
                const content = combinedItems[rowIndex * 7 + itemIndex];
                return (
                  <div key={`b-${rowIndex}-${itemIndex}`} className="row__item">
                    <div className="row__item-inner" style={{ backgroundColor: '#f472b6' }}>
                      {renderItem(content)}
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