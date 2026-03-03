/**
 * Lightweight IndexedDB Manager for storing audio blobs and project assets.
 * Ensures persistence for binary data that cannot be saved in localStorage.
 */
export class IndexedDbManager {
    private dbName = 'StudioEliteV5_Assets'
    private storeName = 'audio_blobs'
    private db: IDBDatabase | null = null

    async init(): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 1)
            request.onerror = () => reject(new Error(`Failed to open IndexedDB: ${request.error?.message}`))
            request.onsuccess = () => {
                this.db = request.result
                resolve()
            }
            request.onupgradeneeded = (event: any) => {
                const db = event.target.result
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName)
                }
            }
        })
    }

    private async ensureInited() {
        if (!this.db) await this.init()
    }

    async saveBlob(id: string, blob: Blob): Promise<void> {
        await this.ensureInited()
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([this.storeName], 'readwrite')
            const store = transaction.objectStore(this.storeName)
            const request = store.put(blob, id)
            request.onsuccess = () => resolve()
            request.onerror = () => reject(new Error(`Error saving blob "${id}": ${request.error?.message}`))
        })
    }

    async getBlob(id: string): Promise<Blob | null> {
        await this.ensureInited()
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([this.storeName], 'readonly')
            const store = transaction.objectStore(this.storeName)
            const request = store.get(id)
            request.onsuccess = () => resolve(request.result || null)
            request.onerror = () => reject(new Error(`Error getting blob "${id}": ${request.error?.message}`))
        })
    }

    async deleteBlob(id: string): Promise<void> {
        await this.ensureInited()
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([this.storeName], 'readwrite')
            const store = transaction.objectStore(this.storeName)
            const request = store.delete(id)
            request.onsuccess = () => resolve()
            request.onerror = () => reject(new Error(`Error deleting blob "${id}": ${request.error?.message}`))
        })
    }

    async clearAll(): Promise<void> {
        await this.ensureInited()
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([this.storeName], 'readwrite')
            const store = transaction.objectStore(this.storeName)
            const request = store.clear()
            request.onsuccess = () => resolve()
            request.onerror = () => reject(new Error(`Error clearing store: ${request.error?.message}`))
        })
    }
}

export const indexedDbManager = new IndexedDbManager()
