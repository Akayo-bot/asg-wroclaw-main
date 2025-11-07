import React, { useState } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, Clock, Users, Coins, Settings, Image as ImageIcon, MapPin, FileText, Globe as Globe2, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, X } from 'lucide-react';

interface EventForm {
  title_uk: string;
  title_ru: string;
  title_pl: string;
  title_en: string;
  description_uk: string;
  description_ru: string;
  description_pl: string;
  description_en: string;
  location_uk: string;
  location_ru: string;
  location_pl: string;
  location_en: string;
  rules_uk: string;
  rules_ru: string;
  rules_pl: string;
  rules_en: string;
  scenario_uk: string;
  scenario_ru: string;
  scenario_pl: string;
  scenario_en: string;
  start_datetime: string;
  registration_deadline: string;
  price_amount: string;
  price_currency: string;
  min_players: string;
  max_players: string;
  limit_mode: string;
  status: string;
  status_registration: string;
  main_image_url: string;
  cover_url: string;
  map_url: string;
}

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: EventForm) => Promise<void>;
  editingEvent?: any | null;
  formData: EventForm;
  setFormData: (data: EventForm) => void;
  loading: boolean;
}

const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingEvent,
  formData,
  setFormData,
  loading
}) => {
  const { t, language } = useI18n();
  const [activeLanguage, setActiveLanguage] = useState<'uk' | 'ru' | 'pl' | 'en'>(language as 'uk' | 'ru' | 'pl' | 'en');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields validation
    if (!formData.start_datetime) {
      newErrors.start_datetime = t('events.validation.required', 'This field is required');
    }

    // Title validation - at least one language required
    if (!formData.title_uk && !formData.title_ru && !formData.title_pl && !formData.title_en) {
      newErrors.title = t('events.validation.titleRequired', 'Title is required in at least one language');
    }

    // Location validation for published events
    if (formData.status === 'published') {
      if (!formData.location_uk && !formData.location_ru && !formData.location_pl && !formData.location_en) {
        newErrors.location = t('events.validation.locationRequired', 'Location is required for published events');
      }
    }

    // Registration deadline validation
    if (formData.registration_deadline && formData.start_datetime) {
      const deadline = new Date(formData.registration_deadline);
      const startDate = new Date(formData.start_datetime);
      if (deadline >= startDate) {
        newErrors.registration_deadline = t('events.validation.deadlineBeforeStart', 'Registration deadline must be before event start');
      }
    }

    // Player limits validation
    if (formData.limit_mode === 'ranged') {
      const minPlayers = parseInt(formData.min_players);
      const maxPlayers = parseInt(formData.max_players);
      
      if (!formData.min_players || minPlayers <= 0) {
        newErrors.min_players = t('events.validation.minPlayersRequired', 'Min players must be greater than 0');
      }
      
      if (!formData.max_players || maxPlayers <= 0) {
        newErrors.max_players = t('events.validation.maxPlayersRequired', 'Max players must be greater than 0');
      }
      
      if (minPlayers && maxPlayers && minPlayers > maxPlayers) {
        newErrors.min_players = t('events.validation.minLessThanMax', 'Min players cannot be greater than max players');
      }
    }

    // Price validation
    if (formData.price_amount && parseFloat(formData.price_amount) < 0) {
      newErrors.price_amount = t('events.validation.priceNonNegative', 'Price cannot be negative');
    }

    // URL validation
    const urlPattern = /^https?:\/\/.+/;
    if (formData.main_image_url && !urlPattern.test(formData.main_image_url)) {
      newErrors.main_image_url = t('events.validation.invalidUrl', 'Please enter a valid URL');
    }
    if (formData.cover_url && !urlPattern.test(formData.cover_url)) {
      newErrors.cover_url = t('events.validation.invalidUrl', 'Please enter a valid URL');
    }
    if (formData.map_url && !urlPattern.test(formData.map_url)) {
      newErrors.map_url = t('events.validation.invalidUrl', 'Please enter a valid URL');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const languages = [
    { code: 'uk', name: 'Українська', flag: '🇺🇦' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
    { code: 'pl', name: 'Polski', flag: '🇵🇱' },
    { code: 'en', name: 'English', flag: '🇺🇸' }
  ];

  const getFieldError = (field: string) => errors[field];
  const hasFieldError = (field: string) => !!errors[field];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[800px] max-h-[95vh] overflow-hidden rounded-2xl shadow-2xl animate-in fade-in-0 zoom-in-95 duration-200">
        <DialogHeader className="flex flex-row items-center justify-between pb-6 border-b border-border/20">
          <DialogTitle className="text-2xl font-rajdhani font-bold text-foreground">
            {editingEvent ? t('events.edit_event', 'Edit Event') : t('events.create_event', 'Create Event')}
          </DialogTitle>
          
          <div className="flex items-center gap-3">
            <Globe2 className="h-4 w-4 text-muted-foreground" />
            <div className="flex gap-1">
              {languages.map((lang) => (
                <Button
                  key={lang.code}
                  type="button"
                  variant={activeLanguage === lang.code ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveLanguage(lang.code as 'uk' | 'ru' | 'pl' | 'en')}
                  className="h-8 px-2 text-xs font-medium transition-all hover:scale-105"
                >
                  {lang.flag} {lang.code.toUpperCase()}
                </Button>
              ))}
            </div>
          </div>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[calc(95vh-140px)] px-1">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <Card className="border-border/50 bg-card/50">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2 text-primary">
                  <FileText className="h-5 w-5" />
                  {t('events.sections.basic', 'Basic Information')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor={`title_${activeLanguage}`} className="flex items-center gap-2 text-sm font-medium">
                    {t('events.title_field', 'Event Title')} *
                    <Badge variant="outline" className="text-xs">{activeLanguage.toUpperCase()}</Badge>
                  </Label>
                  <Input
                    id={`title_${activeLanguage}`}
                    value={formData[`title_${activeLanguage}` as keyof EventForm]}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      [`title_${activeLanguage}`]: e.target.value 
                    })}
                    placeholder={t('events.title_placeholder', 'Enter event title')}
                    className={`mt-1 transition-all focus:ring-2 focus:ring-primary/50 ${hasFieldError('title') ? 'border-destructive focus:ring-destructive/50' : ''}`}
                  />
                  {hasFieldError('title') && (
                    <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {getFieldError('title')}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor={`description_${activeLanguage}`} className="flex items-center gap-2 text-sm font-medium">
                    {t('events.description_field', 'Description')}
                    <Badge variant="outline" className="text-xs">{activeLanguage.toUpperCase()}</Badge>
                  </Label>
                  <Textarea
                    id={`description_${activeLanguage}`}
                    value={formData[`description_${activeLanguage}` as keyof EventForm]}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      [`description_${activeLanguage}`]: e.target.value 
                    })}
                    placeholder={t('events.description_placeholder', 'Enter event description')}
                    rows={3}
                    maxLength={1000}
                    className="mt-1 transition-all focus:ring-2 focus:ring-primary/50 resize-none"
                  />
                  <div className="text-xs text-muted-foreground mt-1">
                    {formData[`description_${activeLanguage}` as keyof EventForm]?.length || 0}/1000
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Date & Time */}
            <Card className="border-border/50 bg-card/50">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2 text-primary">
                  <Calendar className="h-5 w-5" />
                  {t('events.sections.datetime', 'Date & Time')}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_datetime" className="flex items-center gap-2 text-sm font-medium">
                    <Clock className="h-4 w-4" />
                    {t('events.start_datetime', 'Event Date & Time')} *
                  </Label>
                  <Input
                    id="start_datetime"
                    type="datetime-local"
                    value={formData.start_datetime}
                    onChange={(e) => setFormData({ ...formData, start_datetime: e.target.value })}
                    className={`mt-1 transition-all focus:ring-2 focus:ring-primary/50 ${hasFieldError('start_datetime') ? 'border-destructive focus:ring-destructive/50' : ''}`}
                  />
                  {hasFieldError('start_datetime') && (
                    <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {getFieldError('start_datetime')}
                    </p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="registration_deadline" className="flex items-center gap-2 text-sm font-medium">
                    <Calendar className="h-4 w-4" />
                    {t('events.registration_deadline', 'Registration Deadline')}
                  </Label>
                  <Input
                    id="registration_deadline"
                    type="datetime-local"
                    value={formData.registration_deadline}
                    onChange={(e) => setFormData({ ...formData, registration_deadline: e.target.value })}
                    className={`mt-1 transition-all focus:ring-2 focus:ring-primary/50 ${hasFieldError('registration_deadline') ? 'border-destructive focus:ring-destructive/50' : ''}`}
                  />
                  {hasFieldError('registration_deadline') && (
                    <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {getFieldError('registration_deadline')}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Participants */}
            <Card className="border-border/50 bg-card/50">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2 text-primary">
                  <Users className="h-5 w-5" />
                  {t('events.sections.participants', 'Participants')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="limit_mode" className="text-sm font-medium">{t('events.limit_mode', 'Player Limits')}</Label>
                  <Select value={formData.limit_mode} onValueChange={(value) => setFormData({ ...formData, limit_mode: value })}>
                    <SelectTrigger className="mt-1 focus:ring-2 focus:ring-primary/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unlimited">{t('events.unlimited', 'Unlimited')}</SelectItem>
                      <SelectItem value="ranged">{t('events.ranged', 'Set Range')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {formData.limit_mode === 'ranged' && (
                  <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg border border-border/30">
                    <div>
                      <Label htmlFor="min_players" className="text-sm font-medium">{t('events.min_players', 'Min Players')} *</Label>
                      <Input
                        id="min_players"
                        type="number"
                        min="1"
                        value={formData.min_players}
                        onChange={(e) => setFormData({ ...formData, min_players: e.target.value })}
                        placeholder="8"
                        className={`mt-1 transition-all focus:ring-2 focus:ring-primary/50 ${hasFieldError('min_players') ? 'border-destructive focus:ring-destructive/50' : ''}`}
                      />
                      {hasFieldError('min_players') && (
                        <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          {getFieldError('min_players')}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="max_players" className="text-sm font-medium">{t('events.max_players', 'Max Players')} *</Label>
                      <Input
                        id="max_players"
                        type="number"
                        min="1"
                        value={formData.max_players}
                        onChange={(e) => setFormData({ ...formData, max_players: e.target.value })}
                        placeholder="40"
                        className={`mt-1 transition-all focus:ring-2 focus:ring-primary/50 ${hasFieldError('max_players') ? 'border-destructive focus:ring-destructive/50' : ''}`}
                      />
                      {hasFieldError('max_players') && (
                        <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          {getFieldError('max_players')}
                        </p>
                      )}
                    </div>

                    {formData.min_players && formData.max_players && parseInt(formData.min_players) <= parseInt(formData.max_players) && (
                      <div className="col-span-2">
                        <Alert className="border-primary/20 bg-primary/5">
                          <CheckCircle className="h-4 w-4 text-primary" />
                          <AlertDescription className="text-primary">
                            {t('events.validation.rangeValid', 'Player range is valid')}: {formData.min_players} - {formData.max_players} {t('events.players', 'players')}
                          </AlertDescription>
                        </Alert>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment */}
            <Card className="border-border/50 bg-card/50">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2 text-primary">
                  <Coins className="h-5 w-5" />
                  {t('events.sections.payment', 'Payment')}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="price_amount" className="text-sm font-medium">{t('events.price', 'Price')}</Label>
                  <Input
                    id="price_amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price_amount}
                    onChange={(e) => setFormData({ ...formData, price_amount: e.target.value })}
                    placeholder={t('events.price_placeholder', 'Leave empty for free event')}
                    className={`mt-1 transition-all focus:ring-2 focus:ring-primary/50 ${hasFieldError('price_amount') ? 'border-destructive focus:ring-destructive/50' : ''}`}
                  />
                  {hasFieldError('price_amount') && (
                    <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {getFieldError('price_amount')}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="price_currency" className="text-sm font-medium">{t('events.currency', 'Currency')}</Label>
                  <Select value={formData.price_currency} onValueChange={(value) => setFormData({ ...formData, price_currency: value })}>
                    <SelectTrigger className="mt-1 focus:ring-2 focus:ring-primary/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PLN">PLN (zł)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="UAH">UAH (₴)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Status */}
            <Card className="border-border/50 bg-card/50">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2 text-primary">
                  <Settings className="h-5 w-5" />
                  {t('events.sections.status', 'Status')}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="status" className="text-sm font-medium">{t('events.status.label', 'Event Status')}</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger className="mt-1 focus:ring-2 focus:ring-primary/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">{t('events.status.draft', 'Draft')}</SelectItem>
                      <SelectItem value="published">{t('events.status.published', 'Published')}</SelectItem>
                      <SelectItem value="upcoming">{t('events.status.upcoming', 'Upcoming')}</SelectItem>
                      <SelectItem value="registration_open">{t('events.status.registration_open', 'Registration Open')}</SelectItem>
                      <SelectItem value="completed">{t('events.status.completed', 'Completed')}</SelectItem>
                      <SelectItem value="cancelled">{t('events.status.cancelled', 'Cancelled')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="status_registration" className="text-sm font-medium">{t('events.registration_status', 'Registration Status')}</Label>
                  <Select value={formData.status_registration} onValueChange={(value) => setFormData({ ...formData, status_registration: value })}>
                    <SelectTrigger className="mt-1 focus:ring-2 focus:ring-primary/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">{t('events.registration.open', 'Open')}</SelectItem>
                      <SelectItem value="closed">{t('events.registration.closed', 'Closed')}</SelectItem>
                      <SelectItem value="waitlist">{t('events.registration.waitlist', 'Waitlist')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Media */}
            <Card className="border-border/50 bg-card/50">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2 text-primary">
                  <ImageIcon className="h-5 w-5" />
                  {t('events.sections.media', 'Media')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="main_image_url" className="text-sm font-medium">{t('events.main_image_url', 'Main Image URL')}</Label>
                  <Input
                    id="main_image_url"
                    type="url"
                    value={formData.main_image_url}
                    onChange={(e) => setFormData({ ...formData, main_image_url: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                    className={`mt-1 transition-all focus:ring-2 focus:ring-primary/50 ${hasFieldError('main_image_url') ? 'border-destructive focus:ring-destructive/50' : ''}`}
                  />
                  {hasFieldError('main_image_url') && (
                    <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {getFieldError('main_image_url')}
                    </p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="cover_url" className="text-sm font-medium">{t('events.cover_url', 'Cover Image URL')}</Label>
                  <Input
                    id="cover_url"
                    type="url"
                    value={formData.cover_url}
                    onChange={(e) => setFormData({ ...formData, cover_url: e.target.value })}
                    placeholder="https://example.com/cover.jpg"
                    className={`mt-1 transition-all focus:ring-2 focus:ring-primary/50 ${hasFieldError('cover_url') ? 'border-destructive focus:ring-destructive/50' : ''}`}
                  />
                  {hasFieldError('cover_url') && (
                    <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {getFieldError('cover_url')}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Location */}
            <Card className="border-border/50 bg-card/50">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2 text-primary">
                  <MapPin className="h-5 w-5" />
                  {t('events.sections.location', 'Location')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor={`location_${activeLanguage}`} className="flex items-center gap-2 text-sm font-medium">
                    {t('events.location_field', 'Location')} {formData.status === 'published' && '*'}
                    <Badge variant="outline" className="text-xs">{activeLanguage.toUpperCase()}</Badge>
                  </Label>
                  <Input
                    id={`location_${activeLanguage}`}
                    value={formData[`location_${activeLanguage}` as keyof EventForm]}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      [`location_${activeLanguage}`]: e.target.value 
                    })}
                    placeholder={t('events.location_placeholder', 'Enter event location')}
                    className={`mt-1 transition-all focus:ring-2 focus:ring-primary/50 ${hasFieldError('location') ? 'border-destructive focus:ring-destructive/50' : ''}`}
                  />
                  {hasFieldError('location') && (
                    <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {getFieldError('location')}
                    </p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="map_url" className="text-sm font-medium">{t('events.map_url', 'Map URL')}</Label>
                  <Input
                    id="map_url"
                    type="url"
                    value={formData.map_url}
                    onChange={(e) => setFormData({ ...formData, map_url: e.target.value })}
                    placeholder="https://maps.google.com/..."
                    className={`mt-1 transition-all focus:ring-2 focus:ring-primary/50 ${hasFieldError('map_url') ? 'border-destructive focus:ring-destructive/50' : ''}`}
                  />
                  {hasFieldError('map_url') && (
                    <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {getFieldError('map_url')}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Rules */}
            <Card className="border-border/50 bg-card/50">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2 text-primary">
                  <FileText className="h-5 w-5" />
                  {t('events.sections.rules', 'Rules & Scenario')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Label htmlFor={`rules_${activeLanguage}`} className="flex items-center gap-2 text-sm font-medium">
                    {t('events.rules_field', 'Rules')}
                    <Badge variant="outline" className="text-xs">{activeLanguage.toUpperCase()}</Badge>
                  </Label>
                  <Textarea
                    id={`rules_${activeLanguage}`}
                    value={formData[`rules_${activeLanguage}` as keyof EventForm]}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      [`rules_${activeLanguage}`]: e.target.value 
                    })}
                    placeholder={t('events.rules_placeholder', 'Enter event rules and regulations')}
                    rows={4}
                    className="mt-1 transition-all focus:ring-2 focus:ring-primary/50 resize-none"
                  />
                </div>
              </CardContent>
            </Card>
          </form>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-6 border-t border-border/20 bg-background/80 backdrop-blur-sm">
          <p className="text-sm text-muted-foreground">
            * {t('events.required_fields', 'Required fields')}
          </p>
          <div className="flex gap-3">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={onClose} 
              disabled={isSubmitting}
              className="transition-all hover:bg-muted/50"
            >
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={isSubmitting} 
              className="min-w-[120px] transition-all hover:scale-105 focus:ring-2 focus:ring-primary/50"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                  {t('common.saving', 'Saving...')}
                </div>
              ) : (
                editingEvent ? t('common.update', 'Update') : t('common.create', 'Create')
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EventModal;