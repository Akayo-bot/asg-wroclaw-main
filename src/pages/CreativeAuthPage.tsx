import React, { useState, useEffect, RefObject } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Mascot } from '@/components/mascot/Mascot';
import { AnimatedShapes } from '@/components/bg/AnimatedShapes';
import { AuthCard } from '@/components/auth/creative/AuthCard';
import { MascotState } from '@/components/mascot/mascotStates';
import { useToast } from '@/hooks/use-toast';
import { fadeInUp } from '@/lib/authAnimations';
import TargetCursor from '@/components/TargetCursor';
import { autoTargetInteractiveElements } from '@/utils/autoTarget';

const CreativeAuthPage = () => {
    const { user, loading, signIn, signUp, signInWithGoogle } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const { toast } = useToast();
    const returnUrl = searchParams.get('returnUrl') || '/';

    const [mascotState, setMascotState] = useState<MascotState>('idle');
    const [isAuthLoading, setIsAuthLoading] = useState(false);
    const [activeFocusRef, setActiveFocusRef] = useState<RefObject<HTMLInputElement> | null>(null);

    // Redirect if already logged in
    useEffect(() => {
        if (!loading && user) {
            const targetUrl = returnUrl || '/';
            // Prevent navigation loop if already on target URL
            if (location.pathname !== targetUrl && targetUrl !== '/auth') {
                // Используем window.location для надежного редиректа
                if (window.location.pathname !== targetUrl) {
                    window.location.href = targetUrl;
                } else {
                    navigate(targetUrl, { replace: true });
                }
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, loading, returnUrl]); // navigate is stable from useNavigate, location.pathname check prevents loops

    // Initialize TargetCursor
    useEffect(() => {
        if (typeof window !== 'undefined' && document) {
            const timer = setTimeout(() => {
                const cleanup = autoTargetInteractiveElements();
                return cleanup;
            }, 100);

            return () => clearTimeout(timer);
        }
    }, []);

    const handleLogin = async (email: string, password: string, rememberMe: boolean) => {
        setIsAuthLoading(true);
        setMascotState('thinking');

        // Mock delay for demonstration
        await new Promise(resolve => setTimeout(resolve, 600 + Math.random() * 300));

        try {
            // Test fail scenario
            if (email.includes('fail@')) {
                throw new Error('Invalid email or password');
            }

            const { error } = await signIn(email, password);

            if (error) throw error;

            setMascotState('success');
            toast({
                title: 'Mission accomplished! 🎖️',
                description: 'Welcome back to the squad',
            });

            // Redirect after success animation - используем window.location для надежного редиректа
            setTimeout(() => {
                const targetUrl = returnUrl || '/';
                if (window.location.pathname !== targetUrl) {
                    window.location.href = targetUrl;
                } else {
                    navigate(targetUrl, { replace: true });
                }
            }, 1500);
        } catch (err: any) {
            setMascotState('error');
            toast({
                title: 'Mission failed',
                description: err.message || 'Invalid credentials. Try again.',
                variant: 'destructive',
            });
            setTimeout(() => setMascotState('idle'), 3000);
        } finally {
            setIsAuthLoading(false);
        }
    };

    const handleRegister = async (name: string, email: string, password: string) => {
        setIsAuthLoading(true);
        setMascotState('thinking');

        // Mock delay
        await new Promise(resolve => setTimeout(resolve, 600 + Math.random() * 300));

        try {
            // Test fail scenario
            if (email.includes('fail@')) {
                throw new Error('Registration failed. Email may already be in use.');
            }

            const { error } = await signUp(email, password, name);

            if (error) throw error;

            setMascotState('success');
            toast({
                title: 'Welcome to the squad! 🚀',
                description: 'Check your email to verify your account',
            });

            // Redirect after success - используем window.location для надежного редиректа
            setTimeout(() => {
                const targetUrl = returnUrl || '/';
                if (window.location.pathname !== targetUrl) {
                    window.location.href = targetUrl;
                } else {
                    navigate(targetUrl, { replace: true });
                }
            }, 1500);
        } catch (err: any) {
            setMascotState('error');
            toast({
                title: 'Recruitment failed',
                description: err.message || 'Unable to create account. Try again.',
                variant: 'destructive',
            });
            setTimeout(() => setMascotState('idle'), 3000);
        } finally {
            setIsAuthLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setIsAuthLoading(true);
        setMascotState('thinking');

        try {
            const { error } = await signInWithGoogle();

            if (error) throw error;

            setMascotState('success');
            // Google OAuth will handle redirect
        } catch (err: any) {
            setMascotState('error');
            toast({
                title: 'Google sign-in failed',
                description: err.message || 'Unable to authenticate with Google',
                variant: 'destructive',
            });
            setTimeout(() => setMascotState('idle'), 3000);
            setIsAuthLoading(false);
        }
    };

    const handlePasswordReset = async (email: string) => {
        setIsAuthLoading(true);
        setMascotState('thinking');

        await new Promise(resolve => setTimeout(resolve, 600));

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin + '/auth?type=recovery'
            });

            if (error) throw error;

            setMascotState('success');
            toast({
                title: 'Перевірте пошту! 📧',
                description: 'Посилання для скидання пароля надіслано',
            });

            setTimeout(() => setMascotState('idle'), 3000);
        } catch (err: any) {
            setMascotState('error');
            toast({
                title: 'Помилка скидання',
                description: err.message || 'Спробуйте ще раз',
                variant: 'destructive',
            });
            setTimeout(() => setMascotState('idle'), 3000);
        } finally {
            setIsAuthLoading(false);
        }
    };

    const handleFieldFocus = (ref: RefObject<HTMLInputElement>) => {
        setActiveFocusRef(ref);
        if (mascotState === 'idle') {
            setMascotState('typing');
        }
    };

    const handleInputChange = () => {
        if (mascotState === 'idle') {
            setMascotState('typing');
            const timeoutId = setTimeout(() => {
                setMascotState(prev => prev === 'typing' ? 'idle' : prev);
            }, 2000);
            return () => clearTimeout(timeoutId);
        }
    };

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-foreground/80">Loading mission briefing...</p>
                </div>
            </div>
        );
    }

    // Already logged in - redirect immediately
    if (user && !loading) {
        const targetUrl = returnUrl || '/';
        // Используем window.location для немедленного редиректа
        if (window.location.pathname !== targetUrl && targetUrl !== '/auth') {
            window.location.href = targetUrl;
            // Показываем экран загрузки пока происходит редирект
            return (
                <div className="min-h-screen flex items-center justify-center bg-background">
                    <div className="text-center">
                        <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-foreground/80">Redirecting...</p>
                    </div>
                </div>
            );
        }
    }

    return (
        <div className="min-h-screen bg-background overflow-hidden" onInput={handleInputChange}>
            {/* Target Cursor */}
            <TargetCursor
                targetSelector=".cursor-target"
                spinDuration={2}
                hideDefaultCursor={true}
            />

            {/* Background Shapes */}
            <AnimatedShapes />

            {/* Main Content */}
            <div className="relative z-10 min-h-screen flex flex-col lg:flex-row">
                {/* Left Side - Mascot Zone (Desktop) */}
                <motion.div
                    {...fadeInUp}
                    className="hidden lg:flex lg:w-3/5 items-center justify-center p-8"
                >
                    <Mascot
                        state={mascotState}
                        showEyes={true}
                        focusAnchor={activeFocusRef}
                    />
                </motion.div>

                {/* Right Side - Auth Form */}
                <div className="flex-1 flex items-center justify-center p-6 lg:p-8 lg:w-2/5">
                    <div className="w-full max-w-md">
                        {/* Mobile Mascot - Stacked on top */}
                        <motion.div
                            {...fadeInUp}
                            className="lg:hidden mb-8 h-[40vh] flex justify-center items-center"
                        >
                            <div className="scale-75">
                                <Mascot
                                    state={mascotState}
                                    showEyes={true}
                                    focusAnchor={activeFocusRef}
                                />
                            </div>
                        </motion.div>

                        {/* Auth Card */}
                        <AuthCard
                            onLogin={handleLogin}
                            onRegister={handleRegister}
                            onGoogleSignIn={handleGoogleSignIn}
                            onPasswordReset={handlePasswordReset}
                            onFieldFocus={handleFieldFocus}
                            isLoading={isAuthLoading}
                        />

                        {/* Footer */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="mt-8 text-center text-xs text-muted-foreground"
                        >
                            <p>
                                By continuing, you agree to our{' '}
                                <button className="text-primary hover:text-primary/80 transition-colors">
                                    Terms of Service
                                </button>
                                {' '}and{' '}
                                <button className="text-primary hover:text-primary/80 transition-colors">
                                    Privacy Policy
                                </button>
                            </p>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreativeAuthPage;
