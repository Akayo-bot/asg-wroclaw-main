import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import { supabase } from '@/integrations/supabase/client';
import LoadingScreen from '@/components/LoadingScreen';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Camera, Edit2, GripVertical, Plus, Shield, ShieldAlert, Trash2, User, UserCheck, UserCog, UserRoundCheck, UserRoundCog, UserRoundPlus, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tables } from '@/integrations/supabase/types';
import AdminShell from '@/components/admin/AdminShell';
import { NeonPopoverList } from '@/components/admin/NeonPopoverList';
import { useAuth } from '@/contexts/AuthContext';
import { getGlassToastClassName, getGlassToastVariant } from '@/lib/glass-toast';
import { GlassConfirmDialog } from '@/components/ui/GlassConfirmDialog';

type TeamMember = Tables<'team_members'>;
type SiteProfile = Tables<'profiles'> & {
    callsign?: string | null;
    status?: string | null;
    phone?: string | null;
    real_name?: string | null;
};

type RolePreset = {
    id: string;
    label: string;
    role_uk: string;
    role_ru: string;
    role_pl: string;
    role_en: string;
    badgeClass: string;
};

interface TeamMemberForm {
    callsign: string;
    real_name: string;
    role_uk: string;
    role_ru: string;
    role_pl: string;
    role_en: string;
    bio_uk: string;
    bio_ru: string;
    bio_pl: string;
    bio_en: string;
    photo_url: string;
    social_links: unknown;
}

const ROLE_PRESETS: RolePreset[] = [
    {
        id: 'organizer',
        label: 'Организатор',
        role_uk: 'Організатор',
        role_ru: 'Организатор',
        role_pl: 'Organizator',
        role_en: 'Organizer',
        badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35',
    },
    {
        id: 'coordinator',
        label: 'Координатор',
        role_uk: 'Координатор',
        role_ru: 'Координатор',
        role_pl: 'Koordynator',
        role_en: 'Coordinator',
        badgeClass: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/35',
    },
    {
        id: 'referee',
        label: 'Судья',
        role_uk: 'Суддя',
        role_ru: 'Судья',
        role_pl: 'Sędzia',
        role_en: 'Referee',
        badgeClass: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/35',
    },
    {
        id: 'media',
        label: 'Медиа',
        role_uk: 'Медіа',
        role_ru: 'Медиа',
        role_pl: 'Media',
        role_en: 'Media',
        badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/35',
    },
    {
        id: 'instructor',
        label: 'Инструктор',
        role_uk: 'Інструктор',
        role_ru: 'Инструктор',
        role_pl: 'Instruktor',
        role_en: 'Instructor',
        badgeClass: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/35',
    },
    {
        id: 'npc',
        label: 'НПС',
        role_uk: 'НПС',
        role_ru: 'НПС',
        role_pl: 'NPC',
        role_en: 'NPC',
        badgeClass: 'bg-violet-500/15 text-violet-300 border-violet-500/35',
    },
    {
        id: 'side_commander',
        label: 'Командир стороны',
        role_uk: 'Командир сторони',
        role_ru: 'Командир стороны',
        role_pl: 'Dowódca strony',
        role_en: 'Side Commander',
        badgeClass: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/35',
    },
    {
        id: 'technician',
        label: 'Техник',
        role_uk: 'Технік',
        role_ru: 'Техник',
        role_pl: 'Technik',
        role_en: 'Technician',
        badgeClass: 'bg-violet-500/15 text-violet-300 border-violet-500/35',
    },
    {
        id: 'medic',
        label: 'Медик',
        role_uk: 'Медик',
        role_ru: 'Медик',
        role_pl: 'Medyk',
        role_en: 'Medic',
        badgeClass: 'bg-rose-500/15 text-rose-300 border-rose-500/35',
    },
];

const LEGACY_MEDIA_ROLE_VALUES = new Set([
    'фотограф',
    'photographer',
    'fotograf',
]);

const MEDIA_ROLE_BY_LANGUAGE = {
    uk: 'Медіа',
    ru: 'Медиа',
    pl: 'Media',
    en: 'Media',
} as const;

const CUSTOM_ROLE_BADGE_CLASS = 'bg-white/15 text-white border-white/45';

const normalizeRoleValue = (value: string) => value.trim().toLowerCase();

const isLegacyMediaRole = (value?: string | null) => {
    if (!value) return false;
    return LEGACY_MEDIA_ROLE_VALUES.has(normalizeRoleValue(value));
};

const parseJsonObject = (value: unknown): Record<string, unknown> => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
        return { ...(value as Record<string, unknown>) };
    }
    return {};
};

const getProfileCallsign = (profile: SiteProfile) => {
    if (profile.callsign && profile.callsign.trim().length > 0) {
        return profile.callsign.trim();
    }
    if (profile.display_name && profile.display_name.trim().length > 0) {
        return profile.display_name.trim();
    }
    return '';
};

const getProfileNickname = (profile: SiteProfile) => {
    if (profile.display_name && profile.display_name.trim().length > 0) {
        return profile.display_name.trim();
    }
    if (profile.callsign && profile.callsign.trim().length > 0) {
        return profile.callsign.trim();
    }
    return '';
};

