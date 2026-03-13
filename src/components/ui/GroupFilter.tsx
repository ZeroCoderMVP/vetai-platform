"use client";

interface GroupFilterProps {
  groups: { id: string; name: string; type: string }[];
  selected: string;
  onChange: (groupId: string) => void;
}

export default function GroupFilter({ groups, selected, onChange }: GroupFilterProps) {
  return (
    <div className="group-filter">
      <select
        className="group-filter-select"
        value={selected}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Все группы</option>
        {groups.map((g) => (
          <option key={g.id} value={g.id}>
            {g.name} ({g.type === "feeding_group" ? "кормовая" : g.type === "section" ? "секция" : g.type})
          </option>
        ))}
      </select>
    </div>
  );
}
