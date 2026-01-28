#!/bin/bash

# Test Video Compression Script
# Creates 3 test versions of one video with different quality settings
# Compare them to find the best balance of quality vs file size

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

TEST_VIDEO="./public/demo1_steering_edited.mp4"
OUTPUT_DIR="./public/test_compressed"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Video Compression Quality Test${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

# Check ffmpeg
if ! command -v ffmpeg &> /dev/null; then
    echo -e "${YELLOW}Installing ffmpeg...${NC}"
    brew install ffmpeg
fi

# Check if test video exists
if [ ! -f "$TEST_VIDEO" ]; then
    echo -e "${YELLOW}Using first available video...${NC}"
    TEST_VIDEO=$(find ./public -name "*.mp4" | head -1)
fi

echo -e "Test video: ${GREEN}$(basename "$TEST_VIDEO")${NC}\n"

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Get original size
ORIGINAL_SIZE=$(stat -f%z "$TEST_VIDEO" 2>/dev/null || stat -c%s "$TEST_VIDEO" 2>/dev/null)
ORIGINAL_SIZE_MB=$((ORIGINAL_SIZE / 1024 / 1024))

echo -e "Original size: ${YELLOW}${ORIGINAL_SIZE_MB}MB${NC}\n"
echo -e "Creating 3 test versions...\n"

# CRF 18 - Visually lossless
echo -e "${BLUE}[1/3] CRF 18 - Visually Lossless${NC}"
ffmpeg -i "$TEST_VIDEO" \
    -c:v libx264 -crf 18 -preset slow \
    -c:a aac -b:a 128k \
    -movflags +faststart \
    -y "$OUTPUT_DIR/test_crf18.mp4" \
    -loglevel error -stats

SIZE_18=$(stat -f%z "$OUTPUT_DIR/test_crf18.mp4" 2>/dev/null || stat -c%s "$OUTPUT_DIR/test_crf18.mp4" 2>/dev/null)
SIZE_18_MB=$((SIZE_18 / 1024 / 1024))
SAVED_18=$((100 - (SIZE_18 * 100 / ORIGINAL_SIZE)))
echo -e "Size: ${GREEN}${SIZE_18_MB}MB${NC} (${GREEN}${SAVED_18}%${NC} reduction)\n"

# CRF 23 - Excellent quality (recommended)
echo -e "${BLUE}[2/3] CRF 23 - Excellent Quality (Recommended)${NC}"
ffmpeg -i "$TEST_VIDEO" \
    -c:v libx264 -crf 23 -preset slow \
    -c:a aac -b:a 128k \
    -movflags +faststart \
    -y "$OUTPUT_DIR/test_crf23.mp4" \
    -loglevel error -stats

SIZE_23=$(stat -f%z "$OUTPUT_DIR/test_crf23.mp4" 2>/dev/null || stat -c%s "$OUTPUT_DIR/test_crf23.mp4" 2>/dev/null)
SIZE_23_MB=$((SIZE_23 / 1024 / 1024))
SAVED_23=$((100 - (SIZE_23 * 100 / ORIGINAL_SIZE)))
echo -e "Size: ${GREEN}${SIZE_23_MB}MB${NC} (${GREEN}${SAVED_23}%${NC} reduction)\n"

# CRF 28 - Good quality
echo -e "${BLUE}[3/3] CRF 28 - Good Quality${NC}"
ffmpeg -i "$TEST_VIDEO" \
    -c:v libx264 -crf 28 -preset slow \
    -c:a aac -b:a 128k \
    -movflags +faststart \
    -y "$OUTPUT_DIR/test_crf28.mp4" \
    -loglevel error -stats

SIZE_28=$(stat -f%z "$OUTPUT_DIR/test_crf28.mp4" 2>/dev/null || stat -c%s "$OUTPUT_DIR/test_crf28.mp4" 2>/dev/null)
SIZE_28_MB=$((SIZE_28 / 1024 / 1024))
SAVED_28=$((100 - (SIZE_28 * 100 / ORIGINAL_SIZE)))
echo -e "Size: ${GREEN}${SIZE_28_MB}MB${NC} (${GREEN}${SAVED_28}%${NC} reduction)\n"

# Summary
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✓ Test Files Created!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

echo -e "Compare these files in your browser:\n"
echo -e "  Original:  ${YELLOW}${ORIGINAL_SIZE_MB}MB${NC} - $(basename "$TEST_VIDEO")"
echo -e "  CRF 18:    ${GREEN}${SIZE_18_MB}MB${NC} - test_compressed/test_crf18.mp4"
echo -e "  CRF 23:    ${GREEN}${SIZE_23_MB}MB${NC} - test_compressed/test_crf23.mp4"
echo -e "  CRF 28:    ${GREEN}${SIZE_28_MB}MB${NC} - test_compressed/test_crf28.mp4"
echo -e ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "1. Open your website and test each video"
echo -e "2. Choose the quality level you're happy with"
echo -e "3. Run: ${GREEN}./scripts/compress-videos.sh${NC}"
echo -e ""
