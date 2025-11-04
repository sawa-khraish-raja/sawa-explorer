
export default function ResponsiveStyles() {
  return (
    <style>{`
      /*  CRITICAL: Force all text to be horizontal */
      * {
        writing-mode: horizontal-tb !important;
        text-orientation: mixed !important;
      }

      /*  Base responsive container */
      .container {
        width: 100%;
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 1rem;
      }

      /*  Section padding responsive */
      .section-padding {
        padding: 3rem 1rem;
      }

      @media (min-width: 640px) {
        .section-padding {
          padding: 4rem 1.5rem;
        }
      }

      @media (min-width: 1024px) {
        .section-padding {
          padding: 5rem 2rem;
        }
      }

      /*  Hero section - MUST be horizontal */
      .hero-section,
      .hero-section * {
        writing-mode: horizontal-tb !important;
        text-orientation: mixed !important;
        white-space: normal !important;
      }

      /*  Mobile optimizations */
      @media (max-width: 768px) {
        .container {
          padding: 0 0.75rem;
        }

        /*  Force horizontal text on mobile */
        h1, h2, h3, h4, h5, h6 {
          writing-mode: horizontal-tb !important;
          text-orientation: mixed !important;
          white-space: normal !important;
          word-break: break-word;
        }

        /*  Ensure readable font sizes */
        body {
          font-size: 14px;
        }

        h1 {
          font-size: 1.75rem !important;
          line-height: 1.3 !important;
        }

        h2 {
          font-size: 1.5rem !important;
          line-height: 1.3 !important;
        }

        h3 {
          font-size: 1.25rem !important;
          line-height: 1.4 !important;
        }

        p {
          font-size: 0.875rem !important;
          line-height: 1.5 !important;
        }

        /*  Buttons responsive */
        button {
          min-height: 44px;
          padding: 0.5rem 1rem;
        }

        /*  Input fields responsive */
        input, textarea, select {
          font-size: 16px !important;
          min-height: 44px;
        }
      }

      /*  Tablet adjustments */
      @media (min-width: 769px) and (max-width: 1024px) {
        .container {
          max-width: 960px;
          padding: 0 2rem;
        }

        h1 {
          font-size: 2.25rem;
        }

        h2 {
          font-size: 1.875rem;
        }
      }

      /*  Desktop */
      @media (min-width: 1025px) {
        .container {
          max-width: 1200px;
          padding: 0 3rem;
        }

        h1 {
          font-size: 2.5rem;
        }

        h2 {
          font-size: 2rem;
        }
      }

      /*  Ultra-wide screens */
      @media (min-width: 1440px) {
        .container {
          max-width: 1400px;
        }
      }

      /*  Print styles */
      @media print {
        .no-print {
          display: none !important;
        }

        body {
          background: white;
          color: black;
        }
      }

      /*  Reduced motion */
      @media (prefers-reduced-motion: reduce) {
        * {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      }
    `}</style>
  );
}
