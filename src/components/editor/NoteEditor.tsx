"use client";

import { useCallback, useMemo } from "react";
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import { Block } from "@blocknote/core";
import "@blocknote/mantine/style.css";

interface NoteEditorProps {
  noteId: string;
  initialContent?: Block[];
  onChange?: (content: Block[]) => void;
  editable?: boolean;
}

export function NoteEditor({
  noteId,
  initialContent,
  onChange,
  editable = true,
}: NoteEditorProps) {
  const editor = useCreateBlockNote({
    initialContent: initialContent?.length ? initialContent : undefined,
  });

  const handleChange = useCallback(() => {
    if (onChange) {
      onChange(editor.document);
    }
  }, [editor, onChange]);

  return (
    <div className="min-h-[500px]" key={noteId}>
      <BlockNoteView
        editor={editor}
        editable={editable}
        onChange={handleChange}
        theme="dark"
      />
    </div>
  );
}
