
ELECTRONICS_CATEGORY = {
    "name": "Electronics",
    "icon": "Smartphone",
    "type": "product",
    "image_url": "/electronics_banner.png",
    "custom_fields": [
        {
            "name": "condition",
            "label": "Condition",
            "type": "select",
            "options": [
                {"value": "brand-new", "label": "Brand New"},
                {"value": "open-box", "label": "Open Box"},
                {"value": "foreign-used", "label": "Foreign Used"},
                {"value": "nigerian-used", "label": "Nigerian Used"},
                {"value": "refurbished", "label": "Refurbished"},
                {"value": "good", "label": "Good"},
                {"value": "fair", "label": "Fair"},
                {"value": "defect", "label": "Has Defects"}
            ],
            "required": True
        },
        {
            "name": "brand",
            "label": "Brand",
            "type": "text",
            "placeholder": "e.g. Samsung, LG, Sony, Hisense, Oraimo",
            "required": False
        },
        {
            "name": "negotiable",
            "label": "Is Price Negotiable?",
            "type": "checkbox",
            "required": False
        },
        {
            "name": "delivery_available",
            "label": "Delivery Available?",
            "type": "checkbox",
            "required": False
        }
    ],
    "children": [
        # LEVEL 2: Phones & Tablets
        {
            "name": "Phones & Tablets",
            "image_url": "/electronics_banner.png",
            "icon": "Smartphone",
            "children": [
                {
                    "name": "Mobile Phones",
                    "custom_fields": [
                        {
                            "name": "storage_capacity",
                            "label": "Internal Storage",
                            "type": "select",
                            "options": [
                                {"value": "16gb", "label": "16 GB"},
                                {"value": "32gb", "label": "32 GB"},
                                {"value": "64gb", "label": "64 GB"},
                                {"value": "128gb", "label": "128 GB"},
                                {"value": "256gb", "label": "256 GB"},
                                {"value": "512gb", "label": "512 GB"},
                                {"value": "1tb", "label": "1 TB+"}
                            ]
                        },
                        {
                            "name": "ram",
                            "label": "RAM",
                            "type": "select",
                            "options": [
                                {"value": "2gb", "label": "2 GB"},
                                {"value": "3gb", "label": "3 GB"},
                                {"value": "4gb", "label": "4 GB"},
                                {"value": "6gb", "label": "6 GB"},
                                {"value": "8gb", "label": "8 GB"},
                                {"value": "12gb", "label": "12 GB"},
                                {"value": "16gb", "label": "16 GB+"}
                            ]
                        },
                        {"name": "sim_slots", "label": "SIM Slots", "type": "select", "options": [{"value": "single", "label": "Single SIM"}, {"value": "dual", "label": "Dual SIM"}, {"value": "triple", "label": "Triple SIM"}]},
                        {"name": "screen_size", "label": "Screen Size (inches)", "type": "number"},
                        {"name": "battery_capacity", "label": "Battery (mAh)", "type": "number"},
                        {"name": "colour", "label": "Colour", "type": "text"}
                    ],
                    "children": [
                        {"name": "Smartphones"},
                        {"name": "Basic Phones (Button Phones)"},
                        {"name": "Refurbished Phones"}
                    ]
                },
                {
                    "name": "Tablets",
                    "custom_fields": [
                         {"name": "screen_size", "label": "Screen Size (inches)", "type": "number"},
                         {"name": "connectivity", "label": "Connectivity", "type": "select", "options": [{"value": "wifi-only", "label": "WiFi Only"}, {"value": "cellular", "label": "WiFi + Cellular"}]}
                    ],
                    "children": [
                        {"name": "iPads"},
                        {"name": "Android Tablets"},
                        {"name": "Educational Tablets (Kids)"},
                        {"name": "Graphics Tablets"}
                    ]
                },
                {
                    "name": "Mobile Accessories",
                    "children": [
                        {"name": "Cases & Covers"},
                        {"name": "Screen Protectors"},
                        {"name": "Chargers & Cables"},
                        {"name": "Power Banks"},
                        {"name": "Phone Holders"},
                        {"name": "Memory Cards"}
                    ]
                }
            ]
        },

        # LEVEL 2: Computers & Laptops
        {
            "name": "Computers & Laptops",
            "image_url": "/laptop1.png",
            "icon": "Laptop",
            "custom_fields": [
                 {
                    "name": "processor",
                    "label": "Processor Type",
                    "type": "text",
                    "placeholder": "e.g. Intel Core i5, M1, AMD Ryzen"
                 },
                 {
                    "name": "ram",
                    "label": "RAM",
                    "type": "number",
                    "placeholder": "Size in GB"
                 },
                 {
                    "name": "storage_type",
                    "label": "Storage Type",
                    "type": "select",
                    "options": [{"value": "hdd", "label": "HDD"}, {"value": "ssd", "label": "SSD"}, {"value": "sshdd", "label": "Hybrid"}]
                 },
                 {
                    "name": "storage_capacity",
                    "label": "Storage Capacity (GB)",
                    "type": "number"
                 }
            ],
            "children": [
                {
                    "name": "Laptops",
                    "children": [
                        {"name": "Ultrabooks"},
                        {"name": "Gaming Laptops", "custom_fields": [{"name": "graphics_card", "label": "Graphics Card", "type": "text"}]},
                        {"name": "MacBooks"},
                        {"name": "Netbooks & Mini Laptops"}
                    ]
                },
                {
                    "name": "Desktops",
                    "children": [
                        {"name": "Desktop Computer"},
                        {"name": "All-in-One"},
                        {"name": "Monitors"}
                    ]
                },
                {
                    "name": "Networking & Internet",
                    "children": [
                        {"name": "Routers & Modems (MiFi)"},
                        {"name": "Networking Cables"},
                        {"name": "Switches"}
                    ]
                },
                {
                    "name": "Printers & Scanners",
                    "children": [
                        {"name": "Inkjet Printers"},
                        {"name": "Laser Printers"},
                        {"name": "Photocopiers"},
                        {"name": "Scanners"}
                    ]
                }
            ]
        },

        # LEVEL 2: Home Appliances (Kitchen & Laundry)
        {
            "name": "Home Appliances",
            "icon": "Home",
            "children": [
                {
                    "name": "Kitchen Appliances",
                    "children": [
                        {
                            "name": "Refrigerators",
                            "custom_fields": [
                                {"name": "doors", "label": "Number of Doors", "type": "number"},
                                {"name": "defrost_type", "label": "Defrost Type", "type": "select", "options": [{"value": "frost-free", "label": "Frost Free"}, {"value": "direct-cool", "label": "Direct Cool"}]}
                            ],
                            "children": [
                                {"name": "Single Door Fridges"},
                                {"name": "Double Door Fridges"},
                                {"name": "Side-by-Side Fridges"},
                                {"name": "Deep Freezers (Chest Freezers)"}
                            ]
                        },
                        {
                            "name": "Cookers & Ovens",
                            "custom_fields": [
                                {"name": "fuel_type", "label": "Fuel Type", "type": "select", "options": [{"value": "gas", "label": "Gas"}, {"value": "electric", "label": "Electric"}, {"value": "dual", "label": "Dual (Gas + Electric)"}]},
                                {"name": "burners", "label": "Number of Burners", "type": "number"},
                                {"name": "colour", "label": "Color", "type": "text"},
                                {"name": "oven_included", "label": "Has Oven?", "type": "checkbox"}
                            ],
                            "children": [
                                {"name": "Gas Cookers"},
                                {"name": "Electric Cookers & Hotplates"},
                                {"name": "Microwave Ovens"},
                                {"name": "Toasters & Sandwich Makers"}
                            ]
                        },
                        {
                            "name": "Small Kitchen Appliances",
                            "children": [
                                {"name": "Blenders & Juicers", "custom_fields": [{"name": "power_watts", "label": "Power (Watts)", "type": "number"}]},
                                {"name": "Electric Kettles"},
                                {"name": "Yam Pounders & Food Processors"},
                                {"name": "Air Fryers"},
                                {"name": "Water Dispensers"}
                            ]
                        }
                    ]
                },
                {
                    "name": "Laundry & Cleaning",
                    "children": [
                        {
                            "name": "Washing Machines",
                            "custom_fields": [
                                {"name": "capacity_kg", "label": "Capacity (KG)", "type": "number"},
                                {"name": "type", "label": "Type", "type": "select", "options": [{"value": "top-load", "label": "Top Load"}, {"value": "front-load", "label": "Front Load"}, {"value": "twin-tub", "label": "Twin Tub (Semi-Automatic)"}]}
                            ]
                        },
                        {"name": "Dryers"},
                        {"name": "Irons & Steamers"},
                        {"name": "Vacuum Cleaners"}
                    ]
                },
                {
                    "name": "Power & Generators",
                    "custom_fields": [
                        {"name": "kva", "label": "KVA Rating", "type": "number"},
                        {"name": "fuel", "label": "Fuel Type", "type": "select", "options": [{"value": "petrol", "label": "Petrol"}, {"value": "diesel", "label": "Diesel"}, {"value": "solar", "label": "Solar"}]}
                    ],
                    "children": [
                        {"name": "Generators (Petrol)"},
                        {"name": "Generators (Diesel/Soundproof)"},
                        {"name": "Inverters & Batteries"},
                        {"name": "Solar Panels & Controllers"},
                        {"name": "Stabilizers & UPS"}
                    ]
                },
                {
                    "name": "Air Conditioning & Cooling",
                    "children": [
                        {"name": "Split ACs", "custom_fields": [{"name": "horsepower", "label": "Horsepower (HP)", "type": "text"}]},
                        {"name": "Standing ACs"},
                        {"name": "Ceiling Fans & Standing Fans"},
                        {"name": "Air Coolers"}
                    ]
                }
            ]
        },

        # LEVEL 2: TV, Audio & Video
        {
            "name": "TV, Audio & Video",
            "icon": "Tv",
            "children": [
                {
                    "name": "Televisions",
                    "custom_fields": [
                        {"name": "screen_size", "label": "Screen Size (inches)", "type": "number"},
                        {"name": "display_technology", "label": "Display Tech", "type": "select", "options": [{"value": "led", "label": "LED"}, {"value": "qled", "label": "QLED"}, {"value": "oled", "label": "OLED"}]},
                        {"name": "smart_tv", "label": "Is Smart TV?", "type": "checkbox"}
                    ],
                    "children": [
                        {"name": "Smart TVs"},
                        {"name": "LED TVs"},
                        {"name": "4K Ultra HD TVs"}
                    ]
                },
                {
                    "name": "Audio & Sound",
                    "children": [
                        {"name": "Home Theatre Systems"},
                        {"name": "Bluetooth Speakers"},
                        {"name": "Soundbars"},
                        {"name": "Headphones & Headsets"}
                    ]
                },
                {
                    "name": "Cameras & Photography",
                    "children": [
                        {"name": "Digital Cameras"},
                        {"name": "DSLR Cameras"},
                        {"name": "Action Cameras & Drones"},
                        {"name": "CCTV & Security Cameras"}
                    ]
                },
                {"name": "Video Games & Consoles", "children": [{"name": "PlayStation"}, {"name": "Xbox"}, {"name": "Nintendo"}, {"name": "Gaming Accessories"}]}
            ]
        }
    ]
}
