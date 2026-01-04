#!/bin/bash
# Copy data files from mobile/assets/data/ to backend/data/ for Railway deployment

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
MOBILE_DATA_DIR="$PROJECT_ROOT/mobile/assets/data"
BACKEND_DATA_DIR="$PROJECT_ROOT/backend/data"

echo "📋 Copying data files for Railway deployment..."
echo "   From: $MOBILE_DATA_DIR"
echo "   To:   $BACKEND_DATA_DIR"
echo ""

# Create backend/data directory if it doesn't exist
mkdir -p "$BACKEND_DATA_DIR"

# Files to copy
FILES=(
  "otc_medicines_master_th.csv"
  "otc_clinical_mapping.json"
  "question_bank_master.json"
  "canonical_question_bank.json"
  "bodypart_redflags_expanded.csv"
)

# Copy each file
for file in "${FILES[@]}"; do
  if [ -f "$MOBILE_DATA_DIR/$file" ]; then
    cp "$MOBILE_DATA_DIR/$file" "$BACKEND_DATA_DIR/$file"
    echo "✅ Copied: $file"
  else
    echo "⚠️  File not found: $MOBILE_DATA_DIR/$file"
  fi
done

echo ""
echo "✅ Done! Files copied to backend/data/"
echo ""
echo "📝 Next steps:"
echo "   1. Commit these files: git add backend/data/"
echo "   2. Push to Railway: git push"
echo "   3. Railway will find files at backend/data/ automatically"

