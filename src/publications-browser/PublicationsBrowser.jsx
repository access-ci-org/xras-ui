import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { initApp, selectPublicationsLoaded } from "./helpers/publicationsSlice.js";
import PublicationsList from "./PublicationsList.jsx";
import Filters from "../publications-browser/Filters.jsx";
import Pagination from "../publications-browser/Pagination.jsx";

const PublicationsBrowser = ({ apiUrl }) => {
  const dispatch = useDispatch();
  const publicationsLoaded = useSelector(selectPublicationsLoaded);

  const loadingScreen = (
    <div className="loadingDiv">
      Loading ...
    </div>
  )

  useEffect(() => {
    dispatch(initApp());
  }, [dispatch])

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-sm-3">
          <Filters/>
        </div>

        <div className="col-sm-9">
          <div className="row">
            <div className="col">
              <Pagination/>
            </div>
          </div>

          <div className="row" id="publicationListRow">
            <div className="col">
              {publicationsLoaded ? <PublicationsList/> : loadingScreen}
            </div>
          </div>

          <div className="row">
            <div className="col">
              <Pagination/>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PublicationsBrowser;