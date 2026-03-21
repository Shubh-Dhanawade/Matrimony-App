const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

/**
 * Optimizes an uploaded image:
 * 1. Resizes to max width of 1200px (standard for mobile)
 * 2. Compresses to high-quality JPEG/WebP
 * 3. Removes EXIF data for privacy and smaller size
 * 4. Overwrites the original file with the optimized version.
 */
const optimizeImage = async (filePath) => {
    try {
        const ext = path.extname(filePath).toLowerCase();
        
        // Skip PDFs or non-image files
        if (ext === '.pdf') return;

        const tempPath = filePath + '.tmp';
        
        // We read from the current file, process with sharp, write to temp, then swap
        // This is safe and avoids memory issues with large files
        let pipeline = sharp(filePath)
            .rotate() // Auto-orient based on metadata (fixes sideways phone photos)
            .resize({
                width: 1200,
                withoutEnlargement: true // Don't upscale small images
            });

        // Optimization: Convert to WebP if user supports it, 
        // but for simplicity & compatibility, we'll keep the same extension 
        // and just compress to 80% quality.
        if (ext === '.png') {
            pipeline = pipeline.png({ quality: 80, compressionLevel: 8 });
        } else {
            pipeline = pipeline.jpeg({ quality: 80, progressive: true });
        }

        await pipeline.toFile(tempPath);
        
        // Replace original with optimized version
        fs.unlinkSync(filePath);
        fs.renameSync(tempPath, filePath);
        
        console.log(`[IMG_OPT] Optimized: ${path.basename(filePath)}`);
    } catch (error) {
        console.error(`[IMG_OPT_ERROR] Failed to optimize ${filePath}:`, error.message);
        // We don't throw error to avoid failing the whole upload — 
        // the original unoptimized image is still valid.
    }
};

module.exports = { optimizeImage };
