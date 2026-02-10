import { create } from 'zustand';
import { Participant, Assignment } from '@/services/split-engine/split-engine';
import { ReceiptData, ReceiptItem } from '@/models/Receipt';

interface AppState {
    // Receipt State
    receiptId: string | null;
    receiptImage: string | null;
    rawText: string | null;
    parsedData: ReceiptData | null;
    isProcessing: boolean;

    // Split State
    participants: Participant[];
    assignments: Assignment[]; // itemId -> participantIds

    // Actions
    setReceiptId: (id: string | null) => void;
    setReceiptImage: (url: string) => void;
    setProcessing: (loading: boolean) => void;
    setParsedData: (data: ReceiptData, rawText?: string) => void;

    addParticipant: (name: string) => void;
    removeParticipant: (id: string) => void;
    updateParticipant: (id: string, name: string) => void;

    assignItem: (itemId: string, participantId: string) => void;
    toggleAssignment: (itemId: string, participantId: string) => void;
    addAssignment: (itemId: string, participantId: string) => void;
    removeAssignment: (itemId: string, participantId: string) => void;
    reset: () => void;
}

export const useAppStore = create<AppState>((set) => ({
    receiptId: null,
    receiptImage: null,
    rawText: null,
    parsedData: null,
    isProcessing: false,
    participants: [],
    assignments: [],

    setReceiptId: (id) => set({ receiptId: id }),
    setReceiptImage: (url) => set({ receiptImage: url }),
    setProcessing: (loading) => set({ isProcessing: loading }),
    setParsedData: (data, rawText) => set({ parsedData: data, rawText: rawText || '' }),

    addParticipant: (name) => set((state) => ({
        participants: [
            ...state.participants,
            { id: Math.random().toString(36).substr(2, 9), name }
        ]
    })),

    removeParticipant: (id) => set((state) => ({
        participants: state.participants.filter(p => p.id !== id),
        // Remove assignments for this participant
        assignments: state.assignments.map(a => ({
            ...a,
            participantIds: a.participantIds.filter(pid => pid !== id)
        })).filter(a => a.participantIds.length > 0)
    })),

    updateParticipant: (id, name) => set((state) => ({
        participants: state.participants.map(p => p.id === id ? { ...p, name } : p)
    })),

    assignItem: (itemId, participantId) => set((state) => {
        // Single assignment logic (replace)
        // Or Toggle logic?
        // Let's do toggle for multi-select
        return {};
    }),

    toggleAssignment: (itemId, participantId) => set((state) => {
        const existingAssignment = state.assignments.find(a => a.itemId === itemId);
        let newAssignments = [...state.assignments];

        if (existingAssignment) {
            if (existingAssignment.participantIds.includes(participantId)) {
                // Remove
                const newPids = existingAssignment.participantIds.filter(pid => pid !== participantId);
                if (newPids.length === 0) {
                    newAssignments = newAssignments.filter(a => a.itemId !== itemId);
                } else {
                    newAssignments = newAssignments.map(a => a.itemId === itemId ? { ...a, participantIds: newPids } : a);
                }
            } else {
                // Add
                newAssignments = newAssignments.map(a => a.itemId === itemId ? { ...a, participantIds: [...a.participantIds, participantId] } : a);
            }
        } else {
            // Create new
            newAssignments.push({ itemId, participantIds: [participantId] });
        }

        return { assignments: newAssignments };
    }),

    addAssignment: (itemId, participantId) => set((state) => {
        const existingAssignment = state.assignments.find(a => a.itemId === itemId);
        let newAssignments = [...state.assignments];

        if (existingAssignment) {
            // Simply push the ID (allowing duplicates for weighting)
            newAssignments = newAssignments.map(a =>
                a.itemId === itemId
                    ? { ...a, participantIds: [...a.participantIds, participantId] }
                    : a
            );
        } else {
            newAssignments.push({ itemId, participantIds: [participantId] });
        }
        return { assignments: newAssignments };
    }),

    removeAssignment: (itemId, participantId) => set((state) => {
        const existingAssignment = state.assignments.find(a => a.itemId === itemId);
        if (!existingAssignment) return {};

        let newAssignments = [...state.assignments];
        const index = existingAssignment.participantIds.indexOf(participantId);

        if (index > -1) {
            // Remove ONLY ONE instance
            const newPids = [...existingAssignment.participantIds];
            newPids.splice(index, 1);

            if (newPids.length === 0) {
                newAssignments = newAssignments.filter(a => a.itemId !== itemId);
            } else {
                newAssignments = newAssignments.map(a =>
                    a.itemId === itemId ? { ...a, participantIds: newPids } : a
                );
            }
        }
        return { assignments: newAssignments };
    }),

    reset: () => set({
        receiptId: null,
        receiptImage: null,
        rawText: null,
        parsedData: null,
        participants: [],
        assignments: []
    }),
}));
