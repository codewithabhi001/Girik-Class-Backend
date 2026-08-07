import os

file_path = r"a:\Girik workspace\grclass-backend\ONLY CERTIFICATES\INTERNATIONAL ENERGY EFFICIENCY CERTIFICATE\html\GRClass_IEE_Supplement.html"

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

                    <div class="sec-label" style="text-align: center; margin-bottom: 2mm;">INTERNATIONAL ENERGY EFFICIENCY CERTIFICATE</div>
                    <p class="cert-desc" style="text-align: center; font-style: italic; margin-bottom: 4mm;">
                        Issued under the provisions of the Protocol of 1997, as amended, to amend the International Convention for the Prevention of Pollution by Ships, 1973, as modified by the Protocol of 1978 related thereto, (hereinafter referred to as "the Convention") under the authority of the Government of <strong>{flag_state}</strong> by:
                    </p>
                    <div class="sec-label" style="text-align: center; margin-bottom: 6mm;">GR CLASS - CLASSIFIED FOR STANDARD</div>

                    <div class="sec-label">Particulars of ship</div>
                    <table class="data-table" style="margin-bottom: 6mm;">
                        <tbody>
                            <tr>
                                <th style="width: 50%;">Name of ship</th>
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
                                <th>Gross Tonnage</th>
                                <td>{gross_tonnage}</td>
                            </tr>
                            <tr>
                                <th>IMO Number</th>
                                <td>{imo_number}</td>
                            </tr>
                        </tbody>
                    </table>

                    <div class="sec-label">THIS IS TO CERTIFY:</div>
                    <ul class="cert-desc" style="margin-bottom: 4mm; padding-left: 20px;">
                        <li>That the ship has been surveyed in accordance with regulation 5.4 of Annex VI of the Convention; and</li>
                        <li>That the survey shows that the ship complies with the applicable requirements in regulation 22, 23, 24, 25 and 26.</li>
                    </ul>

                    <p class="cert-desc" style="margin-bottom: 4mm;">Completion date of the survey on which this certificate is based: __________________</p>

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
                            <p class="cert-desc" style="margin-bottom: 2mm;">Signature of duly authorized official issuing the Certificate</p>
                            <div style="border-bottom: 1px solid #000; height: 30px; margin-bottom: 5px;"></div>
                            <div style="font-weight: bold;">Name:</div>
                            <div style="font-weight: bold; margin-top: 2px;">GR CLASS - CLASSIFIED FOR STANDARD</div>
                        </div>
                    </div>
"""
    new_content = content[:start_idx + len(start_marker)] + "\n" + new_body + "\n" + content[end_idx:]
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Updated GRClass_IEE_Supplement.html")
else:
    print("Could not find markers.")
