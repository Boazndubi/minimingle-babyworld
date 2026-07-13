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
  const imagesLoaded = useRef(0);
  const [isLoaded, setIsLoaded] = useState(false);

  const totalItems = 28;
  const defaultItems = Array.from({ length: totalItems }, (_, index) => `Item ${index + 1}`);
  const combinedItems = items.length > 0 ? items.slice(0, totalItems) : defaultItems;

  const setRowRef = useCallback((el: HTMLDivElement | null, index: number) => {
    rowRefs.current[index] = el;
  }, []);

  // 4. Loading state tracking
  const handleImageLoad = () => {
    imagesLoaded.current += 1;
    if (imagesLoaded.current >= combinedItems.filter(i => typeof i === 'string' && i.startsWith('http')).length) {
      setIsLoaded(true);
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Kill existing tweens
    autoScrollTweens.current.forEach(tween => tween.kill());
    autoScrollTweens.current = [];

    const autoScrollSpeed = 50;

    rowRefs.current.forEach((row, index) => {
      if (!row) return;

      const direction = index % 2 === 0 ? -1 : 1;
      
      const itemElements = row.querySelectorAll('.row__item');
      const singleSetCount = itemElements.length / 3;
      
      let singleSetWidth = 0;
      for (let i = 0; i < singleSetCount; i++) {
        singleSetWidth += (itemElements[i] as HTMLElement).offsetWidth;
      }

      const startX = direction === -1 ? 0 : -singleSetWidth;
      gsap.set(row, { x: startX });

      const endX = direction === -1 ? -singleSetWidth : 0;

      const tween = gsap.to(row, {
        x: endX,
        duration: singleSetWidth / autoScrollSpeed,
        ease: 'none',
        repeat: -1,
        modifiers: {
          x: gsap.utils.unitize((x: number) => {
            const wrapped = gsap.utils.wrap(-singleSetWidth, 0, parseFloat(String(x)));
            return wrapped;
          })
        }
      });

      autoScrollTweens.current.push(tween);
    });

    // 1. Hover pause
    const gridEl = gridRef.current;
    const handleMouseEnter = () => {
      autoScrollTweens.current.forEach(tween => tween.timeScale(0.2)); // Slow down instead of full pause
    };
    const handleMouseLeave = () => {
      autoScrollTweens.current.forEach(tween => tween.timeScale(1)); // Resume normal speed
    };

    gridEl?.addEventListener('mouseenter', handleMouseEnter);
    gridEl?.addEventListener('mouseleave', handleMouseLeave);

    // 3. Subtle parallax on mouse move
    const handleMouseMove = (e: MouseEvent) => {
      const mouseX = e.clientX / window.innerWidth;
      const mouseY = e.clientY / window.innerHeight;
      
      rowRefs.current.forEach((row, index) => {
        if (!row) return;
        const moveX = (mouseX - 0.5) * 15 * (index % 2 === 0 ? 1 : -1);
        const moveY = (mouseY - 0.5) * 8;
        
        gsap.to(row, {
          y: moveY,
          duration: 0.8,
          ease: 'power2.out',
          overwrite: 'auto'
        });
      });
    };
    window.addEventListener('mousemove', handleMouseMove);

    // 6. Fade-in entrance animation
    gsap.fromTo(gridRef.current, 
      { opacity: 0, scale: 1.05 },
      { opacity: 1, scale: 1, duration: 1.2, ease: 'power3.out', delay: 0.2 }
    );

    return () => {
      autoScrollTweens.current.forEach(tween => tween.kill());
      autoScrollTweens.current = [];
      gridEl?.removeEventListener('mouseenter', handleMouseEnter);
      gridEl?.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [combinedItems]);

  // 7. Intersection Observer for lazy loading images below fold
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLDivElement;
            const bgUrl = img.dataset.src;
            if (bgUrl) {
              img.style.backgroundImage = `url(${bgUrl})`;
              observer.unobserve(img);
            }
          }
        });
      },
      { rootMargin: '100px' }
    );

    const lazyImages = document.querySelectorAll('.row__item-img[data-src]');
    lazyImages.forEach(img => observer.observe(img));

    return () => observer.disconnect();
  }, [combinedItems]);

  const renderItem = (item: GridItem, index: number): ReactNode => {
    if (isValidElement(item)) {
      return item;
    }
    if (typeof item === 'string' && item.startsWith('http')) {
      // 7. Lazy loading with data-src
      return (
        <div
          className="row__item-img"
          data-src={item}
          style={{ 
            backgroundImage: index < 14 ? `url(${item})` : 'none', // Load first 14 immediately, rest lazy
            backgroundColor: '#f472b6'
          }}
          onLoad={handleImageLoad}
        />
      );
    }
    return <div className="row__item-content">{String(item)}</div>;
  };

  return (
    <div className={`noscroll loading ${!isLoaded ? 'opacity-50' : ''}`} ref={gridRef}>
      {/* 4. Loading skeleton overlay */}
      {!isLoaded && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900">
          <div className="animate-pulse flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-pink-500/30 animate-bounce" />
            <span className="text-pink-400 text-sm font-medium">Loading...</span>
          </div>
        </div>
      )}
      
      <section
        className="intro relative"
        style={{
          background: `radial-gradient(circle, ${gradientColor} 0%, transparent 100%)`,
        }}
      >
        {/* 8. Edge vignette overlay */}
        <div 
          className="absolute inset-0 z-10 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.7) 100%)'
          }}
        />
        
        {/* 8. Side fade masks */}
        <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-slate-900 to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-slate-900 to-transparent z-10 pointer-events-none" />

        <div className="gridMotion-container relative z-0">
          {[...Array(4)].map((_, rowIndex) => (
            <div
              key={rowIndex}
              className="row"
              ref={(el) => setRowRef(el, rowIndex)}
            >
              {[...Array(3)].map((_, setIndex) => (
                [...Array(7)].map((_, itemIndex) => {
                  const content = combinedItems[rowIndex * 7 + itemIndex];
                  const globalIndex = rowIndex * 7 + itemIndex;
                  return (
                    <div 
                      key={`${setIndex}-${rowIndex}-${itemIndex}`} 
                      className="row__item cursor-pointer hover:scale-105 transition-transform duration-300"
                      onClick={() => {
                        // 2. Click to navigate (optional - add product slug mapping)
                        window.location.href = '/products';
                      }}
                    >
                      <div className="row__item-inner" style={{ backgroundColor: '#f472b6' }}>
                        {renderItem(content, globalIndex)}
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