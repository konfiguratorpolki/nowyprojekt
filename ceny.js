// ============================================================
//  CENY.JS — plik konfiguracyjny cen i rabatów
//  Edytuj ten plik, aby zmienić ceny bez dotykania index.html
// ============================================================


// ------------------------------------------------------------
//  1. TABELA CENY — półki wiszące i stojące
//     Struktura: pricing[szerokość][wysokość][głębokość][liczba półek]
//     Szerokości: 34, 44, 50, 60 (cm)
//     Wysokości:  40, 60, 80 (cm)
//     Głębokości: 10, 15 (cm)
//     Liczba półek wewnętrznych: 2, 3, 4, 5
// ------------------------------------------------------------
const pricing = {
    "34": {
        "40": {
            "10": { "2": 10 },
            "15": { "2": 250 }
        },
        "60": {
            "10": { "2": 175, "3": 200 },
            "15": { "2": 275, "3": 300 }
        },
        "80": {
            "10": { "2": 223, "3": 237, "4": 251, "5": 279 },
            "15": { "2": 323, "3": 337, "4": 351, "5": 379 }
        }
    },
    "44": {
        "40": {
            "10": { "2": 169 },
            "15": { "2": 269 }
        },
        "60": {
            "10": { "2": 209, "3": 219 },
            "15": { "2": 309, "3": 319 }
        },
        "80": {
            "10": { "2": 239, "3": 254, "4": 269, "5": 299 },
            "15": { "2": 339, "3": 354, "4": 369, "5": 399 }
        }
    },
    "50": {
        "40": {
            "10": { "2": 179 },
            "15": { "2": 279 }
        },
        "60": {
            "10": { "2": 219, "3": 229 },
            "15": { "2": 319, "3": 329 }
        },
        "80": {
            "10": { "2": 263, "3": 280, "4": 296, "5": 329 },
            "15": { "2": 363, "3": 380, "4": 396, "5": 429 }
        }
    },
    "60": {
        "40": {
            "10": { "2": 194 },
            "15": { "2": 294 }
        },
        "60": {
            "10": { "2": 239, "3": 249 },
            "15": { "2": 339, "3": 349 }
        },
        "80": {
            "10": { "2": 279, "3": 297, "4": 314, "5": 349 },
            "15": { "2": 379, "3": 397, "4": 414, "5": 449 }
        }
    }
};


// ------------------------------------------------------------
//  2. CENY PÓŁEK NA KUBKI
//     Struktura: mugShelfPricing[szerokość][wysokość]
//     Szerokości: 44, 60, 84 (cm)
//     Wysokości:  40, 60 (cm)
// ------------------------------------------------------------
const mugShelfPricing = {
    "44": { "40": 169, "60": 189 },
    "60": { "40": 179, "60": 219 },
    "84": { "40": 299 }
};


// ------------------------------------------------------------
//  3. DOPŁATY I ODLICZENIA
// ------------------------------------------------------------
const FEES = {
    // Dopłata za niestandardową szerokość (35–59 cm poza standardem)
    customWidth: 50,

    // Dopłata za własne rozmieszczenie półek
    customPositions: 50,

    // Odliczenie za brak górnej półki
    noTopShelf: 10,

    // Odliczenie za brak dolnej półki (tylko półka stojąca)
    noBottomShelf: 10,

    // Odliczenie za brak górnej / dolnej półki w module (półka modułowa)
    modularNoTop: 20,
    modularNoBottom: 20,

    // Cena łącznika modułowego wg szerokości łącznika (cm)
    modularConnector: {
        30: 10,   // cena za 1 łącznik 30 cm
        40: 15    // cena za 1 łącznik 40 cm
    },

    // Minimalna cena finalna (zabezpieczenie przed zejściem poniżej)
    minPrice: 50,
    modularMinPrice: 100
};


// ------------------------------------------------------------
//  4. RABATY KOSZYKOWE
//     discount1item  — rabat na 1 sztukę (gdy koszyk ma 1 produkt)
//     discountBest   — rabat na najdroższy produkt (koszyk 2+)
//     discountCheap  — rabat na najtańszy produkt (koszyk 2+)
//     Wartości: 0.10 = 10%, 0.25 = 25% itd.
// ------------------------------------------------------------
const DISCOUNTS = {
    discount1item:  0.10,   // -10% przy zakupie 1 sztuki
    discountBest:   0.10,   // -10% na najdroższą (przy 2+ sztukach)
    discountCheap:  0.25    // -25% na najtańszą  (przy 2+ sztukach)
};
