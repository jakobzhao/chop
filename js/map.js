// MapLibre GL — basemap is ESRI World Imagery (raster), no API key required.
// Attribution is provided manually in the page footer.
const basemapStyle = {
    version: 8,
    glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
    sources: {
        'esri-imagery': {
            type: 'raster',
            tiles: [
                'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
            ],
            tileSize: 256,
            maxzoom: 19,
            attribution: 'Imagery © Esri, Maxar, Earthstar Geographics, and the GIS User Community'
        }
    },
    layers: [
        {
            id: 'esri-imagery',
            type: 'raster',
            source: 'esri-imagery'
        }
    ]
};

const initialBounds = [-122.320894, 47.61310, -122.31558990189957, 47.61875];
const tourCenter = [-122.31824, 47.61596];
const tourZoom = 17.25;
const tourPitch = 63;
const tourDuration = 32000;
const buildingHeightScale = 2.25;
const policeHeight = 22;

let map = new maplibregl.Map({
    container: 'map', // container ID
    style: basemapStyle,
    bounds: initialBounds,
    maxBounds: [-123.9180845532934, 47.04828654073975, -121.14008445949332, 48.71935997846136],
    minZoom: 12,
    maxZoom: 21,
    pitch: 20,
    antialias: true,
    attributionControl: false,
});
window.chopMap = map;

// Create a popup, but don't add it to the map yet.
const popup = new maplibregl.Popup({
    closeButton: false,
    closeOnClick: false
});

let hoveredStateId = null;
let hoveredStateId2 = null;
let hid = null;
let tourAnimationFrame = null;
let tourStartedAt = null;
let tourStartBearing = 0;
let tourIsRunning = false;


const policeColor = '#260808';   // darker oxblood for the police precinct footprint
// const speechColor = getComputedStyle(document.querySelector('.speech')).backgroundColor;
// const boundaryColor = getComputedStyle(document.querySelector('.boundary')).backgroundColor;
const memoryColor = getComputedStyle(document.querySelector('.memory')).backgroundColor;
const graffitoColor = getComputedStyle(document.querySelector('.graffito')).backgroundColor;
const highlightColor = '#d4a017';   // gold — hover; pops against red, charcoal, and gray bases
const bldgColor = getComputedStyle(document.querySelector('.bldgs')).backgroundColor;
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
    stopTour();
    map.fitBounds(initialBounds, {
        pitch: 20,
    });
});

const tourButton = document.getElementById('map-tour');
if (tourButton) {
    tourButton.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (tourIsRunning) {
            stopTour();
        } else {
            startTour();
        }
    });
}


map.addControl(new maplibregl.NavigationControl({
    showCompass: true
    // visualizePitch: true
}));


