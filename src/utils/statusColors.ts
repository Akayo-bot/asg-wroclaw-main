// utils/statusColors.ts

/**
 * Получает цветовые классы для статусов пользователей.
 * 
 * @param status Статус пользователя ('active' | 'banned')
 * @param type Тип класса ('text' | 'bg' | 'ring')
 * @returns {string} Tailwind CSS класс для цвета
 */
export function getStatusColorClass(status: 'active' | 'banned', type: 'text' | 'bg' | 'ring'): string {
    if (status === 'banned') {
        // Красный для опасности/блокировки
        switch (type) {
            case 'text':
                return 'text-red-400';
            case 'bg':
                return 'bg-red-500/20 ring-red-500/40';
            case 'ring':
                return 'ring-red-500/40';
            default:
                return '';
        }
    }

    // Зелёный/Teal для активности/успеха
    switch (type) {
        case 'text':
            return 'text-green-400';
        case 'bg':
            return 'bg-green-500/20 ring-green-500/40';
        case 'ring':
            return 'ring-green-500/40';
        default:
            return '';
    }
}

/**
 * Получает полный набор классов для пилла статуса.
 * 
 * @param status Статус пользователя ('active' | 'banned')
 * @returns {string} Полный набор Tailwind CSS классов для пилла статуса
 */
export function getStatusPillClasses(status: 'active' | 'banned'): string {
    const baseClasses = 'inline-block rounded px-2 py-0.5 text-xs font-semibold ring-1';
    const textClass = getStatusColorClass(status, 'text');
    const ringClass = getStatusColorClass(status, 'ring');
    
    if (status === 'banned') {
        return `${baseClasses} bg-red-500/20 ${textClass} ${ringClass}`;
    }
    
    // active
    return `${baseClasses} bg-green-500/20 ${textClass} ${ringClass}`;
}

