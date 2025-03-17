// components/canvas/TableBlock/menu/AddRowButton.tsx
'use client';

interface AddRowButtonProps {
  onAddRow: () => void;
}

export function AddRowButton({ onAddRow }: AddRowButtonProps) {
  return (
    <button
      className="add-row-button w-full flex items-center justify-center py-1 px-2 text-sm text-gray-600 bg-gray-50 hover:bg-gray-100 rounded border border-dashed border-gray-300"
      onClick={onAddRow}
    >
      <span className="mr-1">+</span>
      <span>Add Row</span>
    </button>
  );
}
