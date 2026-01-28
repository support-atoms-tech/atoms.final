# Video Compression Guide

This guide helps you compress your demo videos to reduce file sizes by 80-90% with minimal quality loss.

## Current Status

Your videos currently total **~382MB**:

- `demo4_regulation+incose_edit.mp4`: 92MB
- `cursor__polarian-v.mp4`: 85MB
- `demo7_edit_code.mp4`: 55MB
- `Demo5_edit.mp4`: 50MB
- `Demo2 Edited.mp4`: 49MB
- `demo6_export_pdf_excel_eidt.mp4`: 45MB
- `demo1_steering_edited.mp4`: 21MB
- `demo3_contradiction_edited.mp4`: 15MB

After compression, expect **~40-80MB total** (80-90% reduction).

## Prerequisites

Install ffmpeg (video processing tool):

```bash
brew install ffmpeg
```

## Step 1: Test Quality First (Recommended)

Before compressing all videos, test different quality levels on ONE video:

```bash
./scripts/test-compression.sh
```

This creates 3 test versions with different quality settings in `public/test_compressed/`:

- `test_crf18.mp4` - Visually lossless (highest quality)
- `test_crf23.mp4` - Excellent quality (recommended)
- `test_crf28.mp4` - Good quality (smallest files)

**Test them:**

1. Update one of your video components to use the test files
2. View them on your website
3. Pick the quality level you're happy with
4. If CRF 23 looks good, proceed to Step 2

## Step 2: Compress All Videos

Once you've tested and are satisfied with the quality:

```bash
./scripts/compress-videos.sh
```

**What it does:**

- Backs up all originals to `public/originals/` (safety first!)
- Compresses all `.mp4` files in `public/`
- Shows progress and file size savings
- Uses CRF 23 by default (excellent quality)

**Safety features:**

- Original files are preserved in backup folder
- Can be reversed anytime
- No data loss

## Step 3: Test Your Website

After compression:

```bash
npm run dev
```

Visit your site and verify all videos:

- Play smoothly
- Look good quality-wise
- Load faster

## Rollback (If Needed)

If you're not happy with the compression:

```bash
# Restore all originals
cp public/originals/* public/

# Remove backup folder
rm -rf public/originals
```

## Customizing Quality

Edit `scripts/compress-videos.sh` and change the `CRF` value:

```bash
CRF=18  # Higher quality, larger files
CRF=23  # Recommended balance
CRF=28  # Lower quality, smaller files
```

## Expected Results

**Before:**

- Total size: ~382MB
- Page load: Slow on 3G/4G
- Bandwidth cost: High

**After (CRF 23):**

- Total size: ~40-80MB (80% reduction)
- Page load: Fast on most connections
- Bandwidth cost: 80% cheaper

## Technical Details

The script uses these ffmpeg settings:

- **CRF 23**: Constant quality mode (visually indistinguishable from original)
- **Preset slow**: Better compression (takes longer, but worth it)
- **AAC 128k**: Audio quality (your videos are muted anyway)
- **faststart**: Enables streaming (video plays before fully downloaded)

## Files Created

```
scripts/
├── compress-videos.sh      # Batch compress all videos
├── test-compression.sh     # Test quality levels
└── VIDEO_COMPRESSION.md    # This file

public/
├── originals/              # Backup of original videos (created by script)
└── test_compressed/        # Test videos (created by test script)
```

## Cleanup After Testing

Once you're happy with compression:

```bash
# Remove test files
rm -rf public/test_compressed

# (Optional) Remove originals backup to save space
# Only do this if you're 100% satisfied
rm -rf public/originals
```

## Troubleshooting

**"ffmpeg: command not found"**

```bash
brew install ffmpeg
```

**"Permission denied"**

```bash
chmod +x scripts/*.sh
```

**Videos look pixelated**

- Lower CRF value (try CRF 20 or 18)
- Re-run the compression script

**Want even smaller files?**

- Increase CRF value (try CRF 26 or 28)
- Reduce resolution to 720p (edit script, add: `-vf scale=1280:720`)
- Reduce framerate to 24fps (edit script, add: `-r 24`)

## Questions?

- Test first with `test-compression.sh`
- Compare quality in your browser
- Originals are always backed up
- You can always restore

Happy compressing! 🎥
