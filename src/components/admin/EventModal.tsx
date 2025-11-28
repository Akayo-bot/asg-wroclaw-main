import React, { useState } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import CreateEventForm from '@/components/admin/CreateEventForm';

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
  amenities: string[];
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
  const { t } = useI18n();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { name: string; value: any } }) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleImageUpload = (url: string) => {
    setFormData({ ...formData, main_image_url: url });
  };

  const handleSave = async () => {
    await onSubmit(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-3xl overflow-hidden bg-neutral-950/95 border-neutral-800 p-0 flex flex-col relative"
        style={{
          position: 'fixed',
          left: '50%',
          transform: 'translateX(-50%)',
          top: '5rem',
          bottom: '1rem',
          height: 'auto',
          maxHeight: 'calc(100vh - 6rem)',
          margin: 0
        }}
      >
        <div className="overflow-y-auto flex-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/20 hover:scrollbar-thumb-white/30">
        <CreateEventForm 
            eventData={formData}
            onChange={handleChange}
            onSave={handleSave}
            onCancel={onClose}
            handleImageUpload={handleImageUpload}
            isEditing={!!editingEvent}
        />
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-neutral-950 via-neutral-950/80 to-transparent pointer-events-none z-20"></div>
      </DialogContent>
    </Dialog>
  );
};

export default EventModal;