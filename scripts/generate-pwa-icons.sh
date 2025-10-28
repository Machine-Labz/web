#!/bin/bash

# This script generates PWA icons from an existing image
# Make sure you have ImageMagick installed: brew install imagemagick (Mac) or apt-get install imagemagick (Linux)

INPUT_IMAGE="public/cloaklogo.svg"  # Change this to your source image
OUTPUT_DIR="public"

# Create the output directory if it doesn't exist
mkdir -p $OUTPUT_DIR

# Generate Android Chrome icons
echo "Generating PWA icons..."

# Convert SVG to PNG with different sizes
convert -background none -resize 192x192 $INPUT_IMAGE $OUTPUT_DIR/android-chrome-192x192.png
convert -background none -resize 512x512 $INPUT_IMAGE $OUTPUT_DIR/android-chrome-512x512.png

echo "PWA icons generated successfully!"
echo "- $OUTPUT_DIR/android-chrome-192x192.png"
echo "- $OUTPUT_DIR/android-chrome-512x512.png"

