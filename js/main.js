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
            console.log("show disclaimer");
            $('#disclaimer').modal('show');

        } else {
            console.log("hide disclaimer");
            $('#disclaimer').modal('hide');
        }
        $('#disclaimer-close').click(function (e) // You are clicking the close button
            {
                $('#disclaimer').fadeOut(); // Now the pop up is hiden.
                $('#disclaimer').modal('hide');
            });

        $(".showFrontPage").on("click", function () {
            $('#disclaimer').modal('show');
            localStorage.setItem('popState', 'notShown');
        })

        //loader
        // hide the loader.
        $('#loader').fadeOut("slow");
        //welcome panel





        
        // Enumerate ids of the layers.
        const toggleableLayerIds = ['aerial', 'graffiti', 'boundary', 'core'];
        // Set up the corresponding toggle button for each layer.
        for (const id of toggleableLayerIds) {
            // Skip layers that already have a button set up.
            // if (document.getElementById(id)) {
            //     console.log(id);
            //     continue;
            // }
            
            // Show or hide layer when the toggle is clicked.
            document.getElementById(id).addEventListener("click", function(e){
                // console.log(id);
                const clickedLayer = id;
                // preventDefault() tells the user agent that if the event does not get explicitly handled, 
                // its default action should not be taken as it normally would be.
                e.preventDefault();
                // The stopPropagation() method prevents further propagation of the current event in the capturing 
                // and bubbling phases. It does not, however, prevent any default behaviors from occurring; 
                // for instance, clicks on links are still processed. If you want to stop those behaviors, 
                // see the preventDefault() method.
                e.stopPropagation();
                const visibility = map.getLayoutProperty(clickedLayer, 'visibility');
                // Toggle layer visibility by changing the layout object's visibility property.
                // if it is currently visible, after the clicking, it will be turned off.
                if (visibility === 'visible') {
                    map.setLayoutProperty(clickedLayer, 'visibility', 'none');
                    this.className = '';
                } else { //otherise, it will be turned on.
                    this.className = 'active';
                    map.setLayoutProperty(clickedLayer, 'visibility', 'visible');
                }
    
            });
       
        }
    }

})();



function makeAlert(alertText) {
    let alert = document.getElementById("alert-modal");
    let alertTextBox = document.getElementById("alert-text");
    alertTextBox.innerHTML = alertText;
    let alertModal = new bootstrap.Modal(alert);
    alertModal.show();
}