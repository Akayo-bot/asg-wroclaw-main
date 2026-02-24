import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:rounded-2xl group-[.toaster]:border-emerald-400/25 group-[.toaster]:bg-[rgba(20,24,22,0.9)] group-[.toaster]:text-emerald-50 group-[.toaster]:ring-1 group-[.toaster]:ring-emerald-400/15 group-[.toaster]:shadow-[0_0_0_1px_rgba(16,185,129,.14),0_18px_45px_-18px_rgba(16,185,129,.5)] group-[.toaster]:backdrop-blur-xl",
          description: "group-[.toast]:text-emerald-100/75",
          actionButton:
            "group-[.toast]:rounded-xl group-[.toast]:border group-[.toast]:border-emerald-400/35 group-[.toast]:bg-[rgba(16,185,129,.16)] group-[.toast]:text-emerald-100 group-[.toast]:ring-1 group-[.toast]:ring-emerald-400/25 group-[.toast]:hover:bg-[rgba(16,185,129,.24)]",
          cancelButton:
            "group-[.toast]:rounded-xl group-[.toast]:border group-[.toast]:border-white/15 group-[.toast]:bg-[rgba(15,23,42,.45)] group-[.toast]:text-neutral-100 group-[.toast]:hover:bg-[rgba(31,41,55,.65)]",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
