import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getResources,
  selectCatalogs,
  selectHasErrors,
  selectResourcesLoaded,
} from "./helpers/catalogSlice";

import ResourceList from "./ResourceList";
import LoadingSpinner from "../shared/LoadingSpinner";
import AccessHeader from "./AccessHeader";
import styles from "./ResourceCatalog.module.scss";

const ResourceCatalog = ({
  catalogSources = [],
  onRamps = false,
  baseUrl,
  onRampsApi = 'https://allocations.access-ci.org/resources.json'
}) => {
  const dispatch = useDispatch();
  const resourcesLoaded = useSelector(selectResourcesLoaded);
  const hasErrors = useSelector(selectHasErrors);
  const stateCatalogs = useSelector(selectCatalogs);
  const catalogs = Object.keys(stateCatalogs).map((k) => stateCatalogs[k]);


  useEffect(() => {
    dispatch(
      getResources({
        catalogSources,
        onRamps,
        onRampsApi
      })
    );
  }, []);

  const renderCatalogDescriptions = () => {
    if(onRamps && catalogs.length > 1){
      return (
        <>
          {catalogs.filter((c) => c.catalogLabel != "ACCESS").map((c, i) =>
            <div className="row mb-3" key={`catalog_${i}`}>
              <div className="col">
                <h4 className="border-bottom">
                  About {c.catalogLabel}
                </h4>
                <div dangerouslySetInnerHTML={{__html: c.description}}></div>
              </div>
            </div>
          )}
        </>
      )
    }

    return '';
  }

  if (hasErrors) {
    return (
      <div className="row">
        <div className="col text-center mt-2">
          <h4>Unable to Load Resources</h4>
        </div>
      </div>
    );
  }

  if (!resourcesLoaded) return <LoadingSpinner />;

  return (
    <div className={`container mt-3 ${styles.access}`}>
      { onRamps ? <AccessHeader baseUrl={baseUrl} /> : ''}
      { renderCatalogDescriptions() }
      <div className="row">
        <div className="col">
          <ResourceList />
        </div>
      </div>
    </div>
  );
};

export default ResourceCatalog;
