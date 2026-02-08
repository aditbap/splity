import { ReceiptItem } from '@/models/Receipt';

export interface Participant {
    id: string;
    name: string;
}

export interface Assignment {
    itemId: string; // indices based for now or unique ID
    participantIds: string[];
}

export interface ParticipantTotal {
    participantId: string;
    subtotal: number;
    taxShare: number;
    serviceChargeShare: number;
    discountShare: number;
    total: number;
    items: { name: string; price: number; share: number }[];
}

export interface SplitResult {
    participants: ParticipantTotal[];
    grandTotal: number;
    unassignedTotal: number;
}

export class SplitEngine {
    static calculate(
        items: ReceiptItem[],
        participants: Participant[],
        assignments: Assignment[],
        totalTax: number,
        totalServiceCharge: number,
        totalDiscount: number
    ): SplitResult {
        const participantTotals: string | ParticipantTotal | Record<string, ParticipantTotal> = {};

        // Initialize
        participants.forEach(p => {
            participantTotals[p.id] = {
                participantId: p.id,
                subtotal: 0,
                taxShare: 0,
                serviceChargeShare: 0,
                discountShare: 0,
                total: 0,
                items: []
            };
        });

        let assignedSubtotal = 0;

        // Calculate Item Splits
        items.forEach((item, index) => {
            const itemId = index.toString(); // Using index as ID for MVP
            const assignment = assignments.find(a => a.itemId === itemId);

            if (assignment && assignment.participantIds.length > 0) {
                const splitCount = assignment.participantIds.length;
                const pricePerPerson = item.price / splitCount;

                assignment.participantIds.forEach(pid => {
                    if (participantTotals[pid]) {
                        participantTotals[pid].subtotal += pricePerPerson;
                        participantTotals[pid].items.push({
                            name: item.name,
                            price: item.price,
                            share: pricePerPerson
                        });
                    }
                });
                assignedSubtotal += item.price;
            }
        });

        const grandTotal = Object.values(participantTotals).reduce((sum, p) => sum + p.subtotal, 0) + totalTax + totalServiceCharge - totalDiscount;

        Object.values(participantTotals).forEach(p => {
            if (assignedSubtotal > 0) {
                const ratio = p.subtotal / assignedSubtotal;
                p.taxShare = ratio * totalTax;
                p.serviceChargeShare = ratio * totalServiceCharge;
                p.discountShare = ratio * totalDiscount;
            } else {
                p.taxShare = 0;
                p.serviceChargeShare = 0;
                p.discountShare = 0;
            }
            p.total = p.subtotal + p.taxShare + p.serviceChargeShare - p.discountShare;

            // Round to 2 decimals (or integer for IDR usually, but keep 2 for internal precision if needed, then format later)
            // But since we use formatCurrency with 0 fractions, we might want to round to integer here or let formatter handle it.
            // IDR is weak currency, so decimals matter less, but logical correctness matters.
            p.subtotal = Math.round(p.subtotal);
            p.taxShare = Math.round(p.taxShare);
            p.serviceChargeShare = Math.round(p.serviceChargeShare);
            p.discountShare = Math.round(p.discountShare);
            p.total = p.subtotal + p.taxShare + p.serviceChargeShare - p.discountShare;
        });

        // Handle unassigned
        const totalItemPrice = items.reduce((sum, item) => sum + item.price, 0);
        const unassignedTotal = totalItemPrice - assignedSubtotal;

        return {
            participants: Object.values(participantTotals),
            grandTotal,
            unassignedTotal: Math.round(unassignedTotal)
        };
    }
}
