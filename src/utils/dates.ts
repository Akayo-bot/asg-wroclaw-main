// utils/dates.ts

interface DailyDataPoint {
    name: string; // Назва дня (наприклад, "Пн", "Вт")
    dateKey: string; // Ключ дати (наприклад, "2025-11-01")
    value: number; // Кількість (завжди 0 спочатку)
}

/**
 * Генерує масив з останніх 7 днів.
 * @returns {DailyDataPoint[]} Масив з 7 об'єктів { name, dateKey, value: 0 }.
 */
export const getLastSevenDays = (): DailyDataPoint[] => {
    const days: DailyDataPoint[] = [];
    const today = new Date();
    
    // Масив назв днів тижня для відображення на графіку
    const dayNames = ["Нд", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

    for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i); // Віднімаємо дні

        // Форматування дати у вигляд "YYYY-MM-DD" для ключа
        const dateKey = d.toISOString().split('T')[0];
        
        // Отримуємо назву дня
        const dayName = dayNames[d.getDay()];

        days.push({
            name: dayName,
            dateKey: dateKey,
            value: 0,
        });
    }

    return days;
};

