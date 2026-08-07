import os

files = [
    "ANTI FOULING SYSTEM CERTIFICATE/html/GRClass_AFS_RA_SoC_Record.html",
    "International Ship Security Certificate/html/GRClass_ISSC_APR_SSPA_Approval.html",
    "CARGO SHIP SAFETY EQUIPMENT CERTIFICATE/html/GRClass_CSSE_Form_E.html",
    "CARGO SHIP SAFETY RADIO CERTIFICATE/html/GRClass_CSSR_Form_R.html",
    "IAPP/html/GRClass_IAPP_R_SoC_Supplement.html",
    "INTERNATIONAL ENERGY EFFICIENCY CERTIFICATE/html/GRClass_IEE_Supplement.html",
    "IMSBC/html/GRClass_IMSBC_IC_Approved_Cargoes.html",
    "IOPP/html/GRClass_IOPP_Form_A.html",
    "LOAD LINE CERTIFICATE/html/GRClass_LL_RA_Conditions_C11.html",
    "SOPEP/html/GRClass_SOPEP_R_Approved_Plan.html"
]

base_dir = r"a:\Girik workspace\grclass-backend\ONLY CERTIFICATES"

start_marker = '<div class="body" style="flex: 1; display: flex; flex-direction: column;">'
end_marker = '                </div>\n\n                {remarks}'
end_marker2 = '                </div>\n\n                <div class="gen-notice">'
end_marker3 = '                </div>\n                {remarks}'

for rel_path in files:
    file_path = os.path.join(base_dir, rel_path)
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    start_idx = content.find(start_marker)
    end_idx = content.find(end_marker)
    if end_idx == -1: end_idx = content.find(end_marker2)
    if end_idx == -1: end_idx = content.find(end_marker3)
    
    if start_idx != -1 and end_idx != -1:
        body = content[start_idx+len(start_marker):end_idx].strip()
        print(f"--- {os.path.basename(rel_path)} ---")
        print(body[:300]) # just peek at the first 300 chars to see what it is
        print("...")
        print(body[-300:])
        print("\n")
    else:
        print(f"Could not find markers for {rel_path}")

