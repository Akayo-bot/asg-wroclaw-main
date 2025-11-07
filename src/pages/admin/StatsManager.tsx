import React, { useState, useEffect } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import { supabase } from '@/integrations/supabase/client';
import LoadingScreen from '@/components/LoadingScreen';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ResponsiveBar } from '@nivo/bar';
import { ResponsiveLine } from '@nivo/line';
import { Download, Users, FileText, Image, Calendar, Trophy, Eye, UserCheck, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Stats {
    total_articles: number;
    published_articles: number;
    draft_articles: number;
    total_events: number;
    upcoming_events: number;
    completed_events: number;
    total_users: number;
    admin_users: number;
    editor_users: number;
    regular_users: number;
    total_registrations: number;
    gallery_items: number;
    team_members: number;
}

interface TopArticle {
    id: string;
    title_uk: string;
    title_ru: string;
    title_pl: string;
    views_count: number;
}

interface TopEvent {
    id: string;
    title_uk: string;
    title_ru: string;
    title_pl: string;
    registration_count: number;
}

const StatsManager = () => {
    const { t, language } = useI18n();
    const { toast } = useToast();
    const [stats, setStats] = useState<Stats | null>(null);
    const [topArticles, setTopArticles] = useState<TopArticle[]>([]);
    const [topEvents, setTopEvents] = useState<TopEvent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
        fetchTopContent();
    }, []);

    const fetchStats = async () => {
        try {
            const { data, error } = await supabase.rpc('get_admin_stats');
            if (error) throw error;

            const statsData = data as unknown as Stats;
            setStats(statsData);
        } catch (error) {
            console.error('Error fetching stats:', error);
            toast({
                title: t('common.error', 'Error'),
                description: t('stats.fetch_error', 'Failed to fetch statistics'),
                variant: 'destructive',
            });
        }
    };

    const fetchTopContent = async () => {
        try {
            // Fetch top articles by views
            const { data: articlesData, error: articlesError } = await supabase
                .from('articles')
                .select('id, title_uk, title_ru, title_pl, views_count')
                .eq('status', 'published')
                .order('views_count', { ascending: false })
                .limit(5);

            if (articlesError) throw articlesError;
            setTopArticles(articlesData || []);

            // Fetch top events by registrations
            const { data: eventsData, error: eventsError } = await supabase
                .from('events')
                .select(`
          id, 
          title_uk, 
          title_ru, 
          title_pl,
          event_registrations(count)
        `)
                .order('created_at', { ascending: false })
                .limit(5);

            if (eventsError) throw eventsError;

            const eventsWithCounts = (eventsData || []).map(event => ({
                id: event.id,
                title_uk: event.title_uk,
                title_ru: event.title_ru,
                title_pl: event.title_pl,
                registration_count: (event as any).event_registrations?.length || 0,
            }));

            setTopEvents(eventsWithCounts);
        } catch (error) {
            console.error('Error fetching top content:', error);
        } finally {
            setLoading(false);
        }
    };

    const exportStats = async () => {
        if (!stats) return;

        const csvData = [
            ['Metric', 'Value'],
            ['Total Articles', stats.total_articles],
            ['Published Articles', stats.published_articles],
            ['Draft Articles', stats.draft_articles],
            ['Total Events', stats.total_events],
            ['Upcoming Events', stats.upcoming_events],
            ['Completed Events', stats.completed_events],
            ['Total Users', stats.total_users],
            ['Admin Users', stats.admin_users],
            ['Editor Users', stats.editor_users],
            ['Regular Users', stats.regular_users],
            ['Total Registrations', stats.total_registrations],
            ['Gallery Items', stats.gallery_items],
            ['Team Members', stats.team_members],
        ];

        const csvContent = csvData.map(row => row.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `stats_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({
            title: t('common.success', 'Success'),
            description: t('stats.exported', 'Statistics exported successfully'),
        });
    };

    const getTitle = (item: TopArticle | TopEvent) => {
        const titles = {
            uk: item.title_uk,
            ru: item.title_ru,
            pl: item.title_pl,
            en: item.title_uk, // fallback
        };
        return titles[language] || item.title_uk;
    };

    // Sample chart data (in a real app, this would come from your analytics)
    const chartData = [
        { name: t('stats.chart.week1', 'Week 1'), registrations: 12, views: 340 },
        { name: t('stats.chart.week2', 'Week 2'), registrations: 19, views: 520 },
        { name: t('stats.chart.week3', 'Week 3'), registrations: 8, views: 380 },
        { name: t('stats.chart.week4', 'Week 4'), registrations: 25, views: 610 },
    ];

    // Преобразуем данные для Nivo Bar Chart
    const barData = chartData.map(item => ({
        week: item.name,
        registrations: item.registrations,
    }));

    // Преобразуем данные для Nivo Line Chart
    const lineData = [{
        id: 'views',
        data: chartData.map(item => ({ x: item.name, y: item.views })),
    }];

    if (loading) {
        return <LoadingScreen label="SCANNING TARGETS…" size={140} />;
    }

    if (!stats) {
        return (
            <div className="text-center py-8">
                <p className="text-muted-foreground">{t('stats.no_data', 'No statistics available')}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">{t('stats.title', 'Statistics & Analytics')}</h1>
                    <p className="text-muted-foreground">{t('stats.description', 'Overview of your site performance and content')}</p>
                </div>

                <Button onClick={exportStats}>
                    <Download className="h-4 w-4 mr-2" />
                    {t('stats.export', 'Export CSV')}
                </Button>
            </div>

            {/* Key Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('stats.total_users', 'Total Users')}</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total_users}</div>
                        <div className="flex gap-2 mt-2">
                            <Badge variant="outline">{stats.admin_users} Admin</Badge>
                            <Badge variant="outline">{stats.editor_users} Editor</Badge>
                            <Badge variant="outline">{stats.regular_users} User</Badge>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('stats.content', 'Content')}</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total_articles}</div>
                        <div className="flex gap-2 mt-2">
                            <Badge variant="default">{stats.published_articles} Published</Badge>
                            <Badge variant="secondary">{stats.draft_articles} Drafts</Badge>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('stats.events', 'Events')}</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total_events}</div>
                        <div className="flex gap-2 mt-2">
                            <Badge variant="default">{stats.upcoming_events} Upcoming</Badge>
                            <Badge variant="outline">{stats.completed_events} Completed</Badge>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('stats.registrations', 'Registrations')}</CardTitle>
                        <UserCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total_registrations}</div>
                        <p className="text-xs text-muted-foreground mt-2">
                            {t('stats.total_event_registrations', 'Total event registrations')}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('stats.gallery', 'Gallery')}</CardTitle>
                        <Image className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.gallery_items}</div>
                        <p className="text-xs text-muted-foreground mt-2">
                            {t('stats.total_gallery_items', 'Total gallery items')}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('stats.team', 'Team')}</CardTitle>
                        <Trophy className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.team_members}</div>
                        <p className="text-xs text-muted-foreground mt-2">
                            {t('stats.active_team_members', 'Active team members')}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            {t('stats.registrations_trend', 'Event Registrations Trend')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div style={{ height: '300px' }}>
                            <ResponsiveBar
                                data={barData}
                                keys={['registrations']}
                                indexBy="week"
                                margin={{ top: 20, right: 20, bottom: 50, left: 60 }}
                                padding={0.3}
                                colors={['hsl(var(--primary))']}
                                axisTop={null}
                                axisRight={null}
                                axisBottom={{
                                    tickSize: 5,
                                    tickPadding: 5,
                                    tickRotation: 0,
                                }}
                                axisLeft={{
                                    tickSize: 5,
                                    tickPadding: 5,
                                    tickRotation: 0,
                                }}
                                enableGridY={true}
                                enableLabel={false}
                                animate={true}
                                motionConfig="gentle"
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Eye className="h-5 w-5" />
                            {t('stats.views_trend', 'Article Views Trend')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div style={{ height: '300px' }}>
                            <ResponsiveLine
                                data={lineData}
                                margin={{ top: 20, right: 20, bottom: 50, left: 60 }}
                                xScale={{ type: 'point' }}
                                yScale={{ type: 'linear', min: 0, max: 'auto' }}
                                curve="monotoneX"
                                axisTop={null}
                                axisRight={null}
                                axisBottom={{
                                    tickSize: 5,
                                    tickPadding: 5,
                                    tickRotation: 0,
                                }}
                                axisLeft={{
                                    tickSize: 5,
                                    tickPadding: 5,
                                    tickRotation: 0,
                                }}
                                enableGridX={false}
                                enableGridY={true}
                                enablePoints={true}
                                pointSize={6}
                                pointColor="hsl(var(--primary))"
                                pointBorderWidth={2}
                                pointBorderColor="#fff"
                                colors={['hsl(var(--primary))']}
                                lineWidth={2}
                                enableArea={false}
                                animate={true}
                                motionConfig="gentle"
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Top Content */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>{t('stats.top_articles', 'Top Articles by Views')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {topArticles.map((article, index) => (
                                <div key={article.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                    <div className="flex items-center gap-3">
                                        <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">
                                            {index + 1}
                                        </Badge>
                                        <div>
                                            <p className="font-medium">{getTitle(article)}</p>
                                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                <Eye className="h-3 w-3" />
                                                {article.views_count} {t('stats.views', 'views')}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>{t('stats.top_events', 'Top Events by Registrations')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {topEvents.map((event, index) => (
                                <div key={event.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                    <div className="flex items-center gap-3">
                                        <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">
                                            {index + 1}
                                        </Badge>
                                        <div>
                                            <p className="font-medium">{getTitle(event)}</p>
                                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                <UserCheck className="h-3 w-3" />
                                                {event.registration_count} {t('stats.registrations_short', 'registrations')}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default StatsManager;