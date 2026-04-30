//memory related functions and variables

function placeRecaptchaBadge() {
    const badge = document.querySelector('.grecaptcha-badge');
    const memoryPanel = document.getElementById('memory-panel');
    const recaptchaSlot = document.getElementById('recaptcha-slot');

    if (!badge || !memoryPanel || !recaptchaSlot || memoryPanel.classList.contains('d-none')) {
        return;
    }

    if (badge.parentElement !== recaptchaSlot) {
        recaptchaSlot.appendChild(badge);
    }

    badge.style.setProperty('position', 'static', 'important');
    badge.style.setProperty('left', 'auto', 'important');
    badge.style.setProperty('right', 'auto', 'important');
    badge.style.setProperty('top', 'auto', 'important');
    badge.style.setProperty('bottom', 'auto', 'important');
    badge.style.setProperty('z-index', '1000', 'important');
}

function scheduleRecaptchaBadgePlacement() {
    requestAnimationFrame(() => {
        placeRecaptchaBadge();
        setTimeout(placeRecaptchaBadge, 250);
    });
}

window.addEventListener('load', scheduleRecaptchaBadgePlacement);
window.addEventListener('resize', scheduleRecaptchaBadgePlacement);

new MutationObserver((mutations) => {
    if (mutations.some((mutation) => Array.from(mutation.addedNodes).some((node) => {
        return node.nodeType === Node.ELEMENT_NODE && (
            node.classList?.contains('grecaptcha-badge') ||
            node.querySelector?.('.grecaptcha-badge')
        );
    }))) {
        scheduleRecaptchaBadgePlacement();
    }
}).observe(document.body, { childList: true, subtree: true });

map.on('click', 'memory', async (e) => {
    map.getCanvas().style.cursor = 'pointer';
    const clickedfeatures = e.features;
    if (clickedfeatures.length > 0) {
        if (hoveredStateId2 !== null) {
            map.setFeatureState({
                source: 'grid',
                id: hoveredStateId2
            }, {
                hover: false
            });
        }
        hoveredStateId2 = clickedfeatures[0].id
        map.setFeatureState({
            source: 'grid',
            id: hoveredStateId2
        }, {
            hover: true
        });
        // document.getElementById("hexagonInfo").innerHTML = "Hexagon ID: " + e.features[0].properties.id;
        hid = clickedfeatures[0].properties.id;
        //capture previous reviews
        // get all comments of the location
        let memoryData = await getMemories(hid);


        /*const center = turf.center(clickedfeatures[0]);
        const buffer = turf.buffer(center, 0.030, {
            units: 'kilometers'
        });
        const clickedfeature = clickedfeatures[0];
        let graffitiIntersected = []
        graffitoData.features.forEach(graffito => {
            // if (turf.pointsWithinPolygon(graffito.geometry.coordinates, buffer.geometry.coordinates).features.length > 0 && graffitoData.features[0].properties.Message != undefined){
            //     graffitiWithin.push(graffitoData.features[0].properties.Message);
            // }
            if (turf.intersect(graffito, clickedfeature) != null && graffito.properties.Message != undefined) {
                graffitiIntersected.push(graffito.properties.Message);
            }

        });

        let poiIntersected = []
        poiData.features.forEach(poi => {

            if (turf.booleanWithin(poi.geometry, buffer.geometry) && poi.properties.name != null) {
                poiIntersected.push(poi.properties.name.toUpperCase());

            }




        });*/
        // console.log(graffitiIntersected);
        // console.log(poiIntersected);
        constructMemories([memoryData]);//, graffitiIntersected, poiIntersected]);
    }
});


