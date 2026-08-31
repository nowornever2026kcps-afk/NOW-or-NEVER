/*
 * NOW-or-NEVER — Interactive Periodic Table
 * Converted from the original Python CustomTkinter program.
 *
 * Features:
 * - Interactive periodic table
 * - Search
 * - Category filters
 * - Element information panel
 * - Atomic radius graph
 * - Electronegativity graph
 * - NEET-focused revision notes
 * - JEE-focused revision notes
 * - Responsive design
 */

/* =========================================================
   ELEMENT DATA
   ========================================================= */

const PT_ELEMENTS = [
  {
    symbol: "H",
    Name: "Hydrogen",
    "Atomic Number": "1",
    Symbol: "H",
    "Short EC": "1s¹",
    "Atomic Radius": "37 pm",
    "Electronegativity": "2.20",
    Type: "Nonmetal",
    "State at STP": "Gas",
    atomicNumber: 1,
    atomicRadiusPm: 37,
    electronegativity: 2.20,
    group: 1,
    period: 1,
    block: "s",
    examFocus:
      "Hydrogen bonding, redox behavior, hydrides, isotopes and its special position in the periodic table.",
    tags: ["s-block", "Nonmetal", "High-yield concept"]
  },

  {
    symbol: "He",
    Name: "Helium",
    "Atomic Number": "2",
    Symbol: "He",
    "Short EC": "1s²",
    "Atomic Radius": "32 pm",
    "Electronegativity": "—",
    Type: "Noble Gas",
    "State at STP": "Gas",
    atomicNumber: 2,
    atomicRadiusPm: 32,
    electronegativity: null,
    group: 18,
    period: 1,
    block: "s",
    examFocus:
      "Noble-gas configuration, chemical inertness and comparison of atomic size and ionisation energy.",
    tags: ["s-block", "Noble gas"]
  },

  {
    symbol: "Li",
    Name: "Lithium",
    "Atomic Number": "3",
    Symbol: "Li",
    "Short EC": "[He] 2s¹",
    "Atomic Radius": "152 pm",
    "Electronegativity": "0.98",
    Type: "Metal",
    "State at STP": "Solid",
    atomicNumber: 3,
    atomicRadiusPm: 152,
    electronegativity: 0.98,
    group: 1,
    period: 2,
    block: "s",
    examFocus:
      "Alkali-metal trends, anomalous behavior, diagonal relationship with Mg and important Li compounds.",
    tags: ["s-block", "Metal", "High-yield concept"]
  },

  {
    symbol: "Be",
    Name: "Beryllium",
    "Atomic Number": "4",
    Symbol: "Be",
    "Short EC": "[He] 2s²",
    "Atomic Radius": "112 pm",
    "Electronegativity": "1.57",
    Type: "Metal",
    "State at STP": "Solid",
    atomicNumber: 4,
    atomicRadiusPm: 112,
    electronegativity: 1.57,
    group: 2,
    period: 2,
    block: "s",
    examFocus:
      "Diagonal relationship with Al, amphoteric BeO/Be(OH)₂ and anomalous Group-2 behavior.",
    tags: ["s-block", "Metal", "High-yield concept"]
  },

  {
    symbol: "B",
    Name: "Boron",
    "Atomic Number": "5",
    Symbol: "B",
    "Short EC": "[He] 2s² 2p¹",
    "Atomic Radius": "85 pm",
    "Electronegativity": "2.04",
    Type: "Metalloid",
    "State at STP": "Solid",
    atomicNumber: 5,
    atomicRadiusPm: 85,
    electronegativity: 2.04,
    group: 13,
    period: 2,
    block: "p",
    examFocus:
      "Electron-deficient compounds, borax, boric acid, diborane and anomalous behavior.",
    tags: ["p-block", "Metalloid", "High-yield concept"]
  },

  {
    symbol: "C",
    Name: "Carbon",
    "Atomic Number": "6",
    Symbol: "C",
    "Short EC": "[He] 2s² 2p²",
    "Atomic Radius": "77 pm",
    "Electronegativity": "2.55",
    Type: "Nonmetal",
    "State at STP": "Solid",
    atomicNumber: 6,
    atomicRadiusPm: 77,
    electronegativity: 2.55,
    group: 14,
    period: 2,
    block: "p",
    examFocus:
      "Hybridisation, allotropes, catenation, CO/CO₂ and important organic-chemistry connections.",
    tags: ["p-block", "Nonmetal", "High-yield concept"]
  },

  {
    symbol: "N",
    Name: "Nitrogen",
    "Atomic Number": "7",
    Symbol: "N",
    "Short EC": "[He] 2s² 2p³",
    "Atomic Radius": "75 pm",
    "Electronegativity": "3.04",
    Type: "Nonmetal",
    "State at STP": "Gas",
    atomicNumber: 7,
    atomicRadiusPm: 75,
    electronegativity: 3.04,
    group: 15,
    period: 2,
    block: "p",
    examFocus:
      "NH₃, HNO₃, oxidation states, nitrogen oxides and anomalous Group-15 behavior.",
    tags: ["p-block", "Nonmetal", "High-yield concept"]
  },

  {
    symbol: "O",
    Name: "Oxygen",
    "Atomic Number": "8",
    Symbol: "O",
    "Short EC": "[He] 2s² 2p⁴",
    "Atomic Radius": "73 pm",
    "Electronegativity": "3.44",
    Type: "Nonmetal",
    "State at STP": "Gas",
    atomicNumber: 8,
    atomicRadiusPm: 73,
    electronegativity: 3.44,
    group: 16,
    period: 2,
    block: "p",
    examFocus:
      "Oxides, ozone, oxygen-family trends and oxidation/reduction concepts.",
    tags: ["p-block", "Nonmetal", "High-yield concept"]
  },

  {
    symbol: "F",
    Name: "Fluorine",
    "Atomic Number": "9",
    Symbol: "F",
    "Short EC": "[He] 2s² 2p⁵",
    "Atomic Radius": "72 pm",
    "Electronegativity": "3.98",
    Type: "Nonmetal",
    "State at STP": "Gas",
    atomicNumber: 9,
    atomicRadiusPm: 72,
    electronegativity: 3.98,
    group: 17,
    period: 2,
    block: "p",
    examFocus:
      "Highest electronegativity, halogen trends, HF and fluoride chemistry.",
    tags: ["p-block", "Nonmetal", "High-yield concept"]
  },

  {
    symbol: "Ne",
    Name: "Neon",
    "Atomic Number": "10",
    Symbol: "Ne",
    "Short EC": "[He] 2s² 2p⁶",
    "Atomic Radius": "69 pm",
    "Electronegativity": "—",
    Type: "Noble Gas",
    "State at STP": "Gas",
    atomicNumber: 10,
    atomicRadiusPm: 69,
    electronegativity: null,
    group: 18,
    period: 2,
    block: "p",
    examFocus:
      "Complete valence shell, noble-gas stability and periodic-trend comparisons.",
    tags: ["p-block", "Noble gas"]
  },

  {
    symbol: "Na",
    Name: "Sodium",
    "Atomic Number": "11",
    Symbol: "Na",
    "Short EC": "[Ne] 3s¹",
    "Atomic Radius": "186 pm",
    "Electronegativity": "0.93",
    Type: "Metal",
    "State at STP": "Solid",
    atomicNumber: 11,
    atomicRadiusPm: 186,
    electronegativity: 0.93,
    group: 1,
    period: 3,
    block: "s",
    examFocus:
      "NaOH, Na₂CO₃, NaHCO₃, flame test and alkali-metal trends.",
    tags: ["s-block", "Metal", "High-yield concept"]
  },

  {
    symbol: "Mg",
    Name: "Magnesium",
    "Atomic Number": "12",
    Symbol: "Mg",
    "Short EC": "[Ne] 3s²",
    "Atomic Radius": "160 pm",
    "Electronegativity": "1.31",
    Type: "Metal",
    "State at STP": "Solid",
    atomicNumber: 12,
    atomicRadiusPm: 160,
    electronegativity: 1.31,
    group: 2,
    period: 3,
    block: "s",
    examFocus:
      "Diagonal relationship with Li, Mg compounds and Group-2 trends.",
    tags: ["s-block", "Metal"]
  },

  {
    symbol: "Al",
    Name: "Aluminium",
    "Atomic Number": "13",
    Symbol: "Al",
    "Short EC": "[Ne] 3s² 3p¹",
    "Atomic Radius": "143 pm",
    "Electronegativity": "1.61",
    Type: "Metal",
    "State at STP": "Solid",
    atomicNumber: 13,
    atomicRadiusPm: 143,
    electronegativity: 1.61,
    group: 13,
    period: 3,
    block: "p",
    examFocus:
      "Amphoterism, Al₂O₃/Al(OH)₃, extraction and acid/base reactions.",
    tags: ["p-block", "Metal", "High-yield concept"]
  },

  {
    symbol: "Si",
    Name: "Silicon",
    "Atomic Number": "14",
    Symbol: "Si",
    "Short EC": "[Ne] 3s² 3p²",
    "Atomic Radius": "117 pm",
    "Electronegativity": "1.90",
    Type: "Metalloid",
    "State at STP": "Solid",
    atomicNumber: 14,
    atomicRadiusPm: 117,
    electronegativity: 1.90,
    group: 14,
    period: 3,
    block: "p",
    examFocus:
      "Silicates, silicones, SiO₂ and Group-14 trends.",
    tags: ["p-block", "Metalloid"]
  },

  {
    symbol: "P",
    Name: "Phosphorus",
    "Atomic Number": "15",
    Symbol: "P",
    "Short EC": "[Ne] 3s² 3p³",
    "Atomic Radius": "110 pm",
    "Electronegativity": "2.19",
    Type: "Nonmetal",
    "State at STP": "Solid",
    atomicNumber: 15,
    atomicRadiusPm: 110,
    electronegativity: 2.19,
    group: 15,
    period: 3,
    block: "p",
    examFocus:
      "Allotropes, H₃PO₄, PCl₃/PCl₅ and phosphorus oxoacids.",
    tags: ["p-block", "Nonmetal", "High-yield concept"]
  },

  {
    symbol: "S",
    Name: "Sulfur",
    "Atomic Number": "16",
    Symbol: "S",
    "Short EC": "[Ne] 3s² 3p⁴",
    "Atomic Radius": "103 pm",
    "Electronegativity": "2.58",
    Type: "Nonmetal",
    "State at STP": "Solid",
    atomicNumber: 16,
    atomicRadiusPm: 103,
    electronegativity: 2.58,
    group: 16,
    period: 3,
    block: "p",
    examFocus:
      "Allotropes, H₂SO₄, SO₂/SO₃ and oxidation states.",
    tags: ["p-block", "Nonmetal", "High-yield concept"]
  },

  {
    symbol: "Cl",
    Name: "Chlorine",
    "Atomic Number": "17",
    Symbol: "Cl",
    "Short EC": "[Ne] 3s² 3p⁵",
    "Atomic Radius": "99 pm",
    "Electronegativity": "3.16",
    Type: "Nonmetal",
    "State at STP": "Gas",
    atomicNumber: 17,
    atomicRadiusPm: 99,
    electronegativity: 3.16,
    group: 17,
    period: 3,
    block: "p",
    examFocus:
      "Halogen displacement, HCl, bleaching powder and chlorine oxoacids.",
    tags: ["p-block", "Nonmetal", "High-yield concept"]
  },

  {
    symbol: "Ar",
    Name: "Argon",
    "Atomic Number": "18",
    Symbol: "Ar",
    "Short EC": "[Ne] 3s² 3p⁶",
    "Atomic Radius": "97 pm",
    "Electronegativity": "—",
    Type: "Noble Gas",
    "State at STP": "Gas",
    atomicNumber: 18,
    atomicRadiusPm: 97,
    electronegativity: null,
    group: 18,
    period: 3,
    block: "p",
    examFocus:
      "Noble-gas configuration and comparison of atomic radius and ionisation energy.",
    tags: ["p-block", "Noble gas"]
  },

  {
    symbol: "K",
    Name: "Potassium",
    "Atomic Number": "19",
    Symbol: "K",
    "Short EC": "[Ar] 4s¹",
    "Atomic Radius": "227 pm",
    "Electronegativity": "0.82",
    Type: "Metal",
    "State at STP": "Solid",
    atomicNumber: 19,
    atomicRadiusPm: 227,
    electronegativity: 0.82,
    group: 1,
    period: 4,
    block: "s",
    examFocus:
      "Alkali-metal trends, superoxide formation and flame test.",
    tags: ["s-block", "Metal"]
  },

  {
    symbol: "Ca",
    Name: "Calcium",
    "Atomic Number": "20",
    Symbol: "Ca",
    "Short EC": "[Ar] 4s²",
    "Atomic Radius": "197 pm",
    "Electronegativity": "1.00",
    Type: "Metal",
    "State at STP": "Solid",
    atomicNumber: 20,
    atomicRadiusPm: 197,
    electronegativity: 1.00,
    group: 2,
    period: 4,
    block: "s",
    examFocus:
      "Hard water, lime cycle, calcium compounds and Group-2 trends.",
    tags: ["s-block", "Metal", "High-yield concept"]
  },

  {
    symbol: "Sc",
    Name: "Scandium",
    "Atomic Number": "21",
    Symbol: "Sc",
    "Short EC": "[Ar] 3d¹ 4s²",
    "Atomic Radius": "162 pm",
    "Electronegativity": "1.36",
    Type: "Metal",
    "State at STP": "Solid",
    atomicNumber: 21,
    atomicRadiusPm: 162,
    electronegativity: 1.36,
    group: 3,
    period: 4,
    block: "d",
    examFocus:
      "Transition-metal definition, electronic configuration and oxidation-state trends.",
    tags: ["d-block", "Metal"]
  },

  {
    symbol: "Ti",
    Name: "Titanium",
    "Atomic Number": "22",
    Symbol: "Ti",
    "Short EC": "[Ar] 3d² 4s²",
    "Atomic Radius": "147 pm",
    "Electronegativity": "1.54",
    Type: "Metal",
    "State at STP": "Solid",
    atomicNumber: 22,
    atomicRadiusPm: 147,
    electronegativity: 1.54,
    group: 4,
    period: 4,
    block: "d",
    examFocus:
      "Variable oxidation states and general transition-metal properties.",
    tags: ["d-block", "Metal"]
  },

  {
    symbol: "V",
    Name: "Vanadium",
    "Atomic Number": "23",
    Symbol: "V",
    "Short EC": "[Ar] 3d³ 4s²",
    "Atomic Radius": "134 pm",
    "Electronegativity": "1.63",
    Type: "Metal",
    "State at STP": "Solid",
    atomicNumber: 23,
    atomicRadiusPm: 134,
    electronegativity: 1.63,
    group: 5,
    period: 4,
    block: "d",
    examFocus:
      "Multiple oxidation states and transition-metal chemistry.",
    tags: ["d-block", "Metal"]
  },

  {
    symbol: "Cr",
    Name: "Chromium",
    "Atomic Number": "24",
    Symbol: "Cr",
    "Short EC": "[Ar] 3d⁵ 4s¹",
    "Atomic Radius": "128 pm",
    "Electronegativity": "1.66",
    Type: "Metal",
    "State at STP": "Solid",
    atomicNumber: 24,
    atomicRadiusPm: 128,
    electronegativity: 1.66,
    group: 6,
    period: 4,
    block: "d",
    examFocus:
      "Variable oxidation states, chromate/dichromate and redox chemistry.",
    tags: ["d-block", "Metal", "High-yield concept"]
  },

  {
    symbol: "Mn",
    Name: "Manganese",
    "Atomic Number": "25",
    Symbol: "Mn",
    "Short EC": "[Ar] 3d⁵ 4s²",
    "Atomic Radius": "127 pm",
    "Electronegativity": "1.55",
    Type: "Metal",
    "State at STP": "Solid",
    atomicNumber: 25,
    atomicRadiusPm: 127,
    electronegativity: 1.55,
    group: 7,
    period: 4,
    block: "d",
    examFocus:
      "Variable oxidation states, KMnO₄ and MnO₂ redox reactions.",
    tags: ["d-block", "Metal", "High-yield concept"]
  },

  {
    symbol: "Fe",
    Name: "Iron",
    "Atomic Number": "26",
    Symbol: "Fe",
    "Short EC": "[Ar] 3d⁶ 4s²",
    "Atomic Radius": "126 pm",
    "Electronegativity": "1.83",
    Type: "Metal",
    "State at STP": "Solid",
    atomicNumber: 26,
    atomicRadiusPm: 126,
    electronegativity: 1.83,
    group: 8,
    period: 4,
    block: "d",
    examFocus:
      "Fe²⁺/Fe³⁺ chemistry, coordination compounds, metallurgy and corrosion.",
    tags: ["d-block", "Metal", "High-yield concept"]
  },

  {
    symbol: "Co",
    Name: "Cobalt",
    "Atomic Number": "27",
    Symbol: "Co",
    "Short EC": "[Ar] 3d⁷ 4s²",
    "Atomic Radius": "125 pm",
    "Electronegativity": "1.88",
    Type: "Metal",
    "State at STP": "Solid",
    atomicNumber: 27,
    atomicRadiusPm: 125,
    electronegativity: 1.88,
    group: 9,
    period: 4,
    block: "d",
    examFocus:
      "Coordination compounds and transition-metal chemistry.",
    tags: ["d-block", "Metal"]
  },

  {
    symbol: "Ni",
    Name: "Nickel",
    "Atomic Number": "28",
    Symbol: "Ni",
    "Short EC": "[Ar] 3d⁸ 4s²",
    "Atomic Radius": "124 pm",
    "Electronegativity": "1.91",
    Type: "Metal",
    "State at STP": "Solid",
    atomicNumber: 28,
    atomicRadiusPm: 124,
    electronegativity: 1.91,
    group: 10,
    period: 4,
    block: "d",
    examFocus:
      "Coordination chemistry, catalytic behavior and transition trends.",
    tags: ["d-block", "Metal"]
  },

  {
    symbol: "Cu",
    Name: "Copper",
    "Atomic Number": "29",
    Symbol: "Cu",
    "Short EC": "[Ar] 3d¹⁰ 4s¹",
    "Atomic Radius": "128 pm",
    "Electronegativity": "1.90",
    Type: "Metal",
    "State at STP": "Solid",
    atomicNumber: 29,
    atomicRadiusPm: 128,
    electronegativity: 1.90,
    group: 11,
    period: 4,
    block: "d",
    examFocus:
      "Cu⁺/Cu²⁺, coordination compounds, metallurgy and qualitative analysis.",
    tags: ["d-block", "Metal", "High-yield concept"]
  },

  {
    symbol: "Zn",
    Name: "Zinc",
    "Atomic Number": "30",
    Symbol: "Zn",
    "Short EC": "[Ar] 3d¹⁰ 4s²",
    "Atomic Radius": "134 pm",
    "Electronegativity": "1.65",
    Type: "Metal",
    "State at STP": "Solid",
    atomicNumber: 30,
    atomicRadiusPm: 134,
    electronegativity: 1.65,
    group: 12,
    period: 4,
    block: "d",
    examFocus:
      "Zn²⁺, amphoterism of ZnO/Zn(OH)₂ and metallurgy.",
    tags: ["d-block", "Metal", "High-yield concept"]
  },

  {
    symbol: "Ga",
    Name: "Gallium",
    "Atomic Number": "31",
    Symbol: "Ga",
    "Short EC": "[Ar] 3d¹⁰ 4s² 4p¹",
    "Atomic Radius": "135 pm",
    "Electronegativity": "1.81",
    Type: "Metal",
    "State at STP": "Solid",
    atomicNumber: 31,
    atomicRadiusPm: 135,
    electronegativity: 1.81,
    group: 13,
    period: 4,
    block: "p",
    examFocus:
      "Group-13 trends and comparison with Al.",
    tags: ["p-block", "Metal"]
  },

  {
    symbol: "Ge",
    Name: "Germanium",
    "Atomic Number": "32",
    Symbol: "Ge",
    "Short EC": "[Ar] 3d¹⁰ 4s² 4p²",
    "Atomic Radius": "122 pm",
    "Electronegativity": "2.01",
    Type: "Metalloid",
    "State at STP": "Solid",
    atomicNumber: 32,
    atomicRadiusPm: 122,
    electronegativity: 2.01,
    group: 14,
    period: 4,
    block: "p",
    examFocus:
      "Group-14 trends, catenation and metallic/nonmetallic character.",
    tags: ["p-block", "Metalloid"]
  },

  {
    symbol: "As",
    Name: "Arsenic",
    "Atomic Number": "33",
    Symbol: "As",
    "Short EC": "[Ar] 3d¹⁰ 4s² 4p³",
    "Atomic Radius": "119 pm",
    "Electronegativity": "2.18",
    Type: "Metalloid",
    "State at STP": "Solid",
    atomicNumber: 33,
    atomicRadiusPm: 119,
    electronegativity: 2.18,
    group: 15,
    period: 4,
    block: "p",
    examFocus:
      "Group-15 trends and oxidation-state stability.",
    tags: ["p-block", "Metalloid"]
  },

  {
    symbol: "Se",
    Name: "Selenium",
    "Atomic Number": "34",
    Symbol: "Se",
    "Short EC": "[Ar] 3d¹⁰ 4s² 4p⁴",
    "Atomic Radius": "116 pm",
    "Electronegativity": "2.55",
    Type: "Nonmetal",
    "State at STP": "Solid",
    atomicNumber: 34,
    atomicRadiusPm: 116,
    electronegativity: 2.55,
    group: 16,
    period: 4,
    block: "p",
    examFocus:
      "Group-16 trends and oxidation states.",
    tags: ["p-block", "Nonmetal"]
  },

  {
    symbol: "Br",
    Name: "Bromine",
    "Atomic Number": "35",
    Symbol: "Br",
    "Short EC": "[Ar] 3d¹⁰ 4s² 4p⁵",
    "Atomic Radius": "114 pm",
    "Electronegativity": "2.96",
    Type: "Nonmetal",
    "State at STP": "Liquid",
    atomicNumber: 35,
    atomicRadiusPm: 114,
    electronegativity: 2.96,
    group: 17,
    period: 4,
    block: "p",
    examFocus:
      "Halogen trends and displacement/oxidising behavior.",
    tags: ["p-block", "Nonmetal"]
  },

  {
    symbol: "Kr",
    Name: "Krypton",
    "Atomic Number": "36",
    Symbol: "Kr",
    "Short EC": "[Ar] 3d¹⁰ 4s² 4p⁶",
    "Atomic Radius": "110 pm",
    "Electronegativity": "3.00",
    Type: "Noble Gas",
    "State at STP": "Gas",
    atomicNumber: 36,
    atomicRadiusPm: 110,
    electronegativity: 3.00,
    group: 18,
    period: 4,
    block: "p",
    examFocus:
      "Noble gases and periodic trends.",
    tags: ["p-block", "Noble gas"]
  },

  {
    symbol: "Rb",
    Name: "Rubidium",
    "Atomic Number": "37",
    Symbol: "Rb",
    "Short EC": "[Kr] 5s¹",
    "Atomic Radius": "248 pm",
    "Electronegativity": "0.82",
    Type: "Metal",
    "State at STP": "Solid",
    atomicNumber: 37,
    atomicRadiusPm: 248,
    electronegativity: 0.82,
    group: 1,
    period: 5,
    block: "s",
    examFocus:
      "Alkali-metal trends and reactivity.",
    tags: ["s-block", "Metal"]
  },

  {
    symbol: "Sr",
    Name: "Strontium",
    "Atomic Number": "38",
    Symbol: "Sr",
    "Short EC": "[Kr] 5s²",
    "Atomic Radius": "219 pm",
    "Electronegativity": "0.95",
    Type: "Metal",
    "State at STP": "Solid",
    atomicNumber: 38,
    atomicRadiusPm: 219,
    electronegativity: 0.95,
    group: 2,
    period: 5,
    block: "s",
    examFocus:
      "Group-2 trends and solubility patterns.",
    tags: ["s-block", "Metal"]
  },

  {
    symbol: "Y",
    Name: "Yttrium",
    "Atomic Number": "39",
    Symbol: "Y",
    "Short EC": "[Kr] 4d¹ 5s²",
    "Atomic Radius": "180 pm",
    "Electronegativity": "1.22",
    Type: "Metal",
    "State at STP": "Solid",
    atomicNumber: 39,
    atomicRadiusPm: 180,
    electronegativity: 1.22,
    group: 3,
    period: 5,
    block: "d",
    examFocus:
      "Transition-metal placement and oxidation states.",
    tags: ["d-block", "Metal"]
  },

  {
    symbol: "Zr",
    Name: "Zirconium",
    "Atomic Number": "40",
    Symbol: "Zr",
    "Short EC": "[Kr] 4d² 5s²",
    "Atomic Radius": "160 pm",
    "Electronegativity": "1.33",
    Type: "Metal",
    "State at STP": "Solid",
    atomicNumber: 40,
    atomicRadiusPm: 160,
    electronegativity: 1.33,
    group: 4,
    period: 5,
    block: "d",
    examFocus:
      "Transition-metal trends.",
    tags: ["d-block", "Metal"]
  },

  {
    symbol: "Nb",
    Name: "Niobium",
    "Atomic Number": "41",
    Symbol: "Nb",
    "Short EC": "[Kr] 4d⁴ 5s¹",
    "Atomic Radius": "146 pm",
    "Electronegativity": "1.60",
    Type: "Metal",
    "State at STP": "Solid",
    atomicNumber: 41,
    atomicRadiusPm: 146,
    electronegativity: 1.60,
    group: 5,
    period: 5,
    block: "d",
    examFocus:
      "Transition-metal electronic configuration and oxidation states.",
    tags: ["d-block", "Metal"]
  },

  {
    symbol: "Mo",
    Name: "Molybdenum",
    "Atomic Number": "42",
    Symbol: "Mo",
    "Short EC": "[Kr] 4d⁵ 5s¹",
    "Atomic Radius": "139 pm",
    "Electronegativity": "2.16",
    Type: "Metal",
    "State at STP": "Solid",
    atomicNumber: 42,
    atomicRadiusPm: 139,
    electronegativity: 2.16,
    group: 6,
    period: 5,
    block: "d",
    examFocus:
      "Variable oxidation states and transition-metal chemistry.",
    tags: ["d-block", "Metal"]
  },

  {
    symbol: "Tc",
    Name: "Technetium",
    "Atomic Number": "43",
    Symbol: "Tc",
    "Short EC": "[Kr] 4d⁵ 5s²",
    "Atomic Radius": "136 pm",
    "Electronegativity": "1.90",
    Type: "Metal",
    "State at STP": "Solid",
    atomicNumber: 43,
    atomicRadiusPm: 136,
    electronegativity: 1.90,
    group: 7,
    period: 5,
    block: "d",
    examFocus:
      "Transition-metal trends.",
    tags: ["d-block", "Metal"]
  },

  {
    symbol: "Ru",
    Name: "Ruthenium",
    "Atomic Number": "44",
    Symbol: "Ru",
    "Short EC": "[Kr] 4d⁷ 5s¹",
    "Atomic Radius": "134 pm",
    "Electronegativity": "2.20",
    Type: "Metal",
    "State at STP": "Solid",
    atomicNumber: 44,
    atomicRadiusPm: 134,
    electronegativity: 2.20,
    group: 8,
    period: 5,
    block: "d",
    examFocus:
      "Transition-metal chemistry and oxidation states.",
    tags: ["d-block", "Metal"]
  },

  {
    symbol: "Rh",
    Name: "Rhodium",
    "Atomic Number": "45",
    Symbol: "Rh",
    "Short EC": "[Kr] 4d⁸ 5s¹",
    "Atomic Radius": "134 pm",
    "Electronegativity": "2.28",
    Type: "Metal",
    "State at STP": "Solid",
    atomicNumber: 45,
    atomicRadiusPm: 134,
    electronegativity: 2.28,
    group: 9,
    period: 5,
    block: "d",
    examFocus:
      "Transition-metal properties.",
    tags: ["d-block", "Metal"]
  },

  {
    symbol: "Pd",
    Name: "Palladium",
    "Atomic Number": "46",
    Symbol: "Pd",
    "Short EC": "[Kr] 4d¹⁰",
    "Atomic Radius": "137 pm",
    "Electronegativity": "2.20",
    Type: "Metal",
    "State at STP": "Solid",
    atomicNumber: 46,
    atomicRadiusPm: 137,
    electronegativity: 2.20,
    group: 10,
    period: 5,
    block: "d",
    examFocus:
      "Transition-metal chemistry and catalytic behavior.",
    tags: ["d-block", "Metal"]
  },

  {
    symbol: "Ag",
    Name: "Silver",
    "Atomic Number": "47",
    Symbol: "Ag",
    "Short EC": "[Kr] 4d¹⁰ 5s¹",
    "Atomic Radius": "144 pm",
    "Electronegativity": "1.93",
    Type: "Metal",
    "State at STP": "Solid",
    atomicNumber: 47,
    atomicRadiusPm: 144,
    electronegativity: 1.93,
    group: 11,
    period: 5,
    block: "d",
    examFocus:
      "Ag⁺ chemistry, qualitative analysis and transition-metal trends.",
    tags: ["d-block", "Metal", "High-yield concept"]
  },

  {
    symbol: "Cd",
    Name: "Cadmium",
    "Atomic Number": "48",
    Symbol: "Cd",
    "Short EC": "[Kr] 4d¹⁰ 5s²",
    "Atomic Radius": "151 pm",
    "Electronegativity": "1.69",
    Type: "Metal",
    "State at STP": "Solid",
    atomicNumber: 48,
    atomicRadiusPm: 151,
    electronegativity: 1.69,
    group: 12,
    period: 5,
    block: "d",
    examFocus:
      "Group-12 trends.",
    tags: ["d-block", "Metal"]
  },

  {
    symbol: "In",
    Name: "Indium",
    "Atomic Number": "49",
    Symbol: "In",
    "Short EC": "[Kr] 4d¹⁰ 5s² 5p¹",
    "Atomic Radius": "167 pm",
    "Electronegativity": "1.78",
    Type: "Metal",
    "State at STP": "Solid",
    atomicNumber: 49,
    atomicRadiusPm: 167,
    electronegativity: 1.78,
    group: 13,
    period: 5,
    block: "p",
    examFocus:
      "Group-13 trends and inert-pair effect.",
    tags: ["p-block", "Metal"]
  },

  {
    symbol: "Sn",
    Name: "Tin",
    "Atomic Number": "50",
    Symbol: "Sn",
    "Short EC": "[Kr] 4d¹⁰ 5s² 5p²",
    "Atomic Radius": "140 pm",
    "Electronegativity": "1.96",
    Type: "Metal",
    "State at STP": "Solid",
    atomicNumber: 50,
    atomicRadiusPm: 140,
    electronegativity: 1.96,
    group: 14,
    period: 5,
    block: "p",
    examFocus:
      "Sn²⁺/Sn⁴⁺ and inert-pair effect.",
    tags: ["p-block", "Metal", "High-yield concept"]
  },

  {
    symbol: "Sb",
    Name: "Antimony",
    "Atomic Number": "51",
    Symbol: "Sb",
    "Short EC": "[Kr] 4d¹⁰ 5s² 5p³",
    "Atomic Radius": "140 pm",
    "Electronegativity": "2.05",
    Type: "Metalloid",
    "State at STP": "Solid",
    atomicNumber: 51,
    atomicRadiusPm: 140,
    electronegativity: 2.05,
    group: 15,
    period: 5,
    block: "p",
    examFocus:
      "Group-15 trends and oxidation-state stability.",
    tags: ["p-block", "Metalloid"]
  },

  {
    symbol: "Te",
    Name: "Tellurium",
    "Atomic Number": "52",
    Symbol: "Te",
    "Short EC": "[Kr] 4d¹⁰ 5s² 5p⁴",
    "Atomic Radius": "138 pm",
    "Electronegativity": "2.10",
    Type: "Metalloid",
    "State at STP": "Solid",
    atomicNumber: 52,
    atomicRadiusPm: 138,
    electronegativity: 2.10,
    group: 16,
    period: 5,
    block: "p",
    examFocus:
      "Group-16 trends and oxidation states.",
    tags: ["p-block", "Metalloid"]
  },

  {
    symbol: "I",
    Name: "Iodine",
    "Atomic Number": "53",
    Symbol: "I",
    "Short EC": "[Kr] 4d¹⁰ 5s² 5p⁵",
    "Atomic Radius": "133 pm",
    "Electronegativity": "2.66",
    Type: "Nonmetal",
    "State at STP": "Solid",
    atomicNumber: 53,
    atomicRadiusPm: 133,
    electronegativity: 2.66,
    group: 17,
    period: 5,
    block: "p",
    examFocus:
      "Iodine/iodide chemistry, halogen trends and qualitative tests.",
    tags: ["p-block", "Nonmetal", "High-yield concept"]
  },

  {
    symbol: "Xe",
    Name: "Xenon",
    "Atomic Number": "54",
    Symbol: "Xe",
    "Short EC": "[Kr] 4d¹⁰ 5s² 5p⁶",
    "Atomic Radius": "130 pm",
    "Electronegativity": "2.60",
    Type: "Noble Gas",
    "State at STP": "Gas",
    atomicNumber: 54,
    atomicRadiusPm: 130,
    electronegativity: 2.60,
    group: 18,
    period: 5,
    block: "p",
    examFocus:
      "Noble-gas compounds and oxidation states.",
    tags: ["p-block", "Noble gas", "High-yield concept"]
  },

  {
    symbol: "Cs",
    Name: "Cesium",
    "Atomic Number": "55",
    Symbol: "Cs",
    "Short EC": "[Xe] 6s¹",
    "Atomic Radius": "265 pm",
    "Electronegativity": "0.79",
    Type: "Metal",
    "State at STP": "Solid",
    atomicNumber: 55,
    atomicRadiusPm: 265,
    electronegativity: 0.79,
    group: 1,
    period: 6,
    block: "s",
    examFocus:
      "Large atomic size, low ionisation energy and alkali-metal reactivity.",
    tags: ["s-block", "Metal"]
  },

  {
    symbol: "Ba",
    Name: "Barium",
    "Atomic Number": "56",
    Symbol: "Ba",
    "Short EC": "[Xe] 6s²",
    "Atomic Radius": "222 pm",
    "Electronegativity": "0.89",
    Type: "Metal",
    "State at STP": "Solid",
    atomicNumber: 56,
    atomicRadiusPm: 222,
    electronegativity: 0.89,
    group: 2,
    period: 6,
    block: "s",
    examFocus:
      "Group-2 trends and barium compounds.",
    tags: ["s-block", "Metal"]
  },

  {
    symbol: "La",
    Name: "Lanthanum",
    "Atomic Number": "57",
    Symbol: "La",
    "Short EC": "[Xe] 5d¹ 6s²",
    "Atomic Radius": "187 pm",
    "Electronegativity": "1.10",
    Type: "Metal",
    "State at STP": "Solid",
    atomicNumber: 57,
    atomicRadiusPm: 187,
    electronegativity: 1.10,
    group: null,
    period: 6,
    block: "f",
    examFocus:
      "Lanthanides, oxidation states and lanthanide contraction.",
    tags: ["f-block", "Metal"]
  },

  {
    symbol: "Ce",
    Name: "Cerium",
    "Atomic Number": "58",
    Symbol: "Ce",
    "Short EC": "[Xe] 4f¹ 5d¹ 6s²",
    "Atomic Radius": "182 pm",
    "Electronegativity": "1.12",
    Type: "Metal",
    "State at STP": "Solid",
    atomicNumber: 58,
    atomicRadiusPm: 182,
    electronegativity: 1.12,
    group: null,
    period: 6,
    block: "f",
    examFocus:
      "Lanthanide oxidation states and contraction.",
    tags: ["f-block", "Metal"]
  },

  {
    symbol: "Pr",
    Name: "Praseodymium",
    "Atomic Number": "59",
    Symbol: "Pr",
    "Short EC": "[Xe] 4f³ 6s²",
    "Atomic Radius": "182 pm",
    "Electronegativity": "1.13",
    Type: "Metal",
    "State at STP": "Solid",
    atomicNumber: 59,
    atomicRadiusPm: 182,
    electronegativity: 1.13,
    group: null,
    period: 6,
    block: "f",
    examFocus:
      "Lanthanide trends and oxidation states.",
    tags: ["f-block", "Metal"]
  },

  {
    symbol: "Nd",
    Name: "Neodymium",
    "Atomic Number": "60",
    Symbol: "Nd",
    "Short EC": "[Xe] 4f⁴ 6s²",
    "Atomic Radius": "181 pm",
    "Electronegativity": "1.14",
    Type: "Metal",
    "State at STP": "Solid",
    atomicNumber: 60,
    atomicRadiusPm: 181,
    electronegativity: 1.14,
    group: null,
    period: 6,
    block: "f",
    examFocus:
      "Lanthanide contraction and common oxidation states.",
    tags: ["f-block", "Metal"]
  },

  {
    symbol: "Pm",
    Name: "Promethium",
    "Atomic Number": "61",
    Symbol: "Pm",
    "Short EC": "[Xe] 4f⁵ 6s²",
    "Atomic Radius": "183 pm",
    "Electronegativity": "1.13",
    Type: "Metal",
    "State at STP": "Solid",
    atomicNumber: 61,
    atomicRadiusPm: 183,
    electronegativity: 1.13,
    group: null,
    period: 6,
    block: "f",
    examFocus:
      "Lanthanide series and electronic configuration.",
    tags: ["f-block", "Metal"]
  },

  {
    symbol: "Sm",
    Name: "Samarium",
    "Atomic Number": "62",
    Symbol: "Sm",
    "Short EC": "[Xe] 4f⁶ 6s²",
    "Atomic Radius": "180 pm",
    "Electronegativity": "1.17",
    Type: "Metal",
    "State at STP": "Solid",
    atomicNumber: 62,
    atomicRadiusPm: 180,
    electronegativity: 1.17,
    group: null,
    period: 6,
    block: "f",
    examFocus:
      "Lanthanide contraction and oxidation states.",
    tags: ["f-block", "Metal"]
  },

  {
    symbol: "Eu",
    Name: "Europium",
    "Atomic Number": "63",
    Symbol": "Eu",
    "Short EC": "[Xe] 4f⁷ 6s²",
    "Atomic Radius": "180 pm",
    "Electronegativity": "1.20",
    Type: "Metal",
    "State at STP": "Solid",
    atomicNumber: 63,
    atomicRadiusPm: 180,
    electronegativity: 1.20,
    group: null,
    period: 6,
    block: "f",
    examFocus:
      "Stable half-filled f⁷ configuration and lanthanide trends.",
    tags: ["f-block", "Metal"]
  },

  {
    symbol: "Gd",
    Name: "Gadolinium",
    "Atomic Number": "64",
    Symbol: "Gd",
    "Short EC": "[Xe] 4f⁷ 5d¹ 6s²",
    "Atomic Radius": "180 pm",
    "Electronegativity": "1.20",
    Type: "Metal",
    "State at STP": "Solid",
    atomicNumber: 64,
    atomicRadiusPm: 180,
    electronegativity: 1.20,
    group: null,
    period: 6,
    block: "f",
    examFocus:
      "Lanthanide electronic configuration and contraction.",
    tags: ["f-block", "Metal"]
  },

  {
    symbol: "Tb",
    Name: "Terbium",
    "Atomic Number": "65",
    Symbol: "Tb",
    "Short EC": "[Xe] 4f⁹ 6s²",
    "Atomic Radius": "177 pm",
    "Electronegativity": "1.10",
    Type: "Metal",
    "State at STP": "Solid",
    atomicNumber: 65,
    atomicRadiusPm: 177,
    electronegativity: 1.10,
    group: null,
    period: 6,
    block: "f",
    examFocus:
      "Lanthanide trends.",
    tags: ["f-block", "Metal"]
  },

  {
    symbol: "Dy",
    Name: "Dysprosium",
    "Atomic Number": "66",
    Symbol: "Dy",
    "Short EC": "[Xe] 4f¹⁰ 6s²",
    "Atomic Radius": "178 pm",
    "Electronegativity": "1.22",
    Type: "Metal",
    "State at STP": "Solid",
    atomicNumber: 66,
    atomicRadiusPm: 178,
    electronegativity: 1.22,
    group: null,
    period: 6,
    block: "f",
    examFocus:
      "Lanthanide contraction.",
    tags: ["f-block", "Metal"]
  },

  {
    symbol: "Ho",
    Name: "Holmium",
    "Atomic Number": "67",
    Symbol: "Ho",
    "Short EC": "[Xe] 4f¹¹ 6s²",
    "Atomic Radius": "176 pm",
    "Electronegativity": "1.23",
    Type: "Metal",
    "State at STP": "Solid",
    atomicNumber: 67,
    atomicRadiusPm: 176,
    electronegativity: 1.23,
    group: null,
    period: 6,
    block: "f",
    examFocus:
      "Lanthanide series and contraction.",
    tags: ["f-block", "Metal"]
  },

  {
    symbol: "Er",
    Name: "Erbium",
    "Atomic Number": "68",
    Symbol: "Er",
    "Short EC": "[Xe] 4f¹² 6s²",
    "Atomic Radius": "176 pm",
    "Electronegativity": "1.24",
    Type: "Metal",
    "State at STP": "Solid",
    atomicNumber: 68,
    atomicRadiusPm: 176,
    electronegativity: 1.24,
    group: null,
    period: 6,
    block: "f",
    examFocus:
      "Lanthanide contraction.",
    tags: ["f-block", "Metal"]
  },

  {
    symbol: "Tm",
    Name: "Thulium",
    "Atomic Number": "69",
    Symbol: "Tm",
    "Short EC": "[Xe] 4f¹³ 6s²",
    "Atomic Radius": "176 pm",
    "Electronegativity": "1.25",
    Type: "Metal",
    "State at STP": "Solid",
    atomicNumber: 69,
    atomicRadiusPm: 176,
    electronegativity: 1.25,
    group: null,
    period: 6,
    block: "f",
    examFocus:
      "Lanthanide series.",
    tags: ["f-block", "Metal"]
  },

  {
    symbol: "Yb",
    Name: "Ytterbium",
    "Atomic Number": "70",
    Symbol: "Yb",
    "Short EC": "[Xe] 4f¹⁴ 6s²",
    "Atomic Radius": "176 pm",
    "Electronegativity": "1.10",
    Type: "Metal",
    "State at STP": "Solid",
    atomicNumber: 70,
    atomicRadiusPm: 176,
    electronegativity: 1.10,
    group: null,
    period: 6,
    block: "f",
    examFocus:
      "Filled f-subshell and lanthanide trends.",
    tags: ["f-block", "Metal"]
  },

  {
    symbol: "Lu",
    Name: "Lutetium",
    "Atomic Number": "71",
    Symbol": "Lu",
    "Short EC": "[Xe] 4f¹⁴ 5d¹ 6s²",
    "Atomic Radius": "174 pm",
    "Electronegativity": "1.27",
    Type: "Metal",
    "State at STP": "Solid",
    atomicNumber: 71,
    atomicRadiusPm: 174,
    electronegativity: 1.27,
    group: null,
    period: 6,
    block: "f",
    examFocus:
      "End of lanthanide series and lanthanide contraction.",
    tags: ["f-block", "Metal"]
  },

  {
    symbol: "Hf",
    Name: "Hafnium",
    "Atomic Number": "72",
    Symbol: "Hf",
    "Short EC": "[Xe] 4f¹⁴ 5d² 6s²",
    "Atomic Radius": "159 pm",
    "Electronegativity": "1.30",
    Type: "Metal",
    "State at STP": "Solid",
    atomicNumber: 72,
    atomicRadiusPm: 159,
    electronegativity: 1.30,
    group: 4,
    period: 6,
    block: "d",
    examFocus:
      "Transition-metal trends and effects of lanthanide contraction.",
    tags: ["d-block", "Metal"]
  },

  {
    symbol: "Ta",
    Name: "Tantalum",
    "Atomic Number": "73",
    Symbol: "Ta",
    "Short EC": "[Xe] 4f¹⁴ 5d³ 6s²",
    "Atomic Radius": "146 pm",
    "Electronegativity": "1.50",
    Type: "Metal",
    "State at STP": "Solid",
    atomicNumber: 73,
    atomicRadiusPm: 146,
    electronegativity: 1.50,
    group: 5,
    period: 6,
    block: "d",
    examFocus:
      "Transition-metal oxidation states.",
    tags: ["d-block", "Metal"]
  },

  {
    symbol: "W",
    Name: "Tungsten",
    "Atomic Number": "74",
    Symbol: "W",
    "Short EC": "[Xe] 4f¹⁴ 5d⁴ 6s²",
    "Atomic Radius": "139 pm",
    "Electronegativity": "2.36",
    Type: "Metal",
    "State at STP": "Solid",
    atomicNumber: 74,
    atomicRadiusPm: 139,
    electronegativity: 2.36,
    group: 6,
    period: 6,
    block: "d",
    examFocus:
      "Transition-metal chemistry.",
    tags: ["d-block", "Metal"]
  },

  {
    symbol: "Re",
    Name: "Rhenium",
    "Atomic Number": "75",
    Symbol: "Re",
    "Short EC": "[Xe] 4f¹⁴ 5d⁵ 6s²",
    "Atomic Radius": "137 pm",
    "Electronegativity": "1.90",
    Type: "Metal",
    "State at STP": "Solid",
    atomicNumber: 75,
    atomicRadiusPm: 137,
    electronegativity: 1.90,
    group: 7,
    period: 6,
    block: "d",
    examFocus:
      "Transition-metal oxidation states.",
    tags: ["d-block", "Metal"]
  },

  {
    symbol: "Os",
    Name: "Osmium",
    "Atomic Number": "76",
    Symbol: "Os",
    "Short EC": "[Xe] 4f¹⁴ 5d⁶ 6s²",
    "Atomic Radius": "135 pm",
    "Electronegativity": "2.20",
    Type: "Metal",
    "State at STP": "Solid",
    atomicNumber: 76,
    atomicRadiusPm: 135,
    electronegativity: 2.20,
    group: 8,
    period: 6,
    block: "d",
    examFocus:
      "Transition-metal properties.",
    tags: ["d-block", "Metal"]
  },

  {
    symbol: "Ir",
    Name: "Iridium",
    "Atomic Number": "77",
    Symbol: "Ir",
    "Short EC": "[Xe] 4f¹⁴ 5d⁷ 6s²",
    "Atomic Radius": "136 pm",
    "Electronegativity": "2.20",
    Type: "Metal",
    "State at STP": "Solid",
    atomicNumber: 77,
    atomicRadiusPm: 136,
    electronegativity: 2.20,
    group: 9,
    period: 6,
    block: "d",
    examFocus:
      "Transition-metal trends.",
    tags: ["d-block", "Metal"]
  },

  {
    symbol: "Pt",
    Name: "Platinum",
    "Atomic Number": "78",
    Symbol: "Pt",
    "Short EC": "[Xe] 4f¹⁴ 5d⁹ 6s¹",
    "Atomic Radius": "139 pm",
    "Electronegativity": "2.28",
    Type: "Metal",
    "State at STP": "Solid",
    atomicNumber: 78,
    atomicRadiusPm: 139,
    electronegativity: 2.28,
    group: 10,
    period: 6,
    block: "d",
    examFocus:
      "Transition-metal chemistry and catalytic properties.",
    tags: ["d-block", "Metal"]
  },

  {
    symbol: "Au",
    Name: "Gold",
    "Atomic Number": "79",
    Symbol: "Au",
    "Short EC": "[Xe] 4f¹⁴ 5d¹⁰ 6s¹",
    "Atomic Radius": "144 pm",
    "Electronegativity": "2.54",
    Type: "Metal",
    "State at STP": "Solid",
    atomicNumber: 79,
    atomicRadiusPm: 144,
    electronegativity: 2.54,
    group: 11,
    period: 6,
    block: "d",
    examFocus:
      "Au⁺/Au³⁺ chemistry and transition-metal trends.",
    tags: ["d-block", "Metal"]
  },

  {
    symbol: "Hg",
    Name: "Mercury",
    "Atomic Number": "80",
    Symbol: "Hg",
    "Short EC": "[Xe] 4f¹⁴ 5d¹⁰ 6s²",
    "Atomic Radius": "151 pm",
    "Electronegativity": "2.00",
    Type: "Metal",
    "State at STP": "Liquid",
    atomicNumber: 80,
    atomicRadiusPm: 151,
    electronegativity: 2.00,
    group: 12,
    period: 6,
    block: "d",
    examFocus:
      "Liquid metal, Hg₂²⁺/Hg²⁺ chemistry and qualitative analysis.",
    tags: ["d-block", "Metal", "High-yield concept"]
  },

  {
    symbol: "Tl",
    Name: "Thallium",
    "Atomic Number": "81",
    Symbol: "Tl",
    "Short EC": "[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p¹",
    "Atomic Radius": "170 pm",
    "Electronegativity": "1.62",
    Type: "Metal",
    "State at STP": "Solid",
    atomicNumber: 81,
    atomicRadiusPm: 170,
    electronegativity: 1.62,
    group: 13,
    period: 6,
    block: "p",
    examFocus:
      "Inert-pair effect and Group-13 oxidation states.",
    tags: ["p-block", "Metal"]
  },

  {
    symbol: "Pb",
    Name: "Lead",
    "Atomic Number": "82",
    Symbol: "Pb",
    "Short EC": "[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p²",
    "Atomic Radius": "175 pm",
    "Electronegativity": "2.33",
    Type: "Metal",
    "State at STP": "Solid",
    atomicNumber: 82,
    atomicRadiusPm: 175,
    electronegativity: 2.33,
    group: 14,
    period: 6,
    block: "p",
    examFocus:
      "Pb²⁺/Pb⁴⁺, inert-pair effect and qualitative analysis.",
    tags: ["p-block", "Metal", "High-yield concept"]
  },

  {
    symbol: "Bi",
    Name: "Bismuth",
    "Atomic Number": "83",
    Symbol: "Bi",
    "Short EC": "[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p³",
    "Atomic Radius": "156 pm",
    "Electronegativity": "2.02",
    Type: "Metal",
    "State at STP": "Solid",
    atomicNumber: 83,
    atomicRadiusPm: 156,
    electronegativity: 2.02,
    group: 15,
    period: 6,
    block: "p",
    examFocus:
      "Inert-pair effect and Group-15 trends.",
    tags: ["p-block", "Metal"]
  },

  {
    symbol: "Po",
    Name: "Polonium",
    "Atomic Number": "84",
    Symbol: "Po",
    "Short EC": "[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁴",
    "Atomic Radius": "168 pm",
    "Electronegativity": "2.00",
    Type: "Metalloid",
    "State at STP": "Solid",
    atomicNumber: 84,
    atomicRadiusPm: 168,
    electronegativity: 2.00,
    group: 16,
    period: 6,
    block: "p",
    examFocus:
      "Group-16 trends and metallic character.",
    tags: ["p-block", "Metalloid"]
  },

  {
    symbol: "At",
    Name: "Astatine",
    "Atomic Number": "85",
    Symbol: "At",
    "Short EC": "[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁵",
    "Atomic Radius": "—",
    "Electronegativity": "2.20",
    Type: "Metalloid",
    "State at STP": "Solid",
    atomicNumber: 85,
    atomicRadiusPm: null,
    electronegativity: 2.20,
    group: 17,
    period: 6,
    block: "p",
    examFocus:
      "Halogen trends and increasing metallic character down the group.",
    tags: ["p-block", "Metalloid"]
  },

  {
    symbol: "Rn",
    Name: "Radon",
    "Atomic Number": "86",
    Symbol: "Rn",
    "Short EC": "[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁶",
    "Atomic Radius": "—",
    "Electronegativity": "—",
    Type: "Noble Gas",
    "State at STP": "Gas",
    atomicNumber: 86,
    atomicRadiusPm: null,
    electronegativity: null,
    group: 18,
    period: 6,
    block: "p",
    examFocus:
      "Noble gases and periodic trends.",
    tags: ["p-block", "Noble gas"]
  },

  {
    symbol: "Fr",
    Name: "Francium",
    "Atomic Number": "87",
    Symbol: "Fr",
    "Short EC": "[Rn] 7s¹",
    "Atomic Radius": "—",
    "Electronegativity": "0.70",
    Type: "Metal",
    "State at STP": "Solid",
    atomicNumber: 87,
    atomicRadiusPm: null,
    electronegativity: 0.70,
    group: 1,
    period: 7,
    block: "s",
    examFocus:
      "Extreme alkali-metal position, atomic size and ionisation-energy trends.",
    tags: ["s-block", "Metal"]
  },

  {
    symbol: "Ra",
    Name: "Radium",
    "Atomic Number": "88",
    Symbol: "Ra",
    "Short EC": "[Rn] 7s²",
    "Atomic Radius": "—",
    "Electronegativity": "0.90",
    Type: "Metal",
    "State at STP": "Solid",
    atomicNumber: 88,
    atomicRadiusPm: null,
    electronegativity: 0.90,
    group: 2,
    period: 7,
    block: "s",
    examFocus:
      "Group-2 trends and radioactive elements.",
    tags: ["s-block", "Metal"]
  },

  {
    symbol: "Ac",
    Name: "Actinium",
    "Atomic Number": "89",
    Symbol: "Ac",
    "Short EC": "[Rn] 6d¹ 7s²",
    "Atomic Radius": "—",
    "Electronegativity": "1.10",
    Type: "Metal",
    "State at STP": "Solid",
    atomicNumber: 89,
    atomicRadiusPm: null,
    electronegativity: 1.10,
    group: null,
    period: 7,
    block: "f",
    examFocus:
      "Actinide series and radioactive elements.",
    tags: ["f-block", "Metal"]
  },

  {
    symbol: "Th",
    Name: "Thorium",
    "Atomic Number": "90",
    Symbol: "Th",
    "Short EC": "[Rn] 6d² 7s²",
    "Atomic Radius": "—",
    "Electronegativity": "1.30",
    Type: "Metal",
    "State at STP": "Solid",
    atomicNumber: 90,
    atomicRadiusPm: null,
    electronegativity: 1.30,
    group: null,
    period: 7,
    block: "f",
    examFocus:
      "Actinides, variable oxidation states and nuclear chemistry.",
    tags: ["f-block", "Metal"]
  },

  {
    symbol: "Pa",
    Name: "Protactinium",
    "Atomic Number": "91",
    Symbol: "Pa",
    "Short EC": "[Rn] 5f² 6d¹ 7s²",
    "Atomic Radius": "—",
    "Electronegativity": "1.50",
    Type: "Metal",
    "State at STP": "Solid",
    atomicNumber: 91,
    atomicRadiusPm: null,
    electronegativity: 1.50,
    group: null,
    period: 7,
    block: "f",
    examFocus:
      "Actinide trends.",
    tags: ["f-block", "Metal"]
  },

  {
    symbol: "U",
    Name: "Uranium",
    "Atomic Number": "92",
    Symbol: "U",
    "Short EC": "[Rn] 5f³ 6d¹ 7s²",
    "Atomic Radius": "—",
    "Electronegativity": "1.38",
    Type: "Metal",
    "State at STP": "Solid",
    atomicNumber: 92,
    atomicRadiusPm: null,
    electronegativity: 1.38,
    group: null,
    period: 7,
    block: "f",
    examFocus:
      "Actinide trends, oxidation states and nuclear-chemistry context.",
    tags: ["f-block", "Metal", "High-yield concept"]
  },

  {
    symbol: "Np",
    Name: "Neptunium",
    "Atomic Number": "93",
    Symbol: "Np",
    "Short EC": "[Rn] 5f⁴ 6d¹ 7s²",
    "Atomic Radius": "—",
    "Electronegativity": "1.36",
    Type: "Metal",
    "State at STP": "Solid",
    atomicNumber: 93,
    atomicRadiusPm: null,
    electronegativity: 1.36,
    group: null,
    period: 7,
    block: "f",
    examFocus:
      "Actinide series and oxidation states.",
    tags: ["f-block", "Metal"]
  },

  {
    symbol: "Pu",
    Name: "Plutonium",
    "Atomic Number": "94",
    Symbol: "Pu",
    "Short EC": "[Rn] 5f⁶ 7s²",
    "Atomic Radius": "—",
    "Electronegativity": "1.28",
    Type: "Metal",
    "State at STP": "Solid",
    atomicNumber: 94,
    atomicRadiusPm: null,
    electronegativity: 1.28,
    group: null,
    period: 7,
    block: "f",
    examFocus:
      "Actinide chemistry and oxidation states.",
    tags: ["f-block", "Metal"]
  },

  {
    symbol: "Am",
    Name: "Americium",
    "Atomic Number": "95",
    Symbol: "Am",
    "Short EC": "[Rn] 5f⁷ 7s²",
    "Atomic Radius": "—",
    "Electronegativity": "1.13",
    Type: "Metal",
    "State at STP": "Solid",
    atomicNumber: 95,
    atomicRadiusPm: null,
    electronegativity: 1.13,
    group: null,
    period: 7,
    block: "f",
    examFocus:
      "Actinide trends.",
    tags: ["f-block", "Metal"]
  },

  {
    symbol: "Cm",
    Name: "Curium",
    "Atomic Number": "96",
    Symbol: "Cm",
    "Short EC": "[Rn] 5f⁷ 6d¹ 7s²",
    "Atomic Radius": "—",
    "Electronegativity": "1.28",
    Type: "Metal",
    "State at STP": "Solid",
    atomicNumber: 96,
    atomicRadiusPm: null,
    electronegativity: 1.28,
    group: null,
    period: 7,
    block: "f",
    examFocus:
      "Actinide series.",
    tags: ["f-block", "Metal"]
  },

  {
    symbol: "Bk",
    Name: "Berkelium",
    "Atomic Number": "97",
    Symbol: "Bk",
    "Short EC": "[Rn] 5f⁹ 7s²",
    "Atomic Radius": "—",
    "Electronegativity": "1.30",
    Type: "Metal",
    "State at STP": "Solid",
    atomicNumber: 97,
    atomicRadiusPm: null,
    electronegativity: 1.30,
    group: null,
    period: 7,
    block: "f",
    examFocus:
      "Actinide trends.",
    tags: ["f-block", "Metal"]
  },

  {
    symbol: "Cf",
    Name: "Californium",
    "Atomic Number": "98",
    Symbol: "Cf",
    "Short EC": "[Rn] 5f¹⁰ 7s²",
    "Atomic Radius": "—",
    "Electronegativity": "1.30",
    Type: "Metal",
    "State at STP": "Solid",
    atomicNumber: 98,
    atomicRadiusPm: null,
    electronegativity: 1.30,
    group: null,
    period: 7,
    block: "f",
    examFocus:
      "Actinide series.",
    tags: ["f-block", "Metal"]
  },

  {
    symbol: "Es",
    Name: "Einsteinium",
    "Atomic Number": "99",
    Symbol: "Es",
    "Short EC": "[Rn] 5f¹¹ 7s²",
    "Atomic Radius": "—",
    "Electronegativity": "1.30",
    Type: "Metal",
    "State at STP": "Solid",
    atomicNumber: 99,
    atomicRadiusPm: null,
    electronegativity: 1.30,
    group: null,
    period: 7,
    block: "f",
    examFocus:
      "Actinide series.",
    tags: ["f-block", "Metal"]
  },

  {
    symbol: "Fm",
    Name: "Fermium",
    "Atomic Number": "100",
    Symbol: "Fm",
    "Short EC": "[Rn] 5f¹² 7s²",
    "Atomic Radius": "—",
    "Electronegativity": "1.30",
    Type: "Metal",
    "State at STP": "Solid",
    atomicNumber: 100,
    atomicRadiusPm: null,
    electronegativity: 1.30,
    group: null,
    period: 7,
    block: "f",
    examFocus:
      "Actinide series.",
    tags: ["f-block", "Metal"]
  },

  {
    symbol: "Md",
    Name: "Mendelevium",
    "Atomic Number": "101",
    Symbol": "Md",
    "Short EC": "[Rn] 5f¹³ 7s²",
    "Atomic Radius": "—",
    "Electronegativity": "1.30",
    Type: "Metal",
    "State at STP": "Solid",
    atomicNumber: 101,
    atomicRadiusPm: null,
    electronegativity: 1.30,
    group: null,
    period: 7,
    block: "f",
    examFocus:
      "Actinide series.",
    tags: ["f-block", "Metal"]
  },

  {
    symbol: "No",
    Name: "Nobelium",
    "Atomic Number": "102",
    Symbol: "No",
    "Short EC": "[Rn] 5f¹⁴ 7s²",
    "Atomic Radius": "—",
    "Electronegativity": "1.30",
    Type: "Metal",
    "State at STP": "Solid",
    atomicNumber: 102,
    atomicRadiusPm: null,
    electronegativity: 1.30,
    group: null,
    period: 7,
    block: "f",
    examFocus:
      "Filled 5f subshell and actinide trends.",
    tags: ["f-block", "Metal"]
  },

  {
    symbol: "Lr",
    Name: "Lawrencium",
    "Atomic Number": "103",
    Symbol: "Lr",
    "Short EC": "[Rn] 5f¹⁴ 7s² 7p¹",
    "Atomic Radius": "—",
    "Electronegativity": "1.30",
    Type: "Metal",
    "State at STP": "Solid",
    atomicNumber: 103,
    atomicRadiusPm: null,
    electronegativity: 1.30,
    group: null,
    period: 7,
    block: "f",
    examFocus:
      "End of actinide series and periodic placement.",
    tags: ["f-block", "Metal"]
  },

  {
    symbol: "Rf",
    Name: "Rutherfordium",
    "Atomic Number": "104",
    Symbol: "Rf",
    "Short EC": "[Rn] 5f¹⁴ 6d² 7s²",
    "Atomic Radius": "—",
    "Electronegativity": "—",
    Type: "Metal",
    "State at STP": "Solid",
    atomicNumber: 104,
    atomicRadiusPm: null,
    electronegativity: null,
    group: 4,
    period: 7,
    block: "d",
    examFocus:
      "Modern periodic-table placement.",
    tags: ["d-block", "Metal"]
  },

  {
    symbol: "Db",
    Name: "Dubnium",
    "Atomic Number": "105",
    Symbol: "Db",
    "Short EC": "[Rn] 5f¹⁴ 6d³ 7s²",
    "Atomic Radius": "—",
    "Electronegativity": "—",
    Type: "Metal",
    "State at STP": "Solid",
    atomicNumber: 105,
    atomicRadiusPm: null,
    electronegativity: null,
    group: 5,
    period: 7,
    block: "d",
    examFocus:
      "Modern periodic-table placement.",
    tags: ["d-block", "Metal"]
  },

  {
    symbol: "Sg",
    Name: "Seaborgium",
    "Atomic Number": "106",
    Symbol: "Sg",
    "Short EC": "[Rn] 5f¹⁴ 6d⁴ 7s²",
    "Atomic Radius": "—",
    "Electronegativity": "—",
    Type: "Metal",
    "State at STP": "Solid",
    atomicNumber: 106,
    atomicRadiusPm: null,
    electronegativity: null,
    group: 6,
    period: 7,
    block: "d",
    examFocus:
      "Modern periodic-table placement.",
    tags: ["d-block", "Metal"]
  },

  {
    symbol: "Bh",
    Name: "Bohrium",
    "Atomic Number": "107",
    Symbol: "Bh",
    "Short EC": "[Rn] 5f¹⁴ 6d⁵ 7s²",
    "Atomic Radius": "—",
    "Electronegativity": "—",
    Type: "Metal",
    "State at STP": "Solid",
    atomicNumber: 107,
    atomicRadiusPm: null,
    electronegativity: null,
    group: 7,
    period: 7,
    block: "d",
    examFocus:
      "Modern periodic-table placement.",
    tags: ["d-block", "Metal"]
  },

  {
    symbol: "Hs",
    Name: "Hassium",
    "Atomic Number": "108",
    Symbol: "Hs",
    "Short EC": "[Rn] 5f¹⁴ 6d⁶ 7s²",
    "Atomic Radius": "—",
    "Electronegativity": "—",
    Type: "Metal",
    "State at STP": "Solid",
    atomicNumber: 108,
    atomicRadiusPm: null,
    electronegativity: null,
    group: 8,
    period: 7,
    block: "d",
    examFocus:
      "Modern periodic-table placement.",
    tags: ["d-block", "Metal"]
  },

  {
    symbol: "Mt",
    Name: "Meitnerium",
    "Atomic Number": "109",
    Symbol: "Mt",
    "Short EC": "[Rn] 5f¹⁴ 6d⁷ 7s²",
    "Atomic Radius": "—",
    "Electronegativity": "—",
    Type: "Metal",
    "State at STP": "Solid",
    atomicNumber: 109,
    atomicRadiusPm: null,
    electronegativity: null,
    group: 9,
    period: 7,
    block: "d",
    examFocus:
      "Modern periodic-table placement.",
    tags: ["d-block", "Metal"]
  },

  {
    symbol: "Ds",
    Name: "Darmstadtium",
    "Atomic Number": "110",
    Symbol: "Ds",
    "Short EC": "[Rn] 5f¹⁴ 6d⁸ 7s²",
    "Atomic Radius": "—",
    "Electronegativity": "—",
    Type: "Metal",
    "State at STP": "Solid",
    atomicNumber: 110,
    atomicRadiusPm: null,
    electronegativity: null,
    group: 10,
    period: 7,
    block: "d",
    examFocus:
      "Modern periodic-table placement.",
    tags: ["d-block", "Metal"]
  },

  {
    symbol: "Rg",
    Name: "Roentgenium",
    "Atomic Number": "111",
    Symbol: "Rg",
    "Short EC": "[Rn] 5f¹⁴ 6d⁹ 7s²",
    "Atomic Radius": "—",
    "Electronegativity": "—",
    Type: "Metal",
    "State at STP": "Solid",
    atomicNumber: 111,
    atomicRadiusPm: null,
    electronegativity: null,
    group: 11,
    period: 7,
    block: "d",
    examFocus:
      "Modern periodic-table placement.",
    tags: ["d-block", "Metal"]
  },

  {
    symbol: "Cn",
    Name: "Copernicium",
    "Atomic Number": "112",
    Symbol: "Cn",
    "Short EC": "[Rn] 5f¹⁴ 6d¹⁰ 7s²",
    "Atomic Radius": "—",
    "Electronegativity": "—",
    Type: "Metal",
    "State at STP": "Liquid",
    atomicNumber: 112,
    atomicRadiusPm: null,
    electronegativity: null,
    group: 12,
    period: 7,
    block: "d",
    examFocus:
      "Modern periodic-table placement and Group-12 trends.",
    tags: ["d-block", "Metal"]
  },

  {
    symbol: "Nh",
    Name: "Nihonium",
    "Atomic Number": "113",
    Symbol: "Nh",
    "Short EC": "[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p¹",
    "Atomic Radius": "—",
    "Electronegativity": "—",
    Type: "Metal",
    "State at STP": "Solid",
    atomicNumber: 113,
    atomicRadiusPm: null,
    electronegativity: null,
    group: 13,
    period: 7,
    block: "p",
    examFocus:
      "Modern periodic-table placement and Group-13 position.",
    tags: ["p-block", "Metal", "Modern periodic table"],
    sourceMissing: true
  },

  {
    symbol: "Fl",
    Name: "Flerovium",
    "Atomic Number": "114",
    Symbol: "Fl",
    "Short EC": "[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p²",
    "Atomic Radius": "—",
    "Electronegativity": "—",
    Type: "Metal",
    "State at STP": "Solid",
    atomicNumber: 114,
    atomicRadiusPm: null,
    electronegativity: null,
    group: 14,
    period: 7,
    block: "p",
    examFocus:
      "Modern periodic-table placement and Group-14 position.",
    tags: ["p-block", "Metal"]
  },

  {
    symbol: "Mc",
    Name: "Moscovium",
    "Atomic Number": "115",
    Symbol: "Mc",
    "Short EC": "[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p³",
    "Atomic Radius": "—",
    "Electronegativity": "—",
    Type: "Metal",
    "State at STP": "Solid",
    atomicNumber: 115,
    atomicRadiusPm: null,
    electronegativity: null,
    group: 15,
    period: 7,
    block: "p",
    examFocus:
      "Modern periodic-table placement and Group-15 position.",
    tags: ["p-block", "Metal", "Modern periodic table"],
    sourceMissing: true
  },

  {
    symbol: "Lv",
    Name: "Livermorium",
    "Atomic Number": "116",
    Symbol: "Lv",
    "Short EC": "[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁴",
    "Atomic Radius": "—",
    "Electronegativity": "—",
    Type: "Metal",
    "State at STP": "Solid",
    atomicNumber: 116,
    atomicRadiusPm: null,
    electronegativity: null,
    group: 16,
    period: 7,
    block: "p",
    examFocus:
      "Modern periodic-table placement and Group-16 position.",
    tags: ["p-block", "Metal"]
  },

  {
    symbol: "Ts",
    Name: "Tennessine",
    "Atomic Number": "117",
    Symbol: "Ts",
    "Short EC": "[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁵",
    "Atomic Radius": "—",
    "Electronegativity": "—",
    Type: "Nonmetal",
    "State at STP": "Solid",
    atomicNumber: 117,
    atomicRadiusPm: null,
    electronegativity: null,
    group: 17,
    period: 7,
    block: "p",
    examFocus:
      "Modern periodic-table placement and Group-17 trend.",
    tags: ["p-block", "Nonmetal"]
  },

  {
    symbol: "Og",
    Name: "Oganesson",
    "Atomic Number": "118",
    Symbol: "Og",
    "Short EC": "[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁶",
    "Atomic Radius": "—",
    "Electronegativity": "—",
    Type: "Noble Gas",
    "State at STP": "Gas",
    atomicNumber: 118,
    atomicRadiusPm: null,
    electronegativity: null,
    group: 18,
    period: 7,
    block: "p",
    examFocus:
      "Modern periodic-table placement and Group-18 position.",
    tags: ["p-block", "Noble gas"]
  }
];


