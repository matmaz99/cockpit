/** Parksun's 24 px line icons; the stroke follows currentColor. */
export type IconName = 'search' | 'pin' | 'cube' | 'aerial' | 'sun' | 'canopy' | 'tree' | 'bolt' | 'euro' | 'plus' | 'minus' | 'orbit' | 'arrow' | 'check' | 'alert' | 'close' | 'plug' | 'moon';

export const ICONS: Record<IconName, string> = {
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>',
  pin: '<path d="M12 21s6.5-5.6 6.5-11a6.5 6.5 0 0 0-13 0c0 5.4 6.5 11 6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
  cube: '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M4 7.5l8 4.5 8-4.5M12 12v9"/>',
  aerial: '<rect x="3.5" y="3.5" width="17" height="17" rx="3"/><path d="M3.5 14l5-4 4 3 3-2 5 4"/><circle cx="15.5" cy="8" r="1.5"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/>',
  canopy: '<path d="M3 9l9-4 9 4-9 4z"/><path d="M7 11v9M17 11v9M12 13v7"/>',
  tree: '<circle cx="12" cy="9" r="5.5"/><path d="M12 14.5V21M9 21h6"/>',
  bolt: '<path d="M13 2.5L5 13.5h6l-1 8 8-11h-6z"/>',
  moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
  euro: '<path d="M17.5 6.2A6.5 6.5 0 1 0 17.5 17.8"/><path d="M4 10.2h9M4 13.8h9"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  orbit: '<path d="M20 12a8 8 0 1 1-2.3-5.6"/><path d="M20 4v4.5h-4.5"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  alert: '<path d="M12 3.5l9.5 16.5h-19z"/><path d="M12 10v4.5M12 17.2v.3"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  plug: '<path d="M9 3v5M15 3v5M6.5 8h11v3a5.5 5.5 0 0 1-11 0zM12 16.5V21"/>',
};

export interface IconProps { name: IconName; size?: number; label?: string; strokeWidth?: number; className?: string }

export function Icon({ name, size = 20, label, strokeWidth = 1.5, className }: IconProps) {
  const d = ICONS[name];
  if (!d) return null;
  return (
    <svg
      className={['sp-icon', className].filter(Boolean).join(' ')}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={label ? undefined : true}
      role={label ? 'img' : undefined}
      aria-label={label}
      dangerouslySetInnerHTML={{ __html: d }}
    />
  );
}
