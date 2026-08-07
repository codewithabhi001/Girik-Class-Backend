import os

file_path = r"a:\Girik workspace\grclass-backend\ONLY CERTIFICATES\Certificate of Compliance with the International Maritime Solid Bulk Cargoes (IMSBC) CODE\html\GRClass_IMSBC_IC_Approved_Cargoes.html"

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

                    <div class="sec-label" style="text-align: center; margin-bottom: 1mm; font-size: 11pt;">INTERIM CERTIFICATE OF COMPLIANCE WITH THE</div>
                    <div class="sec-label" style="text-align: center; margin-bottom: 1mm; font-size: 11pt;">INTERNATIONAL MARITIME</div>
                    <div class="sec-label" style="text-align: center; margin-bottom: 4mm; font-size: 11pt;">SOLID BULK CARGOES (IMSBC) CODE</div>

                    <p class="cert-desc" style="text-align: center; font-style: italic; margin-bottom: 2mm;">
                        Issued under the authority of the Government of <strong>{flag_state}</strong>
                    </p>
                    <div class="sec-label" style="text-align: center; margin-bottom: 6mm;">GR CLASS - CLASSIFIED FOR STANDARD</div>

                    <table class="data-table" style="margin-bottom: 6mm;">
                        <thead>
                            <tr>
                                <th>Name of ship</th>
                                <th>Distinctive number or letters</th>
                                <th>Port of registry</th>
                                <th>Gross tonnage</th>
                                <th>IMO number</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>{vessel_name}</td>
                                <td>{call_sign}</td>
                                <td>{port_of_registry}</td>
                                <td>{gross_tonnage}</td>
                                <td>{imo_number}</td>
                            </tr>
                        </tbody>
                    </table>

                    <p class="cert-desc" style="margin-bottom: 4mm;">
                        This is to certify that the ship is suitable for the carriage in bulk of all cargoes listed in Attachment 1 in the cargo hold stated in accordance with the provisions of the International Maritime Solid Bulk Cargoes Code provided that:
                    </p>

                    <table class="data-table" style="margin-bottom: 6mm; border: none;">
                        <tbody>
                            <tr>
                                <th style="width: 30px; border: none; background: transparent;">a.</th>
                                <td style="border: none;">The relevant construction and equipment are maintained in good order;</td>
                            </tr>
                            <tr>
                                <th style="border: none; background: transparent;">b.</th>
                                <td style="border: none;">Any cargo should be loaded and distributed in pursuant to information provided in the approved* loading manual and the stability information booklet provided on board the ship;</td>
                            </tr>
                            <tr>
                                <th style="border: none; background: transparent;">c.</th>
                                <td style="border: none;">The nominal specific gravity of any cargo should not exceed the allowable value indicated in the loading manual; and</td>
                            </tr>
                            <tr>
                                <th style="border: none; background: transparent;">d.</th>
                                <td style="border: none;">The remaining operational requirements stipulated in the Code, including those stated in General Note on Attachment 2, should be ensured.</td>
                            </tr>
                        </tbody>
                    </table>

                    <table class="data-table" style="margin-bottom: 8mm; width: auto; min-width: 300px;">
                        <tbody>
                            <tr>
                                <th>This certificate is valid until</th>
                                <td></td>
                            </tr>
                            <tr>
                                <th>Completion date of the survey on which this certificate is based (YYYY-MM-DD)</th>
                                <td></td>
                            </tr>
                            <tr>
                                <th>Issued at</th>
                                <td>{place_of_issue}</td>
                            </tr>
                            <tr>
                                <th>Date of issue (YYYY-MM-DD)</th>
                                <td>{date_of_issue}</td>
                            </tr>
                        </tbody>
                    </table>

                    <div style="display: flex; justify-content: space-between; margin-top: auto; padding-top: 10px; border-top: 1px solid #ccc;">
                        <div style="width: 45%;">
                            <p class="cert-desc" style="margin-bottom: 2mm;">Signature of authorized official issuing the Certificate</p>
                            <div style="border-bottom: 1px solid #000; height: 30px; margin-bottom: 5px;"></div>
                            <div style="font-weight: bold;">Name:</div>
                            <div style="font-weight: bold; margin-top: 2px;">GR CLASS - CLASSIFIED FOR STANDARD</div>
                        </div>
                    </div>

                    <div style="page-break-before: always;"></div>

                    <div class="sec-label" style="text-align: center; margin-bottom: 1mm; font-size: 11pt;">CERTIFICATE OF COMPLIANCE WITH THE</div>
                    <div class="sec-label" style="text-align: center; margin-bottom: 1mm; font-size: 11pt;">INTERNATIONAL MARITIME</div>
                    <div class="sec-label" style="text-align: center; margin-bottom: 4mm; font-size: 11pt;">SOLID BULK CARGOES (IMSBC) CODE</div>

                    <div class="sec-label" style="text-align: center; margin-bottom: 4mm;">ATTACHMENT 1<br>LIST OF CARGOES PERMITTED TO BE CARRIED</div>

                    <table class="data-table" style="margin-bottom: 4mm;">
                        <thead>
                            <tr>
                                <th>Material</th>
                                <th>IMO CLASS</th>
                                <th>UN No.</th>
                                <th>NOTE</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>All materials of Group A and Group C</td>
                                <td></td>
                                <td></td>
                                <td>1, 2*, 4</td>
                            </tr>
                        </tbody>
                    </table>

                    <p class="cert-desc" style="margin-bottom: 8mm;">(See Attachment 2)<br>*Delete if not appropriate</p>

                    <div style="display: flex; justify-content: space-between; margin-top: auto; padding-top: 10px; border-top: 1px solid #ccc;">
                        <div style="width: 45%;">
                            <div style="border-bottom: 1px solid #000; height: 30px; margin-bottom: 5px;"></div>
                            <div style="font-weight: bold;">Date:</div>
                            <div style="font-weight: bold;">At:</div>
                            <div style="font-weight: bold; margin-top: 2px;">GR CLASS - CLASSIFIED FOR STANDARD</div>
                        </div>
                    </div>

                    <div style="page-break-before: always;"></div>
                    
                    <div class="sec-label" style="text-align: center; margin-bottom: 1mm; font-size: 11pt;">CERTIFICATE OF COMPLIANCE WITH THE</div>
                    <div class="sec-label" style="text-align: center; margin-bottom: 1mm; font-size: 11pt;">INTERNATIONAL MARITIME</div>
                    <div class="sec-label" style="text-align: center; margin-bottom: 4mm; font-size: 11pt;">SOLID BULK CARGOES (IMSBC) CODE</div>

                    <div class="sec-label" style="text-align: center; margin-bottom: 4mm;">ATTACHMENT 2<br>GENERAL NOTE</div>

                    <p class="cert-desc" style="margin-bottom: 4mm;">
                        When it has been required by the Code, persons, who may be exposed to the dust of the cargo, shall wear protective clothing, goggles or other equivalent dust eye - protection and dust filter mask, as necessary.
                        <br><br>
                        When carrying a solid bulk cargo which is liable to emit a toxic or flammable gas, and/or cause oxygen depletion in the cargo space, the appropriate instrument(s) for measuring the concentration of gas and oxygen in the cargo space shall be provided.
                    </p>

                    <div class="sec-label">NOTE</div>
                    <table class="data-table" style="margin-bottom: 6mm;">
                        <tbody>
                            <tr><th style="width: 30px;">1.</th><td>Except AMMONIUM NITRATE BASED FERTILIZER (non-hazardous), COAL SLURRY*, SCRAP METAL* AND SULPHUR (FORMED, SOLID)*.</td></tr>
                            <tr><th>2.</th><td>CHOPPED RUBBER AND PLASTIC INSULATION, COARSE CHOPPED TYRES and GRANULATE TYPE RUBBER are not permitted to be loaded when the planned interval between the commencement of loading and the completion of discharge of the cargoes exceeds 5 days.</td></tr>
                            <tr><th>3.</th><td>AMMONIUM NITRATE BASED FERTILIZER (non-hazardous) is to be stowed out of direct contact with a metal engine room boundaries</td></tr>
                            <tr><th>4.</th><td>PEANUTS (in shell) and Industrial sand coated with resin are to be stowed at least 3m horizontally away from engine room boundaries</td></tr>
                            <tr><th>5.</th><td>To be stowed at least 3m horizontally away from engine room boundaries.</td></tr>
                            <tr><th>6.</th><td>CASTER MEAL, CASTER POMACE and CASTER FLAKE shall not be carried in bulk.</td></tr>
                            <tr><th>7.</th><td>Consideration shall be given to providing the vessel with the means to top up the cargo spaces with additional supplies of inert gas taking into account the duration of the voyage. The ship's fixed CO2 Fire extinguishing system shall not be used for this purpose.</td></tr>
                            <tr><th>8.</th><td>Except Seedcake containing solvent extractions.</td></tr>
                            <tr><th>9.</th><td>Fine grained sulphur (flower of sulphur) shall not be transported in bulk</td></tr>
                            <tr><th>10.</th><td>With moisture content of 15% or more.</td></tr>
                        </tbody>
                    </table>
                    <p class="cert-desc">*Delete if not appropriate.</p>
"""
    new_content = content[:start_idx + len(start_marker)] + "\n" + new_body + "\n" + content[end_idx:]
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Updated GRClass_IMSBC_IC_Approved_Cargoes.html")
else:
    print("Could not find markers.")
