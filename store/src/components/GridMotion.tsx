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

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Kill existing tweens
    autoScrollTweens.current.forEach(tween => tween.kill());
    autoScrollTweens.current = [];

    const autoScrollSpeed = 50; // pixels per second

    rowRefs.current.forEach((row, index) => {
      if (!row) return;

      const direction = index % 2 === 0 ? -1 : 1;
      
      // Get the width of ONE set of items (7 items)
      const items = row.querySelectorAll('.row__item');
      const singleSetWidth = Array.from(items).slice(0, 7).reduce((acc, item) => {
        return acc + (item as HTMLElement).offsetWidth;
      }, 0);

      // Position the row so we can scroll seamlessly
      gsap.set(row, { x: 0 });

      // Create seamless infinite scroll
      const tween = gsap.to(row, {
        x: direction * singleSetWidth,
        duration: singleSetWidth / autoScrollSpeed,
        ease: 'none',
        repeat: -1,
        onRepeat: () => {
          // Reset position seamlessly without visible jump
          gsap.set(row, { x: 0 });
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
              {/* TRIPLICATE items for truly seamless loop (3 sets = A-B-C) */}
              {[...Array(3)].map((_, setIndex) => (
                [...Array(7)].map((_, itemIndex) => {
                  const content = combinedItems[rowIndex * 7 + itemIndex];
                  return (
                    <div key={`${setIndex}-${rowIndex}-${itemIndex}`} className="row__item">
                      <div className="row__item-inner" style={{ backgroundColor: '#f472b6' }}>
                        {renderItem(content)}
                      </div>
                    </div>
                  );
                })
              ))}
            </div>
          ))}
        </div>
        <div className="fullview" />
      </section>
    </div>
  );
};

export default GridMotion;