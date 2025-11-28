export type EventStatus = 'Open' | 'Full' | 'Completed' | 'Canceled';

export interface Event {
    id: string;
    // Основная информация для карточки
    image_url: string;
    title: string;       // Название события, например: "Операция 'Сахарный Штурм'"
    date: string;        // Дата проведения, например: "23.08.2025"
    location_name: string; // Место, например: "Завод 'Сахарный-ДВ'"
    location_map_url: string; // Ссылка на Google Maps/Яндекс Карты

    // Статистика
    participant_limit: number;
    participants_registered: number;
    price: number;       // Цена в валюте, например: 400 UAH
    currency: string;    // UAH, PLN, USD
    status: EventStatus;

    // Детали для модального окна
    gathering_time: string; // Время сбора, например: "09:00"
    start_time: string;     // Время старта, например: "10:00"
    duration: string;       // Ориентированная длительность, например: "6 часов"
    amenities: string[];    // Удобства: "Горячий чай", "Бутерброды", "Парковка"
    game_meta: string;      // Описание сценария, элементы игры
    rules_safety: string;   // Правила и техника безопасности
}
