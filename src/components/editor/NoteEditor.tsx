"use client";

import { useCallback, useRef } from "react";
import { BlockNoteView } from "@blocknote/mantine";
import {
  useCreateBlockNote,
  SuggestionMenuController,
  getDefaultReactSlashMenuItems,
} from "@blocknote/react";
import {
  Block,
  BlockNoteEditor,
  PartialBlock,
  markdownToBlocks,
} from "@blocknote/core";
import { FileUp } from "lucide-react";
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<BlockNoteEditor | null>(null);

  const editor = useCreateBlockNote({
    initialContent: initialContent?.length ? initialContent : undefined,
  });
  editorRef.current = editor;

  const handleChange = useCallback(() => {
    if (onChange) {
      onChange(editor.document);
    }
  }, [editor, onChange]);

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !editorRef.current) return;

      const text = await file.text();
      const blocks = await markdownToBlocks(
        text,
        editorRef.current.pmSchema
      );

      const currentBlock = editorRef.current.getTextCursorPosition().block;
      editorRef.current.insertBlocks(
        blocks as PartialBlock[],
        currentBlock,
        "after"
      );

      // 빈 슬래시 블록 제거
      if (
        currentBlock.content &&
        Array.isArray(currentBlock.content) &&
        currentBlock.content.length === 0
      ) {
        editorRef.current.removeBlocks([currentBlock]);
      }

      // 입력 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    []
  );

  const getSlashMenuItems = useCallback(
    async (query: string) => {
      const defaultItems = getDefaultReactSlashMenuItems(editor);

      const markdownImportItem = {
        title: "마크다운 파일 가져오기",
        subtext: ".md 파일을 에디터에 삽입합니다",
        icon: <FileUp size={18} />,
        aliases: ["markdown", "import", "md", "파일", "업로드"],
        group: "기타",
        onItemClick: () => {
          fileInputRef.current?.click();
        },
      };

      return [...defaultItems, markdownImportItem].filter((item) =>
        item.title.toLowerCase().includes(query.toLowerCase())
      );
    },
    [editor]
  );

  return (
    <div className="min-h-[500px]" key={noteId}>
      <BlockNoteView
        editor={editor}
        editable={editable}
        onChange={handleChange}
        theme="dark"
        slashMenu={false}
      >
        <SuggestionMenuController
          triggerCharacter="/"
          getItems={getSlashMenuItems}
        />
      </BlockNoteView>
      <input
        ref={fileInputRef}
        type="file"
        accept=".md,.markdown,.txt"
        className="hidden"
        onChange={handleFileUpload}
      />
    </div>
  );
}
