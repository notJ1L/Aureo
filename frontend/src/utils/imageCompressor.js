/**
 * Compress an image file using the browser Canvas API before sending to backend.
 * Reduces raw camera/phone photo size from ~5-10MB down to ~150-250KB, reducing
 * network transmission time and Cloudinary ingestion time by over 90%.
 *
 * @param {File} file
 * @param {number} maxWidth
 * @param {number} quality (0 to 1)
 * @returns {Promise<string>} Base64 data URL
 */
export const compressImage = (file, maxWidth = 1400, quality = 0.82) => {
    return new Promise((resolve) => {
        if (!file || !file.type.startsWith("image/")) {
            resolve(null);
            return;
        }

        // SVG or GIF shouldn't be canvas-compressed to preserve vectors/animation
        if (file.type === "image/gif" || file.type === "image/svg+xml") {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(file);
            return;
        }

        const reader = new FileReader();
        reader.onload = (readerEvent) => {
            const img = new Image();
            img.onload = () => {
                let { width, height } = img;

                // Scale down proportionally if larger than maxWidth
                if (width > maxWidth || height > maxWidth) {
                    if (width > height) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    } else {
                        width = Math.round((width * maxWidth) / height);
                        height = maxWidth;
                    }
                }

                const canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");

                // High quality image smoothing
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = "high";

                // Clean white background in case of transparent source
                ctx.fillStyle = "#ffffff";
                ctx.fillRect(0, 0, width, height);

                ctx.drawImage(img, 0, 0, width, height);

                const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
                resolve(compressedDataUrl);
            };

            img.onerror = () => {
                // Fallback to original data URL if image rendering fails
                resolve(readerEvent.target.result);
            };

            img.src = readerEvent.target.result;
        };

        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
    });
};

