// Zaktualizowano ceny: 10.04.2026, 13:34:11
// Zaktualizowano: 10.04.2026, 13:32:48 — edytowano: "wzór1"
// Zaktualizowano ceny: 10.04.2026, 13:32:15
// Zaktualizowano: 9.04.2026, 13:27:04 — dodano: "wzór2"
// Zaktualizowano: 5.04.2026, 06:30:44 — dodano: "wzór1"
// Zaktualizowano: 5.04.2026, 06:30:05 — dodano: "wzór1"
// Zaktualizowano: 4.04.2026, 15:01:30 — edytowano: "wzór 1"
// Zaktualizowano: 4.04.2026, 13:20:20 — edytowano: "wzór 1"
// Zaktualizowano: 4.04.2026, 13:20:19 — edytowano: "wzór 1"
// Zaktualizowano: 3.04.2026, 11:36:08 — dodano: "wzór 1"
// Zaktualizowano: 3.04.2026, 11:35:57 — edytowano: "wzór 1"
// Zaktualizowano: 3.04.2026, 09:21:49 — dodano: "wzór 1"
// Zaktualizowano: 3.04.2026, 09:04:59 — dodano: "aaaaa"
// Zaktualizowano: 3.04.2026, 09:04:45 — edytowano: "aaaaa"
// Zaktualizowano: 3.04.2026, 09:04:31 — edytowano: "aaaaa"
// Zaktualizowano: 3.04.2026, 09:04:28 — edytowano: "aaaaa"
// Zaktualizowano: 3.04.2026, 09:04:27 — edytowano: "aaaaa"
// Zaktualizowano: 3.04.2026, 08:53:33 — dodano: "aaaaa"
// Zaktualizowano: 3.04.2026, 08:50:02 — dodano: "aaaaa"
// Zaktualizowano: 3.04.2026, 08:49:04 — dodano: "aaaaa"
// Zaktualizowano: 2.04.2026, 08:48:01 — dodano: "wzó777"
// Zaktualizowano: 2.04.2026, 07:30:16 — dodano: "asdas"
// Zaktualizowano: 1.04.2026, 13:48:36 — dodano: "działa"
// Zaktualizowano: 1.04.2026, 12:57:45 — dodano: "aasadasa"
// Zaktualizowano: 1.04.2026, 12:37:33 — dodano: "aaaaa"
// ============================================================
//  WZORY.JS — plik konfiguracyjny wzorów półek
//  Edytuj ten plik (lub użyj editor.html), aby dodawać nowe
//  wzory półek bez modyfikowania index.html
// ============================================================

// ------------------------------------------------------------
//  1. KOLORY MATERIAŁÓW
// ------------------------------------------------------------
const COLORS = [
    {
        value: '#8B5A2B',
        name: 'Dąb Craft Złoty',
        textureImg: 'img/dabduze.jpg',
        code: '0',
    },
    {
        value: '#FFFFFF',
        name: 'Biały matowy',
        textureImg: 'img/bialyduze.jpg',
        code: '1',
    },
    {
        value: '#000000',
        name: 'Czarny matowy',
        textureImg: 'img/czarnyduze.jpg',
        code: '2',
    },
];

