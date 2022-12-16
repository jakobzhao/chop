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
        'data': 'assets/graffito.geojson'
    });


    //Add graffiti labels
    map.addLayer({
        'id': 'graffito-label',
        'type': 'symbol',
        'source': 'chop-graffito',
        'layout': {
            'text-field': ['get', 'Message'],
            'text-variable-anchor': ['left'],
            // 'text-radial-offset': 0.5,
            'text-justify': 'right',
            'text-writing-mode': ['vertical'],
        },
        'paint': {
            'text-color': "#444",
            'text-halo-color': "#fff",
            'text-halo-width': 2
        },
        'layout': {
            visibility: "visible",
        }
    }, 'road-label');

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



    hiddenLayers = ["transit-label", 'road-label', 'road-secondary-tertiary-case', 'road-street-case', 'road-street', 'road-primary-case', 'road-secondary-tertiary', 'road-minor-case']

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
    // map.on('click', 'CHOP Zone', (e) => {
    //     new mapboxgl.Popup().setLngLat(e.lngLat).setHTML(e.features[0].properties.name).setHTML(`
    //                                   <button class="open-button" onclick="openForm()">Comment</button>`).addTo(map);
    // });



    // When click on Graffiti, it will display the information of the graffiti
    map.on("click", "graffito", (event) => {
        new mapboxgl.Popup().setLngLat(event.lngLat).setHTML(`
                                      <strong>Message:</strong> ${event.features[0].properties.Message}
                                      <hr>
                                      <strong>Color of Graffiti:</strong> ${event.features[0].properties.Color}`).addTo(map);
    });



    $('#loader').fadeOut("slow");


    map.addSource('selected', {
        type: 'geojson',
        data: {
            "type": "FeatureCollection",
            "features": []
        }
    });

    map.addLayer({
        "id": "highlight",
        'type': 'fill-extrusion',
        'source': 'selected',
        'layout': {
            'visibility': 'none'
        },
        'paint': {
            'fill-extrusion-color': '#8cff32',
            'fill-extrusion-height': 30,
            'fill-extrusion-base': 0,
            'fill-extrusion-opacity': 0.8
        }
    }, 'road-label');


});





// Change the cursor to a pointer when the mouse is over the places layer.
map.on('mouseenter', 'graffito', () => {
    map.getCanvas().style.cursor = 'pointer';
});
// Change it back to a pointer when it leaves.
map.on('mouseleave', 'graffito', () => {
    map.getCanvas().style.cursor = '';
});






// Speech Area
map.on('mouseenter', 'speech', (e) => {
    map.getCanvas().style.cursor = 'pointer';
    e.preventDefault();
    let hoveredFeatures = map.queryRenderedFeatures(e.point);
    let topHoveredLayerId = hoveredFeatures[hoveredFeatures.length - 1].layer.id;
    if (topHoveredLayerId == 'speech') {
    map.setPaintProperty('speech', 'fill-extrusion-color', '#8cff32');
    map.setPaintProperty('speech', 'fill-extrusion-opacity', 0.8);
    }
});
// Change it back to a pointer when it leaves.
map.on('mouseleave', 'speech', (e) => {
    map.getCanvas().style.cursor = 'pointer';
    e.preventDefault();
    // let hoveredFeatures = map.queryRenderedFeatures(e.point);
    // let topHoveredLayerId = hoveredFeatures[hoveredFeatures.length - 1].layer.id;
    // if (topHoveredLayerId == 'speech') {
    map.setPaintProperty('speech', 'fill-extrusion-color', ['get', 'color']);
    map.setPaintProperty('speech', 'fill-extrusion-opacity', 0.5);
    popup.remove();
    // }
});


map.on('click', 'speech', (e) => {
    map.getCanvas().style.cursor = 'pointer';
    e.preventDefault();
    let hoveredFeatures = map.queryRenderedFeatures(e.point);
    let topHoveredLayerId = hoveredFeatures[hoveredFeatures.length - 1].layer.id;
    if (topHoveredLayerId == 'speech') {
        map.setPaintProperty('speech', 'fill-extrusion-color', '#8cff32');
    map.setPaintProperty('speech', 'fill-extrusion-opacity', 0.8);
    let description = "Speech Area";
    popup.setLngLat(e.lngLat).setHTML(description).addTo(map);
    }
});


