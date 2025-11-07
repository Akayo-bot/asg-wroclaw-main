import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useI18n } from '@/contexts/I18nContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Mail, CheckCircle2, AlertCircle, RefreshCw, Edit, MailWarning } from 'lucide-react';
import { cn } from '@/lib/utils';
import EmailChangeModal from '@/components/auth/EmailChangeModal';

interface EmailSectionProps {
    email: string;
    isVerified: boolean;
    onEmailChanged?: () => void;
}

export default function EmailSection({ email, isVerified, onEmailChanged }: EmailSectionProps) {
    const { t } = useI18n();
    const { toast } = useToast();
    const [isResending, setIsResending] = useState(false);
    const [isChangeModalOpen, setIsChangeModalOpen] = useState(false);

    const handleResendVerification = async () => {
        setIsResending(true);

        try {
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email: email,
            });

            if (error) {
                toast({
                    title: t('common.error', 'Ошибка'),
                    description: error.message,
                    variant: 'destructive',
                });
                return;
            }

            toast({
                title: t('profile.email.verificationSentTitle', 'Письмо отправлено'),
                description: t(
                    'profile.email.verificationSentDesc',
                    'Проверьте входящие письма для подтверждения email'
                ),
            });
        } catch (error: any) {
            toast({
                title: t('common.error', 'Ошибка'),
                description: error.message || t('common.errorOccurred', 'Произошла ошибка'),
                variant: 'destructive',
            });
        } finally {
            setIsResending(false);
        }
    };

    const handleEmailChanged = () => {
        toast({
            title: t('profile.email.changeSuccessTitle', 'Email изменён'),
            description: t(
                'profile.email.changeSuccessDesc',
                'Проверьте новый email для подтверждения'
            ),
        });

        if (onEmailChanged) {
            onEmailChanged();
        }
    };

    return (
        <>
            <div className="space-y-3">
                {/* Email Display with Inline Edit Icon */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-emerald-300/70 drop-shadow-[0_0_8px_rgba(16,185,129,.25)]" />
                        <span className="text-sm font-medium text-emerald-200/70">
                            {t('profile.email', 'Email')}
                        </span>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="text-base font-mono break-all">{email}</span>
                            <button
                                type="button"
                                onClick={() => setIsChangeModalOpen(true)}
                                className="cursor-target p-1.5 hover:bg-muted rounded-md hover:scale-105 flex-shrink-0 transition-all duration-200"
                                aria-label={t('profile.email.change', 'Изменить email')}
                                title={t('profile.email.change', 'Изменить email')}
                            >
                                <Edit className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                            </button>
                        </div>
                        <div className="flex items-center">
                            {isVerified ? (
                                <Badge
                                    variant="default"
                                    className="bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20 w-fit"
                                >
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    {t('profile.email.verified', 'Подтверждён')}
                                </Badge>
                            ) : (
                                <Badge
                                    variant="secondary"
                                    className="bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20 border-yellow-500/20 w-fit"
                                >
                                    <MailWarning className="w-3 h-3 mr-1" />
                                    {t('profile.email.notVerified', 'Не подтверждён')}
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>

                {/* Resend Verification Alert */}
                {!isVerified && (
                    <Alert className="bg-yellow-500/5 border-yellow-500/20">
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                        <AlertDescription className="flex items-center justify-between gap-2">
                            <span className="text-sm">
                                {t(
                                    'profile.email.pleaseVerify',
                                    'Пожалуйста, подтвердите ваш email адрес'
                                )}
                            </span>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={handleResendVerification}
                                disabled={isResending}
                                className={cn(
                                    'text-yellow-600 hover:text-yellow-700 hover:bg-yellow-500/10',
                                    'cursor-target'
                                )}
                            >
                                <RefreshCw
                                    className={cn('w-4 h-4 mr-2', isResending && 'animate-spin')}
                                />
                                {t('profile.email.resend', 'Отправить повторно')}
                            </Button>
                        </AlertDescription>
                    </Alert>
                )}
            </div>

            {/* Email Change Modal */}
            <EmailChangeModal
                isOpen={isChangeModalOpen}
                onClose={() => setIsChangeModalOpen(false)}
                currentEmail={email}
                onEmailChanged={handleEmailChanged}
            />
        </>
    );
}





