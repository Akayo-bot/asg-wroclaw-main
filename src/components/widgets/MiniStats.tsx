import React from 'react';
import { ResponsiveLine } from '@nivo/line';
import { Loader2 } from 'lucide-react';

// Дані (це те, що вам потрібно буде отримувати з вашого Supabase)
interface ChartDataPoint {
    name: string; // Наприклад, день тижня
    value: number; // Кількість користувачів або статей
}

// Пропс (props) для компонента
interface MiniAreaChartProps {
    title: string;
    data: ChartDataPoint[];
    color?: string; // Наприклад, "#46D6C8" (Teal)
    isLoading?: boolean; // Стан завантаження
}

const MiniAreaChart: React.FC<MiniAreaChartProps> = ({ title, data, color = "#46D6C8", isLoading = false }) => {
    // Логирование для отладки
    React.useEffect(() => {
        console.log(`[MiniAreaChart] ${title}:`, {
            dataLength: data.length,
            data: data,
            isLoading
        });
    }, [data, title, isLoading]);

    if (isLoading) {
        return (
            <div 
                className="rounded-xl border border-white/10 bg-black/40 backdrop-blur-sm p-4 min-h-[140px] flex flex-col"
            >
                <h3 className="text-sm font-semibold text-[#46D6C8]/80 mb-2 flex-shrink-0">{title}</h3>
                <div className="h-[88px] flex-shrink-0 flex-1 relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="h-6 w-6 text-[#46D6C8] animate-spin" />
                    </div>
                </div>
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div 
                className="rounded-xl border border-white/10 bg-black/40 backdrop-blur-sm p-4 min-h-[140px] flex flex-col"
            >
                <h3 className="text-sm font-semibold text-[#46D6C8]/80 mb-2 flex-shrink-0">{title}</h3>
                <div className="h-[88px] flex-shrink-0 flex-1 relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs text-neutral-500">Немає даних</span>
                    </div>
                </div>
            </div>
        );
    }

    // Перетворюємо ваш формат даних на формат Nivo
    // Nivo вимагає, щоб дані були в форматі: 
    // [{ id: 'series_id', data: [{ x: 'Day 1', y: 10 }, ...] }]
    const nivoData = [{
        id: "activity",
        data: data.map(d => {
            // Проверяем, что данные корректны
            if (typeof d.name !== 'string' || typeof d.value !== 'number') {
                console.warn(`[MiniAreaChart] Invalid data point:`, d);
                return { x: String(d.name || ''), y: Number(d.value || 0) };
            }
            return { x: d.name, y: d.value };
        }),
    }];

    return (
        <div 
            className="rounded-xl border border-white/10 bg-black/40 backdrop-blur-sm p-4 min-h-[140px] flex flex-col"
        >
            <h3 className="text-sm font-semibold text-[#46D6C8]/80 mb-2 flex-shrink-0">{title}</h3>
            
            <div className="h-[88px] flex-shrink-0 flex-1">
                <ResponsiveLine
                    data={nivoData}
                    // --- Налаштування стилю та геометрії ---
                    margin={{ top: 5, right: 0, bottom: 5, left: 0 }}
                    xScale={{ type: 'point' }} // Дні тижня
                    yScale={{ type: 'linear', min: 0, max: 'auto' }}
                    curve="monotoneX"
                    
                    // --- Кольори та неоновий стиль ---
                    colors={[color]}
                    enableGridX={false}
                    enableGridY={false}
                    enablePoints={false} // Приховуємо точки
                    
                    // --- Заливка (Area) ---
                    enableArea={true}
                    areaBaselineValue={0} // Починаємо заливку з нуля
                    areaOpacity={0.3} // Прозорість заливки
                    
                    // --- Лінії та товщина ---
                    lineWidth={2}
                    
                    // --- Приховуємо осі та легенду ---
                    axisTop={null}
                    axisRight={null}
                    axisBottom={null}
                    axisLeft={null}
                    enableSlices={false}
                    enableCrosshair={false}
                    
                    // --- Адаптація до вашої теми ---
                    theme={{
                        axis: {
                            domain: { line: { stroke: 'transparent' } },
                            ticks: { line: { stroke: 'transparent' }, text: { fill: 'transparent' } },
                        },
                        grid: {
                            line: { stroke: 'transparent' },
                        },
                    }}
                />
            </div>
        </div>
    );
};

export default MiniAreaChart;
