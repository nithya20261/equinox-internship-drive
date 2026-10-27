import { Search } from "lucide-react";

/** Search + filter bar. Options load from the backend later; disabled until data exists. */
export function FilterBar({
  placeholder,
  filters,
  onSearchChange,
}: {
  placeholder: string;
  filters: string[];
  onSearchChange?: (val: string) => void;
}) {
  return (
    <form role="search" onSubmit={(e) => e.preventDefault()} className="border border-foreground bg-card">
      <div className="flex items-center gap-3 border-b border-border px-4">
        <Search size={18} className="text-muted-foreground" aria-hidden />
        <label htmlFor="q" className="sr-only">{placeholder}</label>
        <input
          id="q"
          placeholder={placeholder}
          onChange={(e) => onSearchChange?.(e.target.value)}
          className="h-14 flex-1 bg-transparent text-lg outline-none placeholder:text-muted-foreground"
        />
      </div>
      <div className="grid grid-cols-2 md:flex">
        {filters.map((f) => (
          <div key={f} className="flex-1 border-b border-r border-border last:border-r-0 md:border-b-0">
            <label htmlFor={`f-${f}`} className="eyebrow block px-4 pt-3 text-[0.6rem] text-muted-foreground">{f}</label>
            <select id={`f-${f}`} disabled className="w-full appearance-none bg-transparent px-4 pb-3 pt-1 text-sm disabled:cursor-not-allowed">
              <option>All — options coming soon</option>
            </select>
          </div>
        ))}
      </div>
    </form>
  );
}
