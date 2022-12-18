//======================= Memory ==========================
// map.on('mousemove', 'memory', (e) => {
//     map.getCanvas().style.cursor = 'pointer';
//     if (e.features.length > 0 && checkedState == false) {
//         if (hoveredStateId2 !== null) {
//             map.setFeatureState({
//                 source: 'grid',
//                 id: hoveredStateId2
//             }, {
//                 hover: false
//             });
//         }
//         hoveredStateId2 = e.features[0].id
//         map.setFeatureState({
//             source: 'grid',
//             id: hoveredStateId2
//         }, {
//             hover: true
//         });
//     }
// });

// When the mouse leaves the state-fill layer, update the feature state of the
// previously hovered feature.
// map.on('mouseleave', 'memory', () => {
//     map.getCanvas().style.cursor = '';
//     if (hoveredStateId2 !== null && checkedState == false) {
//         map.setFeatureState({
//             source: 'grid',
//             id: hoveredStateId2
//         }, {
//             hover: false
//         });
//     }
//     hoveredStateId2 = null;
// });


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


//==============================review============================================


// create and style all incoming reviews from API request
function constructReviews(memoryData) {

    // initialize the reviewList
    document.getElementById("reviewList").classList.add("d-none");
    // document.getElementById("noReview").classList.add("d-none");
    // document.getElementById("hasReview").classList.add("d-none");
    document.getElementById("reviewPanel").classList.add("d-none");
    document.getElementById('reviewList-container').innerHTML = "";

    // construct the new review list

    if (memoryData.length == 0) {
        // document.getElementById("noReview").classList.remove("d-none");
        // enable review
        document.getElementById("featureInfo").classList.add("d-none");
        document.getElementById('review-submit').removeEventListener('click', submitNewReview);
        document.getElementById('review-submit').addEventListener('click', submitNewReview);
        document.getElementById("reviewPanel").classList.remove("d-none");

    } else {
        document.getElementById("featureInfo").classList.remove("d-none");
        // document.getElementById("hasReview").classList.remove("d-none");
        document.getElementById("reviewPanel").classList.remove("d-none");
        document.getElementById("reviewList").classList.remove("d-none");
        let memoryListContainer = document.getElementById('reviewList-container');
        let i = 0
        for (let memory of memoryData) {
            let memoryDiv = document.createElement('div');
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

            drawHeadShot("memory-" + i.toString());
            i++;
        }
    }
}







// helper function to submit new review
function submitNewReview(e) {
    e.preventDefault();

    let reviewer = document.getElementById('reviewername').value;
    let email = document.getElementById('email').value;
    let content = document.getElementById('reviewcontent').value;
    // add new review
    addNewReview(e, hid, reviewer, email, content);
};



// addNewReview
// Insert data into database and adds a new review to the corresponding VID
async function addNewReview(e, hid, reviewer, email, content) {
    e.preventDefault();
    // obtain data from user input form
    let newReview = new URLSearchParams();
    newReview.append('hid', hid.toString());
    newReview.append('reviewer', reviewer);
    newReview.append('email', email);
    newReview.append('content', content);

    console.log(newReview);

    let settings = {
        method: 'POST',
        body: newReview
    }

    try {
        await fetch('https://chop-rest-api.herokuapp.com/api/add-comment', settings);
        // await fetch('http://localhost:3000/api/add-comment', settings);
        confirmationReview();
        getReviews(hid);
    } catch (err) {
        checkStatus(err);
    }
}



// confirmationReview
// Display user reaction screen when review is confirmed and is submitted into database
function confirmationReview() {
    // hide and remove comment textarea
    document.getElementById('reviewername').value = '';
    document.getElementById('email').value = '';
    document.getElementById('reviewcontent').value = '';

    // display user reaction confirmation screen
    let reviewCheck = document.getElementById('reviews-confirmation');

    makeAlert('<p style="text-align:center"><i class="bi bi-check-lg text-success "></i></p><p style="text-align:center">Review has been submitted.</p>');
}


// getReviews
// Obtain data from database containing information for all the reviews of a specific location
async function getReviews(hid) {
    try {
        let id = hid;
        let getReview = await fetch(`https://chop-rest-api.herokuapp.com/api/comment/${id}`, {
        // let getReview = await fetch(`http://localhost:3000/api/comment/${id}`, {
            method: 'GET'
        });
        let reviewData = await getReview.json();
        return reviewData;
    } catch (err) {
        console.log(err);
    }
}