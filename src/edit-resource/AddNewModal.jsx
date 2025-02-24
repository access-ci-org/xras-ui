import PropTypes from "prop-types";

export const AddNewModal = ({
  show,
  onClose,
  title,
  children,
  onSave,
  buttonText,
  cancelText = "Cancel",
  canSave = true,
}) => {
  if (!show) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        display: "flex",
        alignItems: "center",
        zIndex: 1050,
      }}
    >
      <div
        className="modal fade in"
        tabIndex="-1"
        role="dialog"
        aria-hidden="true"
        style={{
          width: "90%",
          maxWidth: "600px",
          maxHeight: "90%",
          overflow: "auto",
          backgroundColor: "white",
          position: "relative",
        }}
      >
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <button
                type="button"
                className="close"
                data-dismiss="modal"
                onClick={onClose}
                aria-label="Close"
              >
                <h3 aria-hidden="true" className="text-danger">
                  &times;
                </h3>
              </button>
              <h3 className="modal-title">{title}</h3>
            </div>
            <div className="modal-body">{children}</div>
            <div
              className="modal-footer"
              style={{
                padding: "15px",
                textAlign: "right",
                borderTop: "1px solid #e5e5e5",
                backgroundColor: "#f8f9fa",
              }}
            >
              <button className="btn btn-danger" onClick={onClose}>
                {cancelText}
              </button>
              <button
                className="btn btn-success"
                onClick={onSave}
                disabled={!canSave}
              >
                {buttonText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

AddNewModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  onSave: PropTypes.func.isRequired,
  buttonText: PropTypes.string,
  cancelText: PropTypes.string,
  canSave: PropTypes.bool,
};
