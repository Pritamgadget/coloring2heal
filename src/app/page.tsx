'use client'

import { useState, useRef } from 'react'
import { CalendarGenerator } from '@/components/CalendarGenerator'
import { DownloadModal } from '@/components/DownloadModal'
import { UploadDialog } from '@/components/UploadDialog'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { downloadCalendar, captureCalendarAsImage, type CalendarData } from '@/utils/downloadUtils'



export default function Home() {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('minimal')
  const [fromMonth, setFromMonth] = useState<number>(new Date().getMonth())
  const [toMonth, setToMonth] = useState<number>(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null)
  const [currentViewMonth, setCurrentViewMonth] = useState<number>(new Date().getMonth())
  const [showDownloadModal, setShowDownloadModal] = useState(false)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const calendarRef = useRef<HTMLDivElement>(null)

  const handleBackgroundUpload = (imageUrl: string) => {
    setBackgroundImage(imageUrl)
  }

  const handleBackgroundRemove = () => {
    setBackgroundImage(null)
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
    
    // Wait for re-render
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
          backgroundImage
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
                <div className="grid grid-cols-1 gap-2">
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
                {backgroundImage && (
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
              
              {/* Background Preview */}
              <div className="mt-3">
                <p className="text-xs font-medium text-gray-600 mb-2">Current Background:</p>
                <div className="w-full h-24 border-2 border-black rounded-lg overflow-hidden bg-gray-50">
                  <img 
                    src={backgroundImage || '/default/default_no_color.jpg'} 
                    alt="Background preview" 
                    className="w-full h-full object-cover border border-black"
                  />
                </div>
              </div>
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

          <div className="w-full h-full flex items-center justify-center p-8 overflow-hidden">
            <div className="w-full max-w-4xl aspect-[5/4] px-16" ref={calendarRef}>
              <CalendarGenerator
                template={selectedTemplate}
                fromMonth={fromMonth}
                toMonth={toMonth}
                year={selectedYear}
                backgroundImage={backgroundImage}
                currentViewMonth={currentViewMonth}
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
            <div>
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