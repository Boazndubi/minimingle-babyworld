
// import { useEffect, useRef } from 'react';
// import { gsap } from 'gsap';
// import './GridMotion.css';
// 
// const GridMotion = ({ items = [], gradientColor = 'black' }) => {
//   const gridRef = useRef(null);
//   const rowRefs = useRef([]);
// 
//   const totalItems = 28;
//   const defaultItems = Array.from({ length: totalItems }, (_, index) => `Item ${index + 1}`);
//   const combinedItems = items.length > 0 ? items.slice(0, totalItems) : defaultItems;
// 
//   useEffect(() => {
//     if (typeof window === 'undefined') return;
// 
//     // Kill any existing tweens
//     rowRefs.current.forEach(row => {
//       if (row) gsap.killTweensOf(row);
//     });
// 
//     const autoScrollSpeed = 50; // pixels per second — adjust for speed
// 
//     rowRefs.current.forEach((row, index) => {
//       if (!row) return;
// 
//       // Alternating directions: row 0=right, 1=left, 2=right, 3=left
//       const direction = index % 2 === 0 ? 1 : -1;
// 
//       // Get width of ONE set of 7 items
//       const itemElements = row.querySelectorAll('.row__item');
//       const singleSetWidth = Array.from(itemElements).slice(0, 7).reduce((acc, item) => {
//         return acc + item.offsetWidth;
//       }, 0);
// 
//       // For seamless loop with 3 sets (A-B-C):
//       // Rows 0,2 (right): start at -width, animate toward 0
//       // Rows 1,3 (left): start at 0, animate toward -width
//       const startX = direction === 1 ? -singleSetWidth : 0;
// 
//       gsap.set(row, { x: startX });
// 
//       // Create seamless infinite scroll using modifiers
//       gsap.to(row, {
//         x: startX + (direction * singleSetWidth),
//         duration: singleSetWidth / autoScrollSpeed,
//         ease: 'none',
//         repeat: -1,
//         modifiers: {
//           x: gsap.utils.unitize(x => {
//             // Wrap within -singleSetWidth to 0 for seamless loop
//             return gsap.utils.wrap(-singleSetWidth, 0, parseFloat(x));
//           })
//         }
//       });
//     });
// 
//     return () => {
//       rowRefs.current.forEach(row => {
//         if (row) gsap.killTweensOf(row);
//       });
//     };
//   }, [combinedItems]);
// 
//   return (
//     <div className="noscroll loading" ref={gridRef}>
//       <section
//         className="intro"
//         style={{
//           background: `radial-gradient(circle, ${gradientColor} 0%, transparent 100%)`
//         }}
//       >
//         <div className="gridMotion-container">
//           {[...Array(4)].map((_, rowIndex) => (
//             <div key={rowIndex} className="row" ref={el => (rowRefs.current[rowIndex] = el)}>
//               {/* TRIPLICATE items for seamless infinite loop */}
//               {[...Array(3)].map((_, setIndex) => (
//                 [...Array(7)].map((_, itemIndex) => {
//                   const content = combinedItems[rowIndex * 7 + itemIndex];
//                   return (
//                     <div key={`${setIndex}-${itemIndex}`} className="row__item">
//                       <div className="row__item-inner" style={{ backgroundColor: '#f472b6' }}>
//                         {typeof content === 'string' && content.startsWith('http') ? (
//                           <div
//                             className="row__item-img"
//                             style={{ backgroundImage: `url(${content})` }}
//                           />
//                         ) : (
//                           <div className="row__item-content">{content}</div>
//                         )}
//                       </div>
//                     </div>
//                   );
//                 })
//               ))}
//             </div>
//           ))}
//         </div>
//         <div className="fullview" />
//       </section>
//     </div>
//   );
// };
// 
// export default GridMotion;