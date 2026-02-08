'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAppStore } from '@/store/useAppStore';
import { Users, X, Plus, ArrowLeft, ArrowRight } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ApiService } from '@/services/api';

export default function ParticipantsPage() {
    const router = useRouter();
    const participants = useAppStore(state => state.participants);
    const addParticipant = useAppStore(state => state.addParticipant);
    const removeParticipant = useAppStore(state => state.removeParticipant);
    const [newName, setNewName] = useState('');
    const receiptId = useAppStore(state => state.receiptId);

    // Auto-save logic...
    const participantsRef = useRef(participants);
    useEffect(() => {
        participantsRef.current = participants;
    }, [participants]);

    useEffect(() => {
        if (!receiptId) return;
        const save = async (data: any) => {
            try {
                await ApiService.updateReceipt(receiptId, { participants: data });
            } catch (err) {
                console.error("Auto-save failed", err);
            }
        };
        const timeoutId = setTimeout(() => {
            save(participants);
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [participants, receiptId]);

    useEffect(() => {
        return () => {
            if (receiptId) {
                ApiService.updateReceipt(receiptId, { participants: participantsRef.current });
            }
        };
    }, [receiptId]);

    const handleAdd = () => {
        if (newName.trim()) {
            addParticipant(newName.trim());
            setNewName('');
        }
    };

    // Helper to generate a consistent color for avatars based on name
    const getAvatarColor = (name: string) => {
        const colors = ['bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-green-500', 'bg-emerald-500', 'bg-teal-500', 'bg-cyan-500', 'bg-sky-500', 'bg-blue-500', 'bg-indigo-500', 'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 'bg-pink-500', 'bg-rose-500'];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

    return (
        <div className="flex flex-col min-h-screen bg-[#000000] text-foreground max-w-md mx-auto relative font-sans">
            {/* Background Texture */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-neutral-800/20 via-transparent to-transparent pointer-events-none" />

            <header className="sticky top-0 z-10 bg-[#000000]/80 backdrop-blur-md pt-6 pb-4 px-4 border-b border-white/5 flex items-center justify-between">
                <Button variant="ghost" size="icon" onClick={() => router.push('/verify')} className="rounded-full hover:bg-white/10 text-white">
                    <ArrowLeft className="h-6 w-6" />
                </Button>
                <div className="text-center">
                    <h1 className="font-bold text-lg">Participants</h1>
                    <p className="text-[10px] text-muted-foreground">{participants.length} people added</p>
                </div>
                <div className="w-10" />
            </header>

            <main className="flex-1 p-4 pb-32 space-y-6 z-0">
                {/* Add Input */}
                <div className="flex gap-2 p-2 bg-[#262626] rounded-2xl border border-white/5 shadow-lg">
                    <Input
                        placeholder="Add person (e.g. Alice)"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                        className="bg-transparent border-none text-base h-12 focus-visible:ring-0 placeholder:text-neutral-500 text-white"
                    />
                    <Button onClick={handleAdd} size="icon" className="h-12 w-12 rounded-xl shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20">
                        <Plus className="h-6 w-6" />
                    </Button>
                </div>

                {/* List */}
                <div className="space-y-3">
                    {participants.length === 0 ? (
                        <div className="text-center py-20 flex flex-col items-center justify-center text-neutral-500">
                            <div className="h-20 w-20 bg-[#262626] rounded-full flex items-center justify-center mb-4 border border-white/5">
                                <Users className="h-10 w-10 opacity-30 text-white" />
                            </div>
                            <p className="text-lg font-medium text-white">No participants yet</p>
                            <p className="text-sm">Add friends to split the bill with</p>
                        </div>
                    ) : (
                        participants.map((p, index) => (
                            <div
                                key={p.id}
                                className="flex items-center justify-between p-3 pl-4 bg-[#262626] border border-white/5 rounded-2xl hover:border-white/10 transition-all group animate-in slide-in-from-bottom-2 fade-in duration-300 shadow-sm"
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-10 w-10 ring-2 ring-transparent">
                                        <AvatarFallback className={`${getAvatarColor(p.name)} text-white font-bold border border-white/10`}>
                                            {p.name.substring(0, 1).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="font-bold text-lg text-white">{p.name}</span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeParticipant(p.id)}
                                    className="text-neutral-500 hover:text-red-400 hover:bg-red-500/10 rounded-full h-10 w-10"
                                >
                                    <X className="h-5 w-5" />
                                </Button>
                            </div>
                        ))
                    )}
                </div>
            </main>

            {/* Sticky Footer */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#000000]/80 backdrop-blur-xl border-t border-white/5 max-w-md mx-auto z-20">
                <Button
                    className="w-full h-14 text-lg font-bold rounded-2xl shadow-lg shadow-primary/20 bg-primary text-primary-foreground hover:bg-primary/90"
                    disabled={participants.length === 0}
                    onClick={() => router.push('/assign')}
                >
                    Next: Assign Items
                    <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
            </div>
        </div>
    );
}
