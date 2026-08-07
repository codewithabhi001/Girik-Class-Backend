import os

file_path = r"a:\Girik workspace\grclass-backend\ONLY CERTIFICATES\Ship Oil Pollution Emergency Plan\html\GRClass_SOPEP_R_Approved_Plan.html"

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
                                    <th>Report No.:</th>
                                    <td></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div class="sec-label" style="text-align: center; margin-bottom: 2mm;">CHECKLIST FOR SOPEP APPROVAL (MARPOL 73/78)</div>
                    <p class="cert-desc" style="text-align: center; font-style: italic; margin-bottom: 6mm;">
                        To meet the requirements of the International Convention for the Prevention of Pollution from Ships, 1973 as modified by the Protocol of 1978.
                    </p>

                    <div style="display: flex; justify-content: space-around; margin-bottom: 4mm;">
                        <label><input type="checkbox" disabled> Initial approval</label>
                        <label><input type="checkbox" disabled> Amendments</label>
                    </div>

                    <table class="data-table" style="margin-bottom: 6mm;">
                        <tbody>
                            <tr><th style="width: 25%;">Ship's Name</th><td style="width: 25%;">{vessel_name}</td><th style="width: 25%;">IMO No.</th><td style="width: 25%;">{imo_number}</td></tr>
                            <tr><th>SOPEP Prepared by:</th><td></td><th>Company Name</th><td></td></tr>
                            <tr><th>Call Sign</th><td>{call_sign}</td><th>Date Keel Laid</th><td></td></tr>
                            <tr><th>Patent No.</th><td></td><th>Operation Manager</th><td></td></tr>
                            <tr><th>Gross Tonnage</th><td>{gross_tonnage}</td><th>DPA Name</th><td></td></tr>
                            <tr><th>Type Of Ship</th><td></td><th>Address:</th><td></td></tr>
                            <tr><th>E-mail:</th><td></td><th>Telephone:</th><td></td></tr>
                            <tr><th>Fax:</th><td></td><td colspan="2"></td></tr>
                        </tbody>
                    </table>

                    <table class="data-table" style="margin-bottom: 6mm;">
                        <thead>
                            <tr>
                                <th style="width: 15%;">MARPOL 73/78 REFERENCES</th>
                                <th style="width: 55%;">PREVENTION OF POLLUTION ARISING FROM AN OIL POLLUTION INCIDENT</th>
                                <th style="width: 5%;">YES</th>
                                <th style="width: 5%;">NO</th>
                                <th style="width: 5%;">N/A</th>
                                <th style="width: 15%;">SOPEP Pages and references (required)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><th>REG 37(2)</th><td>The procedure to be followed by the master or other persons having charge of the ship to report an oil pollution incident.</td><td></td><td></td><td></td><td></td></tr>
                            <tr><th>REG 37(2)</th><td>The list of authorities or persons to be contacted in the event of an oil pollution incident.</td><td></td><td></td><td></td><td></td></tr>
                            <tr><th>REG 37(2)</th><td>A detailed description of the action to be taken immediately by persons on board to reduce or control the discharge of oil following the incident.</td><td></td><td></td><td></td><td></td></tr>
                            <tr><th>REG 37(2)</th><td>The procedure and point of contact on the ship for coordinating shipboard activities with national and local authorities in combating the pollution</td><td></td><td></td><td></td><td></td></tr>
                            <tr><th>MEPC 54(32)</th><td>The Plan should include as an appendix the list of agencies or officials of administrations responsible for receiving and processing reports as developed and updated by the Organization.</td><td></td><td></td><td></td><td></td></tr>
                            
                            <tr>
                                <th>MARPOL 73/78 REFERENCES</th>
                                <th>STEPS TO CONTROL DISCHARGE</th>
                                <th>YES</th><th>NO</th><th>N/A</th><th></th>
                            </tr>
                            <tr><th>MEPC 54(32)</th><td>Procedure for dealing with tank overflows should be included.</td><td></td><td></td><td></td><td></td></tr>
                            <tr><th>MEPC 54(32)</th><td>The plan should outline the procedures for removal of oil spilled and contained on deck.</td><td></td><td></td><td></td><td></td></tr>
                            <tr><th>MEPC 54(32)</th><td>The plan should provide guidance for responding to spillage due to suspected hull leakage</td><td></td><td></td><td></td><td></td></tr>
                            <tr><th>MEPC 54(32)</th><td>The Plan should provide specific guidance for dealing with pipe leakage.</td><td></td><td></td><td></td><td></td></tr>
                            <tr><th>MEPC 54(32)</th><td>The plan should provide a list of information required for making damage stability and damage longitudinal strength assessments.</td><td></td><td></td><td></td><td></td></tr>
                            <tr><th>MEPC 54(32)</th><td>The plan should to be followed for ship-to-ship transfer of cargo</td><td></td><td></td><td></td><td></td></tr>
                            <tr><th>MEPC 54(32)</th><td>The Plan should show where current cargo, bunker and ballast information, including quantities and specifications are available.</td><td></td><td></td><td></td><td></td></tr>

                            <tr>
                                <th>MEPC 54(32)</th>
                                <th>ACTUAL DISCHARGE</th>
                                <th>YES</th><th>NO</th><th>N/A</th><th></th>
                            </tr>
                            <tr><th>MEPC 54(32)</th><td>Discharge of oil, resulting from damage to the ship or its equipment, or for the purpose of securing the safety of a ship or saving life at sea</td><td></td><td></td><td></td><td></td></tr>
                            <tr><th>MEPC 54(32)</th><td>A discharge during the operation of the ship of oil in excess of the quantity or instantaneous rate permitted under the present Convention</td><td></td><td></td><td></td><td></td></tr>

                            <tr>
                                <th>MEPC 54(32)</th>
                                <th>PROBABLE DISCHARGE</th>
                                <th>YES</th><th>NO</th><th>N/A</th><th></th>
                            </tr>
                            <tr><th>MEPC 54(32)</th><td>The nature of the damage, failure or breakdown of the ship, machinery or equipment;</td><td></td><td></td><td></td><td></td></tr>
                            <tr><th>MEPC 54(32)</th><td>Ship location and proximity to land or other navigational hazards.</td><td></td><td></td><td></td><td></td></tr>
                            <tr><th>MEPC 54(32)</th><td>Weather, tide, current and sea state</td><td></td><td></td><td></td><td></td></tr>
                            <tr><th>MEPC 54(32)</th><td>Traffic density</td><td></td><td></td><td></td><td></td></tr>

                            <tr>
                                <th>MEPC 54(32)</th>
                                <th>PORTS CONTACT</th>
                                <th>YES</th><th>NO</th><th>N/A</th><th></th>
                            </tr>
                            <tr><th>MEPC 54(32)</th><td>The plan should require the master to obtain details concerning local reporting procedures upon arriving in port.</td><td></td><td></td><td></td><td></td></tr>

                            <tr>
                                <th>MEPC 54(32)</th>
                                <th>PRIORITY ACTIONS</th>
                                <th>YES</th><th>NO</th><th>N/A</th><th></th>
                            </tr>
                            <tr><th>MEPC 54(32)</th><td>The plan should provide ship-specific guidance to the master concerning these topics.</td><td></td><td></td><td></td><td></td></tr>
                            <tr><th>MEPC 54(32)</th><td>The master priority will be to ensure the safety of personnel and the ship and to take action to prevent escalation of the incident</td><td></td><td></td><td></td><td></td></tr>
                            <tr><th>MEPC 54(32)</th><td>The master will need to obtain detailed information on the damage sustained by his ship.</td><td></td><td></td><td></td><td></td></tr>
                            <tr><th>MEPC 54(32)</th><td>The master will be in a position to decide what action should be taken to prevent or minimize further spillage</td><td></td><td></td><td></td><td></td></tr>
                            
                            <tr>
                                <th>MEPC 54(32)</th>
                                <th>STABILITY AND STRESS CONSIDERATIONS</th>
                                <th>YES</th><th>NO</th><th>N/A</th><th></th>
                            </tr>
                            <tr><th>MEPC 54(32)</th><td>Plan should provide a list of information required for making damage stability and damaged longitudinal strength assessment.</td><td></td><td></td><td></td><td></td></tr>

                            <tr>
                                <th>MEPC 54(32)</th>
                                <th>RESPONSE EQUIPMENT</th>
                                <th>YES</th><th>NO</th><th>N/A</th><th></th>
                            </tr>
                            <tr><th>MEPC 54(32)</th><td>The plan should indicate an inventory of such equipment, if carried</td><td></td><td></td><td></td><td></td></tr>
                            <tr><th>MEPC 54(32)</th><td>The plan should establish personnel responsibilities for its deployment, oversight, and maintenance</td><td></td><td></td><td></td><td></td></tr>
                            <tr><th>MEPC 54(32)</th><td>The plan should include pollution policy</td><td></td><td></td><td></td><td></td></tr>

                            <tr>
                                <th>MEPC 54(32)</th>
                                <th>INITIATING THE CLEAN - UP RESPONSE</th>
                                <th>YES</th><th>NO</th><th>N/A</th><th></th>
                            </tr>
                            <tr><th>MEPC 54(32)</th><td>In case of small operational spill, the ship should take whatever actions are necessary to prevent the oil escaping over side</td><td></td><td></td><td></td><td></td></tr>
                            <tr><th>MEPC 54(32)</th><td>In case of large operational spill, the ship is even more restricted as to what action it can take to respond practically to the spill</td><td></td><td></td><td></td><td></td></tr>

                            <tr>
                                <th>MEPC 54(32)</th>
                                <th>DOCUMENT REVIEW, CONTROL & RECORDS</th>
                                <th>YES</th><th>NO</th><th>N/A</th><th></th>
                            </tr>
                            <tr><th>MEPC 54(32)</th><td>Master must verify contact information given in this manual during drills</td><td></td><td></td><td></td><td></td></tr>
                            <tr><th>MEPC 54(32)</th><td>This plan should be reviewed by DPA, barge master of the fleet and officers annually</td><td></td><td></td><td></td><td></td></tr>
                        </tbody>
                    </table>

                    <div class="sec-label">REMARKS</div>
                    <div style="width: 100%; height: 100px; border: 1px solid #ccc; margin-bottom: 6mm;"></div>
                    
                    <div class="sec-label">RECOMMENDATIONS</div>
                    <div style="width: 100%; height: 100px; border: 1px solid #ccc; margin-bottom: 6mm;"></div>

                    <table class="data-table" style="margin-bottom: 8mm; width: auto; min-width: 300px;">
                        <tbody>
                            <tr>
                                <th>Issued at</th>
                                <td>{place_of_issue}</td>
                                <th>Date of issue</th>
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
    print("Updated GRClass_SOPEP_R_Approved_Plan.html")
else:
    print("Could not find markers.")
