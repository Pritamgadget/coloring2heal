'use client'

import { useState } from 'react'
import { Download, X, FileImage, FileText } from 'lucide-react'

interface DownloadModalProps {
  isOpen: boolean
  onClose: () => void
  fromMonth: number
  toMonth: number
  year: number
  isDownloading?: boolean
  onDownload: (options: {
    format: 'png' | 'pdf'
    includeAllMonths: boolean
  }) => void
}

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export function DownloadModal({ isOpen, onClose, fromMonth, toMonth, year, isDownloading = false, onDownload }: DownloadModalProps) {
  const [format, setFormat] = useState<'png' | 'pdf'>('png')
  const [includeAllMonths, setIncludeAllMonths] = useState(false)

  if (!isOpen) return null

  const hasRange = fromMonth !== toMonth
  const getMonthName = (monthIndex: number) => months[monthIndex]

  const handleDownload = () => {
    onDownload({ format, includeAllMonths })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Download Calendar</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Format Selection */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">File Format</h4>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setFormat('png')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  format === 'png'
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                <FileImage className="w-6 h-6 mx-auto mb-1" />
                <div className="text-sm font-medium">PNG</div>
                <div className="text-xs text-gray-500">Image file</div>
              </button>
              <button
                onClick={() => setFormat('pdf')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  format === 'pdf'
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                <FileText className="w-6 h-6 mx-auto mb-1" />
                <div className="text-sm font-medium">PDF</div>
                <div className="text-xs text-gray-500">Document file</div>
              </button>
            </div>
          </div>

          {/* Range Selection */}
          {hasRange && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Download Range</h4>
              <div className="space-y-3">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="range"
                    checked={!includeAllMonths}
                    onChange={() => setIncludeAllMonths(false)}
                    className="text-purple-600 focus:ring-purple-500"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-700">Current Month Only</div>
                    <div className="text-xs text-gray-500">Download just the currently visible month</div>
                  </div>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="range"
                    checked={includeAllMonths}
                    onChange={() => setIncludeAllMonths(true)}
                    className="text-purple-600 focus:ring-purple-500"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-700">All Months in Range</div>
                    <div className="text-xs text-gray-500">
                      {getMonthName(fromMonth)} to {getMonthName(toMonth)} {year}
                      {format === 'png' && includeAllMonths && ' (separate files)'}
                      {format === 'pdf' && includeAllMonths && ' (combined PDF)'}
                    </div>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Download Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h5 className="text-sm font-medium text-gray-700 mb-2">Download Summary</h5>
            <div className="text-sm text-gray-600 space-y-1">
              <div>Format: <span className="font-medium">{format.toUpperCase()}</span></div>
              <div>
                Range: <span className="font-medium">
                  {hasRange && includeAllMonths 
                    ? `${getMonthName(fromMonth)} - ${getMonthName(toMonth)} ${year}`
                    : `${getMonthName(fromMonth)} ${year}`
                  }
                </span>
              </div>
              {hasRange && includeAllMonths && (
                <div>
                  Files: <span className="font-medium">
                    {format === 'pdf' ? '1 PDF file' : `${Math.abs(toMonth - fromMonth) + 1} PNG files`}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={isDownloading}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isDownloading ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Preparing...</span>
              </>
            ) : (
              <>
                <Download size={16} />
                <span>Download</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}