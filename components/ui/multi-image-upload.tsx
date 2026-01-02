"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Image as ImageIcon, Loader2, X, Camera, Plus, Link as LinkIcon, UploadCloud, Trash2 } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface MultiImageUploadProps {
    value?: string[];
    onChange: (urls: string[]) => void;
    className?: string;
    bucket?: string;
}

export function MultiImageUpload({ value = [], onChange, className, bucket = "recipes" }: MultiImageUploadProps) {
    const [uploading, setUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [urlInput, setUrlInput] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const images = Array.isArray(value) ? value : (value ? [value] : []);

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

            onChange([...images, data.publicUrl]);
            toast.success("Image téléchargée");
            setIsDialogOpen(false);
        } catch (error) {
            console.error(error);
            toast.error("Erreur lors du téléchargement");
        } finally {
            setUploading(false);
        }
    };

    const handleUrlAdd = () => {
        if (!urlInput) return;
        try {
            new URL(urlInput); // Validate URL
            onChange([...images, urlInput]);
            setUrlInput("");
            setIsDialogOpen(false);
            toast.success("Image ajoutée par URL");
        } catch {
            toast.error("URL invalide");
        }
    };

    const handleRemove = (indexToRemove: number) => {
        onChange(images.filter((_, index) => index !== indexToRemove));
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

    return (
        <div className={cn("space-y-4", className)}>
            {/* Image Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {images.map((url, index) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden border bg-slate-100 dark:bg-slate-800 group">
                        <Image
                            fill
                            src={url}
                            alt={`Image ${index + 1}`}
                            className="object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                onClick={() => handleRemove(index)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                ))}

                {/* Add Button Tile */}
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <button
                            type="button"
                            className="aspect-square flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                        >
                            <Plus className="h-8 w-8 mb-2" />
                            <span className="text-xs font-medium">Ajouter</span>
                        </button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Ajouter une image</DialogTitle>
                            <DialogDescription>
                                Téléchargez un fichier, prenez une photo ou collez une URL.
                            </DialogDescription>
                        </DialogHeader>

                        <Tabs defaultValue="upload" className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="upload">Upload / Caméra</TabsTrigger>
                                <TabsTrigger value="url">URL</TabsTrigger>
                            </TabsList>

                            <TabsContent value="upload" className="mt-4">
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
                                                <UploadCloud className="w-10 h-10 text-slate-500" />
                                                <Camera className="w-10 h-10 text-slate-500" />
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
                            </TabsContent>

                            <TabsContent value="url" className="mt-4 space-y-4">
                                <div className="space-y-2">
                                    <Input
                                        placeholder="https://exemple.com/image.jpg"
                                        value={urlInput}
                                        onChange={(e) => setUrlInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                handleUrlAdd();
                                            }
                                        }}
                                    />
                                    <p className="text-xs text-slate-500">Collez le lien direct vers l'image.</p>
                                </div>
                                <Button onClick={handleUrlAdd} type="button" className="w-full" disabled={!urlInput}>
                                    Ajouter l'URL
                                </Button>
                            </TabsContent>
                        </Tabs>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
