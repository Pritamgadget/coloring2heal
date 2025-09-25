import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { format } from 'date-fns'

export interface DownloadOptions {
  format: 'png' | 'pdf'
  includeAllMonths: boolean
  fromMonth: number
  toMonth: number
  year: number
  template: string
  backgroundImage?: string | null
}

export interface CalendarData {
  month: number
  year: number
  template: string
  backgroundImage?: string | null
}

// Function to capture a single calendar element as image
export const captureCalendarAsImage = async (element: HTMLElement): Promise<string> => {
  try {
    // Wait a bit for any animations or loading to complete
    await new Promise(resolve => setTimeout(resolve, 100))
    
    const canvas = await html2canvas(element, {
      useCORS: true,
      allowTaint: true,
      scale: 2, // Moderate scale for good quality without issues
      backgroundColor: '#ffffff',
      logging: true, // Enable logging to debug issues
      height: element.offsetHeight,
      width: element.offsetWidth,
    } as any)
    
    if (canvas.width === 0 || canvas.height === 0) {
      throw new Error('Canvas has zero dimensions')
    }
    
    return canvas.toDataURL('image/png', 0.95) // High quality but not maximum to avoid issues
  } catch (error) {
    console.error('Error capturing calendar:', error)
    console.error('Element dimensions:', element.offsetWidth, 'x', element.offsetHeight)
    throw new Error('Failed to capture calendar image')
  }
}

// Function to download a single image
export const downloadImage = (dataUrl: string, filename: string) => {
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Function to generate PDF with multiple calendars
export const generateMultiCalendarPDF = async (
  calendars: CalendarData[],
  captureCalendar: (calendarData: CalendarData) => Promise<string>
): Promise<void> => {
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
    compress: true,
    precision: 16
  })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 10

  for (let i = 0; i < calendars.length; i++) {
    if (i > 0) {
      pdf.addPage()
    }

    try {
      const imageDataUrl = await captureCalendar(calendars[i])
      
      // Calculate dimensions to fit the page while maintaining aspect ratio
      const img = new Image()
      img.src = imageDataUrl
      
      await new Promise((resolve) => {
        img.onload = resolve
      })

      const aspectRatio = img.width / img.height
      let imgWidth = pageWidth - (margin * 2)
      let imgHeight = imgWidth / aspectRatio

      // If height is too large, adjust based on height
      if (imgHeight > pageHeight - (margin * 2)) {
        imgHeight = pageHeight - (margin * 2)
        imgWidth = imgHeight * aspectRatio
      }

      const x = (pageWidth - imgWidth) / 2
      const y = (pageHeight - imgHeight) / 2

      // Add image with high quality settings
      pdf.addImage(
        imageDataUrl, 
        'PNG', 
        x, 
        y, 
        imgWidth, 
        imgHeight,
        undefined, // alias
        'FAST' // compression type for better quality
      )
      
    } catch (error) {
      console.error(`Error adding calendar ${i + 1} to PDF:`, error)
    }
  }

  const filename = `calendars_${calendars[0].year}_${format(new Date(calendars[0].year, calendars[0].month), 'MMM')}_to_${format(new Date(calendars[calendars.length - 1].year, calendars[calendars.length - 1].month), 'MMM')}.pdf`
  pdf.save(filename)
}

// Function to get calendar months in range
export const getCalendarMonthsInRange = (fromMonth: number, toMonth: number, year: number): CalendarData[] => {
  const calendars: CalendarData[] = []
  
  if (fromMonth <= toMonth) {
    // Same year range
    for (let month = fromMonth; month <= toMonth; month++) {
      calendars.push({ month, year, template: '', backgroundImage: null })
    }
  } else {
    // Cross year range (e.g., Oct to Feb)
    for (let month = fromMonth; month <= 11; month++) {
      calendars.push({ month, year, template: '', backgroundImage: null })
    }
    for (let month = 0; month <= toMonth; month++) {
      calendars.push({ month, year: year + 1, template: '', backgroundImage: null })
    }
  }
  
  return calendars
}

// Main download function
export const downloadCalendar = async (options: DownloadOptions, captureFunction: (calendarData: CalendarData) => Promise<string>) => {
  try {
    if (options.includeAllMonths && options.fromMonth !== options.toMonth) {
      // Download multiple months as PDF
      const calendars = getCalendarMonthsInRange(options.fromMonth, options.toMonth, options.year)
      calendars.forEach(calendar => {
        calendar.template = options.template
        calendar.backgroundImage = options.backgroundImage
      })
      
      if (options.format === 'pdf') {
        await generateMultiCalendarPDF(calendars, captureFunction)
      } else {
        // Download each month as separate PNG
        for (let i = 0; i < calendars.length; i++) {
          const imageDataUrl = await captureFunction(calendars[i])
          const monthName = format(new Date(calendars[i].year, calendars[i].month), 'yyyy_MM_MMMM')
          downloadImage(imageDataUrl, `calendar_${monthName}.png`)
          
          // Add small delay between downloads to prevent browser blocking
          if (i < calendars.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500))
          }
        }
      }
    } else {
      // Download single month
      const calendarData: CalendarData = {
        month: options.fromMonth,
        year: options.year,
        template: options.template,
        backgroundImage: options.backgroundImage
      }
      
      const imageDataUrl = await captureFunction(calendarData)
      const monthName = format(new Date(options.year, options.fromMonth), 'yyyy_MM_MMMM')
      
      if (options.format === 'pdf') {
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'mm',
          format: 'a4',
          compress: true,
          precision: 16
        })
        const pageWidth = pdf.internal.pageSize.getWidth()
        const pageHeight = pdf.internal.pageSize.getHeight()
        const margin = 10
        
        const img = new Image()
        img.src = imageDataUrl
        
        await new Promise((resolve) => {
          img.onload = resolve
        })
        
        const aspectRatio = img.width / img.height
        let imgWidth = pageWidth - (margin * 2)
        let imgHeight = imgWidth / aspectRatio
        
        if (imgHeight > pageHeight - (margin * 2)) {
          imgHeight = pageHeight - (margin * 2)
          imgWidth = imgHeight * aspectRatio
        }
        
        const x = (pageWidth - imgWidth) / 2
        const y = (pageHeight - imgHeight) / 2
        
        // Add image with high quality settings
        pdf.addImage(
          imageDataUrl, 
          'PNG', 
          x, 
          y, 
          imgWidth, 
          imgHeight,
          undefined, // alias
          'FAST' // compression type for better quality
        )
        pdf.save(`calendar_${monthName}.pdf`)
      } else {
        downloadImage(imageDataUrl, `calendar_${monthName}.png`)
      }
    }
  } catch (error) {
    console.error('Download failed:', error)
    throw error
  }
}