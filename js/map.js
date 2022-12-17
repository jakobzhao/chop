mapboxgl.accessToken =
    'pk.eyJ1IjoicGF1bHN1bjhiOCIsImEiOiJjbDJ1MGs4NGEwNDVsM2RxcXQ2anFzcnV5In0.p0vwA6m487mqnwtYhoiMbw';
let map = new mapboxgl.Map({
    container: 'map', // container ID
    style: 'mapbox://styles/mapbox/satellite-streets-v12',
    // style: 'mapbox://styles/paulsun8b8/cl6lfeqjx004b15npcok6rosl',
    // style: 'mapbox://styles/mapbox/light-v11',
    // style: 'mapbox://styles/mapbox/streets-v12',
    // style: 'mapbox://styles/mapbox/satellite-v9',
    // zoom: 17, // starting zoom
    // center: [-122.319212, 47.616815], // starting center
    bounds: [-122.320894, 47.614103, -122.31558990189957, 47.61882983122038],
    maxBounds: [-123.9180845532934, 47.04828654073975, -121.14008445949332, 48.71935997846136],
    minZoom: 12,
    maxZoom: 20,
    pitch: 72,
    // bearing: 230, // bearing in degrees
    antialias: true,
    logoPosition: 'bottom-right',
    attributionControl: false,
});

// Create a popup, but don't add it to the map yet.
const popup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false
});

let hoveredStateId = null;

//Return the original position of the map.
document.getElementById('title').addEventListener('mouseenter', () => {
    document.getElementById('title').style.cursor = 'pointer';
});
document.getElementById('title').addEventListener('mouseleave', () => {
    document.getElementById('title').style.cursor = '';
});
document.getElementById('title').addEventListener('click', () => {
    map.fitBounds([-122.320894, 47.614103, -122.31558990189957, 47.61882983122038], {
        pitch: 72,
    });
});


map.addControl(new mapboxgl.NavigationControl({
    showCompass: true
    // visualizePitch: true
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







// Load geospatial datasets and display
map.on('load', () => {

    //download a spray icon from fa 6, and edit it at https://editor.method.ac/
    map.loadImage('../img/spray-can2.png', (error, image) => {
        if (error) throw error;
        if (!map.hasImage('spray')) map.addImage('spray', image);
    });

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
            'visibility': 'visible',
        }
    }, 'road-path');

    //=============outside mask=========================

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

    //=============Buildings=========================
    map.addSource('buildings', {
        'type': 'geojson',
        'data': 'assets/buildings.geojson'
    });
    map.addLayer({
        'id': '3d-buildings',
        'source': 'buildings',
        'filter': ['!=', 'type', 'police'],
        'type': 'fill-extrusion',
        'minzoom': 15,
        'paint': {
            'fill-extrusion-color': '#aaa',
            'fill-extrusion-height': ['get', 'eheight'],
            'fill-extrusion-base': 0,
            'fill-extrusion-opacity': 0.8
        }
    }, 'road-label');

    //=============grid=========================
    map.addSource('grid', {
        'type': 'geojson',
        'generateId': true,
        'data': 'assets/grid.geojson'
    });
    map.addLayer({
        'id': 'memory',
        'source': 'grid',
        'type': 'fill',
        'minzoom': 15,
        'paint': {
            'fill-color': 'purple',
            'fill-opacity': [
                'case',
                ['boolean', ['feature-state', 'hover'], false],
                0.5,
                0
            ]
        },
        'layout': {
            visibility: "none",
        }
    }, '3d-buildings');

    //=============Police=========================
    map.addLayer({
        'id': '3d-police',
        'source': 'buildings',
        'filter': ['==', 'type', 'police'],
        'type': 'fill-extrusion',
        'minzoom': 15,
        'paint': {
            'fill-extrusion-color': 'red',
            'fill-extrusion-height': 30,
            'fill-extrusion-base': 0,
            'fill-extrusion-opacity': 0.5
        },
        'layout': {
            visibility: "visible",
        }
    }, 'road-label');

    //==============Boundary========================
    map.addSource('chop-boundary', {
        'type': 'geojson',
        'data': 'assets/chop-boundary-polygon.geojson'
    });

    map.addLayer({
        'id': 'boundary',
        'type': 'fill-extrusion',
        'source': 'chop-boundary',
        'paint': {
            'fill-extrusion-color': '#0080ff',
            'fill-extrusion-height': 5,
            'fill-extrusion-base': 0,
            'fill-extrusion-opacity': 0.5
        },
        'layout': {
            visibility: "visible",
        }
    }, 'road-label');

    //==============Speech Area========================
    map.addSource('speech-area', {
        'type': 'geojson',
        'data': 'assets/speech_area.geojson'
    });

    map.addLayer({
        'id': 'speech',
        'type': 'fill-extrusion',
        'source': 'speech-area',
        'paint': {
            'fill-extrusion-color': ['get', 'color'],
            'fill-extrusion-height': 5,
            'fill-extrusion-base': 0,
            'fill-extrusion-opacity': 0.5
        },
        'layout': {
            visibility: "visible",
        }
    }, 'road-label');


    //==============graffito========================

    map.addSource('chop-graffito', {
        'type': 'geojson',
        'generateId': true,
        'data': 'assets/graffito.geojson'
    });


    //Add graffiti labels
    map.addLayer({
        'id': 'graffito-label',
        'type': 'symbol',
        'source': 'chop-graffito',
        'layout': {
            'text-field': ['get', 'Message'],

            'text-justify': 'auto',
            'text-anchor': 'top',
            'text-size': 14,
            'text-padding': 7,
            // 'text-line-height': 1.5,
            'text-offset': [0, 1],
            'visibility': 'none',
            'text-font': [
                'literal',
                ['DIN Pro Medium', 'Arial Unicode MS Regular']
            ],
            'icon-image': 'spray', // reference the image
            'icon-padding':7,
            // 'icon-offset':[0,-1],

            'icon-anchor': 'center',
            'icon-size': 1,
            // 'icon-text-fit-padding':10,
        },
        'paint': {
            'text-color': "white",
            'text-halo-color': "#0C090A",
            'text-halo-blur': 1,
            'text-halo-width': 2,


        }
    }, 'road-label');

    map.addLayer({
        'id': 'graffito',
        'type': 'fill',
        'source': 'chop-graffito',
        'layout': {
            'visibility': 'none'
        },
        'paint': {
            'fill-color': 'yellow',
            'fill-opacity': [
                'case',
                ['boolean', ['feature-state', 'hover'], false],
                0,
                0.5
            ]
        }
    }, '3d-buildings');


    map.addLayer({
        'id': 'graffito-outline',
        'type': 'line',
        'source': 'chop-graffito',
        'layout': {
            'visibility': 'none'
        },
        'paint': {
            'line-color': 'red',
            'line-opacity': 0.2,
            'line-width': [
                'case',
                ['boolean', ['feature-state', 'hover'], false],
                1,
                0
            ]
        }
    });


    hiddenLayers = ["transit-label", 'road-label', 'road-secondary-tertiary-case', 'road-street-case', 'road-street', 'road-primary-case', 'road-secondary-tertiary', 'road-minor-case']

    hiddenLayers.forEach((layer) => {
        map.setLayoutProperty(
            layer,
            'visibility',
            'none'
        );
    });


    $('#loader').fadeOut("slow");


});



