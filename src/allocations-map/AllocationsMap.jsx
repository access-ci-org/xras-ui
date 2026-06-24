import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Maximize, Minimize } from "lucide-react";
import {
  getBasemapStyle,
  getCreditLevels,
  getMapData,
  getStyle,
  makeCreditsGeoJSON,
} from "./utils";
import style from "./AllocationsMap.module.scss";

import Controls from "./Controls";
import Legend from "./Legend";
import OrgInfo from "./OrgInfo";

export default function AllocationsMap() {
  const root = useRef(null);
  const container = useRef(null);
  const [activeOrg, setActiveOrg] = useState(null);
  const [basemapStyle, setBasemapStyle] = useState(null);
  const [creditLevels, setCreditLevels] = useState(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [geoJSON, setGeoJSON] = useState(null);
  const [map, setMap] = useState(null);
  const [organizationMap, setOrganizationMap] = useState(null);
  const [organizationType, setOrganizationType] = useState("user");
  const [creditType, setCreditType] = useState("exchanged");

  // Load the basemap style.
  useEffect(() => {
    (async () => setBasemapStyle(await getBasemapStyle()))();
  }, []);

  // Load GeoJSON data.
  useEffect(() => {
    (async (cType) => {
      const [organizations, credits] = await Promise.all(
        ["organizations", `credits_${cType}`].map(getMapData)
      );
      if (!organizationMap) {
        const orgMap = {};
        organizations.features.forEach(
          (feature) => (orgMap[feature.id.toString()] = feature.properties.name)
        );
        setOrganizationMap(orgMap);
      }
      const creditsGeoJSON = makeCreditsGeoJSON(
        organizations,
        credits,
        creditType
      );
      setGeoJSON(creditsGeoJSON);
      if (cType === "exchanged" && !creditLevels)
        setCreditLevels(getCreditLevels(creditsGeoJSON));
    })(creditType);
  }, [creditType]);

  // Update map style when the state changes.
  useEffect(() => {
    if (map)
      map.setStyle(
        getStyle({
          activeOrg,
          basemapStyle,
          creditLevels,
          creditType,
          geoJSON,
          organizationType,
        })
      );
  }, [activeOrg, geoJSON, map, organizationType]);

  // Set the active organization ID on hover.
  useEffect(() => {
    if (map) {
      map.on("mousemove", "organizations", (e) =>
        setActiveOrg(e.features.length ? e.features[0] : null)
      );
      map.on("mouseleave", "organizations", () => setActiveOrg(null));
    }
  }, [map]);

  // Resize the map when entering or exiting fullscreen mode.
  useEffect(() => {
    if (map) map.resize();
  }, [fullscreen]);

  // Set the organization type to user when allocations is selected.
  useEffect(() => {
    if (creditType === "allocated") setOrganizationType("user");
  }, [creditType]);

  // Initialize the map.
  useLayoutEffect(
    () =>
      setMap(
        new maplibregl.Map({
          container: container.current,
          style: getStyle({
            activeOrg,
            basemapStyle,
            creditLevels,
            creditType,
            geoJSON,
            organizationType,
          }),
          center: [-111.01, 38.88],
          zoom: 3.4,
          hash: true,
        })
      ),
    []
  );

  // Exit fullscreen when the Esc key is pressed.
  useLayoutEffect(
    () =>
      root.current.addEventListener("keydown", (e) => {
        if (e.key === "Escape") setFullscreen(false);
      }),
    []
  );

  return (
    <section
      className={`${style["allocations-map"]} ${
        fullscreen ? style.fullscreen : "border-4 border-primary"
      }`}
      ref={root}
    >
      <div className={style.map} ref={container}></div>
      <Controls
        creditType={creditType}
        fullscreen={fullscreen}
        organizationType={organizationType}
        setCreditType={setCreditType}
        setFullscreen={setFullscreen}
        setOrganizationType={setOrganizationType}
      />
      <Legend
        activeOrg={activeOrg}
        creditLevels={creditLevels}
        organizationType={organizationType}
      />
      <OrgInfo
        activeOrg={activeOrg}
        creditType={creditType}
        organizationMap={organizationMap}
        organizationType={organizationType}
      />
      <button
        title={`${fullscreen ? "Exit" : "Enter"} Fullscreen`}
        className={style.fullscreen}
        onClick={() => setFullscreen(!fullscreen)}
      >
        {fullscreen ? (
          <Minimize className="size-4" aria-label="Fullscreen" />
        ) : (
          <Maximize className="size-4" aria-label="Fullscreen" />
        )}
      </button>
    </section>
  );
}
