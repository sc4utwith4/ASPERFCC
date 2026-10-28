import { useEffect } from "react";
import { EditorContent, useEditor, useEditorState, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Highlight from "@tiptap/extension-highlight";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { Bold, Heading2, Highlighter, Italic, List, ListChecks, Quote } from "lucide-react";
import { cx } from "@/components/ui";

const MARCA_TEXTOS = [
  { cor: "var(--highlight-note)", rotulo: "Destaque ocre", amostra: "bg-note" },
  { cor: "var(--highlight-sage)", rotulo: "Destaque sálvia", amostra: "bg-accent-soft" },
  { cor: "var(--highlight-slate)", rotulo: "Destaque ardósia", amostra: "bg-accent-2-soft" },
];

/** Editor da coluna principal da nota Cornell (TipTap), com barra de formatação silenciosa. */
export function EditorCornell({ conteudo, onChange, rotulo }: { conteudo: JSONContent; onChange: (c: JSONContent) => void; rotulo: string }) {
  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: { levels: [2, 3] }, link: false }), Highlight.configure({ multicolor: true }), TaskList, TaskItem.configure({ nested: true })],
    content: conteudo,
    editorProps: { attributes: { class: "reading editor-cornell min-h-[320px] max-w-none focus:outline-none", "aria-label": rotulo, role: "textbox", "aria-multiline": "true" } },
    onUpdate: ({ editor: e }) => onChange(e.getJSON()),
    immediatelyRender: true,
  });

  useEffect(() => {
    if (editor && JSON.stringify(editor.getJSON()) !== JSON.stringify(conteudo)) editor.commands.setContent(conteudo, { emitUpdate: false });
    // Só ao trocar de nota (conteúdo externo diferente).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, rotulo]);

  const estado = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      negrito: e?.isActive("bold") ?? false,
      italico: e?.isActive("italic") ?? false,
      titulo: e?.isActive("heading", { level: 2 }) ?? false,
      citacao: e?.isActive("blockquote") ?? false,
      lista: e?.isActive("bulletList") ?? false,
      checklist: e?.isActive("taskList") ?? false,
      destaque: MARCA_TEXTOS.find((m) => e?.isActive("highlight", { color: m.cor }))?.cor,
    }),
  });

  if (!editor) return null;
  const c = () => editor.chain().focus();
  return (
    <div>
      <div role="toolbar" aria-label="Formatação" className="mb-3 flex flex-wrap items-center gap-0.5 border-b border-line pb-2">
        <BotaoFerramenta ativo={estado?.negrito} rotulo="Negrito (Ctrl+B)" onClick={() => c().toggleBold().run()}>
          <Bold size={14} strokeWidth={1.8} />
        </BotaoFerramenta>
        <BotaoFerramenta ativo={estado?.italico} rotulo="Itálico (Ctrl+I)" onClick={() => c().toggleItalic().run()}>
          <Italic size={14} strokeWidth={1.8} />
        </BotaoFerramenta>
        <Separador />
        {MARCA_TEXTOS.map((m) => (
          <BotaoFerramenta key={m.cor} ativo={estado?.destaque === m.cor} rotulo={m.rotulo} onClick={() => c().toggleHighlight({ color: m.cor }).run()}>
            <span className={cx("flex items-center gap-1 rounded px-0.5", m.amostra)}>
              <Highlighter size={13} strokeWidth={1.8} />
            </span>
          </BotaoFerramenta>
        ))}
        <Separador />
        <BotaoFerramenta ativo={estado?.titulo} rotulo="Título" onClick={() => c().toggleHeading({ level: 2 }).run()}>
          <Heading2 size={14} strokeWidth={1.8} />
        </BotaoFerramenta>
        <BotaoFerramenta ativo={estado?.citacao} rotulo="Citação" onClick={() => c().toggleBlockquote().run()}>
          <Quote size={14} strokeWidth={1.8} />
        </BotaoFerramenta>
        <BotaoFerramenta ativo={estado?.lista} rotulo="Lista" onClick={() => c().toggleBulletList().run()}>
          <List size={14} strokeWidth={1.8} />
        </BotaoFerramenta>
        <BotaoFerramenta ativo={estado?.checklist} rotulo="Checklist de tópicos" onClick={() => c().toggleTaskList().run()}>
          <ListChecks size={14} strokeWidth={1.8} />
        </BotaoFerramenta>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}

function BotaoFerramenta({ ativo, rotulo, onClick, children }: { ativo?: boolean; rotulo: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={onClick} aria-pressed={!!ativo} aria-label={rotulo} title={rotulo} className={cx("quiet-transition rounded-md p-1.5", ativo ? "bg-surface text-ink" : "text-ink-2 hover:bg-surface hover:text-ink")}>
      {children}
    </button>
  );
}

function Separador() {
  return <span aria-hidden className="mx-1 h-4 w-px bg-line" />;
}
