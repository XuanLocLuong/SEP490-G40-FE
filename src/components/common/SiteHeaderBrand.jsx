import logoMark from '../../assets/images/logo.png';

/** Logo + chữ JobLink trong header (guest / candidate / recruiter). */
const SiteHeaderBrand = () => (
    <>
        <img
            src={logoMark}
            alt=""
            className="site-header__logo-mark"
            width={36}
            height={36}
            decoding="async"
        />
        <span className="site-header__logo-text" aria-label="JobLink">
            <span className="site-header__logo-text-job">Job</span>
            <span className="site-header__logo-text-link">Link</span>
        </span>
    </>
);

export default SiteHeaderBrand;
