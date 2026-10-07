import { useId } from "react";
import { filterSelectionState } from "@/lib/filter-selection";

export function FilterSelectAll<T extends string>({
  selected,
  available,
  label,
  description,
  limit,
  onChange,
}: {
  selected: readonly T[];
  available: readonly T[];
  label: string;
  description: string;
  limit?: number;
  onChange: (checked: boolean) => void;
}) {
  const descriptionId = useId();
  const state = filterSelectionState(selected, available, limit);
  return (
    <div>
      <div className="practice-builder-options">
        <label>
          <input
            type="checkbox"
            aria-label={label}
            aria-describedby={descriptionId}
            checked={state.all}
            disabled={state.disabled}
            ref={(input) => {
              if (input) input.indeterminate = state.partial;
            }}
            onChange={(event) => onChange(event.target.checked)}
          />
          {label}
        </label>
      </div>
      <small id={descriptionId} className="muted">
        {state.disabled && available.length > 0
          ? `Можно выбрать не более ${limit} элементов. Сузь фильтр.`
          : description}
      </small>
    </div>
  );
}
