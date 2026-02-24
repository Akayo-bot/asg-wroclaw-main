import React, { useState, useEffect, useMemo } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase, SUPABASE_URL } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { UserCog, RefreshCw, History, Shield, AlertTriangle, Ban, CheckCircle, XCircle, Eye, ArrowUpDown, Search, X, Phone, User, AtSign } from 'lucide-react';
import { getRoleDisplayName, hasAdminAccess } from '@/utils/auth';
import RoleChangeHistory from '@/components/admin/RoleChangeHistory';
import RoleChangeHistoryModal from '@/components/admin/RoleChangeHistoryModal';
import { useActivityLog, ActivityLogItem } from '@/hooks/useActivityLog';
import { RolePill } from '@/components/admin/RolePill';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import UserProfileModal from '@/components/admin/UserProfileModal';
import { logActivity } from '@/utils/activityLogger';

import { GlassAlert } from '@/components/ui/GlassAlert';
import { GlassConfirmDialog } from '@/components/ui/GlassConfirmDialog';

interface UserProfile {
    id: string;
    display_name: string | null;
    real_name?: string | null;
    avatar_url?: string | null;
    phone?: string | null;
    role: 'superadmin' | 'admin' | 'editor' | 'user';
    status?: string | null;
    created_at: string;
    updated_at: string;
}

interface RoleChange {
    id: string;
    target_user_id: string;
    old_role: string | null;
    new_role: string;
    changed_by: string;
    created_at: string;
    reason: string | null;
    target_profile?: any;
    changer_profile?: any;
}

// Admin panel style (новая цветовая палитра)
const adminCardStyle =
    "relative overflow-hidden rounded-xl pointer-events-auto touch-auto transform-gpu border border-teal-500/20 bg-black/30 backdrop-blur-sm shadow-[0_0_25px_rgba(70,214,200,0.1)] animate-fade-in";

const adminCardContent = "relative z-10 p-3 sm:p-4";

