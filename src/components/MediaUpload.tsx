import React, { useRef, useState, useCallback } from 'react';
import { Upload, X, Image, Music, Video, FileWarning } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { MediaFile, MediaType } from '@/types/news';
import { fileToBase64, getMediaTypeFromMime } from '@/utils/geminiApi';

interface MediaUploadProps {
  onMediaSelect: (media: MediaFile | null) => void;
  selectedMedia: MediaFile | null;
  disabled?: boolean;
  className?: string;
}

const ACCEPTED_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3', 'audio/m4a'],
  video: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime']
};

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB limit for Gemini

const MediaUpload: React.FC<MediaUploadProps> = ({
  onMediaSelect,
  selectedMedia,
  disabled = false,
  className
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getAllAcceptedTypes = () => {
    return [...ACCEPTED_TYPES.image, ...ACCEPTED_TYPES.audio, ...ACCEPTED_TYPES.video];
  };

  const getMediaIcon = (type: MediaType) => {
    switch (type) {
      case 'image':
        return <Image className="h-8 w-8 text-primary" />;
      case 'audio':
        return <Music className="h-8 w-8 text-primary" />;
      case 'video':
        return <Video className="h-8 w-8 text-primary" />;
      default:
        return <Upload className="h-8 w-8 text-muted-foreground" />;
    }
  };

  const processFile = useCallback(async (file: File) => {
    setError(null);

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      setError(`File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`);
      return;
    }

    // Check file type
    const acceptedTypes = getAllAcceptedTypes();
    if (!acceptedTypes.includes(file.type)) {
      setError('Unsupported file type. Please upload an image, audio, or video file.');
      return;
    }

    const mediaType = getMediaTypeFromMime(file.type);
    
    try {
      // Convert to base64
      const base64 = await fileToBase64(file);
      
      // Create preview URL for images and videos
      let preview: string | undefined;
      if (mediaType === 'image' || mediaType === 'video') {
        preview = URL.createObjectURL(file);
      }

      const mediaFile: MediaFile = {
        file,
        type: mediaType,
        preview,
        base64,
        mimeType: file.type
      };

      onMediaSelect(mediaFile);
    } catch (err) {
      console.error('Error processing file:', err);
      setError('Failed to process file. Please try again.');
    }
  }, [onMediaSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  }, [disabled, processFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  }, [processFile]);

  const handleRemoveMedia = useCallback(() => {
    if (selectedMedia?.preview) {
      URL.revokeObjectURL(selectedMedia.preview);
    }
    onMediaSelect(null);
    setError(null);
  }, [selectedMedia, onMediaSelect]);

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Render preview for selected media
  if (selectedMedia) {
    return (
      <div className={cn('relative', className)}>
        <div className="relative bg-muted/30 rounded-xl border border-border overflow-hidden">
          {/* Media preview */}
          <div className="relative aspect-video flex items-center justify-center bg-black/5">
            {selectedMedia.type === 'image' && selectedMedia.preview && (
              <img 
                src={selectedMedia.preview} 
                alt="Preview" 
                className="max-h-48 max-w-full object-contain"
              />
            )}
            {selectedMedia.type === 'video' && selectedMedia.preview && (
              <video 
                src={selectedMedia.preview} 
                controls 
                className="max-h-48 max-w-full"
              />
            )}
            {selectedMedia.type === 'audio' && (
              <div className="flex flex-col items-center gap-4 p-6">
                <Music className="h-12 w-12 text-primary" />
                <audio 
                  src={selectedMedia.preview || URL.createObjectURL(selectedMedia.file)} 
                  controls 
                  className="w-full max-w-md"
                />
              </div>
            )}
          </div>
          
          {/* File info */}
          <div className="px-4 py-3 flex items-center justify-between border-t border-border bg-muted/20">
            <div className="flex items-center gap-3">
              {getMediaIcon(selectedMedia.type)}
              <div>
                <p className="text-sm font-medium text-foreground truncate max-w-[200px]">
                  {selectedMedia.file.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {(selectedMedia.file.size / 1024 / 1024).toFixed(2)} MB • {selectedMedia.type}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRemoveMedia}
              disabled={disabled}
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('w-full', className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept={getAllAcceptedTypes().join(',')}
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />
      
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'relative border-2 border-dashed rounded-xl p-6 transition-all cursor-pointer',
          'hover:border-primary/50 hover:bg-primary/5',
          isDragging && 'border-primary bg-primary/10',
          disabled && 'opacity-50 cursor-not-allowed hover:border-border hover:bg-transparent',
          error ? 'border-destructive/50' : 'border-border'
        )}
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <div className={cn(
            'h-12 w-12 rounded-full flex items-center justify-center',
            isDragging ? 'bg-primary/20' : 'bg-muted'
          )}>
            <Upload className={cn(
              'h-6 w-6',
              isDragging ? 'text-primary' : 'text-muted-foreground'
            )} />
          </div>
          
          <div>
            <p className="text-sm font-medium text-foreground">
              {isDragging ? 'Drop file here' : 'Upload media to verify'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Drag & drop or click to select
            </p>
          </div>
          
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Image className="h-3 w-3" /> Images
            </span>
            <span className="flex items-center gap-1">
              <Music className="h-3 w-3" /> Audio
            </span>
            <span className="flex items-center gap-1">
              <Video className="h-3 w-3" /> Video
            </span>
          </div>
          
          <p className="text-xs text-muted-foreground">
            Max file size: 20MB
          </p>
        </div>
      </div>
      
      {error && (
        <div className="flex items-center gap-2 mt-2 px-3 py-2 text-xs text-destructive bg-destructive/10 rounded-lg">
          <FileWarning className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default MediaUpload;
