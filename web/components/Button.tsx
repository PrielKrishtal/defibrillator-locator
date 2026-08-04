import Link from "next/link";
import { ButtonHTMLAttributes, ReactNode } from "react";

// One place defining each action style, not a className copied per call
// site. Each look is its own variant, not an override via extra className -
// two conflicting utilities at equal specificity leave the winner up to
// Tailwind's build order, not which one is written last.
const BASE =
  "rounded-lg px-4 py-2 text-center font-medium transition-colors disabled:opacity-50";
const VARIANTS = {
  primary: "bg-signal text-paper hover:opacity-90",
  outline: "border border-line text-ink hover:bg-line/30",
  outlineOnDark: "border border-paper/40 text-paper hover:bg-paper/10",
  // WHY ink, not a raw black: ink is already the system's darkest token
  // (near-black), so this stays inside the named-token palette instead of
  // introducing an untracked color for one button.
  dark: "bg-ink text-paper hover:opacity-90",
};

type Variant = keyof typeof VARIANTS;

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button className={`${BASE} ${VARIANTS[variant]} ${className}`} {...props} />
  );
}

// Same look as Button, for cases where the action is navigation (a hero CTA
// to /register or /incident) rather than a form submit.
export function ButtonLink({
  variant = "primary",
  className = "",
  href,
  children,
}: {
  variant?: Variant;
  className?: string;
  href: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={`${BASE} ${VARIANTS[variant]} inline-block ${className}`}>
      {children}
    </Link>
  );
}
