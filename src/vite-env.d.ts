/// <reference types="vite/client" />

declare module "*.module.scss" {
  const classes: Record<string, string>;
  export default classes;
}

declare module "*.module.css" {
  const classes: Record<string, string>;
  export default classes;
}

// Loaded as a global script by the consuming app, not bundled as an npm
// dependency here.
declare const maplibregl: {
  Map: new (options: Record<string, any>) => any;
};
