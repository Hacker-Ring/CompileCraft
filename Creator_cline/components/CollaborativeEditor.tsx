'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useLiveblocksExtension, FloatingToolbar } from '@liveblocks/react-tiptap';
import { useEffect, useRef } from 'react';

interface Props {
  roomId: string;
  initialContent?: string;
}

export function CollaborativeEditor({ roomId, initialContent }: Props) {
  const liveblocks = useLiveblocksExtension();
  const hasSetContent = useRef(false);

  const editor = useEditor({
    extensions: [
      liveblocks,
      StarterKit.configure({
        history: false,
      }),
    ],
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl mx-auto focus:outline-none min-h-[400px] p-4 border-none outline-none',
      },
    },
  });

  // Effect to set initial content when AI generates new content
  useEffect(() => {
    if (editor && initialContent && !hasSetContent.current) {
      // Small delay to ensure Liveblocks is fully initialized
      const timer = setTimeout(() => {
        // Always set the content when new content is generated
        editor.commands.setContent(initialContent);
        hasSetContent.current = true;
      }, 200);
      
      return () => clearTimeout(timer);
    }
  }, [editor, initialContent]);

  // Reset flag when initialContent changes (new AI generation)
  useEffect(() => {
    if (initialContent && initialContent.trim()) {
      hasSetContent.current = false;
    }
  }, [initialContent]);

  return (
    <div className="w-full">
      <div className="border rounded-lg bg-white min-h-[400px] relative">
        {!initialContent && !editor?.getHTML() && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500 pointer-events-none">
            <p>Generate content above to start collaborating...</p>
          </div>
        )}
        <EditorContent 
          editor={editor} 
          className="min-h-[400px] p-4"
        />
        <FloatingToolbar editor={editor} />
      </div>
    </div>
  );
}
