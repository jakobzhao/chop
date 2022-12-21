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
    maxZoom: 21,
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
let hoveredStateId2 = null;
let hid = null;


const policeColor = getComputedStyle(document.querySelector('.police')).backgroundColor;
const speechColor = getComputedStyle(document.querySelector('.speech')).backgroundColor;
const boundaryColor = getComputedStyle(document.querySelector('.boundary')).backgroundColor;
const memoryColor = getComputedStyle(document.querySelector('.memory')).backgroundColor;
const graffitoColor = getComputedStyle(document.querySelector('.graffito')).backgroundColor;
const highlightColor = '#8cff32';
const bldgColor = '#aaa';
const origOpacity = 0.5;
const hoverOpacity = 0.7;



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


// Load geospatial datasets and display
map.on('load', () => {

    //download a spray icon from fa 6, and edit it at https://editor.method.ac/
    map.loadImage('https://jakobzhao.github.io/chop/img/spray-can-yl2.png', (error, image) => {
        if (error) throw error;
        if (!map.hasImage('spray')) map.addImage('spray', image);
    });

    //==============drone photo========================
    map.addSource('drone-tile', {
        'type': 'raster',
        // 'tiles': ['assets/drone_img/{z}/{x}/{y}.png'],
        'tiles': ['https://hgis.uw.edu/chop_drone_imgs/{z}/{x}/{y}.png'],
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
            'fill-extrusion-color': bldgColor,
            'fill-extrusion-height': ['get', 'eheight'],
            'fill-extrusion-base': 0,
            'fill-extrusion-opacity': 0.8
        }
    }, 'road-label');

    //=============Memory=========================
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
            'fill-color': memoryColor,
            'fill-opacity': [
                'case',
                ['boolean', ['feature-state', 'hover'], false],
                0.7,
                0
            ]
        },
        'layout': {
            visibility: "visible",
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
            'fill-extrusion-color': policeColor,
            'fill-extrusion-height': 30,
            'fill-extrusion-base': 0,
            'fill-extrusion-opacity': origOpacity
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
            'fill-extrusion-color': boundaryColor,
            'fill-extrusion-height': 5,
            'fill-extrusion-base': 0,
            'fill-extrusion-opacity':origOpacity
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
            'fill-extrusion-color': speechColor,
            'fill-extrusion-height': 5,
            'fill-extrusion-base': 0,
            'fill-extrusion-opacity': origOpacity
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
            'text-color': "#FFFFC6",
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
            'fill-color': graffitoColor,
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
            'line-opacity': 0.5,
            'line-width': [
                'case',
                ['boolean', ['feature-state', 'hover'], false],
                1.5,
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
            map.setPaintProperty(layerId, 'fill-extrusion-color', highlightColor);
            map.setPaintProperty(layerId, 'fill-extrusion-opacity', hoverOpacity);

        }

    });
    // // Change it back to a pointer when it leaves.
    map.on('mouseleave', layerId, (e) => {
        map.getCanvas().style.cursor = 'pointer';
        e.preventDefault();
        map.setPaintProperty(layerId, 'fill-extrusion-opacity', origOpacity);
        popup.remove();

        if (layerId == "speech") {
            map.setPaintProperty(layerId, 'fill-extrusion-color', speechColor);
        } else if (layerId == "boundary") {
            map.setPaintProperty(layerId, 'fill-extrusion-color', boundaryColor);

        } else if (layerId == "3d-police") {
            map.setPaintProperty(layerId, 'fill-extrusion-color', policeColor);

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
            map.setPaintProperty(layerId, 'fill-extrusion-color', highlightColor);
            map.setPaintProperty(layerId, 'fill-extrusion-opacity', hoverOpacity);


            let description = "";

            if (layerId == "speech") {
                description = "Speech Area";
            } else if (layerId == "boundary") {
                description = "CHOP Boundary";
            } else if (layerId == "3d-police") {
                description = "Seattle's City Department of Police";
            }

            popup.setLngLat(e.lngLat).setHTML("<div class='desc'>" + description +"</div>").addTo(map);
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
        let message = e.features[0].properties.Message;
        if (message == undefined) {
            message = "This graffito is unclear. Further investigation is needed."
        }
        new mapboxgl.Popup().setLngLat(e.lngLat).setHTML(`<div class='desc'>${message}</div>`).addTo(map);
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

            if (id == "memory") {

                document.getElementById("memory-list").classList.add("d-none");
                document.getElementById("memory-panel").classList.add("d-none");
                document.getElementById('memory-list-container').innerHTML = "";
                document.getElementById('contributor').value = "";
                document.getElementById('memory-content').value = "";
                map.setFeatureState({
                    source: 'grid',
                    id: hoveredStateId2
                }, {
                    hover: false
                });

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