import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { useToast } from '@/hooks/use-toast';
import { Mail, Lock, User, Chrome } from 'lucide-react';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const AuthModal = ({ isOpen, onClose }: AuthModalProps) => {
    const [activeTab, setActiveTab] = useState('login');
    const [loading, setLoading] = useState(false);
    const { signIn, signUp, signInWithGoogle, resetPassword } = useAuth();
    const { t } = useI18n();
    const { toast } = useToast();

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        displayName: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (activeTab === 'login') {
                const { error } = await signIn(formData.email, formData.password);
                if (error) throw error;

                toast({
                    title: t('auth.success', 'Success'),
                    description: t('auth.loginSuccess', 'Successfully logged in')
                });
                onClose();
            } else if (activeTab === 'register') {
                if (formData.password !== formData.confirmPassword) {
                    throw new Error(t('auth.passwordMismatch', 'Passwords do not match'));
                }

                const { error } = await signUp(formData.email, formData.password, formData.displayName);
                if (error) throw error;

                toast({
                    title: t('auth.success', 'Success'),
                    description: t('auth.registerSuccess', 'Registration successful! Please check your email.')
                });
                onClose();
            } else if (activeTab === 'reset') {
                const { error } = await resetPassword(formData.email);
                if (error) throw error;

                toast({
                    title: t('common.success', 'Success'),
                    description: t('auth.resetEmailSent', 'Password reset email sent!')
                });
                onClose();
            }
        } catch (error: any) {
            console.error('Auth error:', error);
            toast({
                title: t('common.error', 'Error'),
                description: error.message || t('auth.genericError', 'Authentication failed'),
                variant: 'destructive'
            });
        }

        setLoading(false);
    };

    const handleGoogleSignIn = async () => {
        try {
            setLoading(true);
            const { error } = await signInWithGoogle();
            if (error) throw error;
            onClose();
        } catch (error: any) {
            console.error('Google sign in error:', error);
            toast({
                title: t('common.error', 'Error'),
                description: error.message || t('auth.googleError', 'Google sign in failed'),
                variant: 'destructive'
            });
        }
        setLoading(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-center">
                        {activeTab === 'login' && t('auth.signIn', 'Sign In')}
                        {activeTab === 'register' && t('auth.signUp', 'Sign Up')}
                        {activeTab === 'reset' && t('auth.resetPassword', 'Reset Password')}
                    </DialogTitle>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="login" className="cursor-target">{t('auth.signIn', 'Sign In')}</TabsTrigger>
                        <TabsTrigger value="register" className="cursor-target">{t('auth.signUp', 'Sign Up')}</TabsTrigger>
                        <TabsTrigger value="reset" className="cursor-target">{t('auth.reset', 'Reset')}</TabsTrigger>
                    </TabsList>

                    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                        <TabsContent value="login" className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="flex items-center gap-2">
                                    <Mail className="w-4 h-4" />
                                    {t('auth.email', 'Email')}
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder={t('auth.emailPlaceholder', 'Enter your email')}
                                    className="cursor-target"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password" className="flex items-center gap-2">
                                    <Lock className="w-4 h-4" />
                                    {t('auth.password', 'Password')}
                                </Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    placeholder={t('auth.passwordPlaceholder', 'Enter your password')}
                                    className="cursor-target"
                                    required
                                />
                            </div>

                            <Button type="submit" className="cursor-target" disabled={loading}>
                                {loading ? t('common.loading', 'Loading...') : t('auth.signIn', 'Sign In')}
                            </Button>
                        </TabsContent>

                        <TabsContent value="register" className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="displayName" className="flex items-center gap-2">
                                    <User className="w-4 h-4" />
                                    {t('auth.displayName', 'Display Name')}
                                </Label>
                                <Input
                                    id="displayName"
                                    type="text"
                                    value={formData.displayName}
                                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                                    placeholder={t('auth.displayNamePlaceholder', 'Enter your name')}
                                    className="cursor-target"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="registerEmail" className="flex items-center gap-2">
                                    <Mail className="w-4 h-4" />
                                    {t('auth.email', 'Email')}
                                </Label>
                                <Input
                                    id="registerEmail"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder={t('auth.emailPlaceholder', 'Enter your email')}
                                    className="cursor-target"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="registerPassword" className="flex items-center gap-2">
                                    <Lock className="w-4 h-4" />
                                    {t('auth.password', 'Password')}
                                </Label>
                                <Input
                                    id="registerPassword"
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    placeholder={t('auth.passwordPlaceholder', 'Enter your password')}
                                    className="cursor-target"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                                    <Lock className="w-4 h-4" />
                                    {t('auth.confirmPassword', 'Confirm Password')}
                                </Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    placeholder={t('auth.confirmPasswordPlaceholder', 'Confirm your password')}
                                    className="cursor-target"
                                    required
                                />
                            </div>

                            <Button type="submit" className="cursor-target" disabled={loading}>
                                {loading ? t('common.loading', 'Loading...') : t('auth.signUp', 'Sign Up')}
                            </Button>
                        </TabsContent>

                        <TabsContent value="reset" className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="resetEmail" className="flex items-center gap-2">
                                    <Mail className="w-4 h-4" />
                                    {t('auth.email', 'Email')}
                                </Label>
                                <Input
                                    id="resetEmail"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder={t('auth.emailPlaceholder', 'Enter your email')}
                                    className="cursor-target"
                                    required
                                />
                            </div>

                            <Button type="submit" className="cursor-target" disabled={loading}>
                                {loading ? t('common.loading', 'Loading...') : t('auth.sendResetEmail', 'Send Reset Email')}
                            </Button>
                        </TabsContent>
                    </form>

                    <div className="relative my-4">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">
                                {t('auth.orContinueWith', 'Or continue with')}
                            </span>
                        </div>
                    </div>

                    <Button
                        type="button"
                        variant="outline"
                        className="cursor-target"
                        onClick={handleGoogleSignIn}
                        disabled={loading}
                    >
                        <Chrome className="w-4 h-4 mr-2" />
                        {t('auth.googleSignIn', 'Continue with Google')}
                    </Button>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
};