const highlightedLayerIds = ["speech", 'boundary', '3d-police']

highlightedLayerIds.forEach((layerId) => {


    map.on('mouseenter', layerId, (e) => {
        map.getCanvas().style.cursor = 'pointer';
        e.preventDefault();
        let hoveredFeatures = map.queryRenderedFeatures(e.point);
        let topHoveredLayerIds = {};
        for (let i = 0; i < hoveredFeatures.length; i++) {
            highlightedLayerIds.forEach((highlightedLayerId) => {
                if (hoveredFeatures[i].layer.id == highlightedLayerId) {
                    topHoveredLayerIds[highlightedLayerId] = Object.keys(topHoveredLayerIds).length;
                }
            });
        }

        if (topHoveredLayerIds[layerId] == 0) {
            map.setPaintProperty(layerId, 'fill-extrusion-color', '#8cff32');
            map.setPaintProperty(layerId, 'fill-extrusion-opacity', 0.8);

        }

    });
    // // Change it back to a pointer when it leaves.
    map.on('mouseleave', layerId, (e) => {
        map.getCanvas().style.cursor = 'pointer';
        e.preventDefault();
        map.setPaintProperty(layerId, 'fill-extrusion-opacity', 0.5);
        popup.remove();

        if (layerId == "speech") {
            map.setPaintProperty(layerId, 'fill-extrusion-color', ['get', 'color']);
        } else if (layerId == "boundary") {
            map.setPaintProperty(layerId, 'fill-extrusion-color', '#0080ff');

        } else if (layerId == "3d-police") {
            map.setPaintProperty(layerId, 'fill-extrusion-color', 'red');

        }

    });


    map.on('click', layerId, (e) => {

        map.getCanvas().style.cursor = 'pointer';
        e.preventDefault();
        let hoveredFeatures = map.queryRenderedFeatures(e.point);
        let topHoveredLayerIds = {};
        for (let i = 0; i < hoveredFeatures.length; i++) {
            highlightedLayerIds.forEach((highlightedLayerId) => {
                if (hoveredFeatures[i].layer.id == highlightedLayerId) {
                    topHoveredLayerIds[highlightedLayerId] = Object.keys(topHoveredLayerIds).length;
                }
            });
        }

        if (topHoveredLayerIds[layerId] == 0) {
            map.setPaintProperty(layerId, 'fill-extrusion-color', '#8cff32');
            map.setPaintProperty(layerId, 'fill-extrusion-opacity', 0.8);


            let description = "";

            if (layerId == "speech") {
                description = "Speech Area";
            } else if (layerId == "boundary") {
                description = "CHOP Boundary";
            } else if (layerId == "3d-police") {
                description = "Seattle's city department of Police";
            }

            popup.setLngLat(e.lngLat).setHTML(description).addTo(map);
        }

    });


});


