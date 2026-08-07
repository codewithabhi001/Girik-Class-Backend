import os
import re

base_dir = r"a:\Girik workspace\grclass-backend\ONLY CERTIFICATES"

files_to_update = [
    r"ANTI FOULING SYSTEM CERTIFICATE\html\GRClass_AFS_RA_SoC_Record.html",
    r"International Ship Security Certificate\html\GRClass_ISSC_APR_SSPA_Approval.html",
    r"CARGO SHIP SAFETY EQUIPMENT CERTIFICATE\html\GRClass_CSSE_Form_E.html",
    r"CARGO SHIP SAFETY RADIO CERTIFICATE\html\GRClass_CSSR_Form_R.html",
    r"International Air Pollution Prevention Certificate\html\GRClass_IAPP_R_SoC_Supplement.html",
    r"International Energy Efficiency Certificate\html\GRClass_IEE_Supplement.html",
    r"Certificate of Compliance with the International Maritime Solid Bulk Cargoes (IMSBC) CODE\html\GRClass_IMSBC_IC_Approved_Cargoes.html",
    r"INTERNATIONAL OIL POLLUTION PREVENTION CERTIFICATE\html\GRClass_IOPP_Form_A.html",
    r"International Load Line Certificate\html\GRClass_LL_RA_Conditions_C11.html",
    r"Ship Oilয়ংPollution Emergency Plan\html\GRClass_SOPEP_R_Approved_Plan.html",
    r"Survey Statement\html\GRClass_Survey_Statement.html"
]

for rel_path in files_to_update:
    # Handle the typo from the list if necessary
    rel_path = rel_path.replace("Ship Oilয়ংPollution", "Ship Oil Pollution")
    file_path = os.path.join(base_dir, rel_path)
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        continue
        
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # We want to replace <table> with <table class="data-table"> if it doesn't have a class
    content = re.sub(r'<table(?![^>]*class=)[^>]*>', r'<table class="data-table">', content)
    
    # We want to replace <h2>Title</h2> with <div class="sec-label">Title</div>
    content = re.sub(r'<h2>(.*?)</h2>', r'<div class="sec-label">\1</div>', content, flags=re.IGNORECASE | re.DOTALL)
    
    # We want to replace <h3>Title</h3> with smaller sec-label
    content = re.sub(r'<h3>(.*?)</h3>', r'<div class="sec-label" style="font-size: 6.5pt; color: var(--navy-blue);">\1</div>', content, flags=re.IGNORECASE | re.DOTALL)

    # Some old table headers might have been unstyled or weird. 
    # Let's add basic styling for <p> inside tables if any
    content = re.sub(r'<p(?![^>]*class=)[^>]*>', r'<p class="cert-desc" style="margin-bottom:2mm">', content)

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)

print("Finished fixing inner HTML tags.")
