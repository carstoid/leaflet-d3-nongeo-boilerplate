// BASIC LEAFLET/D3 SETUP FOR NON-GEOGRAPHIC MAPS
// Carsten Rodin, July 2017
// This lets you pan/zoom an image (section, rendering, hand-drawn map etc)
// and add interactive elements/data visualization with d3.
// KNOWN ISSUES:
//  - weird centering behavior on ios safari

// HTML
// header
//  js for D3 >4.9.1
//  js, css for Leaflet >1.1.0
// body
//  target div with id "drawing-container"

// CSS
/*
  body {
    padding: 0;
    margin: 0;
  }
  #drawing-container {
    width: 100vw;
    height: 100vh;
  }
  .leaflet-container {
    background: rgba(255,255,255,0.0) !important;
  }
*/

var imgPath = 'render.png'; // map image location
var bounds = [[0,0], [2160, 3840]]; // map image dimensions

// wrapper to convert photoshop-style [x, y] or x, y coordinates to Leaflet latLng
var yx = L.latLng;
var xy = function(x, y) {
    if (L.Util.isArray(x)) {
        return yx(bounds[1][0] - x[1], x[0]);
    }
    return yx(bounds[1][0] - y, x);
};

// ~~~~~ Leaflet setup ~~~~~~~~

var panzoom = L.map('drawing-container', {        // initialize the leaflet map in the #drawing-container div
                      crs: L.CRS.Simple,          // simple crs overrides geographic lat-lng
                      zoomSnap: 0.25,             // zoom increment
                      zoomControl: false,         // hide zoom control
                      attributionControl: false,  // hide attribution
                      minZoom: -1.25,             // minzoom (farthest out)
                      maxBounds: bounds,          // prevent pan past image bounds
                      maxBoundsViscosity: 1.0     // prevent rubber-band behavior when attempting to pan past bounds
                      });

var image = L.imageOverlay(imgPath, bounds).addTo(panzoom);  // add image underlay layer (with bounds)
var svglayer = L.svg({ padding: 0.0 }).addTo(panzoom);  // add svg layer for d3 to draw into. padding set to zero to ensure proper alignment

// leaflet markers and behavior
var pk1 = xy(2206, 669); // specify a point using xy wrapper (see above)
var pk2 = xy(1550, 1140);
L.marker(pk1).addTo(panzoom); // add a leaflet marker at a specified point

panzoom.setView( pk1, 0);  // set map view to center and zoom using specified point

function flyTo() {  // use flyto to move map to a specified point
  panzoom.flyTo( pk2 )
}

// ~~~~~~~ D3 setup ~~~~~~~~

var circles = [ [1500, 1500], [2206, 669], [1550, 1140] ];  // example data, array of x, y points in original image

var svg = d3.select("#drawing-container").select("svg") // get svg layer within main Leaflet map
  .attr("pointer-events", "all"), // need to enable pointer events for d3 onclick to work
  g = svg.append("g");            // get group within main target layer

circles.forEach((d) => {     // for each element in data
  d.LatLng = xy(d[0], d[1])  // assign a LatLng property derived from x, y coordinates
});

var feature = g.selectAll("circle")  // add circles for each data element
.data(circles)
.enter()
.append("circle")
.style("fill", "orange")   // orange fill
.attr("r", 10)              // radius 10
.on("click", function() {     // click handler - see enabling events with pointer-events: all above
  console.log('clicked a circle')})

panzoom.on("moveend", update);  // listen to changes on map pan/zoom, call update function to redraw circles in correct positions

update(); // initial call to update function (show circles on page load)

function update(){            // update function
  feature.attr("transform",   // set transform for features based on new position
    function(d) {
      return "translate("+    // translate to ...
        panzoom.latLngToLayerPoint(d.LatLng).x +","+   // new converted x coordinate
        panzoom.latLngToLayerPoint(d.LatLng).y +")";   // new converted y coordinate
    }
  )
}
