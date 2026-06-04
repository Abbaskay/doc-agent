<template>
  <div class="doc-toolbar" @click.stop v-if="editor">
    <select @change="setHeading($event.target.value)" @click.stop title="Style" :value="currentHeading">
      <option value="p">Normal</option>
      <option value="h1">H1</option>
      <option value="h2">H2</option>
      <option value="h3">H3</option>
    </select>
    <span class="tb-div"></span>
    <select class="tb-font" @change.stop="editor.chain().focus().setFontFamily($event.target.value).run()" title="Font" :value="currentFont">
      <option value="Calibri">Calibri</option>
      <option value="Arial">Arial</option>
      <option value="Times New Roman">Times</option>
      <option value="Georgia">Georgia</option>
      <option value="Courier New">Mono</option>
      <option value="Inter">Inter</option>
    </select>
    <span class="tb-div"></span>
    <button @click.stop="editor.chain().focus().toggleBold().run()" title="Bold" :class="{ active: editor.isActive('bold') }"><b>B</b></button>
    <button @click.stop="editor.chain().focus().toggleItalic().run()" title="Italic" :class="{ active: editor.isActive('italic') }"><i>I</i></button>
    <button @click.stop="editor.chain().focus().toggleUnderline().run()" title="Underline" :class="{ active: editor.isActive('underline') }"><u>U</u></button>
    <button @click.stop="editor.chain().focus().toggleStrike().run()" title="Strikethrough" :class="{ active: editor.isActive('strike') }"><s>S</s></button>
    <span class="tb-div"></span>
    <button @click.stop="editor.chain().focus().toggleBulletList().run()" title="Bullet list" :class="{ active: editor.isActive('bulletList') }">•</button>
    <button @click.stop="editor.chain().focus().toggleOrderedList().run()" title="Numbered list" :class="{ active: editor.isActive('orderedList') }">1.</button>
    <span class="tb-div"></span>
    <button @click.stop="editor.chain().focus().setTextAlign('left').run()" title="Align left" :class="{ active: editor.isActive({ textAlign: 'left' }) }">≡</button>
    <button @click.stop="editor.chain().focus().setTextAlign('center').run()" title="Center" :class="{ active: editor.isActive({ textAlign: 'center' }) }">≡</button>
    <button @click.stop="editor.chain().focus().setTextAlign('right').run()" title="Align right" :class="{ active: editor.isActive({ textAlign: 'right' }) }">≡</button>
    <span class="tb-div"></span>
    <button @click.stop="openLink" title="Insert link">🔗</button>
    <label class="tb-color-label" title="Text color">
      <input type="color" @input="editor.chain().focus().setColor($event.target.value).run()" value="#1d1d1f" class="tb-color-input">
      <span class="tb-color-swatch">🎨</span>
    </label>
    <label class="tb-color-label" title="Highlight color">
      <input type="color" @input="editor.chain().focus().toggleHighlight({ color: $event.target.value }).run()" value="#ffff00" class="tb-color-input">
      <span class="tb-color-swatch">🖍</span>
    </label>
    <span class="tb-div"></span>
    <button @click.stop="editor.chain().focus().undo().run()" title="Undo">↩</button>
    <button @click.stop="editor.chain().focus().redo().run()" title="Redo">↪</button>
    <span class="tb-div"></span>
    <button @click.stop="editor.chain().focus().clearNodes().unsetAllMarks().run()" title="Clear formatting">✕</button>
  </div>
  <editor-content :editor="editor" class="doc-paper" :style="{ transform: `scale(${zoom})` }" />
</template>