// ------------------------------------------------------------
//  2. TYPY PÓŁEK
// ------------------------------------------------------------
const SHELF_TYPES = [
    {
        id: 'hanging',
        code: 'h',
        name: 'Wisząca',
        widths: [34, 44, 50, 60],
        allowCustomWidth: {
            min: 35,
            max: 59,
        },
        heights: [40, 60, 80],
        depths: null,
        shelfCountsByHeight: {
            40: [1, 2],
            60: [1, 2, 3],
            80: [1, 2, 3, 4, 5],
        },
        options: {
            noTopShelf: true,
            noBottomShelf: false,
            customPositions: true,
        },
        mugMount: false,
        mugDividers: false,
        isModular: false,
        images: [],
        galleryIndex: 0,
    },
    {
        id: 'standing',
        code: 's',
        name: 'Stojąca na blacie',
        widths: [34, 44, 50, 60],
        allowCustomWidth: {
            min: 35,
            max: 59,
        },
        heights: [40, 60, 80],
        depths: null,
        shelfCountsByHeight: {
            40: [1, 2],
            60: [1, 2, 3],
            80: [1, 2, 3, 4, 5],
        },
        options: {
            noTopShelf: true,
            noBottomShelf: true,
            customPositions: true,
        },
        mugMount: false,
        mugDividers: false,
        isModular: false,
        images: [],
        galleryIndex: 1,
    },
    {
        id: 'mug_shelf',
        code: 'm',
        name: 'Półka na kubki',
        widths: [44, 60, 84],
        allowCustomWidth: false,
        heights: [40, 60],
        depths: [10],
        shelfCountsByHeight: {
            40: [2],
            60: [3],
        },
        options: {
            noTopShelf: false,
            noBottomShelf: false,
            customPositions: false,
        },
        mugMount: true,
        mugDividers: true,
        isModular: false,
        images: [],
        galleryIndex: 2,
    },
    {
        id: 'modular',
        code: 'M',
        name: 'Półka modułowa',
        widths: [],
        allowCustomWidth: false,
        heights: [],
        depths: null,
        shelfCountsByHeight: {},
        options: {
            noTopShelf: true,
            noBottomShelf: true,
            customPositions: false,
        },
        mugMount: false,
        mugDividers: false,
        isModular: true,
        moduleWidths: [34, 44, 50, 60],
        moduleHeights: [40, 60],
        connectingShelfWidths: [30, 40],
        images: [],
        galleryIndex: 3,
    }











,
{
    id: 'custom_wzor1_jcb8',
    code: 'cust',
    name: 'wzór1',
    isCustomLayout: true,
    width: 84,
    height: 40,
    depth: 10,
    shelfCount: 2,
    sideColor: '#8b5a2b',
    shelfColor: '#8b5a2b',
    noTopShelf: false,
    noBottomShelf: false,
    shelves: [
        {
            width: 28,
            offsetX: -26.2,
            y: -6.4
        },
        {
            width: 80.4,
            offsetX: 0,
            y: 6.4
        }
    ],
    dividers: [
        {
            x: -13,
            fromY: -18.2,
            toY: -7.3
        }
    ],
    widths: [],
    heights: [],
    depths: null,
    shelfCountsByHeight: {},
    allowCustomWidth: false,
    options: {
        noTopShelf: false,
        noBottomShelf: false,
        customPositions: false
    },
    mugMount: false,
    mugDividers: false,
    isModular: false,
    galleryIndex: 0,
    buyerOptions: {
        allowedWidths: [
            60,
            84
        ],
        allowDepth15: false,
        allowNoTopShelf: true,
        allowNoBottomShelf: false,
        allowTypeChoice: true
    }
}
,
{
    id: 'custom_wzor2_6rw8',
    code: 'cust',
    name: 'wzór2',
    isCustomLayout: true,
    width: 84,
    height: 40,
    depth: 10,
    shelfCount: 2,
    sideColor: '#8b5a2b',
    shelfColor: '#8b5a2b',
    noTopShelf: false,
    noBottomShelf: false,
    shelves: [
        {
            width: 28,
            offsetX: -26.2,
            y: -6.4
        },
        {
            width: 80.4,
            offsetX: 0,
            y: 6.4
        }
    ],
    dividers: [
        {
            x: -13,
            fromY: -18.2,
            toY: -7.3
        },
        {
            x: -20.5,
            fromY: 7.3,
            toY: 18.2
        },
        {
            x: -0.5,
            fromY: 7.3,
            toY: 18.2
        },
        {
            x: 21.5,
            fromY: 7.3,
            toY: 18.2
        }
    ],
    widths: [],
    heights: [],
    depths: null,
    shelfCountsByHeight: {},
    allowCustomWidth: false,
    options: {
        noTopShelf: false,
        noBottomShelf: false,
        customPositions: false
    },
    mugMount: false,
    mugDividers: false,
    isModular: false,
    galleryIndex: 0,
    buyerOptions: {
        allowedWidths: [
            84
        ],
        allowDepth15: false,
        allowNoTopShelf: false,
        allowNoBottomShelf: false,
        allowTypeChoice: false
    }
}
];

