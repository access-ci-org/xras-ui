// TODO: Make alerts dismissable on Bootstrap 5. Currently the dismiss feature
// only works on Bootstrap 2 sites (e.g., Admin).
const Alert = ({ children, color, dismissable = false }) => {
  return (
    <div
      className={`alert alert-${color} mt-3 alert-dismissible show`}
      role="alert"
    >
      {children}
      {dismissable && (
        <button
          type="button"
          className="close"
          data-dismiss="alert"
          aria-label="Close"
        >
          <span aria-hidden="true">&times;</span>
        </button>
      )}
    </div>
  );
};

export default Alert;
