import { useEffect } from 'react'

const STORE_NAME_STORAGE_KEY = 'mobistock_store_name'
const STORE_LOGO_STORAGE_KEY = 'mobistock_store_logo'
const DEFAULT_STORE_NAME = 'MobiStock'

const updateFavicon = (logoUrl: string | null) => {
    console.log('🔄 Updating favicon:', logoUrl ? 'Custom logo' : 'Default favicon')
    
    // Remove existing favicon links
    const existingFavicons = document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"]')
    existingFavicons.forEach(favicon => favicon.remove())

    if (logoUrl) {
        // Create new favicon link
        const favicon = document.createElement('link')
        favicon.rel = 'icon'
        favicon.href = logoUrl
        favicon.type = 'image/x-icon'
        document.head.appendChild(favicon)

        // Also create shortcut icon
        const shortcutIcon = document.createElement('link')
        shortcutIcon.rel = 'shortcut icon'
        shortcutIcon.href = logoUrl
        document.head.appendChild(shortcutIcon)
    } else {
        // Reset to default favicon
        const defaultFavicon = document.createElement('link')
        defaultFavicon.rel = 'icon'
        defaultFavicon.href = '/favicon.ico'
        document.head.appendChild(defaultFavicon)
    }
}

const updatePageTitle = (storeName: string | null) => {
    const title = storeName || DEFAULT_STORE_NAME
    console.log('🔄 Updating page title:', title)
    console.log('📝 Current title before update:', document.title)
    
    // Method 1: Direct title assignment
    document.title = title
    
    // Method 2: Update meta title tag if it exists
    const titleMeta = document.querySelector('meta[property="og:title"]') as HTMLMetaElement
    if (titleMeta) {
        titleMeta.content = title
        console.log('📝 Updated meta title tag')
    }
    
    // Method 3: Create meta title tag if it doesn't exist
    if (!titleMeta) {
        const metaTitle = document.createElement('meta')
        metaTitle.property = 'og:title'
        metaTitle.content = title
        document.head.appendChild(metaTitle)
        console.log('📝 Created meta title tag')
    }
    
    // Verify it was set
    console.log('📝 Current title after update:', document.title)
    
    // Also try to set it again after delays to ensure it sticks
    setTimeout(() => {
        document.title = title
        console.log('🔄 Title re-applied after 100ms:', document.title)
    }, 100)
    
    setTimeout(() => {
        document.title = title
        console.log('🔄 Title re-applied after 500ms:', document.title)
    }, 500)
    
    setTimeout(() => {
        document.title = title
        console.log('🔄 Title re-applied after 1000ms:', document.title)
    }, 1000)
}

export const useAppSettings = () => {
    useEffect(() => {
        // Ensure we're on client side
        if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
            console.log('⚠️ Not on client side, skipping app settings')
            return
        }

        const applySettings = () => {
            try {
                // Get settings from localStorage
                const storeName = localStorage.getItem(STORE_NAME_STORAGE_KEY)
                const storeLogo = localStorage.getItem(STORE_LOGO_STORAGE_KEY)
                
                console.log('📱 Reading settings from localStorage:')
                console.log('  - Store Name:', storeName || 'Not set')
                console.log('  - Store Logo:', storeLogo ? 'Set' : 'Not set')

                // Update page title
                updatePageTitle(storeName)

                // Update favicon
                updateFavicon(storeLogo)
            } catch (error) {
                console.error('❌ Error applying app settings:', error)
            }
        }

        // Apply settings immediately
        applySettings()

        // Listen for settings updates
        const handleSettingsUpdate = () => {
            console.log('📢 Settings update event received')
            applySettings()
        }

        // Add event listener for settings updates
        window.addEventListener('mobistock_store_config_updated', handleSettingsUpdate)

        // Cleanup
        return () => {
            window.removeEventListener('mobistock_store_config_updated', handleSettingsUpdate)
        }
    }, [])

    // Return the current settings for reference
    const getCurrentSettings = () => {
        if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
            return {
                storeName: DEFAULT_STORE_NAME,
                storeLogo: null
            }
        }
        
        try {
            return {
                storeName: localStorage.getItem(STORE_NAME_STORAGE_KEY) || DEFAULT_STORE_NAME,
                storeLogo: localStorage.getItem(STORE_LOGO_STORAGE_KEY)
            }
        } catch (error) {
            console.error('❌ Error getting current settings:', error)
            return {
                storeName: DEFAULT_STORE_NAME,
                storeLogo: null
            }
        }
    }

    return { getCurrentSettings }
}
