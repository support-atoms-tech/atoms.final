// components/canvas/TableBlock/menu/AddColumnButton.tsx
'use client';

interface AddColumnButtonProps {
  onClick: () => void;
}

export function AddColumnButton({ onClick }: AddColumnButtonProps) {
  return (
    <button
      className="add-column-button w-full flex items-center justify-center py-1 px-2 text-sm text-gray-600 bg-gray-50 hover:bg-gray-100 rounded border border-dashed border-gray-300"
      onClick={onClick}
    >
      <span className="mr-1">+</span>
      <span>Add Column</span>
    </button>
  );
}
