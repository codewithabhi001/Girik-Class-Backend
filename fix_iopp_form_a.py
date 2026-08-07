import os

file_path = r"a:\Girik workspace\grclass-backend\ONLY CERTIFICATES\INTERNATIONAL OIL POLLUTION PREVENTION CERTIFICATE\html\GRClass_IOPP_Form_A.html"

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

                    <div class="sec-label" style="text-align: center; margin-bottom: 1mm; font-size: 11pt;">FORM A</div>
                    <div class="sec-label" style="text-align: center; margin-bottom: 4mm; font-size: 11pt;">SUPPLEMENT TO THE INTERNATIONAL OIL POLLUTION PREVENTION CERTIFICATE (IOPP CERTIFICATE)</div>

                    <p class="cert-desc" style="text-align: center; font-style: italic; margin-bottom: 4mm;">
                        Record of Construction and Equipment for Ships other than Oil Tankers in respect of the Provisions of Annex I of the International Convention for the Prevention of Pollution from Ships, 1973, as modified by the Protocol of 1978 relating thereto (hereinafter referred to as "the Convention").
                    </p>

                    <p class="cert-desc" style="margin-bottom: 2mm;"><strong>Notes:</strong></p>
                    <ul class="cert-desc" style="margin-bottom: 4mm; padding-left: 20px;">
                        <li>This form is to be used for the third type of ships as categorized in the IOPP Certificate, i.e. "ship other than any of the above". For oil tankers and ships other than oil tankers with cargo tanks coming under regulation 2.2 of Annex I of the Convention, Form B shall be used.</li>
                        <li>This record shall be permanently attached to the IOPP Certificate. The IOPP Certificate shall be available on board the ship at all times.</li>
                        <li>If the language of the original Record is either English, French or Spanish, the text shall include a translation into one of these languages.</li>
                        <li>Entries in boxes shall be made by inserting either a cross (X) for the answers "yes" and "applicable" or a dash (-) for the answers "no" and "not applicable" as appropriate.</li>
                        <li>Regulation mentioned in this record refer to regulations of Annex I of the Convention and resolutions refer to those adopted by the International Maritime Organization.</li>
                    </ul>

                    <div class="sec-label">1. PARTICULARS OF SHIP</div>
                    <table class="data-table" style="margin-bottom: 6mm;">
                        <tbody>
                            <tr><th style="width: 50px;">1.1</th><th style="width: 50%;">Name of ship:</th><td>{vessel_name}</td></tr>
                            <tr><th>1.2</th><th>Distinctive number or letters:</th><td>{call_sign}</td></tr>
                            <tr><th>1.3</th><th>Port of registry:</th><td>{port_of_registry}</td></tr>
                            <tr><th>1.4</th><th>Gross Tonnage:</th><td>{gross_tonnage}</td></tr>
                            <tr><th>1.5</th><th>Date of build:</th><td>{date_of_build}</td></tr>
                            <tr><th>1.5.1</th><th style="font-weight: normal; padding-left: 15px;">Date of building contract:</th><td></td></tr>
                            <tr><th>1.5.2</th><th style="font-weight: normal; padding-left: 15px;">Date on which keel was laid or ship was at a similar stage of construction:</th><td></td></tr>
                            <tr><th>1.5.3</th><th style="font-weight: normal; padding-left: 15px;">Date of delivery:</th><td></td></tr>
                            <tr><th>1.6</th><th>Major conversion (if applicable):</th><td></td></tr>
                            <tr><th>1.6.1</th><th style="font-weight: normal; padding-left: 15px;">Date of conversion contract:</th><td></td></tr>
                            <tr><th>1.6.2</th><th style="font-weight: normal; padding-left: 15px;">Date on which conversion was commenced:</th><td></td></tr>
                            <tr><th>1.6.3</th><th style="font-weight: normal; padding-left: 15px;">Date of completion of conversion:</th><td></td></tr>
                            <tr><th>1.7</th><th>The ship has been accepted by the Administration as a "ship delivered on or before 31 December 1979" under regulation 1.28.1 due to unforeseen delay in delivery</th><td></td></tr>
                        </tbody>
                    </table>

                    <div class="sec-label">2. EQUIPMENT FOR THE CONTROL OF OIL DISCHARGE FROM MACHINERY SPACE BILGES AND OIL FUEL TANKS (regulation 16 and 14)</div>
                    <table class="data-table" style="margin-bottom: 6mm;">
                        <tbody>
                            <tr><th style="width: 50px;">2.1</th><th style="width: 80%;">Carriage of ballast water in oil fuel tanks:</th><td></td></tr>
                            <tr><th>2.1.1</th><td style="padding-left: 15px;">The ship may under normal conditions carry ballast water in oil fuel tanks</td><td></td></tr>
                            <tr><th>2.2</th><th>Type of oil filtering equipment fitted:</th><td></td></tr>
                            <tr><th>2.2.1</th><td style="padding-left: 15px;">Oil filtering (15 ppm) equipment (regulation 14.6)</td><td></td></tr>
                            <tr><th>2.2.2</th><td style="padding-left: 15px;">Oil filtering (15 ppm) equipment with alarm and automatic stopping device (regulation 14.7)</td><td></td></tr>
                            <tr><th>2.3</th><th>Approval standards:</th><td></td></tr>
                            <tr><th>2.3.1</th><td style="padding-left: 15px;">The separating / filtering equipment:</td><td></td></tr>
                            <tr><th>.1</th><td style="padding-left: 30px;">has been approved in accordance with resolution A.393 (X)</td><td></td></tr>
                            <tr><th>.2</th><td style="padding-left: 30px;">has been approved in accordance with resolution MEPC.60(33)</td><td></td></tr>
                            <tr><th>.3</th><td style="padding-left: 30px;">has been approved in accordance with resolution MEPC.107(49)</td><td></td></tr>
                            <tr><th>.4</th><td style="padding-left: 30px;">has been approved in accordance with resolution A.233(VII)</td><td></td></tr>
                            <tr><th>.5</th><td style="padding-left: 30px;">has been approved in accordance with national standards not based upon resolution A.393(X) or A.233(VII)</td><td></td></tr>
                            <tr><th>.6</th><td style="padding-left: 30px;">has not been approved</td><td></td></tr>
                            <tr><th>2.3.2</th><td style="padding-left: 15px;">The process unit has been approved in accordance with resolution A. 444 (XI)</td><td></td></tr>
                            <tr><th>2.3.3</th><td style="padding-left: 15px;">The oil content meter:</td><td></td></tr>
                            <tr><th>.1</th><td style="padding-left: 30px;">has been approved in accordance with resolution A.393(X)</td><td></td></tr>
                            <tr><th>.2</th><td style="padding-left: 30px;">has been approved in accordance with resolution MEPC.60(33)</td><td></td></tr>
                            <tr><th>.3</th><td style="padding-left: 30px;">has been approved in accordance with resolution MEPC.107(49)</td><td></td></tr>
                            <tr><th>2.4</th><th>Maximum throughput of the system is ______ m3/h.</th><td></td></tr>
                            <tr><th>2.5</th><th>Waiver of regulations 14:</th><td></td></tr>
                            <tr><th>2.5.1</th><td style="padding-left: 15px;">The requirements of regulation 14.1 or 14.2 are waived in respect of the ship in accordance with regulation 14.5.</td><td></td></tr>
                            <tr><th>2.5.1.1</th><td style="padding-left: 30px;">The ship is engaged exclusively on voyages within special area(s)</td><td></td></tr>
                            <tr><th>2.5.1.2</th><td style="padding-left: 30px;">The ship is certificated under the International Code of Safety for High-Speed Craft and engaged on a scheduled service with a turn-around time not exceeding 24 hours</td><td></td></tr>
                            <tr><th>2.5.2</th><td style="padding-left: 15px;">This ship is fitted with holding tank(s) for the total retention on board of all oily bilge water as follows:</td><td></td></tr>
                        </tbody>
                    </table>

                    <table class="data-table" style="margin-bottom: 6mm;">
                        <thead>
                            <tr>
                                <th>Tank Identification</th>
                                <th>Tank location</th>
                                <th>Volume (m3)</th>
                                <th>Frames (from) - (to)</th>
                                <th>Lateral Position</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td>&nbsp;</td><td></td><td></td><td></td><td></td></tr>
                            <tr><th colspan="4" style="text-align: right;">Total volume (m3)</th><td></td></tr>
                        </tbody>
                    </table>

                    <div style="page-break-before: always;"></div>

                    <div class="sec-label">2A.1 The ship is required to be constructed according to regulation 12A and complies with the requirements of:</div>
                    <table class="data-table" style="margin-bottom: 6mm;">
                        <tbody>
                            <tr><th style="width: 80%;">Paragraphs 6 and either 7 or 8 (double hull construction)</th><td></td></tr>
                            <tr><th>Paragraph 11 (accidental oil fuel outflow performance)</th><td></td></tr>
                            <tr><th>2A.2 The ship is not required to comply with the requirements of regulation 12A.</th><td></td></tr>
                        </tbody>
                    </table>

                    <div class="sec-label">3. MEANS FOR RETENTION AND DISPOSAL OF OIL RESIDUES (SLUDGE) (REGULATION 12) AND OILY BILGE WATER HOLDING TANK(S)</div>
                    <p class="cert-desc" style="margin-bottom: 2mm;"><strong>3.1 The ship is provided with oil residue (sludge) tanks for retention of oil residues (sludge) on board as follows:</strong></p>
                    
                    <table class="data-table" style="margin-bottom: 6mm;">
                        <thead>
                            <tr>
                                <th>Tank Identification</th>
                                <th>Tank location</th>
                                <th>Volume (m3)</th>
                                <th>Frames (from) - (to)</th>
                                <th>Lateral Position</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td>&nbsp;</td><td></td><td></td><td></td><td></td></tr>
                            <tr><th colspan="4" style="text-align: right;">Total volume (m3)</th><td></td></tr>
                        </tbody>
                    </table>

                    <table class="data-table" style="margin-bottom: 6mm;">
                        <tbody>
                            <tr><th style="width: 50px;">3.2</th><th style="width: 80%;">Means for the disposal of oil residues (sludge) retained in oil residue (sludge) tanks:</th><td></td></tr>
                            <tr><th>3.2.1</th><td style="padding-left: 15px;">Incinerator for oil residues (sludge)</td><td></td></tr>
                            <tr><th>3.2.2</th><td style="padding-left: 15px;">Auxiliary boiler suitable for burning oil residues (sludge)</td><td></td></tr>
                            <tr><th>3.2.3</th><td style="padding-left: 15px;">Other acceptable means, state which:</td><td></td></tr>
                            <tr><th>3.3</th><th>The ship is provided with holding tank(s) for the retention on board of oily bilge water as follows:</th><td></td></tr>
                        </tbody>
                    </table>

                    <table class="data-table" style="margin-bottom: 6mm;">
                        <thead>
                            <tr>
                                <th>Tank Identification</th>
                                <th>Tank location</th>
                                <th>Volume (m3)</th>
                                <th>Frames (from) - (to)</th>
                                <th>Lateral Position</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td>&nbsp;</td><td></td><td></td><td></td><td></td></tr>
                            <tr><th colspan="4" style="text-align: right;">Total volume (m3)</th><td></td></tr>
                        </tbody>
                    </table>

                    <div class="sec-label">4. STANDARD DISCHARGE CONNECTION (regulation 13)</div>
                    <table class="data-table" style="margin-bottom: 6mm;">
                        <tbody>
                            <tr><th style="width: 50px;">4.1</th><th>This ship is provided with a pipeline for the discharge of residues from machinery bilges and sludges to reception facilities, fitted with a standard discharge connection in accordance with regulation 13.</th><td></td></tr>
                        </tbody>
                    </table>

                    <div class="sec-label">5. SHIPBOARD OIL/MARINE POLLUTION EMERGENCY PLAN (regulation 37)</div>
                    <table class="data-table" style="margin-bottom: 6mm;">
                        <tbody>
                            <tr><th style="width: 50px;">5.1</th><th>The ship is provided with a shipboard oil pollution emergency plan in compliance with regulation 37.</th><td></td></tr>
                            <tr><th>5.2</th><th>The ship is provided with a shipboard marine pollution emergency plan in compliance with regulation 37.3.</th><td></td></tr>
                        </tbody>
                    </table>

                    <div class="sec-label">6. EXEMPTION</div>
                    <table class="data-table" style="margin-bottom: 6mm;">
                        <tbody>
                            <tr><th style="width: 50px;">6.1</th><th>Exemptions have been granted by the Administration from the requirements of chapter 3 of Annex I of the Convention in accordance with regulation 3.1 on those items listed under paragraph _____ of this Record.</th><td></td></tr>
                        </tbody>
                    </table>

                    <div class="sec-label">7. EQUIVALENTS (regulation 5)</div>
                    <table class="data-table" style="margin-bottom: 6mm;">
                        <tbody>
                            <tr><th style="width: 50px;">7.1</th><th>Equivalents have been approved by Administration for certain requirements of Annex I on those items listed under paragraph(s) _____ of this Record.</th><td></td></tr>
                        </tbody>
                    </table>

                    <div class="sec-label">8. COMPLIANCE WITH PART II-A - CHAPTER 1 OF THE POLAR CODE</div>
                    <table class="data-table" style="margin-bottom: 6mm;">
                        <tbody>
                            <tr><th style="width: 50px;">8.1</th><th>The ship is in compliance with additional requirements in the environment-related provisions of the Introduction and section 1.2 of chapter 1 of part II-A of the Polar Code.</th><td></td></tr>
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
    print("Updated GRClass_IOPP_Form_A.html")
else:
    print("Could not find markers.")
