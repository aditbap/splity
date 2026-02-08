'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAppStore } from '@/store/useAppStore';
import { formatCurrency } from '@/lib/utils';
import { Receipt as ReceiptIcon, ChevronRight, Utensils, Calendar, Users, PenTool, Loader2, ArrowRight } from 'lucide-react';
import { getDeviceId } from '@/lib/device-id';
import { ApiService } from '@/services/api';
import { processImageForOCR } from '@/lib/image-processing';
import ReceiptListItem from '@/components/ReceiptListItem';
import SplashScreen from '@/components/SplashScreen';

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

export default function Home() {
  const [recentReceipts, setRecentReceipts] = useState<SimpleReceipt[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const router = useRouter();
  const { setParsedData, setReceiptId, setReceiptImage, participants, reset } = useAppStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Client-side only ID generation
    const userId = getDeviceId();

    // 1. Fetch List
    fetch(`/api/receipt/list?userId=${userId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setRecentReceipts(data.data);
        }
      })
      .catch(err => console.error(err));

    // 2. Check for Shared Link (Query Param)
    const urlParams = new URLSearchParams(window.location.search);
    const sharedId = urlParams.get('id');
    if (sharedId) {
      // Auto-load shared receipt
      fetch(`/api/receipt/${sharedId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            const freshReceipt = data.data;
            const dataToLoad = freshReceipt.correctedData || freshReceipt.parsedData;
            const fullData = {
              ...dataToLoad,
              date: dataToLoad.date ? new Date(dataToLoad.date) : undefined
            };

            setReceiptId(freshReceipt._id);
            setParsedData(fullData, "");

            useAppStore.setState({
              participants: freshReceipt.participants || [],
              assignments: freshReceipt.assignments || []
            });

            // Route based on state
            if (freshReceipt.assignments?.length > 0) router.push('/result');
            else if (freshReceipt.participants?.length > 0) router.push('/assign');
            else router.push('/verify');
          } else {
            alert("Shared bill not found or expired.");
          }
        })
        .catch(err => {
          console.error("Failed to load shared bill", err);
          alert("Failed to load shared bill.");
        });
    }

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
    const previousReceipts = [...recentReceipts];
    setRecentReceipts(prev => prev.filter(r => r._id !== id));

    try {
      const res = await fetch(`/api/receipt/${id}`, { method: 'DELETE' });
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to delete');
      }
    } catch (err) {
      console.error("Error deleting receipt", err);
      // Revert if failed
      setRecentReceipts(previousReceipts);
      alert("Failed to delete receipt");
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      let file = e.target.files[0];
      const userId = getDeviceId();

      setIsUploading(true);
      reset(); // Clear previous state

      // Create preview URL (initial)
      const url = URL.createObjectURL(file);
      setReceiptImage(url);

      try {
        // Process Image (Resize & Compress if > 1MB)
        file = await processImageForOCR(file);

        // Update preview URL with processed image
        const processedUrl = URL.createObjectURL(file);
        setReceiptImage(processedUrl);

        const result = await ApiService.uploadReceipt(file, userId);

        if (result.success && result.data) {
          setParsedData(result.data, result.rawText);
          if (result.id) {
            setReceiptId(result.id);
          }
          router.push('/verify');
        } else {
          console.warn("No success flag or data", result);
          alert("Analysis resulted in empty data, please try a clearer photo.");
          setIsUploading(false);
        }
      } catch (error) {
        console.error("Upload failed", error);
        alert("Failed to process receipt: " + (error as Error).message);
        setIsUploading(false);
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Helper for random colored bg for receipt icon
  const getReceiptIconColor = (index: number) => {
    const colors = ['bg-orange-500 text-white', 'bg-emerald-500 text-white', 'bg-blue-500 text-white', 'bg-purple-500 text-white'];
    return colors[index % colors.length];
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#000000] text-foreground max-w-md mx-auto relative overflow-hidden font-sans">
      {/* Splash Screen */}
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}

      {/* Full Screen Processing State */}
      {isUploading && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 animate-in fade-in duration-300">
          <div className="relative w-32 h-32 mb-8">
            <div className="absolute inset-0 border-4 border-white/10 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl animate-pulse">🧾</span>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Analyzing Receipt</h2>
          <p className="text-neutral-400 max-w-xs animate-pulse">Please wait while we extract items and prices...</p>
        </div>
      )}

      {/* Background Texture (Simulated with radial gradient for now, can be replaced with image) */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-neutral-800/20 via-transparent to-transparent pointer-events-none" />

      {/* Hidden File Input */}
      <Input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        // capture="environment" // Removed to allow gallery selection
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Header */}
      <header className="pt-10 pb-6 px-6 flex justify-center items-center z-10 w-full">
        <div className="flex justify-center w-full">
          <Image
            src="/assets/elements/logo.svg"
            alt="Splity Logo"
            width={120}
            height={40}
            className="object-contain"
            priority
            unoptimized
            style={{ width: 'auto', height: 'auto' }}
          />
        </div>
      </header>

      <main className="flex-1 px-5 flex flex-col gap-4 z-10 pb-24">

        {/* Scan Bill Card */}
        <div
          onClick={!isUploading ? triggerFileInput : undefined}
          className={`relative overflow-hidden rounded-2xl bg-[#262626] border border-white/10 p-4 flex items-center justify-between shadow-lg hover:border-white/20 transition-all active:scale-[0.98] group cursor-pointer ${isUploading ? 'opacity-70 pointer-events-none' : ''}`}
        >
          {/* Glow effect */}
          <div className="absolute left-0 top-0 w-20 h-full bg-gradient-to-r from-primary/5 to-transparent pointer-events-none" />

          <div className="flex items-center gap-4 relative z-10">
            <div className="relative w-12 h-12 shrink-0 flex items-center justify-center">
              {isUploading ? (
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              ) : (
                <Image
                  src="/assets/elements/bill.svg"
                  alt="Scan Bill"
                  fill
                  className="object-contain drop-shadow-md"
                  unoptimized
                />
              )}
            </div>
            <div className="flex flex-col">
              <h3 className="text-lg font-bold text-white group-hover:text-primary transition-colors leading-tight">
                {isUploading ? "Analyzing..." : "Scan your bill"}
              </h3>
              <p className="text-sm text-neutral-400 font-medium flex items-center gap-1">
                {isUploading ? "Please wait a moment" : <>and split <span className="text-yellow-400">⚡</span></>}
              </p>
            </div>
          </div>

          <div className="pr-2 group-hover:translate-x-1 transition-transform">
            {!isUploading && <ArrowRight className="text-neutral-400 group-hover:text-white transition-all" />}
          </div>
        </div>

        {/* Manual Split Card */}
        <div className="relative overflow-hidden rounded-2xl bg-[#262626] border border-white/5 p-4 flex items-center shadow-lg cursor-not-allowed opacity-80 group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0 border border-orange-500/20">
              <div className="text-2xl">🧶</div> {/* Placeholder for yarn icon */}
            </div>
            <div className="flex flex-col">
              <h3 className="text-lg font-bold text-white group-hover:text-orange-400 transition-colors leading-tight">Split Manually</h3>
              <p className="text-sm text-neutral-500 font-medium">Without OCR</p>
            </div>
          </div>
        </div>

        {/* Recent Splits Section */}
        <div className="mt-4">
          <div className="flex justify-between items-center mb-4 px-1">
            <h2 className="text-lg font-bold text-white">Your Recent Splits</h2>
            <Link href="#" className="text-yellow-500 text-sm font-semibold hover:underline">See all</Link>
          </div>

          {recentReceipts.length === 0 ? (
            <div className="text-center py-12 text-neutral-500 bg-[#262626] border border-white/5 rounded-2xl">
              <p>No recent splits found.</p>
              <Button variant="link" className="mt-2 text-primary" onClick={triggerFileInput}>
                Create your first split
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentReceipts.map((receipt, idx) => (
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
        </div>

      </main>

      {/* Creator Footer */}
      <footer className="py-6 text-center z-10 relative">
        <p className="text-sm text-neutral-500" style={{ fontFamily: 'var(--font-poor-story)' }}>
          meet the creator
          <a
            href="https://www.linkedin.com/in/aditbap/"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-1 hover:brightness-110 active:scale-95 inline-block transition-transform"
          >
            <span style={{ color: '#FFCB45' }}>here</span> 🌴
          </a>
        </p>
      </footer>
    </div>
  );
}
