import { formatSalary } from './formatters.js';

/** Nhãn lương rõ ngữ cảnh cho các màn khám phá và chi tiết việc làm. */
export const formatJobSalary = (salaryMin, salaryMax) => {
    const salary = formatSalary(salaryMin, salaryMax);
    return salary === 'Thỏa thuận' ? 'Mức lương thỏa thuận' : salary;
};
