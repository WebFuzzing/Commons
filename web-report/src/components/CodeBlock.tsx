import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dracula } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface ICodeEditorProps {
    content: string;
    language: string;
}

export function CodeBlock({ content, language }: ICodeEditorProps) {

    return (
        <SyntaxHighlighter
            language={language}
            style={dracula}
            showLineNumbers
            wrapLines
        >
            {content}
        </SyntaxHighlighter>
    );

}

