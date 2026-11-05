const Product = require("../models/product");
const Service = require("../models/service");

const sampleProducts = [
    {
        name: "Presage Cocktail Time",
        brand: "Seiko",
        category: "dress",
        movement: "automatic",
        caseSize: 40,
        condition: "new",
        price: 28500,
        description: "A refined automatic dress watch featuring a sunray guilloché dial inspired by Tokyo's Star Bar lounges, paired with box-shaped crystal and exhibition caseback.",
        images: [
            {
                public_id: "seed-seiko-presage-1",
                url: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=1000&q=85"
            },
            {
                public_id: "seed-seiko-presage-2",
                url: "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?auto=format&fit=crop&w=1000&q=85"
            }
        ],
        stock: 8,
        isActive: true,
        ratings: 4.5,
        numOfReviews: 12
    },
    {
        name: "Black Bay 58",
        brand: "Tudor",
        category: "diver",
        movement: "automatic",
        caseSize: 39,
        condition: "new",
        price: 148000,
        description: "A 39mm heritage diver powered by the COSC-certified Manufacture Calibre MT5402 with 70-hour power reserve, gilt dial accents, and snowflake hands.",
        images: [
            {
                public_id: "seed-tudor-bb58-1",
                url: "https://images.unsplash.com/photo-1533139502658-0198f920d8e8?auto=format&fit=crop&w=1000&q=85"
            },
            {
                public_id: "seed-tudor-bb58-2",
                url: "https://images.unsplash.com/photo-1548171915-e79a380a2a4b?auto=format&fit=crop&w=1000&q=85"
            }
        ],
        stock: 4,
        isActive: true,
        ratings: 4.9,
        numOfReviews: 21
    },
    {
        name: "Datejust 36 Fluted Jubilee",
        brand: "Rolex",
        category: "dress",
        movement: "automatic",
        caseSize: 36,
        condition: "new",
        price: 265000,
        description: "An enduring icon in Oystersteel and 18k white gold featuring a fluted bezel, sunray silver dial, Cyclops date lens, and five-piece link Jubilee bracelet.",
        images: [
            {
                public_id: "seed-rolex-dj36-1",
                url: "https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&w=1000&q=85"
            },
            {
                public_id: "seed-rolex-dj36-2",
                url: "https://images.unsplash.com/photo-1587836374828-4dbafa94cf0e?auto=format&fit=crop&w=1000&q=85"
            }
        ],
        stock: 3,
        isActive: true,
        ratings: 4.8,
        numOfReviews: 9
    },
    {
        name: "Aquascape 200M Spring Drive",
        brand: "Grand Seiko",
        category: "diver",
        movement: "automatic",
        caseSize: 41,
        condition: "new",
        price: 118000,
        description: "Finished with Zaratsu distortion-free mirror polishing and a wave-textured dial, delivering 200m professional diver capability and glide-wheel precision.",
        images: [
            {
                public_id: "seed-gs-aquascape-1",
                url: "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?auto=format&fit=crop&w=1000&q=85"
            }
        ],
        stock: 5,
        isActive: true,
        ratings: 3.5,
        numOfReviews: 6
    },
    {
        name: "Speedmaster Professional 3861",
        brand: "Omega",
        category: "chronograph",
        movement: "manual",
        caseSize: 42,
        condition: "new",
        price: 196000,
        description: "The legendary Moonwatch powered by the Co-Axial Master Chronometer Calibre 3861 with stepped matte black dial, tachymeter scale, and asymmetric 42mm case.",
        images: [
            {
                public_id: "seed-omega-speedy-1",
                url: "https://images.unsplash.com/photo-1594534475808-b18fc33b045e?auto=format&fit=crop&w=1000&q=85"
            },
            {
                public_id: "seed-omega-speedy-2",
                url: "https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?auto=format&fit=crop&w=1000&q=85"
            }
        ],
        stock: 4,
        isActive: true,
        ratings: 4.6,
        numOfReviews: 14
    },
    {
        name: "Calatrava 5196G Pre-Owned",
        brand: "Patek Philippe",
        category: "dress",
        movement: "manual",
        caseSize: 36,
        condition: "second-hand",
        price: 385000,
        description: "A Bauhaus-inspired 18k white gold Patek Philippe Calatrava housing the manual-wind Caliber 215 PS, accompanied by Geneva archive papers and 2019 service dossier.",
        images: [
            {
                public_id: "seed-patek-calatrava-1",
                url: "https://images.unsplash.com/photo-1508057198894-247b23fe5ade?auto=format&fit=crop&w=1000&q=85"
            }
        ],
        stock: 1,
        isActive: true,
        ratings: 4.9,
        numOfReviews: 3
    },
    {
        name: "Submariner Date 41 Cerachrom",
        brand: "Rolex",
        category: "diver",
        movement: "automatic",
        caseSize: 41,
        condition: "new",
        price: 685000,
        description: "The benchmark among dive watches in Oystersteel with unidirectional black Cerachrom bezel, Chromalight luminescence, and Manufacture Calibre 3235 waterproof to 300 meters.",
        images: [
            {
                public_id: "seed-rolex-submariner-1",
                url: "https://images.unsplash.com/photo-1587836374828-4dbafa94cf0e?auto=format&fit=crop&w=1000&q=85"
            },
            {
                public_id: "seed-rolex-submariner-2",
                url: "https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&w=1000&q=85"
            }
        ],
        stock: 2,
        isActive: true,
        ratings: 5.0,
        numOfReviews: 19
    },
    {
        name: "Royal Oak Selfwinding 15500ST",
        brand: "Audemars Piguet",
        category: "luxury",
        movement: "automatic",
        caseSize: 41,
        condition: "new",
        price: 1850000,
        description: "Iconic octagonal bezel with eight hexagonal white-gold screws, slate-grey Grande Tapisserie dial, integrated hand-finished steel bracelet, and in-house Calibre 4302.",
        images: [
            {
                public_id: "seed-ap-royaloak-1",
                url: "https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?auto=format&fit=crop&w=1000&q=85"
            },
            {
                public_id: "seed-ap-royaloak-2",
                url: "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=1000&q=85"
            }
        ],
        stock: 2,
        isActive: true,
        ratings: 4.9,
        numOfReviews: 11
    },
    {
        name: "Nautilus 5711/1A Blue Dial",
        brand: "Patek Philippe",
        category: "luxury",
        movement: "automatic",
        caseSize: 40,
        condition: "second-hand",
        price: 3950000,
        description: "Gérald Genta's porthole-inspired masterpiece with horizontally embossed blue-black gradient dial, ultra-thin self-winding Caliber 26-330 S C, and full Certificate of Origin.",
        images: [
            {
                public_id: "seed-patek-nautilus-1",
                url: "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=1000&q=85"
            }
        ],
        stock: 1,
        isActive: true,
        ratings: 5.0,
        numOfReviews: 8
    },
    {
        name: "Santos de Cartier Medium",
        brand: "Cartier",
        category: "dress",
        movement: "automatic",
        caseSize: 38,
        condition: "new",
        price: 415000,
        description: "Created in 1904 for aviator Alberto Santos-Dumont, featuring a silvered opaline dial, blued-steel sword hands, sapphire cabochon crown, and QuickSwitch interchangeable bracelet.",
        images: [
            {
                public_id: "seed-cartier-santos-1",
                url: "https://images.unsplash.com/photo-1509048191080-d2984bad6ae5?auto=format&fit=crop&w=1000&q=85"
            },
            {
                public_id: "seed-cartier-santos-2",
                url: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=1000&q=85"
            }
        ],
        stock: 6,
        isActive: true,
        ratings: 3.6,
        numOfReviews: 15
    },
    {
        name: "Tank Must SolarBeat",
        brand: "Cartier",
        category: "dress",
        movement: "quartz",
        caseSize: 36,
        condition: "new",
        price: 188000,
        description: "Pure geometric Art Deco lines with Roman numerals, railway minute track, and high-autonomy photovoltaic quartz movement concealed beneath the dial.",
        images: [
            {
                public_id: "seed-cartier-tank-1",
                url: "https://images.unsplash.com/photo-1508057198894-247b23fe5ade?auto=format&fit=crop&w=1000&q=85"
            }
        ],
        stock: 7,
        isActive: true,
        ratings: 2.5,
        numOfReviews: 10
    },
    {
        name: "Portugieser Chronograph IW371605",
        brand: "IWC",
        category: "chronograph",
        movement: "automatic",
        caseSize: 41,
        condition: "new",
        price: 472000,
        description: "Schaffhausen's signature maritime chronograph with recessed sub-dials at 12 and 6 o'clock, slim Rehaut quarter-second scale, blued hands, and in-house 69355 column-wheel caliber.",
        images: [
            {
                public_id: "seed-iwc-portugieser-1",
                url: "https://images.unsplash.com/photo-1539874754764-5a96559165b0?auto=format&fit=crop&w=1000&q=85"
            },
            {
                public_id: "seed-iwc-portugieser-2",
                url: "https://images.unsplash.com/photo-1594534475808-b18fc33b045e?auto=format&fit=crop&w=1000&q=85"
            }
        ],
        stock: 4,
        isActive: true,
        ratings: 4.7,
        numOfReviews: 7
    },
    {
        name: "Big Pilot's Watch 44 Heritage",
        brand: "IWC",
        category: "sports",
        movement: "automatic",
        caseSize: 44,
        condition: "new",
        price: 530000,
        description: "Engineered for cockpit legibility with an oversized conical onion crown, 7-day Pellaton winding system, power-reserve display at 3 o'clock, and soft-iron inner anti-magnetic cage.",
        images: [
            {
                public_id: "seed-iwc-bigpilot-1",
                url: "https://images.unsplash.com/photo-1548171915-e79a380a2a4b?auto=format&fit=crop&w=1000&q=85"
            }
        ],
        stock: 3,
        isActive: true,
        ratings: 3.4,
        numOfReviews: 5
    },
    {
        name: "Heritage White Birch SLGH005",
        brand: "Grand Seiko",
        category: "luxury",
        movement: "automatic",
        caseSize: 40,
        condition: "new",
        price: 525000,
        description: "Winner of the GPHG Men's Watch Prize, showcasing a shimmering white birch bark dial and the revolutionary Hi-Beat 36000 80-Hour Caliber 9SA5 with Dual Impulse Escapement.",
        images: [
            {
                public_id: "seed-gs-whitebirch-1",
                url: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=1000&q=85"
            }
        ],
        stock: 3,
        isActive: true,
        ratings: 4.9,
        numOfReviews: 13
    },
    {
        name: "Seamaster Diver 300M Co-Axial",
        brand: "Omega",
        category: "diver",
        movement: "automatic",
        caseSize: 42,
        condition: "new",
        price: 312000,
        description: "Laser-engraved ceramic wave dial, helium escape valve at 10 o'clock, skeleton rhodium-plated hands, and METAS-certified Master Chronometer Calibre 8800 resistant to 15,000 gauss.",
        images: [
            {
                public_id: "seed-omega-seamaster-1",
                url: "https://images.unsplash.com/photo-1533139502658-0198f920d8e8?auto=format&fit=crop&w=1000&q=85"
            }
        ],
        stock: 6,
        isActive: true,
        ratings: 3.7,
        numOfReviews: 17
    },
    {
        name: "Cosmograph Daytona 116500LN Panda",
        brand: "Rolex",
        category: "chronograph",
        movement: "automatic",
        caseSize: 40,
        condition: "second-hand",
        price: 1620000,
        description: "Pre-owned collector-grade Daytona with white lacquer dial, black snailed chronograph counters, monobloc black Cerachrom tachymeter bezel, and Calibre 4130 vertical clutch movement.",
        images: [
            {
                public_id: "seed-rolex-daytona-1",
                url: "https://images.unsplash.com/photo-1587836374828-4dbafa94cf0e?auto=format&fit=crop&w=1000&q=85"
            }
        ],
        stock: 1,
        isActive: true,
        ratings: 5.0,
        numOfReviews: 16
    },
    {
        name: "Pelagos 39 Titanium",
        brand: "Tudor",
        category: "sports",
        movement: "automatic",
        caseSize: 39,
        condition: "new",
        price: 258000,
        description: "Satin-brushed Grade 2 titanium tool watch with sunray ceramic bezel insert, T-fit rapid-adjustment clasp, and luminescent monobloc ceramic composite hour markers.",
        images: [
            {
                public_id: "seed-tudor-pelagos-1",
                url: "https://images.unsplash.com/photo-1548171915-e79a380a2a4b?auto=format&fit=crop&w=1000&q=85"
            }
        ],
        stock: 5,
        isActive: true,
        ratings: 3.3,
        numOfReviews: 8
    },
    {
        name: "Royal Oak Offshore Diver 42",
        brand: "Audemars Piguet",
        category: "sports",
        movement: "automatic",
        caseSize: 42,
        condition: "new",
        price: 1690000,
        description: "High-complication luxury sports diver with inner rotating dive scale, Méga Tapisserie khaki dial, interchangeable rubber strap system, and 300m depth rating.",
        images: [
            {
                public_id: "seed-ap-offshore-1",
                url: "https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?auto=format&fit=crop&w=1000&q=85"
            }
        ],
        stock: 2,
        isActive: true,
        ratings: 2.2,
        numOfReviews: 6
    },
    {
        name: "9F82 Quartz Grand Heritage",
        brand: "Grand Seiko",
        category: "dress",
        movement: "quartz",
        caseSize: 38,
        condition: "new",
        price: 165000,
        description: "Equipped with the hand-assembled 9F82 thermocompensated quartz caliber accurate to ±10 seconds per year, featuring an instant date-change mechanism and twin-pulse control.",
        images: [
            {
                public_id: "seed-gs-9f82-1",
                url: "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?auto=format&fit=crop&w=1000&q=85"
            }
        ],
        stock: 5,
        isActive: true,
        ratings: 2.8,
        numOfReviews: 9
    },
    {
        name: "GMT-Master II Pepsi Jubilee",
        brand: "Rolex",
        category: "sports",
        movement: "automatic",
        caseSize: 40,
        condition: "new",
        price: 940000,
        description: "Dual-time-zone cosmopolitan reference with red and blue bidirectional 24-hour Cerachrom bezel, independent jumping local hour hand, and Calibre 3285 movement.",
        images: [
            {
                public_id: "seed-rolex-gmt-1",
                url: "https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&w=1000&q=85"
            }
        ],
        stock: 2,
        isActive: true,
        ratings: 4.9,
        numOfReviews: 18
    }
];

