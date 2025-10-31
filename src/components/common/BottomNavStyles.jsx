import React from 'react';

export default function BottomNavStyles() {
  return (
    <style>{`
      /* ✅ iPhone Safe Area Support - Compact */
      .mobile-bottom-nav {
        padding-bottom: max(0.5rem, env(safe-area-inset-bottom));
      }

      /* ✅ Grid Auto-fit - NO SCROLLING */
      @supports (grid-template-columns: repeat(auto-fit, minmax(0, 1fr))) {
        .mobile-bottom-nav > div {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
        }
      }

      /* ✅ Active Indicator */
      .nav-item-indicator {
        position: absolute;
        top: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 32px;
        height: 2px;
        background: linear-gradient(90deg, #9933CC, #7C3AED);
        border-radius: 2px 2px 0 0;
        transition: opacity 0.2s ease;
      }

      /* ✅ Prevent Overflow */
      .mobile-bottom-nav {
        overflow: hidden !important;
      }

      /* ✅ Compact for all screens */
      .mobile-bottom-nav > div {
        min-height: auto;
      }

      /* ✅ iPhone X/11/12/13/14 Safe Area - More compact */
      @media screen and (max-height: 700px) {
        .mobile-bottom-nav > div {
          padding-top: 0.4rem;
          padding-bottom: max(0.4rem, env(safe-area-inset-bottom));
          gap: 1rem;
        }
      }

      /* ✅ Very Small Screens */
      @media screen and (max-height: 600px) {
        .mobile-bottom-nav > div {
          padding: 0.3rem;
          padding-bottom: max(0.3rem, env(safe-area-inset-bottom));
          gap: 0.75rem;
        }
      }
    `}</style>
  );
}