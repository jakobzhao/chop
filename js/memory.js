//memory related functions and variables

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
        // document.getElementById('memory-submit').removeEventListener('submit', submitNewReview);
        // document.getElementById('memory-submit').addEventListener('submit', submitNewReview);
        

    } else {
        document.getElementById("memory-list").classList.remove("d-none");
        document.getElementById("memory-panel").classList.remove("d-none");
        document.getElementById('memory-submit').removeEventListener('click', submitNewReview);
        document.getElementById('memory-submit').addEventListener('click', submitNewReview);
        // memory list

        let memoryListContainer = document.getElementById('memory-list-container');

        let promptDiv = document.createElement('div');
        promptDiv.classList.add('memory-prompt');
        promptDiv.innerHTML = "Memories";
        memoryListContainer.append(promptDiv);



        if (memoryData.length > 0) {
            let i = 0;
            for (let memory of memoryData) {
                let memoryDiv = document.createElement('p');
                let created_at = new Date(memory.created_at);
                let dt = created_at.toLocaleDateString('en-US', {
                    timeZone: 'PST'
                })
                let tm = created_at.toLocaleTimeString('en-US', {
                    timeZone: 'PST'
                })
                memoryDiv.innerHTML = '<span class="contributor-name">' + memory.reviewer + ' ' + '<canvas id="memory-' + i.toString() + '" height="13px" width="13px"></canvas> </span> <span class="mentioned" >: </span><span class="memory-content">' + memory.content + '    </span> <span class="created_at"> on ' + dt + ' at ' + tm + '</span>';
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

        } else {

            let bottomDiv = document.createElement('div');
            bottomDiv.classList.add('memory-entry-bottom');
            bottomDiv.innerHTML = "<p><i>No record has been found. Be the first to share your memories, in-situ experiences, or feelings about this location. </i></p>"
            memoryListContainer.append(bottomDiv);
        }

    }
}


//helper function to submit new review
function submitNewReview(e) {
    e.preventDefault();

    let contributor = document.getElementById('contributor').value;
    let content = document.getElementById('memory-content').value;
    let email = "";

    if (contributor = "") {
        contributor = "Anonymous";
    }
    // validateEmail = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)?true:false;
    validateContent = (content != "") ? true : false;

    if (validateContent) {
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
        await fetch('https://chop-rest-api.herokuapp.com/api/add-comment', settings);
        // await fetch('http://localhost:3000/api/add-comment', settings);
        confirmationReview();
    } catch (err) {
        checkStatus(err);
    }

    try {
        let newMemoryData = await getMemories(hid);
        let feature = null;

        memories = map.queryRenderedFeatures({layers: ['memory']});

        memories.forEach(memory=>{
            if (hid == memory.properties.id) {

                feature = memory;
                return true;
            }
        })

        const center = turf.center(feature);
        const buffer = turf.buffer(center, 0.030, {
            units: 'kilometers'
        });

        let graffitiIntersected = [];
        graffitoData.features.forEach(graffito => {
            // if (turf.pointsWithinPolygon(graffito.geometry.coordinates, buffer.geometry.coordinates).features.length > 0 && graffitoData.features[0].properties.Message != undefined){
            //     graffitiWithin.push(graffitoData.features[0].properties.Message);
            // }
            if (turf.intersect(graffito, feature) != null && graffito.properties.Message != undefined) {
                graffitiIntersected.push(graffito.properties.Message);
            }

        });

        let poiIntersected = [];
        poiData.features.forEach(poi => {

            if (turf.booleanWithin(poi.geometry, buffer.geometry) && poi.properties.name != null) {
                poiIntersected.push(poi.properties.name.toUpperCase());
            }

        });

        constructMemories([newMemoryData, graffitiIntersected, poiIntersected]);


    } catch (err) {
        checkStatus(err);
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
        console.log(err);
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
        console.log(err);
    }
}