"use client";

import { useState, useRef, useCallback, DragEvent } from "react";
import { Icon } from "./Icon";

interface ImageDropZoneProps {
    previewUrl: string | null;
    onImageSelect: (file: File) => Promise<void>;
    onRemove: () => void;
    isUploading?: boolean;
    maxSize?: number; // bytes, default 5MB
    accept?: string;
    className?: string;
}

export function ImageDropZone({
    previewUrl,
    onImageSelect,
    onRemove,
    isUploading = false,
    maxSize = 5 * 1024 * 1024,
    accept = "image/*",
    className = "",
}: ImageDropZoneProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const validateFile = useCallback(
        (file: File): string | null => {
            if (!file.type.startsWith("image/")) {
                return "이미지 파일만 업로드할 수 있습니다.";
            }
            if (file.size > maxSize) {
                return `이미지 크기는 ${Math.round(maxSize / 1024 / 1024)}MB 이하여야 합니다.`;
            }
            return null;
        },
        [maxSize],
    );

    const handleFile = useCallback(
        async (file: File) => {
            const validationError = validateFile(file);
            if (validationError) {
                setError(validationError);
                return;
            }
            setError(null);
            await onImageSelect(file);
        },
        [validateFile, onImageSelect],
    );

    const handleDragEnter = useCallback((e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDrop = useCallback(
        async (e: DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(false);

            const files = e.dataTransfer.files;
            if (files && files.length > 0) {
                await handleFile(files[0]);
            }
        },
        [handleFile],
    );

    const handleFileInput = useCallback(
        async (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file) {
                await handleFile(file);
            }
            // 같은 파일 다시 선택 가능하도록 초기화
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        },
        [handleFile],
    );

    const handleClick = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    return (
        <div className={className}>
            <div
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={!previewUrl ? handleClick : undefined}
                className={`
          relative w-full aspect-video rounded-lg overflow-hidden transition-all
          ${
              previewUrl
                  ? "border border-slate-200 dark:border-slate-700"
                  : `border-2 border-dashed cursor-pointer
                 ${
                     isDragging
                         ? "border-primary bg-primary/10"
                         : "border-slate-300 dark:border-slate-600 hover:border-primary hover:bg-slate-50 dark:hover:bg-slate-800"
                 }`
          }
          ${isUploading ? "pointer-events-none opacity-70" : ""}
        `}
            >
                {previewUrl ? (
                    <>
                        <img
                            src={previewUrl}
                            alt="Preview"
                            className="w-full h-full object-cover"
                        />
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onRemove();
                            }}
                            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg flex items-center justify-center"
                        >
                            <Icon name="close" size="sm" />
                        </button>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleClick();
                            }}
                            className="absolute bottom-2 right-2 px-3 py-1.5 bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-colors shadow-lg text-sm font-medium flex items-center justify-center"
                        >
                            <Icon
                                name="edit"
                                size="sm"
                                className="inline mr-1"
                            />
                            변경
                        </button>
                    </>
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                        {isUploading ? (
                            <>
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-3"></div>
                                <p className="text-slate-500 dark:text-slate-400">
                                    업로드 중...
                                </p>
                            </>
                        ) : (
                            <>
                                <Icon
                                    name={
                                        isDragging ? "download" : "cloud_upload"
                                    }
                                    className={`text-4xl mb-3 ${
                                        isDragging
                                            ? "text-primary"
                                            : "text-slate-400 dark:text-slate-500"
                                    }`}
                                />
                                <p className="text-slate-600 dark:text-slate-400 text-center font-medium">
                                    {isDragging
                                        ? "여기에 놓으세요"
                                        : "이미지를 드래그하거나 클릭하여 업로드"}
                                </p>
                                <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">
                                    JPG, PNG, GIF (최대{" "}
                                    {Math.round(maxSize / 1024 / 1024)}MB)
                                </p>
                            </>
                        )}
                    </div>
                )}
            </div>
            {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
            <input
                ref={fileInputRef}
                type="file"
                accept={accept}
                onChange={handleFileInput}
                className="hidden"
            />
        </div>
    );
}
