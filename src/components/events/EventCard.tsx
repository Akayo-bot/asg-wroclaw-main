import React, { useState } from 'react';
import { Event, EventStatus } from '../../types/Event';
import { MapPin, Users, DollarSign, Edit, Trash2 } from 'lucide-react'; 
import EventDetailsModal from './EventDetailsModal'; // Импорт модалки

interface EventCardProps {
  event: Event;
  onEdit?: (event: Event) => void;
  onDelete?: (id: string) => void;
}

// Хелпер для статуса (красивые цвета)
const getStatusClasses = (status: EventStatus) => {
  // Добавляем класс 'border' для лучшей визуальной четкости
  switch (status) {
    case 'Open':
      // Ярко-зеленый для активного набора
      return 'bg-green-600 text-white border-green-700'; 
    case 'Full':
      // Желто-оранжевый: "Внимание, мест нет"
      return 'bg-yellow-500 text-gray-900 border-yellow-600'; 
    case 'Completed':
      // Приглушенный серый: "Это уже в прошлом"
      return 'bg-gray-700 text-gray-300 border-gray-600'; 
    case 'Canceled':
      // Красный: "Опасность, отменено"
      return 'bg-red-600 text-white border-red-700'; 
    default:
      return 'bg-gray-500 text-white border-gray-600';
  }
};

const EventCard: React.FC<EventCardProps> = ({ event, onEdit, onDelete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const statusClasses = getStatusClasses(event.status);

  return (
    <>
      <div className="bg-black/60 backdrop-blur-sm rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-white/10 hover:border-[#46D6C8]/50 max-w-sm h-full flex flex-col group relative">
        
        {/* Изображение Полигона */}
        <div className="h-48 overflow-hidden shrink-0 relative">
          <img 
            src={event.image_url} 
            alt={event.title} 
            className="w-full h-full object-cover transition duration-500 hover:scale-105"
          />
        </div>

        {/* Контент Карточки */}
        <div className="p-4 space-y-3 flex-1 flex flex-col relative">
          
          {/* Название и Дата */}
          <div className="pr-16"> {/* Padding for admin buttons */}
             <h2 className="text-xl font-bold text-white line-clamp-2">{event.title}</h2>
          </div>
          <p className="text-sm font-semibold text-[#46D6C8]">{event.date}</p>

          {/* Место (Кликабельная ссылка на Карту) */}
          <div className="flex items-center space-x-2">
            <MapPin size={16} className="text-gray-400 shrink-0" />
            <a 
              href={event.location_map_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-300 hover:text-[#46D6C8] transition underline truncate"
            >
              {event.location_name}
            </a>
          </div>

          {/* Статистика (Лимит, Цена, Статус) */}
          <div className="pt-2 grid grid-cols-3 gap-2 border-t border-gray-700/50 mt-auto">
            
            {/* Лимит Участников */}
            <div className="flex flex-col items-start">
              <p className="text-xs text-gray-400">Лимит</p>
              <div className="flex items-center space-x-1 text-white">
                <Users size={16} className="text-indigo-400" />
                <span className="font-semibold text-xs">
                  {event.participants_registered}/{event.participant_limit}
                </span>
              </div>
            </div>

            {/* Цена */}
            <div className="flex flex-col items-start">
              <p className="text-xs text-gray-400">Цена</p>
              <div className="flex items-center space-x-1 text-white">
                <DollarSign size={16} className="text-yellow-400" />
                <span className="font-semibold text-xs">
                  {event.price} {event.currency}
                </span>
              </div>
            </div>

            {/* Статус */}
            <div className="flex flex-col items-start">
              <p className="text-xs text-gray-400">Статус</p>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${statusClasses}`}>
                {event.status === 'Open' ? 'ОТКРЫТ НАБОР' : 
                 event.status === 'Full' ? 'МЕСТ НЕТ' : 
                 event.status === 'Completed' ? 'ЗАВЕРШЕНО' : 
                 'ОТМЕНЕНО'}
              </span>
            </div>
          </div>
          
          {/* Кнопка "Подробнее" */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full bg-[#46D6C8] text-gray-900 font-bold py-2 rounded-lg hover:bg-[#32b8a7] transition duration-200 mt-4"
          >
            Details
          </button>

          {/* Admin Actions - Absolute positioned in text area */}
          {(onEdit || onDelete) && (
            <div className="absolute top-4 right-4 flex space-x-2 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 z-10">
                {onEdit && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onEdit(event); }}
                        className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white hover:text-[#46D6C8] transition-all hover:scale-110 active:scale-95 shadow-lg backdrop-blur-sm"
                        title="Edit"
                    >
                        <Edit className="w-4 h-4" />
                    </button>
                )}
                {onDelete && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(event.id); }}
                        className="p-2 rounded-lg bg-white/10 hover:bg-red-500/20 text-white hover:text-red-400 transition-all hover:scale-110 active:scale-95 shadow-lg backdrop-blur-sm"
                        title="Delete"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                )}
            </div>
          )}
          
        </div>
      </div>

      {/* Модальное окно */}
      <EventDetailsModal 
        event={event}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};

export default EventCard;
