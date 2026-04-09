
JOBS_CATEGORY = {
    "name": "Job Opportunities",
    "icon": "Suitcase",
    "type": "job",
    "image_url": "/services_banner.png",  # Using placeholder from public
    "custom_fields": [
        {
            "name": "job_type",
            "label": "Job Type",
            "type": "select",
            "options": [
                {"value": "full-time", "label": "Full-time"},
                {"value": "part-time", "label": "Part-time"},
                {"value": "contract", "label": "Contract"},
                {"value": "freelance", "label": "Freelance"},
                {"value": "internship", "label": "Internship"},
                {"value": "remote", "label": "Remote"}
            ],
            "required": True
        },
        {
            "name": "company_name",
            "label": "Company Name",
            "type": "text",
            "required": True
        },
        {
            "name": "salary_range",
            "label": "Salary Range",
            "type": "text",
            "placeholder": "e.g. 100,000 - 200,000 XOF",
            "required": False
        },
        {
            "name": "experience_level",
            "label": "Experience Level",
            "type": "select",
            "options": [
                {"value": "entry", "label": "Entry Level"},
                {"value": "mid", "label": "Mid Level"},
                {"value": "senior", "label": "Senior Level"},
                {"value": "executive", "label": "Executive"}
            ],
            "required": False
        },
        {
            "name": "education_level",
            "label": "Education Level",
            "type": "select",
            "options": [
                {"value": "high-school", "label": "High School"},
                {"value": "diploma", "label": "Diploma"},
                {"value": "degree", "label": "Bachelor's Degree"},
                {"value": "masters", "label": "Master's Degree"},
                {"value": "phd", "label": "PhD"}
            ],
            "required": False
        },
        {
            "name": "skills_required",
            "label": "Skills Required",
            "type": "tags",
            "placeholder": "e.g. Python, Sales, Management",
            "required": False
        },
        {
            "name": "location_type",
            "label": "Location Type",
            "type": "select",
            "options": [
                {"value": "on-site", "label": "On-site"},
                {"value": "remote", "label": "Remote"},
                {"value": "hybrid", "label": "Hybrid"}
            ],
            "required": True
        },
        {
            "name": "responsibilities",
            "label": "Key Responsibilities",
            "type": "textarea",
            "placeholder": "Describe what the role involves...",
            "required": False
        },
        {
            "name": "benefits",
            "label": "Benefits & Perks",
            "type": "tags",
            "placeholder": "e.g. Health Insurance, Paid Time Off",
            "required": False
        }
    ],
    "children": [
        {
            "name": "Sales & Marketing",
            "children": [
                {"name": "Sales Officers"},
                {"name": "Digital Marketers"},
                {"name": "Public Relations Specialists"},
                {"name": "Brand Managers"}
            ]
        },
        {
            "name": "Technology & IT",
            "image_url": "/office1.png",
            "children": [
                {"name": "Software Developers"},
                {"name": "IT Support Specialists"},
                {"name": "Data Analysts"},
                {"name": "UI/UX Designers"}
            ]
        },
        {
            "name": "Finance & Accounting",
            "children": [
                {"name": "Accountants"},
                {"name": "Financial Analysts"},
                {"name": "Auditors"},
                {"name": "Tax Consultants"}
            ]
        },
        {
            "name": "Admin & Office",
            "children": [
                {"name": "Receptionists"},
                {"name": "Secretaries"},
                {"name": "Office Managers"},
                {"name": "Human Resources"}
            ]
        },
        {
            "name": "Hospitality & Tourism",
            "children": [
                {"name": "Chefs & Cooks"},
                {"name": "Waiters & Waitresses"},
                {"name": "Hotel Managers"},
                {"name": "Tour Guides"}
            ]
        }
    ]
}
