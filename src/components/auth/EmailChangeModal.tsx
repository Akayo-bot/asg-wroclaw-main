import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useI18n } from '@/contexts/I18nContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, AlertCircle, Mail, Lock, Key } from 'lucide-react';

interface EmailChangeModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentEmail: string;
    onEmailChanged: () => void;
}

type Step = 'password' | 'new-email' | 'verification' | 'success';

export default function EmailChangeModal({
    isOpen,
    onClose,
    currentEmail,
    onEmailChanged,
}: EmailChangeModalProps) {
    const { t } = useI18n();
    const [step, setStep] = useState<Step>('password');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form data
    const [password, setPassword] = useState('');
    const [newEmail, setNewEmail] = useState('');

    const handleClose = () => {
        setStep('password');
        setPassword('');
        setNewEmail('');
        setError(null);
        onClose();
    };

    const handlePasswordVerification = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            // Verify password by attempting to sign in
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: currentEmail,
                password: password,
            });

            if (signInError) {
                setError(t('profile.email.wrongPassword', 'Неверный пароль'));
                setIsLoading(false);
                return;
            }

            // Password verified, move to next step
            setStep('new-email');
        } catch (err: any) {
            setError(err.message || t('common.error', 'Произошла ошибка'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleEmailChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(newEmail)) {
                setError(t('profile.email.invalidEmail', 'Неверный формат email'));
                setIsLoading(false);
                return;
            }

            // Check if email is the same
            if (newEmail.toLowerCase() === currentEmail.toLowerCase()) {
                setError(t('profile.email.sameEmail', 'Новый email совпадает с текущим'));
                setIsLoading(false);
                return;
            }

            // Request email change
            const { error: updateError } = await supabase.auth.updateUser({
                email: newEmail,
            });

            if (updateError) {
                setError(updateError.message);
                setIsLoading(false);
                return;
            }

            // Success - email verification sent
            setStep('verification');
        } catch (err: any) {
            setError(err.message || t('common.error', 'Произошла ошибка'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleSuccess = () => {
        onEmailChanged();
        handleClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Mail className="w-5 h-5" />
                        {t('profile.email.changeTitle', 'Изменить Email')}
                    </DialogTitle>
                    <DialogDescription>
                        {step === 'password' &&
                            t(
                                'profile.email.passwordDesc',
                                'Для изменения email подтвердите ваш текущий пароль'
                            )}
                        {step === 'new-email' &&
                            t('profile.email.newEmailDesc', 'Введите новый email адрес')}
                        {step === 'verification' &&
                            t(
                                'profile.email.verificationDesc',
                                'Письмо с подтверждением отправлено на новый email'
                            )}
                    </DialogDescription>
                </DialogHeader>

                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {/* Step 1: Password Verification */}
                {step === 'password' && (
                    <form onSubmit={handlePasswordVerification} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="current-password" className="flex items-center gap-2">
                                <Lock className="w-4 h-4" />
                                {t('profile.email.currentPassword', 'Текущий пароль')}
                            </Label>
                            <Input
                                id="current-password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder={t('profile.email.enterPassword', 'Введите пароль')}
                                required
                                disabled={isLoading}
                                autoFocus
                            />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={handleClose}>
                                {t('common.cancel', 'Отмена')}
                            </Button>
                            <Button type="submit" disabled={isLoading || !password}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {t('common.loading', 'Загрузка...')}
                                    </>
                                ) : (
                                    t('common.continue', 'Продолжить')
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                )}

                {/* Step 2: New Email Input */}
                {step === 'new-email' && (
                    <form onSubmit={handleEmailChange} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="current-email-display">
                                {t('profile.email.current', 'Текущий Email')}
                            </Label>
                            <Input
                                id="current-email-display"
                                type="email"
                                value={currentEmail}
                                disabled
                                className="bg-muted"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="new-email" className="flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                {t('profile.email.new', 'Новый Email')}
                            </Label>
                            <Input
                                id="new-email"
                                type="email"
                                value={newEmail}
                                onChange={(e) => setNewEmail(e.target.value)}
                                placeholder={t('profile.email.enterNewEmail', 'Введите новый email')}
                                required
                                disabled={isLoading}
                                autoFocus
                            />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={handleClose}>
                                {t('common.cancel', 'Отмена')}
                            </Button>
                            <Button type="submit" disabled={isLoading || !newEmail}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {t('common.loading', 'Загрузка...')}
                                    </>
                                ) : (
                                    t('profile.email.sendVerification', 'Отправить подтверждение')
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                )}

                {/* Step 3: Verification Pending */}
                {step === 'verification' && (
                    <div className="space-y-4">
                        <Alert>
                            <Key className="h-4 w-4" />
                            <AlertDescription>
                                {t(
                                    'profile.email.verificationSent',
                                    'Письмо с подтверждением отправлено на'
                                )}{' '}
                                <strong>{newEmail}</strong>
                            </AlertDescription>
                        </Alert>

                        <div className="text-sm text-muted-foreground space-y-2">
                            <p>
                                {t(
                                    'profile.email.checkInbox',
                                    'Проверьте входящие письма и перейдите по ссылке для подтверждения.'
                                )}
                            </p>
                            <p>
                                {t(
                                    'profile.email.afterVerification',
                                    'После подтверждения ваш email будет изменён.'
                                )}
                            </p>
                        </div>

                        <DialogFooter>
                            <Button onClick={handleSuccess} className="w-full">
                                {t('common.close', 'Закрыть')}
                            </Button>
                        </DialogFooter>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}





