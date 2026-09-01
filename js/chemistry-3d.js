/* =========================================================
NOW-or-NEVER
3D CHEMISTRY SYSTEM
========================================================= */

let chemistryViewer = null;

/* =========================================================
INITIALIZE VIEWER
========================================================= */

function initializeChemistry3D() {

 
const viewerElement =
    document.getElementById("moleculeViewer");

if (!viewerElement) {
    console.warn(
        "3D Chemistry: viewer element not found."
    );
    return;
}

if (typeof $3Dmol === "undefined") {
    console.error(
        "3D Chemistry: 3Dmol.js failed to load."
    );
    return;
}


/*
 * Create the 3Dmol viewer
 */

chemistryViewer = $3Dmol.createViewer(
    viewerElement,
    {
        backgroundColor: "black"
    }
);


/*
 * Simple Benzene structure
 *
 * This is only a temporary test.
 * Later this will come from PubChem.
 */

const benzeneSDF = `
 

Benzene
NOW-or-NEVER

6  6  0  0  0  0  0  0  0  0999 V2000
1.3960    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
0.6980    1.2090    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
-0.6980    1.2090    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
-1.3960    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
-0.6980   -1.2090    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
0.6980   -1.2090    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
1  2  1  0  0  0  0  0  0  0  0  0
2  3  2  0  0  0  0  0  0  0  0  0
3  4  1  0  0  0  0  0  0  0  0  0
4  5  2  0  0  0  0  0  0  0  0  0
5  6  1  0  0  0  0  0  0  0  0  0
6  1  2  0  0  0  0  0  0  0  0  0
M  END
`;

 
/*
 * Add molecule
 */

chemistryViewer.addModel(
    benzeneSDF,
    "sdf"
);


/*
 * Display style
 */

chemistryViewer.setStyle(
    {},
    {
        stick: {
            radius: 0.18
        },

        sphere: {
            scale: 0.30
        }
    }
);


/*
 * Center molecule
 */

chemistryViewer.zoomTo();


/*
 * Render
 */

chemistryViewer.render();


console.log(
    "3D Chemistry: Benzene loaded successfully."
);
 

}

/* =========================================================
PAGE LOAD
========================================================= */

document.addEventListener(
"DOMContentLoaded",
initializeChemistry3D
);
