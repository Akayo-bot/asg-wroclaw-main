export type GlassToastTone = "error" | "warning" | "success" | "info";

const baseGlassToastClass =
  "backdrop-blur-md border rounded-2xl !z-[12000]";

const toneClassMap: Record<GlassToastTone, string> = {
  error:
    "bg-[#1f0606]/95 border-red-500/45 text-red-100 shadow-[0_0_34px_rgba(220,38,38,0.32)]",
  warning:
    "bg-[#241705]/95 border-amber-400/45 text-amber-100 shadow-[0_0_34px_rgba(245,158,11,0.3)]",
  success:
    "bg-[#082010]/95 border-emerald-400/45 text-emerald-100 shadow-[0_0_34px_rgba(16,185,129,0.32)]",
  info:
    "bg-[#07192a]/95 border-blue-400/45 text-blue-100 shadow-[0_0_34px_rgba(59,130,246,0.32)]",
};

export const getGlassToastClassName = (tone: GlassToastTone) =>
  `${baseGlassToastClass} ${toneClassMap[tone]}`;

export const getGlassToastVariant = (tone: GlassToastTone) =>
  tone === "error"
    ? "destructive"
    : tone === "warning"
      ? "warning"
      : tone === "success"
        ? "success"
        : "info";