const RoleManager = () => {
    const { t } = useI18n();
    const { profile, user } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [roleChanges, setRoleChanges] = useState<RoleChange[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const { logs: activityLogs } = useActivityLog(100); // Получаем логи действий (USER_BAN, USER_UNBAN)
    
    // User profile modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [viewingUser, setViewingUser] = useState<any>(null);
    const [isLoadingUserDetails, setIsLoadingUserDetails] = useState(false);
    
    // Filters
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
    const [roleFilter, setRoleFilter] = useState<'all' | 'superadmin' | 'admin' | 'editor' | 'user'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchField, setSearchField] = useState<'all' | 'nickname' | 'name' | 'phone'>('all');
    const [sortBy, setSortBy] = useState<'date' | 'name'>('name');

    useEffect(() => {
        if (hasAdminAccess(profile?.role)) {
            fetchUsers();
            fetchRoleChanges();
        }
    }, [profile?.role, statusFilter, roleFilter]); // Добавляем фильтры в зависимости

    const fetchUsers = async () => {
        setLoadingUsers(true);
        try {
            // Строим запрос с фильтрами на сервере
            let query: any = supabase
                .from('profiles')
                .select('*');

            // Всегда исключаем 'hidden'
            query = query.neq('status', 'hidden');

            // Фильтруем за статусом
            if (statusFilter === 'active') {
                // Active = нет status (null) или status не 'suspended' и не 'hidden'
                // Используем отрицание: НЕ suspended
                query = query.or('status.is.null,status.neq.suspended');
            } else if (statusFilter === 'suspended') {
                query = query.eq('status', 'suspended');
            }
            // Для 'all' - только исключаем 'hidden' (уже сделано выше)

            // Фильтруем за ролями
            if (roleFilter !== 'all') {
                // Преобразуем строку в массив для использования с .in()
                // .in() требует массив строк
                const rolesArray: string[] = [roleFilter.toLowerCase()];
                query = query.in('role', rolesArray);
            }

            // Сортируем
            query = query.order('created_at', { ascending: false });

            const { data, error } = await query;

            if (error) {
                console.error('❌ Error fetching users:', error);
                throw error;
            }

            console.log('📊 Loaded users:', data?.length || 0, 'with filters:', { statusFilter, roleFilter });
            setUsers(data || []);
        } catch (error: any) {
            console.error('❌ Error fetching users:', error);
            toast({
                title: t('common.error', 'Error'),
                description: error.message,
                variant: 'destructive'
            });
        } finally {
            setLoadingUsers(false);
        }
    };

    const fetchRoleChanges = async () => {
        try {
            const { data: changes, error } = await supabase
                .from('role_changes')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;

            if (!changes || changes.length === 0) {
                setRoleChanges([]);
                return;
            }

            const userIds = new Set<string>();
            changes.forEach(change => {
                userIds.add(change.target_user_id);
                userIds.add(change.changed_by);
            });

            const { data: profiles, error: profilesError } = await (supabase
                .from('profiles')
                .select('id, display_name, avatar_url, status, role')
                .in('id', Array.from(userIds))
                .neq('status', 'hidden') as any);

            if (profilesError) {
                console.warn('⚠️ Could not load user profiles:', profilesError);
            }

            const profilesMap = new Map();
            profiles?.forEach(profile => {
                profilesMap.set(profile.id, profile);
            });

            const enrichedChanges = changes.map(change => ({
                ...change,
                target_profile: profilesMap.get(change.target_user_id) || null,
                changer_profile: profilesMap.get(change.changed_by) || null
            }));

            const visibleChanges = enrichedChanges.filter(ch => ch.target_profile && ch.changer_profile);
            setRoleChanges(visibleChanges);

        } catch (error: any) {
            console.error('❌ Error fetching role changes:', error);
            toast({
                title: 'Error loading role history',
                description: error.message,
                variant: 'destructive'
            });
            setRoleChanges([]);
        }
    };

    const handleQuickRoleChange = async (targetUserId: string, targetRole: string) => {
        const currentUserRole = profile?.role?.toLowerCase();
        const targetUserRole = targetRole.toLowerCase();
        
        // Hierarchy check: Admin cannot assign SuperAdmin
        if (currentUserRole === 'admin' && targetUserRole === 'superadmin') {
            toast({
                title: 'Not Allowed',
                description: '🔒 Only SuperAdmin can assign SuperAdmin role',
                variant: 'destructive'
            });
            return;
        }

        // Cannot change own role
        if (targetUserId === user?.id) {
            toast({
                title: 'Not Allowed',
                description: '🔒 You cannot change your own role',
                variant: 'destructive'
            });
            return;
        }

        setLoading(true);
        try {
            const { data, error } = await supabase.rpc('change_user_role_by_id', {
                target_user: targetUserId,
                new_role: targetRole as 'superadmin' | 'admin' | 'editor' | 'user'
            });

            if (error) throw error;

            const result = data as any;
            if (result.success) {
                // Получаем информацию о пользователе для логирования
                const targetUser = users.find(u => u.id === targetUserId);
                const oldRole = targetUser?.role || 'unknown';
                
                // Логируем изменение роли
                await logActivity('ROLE_UPDATE', {
                    targetUser: targetUser?.display_name || targetUserId,
                    oldRole: oldRole,
                    newRole: targetRole,
                });
                
                toast({
                    title: 'Success',
                    description: `Role updated to ${getRoleDisplayName(targetRole)}`
                });
                fetchUsers();
                fetchRoleChanges();
            } else {
                throw new Error(result.error || 'Failed to update role');
            }
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message,
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    const [unbanConfirmId, setUnbanConfirmId] = useState<string | null>(null);
    const [unbanTargetName, setUnbanTargetName] = useState<string>('');

    const handleUnbanClick = (targetUserId: string) => {
        const targetUser = users.find(u => u.id === targetUserId);
        if (!targetUser) {
            toast({ title: 'Error', description: 'Користувач не знайдений', variant: 'destructive' });
            return;
        }
        setUnbanTargetName(targetUser.display_name || 'цього користувача');
        setUnbanConfirmId(targetUserId);
    };

    const handleUnbanUser = async (targetUserId: string) => {
        const targetUser = users.find(u => u.id === targetUserId);
        if (!targetUser) {
            toast({ title: 'Error', description: 'Користувач не знайдений', variant: 'destructive' });
            return;
        }

        setLoading(true);
        try {
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            if (sessionError || !session) {
                throw new Error(sessionError?.message || 'Не вдалося отримати сесію');
            }

            // Используем URL из клиента Supabase
            const response = await fetch(`${SUPABASE_URL}/functions/v1/unban-user`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userIdToUnban: targetUserId }),
            });

            // Проверяем, является ли ответ JSON перед парсингом
            const contentType = response.headers.get('content-type');
            let data;
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                const text = await response.text();
                throw new Error(`Неожиданный формат ответа: ${text}`);
            }

            if (!response.ok) {
                throw new Error(data?.error || `Помилка ${response.status}: ${response.statusText}`);
            }

            // Логируем разбан пользователя
            await logActivity('USER_UNBAN', {
                targetUser: targetUser.display_name || targetUserId,
            });
            
            // Explicitly update profile status in DB to ensure UI reflects change immediately
            await supabase.from('profiles').update({ status: null } as any).eq('id', targetUserId);

            toast({ title: 'Success', description: data.message || 'Користувач розблокований.' });
            fetchUsers();
            fetchRoleChanges();
        } catch (error: any) {
            console.error('Error unbanning user:', error);
            toast({ 
                title: 'Error', 
                description: error.message || 'Не вдалося розбанити користувача', 
                variant: 'destructive' 
            });
        } finally {
            setLoading(false);
        }
    };

    const handleBanUser = async (targetUserId: string) => {
        // Cannot ban SuperAdmin
        const targetUser = users.find(u => u.id === targetUserId);
        if (targetUser?.role?.toLowerCase() === 'superadmin') {
            toast({ title: 'Not Allowed', description: '🔒 Cannot ban SuperAdmin', variant: 'destructive' });
            return;
        }
        // Cannot ban yourself
        if (targetUserId === user?.id) {
            toast({ title: 'Not Allowed', description: '🔒 You cannot ban yourself', variant: 'destructive' });
            return;
        }

        // Ask for reason
        const reason = window.prompt(`Ви впевнені, що хочете забанити цього користувача?\nВведіть причину (необов'язково):`) ?? undefined;

        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('Не вдалося отримати сесію');

            const response = await fetch(`${SUPABASE_URL}/functions/v1/ban-user`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userIdToBan: targetUserId, reason: reason || 'Причина не вказана' }),
            });

            const data = await response.json();
            if (!response.ok) {
                 // Try to parse error if possible
                 try {
                     throw new Error(data.error || 'Не вдалося забанити користувача');
                 } catch (e) {
                      throw new Error('Не вдалося забанити користувача (Invalid JSON response)');
                 }
            }
            
            // Explicitly update profile status in DB to ensure UI reflects change immediately
            // Assuming 'suspended' is the correct status value for banned users
            await supabase.from('profiles').update({ status: 'suspended' } as any).eq('id', targetUserId);

            // Логируем бан пользователя
            await logActivity('USER_BAN', {
                targetUser: targetUser?.display_name || targetUserId,
                reason: reason || 'Причина не вказана',
            });

            toast({ title: 'Success', description: 'Користувач заблокований.' });
            fetchUsers();
            fetchRoleChanges();
        } catch (error: any) {
             console.error('Error banning user:', error);
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const handleViewUser = async (userId: string) => {
        setIsLoadingUserDetails(true);
        try {
            // Get session for access token
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                throw new Error('Не вдалося отримати сесію');
            }

            // Call Edge Function
            const response = await fetch(
                `${SUPABASE_URL}/functions/v1/get-user-details?userId=${userId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Не вдалося завантажити профіль');
            }

            // Save data and open modal
            setViewingUser(data);
            setIsModalOpen(true);
        } catch (error: any) {
            toast({
                title: t('common.error', 'Error'),
                description: error.message || 'Failed to load user details',
                variant: 'destructive'
            });
        } finally {
            setIsLoadingUserDetails(false);
        }
    };

    // Теперь фильтрация делается на сервере, но добавляем клиентский поиск
    const filteredUsers = useMemo(() => {
        let res = users;
        if (searchQuery) {
            const lower = searchQuery.toLowerCase();
            res = res.filter(u => {
                if (searchField === 'nickname') return u.display_name?.toLowerCase().includes(lower);
                if (searchField === 'name') return u.real_name?.toLowerCase().includes(lower);
                if (searchField === 'phone') return u.phone?.toLowerCase().includes(lower);
                return (
                    u.display_name?.toLowerCase().includes(lower) ||
                    u.real_name?.toLowerCase().includes(lower) ||
                    u.phone?.toLowerCase().includes(lower)
                );
            });
        }
        if (sortBy === 'name') {
            res = [...res].sort((a, b) => {
                const nameA = (a.real_name || a.display_name || '').toLowerCase();
                const nameB = (b.real_name || b.display_name || '').toLowerCase();
                return nameA.localeCompare(nameB);
            });
        }
        return res;
    }, [users, searchQuery, searchField, sortBy]);

    // Available roles based on current user's role
    const availableRoles = useMemo(() => {
        const currentUserRole = profile?.role?.toLowerCase();
        const roles = ['user', 'editor', 'admin'];
        
        // Only SuperAdmin can assign SuperAdmin
        if (currentUserRole === 'superadmin') {
            roles.push('superadmin');
        }
        
        return roles;
    }, [profile?.role]);

    if (!hasAdminAccess(profile?.role)) {
        return (
            <div className="p-6 max-w-2xl mx-auto mt-10">
                <GlassAlert 
                    variant="destructive"
                    title={t('common.accessDenied', 'Доступ заборонено')}
                    description={t('errors.adminAccessRequired', 'Для перегляду цієї сторінки потрібні права адміністратора.')}
                />
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-display flex items-center gap-2 text-white">
                    <UserCog className="h-6 w-6" />
                    Управління ролями
                </h1>
                <p className="text-gray-400 text-sm mt-1 font-sans">Керування ролями та правами користувачів</p>
            </div>

            {/* Two-column layout */}
            <div className="flex flex-col lg:flex-row gap-5">
                {/* Left column: Users Table */}
                <div className="w-full lg:w-2/3 space-y-5 order-2 lg:order-1">
                    <section className={adminCardStyle}>
                        <span className="pointer-events-none absolute left-0 top-0 h-full w-[3px] bg-teal-300" />
                        <div className={adminCardContent}>
                            <header className="flex items-center justify-between border-b border-teal-500/10 pb-3 mb-4">
                                <h3 className="text-[16px] font-semibold text-white font-sans">Всі гравці</h3>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={fetchUsers}
                                    disabled={loadingUsers}
                                    className="h-8 px-2 cursor-target border border-transparent hover:border-[#46D6C8]/30 hover:bg-[#46D6C8]/20 hover:text-[#46D6C8] transition-all duration-150 hover:shadow-[0_0_15px_rgba(70,214,200,0.3)]"
                                >
                                    <RefreshCw className={`h-4 w-4 ${loadingUsers ? 'animate-spin' : ''}`} />
                                </Button>
                            </header>

                            <div className="mb-6 px-1">
                                <div className="group relative w-full max-w-4xl mx-auto">
                                    <div
                                        className="absolute inset-0 rounded-2xl bg-white/5 dark:bg-black/20 backdrop-blur-xl ring-1 ring-white/10 dark:ring-white/5 shadow-[0_8px_30px_rgba(0,0,0,.25)] transition-all duration-300 group-focus-within:ring-[#46D6C8]/40 group-focus-within:shadow-[0_0_12px_rgba(70,214,200,.4),inset_0_0_12px_rgba(70,214,200,.15)]"
                                    />
                                    <div className="relative flex items-center">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 grid place-items-center size-9 rounded-xl bg-black/35 ring-1 ring-white/10 text-[#46D6C8] shadow-[0_0_12px_rgba(70,214,200,.25)] transition-all duration-300 group-focus-within:scale-110">
                                            <Search className="size-[18px]" />
                                        </div>

                                        <input
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            autoComplete="off"
                                            placeholder={
                                                searchField === 'nickname' ? 'Поиск по нику...'
                                                    : searchField === 'name' ? 'Поиск по имени...'
                                                    : searchField === 'phone' ? 'Поиск по телефону...'
                                                    : 'Поиск по нику, имени или телефону...'
                                            }
                                            aria-label="Поиск пользователя"
                                            className="w-full h-12 md:h-14 rounded-l-2xl bg-transparent pl-[72px] pr-[180px] text-slate-200 placeholder:text-slate-400/70 outline-none border-none"
                                        />

                                        {searchQuery && (
                                            <button
                                                type="button"
                                                aria-label="Очистить"
                                                tabIndex={0}
                                                onClick={() => setSearchQuery('')}
                                                className="absolute right-[155px] top-1/2 -translate-y-1/2 rounded-full p-1.5 text-slate-400 hover:text-white hover:bg-white/10 transition-all active:scale-90"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        )}

                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                                            {([
                                                { id: 'all' as const, label: 'Все', icon: <Search className="h-3.5 w-3.5" /> },
                                                { id: 'nickname' as const, label: 'Ник', icon: <AtSign className="h-3.5 w-3.5" /> },
                                                { id: 'name' as const, label: 'Имя', icon: <User className="h-3.5 w-3.5" /> },
                                                { id: 'phone' as const, label: 'Тел', icon: <Phone className="h-3.5 w-3.5" /> },
                                            ]).map((option) => {
                                                const isActive = searchField === option.id;
                                                return (
                                                    <button
                                                        key={option.id}
                                                        type="button"
                                                        tabIndex={0}
                                                        aria-label={`Искать по: ${option.label}`}
                                                        onClick={() => setSearchField(option.id)}
                                                        className={`flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-medium transition-all duration-150 cursor-target ${
                                                            isActive
                                                                ? 'bg-[#46D6C8]/20 text-[#46D6C8] ring-1 ring-[#46D6C8]/50 shadow-[0_0_10px_rgba(70,214,200,0.3)]'
                                                                : 'text-gray-500 hover:text-gray-300 hover:bg-white/10'
                                                        }`}
                                                    >
                                                        {option.icon}
                                                        <span className="hidden sm:inline">{option.label}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Filters */}
                            <div className="my-4 space-y-4">
                                {/* Status Filter */}
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm font-medium text-gray-400 font-sans">Статус:</span>
                                    <div className="flex gap-1 flex-wrap">
                                        {(['all', 'active', 'suspended'] as const).map((status) => {
                                            const isActive = statusFilter === status;
                                            return (
                                                <Button
                                                    key={status}
                                                    variant={isActive ? 'default' : 'outline'}
                                                    size="sm"
                                                    onClick={() => setStatusFilter(status)}
                                                    className={
                                                        isActive
                                                            ? "rounded-lg px-3 py-1.5 text-xs font-medium border border-[#46D6C8]/50 bg-[#46D6C8]/20 backdrop-blur-sm text-[#46D6C8] shadow-[0_0_15px_rgba(70,214,200,0.3)] transition-all duration-150 hover:bg-[#46D6C8]/30 hover:shadow-[0_0_20px_rgba(70,214,200,0.5)] h-7 font-sans cursor-target"
                                                            : "rounded-lg px-3 py-1.5 text-xs font-medium border border-white/10 bg-black/30 backdrop-blur-sm text-gray-400 transition-all hover:bg-white/10 hover:text-white h-7 font-sans cursor-target"
                                                    }
                                                >
                                                    {status === 'all' ? 'Всі' : status === 'active' ? 'Active' : 'Banned'}
                                                </Button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Role Filter */}
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm font-medium text-gray-400 font-sans">Роль:</span>
                                    <div className="flex gap-1 flex-wrap">
                                        {(['all', 'user', 'editor', 'admin', 'superadmin'] as const).map((role) => {
                                            const isActive = roleFilter === role;
                                            return (
                                                <Button
                                                    key={role}
                                                    variant={isActive ? 'default' : 'outline'}
                                                    size="sm"
                                                    onClick={() => setRoleFilter(role)}
                                                    className={
                                                        isActive
                                                            ? "rounded-lg px-3 py-1.5 text-xs font-medium border border-[#46D6C8]/50 bg-[#46D6C8]/20 backdrop-blur-sm text-[#46D6C8] shadow-[0_0_15px_rgba(70,214,200,0.3)] transition-all duration-150 hover:bg-[#46D6C8]/30 hover:shadow-[0_0_20px_rgba(70,214,200,0.5)] h-7 font-sans cursor-target"
                                                            : "rounded-lg px-3 py-1.5 text-xs font-medium border border-white/10 bg-black/30 backdrop-blur-sm text-gray-400 transition-all hover:bg-white/10 hover:text-white h-7 font-sans cursor-target"
                                                    }
                                                >
                                                    {role === 'all' ? 'Всі ролі' : getRoleDisplayName(role)}
                                                </Button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Sort */}
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm font-medium text-gray-400 font-sans flex items-center gap-1">
                                        <ArrowUpDown className="h-3.5 w-3.5" />
                                        Сортировка:
                                    </span>
                                    <div className="flex gap-1 flex-wrap">
                                        {([
                                            { id: 'name' as const, label: 'По имени' },
                                            { id: 'date' as const, label: 'По дате' },
                                        ]).map((option) => {
                                            const isActive = sortBy === option.id;
                                            return (
                                                <Button
                                                    key={option.id}
                                                    variant={isActive ? 'default' : 'outline'}
                                                    size="sm"
                                                    onClick={() => setSortBy(option.id)}
                                                    className={
                                                        isActive
                                                            ? "rounded-lg px-3 py-1.5 text-xs font-medium border border-[#46D6C8]/50 bg-[#46D6C8]/20 backdrop-blur-sm text-[#46D6C8] shadow-[0_0_15px_rgba(70,214,200,0.3)] transition-all duration-150 hover:bg-[#46D6C8]/30 hover:shadow-[0_0_20px_rgba(70,214,200,0.5)] h-7 font-sans cursor-target"
                                                            : "rounded-lg px-3 py-1.5 text-xs font-medium border border-white/10 bg-black/30 backdrop-blur-sm text-gray-400 transition-all hover:bg-white/10 hover:text-white h-7 font-sans cursor-target"
                                                    }
                                                >
                                                    {option.label}
                                                </Button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Table */}
                            <div className="overflow-x-auto lg:overflow-visible">
                                <Table className="w-full">
                                    <TableHeader className="hidden lg:table-header-group">
                                        <TableRow>
                                            <TableHead className="p-4 text-left text-gray-400 font-sans">USER</TableHead>
                                            <TableHead className="p-4 text-left text-gray-400 font-sans">ROLE</TableHead>
                                            <TableHead className="p-4 text-left text-gray-400 font-sans">STATUS</TableHead>
                                            <TableHead className="p-4 text-left text-gray-400 font-sans">CREATED</TableHead>
                                            <TableHead className="p-4 text-left text-gray-400 font-sans">ACTIONS</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody className="flex flex-col gap-4 lg:table-row-group">
                                        {filteredUsers.length === 0 ? (
                                            <TableRow className="block lg:table-row">
                                                <TableCell colSpan={5} className="text-center py-8 text-gray-400 font-sans">
                                                    {loadingUsers ? 'Завантаження...' : 'Користувачі не знайдені'}
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredUsers.map((userProfile) => (
                                                <TableRow 
                                                    key={userProfile.id}
                                                    className="block p-4 border border-white/10 rounded-lg lg:table-row lg:p-0 lg:border-0 lg:border-b group transition-all duration-200 hover:bg-white/5 hover:shadow-[0_0_25px_rgba(70,214,200,0.2)]"
                                                >
                                                    {/* === МОБІЛЬНА ВЕРСІЯ (Новий, чистий макет) === */}
                                                    <div className="lg:hidden">
                                                        {/* 1. ЗАГОЛОВОК КАРТКИ (Аватар + Нік) */}
                                                        <div className="flex items-center space-x-3">
                                                            <span className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-[#0a0e0c] ring-2 ring-[#46D6C8] text-xl font-medium text-[#46D6C8] font-sans">
                                                                {userProfile.display_name?.charAt(0).toUpperCase() || 'T'}
                                                            </span>
                                                            <div>
                                                                <p className="font-semibold text-base text-white font-sans">{userProfile.display_name || 'No name'}</p>
                                                            </div>
                                                        </div>

                                                        {/* Розділювач */}
                                                        <hr className="my-3 h-px border-0 bg-white/10" />
                                                        
                                                        {/* 2. ТІЛО КАРТКИ (Решта даних) */}
                                                        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                                                            <span className="text-xs text-gray-400 font-medium font-sans">ROLE</span>
                                                            <div className="[&_.role-pill]:transition-all [&_.role-pill]:group-hover:brightness-110">
                                                                <RolePill role={userProfile.role} className="role-pill" />
                                                            </div>

                                                            <span className="text-xs text-gray-400 font-medium font-sans">STATUS</span>
                                                            <div>
                                                                {userProfile.status === 'suspended' ? (
                                                                    <Badge variant="destructive" className="gap-1 border-[#FF0000]/30 text-[#FF0000] rounded-md px-2.5 py-0.5 text-xs font-semibold bg-[#FF0000]/20 ring-1 ring-inset ring-[#FF0000]/40 shadow-[0_0_10px_rgba(255,0,0,0.3)] font-sans">
                                                                        <XCircle className="h-3 w-3" />
                                                                        Banned
                                                                    </Badge>
                                                                ) : (
                                                                    <Badge variant="outline" className="gap-1 border-[#46D6C8]/30 text-[#46D6C8] rounded-md px-2.5 py-0.5 text-xs font-semibold bg-[#46D6C8]/20 ring-1 ring-inset ring-[#46D6C8]/40 shadow-[0_0_10px_rgba(70,214,200,0.3)] transition-all group-hover:brightness-110 font-sans">
                                                                        <CheckCircle className="h-3 w-3" />
                                                                        Active
                                                                    </Badge>
                                                                )}
                                                            </div>

                                                            <span className="text-xs text-gray-400 font-medium font-sans">CREATED</span>
                                                            <span className="text-sm text-gray-500 transition-colors group-hover:text-gray-300 font-sans">{new Date(userProfile.created_at).toLocaleDateString()}</span>
                                                        </div>
                                                        
                                                        {/* 3. ДІЇ (Actions) */}
                                                        <div className="mt-4 pt-4 border-t border-white/10">
                                                            <div className="flex flex-wrap gap-1">
                                                            {userProfile.id === user?.id ? (
                                                                <div className="flex items-center gap-2 text-gray-400 text-sm font-sans">
                                                                    <Shield className="h-4 w-4" />
                                                                    <span>Your account</span>
                                                                </div>
                                                            ) : (
                                                                <>
                                                                {/* Role buttons */}
                                                                {availableRoles.map((role) => {
                                                                    const isActiveRole = userProfile.role === role;
                                                                    const baseClasses = "rounded-md px-3 py-1 text-xs font-medium border border-white/10 bg-black/40 backdrop-blur-sm text-gray-300 transition-all duration-150 hover:-translate-y-px";
                                                                    // Hover color mapping per role (обновленная палитра)
                                                                    const hoverByRole =
                                                                        role === 'superadmin'
                                                                            ? "hover:bg-[#FF7F3B]/30 hover:text-[#FF7F3B] hover:border-[#FF7F3B]/50 hover:shadow-[0_0_12px_rgba(255,127,59,0.3)]"
                                                                            : role === 'admin'
                                                                            ? "hover:bg-[#00FF00]/30 hover:text-[#00FF00] hover:border-[#00FF00]/50 hover:shadow-[0_0_12px_rgba(0,255,0,0.3)]"
                                                                            : role === 'editor'
                                                                            ? "hover:bg-[#A020F0]/30 hover:text-[#A020F0] hover:border-[#A020F0]/50 hover:shadow-[0_0_12px_rgba(160,32,240,0.3)]"
                                                                            : "hover:bg-[#808080]/30 hover:text-white hover:border-[#808080]/50 hover:shadow-[0_0_12px_rgba(128,128,128,0.3)]"; // user

                                                                    // Active (static glow) per role (обновленная палитра)
                                                                    const activeByRole =
                                                                        role === 'superadmin'
                                                                            ? "border-[#FF7F3B]/50 bg-[#FF7F3B]/20 text-[#FF7F3B] shadow-[0_0_12px_rgba(255,127,59,0.3)]"
                                                                            : role === 'admin'
                                                                            ? "border-[#00FF00]/50 bg-[#00FF00]/20 text-[#00FF00] shadow-[0_0_12px_rgba(0,255,0,0.3)]"
                                                                            : role === 'editor'
                                                                            ? "border-[#A020F0]/50 bg-[#A020F0]/20 text-[#A020F0] shadow-[0_0_12px_rgba(160,32,240,0.3)]"
                                                                            : "border-[#808080]/40 bg-[#808080]/20 text-[#808080] shadow-[0_0_8px_rgba(128,128,128,0.18)]"; // user

                                                                    const className = isActiveRole
                                                                        ? `rounded-md px-3 py-1 text-xs font-medium ${activeByRole} h-7`
                                                                        : `rounded-md px-3 py-1 text-xs font-medium border border-white/10 bg-black/40 backdrop-blur-sm text-gray-500 transition-all duration-150 hover:-translate-y-px ${hoverByRole} h-7`;

                                                                    return (
                                                                        <Button
                                                                            key={role}
                                                                            variant={isActiveRole ? 'default' : 'outline'}
                                                                            size="sm"
                                                                            disabled={loading || isActiveRole}
                                                                            onClick={() => handleQuickRoleChange(userProfile.id, role)}
                                                                            className={`${className} cursor-target`}
                                                                        >
                                                                            {getRoleDisplayName(role)}
                                                                        </Button>
                                                                    );
                                                                })}
                                                                {/* View User button - только для SuperAdmin */}
                                                                {profile?.role?.toLowerCase() === 'superadmin' && (
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        disabled={isLoadingUserDetails}
                                                                        onClick={() => handleViewUser(userProfile.id)}
                                                                        className="rounded-lg px-3 py-1.5 text-xs font-medium border border-white/10 bg-black/40 backdrop-blur-sm text-gray-300 transition-all duration-150 hover:-translate-y-px hover:bg-[#46D6C8]/30 hover:text-[#46D6C8] hover:border-[#46D6C8]/50 hover:shadow-[0_0_12px_rgba(70,214,200,0.3)] h-7 font-sans cursor-target"
                                                                        title="Переглянути профіль"
                                                                    >
                                                                        <Eye className="h-3 w-3" />
                                                                    </Button>
                                                                )}
                                                                {/* 
                                                                    🔥 ЛОГІКА ПЕРЕМИКАННЯ БАНУ
                                                                    Припускаємо, що у забанених юзерів status = 'suspended'
                                                                */}
                                                                {userProfile.status === 'suspended' ? (
                                                                    // --- КНОПКА "РОЗБАНИТИ" ---
                                                                    <button
                                                                        onClick={() => handleUnbanUser(userProfile.id)}
                                                                        disabled={loading}
                                                                        className="rounded-lg px-3 py-1.5 text-xs font-medium border border-[#46D6C8]/30 bg-[#46D6C8]/30 backdrop-blur-sm text-[#46D6C8] transition-all duration-150 hover:-translate-y-px hover:bg-[#46D6C8]/40 hover:text-white hover:border-[#46D6C8]/60 hover:shadow-[0_0_12px_rgba(70,214,200,0.4)] disabled:opacity-50 disabled:cursor-not-allowed font-sans cursor-target"
                                                                    >
                                                                        Unban
                                                                    </button>
                                                                ) : (
                                                                    // --- КНОПКА "ЗАБАНИТИ" ---
                                                                    <button
                                                                        onClick={() => handleBanUser(userProfile.id)}
                                                                        disabled={loading || userProfile.role?.toLowerCase() === 'superadmin' || userProfile.id === user?.id}
                                                                        className="rounded-lg px-3 py-1.5 text-xs font-medium border border-[#FF0000]/30 bg-[#FF0000]/30 backdrop-blur-sm text-[#FF0000] transition-all duration-150 hover:-translate-y-px hover:bg-[#FF0000]/40 hover:text-white hover:border-[#FF0000]/60 hover:shadow-[0_0_12px_rgba(255,0,0,0.4)] disabled:opacity-50 disabled:cursor-not-allowed font-sans cursor-target"
                                                                    >
                                                                        Ban
                                                                    </button>
                                                                )}
                                                                </>
                                                            )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* === ДЕСКТОПНА ВЕРСІЯ (Table) === */}
                                                    <TableCell className="hidden lg:table-cell lg:p-4">
                                                        <div className="flex items-center justify-center gap-3">
                                                            <Avatar className="h-8 w-8">
                                                                <AvatarImage src={userProfile.avatar_url || undefined} />
                                                                <AvatarFallback className="bg-[#46D6C8]/20 text-[#46D6C8] transition-colors">
                                                                    {userProfile.display_name?.charAt(0).toUpperCase() || 'U'}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <p className="font-medium text-white font-sans">
                                                                {userProfile.display_name || 'No name'}
                                                            </p>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="hidden lg:table-cell lg:p-4">
                                                        <div className="[&_.role-pill]:transition-all [&_.role-pill]:group-hover:brightness-110">
                                                            <RolePill role={userProfile.role} className="role-pill" />
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="hidden lg:table-cell lg:p-4">
                                                        {userProfile.status === 'suspended' ? (
                                                            <Badge variant="destructive" className="gap-1 border-[#FF0000]/30 text-[#FF0000] rounded-md px-2.5 py-0.5 text-xs font-semibold bg-[#FF0000]/20 ring-1 ring-inset ring-[#FF0000]/40 shadow-[0_0_10px_rgba(255,0,0,0.3)] font-sans">
                                                                <XCircle className="h-3 w-3" />
                                                                Banned
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="gap-1 border-[#46D6C8]/30 text-[#46D6C8] rounded-md px-2.5 py-0.5 text-xs font-semibold bg-[#46D6C8]/20 ring-1 ring-inset ring-[#46D6C8]/40 shadow-[0_0_10px_rgba(70,214,200,0.3)] transition-all group-hover:brightness-110 font-sans">
                                                                <CheckCircle className="h-3 w-3" />
                                                                Active
                                                            </Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="hidden lg:table-cell lg:p-4 text-gray-500 transition-colors group-hover:text-gray-300 text-sm">
                                                        <span className="font-sans">{new Date(userProfile.created_at).toLocaleDateString()}</span>
                                                    </TableCell>
                                                    <TableCell className="hidden lg:table-cell lg:p-4">
                                                        <div className="flex flex-wrap gap-1">
                                                            {userProfile.id === user?.id ? (
                                                                <div className="flex items-center gap-2 text-gray-400 text-sm font-sans">
                                                                    <Shield className="h-4 w-4" />
                                                                    <span>Your account</span>
                                                                </div>
                                                            ) : (
                                                                <>
                                                                {/* Role buttons */}
                                                                {availableRoles.map((role) => {
                                                                    const isActiveRole = userProfile.role === role;
                                                                    const baseClasses = "rounded-md px-3 py-1 text-xs font-medium border border-white/10 bg-black/40 backdrop-blur-sm text-gray-300 transition-all duration-150 hover:-translate-y-px";
                                                                    // Hover color mapping per role (обновленная палитра)
                                                                    const hoverByRole =
                                                                        role === 'superadmin'
                                                                            ? "hover:bg-[#FF7F3B]/30 hover:text-[#FF7F3B] hover:border-[#FF7F3B]/50 hover:shadow-[0_0_12px_rgba(255,127,59,0.3)]"
                                                                            : role === 'admin'
                                                                            ? "hover:bg-[#00FF00]/30 hover:text-[#00FF00] hover:border-[#00FF00]/50 hover:shadow-[0_0_12px_rgba(0,255,0,0.3)]"
                                                                            : role === 'editor'
                                                                            ? "hover:bg-[#A020F0]/30 hover:text-[#A020F0] hover:border-[#A020F0]/50 hover:shadow-[0_0_12px_rgba(160,32,240,0.3)]"
                                                                            : "hover:bg-[#808080]/30 hover:text-white hover:border-[#808080]/50 hover:shadow-[0_0_12px_rgba(128,128,128,0.3)]"; // user

                                                                    // Active (static glow) per role (обновленная палитра)
                                                                    const activeByRole =
                                                                        role === 'superadmin'
                                                                            ? "border-[#FF7F3B]/50 bg-[#FF7F3B]/20 text-[#FF7F3B] shadow-[0_0_12px_rgba(255,127,59,0.3)]"
                                                                            : role === 'admin'
                                                                            ? "border-[#00FF00]/50 bg-[#00FF00]/20 text-[#00FF00] shadow-[0_0_12px_rgba(0,255,0,0.3)]"
                                                                            : role === 'editor'
                                                                            ? "border-[#A020F0]/50 bg-[#A020F0]/20 text-[#A020F0] shadow-[0_0_12px_rgba(160,32,240,0.3)]"
                                                                            : "border-[#808080]/40 bg-[#808080]/20 text-[#808080] shadow-[0_0_8px_rgba(128,128,128,0.18)]"; // user

                                                                    const className = isActiveRole
                                                                        ? `rounded-md px-3 py-1 text-xs font-medium ${activeByRole} h-7`
                                                                        : `rounded-md px-3 py-1 text-xs font-medium border border-white/10 bg-black/40 backdrop-blur-sm text-gray-500 transition-all duration-150 hover:-translate-y-px ${hoverByRole} h-7`;

                                                                    return (
                                                                        <Button
                                                                            key={role}
                                                                            variant={isActiveRole ? 'default' : 'outline'}
                                                                            size="sm"
                                                                            disabled={loading || isActiveRole}
                                                                            onClick={() => handleQuickRoleChange(userProfile.id, role)}
                                                                            className={`${className} cursor-target`}
                                                                        >
                                                                            {getRoleDisplayName(role)}
                                                                        </Button>
                                                                    );
                                                                })}
                                                                {/* View User button - только для SuperAdmin */}
                                                                {profile?.role?.toLowerCase() === 'superadmin' && (
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        disabled={isLoadingUserDetails}
                                                                        onClick={() => handleViewUser(userProfile.id)}
                                                                        className="rounded-lg px-3 py-1.5 text-xs font-medium border border-white/10 bg-black/40 backdrop-blur-sm text-gray-300 transition-all duration-150 hover:-translate-y-px hover:bg-[#46D6C8]/30 hover:text-[#46D6C8] hover:border-[#46D6C8]/50 hover:shadow-[0_0_12px_rgba(70,214,200,0.3)] h-7 font-sans cursor-target"
                                                                        title="Переглянути профіль"
                                                                    >
                                                                        <Eye className="h-3 w-3" />
                                                                    </Button>
                                                                )}
                                                                {/* 
                                                                    🔥 ЛОГІКА ПЕРЕМИКАННЯ БАНУ
                                                                    Припускаємо, що у забанених юзерів status = 'suspended'
                                                                */}
                                                                {userProfile.status === 'suspended' ? (
                                                                    // --- КНОПКА "РОЗБАНИТИ" ---
                                                                    <button
                                                                        onClick={() => handleUnbanClick(userProfile.id)}
                                                                        disabled={loading}
                                                                        className="rounded-lg px-3 py-1.5 text-xs font-medium border border-[#46D6C8]/30 bg-[#46D6C8]/30 backdrop-blur-sm text-[#46D6C8] transition-all duration-150 hover:-translate-y-px hover:bg-[#46D6C8]/40 hover:text-white hover:border-[#46D6C8]/60 hover:shadow-[0_0_12px_rgba(70,214,200,0.4)] disabled:opacity-50 disabled:cursor-not-allowed font-sans cursor-target"
                                                                    >
                                                                        Unban
                                                                    </button>
                                                                ) : (
                                                                    // --- КНОПКА "ЗАБАНИТИ" ---
                                                                    <button
                                                                        onClick={() => handleBanUser(userProfile.id)}
                                                                        disabled={loading || userProfile.role?.toLowerCase() === 'superadmin' || userProfile.id === user?.id}
                                                                        className="rounded-lg px-3 py-1.5 text-xs font-medium border border-[#FF0000]/30 bg-[#FF0000]/30 backdrop-blur-sm text-[#FF0000] transition-all duration-150 hover:-translate-y-px hover:bg-[#FF0000]/40 hover:text-white hover:border-[#FF0000]/60 hover:shadow-[0_0_12px_rgba(255,0,0,0.4)] disabled:opacity-50 disabled:cursor-not-allowed font-sans cursor-target"
                                                                    >
                                                                        Ban
                                                                    </button>
                                                                )}
                                                                </>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Right column: History & Help */}
                <div className="w-full lg:w-1/3 space-y-5 order-1 lg:order-2 flex flex-col gap-5">
                    {/* History Card */}
                    <section className={adminCardStyle}>
                        <span className="pointer-events-none absolute left-0 top-0 h-full w-[3px] bg-teal-300" />
                        <div className={adminCardContent}>
                            <header className="flex items-center gap-2 border-b border-teal-500/10 pb-3 mb-4">
                                <History className="h-5 w-5 text-teal-300" />
                                <h3 className="text-[16px] font-semibold text-white font-sans">Історія змін</h3>
                            </header>
                            <Button
                                variant="outline"
                                className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#46D6C8]/20 bg-black/30 p-3 backdrop-blur-sm text-gray-500 transition-all duration-200 hover:bg-[#46D6C8]/30 hover:text-[#46D6C8] hover:shadow-[0_0_15px_rgba(70,214,200,0.2)] font-sans cursor-target"
                                onClick={() => setShowHistory(true)}
                            >
                                <History className="h-4 w-4" />
                                Переглянути історію змін ролей
                            </Button>
                            <RoleChangeHistoryModal
                                isOpen={showHistory}
                                onClose={() => setShowHistory(false)}
                                data={roleChanges as any}
                                activityLogs={activityLogs}
                            />
                        </div>
                    </section>

                    {/* Roles Explanation Card */}
                    <section className="relative overflow-visible rounded-xl pointer-events-auto touch-auto transform-gpu border border-teal-500/20 bg-black/30 backdrop-blur-sm shadow-[0_0_25px_rgba(70,214,200,0.1)] animate-fade-in">
                        <span className="pointer-events-none absolute left-0 top-0 h-full w-[3px] bg-teal-300" />
                        <div className="relative z-10 p-3 sm:p-4 overflow-visible">
                            <header className="flex items-center gap-2 border-b border-teal-500/10 pb-3 mb-4">
                                <Shield className="h-5 w-5 text-teal-300" />
                                <h3 className="text-[16px] font-semibold text-white font-sans">Пояснення ролей</h3>
                            </header>
                            <div className="space-y-3 text-sm relative z-10">
                                <div>
                                    <p className="font-semibold text-orange-300 mb-1 drop-shadow-[0_0_8px_rgba(255,127,59,0.7)] font-sans">SuperAdmin</p>
                                    <p className="text-gray-500 text-sm font-sans">
                                        Повний контроль, вкл. "Управління брендом".
                                    </p>
                                </div>
                                <div className="my-3 h-[2px] w-full min-h-[2px] relative">
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-500/80 to-transparent"></div>
                                </div>
                                <div>
                                    <p className="font-semibold text-[#00FF00] mb-1 drop-shadow-[0_0_8px_rgba(0,255,0,0.7)] font-sans">Admin</p>
                                    <p className="text-gray-500 text-sm font-sans">
                                        Керування іграми, користувачами, статтями.
                                    </p>
                                </div>
                                <div className="my-3 h-[2px] w-full min-h-[2px] relative">
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#00FF00]/80 to-transparent"></div>
                                </div>
                                <div>
                                    <p className="font-semibold text-[#A020F0] mb-1 drop-shadow-[0_0_8px_rgba(160,32,240,0.7)] font-sans">Editor</p>
                                    <p className="text-gray-500 text-sm font-sans">
                                        Завантаження фото/відео (Галерея), керування статтями.
                                    </p>
                                </div>
                                <div className="my-3 h-[2px] w-full min-h-[2px] relative">
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#A020F0]/80 to-transparent"></div>
                                </div>
                                <div>
                                    <p className="font-semibold text-[#808080] mb-1 font-sans">User</p>
                                    <p className="text-gray-500 text-sm font-sans">
                                        Реєстрація на ігри, перегляд контенту.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>

            {/* User Profile Modal */}
            {isModalOpen && viewingUser && (
                <UserProfileModal
                    user={viewingUser}
                    onClose={() => {
                        setIsModalOpen(false);
                        setViewingUser(null);
                    }}
                />
            )}

            <GlassConfirmDialog
                open={!!unbanConfirmId}
                onOpenChange={(open) => { if (!open) { setUnbanConfirmId(null); setUnbanTargetName(''); } }}
                title="Розбанити користувача"
                description={`Ви впевнені, що хочете розбанити ${unbanTargetName}?`}
                confirmLabel="Розбанити"
                cancelLabel="Скасувати"
                variant="default"
                onConfirm={() => {
                    if (unbanConfirmId) handleUnbanUser(unbanConfirmId);
                }}
            />
        </div>
    );
};

export default RoleManager;