const TeamManager = () => {
    const { t, language } = useI18n();
    const { profile } = useAuth();
    const { toast } = useToast();
    const canViewTeam = ['superadmin', 'admin', 'editor'].includes(profile?.role || '');
    const canManageTeam = profile?.role === 'superadmin';
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [profiles, setProfiles] = useState<SiteProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [profilesLoading, setProfilesLoading] = useState(true);
    const [draggedMemberId, setDraggedMemberId] = useState<string | null>(null);
    const [dragOverMemberId, setDragOverMemberId] = useState<string | null>(null);
    const [isOrderSaving, setIsOrderSaving] = useState(false);
    const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedProfileId, setSelectedProfileId] = useState('');
    const [selectedRolePresetId, setSelectedRolePresetId] = useState(ROLE_PRESETS[0].id);
    const [customRoleMode, setCustomRoleMode] = useState(false);
    const [customRoleError, setCustomRoleError] = useState('');
    const [formData, setFormData] = useState<TeamMemberForm>({
        callsign: '',
        real_name: '',
        role_uk: ROLE_PRESETS[0].role_uk,
        role_ru: ROLE_PRESETS[0].role_ru,
        role_pl: ROLE_PRESETS[0].role_pl,
        role_en: ROLE_PRESETS[0].role_en,
        bio_uk: '',
        bio_ru: '',
        bio_pl: '',
        bio_en: '',
        photo_url: '',
        social_links: {},
    });
    const customRoleInputRef = useRef<HTMLInputElement | null>(null);
    const [profileSearchQuery, setProfileSearchQuery] = useState('');
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const profileDropdownRef = useRef<HTMLDivElement | null>(null);

    const visibleProfiles = useMemo(
        () => profiles.filter((profile) => profile.status !== 'hidden'),
        [profiles]
    );

    const selectedProfile = useMemo(
        () => visibleProfiles.find((profile) => profile.id === selectedProfileId) || null,
        [selectedProfileId, visibleProfiles]
    );

    const roleOptions = useMemo(
        () => [
            ...ROLE_PRESETS.map((preset) => ({
                id: preset.id,
                label: (
                    <span className={`inline-flex items-center gap-2 rounded-md px-2 py-0.5 border text-xs ${preset.badgeClass}`}>
                        {preset.label}
                    </span>
                ),
                textLabel: preset.label,
                textColor: 'text-white',
                hoverColor: 'teal' as const,
            })),
            {
                id: 'custom',
                label: (
                    <span className={`inline-flex items-center gap-2 rounded-md px-2 py-0.5 border text-xs font-semibold text-inherit transition-colors ${CUSTOM_ROLE_BADGE_CLASS} group-hover:border-[#46D6C8]/60 group-hover:bg-[#46D6C8]/20`}>
                        Своя роль
                    </span>
                ),
                textLabel: 'Своя роль',
                textColor: 'text-white font-semibold',
                hoverColor: 'emerald' as const,
            },
        ],
        []
    );

    const filteredProfileSuggestions = useMemo(() => {
        const query = profileSearchQuery.trim().toLowerCase();
        if (!query) return visibleProfiles;
        return visibleProfiles.filter((profile) => {
            const nickname = getProfileNickname(profile).toLowerCase();
            const realName = (profile.real_name?.trim() || '').toLowerCase();
            return nickname.includes(query) || realName.includes(query);
        });
    }, [visibleProfiles, profileSearchQuery]);

    const getRole = (member: TeamMember) => {
        if (language === 'ru') {
            return isLegacyMediaRole(member.role_ru) ? MEDIA_ROLE_BY_LANGUAGE.ru : member.role_ru;
        }
        if (language === 'pl') {
            return isLegacyMediaRole(member.role_pl) ? MEDIA_ROLE_BY_LANGUAGE.pl : member.role_pl;
        }
        if (language === 'en') {
            const roleEn = member.role_en || member.role_uk;
            return isLegacyMediaRole(roleEn) ? MEDIA_ROLE_BY_LANGUAGE.en : roleEn;
        }
        return isLegacyMediaRole(member.role_uk) ? MEDIA_ROLE_BY_LANGUAGE.uk : member.role_uk;
    };

    const getBio = (member: TeamMember): string => {
        const safeBio = (val: unknown): string => {
            if (typeof val === 'string' && val.trim().length > 0 && val.trim() !== '0') return val;
            return '';
        };
        if (language === 'ru') return safeBio(member.bio_ru) || safeBio(member.bio_uk);
        if (language === 'pl') return safeBio(member.bio_pl) || safeBio(member.bio_uk);
        if (language === 'en') return safeBio(member.bio_en) || safeBio(member.bio_uk);
        return safeBio(member.bio_uk);
    };

    const getRoleVisual = (role: string) => {
        const roleLower = normalizeRoleValue(role);
        const isOrganizerRole =
            roleLower.includes('организатор') ||
            roleLower.includes('організатор') ||
            roleLower.includes('organizator') ||
            roleLower.includes('organizer');
        const isCoordinatorRole =
            roleLower.includes('координатор') ||
            roleLower.includes('koordynator') ||
            roleLower.includes('coordinator');
        const isMediaRole =
            roleLower.includes('медиа') ||
            roleLower.includes('медіа') ||
            roleLower.includes('media') ||
            roleLower.includes('фотограф') ||
            roleLower.includes('photo') ||
            roleLower.includes('fotograf');
        const isRefereeRole =
            roleLower.includes('судья') ||
            roleLower.includes('суддя') ||
            roleLower.includes('sędzia') ||
            roleLower.includes('referee');
        const isInstructorRole =
            roleLower.includes('инструктор') ||
            roleLower.includes('інструктор') ||
            roleLower.includes('instruktor') ||
            roleLower.includes('instructor');
        const isNpcRole = roleLower === 'нпс' || roleLower.includes('npc');
        const isSideCommanderRole =
            roleLower.includes('командир стороны') ||
            roleLower.includes('командир сторони') ||
            roleLower.includes('dowódca strony') ||
            roleLower.includes('side commander');
        const isTechnicianRole =
            roleLower.includes('техник') ||
            roleLower.includes('технік') ||
            roleLower.includes('technik') ||
            roleLower.includes('technician');
        const isMedicRole =
            roleLower.includes('медик') ||
            roleLower.includes('medic') ||
            roleLower.includes('medyk');

        const matchedPreset =
            ROLE_PRESETS.find((preset) =>
                [preset.role_uk, preset.role_ru, preset.role_pl, preset.role_en]
                    .some((value) => normalizeRoleValue(value) === roleLower)
            ) ||
            (isMediaRole ? ROLE_PRESETS.find((preset) => preset.id === 'media') : undefined);

        const icon = isMediaRole
            ? <Camera className="h-3.5 w-3.5" />
            : isMedicRole
                ? <UserRoundPlus className="h-3.5 w-3.5" />
                : isTechnicianRole
                    ? <UserRoundCog className="h-3.5 w-3.5" />
                    : isSideCommanderRole
                        ? <ShieldAlert className="h-3.5 w-3.5" />
                        : isInstructorRole
                            ? <UserCog className="h-3.5 w-3.5" />
                            : isRefereeRole
                                ? <UserCheck className="h-3.5 w-3.5" />
                                : isCoordinatorRole
                                    ? <UserRoundCheck className="h-3.5 w-3.5" />
                                    : isOrganizerRole
                                        ? <Users className="h-3.5 w-3.5" />
                                        : isNpcRole
                                            ? <User className="h-3.5 w-3.5" />
                                            : <Shield className="h-3.5 w-3.5" />;

        return {
            icon,
            badgeClass: matchedPreset?.badgeClass || CUSTOM_ROLE_BADGE_CLASS,
        };
    };

    const applyProfileToForm = (profile: SiteProfile) => {
        const callsign = getProfileNickname(profile);
        const bio = profile.bio?.trim() || '';

        setFormData((prev) => {
            const social = parseJsonObject(prev.social_links);
            return {
                ...prev,
                callsign: callsign || '',
                real_name: profile.real_name?.trim() || '',
                photo_url: profile.avatar_url || '',
                bio_uk: bio,
                bio_ru: bio,
                bio_pl: bio,
                bio_en: bio,
                social_links: {
                    ...social,
                    source_profile_id: profile.id,
                    source_user_id: profile.user_id,
                },
            };
        });
    };

    const resetForm = (closeDialog = true) => {
        const defaultRole = ROLE_PRESETS[0];

        setFormData({
            callsign: '',
            real_name: '',
            role_uk: defaultRole.role_uk,
            role_ru: defaultRole.role_ru,
            role_pl: defaultRole.role_pl,
            role_en: defaultRole.role_en,
            bio_uk: '',
            bio_ru: '',
            bio_pl: '',
            bio_en: '',
            photo_url: '',
            social_links: {},
        });
        setSelectedRolePresetId(defaultRole.id);
        setCustomRoleMode(false);
        setCustomRoleError('');
        setSelectedProfileId('');
        setProfileSearchQuery('');
        setIsProfileDropdownOpen(false);
        setEditingMember(null);
        if (closeDialog) {
            setIsDialogOpen(false);
        }
    };

    useEffect(() => {
        fetchMembers();
        fetchProfiles();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
                setIsProfileDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchMembers = async () => {
        try {
            const { data, error } = await supabase
                .from('team_members')
                .select('*')
                .order('display_order', { ascending: true });

            if (error) throw error;
            setMembers(data || []);
        } catch (error) {
            console.error('Error fetching team members:', error);
            toast({
                title: t('common.error', 'Error'),
                description: t('team.fetch_error', 'Failed to fetch team members'),
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchProfiles = async () => {
        try {
            setProfilesLoading(true);
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('display_name', { ascending: true });

            if (error) throw error;
            setProfiles((data || []) as SiteProfile[]);
        } catch (error) {
            console.error('Error fetching profiles:', error);
            toast({
                title: t('common.error', 'Error'),
                description: t('team.fetch_users_error', 'Failed to fetch users'),
                variant: 'destructive',
            });
        } finally {
            setProfilesLoading(false);
        }
    };

    const handleProfileSelect = (profileId: string) => {
        const profile = visibleProfiles.find((item) => item.id === profileId);
        if (!profile) return;
        setSelectedProfileId(profileId);
        setProfileSearchQuery(getProfileNickname(profile));
        setIsProfileDropdownOpen(false);
        applyProfileToForm(profile);
    };

    const activateCustomRoleMode = (alwaysClear = false) => {
        const isSwitchingToCustom = selectedRolePresetId !== 'custom' || !customRoleMode;
        setSelectedRolePresetId('custom');
        setCustomRoleMode(true);
        setCustomRoleError('');

        if (!alwaysClear && !isSwitchingToCustom) return;

        setFormData((prev) => ({
            ...prev,
            role_uk: '',
            role_ru: '',
            role_pl: '',
            role_en: '',
        }));
    };

    const handleRolePresetSelect = (value: string) => {
        setSelectedRolePresetId(value);
        if (value === 'custom') {
            activateCustomRoleMode();
            return;
        }

        const preset = ROLE_PRESETS.find((item) => item.id === value);
        if (!preset) return;

        setCustomRoleMode(false);
        setCustomRoleError('');
        setFormData((prev) => ({
            ...prev,
            role_uk: preset.role_uk,
            role_ru: preset.role_ru,
            role_pl: preset.role_pl,
            role_en: preset.role_en,
        }));
    };

    const editMember = (member: TeamMember) => {
        if (!canManageTeam) {
            toast({
                title: t('common.error', 'Error'),
                description: 'Редактирование доступно только для SuperAdmin.',
                variant: 'destructive',
            });
            return;
        }

        const memberRoleValues = [member.role_uk, member.role_ru, member.role_pl, member.role_en]
            .filter(Boolean)
            .map((roleValue) => normalizeRoleValue(roleValue || ''));

        const rolePreset =
            ROLE_PRESETS.find((preset) =>
                [preset.role_uk, preset.role_ru, preset.role_pl, preset.role_en]
                    .some((roleValue) => memberRoleValues.includes(normalizeRoleValue(roleValue)))
            ) ||
            (memberRoleValues.some((roleValue) => LEGACY_MEDIA_ROLE_VALUES.has(roleValue))
                ? ROLE_PRESETS.find((preset) => preset.id === 'media')
                : undefined);
        const social = parseJsonObject(member.social_links);
        const sourceProfileIdRaw = social.source_profile_id;
        const sourceProfileId = typeof sourceProfileIdRaw === 'string' ? sourceProfileIdRaw : '';
        const sourceProfile =
            visibleProfiles.find((profile) => profile.id === sourceProfileId) ||
            visibleProfiles.find((profile) => getProfileNickname(profile).toLowerCase() === member.callsign.toLowerCase()) ||
            visibleProfiles.find((profile) => getProfileCallsign(profile).toLowerCase() === member.callsign.toLowerCase()) ||
            visibleProfiles.find((profile) => (profile.display_name || '').toLowerCase() === (member.real_name || '').toLowerCase()) ||
            null;

        setEditingMember(member);
        setFormData({
            callsign: member.callsign,
            real_name: member.real_name || '',
            role_uk: member.role_uk,
            role_ru: member.role_ru,
            role_pl: member.role_pl,
            role_en: member.role_en || '',
            bio_uk: member.bio_uk || '',
            bio_ru: member.bio_ru || '',
            bio_pl: member.bio_pl || '',
            bio_en: member.bio_en || '',
            photo_url: member.photo_url || '',
            social_links: member.social_links || {},
        });
        setSelectedProfileId(sourceProfile?.id || '');
        setProfileSearchQuery(sourceProfile ? getProfileNickname(sourceProfile) : member.callsign || '');
        setIsProfileDropdownOpen(false);
        setSelectedRolePresetId(rolePreset ? rolePreset.id : 'custom');
        setCustomRoleMode(!rolePreset);
        setCustomRoleError('');
        if (sourceProfile) {
            applyProfileToForm(sourceProfile);
        }
        setIsDialogOpen(true);
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!canManageTeam) {
            toast({
                title: t('common.error', 'Error'),
                description: 'Добавление доступно только для SuperAdmin.',
                variant: 'destructive',
            });
            return;
        }

        const manualNickname = profileSearchQuery.trim();
        if (!selectedProfileId && !manualNickname) {
            toast({
                title: t('common.error', 'Error'),
                description: 'Выберите пользователя или введите ник.',
                variant: 'destructive',
            });
            return;
        }

        if (!selectedProfileId && manualNickname && !formData.callsign.trim()) {
            setFormData((prev) => ({ ...prev, callsign: manualNickname }));
        }

        const roleBase = formData.role_uk.trim();
        if (!roleBase) {
            if (customRoleMode || selectedRolePresetId === 'custom') {
                const customRoleErrorMessage = 'Укажите свою роль, чтобы продолжить.';
                setCustomRoleError(customRoleErrorMessage);
                customRoleInputRef.current?.focus();
                toast({
                    title: t('common.error', 'Error'),
                    description: customRoleErrorMessage,
                    variant: getGlassToastVariant('error'),
                    className: getGlassToastClassName('error'),
                });
                return;
            }
            toast({
                title: t('common.error', 'Error'),
                description: t('team.role_required', 'Role is required'),
                variant: 'destructive',
            });
            return;
        }

        const callsign = formData.callsign.trim();
        if (!callsign) {
            toast({
                title: t('common.error', 'Error'),
                description: t('team.callsign_required', 'Nickname is required in user profile'),
                variant: 'destructive',
            });
            return;
        }

        setLoading(true);

        try {
            const bioBase = formData.bio_uk.trim() || selectedProfile?.bio?.trim() || '';
            const social = parseJsonObject(formData.social_links);

            const memberData = {
                callsign,
                real_name: formData.real_name.trim() || null,
                role_uk: roleBase,
                role_ru: roleBase,
                role_pl: roleBase,
                role_en: roleBase,
                bio_uk: bioBase || null,
                bio_ru: bioBase || null,
                bio_pl: bioBase || null,
                bio_en: bioBase || null,
                photo_url: formData.photo_url.trim() || null,
                is_active: true,
                social_links: {
                    ...social,
                    source_profile_id: selectedProfileId,
                    source_user_id: selectedProfile?.user_id || null,
                },
            };

            if (editingMember) {
                const { data: updatedMember, error } = await supabase
                    .from('team_members')
                    .update({
                        ...memberData,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', editingMember.id)
                    .select()
                    .single();

                if (error) throw error;
                if (updatedMember) {
                    setMembers((prevMembers) =>
                        prevMembers
                            .map((member) => (member.id === updatedMember.id ? updatedMember : member))
                            .sort((a, b) => a.display_order - b.display_order)
                    );
                }
                toast({
                    title: t('common.success', 'Success'),
                    description: t('team.updated', 'Team member updated successfully'),
                    variant: getGlassToastVariant('success'),
                    className: getGlassToastClassName('success'),
                });
            } else {
                const maxOrder = Math.max(...members.map((member) => member.display_order), -1);
                const { data: createdMember, error } = await supabase
                    .from('team_members')
                    .insert({
                        ...memberData,
                        display_order: maxOrder + 1,
                    })
                    .select()
                    .single();

                if (error) throw error;
                if (createdMember) {
                    setMembers((prevMembers) =>
                        [...prevMembers, createdMember].sort((a, b) => a.display_order - b.display_order)
                    );
                }
                toast({
                    title: t('common.success', 'Success'),
                    description: t('team.created', 'Team member created successfully'),
                    variant: getGlassToastVariant('success'),
                    className: getGlassToastClassName('success'),
                });
            }

            resetForm();
        } catch (error: any) {
            console.error('Error saving team member:', error);
            const rawMessage = typeof error?.message === 'string' ? error.message : '';
            const isRlsError = rawMessage.toLowerCase().includes('row-level security policy');
            const description = isRlsError
                ? 'Недостаточно прав для добавления участника. Нужна роль SuperAdmin.'
                : `${t('team.save_error', 'Failed to save team member')}${rawMessage ? `: ${rawMessage}` : ''}`;
            toast({
                title: t('common.error', 'Error'),
                description,
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    const handleDeleteClick = (id: string) => {
        if (!canManageTeam) {
            toast({
                title: t('common.error', 'Error'),
                description: 'Удаление доступно только для SuperAdmin.',
                variant: 'destructive',
            });
            return;
        }
        setDeleteConfirmId(id);
    };

    const deleteMember = async (id: string) => {

        try {
            const { error } = await supabase
                .from('team_members')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setMembers((prevMembers) => prevMembers.filter((member) => member.id !== id));
            toast({
                title: t('common.success', 'Success'),
                description: t('team.deleted', 'Team member deleted successfully'),
                variant: getGlassToastVariant('success'),
                className: getGlassToastClassName('success'),
            });
        } catch (error: any) {
            console.error('Error deleting team member:', error);
            const rawMessage = typeof error?.message === 'string' ? error.message : '';
            const isRlsError = rawMessage.toLowerCase().includes('row-level security policy');
            toast({
                title: t('common.error', 'Error'),
                description: isRlsError
                    ? 'Недостаточно прав для удаления участника. Нужна роль SuperAdmin.'
                    : `${t('team.delete_error', 'Failed to delete team member')}${rawMessage ? `: ${rawMessage}` : ''}`,
                variant: 'destructive',
            });
        }
    };

    const handleDragStart = (event: React.DragEvent<HTMLDivElement>, memberId: string) => {
        if (!canManageTeam) return;
        setDraggedMemberId(memberId);
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', memberId);
    };

    const handleDragEnd = () => {
        setDraggedMemberId(null);
        setDragOverMemberId(null);
    };

    const handleDragOverCard = (event: React.DragEvent<HTMLElement>, memberId: string) => {
        if (!canManageTeam) return;
        event.preventDefault();
        if (!draggedMemberId || draggedMemberId === memberId) return;
        event.dataTransfer.dropEffect = 'move';
        setDragOverMemberId(memberId);
    };

    const handleDropOnCard = async (event: React.DragEvent<HTMLElement>, targetMemberId: string) => {
        if (!canManageTeam) return;
        event.preventDefault();
        const sourceMemberId = draggedMemberId || event.dataTransfer.getData('text/plain');

        setDragOverMemberId(null);
        if (!sourceMemberId || sourceMemberId === targetMemberId) {
            setDraggedMemberId(null);
            return;
        }

        const sourceIndex = members.findIndex((member) => member.id === sourceMemberId);
        const targetIndex = members.findIndex((member) => member.id === targetMemberId);
        if (sourceIndex < 0 || targetIndex < 0) {
            setDraggedMemberId(null);
            return;
        }

        const previousMembers = [...members];
        const reorderedMembers = [...members];
        const [movedMember] = reorderedMembers.splice(sourceIndex, 1);
        reorderedMembers.splice(targetIndex, 0, movedMember);

        const normalizedMembers = reorderedMembers.map((member, index) => ({
            ...member,
            display_order: index,
        }));

        setMembers(normalizedMembers);
        setDraggedMemberId(null);
        setIsOrderSaving(true);

        try {
            const { error } = await supabase.rpc('reorder_team_members', {
                p_ids: normalizedMembers.map((member) => member.id),
                p_orders: normalizedMembers.map((member) => member.display_order),
            });
            if (error) throw error;
        } catch (error) {
            console.error('Error reordering team members:', error);
            setMembers(previousMembers);
            toast({
                title: t('common.error', 'Error'),
                description: t('team.reorder_error', 'Failed to save team order'),
                variant: 'destructive',
            });
        } finally {
            setIsOrderSaving(false);
        }
    };

    if (loading && members.length === 0) {
        return <LoadingScreen label="SCANNING TARGETS…" size={140} />;
    }

    if (!canViewTeam) {
        return (
            <AdminShell>
                <section className="px-3 sm:px-4 lg:px-8 lg:translate-x-[-100px]">
                    <div className="mx-auto max-w-3xl py-8 mt-8">
                        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-6 text-center">
                            <h2 className="text-xl font-semibold text-white mb-2">Доступ ограничен</h2>
                            <p className="text-rose-200">
                                Управление командой доступно только для роли SuperAdmin.
                            </p>
                        </div>
                    </div>
                </section>
            </AdminShell>
        );
    }

    return (
        <AdminShell>
            <section className="px-3 sm:px-4 lg:px-8 lg:translate-x-[-100px]">
                <div className="mx-auto max-w-[1400px] py-4 sm:py-6 mt-4 sm:mt-6 relative">
                    <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,rgba(70,214,200,.08),transparent_70%)] opacity-50 rounded-2xl" />

                    <div className="mb-4">
                        <h1 className="text-2xl font-bold text-white">{t('team.title', 'Team Management')}</h1>
                        <p className="text-gray-400">{t('team.description', 'Manage your team members and roles')}</p>
                        {!canManageTeam && (
                            <p className="text-xs text-amber-300/90 mt-1">
                                Режим просмотра: управлять командой может только SuperAdmin.
                            </p>
                        )}
                    </div>

                    {canManageTeam && (
                        <div className="pb-3 sm:pb-4 mt-3 sm:mt-4">
                            <button
                                type="button"
                                onClick={() => {
                                    resetForm(false);
                                    setIsDialogOpen(true);
                                }}
                                aria-label="Добавить участника"
                                className="btn-glass-emerald inline-flex items-center justify-center text-base px-5 h-12 md:h-14 hover:ring-2 hover:ring-[#46D6C8]/50 transition-all duration-200 w-full sm:w-auto"
                            >
                                <span className="flex items-center justify-center gap-2">
                                    <Plus className="h-4 w-4" />
                                    <span>Добавить участника</span>
                                </span>
                            </button>
                        </div>
                    )}

                    {canManageTeam && isOrderSaving && (
                        <p className="mb-4 text-xs text-[#46D6C8]">{t('team.reorder_saving', 'Saving team order...')}</p>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {members.map((member) => {
                            const role = getRole(member);
                            const bio = getBio(member);
                            const roleVisual = getRoleVisual(role);
                            const social = parseJsonObject(member.social_links);
                            const sourceProfileId = typeof social.source_profile_id === 'string' ? social.source_profile_id : '';
                            const sourceProfile = sourceProfileId
                                ? visibleProfiles.find((profile) => profile.id === sourceProfileId) || null
                                : null;
                            const memberName = member.real_name?.trim() || '';
                            const memberNickname = member.callsign?.trim() || '';

                            return (
                                <article
                                    key={member.id}
                                    onDragOver={(event) => handleDragOverCard(event, member.id)}
                                    onDrop={(event) => handleDropOnCard(event, member.id)}
                                    className={`group/card relative bg-[#04070A] border rounded-xl p-5 transition-all duration-300 overflow-hidden flex flex-col justify-between min-h-[140px] ${
                                        dragOverMemberId === member.id
                                            ? 'border-[#46D6C8]/70 shadow-[0_0_30px_rgba(70,214,200,0.24)]'
                                            : 'border-white/10 hover:border-[#46D6C8]/40 hover:shadow-[0_0_25px_rgba(70,214,200,0.08)]'
                                    }`}
                                >
                                    {/* Декоративне свічення на фоні при наведенні */}
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#46D6C8]/5 blur-3xl rounded-full opacity-0 group-hover/card:opacity-100 transition-opacity duration-500" />

                                    <div className="flex items-start gap-4 relative z-10">
                                        {/* АВАТАР (Квадратний, як на ID-картках) */}
                                        <div className="relative shrink-0">
                                            {member.photo_url ? (
                                                <img
                                                    src={member.photo_url}
                                                    alt={memberName}
                                                    className="w-16 h-16 rounded-lg object-cover border border-white/10 group-hover/card:border-[#46D6C8]/50 transition-colors duration-300"
                                                />
                                            ) : (
                                                <div className="w-16 h-16 rounded-lg bg-white/5 border border-white/10 group-hover/card:border-[#46D6C8]/50 transition-colors duration-300 flex items-center justify-center">
                                                    <User className="h-7 w-7 text-white/30" />
                                                </div>
                                            )}
                                            {/* Декоративний кутик */}
                                            <div className="absolute -top-1 -left-1 w-2 h-2 border-t border-l border-[#46D6C8] opacity-0 group-hover/card:opacity-100 transition-opacity duration-300" />
                                        </div>

                                        {/* ІНФОРМАЦІЯ */}
                                        <div className="flex-1 min-w-0">
                                            {memberName ? (
                                                <>
                                                    <h3 className="text-lg font-bold text-white truncate">
                                                        {memberName}
                                                    </h3>
                                                    {memberNickname && memberNickname !== memberName && (
                                                        <p className="text-sm text-[#46D6C8]/70 font-medium truncate">
                                                            {memberNickname}
                                                        </p>
                                                    )}
                                                </>
                                            ) : (
                                                <h3 className="text-lg font-bold text-[#46D6C8] truncate">
                                                    {memberNickname}
                                                </h3>
                                            )}
                                            {bio.length > 0 && (
                                                <p className="text-xs text-gray-600 mt-2 line-clamp-1">
                                                    {bio}
                                                </p>
                                            )}
                                        </div>

                                        {/* Drag handle + Actions */}
                                        <div className="flex items-center gap-1 shrink-0">
                                            {canManageTeam && (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={() => editMember(member)}
                                                        aria-label={t('team.edit_member', 'Edit Team Member')}
                                                        tabIndex={0}
                                                        className="h-7 w-7 flex items-center justify-center rounded-md text-gray-500 hover:text-sky-300 hover:bg-sky-500/10 transition-all duration-200 opacity-0 group-hover/card:opacity-100"
                                                    >
                                                        <Edit2 className="h-3.5 w-3.5" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteClick(member.id)}
                                                        aria-label={t('team.delete_member', 'Delete Team Member')}
                                                        tabIndex={0}
                                                        className="h-7 w-7 flex items-center justify-center rounded-md text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-200 opacity-0 group-hover/card:opacity-100"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                </>
                                            )}
                                            <div
                                                draggable={canManageTeam}
                                                onDragStart={(event) => handleDragStart(event, member.id)}
                                                onDragEnd={handleDragEnd}
                                                className={`h-7 w-7 flex items-center justify-center rounded-md text-gray-600 ${
                                                    canManageTeam ? 'cursor-grab active:cursor-grabbing hover:text-gray-300' : 'opacity-40'
                                                } transition-colors`}
                                            >
                                                <GripVertical size={14} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* НИЖНЯ ПАНЕЛЬ: РОЛЬ */}
                                    <div className="mt-4 pt-3 border-t border-white/5 flex items-center relative z-10">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border ${roleVisual.badgeClass}`}>
                                            {roleVisual.icon}
                                            {role}
                                        </span>
                                    </div>
                                </article>
                            );
                        })}
                    </div>

                    {members.length === 0 && (
                        <section className="rounded-xl p-8 border border-white/10 bg-black/60 backdrop-blur-sm text-center mt-4">
                            <p className="text-gray-400">{t('team.no_members', 'No team members found')}</p>
                        </section>
                    )}
                </div>

                {canManageTeam && (
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogContent className="max-w-3xl bg-[#04070A]/90 border-white/10 backdrop-blur-md p-0 flex flex-col shadow-[0_0_50px_rgba(70,214,200,0.15)] overflow-hidden">
                            <DialogHeader className="px-6 py-4 bg-[#04070A] relative z-50 shrink-0">
                                <DialogTitle className="text-xl text-white">
                                    {editingMember ? t('team.edit_member', 'Edit Team Member') : t('team.add_member', 'Add Team Member')}
                                </DialogTitle>
                                <div className="absolute left-0 right-0 top-full -translate-y-px h-12 bg-gradient-to-b from-[#04070A] via-[#04070A]/80 to-transparent pointer-events-none z-50" />
                            </DialogHeader>

                            <div className="overflow-y-auto flex-1 neon-scrollbar p-6 relative z-0">
                                <form id="team-member-form" onSubmit={handleSubmit} noValidate className="space-y-6 pb-4 relative z-10">
                                    <section className="space-y-3">
                                        <h3 className="text-lg font-semibold text-[#46D6C8] flex items-center gap-2">
                                            <Users size={18} />
                                            Пользователь сайта
                                        </h3>

                                        <div className="relative" ref={profileDropdownRef}>
                                            <div className="relative">
                                                <Input
                                                    value={profileSearchQuery}
                                                    onChange={(event) => {
                                                        const value = event.target.value;
                                                        setProfileSearchQuery(value);
                                                        setIsProfileDropdownOpen(true);
                                                        setSelectedProfileId('');
                                                        setFormData((prev) => ({
                                                            ...prev,
                                                            callsign: value.trim(),
                                                            real_name: '',
                                                            photo_url: '',
                                                            bio_uk: '',
                                                            bio_ru: '',
                                                            bio_pl: '',
                                                            bio_en: '',
                                                            social_links: {},
                                                        }));
                                                    }}
                                                    onFocus={() => setIsProfileDropdownOpen(true)}
                                                    placeholder="Введите ник пользователя..."
                                                    aria-label="Поиск пользователя по нику"
                                                    className="bg-white/5 text-white border-gray-400/55 focus:border-[#46D6C8]/60 focus:ring-1 focus:ring-[#46D6C8]/45 hover:border-[#46D6C8]/45 hover:shadow-[0_0_15px_rgba(70,214,200,0.18)] transition-all"
                                                />
                                                {selectedProfileId && (
                                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#46D6C8]">
                                                        <UserCheck className="h-4 w-4" />
                                                    </div>
                                                )}
                                            </div>

                                            {isProfileDropdownOpen && filteredProfileSuggestions.length > 0 && (
                                                <ul className="absolute z-[10000] mt-1 w-full max-h-[220px] overflow-y-auto rounded-xl border border-[#46D6C8]/30 bg-neutral-950/95 backdrop-blur-sm p-1.5 shadow-[0_0_15px_rgba(70,214,200,0.1)] neon-scrollbar">
                                                    {filteredProfileSuggestions.map((profile) => {
                                                        const nickname = getProfileNickname(profile);
                                                        const realName = profile.real_name?.trim() || '';
                                                        const isActive = selectedProfileId === profile.id;

                                                        return (
                                                            <li key={profile.id}>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleProfileSelect(profile.id)}
                                                                    className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-all duration-150 ${
                                                                        isActive
                                                                            ? 'bg-[#46D6C8]/20 ring-1 ring-[#46D6C8]/60 shadow-[0_0_12px_rgba(70,214,200,0.25)]'
                                                                            : 'hover:bg-[#46D6C8]/15 hover:text-[#46D6C8] hover:shadow-[0_0_12px_rgba(70,214,200,0.3)]'
                                                                    }`}
                                                                >
                                                                    {profile.avatar_url ? (
                                                                        <img src={profile.avatar_url} alt="" className="h-8 w-8 rounded-md object-cover border border-white/10 shrink-0" />
                                                                    ) : (
                                                                        <div className="h-8 w-8 rounded-md bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                                                                            <User className="h-4 w-4 text-white/30" />
                                                                        </div>
                                                                    )}
                                                                    <div className="min-w-0 flex-1">
                                                                        <span className="text-[#46D6C8] font-semibold truncate block">{nickname || 'Без ника'}</span>
                                                                        {realName && (
                                                                            <span className="text-[#C2C2C2] text-xs truncate block">{realName}</span>
                                                                        )}
                                                                    </div>
                                                                    {isActive && <UserCheck className="h-4 w-4 text-[#46D6C8] shrink-0" />}
                                                                </button>
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                            )}

                                            {isProfileDropdownOpen && profileSearchQuery.trim() && filteredProfileSuggestions.length === 0 && (
                                                <div className="absolute z-[10000] mt-1 w-full rounded-xl border border-white/10 bg-neutral-950/95 backdrop-blur-sm p-3 text-sm text-gray-400 text-center">
                                                    Пользователь не найден
                                                </div>
                                            )}
                                        </div>
                                    </section>

                                    <div className="border-b border-white/10" />

                                    <section className="space-y-3">
                                        <h3 className="text-lg font-semibold text-[#46D6C8] flex items-center gap-2">
                                            <Shield size={18} />
                                            Роль в команде
                                        </h3>

                                        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3">
                                            <NeonPopoverList
                                                value={selectedRolePresetId}
                                                onChange={handleRolePresetSelect}
                                                options={roleOptions}
                                                color="teal"
                                                minW={0}
                                                width={0}
                                                className="w-full lg:w-full"
                                            />

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    activateCustomRoleMode(true);
                                                }}
                                                className="self-center text-xs text-[#46D6C8] hover:text-white transition-colors flex items-center gap-1 px-1 py-2"
                                            >
                                                <Edit2 className="h-3 w-3" />
                                                Вписати свою роль
                                            </button>
                                        </div>

                                        {customRoleMode && (
                                            <div className="space-y-2">
                                                <Input
                                                    ref={customRoleInputRef}
                                                    value={formData.role_uk}
                                                    onChange={(event) => {
                                                        const nextRoleValue = event.target.value;
                                                        if (customRoleError) {
                                                            setCustomRoleError('');
                                                        }
                                                        setFormData((prev) => ({
                                                            ...prev,
                                                            role_uk: nextRoleValue,
                                                            role_ru: nextRoleValue,
                                                            role_pl: nextRoleValue,
                                                            role_en: nextRoleValue,
                                                        }));
                                                    }}
                                                    aria-invalid={Boolean(customRoleError)}
                                                    placeholder="Своя роль (например: Техник)"
                                                    className={`bg-white/5 text-white transition-all ${customRoleError
                                                            ? 'border-red-500/50 shadow-[0_0_10px_rgba(220,38,38,0.2)] hover:border-red-500/70 focus:border-red-500/70 focus:ring-1 focus:ring-red-500/35'
                                                            : 'border-gray-400/55 focus:border-[#46D6C8]/60 focus:ring-1 focus:ring-[#46D6C8]/45 hover:border-[#46D6C8]/45 hover:shadow-[0_0_15px_rgba(70,214,200,0.18)]'
                                                        }`}
                                                />
                                            </div>
                                        )}
                                    </section>

                                    <div className="border-b border-white/10" />

                                    <section className="space-y-3">
                                        <h3 className="text-lg font-semibold text-[#46D6C8]">Автоданные участника</h3>

                                        <div className="rounded-xl border border-white/10 bg-black/40 p-4 flex items-start gap-4">
                                            {formData.photo_url ? (
                                                <img
                                                    src={formData.photo_url}
                                                    alt={formData.callsign || 'Profile avatar'}
                                                    className="h-16 w-16 rounded-lg object-cover border border-white/10"
                                                />
                                            ) : (
                                                <div className="h-16 w-16 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                                                    <User className="h-6 w-6 text-gray-500" />
                                                </div>
                                            )}

                                            <div className="min-w-0 flex-1 space-y-2">
                                                <div>
                                                    <p className="text-sm text-gray-400">Имя</p>
                                                    <p className="text-sm text-[#C2C2C2] truncate">
                                                        {formData.real_name || '—'}
                                                    </p>
                                                </div>

                                                <div>
                                                    <p className="text-sm text-gray-400">Ник</p>
                                                    <p className="text-base text-white font-semibold truncate">
                                                        {formData.callsign || '—'}
                                                    </p>
                                                </div>

                                                <div>
                                                    <p className="text-sm text-gray-400">Позывной</p>
                                                    <p className="text-sm text-[#C2C2C2] truncate">
                                                        {selectedProfile?.callsign?.trim() || '—'}
                                                    </p>
                                                </div>

                                                <div>
                                                    <p className="text-sm text-gray-400">Биография</p>
                                                    <p className="text-sm text-[#C2C2C2]">
                                                        {(() => {
                                                            const bioVal = typeof formData.bio_uk === 'string' && formData.bio_uk.trim().length > 0 && formData.bio_uk.trim() !== '0' ? formData.bio_uk : null;
                                                            if (!bioVal) return '—';
                                                            return bioVal.length > 180 ? `${bioVal.slice(0, 180)}...` : bioVal;
                                                        })()}
                                                    </p>
                                                </div>

                                                <div>
                                                    <p className="text-sm text-gray-400">Телефон</p>
                                                    <p className="text-sm text-[#C2C2C2] truncate">
                                                        {selectedProfile?.phone?.trim() || '—'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </section>
                                </form>
                            </div>

                            <div className="px-6 pt-2 pb-4 bg-[#04070A] flex justify-end gap-3 rounded-b-lg relative z-50">
                                <div className="absolute -top-12 translate-y-px left-0 right-0 h-12 bg-gradient-to-t from-[#04070A] via-[#04070A]/80 to-transparent pointer-events-none" />
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all"
                                >
                                    {t('common.cancel', 'Cancel')}
                                </button>
                                <button
                                    type="submit"
                                    form="team-member-form"
                                    disabled={loading}
                                    className="px-4 py-2 rounded-lg bg-[#46D6C8] text-black font-semibold hover:opacity-90 hover:shadow-[0_0_30px_rgba(70,214,200,0.8)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? t('common.loading', 'Loading...') : (editingMember ? 'Обновить' : 'Добавить')}
                                </button>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </section>

            <GlassConfirmDialog
                open={!!deleteConfirmId}
                onOpenChange={(open) => { if (!open) setDeleteConfirmId(null); }}
                title={t('team.confirm_delete_title', 'Видалити учасника')}
                description={t('team.confirm_delete', 'Ви впевнені, що хочете видалити цього учасника команди?')}
                confirmLabel={t('common.delete', 'Видалити')}
                cancelLabel={t('common.cancel', 'Скасувати')}
                variant="destructive"
                onConfirm={() => {
                    if (deleteConfirmId) deleteMember(deleteConfirmId);
                }}
            />
        </AdminShell>
    );
};

export default TeamManager;
