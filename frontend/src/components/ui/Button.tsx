import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from 'react';
import { buttonClasses, type ButtonVariant } from './buttonStyles';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export function Button({ variant = 'primary', className = '', type = 'button', ...rest }: ButtonProps) {
  return <button type={type} className={buttonClasses(variant, className)} {...rest} />;
}

interface LinkButtonProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: ButtonVariant;
}

/** An <a> styled as a button. Use for navigation and downloads; use <Button> for actions. */
export function LinkButton({ variant = 'primary', className = '', ...rest }: LinkButtonProps) {
  return <a className={buttonClasses(variant, className)} {...rest} />;
}
