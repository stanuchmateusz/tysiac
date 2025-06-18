const Footer = () => {
    return (
        <footer className="bg-gray-800 text-white py-4">
            <div className="container mx-auto text-center">
                <p className="text-sm">
                    &copy; {new Date().getFullYear()} Tysiac siadany.
                </p>
                <p className="text-xs mt-2">
                    This project is licensed under the Creative Commons Attribution-NonCommercial 4.0 International (CC-BY-NC-4.0) License.
                </p>
            </div>
        </footer>
    );
}
export default Footer;