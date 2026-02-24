// utils/dates.ts

interface DailyDataPoint {
    name: string; // Назва дня (наприклад, "Пн", "Вт")
    dateKey: string; // Ключ дати (наприклад, "2025-11-01")
    value: number; // Кількість (завжди 0 спочатку)
}

/**
 * Генерує масив з останніх N днів.
 * @param count Кількість днів (за замовчуванням 7).
 * @returns {DailyDataPoint[]} Масив об'єктів { name, dateKey, value: 0 }.
 */
export const getLastNDays = (count: number = 7): DailyDataPoint[] => {
    const days: DailyDataPoint[] = [];
    const today = new Date();
    const dayNames = ["Нд", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
    const monthNames = ["Січ", "Лют", "Бер", "Кві", "Тра", "Чер", "Лип", "Сер", "Вер", "Жов", "Лис", "Гру"];

    for (let i = count - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);

        const dateKey = d.toISOString().split('T')[0];
        // For 7 days show day names, for longer periods show date
        const name = count <= 7
            ? dayNames[d.getDay()]
            : `${d.getDate()} ${monthNames[d.getMonth()]}`;

        days.push({ name, dateKey, value: 0 });
    }

    return days;
};

/**
 * Генерує масив з останніх 7 днів (сумісність).
 */
export const getLastSevenDays = (): DailyDataPoint[] => getLastNDays(7);
