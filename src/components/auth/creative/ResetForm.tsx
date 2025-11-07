import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft } from 'lucide-react';
import { FormField } from './FormField';
import { validators } from '@/lib/validate';
import { buttonHover, buttonTap, fadeInUp } from '@/lib/authAnimations';

interface ResetFormProps {
  onSubmit: (email: string) => Promise<void>;
  onBackToLogin: () => void;
  isLoading?: boolean;
}

export const ResetForm: React.FC<ResetFormProps> = ({ 
  onSubmit, 
  onBackToLogin,
  isLoading = false 
}) => {
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<{ email?: string }>({});
  const [touched, setTouched] = useState<{ email?: boolean }>({});

  const validateField = (value: string) => {
    const result = validators.email(value);
    return result.isValid ? undefined : result.error;
  };

  const handleBlur = () => {
    setTouched({ email: true });
    const error = validateField(email);
    setErrors({ email: error });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const emailError = validateField(email);
    if (emailError) {
      setErrors({ email: emailError });
      setTouched({ email: true });
      return;
    }

    await onSubmit(email);
  };

  return (
    <motion.form {...fadeInUp} onSubmit={handleSubmit} className="space-y-6">
      <FormField
        label="Email"
        type="email"
        placeholder="your.email@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onBlur={handleBlur}
        error={touched.email ? errors.email : undefined}
        isValid={touched.email && !errors.email && email.length > 0}
        icon={<Mail size={18} />}
        disabled={isLoading}
      />

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
        "
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            НАДСИЛАННЯ...
          </span>
        ) : (
          'НАДІСЛАТИ ПОСИЛАННЯ'
        )}
      </motion.button>

      <button
        type="button"
        onClick={onBackToLogin}
        className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
        disabled={isLoading}
      >
        <ArrowLeft className="w-4 h-4" />
        Повернутися до входу
      </button>
    </motion.form>
  );
};
