'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface GuideContextValue {
  guideEnabled: boolean;
  toggleGuide: () => void;
}

const GuideContext = createContext<GuideContextValue>({
  guideEnabled: true,
  toggleGuide: () => {},
});

export function GuideProvider({ children }: { children: ReactNode }) {
  const [guideEnabled, setGuideEnabled] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('guide-enabled');
    if (stored !== null) {
      setGuideEnabled(stored === 'true');
    }
  }, []);

  const toggleGuide = () => {
    setGuideEnabled((prev) => {
      const next = !prev;
      localStorage.setItem('guide-enabled', String(next));
      return next;
    });
  };

  return (
    <GuideContext.Provider value={{ guideEnabled, toggleGuide }}>
      {children}
    </GuideContext.Provider>
  );
}

export function useGuide() {
  return useContext(GuideContext);
}
