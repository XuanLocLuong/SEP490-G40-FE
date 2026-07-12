import { USER_ROLES } from '../../../utils/Constants.jsx';
import { ROUTES } from '../../../routes/path.js';
import { BuildingIcon, SettingsIcon } from '../icons.jsx';

/** Menu avatar dropdown — chỉ tài khoản / hồ sơ doanh nghiệp, không phải chức năng nghiệp vụ. */
export const getAccountMenuByRole = (role) => {
    switch (role) {
        case USER_ROLES.CANDIDATE:
            return {
                sections: [],
                items: [
                    {
                        label: 'Cài đặt tài khoản',
                        path: ROUTES.CANDIDATE_SETTINGS,
                        icon: SettingsIcon,
                    },
                ],
            };

        case USER_ROLES.RECRUITER:
            return {
                sections: [],
                items: [
                    {
                        label: 'Cài đặt tài khoản',
                        path: ROUTES.RECRUITER_SETTINGS,
                        icon: SettingsIcon,
                    },
                    {
                        label: 'Hồ sơ nhà tuyển dụng',
                        path: ROUTES.RECRUITER_PROFILE,
                        icon: BuildingIcon,
                    },
                ],
            };

        default:
            return { sections: [], items: [] };
    }
};

export const getSettingsPathByRole = (role) => {
    switch (role) {
        case USER_ROLES.RECRUITER:
            return ROUTES.RECRUITER_SETTINGS;
        case USER_ROLES.CANDIDATE:
        default:
            return ROUTES.CANDIDATE_SETTINGS;
    }
};
