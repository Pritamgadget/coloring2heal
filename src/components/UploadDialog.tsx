'use client'

import { useState, useRef, useEffect } from 'react'
import { fal } from '@fal-ai/client'
import { Gallery, type GalleryRef } from './Gallery'
import { galleryStorage } from '@/utils/galleryStorage'
import { validateAndResizeImage, formatFileSize, formatDimensions, IMAGE_LIMITS } from '@/utils/imageUtils'
import { X, Upload, Image as ImageIcon, AlertTriangle, RotateCcw } from 'lucide-react'

interface ProcessingFile {
  file: File
  id: string
  status: 'pending' | 'validating' | 'processing' | 'completed' | 'error'
  previewUrl: string
  processedUrl?: string
  error?: string
  resizeInfo?: {
    wasResized: boolean
    originalSize: { width: number; height: number; fileSize: number }
    newSize?: { width: number; height: number; fileSize: number }
  }
}

interface UploadDialogProps {
  isOpen: boolean
  onClose: () => void
  onImageProcessed: (imageUrl: string) => void
}

export function UploadDialog({ isOpen, onClose, onImageProcessed }: UploadDialogProps) {
  const [processingFiles, setProcessingFiles] = useState<ProcessingFile[]>([])
  const [apiKey, setApiKey] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedGalleryImageId, setSelectedGalleryImageId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<GalleryRef>(null)

  // Load saved API key from localStorage on component mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem('fal_api_key')
    if (savedApiKey) {
      setApiKey(savedApiKey)
    }
  }, [])

  // Save API key to localStorage whenever it changes
  const handleApiKeyChange = (newApiKey: string) => {
    setApiKey(newApiKey)
    localStorage.setItem('fal_api_key', newApiKey)
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    // Limit to 12 files maximum
    const filesToAdd = files.slice(0, 12)
    const remainingSlots = 12 - processingFiles.length
    const actualFilesToAdd = filesToAdd.slice(0, remainingSlots)

    if (actualFilesToAdd.length < files.length) {
      setError(`Only ${actualFilesToAdd.length} files can be added. Maximum 12 files allowed.`)
    } else {
      setError(null)
    }

    // Process each file for validation and resizing
    for (const file of actualFilesToAdd) {
      const processingFileId = Date.now().toString() + Math.random().toString(36).substr(2, 9)
      
      // Add initial processing file
      const initialProcessingFile: ProcessingFile = {
        file,
        id: processingFileId,
        status: 'validating',
        previewUrl: URL.createObjectURL(file)
      }
      
      setProcessingFiles(prev => [...prev, initialProcessingFile])

      try {
        // Validate and resize if necessary
        const validation = await validateAndResizeImage(file)
        
        let finalFile = file
        let resizeInfo = undefined
        
        if (validation.needsResize && validation.resizedFile) {
          finalFile = validation.resizedFile
          resizeInfo = {
            wasResized: true,
            originalSize: validation.originalSize,
            newSize: {
              width: 0, // Will be updated when we know the new dimensions
              height: 0,
              fileSize: validation.resizedFile.size
            }
          }
        } else {
          resizeInfo = {
            wasResized: false,
            originalSize: validation.originalSize
          }
        }

        // Update the processing file with validation results
        setProcessingFiles(prev => 
          prev.map(pf => 
            pf.id === processingFileId 
              ? { 
                  ...pf, 
                  file: finalFile,
                  status: 'pending',
                  previewUrl: URL.createObjectURL(finalFile),
                  resizeInfo
                } 
              : pf
          )
        )
      } catch (error) {
        console.error('Image validation failed:', error)
        setProcessingFiles(prev => 
          prev.map(pf => 
            pf.id === processingFileId 
              ? { 
                  ...pf, 
                  status: 'error',
                  error: error instanceof Error ? error.message : 'Image validation failed'
                } 
              : pf
          )
        )
      }
    }
  }

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        resolve(result)
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const processImage = async (processingFile: ProcessingFile) => {
    if (!apiKey) {
      setError('Please configure your API key.')
      return
    }

    // Update status to processing
    setProcessingFiles(prev => 
      prev.map(f => f.id === processingFile.id ? { ...f, status: 'processing' } : f)
    )

    try {
      // Configure fal client with API key
      fal.config({
        credentials: apiKey
      })

      // Convert file to base64 for upload
      const base64Image = await convertFileToBase64(processingFile.file)

      // Call fal.ai API
      const result = await fal.subscribe('fal-ai/flux-kontext/dev', {
        input: {
          image_url: base64Image,
          prompt: "Turn this photo into a clean black-and-white line art illustration, suitable for a colouring book. Simplify the background and objects, keep only essential outlines, and remove all colours and textures.",
          num_inference_steps: 28,
          guidance_scale: 2.5,
          num_images: 1,
          enable_safety_checker: true,
          output_format: "png",
          acceleration: "none",
          resolution_mode: "auto"
        }
      })

      if (result.data?.images?.[0]?.url) {
        // Cache the processed image
        const processedImageUrl = result.data.images[0].url
        
        // Download and cache the image locally
        const response = await fetch(processedImageUrl)
        const blob = await response.blob()
        
        // Convert blob to data URL for persistent storage
        const cachedUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.readAsDataURL(blob)
        })
        
        // Save to gallery
        await galleryStorage.saveImage(processingFile.file, cachedUrl)
        
        // Refresh gallery to show new image
        await galleryRef.current?.refresh()
        
        // Update processing file status
        setProcessingFiles(prev => 
          prev.map(f => f.id === processingFile.id ? { 
            ...f, 
            status: 'completed', 
            processedUrl: cachedUrl 
          } : f)
        )
        
        // Trigger gallery refresh by selecting this image
        onImageProcessed(cachedUrl)
      } else {
        throw new Error('No processed image returned from API')
      }
    } catch (err: any) {
      console.error('Error processing image:', err)
      setProcessingFiles(prev => 
        prev.map(f => f.id === processingFile.id ? { 
          ...f, 
          status: 'error', 
          error: err.message || 'Unknown error' 
        } : f)
      )
    }
  }

  const processAllImages = async () => {
    if (!apiKey) {
      setError('Please configure your API key.')
      return
    }

    const pendingFiles = processingFiles.filter(f => f.status === 'pending')
    if (pendingFiles.length === 0) return

    // Process files one by one to avoid overwhelming the API
    for (const file of pendingFiles) {
      await processImage(file)
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }

  const removeProcessingFile = (id: string) => {
    setProcessingFiles(prev => prev.filter(f => f.id !== id))
  }

  const retryProcessing = (processingFile: ProcessingFile) => {
    // Reset the file status to pending and clear any error
    setProcessingFiles(prev => 
      prev.map(f => f.id === processingFile.id ? { 
        ...f, 
        status: 'pending', 
        error: undefined,
        processedUrl: undefined
      } : f)
    )
    
    // Clear any general error message
    setError(null)
    
    // Automatically start processing
    processImage(processingFile)
  }

  const retryAllFailed = async () => {
    if (!apiKey) {
      setError('Please configure your API key.')
      return
    }

    const failedFiles = processingFiles.filter(f => f.status === 'error')
    if (failedFiles.length === 0) return

    // Reset all failed files to pending status
    setProcessingFiles(prev => 
      prev.map(f => f.status === 'error' ? { 
        ...f, 
        status: 'pending', 
        error: undefined,
        processedUrl: undefined
      } : f)
    )

    // Clear any general error message
    setError(null)

    // Process failed files one by one
    for (const file of failedFiles) {
      await processImage({ ...file, status: 'pending', error: undefined, processedUrl: undefined })
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }

  const handleGalleryImageSelect = (imageUrl: string, imageId: string) => {
    setSelectedGalleryImageId(imageId)
    onImageProcessed(imageUrl)
    handleClose()
  }

  const handleClose = () => {
    setProcessingFiles([])
    setError(null)
    setSelectedGalleryImageId(null)
    onClose()
  }

  if (!isOpen) return null

  const processingCount = processingFiles.filter(f => f.status === 'processing').length
  const completedCount = processingFiles.filter(f => f.status === 'completed').length
  const pendingCount = processingFiles.filter(f => f.status === 'pending').length
  const errorCount = processingFiles.filter(f => f.status === 'error').length

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Upload & Process Images</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              title="Settings"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="p-6 bg-gray-50 border-b border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-3">API Settings</h4>
            <div className="max-w-md">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Fal.ai API Key
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => handleApiKeyChange(e.target.value)}
                placeholder="Enter your fal.ai API key"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm text-gray-900 bg-white placeholder-gray-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Get your API key from{' '}
                <a href="https://fal.ai" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">
                  fal.ai
                </a>
              </p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 border-b border-red-200">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Main Content - Two Columns */}
        <div className="flex h-[calc(90vh-200px)]">
          {/* Left Column - Gallery */}
          <div className="w-1/2 border-r border-gray-200 p-6 overflow-y-auto">
            <div className="flex items-center gap-2 mb-4">
              <ImageIcon size={20} className="text-gray-600" />
              <h4 className="font-medium text-gray-900">Image Gallery</h4>
            </div>
            <Gallery 
              ref={galleryRef}
              onImageSelect={handleGalleryImageSelect}
              selectedImageId={selectedGalleryImageId}
              showSelectButtons={true}
              className="h-full"
            />
          </div>

          {/* Right Column - Upload & Processing */}
          <div className="w-1/2 p-6 overflow-y-auto">
            <div className="flex items-center gap-2 mb-4">
              <Upload size={20} className="text-gray-600" />
              <h4 className="font-medium text-gray-900">Upload & Process</h4>
              <span className="text-sm text-gray-500">
                ({processingFiles.length}/12 files)
              </span>
            </div>

            {/* Image Requirements Info */}
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <h5 className="text-sm font-medium text-blue-900 mb-2">Image Requirements</h5>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• Max dimensions: {formatDimensions(IMAGE_LIMITS.maxWidth, IMAGE_LIMITS.maxHeight)}</li>
                <li>• Max file size: {IMAGE_LIMITS.maxFileSizeMB} MB</li>
                <li>• Larger images will be automatically resized</li>
                <li>• Supported formats: JPEG, PNG, GIF, WebP</li>
              </ul>
            </div>

            {/* File Upload Area */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors mb-4"
            >
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-1">Click to upload images</p>
              <p className="text-xs text-gray-500">
                PNG, JPG, GIF up to 10MB each • Max 12 files
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Processing Queue */}
            {processingFiles.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="text-sm font-medium text-gray-700">Processing Queue</h5>
                  <div className="flex gap-2">
                    {pendingCount > 0 && (
                      <button
                        onClick={processAllImages}
                        disabled={!apiKey}
                        className="px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors disabled:bg-gray-400"
                      >
                        Process All ({pendingCount})
                      </button>
                    )}
                    {errorCount > 0 && (
                      <button
                        onClick={retryAllFailed}
                        disabled={!apiKey}
                        className="flex items-center gap-1 px-3 py-1 text-xs bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors disabled:bg-gray-400"
                      >
                        <RotateCcw size={12} />
                        Retry Failed ({errorCount})
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {processingFiles.map((file) => (
                    <div key={file.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <img 
                        src={file.previewUrl} 
                        alt={file.file.name}
                        className="w-12 h-12 object-cover rounded border"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {file.file.name}
                        </p>
                        <div className="text-xs text-gray-500 space-y-1">
                          <p>{formatFileSize(file.file.size)}</p>
                          {file.resizeInfo && (
                            <div className="flex items-center gap-1">
                              {file.resizeInfo.wasResized ? (
                                <>
                                  <AlertTriangle size={12} className="text-orange-500" />
                                  <span className="text-orange-600">
                                    Resized from {formatDimensions(file.resizeInfo.originalSize.width, file.resizeInfo.originalSize.height)}
                                  </span>
                                </>
                              ) : (
                                <span className="text-green-600">
                                  ✓ {formatDimensions(file.resizeInfo.originalSize.width, file.resizeInfo.originalSize.height)}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {file.status === 'validating' && (
                          <div className="flex items-center gap-1 text-xs text-gray-600">
                            <div className="animate-spin w-3 h-3 border border-gray-600 border-t-transparent rounded-full"></div>
                            Validating...
                          </div>
                        )}
                        {file.status === 'pending' && (
                          <button
                            onClick={() => processImage(file)}
                            disabled={!apiKey}
                            className="px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors disabled:bg-gray-400"
                          >
                            Process
                          </button>
                        )}
                        {file.status === 'processing' && (
                          <div className="flex items-center gap-1 text-xs text-blue-600">
                            <div className="animate-spin w-3 h-3 border border-blue-600 border-t-transparent rounded-full"></div>
                            Processing...
                          </div>
                        )}
                        {file.status === 'completed' && (
                          <div className="text-xs text-green-600 font-medium">✓ Completed</div>
                        )}
                        {file.status === 'error' && (
                          <div className="flex items-center gap-2">
                            <div 
                              className="text-xs text-red-600 font-medium cursor-help" 
                              title={`Error: ${file.error || 'Unknown error occurred'}`}
                            >
                              ✗ Failed
                            </div>
                            <button
                              onClick={() => retryProcessing(file)}
                              disabled={!apiKey}
                              className="p-1 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                              title={`Retry processing${!apiKey ? ' (API key required)' : ''}`}
                            >
                              <RotateCcw size={12} />
                            </button>
                          </div>
                        )}
                        <button
                          onClick={() => removeProcessingFile(file.id)}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          title="Remove"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Processing Stats */}
                <div className="mt-3 text-xs text-gray-500 text-center">
                  {completedCount > 0 && <span className="text-green-600">{completedCount} completed</span>}
                  {processingCount > 0 && <span className="text-blue-600">, {processingCount} processing</span>}
                  {errorCount > 0 && <span className="text-red-600">, {errorCount} failed</span>}
                  {pendingCount > 0 && <span>, {pendingCount} pending</span>}
                </div>
              </div>
            )}

            {/* Info Text */}
            {apiKey ? (
              <p className="text-xs text-gray-500 text-center">
                Images will be converted to black and white line art suitable for coloring.
              </p>
            ) : (
              <p className="text-xs text-red-600 text-center font-medium">
                Please configure your API key in settings to process images.
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}