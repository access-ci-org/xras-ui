import { useEffect } from "react";
import { useDispatch } from "react-redux";
import {
  getFilters,
  getPublications,
} from "./helpers/publicationsSearchSlice.js";

import PublicationsList from "./PublicationsList.jsx";
import Filters from "./Filters.jsx";

const PublicationsBrowser = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getPublications());
    dispatch(getFilters());
  }, [dispatch]);

  return (
    <>
      <div className="container-fluid">
        <div className="row">
          <div className="col-sm-3">
            <Filters />
          </div>
          <div className="col-sm-9">
            <div className="row" id="publicationListRow">
              <div className="col">
                <PublicationsList allowEdit={false} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PublicationsBrowser;