/* =========================================================
   PERIODIC TABLE LAYOUT
   ========================================================= */

const PT_MATRIX = [
  [
    null
  ],

  [
    "H",
    null, null, null, null, null, null, null, null,
    null, null, null, null, null, null, null, null,
    "He"
  ],

  [
    "Li", "Be",
    null, null, null, null, null, null, null, null, null,
    null,
    "B", "C", "N", "O", "F", "Ne"
  ],

  [
    "Na", "Mg",
    null, null, null, null, null, null, null, null, null,
    null,
    "Al", "Si", "P", "S", "Cl", "Ar"
  ],

  [
    "K", "Ca",
    "Sc", "Ti", "V", "Cr", "Mn", "Fe", "Co", "Ni",
    "Cu", "Zn",
    "Ga", "Ge", "As", "Se", "Br", "Kr"
  ],

  [
    "Rb", "Sr",
    "Y", "Zr", "Nb", "Mo", "Tc", "Ru", "Rh", "Pd",
    "Ag", "Cd",
    "In", "Sn", "Sb", "Te", "I", "Xe"
  ],

  [
    "Cs", "Ba",
    "*1",
    "Hf", "Ta", "W", "Re", "Os", "Ir", "Pt",
    "Au", "Hg",
    "Tl", "Pb", "Bi", "Po", "At", "Rn"
  ],

  [
    "Fr", "Ra",
    "*2",
    "Rf", "Db", "Sg", "Bh", "Hs", "Mt", "Ds",
    "Rg", "Cn",
    "Nh", "Fl", "Mc", "Lv", "Ts", "Og"
  ],

  [
    null
  ],

  [
    null,
    "La", "Ce", "Pr", "Nd", "Pm", "Sm", "Eu",
    "Gd", "Tb", "Dy", "Ho", "Er", "Tm", "Yb", "Lu"
  ],

  [
    null,
    "Ac", "Th", "Pa", "U", "Np", "Pu", "Am",
    "Cm", "Bk", "Cf", "Es", "Fm", "Md", "No", "Lr"
  ]
];


