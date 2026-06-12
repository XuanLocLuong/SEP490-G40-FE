import Header from "../../components/common/Header.jsx";
import LocationPicker from "../../modules/location";

const MemberPage = () => {
    return (
        <>
            <Header />
            <main className="location-page">
                <LocationPicker />
            </main>
        </>
    );
};

export default MemberPage;
