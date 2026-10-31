'use client';

import { useEffect, useState } from 'react';
import { Palette, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ACCENTS = [
  { key: 'violet', label: 'بنفسجي', color: 'hsl(263 70% 55%)' },
  { key: 'blue', label: 'أزرق', color: 'hsl(217 91% 55%)' },
  { key: 'green', label: 'أخضر', color: 'hsl(160 70% 38%)' },
  { key: 'orange', label: 'برتقالي', color: 'hsl(24 95% 52%)' },
  { key: 'rose', label: 'وردي', color: 'hsl(346 80% 52%)' },
] as const;

const STORAGE_KEY = 'faris-accent';

function applyAccent(key: string) {
  const root = document.documentElement;
  if (key === 'violet') root.removeAttribute('data-accent');
  else root.setAttribute('data-accent', key);
}

export function AccentPicker() {
  const [open, setOpen] = useState(false);
  const [accent, setAccent] = useState('violet');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) ?? 'violet';
      setAccent(saved);
      applyAccent(saved);
    } catch {
      /* المتصفح يمنع التخزين: نكمل باللون الافتراضي */
    }
  }, []);

  function choose(key: string) {
    setAccent(key);
    applyAccent(key);
    try { localStorage.setItem(STORAGE_KEY, key); } catch { /* تجاهل */ }
    setOpen(false);
  }

  return (
    <div className="relative">
      <Button variant="ghost" size="icon" onClick={() => setOpen((o) => !o)} aria-label="اختيار لون النظام" aria-expanded={open}>
        <Palette className="h-[18px] w-[18px]" />
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-50 mt-2 w-44 rounded-xl border border-border bg-popover p-2 shadow-lg">
            {ACCENTS.map((a) => (
              <button
                key={a.key}
                type="button"
                onClick={() => choose(a.key)}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-secondary"
              >
                <span className="h-5 w-5 rounded-full border border-border" style={{ background: a.color }} />
                <span className="flex-1 text-right">{a.label}</span>
                {accent === a.key && <Check className="h-4 w-4 text-primary" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}