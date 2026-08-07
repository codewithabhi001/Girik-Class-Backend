import os

file_path = r"a:\Girik workspace\grclass-backend\ONLY CERTIFICATES\CARGO SHIP SAFETY RADIO CERTIFICATE\html\GRClass_CSSR_Form_R.html"

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
                            </tbody>
                        </table>
                    </div>

                    <div class="sec-label" style="text-align: center; margin-bottom: 2mm;">Record of Equipment for the Cargo Ship Safety Radio (Form R)</div>
                    <p class="cert-desc" style="text-align: center; font-style: italic; margin-bottom: 0;">
                        RECORD OF EQUIPMENT FOR COMPLIANCE WITH THE INTERNATIONAL CONVENTION FOR THE
                    </p>
                    <p class="cert-desc" style="text-align: center; font-style: italic; margin-bottom: 6mm;">
                        SAFETY OF LIFE AT SEA, 1974, AS AMENDED
                    </p>

                    <div class="sec-label">Particulars of the ship</div>
                    <table class="data-table" style="margin-bottom: 6mm;">
                        <tbody>
                            <tr>
                                <th style="width: 50%;">Name of ship</th>
                                <td>{vessel_name}</td>
                            </tr>
                            <tr>
                                <th>Distinctive number or letters</th>
                                <td>{call_sign}</td>
                            </tr>
                            <tr>
                                <th>Minimum number of persons with required qualifications to operate the radio installations</th>
                                <td></td>
                            </tr>
                        </tbody>
                    </table>

                    <div class="sec-label">Details of Radio Facilities</div>
                    <table class="data-table" style="margin-bottom: 6mm;">
                        <thead>
                            <tr>
                                <th>Items</th>
                                <th>Actual Provisions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><th colspan="2" style="background-color: var(--navy-light); color: white; text-align: left; padding-left: 8px;">Primary System</th></tr>
                            <tr><th colspan="2" style="background-color: var(--navy-light); color: white; text-align: left; padding-left: 8px;">VHF Radio Installation</th></tr>
                            <tr><th style="font-weight: normal; padding-left: 15px;">DSC encoder</th><td></td></tr>
                            <tr><th style="font-weight: normal; padding-left: 15px;">DSC watch receiver</th><td></td></tr>
                            <tr><th style="font-weight: normal; padding-left: 15px;">Radiotelephony</th><td></td></tr>
                            <tr><th colspan="2" style="background-color: var(--navy-light); color: white; text-align: left; padding-left: 8px;">MF radio installation</th></tr>
                            <tr><th style="font-weight: normal; padding-left: 15px;">DSC encoder</th><td></td></tr>
                            <tr><th style="font-weight: normal; padding-left: 15px;">DSC watch receiver</th><td></td></tr>
                            <tr><th style="font-weight: normal; padding-left: 15px;">Radiotelephony</th><td></td></tr>
                            <tr><th colspan="2" style="background-color: var(--navy-light); color: white; text-align: left; padding-left: 8px;">MF/HF radio installation</th></tr>
                            <tr><th style="font-weight: normal; padding-left: 15px;">DSC encoder</th><td></td></tr>
                            <tr><th style="font-weight: normal; padding-left: 15px;">DSC watch receiver</th><td></td></tr>
                            <tr><th style="font-weight: normal; padding-left: 15px;">Radiotelephony</th><td></td></tr>
                            <tr><th style="font-weight: normal; padding-left: 15px;">Direct-printing telegraphy</th><td></td></tr>
                            <tr><th colspan="2" style="background-color: var(--navy-light); color: white; text-align: left; padding-left: 8px;">Recognized mobile satellite service ship earth station</th></tr>
                            <tr><th style="font-weight: normal; padding-left: 15px;">Secondary means of alerting</th><td></td></tr>
                            <tr><th colspan="2" style="background-color: var(--navy-light); color: white; text-align: left; padding-left: 8px;">Facilities for reception of maritime safety information</th></tr>
                            <tr><th style="font-weight: normal; padding-left: 15px;">NAVTEX receiver</th><td></td></tr>
                            <tr><th style="font-weight: normal; padding-left: 15px;">EGC receiver</th><td></td></tr>
                            <tr><th style="font-weight: normal; padding-left: 15px;">HF Direct-Printing radiotelegraph receiver</th><td></td></tr>
                            <tr><th colspan="2" style="background-color: var(--navy-light); color: white; text-align: left; padding-left: 8px;">Satellite EPIRB</th></tr>
                            <tr><th style="font-weight: normal; padding-left: 15px;">COSPAS - SARSAT</th><td></td></tr>
                            <tr><th style="font-weight: normal; padding-left: 15px;">VHF EPIRB</th><td></td></tr>
                            <tr><th colspan="2" style="background-color: var(--navy-light); color: white; text-align: left; padding-left: 8px;">Ship's search and rescue locating device</th></tr>
                            <tr><th style="font-weight: normal; padding-left: 15px;">Radar search and rescue transponder (SART)</th><td></td></tr>
                            <tr><th style="font-weight: normal; padding-left: 15px;">AIS search and rescue transmitter (AIS-SART)</th><td></td></tr>
                        </tbody>
                    </table>

                    <div class="sec-label">Methods used to ensure availability of radio facilities (regulations IV/15.6 and 15.7)</div>
                    <table class="data-table" style="margin-bottom: 6mm;">
                        <tbody>
                            <tr>
                                <th style="width: 50%;">Duplication of equipment</th>
                                <td></td>
                            </tr>
                            <tr>
                                <th>Shore-based maintenance</th>
                                <td></td>
                            </tr>
                            <tr>
                                <th>At-sea maintenance capability</th>
                                <td></td>
                            </tr>
                        </tbody>
                    </table>

                    <p class="cert-desc" style="margin-bottom: 4mm;">THIS IS TO CERTIFY that this Record is correct in all respects.</p>

                    <table class="data-table" style="margin-bottom: 8mm; width: auto; min-width: 300px;">
                        <tbody>
                            <tr>
                                <th>Issued at</th>
                                <td>{place_of_issue}</td>
                                <th>on</th>
                                <td>{date_of_issue}</td>
                            </tr>
                        </tbody>
                    </table>

                    <div style="display: flex; justify-content: space-between; margin-top: auto; padding-top: 10px; border-top: 1px solid #ccc;">
                        <div style="width: 45%;">
                            <p class="cert-desc" style="margin-bottom: 2mm;">Signature of duly authorized official issuing the Record</p>
                            <div style="border-bottom: 1px solid #000; height: 30px; margin-bottom: 5px;"></div>
                            <div style="font-weight: bold;">Name:</div>
                            <div style="font-weight: bold; margin-top: 2px;">GR CLASS - CLASSIFIED FOR STANDARD</div>
                        </div>
                    </div>
"""
    new_content = content[:start_idx + len(start_marker)] + "\n" + new_body + "\n" + content[end_idx:]
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Updated GRClass_CSSR_Form_R.html")
else:
    print("Could not find markers.")
