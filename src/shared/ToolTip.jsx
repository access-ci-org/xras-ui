import { useEffect } from "react";
import PropTypes from "prop-types";

{
  /*

Custom ToolTip component using Bootstrap 2.3.2 and jQuery. For newer Bootstrap release,
use the InfoTip React component from ./shared

*/
}

const Tooltip = ({ title, placement, children }) => {
  // useEffect hook to initialize the tooltip on component mount & destroy on component unmount
  useEffect(() => {
    $('[data-toggle="tooltip"]').tooltip();

    return () => {
      $('[data-toggle="tooltip"]').tooltip("destroy");
    };
  }, []);

  return (
    <span
      data-toggle="tooltip"
      data-placement={placement}
      title={title}
      style={{ margin: "10px" }}
    >
      {children}
    </span>
  );
};

Tooltip.propTypes = {
  title: PropTypes.string.isRequired,
  placement: PropTypes.oneOf(["top", "bottom", "left", "right"]),
  children: PropTypes.node.isRequired,
};

Tooltip.defaultProps = {
  placement: "top",
};

export default Tooltip;
