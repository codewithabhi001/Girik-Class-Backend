import os

file_path = r"a:\Girik workspace\grclass-backend\ONLY CERTIFICATES\International Air Pollution Prevention Certificate\html\GRClass_IAPP_R_SoC_Supplement.html"

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
                                    <th>Statement No.:</th>
                                    <td>{certificate_number}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div class="sec-label" style="text-align: center; margin-bottom: 1mm; font-size: 10pt;">SUPPLEMENT TO INTERNATIONAL AIR POLLUTION PREVENTION STATEMENT OF COMPLIANCE</div>
                    <div class="sec-label" style="text-align: center; margin-bottom: 1mm; font-size: 11pt;">(IAPP STATEMENT OF COMPLIANCE)</div>
                    <div class="sec-label" style="text-align: center; margin-bottom: 4mm; font-size: 11pt;">RECORD OF CONSTRUCTION AND EQUIPMENT</div>

                    <p class="cert-desc" style="text-align: center; font-style: italic; margin-bottom: 4mm;">
                        In respect of the provisions of Annex I of the International Convention for the Prevention of Pollution from ships, 1973, as modified by the Protocol of 1978 relating thereto (hereinafter referred to as "the Convention").
                    </p>

                    <p class="cert-desc" style="margin-bottom: 2mm;"><strong>Notes:</strong></p>
                    <ul class="cert-desc" style="margin-bottom: 4mm; padding-left: 20px;">
                        <li>This Record shall be permanently attached to the IAPP Statement of Compliance. The IAPP Statement of Compliance shall be available on board the ship at all times.</li>
                        <li>The Record shall be at least in English, French or Spanish. If an official language of the issuing country is also used, this shall prevail in case of a dispute or discrepancy.</li>
                        <li>Entries in boxes shall be made by inserting either a cross (x) for the answer "yes" and "applicable" or a (-) for the answers "no" and "not applicable" as appropriate.</li>
                        <li>Unless otherwise stated, regulations mentioned in this Record refer to regulations of Annex VI of the Convention and resolutions or circulars refer to those adopted by the International Maritime Organization.</li>
                    </ul>

                    <div class="sec-label">1. PARTICULARS OF SHIP</div>
                    <table class="data-table" style="margin-bottom: 6mm;">
                        <tbody>
                            <tr>
                                <th style="width: 50%;">Name of Ship</th>
                                <td>{vessel_name}</td>
                            </tr>
                            <tr>
                                <th>IMO number</th>
                                <td>{imo_number}</td>
                            </tr>
                            <tr>
                                <th>1.3 Date on which keel was laid or ship was at similar stage of construction</th>
                                <td></td>
                            </tr>
                            <tr>
                                <th>1.4 Length (L) meters</th>
                                <td></td>
                            </tr>
                        </tbody>
                    </table>

                    <div class="sec-label">2. Control of emissions from ships</div>
                    <p class="cert-desc" style="margin-bottom: 2mm;"><strong>2.1 Ozone depleting substances (regulation 12)</strong></p>
                    <p class="cert-desc" style="margin-bottom: 2mm;">2.1.1 The following fire-extinguishing systems, other systems and equipment containing ozone-depleting substances, other than Hydro-chlorofluorocarbons (HCFCs), installed before 19 May 2005 may continue in service:</p>
                    <table class="data-table" style="margin-bottom: 4mm;">
                        <thead>
                            <tr>
                                <th>System or equipment</th>
                                <th>Location on board</th>
                                <th>Substance</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td>&nbsp;</td><td></td><td></td></tr>
                        </tbody>
                    </table>

                    <p class="cert-desc" style="margin-bottom: 2mm;">2.1.2 The following systems containing hydro-chlorofluorocarbons (HCFCs) installed before 1 January 2020 may continue in service:</p>
                    <table class="data-table" style="margin-bottom: 6mm;">
                        <thead>
                            <tr>
                                <th>System or equipment</th>
                                <th>Location on board</th>
                                <th>Substance</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td>&nbsp;</td><td></td><td></td></tr>
                        </tbody>
                    </table>

                    <p class="cert-desc" style="margin-bottom: 2mm;"><strong>2.2 Nitrogen oxides (NOx) (regulation 13)</strong></p>
                    <p class="cert-desc" style="margin-bottom: 2mm;">2.2.1 The following marine diesel engines installed on this ship are in accordance with the requirements of regulation 13, as indicated:</p>
                    <table class="data-table" style="margin-bottom: 6mm;">
                        <thead>
                            <tr>
                                <th>(AM= Approved Method)</th>
                                <th>Engine #1</th>
                                <th>Engine #2</th>
                                <th>Engine #3</th>
                                <th>Engine #4</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><th>1 Manufacturer and model</th><td></td><td></td><td></td><td></td></tr>
                            <tr><th>2 Serial number</th><td></td><td></td><td></td><td></td></tr>
                            <tr><th>3 Use (applicable application cycle(s) - NTC 3.2)</th><td></td><td></td><td></td><td></td></tr>
                            <tr><th>4 Power output (kW) (NTC 1.3.11)</th><td></td><td></td><td></td><td></td></tr>
                            <tr><th>5 Rated speed (RPM) (NTC 1.3.12)</th><td></td><td></td><td></td><td></td></tr>
                            <tr><th>6 Identical engine installed ≥ 1/1/2000 exempted by 13.1.1.2</th><td></td><td></td><td></td><td></td></tr>
                            <tr><th>7 Identical engine installation date (dd/mm/yyyy) as per 13.1.1.2</th><td></td><td></td><td></td><td></td></tr>
                            <tr><th>8 Major Conversion</th><td></td><td></td><td></td><td></td></tr>
                            <tr><th>9 Tier I</th><td></td><td></td><td></td><td></td></tr>
                            <tr><th>10 Tier II</th><td></td><td></td><td></td><td></td></tr>
                            <tr><th>11 Tier III</th><td></td><td></td><td></td><td></td></tr>
                            <tr><th>12 AM* / Installed</th><td></td><td></td><td></td><td></td></tr>
                        </tbody>
                    </table>

                    <div style="page-break-before: always;"></div>

                    <p class="cert-desc" style="margin-bottom: 2mm;"><strong>2.3 Sulphur oxides (SOx) and particulate matter (regulation 14)</strong></p>
                    <table class="data-table" style="margin-bottom: 4mm;">
                        <tbody>
                            <tr>
                                <th style="width: 80%;">2.3.1 When the ship operates outside of an Emission Control Area specified in regulation 14.3, the ship uses:</th>
                                <td></td>
                            </tr>
                            <tr>
                                <td>.1 fuel oil with a sulphur content as documented by bunker delivery notes that does not exceed the limit value of 0.50% m/m</td>
                                <td></td>
                            </tr>
                            <tr>
                                <td>.2 an equivalent arrangement approved in accordance with regulation 4.1 as listed in 2.6 that is at least as effective in terms of SOx emission reductions as compared to using a fuel oil with a sulphur content limit value of 0.50% m/m</td>
                                <td></td>
                            </tr>
                            <tr>
                                <th>2.3.2 When the ship operates inside an emission Control Area specified in regulation 14.3, the ship uses:</th>
                                <td></td>
                            </tr>
                            <tr>
                                <td>.1 fuel oil with a sulphur content as documented by bunker delivery notes that does not exceed the limit value of 0.10% m/m</td>
                                <td></td>
                            </tr>
                            <tr>
                                <td>.2 an equivalent arrangement approved in accordance with regulation 4.1 as listed in 2.6 that is at least as effective in terms of SOx emission reductions as compared to using a fuel oil with a sulphur content limit value of 0.10% m/m</td>
                                <td></td>
                            </tr>
                            <tr>
                                <th>2.3.3 For ship without an equivalent arrangement approved in accordance with regulation 4.1 as listed in paragraph 2.6 the sulphur content of fuel oil carried for use on board the ship shall not exceed 0.5% m/m as documented by bunker delivery notes.</th>
                                <td></td>
                            </tr>
                            <tr>
                                <th>2.3.4 The ship is fitted with designated sampling point(s) in accordance with regulation 14.10 or 14.11</th>
                                <td></td>
                            </tr>
                            <tr>
                                <th>2.3.5 In accordance with regulation 14.12, the requirement for fitting or designating sampling point(s) in fuel for accordance with regulation 14.10 or 14.11 is not applicable for a fuel oil service system for a low-flashpoint combustion purposes for propulsion or operation on board the ship</th>
                                <td></td>
                            </tr>
                        </tbody>
                    </table>

                    <p class="cert-desc" style="margin-bottom: 2mm;"><strong>2.4 Volatile organic compounds (VOCs) (regulation 15)</strong></p>
                    <table class="data-table" style="margin-bottom: 4mm;">
                        <tbody>
                            <tr>
                                <th style="width: 80%;">2.4.1. The tanker has a vapour collection system installed and approved in accordance with MSC/Circ.585</th>
                                <td></td>
                            </tr>
                            <tr>
                                <th>2.4.2.1 For a tanker carrying crude oil, there is an approved VOC management plan</th>
                                <td></td>
                            </tr>
                            <tr>
                                <th>2.4.2.2 VOC management plan approval reference:</th>
                                <td></td>
                            </tr>
                        </tbody>
                    </table>

                    <p class="cert-desc" style="margin-bottom: 2mm;"><strong>2.5 Shipboard incineration (regulation 16)</strong></p>
                    <table class="data-table" style="margin-bottom: 4mm;">
                        <tbody>
                            <tr>
                                <th colspan="2">The ship has an incinerator:</th>
                            </tr>
                            <tr>
                                <th style="width: 80%;">.1 installed on or after 1 January 2000 which complies with:</th>
                                <td></td>
                            </tr>
                            <tr>
                                <td>resolution MEPC.76(40), as amended</td>
                                <td></td>
                            </tr>
                            <tr>
                                <td>resolution MEPC.244(66)</td>
                                <td></td>
                            </tr>
                            <tr>
                                <th>.2 Installed before 1 January 2000 that complies with:</th>
                                <td></td>
                            </tr>
                            <tr>
                                <td>resolution MEPC.59(33), as amended</td>
                                <td></td>
                            </tr>
                            <tr>
                                <td>resolution MEPC.76(40)</td>
                                <td></td>
                            </tr>
                        </tbody>
                    </table>

                    <p class="cert-desc" style="margin-bottom: 2mm;"><strong>2.6 Equivalents (regulation 4)</strong></p>
                    <p class="cert-desc" style="margin-bottom: 2mm;">The ship has been allowed to use the following fitting, material, appliance or apparatus to be fitted in a ship or other procedures, alternative fuel oils, or compliance methods used as an alternative to that required by this Annex:</p>
                    <table class="data-table" style="margin-bottom: 6mm;">
                        <thead>
                            <tr>
                                <th>System or equipment</th>
                                <th>Equivalent used</th>
                                <th>Approval reference</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td>&nbsp;</td><td></td><td></td></tr>
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
    print("Updated GRClass_IAPP_R_SoC_Supplement.html")
else:
    print("Could not find markers.")
