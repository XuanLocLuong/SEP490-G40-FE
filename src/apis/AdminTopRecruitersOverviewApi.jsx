import { TOP_RECRUITERS_OVERVIEW_MOCK } from '../mocks/topRecruitersOverviewMock.js';

/**
 * Top Recruiters overview for Admin dashboard (UC-54 placeholder).
 * TODO(BE): GET /api/v1/admin/dashboard/top-recruiters-overview — set USE_MOCK = false when ready.
 * FE must render topBusinesses in API order; do not re-sort.
 */
const USE_MOCK = true;

const delay = (ms = 320) => new Promise((resolve) => setTimeout(resolve, ms));

export const getTopRecruitersOverview = async () => {
    if (USE_MOCK) {
        await delay();
        return { data: { data: { ...TOP_RECRUITERS_OVERVIEW_MOCK } } };
    }
    throw new Error('TOP_RECRUITERS_OVERVIEW_API_NOT_WIRED');
};