/* =========================================================
   EXAM REVISION CARDS
   ========================================================= */

const PT_EXAM_CARDS = [
  [
    "Periodic Trends",
    "Atomic radius generally decreases across a period and increases down a group. Ionisation enthalpy and electronegativity generally show the opposite broad trend across a period, with important exceptions."
  ],

  [
    "NEET Focus",
    "Prioritise periodic trends, electronic configuration, common oxidation states, representative-element chemistry, p-block trends, d/f-block basics and NCERT examples."
  ],

  [
    "JEE Focus",
    "Add deeper comparisons, anomalous and diagonal relationships, oxidation-state stability, redox behaviour, coordination chemistry and quantitative trend reasoning."
  ],

  [
    "Quick Recall",
    "Group 1 → Alkali metals • Group 2 → Alkaline earth metals • Group 17 → Halogens • Group 18 → Noble gases."
  ]
];


/* =========================================================
   LOOKUP
   ========================================================= */

const ptBySymbol = Object.fromEntries(
  PT_ELEMENTS.map(element => [element.symbol, element])
);

const ptGrid = document.getElementById("periodic-table-grid");
const ptInfo = document.getElementById("pt-info-panel");
const ptSearch = document.getElementById("pt-search");
const ptChartCard = document.querySelector(".pt-chart-card");
const ptCanvas = document.getElementById("pt-chart");

