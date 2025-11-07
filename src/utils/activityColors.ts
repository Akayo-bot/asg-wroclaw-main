// utils/activityColors.ts

/**
 * Определяет класс цвета для лога активности на основе типа действия.
 * Классификация действий по 4 группам:
 * - Создание (Green-900): Успех, новый контент
 * - Удаление (Red): Опасность, потеря данных
 * - Изменение (Yellow): Изменение, модификация
 * - Управление (Teal #46D6C8): Критическое действие с пользователем/правами
 * 
 * @param actionType Тип действия из таблицы activity_log.
 * @returns {string} Tailwind CSS класс для цвета фона (например, 'bg-[#46D6C8]').
 */
export function getActionColor(actionType: string): string {
    switch (actionType) {
        // --- Создание (Успех/Зеленый) ---
        case 'ARTICLE_CREATE':
        case 'ARTICLE_PUBLISH':
        case 'EVENT_CREATE':
        case 'PHOTO_ADD':
        case 'GALLERY_ADD':
        case 'TEAM_ADD':
            return 'bg-green-900';

        // --- Удаление (Опасность/Красный) ---
        case 'ARTICLE_DELETE':
        case 'EVENT_DELETE':
        case 'GALLERY_DELETE':
        case 'TEAM_DELETE':
        case 'USER_BAN':
            return 'bg-red-500';

        // --- Изменение/Редактирование (Внимание/Желтый) ---
        case 'ARTICLE_UPDATE':
        case 'EVENT_UPDATE':
        case 'TEAM_UPDATE':
        case 'SETTINGS_UPDATE':
        case 'TRANSLATION_UPDATE':
            return 'bg-yellow-400';

        // --- Управление Пользователями (Критический/Teal) ---
        case 'ROLE_UPDATE':
        case 'USER_UNBAN':
            return 'bg-[#46D6C8]';

        default:
            return 'bg-gray-500'; // Цвет по умолчанию
    }
}

/**
 * Получает цвет текста для типа действия (соответствует цвету фона).
 * 
 * @param actionType Тип действия из таблицы activity_log.
 * @returns {string} Tailwind CSS класс для цвета текста.
 */
export function getActionTextColor(actionType: string): string {
    switch (actionType) {
        // --- Создание (Успех/Зеленый) ---
        case 'ARTICLE_CREATE':
        case 'ARTICLE_PUBLISH':
        case 'EVENT_CREATE':
        case 'PHOTO_ADD':
        case 'GALLERY_ADD':
        case 'TEAM_ADD':
            return 'text-green-900';

        // --- Удаление (Опасность/Красный) ---
        case 'ARTICLE_DELETE':
        case 'EVENT_DELETE':
        case 'GALLERY_DELETE':
        case 'TEAM_DELETE':
        case 'USER_BAN':
            return 'text-red-400';

        // --- Изменение/Редактирование (Внимание/Желтый) ---
        case 'ARTICLE_UPDATE':
        case 'EVENT_UPDATE':
        case 'TEAM_UPDATE':
        case 'SETTINGS_UPDATE':
        case 'TRANSLATION_UPDATE':
            return 'text-yellow-400';

        // --- Управление Пользователями (Критический/Teal) ---
        case 'ROLE_UPDATE':
        case 'USER_UNBAN':
            return 'text-[#46D6C8]';

        default:
            return 'text-gray-400'; // Цвет по умолчанию
    }
}

