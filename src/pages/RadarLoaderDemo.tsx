import { useState } from 'react';
import { useLoading } from '@/contexts/LoadingContext';
import RadarLoader from '@/components/RadarLoader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { getGlassToastClassName, getGlassToastVariant } from '@/lib/glass-toast';

const RadarLoaderDemo = () => {
    const { showLoading, hideLoading, withLoading } = useLoading();
    const { toast } = useToast();
    const [customLabel, setCustomLabel] = useState('SCANNING TARGETS…');
    const [customSize, setCustomSize] = useState(140);
    const [inlineLoading, setInlineLoading] = useState(false);

    const handleManualLoading = () => {
        showLoading(customLabel);
        setTimeout(() => {
            hideLoading();
        }, 3000);
    };

    const handleAutoLoading = async () => {
        await withLoading(
            new Promise(resolve => setTimeout(resolve, 3000)),
            customLabel
        );
    };

    const handleInlineLoading = () => {
        setInlineLoading(true);
        setTimeout(() => {
            setInlineLoading(false);
        }, 3000);
    };

    const simulateFetch = async () => {
        await withLoading(
            fetch('https://jsonplaceholder.typicode.com/posts/1')
                .then(r => r.json()),
            'FETCHING DATA…'
        );
        toast({
            variant: getGlassToastVariant('success'),
            title: 'Успіх',
            description: 'Дані успішно завантажені!',
            className: getGlassToastClassName('success'),
            duration: 4000,
        });
    };

    const simulateMultipleOperations = async () => {
        await withLoading(
            Promise.all([
                new Promise(resolve => setTimeout(resolve, 1000)),
                new Promise(resolve => setTimeout(resolve, 1500)),
                new Promise(resolve => setTimeout(resolve, 2000)),
            ]),
            'PROCESSING MULTIPLE TASKS…'
        );
        toast({
            variant: getGlassToastVariant('success'),
            title: 'Успіх',
            description: 'Усі задачі виконані!',
            className: getGlassToastClassName('success'),
            duration: 4000,
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black py-12 px-4">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Заголовок */}
                <div className="text-center space-y-4">
                    <h1 className="text-4xl md:text-5xl font-bold text-white">
                        🎯 Radar Loader Demo
                    </h1>
                    <p className="text-gray-400 text-lg">
                        Тактический загрузчик для Airsoft сайта
                    </p>
                </div>

                {/* Базовый пример */}
                <Card className="bg-gray-900/50 border-green-500/20">
                    <CardHeader>
                        <CardTitle className="text-white">
                            Базовый радар (встроенный)
                        </CardTitle>
                        <CardDescription className="text-gray-400">
                            Радар без оверлея, встроенный в интерфейс
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center py-8">
                        <RadarLoader label="SCANNING TARGETS…" size={customSize} />
                    </CardContent>
                </Card>

                {/* Контроль размера и текста */}
                <Card className="bg-gray-900/50 border-green-500/20">
                    <CardHeader>
                        <CardTitle className="text-white">
                            Настройки радара
                        </CardTitle>
                        <CardDescription className="text-gray-400">
                            Изменяйте размер и текст в реальном времени
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="label" className="text-white">
                                    Текст (Label)
                                </Label>
                                <Input
                                    id="label"
                                    value={customLabel}
                                    onChange={(e) => setCustomLabel(e.target.value.toUpperCase())}
                                    className="bg-gray-800 border-green-500/30 text-white"
                                    placeholder="SCANNING TARGETS…"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="size" className="text-white">
                                    Размер: {customSize}px
                                </Label>
                                <Input
                                    id="size"
                                    type="range"
                                    min="80"
                                    max="240"
                                    value={customSize}
                                    onChange={(e) => setCustomSize(Number(e.target.value))}
                                    className="bg-gray-800"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Полноэкранный оверлей */}
                <Card className="bg-gray-900/50 border-green-500/20">
                    <CardHeader>
                        <CardTitle className="text-white">
                            Полноэкранный оверлей
                        </CardTitle>
                        <CardDescription className="text-gray-400">
                            Протестируйте различные способы показа загрузки
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Button
                                onClick={handleManualLoading}
                                className="bg-green-600 hover:bg-green-700 text-white"
                                tabIndex={0}
                                aria-label="Ручное управление загрузкой"
                            >
                                Ручное управление (3 сек)
                            </Button>
                            <Button
                                onClick={handleAutoLoading}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                                tabIndex={0}
                                aria-label="Автоматическое управление загрузкой"
                            >
                                Автоматическое (3 сек)
                            </Button>
                            <Button
                                onClick={simulateFetch}
                                className="bg-purple-600 hover:bg-purple-700 text-white"
                                tabIndex={0}
                                aria-label="Симуляция загрузки данных"
                            >
                                Симуляция fetch
                            </Button>
                            <Button
                                onClick={simulateMultipleOperations}
                                className="bg-orange-600 hover:bg-orange-700 text-white"
                                tabIndex={0}
                                aria-label="Множественные операции"
                            >
                                Множественные операции
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Встроенный в карточку */}
                <Card className="bg-gray-900/50 border-green-500/20">
                    <CardHeader>
                        <CardTitle className="text-white">
                            Встроенная загрузка
                        </CardTitle>
                        <CardDescription className="text-gray-400">
                            Радар внутри компонента без полноэкранного оверлея
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Button
                            onClick={handleInlineLoading}
                            className="bg-teal-600 hover:bg-teal-700 text-white w-full"
                            tabIndex={0}
                            aria-label="Показать встроенную загрузку"
                        >
                            Показать встроенную загрузку
                        </Button>
                        {inlineLoading && (
                            <div className="flex justify-center py-8">
                                <RadarLoader label="PROCESSING…" size={120} />
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Примеры кода */}
                <Card className="bg-gray-900/50 border-green-500/20">
                    <CardHeader>
                        <CardTitle className="text-white">
                            Примеры использования
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <h3 className="text-green-400 font-mono text-sm">
                                1. Базовый компонент:
                            </h3>
                            <pre className="bg-black p-4 rounded text-green-400 text-xs overflow-x-auto">
                                {`<RadarLoader label="SCANNING TARGETS…" size={140} />`}
                            </pre>
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-green-400 font-mono text-sm">
                                2. Ручное управление:
                            </h3>
                            <pre className="bg-black p-4 rounded text-green-400 text-xs overflow-x-auto">
                                {`const { showLoading, hideLoading } = useLoading();

showLoading('LOADING DATA…');
await fetchData();
hideLoading();`}
                            </pre>
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-green-400 font-mono text-sm">
                                3. Автоматическое управление (рекомендуется):
                            </h3>
                            <pre className="bg-black p-4 rounded text-green-400 text-xs overflow-x-auto">
                                {`const { withLoading } = useLoading();

await withLoading(
  fetchData(), 
  'LOADING DATA…'
);`}
                            </pre>
                        </div>
                    </CardContent>
                </Card>

                {/* Цветовые варианты */}
                <Card className="bg-gray-900/50 border-green-500/20">
                    <CardHeader>
                        <CardTitle className="text-white">
                            Варианты радара
                        </CardTitle>
                        <CardDescription className="text-gray-400">
                            Различные размеры для разных устройств
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center justify-items-center">
                            <div className="text-center space-y-2">
                                <RadarLoader label="MOBILE" size={100} />
                                <p className="text-gray-400 text-sm">100px (Mobile)</p>
                            </div>
                            <div className="text-center space-y-2">
                                <RadarLoader label="TABLET" size={140} />
                                <p className="text-gray-400 text-sm">140px (Tablet)</p>
                            </div>
                            <div className="text-center space-y-2">
                                <RadarLoader label="DESKTOP" size={180} />
                                <p className="text-gray-400 text-sm">180px (Desktop)</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Информация */}
                <Card className="bg-gray-900/50 border-green-500/20">
                    <CardHeader>
                        <CardTitle className="text-white">
                            📚 Документация
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-gray-400 space-y-2">
                        <p>
                            Полная документация доступна в файле{' '}
                            <code className="text-green-400 bg-black px-2 py-1 rounded">
                                RADAR_LOADER_GUIDE.md
                            </code>
                        </p>
                        <p>
                            Создано специально для тематики Airsoft с тактическим дизайном 🎯
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default RadarLoaderDemo;

