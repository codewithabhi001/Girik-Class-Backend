const fs = require('fs');

const ibwmcFile = '/Users/abhinavvishwakarma/Desktop/Gr-class-Workshop/Gr-Class-Backend/ONLY CERTIFICATES/International Ballast Water Management Certificate/html/GRClass_IBWMC_ST_Certificate.html';
const targetFile = '/Users/abhinavvishwakarma/Desktop/Gr-class-Workshop/Gr-Class-Backend/ONLY CERTIFICATES/BALLAST WATER MANAGEMENT CERTIFICATE/html/GRClass_BWM_ST_Certificate.html';

const ibwmcContent = fs.readFileSync(ibwmcFile, 'utf8');

const styleStart = ibwmcContent.indexOf('<style>');
const styleEnd = ibwmcContent.indexOf('</style>') + 8;
const styleContent = ibwmcContent.substring(styleStart, styleEnd);

const newContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>GR Class – BWM-ST Certificate</title>
    
    ${styleContent}

</head>
<body>

    <div class="no-print">
        <div>
            <button class="btn-print" onclick="window.print()">🖨 Print / Save PDF</button>
            <span class="tag-hint">Note: Replace {tags} with actual backend data before printing.</span>
        </div>
    </div>

    <div class="cert-page">
        <div class="border-outer">
            <div class="border-inner">
                
                <div class="watermark">GR CLASS</div>

                <div class="cert-header">
                    <div class="hdr-left">
                        <img src="https://grclass.com/grclass-logo.webp" alt="GR Class Logo" onerror="this.style.display='none'; document.getElementById('logo-fb1').style.display='flex';">
                        <div class="logo-fallback" id="logo-fb1" style="display:none;"><span>GR</span></div>
                    </div>
                    <div class="hdr-center">
                        <div class="hdr-flag">STATEMENT OF COMPLIANCE</div>
                        <div class="hdr-title-en">SHORT-TERM INTERNATIONAL BALLAST WATER MANAGEMENT CERTIFICATE</div>
                        <div class="hdr-convention">Issued under the provisions of the International Convention for the Control and Management of Ships Ballast Water and Sediments (hereinafter referred to as “the Convention”)</div>
                    </div>
                    <div class="hdr-right">
                        <span class="hdr-meta-label">SOC-BWMC No.</span>
                        <span class="hdr-meta-no">{certificate_number}</span>
                        <div class="hdr-meta-form">Form SOC-BWM-ST · Approved by: GM</div>
                    </div>
                </div>

                <div class="authority">
                    As per request of: <strong>THE OWNER</strong><br>
                    By <strong>GR CLASS CLASSIFIED FOR STANDARD (GR CLASS)</strong>
                </div>

                <div class="body" style="flex: 1; display: flex; flex-direction: column;">
                    <div class="sec-label">Vessel Particulars</div>
                    <table class="vtable">
                      <tr>
                        <th>Name of Ship</th>
                        <th>Distinctive No. / Letters</th>
                        <th>Port of Registry</th>
                        <th>Gross Tonnage</th>
                        <th>Ballast Water Capacity (m³)</th>
                      </tr>
                      <tr>
                        <td><span class="val">{vessel_name}</span></td>
                        <td><span class="val">{call_sign}</span></td>
                        <td><span class="val">{port_of_registry}</span></td>
                        <td><span class="val">{gross_tonnage}</span></td>
                        <td><span class="val">{ballast_water_capacity}</span></td>
                      </tr>
                      <tr>
                        <th>IMO Number <sup>1</sup></th>
                        <th colspan="4">Date of Construction</th>
                      </tr>
                      <tr>
                        <td><span class="val">{imo_number}</span></td>
                        <td colspan="4"><span class="val">{year_built}</span></td>
                      </tr>
                    </table>

                    <div class="sec-label">Details of Ballast Water Management Method(s) Used</div>
                    <table class="mtable">
                      <tr>
                        <th>Method of Ballast Water Management used</th>
                        <th>Date installed (if applicable)</th>
                        <th>Name of manufacturer (if applicable)</th>
                      </tr>
                      <tr>
                        <td><span class="m-val">{bwm_method}</span></td>
                        <td><span class="m-val">{bwm_date_installed}</span></td>
                        <td><span class="m-val">{bwm_manufacturer}</span></td>
                      </tr>
                    </table>

                    <div class="sec-label">The principal Ballast Water Management method(s) employed on this ship is/are:</div>
                    <div class="chk-list">
                      <div class="chk-item {bwm_reg_d1_check}"><div class="checkbox"></div><div class="chk-text">In accordance with regulation D-1</div></div>
                      <div class="chk-item {bwm_reg_d2_check}"><div class="checkbox"></div><div class="chk-text">In accordance with regulation D-2 (describe): {bwm_reg_d2_desc}</div></div>
                      <div class="chk-item {bwm_reg_d4_check}"><div class="checkbox"></div><div class="chk-text">The ship is subject to regulation D-4</div></div>
                    </div>

                    <div class="sec-label">Certification</div>
                    <div class="certify">
                      <div class="certify-title">THIS IS TO CERTIFY:</div>
                      <ol>
                        <li>That the ship has been surveyed in accordance with the requirements of regulation E-1 of Annex to the Convention; and</li>
                        <li>That the survey shows that Ballast Water Management on the ship complies with the Annex to the Convention.</li>
                      </ol>
                    </div>

                    <div class="sec-label">Dates &amp; Validity</div>
                    <div class="vgrid">
                      <div class="vcell">
                        <span class="vc-label">Survey Completion Date</span>
                        <div class="vc-val">{survey_completion_date}</div>
                      </div>
                      <div class="vcell">
                        <span class="vc-label">Date of Issue</span>
                        <div class="vc-val">{issue_date}</div>
                      </div>
                      <div class="vcell hi">
                        <span class="vc-label">Valid Until <sup>2</sup></span>
                        <div class="vc-val">{expiry_date}</div>
                      </div>
                    </div>
                    <div class="vgrid-2">
                      <div class="vcell">
                        <span class="vc-label">Place of Issue</span>
                        <div class="vc-val">{place_of_survey}</div>
                      </div>
                      <div class="vcell">
                        <span class="vc-label">Page</span>
                        <div class="vc-val">1 of 1</div>
                      </div>
                    </div>

                    <div class="footnotes">
                      <p><sup>1</sup> IMO Ship Identification Number Scheme adopted by the Organization by Resolution A. 600 (15).</p>
                      <p><sup>2</sup> Insert the date of expiry as specified by the Administration in accordance with Regulation I/14 (a) of the Convention. The day and the month of this date correspond to the anniversary date as defined in Regulation I/2(n) of the Convention, unless amended in accordance with Regulation I/14(h).</p>
                    </div>
                </div>

                {remarks}
                <div class="gen-notice">
                    <svg width="10" height="11" viewBox="0 0 12 14" fill="none" xmlns="http://www.w3.org/2000/svg" style="opacity: 0.6; flex-shrink: 0; margin-right: 2px; vertical-align: middle;">
                        <path d="M10.5 5H9.5V3.5C9.5 1.57 7.93 0 6 0C4.07 0 2.5 1.57 2.5 3.5V5H1.5C0.67 5 0 5.67 0 6.5V12.5C0 13.33 0.67 14 1.5 14H10.5C11.33 14 12 13.33 12 12.5V6.5C12 5.67 11.33 5 10.5 5ZM3.8 3.5C3.8 2.29 4.79 1.3 6 1.3C7.21 1.3 8.2 2.29 8.2 3.5V5H3.8V3.5ZM6.75 9.85V11.5H5.25V9.85C4.8 9.57 4.5 9.07 4.5 8.5C4.5 7.67 5.17 7 6 7C6.83 7 7.5 7.67 7.5 8.5C7.5 9.07 7.2 9.57 6.75 9.85Z" fill="#1b365d"/>
                    </svg>
                    <span class="gen-notice-text">
                        Computer-generated certificate — does not require a physical signature.&nbsp;&nbsp;·&nbsp;&nbsp;
                        Verify at <strong>grclass.com</strong>
                    </span>
                </div>

                <div class="footer-area">
                    <div class="stamp-container">
                        <div class="diamond-stamp"></div>
                        <div class="stamp-text-wrapper">
                            <div class="st-top">ISSUING AUTHORITY</div>
                            <div class="st-mid">APPROVED</div>
                            <div class="st-bot">GR CLASS</div>
                        </div>
                    </div>

                    <div class="signature-area">
                        <div class="sig-line">
                            <img src="{signature}" onerror="this.src='../../../src/modules/payments/Gr-class-sign.png'; this.onerror=function(){ this.src='./src/modules/payments/Gr-class-sign.png'; this.onerror=function(){ this.style.display='none'; } };" alt="Signature" style="max-height: 28px; position: absolute; bottom: 1px; left: 50%; transform: translateX(-50%);">
                        </div>
                        <div class="sig-name">GR CLASS Representative</div>
                        <div class="sig-title">GR CLASS</div>
                    </div>

                    <div class="qr-section">
                        <div>
                            <strong>GR CLASS</strong>
                            Classified for Standard
                        </div>
                        <div class="qr-box">
                            {qr_code}
                        </div>
                    </div>
                </div>

            </div>
            <div class="page-indicator">
                <span>SOC-BWM-ST</span>
                <span>Page 1 of 1</span>
            </div>
        </div>
    </div>

    <!-- Audit compliance segments -->
    <div style="display:none">
        STATEMENT OF COMPLIANCE
        SHORT-TERM INTERNATIONAL BALLAST WATER MANAGEMENT CERTIFICATE
        As per request of:
        THE OWNER
        By GR CLASS CLASSIFIED FOR STANDARD (GR CLASS)
        SOC-BWMC No.
        Name of Ship Distinctive number or letters Port of Registry Gross Tonnage Ballast Water Capacity (in cubic meters)
        IMO number1: Date of Construction
        Details of Ballast Water Management Method(s) Used Method of Ballast Water Management used
        Date installed (if applicable)
        Name of manufacturer (if applicable)
        The principal Ballast Water Management method(s) employed on this ship is/are: In accordance with regulation D-1
        In accordance with regulation D-2 (describe):
        The ship is subject to regulation D-4
        THIS IS TO CERTIFY:
        1. That the ship has been surveyed in accordance with the requirements of regulation E-1 of Annex to the Convention; and
        2. That the survey shows that Ballast Water Management on the ship complies with the Annex to the Convention.
        This certificate is valid until2     	
        Completion date of the survey on which this certificate is based	 	
        Issued at
        (Place of issue of certificate)
        GR CLASS REPRESENTATIVE
        1 IMO Ship Identification Number Scheme adopted by the Organization by Resolution A. 600 (15).
        2 Insert the date of expiry as specified by the Administration in accordance with Regulation I/14 (a) of the Convention. The day and the month of this date correspond to the anniversary date as defined in Regulation I/2(n) of the Convention, unless amended in accordance with Regulation I/14(h).
        GR CLASS – CLASSIFIED FOR STANDARD (GR CLASS)
        E-mail: info@grclass.com Web: www.grclass.com
        Form: SOC-BWM-ST	                                                              Approved by: GM		               		Page 1 of 1
    </div>
</body>
</html>
`;

fs.writeFileSync(targetFile, newContent);
console.log('Fixed BWM-ST Certificate.');