// ------------------------------------------------------------
//  3. GALERIA ZDJĘĆ
// ------------------------------------------------------------
const galleryData = [
    {
        "title": "Półki wiszące",
        "imgs": [
            [
                "img/wiszace/1/1.jpg"
            ],
            [
                "img/wiszace/2/1.jpg"
            ],
            [
                "img/wiszace/3/1.jpg"
            ],
            [
                "img/wiszace/4/1.jpg"
            ],
            [
                "img/wiszace/5/1.jpg"
            ],
            [
                "img/wiszace/6/1.jpg"
            ],
            [
                "img/wiszace/7/1.jpg"
            ],
            [
                "img/wiszace/8/1.jpg"
            ],
            [
                "img/wiszace/9/1.jpg"
            ],
            [
                "img/wiszace/10/1.jpg"
            ],
            [
                "img/wiszace/11/1.jpg"
            ],
            [
                "img/wiszace/12/1.jpg"
            ],
            [
                "img/wiszace/13/1.jpg"
            ],
            [
                "img/wiszace/14/1.jpg"
            ],
            [
                "img/wiszace/15/1.jpg"
            ]
        ],
        "extras": []
    },
    {
        "title": "Półki stojące",
        "imgs": [
            [
                "img/stojace/1/1.jpg"
            ],
            [
                "img/stojace/2/1.jpg"
            ],
            [
                "img/stojace/3/1.jpg"
            ],
            [
                "img/stojace/4/1.jpg"
            ],
            [
                "img/stojace/5/1.jpg"
            ],
            [
                "img/stojace/6/1.jpg"
            ],
            [
                "img/stojace/7/1.jpg"
            ],
            [
                "img/stojace/8/1.jpg"
            ],
            [
                "img/stojace/9/1.jpg"
            ],
            [
                "img/stojace/10/1.jpg"
            ],
            [
                "img/stojace/11/1.jpg"
            ]
        ],
        "extras": []
    },
    {
        "title": "Półki na kubki",
        "imgs": [
            [
                "img/kubki/1/1.jpg"
            ],
            [
                "img/kubki/2/1.jpg"
            ],
            [
                "img/kubki/3/1.jpg"
            ],
            [
                "img/kubki/4/1.jpg"
            ],
            [
                "img/kubki/5/1.jpg"
            ],
            [
                "img/kubki/6/1.jpg"
            ],
            [
                "img/kubki/7/1.jpg"
            ],
            [
                "img/kubki/8/1.jpg"
            ],
            [
                "img/kubki/9/1.jpg"
            ],
            [
                "img/kubki/10/1.jpg"
            ],
            [
                "img/kubki/11/1.jpg"
            ],
            [
                "img/kubki/12/1.jpg"
            ],
            [
                "img/kubki/13/1.jpg"
            ],
            [
                "img/kubki/14/1.jpg"
            ],
            [
                "img/kubki/15/1.jpg"
            ]
        ],
        "extras": []
    },
    {
        "title": "Półka modułowa",
        "imgs": [
            [
                "img/modulowa/1/1.jpg"
            ],
            [
                "img/modulowa/1/1.jpg"
            ],
            [
                "img/modulowa/2/1.jpg"
            ]
        ],
        "extras": []
    },
    {
        "title": "Pozostałe półki",
        "imgs": [
            ["img/pozostale/1.jpg"],
            ["img/pozostale/2.jpg"],
            ["img/pozostale/3.jpg"],
            ["img/pozostale/4.jpg"],
            ["img/pozostale/5.jpg"],
            ["img/pozostale/6.jpg"],
            ["img/pozostale/7.jpg"],
            ["img/pozostale/8.jpg"],
            ["img/pozostale/9.jpg"],
            ["img/pozostale/10.jpg"],
            ["img/pozostale/11.jpg"],
            ["img/pozostale/12.jpg"],
            ["img/pozostale/13.jpg"],
            ["img/pozostale/14.jpg"],
            ["img/pozostale/15.jpg"],
            ["img/pozostale/16.jpg"],
            ["img/pozostale/17.jpg"],
            ["img/pozostale/18.jpg"],
            ["img/pozostale/19.jpg"],
            ["img/pozostale/20.jpg"],
            ["img/pozostale/21.jpg"],
            ["img/pozostale/22.jpg"],
            ["img/pozostale/23.jpg"],
            ["img/pozostale/24.jpg"],
            ["img/pozostale/25.jpg"]
        ],
        "extras": []
    }
];

