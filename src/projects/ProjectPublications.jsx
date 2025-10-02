import { useRef } from "react";
import { configureStore } from "@reduxjs/toolkit";
import publicationEditSlice from "../publications/helpers/publicationEditSlice";
import publicationsSearchSlice from "../publications/helpers/publicationsSearchSlice";
import { Provider } from "react-redux";
import Publications from "./Publications";
import config from "../shared/helpers/config";

export default function ProjectPublications({ grantNumber }) {
  const storeRef = useRef(
    configureStore({
      reducer: {
        publicationEdit: publicationEditSlice,
        publicationsSearch: publicationsSearchSlice,
      },
    }),
  );

  return (
    <>
      <Provider store={storeRef.current}>
        <Publications grantNumber={grantNumber} />
      </Provider>
      <a href={config.routes.publications_path()} className="btn btn-primary">
        Add or Manage Publications
      </a>
    </>
  );
}
