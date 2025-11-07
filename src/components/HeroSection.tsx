import { Button } from '@/components/ui/button';
import { ArrowRight, Crosshair } from 'lucide-react';
import heroImage from '@/assets/hero-airsoft.jpg';
import { useI18n } from '@/contexts/I18nContext';

const HeroSection = () => {
    const { t } = useI18n();

    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
            {/* Background Image with Overlay */}
            <div className="absolute inset-0 z-0">
                <img
                    src={heroImage}
                    alt="Tactical airsoft player in combat gear"
                    className="w-full h-full object-cover opacity-40"
                />
                <div className="absolute inset-0 bg-background/60" />

                {/* Tactical Grid Overlay */}
                <div className="absolute inset-0 opacity-10">
                    <div className="h-full w-full" style={{
                        backgroundImage: `
              linear-gradient(rgba(76, 175, 80, 0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(76, 175, 80, 0.3) 1px, transparent 1px)
            `,
                        backgroundSize: '60px 60px'
                    }} />
                </div>
            </div>

            {/* Content */}
            <div className="relative z-10 container mx-auto px-4 lg:px-8 text-center">
                <div className="max-w-4xl mx-auto space-y-8">
                    {/* Crosshair Icon */}
                    <div className="flex justify-center mb-8">
                        <div className="relative">
                            <Crosshair className="w-16 h-16 text-primary animate-tactical-pulse" />
                            <div className="absolute inset-0 w-16 h-16 border border-primary/30 rounded-full animate-pulse" />
                        </div>
                    </div>

                    {/* Main Headline */}
                    <h1 className="font-rajdhani text-5xl md:text-7xl lg:text-8xl font-bold text-foreground leading-tight tracking-tight">
                        {t('hero.title.line1', 'СТРАЙКБОЛ —')}<br />
                        {t('hero.title.line2', 'ЭТО БОЛЬШЕ,')}<br />
                        <span className="text-primary">{t('hero.title.line3', 'ЧЕМ ИГРА')}</span>
                    </h1>

                    {/* Subheadline */}
                    <p className="font-inter text-xl md:text-2xl text-muted-foreground font-medium tracking-wide max-w-2xl mx-auto leading-relaxed">
                        {t('hero.subtitle', 'Тактика. Командный дух. Адреналин.')}
                    </p>

                    {/* CTA Button */}
                    <div className="pt-8">
                        <Button
                            size="lg"
                            className="btn-tactical-primary font-rajdhani text-lg font-bold px-8 py-4 cursor-target group"
                        >
                            {t('hero.cta.button', 'ЗАПИСАТЬСЯ НА ИГРУ')}
                            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </div>

                    {/* Stats */}
                    <div className="pt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto">
                        <div className="text-center">
                            <div className="font-rajdhani text-3xl font-bold text-primary">150+</div>
                            <div className="font-inter text-sm text-muted-foreground uppercase tracking-wider">{t('hero.stats.players', 'Игроков')}</div>
                        </div>
                        <div className="text-center">
                            <div className="font-rajdhani text-3xl font-bold text-primary">50+</div>
                            <div className="font-inter text-sm text-muted-foreground uppercase tracking-wider">{t('hero.stats.games', 'Игр в год')}</div>
                        </div>
                        <div className="text-center">
                            <div className="font-rajdhani text-3xl font-bold text-primary">5</div>
                            <div className="font-inter text-sm text-muted-foreground uppercase tracking-wider">{t('hero.stats.experience', 'Лет опыта')}</div>
                        </div>
                    </div>
                </div>

                {/* Scroll Indicator */}
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
                    <div className="w-6 h-10 border-2 border-primary/50 rounded-full flex justify-center">
                        <div className="w-1 h-3 bg-primary rounded-full mt-2 animate-bounce" />
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HeroSection;