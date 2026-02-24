import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { useI18n } from '@/contexts/I18nContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import LoadingScreen from '@/components/LoadingScreen';
import {
    User, Camera, Shield, ShieldAlert,
    UserCheck, UserCog, UserRoundCheck, UserRoundCog,
    UserRoundPlus, Users,
} from 'lucide-react';

interface TeamMember {
    id: string;
    callsign: string;
    real_name?: string | null;
    role_uk: string;
    role_ru: string;
    role_pl: string;
    role_en: string;
    bio_uk?: string | null;
    bio_ru?: string | null;
    bio_pl?: string | null;
    bio_en?: string | null;
    photo_url?: string | null;
    is_active: boolean;
    display_order: number;
}

interface TeamSettings {
    mission_title_uk: string;
    mission_title_ru: string;
    mission_title_pl: string;
    mission_title_en: string;
    mission_description_uk: string;
    mission_description_ru: string;
    mission_description_pl: string;
    mission_description_en: string;
    active_members: number;
    games_played: number;
    win_rate: number;
    years_active: number;
}

interface RolePreset {
    id: string;
    role_uk: string;
    role_ru: string;
    role_pl: string;
    role_en: string;
    badgeClass: string;
}

const ROLE_PRESETS: RolePreset[] = [
    { id: 'organizer', role_uk: 'Організатор', role_ru: 'Организатор', role_pl: 'Organizator', role_en: 'Organizer', badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35' },
    { id: 'coordinator', role_uk: 'Координатор', role_ru: 'Координатор', role_pl: 'Koordynator', role_en: 'Coordinator', badgeClass: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/35' },
    { id: 'referee', role_uk: 'Суддя', role_ru: 'Судья', role_pl: 'Sędzia', role_en: 'Referee', badgeClass: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/35' },
    { id: 'media', role_uk: 'Медіа', role_ru: 'Медиа', role_pl: 'Media', role_en: 'Media', badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/35' },
    { id: 'instructor', role_uk: 'Інструктор', role_ru: 'Инструктор', role_pl: 'Instruktor', role_en: 'Instructor', badgeClass: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/35' },
    { id: 'npc', role_uk: 'НПС', role_ru: 'НПС', role_pl: 'NPC', role_en: 'NPC', badgeClass: 'bg-violet-500/15 text-violet-300 border-violet-500/35' },
    { id: 'side_commander', role_uk: 'Командир сторони', role_ru: 'Командир стороны', role_pl: 'Dowódca strony', role_en: 'Side Commander', badgeClass: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/35' },
    { id: 'technician', role_uk: 'Технік', role_ru: 'Техник', role_pl: 'Technik', role_en: 'Technician', badgeClass: 'bg-violet-500/15 text-violet-300 border-violet-500/35' },
    { id: 'medic', role_uk: 'Медик', role_ru: 'Медик', role_pl: 'Medyk', role_en: 'Medic', badgeClass: 'bg-rose-500/15 text-rose-300 border-rose-500/35' },
];

const LEGACY_MEDIA_ROLE_VALUES = new Set(['фотограф', 'photographer', 'fotograf']);
const MEDIA_ROLE_BY_LANG: Record<string, string> = { uk: 'Медіа', ru: 'Медиа', pl: 'Media', en: 'Media' };
const CUSTOM_ROLE_BADGE = 'bg-white/15 text-white border-white/45';

const norm = (v: string) => v.trim().toLowerCase();
const isLegacyMedia = (v?: string | null) => !!v && LEGACY_MEDIA_ROLE_VALUES.has(norm(v));

const getRoleVisual = (role: string) => {
    const r = norm(role);
    const includes = (s: string) => r.includes(s);

    const isMedia = includes('медиа') || includes('медіа') || includes('media') || includes('фотограф') || includes('photo') || includes('fotograf');
    const isMedic = includes('медик') || includes('medic') || includes('medyk');
    const isTech = includes('техник') || includes('технік') || includes('technik') || includes('technician');
    const isSideCmd = includes('командир стороны') || includes('командир сторони') || includes('dowódca strony') || includes('side commander');
    const isInstructor = includes('инструктор') || includes('інструктор') || includes('instruktor') || includes('instructor');
    const isReferee = includes('судья') || includes('суддя') || includes('sędzia') || includes('referee');
    const isCoord = includes('координатор') || includes('koordynator') || includes('coordinator');
    const isOrg = includes('организатор') || includes('організатор') || includes('organizator') || includes('organizer');
    const isNpc = r === 'нпс' || includes('npc');

    const matched = ROLE_PRESETS.find(p =>
        [p.role_uk, p.role_ru, p.role_pl, p.role_en].some(v => norm(v) === r)
    ) || (isMedia ? ROLE_PRESETS.find(p => p.id === 'media') : undefined);

    const icon = isMedia ? <Camera className="h-3.5 w-3.5" />
        : isMedic ? <UserRoundPlus className="h-3.5 w-3.5" />
        : isTech ? <UserRoundCog className="h-3.5 w-3.5" />
        : isSideCmd ? <ShieldAlert className="h-3.5 w-3.5" />
        : isInstructor ? <UserCog className="h-3.5 w-3.5" />
        : isReferee ? <UserCheck className="h-3.5 w-3.5" />
        : isCoord ? <UserRoundCheck className="h-3.5 w-3.5" />
        : isOrg ? <Users className="h-3.5 w-3.5" />
        : isNpc ? <User className="h-3.5 w-3.5" />
        : <Shield className="h-3.5 w-3.5" />;

    return { icon, badgeClass: matched?.badgeClass || CUSTOM_ROLE_BADGE };
};

const TeamPage = () => {
    const { t, language } = useI18n();
    const { toast } = useToast();
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [settings, setSettings] = useState<TeamSettings | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTeamData();
    }, []);

    const fetchTeamData = async () => {
        try {
            setLoading(true);

            const { data: membersData, error: membersError } = await supabase
                .from('team_members')
                .select('*')
                .eq('is_active', true)
                .order('display_order', { ascending: true });

            if (membersError) {
                console.error('Error fetching team members:', membersError);
                toast({ title: 'Error', description: 'Failed to load team members', variant: 'destructive' });
            } else {
                setMembers(membersData || []);
            }

            const { data: settingsData, error: settingsError } = await supabase
                .from('team_settings')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (!settingsError) setSettings(settingsData);
        } catch (error) {
            console.error('Error fetching team data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getRole = (member: TeamMember) => {
        const pick = (lang: string) => {
            const map: Record<string, string | undefined> = { uk: member.role_uk, ru: member.role_ru, pl: member.role_pl, en: member.role_en || member.role_uk };
            const val = map[lang] || member.role_uk;
            return isLegacyMedia(val) ? (MEDIA_ROLE_BY_LANG[lang] || val) : (val || '');
        };
        return pick(language);
    };

    const getBio = (member: TeamMember): string => {
        const safe = (v: unknown): string => (typeof v === 'string' && v.trim().length > 0 && v.trim() !== '0') ? v : '';
        if (language === 'ru') return safe(member.bio_ru) || safe(member.bio_uk);
        if (language === 'pl') return safe(member.bio_pl) || safe(member.bio_uk);
        if (language === 'en') return safe(member.bio_en) || safe(member.bio_uk);
        return safe(member.bio_uk);
    };

    const getMissionTitle = () => {
        if (!settings) return t('pages.team.mission.title', 'Our Mission');
        const map: Record<string, string> = { uk: settings.mission_title_uk, ru: settings.mission_title_ru, pl: settings.mission_title_pl, en: settings.mission_title_en };
        return map[language] || settings.mission_title_uk;
    };

    const getMissionDescription = () => {
        if (!settings) return t('pages.team.mission.description', 'Airsoft Wroclaw is a team of professionals united by passion for tactical airsoft...');
        const map: Record<string, string> = { uk: settings.mission_description_uk, ru: settings.mission_description_ru, pl: settings.mission_description_pl, en: settings.mission_description_en };
        return map[language] || settings.mission_description_uk;
    };

    if (loading) {
        return <LoadingScreen label="SCANNING TARGETS…" size={140} />;
    }

    return (
        <Layout>
            <div className="min-h-screen py-8 md:py-12">
                <div className="container mx-auto px-4 lg:px-8 max-w-[1400px]">

                    {/* Header */}
                    <div className="text-center mb-8 md:mb-12">
                        <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-3 tracking-wide uppercase">
                            {t('nav.team', 'Team')}
                        </h1>
                        <p className="text-base text-gray-400 max-w-2xl mx-auto">
                            {t('team.subtitle', 'Meet our team')}
                        </p>
                    </div>

                    {/* Team Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {members.map((member) => {
                            const role = getRole(member);
                            const bio = getBio(member);
                            const visual = getRoleVisual(role);
                            const name = member.real_name?.trim() || '';
                            const nick = member.callsign?.trim() || '';

                            return (
                                <article
                                    key={member.id}
                                    className="group/card relative bg-[#04070A] border border-white/10 rounded-xl p-5 transition-all duration-300 overflow-hidden flex flex-col justify-between min-h-[140px] hover:border-[#46D6C8]/40 hover:shadow-[0_0_25px_rgba(70,214,200,0.08)]"
                                >
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#46D6C8]/5 blur-3xl rounded-full opacity-0 group-hover/card:opacity-100 transition-opacity duration-500" />

                                    <div className="flex items-start gap-4 relative z-10">
                                        <div className="relative shrink-0">
                                            {member.photo_url ? (
                                                <img
                                                    src={member.photo_url}
                                                    alt={nick}
                                                    className="w-16 h-16 rounded-lg object-cover border border-white/10 group-hover/card:border-[#46D6C8]/50 transition-colors duration-300"
                                                />
                                            ) : (
                                                <div className="w-16 h-16 rounded-lg bg-white/5 border border-white/10 group-hover/card:border-[#46D6C8]/50 transition-colors duration-300 flex items-center justify-center">
                                                    <User className="h-7 w-7 text-white/30" />
                                                </div>
                                            )}
                                            <div className="absolute -top-1 -left-1 w-2 h-2 border-t border-l border-[#46D6C8] opacity-0 group-hover/card:opacity-100 transition-opacity duration-300" />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            {name ? (
                                                <>
                                                    <h3 className="text-lg font-bold text-white truncate">{name}</h3>
                                                    {nick && nick !== name && (
                                                        <p className="text-sm text-[#46D6C8]/70 font-medium truncate">{nick}</p>
                                                    )}
                                                </>
                                            ) : (
                                                <h3 className="text-lg font-bold text-[#46D6C8] truncate">{nick}</h3>
                                            )}
                                            {bio.length > 0 && (
                                                <p className="text-xs text-gray-600 mt-2 line-clamp-2">{bio}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-3 border-t border-white/5 flex items-center relative z-10">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border ${visual.badgeClass}`}>
                                            {visual.icon}
                                            {role}
                                        </span>
                                    </div>
                                </article>
                            );
                        })}
                    </div>

                    {members.length === 0 && (
                        <div className="rounded-xl p-8 border border-white/10 bg-[#04070A] text-center mt-4">
                            <p className="text-gray-500">{t('team.no_members', 'Поки немає учасників')}</p>
                        </div>
                    )}

                    {/* Mission Statement */}
                    <div className="mt-12 md:mt-16 text-center">
                        <div className="relative max-w-4xl mx-auto p-6 md:p-8 rounded-xl bg-[#04070A] border border-white/10 overflow-hidden">
                            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(70,214,200,0.06),transparent_70%)]" />
                            <div className="relative z-10">
                                <h2 className="font-display text-2xl md:text-3xl font-bold mb-4 text-[#46D6C8] uppercase tracking-wider">
                                    {getMissionTitle()}
                                </h2>
                                <p className="text-gray-400 leading-relaxed text-sm md:text-base">
                                    {getMissionDescription()}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default TeamPage;
