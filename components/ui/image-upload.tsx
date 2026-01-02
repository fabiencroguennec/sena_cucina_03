"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Image as ImageIcon, Loader2, X, Camera } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
    value?: string | null;
    onChange: (url: string) => void;
    onRemove: () => void;
    className?: string;
    bucket?: string;
}

export function ImageUpload({ value, onChange, onRemove, className, bucket = "recipes" }: ImageUploadProps) {
    const [uploading, setUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    const onUpload = async (file: File) => {
        try {
            if (!file) return;

            setUploading(true);

            const fileExt = file.name.split(".").pop();
            const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from(bucket)
                .upload(filePath, file);

            if (uploadError) {
                console.error("Upload error:", uploadError);
                throw uploadError;
            }

            const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);

            onChange(data.publicUrl);
            toast.success("Image téléchargée");
        } catch (error) {
            console.error(error);
            toast.error("Erreur lors du téléchargement");
        } finally {
            setUploading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) onUpload(file);
    };

    const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith("image/")) {
            onUpload(file);
        } else {
            toast.error("Veuillez déposer une image valide");
        }
    };

    if (value) {
        return (
            <div className={cn("relative aspect-video w-full max-w-sm rounded-lg overflow-hidden border bg-slate-100 dark:bg-slate-800", className)}>
                <Image
                    fill
                    src={value}
                    alt="Upload"
                    className="object-cover"
                />
                <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8"
                    onClick={onRemove}
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>
        );
    }

    return (
        <div className={cn("flex items-center justify-center w-full max-w-sm", className)}>
            <label
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                    "flex flex-col items-center justify-center w-full aspect-video rounded-xl cursor-pointer bg-transparent hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors",
                    isDragging ? "bg-slate-50 dark:bg-slate-800" : ""
                )}
            >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {uploading ? (
                        <Loader2 className="w-10 h-10 text-slate-400 animate-spin" />
                    ) : (
                        <div className="flex gap-2 opacity-60">
                            <ImageIcon className={cn("w-10 h-10 transition-colors text-slate-500")} />
                            <Camera className={cn("w-10 h-10 transition-colors text-slate-500")} />
                        </div>
                    )}
                </div>
                <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={uploading}
                />
            </label>
        </div>
    );
}
