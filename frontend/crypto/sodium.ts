import _sodium from 'libsodium-wrappers-sumo';

let sodiumInstance: typeof _sodium | null = null;
let sodiumPromise: Promise<typeof _sodium> | null = null;

/**
 * Get initialized sodium instance
 * This ensures sodium is loaded and ready before use
 */
export async function getSodium(): Promise<typeof _sodium> {
    if (sodiumInstance) {
        return sodiumInstance;
    }
    
    if (sodiumPromise) {
        return sodiumPromise;
    }
    
    sodiumPromise = (async () => {
        await _sodium.ready;
        sodiumInstance = _sodium;
        return _sodium;
    })();
    
    return sodiumPromise;
}

/**
 * Reset sodium instance (useful for testing)
 */
export function resetSodium() {
    sodiumInstance = null;
    sodiumPromise = null;
}
