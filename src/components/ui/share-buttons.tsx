import { useState } from 'react';
import { Share2, Twitter, Facebook, Linkedin, Link2, QrCode, Check } from 'lucide-react';
import { Button } from './button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './dialog';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import QRCode from 'qrcode';

interface ShareButtonsProps {
  url: string;
  title: string;
  description?: string;
  className?: string;
}

export const ShareButtons = ({ url, title, description, className }: ShareButtonsProps) => {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [showQR, setShowQR] = useState(false);
  const { toast } = useToast();

  const fullUrl = url.startsWith('http') ? url : `${window.location.origin}${url}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      toast({
        title: 'Link Copied',
        description: 'The link has been copied to your clipboard',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: 'Failed to Copy',
        description: 'Could not copy link to clipboard',
        variant: 'destructive',
      });
    }
  };

  const generateQRCode = async () => {
    try {
      const qr = await QRCode.toDataURL(fullUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });
      setQrCodeUrl(qr);
      setShowQR(true);
    } catch {
      toast({
        title: 'QR Code Error',
        description: 'Failed to generate QR code',
        variant: 'destructive',
      });
    }
  };

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(fullUrl)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(fullUrl)}`,
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description,
          url: fullUrl,
        });
      } catch {
        // User cancelled share or error occurred
        console.log('Share cancelled or failed');
      }
    } else {
      setOpen(true);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleNativeShare}
        className={cn('flex items-center gap-2', className)}
      >
        <Share2 className="h-4 w-4" />
        <span className="hidden sm:inline">Share</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Verification</DialogTitle>
            <DialogDescription>
              Share this verification with others
            </DialogDescription>
          </DialogHeader>

          {!showQR ? (
            <div className="space-y-4">
              {/* Social Media Buttons */}
              <div className="grid grid-cols-3 gap-3">
                <a
                  href={shareLinks.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:bg-accent transition-colors"
                >
                  <Twitter className="h-6 w-6 text-[#1DA1F2]" />
                  <span className="text-xs">Twitter</span>
                </a>
                
                <a
                  href={shareLinks.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:bg-accent transition-colors"
                >
                  <Facebook className="h-6 w-6 text-[#1877F2]" />
                  <span className="text-xs">Facebook</span>
                </a>
                
                <a
                  href={shareLinks.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:bg-accent transition-colors"
                >
                  <Linkedin className="h-6 w-6 text-[#0A66C2]" />
                  <span className="text-xs">LinkedIn</span>
                </a>
              </div>

              {/* Copy Link */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Copy Link</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={fullUrl}
                    className="flex-1 px-3 py-2 text-sm rounded-md border bg-background"
                  />
                  <Button onClick={handleCopyLink} variant="outline" size="sm">
                    {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* QR Code Button */}
              <Button
                onClick={generateQRCode}
                variant="outline"
                className="w-full"
              >
                <QrCode className="h-4 w-4 mr-2" />
                Generate QR Code
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-center">
                <img src={qrCodeUrl} alt="QR Code" className="rounded-lg border" />
              </div>
              <p className="text-sm text-center text-muted-foreground">
                Scan this code to share the verification
              </p>
              <Button
                onClick={() => setShowQR(false)}
                variant="outline"
                className="w-full"
              >
                Back
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

interface CompactShareButtonProps {
  url: string;
  title: string;
  description?: string;
  className?: string;
}

export const CompactShareButton = ({ url, title, description, className }: CompactShareButtonProps) => {
  const { toast } = useToast();
  
  const fullUrl = url.startsWith('http') ? url : `${window.location.origin}${url}`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description,
          url: fullUrl,
        });
      } catch {
        console.log('Share cancelled or failed');
      }
    } else {
      try {
        await navigator.clipboard.writeText(fullUrl);
        toast({
          title: 'Link Copied',
          description: 'The link has been copied to your clipboard',
        });
      } catch {
        toast({
          title: 'Failed to Copy',
          description: 'Could not copy link to clipboard',
          variant: 'destructive',
        });
      }
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleShare}
      className={cn('h-8 w-8 p-0', className)}
      title="Share"
    >
      <Share2 className="h-4 w-4" />
    </Button>
  );
};
