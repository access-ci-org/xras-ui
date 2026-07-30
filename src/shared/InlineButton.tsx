import { cn } from "@/lib/utils";

const colorClasses: Record<string, string> = {
  primary: "text-primary hover:text-primary/80",
  secondary: "text-muted-foreground hover:text-foreground",
  success: "text-emerald-600 hover:text-emerald-700",
  danger: "text-destructive hover:text-destructive/80",
  warning: "text-amber-600 hover:text-amber-700",
  dark: "text-foreground hover:text-foreground/80",
};

type InlineButtonProps = {
  color?: string;
  href?: string;
  icon: string;
  onClick?: () => void;
  target?: string;
  title?: string;
  type?: "button" | "submit" | "reset";
};

export default function InlineButton({
  color = "primary",
  href,
  icon,
  onClick,
  target,
  title,
  type = "button",
}: InlineButtonProps) {
  const children = <i className={`bi bi-${icon}`} />;
  const className = cn("ml-1 inline-flex p-1 text-sm", colorClasses[color] ?? colorClasses.primary);

  return href ? (
    <a className={className} href={href} onClick={onClick} target={target} title={title}>
      {children}
    </a>
  ) : (
    <button className={className} onClick={onClick} title={title} type={type}>
      {children}
    </button>
  );
}
