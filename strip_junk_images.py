import os
import re
import glob

# Path to the certificates directory
cert_dir = r"a:\Girik workspace\grclass-backend\ONLY CERTIFICATES"

# Find all HTML files
html_files = glob.glob(os.path.join(cert_dir, "**", "html", "*.html"), recursive=True)

# Regex to match base64 images that look like scraped logos
# specifically the ones with data:image/jpeg;base64 that are junk
junk_img_pattern = re.compile(r'<img[^>]+src="data:image/jpeg;base64[^>]+>')
empty_p_pattern = re.compile(r'<p[^>]*>\s*</p>')
empty_p2_pattern = re.compile(r'<p[^>]*>\s*o\s*</p>')

modified_count = 0

for file_path in html_files:
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    original_content = content
    
    # Remove junk images
    content = junk_img_pattern.sub('', content)
    # Remove empty paragraphs left behind
    content = empty_p_pattern.sub('', content)
    content = empty_p2_pattern.sub('', content)
    
    # Remove the generic "GRCLASS" unstyled texts that were scraped
    content = re.compile(r'<p[^>]*><strong>G R C L A S S</strong></p>').sub('', content)
    content = re.compile(r'<div class="sec-label">GR CLASS-CLASSIFED FOR STANDARD</div>').sub('', content)

    if content != original_content:
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Cleaned junk from: {os.path.basename(file_path)}")
        modified_count += 1

print(f"Done. Cleaned {modified_count} files.")
