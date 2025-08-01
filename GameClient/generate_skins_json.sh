#!/bin/sh

if [ -z "$1" ]; then
    echo "Usage: $0 <assets_directory>"
    exit 1
fi

OUTPUT_FILE="./public/assets/skins.json"

echo "[" > "$OUTPUT_FILE"
first=1
for dir in "$1"/*; do
    [ -d "$dir" ] || continue
    name=$(basename "$dir")
    if [ $first -eq 1 ]; then
        first=0
        echo "\"$name\"" >> "$OUTPUT_FILE"
    else
        echo ",\"$name\"" >> "$OUTPUT_FILE"
    fi
done
echo "]" >> "$OUTPUT_FILE"