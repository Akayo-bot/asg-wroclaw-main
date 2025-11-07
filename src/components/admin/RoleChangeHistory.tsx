import React, { useMemo, useState } from "react";
import {
    ArrowDown,
    ArrowUp,
    Clock,
    Filter,
    Info,
    MessageSquare,
    Search,
    User,
    UserCog,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { RolePill } from "@/components/admin/RolePill";

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
    };
    changer_profile?: {
        id: string;
        display_name: string | null;
        avatar_url?: string | null;
        is_system?: boolean;
    };
};

type ChangeType = "promotion" | "demotion" | "system" | "lateral";

const getChangeType = (item: RoleChange): ChangeType => {
    if (item.changer_profile?.is_system) return "system";
    const ranks = ["user", "editor", "admin", "superadmin"] as const;
    const oldIndex = item.old_role ? ranks.indexOf(item.old_role as any) : -1;
    const newIndex = ranks.indexOf(item.new_role as any);

    if (oldIndex === -1) return "lateral";

    const delta = newIndex - oldIndex;
    if (delta > 0) return "promotion";
    if (delta < 0) return "demotion";
    return "lateral";
};

const BadgeComponent = ({
    children,
    tone = "neutral",
}: {
    children: React.ReactNode;
    tone?: "neutral" | "success" | "danger" | "warning";
}) => {
    const tones: Record<string, string> = {
        neutral: "bg-muted/50 text-muted-foreground border border-border",
        success: "bg-primary/10 text-primary border border-primary/20",
        danger: "bg-destructive/10 text-destructive border border-destructive/20",
        warning: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    };
    return (
        <span
            className={`px-2 py-1 rounded-md text-xs font-medium ${tones[tone]}`}
        >
            {children}
        </span>
    );
};

const Avatar = ({ url, alt }: { url?: string | null; alt: string }) => {
    return url ? (
        <img src={url} alt={alt} className="h-8 w-8 rounded-full object-cover border border-border" />
    ) : (
        <div className="h-8 w-8 rounded-full bg-muted border border-border grid place-items-center">
            <User className="h-4 w-4 text-muted-foreground" />
        </div>
    );
};

