const Alert = ({ children, color }) => {
  return (
    <div className={`alert alert-${color} mt-3 alert-dismissible show`} role="alert">
      {children}
      <button type="button" className="close" data-dismiss="alert" aria-label="Close">
        <span aria-hidden="true">&times;</span>
      </button>
    </div>
  );
};

export default Alert;
