export function filterSelectionState<T extends string>(
  selected: readonly T[],
  available: readonly T[],
  limit = Infinity,
) {
  const scope = new Set(available);
  const selection = new Set(selected);
  const count = [...scope].filter((id) => selection.has(id)).length;
  const all = scope.size > 0 && count === scope.size;
  return {
    all,
    partial: count > 0 && !all,
    disabled:
      scope.size === 0 ||
      (!all && new Set([...selection, ...scope]).size > limit),
  };
}

export function setFilterSelection<T extends string>(
  selected: readonly T[],
  available: readonly T[],
  checked: boolean,
  limit = Infinity,
): T[] {
  const scope = new Set(available);
  const next = checked
    ? [...new Set([...selected, ...scope])]
    : [...new Set(selected)].filter((id) => !scope.has(id));
  return checked && next.length > limit ? [...new Set(selected)] : next;
}
