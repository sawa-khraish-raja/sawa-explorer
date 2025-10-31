import React from 'react';

export default function GlobalStyles() {
  return (
    <style>{`
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
        -webkit-tap-highlight-color: transparent;
      }

      html {
        scroll-behavior: smooth;
        overflow-x: hidden;
        -webkit-text-size-adjust: 100%;
        overscroll-behavior-y: none;
      }

      body {
        overflow-x: hidden;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
          'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        overscroll-behavior-y: none;
      }

      /* ✅ CRITICAL: Force horizontal text for all languages */
      * {
        writing-mode: horizontal-tb !important;
        text-orientation: mixed !important;
        direction: inherit;
      }

      /* ✅ Ensure Arabic text flows correctly */
      [dir="rtl"] {
        direction: rtl;
        text-align: right;
      }

      [dir="ltr"] {
        direction: ltr;
        text-align: left;
      }

      /* ✅ Prevent any vertical text rendering */
      h1, h2, h3, h4, h5, h6, p, span, div, a, button, input, textarea {
        writing-mode: horizontal-tb !important;
        text-orientation: mixed !important;
      }

      /* ✅ iOS specific fixes */
      input, textarea, select {
        font-size: 16px !important;
        -webkit-appearance: none;
        border-radius: 0;
      }

      /* ✅ iPhone Safe Area Support */
      .safe-area-top {
        padding-top: env(safe-area-inset-top);
      }

      /* ✅ iOS Install Banner Animation */
      .animate-slide-down {
        animation: slideDown 0.5s ease-out forwards;
      }

      @keyframes slideDown {
        from {
          opacity: 0;
          transform: translateY(-100%);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      /* ✅ Prevent horizontal scroll */
      html, body {
        max-width: 100vw;
        overflow-x: hidden;
      }

      /* ✅ Ensure proper text wrapping */
      p, span, div, h1, h2, h3, h4, h5, h6 {
        word-wrap: break-word;
        overflow-wrap: break-word;
        hyphens: auto;
      }
    `}</style>
  );
}