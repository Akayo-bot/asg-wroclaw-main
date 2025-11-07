import * as React from "react";
import {
    Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
    Command, CommandEmpty, CommandGroup, CommandInput, CommandItem,
} from "@/components/ui/command";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

type Option = { id: string; label: string };

type Props = {
    value: string | "all";
    onChange: (v: string | "all") => void;
    options: Option[];
    placeholder?: string;
};

export function CategoryCombobox({
    value, onChange, options, placeholder = "All Categories",
}: Props) {
    const [open, setOpen] = React.useState(false);
    const selected = options.find(o => o.id === value) ?? options[0];

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    className="inline-flex min-w-[220px] items-center justify-between rounded-lg
                               bg-neutral-900/60 px-3 py-2.5 text-sm ring-1 ring-emerald-400/20
                               hover:bg-neutral-900/75 focus:outline-none focus:ring-emerald-400/40"
                >
                    <span className="truncate">
                        {selected ? selected.label : placeholder}
                    </span>
                    <ChevronDown className="ml-2 h-4 w-4 text-neutral-400" />
                </button>
            </PopoverTrigger>
            <PopoverContent
                className="z-[60] w-[280px] p-0 border-emerald-400/20 bg-neutral-950"
                align="start"
            >
                <Command className="bg-neutral-950 text-neutral-100">
                    <CommandInput
                        placeholder="Знайти категорію…"
                        className="placeholder:text-neutral-500"
                    />
                    <CommandEmpty className="px-3 py-2 text-sm text-neutral-400">
                        Нічого не знайдено
                    </CommandEmpty>
                    <CommandGroup>
                        {options.map((o) => (
                            <CommandItem
                                key={o.id}
                                value={o.label}
                                onSelect={() => {
                                    onChange(o.id as any);
                                    setOpen(false);
                                }}
                                className="cursor-pointer data-[selected=true]:bg-emerald-500/10"
                            >
                                <span>{o.label}</span>
                                {value === o.id && (
                                    <Check className="ml-auto h-4 w-4 text-emerald-300" />
                                )}
                            </CommandItem>
                        ))}
                    </CommandGroup>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

