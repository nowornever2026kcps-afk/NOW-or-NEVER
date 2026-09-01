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
/*search mechanics*/
function applyMoleculeFilters() {

    const searchInput =
        document.getElementById(
            "moleculeSearch"
        );

    const chapterFilter =
        document.getElementById(
            "chapterFilter"
        );


    const searchTerm =
        (
            searchInput?.value || ""
        )
        .trim()
        .toLowerCase();


    const selectedChapter =
        chapterFilter?.value || "all";


    const results =
        MOLECULE_LIBRARY.filter(
            molecule => {

                const name =
                    molecule.name
                        .toLowerCase();

                const formula =
                    molecule.formula
                        .toLowerCase();

                const chapter =
                    molecule.chapter
                        .toLowerCase();

                const topics =
                    molecule.topics
                        .join(" ")
                        .toLowerCase();


                const matchesSearch =
                    !searchTerm ||
                    name.includes(searchTerm) ||
                    formula.includes(searchTerm) ||
                    chapter.includes(searchTerm) ||
                    topics.includes(searchTerm);


                const matchesChapter =
                    selectedChapter === "all" ||
                    molecule.chapter ===
                        selectedChapter;


                return (
                    matchesSearch &&
                    matchesChapter
                );

            }
        );


    renderMoleculeLibrary(results);
}

/* rendering */

function renderMoleculeLibrary(
    molecules = MOLECULE_LIBRARY
) {

    const moleculeList =
        document.getElementById("moleculeList");

    if (!moleculeList) {
        console.warn(
            "3D Chemistry: moleculeList not found."
        );
        return;
    }

    moleculeList.innerHTML = "";

    if (molecules.length === 0) {

            moleculeList.innerHTML = `
                <div class="no-molecules-found">
                            <div class="no-molecules-icon">🧪</div>
                            <h3>No molecules found</h3>
                            <p>
                                Try another molecule name,
                                formula, chapter, or topic.
                            </p>
                        </div>
                    `;
                
                    return;
                }

     molecules.forEach(molecule => {

        const card =
            document.createElement("div");

        card.className = "molecule-card";

        card.dataset.moleculeId =
            molecule.id;

        card.innerHTML = `
            <h3>${molecule.name}</h3>

            <p>
                ${molecule.formula}
            </p>

            <p>
                ${molecule.chapter}
            </p>
        `;

        card.addEventListener(
                "click",
                () => {
                    selectMolecule(molecule.id);
                }
            );

        moleculeList.appendChild(card);

    });

}


let chemistryViewer = null;

/*finding */

function selectMolecule(moleculeId) {

    const molecule =
        MOLECULE_LIBRARY.find(
            item => item.id === moleculeId
        );

    if (!molecule) {
        console.error(
            "3D Chemistry: molecule not found:",
            moleculeId
        );
        return;
    }

    console.log(
        "Selected molecule:",
        molecule.name
    );


    /*
     * Update active card
     */

    document
        .querySelectorAll(".molecule-card")
        .forEach(card => {

            card.classList.toggle(
                "active",
                card.dataset.moleculeId === moleculeId
            );

        });


    /*
     * Update information
     */

    const nameElement =
        document.getElementById("moleculeName");

    const formulaElement =
        document.getElementById("moleculeFormula");

    const chapterElement =
        document.getElementById("moleculeChapter");

    const topicsElement =
        document.getElementById("moleculeTopics");

    const infoFormulaElement =
        document.getElementById("moleculeInfoFormula");

    const cidElement =
        document.getElementById("moleculeCID");


    if (nameElement) {
        nameElement.textContent =
            molecule.name;
    }

    if (formulaElement) {
        formulaElement.textContent =
            molecule.formula;
    }

    if (chapterElement) {
        chapterElement.textContent =
            molecule.chapter;
    }

    if (topicsElement) {
        topicsElement.textContent =
            molecule.topics.join(", ");
    }

    if (infoFormulaElement) {
        infoFormulaElement.textContent =
            molecule.formula;
    }

    if (cidElement) {
        cidElement.textContent =
            molecule.cid;
    }


    /*
     * Load the molecule from PubChem
     */

            loadMoleculeFromPubChem(
                molecule.cid
            );
        
            if (window.innerWidth <= 800) {
        
            const viewerSection =
                document.querySelector(
                    ".molecule-viewer-section"
                );
        
            if (viewerSection) {
        
                setTimeout(() => {
        
                    viewerSection.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });
        
                }, 150);
        
            }
        
        }
}

