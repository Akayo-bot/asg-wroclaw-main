import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Youtube from '@tiptap/extension-youtube';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Bold, 
  Italic, 
  Underline,
  List,
  ListOrdered,
  Heading2,
  Heading3,
  Quote,
  Image as ImageIcon,
  Youtube as YoutubeIcon
} from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ content, onChange }) => {
  const { t } = useI18n();
  const [imageUrl, setImageUrl] = React.useState('');
  const [youtubeUrl, setYoutubeUrl] = React.useState('');

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
      Youtube.configure({
        controls: false,
        nocookie: true,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) {
    return null;
  }

  const addImage = () => {
    if (imageUrl) {
      editor.chain().focus().setImage({ src: imageUrl }).run();
      setImageUrl('');
    }
  };

  const addYoutube = () => {
    if (youtubeUrl) {
      editor.commands.setYoutubeVideo({
        src: youtubeUrl,
        width: 640,
        height: 480,
      });
      setYoutubeUrl('');
    }
  };

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 p-3 border-b border-border bg-muted/50">
        <Button
          type="button"
          variant={editor.isActive('bold') ? 'default' : 'outline'}
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" />
        </Button>
        
        <Button
          type="button"
          variant={editor.isActive('italic') ? 'default' : 'outline'}
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant={editor.isActive('underline') ? 'default' : 'outline'}
          size="sm"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <Underline className="h-4 w-4" />
        </Button>

        <div className="w-px bg-border mx-1" />

        <Button
          type="button"
          variant={editor.isActive('heading', { level: 2 }) ? 'default' : 'outline'}
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant={editor.isActive('heading', { level: 3 }) ? 'default' : 'outline'}
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <Heading3 className="h-4 w-4" />
        </Button>

        <div className="w-px bg-border mx-1" />

        <Button
          type="button"
          variant={editor.isActive('bulletList') ? 'default' : 'outline'}
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant={editor.isActive('orderedList') ? 'default' : 'outline'}
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant={editor.isActive('blockquote') ? 'default' : 'outline'}
          size="sm"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote className="h-4 w-4" />
        </Button>
      </div>

      {/* Image and YouTube insertion */}
      <div className="flex flex-wrap gap-2 p-3 border-b border-border bg-muted/25">
        <div className="flex items-center gap-2">
          <ImageIcon className="h-4 w-4" />
          <Input
            placeholder={t('admin.imageUrl', 'Image URL')}
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="w-64"
          />
          <Button type="button" size="sm" onClick={addImage}>
            {t('admin.addImage', 'Add Image')}
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <YoutubeIcon className="h-4 w-4" />
          <Input
            placeholder={t('admin.youtubeUrl', 'YouTube URL')}
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            className="w-64"
          />
          <Button type="button" size="sm" onClick={addYoutube}>
            {t('admin.addVideo', 'Add Video')}
          </Button>
        </div>
      </div>

      {/* Editor Content */}
      <EditorContent 
        editor={editor} 
        className="prose prose-sm max-w-none p-4 min-h-[300px] focus-within:outline-none"
      />
    </div>
  );
};

export default RichTextEditor;