'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAppStore } from '@/store/useAppStore';
import { SplitEngine, SplitResult } from '@/services/split-engine/split-engine';
import { Share, Home, Check, ArrowLeft } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatCurrency } from '@/lib/utils';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

export default function ResultPage() {
    const router = useRouter();
    const { parsedData, participants, assignments, receiptId } = useAppStore();
    const [result, setResult] = useState<SplitResult | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (parsedData && participants.length > 0) {
            const res = SplitEngine.calculate(
                parsedData.items,
                participants,
                assignments,
                parsedData.tax || 0,
                parsedData.serviceCharge || 0,
                parsedData.discount || 0
            );
            setResult(res);

            // Auto-save logic
            if (receiptId) {
                const saveData = async () => {
                    setIsSaving(true);
                    try {
                        await fetch(`/api/receipt/${receiptId}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ participants, assignments })
                        });
                    } catch (err) { console.error("Failed to auto-save", err); }
                    finally { setIsSaving(false); }
                };
                saveData();
            }
        } else {
            router.push('/');
        }
    }, [parsedData, participants, assignments, router, receiptId]);

    const handleShare = async () => {
        const url = `${window.location.origin}/?id=${receiptId}`;

        // Modern Share API if available
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Split Bill Result',
                    text: `Here is the split for ${parsedData?.merchantName}`,
                    url: url
                });
                return;
            } catch (err) {
                console.log('Share API skipped/failed, using clipboard');
            }
        }

        // Clipboard Fallback
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            prompt("Copy this link:", url);
        }
    };

    const getAvatarColor = (name: string) => {
        const colors = ['bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-green-500', 'bg-emerald-500', 'bg-teal-500', 'bg-cyan-500', 'bg-sky-500', 'bg-blue-500', 'bg-indigo-500', 'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 'bg-pink-500', 'bg-rose-500'];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

    if (!result) return null;

    return (
        <div className="flex flex-col min-h-screen bg-[#000000] text-foreground max-w-md mx-auto relative font-sans">
            {/* Background Texture */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-neutral-800/20 via-transparent to-transparent pointer-events-none" />

            <header className="sticky top-0 z-10 bg-[#000000]/80 backdrop-blur-md pt-6 pb-4 px-4 border-b border-white/5 flex items-center justify-between">
                <Button variant="ghost" size="icon" onClick={() => router.push('/assign')} className="rounded-full hover:bg-white/10 text-white">
                    <ArrowLeft className="h-6 w-6" />
                </Button>
                <h1 className="font-bold text-lg text-white">Final Split</h1>
                <Button variant="ghost" size="icon" onClick={() => router.push('/')} className="rounded-full hover:bg-white/10 text-white">
                    <Home className="h-5 w-5" />
                </Button>
            </header>

            <main className="flex-1 p-4 pb-32 space-y-6 z-0">
                {/* Grand Total Card */}
                <div className="text-center py-6">
                    <p className="text-neutral-400 text-sm uppercase tracking-wider font-medium mb-1">Total Bill</p>
                    <h2 className="text-5xl font-black text-white tracking-tighter drop-shadow-lg">
                        {formatCurrency(result.grandTotal)}
                    </h2>
                    {isSaving && <p className="text-[10px] text-neutral-500 mt-2 animate-pulse">Syncing changes...</p>}
                </div>

                {/* Participants Breakdown */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <h3 className="font-semibold text-lg">Breakdown</h3>
                        <span className="text-xs text-muted-foreground">{result.participants.length} people</span>
                    </div>

                    <Accordion type="single" collapsible className="space-y-3">
                        {result.participants.map((p) => {
                            const participantName = participants.find(user => user.id === p.participantId)?.name || "Unknown";

                            return (
                                <AccordionItem
                                    key={p.participantId}
                                    value={p.participantId}
                                    className="border-0 bg-[#262626] rounded-3xl overflow-hidden px-4 shadow-sm"
                                >
                                    <AccordionTrigger className="hover:no-underline py-4">
                                        <div className="flex items-center gap-4 w-full">
                                            <Avatar className="h-10 w-10 ring-2 ring-transparent">
                                                <AvatarFallback className={`${getAvatarColor(participantName)} text-white font-bold border border-white/10`}>
                                                    {participantName.substring(0, 1).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 text-left">
                                                <span className="font-bold text-base block text-white">{participantName}</span>
                                                <span className="text-xs text-neutral-400">{p.items.length} items</span>
                                            </div>
                                            <span className="font-bold text-xl text-emerald-400 mr-2">
                                                {formatCurrency(p.total)}
                                            </span>
                                        </div>
                                    </AccordionTrigger>

                                    <AccordionContent className="pb-4 pt-0">
                                        <div className="pl-14 pr-2 space-y-2">
                                            {/* Items List */}
                                            <div className="space-y-1.5 p-3 rounded-xl bg-[#000000]/50 border border-white/5">
                                                {p.items.map((item, idx) => (
                                                    <div key={idx} className="flex justify-between text-sm">
                                                        <span className="text-neutral-400 truncate flex-1 pr-4">{item.name}</span>
                                                        <span className="font-medium text-white opacity-90">{formatCurrency(item.share)}</span>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Extras Breakdown */}
                                            <div className="flex flex-col gap-1 text-xs text-neutral-500 px-2">
                                                <div className="flex justify-between">
                                                    <span>Subtotal</span>
                                                    <span>{formatCurrency(p.subtotal)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Tax & Fees</span>
                                                    <span>{formatCurrency(p.taxShare + p.serviceChargeShare)}</span>
                                                </div>
                                                {p.discountShare > 0 && (
                                                    <div className="flex justify-between text-emerald-400">
                                                        <span>Discount</span>
                                                        <span>-{formatCurrency(p.discountShare)}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            );
                        })}
                    </Accordion>
                </div>

                {result.unassignedTotal > 0.01 && (
                    <Card className="border-red-500/20 bg-red-500/10 mb-4">
                        <CardContent className="p-4 flex justify-between items-center text-red-400">
                            <span className="font-medium">Unassigned Amount</span>
                            <span className="font-bold text-lg">{formatCurrency(result.unassignedTotal)}</span>
                        </CardContent>
                    </Card>
                )}
            </main>

            {/* Sticky Action Footer */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#000000]/80 backdrop-blur-xl border-t border-white/5 max-w-md mx-auto z-20 flex flex-col gap-3">
                <Button
                    className="w-full h-14 text-lg font-bold rounded-2xl shadow-lg shadow-primary/20 bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={handleShare}
                >
                    {copied ? (
                        <>Link Copied! <Check className="ml-2 h-5 w-5" /></>
                    ) : (
                        <>Share Split <Share className="ml-2 h-5 w-5" /></>
                    )}
                </Button>
            </div>
        </div>
    );
}
