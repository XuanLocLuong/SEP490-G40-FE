import { useMemo } from 'react';

import { MapPinIcon } from './icons.jsx';

import LocationCombobox from './LocationCombobox.jsx';

import { getProvinces, getWardsByProvince } from '../../modules/location/index.js';



/**

 * Tỉnh/TP → Phường/Xã cho guest job search (combobox gõ tìm).

 * Dùng util địa chính có sẵn — không sửa modules/location.

 */

const LocationSearchSelects = ({

    provinceId,

    wardId,

    onProvinceChange,

    onWardChange,

    disabled = false,

    fieldClassName,

    allProvincesLabel = 'Tất cả địa điểm',

    allWardsLabel = 'Tất cả Phường/Xã',

}) => {

    const provinces = useMemo(() => getProvinces(), []);

    const wards = useMemo(() => getWardsByProvince(provinceId), [provinceId]);



    return (

        <>

            <div
                className={`${fieldClassName} ${fieldClassName}--province`}
                onClick={(e) => {
                    e.currentTarget.querySelector('.location-combobox__input')?.focus();
                }}
            >

                <MapPinIcon width={18} height={18} />

                <LocationCombobox

                    className="location-combobox--grow"

                    options={provinces}

                    value={provinceId}

                    onChange={onProvinceChange}

                    placeholder={allProvincesLabel}

                    disabled={disabled}

                    ariaLabel="Tỉnh / Thành phố"

                />

            </div>



            <div
                className={`${fieldClassName} ${fieldClassName}--ward`}
                onClick={(e) => {
                    e.currentTarget.querySelector('.location-combobox__input')?.focus();
                }}
            >

                <MapPinIcon width={18} height={18} />

                <LocationCombobox

                    className="location-combobox--grow"

                    options={wards}

                    value={wardId}

                    onChange={onWardChange}

                    placeholder={allWardsLabel}

                    disabled={disabled || !provinceId}

                    ariaLabel="Phường / Xã"

                />

            </div>

        </>

    );

};



export default LocationSearchSelects;

