import { useEffect } from "react";
import { useDispatch } from "react-redux";
import {
  getFilters,
  getPublications,
} from "./helpers/publicationsSearchSlice.js";

import PublicationsAlerts from "./PublicationsAlerts.jsx";
import PublicationEditModal from "./PublicationEditModal";
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
      <PublicationsAlerts />
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
      <PublicationEditModal />
    </>
  );
};

export default PublicationsBrowser;