/* changing visulisation*/

function setMoleculeStyle(style) {

    if (!chemistryViewer) {
        return;
    }

    chemistryViewer.setStyle({}, {});

    if (style === "ball-stick") {

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

    }

    else if (style === "stick") {

        chemistryViewer.setStyle(
            {},
            {
                stick: {
                    radius: 0.20
                }
            }
        );

    }

    else if (style === "spacefill") {

        chemistryViewer.setStyle(
            {},
            {
                sphere: {
                    scale: 0.85
                }
            }
        );

    }

    chemistryViewer.render();


    /*
     * Update active control button
     */

    document
        .querySelectorAll(".viewer-controls button")
        .forEach(button => {
            button.classList.remove("active");
        });


    const activeButton =
        document.querySelector(
            `[data-style="${style}"]`
        );

    if (activeButton) {
        activeButton.classList.add("active");
    }
}

/* connecting buttons*/

function initializeViewerControls() {

    const ballStickBtn =
        document.getElementById("ballStickBtn");

    const stickBtn =
        document.getElementById("stickBtn");

    const sphereBtn =
        document.getElementById("sphereBtn");

    const resetViewBtn =
        document.getElementById("resetViewBtn");


    if (ballStickBtn) {

        ballStickBtn.dataset.style =
            "ball-stick";

        ballStickBtn.addEventListener(
            "click",
            () => {
                setMoleculeStyle("ball-stick");
            }
        );

    }


    if (stickBtn) {

        stickBtn.dataset.style =
            "stick";

        stickBtn.addEventListener(
            "click",
            () => {
                setMoleculeStyle("stick");
            }
        );

    }


    if (sphereBtn) {

        sphereBtn.dataset.style =
            "spacefill";

        sphereBtn.addEventListener(
            "click",
            () => {
                setMoleculeStyle("spacefill");
            }
        );

    }


    if (resetViewBtn) {

        resetViewBtn.addEventListener(
            "click",
            () => {

                if (!chemistryViewer) {
                    return;
                }

                chemistryViewer.zoomTo();
                chemistryViewer.render();

            }
        );

    }

}

function initializeChapterFilter() {

    const chapterFilter =
        document.getElementById(
            "chapterFilter"
        );

    if (!chapterFilter) {
        return;
    }


    const chapters =
        [...new Set(
            MOLECULE_LIBRARY.map(
                molecule => molecule.chapter
            )
        )];


    chapters
        .sort()
        .forEach(chapter => {

            const option =
                document.createElement("option");

            option.value = chapter;

            option.textContent = chapter;

            chapterFilter.appendChild(
                option
            );

        });


    chapterFilter.addEventListener(
        "change",
        () => {

            applyMoleculeFilters();

        }
    );
}



function initializeMoleculeSearch() {

    const searchInput =
        document.getElementById("moleculeSearch");

    const searchButton =
        document.getElementById("searchMoleculeBtn");


    if (!searchInput || !searchButton) {
        return;
    }


    /* Search button */

    searchButton.addEventListener(
        "click",
        () => {
            applyMoleculeFilters();
        }
    );


    /* Enter key */

    searchInput.addEventListener(
        "keydown",
        event => {

            if (event.key === "Enter") {
                applyMoleculeFilters();
            }

        }
    );


    /* Live search */

    searchInput.addEventListener(
        "input",
        () => {
            applyMoleculeFilters();
        }
    );

}
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

console.log(
    "3D Chemistry viewer initialized."
);


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
    () => {

        renderMoleculeLibrary();

        initializeChemistry3D();

        initializeViewerControls();

        initializeMoleculeSearch();
        initializeChapterFilter();

    }
);
