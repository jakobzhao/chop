window.addEventListener("load", init);
let graffitoData = null;
let poiData = null;

// init function
async function init() {

    $("#nextTimeSwitcher input").on("click", function () {
        if ($("#nextTimeSwitcher input:checked").val() === "on") {
            localStorage.setItem('popState', 'shown');
        } else {

            localStorage.setItem('popState', 'notShown');
        }
    })

    if (localStorage.getItem('popState') != 'shown') {
        console.log("show welcome");
        $('#welcome').modal('show');

    } else {
        console.log("hide welcome");
        $('#welcome').modal('hide');
    }
    $('#welcome-close').click(function (e) // You are clicking the close button
        {
            $('#welcome').fadeOut(); // Now the pop up is hidden.
            $('#welcome').modal('hide');
        });


    $("#nav-team").on("click", function () {
        $('#team').modal('show');

    });

    $("#nav-statement").on("click", function () {
        $('#statement').modal('show');

    });


    $("#nav-about").on("click", function () {
        $('#welcome').modal('show');

    });

    let response = await fetch('assets/graffito.geojson');
    graffitoData = await response.json();

    response = await fetch('assets/poi.geojson');
    poiData = await response.json();

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
        throw Error("Error in request: " + response.statusText);
    }
}