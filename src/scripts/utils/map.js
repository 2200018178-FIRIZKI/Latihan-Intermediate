import { map, tileLayer, Icon, icon, marker, popup, latLng, control } from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { MAP_SERVICE_API_KEY } from '../config';

export default class Map {
  #zoom = 5;
  #map = null;
  #baseLayers = {};
  #layerControl = null;

  static async getPlaceNameByCoordinate(latitude, longitude) {
    try {
      const url = new URL(`https://api.maptiler.com/geocoding/${longitude},${latitude}.json`);
      url.searchParams.set('key', MAP_SERVICE_API_KEY);
      url.searchParams.set('language', 'id');
      url.searchParams.set('limit', '1');
      const response = await fetch(url);
      const json = await response.json();
      const place = json.features[0].place_name.split(', ');
      return [place.at(-2), place.at(-1)].map((name) => name).join(', ');
    } catch (error) {
      console.error('getPlaceNameByCoordinate: error:', error);
      return `${latitude}, ${longitude}`;
    }
  }
 
  static isGeolocationAvailable() {
    return 'geolocation' in navigator;
  }
 
  static getCurrentPosition(options = {}) {
    return new Promise((resolve, reject) => {
      if (!Map.isGeolocationAvailable()) {
        reject('Geolocation API unsupported');
        return;
      }
 
      navigator.geolocation.getCurrentPosition(resolve, reject, options);
    });
  }
 
 
  static async build(selector, options = {}) {
    if ('center' in options && options.center) {
      return new Map(selector, options);
    }
 
    const jakartaCoordinate = [-6.2, 106.816666];
 
    if ('locate' in options && options.locate) {
      try {
        const position = await Map.getCurrentPosition();
        const coordinate = [position.coords.latitude, position.coords.longitude];
 
        return new Map(selector, {
          ...options,
          center: coordinate,
        });
      } catch (error) {
        console.error('build: error:', error);
 
        return new Map(selector, {
          ...options,
          center: jakartaCoordinate,
        });
      }
    }
 
    return new Map(selector, {
      ...options,
      center: jakartaCoordinate,
    });
  }
 
  constructor(selector, options = {}) {
    this.#zoom = options.zoom ?? this.#zoom;

    
    this.#baseLayers = {
      'OpenStreetMap': tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }),
      'Satelit': tileLayer(`https://api.maptiler.com/maps/hybrid/{z}/{x}/{y}.jpg?key=${MAP_SERVICE_API_KEY}`, {
        attribution: '&copy; <a href="https://www.maptiler.com/">MapTiler</a>',
        tileSize: 512,
        zoomOffset: -1
      }),
      'Terrain': tileLayer(`https://api.maptiler.com/maps/outdoor/{z}/{x}/{y}.png?key=${MAP_SERVICE_API_KEY}`, {
        attribution: '&copy; <a href="https://www.maptiler.com/">MapTiler</a>',
        tileSize: 512,
        zoomOffset: -1
      }),
      'Dark Mode': tileLayer(`https://api.maptiler.com/maps/streets-dark/{z}/{x}/{y}.png?key=${MAP_SERVICE_API_KEY}`, {
        attribution: '&copy; <a href="https://www.maptiler.com/">MapTiler</a>',
        tileSize: 512,
        zoomOffset: -1
      })
    };

    this.#map = map(document.querySelector(selector), {
      zoom: this.#zoom,
      scrollWheelZoom: true, 
      layers: [this.#baseLayers['OpenStreetMap']], 
      ...options,
    });

   
    this.#layerControl = control.layers(this.#baseLayers, null, {
      position: 'topright',
      collapsed: false
    }).addTo(this.#map);

    control.scale({
      metric: true,
      imperial: false,
      position: 'bottomright'
    }).addTo(this.#map);
  }

  changeCamera(coordinate, zoomLevel = null) {
    if (!zoomLevel) {
      this.#map.setView(latLng(coordinate), this.#zoom);
      return;
    }
    this.#map.setView(latLng(coordinate), zoomLevel);
  }

  getCenter() {
    const { lat, lng } = this.#map.getCenter();
    return {
      latitude: lat,
      longitude: lng,
    };
  }
  createIcon(options = {}) {
    return icon({
      ...Icon.Default.prototype.options,
      iconRetinaUrl: markerIcon2x,
      iconUrl: markerIcon,
      shadowUrl: markerShadow,
      ...options,
    });
  }
  addMarker(coordinates, markerOptions = {}, popupOptions = null) {
    if (typeof markerOptions !== 'object') {
      throw new Error('markerOptions must be an object');
    }
    const newMarker = marker(coordinates, {
      icon: this.createIcon(),
      ...markerOptions,
    });
    if (popupOptions) {
      if (typeof popupOptions !== 'object') {
        throw new Error('popupOptions must be an object');
      }
      if (!('content' in popupOptions)) {
        throw new Error('popupOptions must include `content` property.');
      }
      const newPopup = popup(coordinates, popupOptions);
      newMarker.bindPopup(newPopup);
    }
    newMarker.addTo(this.#map);
    return newMarker;
  }
  addMapEventListener(eventName, callback) {
    this.#map.addEventListener(eventName, callback);
  }

  addOverlay(name, layer) {
    if (this.#layerControl) {
      this.#layerControl.addOverlay(layer, name);
    }
  }
}