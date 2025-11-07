import RadarLoader from './RadarLoader';

interface LoadingScreenProps {
    label?: string;
    size?: number;
}

/**
 * Полноэкранный загрузочный экран с RadarLoader
 * Использует position: fixed чтобы всегда быть по центру экрана
 * и не смещаться при появлении навбаров
 */
const LoadingScreen = ({
    label = 'SCANNING TARGETS…',
    size = 140
}: LoadingScreenProps) => {
    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0a0a0a]"
            role="alert"
            aria-live="polite"
            aria-busy="true"
            aria-label={label}
        >
            <RadarLoader label={label} size={size} />
        </div>
    );
};

export default LoadingScreen;

