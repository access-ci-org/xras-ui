import { useMemo } from "react";
import { Provider, createStore, useAtomValue, type WritableAtom } from "jotai";
import { useHydrateAtoms } from "jotai/utils";
import { Boxes, Cpu, UserPlus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Alert from "../shared/Alert";
import LoadingSpinner from "../shared/LoadingSpinner";
import { mergeRoutes, routesAtom, type RouteOverrides } from "../shared/routes";
import Project from "./Project";
import { useProjectsList } from "./helpers/hooks";

/*
 * The three panels are `.btn`s in the original — uppercase, undecorated, and
 * turning white on hover — but laid out as blocks: the label wraps to two
 * lines below the icon, so `Button`'s `inline-flex` and `whitespace-nowrap`
 * both have to give way. The icon stands in for a `fs-1` Bootstrap glyph, a
 * 40px character in a 60px line box, which is why it overrides `Button`'s 16px
 * `svg` sizing — from a parent selector, so only `!` can outrank it.
 */
const TILE = "block w-1/4 whitespace-normal text-center";
const TILE_ICON = "mx-auto my-[10px] block size-10!";

function HydrateAtoms({
  values,
  children,
}: {
  values: Map<WritableAtom<any, any[], any>, unknown>;
  children: React.ReactNode;
}) {
  useHydrateAtoms(values);
  return <>{children}</>;
}

function ProjectsInner({
  username,
  openFirst = 1,
  routes,
}: {
  username: string;
  openFirst?: number;
  routes?: RouteOverrides;
}) {
  const { error, loading, projects } = useProjectsList(username);
  const routesValue = useAtomValue(routesAtom);

  if (loading) return <LoadingSpinner />;
  if (error)
    return (
      <Alert color="danger">
        {error}{" "}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            window.location.reload();
          }}
        >
          Reload the page
        </a>{" "}
        to try again.
      </Alert>
    );

  if (!projects.length)
    return (
      /* `text-black` and the border: Bootstrap's `.text-bg-light` and
         `--bs-light-border-subtle`, which the panel carried as
         `text-bg-light border border-light-subtle`. */
      <div className="border border-[#e9ecef] bg-muted py-12 text-black">
        {/* `.fs-2`, which sets only a size — the line height stays the 30px
            the base paragraph rule gives it. */}
        <p className="mb-6 text-center text-[2rem]">You don&apos;t have any projects yet.</p>
        <div className="flex justify-center gap-2">
          <a className={cn(buttonVariants(), TILE)} href={routesValue.project_types_path()}>
            <Boxes className={TILE_ICON} /> Learn about Project Types
          </a>
          <a
            className={cn(buttonVariants({ variant: "secondary" }), TILE)}
            href={routesValue.get_your_first_project_path()}
          >
            <Cpu className={TILE_ICON} /> Learn How to Get Your{" "}
            <br className="hidden 2xl:inline" /> First Project
          </a>
          <a className={cn(buttonVariants(), TILE)} href={routesValue.how_to_path()}>
            <UserPlus className={TILE_ICON} /> Learn How to Join an Existing Project
          </a>
        </div>
      </div>
    );

  const expandedGrantNumber = new URLSearchParams(window.location.hash.slice(1)).get("grantNumber");
  return (
    <>
      {projects.map((project, i) => (
        <Project
          open={expandedGrantNumber ? expandedGrantNumber == project.grantNumber : i < openFirst}
          key={project.grantNumber}
          routes={routes}
          {...project}
        />
      ))}
    </>
  );
}

export default function Projects({
  username,
  openFirst = 1,
  routes,
}: {
  username: string;
  openFirst?: number;
  routes?: RouteOverrides;
}) {
  const store = useMemo(() => createStore(), []);

  return (
    <Provider store={store}>
      <HydrateAtoms
        values={new Map<WritableAtom<any, any[], any>, unknown>([[routesAtom, mergeRoutes(routes)]])}
      >
        <ProjectsInner username={username} openFirst={openFirst} routes={routes} />
      </HydrateAtoms>
    </Provider>
  );
}
