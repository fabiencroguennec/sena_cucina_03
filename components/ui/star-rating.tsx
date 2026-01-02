"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
    value: number; // 0 to 5
    onChange?: (value: number) => void;
    readOnly?: boolean;
    className?: string;
    size?: number;
}

export function StarRating({ value, onChange, readOnly = false, className, size = 16 }: StarRatingProps) {
    const stars = [1, 2, 3, 4, 5];

    const handleClick = (starValue: number) => {
        if (!readOnly && onChange) {
            onChange(starValue);
        }
    };

    return (
        <div className={cn("flex items-center gap-0.5", className)}>
            {stars.map((star) => (
                <Star
                    key={star}
                    size={size}
                    fill={star <= (value || 0) ? "currentColor" : "none"}
                    className={cn(
                        "transition-colors",
                        star <= (value || 0) ? "text-yellow-400" : "text-slate-300",
                        !readOnly && "cursor-pointer hover:text-yellow-500",
                        !readOnly && star <= (value || 0) && "text-yellow-400"
                    )}
                    onClick={() => handleClick(star)}
                    role="button"
                    aria-label={`${star} stars`}
                    tabIndex={readOnly ? -1 : 0}
                />
            ))}
        </div>
    );
}