// ------------------------------------------------------------
//  4. KONFIGURACJE PODGLĄDU 3D W GALERII
// ------------------------------------------------------------
const wiszace_configs = [
    {
        "type": "hanging",
        "sideColor": "#8B5A2B",
        "shelfColor": "#8B5A2B",
        "width": "44",
        "height": "80",
        "depth": "10",
        "shelfCount": "5",
        "noTopShelf": false
    },
    {
        "type": "hanging",
        "sideColor": "#FFFFFF",
        "shelfColor": "#FFFFFF",
        "width": "44",
        "height": "80",
        "depth": "10",
        "shelfCount": "5",
        "noTopShelf": false
    },
    {
        "type": "hanging",
        "sideColor": "#8B5A2B",
        "shelfColor": "#FFFFFF",
        "width": "44",
        "height": "80",
        "depth": "10",
        "shelfCount": "5",
        "noTopShelf": false
    },
    {
        "type": "hanging",
        "sideColor": "#000000",
        "shelfColor": "#8B5A2B",
        "height": "80",
        "width": "44",
        "depth": "10",
        "shelfCount": "5"
    },
    {
        "type": "hanging",
        "sideColor": "#000000",
        "shelfColor": "#000000",
        "height": "80",
        "width": "44",
        "depth": "10",
        "shelfCount": "5"
    },
    {
        "type": "hanging",
        "sideColor": "#8B5A2B",
        "shelfColor": "#8B5A2B",
        "width": "60",
        "height": "40",
        "depth": "10",
        "shelfCount": "2",
        "noTopShelf": false
    },
    {
        "type": "hanging",
        "sideColor": "#FFFFFF",
        "shelfColor": "#FFFFFF",
        "width": "60",
        "height": "40",
        "depth": "10",
        "shelfCount": "2",
        "noTopShelf": false
    },
    {
        "type": "hanging",
        "sideColor": "#000000",
        "shelfColor": "#8B5A2B",
        "width": "60",
        "height": "40",
        "depth": "10",
        "shelfCount": "2",
        "noTopShelf": false
    },
    {
        "type": "hanging",
        "sideColor": "#000000",
        "shelfColor": "#000000",
        "width": "60",
        "height": "40",
        "depth": "10",
        "shelfCount": "2",
        "noTopShelf": false
    },
    {
        "type": "hanging",
        "sideColor": "#8B5A2B",
        "shelfColor": "#FFFFFF",
        "width": "60",
        "height": "40",
        "depth": "10",
        "shelfCount": "2",
        "noTopShelf": false
    },
    {
        "type": "hanging",
        "sideColor": "#FFFFFF",
        "shelfColor": "#FFFFFF",
        "width": "44",
        "height": "60",
        "depth": "10",
        "shelfCount": "2",
        "noTopShelf": false
    },
    {
        "type": "hanging",
        "sideColor": "#000000",
        "shelfColor": "#8B5A2B",
        "width": "44",
        "height": "60",
        "depth": "10",
        "shelfCount": "3",
        "noTopShelf": true
    },
    {
        "type": "hanging",
        "sideColor": "#FFFFFF",
        "shelfColor": "#8B5A2B",
        "width": "44",
        "height": "60",
        "depth": "10",
        "shelfCount": "2",
        "noTopShelf": true
    },
    {
        "type": "hanging",
        "sideColor": "#000000",
        "shelfColor": "#000000",
        "width": "44",
        "height": "60",
        "depth": "10",
        "shelfCount": "3",
        "noTopShelf": true
    },
    {
        "type": "hanging",
        "sideColor": "#FFFFFF",
        "shelfColor": "#8B5A2B",
        "width": "44",
        "height": "40",
        "depth": "10",
        "shelfCount": "2",
        "noTopShelf": true
    }
];

