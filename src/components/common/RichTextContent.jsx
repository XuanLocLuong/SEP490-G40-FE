import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
    isHtmlContent,
    isMarkdownContent,
    sanitizeRichHtml,
} from '../../utils/richTextUtils.js';
import '../../assets/styles/RichTextContent.css';

/**
 * Hiển thị mô tả: HTML (mới) hoặc fallback Markdown / text thuần (tin cũ).
 */
const RichTextContent = ({ content, className = '', emptyText = 'Chưa có nội dung.' }) => {
    const text = content?.trim();

    if (!text) {
        return (
            <p className={`rich-text-body rich-text-body--empty ${className}`.trim()}>{emptyText}</p>
        );
    }

    if (isHtmlContent(text)) {
        return (
            <div
                className={`rich-text-body ${className}`.trim()}
                dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(text) }}
            />
        );
    }

    if (isMarkdownContent(text)) {
        return (
            <div className={`rich-text-body ${className}`.trim()}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
            </div>
        );
    }

    return <p className={`rich-text-body rich-text-body--plain ${className}`.trim()}>{text}</p>;
};

export default RichTextContent;
