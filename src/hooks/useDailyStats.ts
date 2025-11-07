// hooks/useDailyStats.ts
import { useState, useEffect } from 'react';
import { getLastSevenDays } from '../utils/dates';
import { supabase } from '@/integrations/supabase/client';

// Структура даних, яку повертає хук
interface ChartDataPoint {
    name: string;
    dateKey: string;
    value: number;
}

/**
 * Отримує кількість записів за останні 7 днів і агрегує їх по днях.
 * @param tableName Назва таблиці (наприклад, 'profiles' або 'articles').
 * @param dateColumn Назва стовпця дати (наприклад, 'created_at' або 'published_at').
 * @returns {ChartDataPoint[]} Агреговані дані для графіка.
 */
export const useDailyStats = (tableName: string, dateColumn: string) => {
    const [data, setData] = useState<ChartDataPoint[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            setIsLoading(true);
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            sevenDaysAgo.setHours(0, 0, 0, 0); // Начало дня
            
            // Запит до бази даних за останні 7 днів
            // Для статей: запрашиваем все колонки, чтобы RLS работал правильно
            // Для профилей: запрашиваем только created_at
            const selectColumns = tableName === 'articles' 
                ? `${dateColumn}, status` // Добавляем status для RLS
                : dateColumn;
            
            const { data: dbData, error } = await supabase
                .from(tableName)
                .select(selectColumns)
                .gte(dateColumn, sevenDaysAgo.toISOString()) // Фільтруємо за 7 днів
                .order(dateColumn, { ascending: false }); // Сортуємо за датою

            if (error) {
                console.error(`[useDailyStats] Error fetching ${tableName}:`, error);
                console.error(`[useDailyStats] Error details:`, {
                    message: error.message,
                    details: error.details,
                    hint: error.hint,
                    code: error.code
                });
                setIsLoading(false);
                return;
            }
            
            console.log(`[useDailyStats] ${tableName}:`, {
                count: dbData?.length || 0,
                sample: dbData?.slice(0, 3),
                dateColumn,
                sevenDaysAgo: sevenDaysAgo.toISOString(),
                query: `SELECT ${selectColumns} FROM ${tableName} WHERE ${dateColumn} >= '${sevenDaysAgo.toISOString()}'`
            });
            
            // 1. Ініціалізуємо порожній масив для 7 днів
            const dailyData = getLastSevenDays();
            
            console.log(`[useDailyStats] Daily data keys:`, dailyData.map(d => d.dateKey));
            
            // 2. Створюємо мапу для швидкого доступу по ключу дати
            const dataMap = new Map<string, number>();
            dailyData.forEach(item => dataMap.set(item.dateKey, 0));

            // 3. Агрегуємо дані з бази даних
            dbData?.forEach((row: any) => {
                if (!row[dateColumn]) {
                    console.warn(`[useDailyStats] Row missing ${dateColumn}:`, row);
                    return; // Пропускаємо записи без дати
                }
                
                try {
                    const dateObj = new Date(row[dateColumn]);
                    if (isNaN(dateObj.getTime())) {
                        console.warn(`[useDailyStats] Invalid date:`, row[dateColumn]);
                        return;
                    }
                    
                    const dateString = dateObj.toISOString().split('T')[0];
                    
                    // Якщо дата існує у нашому 7-денному вікні, збільшуємо лічильник
                    if (dataMap.has(dateString)) {
                        const currentValue = dataMap.get(dateString) || 0;
                        dataMap.set(dateString, currentValue + 1);
                    } else {
                        console.log(`[useDailyStats] Date ${dateString} not in 7-day window`);
                    }
                } catch (err) {
                    console.error(`[useDailyStats] Error processing date:`, err, row);
                }
            });

            // 4. Форматуємо дані назад у масив для Recharts
            const finalData = dailyData.map(item => ({
                name: item.name,
                value: dataMap.get(item.dateKey) || 0,
            }));

            console.log(`[useDailyStats] Final data:`, finalData);

            setData(finalData);
            setIsLoading(false);
        };

        fetchStats();

        // Оновлюємо дані кожні 30 секунд для відображення нових статей
        const interval = setInterval(fetchStats, 30000);

        return () => clearInterval(interval);
    }, [tableName, dateColumn]);

    return { data, isLoading };
};

