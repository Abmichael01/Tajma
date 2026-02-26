
VEHICLES_CATEGORY = {
    "name": "Vehicles",
    "icon": "Car",
    "type": "product",
    "image_url": "/vehicles_banner.png",
    "custom_fields": [
        {
            "name": "condition",
            "label": "Condition",
            "type": "select",
            "options": [
                {"value": "foreign-used", "label": "Foreign Used (Tokunbo)"},
                {"value": "nigerian-used", "label": "Nigerian Used"},
                {"value": "brand-new", "label": "Brand New"},
                {"value": "registered", "label": "Registered"},
                {"value": "unregistered", "label": "Unregistered"}
            ],
            "required": True
        },
        {
            "name": "make",
            "label": "Make",
            "type": "text",
            "placeholder": "e.g. Toyota, Honda, Mercedes-Benz, Lexus, Ford",
            "required": True
        },
        {
            "name": "model",
            "label": "Model",
            "type": "text",
            "placeholder": "e.g. Camry, Corolla, Accord, C300, RX350",
            "required": True
        },
        {
            "name": "year",
            "label": "Year of Manufacture",
            "type": "number",
            "min": 1980,
            "max": 2026,
            "required": True
        },
        {
            "name": "trim",
            "label": "Trim / Edition",
            "type": "text",
            "placeholder": "e.g. LE, XLE, Sport, Limited",
            "required": False
        },
        {
            "name": "transmission",
            "label": "Transmission",
            "type": "select",
            "options": [
                {"value": "automatic", "label": "Automatic"},
                {"value": "manual", "label": "Manual"},
                {"value": "amt", "label": "AMT (Automated Manual)"},
                {"value": "cvt", "label": "CVT"}
            ],
            "required": True
        },
        {
            "name": "fuel_type",
            "label": "Fuel",
            "type": "select",
            "options": [
                {"value": "petrol", "label": "Petrol"},
                {"value": "diesel", "label": "Diesel"},
                {"value": "hybrid", "label": "Hybrid"},
                {"value": "electric", "label": "Electric"},
                {"value": "gas", "label": "Gas/LPG"}
            ],
            "required": False
        },
        {
            "name": "mileage",
            "label": "Mileage (km)",
            "type": "number",
            "required": False
        },
        {
            "name": "body_type",
            "label": "Body Type",
            "type": "select",
            "options": [
                {"value": "sedan", "label": "Sedan"},
                {"value": "suv", "label": "SUV / Crossover"},
                {"value": "hatchback", "label": "Hatchback"},
                {"value": "minivan", "label": "Minivan / Bus"},
                {"value": "truck", "label": "Pickup / Truck"},
                {"value": "wagon", "label": "Station Wagon"},
                {"value": "coupe", "label": "Coupe"},
                {"value": "convertible", "label": "Convertible"}
            ],
            "required": False
        },
        {
            "name": "colour",
            "label": "Colour",
            "type": "text",
            "required": False
        },
        {
            "name": "seats",
            "label": "Number of Seats",
            "type": "number",
            "required": False
        },
        {
            "name": "key_features",
            "label": "Key Features",
            "type": "checkbox_group",
            "options": [
                {"value": "leather", "label": "Leather Seats"},
                {"value": "sunroof", "label": "Sunroof/Moonroof"},
                {"value": "backup_camera", "label": "Backup Camera"},
                {"value": "navigation", "label": "Navigation System"},
                {"value": "bluetooth", "label": "Bluetooth/Hands-Free"},
                {"value": "alloy_wheels", "label": "Alloy Wheels"},
                {"value": "third_row", "label": "Third Row Seats"},
                {"value": "push_start", "label": "Push-to-Start"}
            ],
            "required": False
        },
        {
            "name": "is_registered",
            "label": "Is Registered?",
            "type": "checkbox",
            "required": False
        },
        {
            "name": "exchange_possible",
            "label": "Exchange Possible?",
            "type": "checkbox",
            "required": False
        }
    ],
    "children": [
        {
            "name": "Cars",
            "image_url": "/car1.jpg",
            "children": [
                {"name": "Toyota"},
                {"name": "Mercedes-Benz"},
                {"name": "Lexus"},
                {"name": "Honda"},
                {"name": "Hyundai"},
                {"name": "Ford"},
                {"name": "Nissan"},
                {"name": "Volkswagen"},
                {"name": "Land Rover (Range Rover)"},
                {"name": "Kia"},
                {"name": "Peugeot"},
                {"name": "BMW"},
                {"name": "Acura"},
                {"name": "Mazda"},
                {"name": "Mitsubishi"},
                {"name": "Chevrolet"},
                {"name": "Other Makes"}
            ]
        },
        {
            "name": "Buses & Microbuses",
            "custom_fields": [
                {"name": "capacity", "label": "Passenger Capacity", "type": "number"}
            ],
            "children": [
                 {"name": "Coaster Buses"},
                 {"name": "Danfo (Commercial Buses)"},
                 {"name": "Sienna / Minivans"},
                 {"name": "Transit Buses"}
            ]
        },
        {
            "name": "Motorcycles & Scooters",
            "image_url": "/bike1.jpg",
            "custom_fields": [
                 {"name": "engine_capacity", "label": "Engine Capacity (cc)", "type": "number"},
                 {"name": "start_type", "label": "Start Type", "type": "select", "options": [{"value": "electric", "label": "Electric Start"}, {"value": "kick", "label": "Kick Start"}]}
            ],
            "children": [
                {"name": "Okada (Commercial Motorcycles)"},
                {"name": "Power Bikes / Sport Bikes"},
                {"name": "Scooters (Vespa, etc.)"},
                {"name": "Tricycles (Keke Napep)"},
                {"name": "Delivery Bikes"}
            ]
        },
        {
            "name": "Trucks & Trailers",
            "custom_fields": [
                 {"name": "tonnage", "label": "Tonnage", "type": "number"},
                 {"name": "axle_config", "label": "Axle Configuration", "type": "text"}
            ],
            "children": [
                {"name": "Trailers (Flatbody)"},
                {"name": "Tankers (Fuel/Water)"},
                {"name": "Tippers / Dump Trucks"},
                {"name": "Tow Trucks"},
                {"name": "Mixer Trucks"}
            ]
        },
        {
            "name": "Heavy Equipment",
            "children": [
                {"name": "Excavators"},
                {"name": "Bulldozers"},
                {"name": "Forklifts"},
                {"name": "Tractors"},
                {"name": "Cranes"}
            ]
        },
        {
            "name": "Watercraft & Boats",
            "children": [
                {"name": "Speed Boats"},
                {"name": "Yachts"},
                {"name": "Canoes"}
            ]
        },
        {
            "name": "Vehicle Parts & Accessories",
            "children": [
                {"name": "Car Batteries"},
                {"name": "Tyres & Rims"},
                {"name": "Engines & Parts"},
                {"name": "Car Audio & Electronics"},
                {"name": "Exterior Accessories"}
            ]
        }
    ]
}
