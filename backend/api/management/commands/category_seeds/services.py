
SERVICES_CATEGORY = {
    "name": "Services",
    "icon": "Briefcase",
    "type": "service",
    "custom_fields": [
        {
            "name": "service_type",
            "label": "Service Type",
            "type": "text",
            "required": True
        },
        {
            "name": "company_name",
            "label": "Company / Business Name",
            "type": "text",
            "required": False
        },
        {
            "name": "experience",
            "label": "Years of Experience",
            "type": "number",
            "required": False
        },
        {
            "name": "availability",
            "label": "Availability",
            "type": "select",
            "options": [
                {"value": "24-7", "label": "24/7 Service"},
                {"value": "weekdays", "label": "Weekdays Only"},
                {"value": "weekends", "label": "Weekends Only"},
                {"value": "appointment", "label": "By Appointment"}
            ],
            "required": False
        }
    ],
    "children": [
        {
            "name": "Building & Trades",
            "children": [
                {"name": "Cleaning Services"},
                {"name": "Electricians"},
                {"name": "Plumbers"},
                {"name": "Carpenters & Furniture Makers"},
                {"name": "Painters"},
                {"name": "Masons & Bricklayers"},
                {"name": "AC Cleaning & Repair"},
                {"name": "Generator Repair"},
                {"name": "Welding & Iron Work"},
                {"name": "Aluminum & Glass Work"},
                {"name": "Solar & Inverter Installation"}
            ]
        },
        {
            "name": "Automotive Services",
            "children": [
                {"name": "Auto Mechanics"},
                {"name": "Car Wash & Detailing"},
                {"name": "Car Painters & Sprayers"},
                {"name": "Auto Electricians"},
                {"name": "Tow Truck Services"},
                {"name": "Panel Beaters"},
                {"name": "Driver & Chauffeur Services"}
            ]
        },
        {
            "name": "Events & Entertainment",
            "children": [
                {"name": "Catering & Baking"},
                {"name": "DJs & Entertainment"},
                {"name": "Photography & Video"},
                {"name": "Event Planning & Decor"},
                {"name": "Makeup Artists (MUA)"},
                {"name": "MC & Hosts"},
                {"name": "Rental Services (Chairs, Tents)"}
            ]
        },
        {
            "name": "Education & Classes",
            "children": [
                {"name": "Tutorials & Academic Help"},
                {"name": "Music & Instrument Lessons"},
                {"name": "Driving Schools"},
                {"name": "Vocational Training"},
                {"name": "Cooking Classes"}
            ]
        },
        {
            "name": "Business & IT Services",
            "children": [
                {"name": "Web Design & Development"},
                {"name": "Graphic Design"},
                {"name": "Digital Marketing & SEO"},
                {"name": "Business Registration (CAC)"},
                {"name": "Printing & Branding"},
                {"name": "Consulting Services"},
                {"name": "Logistics & Delivery Services"}
            ]
        },
        {
            "name": "Personal Services",
            "children": [
                {"name": "Laundry & Dry Cleaning"},
                {"name": "Tailoring & Fashion Design"},
                {"name": "Massage & Spa"},
                {"name": "Fitness & Personal Trainers"},
                {"name": "Nanny & House Help Services"},
                {"name": "Movers & Relocation"}
            ]
        }
    ]
}
