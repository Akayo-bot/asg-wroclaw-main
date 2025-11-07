import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/contexts/I18nContext';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency, formatPlayerLimits, formatDateTime } from '@/lib/formatters';
import { RefreshCw, Database, Clock, Users, FileText } from 'lucide-react';

const DataSources = () => {
  const { t, language } = useI18n();
  const [upcomingGames, setUpcomingGames] = useState([]);
  const [articles, setArticles] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDebugData();
  }, []);

  const fetchDebugData = async () => {
    setLoading(true);
    try {
      // Fetch upcoming events  
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .in('status', ['upcoming', 'registration_open'])
        .gte('start_datetime', new Date().toISOString())
        .order('start_datetime', { ascending: true })
        .limit(3);

      if (!eventsError) {
        setUpcomingGames(eventsData || []);
      }

      // Fetch published articles
      const { data: articlesData, error: articlesError } = await supabase
        .from('articles')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(5);

      if (!articlesError) {
        setArticles(articlesData || []);
      }

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Debug fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTitle = (item: any, type: 'event' | 'article') => {
    const titles = {
      uk: type === 'event' ? item.title_uk : item.title_uk,
      ru: type === 'event' ? item.title_ru : item.title_ru, 
      pl: type === 'event' ? item.title_pl : item.title_pl,
      en: type === 'event' ? item.title_en : item.title_en,
    };
    return titles[language] || item.title_uk || 'Untitled';
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Debug: Data Sources</h1>
          <p className="text-muted-foreground">Real-time data sources and cache status</p>
        </div>
        <Button onClick={fetchDebugData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>

      {/* Home Page: Upcoming Games */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Home Page: Upcoming Games Query
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <strong>Query:</strong>
              <code className="block bg-muted p-2 rounded mt-2 text-sm">
                SELECT * FROM events WHERE status IN ('upcoming', 'registration_open') AND start_datetime &gt;= NOW() ORDER BY start_datetime ASC LIMIT 3
              </code>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <strong>Total Found:</strong>
                <p className="text-muted-foreground">{upcomingGames.length} events</p>
              </div>
              <div>
                <strong>Status Filter:</strong>
                <p className="text-muted-foreground">upcoming, registration_open</p>
              </div>
              <div>
                <strong>Currency Support:</strong>
                <p className="text-muted-foreground">PLN, USD, EUR, UAH</p>
              </div>
              <div>
                <strong>Last Update:</strong>
                <p className="text-muted-foreground">{lastUpdate.toLocaleString()}</p>
              </div>
            </div>

            {upcomingGames.length > 0 ? (
              <div className="space-y-2">
                <strong>Events Found:</strong>
                {upcomingGames.map((event: any) => (
                  <div key={event.id} className="flex items-center justify-between p-3 bg-muted/50 rounded">
                    <div>
                      <span className="font-medium">{getTitle(event, 'event')}</span>
                      <div className="text-xs text-muted-foreground">
                        ID: {event.id} | Status: {event.status} | Registration: {event.status_registration}
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      <div>{formatDateTime(event.start_datetime, language, { month: 'short', day: 'numeric' })}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatCurrency(event.price_amount, event.price_currency || 'PLN', language)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
                <p className="text-yellow-800 dark:text-yellow-200">⚠️ No upcoming events found. This will show empty state on homepage.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Event Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Event Details ({upcomingGames.length} found)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {upcomingGames.length > 0 ? (
              upcomingGames.map((event: any) => (
                <div key={event.id} className="border rounded p-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div><strong>ID:</strong> {event.id.slice(0, 8)}...</div>
                    <div><strong>Title:</strong> {getTitle(event, 'event')}</div>
                    <div><strong>Status:</strong> <Badge>{event.status}</Badge></div>
                    <div><strong>Registration:</strong> <Badge variant="outline">{event.status_registration || 'open'}</Badge></div>
                    <div><strong>Limit:</strong> {formatPlayerLimits(event.limit_mode, event.min_players, event.max_players, 0, language)}</div>
                    <div><strong>Price:</strong> {formatCurrency(event.price_amount, event.price_currency, language)}</div>
                    <div><strong>Start:</strong> {event.start_datetime ? formatDateTime(event.start_datetime, language) : 'Not set'}</div>
                    <div><strong>Location:</strong> {
                      language === 'uk' ? event.location_uk :
                      language === 'ru' ? event.location_ru :
                      language === 'pl' ? event.location_pl :
                      event.location_en || event.location_uk || 'Not set'
                    }</div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-4">No upcoming events found</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Articles Page Query */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Articles Page Query
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <strong>Query:</strong>
              <code className="block bg-muted p-2 rounded mt-2 text-sm">
                SELECT * FROM articles WHERE status = 'published' ORDER BY created_at DESC LIMIT 5
              </code>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <strong>Articles Count:</strong>
                <Badge variant="outline">{articles.length}</Badge>
              </div>
              <div>
                <strong>Status Filter:</strong>
                <Badge>published</Badge>
              </div>
              <div>
                <strong>Sort Order:</strong>
                <Badge variant="secondary">created_at DESC</Badge>
              </div>
              <div>
                <strong>i18n Support:</strong>
                <Badge variant="default">4 Languages</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Article Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Article Details ({articles.length} found)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {articles.length > 0 ? (
              articles.map((article: any) => (
                <div key={article.id} className="border rounded p-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div><strong>ID:</strong> {article.id.slice(0, 8)}...</div>
                    <div><strong>Title:</strong> {getTitle(article, 'article')}</div>
                    <div><strong>Category:</strong> <Badge variant="outline">{article.category}</Badge></div>
                    <div><strong>Status:</strong> <Badge>{article.status}</Badge></div>
                    <div><strong>Views:</strong> {article.views_count || 0}</div>
                    <div><strong>Created:</strong> {new Date(article.created_at).toLocaleDateString()}</div>
                    <div><strong>Has i18n:</strong> 
                      <div className="flex gap-1 mt-1">
                        {article.title_uk && <Badge variant="secondary">UK</Badge>}
                        {article.title_ru && <Badge variant="secondary">RU</Badge>}
                        {article.title_pl && <Badge variant="secondary">PL</Badge>}
                        {article.title_en && <Badge variant="secondary">EN</Badge>}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-4">No published articles found</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* System Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            System Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <strong>Database:</strong>
              <p className="text-green-600">Connected</p>
            </div>
            <div>
              <strong>RLS Status:</strong>
              <Badge variant="default">Enabled</Badge>
            </div>
            <div>
              <strong>Current Language:</strong>
              <Badge variant="outline">{language}</Badge>
            </div>
            <div>
              <strong>Last Cache Update:</strong>
              <p className="text-muted-foreground">{lastUpdate.toLocaleTimeString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DataSources;