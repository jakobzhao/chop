"use strict";

(function () {

    window.addEventListener("load", init);

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

     
    $("#nav-team").on("click", function() {
        $('#team').modal('show');
        // localStorage.setItem('popState', 'notShown');
      })
  


        // $('#contributor-tooltip').hide();
 
        //     $('#content-tooltip').hide();

    }


    // document.getElementById("team").addEventListener("click", (e)=> {



    //     alertModal.show();




    // })



})();



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