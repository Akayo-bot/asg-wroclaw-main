import { useState, useEffect, useCallback } from 'react';
import { Monitor, Smartphone, Tablet, LogOut, Loader2, ShieldCheck, RefreshCcw, Globe } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// ─── Types ───────────────────────────────────────────────────────────
interface SessionRow {
    id: string;
    created_at: string;
    updated_at: string;
    user_agent: string | null;
    ip: string | null;
}

interface ParsedDevice {
    os: string;
    browser: string;
    type: 'desktop' | 'mobile' | 'tablet';
}

// ─── Lightweight User-Agent parser (no external dependency) ──────────
const parseUserAgent = (ua: string | null): ParsedDevice => {
    if (!ua) return { os: 'Невідома ОС', browser: 'Невідомий браузер', type: 'desktop' };

    // Detect OS
    let os = 'Невідома ОС';
    if (/Windows/i.test(ua)) os = 'Windows';
    else if (/iPhone|iPad/i.test(ua)) os = /iPad/i.test(ua) ? 'iPadOS' : 'iOS';
    else if (/Macintosh|Mac OS X/i.test(ua)) os = 'macOS';
    else if (/Android/i.test(ua)) os = 'Android';
    else if (/Linux/i.test(ua)) os = 'Linux';
    else if (/CrOS/i.test(ua)) os = 'Chrome OS';

    // Detect browser (order matters — Edge contains "Chrome", etc.)
    let browser = 'Невідомий браузер';
    if (/Edg\//i.test(ua)) browser = 'Edge';
    else if (/OPR\//i.test(ua) || /Opera/i.test(ua)) browser = 'Opera';
    else if (/YaBrowser/i.test(ua)) browser = 'Yandex';
    else if (/SamsungBrowser/i.test(ua)) browser = 'Samsung Internet';
    else if (/Firefox/i.test(ua)) browser = 'Firefox';
    else if (/Chrome/i.test(ua) && !/Chromium/i.test(ua)) browser = 'Chrome';
    else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari';

    // Detect device type
    let type: ParsedDevice['type'] = 'desktop';
    if (/iPad|tablet/i.test(ua)) type = 'tablet';
    else if (/Mobile|iPhone|Android.*Mobile/i.test(ua)) type = 'mobile';

    return { os, browser, type };
};

// ─── Date formatter ─────────────────────────────────────────────────
const formatSessionDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60_000);
    const diffHours = Math.floor(diffMs / 3_600_000);
    const diffDays = Math.floor(diffMs / 86_400_000);

    if (diffMins < 1) return 'Щойно';
    if (diffMins < 60) return `${diffMins} хв. тому`;
    if (diffHours < 24) return `${diffHours} год. тому`;
    if (diffDays === 1) return 'Вчора';
    if (diffDays < 7) return `${diffDays} дн. тому`;

    return date.toLocaleDateString('uk-UA', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

// ─── Device icon component ──────────────────────────────────────────
const DeviceIcon = ({ type, isCurrent }: { type: ParsedDevice['type']; isCurrent: boolean }) => {
    const cls = `w-5 h-5 ${isCurrent ? 'text-emerald-400' : 'text-gray-400'}`;

    if (type === 'mobile') return <Smartphone className={cls} aria-hidden="true" />;
    if (type === 'tablet') return <Tablet className={cls} aria-hidden="true" />;
    return <Monitor className={cls} aria-hidden="true" />;
};

// ─── Component ──────────────────────────────────────────────────────
const ActiveSessions = () => {
    const [sessions, setSessions] = useState<SessionRow[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [revokingId, setRevokingId] = useState<string | null>(null);
    const [revokingAll, setRevokingAll] = useState(false);
    const { toast } = useToast();

    const fetchSessions = useCallback(async () => {
        try {
            setLoading(true);

            // Get current session ID
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                setCurrentSessionId(session.access_token ? session.user?.id : null);
                // Supabase JS SDK doesn't directly expose session.id,
                // but the RPC will return all sessions — we'll match by comparing
                // the newest one / user_agent with navigator.userAgent
            }

            // Fetch all active sessions via the secure RPC function
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data, error } = await (supabase.rpc as any)('get_active_sessions');

            if (error) throw error;
            if (data) {
                const rows = data as unknown as SessionRow[];
                setSessions(rows);

                // Try to identify the current session:
                // Match by user_agent + most recent updated_at
                if (rows.length > 0) {
                    const currentUA = navigator.userAgent;
                    const match = rows.find(s => s.user_agent === currentUA);
                    if (match) {
                        setCurrentSessionId(match.id);
                    } else {
                        // Fallback: most recently updated session is likely the current one
                        const sorted = [...rows].sort(
                            (a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime()
                        );
                        setCurrentSessionId(sorted[0]?.id || null);
                    }
                }
            }
        } catch (err) {
            console.error('Помилка завантаження сесій:', err);
            toast({
                title: 'Помилка',
                description: 'Не вдалося завантажити активні сесії.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchSessions();
    }, [fetchSessions]);

    const handleRevokeSession = async (sessionId: string) => {
        try {
            setRevokingId(sessionId);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error } = await (supabase.rpc as any)('delete_session', { target_session_id: sessionId });
            if (error) throw error;

            toast({
                title: 'Готово',
                description: 'Сеанс успішно завершено.',
            });
            setSessions(prev => prev.filter(s => s.id !== sessionId));
        } catch (err) {
            console.error('Помилка завершення сесії:', err);
            toast({
                title: 'Помилка',
                description: 'Не вдалося завершити сеанс.',
                variant: 'destructive',
            });
        } finally {
            setRevokingId(null);
        }
    };

    const handleRevokeAllOthers = async () => {
        const otherSessions = sessions.filter(s => s.id !== currentSessionId);
        if (otherSessions.length === 0) return;

        try {
            setRevokingAll(true);
            let failCount = 0;

            for (const session of otherSessions) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const { error } = await (supabase.rpc as any)('delete_session', { target_session_id: session.id });
                if (error) failCount++;
            }

            if (failCount === 0) {
                toast({
                    title: 'Готово',
                    description: `Завершено ${otherSessions.length} сеанс(ів).`,
                });
            } else {
                toast({
                    title: 'Частково завершено',
                    description: `${otherSessions.length - failCount} з ${otherSessions.length} сеансів завершено.`,
                    variant: 'destructive',
                });
            }

            setSessions(prev => prev.filter(s => s.id === currentSessionId));
        } catch (err) {
            console.error('Помилка завершення сесій:', err);
            toast({
                title: 'Помилка',
                description: 'Не вдалося завершити сеанси.',
                variant: 'destructive',
            });
        } finally {
            setRevokingAll(false);
        }
    };

    // ── Loading state ────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="flex items-center justify-center gap-3 p-8 border border-white/10 rounded-xl bg-[#04070A]">
                <Loader2 className="animate-spin text-emerald-400" size={20} />
                <span className="text-sm text-neutral-400">Завантаження сесій…</span>
            </div>
        );
    }

    // ── Empty state ──────────────────────────────────────────────────
    if (sessions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center gap-3 p-8 border border-white/10 rounded-xl bg-[#04070A] text-center">
                <Globe className="w-8 h-8 text-neutral-600" />
                <p className="text-sm text-neutral-500">Немає активних сесій</p>
                <button
                    type="button"
                    onClick={fetchSessions}
                    className="mt-1 flex items-center gap-1.5 text-xs text-emerald-400/70 hover:text-emerald-400 transition-colors"
                    aria-label="Оновити список сесій"
                    tabIndex={0}
                >
                    <RefreshCcw className="w-3.5 h-3.5" />
                    Оновити
                </button>
            </div>
        );
    }

    // ── Sessions list ────────────────────────────────────────────────
    return (
        <div className="space-y-3">
            {/* Refresh button */}
            <div className="flex justify-end">
                <button
                    type="button"
                    onClick={fetchSessions}
                    className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-emerald-400 transition-colors"
                    aria-label="Оновити список сесій"
                    tabIndex={0}
                >
                    <RefreshCcw className="w-3.5 h-3.5" />
                    Оновити
                </button>
            </div>

            {sessions.map((session) => {
                const isCurrent = session.id === currentSessionId;
                const { os, browser, type } = parseUserAgent(session.user_agent);
                const isRevoking = revokingId === session.id;

                return (
                    <div
                        key={session.id}
                        className={`
                            flex flex-col sm:flex-row sm:items-center justify-between
                            p-4 rounded-xl border transition-all duration-300
                            ${isCurrent
                                ? 'bg-emerald-500/5 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.06)]'
                                : 'bg-[#04070A] border-white/10 hover:border-white/20'
                            }
                        `}
                    >
                        <div className="flex items-start sm:items-center gap-4">
                            {/* Device icon */}
                            <div
                                className={`p-3 rounded-lg shrink-0 ${
                                    isCurrent ? 'bg-emerald-500/10' : 'bg-white/5'
                                }`}
                            >
                                <DeviceIcon type={type} isCurrent={isCurrent} />
                            </div>

                            {/* Info */}
                            <div className="min-w-0">
                                <p className="text-sm font-bold text-white flex flex-wrap items-center gap-2">
                                    <span className="truncate">{os} · {browser}</span>
                                    {isCurrent && (
                                        <span className="inline-flex items-center gap-1 shrink-0 text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded border border-emerald-500/30 uppercase tracking-wide">
                                            <ShieldCheck size={10} aria-hidden="true" />
                                            Поточна
                                        </span>
                                    )}
                                </p>

                                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-xs text-gray-500">
                                    {session.ip && (
                                        <>
                                            <span>IP: {session.ip}</span>
                                            <span className="w-1 h-1 rounded-full bg-gray-700 hidden sm:block" aria-hidden="true" />
                                        </>
                                    )}
                                    <span>
                                        Вхід: {formatSessionDate(session.created_at)}
                                    </span>
                                    {session.updated_at && session.updated_at !== session.created_at && (
                                        <>
                                            <span className="w-1 h-1 rounded-full bg-gray-700 hidden sm:block" aria-hidden="true" />
                                            <span>
                                                Активність: {formatSessionDate(session.updated_at)}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Revoke button (only for non-current sessions) */}
                        {!isCurrent && (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <button
                                        type="button"
                                        disabled={isRevoking}
                                        className="mt-3 sm:mt-0 self-end sm:self-auto p-2.5 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20 disabled:opacity-50 disabled:pointer-events-none shrink-0"
                                        aria-label={`Завершити сеанс ${os} · ${browser}`}
                                        tabIndex={0}
                                    >
                                        {isRevoking ? (
                                            <Loader2 className="w-[18px] h-[18px] animate-spin" />
                                        ) : (
                                            <LogOut className="w-[18px] h-[18px]" />
                                        )}
                                    </button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="border-white/10 bg-[#0a0f0d]">
                                    <AlertDialogHeader>
                                        <AlertDialogTitle className="text-emerald-100">
                                            Завершити сеанс?
                                        </AlertDialogTitle>
                                        <AlertDialogDescription className="text-neutral-400">
                                            Пристрій <span className="text-white font-medium">{os} · {browser}</span> буде
                                            розлогінений. Якщо це ви — доведеться увійти знову.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel className="border-white/10 hover:bg-white/5">
                                            Скасувати
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={() => handleRevokeSession(session.id)}
                                            className="bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 hover:text-red-300"
                                        >
                                            <LogOut className="w-4 h-4 mr-1.5" />
                                            Завершити
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}
                    </div>
                );
            })}

            {/* Revoke all other sessions button */}
            {sessions.filter(s => s.id !== currentSessionId).length > 0 && (
                <div className="pt-2">
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <button
                                type="button"
                                disabled={revokingAll}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-red-400 bg-red-500/5 hover:bg-red-500/10 border border-red-500/15 hover:border-red-500/25 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none"
                                aria-label="Вийти з усіх інших пристроїв"
                                tabIndex={0}
                            >
                                {revokingAll ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <LogOut className="w-4 h-4" />
                                )}
                                Вийти з усіх інших пристроїв
                            </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="border-white/10 bg-[#0a0f0d]">
                            <AlertDialogHeader>
                                <AlertDialogTitle className="text-emerald-100">
                                    Вийти з усіх пристроїв?
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-neutral-400">
                                    Усі сеанси, крім поточного, будуть завершені.
                                    Вам доведеться увійти знову на кожному пристрої.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel className="border-white/10 hover:bg-white/5">
                                    Скасувати
                                </AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={handleRevokeAllOthers}
                                    className="bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 hover:text-red-300"
                                >
                                    <LogOut className="w-4 h-4 mr-1.5" />
                                    Завершити всі
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            )}
        </div>
    );
};

export default ActiveSessions;