//======================= Graffito ==========================
// Change the cursor to a pointer when the mouse is over the places layer.
map.on('mousemove', 'graffito', (e) => {
    map.getCanvas().style.cursor = 'pointer';
    if (e.features.length > 0) {
        if (hoveredStateId !== null) {
            map.setFeatureState({
                source: 'chop-graffito',
                id: hoveredStateId
            }, {
                hover: false
            });
        }
        hoveredStateId = e.features[0].id
        map.setFeatureState({
            source: 'chop-graffito',
            id: hoveredStateId
        }, {
            hover: true
        });
    }
});
// Change it back to a pointer when it leaves.
map.on('mouseleave', 'graffito', () => {
    map.getCanvas().style.cursor = '';
    if (hoveredStateId !== null) {
        map.setFeatureState({
            source: 'chop-graffito',
            id: hoveredStateId
        }, {
            hover: false
        });
    }
    hoveredStateId = null;
});



// When click on Graffiti, it will display the information of the graffiti
map.on("click", "graffito", (e) => {

    map.getCanvas().style.cursor = 'pointer';
    if (e.features.length > 0) {
        if (hoveredStateId !== null) {
            map.setFeatureState({
                source: 'chop-graffito',
                id: hoveredStateId
            }, {
                hover: false
            });
        }
        hoveredStateId = e.features[0].id
        map.setFeatureState({
            source: 'chop-graffito',
            id: hoveredStateId
        }, {
            hover: true
        });
        new mapboxgl.Popup().setLngLat(e.lngLat).setHTML(`${e.features[0].properties.Message}`).addTo(map);
    }


});


//======================= Memory ==========================
map.on('mousemove', 'memory', (e) => {
    map.getCanvas().style.cursor = 'pointer';
    if (e.features.length > 0) {
        if (hoveredStateId !== null) {
            map.setFeatureState({
                source: 'grid',
                id: hoveredStateId
            }, {
                hover: false
            });
        }
        hoveredStateId = e.features[0].id
        map.setFeatureState({
            source: 'grid',
            id: hoveredStateId
        }, {
            hover: true
        });
    }
});

// When the mouse leaves the state-fill layer, update the feature state of the
// previously hovered feature.
map.on('mouseleave', 'memory', () => {
    map.getCanvas().style.cursor = '';
    if (hoveredStateId !== null) {
        map.setFeatureState({
            source: 'grid',
            id: hoveredStateId
        }, {
            hover: false
        });
    }
    hoveredStateId = null;
});


map.on('click', 'memory', (e) => {
    map.getCanvas().style.cursor = 'pointer';
    if (e.features.length > 0) {
        if (hoveredStateId !== null) {
            map.setFeatureState({
                source: 'grid',
                id: hoveredStateId
            }, {
                hover: false
            });
        }
        hoveredStateId = e.features[0].id
        map.setFeatureState({
            source: 'grid',
            id: hoveredStateId
        }, {
            hover: true
        });
        document.getElementById("featureInfo").innerHTML = "Hexagon ID: " + e.features[0].properties.id;
    }
});








// Enumerate ids of the layers.
const toggleableLayerIds = ['aerial', 'graffito', 'boundary', 'speech', 'memory', '3d-police'];
// Set up the corresponding toggle button for each layer.
for (const id of toggleableLayerIds) {

    // Show or hide layer when the toggle is clicked.
    document.getElementById(id).addEventListener("change", function (e) {
        const clickedLayer = id;
        e.preventDefault();
        e.stopPropagation();
        const visibility = map.getLayoutProperty(clickedLayer, 'visibility');
        if (visibility === 'visible') {
            map.setLayoutProperty(clickedLayer, 'visibility', 'none');
            if (id == "graffito") {

                map.setLayoutProperty("graffito-outline", 'visibility', 'none');
                map.setLayoutProperty("graffito-label", 'visibility', 'none');
            }

        } else {
            map.setLayoutProperty(clickedLayer, 'visibility', 'visible');
            if (id == "graffito") {
                map.setLayoutProperty("graffito-outline", 'visibility', 'visible');
                map.setLayoutProperty("graffito-label", 'visibility', 'visible');
            }
        }
    });

    document.getElementById(id).addEventListener("mouseenter", function (e) {
        document.body.style.cursor = 'pointer';
    });

    document.getElementById(id).addEventListener("mouseleave", function (e) {
        document.body.style.cursor = '';
    });

}