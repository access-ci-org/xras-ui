export default function InlineButton({
  color = "primary",
  href,
  icon,
  onClick,
  target,
  title,
  type = "button",
}) {
  const children = <i className={`bi bi-${icon}`} />;
  const props = {
    className: `btn btn-sm ms-1 text-${color}`,
    href,
    onClick,
    style: {
      "--bs-btn-padding-x": "0.1rem",
      "--bs-btn-padding-y": "0.1rem",
      "--bs-btn-line-height": "1",
    },
    target,
    title,
  };

  return href ? (
    <a {...props}>{children}</a>
  ) : (
    <button {...props} type={type}>{children}</button>
  );
}
