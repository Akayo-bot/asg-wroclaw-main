import * as React from "react";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Badge } from "./ui/Badge";

export type StatusOption = "draft" | "published" | "scheduled";

type Props = {
    value: StatusOption | "all";
    onChange: (v: StatusOption | "all") => void;
};

const STATUS_META: Record<StatusOption, { label: string; className: string }> = {
    draft: { label: "Чернетка", className: "bg-neutral-800 text-neutral-300 ring-neutral-600/40" },
    published: { label: "Опубліковано", className: "bg-emerald-500/10 text-emerald-200 ring-emerald-400/30" },
    scheduled: { label: "Заплановано", className: "bg-amber-500/10 text-amber-200 ring-amber-400/30" },
};

export function StatusSelect({ value, onChange }: Props) {
    return (
        <Select
            value={value}
            onValueChange={(v: string) => onChange(v as any)}
        >
            <SelectTrigger
                className="min-w-[170px] justify-between rounded-lg bg-neutral-900/60 px-3 py-[9px]
                           text-sm ring-1 ring-emerald-400/20 hover:bg-neutral-900/75
                           focus:ring-emerald-400/40 data-[state=open]:ring-emerald-400/40"
            >
                <SelectValue>
                    {value === "all" ? (
                        <span>Усі статуси</span>
                    ) : (
                        <Badge className={STATUS_META[value].className}>
                            {STATUS_META[value].label}
                        </Badge>
                    )}
                </SelectValue>
            </SelectTrigger>
            <SelectContent className="z-[60] rounded-lg border-emerald-400/20 bg-neutral-950 text-neutral-100">
                <SelectItem value="all" className="cursor-pointer focus:bg-neutral-900">
                    Усі статуси
                </SelectItem>
                {(
                    Object.keys(STATUS_META) as StatusOption[]
                ).map((key) => (
                    <SelectItem key={key} value={key} className="cursor-pointer focus:bg-neutral-900">
                        <Badge className={STATUS_META[key].className}>
                            {STATUS_META[key].label}
                        </Badge>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}

