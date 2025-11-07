import { NeonPopoverList, NeonOption } from "./NeonPopoverList";

export const categoryColors: Record<string, { text: string; hover: string }> = {
    "tactics": { text: "text-violet-400", hover: "violet" },
    "equipment": { text: "text-sky-400", hover: "sky" },
    "news": { text: "text-rose-400", hover: "rose" },
    "game_reports": { text: "text-emerald-400", hover: "emerald" },
    "rules": { text: "text-amber-400", hover: "amber" },
};

export function CategoryNeon({
    value,
    onChange,
    categories,
}: {
    value: string;
    onChange: (v: string) => void;
    categories: NeonOption[];
}) {
    const options: NeonOption[] = [
        { id: "all", label: "Усі категорії", textColor: "text-neutral-300", hoverColor: "emerald" },
        ...categories.map(cat => {
            const colorMap = categoryColors[cat.id];
            return {
                ...cat,
                textColor: colorMap?.text || "text-neutral-300",
                hoverColor: colorMap?.hover || "emerald"
            };
        }),
    ];
    return (
        <div className="w-full lg:w-auto">
            <NeonPopoverList 
                value={value} 
                onChange={onChange} 
                options={options} 
                color="emerald" 
                minW={0}
                width={170}
            />
        </div>
    );
}

