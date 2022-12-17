//======================= Memory ==========================
map.on('mousemove', 'memory', (e) => {
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
    }
});

// When the mouse leaves the state-fill layer, update the feature state of the
// previously hovered feature.
map.on('mouseleave', 'memory', () => {
    map.getCanvas().style.cursor = '';
    if (hoveredStateId2 !== null) {
        map.setFeatureState({
            source: 'grid',
            id: hoveredStateId2
        }, {
            hover: false
        });
    }
    hoveredStateId2 = null;
});


map.on('click', 'memory', (e) => {
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
        document.getElementById("hexagonInfo").innerHTML = "Hexagon ID: " + e.features[0].properties.id;
    }
});


//review

document.getElementById('review-submit').removeEventListener('click', submitNewReview);
document.getElementById('review-submit').addEventListener('click', submitNewReview);
// get all comments of the location
const hid = null;
// let reviewData = await getReviews(hid);
//constructReviews(reviewData);



// create and style all incoming reviews from API request
// function constructReviews(reviewData) {
//     let reviewParent = document.getElementById('reviews-container');
  
//     for (let element of reviewData) {
//       let reviewDiv = document.createElement('div');
//       reviewDiv.innerHTML = element.content;
//       reviewDiv.classList.add('review-box');
//       reviewParent.append(reviewDiv);
//     }
//   }



// helper function to submit new review
function submitNewReview(e) {

    let reviewer = document.getElementById('reviewername').innerHTML;
    let email = document.getElementById('email').innerHTML;
    let content = document.getElementById('reviewcontent').innerHTML;
    // add new review
    addNewReview(e, hid, reviewer, email, content);
    }
};



// addNewReview
// Insert data into database and adds a new review to the corresponding VID
async function addNewReview(e, hid, reviewer, email, content) {
    event.preventDefault();
    // obtain data from user input form
    let newReview = new URLSearchParams();
    newReview.append('hid', hid);
    newReview.append('reviewer', reviewer);
    newReview.append('email', email);
    newReview.append('content', content);

    let settings = {
        method: 'POST',
        body: newReview
    }

    try {
        await fetch('https://chop-rest-api.herokuapp.com/api/add-comment', settings);
        confirmationReview();
        // getReviews(id);
    } catch (err) {
        checkStatus(err);
    }
}



// confirmationReview
// Display user reaction screen when review is confirmed and is submitted into database
function confirmationReview() {
    // hide and remove comment textarea
    document.getElementById('reviewer').value = '';
    document.getElementById('email').value = '';
    document.getElementById('content').value = '';

    // display user reaction confirmation screen
    let reviewCheck = document.getElementById('reviews-confirmation');
    reviewCheck.classList.remove('d-none');
    setTimeout(function () {
        reviewCheck.classList.add('d-none')
    }, 3000);
}


// getReviews
// Obtain data from database containing information for all the reviews of a specific location
// async function getReviews(vid) {
//     try {
//         let id = vid;
//         let getReview = await fetch(`https://lgbtqspaces-api.herokuapp.com/api/comment/${id}`, {
//             method: 'GET'
//         });
//         let reviewData = await getReview.json();
//         return reviewData;
//     } catch (err) {
//         console.log(err);
//     }
// }


  