import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Maximize, Minimize } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getBasemapStyle,
  getCreditLevels,
  getMapData,
  getStyle,
  makeCreditsGeoJSON,
} from "./utils";
import Controls from "./Controls";
import Legend from "./Legend";
import OrgInfo from "./OrgInfo";
import type { OrganizationType } from "./config";
import type { ActiveOrg, CreditsGeoJSON, CreditLevels, CreditType } from "./types";

export default function AllocationsMap() {
  const root = useRef<HTMLElement>(null);
  const container = useRef<HTMLDivElement>(null);
  const [activeOrg, setActiveOrg] = useState<ActiveOrg | null>(null);
  const [basemapStyle, setBasemapStyle] = useState<Record<string, any> | null>(null);
  const [creditLevels, setCreditLevels] = useState<CreditLevels | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [geoJSON, setGeoJSON] = useState<CreditsGeoJSON | null>(null);
  const [map, setMap] = useState<any>(null);
  const [organizationMap, setOrganizationMap] = useState<Record<string, string> | null>(null);
  const [organizationType, setOrganizationType] = useState<OrganizationType>("user");
  const [creditType, setCreditType] = useState<CreditType>("exchanged");

  // Load the basemap style.
  useEffect(() => {
    (async () => setBasemapStyle(await getBasemapStyle()))();
  }, []);

  // Load GeoJSON data.
  useEffect(() => {
    (async (cType: CreditType) => {
      const [organizations, credits] = await Promise.all(
        ["organizations", `credits_${cType}`].map(getMapData),
      );
      if (!organizationMap) {
        const orgMap: Record<string, string> = {};
        organizations.features.forEach(
          (feature: any) => (orgMap[feature.id.toString()] = feature.properties.name),
        );
        setOrganizationMap(orgMap);
      }
      const creditsGeoJSON = makeCreditsGeoJSON(organizations, credits, creditType);
      setGeoJSON(creditsGeoJSON);
      if (cType === "exchanged" && !creditLevels) setCreditLevels(getCreditLevels(creditsGeoJSON));
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
        }),
      );
  }, [activeOrg, geoJSON, map, organizationType]);

  // Set the active organization ID on hover.
  useEffect(() => {
    if (map) {
      map.on("mousemove", "organizations", (e: any) =>
        setActiveOrg(e.features.length ? e.features[0] : null),
      );
      map.on("mouseleave", "organizations", () => setActiveOrg(null));
    }
  }, [map]);

  // Resize the map when entering or exiting fullscreen mode.
  useEffect(() => {
    if (map) map.resize();
  }, [fullscreen, map]);

  // Set the organization type to user when allocations is selected.
  useEffect(() => {
    if (creditType === "allocated") setOrganizationType("user");
  }, [creditType]);

  // Initialize the map.
  useLayoutEffect(() => {
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
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Exit fullscreen when the Esc key is pressed.
  useLayoutEffect(() => {
    const node = root.current;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullscreen(false);
    };
    node?.addEventListener("keydown", onKeyDown);
    return () => node?.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <section
      className={cn(
        "relative h-[500px] w-full",
        fullscreen ? "fixed inset-0 z-[9999] h-screen" : "border-4 border-primary",
      )}
      ref={root}
    >
      <div className="h-full w-full" ref={container}></div>
      <Controls
        creditType={creditType}
        organizationType={organizationType}
        setCreditType={setCreditType}
        setOrganizationType={setOrganizationType}
      />
      <Legend activeOrg={activeOrg} creditLevels={creditLevels} organizationType={organizationType} />
      <OrgInfo
        activeOrg={activeOrg}
        creditType={creditType}
        organizationMap={organizationMap}
        organizationType={organizationType}
      />
      <button
        title={`${fullscreen ? "Exit" : "Enter"} Fullscreen`}
        className="absolute right-0 top-0 border-0 bg-white/50 px-[7px] py-0.5 hover:bg-white/75 focus:bg-white/75 active:bg-white/75"
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
