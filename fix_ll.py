import os

file_path = r"a:\Girik workspace\grclass-backend\ONLY CERTIFICATES\International Load Line Certificate\html\GRClass_LL_RA_Conditions_C11.html"

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
                                    <th>Record No.:</th>
                                    <td>-LL-</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div class="sec-label" style="text-align: center; margin-bottom: 2mm;">RECORD OF CONDITIONS OF ASSIGNMENT</div>
                    <p class="cert-desc" style="text-align: center; font-style: italic; margin-bottom: 6mm;">
                        Under the Provisions of the International Convention on Load Lines, 1966.
                    </p>

                    <table class="data-table" style="margin-bottom: 6mm;">
                        <tbody>
                            <tr><th style="width: 50%;">Name of Ship</th><td>{vessel_name}</td></tr>
                            <tr><th>Port of Registry</th><td>{port_of_registry}</td></tr>
                            <tr><th>Nationality</th><td></td></tr>
                            <tr><th>Distinctive Number or Letters</th><td>{call_sign}</td></tr>
                            <tr><th>Shipbuilders</th><td></td></tr>
                            <tr><th>Yard Number</th><td></td></tr>
                            <tr><th>Date of Construction / Conversion(1)</th><td>{date_of_build}</td></tr>
                            <tr><th>Freeboard assigned as a ship of Type</th><td></td></tr>
                            <tr><th>Classification society</th><td>GR CLASS</td></tr>
                            <tr><th>Date and Place of initial survey</th><td></td></tr>
                        </tbody>
                    </table>
                    <p class="cert-desc" style="margin-bottom: 4mm;">(1) Delete as Appropriate</p>

                    <div class="sec-label">1. SKETCH OF THE SHIP</div>
                    <p class="cert-desc" style="margin-bottom: 2mm;">
                        A plan of suitable size may be attached to this Report in preference to sketches on this page.
                        Disposition and dimensions of superstructures, trunks, deckhouses, machinery casings; extend of bulwarks, guard rails and wood sheathing on exposed deck, to be inserted in the diagrams and tables following; together with positions of hatchways, gangways, and other means for the protection of the crew; cargo ports, bow and stern doors, sidescuttles, scuppers, ventilators, air pipes, companionways, and other items that would affect the seaworthiness of the ship.
                    </p>
                    <div style="width: 100%; height: 150px; border: 1px dashed #ccc; display: flex; align-items: center; justify-content: center; margin-bottom: 6mm;">
                        <span style="color: #999;">[ SKETCH AREA ]</span>
                    </div>

                    <div class="sec-label">2. DOORWAYS IN SUPERESTRUCTURES, EXPOSED MACHINERY CASINGS AND DECKHOUSES PROTECTING OPENINGS IF FREEBOARD AND SUPERESTRUCTURE DECKS (Regs. 12, 17 & 18)</div>
                    <table class="data-table" style="margin-bottom: 6mm;">
                        <thead>
                            <tr>
                                <th>POSITION</th>
                                <th>Ref. No. on Sketch or PLAN</th>
                                <th>Number and Size of openings</th>
                                <th>Height of Sills</th>
                                <th>Closing Appliances (Type and Material)</th>
                                <th>Closing Appliances (Number of Clips)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><th>In Forecastle bulkhead</th><td></td><td></td><td></td><td></td><td></td></tr>
                            <tr><th>In bridge forward bulkhead</th><td></td><td></td><td></td><td></td><td></td></tr>
                            <tr><th>In bridge after bulkhead</th><td></td><td></td><td></td><td></td><td></td></tr>
                            <tr><th>In raised quarter deck bulkhead</th><td></td><td></td><td></td><td></td><td></td></tr>
                            <tr><th>In poop bulkhead</th><td></td><td></td><td></td><td></td><td></td></tr>
                            <tr><th>In exposed machinery casing on freeboard or raised quarter decks</th><td></td><td></td><td></td><td></td><td></td></tr>
                            <tr><th>In exposed machinery casing on superstructure decks</th><td></td><td></td><td></td><td></td><td></td></tr>
                            <tr><th>In machinery casings within superstructure or deckhouse on freeboard deck</th><td></td><td></td><td></td><td></td><td></td></tr>
                            <tr><th>In deckhouse in Position 1 enclosing openings leading below freeboard deck</th><td></td><td></td><td></td><td></td><td></td></tr>
                            <tr><th>In deckhouse in Position 2 enclosing openings leading within enclosed superstructures or below freeboard deck</th><td></td><td></td><td></td><td></td><td></td></tr>
                            <tr><th>In exposed pump-room casings</th><td></td><td></td><td></td><td></td><td></td></tr>
                        </tbody>
                    </table>

                    <div style="page-break-before: always;"></div>

                    <div class="sec-label">3. HATCHWAYS AT POSITIONS 1 AND 2 CLOSED BY PORTABLE COVERS AND SECURED WEATHERTIGHT BY TARPAULINS AND BATTENING DEVICE (Reg. 15)</div>
                    <table class="data-table" style="margin-bottom: 6mm;">
                        <thead>
                            <tr>
                                <th>Position and ref No.</th>
                                <th>Dimensions of clear opening</th>
                                <th>Height of coamings</th>
                                <th>PORTABLE COVERS (Material, Thickness, Direction)</th>
                                <th>TARPAULINS (No. of layers, Material)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td>&nbsp;</td><td></td><td></td><td></td><td></td></tr>
                        </tbody>
                    </table>

                    <div class="sec-label">4. HATCHWAYS AT POSITIONS 1 AND 2 CLOSED BY WEATHERTIGHT COVERS OF STEEL (OR OTHER EQUIPMENT MATERIAL) FITTED WITH GASKETS AND CLAMPING DEVICES (Reg. 16)</div>
                    <table class="data-table" style="margin-bottom: 6mm;">
                        <thead>
                            <tr>
                                <th>Position and ref No.</th>
                                <th>Dimensions of clear opening</th>
                                <th>Height of coamings</th>
                                <th>Type of covers or patent name</th>
                                <th>Material</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td>&nbsp;</td><td></td><td></td><td></td><td></td></tr>
                        </tbody>
                    </table>

                    <div class="sec-label">5. MACHINERY SPACE OPENINGS AND MISCELLANEOUS, OPENINGS IN FREEBOARD AND SUPERSTRUCTURE DECKS (REG. 17 & 18)</div>
                    <table class="data-table" style="margin-bottom: 6mm;">
                        <thead>
                            <tr>
                                <th>POSITION AND REF NUMBER</th>
                                <th>DIMENSIONS</th>
                                <th>HEIGHT OF COAMING</th>
                                <th>COVER (Material, How attached)</th>
                                <th>NUMBER AND SPACING OF TOGGLES</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td>&nbsp;</td><td></td><td></td><td></td><td></td></tr>
                        </tbody>
                    </table>

                    <div class="sec-label">6. VENTILATORS ON FREEBOARD AND SUPERSTRUCTURE DECKS (POSITION 1 AND 2) (REG.19)</div>
                    <table class="data-table" style="margin-bottom: 6mm;">
                        <thead>
                            <tr>
                                <th>DECK ON WHICH FITTED</th>
                                <th>NUMBER FITTED</th>
                                <th>COAMING (Dimensions, Height)</th>
                                <th>TYPE (STATE PATENT NAME, IF ANY)</th>
                                <th>CLOSING APPLIANCES</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td>&nbsp;</td><td></td><td></td><td></td><td></td></tr>
                        </tbody>
                    </table>

                    <div class="sec-label">7. AIR PIPES ON FREEBOARD AND SUPERSTRUCTURE DECKS (Reg. 20)</div>
                    <table class="data-table" style="margin-bottom: 6mm;">
                        <thead>
                            <tr>
                                <th>Deck on which fitted</th>
                                <th>Number fitted</th>
                                <th>Coaming (Dimensions, Height)</th>
                                <th>Type (state patent name, if any)</th>
                                <th>Closings Appliances</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td>&nbsp;</td><td></td><td></td><td></td><td></td></tr>
                        </tbody>
                    </table>

                    <div class="sec-label">8. CARGO PORT AND OTHER SIMILAR OPENINGS (Reg. 21)</div>
                    <table class="data-table" style="margin-bottom: 6mm;">
                        <thead>
                            <tr>
                                <th>Position of port</th>
                                <th>dimensions of opening</th>
                                <th>distance of lower edge from freeboard deck</th>
                                <th>Securing devices</th>
                                <th>REMARKS</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td>&nbsp;</td><td></td><td></td><td></td><td></td></tr>
                        </tbody>
                    </table>

                    <div class="sec-label">9. SCUPPERS, INLETS AND DISCHARGES (REG.22)</div>
                    <table class="data-table" style="margin-bottom: 6mm;">
                        <thead>
                            <tr>
                                <th>STATE IF SCUPPER, OR DISCHARGE</th>
                                <th>PIPE (Diameter, Thickness, Material)</th>
                                <th>FROM</th>
                                <th>VERTICAL DISTANCE ABOVE TOP OF KEEL</th>
                                <th>NUMBER, TYPE AND MATERIAL OF DISCHARGE VALVES</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td>&nbsp;</td><td></td><td></td><td></td><td></td></tr>
                        </tbody>
                    </table>
                    
                    <div style="page-break-before: always;"></div>

                    <div class="sec-label">10. SIDE SCUTTLES (Reg. 23)</div>
                    <table class="data-table" style="margin-bottom: 6mm;">
                        <thead>
                            <tr>
                                <th>POSITION</th>
                                <th>NUMBER FITTED</th>
                                <th>CLEAR GLASS SIZE</th>
                                <th>FIXED OR OPENING</th>
                                <th>MATERIAL (Frame, Deadlight)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td>&nbsp;</td><td></td><td></td><td></td><td></td></tr>
                        </tbody>
                    </table>

                    <div class="sec-label">11. FREEING PORTS (Reg. 24)</div>
                    <table class="data-table" style="margin-bottom: 6mm;">
                        <thead>
                            <tr>
                                <th>Location</th>
                                <th>Length of bulwark</th>
                                <th>Height of bulwark</th>
                                <th>Number and size freeing ports each side</th>
                                <th>Total area each side</th>
                                <th>Required area</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><th>Freeboard deck after well</th><td></td><td></td><td></td><td></td><td></td></tr>
                            <tr><th>Forward well</th><td></td><td></td><td></td><td></td><td></td></tr>
                            <tr><th>Superstructure deck</th><td></td><td></td><td></td><td></td><td></td></tr>
                        </tbody>
                    </table>

                    <div class="sec-label">12. Protection of the crew (Reg.25 and 26)</div>
                    <table class="data-table" style="margin-bottom: 6mm;">
                        <tbody>
                            <tr>
                                <th style="width: 50%;">State particulars of bulwarks or guard rails on freeboard and superstructure decks:</th>
                                <td></td>
                            </tr>
                            <tr>
                                <th>State details of lifelines, walkways, gangways or underdeck passage ways where required to be fitted:</th>
                                <td></td>
                            </tr>
                        </tbody>
                    </table>

                    <div class="sec-label">13. TIMBER DECK CARGO FITTINGS (REG.44)</div>
                    <table class="data-table" style="margin-bottom: 6mm;">
                        <tbody>
                            <tr>
                                <th style="width: 50%;">State particulars of uprights, sockets, lashings, guard rails and lifelines:</th>
                                <td></td>
                            </tr>
                            <tr>
                                <th>Other special features:</th>
                                <td></td>
                            </tr>
                        </tbody>
                    </table>

                    <p class="cert-desc" style="margin-bottom: 6mm; font-weight: bold; text-align: justify;">
                        The conditions of assignment shown on this form are a record of the arrangements and fittings provided on the ship and are in accordance with the requirements of the relevant regulations of the International Convention on Load Lines, 1966.
                    </p>

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
                            <p class="cert-desc" style="margin-bottom: 2mm;">Signature of duly authorized official issuing the survey report</p>
                            <div style="border-bottom: 1px solid #000; height: 30px; margin-bottom: 5px;"></div>
                            <div style="font-weight: bold;">Name:</div>
                            <div style="font-weight: bold; margin-top: 2px;">GR CLASS - CLASSIFIED FOR STANDARD</div>
                        </div>
                    </div>
"""
    new_content = content[:start_idx + len(start_marker)] + "\n" + new_body + "\n" + content[end_idx:]
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Updated GRClass_LL_RA_Conditions_C11.html")
else:
    print("Could not find markers.")