const stojace_configs = [
    {
        "type": "standing",
        "sideColor": "#8B5A2B",
        "shelfColor": "#8B5A2B",
        "height": "40",
        "width": "60",
        "depth": "10",
        "shelfCount": "2"
    },
    {
        "type": "standing",
        "sideColor": "#FFFFFF",
        "shelfColor": "#8B5A2B",
        "height": "40",
        "width": "60",
        "depth": "10",
        "shelfCount": "2"
    },
    {
        "type": "standing",
        "sideColor": "#8B5A2B",
        "shelfColor": "#000000",
        "width": "60",
        "height": "40",
        "depth": "10",
        "shelfCount": "2",
        "noTopShelf": true,
        "noBottomShelf": true
    },
    {
        "type": "standing",
        "sideColor": "#FFFFFF",
        "shelfColor": "#FFFFFF",
        "width": "60",
        "height": "40",
        "depth": "10",
        "shelfCount": "2",
        "noTopShelf": false,
        "noBottomShelf": false
    },
    {
        "type": "standing",
        "sideColor": "#000000",
        "shelfColor": "#000000",
        "width": "60",
        "height": "40",
        "depth": "10",
        "shelfCount": "2",
        "noTopShelf": false,
        "noBottomShelf": false
    },
    {
        "type": "standing",
        "sideColor": "#8B5A2B",
        "shelfColor": "#8B5A2B",
        "width": "60",
        "height": "40",
        "depth": "10",
        "shelfCount": "2",
        "noTopShelf": false,
        "noBottomShelf": true
    },
    {
        "type": "standing",
        "sideColor": "#8B5A2B",
        "shelfColor": "#FFFFFF",
        "width": "60",
        "height": "40",
        "depth": "10",
        "shelfCount": "2",
        "noTopShelf": false,
        "noBottomShelf": true
    },
    {
        "type": "standing",
        "sideColor": "#8B5A2B",
        "shelfColor": "#8B5A2B",
        "width": "60",
        "height": "40",
        "depth": "15",
        "shelfCount": "2",
        "noTopShelf": true,
        "noBottomShelf": true
    },
    {
        "type": "standing",
        "sideColor": "#000000",
        "shelfColor": "#8B5A2B",
        "width": "60",
        "height": "40",
        "depth": "15",
        "shelfCount": "2",
        "noTopShelf": true,
        "noBottomShelf": true
    },
    {
        "type": "standing",
        "sideColor": "#8B5A2B",
        "shelfColor": "#8B5A2B",
        "width": "60",
        "height": "40",
        "depth": "10",
        "shelfCount": "2",
        "noTopShelf": true,
        "noBottomShelf": true
    },
    {
        "type": "standing",
        "sideColor": "#000000",
        "shelfColor": "#8B5A2B",
        "width": "44",
        "height": "40",
        "depth": "10",
        "shelfCount": "2",
        "noTopShelf": true,
        "noBottomShelf": true
    }
];

