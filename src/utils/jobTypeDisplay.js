export const getJobTypeLabels = (rawJobTypes, options = []) => {
    if (!rawJobTypes) return [];

    const labelByCode = new Map(
        options
            .filter((option) => option?.value)
            .map((option) => [
                String(option.value).trim().toUpperCase(),
                String(option.label || option.value).trim(),
            ])
    );

    return String(rawJobTypes)
        .split(',')
        .map((code) => code.trim())
        .filter(Boolean)
        .map((code) => labelByCode.get(code.toUpperCase()) || code);
};

export const formatJobTypeLabels = (rawJobTypes, options = []) =>
    getJobTypeLabels(rawJobTypes, options).join(', ');
