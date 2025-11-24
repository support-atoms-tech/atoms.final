'use client';

import BulletList from '@tiptap/extension-bullet-list';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import ListItem from '@tiptap/extension-list-item';
import OrderedList from '@tiptap/extension-ordered-list';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useParams } from 'next/navigation';
import React from 'react';

import { BlockProps } from '@/components/custom/BlockCanvas/types';
import { useAuth } from '@/hooks/useAuth';
import { useBroadcastTextUpdate } from '@/hooks/useBroadcastTextUpdate';
import { getUserColor } from '@/lib/userColors';
import { cn } from '@/lib/utils';
import { useDocumentStore } from '@/store/document.store';
import { Json } from '@/types/base/database.types';

import { ConflictWarning } from './ConflictWarning';
import { Toolbar } from './FormatToolbar';
import { RemoteCursor } from './RemoteCursor';

const customStyles = `
  .ProseMirror {
    background: transparent;
    outline: none !important;
    min-height: 1.5em;
  }

  .ProseMirror-focused {
    outline: none !important;
  }

  /* Custom placeholder styles */
  .empty-editor-placeholder {
    position: absolute;
    color: #9ca3af;
    pointer-events: none;
    user-select: none;
    top: 0;
    left: 0;
    padding: 0.5em 0;
    line-height: 1.5;
    display: flex;
    align-items: center;
    height: 100%;
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
    background: rgba(59, 130, 246, 0.2);
    border-radius: 0;
  }

  .ProseMirror:not(.ProseMirror-focused) *::selection {
    background: rgba(59, 130, 246, 0.1);
  }
`;

