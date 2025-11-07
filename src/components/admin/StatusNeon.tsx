import { NeonPopoverList } from "./NeonPopoverList";

export const statusColors: Record<string, string> = {
    "draft": "text-slate-300/70",
    "published": "text-emerald-400",
    "scheduled": "text-amber-400",
};

export function StatusNeon({ value, onChange, className }: { value: string; onChange: (v: string) => void; className?: string }) {
    const options = [
        { id: "all", label: "Усі статуси", textColor: "text-neutral-300", hoverColor: "emerald" },
        { id: "draft", label: "Чернетки", textColor: "text-slate-300/70", hoverColor: "emerald" },
        { id: "published", label: "Опубліковано", textColor: "text-emerald-400", hoverColor: "emerald" },
        { id: "scheduled", label: "Заплановано", textColor: "text-amber-400", hoverColor: "amber" },
    ];
    const isMobile = className?.includes("w-full");
    return (
        <div className={className || ""}>
            <NeonPopoverList 
                value={value} 
                onChange={onChange} 
                options={options} 
                color="emerald" 
                minW={isMobile ? 0 : 180}
                width={isMobile ? undefined : 170}
            />
        </div>
    );
}

