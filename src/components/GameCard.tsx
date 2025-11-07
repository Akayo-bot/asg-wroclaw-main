import { Calendar, MapPin, Users, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GameCardProps {
    title: string;
    date: string;
    time: string;
    location: string;
    players: string;
    description: string;
    image: string;
    status: 'upcoming' | 'full' | 'completed';
}

const GameCard = ({
    title,
    date,
    time,
    location,
    players,
    description,
    image,
    status
}: GameCardProps) => {
    const getStatusColor = () => {
        switch (status) {
            case 'upcoming': return 'text-primary';
            case 'full': return 'text-destructive';
            case 'completed': return 'text-muted-foreground';
            default: return 'text-primary';
        }
    };

    const getStatusText = () => {
        switch (status) {
            case 'upcoming': return 'ОТКРЫТО';
            case 'full': return 'ПОЛНЫЙ СОСТАВ';
            case 'completed': return 'ЗАВЕРШЕНО';
            default: return 'ОТКРЫТО';
        }
    };

    return (
        <div className="group bg-card rounded-lg overflow-hidden tactical-lift night-vision-hover cursor-target">
            {/* Image */}
            <div className="relative h-48 overflow-hidden">
                <img
                    src={image}
                    alt={title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-background/20 group-hover:bg-background/10 transition-colors" />

                {/* Status Badge */}
                <div className="absolute top-4 left-4">
                    <span className={`font-rajdhani text-xs font-bold px-3 py-1 bg-background/80 backdrop-blur-sm rounded ${getStatusColor()}`}>
                        {getStatusText()}
                    </span>
                </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
                <h3 className="font-rajdhani text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                    {title}
                </h3>

                <p className="font-inter text-sm text-muted-foreground line-clamp-2">
                    {description}
                </p>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-2 text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span className="font-inter">{date}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span className="font-inter">{time}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <span className="font-inter">{location}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-muted-foreground">
                        <Users className="w-4 h-4" />
                        <span className="font-inter">{players}</span>
                    </div>
                </div>

                {/* Action Button */}
                <div className="pt-2">
                    {status === 'upcoming' ? (
                        <Button
                            size="sm"
                            className="btn-tactical-primary w-full font-rajdhani font-bold cursor-target"
                        >
                            ЗАПИСАТЬСЯ
                        </Button>
                    ) : status === 'full' ? (
                        <Button
                            size="sm"
                            variant="outline"
                            className="w-full font-rajdhani font-bold cursor-target border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                            disabled
                        >
                            СПИСОК ОЖИДАНИЯ
                        </Button>
                    ) : (
                        <Button
                            size="sm"
                            variant="outline"
                            className="w-full font-rajdhani font-bold cursor-target"
                        >
                            СМОТРЕТЬ ОТЧЕТ
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GameCard;