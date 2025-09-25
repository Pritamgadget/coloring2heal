'use client'

export function Header() {
  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg"></div>
            <span className="text-xl font-bold text-gray-900">Coloring2Heal</span>
          </div>
          
          <nav className="hidden md:flex items-center space-x-6">
            <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Templates</a>
            <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Gallery</a>
            <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">About</a>
          </nav>
        </div>
      </div>
    </header>
  )
}