/* =========================================================
NOW-or-NEVER
3D CHEMISTRY SYSTEM
========================================================= */

let chemistryViewer = null;

/* =========================================================
INITIALIZE 3D VIEWER
========================================================= */

function initializeChemistry3D() {

 
const viewerElement = document.getElementById("moleculeViewer");

if (!viewerElement) {
    console.warn("3D Chemistry: viewer element not found.");
    return;
}

// Create 3Dmol viewer
chemistryViewer = $3Dmol.createViewer(
    viewerElement,
    {
        backgroundColor: "black"
    }
);

console.log("3D Chemistry viewer initialized.");
 

}

/* =========================================================
START WHEN PAGE LOADS
========================================================= */

document.addEventListener(
"DOMContentLoaded",
initializeChemistry3D
);
