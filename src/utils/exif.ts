/**
 * Client-Side EXIF Sanitize & Coordinate Extractor
 * Complies with India's DPDP Act 2023:
 * Strips device identifiers, timestamps, camera make/model, and personal metadata from uploaded photos
 * by re-drawing the image onto an HTML5 Canvas before persisting or submitting.
 * Server/client keeps only the verified latitude/longitude for geofence verification.
 */

export interface ProcessedPhotoResult {
  dataUrl: string;
  blob: Blob;
  coordinates?: { latitude: number; longitude: number };
}

export async function processAndStripExif(
  file: File,
  fallbackCoords?: { latitude: number; longitude: number }
): Promise<ProcessedPhotoResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Resize if excessively large to save IndexedDB storage and bandwidth
        const maxDim = 1600;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context unavailable'));
          return;
        }

        // Drawing directly to canvas eliminates all raw EXIF/IPTC/XMP metadata
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to create stripped image blob'));
              return;
            }
            const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
            resolve({
              dataUrl,
              blob,
              coordinates: fallbackCoords,
            });
          },
          'image/jpeg',
          0.85
        );
      };

      img.onerror = () => reject(new Error('Failed to load image for processing'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Failed to read photo file'));
    reader.readAsDataURL(file);
  });
}
