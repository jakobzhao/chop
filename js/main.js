window.addEventListener("load", init);
let graffitoData = null;
let poiData = null;

// init function
async function init() {



    $("#nav-team").on("click", function () {
        $('#team').modal('show');

    });

    $("#nav-chop").on("click", function () {
        $('#aboutchop').modal('show');

    });


    $("#nav-about").on("click", function () {
        $('#welcome').modal('show');

    });

    $("#nav-data").on("click", function () {
        $('#datacite').modal('show');

    });

    $("#nav-instruction").on("click", function () {
        introJs().start();

    });

    $("#familiarization").on("click", function () {
        introJs().start();

    });

    

    let response = await fetch('assets/graffiti.geojson');
    graffitoData = await response.json();

    response = await fetch('assets/poi.geojson');
    poiData = await response.json();

    document.querySelector('#details').addEventListener('toggle', function() {
        let summaryText = document.querySelector('#summary-text');
        if (this.open) {
            summaryText.textContent = "(click to collapse)";
        } else {
            summaryText.textContent = "(click to show instructions)";
        }
    });

}



function makeAlert(alertText) {
    let alert = document.getElementById("alert-modal");
    let alertTextBox = document.getElementById("alert-text");
    alertTextBox.innerHTML = alertText;
    let alertModal = new bootstrap.Modal(alert);
    alertModal.show();
}

// status checks
function checkStatus(response) {
    if (response.ok) {
        return response;
    } else {
        console.log("where the error is:" + response)
        throw Error("CHOP: Error in request: " + response.statusText);
    }
}