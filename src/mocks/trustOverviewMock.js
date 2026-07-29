/**
 * FE-only mock for Trust & Verification overview (dashboard demo).
 * TODO: replace with GET /api/v1/admin/dashboard/trust-overview when BE is ready.
 * Thresholds live in this payload — do not hardcode in UI components.
 */
export const TRUST_OVERVIEW_MOCK = {
    verifiedBusinessCount: 42,
    pendingBusinessVerificationCount: 5,
    pendingCandidateVerificationCount: 8,
    verificationOverdueCount: null,
    averageBusinessTrustScore: 81.4,
    businessBelowThresholdCount: 3,
    confirmedScamRestrictionCount: 1,
    manualReviewRequiredCount: 5,
    activeWarningThreshold: 70,
    lastUpdatedAt: new Date().toISOString(),
    _source: 'MOCK',
};
