import os

file_path = r"a:\Girik workspace\grclass-backend\ONLY CERTIFICATES\ANTI FOULING SYSTEM CERTIFICATE\html\GRClass_AFS_RA_SoC_Record.html"

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

                    <div class="sec-label" style="text-align: center; margin-bottom: 2mm;">RECORD OF ANTI-FOULING SYSTEM</div>
                    <p class="cert-desc" style="text-align: center; font-style: italic; margin-bottom: 6mm;">
                        This Record shall be permanently attached to the International Anti-Fouling System Statement of Compliance
                    </p>

                    <table class="data-table" style="margin-bottom: 6mm;">
                        <thead>
                            <tr>
                                <th>Name of Ship</th>
                                <th>Distinctive Number or Letters</th>
                                <th>IMO Number</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>{vessel_name}</td>
                                <td>{call_sign}</td>
                                <td>{imo_number}</td>
                            </tr>
                        </tbody>
                    </table>

                    <div class="sec-label">Details of anti-fouling system(s) applied</div>
                    <table class="data-table" style="margin-bottom: 6mm;">
                        <tbody>
                            <tr>
                                <th style="width: 50%;">Type(s) of anti-fouling system(s) used</th>
                                <td></td>
                            </tr>
                            <tr>
                                <th>Date(s) of application of anti-fouling system(s)</th>
                                <td></td>
                            </tr>
                            <tr>
                                <th>Name(s) of company(ies) and facility(ies)/location(s) where applied</th>
                                <td></td>
                            </tr>
                            <tr>
                                <th>Name(s) of anti-fouling system(s) manufacturer(s)</th>
                                <td></td>
                            </tr>
                            <tr>
                                <th>Name(s) and colour(s) of anti-fouling system(s)</th>
                                <td></td>
                            </tr>
                            <tr>
                                <th>Active ingredient(s) and their Chemical Abstract Services Registry Number(s) (CAS number(s))</th>
                                <td></td>
                            </tr>
                            <tr>
                                <th>Type(s) of sealer coat, if applicable</th>
                                <td></td>
                            </tr>
                            <tr>
                                <th>Name(s) and colour(s) of sealer coat applied, if applicable</th>
                                <td></td>
                            </tr>
                            <tr>
                                <th>Date of application of sealer coat</th>
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
                            <p class="cert-desc" style="margin-bottom: 2mm;">Signature of authorized official issuing the Record</p>
                            <div style="border-bottom: 1px solid #000; height: 30px; margin-bottom: 5px;"></div>
                            <div style="font-weight: bold;">Name:</div>
                            <div style="font-weight: bold; margin-top: 2px;">GR CLASS - CLASSIFIED FOR STANDARD</div>
                        </div>
                    </div>

                    <div style="page-break-before: always;"></div>

                    <div class="sec-label">Endorsement of the Records</div>
                    <p class="cert-desc" style="margin-bottom: 6mm;">
                        THIS IS TO CERTIFY that a survey required in accordance with Regulation 1(1) (b) of Annex 4 to the Convention found that the ship was in compliance with the Convention
                    </p>

                    <div class="sec-label">Details of anti-fouling system(s) applied</div>
                    <table class="data-table" style="margin-bottom: 6mm;">
                        <tbody>
                            <tr>
                                <th style="width: 50%;">Type(s) of anti-fouling system(s) used</th>
                                <td></td>
                            </tr>
                            <tr>
                                <th>Date(s) of application of anti-fouling system(s)</th>
                                <td></td>
                            </tr>
                            <tr>
                                <th>Name(s) of company(ies) and facility(ies)/location(s) where applied</th>
                                <td></td>
                            </tr>
                            <tr>
                                <th>Name(s) of anti-fouling system(s) manufacturer(s)</th>
                                <td></td>
                            </tr>
                            <tr>
                                <th>Name(s) and colour(s) of anti-fouling system(s)</th>
                                <td></td>
                            </tr>
                            <tr>
                                <th>Active ingredient(s) and their Chemical Abstract Services Registry Number(s) (CAS number(s))</th>
                                <td></td>
                            </tr>
                            <tr>
                                <th>Type(s) of sealer coat, if applicable</th>
                                <td></td>
                            </tr>
                            <tr>
                                <th>Name(s) and colour(s) of sealer coat applied, if applicable</th>
                                <td></td>
                            </tr>
                            <tr>
                                <th>Date of application of sealer coat</th>
                                <td></td>
                            </tr>
                        </tbody>
                    </table>

                    <table class="data-table" style="margin-bottom: 8mm; width: auto; min-width: 300px;">
                        <tbody>
                            <tr>
                                <th>Place:</th>
                                <td></td>
                                <th>Date:</th>
                                <td></td>
                            </tr>
                        </tbody>
                    </table>

                    <div style="display: flex; justify-content: space-between; margin-top: auto; padding-top: 10px; border-top: 1px solid #ccc;">
                        <div style="width: 45%;">
                            <p class="cert-desc" style="margin-bottom: 2mm;">Signature of authorized official issuing the Record</p>
                            <div style="border-bottom: 1px solid #000; height: 30px; margin-bottom: 5px;"></div>
                            <div style="font-weight: bold;">Name:</div>
                            <div style="font-weight: bold; margin-top: 2px;">GR CLASS - CLASSIFIED FOR STANDARD</div>
                        </div>
                    </div>

                    <p class="cert-desc" style="margin-top: 6mm; font-style: italic; font-size: 7pt; color: #666;">
                        This page of the Record shall be reproduced and added to the Record as considered necessary by the Administration.<br>
                        Date of completion of the survey on which this endorsement is made: ___________
                    </p>
"""
    new_content = content[:start_idx + len(start_marker)] + "\n" + new_body + "\n" + content[end_idx:]
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Updated GRClass_AFS_RA_SoC_Record.html")
else:
    print("Could not find markers.")
