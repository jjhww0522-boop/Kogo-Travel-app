/* eslint-disable @typescript-eslint/no-explicit-any */
declare namespace naver.maps {
  class LatLng {
    constructor(lat: number, lng: number);
  }
  class Map {
    constructor(element: HTMLElement, options?: MapOptions);
    destroy(): void;
  }
  class Marker {
    constructor(options?: MarkerOptions);
  }
  interface MapOptions {
    center?: LatLng;
    zoom?: number;
    zoomControl?: boolean;
    zoomControlOptions?: { position?: Position };
    scaleControl?: boolean;
    mapDataControl?: boolean;
    logoControlOptions?: { position?: Position };
  }
  interface MarkerOptions {
    position?: LatLng;
    map?: Map;
    title?: string;
  }
  namespace Position {
    const TOP_RIGHT: string;
    const BOTTOM_LEFT: string;
  }
}
