import Header from "../../components/common/Header.jsx";
import LocationPicker from "../../modules/location";

const HomePage = () => {
    return (
        <>
            <Header />
            <main className="location-page">
                <LocationPicker />
            </main>
        </>
    );
};
export default HomePage;
