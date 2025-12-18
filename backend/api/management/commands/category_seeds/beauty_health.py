
BEAUTY_HEALTH_CATEGORY = {
    "name": "Health & Beauty",
    "icon": "Sparkles",
    "type": "product",
    "custom_fields": [
        {
            "name": "brand",
            "label": "Brand",
            "type": "text",
            "placeholder": "e.g. Fenty, MAC, Nivea, Dove",
            "required": False
        },
        {
            "name": "gender",
            "label": "Gender",
            "type": "select",
            "options": [
                {"value": "female", "label": "Female"},
                {"value": "male", "label": "Male"},
                {"value": "unisex", "label": "Unisex"}
            ],
            "required": False
        }
    ],
    "children": [
        {
            "name": "Hair Beauty",
            "children": [
                {"name": "Wigs & Weaves", "custom_fields": [{"name": "hair_type", "label": "Hair Type", "type": "select", "options": [{"value": "human-hair", "label": "Human Hair"}, {"value": "synthetic", "label": "Synthetic"}, {"value": "blend", "label": "Blend"}]}, {"name": "length", "label": "Length (inches)", "type": "number"}, {"name": "style", "label": "Style", "type": "text", "placeholder": "e.g. Bone Straight, Kinky, Curly"}]},
                {"name": "Hair Extensions & Attachments"},
                {"name": "Hair Care Products (Shampoos, Conditioners)"},
                {"name": "Hair Accessories (Bonnets, Clips)"},
                {"name": "Clippers & Trimmers"}
            ]
        },
        {
            "name": "Makeup",
            "children": [
                {"name": "Foundations & Concealers"},
                {"name": "Lipsticks & Lip Gloss"},
                {"name": "Eye Makeup (Mascara, Eyeliner, Shadow)"},
                {"name": "Makeup Brushes & Tools"},
                {"name": "Makeup Sets & Palettes"}
            ]
        },
        {
            "name": "Skin Care",
            "children": [
                {"name": "Body Creams & Lotions"},
                {"name": "Face Cleansers & Toners"},
                {"name": "Sunscreen"},
                {"name": "Serums & Oils"},
                {"name": "Soaps & Body Wash"},
                {"name": "Whitening & Toning Products"}
            ]
        },
        {
            "name": "Fragrances",
            "custom_fields": [
                 {"name": "formulation", "label": "Formulation", "type": "select", "options": [{"value": "spray", "label": "Spray"}, {"value": "oil", "label": "Oil"}, {"value": "roll-on", "label": "Roll-on"}]}
            ],
            "children": [
                {"name": "Women's Perfumes"},
                {"name": "Men's Perfumes"},
                {"name": "Unisex Perfumes"},
                {"name": "Body Sprays & Mists"},
                {"name": "Perfume Oils"}
            ]
        },
        {
            "name": "Health & Wellness",
            "children": [
                {"name": "Vitamins & Supplements"},
                {"name": "Weight Loss Products"},
                {"name": "Sexual Wellness"},
                {"name": "Medical Supplies & Equipment"},
                {"name": "Oral Care"}
            ]
        },
        {
            "name": "Tools & Accessories",
            "children": [
                {"name": "Hair Dryers & Straighteners"},
                {"name": "Manicure & Pedicure Kits"},
                {"name": "Mirrors"}
            ]
        }
    ]
}
