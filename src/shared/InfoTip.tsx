import { useEffect, useState, type ReactNode, type RefObject } from "react";
import Overlay from "react-bootstrap/Overlay";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";

type Placement =
  | "top"
  | "top-start"
  | "top-end"
  | "bottom"
  | "bottom-start"
  | "bottom-end"
  | "left"
  | "left-start"
  | "left-end"
  | "right"
  | "right-start"
  | "right-end";

type InfoTipProps = {
  bg?: string;
  children: ReactNode;
  color?: string;
  fontWeight?: string;
  icon?: string;
  initial?: boolean | string;
  maxWidth?: string;
  padding?: string;
  placement?: Placement;
  target?: RefObject<HTMLElement | null>;
  trigger?: "click" | "hover" | "focus" | ("click" | "hover" | "focus")[];
  visible?: boolean;
};

export default function InfoTip({
  bg = "dark",
  children,
  color = "light",
  fontWeight = "bold",
  icon = "info-circle-fill",
  initial = false,
  maxWidth = "200px",
  padding = "10px",
  placement,
  target,
  trigger = "click",
  visible = true,
}: InfoTipProps) {
  const hasKey = typeof initial === "string";
  const [show, setShow] = useState(hasKey ? localStorage.getItem(initial as string) != "true" : Boolean(initial));
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Hack to allow time for target to be rendered so that the tooltip is
    // positioned correctly.
    const timeout = setTimeout(() => setReady(true), 100);
    return () => clearTimeout(timeout);
  }, []);

  const recordToggle = () => {
    if (hasKey) localStorage.setItem(initial as string, "true");
  };

  const overlay = (
    <Tooltip
      style={
        {
          "--bs-tooltip-bg": `var(--bs-${bg})`,
          "--bs-tooltip-color": `var(--bs-${color})`,
          "--bs-tooltip-max-width": maxWidth,
          "--bs-tooltip-padding-x": padding,
          "--bs-tooltip-padding-y": padding,
          fontWeight,
        } as React.CSSProperties
      }
    >
      <button
        aria-label="Close"
        onClick={() => {
          recordToggle();
          setShow(false);
        }}
        className="float-right border-0 bg-transparent"
      >
        <i className="bi bi-x-lg" />
      </button>
      {children}
    </Tooltip>
  );

  if (target && target.current)
    return (
      <Overlay target={target.current} placement={placement} show={show && visible && ready}>
        {overlay}
      </Overlay>
    );

  return (
    <OverlayTrigger
      placement={placement}
      onToggle={(nextShow) => {
        recordToggle();
        setShow(nextShow);
      }}
      overlay={overlay}
      show={show && visible && ready}
      trigger={trigger}
    >
      <button className="border-0 bg-transparent p-0 text-current">
        <i className={`bi bi-${icon}`} />
      </button>
    </OverlayTrigger>
  );
}
