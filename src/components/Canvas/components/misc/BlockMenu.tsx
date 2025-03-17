// components/canvas/components/misc/BlockMenu.tsx
'use client';

import { useState, useRef } from 'react';
import { useDocument } from '@/components/Canvas/lib/providers/DocumentContext';
import { useOnClickOutside } from '@/components/Canvas/lib/hooks/utils/useOnClickOutside';

interface BlockMenuProps {
  blockId: string;
  blockType: string;
}

export function BlockMenu({ blockId, blockType }: BlockMenuProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { deleteBlock } = useDocument();
  
  // Close on click outside
  useOnClickOutside(menuRef as React.RefObject<HTMLElement>, () => setIsMenuOpen(false));
  
  // Handle block deletion
  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this block?')) {
      deleteBlock(blockId);
    }
    setIsMenuOpen(false);
  };
  
  // Handle duplicate block
  const handleDuplicate = () => {
    // This would normally duplicate the block
    alert('Duplicate block feature not implemented');
    setIsMenuOpen(false);
  };
  
  return (
    <div className="block-menu absolute top-2 right-2" ref={menuRef}>
      <button
        className="menu-button p-1 rounded-md bg-gray-100 hover:bg-gray-200"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
      >
        <span className="block h-4 w-4 flex items-center justify-center">⋮</span>
      </button>
      
      {isMenuOpen && (
        <div className="menu-dropdown absolute right-0 mt-1 w-40 bg-white border rounded-md shadow-lg z-20">
          <ul className="menu-items py-1">
            <li>
              <button
                className="menu-item w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={handleDuplicate}
              >
                Duplicate
              </button>
            </li>
            <li>
              <button
                className="menu-item w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                onClick={handleDelete}
              >
                Delete
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}