import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { initApp, selectPublicationsLoaded } from "./helpers/publicationsSlice.js";
import PublicationsList from "./PublicationsList.jsx";

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
    <div className="col">
      <h2>Publications</h2>
      <ul>
        { publicationsLoaded ? <PublicationsList /> : loadingScreen }
      </ul>
    </div>
  );
}

export default PublicationsBrowser;