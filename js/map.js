mapboxgl.accessToken =
    'pk.eyJ1IjoicGF1bHN1bjhiOCIsImEiOiJjbDJ1MGs4NGEwNDVsM2RxcXQ2anFzcnV5In0.p0vwA6m487mqnwtYhoiMbw';
let map = new mapboxgl.Map({
    container: 'map', // container ID
    // style: 'mapbox://styles/paulsun8b8/cl6lfeqjx004b15npcok6rosl',
    // style: 'mapbox://styles/mapbox/light-v11',
    // style: 'mapbox://styles/mapbox/streets-v12',
    style: 'mapbox://styles/mapbox/satellite-streets-v12',
    // style: 'mapbox://styles/mapbox/satellite-v9',
    // zoom: 17, // starting zoom
    pitch: 75,
    minZoom: 12,
    bearing: 230, // bearing in degrees
    antialias: true,
    // center: [-122.319212, 47.616815], // starting center
    bounds: [-122.320894, 47.614103, -122.31558990189957, 47.61882983122038],
    maxBounds: [-123.9180845532934, 47.04828654073975,  -121.14008445949332,48.71935997846136]
});

map.addControl(new mapboxgl.NavigationControl({
    showCompass: true,
    visualizePitch: true
}));

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
// class CustomControl {
//     onAdd(map) {
//         this._map = map;
//         this._container = document.createElement('button');
//         this._container.style.backgroundColor = 'black';
//         this._container.style.color = 'white';
//         this._container.className = 'mapboxgl-ctrl';
//         this._container.textContent = 'start rotate';
//         this._container.onclick = () => {
//             if (this.isRotating) {
//                 isRotating = false;
//                 rotateCamera(false);
//                 this._container.textContent = 'start rotate';
//             } else {
//                 isRotating = true;
//                 rotateCamera(0);
//                 this._container.textContent = 'stop rotate';
//             }
//             this.isRotating = !this.isRotating;
//         }
//         return this._container;
//     }
//     onRemove() {
//         this._container.parentNode.removeChild(this._container);
//         this._map = undefined;
//     }
// }
// map.addControl(new mapboxgl.NavigationControl({
//     showCompass: true,
//     visualizePitch: true
// }));
// map.addControl(new CustomControl());
// Add the bounding box


// document.getElementById('fit').addEventListener('click', () => {
//     map.fitBounds([
//         [-122.314239, 47.614112], // southwestern corner of the bounds
//         [-122.322178, 47.618772] // northeastern corner of the bounds
//     ], {
//         bearing: -90
//     });
// });





