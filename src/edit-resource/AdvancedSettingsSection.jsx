import { useState } from "react";
import PropTypes from "prop-types";
import { AddNewModal } from "./AddNewModal";
import style from "./AdvancedSettingsSection.module.scss";

export const AdvancedSettingsSection = ({
  title,
  children,
  isEditing = false,
  onEditingChange,
}) => {
  const [showWarning, setShowWarning] = useState(false);

  const handleEditClick = () => {
    if (!isEditing) {
      setShowWarning(true);
    }
  };

  const handleConfirm = () => {
    setShowWarning(false);
    onEditingChange(true);
  };

  const handleCancel = () => {
    setShowWarning(false);
  };

  return (
    <div className={style["advanced-settings"]}>
      <div className={style["header-container"]}>
        <div className={style["header-title-container"]}>
          <h3 className={style["header-title"]}>{title}</h3>
          <span className="label label-important">Advanced</span>
        </div>
        {!isEditing && (
          <button className="btn btn-important" onClick={handleEditClick}>
            Edit Advanced Settings
          </button>
        )}
      </div>

      <div className={style["warning-container"]}>
        <p>
          <strong>CAUTION!</strong> This section contains advanced settings that
          affect all resources. Proceed with caution.
          {isEditing
            ? ""
            : " Click 'Edit Advanced Settings' button to enable editing."}
        </p>
      </div>
      <div className={!isEditing ? style["content-wrapper"] : ""}>
        <div
          className={
            !isEditing
              ? `${style["content-container"]} ${style["pointer-events-none"]}`
              : style["active"]
          }
        >
          {children}
        </div>
      </div>

      <AddNewModal
        show={showWarning}
        onClose={handleCancel}
        title="Warning: Advanced Settings"
        onSave={handleConfirm}
        buttonText={"Continue"}
      >
        <p>
          You are about to edit an advanced setting. Changes made here will
          affect all resources. Are you sure?
        </p>
      </AddNewModal>
    </div>
  );
};

AdvancedSettingsSection.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  warningMessage: PropTypes.string,
  isEditing: PropTypes.bool,
  onEditingChange: PropTypes.func.isRequired,
};