// create and style all incoming reviews from API request
function constructMemories(memoryProfile) {
    const memoryData = memoryProfile[0];
    //const graffitiIntersected = memoryProfile[1];
    //const poiIntersected = memoryProfile[2];

    // initialize the memory-list
    document.getElementById("memory-panel").classList.add("d-none");
    document.getElementById('memory-list-container').innerHTML = "";
    //document.getElementById('graffiti-container').innerHTML = "";
    //document.getElementById('poi-container').innerHTML = "";

    // construct the new memory list

    if (memoryData.length == 0) {
        // enable memory
        document.getElementById("memory-list").classList.add("d-none");
        document.getElementById("memory-panel").classList.remove("d-none");
        document.getElementById('memory-submit').removeEventListener('click', submitNewReview);
        document.getElementById('memory-submit').addEventListener('click', submitNewReview);
        scheduleRecaptchaBadgePlacement();
        // document.getElementById('memory-submit').removeEventListener('submit', submitNewReview);
        // document.getElementById('memory-submit').addEventListener('submit', submitNewReview);
        

    } else {
        document.getElementById("memory-list").classList.remove("d-none");
        document.getElementById("memory-panel").classList.remove("d-none");
        document.getElementById('memory-submit').removeEventListener('click', submitNewReview);
        document.getElementById('memory-submit').addEventListener('click', submitNewReview);
        scheduleRecaptchaBadgePlacement();
        // memory list

        let memoryListContainer = document.getElementById('memory-list-container');

        let promptDiv = document.createElement('div');
        promptDiv.classList.add('memory-prompt');
        promptDiv.innerHTML = "Memories";
        memoryListContainer.append(promptDiv);



        let i = 0;
        for (let memory of memoryData) {
                let memoryDiv = document.createElement('p');
                let created_at = new Date(memory.created_at);
                let dt = created_at.toLocaleDateString('en-US', {
                    timeZone: 'America/Los_Angeles'
                })
                let tm = created_at.toLocaleTimeString('en-US', {
                    timeZone: 'America/Los_Angeles'
                })

                let nameSpan = document.createElement('span');
                nameSpan.className = 'contributor-name';
                nameSpan.appendChild(document.createTextNode(memory.reviewer + ' '));
                let canvas = document.createElement('canvas');
                canvas.id = 'memory-' + i.toString();
                canvas.height = 13;
                canvas.width = 13;
                nameSpan.appendChild(canvas);

                let mentionedSpan = document.createElement('span');
                mentionedSpan.className = 'mentioned';
                mentionedSpan.textContent = ': ';

                let contentSpan = document.createElement('span');
                contentSpan.className = 'memory-content';
                contentSpan.textContent = memory.content + '    ';

                let dateSpan = document.createElement('span');
                dateSpan.className = 'created_at';
                dateSpan.textContent = ' on ' + dt + ' at ' + tm;

                let reportBtn = document.createElement('button');
                reportBtn.type = 'button';
                reportBtn.className = 'memory-report-btn btn btn-link p-0 ms-2 align-baseline';
                reportBtn.title = 'Report this comment';
                reportBtn.setAttribute('aria-label', 'Report this comment');
                reportBtn.innerHTML = '<i class="bi bi-flag"></i>';
                reportBtn.addEventListener('click', () => openReportPanel(memory.vid));

                memoryDiv.appendChild(nameSpan);
                memoryDiv.appendChild(document.createTextNode(' '));
                memoryDiv.appendChild(mentionedSpan);
                memoryDiv.appendChild(contentSpan);
                memoryDiv.appendChild(document.createTextNode(' '));
                memoryDiv.appendChild(dateSpan);
                memoryDiv.appendChild(reportBtn);
                memoryDiv.classList.add('memory-entry');

                memoryListContainer.append(memoryDiv);
                const hrDiv = document.createElement('hr');
                hrDiv.classList.add('memory-hr');

                // separators
                memoryListContainer.append(hrDiv);

                // random head shot
                drawHeadShot("memory-" + i.toString());
                i++;
            }

        let bottomDiv = document.createElement('div');
        bottomDiv.classList.add('memory-entry-bottom');
        memoryListContainer.append(bottomDiv);

    }
}


//helper function to submit new review
function submitNewReview(e) {
    e.preventDefault();

    let contributor = document.getElementById('contributor').value.trim();
    let content = document.getElementById('memory-content').value.trim();
    let email = "";

    if (contributor.length == 0) {
        contributor = "Anonymous";
    }

    if (content !== "") {
        addNewReview(e, hid, contributor, email, content);
    } else {
        makeAlert('<p style="text-align:center"><i class="bi bi-x-lg text-danger"></i></p><p style="text-align:center">Your submission did not succeed. Please make sure to have filled out the required field.</p>');
    }

    
};



// addNewReview
// Insert data into database and adds a new review to the corresponding VID
async function addNewReview(e, hid, contributor, email, content) {
    e.preventDefault();
    // obtain data from user input form
    let newReview = new URLSearchParams();
    newReview.append('hid', hid.toString());
    newReview.append('contributor', contributor);
    newReview.append('email', email);
    newReview.append('content', content);

    //console.log(newReview);

    let settings = {
        method: 'POST',
        body: newReview
    }

    try {
        const resp = await fetch('https://chop-rest-api.herokuapp.com/api/add-comment', settings);
        // const resp = await fetch('http://localhost:3000/api/add-comment', settings);
        if (!resp.ok) {
            throw new Error('Submission failed: ' + resp.status + ' ' + resp.statusText);
        }
        confirmationReview();
    } catch (err) {
        console.error(err);
        makeAlert('<p style="text-align:center"><i class="bi bi-x-lg text-danger"></i></p><p style="text-align:center">Your submission did not succeed. Please try again later.</p>');
        return;
    }

    try {
        let newMemoryData = await getMemories(hid);
        let memories = map.queryRenderedFeatures({ layers: ['memory'] });
        let feature = memories.find(memory => hid == memory.properties.id) || null;

        let graffitiIntersected = [];
        let poiIntersected = [];

        if (feature) {
            const center = turf.center(feature);
            const buffer = turf.buffer(center, 0.030, {
                units: 'kilometers'
            });

            if (graffitoData && graffitoData.features) {
                graffitoData.features.forEach(graffito => {
                    if (turf.intersect(graffito, feature) != null && graffito.properties.Message != undefined) {
                        graffitiIntersected.push(graffito.properties.Message);
                    }
                });
            }

            if (poiData && poiData.features) {
                poiData.features.forEach(poi => {
                    if (turf.booleanWithin(poi.geometry, buffer.geometry) && poi.properties.name != null) {
                        poiIntersected.push(poi.properties.name.toUpperCase());
                    }
                });
            }
        }

        constructMemories([newMemoryData, graffitiIntersected, poiIntersected]);


    } catch (err) {
        console.error(err);
    }


}

