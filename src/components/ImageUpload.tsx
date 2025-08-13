import * as React from "react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, Image } from "lucide-react";
import {
  useUploadImageToStorage,
  useGetPublicImageUrl,
} from "@/integrations/supabase/reactQueryHooks";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/utils/languageContextUtils";

interface ImageUploadProps {
  value: string | string[];
  onChange: (url: string | string[]) => void;
  label?: string;
  placeholder?: string;
  multiple?: boolean;
  maxImages?: number;
  bucket?: string;
}

const ImageUpload = ({
  value,
  onChange,
  label = "image",
  placeholder = "Upload image",
  multiple = false,
  maxImages = 5,
  bucket = "product-images",
}: ImageUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const { t, language } = useLanguage();

  const uploadImageToStorage = useUploadImageToStorage();
  const getPublicImageUrl = useGetPublicImageUrl();

  // دالة لتحويل الصورة إلى WebP في المتصفح
  async function convertToWebP(file: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject("No canvas context");
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject("WebP conversion failed");
          },
          "image/webp",
          0.92,
        );
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  // Resize and compress image before upload
  async function resizeAndCompressImage(
    file: File,
    maxSize = 1024,
    quality = 0.85,
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = Math.round((maxSize / width) * height);
            width = maxSize;
          } else {
            width = Math.round((maxSize / height) * width);
            height = maxSize;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject("No canvas context");
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject("Resize/Compress failed");
          },
          "image/webp",
          quality,
        );
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  const uploadImage = async (file: File): Promise<string> => {
    let uploadFile = file;
    let fileExt = file.name.split(".").pop();
    const fileName = `${Math.random()}`;
    let filePath = fileName;
    if (
      file.type === "image/png" ||
      file.type === "image/jpeg" ||
      file.type === "image/jpg"
    ) {
      try {
        const webpBlob = await resizeAndCompressImage(file, 1024, 0.85);
        uploadFile = new File([webpBlob], fileName + ".webp", {
          type: "image/webp",
        });
        fileExt = "webp";
        filePath = `${fileName}.webp`;
      } catch (e) {
        try {
          const webpBlob = await convertToWebP(file);
          uploadFile = new File([webpBlob], fileName + ".webp", {
            type: "image/webp",
          });
          fileExt = "webp";
          filePath = `${fileName}.webp`;
        } catch {
          filePath = `${fileName}.${fileExt}`;
        }
      }
    } else {
      filePath = `${fileName}.${fileExt}`;
    }
    await uploadImageToStorage.mutateAsync({
      bucket,
      filePath,
      file: uploadFile,
    });
    const url = await getPublicImageUrl.mutateAsync({ bucket, filePath });
    return url;
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setProgress(0);
    setSelectedFiles(Array.from(files));

    try {
      if (multiple) {
        const currentUrls = Array.isArray(value) ? value : [];
        const filesToUpload = Array.from(files).slice(
          0,
          maxImages - currentUrls.length,
        );
        let uploadedCount = 0;
        const uploadPromises = filesToUpload.map(async (file, idx) => {
          const url = await uploadImage(file);
          uploadedCount++;
          setProgress(Math.round((uploadedCount / filesToUpload.length) * 100));
          return url;
        });
        const newUrls = await Promise.all(uploadPromises);
        onChange([...currentUrls, ...newUrls]);
        toast.success(t("imagesUploadedSuccess"));
      } else {
        setProgress(30);
        const url = await uploadImage(files[0]);
        setProgress(100);
        onChange(url);
        toast.success(t("imageUploadedSuccess"));
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error(t("imageUploadFailed"));
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 1000);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setSelectedFiles([]);
    }
  };

  const removeImage = (indexOrUrl: number | string, event?: React.MouseEvent) => {
    // منع انتشار الحدث لتجنب فتح نافذة اختيار الملف
    if (event) {
      event.stopPropagation();
    }
    
    if (multiple && Array.isArray(value)) {
      const newUrls =
        typeof indexOrUrl === "number"
          ? value.filter((_, i) => i !== indexOrUrl)
          : value.filter((url) => url !== indexOrUrl);
      onChange(newUrls);
    } else {
      onChange("");
    }
  };

  const renderImagePreview = () => {
    if (multiple && Array.isArray(value)) {
      return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {value.map((url, index) => (
            <div
              key={index}
              className="relative group shadow-md rounded-xl border bg-white dark:bg-gray-800 hover:shadow-lg transition-all"
            >
              <div 
                className="w-full h-28 bg-center bg-contain bg-no-repeat rounded-t-xl border-b"
                style={{ backgroundImage: `url(${url})` }}
              />
              <div className="px-2 py-1 text-xs text-gray-600 dark:text-gray-300 flex flex-col gap-1 bg-gray-50 dark:bg-gray-900 rounded-b-xl">
                <span>
                  {t("image")} #{index + 1}
                </span>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 underline break-all"
                >
                  {url.split("/").pop()}
                </a>
              </div>
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => removeImage(index, e)}
                aria-label={t("removeImage")}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      );
    } else if (typeof value === "string" && value) {
      return (
        <div className="relative group inline-block shadow-md rounded-xl border bg-white dark:bg-gray-800 hover:shadow-lg transition-all">
          <div 
            className="w-40 h-28 bg-center bg-contain bg-no-repeat rounded-t-xl border-b"
            style={{ backgroundImage: `url(${value})` }}
          />
          <div className="px-2 py-1 text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 rounded-b-xl">
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 underline break-all"
            >
              {value.split("/").pop()}
            </a>
          </div>
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => removeImage(value, e)}
            aria-label={t("removeImage")}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      );
    }
    return null;
  };

  // دعم السحب والإفلات (Drag & Drop)
  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (uploading) return;
    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      // Cast DataTransferList to FileList for handleFileSelect
      const fileList = files as unknown as FileList;
      handleFileSelect({
        target: { files: fileList },
      } as React.ChangeEvent<HTMLInputElement>);
    }
  };
  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const canAddMore = multiple
    ? Array.isArray(value)
      ? value.length < maxImages
      : true
    : !value;

  return (
    <div className="space-y-4">
      <div
        className="rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 p-4 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all cursor-pointer"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current?.click()}
        tabIndex={0}
        role="button"
        aria-label={t("dragAndDropArea")}
      >
        {renderImagePreview()}
        <div className="text-center text-xs text-gray-500 mt-2">
          {t("dragAndDropHint")}
        </div>
      </div>
      {canAddMore && (
        <div className="flex gap-2 items-center">
          <Input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*"
            multiple={multiple}
            className="hidden"
          />
          {uploading && (
            <div className="w-32">
              <Progress value={progress} />
            </div>
          )}
        </div>
      )}

      {multiple && Array.isArray(value) && (
        <p className="text-sm text-gray-500">
          {value.length} / {maxImages} {t("imagesUploaded")}
        </p>
      )}
      {selectedFiles.length > 0 && (
        <div className="mt-2 space-y-1">
          {selectedFiles.map((file, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300"
            >
              <Image className="h-4 w-4 text-gray-400" />
              <span className="truncate max-w-[120px]" title={file.name}>
                {file.name}
              </span>
              <span>({(file.size / 1024).toFixed(1)} KB)</span>
            </div>
          ))}
        </div>
      )}

      {/* Progress bar */}
      {uploading && (
        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
          <div
            className="bg-blue-600 h-2.5 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
