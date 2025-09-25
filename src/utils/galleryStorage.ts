'use client'

export interface GalleryImage {
  id: string
  name: string
  url: string
  thumbnail: string
  createdAt: Date
  originalFile?: File
}

export interface MonthBackground {
  month: number
  year: number
  imageId: string
}

class GalleryStorageManager {
  private dbName = 'coloring2heal-gallery'
  private version = 1
  private db: IDBDatabase | null = null

  async init(): Promise<void> {
    if (typeof window === 'undefined') return

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Gallery images store
        if (!db.objectStoreNames.contains('images')) {
          const imagesStore = db.createObjectStore('images', { keyPath: 'id' })
          imagesStore.createIndex('createdAt', 'createdAt', { unique: false })
        }

        // Month backgrounds store
        if (!db.objectStoreNames.contains('monthBackgrounds')) {
          const monthStore = db.createObjectStore('monthBackgrounds', { keyPath: ['month', 'year'] })
        }
      }
    })
  }

  async saveImage(file: File, processedUrl: string): Promise<GalleryImage> {
    await this.init()
    if (!this.db) throw new Error('Database not initialized')

    // Use the original processed image as thumbnail for better quality
    const image: GalleryImage = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: file.name,
      url: processedUrl,
      thumbnail: processedUrl, // Use same URL for both
      createdAt: new Date(),
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['images'], 'readwrite')
      const store = transaction.objectStore('images')
      const request = store.add(image)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(image)
    })
  }

  async getAllImages(): Promise<GalleryImage[]> {
    await this.init()
    if (!this.db) return []

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['images'], 'readonly')
      const store = transaction.objectStore('images')
      const index = store.index('createdAt')
      const request = index.getAll()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        // Sort by newest first and filter out blob URLs (which are invalid after page refresh)
        const images = request.result
          .filter((image: GalleryImage) => {
            // Filter out blob URLs as they're no longer valid
            return !image.url.startsWith('blob:')
          })
          .sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
        resolve(images)
      }
    })
  }

  async deleteImage(id: string): Promise<void> {
    await this.init()
    if (!this.db) return

    // Also remove from month backgrounds
    const monthBackgrounds = await this.getAllMonthBackgrounds()
    for (const bg of monthBackgrounds) {
      if (bg.imageId === id) {
        await this.removeMonthBackground(bg.month, bg.year)
      }
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['images'], 'readwrite')
      const store = transaction.objectStore('images')
      const request = store.delete(id)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async setMonthBackground(month: number, year: number, imageId: string): Promise<void> {
    await this.init()
    if (!this.db) return

    const monthBg: MonthBackground = { month, year, imageId }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['monthBackgrounds'], 'readwrite')
      const store = transaction.objectStore('monthBackgrounds')
      const request = store.put(monthBg)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async getMonthBackground(month: number, year: number): Promise<string | null> {
    await this.init()
    if (!this.db) return null

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['monthBackgrounds'], 'readonly')
      const store = transaction.objectStore('monthBackgrounds')
      const request = store.get([month, year])

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const result = request.result
        if (result) {
          resolve(result.imageId)
        } else {
          resolve(null)
        }
      }
    })
  }

  async removeMonthBackground(month: number, year: number): Promise<void> {
    await this.init()
    if (!this.db) return

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['monthBackgrounds'], 'readwrite')
      const store = transaction.objectStore('monthBackgrounds')
      const request = store.delete([month, year])

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async getAllMonthBackgrounds(): Promise<MonthBackground[]> {
    await this.init()
    if (!this.db) return []

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['monthBackgrounds'], 'readonly')
      const store = transaction.objectStore('monthBackgrounds')
      const request = store.getAll()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  }

  async cleanupBlobUrls(): Promise<void> {
    await this.init()
    if (!this.db) return

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['images'], 'readwrite')
      const store = transaction.objectStore('images')
      const request = store.getAll()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const images = request.result
        const blobImages = images.filter(image => image.url.startsWith('blob:'))
        
        let deleteCount = 0
        if (blobImages.length === 0) {
          resolve()
          return
        }

        blobImages.forEach(image => {
          const deleteRequest = store.delete(image.id)
          deleteRequest.onsuccess = () => {
            deleteCount++
            if (deleteCount === blobImages.length) {
              resolve()
            }
          }
          deleteRequest.onerror = () => reject(deleteRequest.error)
        })
      }
    })
  }
}

export const galleryStorage = new GalleryStorageManager()