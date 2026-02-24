import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Users, Edit, UserPlus, Check, Loader2, X, Settings } from 'lucide-react';
import { Event } from '../../types/Event';
import EventDetailsModal from './EventDetailsModal';
import ParticipantsModal from './ParticipantsModal';
import { AnimatedDeleteButton } from '../admin/AnimatedDeleteButton';
import { GlassConfirmDialog } from '@/components/ui/GlassConfirmDialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface EventCardProps {
    event: Event;
    onEdit?: () => void;
    onDelete?: () => void;
    onStatusChange?: (status: string) => void;
}

interface MyRegistration {
    id: string;
    type: 'self' | 'friend';
    nickname: string;
}

const EventCard: React.FC<EventCardProps> = ({ event, onEdit, onDelete, onStatusChange }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isParticipantsModalOpen, setIsParticipantsModalOpen] = useState(false);
    const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
    const [isFriendModalOpen, setIsFriendModalOpen] = useState(false);
    const [isManageModalOpen, setIsManageModalOpen] = useState(false);
    const [isSelfCancelOpen, setIsSelfCancelOpen] = useState(false);
    const [friendNickname, setFriendNickname] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const [isRegisteringFriend, setIsRegisteringFriend] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isHoveringRegistered, setIsHoveringRegistered] = useState(false);
    const [myRegistrations, setMyRegistrations] = useState<MyRegistration[]>([]);
    const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());

    const { user, profile } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();

    const isAdmin = !!(onEdit || onDelete || onStatusChange);
    const canRegister = event.status === 'Open' || event.status === 'Announced';

    const statusBadgeClass =
        event.status === 'Open' ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' :
        event.status === 'Full' ? 'bg-amber-500/20 border-amber-500/30 text-amber-400' :
        event.status === 'Canceled' ? 'bg-rose-500/20 border-rose-500/30 text-rose-400' :
        event.status === 'Announced' ? 'bg-blue-500/20 border-blue-500/30 text-blue-400' :
        'bg-slate-500/20 border-slate-500/30 text-slate-400';

    useEffect(() => {
        if (user && !isAdmin) {
            checkExistingRegistration();
        }
    }, [user, event.id]);

    const checkExistingRegistration = async () => {
        if (!user) return;
        try {
            const { data } = await supabase
                .from('event_registrations')
                .select('id, registration_data')
                .eq('event_id', event.id)
                .eq('user_id', user.id)
                .eq('status', 'approved');

            if (data && data.length > 0) {
                setMyRegistrations(data.map((r: any) => ({
                    id: r.id,
                    type: r.registration_data?.type === 'friend' ? 'friend' : 'self',
                    nickname: r.registration_data?.type === 'friend'
                        ? (r.registration_data?.nickname || 'Друг')
                        : 'Я',
                })));
            } else {
                setMyRegistrations([]);
            }
        } catch (error) {
            console.error('Check registration error:', error);
        }
    };

    const handleRegisterSelf = async () => {
        if (!user) {
            toast({ title: 'Авторизація', description: 'Увійдіть, щоб записатись на гру', variant: 'destructive' });
            navigate('/auth');
            return;
        }

        setIsRegistering(true);
        try {
            const { data: existing } = await supabase
                .from('event_registrations')
                .select('id, registration_data')
                .eq('event_id', event.id)
                .eq('user_id', user.id);

            const existingSelfReg = (existing || []).find((r: any) => r.registration_data?.type !== 'friend');
            if (existingSelfReg) {
                toast({ title: 'Ви вже записані', description: 'Ви вже зареєстровані на цю гру' });
                await checkExistingRegistration();
                return;
            }

            const { error } = await supabase
                .from('event_registrations')
                .insert({
                    event_id: event.id,
                    user_id: user.id,
                    status: 'approved',
                    registration_data: { type: 'self' },
                });

            if (error) throw error;

            await checkExistingRegistration();
            toast({ title: 'Успішно!', description: 'Вас записано на гру' });
        } catch (error) {
            console.error('Registration error:', error);
            toast({ title: 'Помилка', description: 'Не вдалося записатись', variant: 'destructive' });
        } finally {
            setIsRegistering(false);
        }
    };

    const handleRegisterFriend = async () => {
        if (!friendNickname.trim()) return;

        if (!user) {
            toast({ title: 'Авторизація', description: 'Увійдіть, щоб записати друга', variant: 'destructive' });
            navigate('/auth');
            return;
        }

        setIsRegisteringFriend(true);
        try {
            const { error } = await supabase
                .from('event_registrations')
                .insert({
                    event_id: event.id,
                    user_id: user.id,
                    status: 'approved',
                    registration_data: { type: 'friend', nickname: friendNickname.trim() },
                });

            if (error) throw error;

            toast({ title: 'Успішно!', description: `${friendNickname.trim()} записаний на гру` });
            setFriendNickname('');
            setIsFriendModalOpen(false);
            await checkExistingRegistration();
        } catch (error) {
            console.error('Friend registration error:', error);
            toast({ title: 'Помилка', description: 'Не вдалося записати друга', variant: 'destructive' });
        } finally {
            setIsRegisteringFriend(false);
        }
    };

    const hasSelf = myRegistrations.some(r => r.type === 'self');
    const hasFriends = myRegistrations.some(r => r.type === 'friend');
    const hasAnyRegistrations = myRegistrations.length > 0;
    const selfReg = myRegistrations.find(r => r.type === 'self');
    const selfEntryId = selfReg?.id || 'new-self';

    const handleManageClick = () => {
        setCheckedIds(new Set(myRegistrations.map(r => r.id)));
        setIsManageModalOpen(true);
    };

    const handleToggle = (id: string) => {
        setCheckedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleConfirmSelfCancel = async () => {
        if (!selfReg) return;
        try {
            const { error } = await supabase
                .from('event_registrations')
                .delete()
                .eq('id', selfReg.id);
            if (error) throw error;
            await checkExistingRegistration();
            toast({ title: 'Готово', description: 'Ваш запис скасовано' });
        } catch (error) {
            console.error('Self cancel error:', error);
            toast({ title: 'Помилка', description: 'Не вдалося скасувати запис', variant: 'destructive' });
        }
    };

    const handleSaveManagement = async () => {
        setIsSaving(true);
        try {
            const toRemove = myRegistrations.filter(r => !checkedIds.has(r.id)).map(r => r.id);
            const needAddSelf = checkedIds.has('new-self');

            if (toRemove.length > 0) {
                const { error } = await supabase
                    .from('event_registrations')
                    .delete()
                    .in('id', toRemove);
                if (error) throw error;
            }

            if (needAddSelf) {
                const { error } = await supabase
                    .from('event_registrations')
                    .insert({
                        event_id: event.id,
                        user_id: user!.id,
                        status: 'approved',
                        registration_data: { type: 'self' },
                    });
                if (error) throw error;
            }

            await checkExistingRegistration();
            setIsManageModalOpen(false);
            toast({ title: 'Збережено', description: 'Записи оновлено' });
        } catch (error) {
            console.error('Save management error:', error);
            toast({ title: 'Помилка', description: 'Не вдалося зберегти зміни', variant: 'destructive' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <>
            <div className="group/card relative flex flex-col h-full bg-[#04070A]/40 backdrop-blur-sm border border-white/5 rounded-2xl overflow-hidden hover:border-[#46D6C8]/30 transition-all duration-300 hover:shadow-[0_0_30px_rgba(70,214,200,0.1)]">

                <div className="relative h-48 overflow-hidden">
                    <img src={event.image_url} alt={event.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#04070A] via-transparent to-transparent opacity-90" />

                    {onStatusChange ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-md border transition-all cursor-pointer hover:scale-105 active:scale-95 ${statusBadgeClass}`}>
                                    {event.status}
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-[#04070A]/95 border-[#46D6C8]/20 backdrop-blur-xl min-w-[140px]">
                                <DropdownMenuItem onSelect={() => onStatusChange('upcoming')} className="text-gray-500 focus:bg-[#46D6C8]/10 focus:text-[#46D6C8] cursor-pointer font-medium">
                                    <span className="w-2 h-2 rounded-full bg-blue-500 mr-2" /> Анонс
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => onStatusChange('registration_open')} className="text-gray-500 focus:bg-[#46D6C8]/10 focus:text-emerald-400 cursor-pointer font-medium">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2" /> Відкрито
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => onStatusChange('registration_closed')} className="text-gray-500 focus:bg-[#46D6C8]/10 focus:text-amber-400 cursor-pointer font-medium">
                                    <span className="w-2 h-2 rounded-full bg-amber-500 mr-2" /> Місць немає
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => onStatusChange('completed')} className="text-gray-500 focus:bg-[#46D6C8]/10 focus:text-slate-400 cursor-pointer font-medium">
                                    <span className="w-2 h-2 rounded-full bg-slate-400 mr-2" /> Завершено
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-white/10" />
                                <DropdownMenuItem onSelect={() => setIsCancelConfirmOpen(true)} className="text-gray-500 focus:bg-rose-500/10 focus:text-rose-400 cursor-pointer font-medium">
                                    <span className="w-2 h-2 rounded-full bg-rose-500 mr-2" /> Скасовано
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <span className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-md border ${statusBadgeClass}`}>
                            {event.status}
                        </span>
                    )}
                </div>

                <div className="p-4 space-y-3 flex-1 flex flex-col">
                    <h2 className="text-xl font-bold text-amber-400 leading-tight truncate">{event.title}</h2>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <Calendar size={16} className="text-[#46D6C8]" />
                            <p className="text-sm font-bold text-[#C2C2C2]">{event.date} • {event.start_time}</p>
                        </div>
                        {onEdit && onDelete && (
                            <div className="flex gap-2 opacity-0 group-hover/card:opacity-100 transition-opacity duration-200">
                                <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="group/edit h-7 w-7 flex items-center justify-center p-0 rounded-md bg-sky-500/10 border border-sky-400/30 text-sky-300 hover:bg-sky-500/20 hover:shadow-[0_0_10px_rgba(56,189,248,.35)] transition-all duration-200 cursor-target" aria-label="Редагувати">
                                    <Edit className="h-4 w-4 transition-transform duration-200 group-hover/edit:animate-edit-write group-hover/edit:drop-shadow-[0_0_6px_rgba(56,189,248,.8)]" />
                                </button>
                                <div onClick={(e) => e.stopPropagation()}>
                                    <AnimatedDeleteButton onClick={onDelete} size="xs" />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center space-x-2 group/location cursor-pointer">
                        <MapPin size={18} className="text-[#46D6C8] group-hover/location:scale-110 transition" />
                        {event.location_map_url && event.location_map_url !== '#' ? (
                            <a href={event.location_map_url} target="_blank" rel="noopener noreferrer" className="relative text-[#C2C2C2] font-medium transition truncate inline-block after:content-[''] after:absolute after:bottom-0 after:left-0 after:h-[1px] after:w-0 after:bg-[#46D6C8] hover:after:w-full after:transition-all after:duration-300">
                                {event.location_name}
                            </a>
                        ) : (
                            <span className="text-[#C2C2C2] font-medium truncate cursor-default">{event.location_name}</span>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 py-2 border-t border-white/5 border-b mb-auto">
                        <div className="text-center p-2 rounded-lg bg-white/5">
                            <p className="text-xs text-gray-400 uppercase">Гравців</p>
                            <p className="text-sm font-semibold text-white">
                                {event.participants_registered} / {event.participant_limit > 0 ? event.participant_limit : '∞'}
                            </p>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-white/5">
                            <p className="text-xs text-gray-400 uppercase">Внесок</p>
                            <p className="text-sm font-semibold text-white">{event.price} {event.currency}</p>
                        </div>
                    </div>

                    <div className="pt-1 grid grid-cols-2 gap-3 mt-auto">
                        <button onClick={() => setIsModalOpen(true)} tabIndex={0} aria-label="Деталі" className="flex items-center justify-center py-2 rounded-lg font-semibold text-sm border border-[#46D6C8]/50 text-[#46D6C8] hover:bg-[#46D6C8]/10 transition-all cursor-target">
                            Деталі
                        </button>
                        <button onClick={() => setIsParticipantsModalOpen(true)} tabIndex={0} aria-label="Учасники" className="flex items-center justify-center py-2 rounded-lg font-semibold text-sm bg-gray-700 text-white hover:bg-gray-600 transition-all cursor-target">
                            <Users size={16} className="mr-2" /> Учасники
                        </button>
                    </div>

                    {!isAdmin && canRegister && (
                        <div className="grid grid-cols-4 gap-3 mt-1">
                            {hasAnyRegistrations ? (
                                hasFriends ? (
                                    <button
                                        onClick={handleManageClick}
                                        tabIndex={0}
                                        aria-label="Управління записом"
                                        className="col-span-3 py-3 rounded-lg text-sm font-bold uppercase tracking-wide transition-all cursor-target bg-[#46D6C8]/15 border border-[#46D6C8]/30 text-[#46D6C8] hover:bg-[#46D6C8]/25 hover:shadow-[0_0_15px_rgba(70,214,200,0.15)]"
                                    >
                                        <span className="flex items-center justify-center gap-2">
                                            <Settings size={18} /> Управління записом
                                        </span>
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => setIsSelfCancelOpen(true)}
                                        onMouseEnter={() => setIsHoveringRegistered(true)}
                                        onMouseLeave={() => setIsHoveringRegistered(false)}
                                        tabIndex={0}
                                        aria-label={isHoveringRegistered ? 'Скасувати запис' : 'Записано'}
                                        className={`col-span-3 py-3 rounded-lg text-sm font-bold uppercase tracking-wide transition-all cursor-target ${
                                            isHoveringRegistered
                                                ? 'bg-rose-500/20 border border-rose-500/40 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.15)]'
                                                : 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'
                                        }`}
                                    >
                                        {isHoveringRegistered ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <X size={18} /> Скасувати запис
                                            </span>
                                        ) : (
                                            <span className="flex items-center justify-center gap-2">
                                                <Check size={18} /> Записано
                                            </span>
                                        )}
                                    </button>
                                )
                            ) : (
                                <button
                                    onClick={handleRegisterSelf}
                                    disabled={isRegistering}
                                    tabIndex={0}
                                    aria-label="Записатись на гру"
                                    className="col-span-3 py-3 bg-[#46D6C8] text-black hover:bg-[#3bc4b6] rounded-lg text-sm font-bold uppercase tracking-wide transition-all shadow-[0_0_15px_rgba(70,214,200,0.2)] hover:shadow-[0_0_25px_rgba(70,214,200,0.4)] active:scale-[0.98] cursor-target disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {isRegistering ? (
                                        <Loader2 size={18} className="animate-spin mx-auto" />
                                    ) : (
                                        'Записатись на гру'
                                    )}
                                </button>
                            )}

                            <button
                                onClick={() => setIsFriendModalOpen(true)}
                                tabIndex={0}
                                title="Записати друга / +1"
                                aria-label="Записати друга"
                                className="col-span-1 flex items-center justify-center bg-white/5 border border-white/10 hover:border-[#46D6C8]/50 hover:text-[#46D6C8] text-gray-400 rounded-lg transition-all group/friend cursor-target"
                            >
                                <UserPlus size={20} className="group-hover/friend:scale-110 transition-transform" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <EventDetailsModal event={event} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

            <ParticipantsModal
                isOpen={isParticipantsModalOpen}
                onClose={() => setIsParticipantsModalOpen(false)}
                eventTitle={event.title}
                eventId={event.id}
                participantLimit={event.participant_limit}
            />

            <GlassConfirmDialog
                open={isCancelConfirmOpen}
                onOpenChange={setIsCancelConfirmOpen}
                title="Скасувати подію"
                description="Ви впевнені, що хочете скасувати цю подію?"
                confirmLabel="Скасувати подію"
                cancelLabel="Назад"
                variant="destructive"
                onConfirm={() => { onStatusChange?.('cancelled'); }}
            />

            {/* Friend registration modal */}
            <Dialog open={isFriendModalOpen} onOpenChange={setIsFriendModalOpen}>
                <DialogContent className="max-w-md bg-[#04070A]/95 border-white/10 backdrop-blur-xl shadow-[0_0_50px_rgba(70,214,200,0.15)]">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-display text-white">Записати друга на гру</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-gray-400 mb-4">
                        Вкажіть нікнейм або ім'я друга для реєстрації на <span className="text-amber-400 font-medium">{event.title}</span>
                    </p>
                    <input
                        type="text"
                        value={friendNickname}
                        onChange={(e) => setFriendNickname(e.target.value)}
                        placeholder="Нікнейм або ім'я друга"
                        className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[#46D6C8]/50 focus:ring-1 focus:ring-[#46D6C8]/50 transition-all"
                        onKeyDown={(e) => { if (e.key === 'Enter') handleRegisterFriend(); }}
                    />
                    <div className="flex gap-3 mt-4">
                        <button onClick={() => setIsFriendModalOpen(false)} className="flex-1 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all cursor-target text-sm font-medium" tabIndex={0} aria-label="Скасувати">
                            Скасувати
                        </button>
                        <button onClick={handleRegisterFriend} disabled={!friendNickname.trim() || isRegisteringFriend} className="flex-1 py-2.5 rounded-lg bg-[#46D6C8] text-black font-bold text-sm hover:bg-[#3bc4b6] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-target" tabIndex={0} aria-label="Записати">
                            {isRegisteringFriend ? <Loader2 size={18} className="animate-spin mx-auto" /> : 'Записати'}
                        </button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isManageModalOpen} onOpenChange={setIsManageModalOpen}>
                <DialogContent className="max-w-md bg-[#04070A]/95 border-white/10 backdrop-blur-xl shadow-[0_0_50px_rgba(70,214,200,0.15)]">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-display text-white">Управління записом</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-gray-400 mb-4">
                        Оберіть учасників гри <span className="text-amber-400 font-medium">{event.title}</span>
                    </p>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {(() => {
                            const isChecked = checkedIds.has(selfEntryId);
                            return (
                                <label
                                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                                        isChecked
                                            ? 'border-[#46D6C8]/40 bg-[#46D6C8]/10'
                                            : 'border-white/10 bg-white/5 hover:bg-white/10'
                                    }`}
                                >
                                    <input type="checkbox" checked={isChecked} onChange={() => handleToggle(selfEntryId)} className="sr-only" />
                                    <div className={`h-5 w-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                                        isChecked ? 'border-[#46D6C8] bg-[#46D6C8]/30' : 'border-white/20 bg-transparent'
                                    }`}>
                                        {isChecked && <Check size={14} className="text-[#46D6C8]" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-white truncate">
                                            Я <span className="text-gray-400">({profile?.display_name || 'Гравець'})</span>
                                        </p>
                                        <p className="text-xs text-gray-500">{hasSelf ? 'Ваш запис' : 'Не записано'}</p>
                                    </div>
                                </label>
                            );
                        })()}
                        {myRegistrations.filter(r => r.type === 'friend').map((reg) => {
                            const isChecked = checkedIds.has(reg.id);
                            return (
                                <label
                                    key={reg.id}
                                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                                        isChecked
                                            ? 'border-[#46D6C8]/40 bg-[#46D6C8]/10'
                                            : 'border-white/10 bg-white/5 hover:bg-white/10'
                                    }`}
                                >
                                    <input type="checkbox" checked={isChecked} onChange={() => handleToggle(reg.id)} className="sr-only" />
                                    <div className={`h-5 w-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                                        isChecked ? 'border-[#46D6C8] bg-[#46D6C8]/30' : 'border-white/20 bg-transparent'
                                    }`}>
                                        {isChecked && <Check size={14} className="text-[#46D6C8]" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-white truncate">{reg.nickname}</p>
                                        <p className="text-xs text-gray-500">Друг</p>
                                    </div>
                                </label>
                            );
                        })}
                    </div>
                    <div className="flex gap-3 mt-4">
                        <button onClick={() => setIsManageModalOpen(false)} className="flex-1 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all cursor-target text-sm font-medium" tabIndex={0} aria-label="Назад">
                            Назад
                        </button>
                        <button
                            onClick={handleSaveManagement}
                            disabled={isSaving}
                            className="flex-1 py-2.5 rounded-lg bg-[#46D6C8]/20 border border-[#46D6C8]/40 text-[#46D6C8] font-bold text-sm hover:bg-[#46D6C8]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-target"
                            tabIndex={0}
                            aria-label="Зберегти"
                        >
                            {isSaving ? <Loader2 size={18} className="animate-spin mx-auto" /> : 'Зберегти'}
                        </button>
                    </div>
                </DialogContent>
            </Dialog>

            <GlassConfirmDialog
                open={isSelfCancelOpen}
                onOpenChange={setIsSelfCancelOpen}
                title="Скасувати запис"
                description={`Ви впевнені, що хочете скасувати свій запис на "${event.title}"?`}
                confirmLabel="Скасувати запис"
                cancelLabel="Назад"
                variant="destructive"
                onConfirm={handleConfirmSelfCancel}
            />
        </>
    );
};

export default EventCard;
