import PropTypes from "prop-types";
import style from "./AdvancedSettingsSection.module.scss";

export const AdvancedSettingsSection = ({
  headerText,
  header,
  children,
  isEditing = false,
  onEditingChange,
  warningMessage = "",
}) => {
  const altWarningBanner = headerText && headerText.type === "label";
  return (
    <div className={style["advanced-settings"]}>
      {(headerText || header) && (
        <div className={style["header-wrapper"]}>
          {headerText}
          {header && (
            <div
              className={`${style["header-buttons-container"]} ${
                !isEditing ? style["blurred"] : ""
              }`}
            >
              {header}
            </div>
          )}
        </div>
      )}
      <div style={{ width: "100%" }}>
        {!isEditing && (
          <div
            className={
              altWarningBanner
                ? `${style["alt-warning-banner"]}`
                : style["warning-banner"]
            }
          >
            <span className={style["warning-text"]}>
              <strong>CAUTION! </strong> {warningMessage}
            </span>
            <button
              className="btn btn-danger"
              onClick={() => onEditingChange(true)}
            >
              I understand the risks
            </button>
          </div>
        )}
        <div
          className={`${style["content-container"]} ${
            !isEditing ? style["blurred"] : ""
          }`}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

AdvancedSettingsSection.propTypes = {
  headerText: PropTypes.node,
  header: PropTypes.node,
  children: PropTypes.node.isRequired,
  isEditing: PropTypes.bool,
  onEditingChange: PropTypes.func.isRequired,
  warningMessage: PropTypes.string,
};
