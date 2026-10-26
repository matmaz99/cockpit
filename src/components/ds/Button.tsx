import type { ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

const cx = (...a: (string | false | undefined | null)[]) => a.filter(Boolean).join(' ');

export interface ButtonProps {
  variant?: 'primary' | 'solar' | 'ghost' | 'quiet';
  size?: 'md' | 'sm';
  icon?: IconName;
  iconRight?: IconName;
  href?: string;
  disabled?: boolean;
  type?: 'button' | 'submit';
  onClick?: () => void;
  className?: string;
  children: ReactNode;
}

/** Pill button: primary (graphite) for the main step, solar only for the one money-making action. */
export function Button({ variant = 'primary', size = 'md', icon, iconRight, href, disabled, type = 'button', onClick, className, children }: ButtonProps) {
  const cls = cx('sp-btn', `sp-btn--${variant}`, `sp-btn--${size}`, className);
  const inner = (
    <>
      {icon && <Icon name={icon} size={size === 'sm' ? 16 : 18} />}
      <span>{children}</span>
      {iconRight && <Icon name={iconRight} size={size === 'sm' ? 16 : 18} />}
    </>
  );
  if (href) return <a className={cls} href={href} onClick={onClick}>{inner}</a>;
  return <button type={type} className={cls} disabled={disabled} onClick={onClick}>{inner}</button>;
}

export interface IconButtonProps { icon: IconName; label: string; active?: boolean; tone?: 'glass'; onClick?: () => void; className?: string }

/** Round 40 px icon-only button; the label is the aria-label and the tooltip. */
export function IconButton({ icon, label, active, tone, onClick, className }: IconButtonProps) {
  return (
    <button type="button" aria-label={label} title={label} aria-pressed={active === undefined ? undefined : !!active} onClick={onClick} className={cx('sp-iconbtn', active && 'is-active', tone === 'glass' && 'sp-iconbtn--glass', className)}>
      <Icon name={icon} size={18} />
    </button>
  );
}
