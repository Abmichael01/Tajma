
PROPERTY_CATEGORY = {
    "name": "Real Estate",
    "icon": "Home",
    "type": "product",
    "custom_fields": [
        {
            "name": "type",
            "label": "Property Type",
            "type": "select",
            "options": [
                {"value": "flat", "label": "Flat / Apartment"},
                {"value": "house", "label": "House"},
                {"value": "land", "label": "Land"},
                {"value": "commercial", "label": "Commercial Property"},
                {"value": "event-centre", "label": "Event Centre / Venue"},
                {"value": "office", "label": "Office Space"}
            ],
            "required": True
        }
    ],
    "children": [
        # LEVEL 2: HOUSES & APARTMENTS FOR RENT
        {
            "name": "Houses & Apartments for Rent",
            "custom_fields": [
                 {
                    "name": "bedrooms",
                    "label": "Bedrooms",
                    "type": "number",
                    "required": True
                 },
                 {
                    "name": "bathrooms",
                    "label": "Bathrooms",
                    "type": "number",
                    "required": False
                 },
                 {
                    "name": "toilets",
                    "label": "Toilets",
                    "type": "number",
                    "required": False
                 },
                 {
                    "name": "furnishing",
                    "label": "Furnishing",
                    "type": "select",
                    "options": [
                        {"value": "furnished", "label": "Furnished"},
                        {"value": "semi-furnished", "label": "Semi-Furnished"},
                        {"value": "unfurnished", "label": "Unfurnished"}
                    ]
                 },
                 {
                    "name": "facilities",
                    "label": "Facilities",
                    "type": "checkbox_group",
                    "options": [
                         {"value": "pop-ceiling", "label": "POP Ceiling"},
                         {"value": "tiled-floor", "label": "Tiled Floor"},
                         {"value": "running-water", "label": "Running Water"},
                         {"value": "kitchen-cabinets", "label": "Kitchen Cabinets"},
                         {"value": "water-heater", "label": "Water Heater"},
                         {"value": "wardrobe", "label": "Wardrobes"},
                         {"value": "electricity", "label": "24h Electricity"},
                         {"value": "security", "label": "Security"},
                         {"value": "parking", "label": "Parking Space"},
                         {"value": "pool", "label": "Swimming Pool"},
                         {"value": "gym", "label": "Gym"}
                    ]
                 },
                 {
                    "name": "service_charge",
                    "label": "Service Charge / Agency Fee (₦)",
                    "type": "number",
                     "placeholder": "Enter 0 if none"
                 },
                 {
                    "name": "total_area",
                    "label": "Total Area (sqm)",
                    "type": "number"
                 }
            ],
            "children": [
                {"name": "Mini Flats (Room & Parlour)"},
                {"name": "Self Contain (Studio)"},
                {"name": "Shared Apartments (Flatshare)"},
                {"name": "2 Bedroom Flats"},
                {"name": "3 Bedroom Flats"},
                {"name": "4+ Bedroom Flats"},
                {"name": "Detached Duplexes"},
                {"name": "Semi-Detached Duplexes"},
                {"name": "Terrace Duplexes"},
                {"name": "Bungalows"},
                {"name": "Boys Quarters (BQ)"},
                {"name": "Penthouse"}
            ]
        },

        # LEVEL 2: HOUSES & APARTMENTS FOR SALE
        {
            "name": "Houses & Apartments for Sale",
             "custom_fields": [
                 {
                    "name": "bedrooms",
                    "label": "Bedrooms",
                    "type": "number",
                    "required": True
                 },
                 {
                    "name": "bathrooms",
                    "label": "Bathrooms",
                    "type": "number"
                 },
                 {
                    "name": "furnishing",
                    "label": "Furnishing",
                    "type": "select",
                    "options": [
                        {"value": "furnished", "label": "Furnished"},
                        {"value": "semi-furnished", "label": "Semi-Furnished"},
                        {"value": "unfurnished", "label": "Unfurnished"}
                    ]
                 },
                 {
                    "name": "property_status",
                    "label": "Status",
                    "type": "select",
                    "options": [
                        {"value": "newly-built", "label": "Newly Built"},
                        {"value": "off-plan", "label": "Off Plan"},
                        {"value": "old", "label": "Old / Renovation Needed"}
                    ]
                 }
            ],
            "children": [
                {"name": "Duplexes for Sale"},
                {"name": "Flats & Apartments for Sale"},
                {"name": "Bungalows for Sale"},
                {"name": "Mansions for Sale"},
                {"name": "Blocks of Flats"}
            ]
        },

        # LEVEL 2: LAND & PLOTS
        {
            "name": "Land & Plots",
            "custom_fields": [
                 {
                    "name": "size",
                    "label": "Size",
                    "type": "number",
                    "placeholder": "Size in square meters"
                 },
                 {
                    "name": "unit",
                    "label": "Unit",
                    "type": "select",
                    "options": [
                        {"value": "sqm", "label": "Square Meters"},
                        {"value": "plots", "label": "Plots"},
                        {"value": "acres", "label": "Acres"},
                        {"value": "hectares", "label": "Hectares"}
                    ],
                    "required": True
                 },
                 {
                    "name": "documents",
                    "label": "Title Documents",
                    "type": "checkbox_group",
                    "options": [
                        {"value": "c-of-o", "label": "Certificate of Occupancy (C of O)"},
                        {"value": "r-of-o", "label": "Right of Occupancy"},
                        {"value": "deed", "label": "Deed of Assignment"},
                        {"value": "survey", "label": "Survey Plan"},
                        {"value": "excision", "label": "Government Excision"},
                        {"value": "gazette", "label": "Gazette"},
                        {"value": "receipt", "label": "Family Receipt"}
                    ]
                 },
                 {
                    "name": "usage",
                    "label": "Land Use",
                    "type": "select",
                    "options": [
                        {"value": "residential", "label": "Residential"},
                        {"value": "commercial", "label": "Commercial"},
                        {"value": "mixed", "label": "Mixed Use"},
                        {"value": "industrial", "label": "Industrial"},
                        {"value": "agricultural", "label": "Agricultural"}
                    ]
                 }
            ],
            "children": [
                {"name": "Residential Land"},
                {"name": "Commercial Land"},
                {"name": "Industrial Land"},
                {"name": "Agricultural Land / Farmland"}
            ]
        },

        # LEVEL 2: SHORT LET
        {
            "name": "Short Let",
            "custom_fields": [
                 {"name": "price_per", "label": "Price Per", "type": "select", "options": [{"value": "night", "label": "Night"}, {"value": "week", "label": "Week"}, {"value": "month", "label": "Month"}]},
                 {"name": "bedrooms", "label": "Bedrooms", "type": "number"},
                 {"name": "facilities", "label": "Services", "type": "checkbox_group", "options": [{"value": "wifi", "label": "WiFi"}, {"value": "dstv", "label": "DSTV/Cable"}, {"value": "cleaning", "label": "Housekeeping"}, {"value": "pool", "label": "Pool"}]}
            ],
            "children": [
                {"name": "Flats & Apartments Short Let"},
                {"name": "Houses Short Let"},
                {"name": "Conference Rooms & Halls"}
            ]
        },

        # LEVEL 2: COMMERCIAL PROPERTY
        {
            "name": "Commercial Property",
            "children": [
                {"name": "Office Spaces"},
                {"name": "Shops & Stores"},
                {"name": "Warehouses"},
                {"name": "Hotels & Guest Houses"},
                {"name": "Event Centres"},
                {"name": "filling-stations", "label": "Filling Stations / Tanks"}
            ]
        }
    ]
}
