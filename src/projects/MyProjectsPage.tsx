import Alert from "../shared/Alert";
import type { RouteOverrides } from "../shared/routes";
import Projects from "./Projects";

/*
 * The My Projects page: the `Projects` widget plus a recruitment banner for an
 * external survey. The banner lives here rather than in `Projects` itself so it
 * only appears on the full-page mount (src/main.jsx `projects()`), not wherever
 * else that component is embedded.
 *
 * The survey is time-limited - delete this component and mount `Projects`
 * directly again once it closes.
 */
export default function MyProjectsPage({
  username,
  routes,
}: {
  username: string;
  routes?: RouteOverrides;
}) {
  return (
    <>
      <Alert color="info">
        A research team from Harvard University is conducting a short voluntary survey about
        users’ experiences with ACCESS computing resources. Survey responses will be linked to your
        publicly available user-level allocation data. Participation will not affect your
        relationship with ACCESS or your standing with ACCESS in any way. Individual survey
        responses and linked individual-level data will not be shared back with ACCESS.{" "}
        <a
          href="https://harvard.az1.qualtrics.com/jfe/form/SV_7Us3XQgaeeYahO6"
          target="_blank"
          rel="noreferrer"
        >
          Take the survey
        </a>{" "}
        Questions: <a href="mailto:kmyers@hbs.edu">kmyers@hbs.edu</a>
      </Alert>

      <Projects username={username} routes={routes} />
    </>
  );
}
