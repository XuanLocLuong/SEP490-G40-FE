import recruiterJobApi from '../apis/RecruiterJobApi.jsx';

const toArray = (value) => {
    if (Array.isArray(value)) return value;
    if (value == null || value === '') return [];
    return [value];
};

const sameSkillId = (a, b) => a != null && b != null && String(a) === String(b);

const KNOWN_LABELS_STORAGE_KEY = 'joblink.skillLabels.v1';

const readKnownLabelsFromStorage = () => {
    try {
        const raw = sessionStorage.getItem(KNOWN_LABELS_STORAGE_KEY);
        if (!raw) return {};
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
        return {};
    }
};

const writeKnownLabelsToStorage = (mapObj) => {
    try {
        sessionStorage.setItem(KNOWN_LABELS_STORAGE_KEY, JSON.stringify(mapObj));
    } catch {
        // ignore
    }
};

/** id → name đã từng thấy — giữ để toast khi skill đã bị gỡ khỏi /jobs/skills. */
const knownSkillLabels = new Map(
    Object.entries(readKnownLabelsFromStorage()).map(([id, label]) => [
        String(id),
        String(label),
    ]),
);

export const normalizeSkillOption = (item) => {
    if (!item) return null;
    const id = item.id ?? item.skillId;
    if (id == null || id === '') return null;
    const active =
        item.active == null && item.isActive == null
            ? true
            : Boolean(item.active ?? item.isActive);
    const name = String(item.name || item.label || id);
    return { id, name, active };
};

export const normalizeSkillOptions = (list) => {
    if (!Array.isArray(list)) return [];
    return list.map(normalizeSkillOption).filter(Boolean);
};

export const rememberSkillLabels = (skills = []) => {
    let changed = false;
    toArray(skills).forEach((item) => {
        const normalized = normalizeSkillOption(item);
        if (!normalized || normalized.id == null) return;
        const key = String(normalized.id);
        if (knownSkillLabels.get(key) === normalized.name) return;
        knownSkillLabels.set(key, normalized.name);
        changed = true;
    });
    if (changed) {
        writeKnownLabelsToStorage(Object.fromEntries(knownSkillLabels));
    }
};

/** Skill đang chọn nhưng không còn dùng được (thiếu catalog hoặc active === false). */
export const getInactiveSelectedSkillIds = (selectedIds, catalog = []) => {
    const selected = toArray(selectedIds).filter((id) => id != null && id !== '');
    if (selected.length === 0) return [];

    const byId = new Map(
        normalizeSkillOptions(catalog).map((skill) => [String(skill.id), skill]),
    );

    return selected.filter((id) => {
        const skill = byId.get(String(id));
        if (!skill) return true;
        return skill.active === false;
    });
};

export const pruneInactiveSkillIds = (selectedIds, catalog = []) => {
    const selected = toArray(selectedIds).filter((id) => id != null && id !== '');
    const removed = getInactiveSelectedSkillIds(selected, catalog);
    if (removed.length === 0) {
        return { nextIds: selected, removed: [] };
    }
    return {
        nextIds: selected.filter(
            (id) => !removed.some((removedId) => sameSkillId(id, removedId)),
        ),
        removed,
    };
};

export const formatRemovedSkillLabels = (removedIds, catalog = []) => {
    const byId = new Map();
    knownSkillLabels.forEach((label, id) => {
        byId.set(String(id), label);
    });
    normalizeSkillOptions(catalog).forEach((skill) => {
        byId.set(String(skill.id), skill.name);
    });
    return toArray(removedIds)
        .map((id) => byId.get(String(id)) || String(id))
        .filter(Boolean);
};

export const INACTIVE_SKILLS_TOAST_ID = 'job-skills-inactive-removed';
export const INACTIVE_SKILLS_PROFILE_TOAST_ID = 'profile-skills-inactive-removed';

/**
 * Gỡ skill object không còn trong catalog active.
 * @returns {{ nextSkills: object[], removed: Array }}
 */
export const pruneInactiveSkills = (selectedSkills, catalog = []) => {
    const selected = toArray(selectedSkills).filter(Boolean);
    rememberSkillLabels(selected);
    const { nextIds, removed } = pruneInactiveSkillIds(
        selected.map((skill) => skill?.id),
        catalog,
    );
    if (removed.length === 0) {
        return { nextSkills: selected, removed: [] };
    }
    const keep = new Set(nextIds.map((id) => String(id)));
    return {
        nextSkills: selected.filter((skill) => keep.has(String(skill?.id))),
        removed,
    };
};

export const buildInactiveSkillsRemovedMessage = (
    removedIds,
    catalog = [],
    { context = 'job' } = {},
) => {
    const labels = formatRemovedSkillLabels(removedIds, catalog);
    const target = context === 'profile' ? 'hồ sơ' : 'tin';
    if (labels.length === 0) {
        return `Một số kỹ năng đã bị vô hiệu hóa và đã được gỡ khỏi ${target}. Vui lòng chọn kỹ năng khác nếu cần.`;
    }
    return `Một số kỹ năng đã bị vô hiệu hóa và đã được gỡ khỏi ${target}: ${labels.join(', ')}. Vui lòng chọn kỹ năng khác nếu cần.`;
};

let cachedSkillsCatalog = null;
let cachedSkillsCatalogAt = 0;
let skillsCatalogRequest = null;
const SKILLS_CACHE_TTL_MS = 5 * 60 * 1000;

export const invalidateSkillsCatalogCache = () => {
    if (cachedSkillsCatalog?.length) {
        rememberSkillLabels(cachedSkillsCatalog);
    }
    cachedSkillsCatalog = null;
    cachedSkillsCatalogAt = 0;
};

/**
 * Load kỹ năng active từ GET /api/v1/jobs/skills.
 * @param {{ force?: boolean }} [opts]
 */
export const fetchActiveSkillsCatalog = async ({ force = false } = {}) => {
    if (
        !force &&
        cachedSkillsCatalog &&
        Date.now() - cachedSkillsCatalogAt < SKILLS_CACHE_TTL_MS
    ) {
        return cachedSkillsCatalog;
    }

    if (!skillsCatalogRequest) {
        const previous = cachedSkillsCatalog;
        skillsCatalogRequest = recruiterJobApi
            .getActiveSkills()
            .then((list) => {
                const resolved = normalizeSkillOptions(Array.isArray(list) ? list : []);
                rememberSkillLabels(resolved);
                cachedSkillsCatalog = resolved;
                cachedSkillsCatalogAt = Date.now();
                return resolved;
            })
            .catch((err) => {
                if (previous?.length) return previous;
                throw err;
            })
            .finally(() => {
                skillsCatalogRequest = null;
            });
    }

    return skillsCatalogRequest;
};
