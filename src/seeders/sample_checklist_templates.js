/**
 * Sample Checklist Templates Seed Data
 * 
 * This file contains sample checklist templates that can be used to populate
 * the database for testing and development purposes.
 * 
 * To use this:
 * 1. Make sure you have certificate types in your database
 * 2. Replace the certificate_type_id values with actual UUIDs from your database
 * 3. Send POST requests to /api/v1/checklist-templates with each template
 */

export const sampleChecklistTemplates = [
    {
        name: "Safety Equipment Inspection Checklist",
        code: "SAFETY_EQUIP_001",
        description: "Comprehensive checklist for inspecting vessel safety equipment as per SOLAS requirements",
        certificate_type_id: '019c4b07-983f-707e-b168-2fb307169bd2', // Replace with actual certificate_type_id
        sections: [
            {
                title: "Life-Saving Appliances",
                items: [
                    {
                        code: "LSA001",
                        text: "Are life jackets available for all persons on board?",
                        type: "YES_NO_NA"
                    },
                    {
                        code: "LSA002",
                        text: "Are life jackets in good condition (no tears, inflation mechanism working)?",
                        type: "YES_NO_NA"
                    },
                    {
                        code: "LSA003",
                        text: "Total number of life jackets found",
                        type: "NUMBER"
                    },
                    {
                        code: "LSA004",
                        text: "Are liferafts properly serviced and within certification date?",
                        type: "YES_NO_NA"
                    },
                    {
                        code: "LSA005",
                        text: "Number of liferafts on board",
                        type: "NUMBER"
                    },
                    {
                        code: "LSA006",
                        text: "Are lifeboats in operational condition?",
                        type: "YES_NO_NA"
                    },
                    {
                        code: "LSA007",
                        text: "Describe any deficiencies found in life-saving equipment",
                        type: "TEXT"
                    }
                ]
            },
            {
                title: "Fire Fighting Equipment",
                items: [
                    {
                        code: "FFE001",
                        text: "Are portable fire extinguishers within expiry date?",
                        type: "YES_NO_NA"
                    },
                    {
                        code: "FFE002",
                        text: "Are fire extinguishers properly mounted and accessible?",
                        type: "YES_NO_NA"
                    },
                    {
                        code: "FFE003",
                        text: "Number of fire extinguishers inspected",
                        type: "NUMBER"
                    },
                    {
                        code: "FFE004",
                        text: "Is the fire detection system operational?",
                        type: "YES_NO_NA"
                    },
                    {
                        code: "FFE005",
                        text: "Is the fire alarm system functional?",
                        type: "YES_NO_NA"
                    },
                    {
                        code: "FFE006",
                        text: "Are fire hoses and nozzles in good condition?",
                        type: "YES_NO_NA"
                    },
                    {
                        code: "FFE007",
                        text: "Describe fire fighting system configuration",
                        type: "TEXT"
                    }
                ]
            },
            {
                title: "Emergency Equipment",
                items: [
                    {
                        code: "EME001",
                        text: "Are emergency lights functional?",
                        type: "YES_NO_NA"
                    },
                    {
                        code: "EME002",
                        text: "Is emergency power supply operational?",
                        type: "YES_NO_NA"
                    },
                    {
                        code: "EME003",
                        text: "Are emergency escape routes clearly marked?",
                        type: "YES_NO_NA"
                    },
                    {
                        code: "EME004",
                        text: "Is the emergency communication system working?",
                        type: "YES_NO_NA"
                    }
                ]
            }
        ],
        status: "ACTIVE",
        metadata: {
            version: "1.0",
            applicable_vessel_types: ["CARGO", "TANKER", "PASSENGER", "CONTAINER"],
            estimated_completion_time_minutes: 60,
            regulatory_reference: "SOLAS Chapter III"
        }
    },
    {
        name: "Load Line Survey Checklist",
        code: "LOADLINE_001",
        description: "Checklist for Load Line Certificate survey and inspection",
        certificate_type_id: null, // Replace with actual certificate_type_id
        sections: [
            {
                title: "Hull Inspection",
                items: [
                    {
                        code: "HUL001",
                        text: "Is the hull free from visible cracks or damage?",
                        type: "YES_NO_NA"
                    },
                    {
                        code: "HUL002",
                        text: "Is there any evidence of corrosion on the hull?",
                        type: "YES_NO_NA"
                    },
                    {
                        code: "HUL003",
                        text: "Describe hull condition and any defects found",
                        type: "TEXT"
                    },
                    {
                        code: "HUL004",
                        text: "Are load line marks clearly visible and correctly positioned?",
                        type: "YES_NO_NA"
                    },
                    {
                        code: "HUL005",
                        text: "Measured freeboard (in mm)",
                        type: "NUMBER"
                    }
                ]
            },
            {
                title: "Watertight Integrity",
                items: [
                    {
                        code: "WTI001",
                        text: "Are all watertight doors operational?",
                        type: "YES_NO_NA"
                    },
                    {
                        code: "WTI002",
                        text: "Are hatch covers watertight and in good condition?",
                        type: "YES_NO_NA"
                    },
                    {
                        code: "WTI003",
                        text: "Number of watertight compartments inspected",
                        type: "NUMBER"
                    },
                    {
                        code: "WTI004",
                        text: "Are air pipes and ventilators properly fitted?",
                        type: "YES_NO_NA"
                    },
                    {
                        code: "WTI005",
                        text: "Describe any issues with watertight integrity",
                        type: "TEXT"
                    }
                ]
            },
            {
                title: "Deck Equipment",
                items: [
                    {
                        code: "DKE001",
                        text: "Are guardrails and bulwarks in good condition?",
                        type: "YES_NO_NA"
                    },
                    {
                        code: "DKE002",
                        text: "Are scuppers and freeing ports clear and operational?",
                        type: "YES_NO_NA"
                    },
                    {
                        code: "DKE003",
                        text: "Is deck machinery properly secured?",
                        type: "YES_NO_NA"
                    }
                ]
            }
        ],
        status: "ACTIVE",
        metadata: {
            version: "1.0",
            applicable_vessel_types: ["CARGO", "TANKER", "BULK_CARRIER"],
            estimated_completion_time_minutes: 90,
            regulatory_reference: "Load Line Convention 1966"
        }
    },
    {
        name: "Cargo Ship Safety Equipment Survey",
        code: "CARGO_SAFETY_001",
        description: "Comprehensive safety equipment survey for cargo vessels",
        certificate_type_id: null, // Replace with actual certificate_type_id
        sections: [
            {
                title: "Navigation Equipment",
                items: [
                    {
                        code: "NAV001",
                        text: "Is the radar system operational?",
                        type: "YES_NO_NA"
                    },
                    {
                        code: "NAV002",
                        text: "Is GPS/ECDIS functioning properly?",
                        type: "YES_NO_NA"
                    },
                    {
                        code: "NAV003",
                        text: "Are navigation lights operational?",
                        type: "YES_NO_NA"
                    },
                    {
                        code: "NAV004",
                        text: "Is the compass properly calibrated?",
                        type: "YES_NO_NA"
                    },
                    {
                        code: "NAV005",
                        text: "Describe navigation equipment status",
                        type: "TEXT"
                    }
                ]
            },
            {
                title: "Communication Equipment",
                items: [
                    {
                        code: "COM001",
                        text: "Is VHF radio operational?",
                        type: "YES_NO_NA"
                    },
                    {
                        code: "COM002",
                        text: "Is GMDSS equipment functional?",
                        type: "YES_NO_NA"
                    },
                    {
                        code: "COM003",
                        text: "Are EPIRBs within certification date?",
                        type: "YES_NO_NA"
                    },
                    {
                        code: "COM004",
                        text: "Number of portable VHF radios available",
                        type: "NUMBER"
                    }
                ]
            },
            {
                title: "Pollution Prevention",
                items: [
                    {
                        code: "POL001",
                        text: "Is the Oil Record Book maintained?",
                        type: "YES_NO_NA"
                    },
                    {
                        code: "POL002",
                        text: "Are oil discharge monitoring equipment operational?",
                        type: "YES_NO_NA"
                    },
                    {
                        code: "POL003",
                        text: "Is the Garbage Management Plan available?",
                        type: "YES_NO_NA"
                    },
                    {
                        code: "POL004",
                        text: "Describe pollution prevention measures in place",
                        type: "TEXT"
                    }
                ]
            }
        ],
        status: "ACTIVE",
        metadata: {
            version: "1.0",
            applicable_vessel_types: ["CARGO", "CONTAINER", "GENERAL_CARGO"],
            estimated_completion_time_minutes: 75,
            regulatory_reference: "SOLAS Chapter IV & MARPOL"
        }
    },
    {
        name: "ISM Code Compliance Audit",
        code: "ISM_AUDIT_001",
        description: "Internal audit checklist for ISM Code compliance",
        certificate_type_id: null, // Replace with actual certificate_type_id
        sections: [
            {
                title: "Safety Management System",
                items: [
                    {
                        code: "SMS001",
                        text: "Is the Safety Management Manual available on board?",
                        type: "YES_NO_NA"
                    },
                    {
                        code: "SMS002",
                        text: "Are crew members familiar with SMS procedures?",
                        type: "YES_NO_NA"
                    },
                    {
                        code: "SMS003",
                        text: "Are safety meetings conducted regularly?",
                        type: "YES_NO_NA"
                    },
                    {
                        code: "SMS004",
                        text: "Describe SMS implementation status",
                        type: "TEXT"
                    }
                ]
            },
            {
                title: "Documentation",
                items: [
                    {
                        code: "DOC001",
                        text: "Are all required certificates valid and on board?",
                        type: "YES_NO_NA"
                    },
                    {
                        code: "DOC002",
                        text: "Is the crew list up to date?",
                        type: "YES_NO_NA"
                    },
                    {
                        code: "DOC003",
                        text: "Are training records maintained?",
                        type: "YES_NO_NA"
                    },
                    {
                        code: "DOC004",
                        text: "Number of non-conformities found in documentation",
                        type: "NUMBER"
                    }
                ]
            }
        ],
        status: "DRAFT",
        metadata: {
            version: "1.0",
            applicable_vessel_types: ["ALL"],
            estimated_completion_time_minutes: 120,
            regulatory_reference: "ISM Code"
        }
    }
];

/**
 * Instructions for using these templates:
 * 
 * 1. First, get your certificate types:
 *    GET /api/v1/certificates/types (or similar endpoint)
 * 
 * 2. Update the certificate_type_id in each template above
 * 
 * 3. Create templates using POST requests:
 *    POST /api/v1/checklist-templates
 *    Body: (one of the templates above)
 * 
 * 4. Verify templates were created:
 *    GET /api/v1/checklist-templates
 * 
 * Example using curl:
 * 
 * curl -X POST http://localhost:3000/api/v1/checklist-templates \
 *   -H "Content-Type: application/json" \
 *   -H "Cookie: jwt=your-jwt-token" \
 *   -d '{
 *     "name": "Safety Equipment Inspection Checklist",
 *     "code": "SAFETY_EQUIP_001",
 *     ...
 *   }'
 */
