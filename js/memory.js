//memory related functions and variables

map.on('click', 'memory', async (e) => {
    map.getCanvas().style.cursor = 'pointer';
    if (e.features.length > 0) {
        if (hoveredStateId2 !== null) {
            map.setFeatureState({
                source: 'grid',
                id: hoveredStateId2
            }, {
                hover: false
            });
        }
        hoveredStateId2 = e.features[0].id
        map.setFeatureState({
            source: 'grid',
            id: hoveredStateId2
        }, {
            hover: true
        });
        // document.getElementById("hexagonInfo").innerHTML = "Hexagon ID: " + e.features[0].properties.id;
        hid = e.features[0].properties.id;
        //capture previous reviews
        // get all comments of the location
        let reviewData = await getReviews(hid);
   
        constructReviews(reviewData);
    }
});


// create and style all incoming reviews from API request
function constructReviews(memoryData) {

    // initialize the memory-list
    document.getElementById("memory-panel").classList.add("d-none");
    document.getElementById('memory-list-container').innerHTML = "";

    // construct the new memory list

    if (memoryData.length == 0) {
        // enable memory
        document.getElementById("memory-list").classList.add("d-none");
        document.getElementById('memory-submit').removeEventListener('click', submitNewReview);
        document.getElementById('memory-submit').addEventListener('click', submitNewReview);
        document.getElementById("memory-panel").classList.remove("d-none");

    } else {
        document.getElementById("memory-list").classList.remove("d-none");
        // document.getElementById("hasReview").classList.remove("d-none");
        document.getElementById("memory-panel").classList.remove("d-none");
        document.getElementById("memory-list").classList.remove("d-none");
        let memoryListContainer = document.getElementById('memory-list-container');
        let i = 0
        for (let memory of memoryData) {
            let memoryDiv = document.createElement('p');
            let created_at = new Date(memory.created_at);
            let dt = created_at.toLocaleDateString('en-US', {
                timeZone: 'PST'
            })
            let tm = created_at.toLocaleTimeString('en-US', {
                timeZone: 'PST'
            })
            memoryDiv.innerHTML = '<span class="contributor-name">' + memory.reviewer + ' ' + '<canvas id="memory-' + i.toString() + '" height="15px" width="15px"></canvas> </span> <span class="mentioned" >: </span><span class="memory-content">' + memory.content + '    </span> <span class="created_at"> on ' + dt + ' at ' + tm + '</span>';
            memoryDiv.classList.add('memory-entry');

            memoryListContainer.append(memoryDiv);
            const hrDiv = document.createElement('hr');
            
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

    let contributor = document.getElementById('contributor').value;
    // let email = document.getElementById('email').value;
    let content = document.getElementById('memory-content').value;
    let email  = "";

    validateContributor = (contributor != "") ? true:false;
    // validateEmail = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)?true:false;
    validateContent = (content != "") ? true:false;

    if (validateContributor && validateContent) {
        
    }



    // add new review
    addNewReview(e, hid, contributor, email, content);
  
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

    console.log(newReview);

    let settings = {
        method: 'POST',
        body: newReview
    }

    try {
        // await fetch('https://chop-rest-api.herokuapp.com/api/add-comment', settings);
        await fetch('http://localhost:3000/api/add-comment', settings);
        confirmationReview();
    } catch (err) {
        checkStatus(err);
    }

    try {
        let newMemoryData = await getReviews(hid);
        constructReviews(newMemoryData);
         
        
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

    makeAlert('<p style="text-align:center"><i class="bi bi-check-lg text-success"></i></p><p style="text-align:center">Your memory has been submitted.</p>');
}


// getReviews
// Obtain data from database containing information for all the reviews of a specific location
async function getReviews(hid) {
    try {
        let id = hid;
        // let getReview = await fetch(`https://chop-rest-api.herokuapp.com/api/comment/${id}`, {
        let getReview = await fetch(`http://localhost:3000/api/comment/${id}`, {
            method: 'GET'
        });
        let reviewData = await getReview.json();
        return reviewData;
    } catch (err) {
        console.log(err);
    }
}