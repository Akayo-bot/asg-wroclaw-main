import React, { useState, useRef, RefObject } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, User } from 'lucide-react';
import { FormField } from './FormField';
import { ProviderButtons } from './ProviderButtons';
import { validators } from '@/lib/validate';
import { buttonHover, buttonTap, fadeInUp } from '@/lib/authAnimations';

interface RegisterFormProps {
    onSubmit: (name: string, email: string, password: string) => Promise<void>;
    onGoogleSignIn: () => Promise<void>;
    onFieldFocus?: (ref: RefObject<HTMLInputElement>) => void;
    isLoading?: boolean;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
    onSubmit,
    onGoogleSignIn,
    onFieldFocus,
    isLoading = false
}) => {
    const nameRef = useRef<HTMLInputElement>(null);
    const emailRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [acceptTerms, setAcceptTerms] = useState(false);
    const [errors, setErrors] = useState<{
        name?: string;
        email?: string;
        password?: string;
        confirmPassword?: string;
        terms?: string;
    }>({});
    const [touched, setTouched] = useState<{
        name?: boolean;
        email?: boolean;
        password?: boolean;
        confirmPassword?: boolean;
    }>({});

    const validateField = (field: 'name' | 'email' | 'password' | 'confirmPassword', value: string) => {
        if (field === 'confirmPassword') {
            const result = validators.confirmPassword(password, value);
            return result.isValid ? undefined : result.error;
        }
        const result = validators[field](value);
        return result.isValid ? undefined : result.error;
    };

    const handleBlur = (field: 'name' | 'email' | 'password' | 'confirmPassword') => {
        setTouched({ ...touched, [field]: true });
        const value =
            field === 'name' ? name :
                field === 'email' ? email :
                    field === 'password' ? password : confirmPassword;
        const error = validateField(field, value);
        setErrors({ ...errors, [field]: error });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const nameError = validateField('name', name);
        const emailError = validateField('email', email);
        const passwordError = validateField('password', password);
        const confirmError = validateField('confirmPassword', confirmPassword);
        const termsResult = validators.terms(acceptTerms);
        const termsError = termsResult.isValid ? undefined : termsResult.error;

        if (nameError || emailError || passwordError || confirmError || termsError) {
            setErrors({
                name: nameError,
                email: emailError,
                password: passwordError,
                confirmPassword: confirmError,
                terms: termsError
            });
            setTouched({ name: true, email: true, password: true, confirmPassword: true });
            return;
        }

        await onSubmit(name, email, password);
    };

    return (
        <motion.form
            {...fadeInUp}
            onSubmit={handleSubmit}
            className="space-y-5"
        >
            <FormField
                label="Повне ім'я"
                type="text"
                placeholder="Олександр Тактичний"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onFocus={() => onFieldFocus?.(nameRef)}
                onBlur={() => handleBlur('name')}
                error={touched.name ? errors.name : undefined}
                isValid={touched.name && !errors.name && name.length > 0}
                icon={<User size={18} />}
                disabled={isLoading}
            />

            <FormField
                label="Email"
                type="email"
                placeholder="operator@tactical.squad"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => onFieldFocus?.(emailRef)}
                onBlur={() => handleBlur('email')}
                error={touched.email ? errors.email : undefined}
                isValid={touched.email && !errors.email && email.length > 0}
                icon={<Mail size={18} />}
                disabled={isLoading}
            />

            <FormField
                label="Пароль"
                type="password"
                placeholder="Створіть надійний пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => onFieldFocus?.(passwordRef)}
                onBlur={() => handleBlur('password')}
                error={touched.password ? errors.password : undefined}
                showPasswordToggle
                icon={<Lock size={18} />}
                disabled={isLoading}
            />

            <FormField
                label="Підтвердження пароля"
                type="password"
                placeholder="Повторіть пароль"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onBlur={() => handleBlur('confirmPassword')}
                error={touched.confirmPassword ? errors.confirmPassword : undefined}
                showPasswordToggle
                icon={<Lock size={18} />}
                disabled={isLoading}
            />

            <div className="space-y-2">
                <label className="flex items-start gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={acceptTerms}
                        onChange={(e) => {
                            setAcceptTerms(e.target.checked);
                            if (e.target.checked) {
                                setErrors({ ...errors, terms: undefined });
                            }
                        }}
                        disabled={isLoading}
                        className="
              mt-0.5 w-4 h-4 rounded border-border bg-input
              text-primary focus:ring-2 focus:ring-ring focus:ring-offset-0
              cursor-target disabled:opacity-50
            "
                    />
                    <span className="text-sm text-foreground/80">
                        Я приймаю{' '}
                        <button type="button" className="text-primary hover:text-primary/80 transition-colors cursor-target">
                            Умови використання
                        </button>
                        {' '}та{' '}
                        <button type="button" className="text-primary hover:text-primary/80 transition-colors cursor-target">
                            Політику конфіденційності
                        </button>
                    </span>
                </label>
                {errors.terms && (
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-sm text-destructive"
                    >
                        {errors.terms}
                    </motion.p>
                )}
            </div>

            <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={isLoading ? {} : buttonHover}
                whileTap={isLoading ? {} : buttonTap}
                className="
          w-full px-4 py-3 rounded-lg font-rajdhani font-semibold text-base
          bg-primary text-primary-foreground
          hover:shadow-lg hover:shadow-primary/20
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all duration-200
          cursor-target
        "
            >
                {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                        Створення акаунту...
                    </span>
                ) : (
                    'ВСТУПИТИ В ЗАГІН'
                )}
            </motion.button>

            <ProviderButtons onGoogleSignIn={onGoogleSignIn} disabled={isLoading} />

            <p className="text-center text-sm text-muted-foreground">
                Тактична безпека гарантована 🛡️
            </p>
        </motion.form>
    );
};
