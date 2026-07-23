import config from "../shared/helpers/config";
import Alert from "../shared/Alert";

export default function InternationalUserRequest({ project, requestId }) {
  if(!project.internationalUserRequests) return <></>

  const viewPath = config.routes.request_international_user_request_path;
  const editPath = config.routes.edit_request_international_user_request_path;
  const formatDate = (d) => {
    if (d) {
        return (new Date(d)).toLocaleDateString('en-US');
      } else {
        return <>&mdash;</>;
      }
  }

  const link = (req) => {
    const canEdit = req.status == 'Incomplete' || req.status == 'Submitted'
    const route = canEdit ? editPath : viewPath;
    const text = canEdit ? 'View / Update' : 'View';
    return (
      <a href={route(requestId, req.id)} type="button" className="btn btn-primary btn-sm">{text}</a>
    );
  }

  return (
    <div>
      <h3>International User Justifications</h3>
      <table className="table">
        <thead>
          <tr>
            <th>Status</th>
            <th>Submitted On</th>
            <td></td>
          </tr>
        </thead>
        <tbody>
          {project.internationalUserRequests.map((req) =>
            <tr key={req.id}>
              <td>{req.status}</td>
              <td>{formatDate(req.submittedAt)}</td>
              <td className="text-end">{link(req)}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}