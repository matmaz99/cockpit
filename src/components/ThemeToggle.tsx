'use client';

import { Icon } from './ds/Icon';

/** Flips data-theme on <html> and remembers it under the same key as Parksun. */
export function ThemeToggle() {
  const flip = () => {
    const root = document.documentElement;
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('sp-theme', next); } catch {}
  };
  return (
    <button type="button" className="sp-iconbtn" onClick={flip} aria-label="Changer de thème" title="Changer de thème">
      <Icon name="moon" size={18} />
    </button>
  );
}