// Load geospatial datasets and display
map.on('load', () => {

    //download a spray icon from fa 6, and edit it at https://editor.method.ac/
    map.loadImage('img/spray-can-yl2.png', (error, image) => {
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
    });

    //==============word cloud========================
    map.addSource('words', {
        type: 'geojson',
        data: 'assets/word_data.geojson'
    });
    
    map.addLayer({
        id: 'word-cloud',
        type: 'symbol',
        source: 'words',
        layout: {
            'text-field': ['get', 'word'],
            'text-font': ['literal', ['Noto Sans Bold']],
            // Size scales with both zoom and word frequency.
            // At each zoom step the inner expression maps frequency 0→1 to a
            // pixel range; the outer expression interpolates between zooms.
            'text-size': [
                'interpolate', ['linear'], ['zoom'],
                13, ['interpolate', ['linear'], ['get', 'frequency'], 0, 7,  1, 18],
                16, ['interpolate', ['linear'], ['get', 'frequency'], 0, 10, 1, 32],
                18, ['interpolate', ['linear'], ['get', 'frequency'], 0, 14, 1, 48],
                20, ['interpolate', ['linear'], ['get', 'frequency'], 0, 20, 1, 68],
                22, ['interpolate', ['linear'], ['get', 'frequency'], 0, 30, 1, 94]
            ],
            // Collision detection: drop words that would overlap. Higher-
            // frequency words win the priority contest (lowest sort-key wins).
            'text-allow-overlap': false,
            'text-ignore-placement': false,
            'symbol-sort-key': ['*', -1, ['get', 'frequency']],
            'text-padding': 3,
            'text-letter-spacing': 0.02,
            'visibility': 'none'
        },
        paint: {
            'text-color': '#ffe06a',
            'text-halo-color': 'rgba(0, 0, 0, 0.82)',
            'text-halo-width': 1.25,
            'text-halo-blur': 0.5
        }
    });
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
    map.addSource('buildings-source', {
        'type': 'geojson',
        'generateId': true,
        'data': 'assets/buildings.geojson'
    });
    map.addLayer({
        'id': 'bldgs',
        'source': 'buildings-source',
        'filter': ['!=', 'type', 'police'],
        'type': 'fill-extrusion',
        'minzoom': 15,
        'paint': {
            'fill-extrusion-color': [
                'case',
                ['boolean', ['feature-state', 'hover'], false],
                highlightColor,
                bldgColor
            ],
            'fill-extrusion-height': ['*', ['get', 'eheight'], buildingHeightScale],
            'fill-extrusion-base': 0,
            'fill-extrusion-opacity': 0.8
        },
        'layout': {
            visibility: "visible",
        }
    });


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
    });

    // =============Highlighted Memories (3D, height ∝ comment count) =========
    getHighlights().then(async highlights => {
        const countByHid = new Map();
        highlights.forEach(h => {
            const hid = parseInt(h.hid, 10);
            const count = parseInt(h.count, 10);
            if (!Number.isNaN(hid) && !Number.isNaN(count)) {
                countByHid.set(hid, count);
            }
        });
        const heightPerComment = 18;   // metres per comment

        const gridResp = await fetch('assets/grid.geojson');
        const gridData = await gridResp.json();
        const highlightedMemoryData = {
            type: 'FeatureCollection',
            features: gridData.features
                .filter(feature => countByHid.has(feature.properties.id))
                .map(feature => ({
                    ...feature,
                    properties: {
                        ...feature.properties,
                        comment_count: countByHid.get(feature.properties.id)
                    }
                }))
        };

        if (!map.getSource('highlighted-memory-source')) {
            map.addSource('highlighted-memory-source', {
                type: 'geojson',
                generateId: true,
                data: highlightedMemoryData
            });
        } else {
            map.getSource('highlighted-memory-source').setData(highlightedMemoryData);
        }

        if (highlightedMemoryData.features.length === 0) {
            applyInitialToggleState();
            return;
        }

        const heightExpr = [
            '*',
            ['coalesce', ['get', 'comment_count'], 0],
            heightPerComment
        ];

        map.addLayer({
            'id': 'highlighted-memories',
            'source': 'highlighted-memory-source',
            'type': 'fill-extrusion',
            'minzoom': 14,
            'paint': {
                'fill-extrusion-color': [
                    'case',
                    ['boolean', ['feature-state', 'hover'], false],
                    highlightColor,        // gold when hovered
                    memoryColor             // red default
                ],
                'fill-extrusion-height': heightExpr,
                'fill-extrusion-base': 0,
                'fill-extrusion-opacity': 0.75
            }
        });

        // Hover state for memory hex pillars
        let hoveredMemoryId = null;

        map.on('mousemove', 'highlighted-memories', (e) => {
            if (!e.features || e.features.length === 0) return;
            map.getCanvas().style.cursor = 'pointer';

            // memory hex takes priority over buildings/police — release any building hover
            Object.keys(hoveredBuildingIds).forEach(clearBuildingHover);

            const newId = e.features[0].id;
            if (hoveredMemoryId === newId) return;

            if (hoveredMemoryId !== null) {
                map.setFeatureState({ source: 'highlighted-memory-source', id: hoveredMemoryId }, { hover: false });
            }
            hoveredMemoryId = newId;
            map.setFeatureState({ source: 'highlighted-memory-source', id: newId }, { hover: true });
        });

        map.on('mouseleave', 'highlighted-memories', () => {
            map.getCanvas().style.cursor = '';
            if (hoveredMemoryId !== null) {
                map.setFeatureState({ source: 'highlighted-memory-source', id: hoveredMemoryId }, { hover: false });
                hoveredMemoryId = null;
            }
        });

        // Push every text/symbol layer above the new 3D pillars so labels are
        // never occluded by buildings, the police precinct, or memory bars.
        liftLabelsToTop();

        // Sync the new highlighted-memories visibility to the Comments toggle.
        applyInitialToggleState();
    }).catch(error => {
        console.error("Error loading highlights:", error);
    });
    /*
    var colorScale = chroma.scale(['blue', 'red']).mode('lch');
    var minDate = new Date(Math.min(...highlights.map(highlight => {
        var date = new Date(highlight.max);
        if (isNaN(date)) {
          console.error("Failed to parse date: " + highlight.max);
        }
        return date;
      })));
      
      var maxDate = new Date(Math.max(...highlights.map(highlight => {
        var date = new Date(highlight.max);
        if (isNaN(date)) {
          console.error("Failed to parse date: " + highlight.max);
        }
        return date;
      })));
      
      var range = maxDate - minDate;
      
      console.log("Min date: " + minDate);
      console.log("Max date: " + maxDate);
      console.log("Range: " + range);
      
      highlights.forEach((highlight) => {
            var date = new Date(highlight.max);
            var normalizedTime = (date - minDate) / range;
            var color = colorScale(normalizedTime).hex();
      
            if (isNaN(normalizedTime)) {
                console.error("Normalized time is NaN for date: " + highlight.max);
            }
            map.addLayer({
                'id': 'highlight-' + highlight.hid,
                'source': 'grid',
                'type': 'fill',
                'paint': {
                    'fill-color': color,
                    'fill-opacity': 0.5
                },
                'filter': ['in', 'id', highlight.hid]
            });
        });
    }).catch(error => {
        console.error("Error loading highlights:", error);
    });
    /*
    var minCount = Math.min(...highlights.map(highlight => Number(highlight.count)));
    var maxCount = Math.max(...highlights.map(highlight => Number(highlight.count)));
    var range = maxCount - minCount;

    var colorScale = chroma.scale(['blue', 'red']).mode('lch');

    highlights.forEach((highlight) => {
        var count = Number(highlight.count);
        var normalizedCount = (count - minCount) / range;
        var color = colorScale(normalizedCount).hex();

        map.addLayer({
            'id': 'highlight-' + highlight.hid,
            'source': 'grid',
            'type': 'fill',
            'paint': {
                'fill-color': color,
                'fill-opacity': 0.5
            },
            'filter': ['in', 'id', highlight.hid]
        });
    });
    }).catch(error => {
        console.error("Error loading highlights:", error);
    }); */
    //=============Police=========================
    map.addLayer({
        'id': '3d-police',
        'source': 'buildings-source',
        'filter': ['==', 'type', 'police'],
        'type': 'fill-extrusion',
        'minzoom': 15,
        'paint': {
            'fill-extrusion-color': [
                'case',
                ['boolean', ['feature-state', 'hover'], false],
                highlightColor,
                policeColor
            ],
            'fill-extrusion-height': policeHeight,
            'fill-extrusion-base': 0,
            'fill-extrusion-opacity': 0.86
        },
        'layout': {
            visibility: "visible",
        }
    });

    //==============Boundary========================
    //map.addSource('chop-boundary', {
    //    'type': 'geojson',
    //    'data': 'assets/chop-boundary-polygon.geojson'
    //});

    //map.addLayer({
    //    'id': 'boundary',
    //    'type': 'fill-extrusion',
    //    'source': 'chop-boundary',
    //    'paint': {
    //        'fill-extrusion-color': boundaryColor,
    //        'fill-extrusion-height': 5,
    //        'fill-extrusion-base': 0,
    //        'fill-extrusion-opacity':origOpacity
    //    },
    //    'layout': {
    //        visibility: "none",
    //    }
    //});

    //==============Speech Area========================
    // map.addSource('speech-area', {
    //     'type': 'geojson',
    //     'data': 'assets/speech_area.geojson'
    // });

    // map.addLayer({
    //     'id': 'speech',
    //     'type': 'fill-extrusion',
    //     'source': 'speech-area',
    //     'paint': {
    //         'fill-extrusion-color': speechColor,
    //         'fill-extrusion-height': 5,
    //         'fill-extrusion-base': 0,
    //         'fill-extrusion-opacity': origOpacity
    //     },
    //     'layout': {
    //         visibility: "visible",
    //     }
    // });

    // poi-label was a Mapbox vector style layer — not present on the ESRI raster basemap.

    //==============graffito========================

    map.addSource('chop-graffito', {
        'type': 'geojson',
        'generateId': true,
        'data': 'assets/graffiti.geojson'
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
            'visibility': 'visible',
            'text-font': [
                'literal',
                ['Noto Sans Regular']
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
    });

    map.addLayer({
        'id': 'graffito',
        'type': 'fill',
        'source': 'chop-graffito',
        'layout': {
            'visibility': 'visible'
        },
        'paint': {
            'fill-color': graffitoColor,
            'fill-opacity': [
                'case',
                ['boolean', ['feature-state', 'hover'], false],
                0,
                0.1
            ]
        }
    }, 'bldgs');
   
  
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


    // ============= POI labels (Locations toggle) =========================
    map.addSource('poi', {
        type: 'geojson',
        data: 'assets/poi.geojson'
    });
    map.addLayer({
        id: 'poi-label',
        type: 'symbol',
        source: 'poi',
        layout: {
            'text-field': ['get', 'name'],
            'text-font': ['literal', ['Noto Sans Regular']],
            'text-size': 12,
            'text-anchor': 'top',
            'text-offset': [0, 0.4],
            'text-padding': 4,
            'text-allow-overlap': false,
            'visibility': 'visible'
        },
        paint: {
            'text-color': '#e3eaf0',
            'text-halo-color': 'rgba(0, 0, 0, 0.85)',
            'text-halo-width': 1.5,
            'text-halo-blur': 0.5
        }
    });

    // Mapbox vector-style label/road layers were hidden here. ESRI raster
    // basemap has none of those layers, so nothing to hide.



    $("#nextTimeSwitcher input").on("click", function () {
        if ($("#nextTimeSwitcher input:checked").val() === "on") {
            localStorage.setItem('popState', 'shown');
        } else {
            localStorage.setItem('popState', 'notShown');
        }
    })

    if (localStorage.getItem('popState') != 'shown') {
      
        $('#welcome').modal('show');

    } else {
   
        $('#welcome').modal('hide');
    }


    $('#loader').fadeOut("slow");

    // All synchronously-added layers exist at this point. Push labels above
    // the 3D extrusions, then sync each layer's visibility to its checkbox.
    liftLabelsToTop();
    applyInitialToggleState();
});

