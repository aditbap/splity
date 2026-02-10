'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/useAppStore';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { getDeviceId } from '@/lib/device-id';
import ReceiptListItem from '@/components/ReceiptListItem';

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

export default function HistoryPage() {
    const [receipts, setReceipts] = useState<SimpleReceipt[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const { setParsedData, setReceiptId, reset } = useAppStore();

    useEffect(() => {
        const userId = getDeviceId();

        // Fetch all receipts (limit could be higher here)
        fetch(`/api/receipt/list?userId=${userId}&limit=50&t=${Date.now()}`, {
            cache: 'no-store',
            headers: { 'Pragma': 'no-cache', 'Cache-Control': 'no-cache' }
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setReceipts(data.data);
                }
            })
            .catch(err => console.error(err))
            .finally(() => setIsLoading(false));
    }, []);

    const handleSelectReceipt = async (receipt: SimpleReceipt) => {
        reset();

        try {
            const res = await fetch(`/api/receipt/${receipt._id}`);
            const data = await res.json();

            if (!data.success) {
                console.error("Failed to load receipt:", data.error);
                alert("Failed to load receipt");
                return;
            }

            const freshReceipt = data.data;
            const dataToLoad = freshReceipt.correctedData || freshReceipt.parsedData;

            const fullData = {
                ...dataToLoad,
                date: dataToLoad.date ? new Date(dataToLoad.date) : undefined
            };

            setReceiptId(freshReceipt._id);
            setParsedData(fullData, "");

            // Load state
            useAppStore.setState({
                participants: freshReceipt.participants || [],
                assignments: freshReceipt.assignments || []
            });

            // Smart Navigation
            if (freshReceipt.assignments && freshReceipt.assignments.length > 0) {
                router.push('/result');
            } else if (freshReceipt.participants && freshReceipt.participants.length > 0) {
                router.push('/assign');
            } else {
                router.push('/verify');
            }

        } catch (err) {
            console.error("Error loading receipt", err);
            alert("Error loading receipt");
        }
    };

    const handleDeleteReceipt = async (id: string) => {
        // Optimistic UI update
        const previousReceipts = [...receipts];
        setReceipts(prev => prev.filter(r => r._id !== id));

        try {
            const res = await fetch(`/api/receipt/${id}`, { method: 'DELETE' });
            const data = await res.json();

            if (!data.success) {
                throw new Error(data.error || 'Failed to delete');
            }
            router.refresh();
        } catch (err) {
            console.error("Error deleting receipt", err);
            setReceipts(previousReceipts); // Revert
            alert("Failed to delete receipt");
        }
    };

    // Helper for random colored bg for receipt icon
    const getReceiptIconColor = (index: number) => {
        const colors = ['bg-orange-500 text-white', 'bg-emerald-500 text-white', 'bg-blue-500 text-white', 'bg-purple-500 text-white'];
        return colors[index % colors.length];
    };

    return (
        <div className="flex flex-col min-h-screen bg-[#000000] text-foreground max-w-md mx-auto relative overflow-hidden font-sans">

            {/* Header */}
            <header className="pt-8 pb-4 px-6 flex items-center gap-4 z-10 w-full bg-[#000000]/80 backdrop-blur-md sticky top-0 border-b border-white/5">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.push('/')}
                    className="text-neutral-400 hover:text-white hover:bg-white/10 -ml-2"
                >
                    <ArrowLeft className="h-6 w-6" />
                </Button>
                <h1 className="text-xl font-bold text-white">Your Splits History</h1>
            </header>

            <main className="flex-1 px-5 py-4 z-10 pb-10">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-neutral-500">
                        <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
                        <p>Loading history...</p>
                    </div>
                ) : receipts.length === 0 ? (
                    <div className="text-center py-20 text-neutral-500 bg-[#262626] border border-white/5 rounded-2xl">
                        <p>No split history found.</p>
                        <Button variant="link" className="mt-2 text-primary" onClick={() => router.push('/')}>
                            Go back to create one
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {receipts.map((receipt, idx) => (
                            <ReceiptListItem
                                key={receipt._id}
                                receipt={receipt}
                                index={idx}
                                onSelect={handleSelectReceipt}
                                onDelete={handleDeleteReceipt}
                                getReceiptIconColor={getReceiptIconColor}
                            />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
