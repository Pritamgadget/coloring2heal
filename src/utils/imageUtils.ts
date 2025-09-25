'use client'

export interface ImageValidationResult {
  needsResize: boolean
  originalSize: { width: number; height: number; fileSize: number }
  resizedFile?: File
}

export const IMAGE_LIMITS = {
  maxWidth: 2000,
  maxHeight: 2000,
  maxFileSizeMB: 10, // 10MB max file size
  quality: 0.9 // JPEG quality for resizing
}

/**
 * Validates an image file and resizes it if necessary
 * @param file The image file to validate and potentially resize
 * @returns Promise with validation result and resized file if needed
 */
export async function validateAndResizeImage(file: File): Promise<ImageValidationResult> {
  return new Promise((resolve, reject) => {
    // Check file type
    if (!file.type.startsWith('image/')) {
      reject(new Error('File is not an image'))
      return
    }

    // Check file size in bytes (convert MB to bytes)
    const maxFileSizeBytes = IMAGE_LIMITS.maxFileSizeMB * 1024 * 1024
    const needsFileSizeReduction = file.size > maxFileSizeBytes

    // Create image element to check dimensions
    const img = new Image()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      reject(new Error('Canvas context not available'))
      return
    }

    img.onload = () => {
      const originalSize = {
        width: img.width,
        height: img.height,
        fileSize: file.size
      }

      // Check if dimensions exceed limits
      const needsDimensionResize = 
        img.width > IMAGE_LIMITS.maxWidth || 
        img.height > IMAGE_LIMITS.maxHeight

      // If no resizing needed
      if (!needsDimensionResize && !needsFileSizeReduction) {
        resolve({
          needsResize: false,
          originalSize
        })
        return
      }

      // Calculate new dimensions while maintaining aspect ratio
      let newWidth = img.width
      let newHeight = img.height

      if (needsDimensionResize) {
        const aspectRatio = img.width / img.height

        if (img.width > img.height) {
          // Landscape orientation
          newWidth = Math.min(img.width, IMAGE_LIMITS.maxWidth)
          newHeight = newWidth / aspectRatio
        } else {
          // Portrait orientation
          newHeight = Math.min(img.height, IMAGE_LIMITS.maxHeight)
          newWidth = newHeight * aspectRatio
        }

        // Ensure both dimensions are within limits
        if (newWidth > IMAGE_LIMITS.maxWidth) {
          newWidth = IMAGE_LIMITS.maxWidth
          newHeight = newWidth / aspectRatio
        }
        if (newHeight > IMAGE_LIMITS.maxHeight) {
          newHeight = IMAGE_LIMITS.maxHeight
          newWidth = newHeight * aspectRatio
        }
      }

      // Set canvas dimensions
      canvas.width = Math.round(newWidth)
      canvas.height = Math.round(newHeight)

      // Enable high-quality image scaling
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'

      // Draw resized image
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

      // Convert to blob with appropriate quality
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to create resized image blob'))
            return
          }

          // Create new File object with same name and type
          const resizedFile = new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now()
          })

          resolve({
            needsResize: true,
            originalSize,
            resizedFile
          })
        },
        file.type === 'image/png' ? 'image/png' : 'image/jpeg',
        IMAGE_LIMITS.quality
      )
    }

    img.onerror = () => {
      reject(new Error('Failed to load image for validation'))
    }

    // Load the image
    const reader = new FileReader()
    reader.onload = (e) => {
      img.src = e.target?.result as string
    }
    reader.onerror = () => {
      reject(new Error('Failed to read image file'))
    }
    reader.readAsDataURL(file)
  })
}

/**
 * Formats file size in a human-readable format
 * @param bytes File size in bytes
 * @returns Formatted string (e.g., "2.5 MB", "1.2 KB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Formats image dimensions as a string
 * @param width Image width in pixels
 * @param height Image height in pixels
 * @returns Formatted string (e.g., "1920 × 1080")
 */
export function formatDimensions(width: number, height: number): string {
  return `${width} × ${height}`
}