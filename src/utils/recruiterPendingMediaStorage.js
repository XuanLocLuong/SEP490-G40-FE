const DB_NAME = 'joblink.recruiterPendingMedia.v1';
const STORE = 'byUser';
const DB_VERSION = 1;

const openDb = () =>
    new Promise((resolve, reject) => {
        if (typeof indexedDB === 'undefined') {
            reject(new Error('IndexedDB unavailable'));
            return;
        }
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(STORE)) {
                db.createObjectStore(STORE);
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error || new Error('IndexedDB open failed'));
    });

const reqToPromise = (request) =>
    new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error || new Error('IndexedDB request failed'));
    });

const fileToRecord = (file) => ({
    name: file.name,
    type: file.type || 'application/octet-stream',
    lastModified: file.lastModified || Date.now(),
    blob: file,
});

const recordToFile = (record) => {
    if (!record?.blob) return null;
    return new File([record.blob], record.name || 'image', {
        type: record.type || 'application/octet-stream',
        lastModified: record.lastModified || Date.now(),
    });
};

/**
 * @returns {Promise<{ logoFile: File|null, galleryFiles: File[] }>}
 */
export const loadPendingMedia = async (userKey) => {
    if (userKey == null || userKey === '') {
        return { logoFile: null, galleryFiles: [] };
    }
    try {
        const db = await openDb();
        const tx = db.transaction(STORE, 'readonly');
        const row = await reqToPromise(tx.objectStore(STORE).get(String(userKey)));
        db.close();
        if (!row) return { logoFile: null, galleryFiles: [] };
        return {
            logoFile: row.logo ? recordToFile(row.logo) : null,
            galleryFiles: Array.isArray(row.gallery)
                ? row.gallery.map(recordToFile).filter(Boolean)
                : [],
        };
    } catch {
        return { logoFile: null, galleryFiles: [] };
    }
};

/**
 * @param {string|number} userKey
 * @param {{ logoFile?: File|null, galleryFiles?: File[] }} media
 */
export const savePendingMedia = async (userKey, { logoFile = null, galleryFiles = [] } = {}) => {
    if (userKey == null || userKey === '') return;
    const key = String(userKey);
    const hasLogo = Boolean(logoFile);
    const gallery = Array.isArray(galleryFiles) ? galleryFiles.filter(Boolean) : [];

    try {
        const db = await openDb();
        const tx = db.transaction(STORE, 'readwrite');
        const store = tx.objectStore(STORE);
        if (!hasLogo && gallery.length === 0) {
            await reqToPromise(store.delete(key));
        } else {
            await reqToPromise(
                store.put(
                    {
                        logo: hasLogo ? fileToRecord(logoFile) : null,
                        gallery: gallery.map(fileToRecord),
                        updatedAt: Date.now(),
                    },
                    key
                )
            );
        }
        await new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
            tx.onabort = () => reject(tx.error);
        });
        db.close();
    } catch {
        // private mode / quota — bỏ qua, vẫn dùng state trong phiên
    }
};

export const clearPendingMedia = async (userKey) => {
    if (userKey == null || userKey === '') return;
    try {
        const db = await openDb();
        const tx = db.transaction(STORE, 'readwrite');
        await reqToPromise(tx.objectStore(STORE).delete(String(userKey)));
        await new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
            tx.onabort = () => reject(tx.error);
        });
        db.close();
    } catch {
        // ignore
    }
};
