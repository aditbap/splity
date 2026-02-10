'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/useAppStore';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { ApiService } from '@/services/api';

export default function AssignPage() {
    const router = useRouter();
    const parsedData = useAppStore(state => state.parsedData);
    const participants = useAppStore(state => state.participants);
    const assignments = useAppStore(state => state.assignments);
    const toggleAssignment = useAppStore(state => state.toggleAssignment);
    const addAssignment = useAppStore(state => state.addAssignment);
    const removeAssignment = useAppStore(state => state.removeAssignment);
    const receiptId = useAppStore(state => state.receiptId);

    // Auto-save assignments
    useEffect(() => {
        if (receiptId) {
            const timeoutId = setTimeout(() => {
                ApiService.updateReceipt(receiptId, { assignments });
            }, 1000);
            return () => clearTimeout(timeoutId);
        }
    }, [assignments, receiptId]);

    // Redirect if no data
    useEffect(() => {
        if (!parsedData || participants.length === 0) {
            router.push('/');
        }
    }, [parsedData, participants, router]);

    if (!parsedData || participants.length === 0) {
        return null;
    }

    // Helper to check if assigned
    const isAssigned = (itemId: string, participantId: string) => {
        const assignment = assignments.find(a => a.itemId === itemId);
        return assignment?.participantIds.includes(participantId) || false;
    };

    const getAvatarColor = (name: string) => {
        const colors = ['bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-green-500', 'bg-emerald-500', 'bg-teal-500', 'bg-cyan-500', 'bg-sky-500', 'bg-blue-500', 'bg-indigo-500', 'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 'bg-pink-500', 'bg-rose-500'];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

    // Calculate progress
    const totalItems = parsedData.items.length;
    const assignedItemsCount = assignments.filter(a => a.participantIds.length > 0).length;
    const progressPercentage = Math.round((assignedItemsCount / totalItems) * 100);

    return (
        <div className="flex flex-col min-h-screen bg-[#000000] text-foreground max-w-md mx-auto relative font-sans">
            {/* Background Texture */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-neutral-800/20 via-transparent to-transparent pointer-events-none" />

            <header className="sticky top-0 z-10 bg-[#000000]/80 backdrop-blur-md pt-6 pb-2 px-4 border-b border-white/5 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/participants')} className="rounded-full hover:bg-white/10 text-white">
                        <ArrowLeft className="h-6 w-6" />
                    </Button>
                    <div className="text-center">
                        <h1 className="font-bold text-lg text-white">Assign Items</h1>
                        <p className="text-[10px] text-neutral-400">Tap people to assign</p>
                    </div>
                    <div className="w-10" />
                </div>

                {/* Progress Bar */}
                <div className="w-full h-1.5 bg-[#262626] rounded-full overflow-hidden mb-2">
                    <div
                        className="h-full bg-primary/80 transition-all duration-500 ease-out"
                        style={{ width: `${progressPercentage}%` }}
                    />
                </div>
            </header>

            <main className="flex-1 p-4 pb-32 space-y-4 z-0">
                {parsedData.items.map((item, index) => {
                    const itemId = index.toString();
                    const assignedList = assignments.find(a => a.itemId === itemId)?.participantIds || [];
                    const isFullyAssigned = assignedList.length > 0;

                    return (
                        <div
                            key={itemId}
                            className={cn(
                                "flex flex-col gap-3 p-4 bg-[#262626] rounded-3xl transition-all duration-300",
                                !isFullyAssigned ? "border border-white/10" : "border-none"
                            )}
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex-1 pr-4">
                                    <h3 className="font-bold text-lg leading-tight text-white">
                                        <span className="text-primary font-extrabold mr-1.5">{item.quantity}x</span>
                                        {item.name}
                                    </h3>
                                </div>
                                <span className="font-bold text-lg whitespace-nowrap text-white">{formatCurrency(item.price)}</span>
                            </div>

                            <div className="flex flex-wrap gap-2 mt-1">
                                {participants.map((p) => {
                                    // Check how many times this participant is assigned
                                    const assignedList = assignments.find(a => a.itemId === itemId)?.participantIds || [];
                                    const count = assignedList.filter(id => id === p.id).length;
                                    const active = count > 0;

                                    // Handle Interaction
                                    const handleInteraction = () => {
                                        if (item.quantity > 1) {
                                            // Multi-assign mode

                                            // 1. If not full, simply ADD
                                            if (assignedList.length < item.quantity) {
                                                addAssignment(itemId, p.id);
                                            }
                                            // 2. If FULL (or more), check if we can REMOVE from this person
                                            else {
                                                if (active) {
                                                    // If this person has an assignment, tapping again REMOVES one
                                                    removeAssignment(itemId, p.id);
                                                } else {
                                                    // If full and this person has NONE, shake to indicate "Cannot Add"
                                                    const btn = document.getElementById(`btn-${itemId}-${p.id}`);
                                                    if (btn) {
                                                        btn.classList.add('animate-shake');
                                                        setTimeout(() => btn.classList.remove('animate-shake'), 300);
                                                    }
                                                }
                                            }
                                        } else {
                                            // Standard toggle
                                            toggleAssignment(itemId, p.id);
                                        }
                                    };

                                    return (
                                        <button
                                            key={p.id}
                                            id={`btn-${itemId}-${p.id}`}
                                            onClick={handleInteraction}
                                            // Right click / Long press to remove (desktop/mobile)
                                            onContextMenu={(e) => {
                                                e.preventDefault();
                                                if (item.quantity > 1 && active) removeAssignment(itemId, p.id);
                                            }}
                                            className={cn(
                                                "relative flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 select-none active:scale-95",
                                                active
                                                    ? "bg-primary text-primary-foreground shadow-[0_0_15px_-3px_rgba(var(--primary),0.4)]"
                                                    : "bg-[#000000] text-neutral-400 hover:bg-white/5 hover:text-white"
                                            )}
                                        >
                                            <div className={cn("h-2 w-2 rounded-full", active ? "bg-white" : getAvatarColor(p.name))} />
                                            {p.name}
                                            {/* Count Badge for Multi-assign */}
                                            {item.quantity > 1 && active && (
                                                <span className="ml-1 bg-white/20 px-1.5 py-0.5 rounded-full text-[10px] font-bold min-w-[1.2em]">
                                                    {count}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </main >

            {/* Sticky Footer */}
            < div className="fixed bottom-0 left-0 right-0 p-4 bg-[#000000]/80 backdrop-blur-xl border-t border-white/5 max-w-md mx-auto z-20" >
                <div className="flex justify-between items-end mb-4 px-1">
                    <span className="text-sm text-neutral-400">{assignedItemsCount} / {totalItems} items assigned</span>
                    {/* Optional: Show remaining amount unassigned? */}
                </div>
                <Button
                    className="w-full h-14 text-lg font-bold rounded-2xl shadow-lg shadow-primary/20 bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={() => router.push('/result')}
                    disabled={assignedItemsCount === 0}
                >
                    See Bill Breakdown
                    <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
            </div >
        </div >
    );
}
