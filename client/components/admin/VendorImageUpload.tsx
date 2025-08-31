import React, { useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  X,
  Image as ImageIcon,
  CheckCircle,
  AlertCircle,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ImageFile {
  file: File;
  preview: string;
  type: "logo" | "banner";
  name: string;
  size: number;
}

interface VendorImageUploadProps {
  type: "logo" | "banner";
  imageFile?: ImageFile;
  currentUrl?: string;
  onImageSelect: (file: File, type: "logo" | "banner") => void;
  onRemoveImage: (type: "logo" | "banner") => void;
  disabled?: boolean;
  className?: string;
}

export function VendorImageUpload({
  type,
  imageFile,
  currentUrl,
  onImageSelect,
  onRemoveImage,
  disabled = false,
  className,
}: VendorImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const title = type === "logo" ? "Logo" : "Banner";
  const recommendations = {
    logo: "Recommended: 200x200px, Square ratio",
    banner: "Recommended: 1200x400px, 3:1 ratio",
  };

  const handleFileSelect = (file: File) => {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file (PNG, JPG, GIF, WebP)");
      return;
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    // Additional validation for dimensions (optional)
    const img = new Image();
    img.onload = () => {
      let isValidDimensions = true;
      let warning = "";

      if (type === "logo") {
        // Prefer square logos
        const ratio = img.width / img.height;
        if (ratio < 0.8 || ratio > 1.2) {
          warning = "Logo should ideally be square (1:1 ratio)";
        }
      } else if (type === "banner") {
        // Prefer wide banners
        const ratio = img.width / img.height;
        if (ratio < 2 || ratio > 4) {
          warning = "Banner should ideally be wide (3:1 ratio recommended)";
        }
      }

      if (warning) {
        toast.warning(warning);
      }

      onImageSelect(file, type);
      toast.success(`${title} selected successfully`);
    };

    img.src = URL.createObjectURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleClick = () => {
    if (!disabled) {
      inputRef.current?.click();
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const previewUrl = imageFile?.preview || currentUrl;
  const hasImage = !!previewUrl;

  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            {title}
            {imageFile && (
              <Badge variant="secondary" className="text-xs">
                New
              </Badge>
            )}
            {currentUrl && !imageFile && (
              <Badge variant="outline" className="text-xs">
                Current
              </Badge>
            )}
          </div>
          {hasImage && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setShowPreview(!showPreview)}
            >
              <Eye className="h-3 w-3" />
            </Button>
          )}
        </CardTitle>
        <p className="text-xs text-muted-foreground">{recommendations[type]}</p>
      </CardHeader>

      <CardContent className="space-y-3">
        {hasImage ? (
          <div className="relative group">
            <div
              className={cn(
                "relative overflow-hidden rounded-lg border transition-all",
                showPreview ? "h-auto" : type === "logo" ? "h-32" : "h-24",
              )}
            >
              <img
                src={previewUrl}
                alt={`${title} preview`}
                className={cn(
                  "w-full object-cover transition-all",
                  showPreview ? "h-auto max-h-96" : "h-full",
                )}
              />

              {/* Overlay with actions */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleClick}
                  disabled={disabled}
                >
                  Replace
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => onRemoveImage(type)}
                  disabled={disabled}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* File info */}
            <div className="absolute bottom-2 left-2 bg-black/75 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
              {imageFile ? (
                <>
                  <CheckCircle className="h-3 w-3 text-green-400" />
                  {formatFileSize(imageFile.size)}
                </>
              ) : (
                "Current"
              )}
            </div>
          </div>
        ) : (
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all",
              dragOver
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-muted-foreground/50",
              disabled && "opacity-50 cursor-not-allowed",
            )}
            onClick={handleClick}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">
              {dragOver
                ? `Drop ${title.toLowerCase()} here`
                : `Upload ${title}`}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Drag & drop or click to browse
            </p>
            <p className="text-xs text-muted-foreground">
              PNG, JPG, GIF, WebP up to 5MB
            </p>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleInputChange}
          disabled={disabled}
        />

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleClick}
          disabled={disabled}
        >
          <Upload className="h-4 w-4 mr-2" />
          {hasImage ? `Replace ${title}` : `Upload ${title}`}
        </Button>

        {/* Image requirements */}
        <div className="text-xs text-muted-foreground space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-1 w-1 bg-muted-foreground rounded-full" />
            <span>High quality images work best</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-1 w-1 bg-muted-foreground rounded-full" />
            <span>Transparent backgrounds supported</span>
          </div>
          {type === "logo" && (
            <div className="flex items-center gap-2">
              <div className="h-1 w-1 bg-muted-foreground rounded-full" />
              <span>Will be displayed at various sizes</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
