'use client';

import { motion, useAnimation, PanInfo } from 'framer-motion';
import { Trash2, Utensils, Calendar, Users, ArrowRight } from 'lucide-react';
import { formatCurrency } from '@/lib/utils'; // Assuming this utility exists
import { useState } from 'react';

// Define the interface locally or import it if it's exported from page.tsx (better to export/import)
// For now, I'll define a compatible interface to avoid circular deps or messy imports if not shared properly.
interface SimpleReceipt {
    _id: string;
    parsedData: {
        merchantName: string;
        total: number;
        date: string;
        items: any[];
    };
    participants?: { id: string; name: string }[];
    assignments?: { itemId: string; participantIds: string[] }[];
}

interface ReceiptListItemProps {
    receipt: SimpleReceipt;
    index: number;
    onSelect: (receipt: SimpleReceipt) => void;
    onDelete: (id: string) => void;
    getReceiptIconColor: (index: number) => string;
}

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function ReceiptListItem({ receipt, index, onSelect, onDelete, getReceiptIconColor }: ReceiptListItemProps) {
    const controls = useAnimation();
    const [isDeleting, setIsDeleting] = useState(false); // Used for optimistic hiding after confirmation
    const [showConfirm, setShowConfirm] = useState(false);

    const handleDragEnd = async (event: any, info: PanInfo) => {
        const threshold = -100; // Swipe left threshold
        if (info.offset.x < threshold) {
            // Snap to open state or just reset and show dialog?
            // Let's reset position visually but show dialog
            // await controls.start({ x: -100 }); // Optional: keep it swiped
            setShowConfirm(true);
        } else {
            controls.start({ x: 0 });
        }
    };

    const handleConfirmDelete = async () => {
        // Trigger delete immediately
        onDelete(receipt._id);

        setShowConfirm(false);
        setIsDeleting(true);

        // Animation is secondary
        controls.start({ x: -500, opacity: 0, transition: { duration: 0.3 } });
    };

    const handleCancelDelete = () => {
        setShowConfirm(false);
        controls.start({ x: 0 }); // Snap back
    };

    if (isDeleting) return null; // Optimistically hide

    return (
        <>
            <div className="relative mb-3">
                {/* Background Layer (Delete Action) */}
                <div className="absolute inset-0 bg-red-600 rounded-2xl flex items-center justify-end pr-6 z-0">
                    <Trash2 className="text-white h-6 w-6" />
                </div>

                {/* Foreground Layer (Receipt Content) */}
                <motion.div
                    drag="x"
                    dragConstraints={{ left: -1000, right: 0 }}
                    dragElastic={0.1}
                    onDragEnd={handleDragEnd}
                    animate={controls}
                    whileTap={{ cursor: "grabbing" }}
                    className="relative z-10 bg-[#262626] rounded-2xl border border-white/5 overflow-hidden shadow-sm"
                    style={{ touchAction: "pan-y" }} // Allow vertical scroll, handle horizontal swipe
                >
                    <div
                        onClick={() => onSelect(receipt)}
                        className="flex items-center justify-between p-4 cursor-pointer active:bg-white/5 transition-colors"
                    >
                        <div className="flex items-center gap-4 overflow-hidden">
                            <div className={`h-12 w-12 rounded-full flex items-center justify-center shrink-0 ${getReceiptIconColor(index)}`}>
                                <Utensils className="h-6 w-6" />
                            </div>

                            <div className="flex flex-col min-w-0">
                                <h4 className="font-bold text-white truncate text-[15px]">
                                    {receipt.parsedData?.merchantName || "Unknown Merchant"}
                                </h4>
                                <div className="flex items-center gap-3 text-xs text-neutral-400 mt-1 font-medium">
                                    <div className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        <span>{new Date(receipt.parsedData?.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Users className="h-3 w-3" />
                                        <span>{receipt.participants?.length || 0} </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="text-right pl-2">
                            <span className="font-bold text-white text-lg block">
                                {formatCurrency(receipt.parsedData?.total || 0)}
                            </span>
                        </div>
                    </div>
                </motion.div>
            </div>

            <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
                <DialogContent
                    className="bg-[#1e1e1e] border-white/10 text-white w-[85vw] max-w-xs rounded-xl p-4 gap-3 [&>button]:hidden"
                    onInteractOutside={(e) => e.preventDefault()}
                >
                    <DialogHeader className="gap-1">
                        <DialogTitle className="text-base">Delete this split?</DialogTitle>
                        <DialogDescription className="text-xs text-neutral-400">
                            This cannot be undone. Permanently delete?
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
