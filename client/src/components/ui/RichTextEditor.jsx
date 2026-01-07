import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import FontFamily from "@tiptap/extension-font-family";
import Highlight from "@tiptap/extension-highlight";
import { Extension } from "@tiptap/core";

import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  Link as LinkIcon,
  Undo,
  Redo,
  Underline as UnderlineIcon,
  Highlighter,
  Type,
  Minus,
  Plus,
} from "lucide-react";
import { cx } from "class-variance-authority";
import { useEffect, useState } from "react";
import { serializeToWhatsApp } from "../../services/whatsapp-serializer";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

// Custom FontSize extension
const FontSize = Extension.create({
  name: "fontSize",
  addOptions() {
    return {
      types: ["textStyle"],
    };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element) =>
              element.style.fontSize.replace(/['"]+/g, ""),
            renderHTML: (attributes) => {
              if (!attributes.fontSize) {
                return {};
              }
              return {
                style: `font-size: ${attributes.fontSize}`,
              };
            },
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setFontSize:
        (fontSize) =>
        ({ chain }) => {
          return chain().setMark("textStyle", { fontSize }).run();
        },
      unsetFontSize:
        () =>
        ({ chain }) => {
          return chain()
            .setMark("textStyle", { fontSize: null })
            .removeEmptyTextStyle()
            .run();
        },
    };
  },
});

// Define some font options
const FONTS = [
  { name: "Sans Serif", value: "ui-sans-serif, system-ui, sans-serif" },
  { name: "Serif", value: "ui-serif, Georgia, Cambria, serif" },
  { name: "Monospace", value: "ui-monospace, SFMono-Regular, monospace" },
  { name: "Comic Sans", value: '"Comic Sans MS", "Comic Sans", cursive' },
];

const COLORS = [
  "#000000",
  "#ef4444",
  "#22c55e",
  "#3b82f6",
  "#eab308",
  "#a855f7",
  "#ffffff",
];

