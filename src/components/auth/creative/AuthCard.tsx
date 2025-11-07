import React, { useState, RefObject } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { ResetForm } from './ResetForm';
import { scaleIn } from '@/lib/authAnimations';

type AuthMode = 'login' | 'register' | 'reset';

interface AuthCardProps {
    onLogin: (email: string, password: string, rememberMe: boolean) => Promise<void>;
    onRegister: (name: string, email: string, password: string) => Promise<void>;
    onGoogleSignIn: () => Promise<void>;
    onPasswordReset: (email: string) => Promise<void>;
    onFieldFocus?: (ref: RefObject<HTMLInputElement>) => void;
    isLoading?: boolean;
}

export const AuthCard: React.FC<AuthCardProps> = ({
    onLogin,
    onRegister,
    onGoogleSignIn,
    onPasswordReset,
    onFieldFocus,
    isLoading = false
}) => {
    const [mode, setMode] = useState<AuthMode>('login');

    return (
        <motion.div
            {...scaleIn}
            className="w-full max-w-md mx-auto glass-panel p-8 rounded-2xl"
        >
            {/* Tab Switcher - Hide on reset mode */}
            {mode !== 'reset' && (
                <div className="flex gap-2 mb-6 bg-muted/30 p-1 rounded-lg">
                    {(['login', 'register'] as const).map((tabMode) => (
                        <button
                            key={tabMode}
                            onClick={() => setMode(tabMode)}
                            disabled={isLoading}
                            className="relative flex-1 py-2.5 px-4 text-sm font-rajdhani font-semibold rounded-md transition-colors disabled:cursor-not-allowed cursor-target"
                            data-auth-tab={tabMode}
                        >
                            {mode === tabMode && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute inset-0 bg-primary/20 border border-primary/40 rounded-md"
                                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            <span className={`relative z-10 ${mode === tabMode ? 'text-primary' : 'text-muted-foreground'}`}>
                                {tabMode === 'login' ? 'MISSION LOGIN' : 'RECRUIT'}
                            </span>
                        </button>
                    ))}
                </div>
            )}

            {/* Titles */}
            <div className="mb-6 text-center">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={mode}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.2 }}
                    >
                        <h1 className="text-3xl font-rajdhani font-bold mb-2">
                            {mode === 'login' && 'З поверненням, воїне! 🎯'}
                            {mode === 'register' && 'Приєднуйся до загону! 🚀'}
                            {mode === 'reset' && 'Відновлення доступу 🔒'}
                        </h1>
                        <p className="text-muted-foreground">
                            {mode === 'login' && 'Введіть дані для входу в систему'}
                            {mode === 'register' && 'Створіть акаунт для участі в місіях'}
                            {mode === 'reset' && 'Введіть email для скидання пароля'}
                        </p>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Form Content */}
            <AnimatePresence mode="wait">
                {mode === 'login' && (
                    <LoginForm
                        key="login"
                        onSubmit={onLogin}
                        onGoogleSignIn={onGoogleSignIn}
                        onForgotPassword={() => setMode('reset')}
                        onFieldFocus={onFieldFocus}
                        isLoading={isLoading}
                    />
                )}
                {mode === 'register' && (
                    <RegisterForm
                        key="register"
                        onSubmit={onRegister}
                        onGoogleSignIn={onGoogleSignIn}
                        onFieldFocus={onFieldFocus}
                        isLoading={isLoading}
                    />
                )}
                {mode === 'reset' && (
                    <ResetForm
                        key="reset"
                        onSubmit={onPasswordReset}
                        onBackToLogin={() => setMode('login')}
                        isLoading={isLoading}
                    />
                )}
            </AnimatePresence>

            {/* Footer - Hide on reset mode */}
            {mode !== 'reset' && (
                <div className="mt-6 text-center">
                    <p className="text-sm text-muted-foreground">
                        {mode === 'login' ? "Немає акаунту? " : 'Вже є акаунт? '}
                        <button
                            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                            disabled={isLoading}
                            className="text-primary hover:text-primary/80 font-medium transition-colors disabled:cursor-not-allowed cursor-target"
                        >
                            {mode === 'login' ? 'Зареєструватися' : 'Увійти'}
                        </button>
                    </p>
                </div>
            )}
        </motion.div>
    );
};
