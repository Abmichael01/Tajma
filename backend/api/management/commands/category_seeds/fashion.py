
FASHION_CATEGORY = {
    "name": "Fashion",
    "icon": "Shirt",
    "type": "product",
    "image_url": "/fashion_banner.png",
    "custom_fields": [
        {
            "name": "gender",
            "label": "Gender",
            "type": "select",
            "options": [
                {"value": "men", "label": "Men"},
                {"value": "women", "label": "Women"},
                {"value": "unisex", "label": "Unisex"},
                {"value": "kids-boys", "label": "Kids (Boys)"},
                {"value": "kids-girls", "label": "Kids (Girls)"},
                {"value": "baby", "label": "Babies"}
            ],
            "required": True
        },
        {
            "name": "condition",
            "label": "Condition",
            "type": "select",
            "options": [
                {"value": "brand-new", "label": "Brand New"},
                {"value": "uk-used", "label": "UK Used / First Grade"},
                {"value": "thrift", "label": "Thrift / Okrika"},
                {"value": "used", "label": "Used"}
            ],
            "required": True
        }
    ],
    "children": [
        {
            "name": "Clothing",
            "image_url": "/cloth1.jpg",
            "custom_fields": [
                {
                    "name": "size",
                    "label": "Size",
                    "type": "select",
                    "options": [
                        {"value": "xxs", "label": "XXS"},
                        {"value": "xs", "label": "XS"},
                        {"value": "s", "label": "S"},
                        {"value": "m", "label": "M"},
                        {"value": "l", "label": "L"},
                        {"value": "xl", "label": "XL"},
                        {"value": "xxl", "label": "XXL"},
                        {"value": "3xl", "label": "3XL+"},
                        {"value": "one-size", "label": "One Size"}
                    ]
                },
                {"name": "material", "label": "Material", "type": "text", "placeholder": "e.g. Cotton, Ankara, Lace, Silk"},
                {"name": "colour", "label": "Colour", "type": "text"},
                {"name": "brand", "label": "Brand", "type": "text"}
            ],
            "children": [
                {"name": "Dresses"},
                {"name": "Tops & Shirts"},
                {"name": "Trousers & Chinos"},
                {"name": "Jeans"},
                {"name": "Traditional Wear (Native)"},
                {"name": "Suits & Blazers"},
                {"name": "Skirts"},
                {"name": "Shorts"},
                {"name": "Sportswear / Activewear"},
                {"name": "Sleepwear & Lingerie"},
                {"name": "Maternity Wear"}
            ]
        },
        {
            "name": "Shoes",
            "image_url": "/shoe1.jpg",
            "custom_fields": [
                {"name": "size", "label": "Shoe Size (EU)", "type": "number", "placeholder": "e.g. 42"},
                {"name": "colour", "label": "Colour", "type": "text"},
                {"name": "brand", "label": "Brand", "type": "text"}
            ],
            "children": [
                {"name": "Sneakers"},
                {"name": "Formal Shoes / Loafers"},
                {"name": "Heels"},
                {"name": "Flats"},
                {"name": "Sandals & Slippers"},
                {"name": "Boots"}
            ]
        },
        {
            "name": "Bags & Accessories",
            "children": [
                {"name": "Handbags"},
                {"name": "Backpacks"},
                {"name": "Luggage & Travel Gear"},
                {"name": "Wallets & Purses"},
                {"name": "Belts"},
                {"name": "Hats & Caps"},
                {"name": "Sunglasses"},
                {"name": "Jewelry (Necklaces, Rings, Bracelets)"},
                {"name": "Watches", "custom_fields": [{"name": "movement", "label": "Movement", "type": "select", "options": [{"value": "quartz", "label": "Quartz"}, {"value": "automatic", "label": "Automatic"}, {"value": "smart", "label": "Smart"}]}]}
            ]
        },
        {
            "name": "Fabrics & Materials",
            "children": [
                {"name": "Ankara & Wax Prints"},
                {"name": "Lace Materials"},
                {"name": "Senator Material"},
                {"name": "Silk & Chiffon"},
                {"name": "Aso Oke"}
            ]
        },
        {
            "name": "Wedding Wears & Accessories",
             "children": [
                 {"name": "Wedding Gowns"},
                 {"name": "Bridal Accessories"},
                 {"name": "Bridesmaid Dresses"}
             ]
        }
    ]
}
