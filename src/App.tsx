import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { BrandingProvider } from "@/contexts/BrandingContext";
import { I18nProvider } from "@/contexts/I18nContext";
import { CursorProvider } from "@/contexts/CursorContext";
import { LoadingProvider } from "@/contexts/LoadingContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { SEOHead } from "@/components/SEOHead";
import TargetCursor from "@/components/TargetCursor";
import LoadingScreen from "@/components/LoadingScreen";

// Lazy load pages
const Index = lazy(() => import("./pages/Index"));
const GamesPage = lazy(() => import("./pages/GamesPage"));
const TeamPage = lazy(() => import("./pages/TeamPage"));
const GalleryPage = lazy(() => import("./pages/GalleryPage"));
const ArticlesPage = lazy(() => import("./pages/ArticlesPage"));
const ContactsPage = lazy(() => import("./pages/ContactsPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const AdminLayout = lazy(() => import("./components/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const ArticlesList = lazy(() => import('@/pages/admin/ArticlesList'));
const ArticleEditor = lazy(() => import('@/pages/admin/ArticleEditor'));
const GalleryManager = lazy(() => import('@/pages/admin/GalleryManager'));
const EventsManager = lazy(() => import('@/pages/admin/EventsManager'));
const TeamManager = lazy(() => import('@/pages/admin/TeamManager'));
const StatsManager = lazy(() => import('@/pages/admin/StatsManager'));
const RoleManager = lazy(() => import('@/pages/admin/RoleManager'));
const BrandingManager = lazy(() => import('@/pages/admin/BrandingManager'));
// const TranslationsManager = lazy(() => import('@/pages/admin/TranslationsManager')); // Видалено - налаштування через код
const CreativeAuthPage = lazy(() => import("./pages/CreativeAuthPage"));
const DebugAuthPage = lazy(() => import("./pages/DebugAuthPage"));
const RadarLoaderDemo = lazy(() => import("./pages/RadarLoaderDemo"));
const NotFound = lazy(() => import("./pages/NotFound"));
const TestGallery = lazy(() => import("./pages/TestGallery"));
const EventsList = lazy(() => import("./pages/EventsList"));

const queryClient = new QueryClient();

const App = () => (
    <QueryClientProvider client={queryClient}>
        <LoadingProvider>
            <CursorProvider>
                <BrandingProvider>
                    <AuthProvider>
                        <I18nProvider>
                            <TooltipProvider>
                                <Toaster />
                                <Sonner />
                                <BrowserRouter>
                                    <SEOHead />
                                    <TargetCursor />
                                    <Suspense fallback={<LoadingScreen label="SCANNING TARGETS…" size={160} />}>
                                        <Routes>
                                            <Route path="/" element={<Index />} />
                                            <Route path="/games" element={<GamesPage />} />
                                            <Route path="/team" element={<TeamPage />} />
                                            <Route path="/gallery" element={<GalleryPage />} />
                                            <Route path="/articles" element={<ArticlesPage />} />
                                            <Route path="/contacts" element={<ContactsPage />} />
                                            <Route path="/about" element={<AboutPage />} />
                                            <Route
                                                path="/profile"
                                                element={
                                                    <ProtectedRoute>
                                                        <ProfilePage />
                                                    </ProtectedRoute>
                                                }
                                            />
                                            <Route path="/auth" element={<CreativeAuthPage />} />
                                            <Route path="/debug/auth" element={<DebugAuthPage />} />
                                            <Route path="/debug/auth" element={<DebugAuthPage />} />
                                            <Route path="/test-gallery" element={<TestGallery />} />
                                            <Route path="/events-test" element={<EventsList />} />
                                            <Route path="/demo/radar" element={<RadarLoaderDemo />} />

                                            {/* Admin Routes */}
                                            <Route
                                                path="/admin"
                                                element={
                                                    <ProtectedRoute allowedRoles={['admin', 'editor']}>
                                                        <AdminLayout />
                                                    </ProtectedRoute>
                                                }
                                            >
                                                <Route index element={<AdminDashboard />} />
                                                <Route path="articles" element={<ArticlesList />} />
                                                <Route path="articles/new" element={<ArticleEditor />} />
                                                <Route path="articles/edit/:id" element={<ArticleEditor />} />
                                                <Route path="gallery" element={<GalleryManager />} />
                                                <Route path="events" element={<EventsManager />} />
                                                <Route path="team" element={<TeamManager />} />
                                                <Route path="stats" element={<StatsManager />} />
                                                <Route path="roles" element={<RoleManager />} />
                                                <Route path="branding" element={<BrandingManager />} />
                                                {/* Переклади видалено - налаштування через код */}
                                                {/* <Route path="translations" element={<TranslationsManager />} /> */}
                                            </Route>
                                            <Route path="*" element={<NotFound />} />
                                        </Routes>
                                    </Suspense>
                                </BrowserRouter>
                            </TooltipProvider>
                        </I18nProvider>
                    </AuthProvider>
                </BrandingProvider>
            </CursorProvider>
        </LoadingProvider>
    </QueryClientProvider>
);

export default App;