const highlightedLayerIds = ["bldgs", '3d-police'];

// Track currently hovered feature id per layer so we can clear it on mouseleave/move
const hoveredBuildingIds = {};

function clearBuildingHover(layerId) {
    if (hoveredBuildingIds[layerId] != null) {
        map.setFeatureState(
            { source: 'buildings-source', id: hoveredBuildingIds[layerId] },
            { hover: false }
        );
        hoveredBuildingIds[layerId] = null;
    }
}

function setTourButtonState(isRunning) {
    if (!tourButton) return;
    tourButton.classList.toggle('active', isRunning);
    tourButton.setAttribute('aria-pressed', isRunning ? 'true' : 'false');
    tourButton.querySelector('.tour-label').textContent = isRunning ? 'Stop tour' : 'Tour';
}

function startTour() {
    if (tourIsRunning) return;
    tourIsRunning = true;
    tourStartedAt = null;
    tourStartBearing = map.getBearing();
    setTourButtonState(true);

    map.easeTo({
        center: tourCenter,
        zoom: tourZoom,
        pitch: tourPitch,
        bearing: tourStartBearing,
        duration: 1600,
        easing: t => t
    });

    const animateTour = (timestamp) => {
        if (tourStartedAt === null) tourStartedAt = timestamp;
        const progress = (timestamp - tourStartedAt) / tourDuration;
        const bearing = tourStartBearing + (progress * 360);

        map.jumpTo({
            center: tourCenter,
            zoom: tourZoom,
            pitch: tourPitch,
            bearing
        });

        tourAnimationFrame = requestAnimationFrame(animateTour);
    };

    setTimeout(() => {
        if (tourAnimationFrame === null && tourIsRunning) {
            tourAnimationFrame = requestAnimationFrame(animateTour);
        }
    }, 1650);
}

