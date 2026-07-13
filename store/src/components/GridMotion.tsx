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

    autoScrollTweens.current.forEach(tween => tween.kill());
    autoScrollTweens.current = [];

    const autoScrollSpeed = 30;

    rowRefs.current.forEach((row, index) => {
      if (!row) return;

      const direction = index % 2 === 0 ? 1 : -1;
      
      const itemElements = row.querySelectorAll('.row__item');
      const singleSetWidth = Array.from(itemElements).slice(0, 7).reduce((acc, item) => {
        return acc + (item as HTMLElement).offsetWidth;
      }, 0);

      const startX = direction === 1 ? -singleSetWidth : 0;
      gsap.set(row, { x: startX });

      const tween = gsap.to(row, {
        x: startX + (direction * singleSetWidth),
        duration: singleSetWidth / autoScrollSpeed,
        ease: 'none',
        repeat: -1,
        modifiers: {
          x: gsap.utils.unitize((x: number) => {
            return gsap.utils.wrap(-singleSetWidth, 0, x);
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