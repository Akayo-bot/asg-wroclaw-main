import React, { useState, useEffect, useMemo } from 'react';
import { Search, Users, UserPlus, Eye, Loader2 } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { supabase, SUPABASE_URL } from '@/integrations/supabase/client';
import RadarLoader from '@/components/RadarLoader';
import UserProfileModal from '@/components/admin/UserProfileModal';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { hasAdminAccess } from '@/utils/auth';

interface ProfileData {
    id: string;
    display_name: string | null;
    real_name?: string | null;
    avatar_url?: string | null;
    role?: string | null;
}

interface ParticipantEntry {
    id: string;
    regId: string;
    userId: string;
    nickname: string;
    realName?: string | null;
    avatarUrl?: string | null;
    type: 'self' | 'friend';
    invitedBy?: string;
    invitedByNickname?: string;
}

interface ParticipantsModalProps {
    isOpen: boolean;
    onClose: () => void;
    eventTitle: string;
    eventId: string;
    participantLimit: number;
}

export default function ParticipantsModal({ isOpen, onClose, eventTitle, eventId, participantLimit }: ParticipantsModalProps) {
    const [entries, setEntries] = useState<ParticipantEntry[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [viewingUser, setViewingUser] = useState<any>(null);
    const [isLoadingUserDetails, setIsLoadingUserDetails] = useState(false);
    const [loadingUserId, setLoadingUserId] = useState<string | null>(null);

    const { toast } = useToast();
    const { profile } = useAuth();
    const isAdmin = hasAdminAccess(profile?.role);

    useEffect(() => {
        if (isOpen && eventId) {
            setSearchTerm('');
            fetchParticipants();
        }
    }, [isOpen, eventId]);

    const fetchParticipants = async () => {
        setLoading(true);
        try {
            const { data: registrations, error: regError } = await supabase
                .from('event_registrations')
                .select('id, user_id, status, registration_data')
                .eq('event_id', eventId)
                .eq('status', 'approved');

            if (regError) throw regError;
            if (!registrations || registrations.length === 0) {
                setEntries([]);
                return;
            }

            const uniqueUserIds = [...new Set(registrations.map(r => r.user_id))];

            const { data: profiles, error: profError } = await supabase
                .from('profiles')
                .select('id, display_name, real_name, avatar_url, role')
                .in('id', uniqueUserIds);

            if (profError) {
                console.warn('Could not load profiles:', profError);
            }

            const profileMap = new Map<string, ProfileData>();
            (profiles || []).forEach((p: any) => {
                profileMap.set(p.id, p);
            });

            const getInviterNickname = (userId: string): string => {
                const profile = profileMap.get(userId);
                return profile?.display_name || 'Гравець';
            };

            const result: ParticipantEntry[] = registrations.map(reg => {
                const regData = reg.registration_data as any;
                const isFriend = regData?.type === 'friend';
                const profile = profileMap.get(reg.user_id);

                return {
                    id: `${reg.id}`,
                    regId: reg.id,
                    userId: reg.user_id,
                    nickname: isFriend
                        ? (regData?.nickname || 'Друг')
                        : (profile?.display_name || regData?.nickname || 'Гравець'),
                    realName: isFriend ? null : (profile as any)?.real_name || null,
                    avatarUrl: isFriend ? null : profile?.avatar_url || null,
                    type: isFriend ? 'friend' : 'self',
                    invitedBy: isFriend ? reg.user_id : undefined,
                    invitedByNickname: isFriend ? getInviterNickname(reg.user_id) : undefined,
                };
            });

            setEntries(result);
        } catch (error) {
            console.error('Error fetching participants:', error);
            setEntries([]);
        } finally {
            setLoading(false);
        }
    };

    const grouped = useMemo(() => {
        const selfEntries = entries.filter(e => e.type === 'self');
        const friendEntries = entries.filter(e => e.type === 'friend');

        const friendsByInviter = new Map<string, ParticipantEntry[]>();
        friendEntries.forEach(f => {
            const key = f.invitedBy || 'unknown';
            const arr = friendsByInviter.get(key) || [];
            arr.push(f);
            friendsByInviter.set(key, arr);
        });

        const result: Array<{ self: ParticipantEntry; friends: ParticipantEntry[] }> = [];

        selfEntries.forEach(s => {
            result.push({
                self: s,
                friends: friendsByInviter.get(s.userId) || [],
            });
            friendsByInviter.delete(s.userId);
        });

        friendsByInviter.forEach((friends, inviterId) => {
            const inviterNickname = friends[0]?.invitedByNickname || 'Гравець';
            result.push({
                self: {
                    id: `ghost-${inviterId}`,
                    regId: '',
                    userId: inviterId,
                    nickname: inviterNickname,
                    realName: null,
                    avatarUrl: null,
                    type: 'self',
                } as ParticipantEntry,
                friends,
            });
        });

        return result;
    }, [entries]);

    const filteredGrouped = useMemo(() => {
        if (!searchTerm) return grouped;
        const q = searchTerm.toLowerCase();
        return grouped.filter(g => {
            if (g.self.nickname.toLowerCase().includes(q)) return true;
            if (g.self.realName?.toLowerCase().includes(q)) return true;
            return g.friends.some(f => f.nickname.toLowerCase().includes(q));
        });
    }, [grouped, searchTerm]);

    const totalCount = entries.length;

    const handleViewUser = async (userId: string) => {
        setIsLoadingUserDetails(true);
        setLoadingUserId(userId);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('Не вдалося отримати сесію');

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
            if (!response.ok) throw new Error(data.error || 'Не вдалося завантажити профіль');

            setViewingUser(data);
        } catch (error: any) {
            toast({
                title: 'Помилка',
                description: error.message || 'Не вдалося завантажити профіль',
                variant: 'destructive',
            });
        } finally {
            setIsLoadingUserDetails(false);
            setLoadingUserId(null);
        }
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent
                    className="!flex !p-0 !gap-0 flex-col max-w-2xl bg-[#04070A]/90 border-white/10 backdrop-blur-md shadow-[0_0_50px_rgba(70,214,200,0.15)]"
                    onOpenAutoFocus={(e) => e.preventDefault()}
                    onInteractOutside={(e) => { if (viewingUser) e.preventDefault(); }}
                    onPointerDownOutside={(e) => { if (viewingUser) e.preventDefault(); }}
                >
                    {viewingUser && (
                        <div
                            className="absolute inset-0 z-[100] rounded-2xl"
                            style={{ cursor: 'none' }}
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
                        />
                    )}
                    <div className="p-4 border-b border-white/10 bg-[#04070A]/90 backdrop-blur-md z-10" data-custom-position>
                        <h3 className="text-lg font-display text-white tracking-[0.25em] uppercase">Учасники</h3>
                        <p className="text-sm font-bold text-amber-400">{eventTitle}</p>
                    </div>

                    <div className="p-4 border-b border-white/10 bg-white/5">
                        <div className="relative">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder={isAdmin ? 'Пошук за ніком або ім\'ям...' : 'Пошук гравця...'}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-black/50 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#46D6C8] transition-colors"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 custom-scrollbar min-h-[300px]">
                        {loading ? (
                            <div className="flex items-center justify-center h-full">
                                <RadarLoader label="LOADING…" size={60} />
                            </div>
                        ) : filteredGrouped.length > 0 ? (
                            filteredGrouped.map((group) => {
                                const isGhost = group.self.id.startsWith('ghost-');
                                return (
                                <div key={group.self.id}>
                                    {isGhost ? (
                                        <div className="flex items-center justify-between p-3 rounded-lg border-b border-white/5">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="h-10 w-10 rounded-full bg-gray-800/40 border border-dashed border-white/15 flex items-center justify-center text-sm font-bold text-gray-500 shrink-0">
                                                    {group.self.nickname?.[0]?.toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium text-gray-400 truncate">{group.self.nickname}</p>
                                                    <p className="text-xs text-gray-600">записав(-ла) {group.friends.length} друзів</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0 ml-2">
                                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                                    <UserPlus size={12} />
                                                    +{group.friends.length}
                                                </span>
                                                {isAdmin && (
                                                    <button
                                                        onClick={() => handleViewUser(group.self.userId)}
                                                        disabled={isLoadingUserDetails}
                                                        className="h-7 w-7 flex items-center justify-center rounded-md bg-black/40 border border-white/10 text-gray-400 hover:bg-[#46D6C8]/20 hover:text-[#46D6C8] hover:border-[#46D6C8]/40 hover:shadow-[0_0_10px_rgba(70,214,200,0.25)] transition-all duration-200 cursor-target"
                                                        tabIndex={0}
                                                        aria-label="Переглянути профіль"
                                                        title="Переглянути профіль"
                                                    >
                                                        {loadingUserId === group.self.userId ? (
                                                            <Loader2 size={14} className="animate-spin" />
                                                        ) : (
                                                            <Eye size={14} />
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between p-3 hover:bg-white/5 rounded-lg transition border-b border-white/5">
                                            <div className="flex items-center gap-4 min-w-0">
                                                {group.self.avatarUrl ? (
                                                    <img
                                                        src={group.self.avatarUrl}
                                                        alt={group.self.nickname}
                                                        className="h-10 w-10 rounded-full object-cover border border-white/10 shrink-0"
                                                    />
                                                ) : (
                                                    <div className="h-10 w-10 rounded-full bg-gray-800 border border-white/10 flex items-center justify-center text-sm font-bold text-[#46D6C8] shrink-0">
                                                        {group.self.nickname?.[0]?.toUpperCase()}
                                                    </div>
                                                )}
                                                <div className="min-w-0">
                                                    <p className="text-base font-bold text-white truncate">{group.self.nickname}</p>
                                                    {isAdmin && group.self.realName && (
                                                        <p className="text-xs text-gray-500 truncate">{group.self.realName}</p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 shrink-0 ml-2">
                                                {group.friends.length > 0 && (
                                                    <span className="text-xs text-gray-500 flex items-center gap-1">
                                                        <UserPlus size={12} />
                                                        +{group.friends.length}
                                                    </span>
                                                )}
                                                {isAdmin && (
                                                    <button
                                                        onClick={() => handleViewUser(group.self.userId)}
                                                        disabled={isLoadingUserDetails}
                                                        className="h-7 w-7 flex items-center justify-center rounded-md bg-black/40 border border-white/10 text-gray-400 hover:bg-[#46D6C8]/20 hover:text-[#46D6C8] hover:border-[#46D6C8]/40 hover:shadow-[0_0_10px_rgba(70,214,200,0.25)] transition-all duration-200 cursor-target"
                                                        tabIndex={0}
                                                        aria-label="Переглянути профіль"
                                                        title="Переглянути профіль"
                                                    >
                                                        {loadingUserId === group.self.userId ? (
                                                            <Loader2 size={14} className="animate-spin" />
                                                        ) : (
                                                            <Eye size={14} />
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Friend entries */}
                                    {group.friends.map((friend) => (
                                        <div
                                            key={friend.id}
                                            className="flex items-center justify-between p-3 pl-10 hover:bg-white/5 rounded-lg transition border-b border-white/5 last:border-0"
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="h-8 w-8 rounded-full bg-gray-800/60 border border-white/10 flex items-center justify-center text-xs font-bold text-gray-300 shrink-0">
                                                    {friend.nickname?.[0]?.toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium text-white/90 truncate">{friend.nickname}</p>
                                                    <p className="text-xs text-gray-400">
                                                        від <span className="text-gray-300">{group.self.nickname}</span>
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            );})
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-gray-500 space-y-3">
                                <Users size={48} className="opacity-20" />
                                <p className="text-sm">{searchTerm ? 'Нічого не знайдено' : 'Поки немає учасників'}</p>
                            </div>
                        )}
                    </div>

                    <div className="p-4 border-t border-white/10 bg-[#04070A] flex justify-between items-center">
                        <div className="text-sm text-gray-400 font-medium">
                            Всього:
                            <span className="text-white font-bold text-lg ml-2">{totalCount}</span>
                            <span className="mx-1 text-gray-600">/</span>
                            <span className="text-gray-500">{participantLimit > 0 ? participantLimit : "∞"}</span>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {viewingUser && (
                <UserProfileModal
                    user={viewingUser}
                    onClose={() => setViewingUser(null)}
                />
            )}
        </>
    );
}