const RoleCard = ({ item }: { item: RoleChange }) => {
    const type = getChangeType(item);
    const isSystem = type === "system";
    const tone =
        type === "promotion"
            ? "success"
            : type === "demotion"
                ? "danger"
                : isSystem
                    ? "warning"
                    : "neutral";

    const Icon =
        type === "promotion"
            ? ArrowUp
            : type === "demotion"
                ? ArrowDown
                : UserCog;

    const targetName = item.target_profile?.display_name || "Unknown User";
    const changerName = item.changer_profile?.display_name || "System";

    return (
        <div className="group relative overflow-hidden rounded-lg border border-border bg-card/50 backdrop-blur-sm p-4 hover:bg-card/70 transition-all duration-300">
            {/* верхняя строка */}
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    <Avatar url={item.target_profile?.avatar_url} alt={targetName} />
                    <div>
                        <div className="text-xs text-muted-foreground">User</div>
                        <div className="font-semibold text-foreground">@{targetName}</div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <BadgeComponent tone={tone}>
                        {type === "promotion" && "Promotion"}
                        {type === "demotion" && "Demotion"}
                        {type === "system" && "System"}
                        {type === "lateral" && "Role Updated"}
                    </BadgeComponent>
                </div>
            </div>

            {/* основное содержимое */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-lg bg-muted/30 p-3 border border-border/50">
                    <div className="text-xs text-muted-foreground mb-1">Old Role</div>
                    <div className="flex items-center gap-2">
                        {item.old_role ? (
                            <RolePill role={item.old_role} />
                        ) : (
                            <span className="text-neutral-400 italic">none</span>
                        )}
                    </div>
                </div>
                <div className="rounded-lg bg-muted/30 p-3 border border-border/50">
                    <div className="text-xs text-muted-foreground mb-1">New Role</div>
                    <div className="flex items-center gap-2">
                        <Icon
                            className={`h-4 w-4 ${type === "promotion"
                                    ? "text-primary"
                                    : type === "demotion"
                                        ? "text-destructive"
                                        : "text-muted-foreground"
                                }`}
                        />
                        <RolePill role={item.new_role} />
                    </div>
                </div>
                <div className="rounded-lg bg-muted/30 p-3 border border-border/50">
                    <div className="text-xs text-muted-foreground mb-1">Changed By</div>
                    <div className="flex items-center gap-2 text-foreground">
                        <Avatar url={item.changer_profile?.avatar_url} alt={changerName} />
                        <span className="font-medium text-sm">@{changerName}</span>
                        {item.changer_profile?.is_system && <BadgeComponent tone="warning">system</BadgeComponent>}
                    </div>
                </div>
            </div>

            {/* футер */}
            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    {new Date(item.created_at).toLocaleString()}
                </span>
                {item.reason && (
                    <span className="inline-flex items-center gap-1.5 text-amber-400/80">
                        <MessageSquare className="h-3.5 w-3.5" />
                        Reason: {item.reason}
                    </span>
                )}
            </div>

            {/* градиент при hover */}
            <div
                className="pointer-events-none absolute -inset-px opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"
                style={{
                    background:
                        "radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), hsl(var(--primary) / 0.08), transparent 40%)",
                }}
            />
        </div>
    );
};

/** Главный компонент */
const RoleChangeHistory = ({
    data,
    className = "",
}: {
    data: RoleChange[];
    className?: string;
}) => {
    const [q, setQ] = useState("");
    const [filter, setFilter] = useState<
        "all" | "promotions" | "demotions" | "system"
    >("all");
    const [sort, setSort] = useState<"newest" | "oldest">("newest");

    const filtered = useMemo(() => {
        let list = [...data];
        if (q.trim()) {
            const t = q.trim().toLowerCase();
            list = list.filter(
                (i) =>
                    i.target_profile?.display_name?.toLowerCase().includes(t) ||
                    i.changer_profile?.display_name?.toLowerCase().includes(t) ||
                    i.target_user_id.toLowerCase().includes(t)
            );
        }
        if (filter !== "all") {
            list = list.filter((i) => {
                const t = getChangeType(i);
                return (
                    (filter === "promotions" && t === "promotion") ||
                    (filter === "demotions" && t === "demotion") ||
                    (filter === "system" && t === "system")
                );
            });
        }
        list.sort((a, b) =>
            sort === "newest"
                ? +new Date(b.created_at) - +new Date(a.created_at)
                : +new Date(a.created_at) - +new Date(b.created_at)
        );
        return list;
    }, [data, q, filter, sort]);

    return (
        <section className={className}>
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-xl font-bold text-foreground font-rajdhani">Role Change History</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Recent role changes in the system
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <label className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-foreground backdrop-blur-sm">
                        <Search className="h-4 w-4 text-muted-foreground" />
                        <input
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Search users…"
                            className="bg-transparent outline-none placeholder:text-muted-foreground text-sm w-40"
                        />
                    </label>

                    <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/30 p-1">
                        {[
                            { k: "all", label: "All" },
                            { k: "promotions", label: "Promotions" },
                            { k: "demotions", label: "Demotions" },
                            { k: "system", label: "System" },
                        ].map(({ k, label }) => (
                            <button
                                key={k}
                                onClick={() => setFilter(k as any)}
                                className={`px-3 py-1.5 text-xs rounded-md transition-all duration-200 font-medium ${filter === k
                                        ? "bg-primary text-primary-foreground shadow-sm"
                                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                    }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-foreground backdrop-blur-sm">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                        <select
                            value={sort}
                            onChange={(e) => setSort(e.target.value as any)}
                            className="bg-transparent text-sm outline-none cursor-pointer"
                        >
                            <option value="newest" className="bg-card text-foreground">Newest first</option>
                            <option value="oldest" className="bg-card text-foreground">Oldest first</option>
                        </select>
                    </div>
                </div>
            </div>

            {filtered.length === 0 ? (
                <div className="rounded-lg border border-border bg-card/50 backdrop-blur-sm p-12 text-center">
                    <UserCog className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-muted-foreground">No role changes found.</p>
                </div>
            ) : (
                <div className="grid gap-3">
                    {filtered.map((item) => (
                        <RoleCard key={item.id} item={item} />
                    ))}
                </div>
            )}
        </section>
    );
};

export default RoleChangeHistory;



