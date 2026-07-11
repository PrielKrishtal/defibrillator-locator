import Link from "next/link";
import { ButtonHTMLAttributes, ReactNode } from "react";

// One place defining what a primary vs. outline action looks like, instead
// of the same className string copied across every form and hero CTA on
// the site. "primary" is the filled system-color action; "outline" is
// everything secondary (logout, a second hero CTA); "outlineOnDark" is the
// same secondary action but on a signal-colored background (the homepage's
// closing banner) - a separate variant, not an override via extra
// className, since two conflicting border/text utilities at equal
// specificity would leave the winner up to Tailwind's build order, not
// which one is written last in the class list.
const BASE =
  "rounded-lg px-4 py-2 text-center font-medium transition-colors disabled:opacity-50";
const VARIANTS = {
  primary: "bg-signal text-paper hover:opacity-90",
  outline: "border border-line text-ink hover:bg-line/30",
  outlineOnDark: "border border-paper/40 text-paper hover:bg-paper/10",
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
