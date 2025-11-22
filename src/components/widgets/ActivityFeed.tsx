import { useActivityLog, ActivityLogItem } from '@/hooks/useActivityLog';
import { Loader2 } from 'lucide-react';
import { roleColors } from '@/components/admin/RolePill';
import { getActionColor, getActionTextColor } from '@/utils/activityColors';
import { getStatusPillClasses } from '@/utils/statusColors';

/**
 * Рендерит содержимое лога с правильной цветовой схемой:
 * - Автор: цветной по роли
 * - Действие: цветное по типу действия
 * - Объект: белый, жирный
 */
const renderLogContent = (log: ActivityLogItem): JSX.Element => {
    const actorName = log.user?.display_name || log.user?.email || 'Невідомий користувач';
    const actorRole = log.user?.role;
    const authorColor = getUserRoleColor(actorRole);
    const actionTextColor = getActionTextColor(log.action_type);
    const details = log.details || {};

    switch (log.action_type) {
        // --- Статьи ---
        case 'ARTICLE_CREATE':
            return (
                <>
                    <span className={`${authorColor} font-semibold`}>{actorName}</span>
                    {' '}
                    <span className={actionTextColor}>створив(ла) статтю</span>
                    {' '}
                    <span className="text-white font-semibold">«{details.title || 'Без назви'}»</span>
                </>
            );
        case 'ARTICLE_UPDATE':
            return (
                <>
                    <span className={`${authorColor} font-semibold`}>{actorName}</span>
                    {' '}
                    <span className={actionTextColor}>оновив(ла) статтю</span>
                    {' '}
                    <span className="text-white font-semibold">«{details.title || 'Без назви'}»</span>
                </>
            );
        case 'ARTICLE_DELETE':
            return (
                <>
                    <span className={`${authorColor} font-semibold`}>{actorName}</span>
                    {' '}
                    <span className={actionTextColor}>видалив(ла) статтю</span>
                    {' '}
                    <span className="text-white font-semibold">«{details.title || 'Без назви'}»</span>
                </>
            );
        case 'ARTICLE_PUBLISH':
            return (
                <>
                    <span className={`${authorColor} font-semibold`}>{actorName}</span>
                    {' '}
                    <span className={actionTextColor}>опублікував(ла) статтю</span>
                    {' '}
                    <span className="text-white font-semibold">«{details.title || 'Без назви'}»</span>
                </>
            );

        // --- События ---
        case 'EVENT_CREATE':
            return (
                <>
                    <span className={`${authorColor} font-semibold`}>{actorName}</span>
                    {' '}
                    <span className={actionTextColor}>створив(ла) подію</span>
                    {' '}
                    <span className="text-white font-semibold">«{details.title || 'Без назви'}»</span>
                </>
            );
        case 'EVENT_UPDATE':
            return (
                <>
                    <span className={`${authorColor} font-semibold`}>{actorName}</span>
                    {' '}
                    <span className={actionTextColor}>оновив(ла) подію</span>
                    {' '}
                    <span className="text-white font-semibold">«{details.title || 'Без назви'}»</span>
                </>
            );
        case 'EVENT_DELETE':
            return (
                <>
                    <span className={`${authorColor} font-semibold`}>{actorName}</span>
                    {' '}
                    <span className={actionTextColor}>видалив(ла) подію</span>
                    {' '}
                    <span className="text-white font-semibold">«{details.title || 'Без назви'}»</span>
                </>
            );

        // --- Роли пользователей ---
        case 'ROLE_UPDATE': {
            const targetUser = details.targetUser || 'Невідомий';
            const newRole = details.newRole || 'N/A';
            const newRoleColor = getUserRoleColor(newRole);
            return (
                <>
                    <span className={`${authorColor} font-semibold`}>{actorName}</span>
                    {' '}
                    <span className={actionTextColor}>змінив(ла) роль у користувача</span>
                    {' '}
                    <span className="text-white font-semibold">«{targetUser}»</span>
                    {' '}
                    <span className="text-gray-400">→</span>
                    {' '}
                    <span className={`${newRoleColor} font-semibold`}>{newRole}</span>
                </>
            );
        }
        case 'USER_BAN': {
            const statusText = 'заблокировал(а)';
            const newStatus = 'banned';
            return (
                <>
                    <span className={`${authorColor} font-semibold`}>{actorName}</span>
                    {' '}
                    <span className={actionTextColor}>{statusText} користувача</span>
                    {' '}
                    <span className="text-white font-semibold">«{details.targetUser || 'Невідомий'}»</span>
                    {' '}
                    <span className="text-gray-400">(Статус: </span>
                    <span className={getStatusPillClasses(newStatus)}>
                        {newStatus.toUpperCase()}
                    </span>
                    <span className="text-gray-400">)</span>
                </>
            );
        }
        case 'USER_UNBAN': {
            const statusText = 'разблокировал(а)';
            const newStatus = 'active';
            return (
                <>
                    <span className={`${authorColor} font-semibold`}>{actorName}</span>
                    {' '}
                    <span className={actionTextColor}>{statusText} користувача</span>
                    {' '}
                    <span className="text-white font-semibold">«{details.targetUser || 'Невідомий'}»</span>
                    {' '}
                    <span className="text-gray-400">(Статус: </span>
                    <span className={getStatusPillClasses(newStatus)}>
                        {newStatus.toUpperCase()}
                    </span>
                    <span className="text-gray-400">)</span>
                </>
            );
        }

        // --- Галерея ---
        case 'GALLERY_ADD':
            return (
                <>
                    <span className={`${authorColor} font-semibold`}>{actorName}</span>
                    {' '}
                    <span className={actionTextColor}>додав(ла) зображення в галерею</span>
                </>
            );
        case 'GALLERY_DELETE':
            return (
                <>
                    <span className={`${authorColor} font-semibold`}>{actorName}</span>
                    {' '}
                    <span className={actionTextColor}>видалив(ла) зображення з галереї</span>
                </>
            );

        // --- Команда ---
        case 'TEAM_ADD':
            return (
                <>
                    <span className={`${authorColor} font-semibold`}>{actorName}</span>
                    {' '}
                    <span className={actionTextColor}>додав(ла) члена команди</span>
                    {' '}
                    <span className="text-white font-semibold">«{details.name || 'Невідомий'}»</span>
                </>
            );
        case 'TEAM_UPDATE':
            return (
                <>
                    <span className={`${authorColor} font-semibold`}>{actorName}</span>
                    {' '}
                    <span className={actionTextColor}>оновив(ла) інформацію про члена команди</span>
                    {' '}
                    <span className="text-white font-semibold">«{details.name || 'Невідомий'}»</span>
                </>
            );
        case 'TEAM_DELETE':
            return (
                <>
                    <span className={`${authorColor} font-semibold`}>{actorName}</span>
                    {' '}
                    <span className={actionTextColor}>видалив(ла) члена команди</span>
                    {' '}
                    <span className="text-white font-semibold">«{details.name || 'Невідомий'}»</span>
                </>
            );

        // --- Настройки ---
        case 'SETTINGS_UPDATE':
            return (
                <>
                    <span className={`${authorColor} font-semibold`}>{actorName}</span>
                    {' '}
                    <span className={actionTextColor}>оновив(ла) налаштування системи</span>
                </>
            );
        case 'TRANSLATION_UPDATE':
            return (
                <>
                    <span className={`${authorColor} font-semibold`}>{actorName}</span>
                    {' '}
                    <span className={actionTextColor}>оновив(ла) переклади</span>
                </>
            );

        default:
            return (
                <>
                    <span className={`${authorColor} font-semibold`}>{actorName}</span>
                    {' '}
                    <span className="text-gray-400">виконав(ла) дію:</span>
                    {' '}
                    <span className="text-white font-semibold">{log.action_type}</span>
                </>
            );
    }
};


