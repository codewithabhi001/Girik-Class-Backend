import os

file_path = r"a:\Girik workspace\grclass-backend\ONLY CERTIFICATES\International Ship Security Certificate\html\GRClass_ISSC_APR_SSPA_Approval.html"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

start_marker = '<div class="body" style="flex: 1; display: flex; flex-direction: column;">'
end_marker = '                </div>\n\n                {remarks}'

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx != -1 and end_idx != -1:
    new_body = """
                    <div style="display: flex; justify-content: flex-end; margin-bottom: 4mm;">
                        <table class="data-table" style="width: auto; min-width: 200px;">
                            <tbody>
                                <tr>
                                    <th>Certificate No.:</th>
                                    <td>{certificate_number}</td>
                                </tr>
                                <tr>
                                    <th>Control Number:</th>
                                    <td></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div class="sec-label" style="text-align: center; margin-bottom: 1mm; font-size: 11pt;">CERTIFICATE OF APPROVAL / AMENDMENT (1)</div>
                    <div class="sec-label" style="text-align: center; margin-bottom: 6mm; font-size: 11pt;">SHIP SECURITY PLAN</div>

                    <p class="cert-desc" style="text-align: center; font-style: italic; margin-bottom: 6mm;">
                        This is to certify that the Ship Security Plan of the vessel has been approved on behalf of the Government of <strong>{flag_state}</strong> under the provisions set forth in the International Ship and Facility Security Code, in compliance with SOLAS Chapter XI-2 and the ISPS Code Part A Section 9, and taking into account the relevant provisions of Part B.
                    </p>

                    <table class="data-table" style="margin-bottom: 6mm;">
                        <tbody>
                            <tr>
                                <th style="width: 30%;">Name of Ship</th>
                                <td>{vessel_name}</td>
                            </tr>
                            <tr>
                                <th>Distinctive Number or Letters</th>
                                <td>{call_sign}</td>
                            </tr>
                            <tr>
                                <th>Port of Registry</th>
                                <td>{port_of_registry}</td>
                            </tr>
                            <tr>
                                <th>Type of Ship</th>
                                <td>{type_of_ship}</td>
                            </tr>
                            <tr>
                                <th>Gross Tonnage</th>
                                <td>{gross_tonnage}</td>
                            </tr>
                            <tr>
                                <th>IMO Number</th>
                                <td>{imo_number}</td>
                            </tr>
                            <tr>
                                <th>Name and Address of the Company</th>
                                <td>{company_address}</td>
                            </tr>
                            <tr>
                                <th>Company Identification Number</th>
                                <td>{company_imo_no}</td>
                            </tr>
                        </tbody>
                    </table>

                    <table class="data-table" style="margin-bottom: 8mm; width: auto; min-width: 300px;">
                        <tbody>
                            <tr>
                                <th>Place and Date of approval</th>
                                <td>{place_of_issue} / {date_of_issue}</td>
                            </tr>
                        </tbody>
                    </table>

                    <p class="cert-desc" style="margin-bottom: 8mm; text-align: justify; font-size: 7.5pt; line-height: 1.4;">
                        This approval does not absolve the Master of his responsibilities to take appropriate actions as deemed necessary for operating the vessel in a safe and secure manner. No addition or amendment is to be made to the approved manual without prior approval of GR Class - Classified For Standard , except of minor editorial changes. This approval will be invalid upon change of flag of the vessel or when a new company assumes the responsibility for the operation this ship. The Plan shall be protected from unauthorized access or disclosure.
                    </p>

                    <div style="display: flex; justify-content: space-between; margin-top: auto; padding-top: 10px; border-top: 1px solid #ccc;">
                        <div style="width: 45%;">
                            <p class="cert-desc" style="margin-bottom: 2mm;">Signature of authorized official issuing the Certificate</p>
                            <div style="border-bottom: 1px solid #000; height: 30px; margin-bottom: 5px;"></div>
                            <div style="font-weight: bold;">Name:</div>
                            <div style="font-weight: bold; margin-top: 2px;">GR CLASS - CLASSIFIED FOR STANDARD</div>
                        </div>
                    </div>
"""
    new_content = content[:start_idx + len(start_marker)] + "\n" + new_body + "\n" + content[end_idx:]
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Updated GRClass_ISSC_APR_SSPA_Approval.html")
else:
    print("Could not find markers.")
