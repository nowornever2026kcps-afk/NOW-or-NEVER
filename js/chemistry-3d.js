/* =========================================================
NOW-or-NEVER
3D CHEMISTRY SYSTEM
========================================================= */
const MOLECULE_LIBRARY = [
    {
        id: "benzene",
        name: "Benzene",
        formula: "C₆H₆",
        chapter: "Hydrocarbons",
        topics: ["Aromatic Hydrocarbons"],
        cid: 241
    },

    {
        id: "ethanol",
        name: "Ethanol",
        formula: "C₂H₆O",
        chapter: "Alcohols, Phenols and Ethers",
        topics: ["Alcohols"],
        cid: 702
    },

    {
        id: "acetic-acid",
        name: "Acetic Acid",
        formula: "C₂H₄O₂",
        chapter: "Aldehydes, Ketones and Carboxylic Acids",
        topics: ["Carboxylic Acids"],
        cid: 176
    },

    {
        id: "aniline",
        name: "Aniline",
        formula: "C₆H₇N",
        chapter: "Amines",
        topics: ["Aromatic Amines"],
        cid: 6115
    }
];


let chemistryViewer = null;

/* =========================================================
INITIALIZE 3D VIEWER
========================================================= */

function initializeChemistry3D() {


const viewerElement =
    document.getElementById("moleculeViewer");

if (!viewerElement) {
    console.error(
        "3D Chemistry: moleculeViewer not found."
    );
    return;
}

if (typeof $3Dmol === "undefined") {
    console.error(
        "3D Chemistry: 3Dmol.js did not load."
    );
    return;
}


chemistryViewer = $3Dmol.createViewer(
    viewerElement,
    {
        backgroundColor: "black"
    }
);


loadMoleculeFromPubChem(241);


}

/* =========================================================
LOAD MOLECULE FROM PUBCHEM
========================================================= */

async function loadMoleculeFromPubChem(cid) {


console.log(
    "Loading PubChem CID:",
    cid
);


try {

    const url =
        `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/record/SDF?record_type=3d`;


    const response =
        await fetch(url);


    if (!response.ok) {

        throw new Error(
            `PubChem request failed: ${response.status}`
        );

    }


    const sdf =
        await response.text();


    if (!sdf.trim()) {

        throw new Error(
            "PubChem returned empty molecular data."
        );

    }


    console.log(
        "PubChem 3D data received."
    );


    /*
     * Remove any previous molecule
     */

    chemistryViewer.clear();


    /*
     * Add PubChem molecule
     */

    chemistryViewer.addModel(
        sdf,
        "sdf"
    );


    /*
     * Ball & Stick style
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
     * Center and display molecule
     */

    chemistryViewer.zoomTo();

    chemistryViewer.render();


    /*
     * Update information
     */

    const nameElement =
        document.getElementById("moleculeName");

    const formulaElement =
        document.getElementById("moleculeFormula");

    const infoFormulaElement =
        document.getElementById("moleculeInfoFormula");

    const cidElement =
        document.getElementById("moleculeCID");


    if (nameElement) {
        nameElement.textContent =
            "Benzene";
    }

    if (formulaElement) {
        formulaElement.textContent =
            "C₆H₆";
    }

    if (infoFormulaElement) {
        infoFormulaElement.textContent =
            "C₆H₆";
    }

    if (cidElement) {
        cidElement.textContent =
            "241";
    }


    console.log(
        "Benzene loaded successfully."
    );

} catch (error) {

    console.error(
        "3D Chemistry error:",
        error
    );

}


}

/* =========================================================
PAGE LOAD
========================================================= */

document.addEventListener(
"DOMContentLoaded",
initializeChemistry3D
);