function stopTour() {
    if (tourAnimationFrame) {
        cancelAnimationFrame(tourAnimationFrame);
    }
    tourAnimationFrame = null;
    tourStartedAt = null;
    tourIsRunning = false;
    setTourButtonState(false);
    map.easeTo({
        pitch: 35,
        duration: 800
    });
}

highlightedLayerIds.forEach((layerId) => {

    map.on('mousemove', layerId, (e) => {
        if (!e.features || e.features.length === 0) return;

        // Memory hex pillars take priority — bail (and release any current
        // building hover) if a memory hex is also rendered at this point.
        if (map.getLayer('highlighted-memories')) {
            const memFeatures = map.queryRenderedFeatures(e.point, {
                layers: ['highlighted-memories']
            });
            if (memFeatures.length > 0) {
                clearBuildingHover(layerId);
                return;
            }
        }

        map.getCanvas().style.cursor = 'pointer';

        const newId = e.features[0].id;
        if (hoveredBuildingIds[layerId] === newId) return;

        clearBuildingHover(layerId);
        hoveredBuildingIds[layerId] = newId;
        map.setFeatureState(
            { source: 'buildings-source', id: newId },
            { hover: true }
        );
    });

    map.on('mouseleave', layerId, () => {
        map.getCanvas().style.cursor = '';
        clearBuildingHover(layerId);
        popup.remove();
    });

    map.on('click', layerId, (e) => {
        if (!e.features || e.features.length === 0) return;

        if (layerId === '3d-police') {
            const popupDiv = document.createElement('div');
            popupDiv.className = 'desc';
            popupDiv.textContent = "Seattle's City Department of Police";
            popup.setLngLat(e.lngLat).setDOMContent(popupDiv).addTo(map);
        }
    });

});