// Load geospatial datasets and display
map.on('load', () => {

    //==============drone photo========================
    map.addSource('drone-tile', {
        'type': 'raster',
        'tiles': ['assets/drone_img/{z}/{x}/{y}.png'],
        'bounds': [-122.320894, 47.614103, -122.31558990189957, 47.61882983122038],
        'tileSize': 256
    });
    map.addLayer({
        'id': 'aerial',
        'type': 'raster',
        'source': 'drone-tile',
        'layout': {
            visibility: "visible",
          }
    }, 'road-path');





    //=============outside mask =========================

    map.addSource('mask', {
        'type': 'geojson',
        'data': 'assets/outsidemask.geojson'
    });
    map.addLayer({
        'id': 'outsidemask',
        'type': 'fill',
        'source': 'mask',
        'paint': {
            'fill-color': 'black',
            'fill-opacity': 0.7,
        }
    });


    // // Insert the layer beneath any symbol layer.
    const layers = map.getStyle().layers;
    const labelLayerId = layers.find(
        (layer) => layer.type === 'symbol' && layer.layout['text-field']
    ).id;






    map.addSource('chop-buildings', {
        'type': 'geojson',
        'data': 'assets/buildings.geojson'
    });


    map.addLayer({
        'id': '3d-buildings',
        'source': 'chop-buildings',
        'filter': ['!=', 'type', 'police'],
        'type': 'fill-extrusion',
        'minzoom': 15,
        'paint': {
            'fill-extrusion-color': '#aaa',

            // Use an 'interpolate' expression to
            // add a smooth transition effect to
            // the buildings as the user zooms in.
            // 'fill-extrusion-height': ['get', 'eheight'],

            'fill-extrusion-height': [
                'interpolate',
                ['linear'],
                ['zoom'],
                15,
                0,
                15.05,
                ['get', 'eheight']
                ],

            'fill-extrusion-base': 0,
            'fill-extrusion-opacity': 0.8
        }
    }, 'road-label');


    map.addLayer({
        'id': '3d-police',
        'source': 'chop-buildings',
        'filter': ['==', 'type', 'police'],
        'type': 'fill-extrusion',
        'minzoom': 15,
        'paint': {
            'fill-extrusion-color': 'red',

            // Use an 'interpolate' expression to
            // add a smooth transition effect to
            // the buildings as the user zooms in.
            'fill-extrusion-height': 30,
            'fill-extrusion-base': 0,
            'fill-extrusion-opacity': 0.6
        },
        'layout': {
            visibility: "visible",
          }
    }, 'road-label');

    //============== boundary area ========================
    map.addSource('chop-polygon', {
        'type': 'geojson',
        'data': 'assets/chop-boundary-polygon.geojson'
    });

    map.addLayer({
        'id': 'boundary',
        'type': 'fill-extrusion',
        'source': 'chop-polygon',
        // 'layout': {
        //     'visibility': 'none'
        // },
        'paint': {
            // Get the `fill-extrusion-color` from the source `color` property.
            'fill-extrusion-color': '#0080ff',

            // Get `fill-extrusion-height` from the source `height` property.
            'fill-extrusion-height': 5,

            // Get `fill-extrusion-base` from the source `base_height` property.
            'fill-extrusion-base': 0,

            // Make extrusions slightly opaque to see through indoor walls.
            'fill-extrusion-opacity': 0.5
        },
        'layout': {
            visibility: "visible",
          }
    }, 'road-label');

    //============== core area ========================
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
        'id': 'speech',
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
        },
        'layout': {
            visibility: "visible",
          }
    }, 'road-label');



    map.addSource('chop-graffito', {
        'type': 'geojson',
        'data': 'assets/graffito.geojson'
    });


    // Add graffiti labels
    // map.addLayer({
    //     'id': 'poi-labels',
    //     'type': 'symbol',
    //     // 'source': 'chop-graffiti',
    //     'layout': {
    //         'text-field': ['get', 'Message'],
    //         'text-variable-anchor': ['left'],
    //         // 'text-radial-offset': 0.5,
    //         'text-justify': 'right',
    //         'text-writing-mode': ['vertical'],
    //     },
    //     'paint': {
    //         'text-color': "#444",
    //         'text-halo-color': "#fff",
    //         'text-halo-width': 2
    //     },
    // });

    map.addLayer({
        'id': 'graffito',
        'type': 'fill-extrusion',
        'source': 'chop-graffito',
        'layout': {
            'visibility': 'none'
        },
        'paint': {
            'fill-extrusion-color': 'yellow',
            'fill-extrusion-height': 0.4,
            'fill-extrusion-base': 0,
            'fill-extrusion-opacity': 0.3
        }
    }, 'road-label');



    hiddenLayers = ["transit-label", 'road-label']

    hiddenLayers.forEach((layer) => {
        map.setLayoutProperty(
            layer,
            'visibility',
            'none'
        );
    });


    // create a HTML element for each feature
    // const el = document.createElement('div');
    // el.className = 'police';
    // // make a marker for each feature and add to the map
    // new mapboxgl.Marker(el).setLngLat(police_station.geometry.coordinates).setPopup(new mapboxgl.Popup({
    //     offset: 25
    // }).setHTML(`<h2>${police_station.properties.title}</h2>
    //             <p>${police_station.properties.description}</p>
    //             <button class="open-button" onclick="openForm()">Comment</button>`)).addTo(map);



    // Allow the comment form to pop out once the user click anywhere on CHOP
    map.on('click', 'CHOP Zone', (e) => {
        new mapboxgl.Popup().setLngLat(e.lngLat).setHTML(e.features[0].properties.name).setHTML(`
                                      <button class="open-button" onclick="openForm()">Comment</button>`).addTo(map);
    });



    // When click on Graffiti, it will display the information of the graffiti
    map.on("click", "graffito", (event) => {
        new mapboxgl.Popup().setLngLat(event.lngLat).setHTML(`
                                      <strong>Message:</strong> ${event.features[0].properties.Message}
                                      <hr>
                                      <strong>Color of Graffiti:</strong> ${event.features[0].properties.Color}`).addTo(map);
    });



    $('#loader').fadeOut("slow");

});



    // Change the cursor to a pointer when the mouse is over the places layer.
    map.on('mouseenter', 'graffito', () => {
        map.getCanvas().style.cursor = 'pointer';
    });
    // Change it back to a pointer when it leaves.
    map.on('mouseleave', 'graffito', () => {
        map.getCanvas().style.cursor = '';
    });



    // Enumerate ids of the layers.
    const toggleableLayerIds = ['aerial', 'graffito', 'boundary', 'speech', '3d-police'];
    // Set up the corresponding toggle button for each layer.
    for (const id of toggleableLayerIds) {
        
        // Show or hide layer when the toggle is clicked.
        console.log(id);
        document.getElementById(id).addEventListener("change", function(e){
            const clickedLayer = id;
            e.preventDefault();
            e.stopPropagation();
            const visibility = map.getLayoutProperty(clickedLayer, 'visibility');
                if (visibility === 'visible') {
                    map.setLayoutProperty(clickedLayer, 'visibility', 'none');
                } else { 
                    map.setLayoutProperty(clickedLayer, 'visibility', 'visible');
                }
        });

        document.getElementById(id).addEventListener("mouseenter", function(e){
           document.body.style.cursor = 'pointer';
        });

        document.getElementById(id).addEventListener("mouseleave", function(e){
            document.body.style.cursor = '';
        });
    
    }



    document.getElementById(id).addEventListener("mouseenter", function(e){
        document.body.style.cursor = 'pointer';
     });

     document.getElementById(id).addEventListener("mouseleave", function(e){
         document.body.style.cursor = '';
     });