import { useCallback, useEffect, useMemo, useRef } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import {
    normalizeEditorHtml,
    plainTextLength,
    toEditorContent,
} from '../../utils/richTextUtils.js';
import '../../assets/styles/RichTextEditor.css';

const ToolbarButton = ({ title, active, disabled, className = '', onClick, children }) => (
    <button
        type="button"
        className={`rich-text-editor__btn${active ? ' rich-text-editor__btn--active' : ''}${
            className ? ` ${className}` : ''
        }`}
        title={title}
        disabled={disabled}
        onClick={onClick}
    >
        {children}
    </button>
);

const IconBulletList = () => (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
        <circle cx="3" cy="4.5" r="1.25" fill="currentColor" />
        <rect x="6" y="3.6" width="9" height="1.8" rx="0.9" fill="currentColor" />
        <circle cx="3" cy="9" r="1.25" fill="currentColor" />
        <rect x="6" y="8.1" width="9" height="1.8" rx="0.9" fill="currentColor" />
        <circle cx="3" cy="13.5" r="1.25" fill="currentColor" />
        <rect x="6" y="12.6" width="9" height="1.8" rx="0.9" fill="currentColor" />
    </svg>
);

const IconOrderedList = () => (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
        <text x="1.5" y="6" fontSize="5.5" fontWeight="700" fill="currentColor">
            1
        </text>
        <rect x="6" y="3.6" width="9" height="1.8" rx="0.9" fill="currentColor" />
        <text x="1.5" y="10.5" fontSize="5.5" fontWeight="700" fill="currentColor">
            2
        </text>
        <rect x="6" y="8.1" width="9" height="1.8" rx="0.9" fill="currentColor" />
        <text x="1.5" y="15" fontSize="5.5" fontWeight="700" fill="currentColor">
            3
        </text>
        <rect x="6" y="12.6" width="9" height="1.8" rx="0.9" fill="currentColor" />
    </svg>
);

const RichTextEditor = ({
    id,
    value = '',
    onChange,
    disabled = false,
    rows = 6,
    placeholder = '',
    template = '',
    autoInsertTemplate = true,
    insertTemplateRef,
    maxLength,
}) => {
    const minHeight = Math.max(140, rows * 24);
    const templateInsertedRef = useRef(false);

    const extensions = useMemo(
        () => [
            StarterKit.configure({
                heading: { levels: [2, 3] },
            }),
            Underline,
            Placeholder.configure({
                placeholder: placeholder || 'Nhập nội dung...',
            }),
        ],
        [placeholder]
    );

    const editor = useEditor({
        extensions,
        content: toEditorContent(value) || '<p></p>',
        editable: !disabled,
        onUpdate: ({ editor: ed }) => {
            onChange?.(normalizeEditorHtml(ed.getHTML()));
        },
    });

    useEffect(() => {
        if (!editor) return;
        editor.setEditable(!disabled);
    }, [disabled, editor]);

    useEffect(() => {
        if (!editor) return;
        const current = normalizeEditorHtml(editor.getHTML());
        const next = normalizeEditorHtml(toEditorContent(value));
        if (current !== next) {
            editor.commands.setContent(next || '<p></p>', false);
        }
        if (next) {
            templateInsertedRef.current = true;
        }
    }, [editor, value]);

    const handleInsertTemplate = useCallback(() => {
        if (!editor || !template || disabled) return;
        editor.commands.setContent(template, false);
        templateInsertedRef.current = true;
        onChange?.(normalizeEditorHtml(template));
        editor.commands.focus('end');
    }, [disabled, editor, onChange, template]);

    useEffect(() => {
        if (!editor || disabled || !template || !autoInsertTemplate) return;
        if (templateInsertedRef.current) return;

        const current = normalizeEditorHtml(toEditorContent(value));
        if (current) {
            templateInsertedRef.current = true;
            return;
        }

        handleInsertTemplate();
    }, [autoInsertTemplate, disabled, editor, handleInsertTemplate, template, value]);

    useEffect(() => {
        if (!insertTemplateRef) return undefined;
        insertTemplateRef.current = handleInsertTemplate;
        return () => {
            insertTemplateRef.current = null;
        };
    }, [handleInsertTemplate, insertTemplateRef]);

    const charCount = editor ? plainTextLength(editor.getHTML()) : 0;
    const isOverLimit = maxLength != null && charCount > maxLength;

    if (!editor) return null;

    return (
        <div className={`rich-text-editor${disabled ? ' rich-text-editor--disabled' : ''}`}>
            <div className="rich-text-editor__frame" id={id}>
                <div className="rich-text-editor__toolbar">
                    <div className="rich-text-editor__toolbar-group">
                        <ToolbarButton
                            title="In đậm"
                            active={editor.isActive('bold')}
                            disabled={disabled}
                            onClick={() => editor.chain().focus().toggleBold().run()}
                        >
                            B
                        </ToolbarButton>
                        <ToolbarButton
                            title="In nghiêng"
                            className="rich-text-editor__btn--italic"
                            active={editor.isActive('italic')}
                            disabled={disabled}
                            onClick={() => editor.chain().focus().toggleItalic().run()}
                        >
                            I
                        </ToolbarButton>
                        <ToolbarButton
                            title="Gạch chân"
                            className="rich-text-editor__btn--underline"
                            active={editor.isActive('underline')}
                            disabled={disabled}
                            onClick={() => editor.chain().focus().toggleUnderline().run()}
                        >
                            U
                        </ToolbarButton>
                        <ToolbarButton
                            title="Gạch ngang"
                            className="rich-text-editor__btn--strike"
                            active={editor.isActive('strike')}
                            disabled={disabled}
                            onClick={() => editor.chain().focus().toggleStrike().run()}
                        >
                            S
                        </ToolbarButton>

                        <span className="rich-text-editor__toolbar-divider" aria-hidden />

                        <ToolbarButton
                            title="Danh sách gạch đầu dòng"
                            active={editor.isActive('bulletList')}
                            disabled={disabled}
                            onClick={() => editor.chain().focus().toggleBulletList().run()}
                        >
                            <IconBulletList />
                        </ToolbarButton>
                        <ToolbarButton
                            title="Danh sách đánh số"
                            active={editor.isActive('orderedList')}
                            disabled={disabled}
                            onClick={() => editor.chain().focus().toggleOrderedList().run()}
                        >
                            <IconOrderedList />
                        </ToolbarButton>
                        <ToolbarButton
                            title="Tiêu đề"
                            active={editor.isActive('heading', { level: 2 })}
                            disabled={disabled}
                            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                        >
                            H
                        </ToolbarButton>
                        <ToolbarButton
                            title="Xóa định dạng"
                            disabled={disabled}
                            onClick={() =>
                                editor.chain().focus().clearNodes().unsetAllMarks().run()
                            }
                        >
                            ⌫
                        </ToolbarButton>
                    </div>

                    {maxLength != null && (
                        <span
                            className={`rich-text-editor__counter${
                                isOverLimit ? ' rich-text-editor__counter--over' : ''
                            }`}
                        >
                            {charCount}/{maxLength}
                        </span>
                    )}
                </div>

                <div className="rich-text-editor__body" style={{ minHeight }}>
                    <EditorContent editor={editor} className="rich-text-editor__content" />
                </div>
            </div>
        </div>
    );
};

export default RichTextEditor;
