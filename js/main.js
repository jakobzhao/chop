window.addEventListener("load", init);
let graffitoData = null;
let poiData = null;

// Bootstrap 5.2 sets aria-hidden on the modal while a descendant still has
// focus, which trips an a11y warning. Blur the focused element before hide.
// Attach at document level on capture so it runs regardless of init() timing.
document.addEventListener('hide.bs.modal', (e) => {
    const modalEl = e.target;
    if (modalEl && document.activeElement && modalEl.contains(document.activeElement)) {
        document.activeElement.blur();
    }
}, true);

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

    

    try {
        let response = await fetch('assets/graffiti.geojson');
        graffitoData = response.ok ? await response.json() : { features: [] };
    } catch (err) {
        console.error('Failed to load graffiti.geojson', err);
        graffitoData = { features: [] };
    }

    try {
        let response = await fetch('assets/poi.geojson');
        poiData = response.ok ? await response.json() : { features: [] };
    } catch (err) {
        console.error('Failed to load poi.geojson', err);
        poiData = { features: [] };
    }

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
        throw Error("CHOP: Error in request: " + response.statusText);
    }
}