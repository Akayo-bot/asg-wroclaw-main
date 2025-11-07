import { Layout } from '@/components/Layout';
import { useI18n } from '@/contexts/I18nContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Bell } from 'lucide-react';

const SubscribePage = () => {
    const { t } = useI18n();

    return (
        <Layout showBreadcrumbs>
            <div className="min-h-screen py-12">
                <div className="container mx-auto px-4 lg:px-8">
                    <div className="text-center mb-12">
                        <h1 className="font-rajdhani text-4xl md:text-5xl font-bold mb-4">
                            {t('pages.subscribe.title', 'Subscribe')}
                        </h1>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            {t('pages.subscribe.subtitle', 'Stay updated with our latest news')}
                        </p>
                    </div>

                    <div className="max-w-md mx-auto">
                        <Card className="glass-panel">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Bell className="w-5 h-5 text-primary" />
                                    {t('pages.subscribe.newsletter', 'Newsletter Subscription')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label htmlFor="email">{t('pages.subscribe.email', 'Email')}</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder={t('pages.subscribe.emailPlaceholder', 'Enter your email')}
                                        className="cursor-target"
                                    />
                                </div>
                                <Button className="w-full cursor-target">
                                    {t('pages.subscribe.button', 'Subscribe')}
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default SubscribePage;