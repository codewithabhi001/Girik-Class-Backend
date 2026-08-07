import os
import re

file_path = r"a:\Girik workspace\grclass-backend\ONLY CERTIFICATES\CARGO SHIP SAFETY EQUIPMENT CERTIFICATE\html\GRClass_CSSE_Form_E.html"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

start_marker = '<div class="body" style="flex: 1; display: flex; flex-direction: column;">'
end_marker = '                </div>\n\n                {remarks}'
start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx != -1 and end_idx != -1:
    body = content[start_idx+len(start_marker):end_idx]
    
    # Remove the Cert No table and replace with a div
    body = re.sub(r'<table class="data-table"><tr><td><p class="cert-desc"[^>]*><strong>Certificate No\.</strong></p></td><td><p class="cert-desc"[^>]*><strong>([^<]+)</strong></p></td></tr></table>', 
                  r'<div style="display: flex; justify-content: flex-end; margin-bottom: 4mm;"><table class="data-table" style="width: auto; min-width: 200px;"><tbody><tr><th>Certificate No.:</th><td>\1</td></tr></tbody></table></div>', body)
    
    # Replace top titles with sec-labels
    body = re.sub(r'<p class="cert-desc" style="margin-bottom:2mm">Record of Equipment for Cargo Ship Safety \(Form E\) </p>',
                  r'<div class="sec-label" style="text-align: center; margin-bottom: 2mm;">Record of Equipment for Cargo Ship Safety (Form E)</div>', body)
    body = re.sub(r'<p class="cert-desc" style="margin-bottom:2mm">RECORD OF EQUIPMENT FOR COMPLIANCE WITH THE INTERNATIONAL CONVENTION FOR THE</p>',
                  r'<p class="cert-desc" style="text-align: center; font-style: italic; margin-bottom: 0;">RECORD OF EQUIPMENT FOR COMPLIANCE WITH THE INTERNATIONAL CONVENTION FOR THE</p>', body)
    body = re.sub(r'<p class="cert-desc" style="margin-bottom:2mm"> SAFETY OF LIFE AT SEA, 1974, AS AMENDED</p>',
                  r'<p class="cert-desc" style="text-align: center; font-style: italic; margin-bottom: 6mm;">SAFETY OF LIFE AT SEA, 1974, AS AMENDED</p>', body)

    # Clean up the massive tables
    # Convert <p class="cert-desc" ...> inside <td> to just text
    body = re.sub(r'<p class="cert-desc"[^>]*>(.*?)</p>', r'\1', body)
    
    # Convert <ol><li><strong>1. Particulars of ship... to table section headers
    body = re.sub(r'<tr><td colspan="\d+"><ol><li><strong>(.*?)</strong></li></ol></td></tr>',
                  r'<tr><th colspan="7" style="background-color: var(--navy-light); color: white; text-align: left; padding-left: 8px;">\1</th></tr>', body)
    body = re.sub(r'<tr><td colspan="\d+"><ol><li><strong>(.*?)</strong></td><td></td></tr>',
                  r'<tr><th colspan="7" style="background-color: var(--navy-light); color: white; text-align: left; padding-left: 8px;">\1</th></tr>', body)
                  
    body = re.sub(r'<ol><li>(.*?)</li></ol>', r'\1', body)
    body = re.sub(r'<ul><li>(.*?)</li></ul>', r'<span style="padding-left: 15px;">\1</span>', body)
    body = re.sub(r'<ul><ul><li>(.*?)</li></ul></ul>', r'<span style="padding-left: 30px;">\1</span>', body)
    body = re.sub(r'<ul><li><ul><li>(.*?)</li></ul></li></ul>', r'<span style="padding-left: 30px;">\1</span>', body)
    
    # Empty tds
    body = body.replace('<td></td>', '<td>&nbsp;</td>')
    body = body.replace('<td colspan="2"></td>', '<td colspan="2">&nbsp;</td>')
    body = body.replace('<td colspan="3"></td>', '<td colspan="3">&nbsp;</td>')
    body = body.replace('<td colspan="4"></td>', '<td colspan="4">&nbsp;</td>')
    
    # Add {vessel_name} to Name of ship
    body = body.replace('<tr><td><strong>Name of ship</strong>   </td><td colspan="2">&nbsp;</td>', 
                        '<tr><td><strong>Name of ship</strong></td><td colspan="2">{vessel_name}</td>')
    body = body.replace('<tr><td colspan="2"><strong>Distinctive number or letters</strong></td><td>&nbsp;</td>',
                        '<tr><td colspan="2"><strong>Distinctive number or letters</strong></td><td>{call_sign}</td>')

    # Ensure tables have proper bottom margin
    body = body.replace('</table>', '</table><br>')
    
    # Signatures
    sig_block = """
                    <div style="display: flex; justify-content: space-between; margin-top: auto; padding-top: 10px; border-top: 1px solid #ccc;">
                        <div style="width: 45%;">
                            <p class="cert-desc" style="margin-bottom: 2mm;">Signature of duly authorized official issuing the Record</p>
                            <div style="border-bottom: 1px solid #000; height: 30px; margin-bottom: 5px;"></div>
                            <div style="font-weight: bold;">Name:</div>
                            <div style="font-weight: bold; margin-top: 2px;">GR CLASS - CLASSIFIED FOR STANDARD</div>
                        </div>
                    </div>
    """
    body = re.sub(r'<table class="data-table"><tr><td colspan="2">&nbsp;</td></tr><tr><td colspan="2">Signature of duly authorized official issuing the Record.*?GR CLASS-CLASSIFED FOR STANDARD</strong>', sig_block, body, flags=re.DOTALL)
    
    new_content = content[:start_idx + len(start_marker)] + "\n" + body + "\n" + content[end_idx:]
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Updated GRClass_CSSE_Form_E.html")
else:
    print("Could not find markers.")
