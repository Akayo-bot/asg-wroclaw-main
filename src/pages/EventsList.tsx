import React, { useState } from 'react';
import EventCard from '../components/events/EventCard';
import { Event } from '../types/Event';
import SearchBar from '../components/ui/SearchBar';

const dummyEvents: Event[] = [
    {
        id: '1',
        image_url: 'https://images.unsplash.com/photo-1555685812-4b943f3e9942?q=80&w=2940&auto=format&fit=crop',
        title: 'Турнір Raven Cup',
        date: '24.11.2024',
        location_name: 'Полігон "Лісова пісня"',
        location_map_url: 'https://maps.google.com',
        participant_limit: 50,
        participants_registered: 42,
        price: 300,
        currency: 'UAH',
        status: 'Open',
        gathering_time: '09:00',
        start_time: '10:00',
        duration: '4-5 годин',
        amenities: ['Парковка', 'Оренда', 'Чай/Кава'],
        game_meta: 'CQB + Ліс',
        rules_safety: 'Окуляри обов\'язково. Хронометраж 130 м/с.'
    },
    {
        id: '2',
        image_url: 'https://images.unsplash.com/photo-1627916527022-7933930b1b13?q=80&w=2940&auto=format&fit=crop',
        title: 'Операція Зелений вовк',
        date: '01.12.2024',
        location_name: 'Полігон "Завод"',
        location_map_url: 'https://maps.google.com',
        participant_limit: 100,
        participants_registered: 100,
        price: 450,
        currency: 'UAH',
        status: 'Full',
        gathering_time: '08:00',
        start_time: '09:30',
        duration: '6-8 годин',
        amenities: ['Парковка', 'Магазин', 'Їжа'],
        game_meta: 'Мілсім елементи',
        rules_safety: 'Стандартні правила ФСУ.'
    },
    {
        id: '3',
        image_url: 'https://images.unsplash.com/photo-1595590424283-b8f1d44b11d1?q=80&w=2787&auto=format&fit=crop',
        title: 'Нічна операція Тінь',
        date: '15.11.2024',
        location_name: 'Полігон "Бункер"',
        location_map_url: 'https://maps.google.com',
        participant_limit: 30,
        participants_registered: 25,
        price: 200,
        currency: 'UAH',
        status: 'Completed',
        gathering_time: '20:00',
        start_time: '21:00',
        duration: '4 години',
        amenities: ['Парковка'],
        game_meta: 'Нічна гра, трасери',
        rules_safety: 'Тільки трасерні насадки.'
    }
];

const EventsList: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');

    // Логика фильтрации
    const filteredEvents = dummyEvents.filter(event =>
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.location_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <div className="container mx-auto">
                {/* ⬅️ Добавляем компонент поиска сюда */}
                <SearchBar 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                />

                <h1 className="text-3xl font-bold mb-6 text-white">Ближайшие События</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredEvents.map(event => (
                        <EventCard key={event.id} event={event} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default EventsList;
