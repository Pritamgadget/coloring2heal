'use client'

import { useState, useEffect, forwardRef, useImperativeHandle } from 'react'
import { galleryStorage, type GalleryImage } from '@/utils/galleryStorage'
import { Trash2, Check, Trash, Download } from 'lucide-react'

interface GalleryProps {
  onImageSelect?: (imageUrl: string, imageId: string) => void
  selectedImageId?: string | null
  showSelectButtons?: boolean
  className?: string
}

export interface GalleryRef {
  refresh: () => Promise<void>
}

export const Gallery = forwardRef<GalleryRef, GalleryProps>(({ 
  onImageSelect, 
  selectedImageId, 
  showSelectButtons = false,
  className = ""
}, ref) => {
  const [images, setImages] = useState<GalleryImage[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())

  const loadImages = async () => {
    setLoading(true)
    try {
      // Clean up any invalid blob URLs first
      await galleryStorage.cleanupBlobUrls()
      const galleryImages = await galleryStorage.getAllImages()
      setImages(galleryImages)
    } catch (error) {
      console.error('Failed to load gallery images:', error)
    } finally {
      setLoading(false)
    }
  }

  useImperativeHandle(ref, () => ({
    refresh: loadImages
  }))

  useEffect(() => {
    loadImages()
  }, [])

  const handleDeleteImage = async (imageId: string) => {
    if (!confirm('Are you sure you want to delete this image? It will also be removed from any months using it as background.')) {
      return
    }

    setDeletingIds(prev => new Set(prev).add(imageId))
    try {
      await galleryStorage.deleteImage(imageId)
      setImages(prev => prev.filter(img => img.id !== imageId))
    } catch (error) {
      console.error('Failed to delete image:', error)
      alert('Failed to delete image. Please try again.')
    } finally {
      setDeletingIds(prev => {
        const next = new Set(prev)
        next.delete(imageId)
        return next
      })
    }
  }

  const handleImageSelect = (imageUrl: string, imageId: string) => {
    if (onImageSelect) {
      onImageSelect(imageUrl, imageId)
    }
  }

  const handleDownloadImage = async (image: GalleryImage) => {
    try {
      // Convert data URL to blob if needed
      let url = image.url
      let filename = image.name
      
      if (image.url.startsWith('data:')) {
        // Convert data URL to blob for download
        const response = await fetch(image.url)
        const blob = await response.blob()
        url = URL.createObjectURL(blob)
        
        // Clean up filename and ensure it has proper extension
        const cleanName = filename.replace(/\.[^/.]+$/, "") // Remove existing extension
        const extension = blob.type === 'image/png' ? '.png' : '.jpg'
        filename = `${cleanName}_processed${extension}`
      } else {
        // Ensure filename has extension for other URL types
        if (!filename.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
          filename = `${filename}_processed.jpg`
        }
      }
      
      // Create download link and trigger download
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Clean up blob URL if we created one
      if (url !== image.url) {
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Failed to download image:', error)
      alert('Failed to download image. Please try again.')
    }
  }

  const handleDownloadAll = async () => {
    if (!confirm(`Download all ${images.length} images? This will download them one by one.`)) {
      return
    }

    try {
      for (const image of images) {
        await handleDownloadImage(image)
        // Small delay between downloads to avoid overwhelming the browser
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    } catch (error) {
      console.error('Failed to download all images:', error)
      alert('Failed to download some images. Please try again.')
    }
  }

  const handleDeleteAll = async () => {
    if (!confirm(`Are you sure you want to delete all ${images.length} images? This action cannot be undone and will remove all images from the gallery and any months using them as backgrounds.`)) {
      return
    }

    try {
      // Delete all images
      await Promise.all(images.map(image => galleryStorage.deleteImage(image.id)))
      setImages([])
    } catch (error) {
      console.error('Failed to delete all images:', error)
      alert('Failed to delete all images. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className={`${className} flex items-center justify-center min-h-32`}>
        <div className="animate-spin w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (images.length === 0) {
    return (
      <div className={`${className} flex flex-col items-center justify-center min-h-32 text-gray-500`}>
        <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="text-sm font-medium mb-1">No images in gallery</p>
        <p className="text-xs">Upload and process images to see them here</p>
      </div>
    )
  }

  return (
    <div className={className}>
      {/* Header with action buttons */}
      {images.length > 0 && (
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-gray-600">{images.length} image{images.length !== 1 ? 's' : ''}</p>
          <div className="flex gap-2">
            <button
              onClick={handleDownloadAll}
              className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
              title="Download all images"
            >
              <Download size={12} />
              Download All
            </button>
            <button
              onClick={handleDeleteAll}
              className="flex items-center gap-1 px-2 py-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
              title="Delete all images"
            >
              <Trash size={12} />
              Delete All
            </button>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-2 gap-3">
        {images.map((image) => {
          const isDeleting = deletingIds.has(image.id)
          const isSelected = selectedImageId === image.id

          return (
            <div
              key={image.id}
              className={`relative group bg-gray-100 rounded-lg overflow-hidden aspect-square ${
                isSelected ? 'ring-2 ring-purple-500' : ''
              }`}
            >
              {/* Image */}
              <img
                src={image.thumbnail}
                alt={image.name}
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
              />

              {/* Action buttons - positioned outside overlay to avoid conflicts */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-20 flex gap-1">
                {/* Download button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    e.preventDefault()
                    handleDownloadImage(image)
                  }}
                  className="p-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-lg z-30"
                  title="Download image"
                >
                  <Download size={14} />
                </button>
                
                {/* Delete button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    e.preventDefault()
                    handleDeleteImage(image.id)
                  }}
                  disabled={isDeleting}
                  className="p-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:bg-gray-400 shadow-lg z-30"
                  title="Delete image"
                >
                  {isDeleting ? (
                    <div className="animate-spin w-4 h-4 border border-white border-t-transparent rounded-full"></div>
                  ) : (
                    <Trash2 size={14} />
                  )}
                </button>
              </div>

              {/* Overlay with selection actions */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors z-10">
                {/* Select button (shown when showSelectButtons is true) */}
                {showSelectButtons && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleImageSelect(image.url, image.id)
                      }}
                      className={`px-3 py-2 rounded-lg transition-colors font-medium text-sm z-20 ${
                        isSelected
                          ? 'bg-purple-600 text-white'
                          : 'bg-white text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      {isSelected ? (
                        <div className="flex items-center gap-1">
                          <Check size={16} />
                          Selected
                        </div>
                      ) : (
                        'Select'
                      )}
                    </button>
                  </div>
                )}

                {/* Click handler for selection when not showing buttons */}
                {!showSelectButtons && onImageSelect && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleImageSelect(image.url, image.id)
                    }}
                    className="absolute inset-0 w-full h-full z-5"
                    title={`Select ${image.name}`}
                  />
                )}
              </div>

              {/* Selected indicator */}
              {isSelected && (
                <div className="absolute top-2 left-2 bg-purple-600 text-white rounded-full p-1 z-20">
                  <Check size={14} />
                </div>
              )}

              {/* Image name */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-white text-xs truncate" title={image.name}>
                  {image.name}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
})

Gallery.displayName = 'Gallery'

export default Gallery