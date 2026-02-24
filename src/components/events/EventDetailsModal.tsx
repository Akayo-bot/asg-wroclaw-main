import React from 'react';
import { Event } from '../../types/Event';
import { Clock, MapPin, Info } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface EventDetailsModalProps {
  event: Event;
  isOpen: boolean;
  onClose: () => void;
}

const EventDetailsModal: React.FC<EventDetailsModalProps> = ({ event, isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
                className="!flex !p-0 !gap-0 flex-col max-w-2xl bg-[#04070A]/90 border-white/10 backdrop-blur-md shadow-[0_0_50px_rgba(70,214,200,0.15)]"
      >
        {/* Header */}
        <DialogHeader className="p-6 border-b border-white/10" data-custom-position>
                    <DialogTitle className="text-2xl font-bold text-amber-400 font-display">
                {event.title}
            </DialogTitle>
        </DialogHeader>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/20 hover:scrollbar-thumb-white/30 p-6 space-y-8">
          
          {/* Timings */}
          <div className="grid grid-cols-3 gap-4 border-b border-white/10 pb-6">
            <div className="flex items-center space-x-2 text-gray-300">
              <Clock size={18} className="text-[#46D6C8]" />
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Сбор</p>
                <p className="font-semibold text-lg text-white">{event.gathering_time}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-gray-300">
              <Clock size={18} className="text-[#46D6C8]" />
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Старт</p>
                <p className="font-semibold text-lg text-white">{event.start_time}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-gray-300">
              <Clock size={18} className="text-[#46D6C8]" />
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Длительность</p>
                <p className="font-semibold text-lg text-white">{event.duration}</p>
              </div>
            </div>
          </div>

          {/* Game Meta */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2 text-white">
              <Info size={20} className="text-[#46D6C8]" />
              <span>Об игре и сценарии</span>
            </h3>
                        <p className="text-[#C2C2C2] whitespace-pre-wrap leading-relaxed text-sm">
                {event.game_meta || "Нет описания сценария."}
            </p>
          </div>

          {/* Rules */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2 text-white">
              <Info size={20} className="text-[#46D6C8]" />
              <span>Правила и техника</span>
            </h3>
                        <p className="text-[#C2C2C2] whitespace-pre-wrap leading-relaxed text-sm">
                {event.rules_safety || "Стандартные правила."}
            </p>
          </div>

          {/* Amenities */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2 text-white">
              <MapPin size={20} className="text-[#46D6C8]" />
              <span>Удобства на месте</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {event.amenities && event.amenities.length > 0 ? (
                  event.amenities.map((item, index) => (
                                    <span key={index} className="bg-white/5 border border-white/10 text-sm text-[#C2C2C2] px-3 py-1 rounded-full">
                      {item}
                    </span>
                  ))
              ) : (
                  <span className="text-gray-500 text-sm italic">Нет информации об удобствах</span>
              )}
            </div>
          </div>
          
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EventDetailsModal;
