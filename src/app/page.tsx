'use client'

import { useState, useRef, useEffect } from 'react'
import { CalendarGenerator } from '@/components/CalendarGenerator'
import { DownloadModal } from '@/components/DownloadModal'
import { UploadDialog } from '@/components/UploadDialog'
import { Gallery } from '@/components/Gallery'
import { ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react'
import { downloadCalendar, captureCalendarAsImage, type CalendarData } from '@/utils/downloadUtils'
import { galleryStorage } from '@/utils/galleryStorage'



export default function Home() {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('minimal')
  const [fromMonth, setFromMonth] = useState<number>(new Date().getMonth())
  const [toMonth, setToMonth] = useState<number>(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [monthBackgrounds, setMonthBackgrounds] = useState<Map<string, string>>(new Map())
  const [currentViewMonth, setCurrentViewMonth] = useState<number>(new Date().getMonth())
  const [showDownloadModal, setShowDownloadModal] = useState(false)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [backgroundZoom, setBackgroundZoom] = useState<number>(100)
  const [showBackgroundSelector, setShowBackgroundSelector] = useState(false)
  const calendarRef = useRef<HTMLDivElement>(null)

  // Load saved backgrounds on component mount
  useEffect(() => {
    const loadSavedBackgrounds = async () => {
      try {
        const savedBackgrounds = await galleryStorage.getAllMonthBackgrounds()
        const backgroundsMap = new Map<string, string>()
        
        for (const bg of savedBackgrounds) {
          const key = `${bg.month}-${bg.year}`
          // Get the actual image from gallery
          const images = await galleryStorage.getAllImages()
          const image = images.find(img => img.id === bg.imageId)
          if (image) {
            backgroundsMap.set(key, image.url)
          }
        }
        
        setMonthBackgrounds(backgroundsMap)
      } catch (error) {
        console.error('Failed to load saved backgrounds:', error)
      }
    }

    loadSavedBackgrounds()
  }, [])

  const getCurrentMonthBackground = () => {
    const key = `${currentViewMonth}-${selectedYear}`
    return monthBackgrounds.get(key) || null
  }

  const handleBackgroundUpload = (imageUrl: string) => {
    // Set for current month
    const key = `${currentViewMonth}-${selectedYear}`
    setMonthBackgrounds(prev => new Map(prev).set(key, imageUrl))
    
    // Save to IndexedDB (we'll need to find the imageId)
    saveBgToStorage(currentViewMonth, selectedYear, imageUrl)
  }

  const saveBgToStorage = async (month: number, year: number, imageUrl: string) => {
    try {
      const images = await galleryStorage.getAllImages()
      const image = images.find(img => img.url === imageUrl)
      if (image) {
        await galleryStorage.setMonthBackground(month, year, image.id)
      }
    } catch (error) {
      console.error('Failed to save background to storage:', error)
    }
  }

  const handleBackgroundRemove = () => {
    const key = `${currentViewMonth}-${selectedYear}`
    setMonthBackgrounds(prev => {
      const next = new Map(prev)
      next.delete(key)
      return next
    })
    
    // Remove from IndexedDB
    galleryStorage.removeMonthBackground(currentViewMonth, selectedYear)
  }

  const handleMonthBackgroundSelect = (imageUrl: string, imageId: string) => {
    const key = `${currentViewMonth}-${selectedYear}`
    setMonthBackgrounds(prev => new Map(prev).set(key, imageUrl))
    
    // Save to IndexedDB
    galleryStorage.setMonthBackground(currentViewMonth, selectedYear, imageId)
    setShowBackgroundSelector(false)
  }

  const handleDownload = () => {
    setShowDownloadModal(true)
  }

  // Capture calendar for different months by temporarily changing the state
  const createTemporaryCalendar = async (calendarData: CalendarData): Promise<string> => {
    console.log('Capturing calendar for:', calendarData.month, calendarData.year)
    
    // Store current state
    const originalViewMonth = currentViewMonth
    
    // Temporarily change to the target month
    setCurrentViewMonth(calendarData.month)
    
    // Wait for re-render to show the correct background for this month
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    try {
      const element = document.getElementById('main-calendar')
      console.log('Found calendar element:', !!element)
      console.log('Element dimensions:', element?.offsetWidth, 'x', element?.offsetHeight)
      
      if (!element) {
        throw new Error('Calendar element not found')
      }
      
      if (element.offsetWidth === 0 || element.offsetHeight === 0) {
        throw new Error('Calendar element has zero dimensions')
      }
      
      const imageData = await captureCalendarAsImage(element)
      console.log('Image data captured, length:', imageData.length)
      return imageData
    } finally {
      // Restore original state
      setCurrentViewMonth(originalViewMonth)
      // Wait a bit before next capture
      await new Promise(resolve => setTimeout(resolve, 200))
    }
  }

  const handleDownloadConfirm = async (options: { format: 'png' | 'pdf'; includeAllMonths: boolean }) => {
    setIsDownloading(true)
    setShowDownloadModal(false)
    
    try {
      await downloadCalendar(
        {
          format: options.format,
          includeAllMonths: options.includeAllMonths,
          fromMonth,
          toMonth,
          year: selectedYear,
          template: selectedTemplate,
          backgroundImage: getCurrentMonthBackground()
        },
        createTemporaryCalendar
      )
      
      // Show success message
      alert('Calendar downloaded successfully!')
    } catch (error) {
      console.error('Download failed:', error)
      alert('Download failed. Please try again.')
    } finally {
      setIsDownloading(false)
    }
  }

  // Navigation logic
  const isRangeSelected = fromMonth !== toMonth
  const canNavigatePrev = isRangeSelected && currentViewMonth > fromMonth
  const canNavigateNext = isRangeSelected && currentViewMonth < toMonth

  const handlePrevMonth = () => {
    if (canNavigatePrev) {
      setCurrentViewMonth(currentViewMonth - 1)
    }
  }

  const handleNextMonth = () => {
    if (canNavigateNext) {
      setCurrentViewMonth(currentViewMonth + 1)
    }
  }

  // Update currentViewMonth when fromMonth changes
  const handleFromMonthChange = (month: number) => {
    setFromMonth(month)
    setCurrentViewMonth(month)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="grid lg:grid-cols-6 h-screen w-full">
        <div className="lg:col-span-1 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* Site Title */}
            <div className="flex items-center space-x-2 mb-4 pb-4 border-b border-gray-200">
              <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg"></div>
              <span className="text-lg font-bold text-gray-900">Coloring2Heal</span>
            </div>
            
            {/* Date Range Controls */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Date Range</h3>
              <div className="space-y-2">
                {/* From and To months on same line */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">From</label>
                    <select
                      value={fromMonth}
                      onChange={(e) => handleFromMonthChange(Number(e.target.value))}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm text-gray-900 bg-white"
                    >
                      {['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'].map((month, index) => (
                        <option key={index} value={index}>{month}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">To</label>
                    <select
                      value={toMonth}
                      onChange={(e) => setToMonth(Number(e.target.value))}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm text-gray-900 bg-white"
                    >
                      {['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'].map((month, index) => (
                        <option key={index} value={index}>{month}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {/* Year on separate line */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Year</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm text-gray-900 bg-white"
                  >
                    {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i - 5).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Background Controls */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Background</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setShowUploadDialog(true)}
                  className="w-full px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Upload & Process
                </button>
                
                <button
                  onClick={() => setShowBackgroundSelector(true)}
                  className="w-full px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <ImageIcon size={16} />
                  Select from Gallery
                </button>

                {getCurrentMonthBackground() && (
                  <button
                    onClick={handleBackgroundRemove}
                    className="w-full px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Remove
                  </button>
                )}
              </div>
              
              {/* Background Zoom Control */}
              <div className="mt-3">
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  Background Zoom: {backgroundZoom}%
                </label>
                <input
                  type="range"
                  min="50"
                  max="200"
                  value={backgroundZoom}
                  onChange={(e) => setBackgroundZoom(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>50% (Zoom Out)</span>
                  <span>200% (Zoom In)</span>
                </div>
              </div>

              {/* Current Month Info */}
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs font-medium text-gray-700 mb-1">
                  Current Month: {['January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'][currentViewMonth]} {selectedYear}
                </p>
                <div className="w-full h-20 border border-gray-300 rounded overflow-hidden bg-gray-100">
                  <img 
                    src={getCurrentMonthBackground() || '/default/default_no_color.jpg'} 
                    alt="Current month background" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>

            {/* Export Controls */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Export</h3>
              <button
                onClick={handleDownload}
                disabled={isDownloading}
                className="w-full px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isDownloading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Downloading...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download
                  </>
                )}
              </button>
            </div>

          </div>
        </div>

        <div className="lg:col-span-4 bg-white flex items-center justify-center overflow-hidden relative">
          {/* Left Navigation Arrow */}
          <button
            onClick={handlePrevMonth}
            disabled={!canNavigatePrev}
            className={`absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full transition-colors ${canNavigatePrev
              ? 'bg-purple-100 hover:bg-purple-200 text-purple-600 shadow-lg'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
          >
            <ChevronLeft size={24} />
          </button>

          {/* Background Selector Circle */}
          <button
            onClick={() => setShowBackgroundSelector(true)}
            className={`absolute left-4 top-4 z-10 p-3 rounded-full transition-all shadow-lg ${
              getCurrentMonthBackground()
                ? 'bg-green-100 hover:bg-green-200 text-green-600 border-2 border-green-300'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-600 border-2 border-gray-300'
            }`}
            title="Change background for this month"
          >
            <ImageIcon size={20} />
          </button>

          <div className="w-full h-full flex items-center justify-center p-8 overflow-hidden">
            <div className="w-full max-w-4xl aspect-[5/4] px-16" ref={calendarRef}>
              <CalendarGenerator
                template={selectedTemplate}
                fromMonth={fromMonth}
                toMonth={toMonth}
                year={selectedYear}
                backgroundImage={getCurrentMonthBackground()}
                currentViewMonth={currentViewMonth}
                backgroundZoom={backgroundZoom}
                elementId="main-calendar"
              />
            </div>
          </div>

          {/* Right Navigation Arrow */}
          <button
            onClick={handleNextMonth}
            disabled={!canNavigateNext}
            className={`absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full transition-colors ${canNavigateNext
              ? 'bg-purple-100 hover:bg-purple-200 text-purple-600 shadow-lg'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
          >
            <ChevronRight size={24} />
          </button>
        </div>

        <div className="lg:col-span-1 bg-white border-l border-gray-200 overflow-y-auto">
          <div className="p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Templates</h3>
            
            {/* Default Template */}
            <div className="mb-6">
              <button
                onClick={() => setSelectedTemplate('minimal')}
                className={`w-full p-3 rounded-lg border-2 transition-all text-left mb-3 ${
                  ['minimal', 'artistic', 'modern', 'vintage'].includes(selectedTemplate)
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-sm font-medium text-gray-700">Default</div>
                <div className="text-xs text-gray-500 mt-1">Grid calendar layout</div>
              </button>
              
              {/* Color Themes for Default Template */}
              {['minimal', 'artistic', 'modern', 'vintage'].includes(selectedTemplate) && (
                <div className="ml-4 space-y-2">
                  <div className="text-xs font-medium text-gray-600 mb-2">Color Themes:</div>
                  {[
                    { id: 'minimal', name: 'Minimal' },
                    { id: 'artistic', name: 'Artistic' },
                    { id: 'modern', name: 'Modern' },
                    { id: 'vintage', name: 'Vintage' },
                  ].map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => setSelectedTemplate(theme.id)}
                      className={`w-full p-2 rounded border text-left text-sm ${
                        selectedTemplate === theme.id
                          ? 'border-purple-400 bg-purple-100 text-purple-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      {theme.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Circular Template */}
            <div className="mb-4">
              <button
                onClick={() => setSelectedTemplate('circular')}
                className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                  selectedTemplate === 'circular'
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-sm font-medium text-gray-700">Circular</div>
                <div className="text-xs text-gray-500 mt-1">Round mood wheel layout</div>
              </button>
            </div>

            {/* Sunflower Template */}
            <div className="mb-4">
              <button
                onClick={() => setSelectedTemplate('sunflower')}
                className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                  selectedTemplate === 'sunflower'
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-sm font-medium text-gray-700">Sunflower</div>
                <div className="text-xs text-gray-500 mt-1">Sunflower shape with dates embedded</div>
              </button>
            </div>

            {/* Pyramid Template */}
            <div>
              <button
                onClick={() => setSelectedTemplate('pyramid-minimal')}
                className={`w-full p-3 rounded-lg border-2 transition-all text-left mb-3 ${
                  ['pyramid-minimal', 'pyramid-artistic', 'pyramid-modern', 'pyramid-vintage'].includes(selectedTemplate)
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-sm font-medium text-gray-700">Pyramid</div>
                <div className="text-xs text-gray-500 mt-1">Triangular pyramid layout</div>
              </button>
              
              {/* Color Themes for Pyramid Template */}
              {['pyramid-minimal', 'pyramid-artistic', 'pyramid-modern', 'pyramid-vintage'].includes(selectedTemplate) && (
                <div className="ml-4 space-y-2">
                  <div className="text-xs font-medium text-gray-600 mb-2">Color Themes:</div>
                  {[
                    { id: 'pyramid-minimal', name: 'Minimal' },
                    { id: 'pyramid-artistic', name: 'Artistic' },
                    { id: 'pyramid-modern', name: 'Modern' },
                    { id: 'pyramid-vintage', name: 'Vintage' },
                  ].map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => setSelectedTemplate(theme.id)}
                      className={`w-full p-2 rounded border text-left text-sm ${
                        selectedTemplate === theme.id
                          ? 'border-purple-400 bg-purple-100 text-purple-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      {theme.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Download Modal */}
      <DownloadModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        fromMonth={fromMonth}
        toMonth={toMonth}
        year={selectedYear}
        isDownloading={isDownloading}
        onDownload={handleDownloadConfirm}
      />

      {/* Upload Dialog */}
      <UploadDialog
        isOpen={showUploadDialog}
        onClose={() => setShowUploadDialog(false)}
        onImageProcessed={handleBackgroundUpload}
      />

      {/* Download Modal */}
      <DownloadModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        onDownload={handleDownloadConfirm}
        fromMonth={fromMonth}
        toMonth={toMonth}
        year={selectedYear}
        isDownloading={isDownloading}
      />

      {/* Background Selector Modal */}
      {showBackgroundSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Select Background for {['January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'][currentViewMonth]} {selectedYear}
                </h3>
                <button
                  onClick={() => setShowBackgroundSelector(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-96">
              <Gallery 
                onImageSelect={handleMonthBackgroundSelect}
                selectedImageId={null}
                showSelectButtons={true}
                className="h-full"
              />
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowBackgroundSelector(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isDownloading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 text-center max-w-sm mx-4">
            <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Preparing Download</h3>
            <p className="text-gray-600">Please wait while we generate your calendar files...</p>
          </div>
        </div>
      )}
    </div>
  )
}