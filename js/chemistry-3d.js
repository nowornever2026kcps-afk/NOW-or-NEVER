/* =========================================================
NOW-or-NEVER
3D CHEMISTRY SYSTEM 
========================================================= */
const MOLECULE_LIBRARY = [

    // =========================
    // HYDROCARBONS
    // =========================

    {
        id: "methane",
        name: "Methane",
        formula: "CH₄",
        chapter: "Hydrocarbons",
        topics: ["Alkanes"],
        cid: 297,
        has3D: true
    },

    {
        id: "ethane",
        name: "Ethane",
        formula: "C₂H₆",
        chapter: "Hydrocarbons",
        topics: ["Alkanes"],
        cid: 6324,
        has3D: true
    },

    {
        id: "ethene",
        name: "Ethene",
        formula: "C₂H₄",
        chapter: "Hydrocarbons",
        topics: ["Alkenes"],
        cid: 6325,
        has3D: true
    },

    {
        id: "ethyne",
        name: "Ethyne",
        formula: "C₂H₂",
        chapter: "Hydrocarbons",
        topics: ["Alkynes"],
        cid: 6326,
        has3D: true
    },

    {
        id: "benzene",
        name: "Benzene",
        formula: "C₆H₆",
        chapter: "Hydrocarbons",
        topics: ["Aromatic Hydrocarbons"],
        cid: 241,
        has3D: true
    },


    // =========================
    // ALCOHOLS / PHENOLS
    // =========================

    {
        id: "methanol",
        name: "Methanol",
        formula: "CH₃OH",
        chapter: "Alcohols, Phenols and Ethers",
        topics: ["Alcohols"],
        cid: 887,
        has3D: true
    },

    {
        id: "ethanol",
        name: "Ethanol",
        formula: "C₂H₆O",
        chapter: "Alcohols, Phenols and Ethers",
        topics: ["Alcohols"],
        cid: 702,
        has3D: true
    },

    {
        id: "phenol",
        name: "Phenol",
        formula: "C₆H₆O",
        chapter: "Alcohols, Phenols and Ethers",
        topics: ["Phenols"],
        cid: 996,
        has3D: true
    },


    // =========================
    // ALDEHYDES / KETONES
    // =========================

    {
        id: "formaldehyde",
        name: "Formaldehyde",
        formula: "CH₂O",
        chapter: "Aldehydes, Ketones and Carboxylic Acids",
        topics: ["Aldehydes"],
        cid: 712,
        has3D: true
    },

    {
        id: "acetaldehyde",
        name: "Acetaldehyde",
        formula: "C₂H₄O",
        chapter: "Aldehydes, Ketones and Carboxylic Acids",
        topics: ["Aldehydes"],
        cid: 177,
        has3D: true
    },

    {
        id: "acetone",
        name: "Acetone",
        formula: "C₃H₆O",
        chapter: "Aldehydes, Ketones and Carboxylic Acids",
        topics: ["Ketones"],
        cid: 180,
        has3D: true
    },

    {
        id: "acetic-acid",
        name: "Acetic Acid",
        formula: "C₂H₄O₂",
        chapter: "Aldehydes, Ketones and Carboxylic Acids",
        topics: ["Carboxylic Acids"],
        cid: 176,
        has3D: true
    },

    {
        id: "formic-acid",
        name: "Formic Acid",
        formula: "CH₂O₂",
        chapter: "Aldehydes, Ketones and Carboxylic Acids",
        topics: ["Carboxylic Acids"],
        cid: 284,
        has3D: true
    },


    // =========================
    // AMINES
    // =========================

    {
        id: "aniline",
        name: "Aniline",
        formula: "C₆H₇N",
        chapter: "Amines",
        topics: ["Aromatic Amines"],
        cid: 6115,
        has3D: true
    },


    // =========================
    // INORGANIC ACIDS
    // =========================

    {
        id: "hydrochloric-acid",
        name: "Hydrochloric Acid",
        formula: "HCl",
        chapter: "Inorganic Acids and Bases",
        topics: ["Strong Acids"],
        cid: 313,
        has3D: true
    },

    {
        id: "sulfuric-acid",
        name: "Sulfuric Acid",
        formula: "H₂SO₄",
        chapter: "Inorganic Acids and Bases",
        topics: ["Strong Acids"],
        cid: 1118,
        has3D: true
    },

    {
        id: "nitric-acid",
        name: "Nitric Acid",
        formula: "HNO₃",
        chapter: "Inorganic Acids and Bases",
        topics: ["Strong Acids"],
        cid: 944,
        has3D: true
    },

    {
        id: "phosphoric-acid",
        name: "Phosphoric Acid",
        formula: "H₃PO₄",
        chapter: "Inorganic Acids and Bases",
        topics: ["Oxoacids"],
        cid: 1004,
        has3D: true
    },

    {
        id: "carbonic-acid",
        name: "Carbonic Acid",
        formula: "H₂CO₃",
        chapter: "Inorganic Acids and Bases",
        topics: ["Oxoacids"],
        cid: 767,
        has3D: true
    },


    // =========================
    // INORGANIC BASES
    // =========================

    {
        id: "sodium-hydroxide",
        name: "Sodium Hydroxide",
        formula: "NaOH",
        chapter: "s-Block Elements",
        topics: ["Bases", "Alkali Metals"],
        cid: 14798,
        has3D: true
    },

    {
        id: "potassium-hydroxide",
        name: "Potassium Hydroxide",
        formula: "KOH",
        chapter: "s-Block Elements",
        topics: ["Bases", "Alkali Metals"],
        cid: 14797,
        has3D: true
    },

    {
        id: "calcium-hydroxide",
        name: "Calcium Hydroxide",
        formula: "Ca(OH)₂",
        chapter: "s-Block Elements",
        topics: ["Alkaline Earth Metals", "Bases"],
        cid: 6093208,
        has3D: true
    },

    {
        id: "magnesium-hydroxide",
        name: "Magnesium Hydroxide",
        formula: "Mg(OH)₂",
        chapter: "s-Block Elements",
        topics: ["Alkaline Earth Metals", "Bases"],
        cid: 73981,
        has3D: true
    },


    // =========================
    // IMPORTANT SALTS
    // =========================

    {
        id: "sodium-chloride",
        name: "Sodium Chloride",
        formula: "NaCl",
        chapter: "s-Block Elements",
        topics: ["Salts", "Alkali Metals"],
        cid: 5234,
        has3D: true
    },

    {
        id: "sodium-carbonate",
        name: "Sodium Carbonate",
        formula: "Na₂CO₃",
        chapter: "s-Block Elements",
        topics: ["Salts", "Washing Soda"],
        cid: 10340,
        has3D: true
    },

    {
        id: "sodium-bicarbonate",
        name: "Sodium Bicarbonate",
        formula: "NaHCO₃",
        chapter: "s-Block Elements",
        topics: ["Salts", "Baking Soda"],
        cid: 516892,
        has3D: true
    },

    {
        id: "calcium-carbonate",
        name: "Calcium Carbonate",
        formula: "CaCO₃",
        chapter: "s-Block Elements",
        topics: ["Salts", "Limestone", "Marble", "Chalk"],
        cid: 10112,
        has3D: true
    },

    {
        id: "calcium-oxide",
        name: "Calcium Oxide",
        formula: "CaO",
        chapter: "s-Block Elements",
        topics: ["Quicklime", "Alkaline Earth Metals"],
        cid: 14778,
        has3D: true
    },

    {
        id: "gypsum",
        name: "Gypsum",
        formula: "CaSO₄·2H₂O",
        chapter: "s-Block Elements",
        topics: ["Calcium Compounds"],
        cid: 24456,
        has3D: true
    },

    {
        id: "plaster-of-paris",
        name: "Plaster of Paris",
        formula: "CaSO₄·½H₂O",
        chapter: "s-Block Elements",
        topics: ["Calcium Compounds"],
        cid: 3033839,
        has3D: true
    },


    // =========================
    // IMPORTANT OXIDIZING AGENTS
    // =========================

    {
        id: "potassium-permanganate",
        name: "Potassium Permanganate",
        formula: "KMnO₄",
        chapter: "d- and f-Block Elements",
        topics: ["Oxidizing Agents", "Permanganate"],
        cid: 516875,
        has3D: true
    },

    {
        id: "potassium-dichromate",
        name: "Potassium Dichromate",
        formula: "K₂Cr₂O₇",
        chapter: "d- and f-Block Elements",
        topics: ["Oxidizing Agents", "Dichromate"],
        cid: 24502,
        has3D: true
    },

    {
        id: "hydrogen-peroxide",
        name: "Hydrogen Peroxide",
        formula: "H₂O₂",
        chapter: "p-Block Elements",
        topics: ["Peroxides", "Oxidizing Agents"],
        cid: 784
    },


    // =========================
    // p-BLOCK
    // =========================

    {
        id: "ammonia",
        name: "Ammonia",
        formula: "NH₃",
        chapter: "p-Block Elements",
        topics: ["Nitrogen", "Haber Process"],
        cid: 222,
        has3D: true
    },

    {
        id: "hydrazine",
        name: "Hydrazine",
        formula: "N₂H₄",
        chapter: "p-Block Elements",
        topics: ["Nitrogen Compounds", "Reducing Agents"],
        cid: 9321,
        has3D: true
    },

    {
        id: "phosphine",
        name: "Phosphine",
        formula: "PH₃",
        chapter: "p-Block Elements",
        topics: ["Phosphorus"],
        cid: 24404,
        has3D: true
    },

    {
        id: "nitrous-oxide",
        name: "Nitrous Oxide",
        formula: "N₂O",
        chapter: "p-Block Elements",
        topics: ["Nitrogen Oxides"],
        cid: 948,
        has3D: true
    },

    {
        id: "sulfur-dioxide",
        name: "Sulfur Dioxide",
        formula: "SO₂",
        chapter: "p-Block Elements",
        topics: ["Sulfur", "Oxides"],
        cid: 1119,
        has3D: true
    },

    {
        id: "silicon-dioxide",
        name: "Silicon Dioxide",
        formula: "SiO₂",
        chapter: "p-Block Elements",
        topics: ["Silicon", "Network Solids"],
        cid: 24261,
        has3D: true
    },

    {
        id: "silicon-carbide",
        name: "Silicon Carbide",
        formula: "SiC",
        chapter: "p-Block Elements",
        topics: ["Network Solids", "Carborundum"],
        cid: 9862089,
        has3D: true
    },


    // =========================
    // OXOACIDS
    // =========================

    {
        id: "hypophosphorous-acid",
        name: "Hypophosphorous Acid",
        formula: "H₃PO₂",
        chapter: "p-Block Elements",
        topics: ["Phosphorus Oxoacids"],
        cid: 3085123,
        has3D: true
    },

    {
        id: "orthophosphorous-acid",
        name: "Orthophosphorous Acid",
        formula: "H₃PO₃",
        chapter: "p-Block Elements",
        topics: ["Phosphorus Oxoacids"],
        cid: 107909,
        has3D: true
    },


    // =========================
    // TRANSITION METAL COMPOUNDS
    // =========================

    {
        id: "copper-sulfate",
        name: "Copper(II) Sulfate",
        formula: "CuSO₄",
        chapter: "d- and f-Block Elements",
        topics: ["Copper Compounds", "Blue Vitriol"],
        cid: 24462,
        has3D: true
    },

    {
        id: "ferrous-sulfate",
        name: "Iron(II) Sulfate",
        formula: "FeSO₄",
        chapter: "d- and f-Block Elements",
        topics: ["Iron Compounds", "Green Vitriol"],
        cid: 24393,
        has3D: true
    },

    {
        id: "zinc-sulfate",
        name: "Zinc Sulfate",
        formula: "ZnSO₄",
        chapter: "d- and f-Block Elements",
        topics: ["Zinc Compounds", "White Vitriol"],
        cid: 24424,
        has3D: true
    },

    {
        id: "silver-nitrate",
        name: "Silver Nitrate",
        formula: "AgNO₃",
        chapter: "d- and f-Block Elements",
        topics: ["Silver Compounds", "Tollens Test"],
        cid: 24470,
        has3D: true
    },


    // =========================
    // COORDINATION COMPOUNDS
    // =========================

    {
        id: "cisplatin",
        name: "Cisplatin",
        formula: "cis-[PtCl₂(NH₃)₂]",
        chapter: "Coordination Compounds",
        topics: ["Coordination Chemistry", "Medicinal Chemistry"],
        cid: 441203,
        has3D: true
    },

    {
        id: "wilkinson-catalyst",
        name: "Wilkinson's Catalyst",
        formula: "[RhCl(PPh₃)₃]",
        chapter: "Coordination Compounds",
        topics: ["Organometallic Chemistry", "Catalysis"],
        cid: 98127,
        has3D: true
    },


    // =========================
    // BIOMOLECULES
    // =========================

    {
        id: "glucose",
        name: "Glucose",
        formula: "C₆H₁₂O₆",
        chapter: "Biomolecules",
        topics: ["Monosaccharides", "Carbohydrates"],
        cid: 5793,
        has3D: true
    },

    {
        id: "fructose",
        name: "Fructose",
        formula: "C₆H₁₂O₆",
        chapter: "Biomolecules",
        topics: ["Monosaccharides", "Carbohydrates"],
        cid: 5984,
        has3D: true
    },

    {
        id: "sucrose",
        name: "Sucrose",
        formula: "C₁₂H₂₂O₁₁",
        chapter: "Biomolecules",
        topics: ["Disaccharides", "Carbohydrates"],
        cid: 5988,
        has3D: true
    },

    {
        id: "urea",
        name: "Urea",
        formula: "CH₄N₂O",
        chapter: "Biomolecules",
        topics: ["Nitrogen Compounds"],
        cid: 1176,
        has3D: true
    },


    // =========================
    // HALOGEN COMPOUNDS
    // =========================

    {
        id: "chloroform",
        name: "Chloroform",
        formula: "CHCl₃",
        chapter: "Haloalkanes and Haloarenes",
        topics: ["Haloalkanes"],
        cid: 6212,
        has3D: true
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
                molecule
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

async function loadMoleculeFromPubChem(molecule) {

    const cid = molecule.cid;

    console.log(
        "Loading molecule:",
        molecule.name,
        "CID:",
        cid
    );


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
        molecule.name;
}

if (formulaElement) {
    formulaElement.textContent =
        molecule.formula;
}

if (infoFormulaElement) {
    infoFormulaElement.textContent =
        molecule.formula;
}

if (cidElement) {
    cidElement.textContent =
        molecule.cid;
}

console.log(
    `${molecule.name} loaded successfully.`
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
