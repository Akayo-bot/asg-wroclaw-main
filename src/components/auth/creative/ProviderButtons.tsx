import React from 'react';
import { motion } from 'framer-motion';
import { Chrome } from 'lucide-react';
import { buttonHover, buttonTap } from '@/lib/authAnimations';

interface ProviderButtonsProps {
    onGoogleSignIn: () => void;
    disabled?: boolean;
}

export const ProviderButtons: React.FC<ProviderButtonsProps> = ({
    onGoogleSignIn,
    disabled = false
}) => {
    return (
        <div className="space-y-3">
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                </div>
            </div>

            <motion.button
                type="button"
                onClick={onGoogleSignIn}
                disabled={disabled}
                whileHover={disabled ? {} : buttonHover}
                whileTap={disabled ? {} : buttonTap}
                className="
          w-full flex items-center justify-center gap-3 px-4 py-3
          bg-card border border-border rounded-lg
          text-foreground font-medium
          hover:bg-accent/10 hover:border-accent
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors duration-200
          cursor-target
        "
            >
                <Chrome size={20} className="text-foreground" />
                Sign in with Google
            </motion.button>
        </div>
    );
};