export const TextBlock: React.FC<BlockProps> = ({ block, onUpdate }) => {
    const content = block.content as { text?: string; format?: string };
    const [localContent, setLocalContent] = React.useState(content?.text || '<p></p>');
    const [showToolbar, setShowToolbar] = React.useState(false);
    const [toolbarPosition, setToolbarPosition] = React.useState({
        top: 0,
        left: 0,
    });
    const editorRef = React.useRef<HTMLDivElement>(null);
    const lastSavedContent = React.useRef(content?.text || '<p></p>');
    const isRemoteUpdate = React.useRef(false);
    const editorInstanceRef = React.useRef<ReturnType<typeof useEditor>>(null);
    const lastCursorBroadcast = React.useRef({ from: 0, to: 0, timestamp: 0 });

    // Remote cursors state - track other users' cursor positions
    const [remoteCursors, setRemoteCursors] = React.useState<
        Map<
            string,
            {
                userId: string;
                userName: string;
                from: number;
                to: number;
                color: string;
            }
        >
    >(new Map());

    // Conflict detection state
    const [conflictingUsers, setConflictingUsers] = React.useState<
        Array<{ userId: string; userName: string }>
    >([]);
    const [showConflictWarning, setShowConflictWarning] = React.useState(false);
    const myCurrentPosition = React.useRef<{ from: number; to: number }>({
        from: 0,
        to: 0,
    });

    // Use the document store for edit mode state
    const { isEditMode } = useDocumentStore();

    // Get user info and document ID for broadcasts
    const { userProfile } = useAuth();
    const userId = userProfile?.id;
    const userName = userProfile?.full_name || 'Anonymous';
    const params = useParams();
    const documentId = params?.documentId as string;

    // Handle remote text updates from other users
    const handleRemoteUpdate = React.useCallback(
        (data: { content: string; userId: string }) => {
            const editor = editorInstanceRef.current;
            if (!editor || editor.isFocused) {
                // Don't apply if user is actively editing
                return;
            }

            console.log('[TextBlock] 📨 Applying remote text update');
            isRemoteUpdate.current = true;
            editor.commands.setContent(data.content);
            setLocalContent(data.content);
            isRemoteUpdate.current = false;
        },
        [],
    );

    // Handle remote cursor updates from other users
    const handleReceiveCursor = React.useCallback(
        (data: { userId: string; userName: string; from: number; to: number }) => {
            console.log('[TextBlock] 🖱️ Received cursor update:', data);
            setRemoteCursors((prev) => {
                const next = new Map(prev);
                next.set(data.userId, {
                    userId: data.userId,
                    userName: data.userName,
                    from: data.from,
                    to: data.to,
                    color: getUserColor(data.userId),
                });
                return next;
            });

            // Auto-remove cursor after 5 seconds of no updates
            setTimeout(() => {
                setRemoteCursors((prev) => {
                    const next = new Map(prev);
                    const cursor = next.get(data.userId);
                    // Only remove if it's the same cursor position (no new updates)
                    if (cursor && cursor.from === data.from && cursor.to === data.to) {
                        next.delete(data.userId);
                    }
                    return next;
                });
            }, 5000);
        },
        [],
    );

    // Set up broadcast channel for real-time text updates
    const { broadcastTextUpdate, broadcastCursorUpdate } = useBroadcastTextUpdate({
        documentId,
        blockId: block.id,
        userId,
        userName,
        enabled: true,
        onReceiveUpdate: handleRemoteUpdate,
        onReceiveCursor: handleReceiveCursor,
    });

    // Add click outside handler
    React.useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleClickOutside = (event: MouseEvent) => {
            if (editorRef.current && !editorRef.current.contains(event.target as Node)) {
                setShowToolbar(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Detect conflicts when editing near other users (within 50 characters)
    React.useEffect(() => {
        if (!isEditMode || remoteCursors.size === 0) {
            setShowConflictWarning(false);
            return;
        }

        const { from, to } = myCurrentPosition.current;
        const conflicts: Array<{ userId: string; userName: string }> = [];
        const PROXIMITY_THRESHOLD = 50; // characters

        remoteCursors.forEach((cursor) => {
            // Check if cursors are within proximity
            const distance = Math.min(
                Math.abs(cursor.from - from),
                Math.abs(cursor.to - to),
                Math.abs(cursor.from - to),
                Math.abs(cursor.to - from),
            );

            if (distance < PROXIMITY_THRESHOLD) {
                conflicts.push({
                    userId: cursor.userId,
                    userName: cursor.userName,
                });
            }
        });

        if (conflicts.length > 0) {
            setConflictingUsers(conflicts);
            setShowConflictWarning(true);

            // Auto-dismiss after 5 seconds
            const timeout = setTimeout(() => {
                setShowConflictWarning(false);
            }, 5000);

            return () => clearTimeout(timeout);
        } else {
            setShowConflictWarning(false);
        }
    }, [remoteCursors, isEditMode]);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3, 4, 5],
                },
                bulletList: false,
                orderedList: false,
                listItem: false,
            }),
            BulletList.configure({
                HTMLAttributes: {
                    class: '',
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
        content: content?.text || '<p></p>',
        editable: Boolean(isEditMode),
        onSelectionUpdate: ({ editor }) => {
            if (!isEditMode) return;

            const { from, to } = editor.state.selection;

            // Track current position for conflict detection
            myCurrentPosition.current = { from, to };

            // Throttle cursor broadcasts (max 10 per second = 100ms)
            const now = Date.now();
            const lastBroadcast = lastCursorBroadcast.current;
            const shouldBroadcast =
                now - lastBroadcast.timestamp > 100 || // 100ms throttle
                from !== lastBroadcast.from ||
                to !== lastBroadcast.to;

            if (broadcastCursorUpdate && shouldBroadcast) {
                void broadcastCursorUpdate(from, to);
                lastCursorBroadcast.current = { from, to, timestamp: now };
            }

            if (from === to) {
                setShowToolbar(false);
                return;
            }

            const editorElement = editorRef.current;
            if (!editorElement) return;

            const view = editor.view;
            const start = view.coordsAtPos(from);
            const editorRect = editorElement.getBoundingClientRect();

            setToolbarPosition({
                top: start.top - editorRect.top - 10,
                left: start.left - editorRect.left,
            });
            setShowToolbar(true);
        },
        onUpdate: ({ editor }) => {
            if (!isEditMode) return;

            // Check if editor is completely empty (only has an empty paragraph)
            const isEmpty = editor.isEmpty;
            let newContent = editor.getHTML();

            // If editor is empty, set content to empty string instead of <p></p>
            if (isEmpty || newContent === '<p></p>') {
                newContent = '';
            }

            // Update local content immediately to trigger placeholder if needed
            setLocalContent(newContent);
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl focus:outline-none',
            },
        },
        immediatelyRender: false, // Explicitly set to avoid SSR hydration mismatch
    });

    // Update editor instance ref when editor changes
    React.useEffect(() => {
        editorInstanceRef.current = editor;
    }, [editor]);

    // Update editor's editable state when isEditMode changes
    React.useEffect(() => {
        if (editor) {
            editor.setEditable(Boolean(isEditMode));

            // Focus the editor when entering edit mode
            if (isEditMode && content?.text === '<p></p>') {
                setTimeout(() => {
                    editor.commands.focus();
                }, 100);
            }
        }
    }, [isEditMode, editor, content?.text]);

    // Save content when exiting edit mode
    React.useEffect(() => {
        if (!isEditMode && localContent !== lastSavedContent.current) {
            // If content is empty or just empty paragraph tags, save as empty string
            const contentToSave =
                localContent === '' || localContent === '<p></p>' ? '' : localContent;

            lastSavedContent.current = contentToSave;
            onUpdate({
                content: {
                    text: contentToSave,
                    format: content?.format || 'default',
                } as Json,
                updated_at: new Date().toISOString(),
            });
        }
    }, [isEditMode, localContent, content?.format, onUpdate]);

    // Save content when editor loses focus
    const handleBlur = React.useCallback(() => {
        if (!editor || !isEditMode) return;

        const editorContent = editor.getHTML();
        if (editorContent !== lastSavedContent.current) {
            lastSavedContent.current = editorContent;
            onUpdate({
                content: {
                    text: editorContent,
                    format: content?.format || 'default',
                } as Json,
                updated_at: new Date().toISOString(),
            });
        }
    }, [editor, isEditMode, onUpdate, content?.format]);

    // Add blur handler to editor
    React.useEffect(() => {
        if (!editor) return;

        editor.on('blur', handleBlur);
        return () => {
            editor.off('blur', handleBlur);
        };
    }, [editor, handleBlur]);

    // Broadcast text changes to other users in real-time
    React.useEffect(() => {
        if (!editor || !broadcastTextUpdate || !isEditMode) return;

        const handleUpdate = () => {
            // Skip if this update came from a remote user
            if (isRemoteUpdate.current) return;

            const newContent = editor.getHTML();
            console.log('[TextBlock] 📤 Broadcasting text update');
            void broadcastTextUpdate(newContent);
        };

        editor.on('update', handleUpdate);
        return () => {
            editor.off('update', handleUpdate);
        };
    }, [editor, broadcastTextUpdate, isEditMode]);

    // Sync external content changes only when not in edit mode
    React.useEffect(() => {
        if (!editor || isEditMode) return;

        // Handle empty content case
        const textContent = content?.text || '';

        if (textContent !== lastSavedContent.current) {
            lastSavedContent.current = textContent;
            setLocalContent(textContent);

            // If content is empty, set empty paragraph that will show placeholder
            if (textContent === '') {
                editor.commands.clearContent();
            } else {
                editor.commands.setContent(textContent);
            }
        }
    }, [content?.text, editor, isEditMode]);

    return (
        <div
            ref={editorRef}
            className={cn('relative w-full cursor-text')}
            onClick={(e) => {
                e.stopPropagation();
                if (isEditMode && editor && editor.state.selection.empty) {
                    editor.commands.focus();
                }
            }}
        >
            {isEditMode && showToolbar && (
                <div
                    className="absolute z-50 format-toolbar"
                    style={{
                        top: `${toolbarPosition.top}px`,
                        left: `${toolbarPosition.left}px`,
                        pointerEvents: 'none', // Allow clicks to pass through the container
                    }}
                >
                    <Toolbar
                        editor={editor}
                        className="bg-background/95 backdrop-blur-sm rounded-lg shadow-lg border border-border p-1 transform -translate-y-full transition-all duration-200 pointer-events-auto" // Re-enable pointer events just for the toolbar itself
                    />
                </div>
            )}
            <style>{customStyles}</style>
            <div className="relative min-h-[1.5em]">
                {/* Show placeholder for empty text blocks regardless of edit mode */}
                {(!localContent || localContent === '' || localContent === '<p></p>') && (
                    <div className="empty-editor-placeholder">Enter text here...</div>
                )}
                <EditorContent
                    editor={editor}
                    className="prose prose-sm dark:prose-invert max-w-none w-full focus:outline-none"
                    onClick={() => {
                        if (editor?.state.selection.empty) {
                            setShowToolbar(false);
                        }
                    }}
                />

                {/* Render remote cursors from other users */}
                {editor &&
                    editorRef.current &&
                    Array.from(remoteCursors.values()).map((cursor) => {
                        try {
                            // Calculate cursor position using TipTap view
                            const view = editor.view;
                            const editorRect = editorRef.current!.getBoundingClientRect();
                            const fromCoords = view.coordsAtPos(cursor.from);

                            // Calculate position relative to editor container
                            const top = fromCoords.top - editorRect.top;
                            const left = fromCoords.left - editorRect.left;

                            // Calculate selection range if from !== to
                            let selection:
                                | {
                                      top: number;
                                      left: number;
                                      width: number;
                                      height: number;
                                  }
                                | undefined;

                            if (cursor.from !== cursor.to) {
                                const toCoords = view.coordsAtPos(cursor.to);
                                const selTop = fromCoords.top - editorRect.top;
                                const selLeft = fromCoords.left - editorRect.left;
                                const selWidth = toCoords.left - fromCoords.left;
                                const selHeight = Math.max(
                                    toCoords.bottom - fromCoords.top,
                                    20,
                                );

                                selection = {
                                    top: selTop,
                                    left: selLeft,
                                    width: Math.max(selWidth, 0),
                                    height: selHeight,
                                };
                            }

                            return (
                                <RemoteCursor
                                    key={cursor.userId}
                                    userId={cursor.userId}
                                    userName={cursor.userName}
                                    color={cursor.color}
                                    top={top}
                                    left={left}
                                    height={20} // Standard cursor height
                                    selection={selection}
                                />
                            );
                        } catch (error) {
                            // Cursor position might be invalid if document changed
                            console.warn('Failed to render cursor:', error);
                            return null;
                        }
                    })}
            </div>

            {/* Conflict Warning */}
            {showConflictWarning && (
                <ConflictWarning
                    conflictingUsers={conflictingUsers}
                    type="text"
                    onDismiss={() => setShowConflictWarning(false)}
                />
            )}
        </div>
    );
};
