// components/canvas/AddBlockButton.tsx
'use client';

import { useState, useRef } from 'react';
import { useOnClickOutside } from '@/components/Canvas/lib/hooks/utils/useOnClickOutside';
import { AlignLeft, LayoutGrid, FileText, Image, Code, FileVideo, Link } from 'lucide-react';

interface AddBlockButtonProps {
  onAddBlock: (type: string, position?: number) => Promise<any>;
}

export function AddBlockButton({ onAddBlock }: AddBlockButtonProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  // Close on click outside
  useOnClickOutside(menuRef as React.RefObject<HTMLElement>, () => setIsMenuOpen(false));
  
  // Block types with icons and descriptions
  const blockTypes = [
    {
      id: 'text',
      name: 'Text',
      icon: <AlignLeft size={18} />,
      description: 'Rich text with formatting'
    },
    {
      id: 'table',
      name: 'Table',
      icon: <LayoutGrid size={18} />,
      description: 'Structured data in rows and columns'
    },
    {
      id: 'image',
      name: 'Image',
      icon: <Image size={18} />,
      description: 'Upload or embed images'
    },
    {
      id: 'code',
      name: 'Code',
      icon: <Code size={18} />,
      description: 'Code snippet with syntax highlighting'
    },
    {
      id: 'embed',
      name: 'Embed',
      icon: <Link size={18} />,
      description: 'Embed external content'
    },
    {
      id: 'video',
      name: 'Video',
      icon: <FileVideo size={18} />,
      description: 'Embed video content'
    }
  ];
  
  // Handle block selection
  const handleSelectBlock = async (type: string) => {
    await onAddBlock(type);
    setIsMenuOpen(false);
  };
  
  return (
    <div className="add-block-button-container relative" ref={menuRef}>
      <button
        className="add-block-button flex items-center justify-center w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
      >
        <span className="mr-2">+</span>
        <span>Add Block</span>
      </button>
      
      {isMenuOpen && (
        <div className="block-menu absolute left-0 w-64 mt-2 bg-white border rounded-md shadow-lg z-10">
          <div className="menu-header p-2 border-b bg-gray-50">
            <h3 className="font-medium text-sm">Add Block</h3>
          </div>
          
          <div className="menu-body p-2">
            <ul className="block-types space-y-1">
              {blockTypes.map(blockType => (
                <li key={blockType.id}>
                  <button
                    className="w-full text-left p-2 hover:bg-gray-50 rounded-md flex items-start"
                    onClick={() => handleSelectBlock(blockType.id)}
                  >
                    <span className="block-icon mr-3 text-gray-500 flex-shrink-0">
                      {blockType.icon}
                    </span>
                    <div>
                      <div className="block-name font-medium text-sm">{blockType.name}</div>
                      <div className="block-description text-xs text-gray-500">
                        {blockType.description}
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}