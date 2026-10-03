// TEMPLATE: a molecule in ui/ that composes Indicator and Typography.
// Copy to src/components/ui/<name>/<Name>.tsx, rename Example, delete this header.
// Placement and tier imports: CLAUDE.md > Component Development > Placement.
import { Pressable, type PressableProps } from "react-native";
import { cn } from "../../../utils/cn";
import { useControllableState } from "../../../hooks/useControllableState";
import { Indicator } from "../indicator";
import { Typography } from "../typography";

export interface ExampleProps extends Omit<PressableProps, "children"> {
  /** Text next to the dot. */
  label: string;
  /** Controlled selection. Leave undefined to let the component own it. */
  isSelected?: boolean;
  /** Initial selection when uncontrolled. */
  defaultSelected?: boolean;
  /** Called with the next selection. */
  onSelectedChange?: (isSelected: boolean) => void;
  isDisabled?: boolean;
  className?: string;
}

/** One-line purpose. Composes Indicator and Typography. */
export function Example({
  label,
  isSelected,
  defaultSelected = false,
  onSelectedChange,
  isDisabled = false,
  className,
  ...props
}: ExampleProps) {
  const [selected, setSelected] = useControllableState({
    value: isSelected,
    defaultValue: defaultSelected,
    onChange: onSelectedChange,
  });
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected, disabled: isDisabled }}
      disabled={isDisabled}
      onPress={() => setSelected(!selected)}
      className={cn(
        "flex-row items-center gap-inline-md",
        isDisabled && "opacity-50",
        className,
      )}
      {...props}
    >
      <Indicator size="md" color={selected ? "success" : "default"} />
      <Typography
        variant="monoLabel"
        color={selected ? "primary" : "secondary"}
      >
        {label}
      </Typography>
    </Pressable>
  );
}
