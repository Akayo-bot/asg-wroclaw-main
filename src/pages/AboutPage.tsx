import { Layout } from '@/components/Layout';
import { useI18n } from '@/contexts/I18nContext';
import { Card, CardContent } from '@/components/ui/card';
import { Target, Shield, Users, Trophy } from 'lucide-react';

const AboutPage = () => {
  const { t } = useI18n();

  return (
    <Layout showBreadcrumbs>
      <div className="min-h-screen py-12">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="font-rajdhani text-4xl md:text-5xl font-bold mb-4">
              {t('pages.about.title', 'About Us')}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('pages.about.subtitle', 'Learn more about our team')}
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 mb-16">
            <Card className="glass-panel">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <Target className="w-8 h-8 text-primary" />
                  <h2 className="font-rajdhani text-2xl font-bold">{t('pages.about.mission', 'Mission')}</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Raven Strike Force - это профессиональная команда страйкболистов, 
                  созданная в 2019 году во Вроцлаве. Наша миссия - развитие тактического 
                  страйкбола в Польше, популяризация спорта среди молодежи и создание 
                  сообщества единомышленников.
                </p>
              </CardContent>
            </Card>

            <Card className="glass-panel">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <Shield className="w-8 h-8 text-primary" />
                  <h2 className="font-rajdhani text-2xl font-bold">{t('pages.about.history', 'History')}</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Команда была основана группой энтузиастов с военным опытом. 
                  За 5 лет существования мы провели более 150 игр, выиграли 12 турниров 
                  и обучили свыше 200 новых игроков основам тактического страйкбола.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <Card className="glass-panel max-w-4xl mx-auto">
              <CardContent className="p-8">
                <div className="flex items-center justify-center gap-3 mb-6">
                  <Trophy className="w-8 h-8 text-primary" />
                  <h2 className="font-rajdhani text-2xl font-bold">{t('pages.about.goals', 'Goals')}</h2>
                </div>
                <div className="grid md:grid-cols-3 gap-6 text-center">
                  <div>
                    <Users className="w-12 h-12 text-primary mx-auto mb-3" />
                    <h3 className="font-rajdhani text-lg font-bold mb-2">Развитие сообщества</h3>
                    <p className="text-sm text-muted-foreground">
                      Создание крепкого сообщества страйкболистов
                    </p>
                  </div>
                  <div>
                    <Target className="w-12 h-12 text-primary mx-auto mb-3" />
                    <h3 className="font-rajdhani text-lg font-bold mb-2">Профессиональный подход</h3>
                    <p className="text-sm text-muted-foreground">
                      Высокие стандарты безопасности и честной игры
                    </p>
                  </div>
                  <div>
                    <Trophy className="w-12 h-12 text-primary mx-auto mb-3" />
                    <h3 className="font-rajdhani text-lg font-bold mb-2">Спортивные достижения</h3>
                    <p className="text-sm text-muted-foreground">
                      Участие в турнирах и международных соревнованиях
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AboutPage;