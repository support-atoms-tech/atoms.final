#!/bin/bash

# Video Compression Script
# Compresses all videos in /public directory with optimal web settings
# Preserves originals in /public/originals backup folder

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PUBLIC_DIR="./public"
BACKUP_DIR="./public/originals"
CRF=23  # Quality: 18=visually lossless, 23=excellent, 28=good
PRESET="slow"  # slow = better compression
AUDIO_BITRATE="128k"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Video Compression Script${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

# Check if ffmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    echo -e "${RED}Error: ffmpeg is not installed${NC}"
    echo -e "${YELLOW}Install it with:${NC}"
    echo -e "  ${GREEN}brew install ffmpeg${NC} (macOS)"
    echo -e "  ${GREEN}sudo apt install ffmpeg${NC} (Ubuntu/Debian)"
    exit 1
fi

# Create backup directory
if [ ! -d "$BACKUP_DIR" ]; then
    echo -e "${YELLOW}Creating backup directory: $BACKUP_DIR${NC}"
    mkdir -p "$BACKUP_DIR"
fi

# Find all mp4 files
VIDEO_FILES=("$PUBLIC_DIR"/*.mp4)
TOTAL_FILES=${#VIDEO_FILES[@]}

if [ $TOTAL_FILES -eq 0 ]; then
    echo -e "${RED}No MP4 files found in $PUBLIC_DIR${NC}"
    exit 1
fi

echo -e "${GREEN}Found $TOTAL_FILES video files${NC}\n"
echo -e "${YELLOW}Settings:${NC}"
echo -e "  CRF: $CRF (quality factor)"
echo -e "  Preset: $PRESET"
echo -e "  Audio: $AUDIO_BITRATE AAC"
echo -e ""

# Calculate total original size
TOTAL_ORIGINAL_SIZE=0
for video in "${VIDEO_FILES[@]}"; do
    if [ -f "$video" ]; then
        SIZE=$(stat -f%z "$video" 2>/dev/null || stat -c%s "$video" 2>/dev/null)
        TOTAL_ORIGINAL_SIZE=$((TOTAL_ORIGINAL_SIZE + SIZE))
    fi
done

echo -e "${BLUE}Total original size: $(numfmt --to=iec-i --suffix=B $TOTAL_ORIGINAL_SIZE 2>/dev/null || echo "$((TOTAL_ORIGINAL_SIZE / 1024 / 1024))MB")${NC}\n"

# Ask for confirmation
read -p "Start compression? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Cancelled${NC}"
    exit 0
fi

echo ""

# Process each video
CURRENT=0
TOTAL_COMPRESSED_SIZE=0

for video in "${VIDEO_FILES[@]}"; do
    if [ ! -f "$video" ]; then
        continue
    fi

    CURRENT=$((CURRENT + 1))
    FILENAME=$(basename "$video")
    BACKUP_PATH="$BACKUP_DIR/$FILENAME"
    TEMP_PATH="$PUBLIC_DIR/.tmp_$FILENAME"

    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}[$CURRENT/$TOTAL_FILES] Processing: $FILENAME${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

    # Get original size
    ORIGINAL_SIZE=$(stat -f%z "$video" 2>/dev/null || stat -c%s "$video" 2>/dev/null)
    ORIGINAL_SIZE_MB=$((ORIGINAL_SIZE / 1024 / 1024))

    echo -e "Original size: ${YELLOW}${ORIGINAL_SIZE_MB}MB${NC}"

    # Backup original if not already backed up
    if [ ! -f "$BACKUP_PATH" ]; then
        echo -e "Backing up original..."
        cp "$video" "$BACKUP_PATH"
    else
        echo -e "${YELLOW}Backup already exists, skipping...${NC}"
    fi

    # Compress video
    echo -e "Compressing..."
    ffmpeg -i "$video" \
        -c:v libx264 \
        -crf $CRF \
        -preset $PRESET \
        -c:a aac \
        -b:a $AUDIO_BITRATE \
        -movflags +faststart \
        -y \
        "$TEMP_PATH" \
        2>&1 | grep -E "frame=|time=|size=" | tail -1 || true

    # Replace original with compressed version
    mv "$TEMP_PATH" "$video"

    # Get new size
    NEW_SIZE=$(stat -f%z "$video" 2>/dev/null || stat -c%s "$video" 2>/dev/null)
    NEW_SIZE_MB=$((NEW_SIZE / 1024 / 1024))
    TOTAL_COMPRESSED_SIZE=$((TOTAL_COMPRESSED_SIZE + NEW_SIZE))

    # Calculate savings
    SAVED=$((ORIGINAL_SIZE - NEW_SIZE))
    SAVED_MB=$((SAVED / 1024 / 1024))
    PERCENT=$((100 - (NEW_SIZE * 100 / ORIGINAL_SIZE)))

    echo -e "New size: ${GREEN}${NEW_SIZE_MB}MB${NC}"
    echo -e "Saved: ${GREEN}${SAVED_MB}MB${NC} (${GREEN}${PERCENT}%${NC} reduction)"
    echo ""
done

# Final summary
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✓ Compression Complete!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

TOTAL_ORIGINAL_MB=$((TOTAL_ORIGINAL_SIZE / 1024 / 1024))
TOTAL_COMPRESSED_MB=$((TOTAL_COMPRESSED_SIZE / 1024 / 1024))
TOTAL_SAVED=$((TOTAL_ORIGINAL_SIZE - TOTAL_COMPRESSED_SIZE))
TOTAL_SAVED_MB=$((TOTAL_SAVED / 1024 / 1024))
TOTAL_PERCENT=$((100 - (TOTAL_COMPRESSED_SIZE * 100 / TOTAL_ORIGINAL_SIZE)))

echo -e "Files processed: ${GREEN}$TOTAL_FILES${NC}"
echo -e "Original total: ${YELLOW}${TOTAL_ORIGINAL_MB}MB${NC}"
echo -e "Compressed total: ${GREEN}${TOTAL_COMPRESSED_MB}MB${NC}"
echo -e "Total saved: ${GREEN}${TOTAL_SAVED_MB}MB${NC} (${GREEN}${TOTAL_PERCENT}%${NC} reduction)"
echo -e ""
echo -e "${YELLOW}Originals backed up to: $BACKUP_DIR${NC}"
echo -e "${YELLOW}To restore: cp $BACKUP_DIR/* $PUBLIC_DIR/${NC}\n"