const kubki_configs = [
    {
        "type": "mug_shelf",
        "sideColor": "#000000",
        "shelfColor": "#8B5A2B",
        "width": "44",
        "height": "40",
        "mount": "standing",
        "dividers": {
            "top": true,
            "middle": true,
            "bottom": true
        }
    },
    {
        "type": "mug_shelf",
        "sideColor": "#8B5A2B",
        "shelfColor": "#8B5A2B",
        "width": "60",
        "height": "40",
        "mount": "standing",
        "dividers": {
            "top": true,
            "middle": true,
            "bottom": true
        }
    },
    {
        "type": "mug_shelf",
        "sideColor": "#8B5A2B",
        "shelfColor": "#FFFFFF",
        "width": "60",
        "height": "40",
        "mount": "standing",
        "dividers": {
            "top": true,
            "middle": true,
            "bottom": true
        }
    },
    {
        "type": "mug_shelf",
        "sideColor": "#8B5A2B",
        "shelfColor": "#000000",
        "width": "60",
        "height": "40",
        "mount": "standing",
        "dividers": {
            "top": true,
            "middle": true,
            "bottom": true
        }
    },
    {
        "type": "mug_shelf",
        "sideColor": "#8B5A2B",
        "shelfColor": "#8B5A2B",
        "width": "44",
        "height": "40",
        "mount": "standing",
        "dividers": {
            "top": true,
            "middle": true,
            "bottom": true
        }
    },
    {
        "type": "mug_shelf",
        "sideColor": "#8B5A2B",
        "shelfColor": "#8B5A2B",
        "width": "60",
        "height": "40",
        "mount": "standing",
        "dividers": {
            "top": true,
            "middle": false,
            "bottom": true
        }
    },
    {
        "type": "mug_shelf",
        "sideColor": "#8B5A2B",
        "shelfColor": "#000000",
        "width": "60",
        "height": "40",
        "mount": "standing",
        "dividers": {
            "top": true,
            "middle": false,
            "bottom": true
        }
    },
    {
        "type": "mug_shelf",
        "sideColor": "#8B5A2B",
        "shelfColor": "#FFFFFF",
        "width": "60",
        "height": "40",
        "mount": "standing",
        "dividers": {
            "top": true,
            "middle": false,
            "bottom": true
        }
    },
    {
        "type": "mug_shelf",
        "sideColor": "#8B5A2B",
        "shelfColor": "#8B5A2B",
        "width": "60",
        "height": "40",
        "mount": "hanging",
        "dividers": {
            "top": true,
            "middle": true,
            "bottom": true
        }
    },
    {
        "type": "mug_shelf",
        "sideColor": "#8B5A2B",
        "shelfColor": "#FFFFFF",
        "width": "60",
        "height": "40",
        "mount": "hanging",
        "dividers": {
            "top": true,
            "middle": true,
            "bottom": true
        }
    },
    {
        "type": "mug_shelf",
        "sideColor": "#8B5A2B",
        "shelfColor": "#000000",
        "width": "44",
        "height": "40",
        "mount": "hanging",
        "dividers": {
            "top": true,
            "middle": true,
            "bottom": true
        }
    },
    {
        "type": "mug_shelf",
        "sideColor": "#8B5A2B",
        "shelfColor": "#8B5A2B",
        "width": "44",
        "height": "60",
        "mount": "standing",
        "dividers": {
            "top": true,
            "middle": true,
            "bottom": true
        }
    },
    {
        "type": "mug_shelf",
        "sideColor": "#8B5A2B",
        "shelfColor": "#8B5A2B",
        "width": "44",
        "height": "60",
        "mount": "hanging",
        "dividers": {
            "top": true,
            "middle": true,
            "bottom": true
        }
    },
    {
        "type": "mug_shelf",
        "sideColor": "#8B5A2B",
        "shelfColor": "#8B5A2B",
        "width": "84",
        "height": "40",
        "mount": "standing",
        "dividers": {
            "top": true,
            "middle": true,
            "bottom": true
        }
    },
    {
        "type": "mug_shelf",
        "sideColor": "#8B5A2B",
        "shelfColor": "#8B5A2B",
        "width": "44",
        "height": "40",
        "mount": "standing",
        "dividers": {
            "top": true,
            "middle": true,
            "bottom": true
        }
    }
];

const modular_configs = [
    {
        "type": "modular",
        "sideColor": "#8B5A2B",
        "shelfColor": "#8B5A2B"
    },
    {
        "type": "modular",
        "sideColor": "#8B5A2B",
        "shelfColor": "#8B5A2B"
    },
    {
        "type": "modular",
        "sideColor": "#8B5A2B",
        "shelfColor": "#8B5A2B"
    }
];

const custom_configs = [
    {
        "type": "custom_layout",
        "patternId": "custom_wzor1_jcb8",
        "sideColor": "#8b5a2b",
        "shelfColor": "#8b5a2b"
    },
    {
        "type": "custom_layout",
        "sideColor": "#8B5A2B",
        "shelfColor": "#8B5A2B",
        "patternId": "custom_wzor2_6rw8"
    }
];

const predefinedShelfConfigurations = [wiszace_configs, stojace_configs, kubki_configs, modular_configs, custom_configs];


