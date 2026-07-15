import DOMPurify from 'dompurify';

const HTML_TAG_PATTERN = /<\/?[a-z][\s\S]*>/i;
const MARKDOWN_PATTERN = /^#{1,6}\s|^\s*[-*+]\s|^\s*\d+\.\s|\*\*|__|\[.+\]\(.+\)/m;

export const isHtmlContent = (value) => HTML_TAG_PATTERN.test(value || '');

export const isMarkdownContent = (value) => {
    const text = value?.trim();
    if (!text || isHtmlContent(text)) return false;
    return MARKDOWN_PATTERN.test(text);
};

export const sanitizeRichHtml = (html) =>
    DOMPurify.sanitize(html || '', {
        ALLOWED_TAGS: [
            'p',
            'br',
            'strong',
            'b',
            'em',
            'i',
            'u',
            's',
            'ul',
            'ol',
            'li',
            'h2',
            'h3',
            'blockquote',
        ],
        ALLOWED_ATTR: [],
    });

export const normalizeEditorHtml = (html) => {
    const trimmed = html?.trim();
    if (!trimmed || trimmed === '<p></p>' || trimmed === '<p><br></p>') return '';
    return sanitizeRichHtml(trimmed);
};

export const plainTextLength = (html) => {
    const div = document.createElement('div');
    div.innerHTML = sanitizeRichHtml(html);
    return (div.textContent || '').trim().length;
};

const escapeHtml = (value) =>
    value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

/** Chuẩn hóa giá trị từ API (HTML / markdown / text) trước khi đưa vào TipTap. */
export const toEditorContent = (value) => {
    const text = value?.trim();
    if (!text) return '';
    if (isHtmlContent(text)) return sanitizeRichHtml(text);

    return text
        .split(/\n{2,}/)
        .map((block) => `<p>${escapeHtml(block).replace(/\n/g, '<br>')}</p>`)
        .join('');
};
