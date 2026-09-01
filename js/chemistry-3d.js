/* =========================================================
NOW-or-NEVER
3D CHEMISTRY SYSTEM 
========================================================= */
const MOLECULE_LIBRARY = [

    /* =====================================================
       HYDROCARBONS — ALKANES
       ===================================================== */

    {
        id: "methane",
        name: "Methane",
        formula: "CH₄",
        chapter: "Hydrocarbons",
        topics: ["Alkanes", "Tetrahedral Carbon"],
        cid: 297
    },

    {
        id: "ethane",
        name: "Ethane",
        formula: "C₂H₆",
        chapter: "Hydrocarbons",
        topics: ["Alkanes", "Conformations"],
        cid: 6324
    },

    {
        id: "propane",
        name: "Propane",
        formula: "C₃H₈",
        chapter: "Hydrocarbons",
        topics: ["Alkanes"],
        cid: 6334
    },

    {
        id: "butane",
        name: "Butane",
        formula: "C₄H₁₀",
        chapter: "Hydrocarbons",
        topics: ["Alkanes", "Conformations", "Isomerism"],
        cid: 7843
    },

    {
        id: "isobutane",
        name: "Isobutane",
        formula: "C₄H₁₀",
        chapter: "Hydrocarbons",
        topics: ["Alkanes", "Chain Isomerism"],
        cid: 6360
    },


    /* =====================================================
       HYDROCARBONS — ALKENES
       ===================================================== */

    {
        id: "ethene",
        name: "Ethene",
        formula: "C₂H₄",
        chapter: "Hydrocarbons",
        topics: ["Alkenes", "π Bond", "sp² Hybridisation"],
        cid: 6325
    },

    {
        id: "propene",
        name: "Propene",
        formula: "C₃H₆",
        chapter: "Hydrocarbons",
        topics: ["Alkenes", "Addition Reactions"],
        cid: 8252
    },

    {
        id: "but-1-ene",
        name: "1-Butene",
        formula: "C₄H₈",
        chapter: "Hydrocarbons",
        topics: ["Alkenes", "Addition Reactions"],
        cid: 7844
    },


    /* =====================================================
       HYDROCARBONS — ALKYNES
       ===================================================== */

    {
        id: "ethyne",
        name: "Ethyne",
        formula: "C₂H₂",
        chapter: "Hydrocarbons",
        topics: ["Alkynes", "Triple Bond", "sp Hybridisation"],
        cid: 6326
    },

    {
        id: "propyne",
        name: "Propyne",
        formula: "C₃H₄",
        chapter: "Hydrocarbons",
        topics: ["Alkynes", "Terminal Alkynes"],
        cid: 6337
    },


    /* =====================================================
       HYDROCARBONS — CYCLIC
       ===================================================== */

    {
        id: "cyclohexane",
        name: "Cyclohexane",
        formula: "C₆H₁₂",
        chapter: "Hydrocarbons",
        topics: [
            "Cycloalkanes",
            "Conformations",
            "Chair Conformation"
        ],
        cid: 8078
    },


    /* =====================================================
       HYDROCARBONS — AROMATIC
       ===================================================== */

    {
        id: "benzene",
        name: "Benzene",
        formula: "C₆H₆",
        chapter: "Hydrocarbons",
        topics: [
            "Aromatic Hydrocarbons",
            "Aromaticity",
            "Resonance"
        ],
        cid: 241
    },

    {
        id: "toluene",
        name: "Toluene",
        formula: "C₇H₈",
        chapter: "Hydrocarbons",
        topics: [
            "Aromatic Hydrocarbons",
            "Alkyl Benzenes"
        ],
        cid: 1140
    },

    {
        id: "ethylbenzene",
        name: "Ethylbenzene",
        formula: "C₈H₁₀",
        chapter: "Hydrocarbons",
        topics: [
            "Aromatic Hydrocarbons",
            "Alkyl Benzenes"
        ],
        cid: 7500
    },

    {
        id: "styrene",
        name: "Styrene",
        formula: "C₈H₈",
        chapter: "Hydrocarbons",
        topics: [
            "Aromatic Hydrocarbons",
            "Alkenyl Benzene"
        ],
        cid: 7501
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
