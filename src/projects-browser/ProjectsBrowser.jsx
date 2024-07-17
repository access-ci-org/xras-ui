import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import Filters from "./Filters";
import ProjectList from "./ProjectList";
import Pagination from "./Pagination";
import { initApp, selectFiltersLoaded, selectProjectsLoaded, selectShowPagination } from "./helpers/browserSlice"

const ProjectsBrowser = ({ api_url }) => {
  const dispatch = useDispatch();
  const projectsLoaded = useSelector( selectProjectsLoaded );
  const filtersLoaded = useSelector( selectFiltersLoaded );
  const showPagination = useSelector( selectShowPagination );
  const loadingScreen = (
    <div className="loadingDiv">
      Loading ...
    </div>
  )

  useEffect(() => {
    dispatch( initApp() );
  }, [])

  return(
    <div className="container-fluid">
      <div className="row">
        <div className="col-sm-3">
          <Filters />
        </div>
        <div className="col-sm-9">
          <div className="row">
            <div className="col">
              {showPagination ? <Pagination /> : ''}
            </div>
          </div>

          <div className="row" id="projectListRow">
            <div className="col">
              {projectsLoaded && filtersLoaded ? <ProjectList /> : loadingScreen }
            </div>
          </div>

          <div className="row">
            <div className="col">
              {showPagination ? <Pagination scroll="projects_browser_app" /> : ''}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default ProjectsBrowser;