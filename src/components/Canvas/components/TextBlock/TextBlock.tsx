// components/canvas/blocks/TextBlock.tsx
'use client';

import BulletList from '@tiptap/extension-bullet-list';
import Heading from '@tiptap/extension-heading';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import ListItem from '@tiptap/extension-list-item';
import OrderedList from '@tiptap/extension-ordered-list';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import React, { useEffect } from 'react';

import { Block } from '@/components/Canvas/types';
import { cn } from '@/lib/utils';
import { useDocument } from '@/components/Canvas/lib/providers/DocumentContext';
import { Toolbar } from '@/components/Canvas/components/TextBlock/FormatToolbar';
import { useBlock } from '@/components/Canvas/lib/providers/BlockContext';

interface TextBlockProps {
  block: Block;
}

const customStyles = `
  .ProseMirror {
    background: transparent;
    outline: none !important;
  }

  .ProseMirror-focused {
    outline: none !important;
  }

  .ProseMirror .arrow-list {
    list-style: none;
    padding-left: 1.5em;
  }
  
  .ProseMirror .arrow-list li {
    position: relative;
  }
  
  .ProseMirror .arrow-list li::before {
    content: "→";
    position: absolute;
    left: -1.5em;
    color: currentColor;
  }

  .ProseMirror h1 {
    font-size: 2em;
    font-weight: bold;
    margin-top: 0.5em;
    margin-bottom: 0.5em;
  }

  .ProseMirror h2 {
    font-size: 1.5em;
    font-weight: bold;
    margin-top: 0.5em;
    margin-bottom: 0.5em;
  }

  .ProseMirror h3 {
    font-size: 1.17em;
    font-weight: bold;
    margin-top: 0.5em;
    margin-bottom: 0.5em;
  }

  .ProseMirror h4 {
    font-size: 1em;
    font-weight: bold;
    margin-top: 0.5em;
    margin-bottom: 0.5em;
  }

  .ProseMirror h5 {
    font-size: 0.83em;
    font-weight: bold;
    margin-top: 0.5em;
    margin-bottom: 0.5em;
  }

  .ProseMirror ul,
  .ProseMirror ol {
    padding-left: 1.5em;
    margin: 0.5em 0;
  }

  .ProseMirror ol {
    list-style-type: decimal;
  }

  .ProseMirror ul {
    list-style-type: disc;
  }

  .ProseMirror p {
    margin: 0.5em 0;
  }

  .ProseMirror p:first-child {
    margin-top: 0;
  }

  .ProseMirror *::selection {
    background: rgba(255, 0, 0, 0.1);
    border-radius: 0;
  }

  .ProseMirror:not(.ProseMirror-focused) *::selection {
    background: transparent;
  }
`;

export function TextBlock({ block }: TextBlockProps) {
  const { editMode, updateBlock } = useDocument();
  const { selectedBlockId, selectBlock } = useDocument();
  
  const isSelected = selectedBlockId === block.id;
  const content = block.content as Record<string, any>;
  const textContent = content?.text || '';
  const format = content?.format || 'html';

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
      }),
      Heading.configure({
        levels: [1, 2, 3, 4, 5],
      }),
      BulletList.configure({
        HTMLAttributes: {
          class: 'bullet-list',
        },
      }),
      OrderedList.configure({
        HTMLAttributes: {
          class: 'ordered-list',
        },
      }),
      ListItem,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Link.configure({
        openOnClick: false,
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
    ],
    content: textContent,
    editable: editMode,
    immediatelyRender: false,
    onBlur: ({ editor }) => {
      const html = editor.getHTML();
      if (html !== textContent) {
        updateBlock({
          id: block.id,
          content: { 
            ...content,
            text: html, 
            format: 'html' 
          }
        });
      }
    },
    onFocus: () => {
      selectBlock(block.id);
    }
  });

  // Update editor content when block content changes externally
  useEffect(() => {
    if (editor && textContent && editor.getHTML() !== textContent) {
      editor.commands.setContent(textContent);
    }
  }, [textContent, editor]);

  // Update editor's editable state when editMode changes
  useEffect(() => {
    if (editor) {
      editor.setEditable(editMode);
      if (!editMode) {
        // Clear any text selection when exiting edit mode
        window.getSelection()?.removeAllRanges();
      }
    }
  }, [editMode, editor]);

  // Handle selection when selected externally
  useEffect(() => {
    if (isSelected && editor && !editor.isFocused && editMode) {
      editor.commands.focus();
    }
  }, [isSelected, editor, editMode]);

  return (
    <div 
      className="text-block relative"
      onClick={() => selectBlock(block.id)}
    >
      <style>{customStyles}</style>
      {isSelected && editMode && (
        <Toolbar editor={editor} className="sticky top-0 z-10" />
      )}
      <EditorContent
        editor={editor}
        className={cn(
          'min-h-[2em]',
          'prose prose-sm max-w-none',
          'focus:outline-none',
          'bg-transparent',
          !editor?.getText() &&
            'before:text-gray-400 before:content-[attr(data-placeholder)]',
          !editMode && 'pointer-events-none',
        )}
        data-placeholder="Enter Text"
      />
    </div>
  );
}