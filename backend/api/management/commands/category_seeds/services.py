
SERVICES_CATEGORY = {
    "name": "Services",
    "icon": "Briefcase",
    "type": "service",
    "image_url": "/services_banner.png",
    "custom_fields": [
        {
            "name": "service_type",
            "label": "Service Type",
            "type": "select",
            "options": [
                {"value": "building", "label": "Building & Trades"},
                {"value": "automotive", "label": "Automotive Services"},
                {"value": "events", "label": "Events & Entertainment"},
                {"value": "education", "label": "Education & Classes"},
                {"value": "it", "label": "Business & IT Services"},
                {"value": "personal", "label": "Personal Services"}
            ],
            "required": True
        },
        {
            "name": "experience_years",
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
        },
        {
            "name": "packages",
            "label": "Service Packages",
            "type": "array",
            "children": [
                {"name": "name", "label": "Package Name", "type": "text", "required": True},
                {"name": "price", "label": "Price (XOF)", "type": "number", "required": True},
                {"name": "description", "label": "Package Description", "type": "textarea"}
            ],
            "required": False
        },
        {
            "name": "qualifications",
            "label": "Certifications / Qualifications",
            "type": "tags",
            "required": False
        },
        {
            "name": "service_duration",
            "label": "Service Duration",
            "type": "text",
            "placeholder": "e.g. 2 hours, 3-5 days",
            "required": False
        },
        {
            "name": "service_area",
            "label": "Service Area / Coverage",
            "type": "tags",
            "placeholder": "e.g. Niamey, Plateau, All Niger",
            "required": False
        }
    ],
    "children": [
        {
            "name": "Building & Trades",
            "image_url": "/plumbing1.jpg",
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
            "image_url": "/worker1.png",
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
