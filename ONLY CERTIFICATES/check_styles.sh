#!/bin/bash
find "/Users/abhinavvishwakarma/Desktop/Gr-class-Workshop/Gr-Class-Backend/ONLY CERTIFICATES" -name "*.html" | while read -r file; do
    echo "Checking $file..."
    # extract everything between <style> and </style>
    awk '/<style>/{flag=1; next} /<\/style>/{flag=0} flag' "$file" | md5
done
