import React, { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, Filter, Clock } from 'lucide-react';
import { RolePill } from '@/components/admin/RolePill';
import { roleColors } from '@/components/admin/RolePill';
import { getActionColor, getActionTextColor } from '@/utils/activityColors';
import { getStatusPillClasses } from '@/utils/statusColors';

export type RoleChange = {
    id: string;
    target_user_id: string;
    changed_by: string;
    old_role: string | null;
    new_role: string;
    reason?: string | null;
    created_at: string;
    target_profile?: {
        id: string;
        display_name: string | null;
        avatar_url?: string | null;
        role?: string;
    };
    changer_profile?: {
        id: string;
        display_name: string | null;
        avatar_url?: string | null;
        role?: string;
        is_system?: boolean;
    };
};

interface RoleChangeHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: RoleChange[];
    activityLogs?: ActivityLogItem[]; // Логи действий из activity_log (USER_BAN, USER_UNBAN)
}

export interface ActivityLogItem {
    id: string;
    user_id: string;
    action_type: string;
    details: any;
    created_at: string;
    user?: {
        display_name: string | null;
        email: string | null;
        role?: string | null;
        status?: string | null;
    };
}

const RoleChangeHistoryModal: React.FC<RoleChangeHistoryModalProps> = ({ isOpen, onClose, data, activityLogs = [] }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'promotions' | 'demotions' | 'system'>('all');

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleString('uk-UA', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // Объединяем данные из role_changes и activity_log (USER_BAN, USER_UNBAN)
    const allHistoryItems = useMemo(() => {
        const items: Array<{
            id: string;
            type: 'role_change' | 'user_ban' | 'user_unban';
            created_at: string;
            authorName: string;
            authorRole: string;
            targetName: string;
            oldRole?: string | null;
            newRole?: string;
            newStatus?: 'banned' | 'active';
            reason?: string | null;
        }> = [];

        // Добавляем изменения ролей
        data.forEach((change) => {
            items.push({
                id: change.id,
                type: 'role_change',
                created_at: change.created_at,
                authorName: change.changer_profile?.display_name || 'Система',
                authorRole: change.changer_profile?.role || 'user',
                targetName: change.target_profile?.display_name || 'Невідомий користувач',
                oldRole: change.old_role,
                newRole: change.new_role,
                reason: change.reason,
            });
        });

        // Добавляем действия USER_BAN и USER_UNBAN из activity_log
        activityLogs
            .filter((log) => log.action_type === 'USER_BAN' || log.action_type === 'USER_UNBAN')
            .forEach((log) => {
                items.push({
                    id: log.id,
                    type: log.action_type === 'USER_BAN' ? 'user_ban' : 'user_unban',
                    created_at: log.created_at,
                    authorName: log.user?.display_name || log.user?.email || 'Система',
                    authorRole: log.user?.role || 'user',
                    targetName: log.details?.targetUser || 'Невідомий користувач',
                    newStatus: log.action_type === 'USER_BAN' ? 'banned' : 'active',
                });
            });

        return items;
    }, [data, activityLogs]);

    const filteredData = useMemo(() => {
        let filtered = [...allHistoryItems];

        // Поиск
        if (searchQuery.trim()) {
            const query = searchQuery.trim().toLowerCase();
            filtered = filtered.filter(
                (item) =>
                    item.authorName.toLowerCase().includes(query) ||
                    item.targetName.toLowerCase().includes(query)
            );
        }

        // Фильтр по типу
        if (filterType !== 'all') {
            filtered = filtered.filter((item) => {
                if (filterType === 'promotions' && item.type === 'role_change') {
                    const ranks = ['user', 'editor', 'admin', 'superadmin'] as const;
                    const oldIndex = item.oldRole ? ranks.indexOf(item.oldRole as any) : -1;
                    const newIndex = item.newRole ? ranks.indexOf(item.newRole as any) : -1;
                    return oldIndex !== -1 && newIndex > oldIndex;
                }
                if (filterType === 'demotions' && item.type === 'role_change') {
                    const ranks = ['user', 'editor', 'admin', 'superadmin'] as const;
                    const oldIndex = item.oldRole ? ranks.indexOf(item.oldRole as any) : -1;
                    const newIndex = item.newRole ? ranks.indexOf(item.newRole as any) : -1;
                    return oldIndex !== -1 && newIndex < oldIndex;
                }
                if (filterType === 'system') {
                    return item.authorName === 'Система';
                }
                return true;
            });
        }

        // Сортировка по дате (новые сначала)
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        return filtered;
    }, [allHistoryItems, searchQuery, filterType]);

    // Используем Portal для рендеринга модального окна на верхнем уровне
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    // Блокируем скролл body когда модальное окно открыто
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen || !mounted) return null;

    const modalContent = (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998] animate-fade-in"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4 pointer-events-none">
                <div
                    className="max-w-3xl w-full max-h-[90vh] overflow-y-auto bg-[#04070A]/80 border border-[#46D6C8]/20 shadow-[0_0_40px_rgba(70,214,200,0.2)] rounded-xl p-6 pointer-events-auto animate-fade-in"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#46D6C8]/10">
                        <h2 className="font-display text-xl text-white font-rajdhani">Історія змін ролей</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white transition-colors p-1 rounded hover:bg-white/10"
                            aria-label="Закрити"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Filters */}
                    <div className="mb-4 space-y-3">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Пошук користувачів..."
                                className="w-full pl-10 pr-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#46D6C8]/50 focus:ring-1 focus:ring-[#46D6C8]/50 transition-all"
                            />
                        </div>

                        {/* Filter Buttons */}
                        <div className="flex flex-wrap gap-2">
                            {[
                                { key: 'all', label: 'Всі' },
                                { key: 'promotions', label: 'Підвищення' },
                                { key: 'demotions', label: 'Пониження' },
                                { key: 'system', label: 'Система' },
                            ].map(({ key, label }) => (
                                <button
                                    key={key}
                                    onClick={() => setFilterType(key as any)}
                                    className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${
                                        filterType === key
                                            ? 'bg-[#46D6C8]/20 border-[#46D6C8]/50 text-[#46D6C8] shadow-[0_0_10px_rgba(70,214,200,0.3)]'
                                            : 'bg-black/30 border-white/10 text-gray-300 hover:bg-white/10'
                                    }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="space-y-3">
                        {filteredData.length === 0 ? (
                            <div className="text-center py-8 text-gray-400">
                                <p>Немає записів</p>
                            </div>
                        ) : (
                            filteredData.map((item) => {
                                const authorRoleColor = roleColors[item.authorRole?.toLowerCase()]?.text || roleColors.user.text;

                                // Рендерим в зависимости от типа
                                if (item.type === 'role_change') {
                                    const oldRoleColor = item.oldRole ? (roleColors[item.oldRole.toLowerCase()]?.text || roleColors.user.text) : 'text-gray-400';
                                    const newRoleColor = roleColors[item.newRole?.toLowerCase()]?.text || roleColors.user.text;
                                    const actionTextColor = getActionTextColor('ROLE_UPDATE');

                                    return (
                                        <div
                                            key={item.id}
                                            className="bg-black/30 border border-white/10 rounded-lg p-3 hover:border-[#46D6C8]/30 transition-all"
                                        >
                                            <p className="text-sm font-medium leading-relaxed">
                                                <span className={`${authorRoleColor} font-semibold`}>{item.authorName}</span>
                                                {' '}
                                                <span className={actionTextColor}>змінив(ла) роль у користувача</span>
                                                {' '}
                                                <span className="text-white font-semibold">«{item.targetName}»</span>
                                                {' '}
                                                <span className="text-gray-400">» → </span>
                                                <span className={`${newRoleColor} font-semibold`}>{item.newRole}</span>
                                            </p>
                                            {item.oldRole && (
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Попередня роль: <span className={oldRoleColor}>{item.oldRole}</span>
                                                </p>
                                            )}
                                            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {formatDate(item.created_at)}
                                            </p>
                                            {item.reason && (
                                                <p className="text-xs text-amber-400/80 mt-1">
                                                    Причина: {item.reason}
                                                </p>
                                            )}
                                        </div>
                                    );
                                } else if (item.type === 'user_ban' || item.type === 'user_unban') {
                                    const statusText = item.type === 'user_ban' ? 'заблокировал(а)' : 'разблокировал(а)';
                                    const actionTextColor = getActionTextColor(item.type === 'user_ban' ? 'USER_BAN' : 'USER_UNBAN');
                                    const newStatus = item.newStatus || (item.type === 'user_ban' ? 'banned' : 'active');

                                    return (
                                        <div
                                            key={item.id}
                                            className="bg-black/30 border border-white/10 rounded-lg p-3 hover:border-[#46D6C8]/30 transition-all"
                                        >
                                            <p className="text-sm font-medium leading-relaxed">
                                                <span className={`${authorRoleColor} font-semibold`}>{item.authorName}</span>
                                                {' '}
                                                <span className={actionTextColor}>{statusText} користувача</span>
                                                {' '}
                                                <span className="text-white font-semibold">«{item.targetName}»</span>
                                                {' '}
                                                <span className="text-gray-400">(Статус: </span>
                                                <span className={getStatusPillClasses(newStatus)}>
                                                    {newStatus.toUpperCase()}
                                                </span>
                                                <span className="text-gray-400">)</span>
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {formatDate(item.created_at)}
                                            </p>
                                        </div>
                                    );
                                }

                                return null;
                            })
                        )}
                    </div>
                </div>
            </div>
        </>
    );

    return createPortal(modalContent, document.body);
};

export default RoleChangeHistoryModal;
