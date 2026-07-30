import { useMemo } from "react";
import { Provider, createStore } from "jotai";
import config from "../shared/helpers/config";
import Publications from "./Publications";

export default function ProjectPublications({ grantNumber }: { grantNumber: string }) {
  const store = useMemo(() => createStore(), []);

  return (
    <>
      <Provider store={store}>
        <Publications grantNumber={grantNumber} />
      </Provider>
      <div>
        <a href={config.routes.publications_path()} className="btn btn-primary">
          Add or Manage Publications
        </a>
      </div>
    </>
  );
}
