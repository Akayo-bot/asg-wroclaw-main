import React from 'react';
import { Event } from '../../types/Event';
import { X, Clock, MapPin, Info } from 'lucide-react'; // Removed unused icons

interface EventDetailsModalProps {
  event: Event;
  isOpen: boolean;
  onClose: () => void;
}

const EventDetailsModal: React.FC<EventDetailsModalProps> = ({ event, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    // Модальное окно на весь экран с темным фоном
    <div 
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose} // Закрытие при клике вне контента
    >
      <div 
        className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl transform transition-all duration-300 scale-100"
        onClick={(e) => e.stopPropagation()} // Предотвращаем закрытие при клике внутри
      >
        
        {/* Шапка модалки */}
        <div className="p-6 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-[#46D6C8]">{event.title}</h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-white transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Основной контент */}
        <div className="p-6 space-y-8">
          
          {/* Блок с Таймингами */}
          <div className="grid grid-cols-3 gap-4 border-b border-gray-700 pb-6">
            <div className="flex items-center space-x-2 text-gray-300">
              <Clock size={18} className="text-[#46D6C8]" />
              <div>
                <p className="text-sm">Сбор</p>
                <p className="font-semibold text-lg">{event.gathering_time}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-gray-300">
              <Clock size={18} className="text-[#46D6C8]" />
              <div>
                <p className="text-sm">Старт</p>
                <p className="font-semibold text-lg">{event.start_time}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-gray-300">
              <Clock size={18} className="text-[#46D6C8]" />
              <div>
                <p className="text-sm">Длительность</p>
                <p className="font-semibold text-lg">{event.duration}</p>
              </div>
            </div>
          </div>

          {/* Информация о Мета / Элементах игры */}
          <div>
            <h3 className="text-xl font-semibold mb-3 flex items-center space-x-2 text-white">
              <Info size={20} className="text-[#46D6C8]" />
              <span>Об игре и сценарии</span>
            </h3>
            <p className="text-gray-400 whitespace-pre-wrap">{event.game_meta}</p>
          </div>

          {/* Правила и Техника */}
          <div>
            <h3 className="text-xl font-semibold mb-3 flex items-center space-x-2 text-white">
              <Info size={20} className="text-[#46D6C8]" />
              <span>Правила и техника</span>
            </h3>
            <p className="text-gray-400 whitespace-pre-wrap">{event.rules_safety}</p>
          </div>

          {/* Удобства (Amenities) */}
          <div>
            <h3 className="text-xl font-semibold mb-3 flex items-center space-x-2 text-white">
              <MapPin size={20} className="text-[#46D6C8]" />
              <span>Удобства на месте</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {event.amenities.map((item, index) => (
                <span key={index} className="bg-gray-700 text-sm text-gray-300 px-3 py-1 rounded-full">
                  {item}
                </span>
              ))}
            </div>
          </div>
          
        </div>

      </div>
    </div>
  );
};

export default EventDetailsModal;
