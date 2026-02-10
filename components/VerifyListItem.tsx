'use client';

import { motion, useAnimation, PanInfo } from 'framer-motion';
import { Trash2, GripVertical } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatNumber } from '@/lib/utils';
import { useState } from 'react';

interface VerifyListItemProps {
    item: {
        name: string;
        price: number;
        quantity: number;
    };
    index: number;
    onChange: (index: number, field: 'name' | 'price' | 'quantity', value: string) => void;
    onDelete: (index: number) => void;
    onSplit?: (index: number) => void;
}

export default function VerifyListItem({ item, index, onChange, onDelete, onSplit }: VerifyListItemProps) {
    const controls = useAnimation();
    const [isDeleting, setIsDeleting] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const handleDragEnd = async (event: any, info: PanInfo) => {
        const threshold = -100; // Swipe left threshold
        if (info.offset.x < threshold) {
            setShowConfirm(true);
        } else {
            controls.start({ x: 0 });
        }
    };

    const handleConfirmDelete = async () => {
        setShowConfirm(false);
        setIsDeleting(true);
        await controls.start({ x: -500, opacity: 0, transition: { duration: 0.3 } });
        onDelete(index);
    };

    const handleCancelDelete = () => {
        setShowConfirm(false);
        controls.start({ x: 0 });
    };

    const handleSplitItem = () => {
        // Check if onSplit is provided and valid
        if (onSplit && item.quantity > 1) {
            onSplit(index);
        }
    };

    if (isDeleting) return null;

    return (
        <>
            <div className="relative mb-3">
                {/* Background Layer (Delete Action) */}
                <div className="absolute inset-0 bg-red-600 rounded-2xl flex items-center justify-end pr-6 z-0">
                    <Trash2 className="text-white h-6 w-6" />
                </div>

                {/* Foreground Layer (Editable Content) */}
                <motion.div
                    drag="x"
                    dragConstraints={{ left: -1000, right: 0 }}
                    dragElastic={0.1}
                    onDragEnd={handleDragEnd}
                    animate={controls}
                    whileTap={{ cursor: "grabbing" }}
                    className="relative z-10 bg-[#262626] rounded-2xl border border-white/5 shadow-sm overflow-hidden"
                    style={{ touchAction: "pan-y" }}
                >
                    <div className="flex gap-3 p-3 items-start relative bg-[#262626]">
                        {/* Grip Handle */}
                        <div className="absolute left-1 top-1/2 -translate-y-1/2 text-neutral-700 opacity-50 cursor-grab active:cursor-grabbing">
                            <GripVertical className="h-4 w-4" />
                        </div>

                        {/* Qty Input */}
                        <div className="flex flex-col items-center gap-1 pt-1 ml-2">
                            <label className="text-[10px] text-neutral-500">Qty</label>
                            <Input
                                type="number"
                                min="1"
                                value={item.quantity || 1}
                                onChange={(e) => onChange(index, 'quantity', e.target.value)}
                                className="w-12 h-9 text-center bg-[#000000] border-white/5 text-sm p-0 text-white"
                                inputMode="numeric"
                                onPointerDown={(e) => e.stopPropagation()}
                            />
                            {/* Split Button (Only if Qty > 1) */}
                            {item.quantity > 1 && (
                                <button
                                    onClick={handleSplitItem}
                                    className="text-[10px] text-primary hover:text-primary/80 font-medium underline mt-1"
                                >
                                    Split
                                </button>
                            )}
                        </div>

                        {/* Main Item inputs */}
                        <div className="flex-1 space-y-2">
                            <Input
                                value={item.name}
                                onChange={(e) => onChange(index, 'name', e.target.value)}
                                className="bg-transparent border-0 border-b border-white/5 rounded-none px-0 h-8 font-medium focus-visible:ring-0 focus:border-primary text-white"
                                placeholder="Item Name"
                                onPointerDown={(e) => e.stopPropagation()}
                            />
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-neutral-500">Rp</span>
                                <Input
                                    value={item.price ? formatNumber(item.price) : ''}
                                    onChange={(e) => onChange(index, 'price', e.target.value)}
                                    className="bg-transparent border-0 px-0 h-6 text-sm font-bold tracking-wide w-full text-white"
                                    placeholder="0"
                                    inputMode="numeric"
                                    onPointerDown={(e) => e.stopPropagation()}
                                />
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
                <DialogContent className="bg-[#1e1e1e] border-white/10 text-white sm:max-w-md rounded-2xl w-[85vw] max-w-xs p-4 gap-3 [&>button]:hidden" onInteractOutside={(e) => e.preventDefault()}>
                    <DialogHeader className="gap-1">
                        <DialogTitle className="text-base">Delete this item?</DialogTitle>
                        <DialogDescription className="text-xs text-neutral-400">
                            Are you sure you want to remove "{item.name}"?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex gap-2 sm:justify-end mt-1">
                        <Button variant="outline" size="sm" onClick={handleCancelDelete} className="bg-transparent border-white/10 hover:bg-white/5 text-white hover:text-white h-8 text-xs px-3">
                            Cancel
                        </Button>
                        <Button variant="destructive" size="sm" onClick={handleConfirmDelete} className="h-8 text-xs px-3">
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
