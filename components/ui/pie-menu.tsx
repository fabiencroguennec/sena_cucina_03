"use client";

import Link from "next/link";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface MenuItem {
    title: string;
    href: string;
    icon: LucideIcon;
    color: string;
    description: string;
}

interface PieMenuProps {
    items: MenuItem[];
}

export function PieMenu({ items }: PieMenuProps) {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    // Config
    const radius = 150;
    const center = 200; // SVG viewBox center
    const size = 400; // SVG viewBox size
    const innerRadius = 60; // Donut hole
    const iconRadius = (radius + innerRadius) / 2 + 20; // Position for icons

    const total = items.length;
    const angleStep = 360 / total;

    // Helper to calculate SVG path for visual slices
    const createSector = (index: number, isHovered: boolean) => {
        // Rotate so first item is at top (-90deg)
        const startAngle = (index * angleStep) - 90;
        const endAngle = ((index + 1) * angleStep) - 90;

        // Convert polar to cartesian
        const x1 = center + radius * Math.cos(Math.PI * startAngle / 180);
        const y1 = center + radius * Math.sin(Math.PI * startAngle / 180);
        const x2 = center + radius * Math.cos(Math.PI * endAngle / 180);
        const y2 = center + radius * Math.sin(Math.PI * endAngle / 180);

        // Inner arc (donut)
        const x3 = center + innerRadius * Math.cos(Math.PI * endAngle / 180);
        const y3 = center + innerRadius * Math.sin(Math.PI * endAngle / 180);
        const x4 = center + innerRadius * Math.cos(Math.PI * startAngle / 180);
        const y4 = center + innerRadius * Math.sin(Math.PI * startAngle / 180);

        // Simple scale effect if hovered (we can just scale the group, but let's tweak radius slightly?)
        // easier to scale via CSS transform on the group

        return `M ${x4} ${y4} L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 0 0 ${x4} ${y4} Z`;
    };

    // Helper for text/icon position
    const getItemPos = (index: number) => {
        const midAngle = (index * angleStep + angleStep / 2) - 90;
        const x = center + iconRadius * Math.cos(Math.PI * midAngle / 180);
        const y = center + iconRadius * Math.sin(Math.PI * midAngle / 180);
        return { x, y };
    };

    return (
        <div className="relative w-full max-w-[600px] mx-auto aspect-square flex items-center justify-center">
            {/* Background Circle Decoration */}
            <div className="absolute inset-0 bg-slate-100 dark:bg-slate-800 rounded-full scale-90 -z-10 opacity-50 blur-xl" />

            <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full drop-shadow-xl overflow-visible">
                {items.map((item, index) => {
                    const isHovered = hoveredIndex === index;
                    const pos = getItemPos(index);
                    const colorClass = item.color.split(" ")[0]; // Extract bg class only (e.g. bg-emerald-100)
                    // We need a solid fill color for SVG. 
                    // To keep it simple with Tailwind classes in SVG, we use className, but fill is tricky.
                    // Let's hardcode a map or use currentcolor with text classes.
                    // Fallback: use a solid fill based on index or just white with stroke.
                    // Actually, let's use the Tailwind colors:
                    // new problem: extracting hex from tailwind class at runtime is hard.
                    // Let's use simple preset colors or CSS variables.

                    // Hack: use CSS variables mapped to the classes or just hardcoded standard colors for now.
                    const fillColors = [
                        "#d1fae5", // emerald-100
                        "#ffedd5", // orange-100
                        "#dbeafe", // blue-100
                        "#f3e8ff", // purple-100
                        "#fef9c3", // yellow-100
                    ];
                    const strokeColors = [
                        "#047857", // emerald-700
                        "#c2410c", // orange-700
                        "#1d4ed8", // blue-700
                        "#7e22ce", // purple-700
                        "#a16207", // yellow-700
                    ];

                    return (
                        <Link key={item.title} href={item.href} legacyBehavior>
                            <g
                                onMouseEnter={() => setHoveredIndex(index)}
                                onMouseLeave={() => setHoveredIndex(null)}
                                className="cursor-pointer transition-all duration-300 ease-out origin-center"
                                style={{
                                    transform: isHovered ? "scale(1.05)" : "scale(1)",
                                    transformOrigin: `${center}px ${center}px`
                                }}
                                onClick={() => window.location.href = item.href} // Next/Link with SVG is tricky, manual nav backup
                            >
                                <path
                                    d={createSector(index, isHovered)}
                                    fill={fillColors[index % fillColors.length]}
                                    stroke="white"
                                    strokeWidth="2"
                                    className="transition-colors duration-300 hover:brightness-95"
                                />

                                {/* Icon & Label */}
                                <foreignObject x={pos.x - 40} y={pos.y - 40} width="80" height="80" className="pointer-events-none">
                                    <div className={`flex flex-col items-center justify-center h-full text-center p-1`}>
                                        <item.icon
                                            size={28}
                                            color={strokeColors[index % strokeColors.length]}
                                            className="mb-1 drop-shadow-sm"
                                        />
                                        <span
                                            className="text-[10px] font-bold uppercase tracking-wider leading-tight text-slate-700 dark:text-slate-200"
                                            style={{ color: strokeColors[index % strokeColors.length] }}
                                        >
                                            {item.title}
                                        </span>
                                    </div>
                                </foreignObject>
                            </g>
                        </Link>
                    );
                })}

                {/* Center Hub */}
                <circle cx={center} cy={center} r={innerRadius - 5} fill="white" className="dark:fill-slate-900 drop-shadow-inner" />
                <foreignObject x={center - 30} y={center - 30} width="60" height="60" className="pointer-events-none">
                    <div className="flex items-center justify-center h-full">
                        <div className="font-serif font-bold text-2xl text-slate-800 dark:text-slate-100">Sena</div>
                    </div>
                </foreignObject>
            </svg>

            {/* Hover Info Overlay */}
            <div className="absolute -bottom-12 text-center h-12">
                {hoveredIndex !== null && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                        <p className="text-lg font-medium text-slate-800 dark:text-slate-100">{items[hoveredIndex].title}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{items[hoveredIndex].description}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
