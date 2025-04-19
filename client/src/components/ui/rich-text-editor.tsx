import { useEffect, useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  readOnly?: boolean;
  height?: string | number;
}

const RichTextEditor = ({
  value,
  onChange,
  placeholder,
  className,
  readOnly = false,
  height = 300,
}: RichTextEditorProps) => {
  const [isMounted, setIsMounted] = useState(false);
  const [editorValue, setEditorValue] = useState(value);

  // Update the editor value when the prop changes
  useEffect(() => {
    setEditorValue(value);
  }, [value]);

  // To prevent hydration issues with SSR
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Custom handler to ensure we update the component state and call the parent onChange
  const handleChange = (content: string) => {
    setEditorValue(content);
    if (onChange) {
      onChange(content);
    }
  };

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      [{ 'script': 'sub' }, { 'script': 'super' }],
      [{ 'indent': '-1' }, { 'indent': '+1' }],
      [{ 'direction': 'rtl' }],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
      ['blockquote', 'code-block'],
      ['link', 'image', 'video'],
      ['clean']
    ],
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'indent',
    'script',
    'direction',
    'color', 'background',
    'align',
    'blockquote', 'code-block',
    'link', 'image', 'video',
  ];

  if (!isMounted) return <div className="h-[300px] border rounded-md bg-background"></div>;

  return (
    <div className={cn('rich-text-editor', className)}>
      <ReactQuill
        theme="snow"
        value={editorValue}
        onChange={handleChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        readOnly={readOnly}
        style={{ height: typeof height === 'number' ? `${height}px` : height }}
      />
    </div>
  );
};

export default RichTextEditor;