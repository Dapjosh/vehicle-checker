export async function compressImage(
  file: File,
  maxSizeKB: number = 100,
  maxWidthHeight: number = 1200,
): Promise<File> {
  // If the file is already smaller than the max size, return it untouched
  if (file.size <= maxSizeKB * 1024) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        const canvas = document.createElement('canvas');

        let width = img.width;
        let height = img.height;

        // Calculate aspect ratio while constraining to max dimensions
        if (width > height && width > maxWidthHeight) {
          height *= maxWidthHeight / width;
          width = maxWidthHeight;
        } else if (height > maxWidthHeight) {
          width *= maxWidthHeight / height;
          height = maxWidthHeight;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        // Compress to WebP format at 85% quality
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Canvas to Blob compression failed'));
              return;
            }
            // Create a new File object from the compressed Blob
            const compressedFile = new File(
              [blob],
              file.name.replace(/\.[^/.]+$/, '.webp'),
              {
                type: 'image/webp',
              },
            );

            resolve(compressedFile);
          },
          'image/webp',
          0.85,
        );
      };

      img.onerror = (error) => reject(error);
    };

    reader.onerror = (error) => reject(error);
  });
}
