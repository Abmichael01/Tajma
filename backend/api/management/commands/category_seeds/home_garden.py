
HOME_GARDEN_CATEGORY = {
    "name": "Home, Furniture & Garden",
    "icon": "Armchair",
    "type": "product",
    "custom_fields": [
        {
            "name": "condition",
            "label": "Condition",
            "type": "select",
            "options": [
                {"value": "brand-new", "label": "Brand New"},
                {"value": "used", "label": "Used"},
                {"value": "refurbished", "label": "Refurbished"}
            ],
            "required": True
        }
    ],
    "children": [
        {
            "name": "Furniture",
            "custom_fields": [
                {"name": "material", "label": "Material", "type": "text", "placeholder": "e.g. Leather, Fabric, Wood, Glass, Metal"},
                {"name": "colour", "label": "Colour", "type": "text"},
                {"name": "brand", "label": "Brand", "type": "text"}
            ],
            "children": [
                {"name": "Living Room Furniture", "children": [{"name": "Sofas & Couches"}, {"name": "TV Stands & Media Units"}, {"name": "Center Tables"}, {"name": "Bean Bags"}]},
                {"name": "Bedroom Furniture", "children": [{"name": "Beds & Bed Frames"}, {"name": "Mattresses"}, {"name": "Wardrobes"}, {"name": "Dressers & Mirrors"}, {"name": "Bedside Tables"}]},
                {"name": "Office Furniture", "children": [{"name": "Office Chairs"}, {"name": "Office Desks"}, {"name": "Workstations"}]},
                {"name": "Kitchen & Dining Furniture", "children": [{"name": "Dining Sets"}, {"name": "Kitchen Cabinets"}, {"name": "Bar Stools"}]}
            ]
        },
        {
            "name": "Home Accessories & Decor",
            "children": [
                {"name": "Curtains, Blinds & Shutters"},
                {"name": "Rugs & Carpets"},
                {"name": "Wall Arts & Frames"},
                {"name": "Lighting & Chandeliers"},
                {"name": "Mirrors"},
                {"name": "Clocks"},
                {"name": "Throw Pillows"},
                {"name": "Bedding (Sheets, Duvets)"},
                {"name": "Bathroom Accessories (Towels, Mats)"}
            ]
        },
        {
            "name": "Kitchen & Dining",
            "description": "Non-electrical items",
            "children": [
                {"name": "Pots & Pans (Cookware)"},
                {"name": "Cutlery & Knife Sets"},
                {"name": "Plates & Bowman"},
                {"name": "Food Storage & Containers"},
                {"name": "Coolers & Thermoses"},
                {"name": "Water Bottles"},
                {"name": "Dish Racks"}
            ]
        },
        {
            "name": "Garden & Outdoor",
            "children": [
                {"name": "Outdoor Furniture"},
                {"name": "BBQ & Grills"},
                {"name": "Plants & Seeds"},
                {"name": "Gardening Tools"},
                {"name": "Generators & Power Solutions (Accessories)"} # Actual generators are in Electronics/Appliances usually, but accessories here
            ]
        },
        {
            "name": "Stationery & School Supplies",
            "children": [
                {"name": "Notebooks & Journals"},
                {"name": "Pens & Pencils"},
                {"name": "Art Supplies"},
                {"name": "Calculators"}
            ]
        }
    ]
}
