import React from 'react';

export const SkipLink: React.FC = () => {
  return (
    <div className="sr-only focus-within:not-sr-only fixed top-2 left-2 z-50 flex flex-col gap-2">
      <a
        href="#main-content"
        className="bg-sky-700 text-white font-bold px-4 py-2 rounded-lg shadow-xl ring-4 ring-yellow-400 focus:outline-none"
      >
        Skip to main content (Press Enter)
      </a>
      <a
        href="#venue-discovery"
        className="bg-sky-700 text-white font-bold px-4 py-2 rounded-lg shadow-xl ring-4 ring-yellow-400 focus:outline-none"
      >
        Skip to venue search & list
      </a>
      <a
        href="#accessibility-toolbar"
        className="bg-sky-700 text-white font-bold px-4 py-2 rounded-lg shadow-xl ring-4 ring-yellow-400 focus:outline-none"
      >
        Skip to accessibility controls
      </a>
    </div>
  );
};