<script>
import { Editor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'
import FontFamily from '@tiptap/extension-font-family'
import Highlight from '@tiptap/extension-highlight'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'

export default {
  name: 'DocEditor',
  components: { EditorContent },
  props: {
    initialHtml: { type: String, default: '' },
    zoom: { type: Number, default: 1 },
  },
  emits: ['update:html', 'change'],
  data() {
    return {
      editor: null,
      currentHeading: 'p',
      currentFont: 'Calibri',
    }
  },
  computed: {
    editorOptions() {
      return {
        extensions: [
          StarterKit.configure({
            heading: { levels: [1, 2, 3] },
          }),
          Underline,
          Link.configure({ openOnClick: false }),
          TextAlign.configure({ types: ['heading', 'paragraph'] }),
          FontFamily,
          TextStyle,
          Color,
          Highlight.configure({ multicolor: true }),
        ],
        content: this.initialHtml,
        onUpdate: ({ editor }) => {
          this.$emit('update:html', editor.getHTML())
          this.$emit('change')
        },
        onSelectionUpdate: ({ editor }) => {
          this.updateToolbarState(editor)
        },
      }
    },
  },
  methods: {
    getHtml() {
      if (!this.editor || typeof this.editor.getHTML !== 'function') return this.initialHtml
      return this.editor.getHTML() || this.initialHtml
    },
    setHtml(html) {
      if (this.editor && typeof this.editor.commands?.setContent === 'function' && html) {
        this.editor.commands.setContent(html)
      }
    },
    setHeading(level) {
      if (level === 'p') {
        this.editor.chain().focus().setParagraph().run()
      } else {
        this.editor.chain().focus().setHeading({ level: parseInt(level[1]) }).run()
      }
    },
    openLink() {
      const previousUrl = this.editor.getAttributes('link').href
      const url = prompt('Enter link URL:', previousUrl || 'https://')
      if (url === null) return
      if (url === '') {
        this.editor.chain().focus().unsetLink().run()
      } else {
        this.editor.chain().focus().setLink({ href: url }).run()
      }
    },
    updateToolbarState(editor) {
      if (!editor) return
      if (editor.isActive('heading', { level: 1 })) this.currentHeading = 'h1'
      else if (editor.isActive('heading', { level: 2 })) this.currentHeading = 'h2'
      else if (editor.isActive('heading', { level: 3 })) this.currentHeading = 'h3'
      else this.currentHeading = 'p'
      const font = editor.getAttributes('textStyle')?.fontFamily
      if (font) this.currentFont = font
    },
  },
  mounted() {
    this.editor = new Editor(this.editorOptions)
  },
  beforeUnmount() {
    if (this.editor && typeof this.editor.destroy === 'function') {
      this.editor.destroy()
    }
  },
}
</script>

<style scoped>
.doc-toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 2px; padding: 6px 8px; background: rgba(255,255,255,0.04); border-radius: 10px; margin-bottom: 12px; border: 1px solid rgba(255,255,255,0.06); position: sticky; top: 0; z-index: 5; backdrop-filter: blur(12px); }
.tb-div { width: 1px; height: 22px; background: rgba(255,255,255,0.08); margin: 0 5px; flex-shrink: 0; }
.doc-toolbar button { padding: 4px 8px; border-radius: 6px; border: none; background: transparent; color: var(--text-muted); font-size: 13px; cursor: pointer; transition: all 0.12s ease; font-family: inherit; line-height: 1; }
.doc-toolbar button:hover { background: var(--accent-glow); color: var(--accent); }
.doc-toolbar button:active { transform: scale(0.92); }
.doc-toolbar button.active { background: var(--accent-glow); color: var(--accent); }
.doc-toolbar select { padding: 4px 6px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.06); background: rgba(255,255,255,0.04); color: var(--text-muted); font-size: 12px; cursor: pointer; outline: none; transition: all 0.12s; font-family: inherit; }
.doc-toolbar select:hover { background-color: rgba(255,255,255,0.1); }
.doc-toolbar select:focus { border-color: rgba(107,139,168,0.5); }
.doc-toolbar .tb-font { max-width: 95px; }
.doc-toolbar .tb-color-label { position: relative; width: 32px; height: 32px; cursor: pointer; display: flex; align-items: center; justify-content: center; border-radius: 6px; transition: all 0.12s ease; }
.doc-toolbar .tb-color-label:hover { background: var(--accent-glow); }
.doc-toolbar .tb-color-input { position: absolute; opacity: 0; width: 0; height: 0; pointer-events: none; }
.doc-toolbar .tb-color-swatch { font-size: 14px; line-height: 1; }
.doc-paper { width: 210mm; min-height: 296mm; background: #fff; color: #1d1d1f; padding: 22mm 20mm 18mm; font-family: Calibri, 'Segoe UI', -apple-system, Arial, sans-serif; font-size: 10.5pt; line-height: 1.35; margin: 0 auto; box-shadow: 0 2px 20px rgba(0,0,0,0.08); border-radius: 2px; transform-origin: top center; }
.doc-paper:focus { outline: none; }
:deep(.doc-paper h1) { font-size: 24pt; font-weight: 700; margin: 12pt 0 6pt; }
:deep(.doc-paper h2) { font-size: 18pt; font-weight: 600; margin: 10pt 0 4pt; }
:deep(.doc-paper h3) { font-size: 14pt; font-weight: 600; margin: 8pt 0 4pt; }
:deep(.doc-paper p) { margin: 4pt 0; }
:deep(.doc-paper ul), :deep(.doc-paper ol) { margin: 4pt 0; padding-left: 20pt; }
:deep(.doc-paper a) { color: #0071E3; text-decoration: underline; }
:deep(.doc-paper blockquote) { border-left: 3px solid #d0d0d0; padding-left: 12px; margin: 8px 0; color: #555; }
@media print {
  .doc-toolbar { display: none !important; }
  .doc-paper { box-shadow: none; }
}
</style>
