import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SendIcon, FileIcon, ImageIcon, XIcon } from "lucide-react";
import {
  formatChatAttachmentSize,
  validateChatAttachment,
} from "@/modules/chat/lib/chat-attachment-policy.js";

function isImageFile(file) {
  return file && file.type.startsWith("image/");
}

function isVideoFile(file) {
  return file && file.type.startsWith("video/");
}

export default function MediaUploadDialog({ open, file, onSend, onCancel }) {
  const [comment, setComment] = useState("");

  const isImage = file ? isImageFile(file) : false;
  const isVideo = file ? isVideoFile(file) : false;
  const validation = file ? validateChatAttachment(file) : null;
  const fileType = validation?.mediaType || (isImage ? "image" : isVideo ? "video" : "file");
  const preview = React.useMemo(() => {
    if (!file || (!isImage && !isVideo)) return null;
    return URL.createObjectURL(file);
  }, [file, isImage, isVideo]);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handleSend = useCallback(() => {
    if (file) {
      onSend(file, comment, fileType);
      setComment("");
    }
  }, [file, comment, fileType, onSend]);

  const handleCancel = useCallback(() => {
    setComment("");
    onCancel();
  }, [onCancel]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleCancel()}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none bg-background/95 backdrop-blur-xl shadow-2xl rounded-[24px]">
        <DialogHeader className="p-4 border-b bg-muted/30 flex flex-row items-center justify-between space-y-0">
          <DialogTitle className="text-sm font-bold flex items-center gap-2">
            {isImage ? <ImageIcon className="size-4 text-primary" /> : isVideo ? <SendIcon className="size-4 text-primary rotate-45" /> : <FileIcon className="size-4 text-primary" />}
            {isImage ? "Rasm yuborish" : isVideo ? "Video yuborish" : "Fayl yuborish"}
          </DialogTitle>
          <Button variant="ghost" size="icon" className="size-8 rounded-full" onClick={handleCancel}>
            <XIcon className="size-4" />
          </Button>
        </DialogHeader>

        <div className="flex flex-col">
          {/* Main Preview Area */}
          <div className="min-h-[300px] max-h-[60vh] bg-black/5 flex items-center justify-center p-4 relative group">
            {isImage && preview ? (
              <img loading="lazy"
                src={preview}
                alt="Preview"
                className="max-w-full max-h-[50vh] object-contain rounded-lg shadow-lg"
              />
            ) : isVideo && preview ? (
              <video
                src={preview}
                controls
                className="max-w-full max-h-[50vh] object-contain rounded-lg shadow-lg"
              />
            ) : file ? (
              <div className="flex flex-col items-center gap-4 py-12">
                <div className="size-24 rounded-[32px] bg-primary/10 flex items-center justify-center shadow-inner">
                  <FileIcon className="size-10 text-primary" />
                </div>
                <div className="text-center space-y-1">
                  <p className="font-black text-lg max-w-[300px] truncate">{file.name}</p>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{formatChatAttachmentSize(file.size)}</p>
                </div>
              </div>
            ) : null}
          </div>

          {/* Comment & Send Section (Telegram Style) */}
          <div className="p-4 bg-background border-t space-y-4">
            <div className="relative group">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Izoh qo'shish..."
                rows={1}
                className="w-full min-h-[44px] max-h-[120px] bg-muted/50 hover:bg-muted border-none rounded-[18px] px-4 py-3 text-sm resize-none focus:ring-2 focus:ring-primary/20 outline-none transition-all pr-12"
                style={{ height: 'auto' }}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = e.target.scrollHeight + 'px';
                }}
              />
              <Button 
                size="icon" 
                className="absolute right-1.5 bottom-1.5 size-8 rounded-full shadow-lg"
                onClick={handleSend}
                disabled={!file}
              >
                <SendIcon className="size-4" />
              </Button>
            </div>
            
            <div className="flex items-center justify-between text-[10px] text-muted-foreground px-1 font-medium">
              <span>{file ? `${validation?.policy?.label || "Fayl"} • ${formatChatAttachmentSize(file.size)}` : "Enter orqali tezkor yuborish"}</span>
              <button onClick={handleCancel} className="hover:text-foreground transition-colors uppercase tracking-wider font-bold">Bekor qilish</button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
