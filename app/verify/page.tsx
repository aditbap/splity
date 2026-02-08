'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAppStore } from '@/store/useAppStore';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2, Plus, Receipt, Save, GripVertical, ArrowLeft, ArrowRight } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { ApiService } from '@/services/api';
import VerifyListItem from '@/components/VerifyListItem';

export default function VerifyPage() {
    const router = useRouter();
    const parsedData = useAppStore(state => state.parsedData);
    const setParsedData = useAppStore(state => state.setParsedData);
    const receiptId = useAppStore(state => state.receiptId);

    // Auto-save logic hooks...
    const parsedDataRef = useRef(parsedData);
    useEffect(() => {
        parsedDataRef.current = parsedData;
    }, [parsedData]);

    useEffect(() => {
        if (!parsedData) router.push('/');
    }, [parsedData, router]);

    useEffect(() => {
        if (!receiptId || !parsedData) return;
        const save = () => ApiService.updateReceipt(receiptId, { parsedData });
        const timeoutId = setTimeout(save, 500);
        return () => clearTimeout(timeoutId);
    }, [parsedData, receiptId]);

    useEffect(() => {
        return () => {
            if (receiptId && parsedDataRef.current) {
                ApiService.updateReceipt(receiptId, { parsedData: parsedDataRef.current });
            }
        };
    }, [receiptId]);

    if (!parsedData) return null;

    const handleItemChange = (index: number, field: 'name' | 'price' | 'quantity', value: string) => {
        const newItems = [...parsedData.items];
        const item = newItems[index];

        if (field === 'price') {
            const numericValue = value.replace(/\./g, '').replace(/[^0-9]/g, '');
            item.price = parseFloat(numericValue) || 0;
        } else if (field === 'quantity') {
            const newQty = parseInt(value.replace(/[^0-9]/g, '')) || 1;
            const unitPrice = item.quantity > 0 ? item.price / item.quantity : 0;
            item.quantity = newQty;
            item.price = unitPrice * newQty;
        } else {
            item.name = value;
        }
        setParsedData({ ...parsedData, items: newItems });
    };

    const removeItem = (index: number) => {
        const newItems = [...parsedData.items];
        newItems.splice(index, 1);
        setParsedData({ ...parsedData, items: newItems });
    };

    const addItem = () => {
        setParsedData({
            ...parsedData,
            items: [...parsedData.items, { name: 'New Item', price: 0, quantity: 1 }]
        });
    };

    const totalCalculated =
        parsedData.items.reduce((sum, item) => sum + (item.price || 0), 0) +
        (parsedData.tax || 0) +
        (parsedData.serviceCharge || 0) -
        (parsedData.discount || 0);

    return (
        <div className="flex flex-col min-h-screen bg-[#000000] text-foreground max-w-md mx-auto relative font-sans">
            {/* Background Texture */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-neutral-800/20 via-transparent to-transparent pointer-events-none" />

            <header className="sticky top-0 z-10 bg-[#000000]/80 backdrop-blur-md pt-6 pb-4 px-4 border-b border-white/5 flex items-center justify-between">
                <Button variant="ghost" size="icon" onClick={() => router.push('/')} className="rounded-full hover:bg-white/10 text-white">
                    <ArrowLeft className="h-6 w-6" />
                </Button>
                <div className="text-center">
                    <h1 className="font-bold text-lg">Check Receipt</h1>
                    {receiptId && <p className="text-[10px] text-primary animate-pulse flex items-center justify-center gap-1"><Save className="h-3 w-3" /> Auto-saving</p>}
                </div>
                <div className="w-10" /> {/* Spacer */}
            </header>

            <main className="flex-1 p-4 pb-32 space-y-6 z-0">

                {/* Merchant & Date Card */}
                <Card className="bg-[#262626] border-white/5 overflow-hidden shadow-lg">
                    <CardContent className="p-4 space-y-3">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                                <Receipt className="h-4 w-4 text-orange-400" />
                            </div>
                            <span className="font-semibold text-sm text-neutral-400">Receipt Details</span>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs text-neutral-500 ml-1">Merchant</label>
                            <Input
                                value={parsedData.merchantName}
                                onChange={(e) => setParsedData({ ...parsedData, merchantName: e.target.value })}
                                className="bg-[#000000] border-white/5 focus:border-primary/50 text-lg font-bold text-white h-12"
                                placeholder="Merchant Name"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-neutral-500 ml-1">Date</label>
                            <Input
                                type="date"
                                value={parsedData.date ? new Date(parsedData.date as string | number | Date).toISOString().split('T')[0] : ''}
                                onChange={(e) => {
                                    const dateVal = e.target.value ? new Date(e.target.value) : undefined;
                                    setParsedData({ ...parsedData, date: dateVal });
                                }}
                                className="bg-[#000000] border-white/5 text-white"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Items List */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                        <h2 className="font-semibold text-lg">Items</h2>
                        <span className="text-xs text-muted-foreground">{parsedData.items.length} detected</span>
                    </div>

                    {parsedData.items.map((item, index) => (
                        <VerifyListItem
                            key={index}
                            item={item}
                            index={index}
                            onChange={handleItemChange}
                            onDelete={removeItem}
                        />
                    ))}

                    <Button variant="outline" className="w-full border-dashed h-12 rounded-xl text-neutral-400 hover:text-white hover:bg-[#262626] hover:border-white/20 bg-transparent" onClick={addItem}>
                        <Plus className="mr-2 h-4 w-4" /> Add New Item
                    </Button>
                </div>

                {/* Extras */}
                <Card className="bg-[#262626] border-white/5 shadow-lg">
                    <CardContent className="p-4 space-y-4">
                        <h3 className="text-sm font-semibold text-muted-foreground mb-2">Tax & Fees</h3>
                        {[
                            { label: 'Tax', field: 'tax', color: 'text-foreground' },
                            { label: 'Service Charge', field: 'serviceCharge', color: 'text-foreground' },
                            { label: 'Discount', field: 'discount', color: 'text-red-500' }
                        ].map((extra) => (
                            <div key={extra.field} className="flex justify-between items-center">
                                <span className={extra.color === 'text-red-500' ? 'text-red-400' : 'text-sm text-muted-foreground'}>{extra.label}</span>
                                <div className="w-32 relative">
                                    <span className={`absolute left-0 top-1.5 text-xs font-semibold ${extra.color === 'text-red-500' ? 'text-red-500' : 'text-muted-foreground'}`}>
                                        {extra.field === 'discount' ? '- Rp' : 'Rp'}
                                    </span>
                                    <Input
                                        value={parsedData[extra.field as keyof typeof parsedData] ? formatNumber(Number(parsedData[extra.field as keyof typeof parsedData])) : ''}
                                        onChange={(e) => setParsedData({ ...parsedData, [extra.field]: parseFloat(e.target.value.replace(/\./g, '').replace(/[^0-9]/g, '')) || 0 })}
                                        className={`bg-transparent border-0 border-b border-white/10 rounded-none px-0 h-8 text-right font-medium focus-visible:ring-0 pl-8 ${extra.color}`}
                                        placeholder="0"
                                        inputMode="numeric"
                                    />
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

            </main>

            {/* Sticky Footer */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#000000]/80 backdrop-blur-xl border-t border-white/5 max-w-md mx-auto z-20">
                <div className="flex justify-between items-end mb-4 px-1">
                    <span className="text-sm text-neutral-400">Total Estimate</span>
                    <span className="text-2xl font-bold text-primary tracking-tight">
                        {formatCurrency(totalCalculated)}
                    </span>
                </div>
                <Button className="w-full h-14 text-lg font-bold rounded-2xl shadow-lg shadow-primary/20 bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => router.push('/participants')}>
                    Confirm & Next
                    <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
            </div>

        </div>
    );
}