// ============================================================
//  CENY — scalone z ceny.js
// ============================================================
const pricing = {
    "34": {
        "40": {
            "10": {
                "1": 125,
                "2": 150
            },
            "15": {
                "1": 225,
                "2": 250
            }
        },
        "60": {
            "10": {
                "1": 150,
                "2": 175,
                "3": 200
            },
            "15": {
                "1": 250,
                "2": 275,
                "3": 300
            }
        },
        "80": {
            "10": {
                "1": 209,
                "2": 223,
                "3": 237,
                "4": 251,
                "5": 279
            },
            "15": {
                "1": 309,
                "2": 323,
                "3": 337,
                "4": 351,
                "5": 379
            }
        }
    },
    "44": {
        "40": {
            "10": {
                "1": 159,
                "2": 169
            },
            "15": {
                "1": 259,
                "2": 269
            }
        },
        "60": {
            "10": {
                "1": 199,
                "2": 209,
                "3": 219
            },
            "15": {
                "1": 299,
                "2": 309,
                "3": 319
            }
        },
        "80": {
            "10": {
                "1": 224,
                "2": 239,
                "3": 254,
                "4": 269,
                "5": 299
            },
            "15": {
                "1": 324,
                "2": 339,
                "3": 354,
                "4": 369,
                "5": 399
            }
        }
    },
    "50": {
        "40": {
            "10": {
                "1": 169,
                "2": 179
            },
            "15": {
                "1": 269,
                "2": 279
            }
        },
        "60": {
            "10": {
                "1": 209,
                "2": 219,
                "3": 229
            },
            "15": {
                "1": 309,
                "2": 319,
                "3": 329
            }
        },
        "80": {
            "10": {
                "1": 246,
                "2": 263,
                "3": 280,
                "4": 296,
                "5": 329
            },
            "15": {
                "1": 346,
                "2": 363,
                "3": 380,
                "4": 396,
                "5": 429
            }
        }
    },
    "60": {
        "40": {
            "10": {
                "1": 184,
                "2": 194
            },
            "15": {
                "1": 284,
                "2": 294
            }
        },
        "60": {
            "10": {
                "1": 229,
                "2": 239,
                "3": 249
            },
            "15": {
                "1": 329,
                "2": 339,
                "3": 349
            }
        },
        "80": {
            "10": {
                "1": 261,
                "2": 279,
                "3": 297,
                "4": 314,
                "5": 349
            },
            "15": {
                "1": 361,
                "2": 379,
                "3": 397,
                "4": 414,
                "5": 449
            }
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
    "44": {
        "40": 169,
        "60": 189
    },
    "60": {
        "40": 179,
        "60": 219
    },
    "84": {
        "40": 299
    }
};


// ------------------------------------------------------------
//  3. DOPŁATY I ODLICZENIA
// ------------------------------------------------------------
const FEES = {
    "customWidth": 50,
    "customPositions": 50,
    "noTopShelf": 10,
    "noBottomShelf": 10,
    "modularNoTop": 20,
    "modularNoBottom": 20,
    "modularConnector": {
        "30": 10,
        "40": 15
    },
    "minPrice": 50,
    "modularMinPrice": 100
};


// ------------------------------------------------------------
//  4. RABATY KOSZYKOWE
//     discount1item  — rabat na 1 sztukę (gdy koszyk ma 1 produkt)
//     discountBest   — rabat na najdroższy produkt (koszyk 2+)
//     discountCheap  — rabat na najtańszy produkt (koszyk 2+)
//     Wartości: 0.10 = 10%, 0.25 = 25% itd.
// ------------------------------------------------------------
const DISCOUNTS = {
    "discount1item": 0.1,
    "discountBest": 0.1,
    "discountCheap": 0.25
};


// ------------------------------------------------------------
//  5. CENY NIESTANDARDOWYCH WZORÓW (custom layouts)
//     Klucz = id wzoru z wzory.js, wartość = cena w zł
// ------------------------------------------------------------
const customPrices = {
    'custom_wzo777_4z48': 180,
    'custom_aaaaa_wcrv': 180,
    'custom_wzor_1_qyal': 296,
    'custom_wzor_1_ky2c': 0,
    'custom_wzor1_j4v6': 0,
    'custom_wzor1_jcb8': 299,
    'custom_wzor2_6rw8': 319
};