// Boundary
map.on('mouseenter', 'boundary', (e) => {
    map.getCanvas().style.cursor = 'pointer';
    e.preventDefault();
    // let hoveredFeatures = map.queryRenderedFeatures(e.point);
    // let topHoveredLayerId = hoveredFeatures[hoveredFeatures.length - 1].layer.id;
    // if (topHoveredLayerId == 'boundary') {
    map.setPaintProperty('boundary', 'fill-extrusion-color', '#8cff32');
    map.setPaintProperty('boundary', 'fill-extrusion-opacity', 0.8);
    // }
});
// Change it back to a pointer when it leaves.
map.on('mouseleave', 'boundary', (e) => {
    map.getCanvas().style.cursor = 'pointer';
    e.preventDefault();
    // let hoveredFeatures = map.queryRenderedFeatures(e.point);
    // let topHoveredLayerId = hoveredFeatures[hoveredFeatures.length - 1].layer.id;
    // if (topHoveredLayerId == 'boundary') {
    map.setPaintProperty('boundary', 'fill-extrusion-color', '#0080ff');
    map.setPaintProperty('boundary', 'fill-extrusion-opacity', 0.5);
    popup.remove();
    // }
});


map.on('click', 'boundary', (e) => {
    map.getCanvas().style.cursor = 'pointer';
    e.preventDefault();
    let hoveredFeatures = map.queryRenderedFeatures(e.point);
    let topHoveredLayerId = hoveredFeatures[hoveredFeatures.length - 1].layer.id;
    if (topHoveredLayerId == 'boundary') {
        map.setPaintProperty('boundary', 'fill-extrusion-color', '#8cff32');
    map.setPaintProperty('boundary', 'fill-extrusion-opacity', 0.8);
    let description = "The Boundary of CHOP";
    popup.setLngLat(e.lngLat).setHTML(description).addTo(map);
    }
});


// Police Dept.

map.on('mouseenter', '3d-police', (e) => {
    map.getCanvas().style.cursor = 'pointer';
    e.preventDefault();
    let hoveredFeatures = map.queryRenderedFeatures(e.point);
    let topHoveredLayerId = hoveredFeatures[hoveredFeatures.length - 1].layer.id;
    if (topHoveredLayerId == '3d-police') {
        map.setPaintProperty('3d-police', 'fill-extrusion-color', '#8cff32');
        map.setPaintProperty('3d-police', 'fill-extrusion-opacity', 0.8);
    }
});
// Change it back to a pointer when it leaves.
map.on('mouseleave', '3d-police', (e) => {

    map.getCanvas().style.cursor = 'pointer';
    e.preventDefault();
    // let hoveredFeatures = map.queryRenderedFeatures(e.point);
    // let topHoveredLayerId = hoveredFeatures[hoveredFeatures.length - 1].layer.id;
    // if (topHoveredLayerId == '3d-police') {
    map.setPaintProperty('3d-police', 'fill-extrusion-color', 'red');
    map.setPaintProperty('3d-police', 'fill-extrusion-opacity', 0.5);
    popup.remove();
    // }
});
map.on('click', '3d-police', (e) => {
    map.getCanvas().style.cursor = 'pointer';
    e.preventDefault();
    let hoveredFeatures = map.queryRenderedFeatures(e.point);
    let topHoveredLayerId = hoveredFeatures[hoveredFeatures.length - 1].layer.id;
    if (topHoveredLayerId == '3d-police') {
        map.setPaintProperty('3d-police', 'fill-extrusion-color', '#8cff32');
        map.setPaintProperty('3d-police', 'fill-extrusion-opacity', 0.8);
    let description = "Seattle City's Department of Police";
    popup.setLngLat(e.lngLat).setHTML(description).addTo(map);
    }
});



// Enumerate ids of the layers.
const toggleableLayerIds = ['aerial', 'graffito', 'boundary', 'speech', '3d-police'];
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
        } else {
            map.setLayoutProperty(clickedLayer, 'visibility', 'visible');
        }
    });

    document.getElementById(id).addEventListener("mouseenter", function (e) {
        document.body.style.cursor = 'pointer';
    });

    document.getElementById(id).addEventListener("mouseleave", function (e) {
        document.body.style.cursor = '';
    });

}