import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { useI18n } from '@/contexts/I18nContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, Shield, Target, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import LoadingScreen from '@/components/LoadingScreen';

interface TeamMember {
    id: string;
    callsign: string;
    real_name?: string;
    role_uk: string;
    role_ru: string;
    role_pl: string;
    role_en: string;
    bio_uk?: string;
    bio_ru?: string;
    bio_pl?: string;
    bio_en?: string;
    photo_url?: string;
    is_active: boolean;
    display_order: number;
    created_at: string;
    updated_at: string;
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

const TeamPage = () => {
    const { t, language } = useI18n();
    const { toast } = useToast();
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [teamSettings, setTeamSettings] = useState<TeamSettings | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTeamData();
    }, []);

    const fetchTeamData = async () => {
        try {
            setLoading(true);

            // Fetch team members
            const { data: members, error: membersError } = await supabase
                .from('team_members')
                .select('*')
                .eq('is_active', true)
                .order('display_order', { ascending: true });

            if (membersError) {
                console.error('Error fetching team members:', membersError);
                toast({
                    title: 'Error',
                    description: 'Failed to load team members',
                    variant: 'destructive',
                });
            } else {
                setTeamMembers(members || []);
            }

            // Fetch team settings
            const { data: settings, error: settingsError } = await supabase
                .from('team_settings')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (settingsError) {
                console.error('Error fetching team settings:', settingsError);
            } else {
                setTeamSettings(settings);
            }
        } catch (error) {
            console.error('Error fetching team data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getRoleForLanguage = (member: TeamMember) => {
        switch (language) {
            case 'uk': return member.role_uk;
            case 'ru': return member.role_ru;
            case 'pl': return member.role_pl;
            case 'en': return member.role_en;
            default: return member.role_uk;
        }
    };

    const getBioForLanguage = (member: TeamMember) => {
        switch (language) {
            case 'uk': return member.bio_uk;
            case 'ru': return member.bio_ru;
            case 'pl': return member.bio_pl;
            case 'en': return member.bio_en;
            default: return member.bio_uk;
        }
    };

    const getMissionTitle = () => {
        if (!teamSettings) return t('pages.team.mission.title', 'Our Mission');
        switch (language) {
            case 'uk': return teamSettings.mission_title_uk;
            case 'ru': return teamSettings.mission_title_ru;
            case 'pl': return teamSettings.mission_title_pl;
            case 'en': return teamSettings.mission_title_en;
            default: return teamSettings.mission_title_uk;
        }
    };

    const getMissionDescription = () => {
        if (!teamSettings) return t('pages.team.mission.description', 'Raven Strike Force is a team of professionals united by passion for tactical airsoft...');
        switch (language) {
            case 'uk': return teamSettings.mission_description_uk;
            case 'ru': return teamSettings.mission_description_ru;
            case 'pl': return teamSettings.mission_description_pl;
            case 'en': return teamSettings.mission_description_en;
            default: return teamSettings.mission_description_uk;
        }
    };

    const getRoleIcon = (role: string) => {
        const roleLower = role.toLowerCase();
        if (roleLower.includes('командир') || roleLower.includes('leader') || roleLower.includes('командующий')) {
            return <Star className="w-5 h-5 text-primary" />;
        }
        if (roleLower.includes('снайпер') || roleLower.includes('sniper')) {
            return <Target className="w-5 h-5 text-primary" />;
        }
        if (roleLower.includes('медик') || roleLower.includes('medic')) {
            return <Shield className="w-5 h-5 text-primary" />;
        }
        return <Zap className="w-5 h-5 text-primary" />;
    };

    if (loading) {
        return <LoadingScreen label="SCANNING TARGETS…" size={140} />;
    }

    return (
        <Layout showBreadcrumbs>
            <div className="min-h-screen py-12">
                <div className="container mx-auto px-4 lg:px-8">
                    {/* Header */}
                    <div className="text-center mb-12">
                        <h1 className="font-rajdhani text-4xl md:text-5xl font-bold mb-4">
                            {t('nav.team', 'Team')}
                        </h1>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            {t('team.subtitle', 'Meet our team')}
                        </p>
                    </div>

                    {/* Team Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
                        <div className="text-center glass-panel p-6 rounded-lg">
                            <div className="text-2xl font-rajdhani font-bold text-primary mb-1">
                                {teamSettings?.active_members || teamMembers.length}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                {t('pages.team.stats.active_members', 'Active Members')}
                            </div>
                        </div>
                        <div className="text-center glass-panel p-6 rounded-lg">
                            <div className="text-2xl font-rajdhani font-bold text-primary mb-1">
                                {teamSettings?.games_played || 156}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                {t('pages.team.stats.games_played', 'Games Played')}
                            </div>
                        </div>
                        <div className="text-center glass-panel p-6 rounded-lg">
                            <div className="text-2xl font-rajdhani font-bold text-primary mb-1">
                                {teamSettings?.win_rate || 89}%
                            </div>
                            <div className="text-sm text-muted-foreground">
                                {t('pages.team.stats.win_rate', 'Win Rate')}
                            </div>
                        </div>
                        <div className="text-center glass-panel p-6 rounded-lg">
                            <div className="text-2xl font-rajdhani font-bold text-primary mb-1">
                                {teamSettings?.years_active || 5}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                {t('pages.team.stats.years_active', 'Years Active')}
                            </div>
                        </div>
                    </div>

                    {/* Team Members */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {teamMembers.map((member) => {
                            const role = getRoleForLanguage(member);
                            const bio = getBioForLanguage(member);

                            return (
                                <Card key={member.id} className="glass-panel tactical-lift">
                                    <CardContent className="p-6">
                                        <div className="flex items-center mb-4">
                                            <Avatar className="w-16 h-16 mr-4">
                                                <AvatarImage src={member.photo_url} alt={member.callsign} />
                                                <AvatarFallback className="bg-primary/10 text-primary">
                                                    {member.callsign.charAt(0)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1">
                                                <h3 className="font-rajdhani text-lg font-bold">{member.callsign}</h3>
                                                {member.real_name && (
                                                    <p className="text-sm text-muted-foreground">{member.real_name}</p>
                                                )}
                                                <div className="flex items-center gap-2 mb-1">
                                                    {getRoleIcon(role)}
                                                    <Badge variant="secondary" className="text-xs">
                                                        {role}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>

                                        {bio && (
                                            <p className="text-sm text-muted-foreground mb-3">{bio}</p>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>

                    {/* Mission Statement */}
                    <div className="mt-16 text-center">
                        <div className="glass-panel p-8 rounded-lg max-w-4xl mx-auto">
                            <h2 className="font-rajdhani text-2xl font-bold mb-4 text-primary">
                                {getMissionTitle()}
                            </h2>
                            <p className="text-muted-foreground leading-relaxed">
                                {getMissionDescription()}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default TeamPage;