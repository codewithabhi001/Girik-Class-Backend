import os

file_path = r"a:\Girik workspace\grclass-backend\ONLY CERTIFICATES\Survey Statement\html\GRClass_Survey_Statement.html"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

start_marker = '<div class="body" style="flex: 1; display: flex; flex-direction: column;">'
end_marker = '                </div>\n\n                {remarks}'

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx != -1 and end_idx != -1:
    new_body = """
                    <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 4mm;">
                        <div>
                            <div style="font-weight: bold; font-size: 14pt; color: var(--navy-blue);">P24-GR</div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-weight: bold; font-size: 14pt; color: var(--navy-blue);">SURVEY STATEMENT</div>
                        </div>
                    </div>

                    <table class="data-table" style="margin-bottom: 4mm;">
                        <tbody>
                            <tr>
                                <th style="width: 25%;">Statement No.</th>
                                <td style="width: 25%;"></td>
                                <th style="width: 25%;">Class No.</th>
                                <td style="width: 25%;"></td>
                            </tr>
                            <tr>
                                <th>Ship Name</th>
                                <td>{vessel_name}</td>
                                <th>IMO No.</th>
                                <td>{imo_number}</td>
                            </tr>
                            <tr>
                                <th>Port of Registry</th>
                                <td>{port_of_registry}</td>
                                <th>Inspection Office</th>
                                <td></td>
                            </tr>
                            <tr>
                                <th>Visit Date</th>
                                <td></td>
                                <th>Visit Held At</th>
                                <td></td>
                            </tr>
                            <tr>
                                <th>Attending Surveyor</th>
                                <td colspan="3"></td>
                            </tr>
                        </tbody>
                    </table>

                    <p class="cert-desc" style="margin-bottom:4mm; font-style: italic;">
                        The undersigned has carried out the surveys and/or verifications listed below. It is recommended to GR HO that ship's class and/or statutory certification to be instated or up-dated as follows:
                    </p>

                    <div class="sec-label">1. Class/Statutory Surveys Performed</div>
                    <table class="data-table" style="margin-bottom: 4mm;">
                        <thead>
                            <tr>
                                <th>Type of Survey/Verification</th>
                                <th>Description</th>
                                <th>Status</th>
                                <th>Comments</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td>&nbsp;</td><td></td><td></td><td></td></tr>
                            <tr><td>&nbsp;</td><td></td><td></td><td></td></tr>
                        </tbody>
                    </table>

                    <div class="sec-label">2. Other surveys performed (i.e. Non-periodical)</div>
                    <table class="data-table" style="margin-bottom: 4mm;">
                        <thead>
                            <tr>
                                <th>Type of Survey/Verification</th>
                                <th>Description</th>
                                <th>Code</th>
                                <th>Comments</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td>&nbsp;</td><td></td><td></td><td></td></tr>
                        </tbody>
                    </table>

                    <div class="sec-label">3. Condition of Class (COC)</div>
                    <table class="data-table" style="margin-bottom: 4mm;">
                        <thead>
                            <tr>
                                <th>No.</th>
                                <th>Description</th>
                                <th>Status</th>
                                <th>Due Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td>&nbsp;</td><td></td><td></td><td></td></tr>
                        </tbody>
                    </table>

                    <div class="sec-label">4. Statutory Condition (STC)</div>
                    <table class="data-table" style="margin-bottom: 4mm;">
                        <thead>
                            <tr>
                                <th>No.</th>
                                <th>Description</th>
                                <th>Status</th>
                                <th>Due Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td>&nbsp;</td><td></td><td></td><td></td></tr>
                        </tbody>
                    </table>

                    <div class="sec-label">5. Transfer of Class</div>
                    <p class="cert-desc" style="margin-bottom:2mm">Any Special Condition or Pending Remark(s) from the loosing Society? If Yes please describe:</p>
                    <table class="data-table" style="margin-bottom: 4mm;">
                        <thead>
                            <tr>
                                <th>No.</th>
                                <th>Description</th>
                                <th>Status</th>
                                <th>Due Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td>&nbsp;</td><td></td><td></td><td></td></tr>
                        </tbody>
                    </table>

                    <div class="sec-label">6. Memoranda for Owners</div>
                    <table class="data-table" style="margin-bottom: 8mm;">
                        <thead>
                            <tr>
                                <th>No.</th>
                                <th>Description</th>
                                <th>Status</th>
                                <th>Due Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td>&nbsp;</td><td></td><td></td><td></td></tr>
                        </tbody>
                    </table>

                    <div style="display: flex; justify-content: space-between; margin-top: auto; padding-top: 10px; border-top: 1px solid #ccc;">
                        <div style="text-align: center; width: 45%;">
                            <div style="border-bottom: 1px solid #000; height: 30px; margin-bottom: 5px;"></div>
                            <div style="font-weight: bold;">GR CLASS Surveyor Name - ID No. - Signature</div>
                        </div>
                        <div style="text-align: center; width: 45%;">
                            <div style="border-bottom: 1px solid #000; height: 30px; margin-bottom: 5px;"></div>
                            <div style="font-weight: bold;">Captain Name - Signature</div>
                        </div>
                    </div>
"""
    new_content = content[:start_idx + len(start_marker)] + "\n" + new_body + "\n" + content[end_idx:]
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Updated GRClass_Survey_Statement.html")
else:
    print("Could not find markers.")