// confirmationReview
// Display user reaction screen when review is confirmed and is submitted into database
function confirmationReview() {
    // hide and remove comment textarea
    document.getElementById('contributor').value = '';
    // document.getElementById('email').value = '';
    document.getElementById('memory-content').value = '';

    makeAlert('<p style="text-align:center"><i class="bi bi-check-lg text-success"></i></p><p style="text-align:center">Your memory or commentary has been submitted successfully.</p>');
}


// getMemories
// Obtain data from database containing information for all the reviews of a specific location
async function getMemories(hid) {
    try {
        let id = hid;
        let getReview = await fetch(`https://chop-rest-api.herokuapp.com/api/comment/${id}`, {
            // let getReview = await fetch(`http://localhost:3000/api/comment/${id}`, {
            method: 'GET'
        });
        let memoryData = await getReview.json();
        return memoryData;
    } catch (err) {
        console.warn('getMemories unavailable (likely CORS on localhost or API down).', err);
        return [];
    }
}

// getHighlights
// Obtain data from database containing information for all the locations with associated reviews
async function getHighlights() {
    try {
        let getHighlight = await fetch(`https://chop-rest-api.herokuapp.com/api/highlights`, {
            method: 'GET'
        });
        let highlightData = await getHighlight.json();
        return highlightData;
    } catch (err) {
        console.warn('getHighlights unavailable (likely CORS on localhost or API down); using static fallback.', err);
        try {
            const fallback = await fetch('assets/highlights.json');
            return fallback.ok ? await fallback.json() : [];
        } catch (fallbackErr) {
            console.warn('Static highlights fallback unavailable; proceeding without highlight overlay.', fallbackErr);
            return [];
        }
    }
}


// openReportPanel
// Show the report panel and remember which comment is being reported
function openReportPanel(vid) {
    if (vid == null) {
        console.warn('openReportPanel called without a vid');
        return;
    }
    const panel = document.getElementById('report-panel');
    const memoryList = document.getElementById('memory-list');
    const memoryPanel = document.getElementById('memory-panel');

    panel.dataset.vid = String(vid);
    document.getElementById('report-reason').value = '';
    document.getElementById('report-content').value = '';

    memoryList.classList.add('d-none');
    memoryPanel.classList.add('d-none');
    panel.classList.remove('d-none');
}

// submitReport
// Send the flag to the backend and close the panel on success
async function submitReport(e) {
    e.preventDefault();

    const panel = document.getElementById('report-panel');
    const vid = panel.dataset.vid;
    const reason = document.getElementById('report-reason').value;
    const extra = document.getElementById('report-content').value.trim();

    if (!vid) {
        makeAlert('<p style="text-align:center"><i class="bi bi-x-lg text-danger"></i></p><p style="text-align:center">Could not identify the comment to report. Please reopen and try again.</p>');
        return;
    }
    if (!reason) {
        makeAlert('<p style="text-align:center"><i class="bi bi-x-lg text-danger"></i></p><p style="text-align:center">Please select a report reason.</p>');
        return;
    }

    const details = extra ? `${reason}: ${extra}` : reason;
    const body = new URLSearchParams();
    body.append('vid', vid);
    body.append('details', details);

    try {
        const resp = await fetch('https://chop-rest-api.herokuapp.com/api/report', {
            method: 'POST',
            body
        });
        if (!resp.ok) {
            throw new Error('Report failed: ' + resp.status + ' ' + resp.statusText);
        }
        panel.classList.add('d-none');
        delete panel.dataset.vid;
        makeAlert('<p style="text-align:center"><i class="bi bi-check-lg text-success"></i></p><p style="text-align:center">Thanks. The comment has been flagged for review.</p>');
    } catch (err) {
        console.error(err);
        makeAlert('<p style="text-align:center"><i class="bi bi-x-lg text-danger"></i></p><p style="text-align:center">Your report did not succeed. Please try again later.</p>');
    }
}

const reportSubmitBtn = document.getElementById('report-submit');
if (reportSubmitBtn) {
    reportSubmitBtn.addEventListener('click', submitReport);
}
