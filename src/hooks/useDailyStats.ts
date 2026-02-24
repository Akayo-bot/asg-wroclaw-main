// hooks/useDailyStats.ts
import { useState, useEffect } from 'react';
import { getLastNDays } from '../utils/dates';
import { supabase } from '@/integrations/supabase/client';

// Структура даних, яку повертає хук
interface ChartDataPoint {
    name: string;
    dateKey: string;
    value: number;
}

/**
 * Отримує кількість записів за останні N днів і агрегує їх по днях.
 * @param tableName Назва таблиці (наприклад, 'profiles' або 'articles').
 * @param dateColumn Назва стовпця дати (наприклад, 'created_at').
 * @param days Кількість днів для відображення (за замовчуванням 7).
 * @returns {ChartDataPoint[]} Агреговані дані для графіка.
 */
export const useDailyStats = (tableName: string, dateColumn: string, days: number = 7) => {
    const [data, setData] = useState<ChartDataPoint[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            setIsLoading(true);
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);
            startDate.setHours(0, 0, 0, 0);

            // Для статей додаємо status для RLS
            const selectColumns = tableName === 'articles'
                ? `${dateColumn}, status`
                : dateColumn;

            const { data: dbData, error } = await supabase
                .from(tableName)
                .select(selectColumns)
                .gte(dateColumn, startDate.toISOString())
                .order(dateColumn, { ascending: false });

            if (error) {
                console.error(`[useDailyStats] Error fetching ${tableName}:`, error);
                setIsLoading(false);
                return;
            }

            // 1. Ініціалізуємо масив для N днів
            const dailyData = getLastNDays(days);

            // 2. Створюємо мапу для швидкого доступу по ключу дати
            const dataMap = new Map<string, number>();
            dailyData.forEach(item => dataMap.set(item.dateKey, 0));

            // 3. Агрегуємо дані з бази даних
            dbData?.forEach((row: Record<string, unknown>) => {
                if (!row[dateColumn]) return;

                try {
                    const dateObj = new Date(row[dateColumn] as string);
                    if (isNaN(dateObj.getTime())) return;

                    const dateString = dateObj.toISOString().split('T')[0];

                    if (dataMap.has(dateString)) {
                        const currentValue = dataMap.get(dateString) || 0;
                        dataMap.set(dateString, currentValue + 1);
                    }
                } catch {
                    // skip invalid dates
                }
            });

            // 4. Форматуємо дані назад у масив для графіка
            const finalData = dailyData.map(item => ({
                name: item.name,
                value: dataMap.get(item.dateKey) || 0,
            }));

            setData(finalData);
            setIsLoading(false);
        };

        fetchStats();

        // Оновлюємо дані кожні 30 секунд
        const interval = setInterval(fetchStats, 30000);
        return () => clearInterval(interval);
    }, [tableName, dateColumn, days]);

    return { data, isLoading };
};
