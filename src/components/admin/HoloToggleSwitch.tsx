import * as React from "react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface HoloToggleSwitchProps extends React.ComponentPropsWithoutRef<typeof Switch> {
  label?: string;
}

const HoloToggleSwitch = React.forwardRef<
  React.ElementRef<typeof Switch>,
  HoloToggleSwitchProps
>(({ className, label, id, checked, onCheckedChange, ...props }, ref) => {
  const switchId = id || React.useId();
  const [isChecked, setIsChecked] = React.useState(checked || false);

  React.useEffect(() => {
    if (checked !== undefined) {
      setIsChecked(checked);
    }
  }, [checked]);

  const handleCheckedChange = (value: boolean) => {
    setIsChecked(value);
    if (onCheckedChange) {
      onCheckedChange(value);
    }
  };

  return (
    <div className="holo-toggle-container relative">
      <div className="holo-toggle-wrap">
        <Switch
          ref={ref}
          id={switchId}
          checked={isChecked}
          onCheckedChange={handleCheckedChange}
          className={cn("holo-toggle-switch absolute opacity-0 pointer-events-none", className)}
          {...props}
        />
        <label 
          htmlFor={switchId}
          className="holo-toggle-track" 
          data-checked={isChecked}
        >
          <div className="track-lines">
            <div className="track-line"></div>
          </div>
          <div className="toggle-thumb">
            <div className="thumb-core"></div>
            <div className="thumb-inner"></div>
            <div className="thumb-scan"></div>
            <div className="thumb-particles">
              <div className="thumb-particle"></div>
              <div className="thumb-particle"></div>
              <div className="thumb-particle"></div>
              <div className="thumb-particle"></div>
              <div className="thumb-particle"></div>
            </div>
            <div className="energy-rings">
              <div className="energy-ring"></div>
              <div className="energy-ring"></div>
              <div className="energy-ring"></div>
            </div>
          </div>
          <div className="toggle-data">
            <div className="data-text off">OFF</div>
            <div className="data-text on">ON</div>
            <div className="status-indicator off"></div>
            <div className="status-indicator on"></div>
          </div>
          <div className="interface-lines">
            <div className="interface-line"></div>
            <div className="interface-line"></div>
            <div className="interface-line"></div>
            <div className="interface-line"></div>
            <div className="interface-line"></div>
            <div className="interface-line"></div>
          </div>
          <div className="toggle-reflection"></div>
          <div className="holo-glow"></div>
        </label>
      </div>
    </div>
  );
});

HoloToggleSwitch.displayName = "HoloToggleSwitch";

export { HoloToggleSwitch };

