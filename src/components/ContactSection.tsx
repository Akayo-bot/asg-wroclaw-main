import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Phone, MapPin, Clock, Facebook, Instagram } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';

const ContactSection = () => {
    const { t } = useI18n();

    const contactInfo = [
        {
            icon: Phone,
            label: t('contact.phone', 'Телефон'),
            value: '+48 123 456 789',
            description: t('contact.phone.desc', 'Звоните с 9:00 до 21:00')
        },
        {
            icon: Mail,
            label: t('contact.email', 'Email'),
            value: 'info@ravenstrike.pl',
            description: t('contact.email.desc', 'Ответим в течение 24 часов')
        },
        {
            icon: MapPin,
            label: t('contact.location', 'Локация'),
            value: t('contact.location.value', 'Вроцлав, Польша'),
            description: t('contact.location.desc', 'Игры в радиусе 50 км')
        },
        {
            icon: Clock,
            label: t('contact.hours', 'Режим работы'),
            value: t('contact.hours.value', 'Пн-Вс 9:00-21:00'),
            description: t('contact.hours.desc', 'Консультации и бронирование')
        }
    ];

    return (
        <section id="contacts" className="py-20 bg-muted/20">
            <div className="container mx-auto px-4 lg:px-8">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <h2 className="font-rajdhani text-4xl md:text-5xl font-bold text-foreground mb-4">
                        {t('contact.title', 'ГОТОВЫ К БОЮ?').split(' ').map((word, i, arr) =>
                            i === arr.length - 1 ? <span key={i} className="text-primary">{word}</span> : word + ' '
                        )}
                    </h2>
                    <p className="font-inter text-lg text-muted-foreground max-w-2xl mx-auto">
                        {t('contact.subtitle', 'Свяжитесь с нами для участия в играх или организации собственного события')}
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                    {/* Contact Info */}
                    <div className="space-y-8">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {contactInfo.map((item, index) => (
                                <div
                                    key={index}
                                    className="bg-card p-6 rounded-lg tactical-lift cursor-target group"
                                >
                                    <item.icon className="w-8 h-8 text-primary mb-4 group-hover:scale-110 transition-transform" />
                                    <div className="font-rajdhani text-lg font-bold text-foreground">
                                        {item.label}
                                    </div>
                                    <div className="font-inter text-primary font-medium">
                                        {item.value}
                                    </div>
                                    <div className="font-inter text-xs text-muted-foreground mt-1">
                                        {item.description}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Social Links */}
                        <div className="bg-card p-6 rounded-lg tactical-lift">
                            <h3 className="font-rajdhani text-xl font-bold text-foreground mb-4">
                                {t('contact.social.title', 'СЛЕДИТЕ ЗА НАМИ')}
                            </h3>
                            <div className="flex space-x-4">
                                <button className="p-3 bg-primary/10 hover:bg-primary hover:text-primary-foreground rounded-lg transition-colors cursor-target group">
                                    <Facebook className="w-6 h-6 group-hover:scale-110 transition-transform" />
                                </button>
                                <button className="p-3 bg-primary/10 hover:bg-primary hover:text-primary-foreground rounded-lg transition-colors cursor-target group">
                                    <Instagram className="w-6 h-6 group-hover:scale-110 transition-transform" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className="bg-card p-8 rounded-lg tactical-lift">
                        <h3 className="font-rajdhani text-2xl font-bold text-foreground mb-6">
                            {t('contact.form.title', 'НАПИСАТЬ НАМ')}
                        </h3>

                        <form className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="font-inter text-sm font-medium text-foreground mb-2 block">
                                        {t('contact.form.name', 'Имя')}
                                    </label>
                                    <Input
                                        placeholder={t('contact.form.name.placeholder', 'Ваше имя')}
                                        className="bg-muted border-border text-foreground cursor-target"
                                    />
                                </div>
                                <div>
                                    <label className="font-inter text-sm font-medium text-foreground mb-2 block">
                                        {t('contact.phone', 'Телефон')}
                                    </label>
                                    <Input
                                        placeholder={t('contact.form.phone.placeholder', '+48 123 456 789')}
                                        className="bg-muted border-border text-foreground cursor-target"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="font-inter text-sm font-medium text-foreground mb-2 block">
                                    {t('contact.email', 'Email')}
                                </label>
                                <Input
                                    type="email"
                                    placeholder={t('contact.form.email.placeholder', 'your@email.com')}
                                    className="bg-muted border-border text-foreground cursor-target"
                                />
                            </div>

                            <div>
                                <label className="font-inter text-sm font-medium text-foreground mb-2 block">
                                    {t('contact.form.message', 'Сообщение')}
                                </label>
                                <Textarea
                                    placeholder={t('contact.form.message.placeholder', 'Расскажите о своих планах или задайте вопрос...')}
                                    rows={5}
                                    className="bg-muted border-border text-foreground cursor-target resize-none"
                                />
                            </div>

                            <Button
                                type="submit"
                                className="btn-tactical-primary w-full font-rajdhani text-lg font-bold cursor-target"
                            >
                                {t('contact.form.submit', 'ОТПРАВИТЬ СООБЩЕНИЕ')}
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ContactSection;