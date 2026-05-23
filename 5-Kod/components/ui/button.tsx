// Designsystem-primitiv — Button.
// Designreferens: handoff-to-code/assets/style.css § BUTTONS.
import { forwardRef } from "react";
import Link from "next/link";
import type { ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "copper" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

function classes(variant: Variant, size: Size, block: boolean, extra?: string) {
  const v = `btn-${variant}`;
  const s = size === "md" ? "" : `btn-${size}`;
  const b = block ? "btn-block" : "";
  return ["btn", v, s, b, extra].filter(Boolean).join(" ");
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  block?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", block = false, leftIcon, rightIcon, className, children, ...rest },
  ref,
) {
  return (
    <button ref={ref} className={classes(variant, size, block, className)} {...rest}>
      {leftIcon}
      {children}
      {rightIcon}
    </button>
  );
});

type LinkButtonProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  variant?: Variant;
  size?: Size;
  block?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
};

export function LinkButton({
  href,
  variant = "primary",
  size = "md",
  block = false,
  leftIcon,
  rightIcon,
  className,
  children,
  ...rest
}: LinkButtonProps) {
  const isInternal = href.startsWith("/") && !href.startsWith("//");
  const cls = classes(variant, size, block, className);
  if (isInternal) {
    return (
      <Link href={href} className={cls}>
        {leftIcon}
        {children}
        {rightIcon}
      </Link>
    );
  }
  return (
    <a href={href} className={cls} {...rest}>
      {leftIcon}
      {children}
      {rightIcon}
    </a>
  );
}