let ptSelected = null;
let ptFilter = "all";


/* =========================================================
   CATEGORY
   ========================================================= */

function ptCategory(element) {

  const type = (element.Type || "").toLowerCase();

  if (type.includes("noble")) {
    return "noble";
  }

  if (type.includes("metalloid")) {
    return "metalloid";
  }

  if (type.includes("nonmetal")) {
    return "nonmetal";
  }

  return "metal";
}


/* =========================================================
   FILTER
   ========================================================= */

function ptMatchesFilter(element) {

  if (ptFilter === "all") {
    return true;
  }

  return ptCategory(element) === ptFilter;
}


/* =========================================================
   RENDER PERIODIC TABLE
   ========================================================= */

function renderPeriodicTable() {

  if (!ptGrid) {
    return;
  }

  ptGrid.innerHTML = "";

  const query = (ptSearch?.value || "")
    .trim()
    .toLowerCase();

  PT_MATRIX.forEach((row, rowIndex) => {

    row.forEach((key, columnIndex) => {

      /*
       * Empty grid position
       */

      if (key === null) {

        const empty = document.createElement("div");

        empty.style.gridColumn = columnIndex + 1;
        empty.style.gridRow = rowIndex + 1;

        ptGrid.appendChild(empty);

        return;
      }


      /*
       * Lanthanide / Actinide marker
       */

      if (key === "*1" || key === "*2") {

        const marker = document.createElement("button");

        marker.type = "button";

        marker.className =
          "pt-marker " +
          (key === "*1" ? "lan" : "act");

        marker.textContent = key;

        marker.title =
          key === "*1"
            ? "Lanthanides"
            : "Actinides";

        marker.style.gridColumn =
          columnIndex + 1;

        marker.style.gridRow =
          rowIndex + 1;

        marker.addEventListener("click", () => {

          const element =
            ptBySymbol[
              key === "*1"
                ? "La"
                : "Ac"
            ];

          showElement(element);

        });

        ptGrid.appendChild(marker);

        return;
      }


      /*
       * Element
       */

      const element = ptBySymbol[key];

      if (!element) {
        return;
      }

      const button =
        document.createElement("button");

      button.type = "button";

      button.className =
        `pt-element ${ptCategory(element)}`;

      button.dataset.symbol =
        element.symbol;

      button.dataset.atomicNumber =
        element.atomicNumber;

      button.style.gridColumn =
        columnIndex + 1;

      button.style.gridRow =
        rowIndex + 1;


      /*
       * Search text
       */

      const searchableText = `
        ${element.Name || ""}
        ${element.symbol}
        ${element.atomicNumber}
        ${element.group ?? ""}
        ${element.period ?? ""}
        ${element.block ?? ""}
        ${element.Type || ""}
      `.toLowerCase();


      /*
       * Apply filters
       */

      if (
        !ptMatchesFilter(element) ||
        (
          query &&
          !searchableText.includes(query)
        )
      ) {

        button.classList.add("dimmed");

      }


      /*
       * Selected element
       */

      if (
        ptSelected === element.symbol
      ) {

        button.classList.add("selected");

      }


      /*
       * Element contents
       */

      button.innerHTML = `
        <span class="z">
          ${element.atomicNumber}
        </span>

        <span class="sym">
          ${element.symbol}
        </span>

        <span class="name">
          ${element.Name || element.symbol}
        </span>
      `;


      /*
       * Click
       */

      button.addEventListener(
        "click",
        () => showElement(element)
      );


      ptGrid.appendChild(button);

    });

  });

}


