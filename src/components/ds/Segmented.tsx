'use client';

import { useState } from 'react';
import { Icon, type IconName } from './Icon';

export interface SegmentedProps<V extends string = string> {
  options: { value: V; label: string; icon?: IconName }[];
  value?: V;
  defaultValue?: V;
  onChange?: (v: V) => void;
  glass?: boolean;
  label?: string;
  className?: string;
}

/** Pill switch between two to four views; the active segment is graphite, never green. */
export function Segmented<V extends string = string>({ options, value, defaultValue, onChange, glass, label, className }: SegmentedProps<V>) {
  const [inner, setInner] = useState<V | undefined>(defaultValue ?? options[0]?.value);
  const val = value !== undefined ? value : inner;
  return (
    <div className={['sp-seg', glass && 'sp-seg--glass', className].filter(Boolean).join(' ')} role="tablist" aria-label={label}>
      {options.map((o) => {
        const on = o.value === val;
        return (
          <button key={o.value} type="button" role="tab" aria-selected={on} className={['sp-seg__opt', on && 'is-on'].filter(Boolean).join(' ')} onClick={() => { setInner(o.value); onChange?.(o.value); }}>
            {o.icon && <Icon name={o.icon} size={16} />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
