
    mapboxgl.accessToken =
    'pk.eyJ1IjoicGF1bHN1bjhiOCIsImEiOiJjbDJ1MGs4NGEwNDVsM2RxcXQ2anFzcnV5In0.p0vwA6m487mqnwtYhoiMbw';
  var map = new mapboxgl.Map({
    container: 'map', // container ID
    style: 'mapbox://styles/paulsun8b8/cl6lfeqjx004b15npcok6rosl',
    zoom: 16, // starting zoom
    pitch: 75,
    bearing: -90, // bearing in degrees
    center: [-122.319212, 47.616815] // starting center
  });

  // Allow map camera to rotate
  let isRotating = true;

  function rotateCamera(timestamp) {
    // clamp the rotation between 0 -360 degrees
    // Divide timestamp by 100 to slow rotation to ~10 degrees / sec
    map.rotateTo((timestamp / 100) % 360, {
      duration: 0
    });
    // Request the next frame of the animation.
    if (isRotating !== false) {
      requestAnimationFrame(rotateCamera);
    }
  }

  // Add customize controls like zoom 
  class CustomControl {
    onAdd(map) {
      this._map = map;
      this._container = document.createElement('button');
      this._container.style.backgroundColor = 'black';
      this._container.style.color = 'white';
      this._container.className = 'mapboxgl-ctrl';
      this._container.textContent = 'start rotate';
      this._container.onclick = () => {
        if (this.isRotating) {
          isRotating = false;
          rotateCamera(false);
          this._container.textContent = 'start rotate';
        } else {
          isRotating = true;
          rotateCamera(0);
          this._container.textContent = 'stop rotate';
        }
        this.isRotating = !this.isRotating;
      }
      return this._container;
    }
    onRemove() {
      this._container.parentNode.removeChild(this._container);
      this._map = undefined;
    }
  }
  map.addControl(new mapboxgl.NavigationControl({
    showCompass: true,
    visualizePitch: true
  }));
  map.addControl(new CustomControl());
  // Add the bounding box
  document.getElementById('fit').addEventListener('click', () => {
    map.fitBounds([
      [-122.314239, 47.614112], // southwestern corner of the bounds
      [-122.322178, 47.618772] // northeastern corner of the bounds
    ], {
      bearing: -90
    });
  });
  // Load geospatial datasets and display
  map.on('load', () => {
    map.addSource('speech-area', {
      'type': 'geojson',
      /*
       * Each feature in this GeoJSON file contains values for
       * `properties.height`, `properties.base_height`,
       * and `properties.color`.
       * In `addLayer` you will use expressions to set the new
       * layer's paint properties based on these values.
       */
      'data': 'assets/speech_area.geojson'
    });
    map.addLayer({
      'id': 'room-extrusion',
      'type': 'fill-extrusion',
      'source': 'speech-area',
      'paint': {
        // Get the `fill-extrusion-color` from the source `color` property.
        'fill-extrusion-color': ['get', 'color'],
        // Get `fill-extrusion-height` from the source `height` property.
        'fill-extrusion-height': ['get', 'height'],
        // Get `fill-extrusion-base` from the source `base_height` property.
        'fill-extrusion-base': ['get', 'base_height'],
        // Make extrusions slightly opaque to see through indoor walls.
        'fill-extrusion-opacity': 0.5
      }
    });
    map.addSource('chop-landmark', {
      'type': 'geojson',
      'data': 'assets/chop-landmark.geojson'
    });
    map.addLayer({
      'id': 'chop-landmark',
      'type': 'symbol',
      'source': 'chop-landmark',
      'layout': {}
    });
    map.addSource('chop-graffiti', {
      'type': 'geojson',
      'data': 'assets/graffiti_digitize.geojson'
    });
    // Add graffiti labels
    map.addLayer({
      'id': 'poi-labels',
      'type': 'symbol',
      'source': 'chop-graffiti',
      'layout': {
        'text-field': ['get', 'Message'],
        'text-variable-anchor': ['left'],
        'text-radial-offset': 0.5,
        'text-justify': 'right',
        'text-writing-mode': ['vertical'],
      },
      'paint': {
        'text-color': "#444",
        'text-halo-color': "#fff",
        'text-halo-width': 2
      },
    });
    map.addLayer({
      'id': 'Graffiti',
      'type': 'fill',
      'source': 'chop-graffiti',
      'layout': {
        'visibility': 'none'
      },
      'paint': {
        'fill-color': '#0080ff', // blue color fill
        'fill-opacity': 0.5,
      }
    });
    map.addSource('chop-polygon', {
      'type': 'geojson',
      'data': 'assets/chop.geojson'
    });
    map.addLayer({
      'id': 'CHOP Zone',
      'type': 'fill',
      'source': 'chop-polygon',
      'layout': {
        'visibility': 'none'
      },
      'paint': {
        'fill-color': '#0080ff', // blue color fill
        'fill-opacity': 0.5,
      }
    }, 'waterway-label');
    // Allow the comment form to pop out once the user click anywhere on CHOP
    map.on('click', 'CHOP Zone', (e) => {
      new mapboxgl.Popup().setLngLat(e.lngLat).setHTML(e.features[0].properties.name).setHTML(`
                                      <button class="open-button" onclick="openForm()">Comment</button>`).addTo(map);
    });
    map.addLayer({
      'id': 'outline',
      'type': 'line',
      'source': 'chop-polygon',
      'layout': {},
      'paint': {
        'line-color': '#000',
        'line-width': 3
      }
    }, 'waterway-label');
    map.addSource('drone-tile', {
      'type': 'raster',
      'tiles': ['assets/drone_img/{z}/{x}/{y}.png'],
      'tileSize': 256,
      'attribution': 'Map tiles designed by Huating Sun'
    });
    map.addLayer({
      'id': 'Drone Image',
      'type': 'raster',
      'layout': {
        'visibility': 'none'
      },
      'source': 'drone-tile',
    }, 'waterway-label');
  });
  // Add data of shops affected by CHOP
  const stores = {
    "type": "FeatureCollection",
    "features": [{
      "type": "Feature",
      "properties": {
        "icon": "shop-15",
        "color": "#188816",
        "title": "Northwest Liquor & Wine",
        "description": "1605 12th Ave, Seattle, WA 98122"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [-122.31708079576491,
          47.61547912635008
        ]
      }
    }, {
      "type": "Feature",
      "properties": {
        "icon": "shop-15",
        "color": "#188816",
        "title": "Blick Art Materials",
        "description": "1600 Broadway, Seattle, WA 98122"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [-122.32057705521582,
          47.61542804793038
        ]
      }
    }, {
      "type": "Feature",
      "properties": {
        "icon": "shop-15",
        "color": "#188816",
        "title": "Mud Bay",
        "description": "1514 Broadway, Seattle, WA 98122"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [-122.32055962085725,
          47.614555638899276
        ]
      }
    }]
  }
  // Allow user to comment and comment once click on icons
  for (const feature of stores.features) {
    // create a HTML element for each feature
    const el = document.createElement('div');
    el.className = 'store';
    // make a marker for each feature and add to the map
    new mapboxgl.Marker(el).setLngLat(feature.geometry.coordinates).setPopup(new mapboxgl.Popup({
      offset: 25
    }).setHTML(`
                                      <h2>${feature.properties.title}</h2>
                                      <p>${feature.properties.description}</p>
                                      <button class="open-button" onclick="openForm()">Comment</button>`)).addTo(map);
  }
  // Add restaurants data 
  const restaurants = {
    "type": "FeatureCollection",
    "features": [{
      "type": "Feature",
      "properties": {
        "icon": "restaurant-15",
        "color": "#ff0000",
        "title": "Ramen Danbo",
        "description": "1222 E Pine St, Seattle, WA 98122"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [-122.3160944133997,
          47.615422849681345
        ]
      }
    }, {
      "type": "Feature",
      "properties": {
        "icon": "restaurant-15",
        "color": "#ff0000",
        "title": "Sam's Tavern",
        "description": "1024 E Pike St, Seattle, WA 98122"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [-122.31833070516585,
          47.61425232644285
        ]
      }
    }, {
      "type": "Feature",
      "properties": {
        "icon": "restaurant-15",
        "color": "#ff0000",
        "title": "Oddfellows Café + Bar",
        "description": "1525 10th Ave, Seattle, WA 98122"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [-122.31964766979218,
          47.61494212241605
        ]
      }
    }, {
      "type": "Feature",
      "properties": {
        "icon": "restaurant-15",
        "color": "#ff0000",
        "title": "Atulea",
        "description": "1715 12th Ave #100, Seattle, WA 98122"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [-122.31716461479665,
          47.61690839782646
        ]
      }
    }]
  }

  // User can click on icons to comment or view information
  for (const feature of restaurants.features) {
    // create a HTML element for each feature
    const el = document.createElement('div');
    el.className = 'restaurant';
    new mapboxgl.Marker(el).setLngLat(feature.geometry.coordinates).setPopup(new mapboxgl.Popup({
      offset: 25
    }).setHTML(`
                                      <h2>${feature.properties.title}</h2>
                                      <p>${feature.properties.description}</p>
                                      <button class="open-button" onclick="openForm()">Comment</button>`)).addTo(map);
  }
  // Add police station data
  const police_station = {
    "type": "FeatureCollection",
    "features": [{
      "type": "Feature",
      "properties": {
        "icon": "police-15",
        "color": "#004cff",
        "title": "City of Seattle Police Department",
        "description": "1519 12th Ave, Seattle, WA 98122"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [-122.31725715100764,
          47.614924945431525
        ]
      }
    }]
  }
  // User can click on icon to comment and view information
  for (const feature of police_station.features) {
    // create a HTML element for each feature
    const el = document.createElement('div');
    el.className = 'police';
    // make a marker for each feature and add to the map
    new mapboxgl.Marker(el).setLngLat(feature.geometry.coordinates).setPopup(new mapboxgl.Popup({
      offset: 25
    }).setHTML(`
                                      <h2>${feature.properties.title}</h2>
                                      <p>${feature.properties.description}</p>
                                      <button class="open-button" onclick="openForm()">Comment</button>`)).addTo(map);
  }
  // After the last frame rendered before the map enters an "idle" state.
  map.on('idle', () => {
    // If these two layers were not added to the map, abort
    if (!map.getLayer('Drone Image', 'Graffiti', 'CHOP Zone')) {
      return;
    }
    // Enumerate ids of the layers.
    const toggleableLayerIds = ['Drone Image', 'Graffiti', 'CHOP Zone'];
    // Set up the corresponding toggle button for each layer.
    for (const id of toggleableLayerIds) {
      // Skip layers that already have a button set up.
      if (document.getElementById(id)) {
        continue;
      }
      // Create a link.
      const link = document.createElement('a');
      link.id = id;
      link.href = '#';
      link.textContent = id;
      link.className = 'inactive';
      // Show or hide layer when the toggle is clicked.
      link.onclick = function (e) {
        const clickedLayer = this.textContent;
        // preventDefault() tells the user agent that if the event does not get explicitly handled, 
        // its default action should not be taken as it normally would be.
        e.preventDefault();
        // The stopPropagation() method prevents further propagation of the current event in the capturing 
        // and bubbling phases. It does not, however, prevent any default behaviors from occurring; 
        // for instance, clicks on links are still processed. If you want to stop those behaviors, 
        // see the preventDefault() method.
        e.stopPropagation();
        const visibility = map.getLayoutProperty(clickedLayer, 'visibility');
        // Toggle layer visibility by changing the layout object's visibility property.
        // if it is currently visible, after the clicking, it will be turned off.
        if (visibility === 'visible') {
          map.setLayoutProperty(clickedLayer, 'visibility', 'none');
          this.className = '';
        } else { //otherise, it will be turned on.
          this.className = 'active';
          map.setLayoutProperty(clickedLayer, 'visibility', 'visible');
        }
      };
      // in the menu place holder, insert the layer links.
      const layers = document.getElementById('menu');
      layers.appendChild(link);
    }
  });
  // When click on Graffiti, it will display the information of the graffiti
  map.on("click", "Graffiti", (event) => {
    new mapboxgl.Popup().setLngLat(event.lngLat).setHTML(`
                                      <strong>Message:</strong> ${event.features[0].properties.Message}
                      
                                      <hr>
                                          <strong>Color of Graffiti:</strong> ${event.features[0].properties.Color}`).addTo(map);
  });
  // Change the cursor to a pointer when the mouse is over the places layer.
  map.on('mouseenter', 'Graffiti', () => {
    map.getCanvas().style.cursor = 'pointer';
  });
  // Change it back to a pointer when it leaves.
  map.on('mouseleave', 'Graffiti', () => {
    map.getCanvas().style.cursor = '';
  });
  // const drone_img = document.getElementById('Drone Image')
  // map.on('zoom', () => {
  // if (map.getZoom() > 16) {
  //map.setLayoutProperty('Drone Image', 'visibility', 'visible');
  //} else {
  //map.setLayoutProperty('Drone Image', 'visibility', 'none');
  //}
  //});