/* =========================================================
   STAT COMPONENT
   ========================================================= */

function stat(label, value) {

  return `
    <div class="pt-info-stat">

      <span>
        ${label}
      </span>

      <b>
        ${value ?? "—"}
      </b>

    </div>
  `;
}


/* =========================================================
   SHOW ELEMENT
   ========================================================= */

function showElement(element) {

  if (!element || !ptInfo) {
    return;
  }

  ptSelected = element.symbol;

  renderPeriodicTable();


  const tags =
    (element.tags || [])
      .map(
        tag =>
          `<span class="pt-tag">${tag}</span>`
      )
      .join("");


  ptInfo.innerHTML = `

    <div class="pt-info-top">

      <div class="pt-big-symbol">
        ${element.symbol}
      </div>

      <div class="pt-info-title">

        <h3>
          ${element.Name}
        </h3>

        <p>
          Atomic number ${element.atomicNumber}
          • ${element.Type}
        </p>

      </div>

    </div>


    <div class="pt-info-grid">

      ${stat(
        "Atomic number",
        element.atomicNumber
      )}

      ${stat(
        "Group",
        element.group ?? "f-block"
      )}

      ${stat(
        "Period",
        element.period
      )}

      ${stat(
        "Block",
        element.block
          ? `${element.block}-block`
          : "—"
      )}

      ${stat(
        "Atomic radius",
        element["Atomic Radius"] || "—"
      )}

      ${stat(
        "Electronegativity",
        element["Electronegativity"] || "—"
      )}

      ${stat(
        "State at STP",
        element["State at STP"]
      )}

      ${stat(
        "Category",
        ptCategory(element)
      )}

    </div>


    <div class="pt-info-section">

      <h4>
        Electron configuration
      </h4>

      <p>
        ${element["Short EC"] || "—"}
      </p>

    </div>


    <div class="pt-info-section">

      <h4>
        NEET / JEE focus
      </h4>

      <p>
        ${element.examFocus}
      </p>

    </div>


    <div class="pt-info-section">

      <h4>
        Quick tags
      </h4>

      <div class="pt-tags">
        ${tags}
      </div>

    </div>


    ${
      element.sourceMissing
        ? `
          <p class="pt-source-note">
            This element was added during the
            web conversion to complete the modern
            periodic-table layout.
          </p>
        `
        : ""
    }

  `;
}


