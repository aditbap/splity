import { ReceiptData } from '@/models/Receipt';

export const ApiService = {
    uploadReceipt: async (file: File, userId?: string): Promise<{ success: boolean; data: ReceiptData; rawText: string; id?: string }> => {
        const formData = new FormData();
        formData.append('file', file);
        if (userId) formData.append('userId', userId);

        // Simulate API call for now if backend not fully running or to test mock
        // return new Promise((resolve) => {
        //   setTimeout(() => resolve({ success: true, rawText: "Mock", data: { items: [], total: 0, tax: 0 } }), 1000);
        // });

        const res = await fetch('/api/receipt/ocr', {
            method: 'POST',
            body: formData,
        });

        if (!res.ok) {
            throw new Error('Upload failed');
        }

        return res.json();
    },
    updateReceipt: async (id: string, data: Partial<any>): Promise<{ success: boolean; data?: any }> => {
        const res = await fetch(`/api/receipt/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return res.json();
    }
};
