import { TRUST_OVERVIEW_MOCK } from '../mocks/trustOverviewMock.js';

/**
 * Trust overview for Admin dashboard.
 * TODO(BE): GET /api/v1/admin/dashboard/trust-overview — set USE_MOCK = false when ready.
 */
const USE_MOCK = true;

const delay = (ms = 280) => new Promise((resolve) => setTimeout(resolve, ms));

export const getTrustOverview = async () => {
    if (USE_MOCK) {
        await delay();
        return { data: { data: { ...TRUST_OVERVIEW_MOCK } } };
    }
    // Reserved for real axios call.
    throw new Error('TRUST_OVERVIEW_API_NOT_WIRED');
};
