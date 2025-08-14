import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { initApp } from "./helpers/publicationsSlice.js";
import PublicationsList from "./PublicationsList.jsx";
import Filters from "../publications-browser/Filters.jsx";

const PublicationsBrowser = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(initApp());
  }, [dispatch]);

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-sm-3">
          <Filters />
        </div>
        <div className="col-sm-9">
          <div className="row" id="publicationListRow">
            <div className="col">
              <PublicationsList />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicationsBrowser;