//======================= Graffito ==========================
// Change the cursor to a pointer when the mouse is over the places layer.
/* map.on('mousemove', 'graffito', (e) => {
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
        const graffitoDiv = document.createElement('div');
        graffitoDiv.className = 'desc';
        graffitoDiv.textContent = message;
        new maplibregl.Popup().setLngLat(e.lngLat).setDOMContent(graffitoDiv).addTo(map);
    }


}); */



// Layer toggles — each checkbox controls its own layer (and any sibling layers
// that move together: graffito ↔ outline+label, memory ↔ highlighted-memories,
// bldgs ↔ 3d-police).

// Push every text/icon (symbol) layer to the top of the render stack so labels
// and graffiti spray icons are never occluded by 3D buildings, the police
// precinct, or memory pillars. moveLayer() with no `before` argument moves the
// layer to the very end of the order (= drawn last = on top).
function liftLabelsToTop() {
    ['graffito-label', 'poi-label', 'word-cloud'].forEach(id => {
        if (map.getLayer(id)) map.moveLayer(id);
    });
}

const toggleableLayerIds = ['aerial', 'bldgs', 'poi-label', 'memory', 'graffito', 'word-cloud'];

for (const id of toggleableLayerIds) {
    const el = document.getElementById(id);
    if (!el) continue;

    el.addEventListener('change', () => {
        const vis = el.checked ? 'visible' : 'none';
        if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', vis);

        // Sibling layers that move with the toggle.
        if (id === 'bldgs' && map.getLayer('3d-police')) {
            map.setLayoutProperty('3d-police', 'visibility', vis);
        } else if (id === 'graffito') {
            if (map.getLayer('graffito-outline')) map.setLayoutProperty('graffito-outline', 'visibility', vis);
            if (map.getLayer('graffito-label'))   map.setLayoutProperty('graffito-label',   'visibility', vis);
        } else if (id === 'memory') {
            if (map.getLayer('highlighted-memories')) map.setLayoutProperty('highlighted-memories', 'visibility', vis);
            // Hiding Comments → close the side panels and clear hover state.
            if (!el.checked) {
                document.getElementById('memory-list')?.classList.add('d-none');
                document.getElementById('memory-panel')?.classList.add('d-none');
                document.getElementById('memory-list-container').innerHTML = '';
                if (typeof hoveredStateId2 !== 'undefined' && hoveredStateId2 !== null) {
                    map.setFeatureState({ source: 'grid', id: hoveredStateId2 }, { hover: false });
                }
            }
        }
    });
}

// Apply each checkbox's initial state to the map after load. Defined here as
// a callable so the load handler and the async highlights handler can both
// invoke it and reach a consistent state.
function applyInitialToggleState() {
    for (const id of toggleableLayerIds) {
        const el = document.getElementById(id);
        if (!el || !map.getLayer(id)) continue;
        const vis = el.checked ? 'visible' : 'none';
        map.setLayoutProperty(id, 'visibility', vis);
        if (id === 'bldgs' && map.getLayer('3d-police')) {
            map.setLayoutProperty('3d-police', 'visibility', vis);
        } else if (id === 'graffito') {
            if (map.getLayer('graffito-outline')) map.setLayoutProperty('graffito-outline', 'visibility', vis);
            if (map.getLayer('graffito-label'))   map.setLayoutProperty('graffito-label',   'visibility', vis);
        } else if (id === 'memory' && map.getLayer('highlighted-memories')) {
            map.setLayoutProperty('highlighted-memories', 'visibility', vis);
        }
    }
}