/* =========================================================
   EXAM CARDS
   ========================================================= */

function showExamCards() {

  const container =
    document.getElementById(
      "pt-exam-grid"
    );

  if (!container) {
    return;
  }

  container.innerHTML =
    PT_EXAM_CARDS
      .map(
        ([title, description]) => `

          <article class="pt-exam-card">

            <h4>
              ${title}
            </h4>

            <p>
              ${description}
            </p>

          </article>

        `
      )
      .join("");
}


/* =========================================================
   NUMERIC GRAPH DATA
   ========================================================= */

function numericData(kind) {

  return PT_ELEMENTS

    .filter(element => {

      if (kind === "en") {

        return Number.isFinite(
          element.electronegativity
        );

      }

      return Number.isFinite(
        element.atomicRadiusPm
      );

    })

    .sort(
      (a, b) =>
        a.atomicNumber -
        b.atomicNumber
    );
}


/* =========================================================
   DRAW GRAPH
   ========================================================= */

function drawChart(kind) {

  if (!ptCanvas || !ptChartCard) {
    return;
  }

  const data =
    numericData(kind);

  const title =
    kind === "en"
      ? "Electronegativity of elements"
      : "Atomic radius of elements";


  const titleElement =
    document.getElementById(
      "pt-chart-title"
    );

  const subtitleElement =
    document.getElementById(
      "pt-chart-subtitle"
    );


  if (titleElement) {
    titleElement.textContent =
      title;
  }


  if (subtitleElement) {

    subtitleElement.textContent =
      "Converted from the values in your original Python dataset. Entries without numeric values are skipped.";

  }


  ptChartCard.classList.add("show");


  const ctx =
    ptCanvas.getContext("2d");

  const dpr =
    window.devicePixelRatio || 1;

  const rect =
    ptCanvas.getBoundingClientRect();


  const width =
    Math.max(
      300,
      rect.width
    );

  const height =
    Math.max(
      260,
      rect.height
    );


  ptCanvas.width =
    width * dpr;

  ptCanvas.height =
    height * dpr;


  ctx.setTransform(
    dpr,
    0,
    0,
    dpr,
    0,
    0
  );


  ctx.clearRect(
    0,
    0,
    width,
    height
  );


  const padding = {
    left: 48,
    right: 16,
    top: 18,
    bottom: 55
  };


  const plotWidth =
    width -
    padding.left -
    padding.right;


  const plotHeight =
    height -
    padding.top -
    padding.bottom;


  const values =
    data.map(
      element =>
        kind === "en"
          ? element.electronegativity
          : element.atomicRadiusPm
    );


  const maxValue =
    Math.max(...values) * 1.08;


  /*
   * Font
   */

  ctx.font =
    "10px system-ui, sans-serif";


  /*
   * Grid
   */

  ctx.strokeStyle =
    "#303030";

  ctx.fillStyle =
    "#777";

  ctx.lineWidth = 1;


  for (let i = 0; i <= 5; i++) {

    const y =
      padding.top +
      plotHeight -
      (plotHeight * i) / 5;


    ctx.beginPath();

    ctx.moveTo(
      padding.left,
      y
    );

    ctx.lineTo(
      width - padding.right,
      y
    );

    ctx.stroke();


    const value =
      (maxValue * i) / 5;


    ctx.fillText(
      value.toFixed(
        kind === "en"
          ? 1
          : 0
      ),
      7,
      y + 3
    );

  }


  /*
   * Axes
   */

  ctx.strokeStyle =
    "#555";


  ctx.beginPath();

  ctx.moveTo(
    padding.left,
    padding.top
  );

  ctx.lineTo(
    padding.left,
    padding.top +
      plotHeight
  );

  ctx.lineTo(
    width - padding.right,
    padding.top +
      plotHeight
  );

  ctx.stroke();


  /*
   * X step
   */

  const step =
    data.length > 1
      ? plotWidth /
        (data.length - 1)
      : plotWidth;


  /*
   * Graph line
   */

  ctx.beginPath();


  data.forEach(
    (element, index) => {

      const value =
        kind === "en"
          ? element.electronegativity
          : element.atomicRadiusPm;


      const x =
        padding.left +
        index * step;


      const y =
        padding.top +
        plotHeight -
        (value / maxValue) *
          plotHeight;


      if (index === 0) {

        ctx.moveTo(
          x,
          y
        );

      } else {

        ctx.lineTo(
          x,
          y
        );

      }

    }
  );


  ctx.strokeStyle =
    "#d0d0d0";

  ctx.lineWidth = 2;

  ctx.stroke();


  /*
   * Points + labels
   */

  ctx.fillStyle =
    "#e9e9e9";


  data.forEach(
    (element, index) => {

      const value =
        kind === "en"
          ? element.electronegativity
          : element.atomicRadiusPm;


      const x =
        padding.left +
        index * step;


      const y =
        padding.top +
        plotHeight -
        (value / maxValue) *
          plotHeight;


      /*
       * Point
       */

      ctx.beginPath();

      ctx.arc(
        x,
        y,
        2.4,
        0,
        Math.PI * 2
      );

      ctx.fill();


      /*
       * Labels
       */

      const labelFrequency =
        Math.max(
          1,
          Math.ceil(
            data.length / 30
          )
        );


      if (
        index %
          labelFrequency ===
        0
      ) {

        ctx.save();

        ctx.translate(
          x,
          padding.top +
            plotHeight +
            10
        );

        ctx.rotate(
          -Math.PI / 2
        );

        ctx.fillStyle =
          "#777";

        ctx.fillText(
          element.symbol,
          0,
          0
        );

        ctx.restore();

      }

    }
  );


  /*
   * X-axis title
   */

  ctx.fillStyle =
    "#777";


  ctx.fillText(
    kind === "en"
      ? "Electronegativity"
      : "Atomic radius (pm)",
    padding.left,
    height - 7
  );

}