/**
 * Получает цвет текста для роли пользователя
 */
const getUserRoleColor = (role: string | null | undefined): string => {
    if (!role) return 'text-neutral-300';
    const roleLower = role.toLowerCase();
    const colors = roleColors[roleLower] || roleColors.user;
    return colors.text;
};

export function ActivityFeed() {
    const { logs, isLoading } = useActivityLog(10);

    return (
        <div className="relative z-[2] pointer-events-auto rounded-xl bg-[#121816]/90 ring-1 ring-[#46D6C8]/25 p-4 h-full flex flex-col touch-auto transform-gpu">
            <div className="text-[15px] font-semibold text-[#46D6C8] mb-2">Останні дії</div>
            {isLoading ? (
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 text-[#46D6C8] animate-spin" />
                </div>
            ) : logs.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                    <p className="text-sm text-neutral-500">Немає дій</p>
                </div>
            ) : (
                <ul className="divide-y divide-[#46D6C8]/10 flex-1 overflow-auto">
                    {logs.map((log: ActivityLogItem) => (
                        <li key={log.id} className="py-2 flex items-start gap-3">
                            <span className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${getActionColor(log.action_type)}`} />
                            <div className="flex-1 min-w-0">
                                <div className="text-sm">
                                    {renderLogContent(log)}
                                </div>
                                <div className="text-xs text-neutral-500 mt-1">
                                    {new Date(log.created_at).toLocaleString("uk-UA")}
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}


