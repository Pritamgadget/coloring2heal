'use client'

import { useMemo } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns'
import { SunflowerClipPath, SUNFLOWER_VIEWBOX_30, SUNFLOWER_VIEWBOX_31 } from '@/utils/custom_clipping_paths'

interface CalendarGeneratorProps {
  template: string
  fromMonth: number
  toMonth: number
  year: number
  backgroundImage?: string | null
  currentViewMonth?: number
  backgroundZoom?: number
  elementId?: string
}



export function CalendarGenerator({ template, fromMonth, toMonth, year, backgroundImage, currentViewMonth = fromMonth, backgroundZoom = 100, elementId = "calendar-container" }: CalendarGeneratorProps) {

  const calendarData = useMemo(() => {
    const date = new Date(year, currentViewMonth, 1)
    const monthStart = startOfMonth(date)
    const monthEnd = endOfMonth(date)
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

    // Get the first day of the week (0 = Sunday, 1 = Monday, etc.)
    const firstDayOfWeek = getDay(monthStart)

    // Create empty cells for days before the month starts
    const emptyDaysStart = Array(firstDayOfWeek).fill(null)

    // Calculate total cells needed (always 42 for 6 rows x 7 days)
    const totalCells = 42
    const filledCells = emptyDaysStart.length + days.length
    const emptyDaysEnd = Array(totalCells - filledCells).fill(null)

    return {
      monthName: format(date, 'MMMM yyyy'),
      days: [...emptyDaysStart, ...days, ...emptyDaysEnd],
      daysInMonth: days.length
    }
  }, [currentViewMonth, year])



  const getTemplateStyles = () => {
    switch (template) {
      case 'minimal':
        return {
          container: 'bg-white border border-black',
          header: 'bg-gray-50 text-gray-900 font-medium',
          day: 'hover:bg-transparent text-black',
          today: 'bg-transparent text-black'
        }
      case 'artistic':
        return {
          container: 'bg-transparent border border-purple-200',
          header: 'bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold',
          day: 'hover:bg-transparent text-black',
          today: 'bg-transparent text-black font-bold'
        }
      case 'modern':
        return {
          container: 'bg-transparent border border-gray-700',
          header: 'bg-gray-800 text-gray-100 font-semibold',
          day: 'hover:bg-transparent text-black',
          today: 'bg-transparent text-black'
        }
      case 'vintage':
        return {
          container: 'bg-transparent border-2 border-amber-200',
          header: 'bg-amber-200 text-amber-900 font-serif font-bold',
          day: 'hover:bg-transparent text-black',
          today: 'bg-transparent text-black font-bold'
        }
      case 'circular':
        return {
          container: 'bg-gradient-to-br from-blue-50 to-indigo-100 border-2 border-blue-200',
          header: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold',
          day: 'hover:bg-transparent text-black',
          today: 'bg-transparent text-black font-bold'
        }
      case 'sunflower':
        return {
          container: 'bg-transparent',
          header: 'bg-transparent text-black font-bold',
          day: 'hover:bg-transparent text-black',
          today: 'bg-transparent text-black font-bold'
        }
      case 'pyramid-minimal':
      case 'pyramid-artistic':
      case 'pyramid-modern':
      case 'pyramid-vintage':
        return {
          container: 'bg-transparent',
          header: 'bg-transparent text-black font-bold',
          day: 'hover:bg-transparent text-black',
          today: 'bg-transparent text-black font-bold'
        }
      default:
        return {
          container: 'bg-white border border-black',
          header: 'bg-gray-50 text-gray-900 font-medium',
          day: 'hover:bg-transparent text-black',
          today: 'bg-transparent text-black'
        }
    }
  }

  const styles = getTemplateStyles()
  const today = new Date()

  // Sunflower template layout
  if (template === 'sunflower') {
    return (
      <div id={elementId} className="w-full h-full flex items-center justify-center bg-transparent">
        <div className="relative w-[800px] h-[800px]">
          {/* Background image clipped by sunflower shape - LOWEST LAYER */}
          <div className="absolute inset-0 pointer-events-none">
            <svg className="w-full h-full" viewBox={calendarData.daysInMonth === 30 ? SUNFLOWER_VIEWBOX_30 : SUNFLOWER_VIEWBOX_31} preserveAspectRatio="xMidYMid meet">
              <defs>
                <SunflowerClipPath daysInMonth={calendarData.daysInMonth} />
              </defs>
              <image
                href={backgroundImage || '/default/default_no_color.jpg'}
                x="-0.07"
                y="15.78"
                width={817.82 * (backgroundZoom / 100)}
                height={796.41 * (backgroundZoom / 100)}
                preserveAspectRatio="xMidYMid slice"
                clipPath="url(#sunflower-clip)"
              />
            </svg>
          </div>

          {/* Sunflower SVG with dates - TOP LAYER */}
          <div className="absolute inset-0 pointer-events-none">
            <object
              data={`/templates/${calendarData.daysInMonth}days_sunflower.svg`}
              type="image/svg+xml"
              className="w-full h-full"
              style={{ pointerEvents: 'none' }}
            />
          </div>

          {/* Month/Year display - CENTER OVERLAY */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
            <div className="bg-white/60 backdrop-blur-sm rounded-full w-32 h-32 flex flex-col items-center justify-center shadow-lg border border-white/50">
              <h3 className="text-lg font-bold text-black">
                {format(new Date(year, currentViewMonth), 'MMM')}
              </h3>
              <p className="text-sm text-black">{year}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Circular template layout - Mood Wheel Calendar
  if (template === 'circular') {
    // Filter out null days and get only actual dates
    const actualDays = calendarData.days.filter(day => day !== null)
    const totalDays = actualDays.length

    return (
      <div id={elementId} className="w-full h-full flex items-center justify-center">
        <div className="relative w-[700px] h-[700px]">
          {/* Background image with full opacity - LOWEST LAYER */}
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'url(/default/default_no_color.jpg)',
              backgroundSize: `${backgroundZoom}%`,
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              clipPath: 'circle(340px at center)'
            }}
          />

          {/* SVG for pie slices - MIDDLE LAYER */}
          <svg className="w-full h-full transform -rotate-90 relative z-10" viewBox="0 0 700 700">
            {/* Background circle */}
            <circle
              cx="350"
              cy="350"
              r="340"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="3"
            />

            {/* Pie slices for each day */}
            {actualDays.map((day, index) => {
              const isToday = day.getDate() === today.getDate() &&
                day.getMonth() === today.getMonth() &&
                day.getFullYear() === today.getFullYear()

              // Calculate slice angles
              const sliceAngle = 360 / totalDays
              const startAngle = index * sliceAngle
              const endAngle = (index + 1) * sliceAngle

              // Convert to radians
              const startRad = (startAngle * Math.PI) / 180
              const endRad = (endAngle * Math.PI) / 180

              // Calculate path coordinates
              const centerX = 350
              const centerY = 350
              const outerRadius = 340
              const innerRadius = 0

              const x1 = centerX + Math.cos(startRad) * innerRadius
              const y1 = centerY + Math.sin(startRad) * innerRadius
              const x2 = centerX + Math.cos(startRad) * outerRadius
              const y2 = centerY + Math.sin(startRad) * outerRadius
              const x3 = centerX + Math.cos(endRad) * outerRadius
              const y3 = centerY + Math.sin(endRad) * outerRadius
              const x4 = centerX + Math.cos(endRad) * innerRadius
              const y4 = centerY + Math.sin(endRad) * innerRadius

              const largeArcFlag = sliceAngle > 180 ? 1 : 0

              const pathData = [
                `M ${x1} ${y1}`,
                `L ${x2} ${y2}`,
                `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x3} ${y3}`,
                `L ${x4} ${y4}`,
                `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x1} ${y1}`,
                'Z'
              ].join(' ')

              // Default color - completely transparent so background shows through at full opacity
              const dayColor = 'rgba(255, 255, 255, 0)' // fully transparent for all days

              return (
                <g key={day.toISOString()}>
                  {/* Pie slice */}
                  <path
                    d={pathData}
                    fill={dayColor}
                    stroke="grey"
                    strokeWidth="0.5"
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => {
                      // Future: Open color picker for mood selection
                      console.log(`Clicked day ${day.getDate()}`)
                    }}
                  />

                  {/* Day number - positioned on outer edge */}
                  <text
                    x={centerX + Math.cos((startRad + endRad) / 2) * (outerRadius - 25)}
                    y={centerY + Math.sin((startRad + endRad) / 2) * (outerRadius - 25)}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-black text-sm font-bold pointer-events-none drop-shadow-lg"
                    transform={`rotate(90 ${centerX + Math.cos((startRad + endRad) / 2) * (outerRadius - 25)} ${centerY + Math.sin((startRad + endRad) / 2) * (outerRadius - 25)})`}
                  >
                    {day.getDate()}
                  </text>
                </g>
              )
            })}
          </svg>

          {/* Center content - TOP LAYER with semi-transparent background */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <div className="text-center bg-white/70 backdrop-blur-sm rounded-full w-28 h-28 flex flex-col items-center justify-center shadow-lg">
              <h3 className="text-lg font-bold text-gray-800">
                {format(new Date(year, currentViewMonth), 'MMM')}
              </h3>
              <p className="text-sm text-gray-600">{year}</p>
            </div>
          </div>

        </div>
      </div>
    )
  }

  // Pyramid template layout - Triangular Calendar
  if (template === 'pyramid-minimal' || template === 'pyramid-artistic' || 
      template === 'pyramid-modern' || template === 'pyramid-vintage') {
    // Filter out null days and get only actual dates
    const actualDays = calendarData.days.filter(day => day !== null)
    const totalDays = actualDays.length

    // Create pyramid rows - we'll arrange days in a triangular pattern
    const pyramidRows = []
    let dayIndex = 0
    
    // Calculate how many rows we need for a pyramid
    // For 28-31 days, we'll use 7-8 rows with varying widths
    const maxRowWidth = Math.ceil(Math.sqrt(totalDays * 2)) // Approximate base width
    
    for (let row = 0; row < maxRowWidth && dayIndex < totalDays; row++) {
      const daysInThisRow = Math.min(row + 1, totalDays - dayIndex)
      const rowDays = actualDays.slice(dayIndex, dayIndex + daysInThisRow)
      pyramidRows.push(rowDays)
      dayIndex += daysInThisRow
    }

    return (
      <div id={elementId} className="w-full h-full flex items-center justify-center">
        <div className="relative w-[600px] h-[600px]">
          {/* Background image with triangular clip */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'url(/default/default_no_color.jpg)',
              backgroundSize: `${backgroundZoom}%`,
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              clipPath: 'polygon(50% 5%, 5% 98%, 95% 98%)'
            }}
          />

          {/* Pyramid structure */}
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-2 z-10">
            {/* Pyramid rows */}
            {pyramidRows.map((rowDays, rowIndex) => (
              <div key={rowIndex} className="flex" style={{
                marginTop: rowIndex === 0 ? '20px' : '0px'
              }}>
                {rowDays.map((day, dayIndex) => {
                  return (
                    <div
                      key={day.toISOString()}
                      className={`
                        w-[72px] h-[72px] 
                        relative
                        cursor-pointer 
                        transition-all duration-200 
                        transform hover:scale-105
                      `}
                      style={{
                        marginLeft: dayIndex > 0 ? '-2px' : '0px'
                      }}
                      onClick={() => {
                        console.log(`Clicked pyramid day ${day.getDate()}`)
                      }}
                    >
                      <svg 
                        className="w-full h-full absolute inset-0" 
                        viewBox="0 0 72 72"
                      >
                        {/* Triangle fill */}
                        <polygon
                          points="36,3 3,68 68,68"
                          fill="rgba(255, 255, 255, 0.2)"
                          className="hover:fill-white/40 transition-all duration-200"
                        />
                        {/* Triangle border */}
                        <polygon
                          points="36,3 3,68 68,68"
                          fill="none"
                          stroke="black"
                          strokeWidth="1"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="text-sm font-bold text-black drop-shadow-sm">
                          {day.getDate()}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}

          </div>

          {/* Decorative border */}
          <div 
            className="absolute inset-0 pointer-events-none border-2 border-amber-600"
            style={{
              clipPath: 'polygon(50% 5%, 5% 98%, 95% 98%)'
            }}
          />

          {/* Month/Year display at the bottom - touching triangle base */}
          <div className="absolute left-1/2 transform -translate-x-1/2" style={{ top: '100%' }}>
            <div 
              className={`text-center border-2 ${
                template === 'pyramid-minimal' ? 'bg-black text-white border-black' :
                template === 'pyramid-artistic' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white border-purple-600' :
                template === 'pyramid-modern' ? 'bg-gray-800 text-gray-100 border-gray-700' :
                template === 'pyramid-vintage' ? 'bg-amber-200 text-amber-900 border-amber-400' :
                'bg-black text-white border-black' // fallback
              }`}
              style={{
                width: '540px', // Matches the triangle base width (90% of 600px container)
              }}
            >
              <h3 className={`text-xl ${
                template === 'pyramid-vintage' ? 'font-serif font-bold' : 'font-bold'
              }`}>
                {format(new Date(year, currentViewMonth), 'MMMM yyyy')}
              </h3>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Regular grid layout for other templates
  return (
    <div className={`rounded-xl overflow-hidden w-full h-full flex flex-col ${styles.container}`} id={elementId}>
      {/* Month Name Header */}
      <div className={`${styles.header} p-3 text-center border-b border-black flex-shrink-0`}>
        <h2 className="text-xl font-bold">{calendarData.monthName}</h2>
      </div>

      {/* Calendar Header */}
      <div className={`grid grid-cols-7 ${styles.header} flex-shrink-0`}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="p-3 text-center text-sm font-medium">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div
        className="grid grid-cols-7 grid-rows-6 relative overflow-hidden flex-1"
        style={{
          backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'url(/default/default_no_color.jpg)',
          backgroundSize: `${backgroundZoom}%`,
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >


        {calendarData.days.map((day, index) => {
          if (!day) {
            return <div key={index} className="w-full h-full p-2 relative z-10 border-b border-r border-black"></div>
          }

          const isToday = day.getDate() === today.getDate() &&
            day.getMonth() === today.getMonth() &&
            day.getFullYear() === today.getFullYear()

          return (
            <div
              key={day.toISOString()}
              className={`w-full h-full p-2 transition-colors relative z-10 hover:bg-white/20 border-b border-r border-black ${isToday ? 'font-bold' : ''}`}
            >
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-lg font-medium text-black">
                  {day.getDate()}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}