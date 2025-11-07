import { useState, useEffect, useRef, useMemo } from 'react';
import { Layout } from '@/components/Layout';
import LanguageChip from '@/components/LanguageChip';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import NeonSwitch from '@/components/NeonSwitch';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import PasswordChangeForm from '@/components/auth/PasswordChangeForm';
import AvatarUploader from '@/components/AvatarUploader';
import EmailSection from '@/components/EmailSection';
import { SaveButton } from '@/components/SaveButton';
import { HoloPanel } from '@/components/HoloPanel';
import NeonButton from '@/components/NeonButton';
import { User, Settings, Heart, Trophy, Calendar, Bell, UploadCloud, UserCircle, Mail, FileText, CheckCircle2, AlertCircle, RefreshCcw, Circle, CheckCircle, Lock, Shield, Smartphone, Clock, LogOut, Info, Key, XCircle } from 'lucide-react';
import LoadingScreen from '@/components/LoadingScreen';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RolePill } from '@/components/admin/RolePill';

interface ValidationErrors {
    display_name?: string;
    bio?: string;
}

export default function ProfilePage() {
    const { user, profile, updateProfile } = useAuth();
    const { language, setLanguage, t } = useI18n();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [favorites, setFavorites] = useState<any[]>([]);
    const [testResults, setTestResults] = useState<any[]>([]);
    const [gameHistory, setGameHistory] = useState<any[]>([]);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const [formData, setFormData] = useState({
        display_name: profile?.display_name || '',
        bio: profile?.bio || '',
        avatar_url: profile?.avatar_url || '',
        preferred_language: profile?.preferred_language || language,
        notifications_enabled: profile?.notifications_enabled ?? true,
        callsign: profile?.callsign || '',
        phone: profile?.phone || '',
    });

    const [errors, setErrors] = useState<ValidationErrors>({});
    const [hasChanges, setHasChanges] = useState(false);
    const [initialFormData, setInitialFormData] = useState(formData);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isPasswordSaving, setIsPasswordSaving] = useState(false);
    const [showResetDialog, setShowResetDialog] = useState(false);
    const [fieldChanged, setFieldChanged] = useState<string | null>(null);
    // Security: password change local state
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    type Strength = 0 | 1 | 2 | 3 | 4;
    const calcStrength = (pw: string): Strength => {
        let s = 0;
        if (pw.length >= 8) s++;
        if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
        if (/\d/.test(pw)) s++;
        if (/[^A-Za-z0-9]/.test(pw)) s++;
        if (pw.length >= 12) s++;
        return Math.min(s, 4) as Strength;
    };
    const strength = useMemo(() => calcStrength(newPassword), [newPassword]);
    const mismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;

    useEffect(() => {
        if (profile) {
            const data = {
                display_name: profile.display_name || '',
                bio: profile.bio || '',
                avatar_url: profile.avatar_url || '',
                preferred_language: profile.preferred_language || language,
                notifications_enabled: profile.notifications_enabled ?? true,
                callsign: profile.callsign || '',
                phone: profile.phone || '',
            };
            setFormData(data);
            setInitialFormData(data);
        }
    }, [profile, language]);

    useEffect(() => {
        fetchUserData();
    }, []);

    useEffect(() => {
        // Check if form has changes
        const changed = JSON.stringify(formData) !== JSON.stringify(initialFormData);
        setHasChanges(changed);
    }, [formData, initialFormData]);

    // Keyboard shortcut: Ctrl+S to save
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                if (hasChanges && !isSubmitting && !errors.display_name && !errors.bio) {
                    handleSubmit();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [hasChanges, isSubmitting, errors, formData, initialFormData]);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [formData.bio]);

    const fetchUserData = async () => {
        if (!profile?.id) return;

        try {
            // Fetch favorites
            const { data: favData } = await supabase
                .from('user_favorites')
                .select('*')
                .eq('user_id', profile.id);
            setFavorites(favData || []);

            // Fetch test results
            const { data: testData } = await supabase
                .from('user_test_results')
                .select('*')
                .eq('user_id', profile.id);
            setTestResults(testData || []);

            // Fetch game history (placeholder - would need events registration data)
            setGameHistory([]);
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    };

    const validateDisplayName = (value: string): string | undefined => {
        if (value.length === 0) return undefined; // Allow empty for now
        if (value.length < 2) {
            return t('profile.displayNameTooShort');
        }
        if (value.length > 24) {
            return t('profile.displayNameTooLong');
        }
        // Allow letters, numbers, spaces, hyphens
        if (!/^[a-zA-Zа-яА-ЯіІїЇєЄ0-9\s\-]+$/.test(value)) {
            return t('profile.displayNameInvalid');
        }
        return undefined;
    };

    const validateBio = (value: string): string | undefined => {
        if (value.length > 300) {
            return t('profile.bioTooLong');
        }
        return undefined;
    };

    const handleDisplayNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setFormData({ ...formData, display_name: value });

        const error = validateDisplayName(value);
        setErrors({ ...errors, display_name: error });

        // Visual feedback
        setFieldChanged('display_name');
        setTimeout(() => setFieldChanged(null), 200);
    };

    const handleBioChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        setFormData({ ...formData, bio: value });

        const error = validateBio(value);
        setErrors({ ...errors, bio: error });

        // Visual feedback
        setFieldChanged('bio');
        setTimeout(() => setFieldChanged(null), 200);
    };

    const handleCallsignChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setFormData({ ...formData, callsign: value });
        setFieldChanged('callsign');
        setTimeout(() => setFieldChanged(null), 200);
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setFormData({ ...formData, phone: value });
        setFieldChanged('phone');
        setTimeout(() => setFieldChanged(null), 200);
    };

    const handleEnterKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
        }
    };

    const handleReset = () => {
        setShowResetDialog(true);
    };

    const confirmReset = () => {
        setFormData(initialFormData);
        setErrors({});
        setShowResetDialog(false);
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) {
            e.preventDefault();
        }

        // Validate all fields
        const displayNameError = validateDisplayName(formData.display_name);
        const bioError = validateBio(formData.bio);

        if (displayNameError || bioError) {
            setErrors({
                display_name: displayNameError,
                bio: bioError,
            });
            toast({
                title: t('common.error'),
                description: t('profile.updateError'),
                variant: 'destructive'
            });
            return;
        }

        setIsSubmitting(true);
        setLoading(true);

        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    display_name: formData.display_name,
                    bio: formData.bio,
                    avatar_url: formData.avatar_url,
                    preferred_language: formData.preferred_language,
                    notifications_enabled: formData.notifications_enabled,
                    callsign: formData.callsign,
                    phone: formData.phone,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', profile?.id);

            // Вбудована обробка помилок Supabase
            if (error) {
                throw error; // Кидаємо помилку в catch
            }

            // Update language context if changed
            if (formData.preferred_language !== language) {
                setLanguage(formData.preferred_language as any);
            }

            // Update initial form data after successful save
            setInitialFormData(formData);

            toast({
                title: t('common.success'),
                description: t('profile.saved')
            });
        } catch (error: any) {
            // 🔥 ДЕТАЛЬНА ОБРОБКА ПОМИЛОК 🔥
            console.error('Помилка збереження профілю:', error);
            console.error('Деталі помилки:', {
                message: error?.message,
                code: error?.code,
                details: error?.details,
                hint: error?.hint,
                fullError: error
            });

            // Формуємо зрозуміле повідомлення про помилку
            let errorMessage = t('profile.updateError', 'Помилка оновлення профілю');
            
            if (error?.message) {
                errorMessage = error.message;
            } else if (error?.details) {
                errorMessage = error.details;
            } else if (error?.hint) {
                errorMessage = error.hint;
            }

            // Додаємо код помилки, якщо він є
            if (error?.code) {
                errorMessage = `[${error.code}] ${errorMessage}`;
            }

            toast({
                title: t('common.error', 'Помилка'),
                description: errorMessage,
                variant: 'destructive'
            });
            
            throw error; // Re-throw for SaveButton to catch
        } finally {
            setIsSubmitting(false);
            setLoading(false);
        }
    };

    const handlePasswordUpdate = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (newPassword.length < 8 || mismatch) return;
        try {
            setIsPasswordSaving(true);
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;
            toast({ title: t('common.success'), description: t('profile.passwordChanged', 'Password Changed') });
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            console.error('Password change error:', err);
            toast({ title: t('common.error'), description: err?.message || t('errors.passwordChangeError', 'Password Change Error'), variant: 'destructive' });
        } finally {
            setIsPasswordSaving(false);
        }
    };

    if (!profile) {
        return <LoadingScreen label="SCANNING TARGETS…" size={140} />;
    }

    return (
        <Layout showBreadcrumbs>
            <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 py-12">
                <div className="container mx-auto px-4 max-w-4xl">
                    <div className="text-center mb-8">
                        <h1 className="font-rajdhani text-3xl font-bold mb-2">
                            {t('profile.title', 'Profile')}
                        </h1>
                        <p className="text-muted-foreground">
                            {t('profile.settings', 'Settings')}
                        </p>
                    </div>

                    <div className="space-y-6">
                        <Tabs defaultValue="profile" className="w-full">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-start">
                                {/* First row (mobile) / Single row (desktop): first 3 tabs */}
                                <TabsList className="flex gap-2 bg-transparent p-0 justify-center sm:hidden">
                                    <TabsTrigger
                                        value="profile"
                                        className="group flex items-center gap-2 rounded-xl px-4 py-2 text-sm ring-1 ring-emerald-400/20 bg-neutral-900/70 text-neutral-300 hover:ring-emerald-400/40 hover:bg-neutral-900 transition-all data-[state=active]:text-emerald-200 data-[state=active]:bg-[rgba(16,185,129,.08)] data-[state=active]:shadow-[inset_0_0_0_1px_rgba(16,185,129,.25),0_0_32px_-10px_rgba(16,185,129,.6)] cursor-target"
                                    >
                                        <User className="w-4 h-4 group-data-[state=active]:text-emerald-400" />
                                        {t('profile.tabs.profile', 'Profile')}
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="preferences"
                                        className="group flex items-center gap-2 rounded-xl px-4 py-2 text-sm ring-1 ring-emerald-400/20 bg-neutral-900/70 text-neutral-300 hover:ring-emerald-400/40 hover:bg-neutral-900 transition-all data-[state=active]:text-emerald-200 data-[state=active]:bg-[rgba(16,185,129,.08)] data-[state=active]:shadow-[inset_0_0_0_1px_rgba(16,185,129,.25),0_0_32px_-10px_rgba(16,185,129,.6)] cursor-target"
                                    >
                                        <Settings className="w-4 h-4 group-data-[state=active]:text-emerald-400" />
                                        {t('profile.tabs.preferences', 'Settings')}
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="activity"
                                        className="group flex items-center gap-2 rounded-xl px-4 py-2 text-sm ring-1 ring-emerald-400/20 bg-neutral-900/70 text-neutral-300 hover:ring-emerald-400/40 hover:bg-neutral-900 transition-all data-[state=active]:text-emerald-200 data-[state=active]:bg-[rgba(16,185,129,.08)] data-[state=active]:shadow-[inset_0_0_0_1px_rgba(16,185,129,.25),0_0_32px_-10px_rgba(16,185,129,.6)] cursor-target"
                                    >
                                        <Trophy className="w-4 h-4 group-data-[state=active]:text-emerald-400" />
                                        {t('profile.tabs.activity', 'Activity')}
                                    </TabsTrigger>
                                </TabsList>
                                {/* Second row only on mobile: Security; hidden on sm+ */}
                                <TabsList className="flex gap-2 bg-transparent p-0 justify-center sm:hidden">
                                    <TabsTrigger
                                        value="security"
                                        className="group flex items-center gap-2 rounded-xl px-4 py-2 text-sm ring-1 ring-emerald-400/20 bg-neutral-900/70 text-neutral-300 hover:ring-emerald-400/40 hover:bg-neutral-900 transition-all data-[state=active]:text-emerald-200 data-[state=active]:bg-[rgba(16,185,129,.08)] data-[state=active]:shadow-[inset_0_0_0_1px_rgba(16,185,129,.25),0_0_32px_-10px_rgba(16,185,129,.6)] cursor-target"
                                    >
                                        <Settings className="w-4 h-4 group-data-[state=active]:text-emerald-400" />
                                        {t('profile.tabs.security', 'Security')}
                                    </TabsTrigger>
                                </TabsList>
                                {/* Desktop: single centered row of 4 tabs */}
                                <TabsList className="hidden sm:flex w-full gap-3 md:gap-4 bg-transparent p-0 justify-center">
                                    <TabsTrigger
                                        value="profile"
                                        className="group flex items-center gap-2 rounded-xl px-4 py-2 text-sm ring-1 ring-emerald-400/20 bg-neutral-900/70 text-neutral-300 hover:ring-emerald-400/40 hover:bg-neutral-900 transition-all data-[state=active]:text-emerald-200 data-[state=active]:bg-[rgba(16,185,129,.08)] data-[state=active]:shadow-[inset_0_0_0_1px_rgba(16,185,129,.25),0_0_32px_-10px_rgba(16,185,129,.6)] cursor-target"
                                    >
                                        <User className="w-4 h-4 group-data-[state=active]:text-emerald-400" />
                                        {t('profile.tabs.profile', 'Profile')}
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="preferences"
                                        className="group flex items-center gap-2 rounded-xl px-4 py-2 text-sm ring-1 ring-emerald-400/20 bg-neutral-900/70 text-neutral-300 hover:ring-emerald-400/40 hover:bg-neutral-900 transition-all data-[state=active]:text-emerald-200 data-[state=active]:bg-[rgba(16,185,129,.08)] data-[state=active]:shadow-[inset_0_0_0_1px_rgba(16,185,129,.25),0_0_32px_-10px_rgba(16,185,129,.6)] cursor-target"
                                    >
                                        <Settings className="w-4 h-4 group-data-[state=active]:text-emerald-400" />
                                        {t('profile.tabs.preferences', 'Settings')}
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="activity"
                                        className="group flex items-center gap-2 rounded-xl px-4 py-2 text-sm ring-1 ring-emerald-400/20 bg-neutral-900/70 text-neutral-300 hover:ring-emerald-400/40 hover:bg-neutral-900 transition-all data-[state=active]:text-emerald-200 data-[state=active]:bg-[rgba(16,185,129,.08)] data-[state=active]:shadow-[inset_0_0_0_1px_rgba(16,185,129,.25),0_0_32px_-10px_rgba(16,185,129,.6)] cursor-target"
                                    >
                                        <Trophy className="w-4 h-4 group-data-[state=active]:text-emerald-400" />
                                        {t('profile.tabs.activity', 'Activity')}
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="security"
                                        className="group flex items-center gap-2 rounded-xl px-4 py-2 text-sm ring-1 ring-emerald-400/20 bg-neutral-900/70 text-neutral-300 hover:ring-emerald-400/40 hover:bg-neutral-900 transition-all data-[state=active]:text-emerald-200 data-[state=active]:bg-[rgba(16,185,129,.08)] data-[state=active]:shadow-[inset_0_0_0_1px_rgba(16,185,129,.25),0_0_32px_-10px_rgba(16,185,129,.6)] cursor-target"
                                    >
                                        <Settings className="w-4 h-4 group-data-[state=active]:text-emerald-400" />
                                        {t('profile.tabs.security', 'Security')}
                                    </TabsTrigger>
                                </TabsList>
                            </div>

                            <div className="mt-6 mb-8 h-px w-full bg-gradient-to-r from-transparent via-emerald-400/20 to-transparent" />

                            <TabsContent value="profile">
                                <HoloPanel
                                    title={t('profile.personalInfo', 'Personal Information')}
                                    hasChanges={hasChanges}
                                >
                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        <AvatarUploader
                                            currentAvatarUrl={formData.avatar_url}
                                            userId={profile.user_id}
                                            onAvatarChange={(avatarPath) => setFormData({ ...formData, avatar_url: avatarPath || '' })}
                                            displayName={formData.display_name}
                                        />

                                        <div className="my-4 h-px bg-gradient-to-r from-transparent via-emerald-500/25 to-transparent" />

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* === Поле 1: Display Name === */}
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <UserCircle className="w-4 h-4 text-emerald-300/70 drop-shadow-[0_0_8px_rgba(16,185,129,.25)]" />
                                                    <Label htmlFor="display_name" className="flex-1 text-sm text-emerald-200/70">
                                                        {t('profile.displayName', 'Display Name')}
                                                        {formData.display_name ? (
                                                            <span className="text-muted-foreground text-xs ml-2 font-normal">
                                                                ({formData.display_name.length}/24)
                                                            </span>
                                                        ) : null}
                                                    </Label>
                                                </div>
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Input
                                                                id="display_name"
                                                                value={formData.display_name}
                                                                onChange={handleDisplayNameChange}
                                                                onKeyDown={handleEnterKeyDown}
                                                                placeholder={t('profile.displayNamePlaceholder', 'Enter your display name')}
                                                                autoComplete="off"
                                                                className={`cursor-target w-full rounded-xl bg-[#151b19] text-emerald-50 px-3 py-2 ring-1 ring-white/6 shadow-[inset_0_2px_4px_rgba(0,0,0,.6)] outline-none transition-all duration-200 placeholder:text-neutral-500 autofill:!bg-background autofill:!shadow-[inset_0_0_0px_1000px_rgb(var(--background))] hover:bg-[#181f1c] hover:ring-white/10 focus:bg-[#161c1a] focus:ring-emerald-400/40 focus:shadow-[inset_0_2px_4px_rgba(0,0,0,.6),0_0_0_4px_rgba(16,185,129,.05)] ${errors.display_name ? 'ring-red-500/40' : ''} ${fieldChanged === 'display_name'
                                                                    ? 'ring-2 ring-emerald-500/50'
                                                                    : ''
                                                                    }`}
                                                                aria-invalid={!!errors.display_name}
                                                                aria-describedby={errors.display_name ? 'display_name-error' : undefined}
                                                                maxLength={24}
                                                            />
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Это имя будет видно другим пользователям.</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                                {errors.display_name ? (
                                                    <p id="display_name-error" className="text-sm text-destructive flex items-center gap-1">
                                                        <AlertCircle className="w-4 h-4" />
                                                        {errors.display_name}
                                                    </p>
                                                ) : (
                                                    <p className="text-xs text-muted-foreground">
                                                        {t('profile.displayNameHint', '2-24 characters, letters, numbers, spaces')}
                                                    </p>
                                                )}
                                            </div>

                                            {/* === Поле 2: Позывной (НОВЕ) === */}
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <UserCircle className="w-4 h-4 text-emerald-300/70 drop-shadow-[0_0_8px_rgba(16,185,129,.25)]" />
                                                    <Label htmlFor="callsign" className="text-sm text-emerald-200/70">
                                                        Позывной (optional)
                                                    </Label>
                                                </div>
                                                <Input
                                                    id="callsign"
                                                    value={formData.callsign}
                                                    onChange={handleCallsignChange}
                                                    placeholder="Напр. 'Артист'"
                                                    autoComplete="off"
                                                    className={`cursor-target w-full rounded-xl bg-[#151b19] text-emerald-50 px-3 py-2 ring-1 ring-white/6 shadow-[inset_0_2px_4px_rgba(0,0,0,.6)] outline-none transition-all duration-200 placeholder:text-neutral-500 autofill:!bg-background autofill:!shadow-[inset_0_0_0px_1000px_rgb(var(--background))] hover:bg-[#181f1c] hover:ring-white/10 focus:bg-[#161c1a] focus:ring-emerald-400/40 focus:shadow-[inset_0_2px_4px_rgba(0,0,0,.6),0_0_0_4px_rgba(16,185,129,.05)] ${fieldChanged === 'callsign'
                                                        ? 'ring-2 ring-emerald-500/50'
                                                        : ''
                                                        }`}
                                                />
                                                <p className="text-xs text-muted-foreground">
                                                    Ваш ігровий нік (не унікальний)
                                                </p>
                                            </div>

                                            {/* === Поле 3: Email === */}
                                            <div>
                                                <EmailSection
                                                    email={user?.email || ''}
                                                    isVerified={!!user?.email_confirmed_at}
                                                    onEmailChanged={async () => {
                                                        // Refresh user data after email change
                                                        const { data: { user: refreshedUser } } = await supabase.auth.getUser();
                                                        if (refreshedUser) {
                                                            // User data will be automatically updated via AuthContext
                                                        }
                                                    }}
                                                />
                                            </div>

                                            {/* === Поле 4: Телефон (НОВЕ) === */}
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <Smartphone className="w-4 h-4 text-emerald-300/70 drop-shadow-[0_0_8px_rgba(16,185,129,.25)]" />
                                                    <Label htmlFor="phone" className="text-sm text-emerald-200/70">
                                                        Телефон (optional)
                                                    </Label>
                                                </div>
                                                <Input
                                                    id="phone"
                                                    type="tel"
                                                    value={formData.phone}
                                                    onChange={handlePhoneChange}
                                                    placeholder="+380..."
                                                    autoComplete="tel"
                                                    className={`cursor-target w-full rounded-xl bg-[#151b19] text-emerald-50 px-3 py-2 ring-1 ring-white/6 shadow-[inset_0_2px_4px_rgba(0,0,0,.6)] outline-none transition-all duration-200 placeholder:text-neutral-500 autofill:!bg-background autofill:!shadow-[inset_0_0_0px_1000px_rgb(var(--background))] hover:bg-[#181f1c] hover:ring-white/10 focus:bg-[#161c1a] focus:ring-emerald-400/40 focus:shadow-[inset_0_2px_4px_rgba(0,0,0,.6),0_0_0_4px_rgba(16,185,129,.05)] ${fieldChanged === 'phone'
                                                        ? 'ring-2 ring-emerald-500/50'
                                                        : ''
                                                        }`}
                                                />
                                                <p className="text-xs text-muted-foreground">
                                                    Потрібен для зв'язку з організаторами
                                                </p>
                                            </div>
                                        </div>

                                        <div className="my-4 h-px bg-gradient-to-r from-transparent via-emerald-500/25 to-transparent" />

                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <FileText className="w-4 h-4 text-emerald-300/70 drop-shadow-[0_0_8px_rgba(16,185,129,.25)]" />
                                                    <Label htmlFor="bio" className="text-sm text-emerald-200/70">
                                                        {t('profile.bio', 'Bio')}
                                                    </Label>
                                                </div>
                                                <span className={`text-xs ${formData.bio.length > 300 ? 'text-destructive' : 'text-muted-foreground'}`}>
                                                    {formData.bio.length}/300 {t('profile.bioCharacters', 'characters')}
                                                </span>
                                            </div>
                                            <Textarea
                                                ref={textareaRef}
                                                id="bio"
                                                value={formData.bio}
                                                onChange={handleBioChange}
                                                onKeyDown={handleEnterKeyDown}
                                                placeholder="🎯 Люблю страйкбол, техніку та FPV-зйомку."
                                                rows={4}
                                                className={`cursor-target resize-none w-full rounded-xl bg-[#151b19] text-emerald-50 px-3 py-2 min-h-[120px] ring-1 ring-white/6 shadow-[inset_0_2px_4px_rgba(0,0,0,.6)] outline-none transition-all duration-200 placeholder:text-neutral-500 hover:bg-[#181f1c] hover:ring-white/10 focus:bg-[#161c1a] ${errors.bio ? 'ring-red-500/40 focus:ring-red-500/35 focus:shadow-[inset_0_2px_4px_rgba(0,0,0,.6),0_0_0_4px_rgba(239,68,68,.05)]' : 'focus:ring-emerald-400/40 focus:shadow-[inset_0_2px_4px_rgba(0,0,0,.6),0_0_0_4px_rgba(16,185,129,.05)]'} ${fieldChanged === 'bio'
                                                    ? 'ring-2 ring-emerald-500/50'
                                                    : ''
                                                    }`}
                                                aria-invalid={!!errors.bio}
                                                aria-describedby={errors.bio ? 'bio-error' : 'bio-hint'}
                                                maxLength={300}
                                            />
                                            {errors.bio ? (
                                                <p id="bio-error" className="text-sm text-destructive flex items-center gap-1">
                                                    <AlertCircle className="w-4 h-4" />
                                                    {errors.bio}
                                                </p>
                                            ) : (
                                                <p id="bio-hint" className="text-xs text-muted-foreground">
                                                    {t('profile.bioHint', 'Who you are, what you do, interests...')}
                                                </p>
                                            )}
                                            {/* Progress bar */}
                                            <div className="w-full bg-neutral-800/70 rounded-full h-1 ring-1 ring-emerald-400/20">
                                                <div
                                                    className={`h-1 rounded-full transition-all ${formData.bio.length > 300
                                                        ? 'bg-red-500'
                                                        : formData.bio.length > 250
                                                            ? 'bg-yellow-500'
                                                            : 'bg-emerald-500'
                                                        }`}
                                                    style={{ width: `${Math.min((formData.bio.length / 300) * 100, 100)}%` }}
                                                />
                                            </div>
                                        </div>

                                        <div className="flex flex-col sm:flex-row gap-3">
                                            {isSubmitting ? (
                                                <NeonButton
                                                    variant="primary"
                                                    loading={true}
                                                    disabled={true}
                                                    size="lg"
                                                    className="flex-1"
                                                >
                                                    Saving...
                                                </NeonButton>
                                            ) : hasChanges && !errors.display_name && !errors.bio ? (
                                                <NeonButton
                                                    variant="primary"
                                                    size="lg"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        handleSubmit();
                                                    }}
                                                    className="flex-1 bg-[rgba(16,185,129,.15)] text-emerald-100 ring-1 ring-emerald-400/30 px-4 py-2.5 font-medium transition-all hover:bg-[rgba(16,185,129,.22)] hover:text-white hover:shadow-[0_0_40px_-10px_rgba(16,185,129,.6)] active:translate-y-[1px]"
                                                >
                                                    {t('profile.updateProfile', 'Save Changes')}
                                                </NeonButton>
                                            ) : (
                                                <NeonButton
                                                    variant="primary"
                                                    size="lg"
                                                    disabled={true}
                                                    className="flex-1 opacity-60 pointer-events-none"
                                                >
                                                    {t('profile.updateProfile', 'Save Changes')}
                                                </NeonButton>
                                            )}
                                            {hasChanges && (
                                                <NeonButton
                                                    type="button"
                                                    variant="ghost"
                                                    onClick={handleReset}
                                                >
                                                    <RefreshCcw className="w-4 h-4" />
                                                    {t('profile.resetChanges', 'Reset Changes')}
                                                </NeonButton>
                                            )}
                                        </div>
                                    </form>
                                </HoloPanel>
                            </TabsContent>

                            <TabsContent value="preferences">
                                <HoloPanel
                                    title={t('profile.preferences', 'Preferences')}
                                    hasChanges={hasChanges}
                                >
                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                            <div className="space-y-0.5">
                                                <Label>{t('profile.language', 'Language')}</Label>
                                                <p className="text-sm text-muted-foreground">
                                                    {t('profile.languageDescription', 'Choose your preferred language')}
                                                </p>
                                            </div>
                                            <LanguageChip
                                                value={(formData.preferred_language as 'uk' | 'ru' | 'en' | 'pl') || 'uk'}
                                                onChange={(v) => setFormData({ ...formData, preferred_language: v })}
                                            />
                                        </div>

                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                            <div className="space-y-0.5">
                                                <Label className="flex items-center gap-2">
                                                    <Bell className="h-4 w-4" />
                                                    {t('profile.notifications', 'Notifications')}
                                                </Label>
                                                <p className="text-sm text-muted-foreground">
                                                    {t('profile.notificationsDescription', 'Receive notifications about events and updates')}
                                                </p>
                                            </div>
                                            <NeonSwitch
                                                checked={formData.notifications_enabled}
                                                onChange={(checked) => setFormData({ ...formData, notifications_enabled: checked })}
                                                label={t('profile.notifications', 'Notifications')}
                                            />
                                        </div>

                                        <div className="flex flex-col sm:flex-row gap-3">
                                            {isSubmitting ? (
                                                <NeonButton
                                                    variant="primary"
                                                    loading={true}
                                                    disabled={true}
                                                    size="lg"
                                                    className="flex-1"
                                                >
                                                    Saving...
                                                </NeonButton>
                                            ) : hasChanges ? (
                                                <NeonButton
                                                    variant="primary"
                                                    size="lg"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        handleSubmit();
                                                    }}
                                                    className="flex-1 bg-[rgba(16,185,129,.15)] text-emerald-100 ring-1 ring-emerald-400/30 px-4 py-2.5 font-medium transition-all hover:bg-[rgba(16,185,129,.22)] hover:text-white hover:shadow-[0_0_40px_-10px_rgba(16,185,129,.6)] active:translate-y-[1px]"
                                                >
                                                    {t('profile.savePreferences', 'Save Preferences')}
                                                </NeonButton>
                                            ) : (
                                                <NeonButton
                                                    variant="primary"
                                                    size="lg"
                                                    disabled={true}
                                                    className="flex-1 opacity-60 pointer-events-none"
                                                >
                                                    {t('profile.savePreferences', 'Save Preferences')}
                                                </NeonButton>
                                            )}
                                            {hasChanges && (
                                                <NeonButton
                                                    type="button"
                                                    variant="ghost"
                                                    onClick={handleReset}
                                                >
                                                    <RefreshCcw className="w-4 h-4" />
                                                    {t('profile.resetChanges', 'Reset Changes')}
                                                </NeonButton>
                                            )}
                                        </div>
                                    </form>
                                </HoloPanel>
                            </TabsContent>

                            <TabsContent value="activity">
                                <div className="grid gap-6">
                                    <Card className="glass-panel">
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <Heart className="w-5 h-5" />
                                                {t('profile.favorites', 'Favorites')}
                                                <Badge variant="secondary">{favorites.length}</Badge>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            {favorites.length === 0 ? (
                                                <p className="text-muted-foreground text-center py-8">
                                                    {t('profile.noFavorites', 'No favorites yet')}
                                                </p>
                                            ) : (
                                                <div className="space-y-2">
                                                    {favorites.slice(0, 5).map((fav, index) => (
                                                        <div key={index} className="p-3 bg-muted/50 rounded-lg">
                                                            <div className="font-medium">{fav.entity_type}</div>
                                                            <div className="text-sm text-muted-foreground">{fav.entity_id}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>

                                    <Card className="glass-panel">
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <Trophy className="w-5 h-5" />
                                                {t('profile.testResults', 'Test Results')}
                                                <Badge variant="secondary">{testResults.length}</Badge>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            {testResults.length === 0 ? (
                                                <p className="text-muted-foreground text-center py-8">
                                                    {t('profile.noTestResults', 'No test results yet')}
                                                </p>
                                            ) : (
                                                <div className="space-y-2">
                                                    {testResults.slice(0, 5).map((result, index) => (
                                                        <div key={index} className="p-3 bg-muted/50 rounded-lg flex justify-between">
                                                            <div>
                                                                <div className="font-medium">{result.test_id}</div>
                                                                <div className="text-sm text-muted-foreground">
                                                                    {new Date(result.completed_at).toLocaleDateString()}
                                                                </div>
                                                            </div>
                                                            <Badge variant={result.score >= 80 ? 'default' : 'secondary'}>
                                                                {result.score}%
                                                            </Badge>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </div>
                            </TabsContent>

                            <TabsContent value="security">
                                <HoloPanel
                                    title={t('profile.security', 'Security Settings')}
                                    hasChanges={false}
                                >
                                    <div className="space-y-6">
                                        {/* Password Change Section */}
                                        <div className="space-y-4">
                                            <h3 className="text-base font-semibold text-emerald-100 flex items-center gap-2">
                                                <Key className="w-4 h-4 text-emerald-300/70" />
                                                {t('profile.changePassword', 'Change Password')}
                                            </h3>
                                            <form className="space-y-4" onSubmit={handlePasswordUpdate}>
                                                <div className="space-y-2">
                                                    <Label htmlFor="newPassword">{t('profile.newPassword', 'New Password')}</Label>
                                                    <Input
                                                        id="newPassword"
                                                        type="password"
                                                        value={newPassword}
                                                        onChange={(e) => setNewPassword(e.target.value)}
                                                        placeholder="Enter new password"
                                                        className="cursor-target w-full rounded-xl bg-[#151b19] text-emerald-50 px-3 py-2 ring-1 ring-white/6 shadow-[inset_0_2px_4px_rgba(0,0,0,.6)] outline-none transition-all duration-200 placeholder:text-neutral-500 hover:bg-[#181f1c] hover:ring-white/10 focus:bg-[#161c1a] focus:ring-emerald-400/40 focus:shadow-[inset_0_2px_4px_rgba(0,0,0,.6),0_0_0_4px_rgba(16,185,129,.08)]"
                                                    />
                                                    {/* Strength bar */}
                                                    <div className="mt-2">
                                                        <div className="flex h-2 overflow-hidden rounded-md ring-1 ring-white/10">
                                                            {[0, 1, 2, 3].map((i) => (
                                                                <div key={i} className={`flex-1 ${i < strength ? (strength === 0 ? 'bg-red-500' : strength === 1 ? 'bg-orange-500' : strength === 2 ? 'bg-yellow-500' : 'bg-emerald-500') : 'bg-white/10'} ${i > 0 ? 'ml-1' : ''}`} />
                                                            ))}
                                                        </div>
                                                        <div className="mt-1 text-xs text-neutral-400">
                                                            {strength === 0 ? 'Very weak' : strength === 1 ? 'Weak' : strength === 2 ? 'Medium' : strength === 3 ? 'Strong' : 'Excellent'}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="confirmPassword">{t('profile.confirmPassword', 'Confirm New Password')}</Label>
                                                    <Input
                                                        id="confirmPassword"
                                                        type="password"
                                                        value={confirmPassword}
                                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                                        placeholder="Confirm new password"
                                                        className={`cursor-target w-full rounded-xl bg-[#151b19] text-emerald-50 px-3 py-2 ring-1 ring-white/6 shadow-[inset_0_2px_4px_rgba(0,0,0,.6)] outline-none transition-all duration-200 placeholder:text-neutral-500 hover:bg-[#181f1c] hover:ring-white/10 focus:bg-[#161c1a] ${mismatch ? 'ring-red-500/50 focus:shadow-[inset_0_2px_4px_rgba(0,0,0,.6),0_0_0_4px_rgba(239,68,68,.08)]' : 'focus:ring-emerald-400/40 focus:shadow-[inset_0_2px_4px_rgba(0,0,0,.6),0_0_0_4px_rgba(16,185,129,.08)]'}`}
                                                    />
                                                    {mismatch ? (
                                                        <p className="mt-1 inline-flex items-center gap-1 text-sm text-red-400">
                                                            <XCircle className="h-4 w-4" /> Passwords do not match
                                                        </p>
                                                    ) : (confirmPassword && newPassword) ? (
                                                        <p className="mt-1 inline-flex items-center gap-1 text-sm text-emerald-400">
                                                            <CheckCircle2 className="h-4 w-4" /> Passwords match
                                                        </p>
                                                    ) : null}
                                                </div>

                                                {/* Password tips under the change block */}
                                                <div className="mt-1 rounded-xl bg-[#0e1512]/70 ring-1 ring-emerald-400/15 p-4">
                                                    <div className="mb-2 text-sm font-medium text-emerald-200/80">Password Tips</div>
                                                    <ul className="list-disc list-inside space-y-1 text-sm text-neutral-400">
                                                        <li>Use at least 8 characters with letters, numbers, and symbols</li>
                                                        <li>Avoid personal info or common words</li>
                                                        <li>Don’t reuse passwords from other accounts</li>
                                                        <li>Consider using a password manager</li>
                                                    </ul>
                                                </div>

                                                <NeonButton
                                                    variant="primary"
                                                    size="lg"
                                                    className="w-full"
                                                    disabled={isPasswordSaving || newPassword.length < 8 || mismatch}
                                                >
                                                    <Lock className="w-4 h-4" />
                                                    {isPasswordSaving ? 'Updating…' : t('profile.updatePassword', 'Update Password')}
                                                </NeonButton>
                                            </form>
                                        </div>
                                        <div className="h-px bg-gradient-to-r from-transparent via-emerald-500/25 to-transparent" />

                                        {/* Two-Factor Authentication Section */}
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h3 className="text-base font-semibold text-emerald-100 flex items-center gap-2 mb-1">
                                                        <Shield className="w-4 h-4 text-emerald-300/70" />
                                                        Two-Factor Authentication
                                                    </h3>
                                                    <p className="text-sm text-neutral-400">Add an extra layer of protection for your account.</p>
                                                </div>
                                                <span className="rounded-full px-3 py-1 text-xs ring-1 bg-neutral-800 text-neutral-300 ring-white/10">Disabled</span>
                                            </div>
                                            <div className="mt-2">
                                                <NeonButton variant="primary" size="md">
                                                    Enable 2FA
                                                </NeonButton>
                                            </div>
                                        </div>

                                        <div className="h-px bg-gradient-to-r from-transparent via-emerald-500/25 to-transparent" />

                                        {/* Active Sessions Section */}
                                        <div className="space-y-4">
                                            <h3 className="text-base font-semibold text-emerald-100 flex items-center gap-2">
                                                <Clock className="w-4 h-4 text-emerald-300/70" />
                                                Active Sessions
                                            </h3>
                                            <div className="rounded-xl bg-[#151b19] p-4 ring-1 ring-white/6">
                                                <div className="text-sm text-muted-foreground">No active sessions</div>
                                            </div>
                                        </div>

                                        <div className="h-px bg-gradient-to-r from-transparent via-emerald-500/25 to-transparent" />


                                        <div className="h-px bg-gradient-to-r from-transparent via-emerald-500/25 to-transparent" />

                                        {/* Account Information */}
                                        <div className="space-y-4">
                                            <h3 className="text-base font-semibold text-emerald-100 flex items-center gap-2">
                                                <Settings className="w-4 h-4 text-emerald-300/70" />
                                                {t('profile.accountInfo', 'Account Information')}
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <Label className="text-sm text-emerald-200/70">{t('profile.memberSince', 'Member since')}</Label>
                                                    <div className="text-sm text-neutral-400 mt-1">
                                                        {new Date(profile.created_at).toLocaleDateString()}
                                                    </div>
                                                </div>
                                                <div>
                                                    <Label className="text-sm text-emerald-200/70">{t('profile.lastUpdate', 'Last updated')}</Label>
                                                    <div className="text-sm text-neutral-400 mt-1">
                                                        {new Date(profile.updated_at).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Label className="text-sm text-emerald-200/70">{t('profile.role', 'Role')}</Label>
                                                <RolePill role={profile.role || 'user'} />
                                            </div>
                                        </div>
                                    </div>
                                </HoloPanel>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </div>

            {/* Reset Changes Dialog */}
            <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('profile.resetChanges', 'Reset Changes')}?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Сбросить изменения? Все несохранённые данные будут потеряны.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="cursor-target">
                            {t('common.cancel')}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmReset}
                            className="cursor-target bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {t('profile.resetChanges', 'Reset Changes')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Layout>
    );
}
