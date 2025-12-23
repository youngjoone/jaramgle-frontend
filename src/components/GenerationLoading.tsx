"use client";

import { motion } from 'framer-motion';

interface GenerationLoadingProps {
    progress: number;
}

export function GenerationLoading({ progress }: GenerationLoadingProps) {
    const getStatusText = (p: number) => {
        if (p < 30) return "작가님이 이야기를 구상 중이에요...";
        if (p < 60) return "예쁜 그림을 그리고 있어요...";
        if (p < 90) return "목소리를 다듬고 있어요...";
        return "거의 다 됐어요!";
    };

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#fdfbf7]">
            <div className="relative w-[600px] h-[400px] rounded-[20px] overflow-hidden shadow-2xl mb-8 border-4 border-white">
                {/* Video Background */}
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover"
                >
                    <source src="/videos/loading.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                </video>

                {/* Vignette Overlay */}
                <div className="absolute inset-0 bg-radial-gradient from-transparent to-black/20 pointer-events-none" />
            </div>

            <div className="w-[400px] text-center z-10">
                <motion.div
                    key={getStatusText(progress)}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xl text-[#555] font-bold mb-4 min-h-[27px]"
                >
                    {getStatusText(progress)}
                </motion.div>

                <div className="w-full h-3 bg-[#eee] rounded-full overflow-hidden relative shadow-inner">
                    <motion.div
                        className="h-full bg-gradient-to-r from-[#66BB6A] to-[#81C784]"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5 }}
                    />
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer"
                        style={{ backgroundSize: '200% 100%', animation: 'shimmer 2s infinite linear' }}
                    />
                </div>
            </div>
            <style jsx global>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .bg-radial-gradient {
            background: radial-gradient(circle, transparent 60%, rgba(0,0,0,0.3) 100%);
        }
      `}</style>
        </div>
    );
}