/* =========================================================
   FILTER BUTTONS
   ========================================================= */

document
  .querySelectorAll(".pt-filter")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        document
          .querySelectorAll(
            ".pt-filter"
          )
          .forEach(
            item =>
              item.classList.remove(
                "active"
              )
          );


        button.classList.add(
          "active"
        );


        ptFilter =
          button.dataset.filter;


        renderPeriodicTable();

      }
    );

  });


/* =========================================================
   SEARCH
   ========================================================= */

if (ptSearch) {

  ptSearch.addEventListener(
    "input",
    renderPeriodicTable
  );

}


/* =========================================================
   GRAPH BUTTONS
   ========================================================= */

const radiusButton =
  document.getElementById(
    "pt-radius-btn"
  );

if (radiusButton) {

  radiusButton.addEventListener(
    "click",
    () => drawChart("radius")
  );

}


const electronegativityButton =
  document.getElementById(
    "pt-en-btn"
  );

if (electronegativityButton) {

  electronegativityButton.addEventListener(
    "click",
    () => drawChart("en")
  );

}


/* =========================================================
   TRENDS BUTTON
   ========================================================= */

const trendsButton =
  document.getElementById(
    "pt-trends-btn"
  );

if (trendsButton) {

  trendsButton.addEventListener(
    "click",
    () => {

      const examGrid =
        document.getElementById(
          "pt-exam-grid"
        );

      if (examGrid) {

        examGrid.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });

      }

    }
  );

}


/* =========================================================
   HIDE GRAPH
   ========================================================= */

const closeChart =
  document.getElementById(
    "pt-close-chart"
  );

if (closeChart) {

  closeChart.addEventListener(
    "click",
    () => {

      if (ptChartCard) {

        ptChartCard.classList.remove(
          "show"
        );

      }

    }
  );

}


/* =========================================================
   RESIZE GRAPH
   ========================================================= */

window.addEventListener(
  "resize",
  () => {

    if (
      ptChartCard &&
      ptChartCard.classList.contains(
        "show"
      )
    ) {

      const title =
        document.getElementById(
          "pt-chart-title"
        )?.textContent || "";


      const kind =
        title
          .toLowerCase()
          .includes(
            "electronegativity"
          )
          ? "en"
          : "radius";


      drawChart(kind);

    }

  }
);


/* =========================================================
   INITIALISE
   ========================================================= */

showExamCards();

renderPeriodicTable();
