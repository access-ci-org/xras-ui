import config from "../shared/helpers/config";
import Alert from "../shared/Alert";

export default function InternationalUserRequest({ project, requestId }) {
  if(!project.iurs && !project.iurRequired) return <></>

  const route = config.routes.justification_request_path(requestId);
  const formatDate = (d) => {
    const date = new Date(d);
    return date.toLocaleDateString('en-US');
  }

  return (
    <div>
      <h3>International User Requests</h3>
      <table className="table">
        <thead>
          <tr>
            <th>Status</th>
            <th>Submitted On</th>
            <td></td>
          </tr>
        </thead>
        <tbody>
          {project.iurs.map((req) =>
            <tr key={`iur_${req.international_user_request_id}`}>
              <td>{req.status}</td>
              <td>{formatDate(req.submitted_at)}</td>
              <td className="text-end">
                <a href={route} type="button" className="btn btn-primary btn-sm">View / Update</a>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}