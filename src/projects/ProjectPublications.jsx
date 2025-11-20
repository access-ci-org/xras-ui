import {useEffect, useRef} from "react";
import { configureStore } from "@reduxjs/toolkit";
import publicationEditSlice from "../publications/helpers/publicationEditSlice";
import publicationsSearchSlice, {
    getPublications,
    selectPublicationUpdatesNoticeCheckDismissibleButtonShow
} from "../publications/helpers/publicationsSearchSlice";
import {Provider, useDispatch, useSelector} from "react-redux";
import Publications from "./Publications";
import config from "../shared/helpers/config";
import PublicationsCheckDismiss from "../publications/PublicationsCheckDismiss.jsx";

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
        <Provider store={storeRef.current}>
            <ProjectPublicationsContent grantNumber={grantNumber} />
        </Provider>
    );
}

function ProjectPublicationsContent({ grantNumber }) {
    const dispatch = useDispatch();
    const showDismissButton = useSelector(
        selectPublicationUpdatesNoticeCheckDismissibleButtonShow
    );

    useEffect(() => {
      dispatch(getPublications({ grantNumber }));
    }, [dispatch, grantNumber]);

    return (
        <>
            <Publications grantNumber={grantNumber} />
            <div className="d-flex gap-2 mt-3">
                <a href={config.routes.publications_path()} className="btn btn-primary">
                    Add or Manage Publications
                </a>
                {showDismissButton && <PublicationsCheckDismiss  grantNumber={grantNumber}/>}
            </div>
        </>
    );
}
