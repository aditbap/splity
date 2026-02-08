
/**
 * Processes an image file to ensure it meets OCR requirements:
 * - Max size: 1MB (compress if larger)
 * - Max dimension: 2048px (resize if larger)
 * - Format: JPEG
 */
export async function processImageForOCR(file: File): Promise<File> {
    const MAX_SIZE_MB = 1; // 1MB
    const MAX_DIMENSION = 2048; // Max width or height
    const COMPRESSION_QUALITY_STEP = 0.1;

    // If file is already small enough and not too large dimensions (we can't check dims easily without loading, 
    // but usually size is the main proxy. Let's load it anyway to ensure quality/format).
    // actually, let's just process everything to ensure consistency.

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                let width = img.width;
                let height = img.height;

                // 1. Resize if too big
                if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
                    if (width > height) {
                        height = Math.round((height * MAX_DIMENSION) / width);
                        width = MAX_DIMENSION;
                    } else {
                        width = Math.round((width * MAX_DIMENSION) / height);
                        height = MAX_DIMENSION;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Canvas context not available'));
                    return;
                }

                // Draw with white background (handle transparent PNGs)
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, width, height);
                ctx.drawImage(img, 0, 0, width, height);

                // 2. Compress loop
                let quality = 0.9;

                const tryCompress = () => {
                    canvas.toBlob(
                        (blob) => {
                            if (!blob) {
                                reject(new Error('Canvas to Blob failed'));
                                return;
                            }

                            if (blob.size <= MAX_SIZE_MB * 1024 * 1024 || quality <= 0.1) {
                                // Success or gave up
                                const processedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
                                    type: 'image/jpeg',
                                    lastModified: Date.now(),
                                });
                                resolve(processedFile);
                            } else {
                                // Try lower quality
                                quality -= COMPRESSION_QUALITY_STEP;
                                tryCompress();
                            }
                        },
                        'image/jpeg',
                        quality
                    );
                };

                tryCompress();
            };
            img.onerror = (e) => reject(e);
        };
        reader.onerror = (e) => reject(e);
    });
}
