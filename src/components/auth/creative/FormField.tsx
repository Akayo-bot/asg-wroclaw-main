import React, { InputHTMLAttributes } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { shakeError } from '@/lib/authAnimations';

interface FormFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
    label: string;
    type?: 'text' | 'email' | 'password';
    error?: string;
    showPasswordToggle?: boolean;
    isValid?: boolean;
    icon?: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({
    label,
    type = 'text',
    error,
    showPasswordToggle = false,
    isValid = false,
    icon,
    className = '',
    ...props
}) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const [isFocused, setIsFocused] = React.useState(false);

    const inputType = type === 'password' && showPassword ? 'text' : type;

    return (
        <div className="space-y-2">
            <label className="text-sm font-medium text-foreground/90">
                {label}
            </label>

            <motion.div
                animate={error ? shakeError : {}}
                className="relative"
            >
                {/* Icon */}
                {icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {icon}
                    </div>
                )}

                {/* Input */}
                <input
                    type={inputType}
                    className={`
            w-full px-4 ${icon ? 'pl-10' : ''} py-3 
            bg-input border border-border rounded-lg
            text-foreground placeholder:text-muted-foreground
            focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
            transition-all duration-200
            ${error ? 'border-destructive focus:ring-destructive' : ''}
            ${isValid && !error ? 'border-primary focus:ring-primary' : ''}
            cursor-target
            ${className}
          `}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    {...props}
                />

                {/* Password Toggle */}
                {showPasswordToggle && type === 'password' && (
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-target"
                        tabIndex={-1}
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                )}

                {/* Validation Icons */}
                {!showPasswordToggle && (
                    <>
                        {isValid && !error && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-primary">
                                <CheckCircle2 size={18} />
                            </div>
                        )}
                        {error && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-destructive">
                                <AlertCircle size={18} />
                            </div>
                        )}
                    </>
                )}

                {/* Focus indicator line */}
                {isFocused && !error && (
                    <motion.div
                        layoutId="focusIndicator"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-accent"
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: 0.2 }}
                    />
                )}
            </motion.div>

            {/* Error Message */}
            {error && (
                <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-destructive flex items-center gap-1"
                >
                    <AlertCircle size={14} />
                    {error}
                </motion.p>
            )}
        </div>
    );
};
