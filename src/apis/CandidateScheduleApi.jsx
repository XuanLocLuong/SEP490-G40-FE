import axiosClient, { API_PREFIX } from './AxiosClient.jsx';

const SCHEDULE_BASE = `${API_PREFIX}/candidate/schedule`;

const unwrap = (res) => res?.data?.data ?? res?.data ?? null;

/** GET /candidate/schedule/summary — overview màn lịch. */
export const getScheduleSummary = () => axiosClient.get(`${SCHEDULE_BASE}/summary`);

/**
 * POST /candidate/schedule/mode?mode=CALCULATED|MANUAL
 * MANUAL → BE unapply TKB + jobs; CALCULATED → tính lại free từ TKB/job đang apply.
 */
export const switchScheduleMode = (mode) =>
    axiosClient.post(`${SCHEDULE_BASE}/mode`, null, {
        params: { mode },
    });

export const fetchScheduleSummary = async () => unwrap(await getScheduleSummary());