const MenuBar = ({ editor, minimal }) => {
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

  if (!editor) {
    return null;
  }

  const openLinkDialog = () => {
    const previousUrl = editor.getAttributes("link").href;
    setLinkUrl(previousUrl || "");
    setLinkDialogOpen(true);
  };

  const setLink = () => {
    // cancelled
    if (linkUrl === null) {
      return;
    }

    // empty
    if (linkUrl === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      setLinkDialogOpen(false);
      return;
    }

    // update
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: linkUrl })
      .run();

    setLinkDialogOpen(false);
  };

  const adjustFontSize = (delta) => {
    const currentAttributes = editor.getAttributes("textStyle");
    let currentSize = parseInt(currentAttributes.fontSize || "16", 10); // Default to 16px
    const newSize = Math.max(8, currentSize + delta); // Min 8px
    editor.chain().focus().setFontSize(`${newSize}px`).run();
  };

  return (
    <div className="flex flex-wrap gap-1 p-1 border-b bg-muted/20 items-center">
      {/* History */}
      <div className="flex gap-1 mr-2">
        <button
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().chain().focus().undo().run()}
          className="p-1.5 rounded hover:bg-muted disabled:opacity-50"
          title="Undo"
        >
          <Undo size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().chain().focus().redo().run()}
          className="p-1.5 rounded hover:bg-muted disabled:opacity-50"
          title="Redo"
        >
          <Redo size={16} />
        </button>
      </div>

      <div className="w-px h-6 bg-border mx-1 my-auto" />

      {/* Basic Formatting */}
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={cx(
          "p-1.5 rounded hover:bg-muted",
          editor.isActive("bold") ? "bg-indigo-100 text-indigo-700" : ""
        )}
        title="Bold"
      >
        <Bold size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={cx(
          "p-1.5 rounded hover:bg-muted",
          editor.isActive("italic") ? "bg-indigo-100 text-indigo-700" : ""
        )}
        title="Italic"
      >
        <Italic size={16} />
      </button>

      {/* Extended Formatting (Email Only) */}
      {!minimal && (
        <>
          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={cx(
              "p-1.5 rounded hover:bg-muted",
              editor.isActive("underline")
                ? "bg-indigo-100 text-indigo-700"
                : ""
            )}
            title="Underline"
          >
            <UnderlineIcon size={16} />
          </button>
        </>
      )}

      <button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        disabled={!editor.can().chain().focus().toggleStrike().run()}
        className={cx(
          "p-1.5 rounded hover:bg-muted",
          editor.isActive("strike") ? "bg-indigo-100 text-indigo-700" : ""
        )}
        title="Strikethrough"
      >
        <Strikethrough size={16} />
      </button>

      <button
        onClick={() => editor.chain().focus().toggleCode().run()}
        disabled={!editor.can().chain().focus().toggleCode().run()}
        className={cx(
          "p-1.5 rounded hover:bg-muted",
          editor.isActive("code") ? "bg-indigo-100 text-indigo-700" : ""
        )}
        title="Code"
      >
        <Code size={16} />
      </button>

      <div className="w-px h-6 bg-border mx-1 my-auto" />

      {/* Lists */}
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={cx(
          "p-1.5 rounded hover:bg-muted",
          editor.isActive("bulletList") ? "bg-indigo-100 text-indigo-700" : ""
        )}
        title="Bullet List"
      >
        <List size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={cx(
          "p-1.5 rounded hover:bg-muted",
          editor.isActive("orderedList") ? "bg-indigo-100 text-indigo-700" : ""
        )}
        title="Ordered List"
      >
        <ListOrdered size={16} />
      </button>

      {/* Advanced Styles (Email Only) */}
      {!minimal && (
        <>
          <div className="w-px h-6 bg-border mx-1 my-auto" />

          {/* Font Size Controls */}
          <button
            onClick={() => adjustFontSize(2)}
            className="p-1.5 rounded hover:bg-muted"
            title="Increase Font Size"
          >
            <Plus size={16} />
          </button>
          <button
            onClick={() => adjustFontSize(-2)}
            className="p-1.5 rounded hover:bg-muted"
            title="Decrease Font Size"
          >
            <Minus size={16} />
          </button>

          {/* Font Family */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                className="p-1.5 rounded hover:bg-muted flex items-center gap-1 text-xs font-medium w-24 truncate justify-between border"
                title="Font Family"
              >
                Font <ChevronDown size={12} />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-40 p-1">
              <div className="grid gap-1">
                {FONTS.map((font) => (
                  <button
                    key={font.name}
                    onClick={() =>
                      editor.chain().focus().setFontFamily(font.value).run()
                    }
                    className={cx(
                      "text-left px-2 py-1 text-sm rounded hover:bg-muted",
                      editor.isActive("textStyle", { fontFamily: font.value })
                        ? "bg-indigo-100 text-indigo-700"
                        : ""
                    )}
                    style={{ fontFamily: font.value }}
                  >
                    {font.name}
                  </button>
                ))}
                <button
                  onClick={() => editor.chain().focus().unsetFontFamily().run()}
                  className="text-left px-2 py-1 text-sm rounded hover:bg-muted text-muted-foreground border-t mt-1"
                >
                  Default
                </button>
              </div>
            </PopoverContent>
          </Popover>

          {/* Text Color */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                className="p-1.5 rounded hover:bg-muted relative group"
                title="Text Color"
              >
                <Type size={16} />
                <span
                  className="absolute bottom-1 right-1 w-2 h-2 rounded-full border border-white"
                  style={{
                    backgroundColor: editor.getAttributes("textStyle").color,
                  }}
                />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2">
              <div className="text-xs font-medium mb-2">Text Color</div>
              <div className="flex flex-wrap gap-1 max-w-[160px]">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => editor.chain().focus().setColor(color).run()}
                    className="w-6 h-6 rounded border hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
                <button
                  onClick={() => editor.chain().focus().unsetColor().run()}
                  className="px-2 text-xs border rounded hover:bg-muted ml-auto"
                >
                  Reset
                </button>
              </div>
            </PopoverContent>
          </Popover>

          {/* Highlight Color */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                className={cx(
                  "p-1.5 rounded hover:bg-muted",
                  editor.isActive("highlight")
                    ? "bg-indigo-100 text-indigo-700"
                    : ""
                )}
                title="Highlight"
              >
                <Highlighter size={16} />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2">
              <div className="text-xs font-medium mb-2">Highlight Color</div>
              <div className="flex flex-wrap gap-1 max-w-[160px]">
                {["#fef08a", "#bbf7d0", "#bfdbfe", "#fbcfe8"].map((color) => (
                  <button
                    key={color}
                    onClick={() =>
                      editor.chain().focus().toggleHighlight({ color }).run()
                    }
                    className="w-6 h-6 rounded border hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                  />
                ))}
                <button
                  onClick={() => editor.chain().focus().unsetHighlight().run()}
                  className="px-2 text-xs border rounded hover:bg-muted ml-auto"
                >
                  Reset
                </button>
              </div>
            </PopoverContent>
          </Popover>

          <div className="w-px h-6 bg-border mx-1 my-auto" />

          {/* Link */}
          <button
            onClick={openLinkDialog}
            className={cx(
              "p-1.5 rounded hover:bg-muted",
              editor.isActive("link") ? "bg-indigo-100 text-indigo-700" : ""
            )}
            title="Link"
          >
            <LinkIcon size={16} />
          </button>
        </>
      )}

      {/* Link Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Insert Link</DialogTitle>
          </DialogHeader>
          <div className="flex items-center space-x-2">
            <div className="grid flex-1 gap-2">
              <Label htmlFor="link-url" className="sr-only">
                Link
              </Label>
              <Input
                id="link-url"
                placeholder="https://example.com"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setLinkDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button type="button" onClick={setLink}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Simple Chevron for font dropdown
const ChevronDown = ({ size = 16 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
);

export default function RichTextEditor({
  value,
  onChange,
  className,
  mode = "html", // 'html' or 'whatsapp'
  placeholder = "",
  disabled = false,
}) {
  const isWhatsApp = mode === "whatsapp";

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false, // TODO : Making this as `false` becase marks are not preserved when I try to preserve attrs, awaiting a bit of help
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false, // TODO : Making this as `false` becase marks are not preserved when I try to preserve attrs, awaiting a bit of help
        },
      }),
      Underline,
      TextStyle,
      Color,
      FontFamily,
      FontSize, // Added custom FontSize extension
      Highlight.configure({
        multicolor: true,
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        // Add custom class for blue links
        HTMLAttributes: {
          class: "text-blue-500 underline cursor-pointer",
        },
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm w-full max-w-none focus:outline-none min-h-[150px] p-3 prose-li:marker:text-foreground prose-a:text-blue-600",
      },
    },
    onUpdate: ({ editor }) => {
      if (isWhatsApp) {
        const json = editor.getJSON();
        const waText = serializeToWhatsApp(json);
        onChange(waText);
      } else {
        onChange(editor.getHTML());
      }
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML() && !isWhatsApp) {
      // editor.commands.setContent(value);
    }
  }, [value, editor, isWhatsApp]);

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [editor, disabled]);

  return (
    <div
      className={cx(
        "border rounded-md overflow-hidden bg-white focus-within:ring-2 ring-indigo-500/20 transition-all",
        disabled && "opacity-60 pointer-events-none",
        className
      )}
    >
      <MenuBar editor={editor} minimal={isWhatsApp} />
      <EditorContent editor={editor} className="cursor-text" />
      {isWhatsApp && (
        <div className="px-3 py-1 bg-muted/30 text-[10px] text-muted-foreground border-t flex gap-3">
          <span>*bold*</span>
          <span>_italic_</span>
          <span>~strikethrough~</span>
          <span>`code`</span>
        </div>
      )}
    </div>
  );
}
