import { Layout } from '@/components/Layout';
import { useI18n } from '@/contexts/I18nContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    Phone,
    Mail,
    MapPin,
    Clock,
    Facebook,
    Instagram,
    MessageCircle,
    Send
} from 'lucide-react';

const ContactsPage = () => {
    const { t } = useI18n();

    const contactInfo = [
        {
            icon: Phone,
            title: t('contact.phone', 'Phone'),
            value: '+48 123 456 789',
            description: t('pages.contacts.info.phone_desc', 'Available daily from 10:00 to 22:00')
        },
        {
            icon: Mail,
            title: t('contact.email', 'Email'),
            value: 'info@ravenstrike.pl',
            description: t('pages.contacts.info.email_desc', 'We will respond within 24 hours')
        },
        {
            icon: MapPin,
            title: t('contact.location', 'Location'),
            value: t('pages.contacts.info.location_value', 'Wrocław, Poland'),
            description: t('pages.contacts.info.location_desc', 'Main base of operations')
        },
        {
            icon: Clock,
            title: t('contact.hours', 'Hours'),
            value: t('pages.contacts.info.hours_value', 'Mon-Sun: 10:00 - 22:00'),
            description: t('pages.contacts.info.hours_desc', 'Time for contact and consultations')
        }
    ];

    const socialLinks = [
        {
            icon: Facebook,
            name: 'Facebook',
            url: '#',
            handle: '@ravenstrikewroclaw'
        },
        {
            icon: Instagram,
            name: 'Instagram',
            url: '#',
            handle: '@raven_strike_force'
        }
    ];

    return (
        <Layout showBreadcrumbs>
            <div className="min-h-screen py-12">
                <div className="container mx-auto px-4 lg:px-8">
                    {/* Header */}
                    <div className="text-center mb-12">
                        <h1 className="font-rajdhani text-4xl md:text-5xl font-bold mb-4">
                            {t('contact.title', 'Contacts')}
                        </h1>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            {t('contact.subtitle', 'Get in touch with us')}
                        </p>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-12">
                        {/* Contact Information */}
                        <div>
                            <h2 className="font-rajdhani text-2xl font-bold mb-6 text-primary">
                                {t('pages.contacts.info.title', 'Contact Information')}
                            </h2>

                            <div className="grid gap-4 mb-8">
                                {contactInfo.map((info, index) => (
                                    <Card key={index} className="glass-panel">
                                        <CardContent className="p-6">
                                            <div className="flex items-start gap-4">
                                                <div className="p-3 rounded-lg bg-primary/10">
                                                    <info.icon className="w-6 h-6 text-primary" />
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-rajdhani text-lg font-bold mb-1">
                                                        {info.title}
                                                    </h3>
                                                    <p className="text-foreground font-medium mb-1">
                                                        {info.value}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {info.description}
                                                    </p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>

                            {/* Social Media */}
                            <div>
                                <h3 className="font-rajdhani text-xl font-bold mb-4 text-primary">
                                    {t('pages.contacts.social.title', 'Social Media')}
                                </h3>
                                <div className="flex gap-4">
                                    {socialLinks.map((social, index) => (
                                        <Card key={index} className="glass-panel tactical-lift cursor-target">
                                            <CardContent className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <social.icon className="w-5 h-5 text-primary" />
                                                    <div>
                                                        <p className="font-medium">{social.name}</p>
                                                        <p className="text-sm text-muted-foreground">{social.handle}</p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="mt-8">
                                <h3 className="font-rajdhani text-xl font-bold mb-4 text-primary">
                                    {t('pages.contacts.actions.title', 'Quick Actions')}
                                </h3>
                                <div className="grid gap-3">
                                    <Button className="justify-start gap-3 cursor-target" variant="outline">
                                        <MessageCircle className="w-5 h-5" />
                                        {t('pages.contacts.actions.telegram', 'Write to Telegram')}
                                    </Button>
                                    <Button className="justify-start gap-3 cursor-target" variant="outline">
                                        <Phone className="w-5 h-5" />
                                        {t('pages.contacts.actions.callback', 'Request a call')}
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Contact Form */}
                        <div>
                            <Card className="glass-panel">
                                <CardHeader>
                                    <CardTitle className="font-rajdhani text-2xl flex items-center gap-2">
                                        <Send className="w-6 h-6 text-primary" />
                                        {t('pages.contacts.form.title', 'Contact Us')}
                                    </CardTitle>
                                    <p className="text-muted-foreground">
                                        {t('pages.contacts.form.description', 'Fill out the form and we will contact you shortly')}
                                    </p>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="name">{t('contact.form.name', 'Name')}</Label>
                                            <Input
                                                id="name"
                                                placeholder={t('pages.contacts.form.name_placeholder', 'Your name')}
                                                className="cursor-target"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="phone">{t('contact.form.phone', 'Phone')}</Label>
                                            <Input
                                                id="phone"
                                                placeholder={t('pages.contacts.form.phone_placeholder', '+48 123 456 789')}
                                                className="cursor-target"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <Label htmlFor="email">{t('contact.form.email', 'Email')}</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder={t('pages.contacts.form.email_placeholder', 'your.email@example.com')}
                                            className="cursor-target"
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="subject">{t('pages.contacts.form.subject', 'Message Subject')}</Label>
                                        <Input
                                            id="subject"
                                            placeholder={t('pages.contacts.form.subject_placeholder', 'What would you like to talk about?')}
                                            className="cursor-target"
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="message">{t('contact.form.message', 'Message')}</Label>
                                        <Textarea
                                            id="message"
                                            placeholder={t('pages.contacts.form.message_placeholder', 'Tell us more about your question or suggestion...')}
                                            rows={5}
                                            className="cursor-target"
                                        />
                                    </div>

                                    <Button className="w-full cursor-target">
                                        <Send className="w-4 h-4 mr-2" />
                                        {t('contact.form.submit', 'Send Message')}
                                    </Button>

                                    <p className="text-xs text-muted-foreground text-center">
                                        {t('pages.contacts.form.privacy', 'By submitting the form, you agree to the processing of personal data')}
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* FAQ Section */}
                    <div className="mt-16">
                        <h2 className="font-rajdhani text-2xl font-bold mb-8 text-center text-primary">
                            {t('pages.contacts.faq.title', 'Frequently Asked Questions')}
                        </h2>
                        <div className="grid md:grid-cols-2 gap-6">
                            <Card className="glass-panel">
                                <CardHeader>
                                    <CardTitle className="font-rajdhani text-lg">
                                        {t('pages.contacts.faq.join.question', 'How to join the team?')}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">
                                        {t('pages.contacts.faq.join.answer', 'Contact us in any convenient way. We will tell you about the requirements, invite you to training and help you choose equipment.')}
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="glass-panel">
                                <CardHeader>
                                    <CardTitle className="font-rajdhani text-lg">
                                        {t('pages.contacts.faq.equipment.question', 'Do I need my own equipment?')}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">
                                        {t('pages.contacts.faq.equipment.answer', 'You can start with rented equipment. We will help you choose and buy your own equipment.')}
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="glass-panel">
                                <CardHeader>
                                    <CardTitle className="font-rajdhani text-lg">
                                        {t('pages.contacts.faq.level.question', 'What level of preparation is needed?')}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">
                                        {t('pages.contacts.faq.level.answer', 'We accept players of any level. The main thing is the desire to learn, discipline and team spirit.')}
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="glass-panel">
                                <CardHeader>
                                    <CardTitle className="font-rajdhani text-lg">
                                        {t('pages.contacts.faq.frequency.question', 'How often are games held?')}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">
                                        {t('pages.contacts.faq.frequency.answer', 'We organize games 2-3 times a month. We also participate in tournaments and special events throughout Poland.')}
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default ContactsPage;