import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Layout } from "@/components/Layout";
import { useI18n } from "@/contexts/I18nContext";

const NotFound = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { t } = useI18n();

    useEffect(() => {
        console.error("404 Error: User attempted to access non-existent route:", location.pathname);
    }, [location.pathname]);

    const handleGoHome = () => {
        navigate("/");
    };

    return (
        <Layout>
            <section className="page_404 min-h-screen flex items-center justify-center bg-white py-10 px-4">
                <div className="container mx-auto max-w-6xl">
                    <div className="row flex flex-col items-center">
                        <div className="col-sm-12 w-full">
                            <div className="col-sm-10 col-sm-offset-1 text-center">
                                {/* 404 Background with GIF */}
                                <div className="four_zero_four_bg">
                                    <h1 className="text-center text-8xl font-bold text-gray-800">404</h1>
                                </div>

                                {/* Content Box */}
                                <div className="contant_box_404 -mt-12">
                                    <h3 className="h2 text-5xl font-bold text-gray-800 mb-4">
                                        {t('notFound.title', "Look like you're lost")}
                                    </h3>

                                    <p className="text-lg text-gray-600 mb-6">
                                        {t('notFound.message', "The page you are looking for is not available!")}
                                    </p>

                                    <button
                                        onClick={handleGoHome}
                                        className="link_404 inline-block px-5 py-3 text-white bg-[#39ac31] rounded-md hover:bg-[#2d8a28] transition-colors duration-200 font-medium cursor-pointer"
                                    >
                                        {t('notFound.goHome', 'Go to Home')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </Layout>
    );
};

export default NotFound;
