import type { ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

export interface MetricProps { label?: string; icon?: IconName; value: ReactNode; unit?: string; caption?: ReactNode; tone?: 'neutral' | 'solar' | 'alert' | 'caution'; size?: 'md' | 'xl'; plain?: boolean; className?: string }

/** A number with its label, unit and source: the main content of every panel. */
export function Metric({ label, icon, value, unit, caption, tone = 'neutral', size, plain, className }: MetricProps) {
  return (
    <div className={['sp-metric', `sp-metric--${tone}`, size === 'xl' && 'sp-metric--xl', plain && 'sp-metric--plain', className].filter(Boolean).join(' ')}>
      {label && (
        <div className="sp-label">
          {icon && <Icon name={icon} size={14} />}
          {label}
        </div>
      )}
      <div className="sp-metric__value">
        {value}
        {unit && <span className="sp-metric__unit">{unit}</span>}
      </div>
      {caption && <div className="sp-metric__cap">{caption}</div>}
    </div>
  );
}

export interface BadgeProps { tone?: 'neutral' | 'solar' | 'alert' | 'caution' | 'live'; icon?: false; className?: string; children: ReactNode }

/** One to four words of status, always with a word and, for alert, caution and solar, an icon. */
export function Badge({ tone = 'neutral', icon, className, children }: BadgeProps) {
  const ic: Partial<Record<string, IconName>> = { solar: 'check', alert: 'alert', caution: 'alert' };
  return (
    <span className={['sp-badge', `sp-badge--${tone}`, className].filter(Boolean).join(' ')}>
      {tone === 'live' ? <i className="sp-dot" /> : icon !== false && ic[tone] && <Icon name={ic[tone]!} size={14} />}
      {children}
    </span>
  );
}