const sampleServices = [
    {
        name: "Watch Cleaning",
        description: "Ultrasonic exterior case and bracelet cleaning, micro-steam detailing, and gasket visual inspection.",
        price: 1500,
        isActive: true
    },
    {
        name: "Movement Adjustment",
        description: "Five-position chronometer timing diagnostic, beat-error correction, and escapement regulation.",
        price: 3500,
        isActive: true
    },
    {
        name: "Complete Mechanical Overhaul",
        description: "Full disassembly of the mechanical caliber, ultrasonic bath of all wheel-train components, synthetic Swiss epilame lubrication, reassembly, and 72-hour power reserve testing.",
        price: 18500,
        isActive: true
    },
    {
        name: "Case & Bracelet Refinishing",
        description: "Master Polisher restoration of satin-brushed surfaces and bevelled mirror chamfers using lapping machines while preserving original lug geometry.",
        price: 8500,
        isActive: true
    },
    {
        name: "Sapphire Crystal & Gasket Replacement",
        description: "Precision fitting of anti-reflective scratch-resistant sapphire crystal accompanied by fresh Viton caseback, crown, and pusher seals.",
        price: 6800,
        isActive: true
    },
    {
        name: "Water Resistance & Pressure Certification",
        description: "Dry vacuum deformation and wet barometric condensation chamber testing up to 300m, complete with a printed Witschi pressure certificate.",
        price: 2800,
        isActive: true
    },
    {
        name: "Quartz Cell & Circuit Diagnostic",
        description: "High-drain silver-oxide cell replacement, coil resistance measurement, current consumption audit, and magnetic field demagnetization.",
        price: 2200,
        isActive: true
    },
    {
        name: "Mainspring & Escapement Restoration",
        description: "Replacement of fatigued Nivaflex mainspring barrel assembly, pallet-fork jewel alignment, and balance wheel poise truing.",
        price: 12000,
        isActive: true
    },
    {
        name: "Vintage Dial & Hands Conservation",
        description: "Archival stabilization of aged tritium or radium patina, hand reluming with color-matched Swiss Super-LumiNova, and dial foot micro-laser soldering.",
        price: 15500,
        isActive: true
    },
    {
        name: "Provenance Authentication & Archival Dossier",
        description: "Comprehensive serial/caliber verification under 40x stereomicroscopy, metallurgical XRF hallmark check, and signed Aureo Certificate of Authenticity.",
        price: 9500,
        isActive: true
    }
];

const ensureCatalogSeeded = async () => {
    try {
        for (const product of sampleProducts) {
            await Product.findOneAndUpdate(
                {
                    name: product.name,
                    brand: product.brand
                },
                {
                    $setOnInsert: product
                },
                {
                    upsert: true,
                    returnDocument: "after",
                    setDefaultsOnInsert: true
                }
            );
        }

        for (const service of sampleServices) {
            await Service.findOneAndUpdate(
                {
                    name: service.name
                },
                {
                    $setOnInsert: service
                },
                {
                    upsert: true,
                    returnDocument: "after",
                    setDefaultsOnInsert: true
                }
            );
        }
    } catch (error) {
        console.error("Catalog auto-seed warning:", error.message);
    }
};

module.exports = {
    sampleProducts,
    sampleServices,
    ensureCatalogSeeded
};

