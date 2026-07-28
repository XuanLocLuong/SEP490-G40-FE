/** Shared stacking for chat dock vs header popovers (noti / avatar). */

const BASE = 300;
let ticket = 0;

export const OVERLAY_CSS = {
    HEADER: '--overlay-z-header',
    CHAT: '--overlay-z-chat',
};

const DEFAULTS = {
    [OVERLAY_CSS.HEADER]: 100,
    [OVERLAY_CSS.CHAT]: 240,
};

/** @returns {number} next z-index (always increases) */
export const claimOverlayZ = () => {
    ticket += 1;
    return BASE + ticket * 10;
};

/**
 * Raise a global overlay layer (CSS variable on :root).
 * Call when opening/focusing that surface so it stacks above others.
 * @param {string} cssVar
 * @returns {number}
 */
export const elevateOverlay = (cssVar) => {
    const z = claimOverlayZ();
    if (typeof document !== 'undefined') {
        document.documentElement.style.setProperty(cssVar, String(z));
    }
    return z;
};

/** Restore default z-index for a layer. */
export const resetOverlay = (cssVar) => {
    if (typeof document === 'undefined') return;
    const fallback = DEFAULTS[cssVar];
    if (fallback == null) {
        document.documentElement.style.removeProperty(cssVar);
        return;
    }
    document.documentElement.style.setProperty(cssVar, String(fallback));
};
