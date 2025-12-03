"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { CreditCard, Lock, Zap } from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface PricingPlan {
  id: number;
  name: string;
  emoji: string;
  credits: number;
  bonus: number;
  price: number;
  isPopular: boolean;
  productCode?: string;
}

interface Particle {
  id: number;
  left: number;
  top: number;
  size: number;
  delay: number;
  duration: number;
}

const pricingPlans: PricingPlan[] = [
  {
    id: 1,
    name: '스타터',
    emoji: '',
    credits: 10,
    bonus: 0,
    price: 9,
    isPopular: false,
  },
  {
    id: 2,
    name: '베스트',
    emoji: '',
    credits: 22,
    bonus: 10,
    price: 19,
    isPopular: true,
  },
  {
    id: 3,
    name: '프리미엄',
    emoji: '',
    credits: 60,
    bonus: 15,
    price: 49,
    isPopular: false,
  },
  {
    id: 4,
    name: '프로',
    emoji: '',
    credits: 130,
    bonus: 20,
    price: 99,
    isPopular: false,
  },
];

export function CreditPurchasePage() {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [plans, setPlans] = useState<PricingPlan[]>(pricingPlans);
  const [loadingId, setLoadingId] = useState<number | null>(null);

  // Generate particles only on client side to avoid hydration mismatch
  useEffect(() => {
    setParticles(Array.from({ length: 20 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: 2 + Math.random() * 4,
      delay: Math.random() * 5,
      duration: 10 + Math.random() * 10,
    })));
  }, []);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const products = await apiFetch<Array<{
          code: string;
          name: string;
          description: string;
          hearts: number;
          bonusHearts: number;
          price: number;
          sortOrder: number;
        }>>("/billing/products");
        const mapped: PricingPlan[] = products
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((p, idx) => ({
            id: idx + 1,
            name: p.name,
            emoji: '',
            credits: p.hearts,
            bonus: p.bonusHearts,
            price: p.price,
            isPopular: idx === 1, // 두 번째 상품을 기본 인기 상품으로
            productCode: p.code,
          }));
        if (mapped.length > 0) {
          setPlans(mapped);
        }
      } catch (err) {
        console.error("상품 목록 불러오기 실패", err);
        // 실패 시 기본 프리셋 사용
      }
    };
    loadProducts();
  }, []);

  const handlePurchase = async (plan: PricingPlan) => {
    if (!plan.productCode) {
      alert("상품 코드가 없습니다. 잠시 후 다시 시도해주세요.");
      return;
    }
    setLoadingId(plan.id);
    try {
      const order = await apiFetch<{ id: number }>("/billing/orders", {
        method: "POST",
        body: { product_code: plan.productCode, quantity: 1 },
      });
      await apiFetch(`/billing/orders/${order.id}/confirm`, {
        method: "POST",
      });
      alert("하트 충전이 완료되었습니다!");
    } catch (err: any) {
      console.error("하트 충전 실패", err);
      alert("하트 충전에 실패했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] relative overflow-hidden py-20 sm:py-32">
      {/* Decorative Background Elements */}

      {/* Gradient Orbs */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-gradient-to-br from-[#66BB6A]/20 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-gradient-to-tl from-[#FDD835]/20 to-transparent rounded-full blur-3xl" />

      {/* Floating Particles */}
      {particles.map((particle) => (
        <motion.div
          key={`particle-${particle.id}`}
          className="absolute rounded-full bg-[#66BB6A]/30"
          style={{
            left: `${particle.left}%`,
            top: `${particle.top}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Grid Pattern Overlay */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(#66BB6A 1px, transparent 1px),
            linear-gradient(90deg, #66BB6A 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="text-center mb-12 sm:mb-16"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="font-extrabold text-4xl sm:text-5xl lg:text-6xl mb-4 bg-gradient-to-r from-[#66BB6A] via-[#81C784] to-[#388E3C] bg-clip-text text-transparent tracking-tight">
            크레딧 충전하기
          </h1>
          <p className="text-[#757575] font-normal text-base sm:text-lg max-w-2xl mx-auto">
            AI 동화책 생성을 위한 크레딧을 선택하세요
          </p>
        </motion.div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6 mb-12 sm:mb-16">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              className="relative"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              onMouseEnter={() => setHoveredCard(plan.id)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              {/* Card */}
              <motion.div
                className={`relative h-full rounded-3xl p-6 sm:p-8 transition-all duration-300 ${
                  plan.isPopular
                    ? 'bg-white/60 backdrop-blur-xl border-2 border-[#66BB6A]/30 shadow-[0_8px_32px_rgba(102,187,106,0.15)]'
                    : 'bg-white/40 backdrop-blur-xl border border-[#E0E0E0] shadow-[0_8px_32px_rgba(0,0,0,0.08)]'
                }`}
                animate={{
                  y: hoveredCard === plan.id ? -8 : 0,
                  scale: plan.isPopular && hoveredCard === null ? 1.02 : 1,
                }}
                transition={{ duration: 0.3 }}
                style={{
                  boxShadow: hoveredCard === plan.id
                    ? '0 20px 60px rgba(102, 187, 106, 0.2)'
                    : plan.isPopular
                      ? '0 12px 40px rgba(102, 187, 106, 0.15)'
                      : '0 8px 32px rgba(0, 0, 0, 0.08)',
                }}
              >
                {/* Popular Badge */}
                {plan.isPopular && (
                  <motion.div
                    className="absolute -top-3 right-4 sm:right-6 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#66BB6A] to-[#388E3C] text-white text-xs font-semibold shadow-lg"
                    animate={{
                      scale: [1, 1.05, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    가장 인기
                  </motion.div>
                )}

                {/* Card Content */}
                <div className="flex flex-col items-center text-center">
                  {/* Plan Name */}
                  <h3 className="font-bold text-lg text-[#424242] mb-4">
                    {plan.name}
                  </h3>

                  {/* Credit Amount */}
                  <div className="mb-1">
                    <span className="font-extrabold text-5xl sm:text-6xl bg-gradient-to-r from-[#66BB6A] to-[#388E3C] bg-clip-text text-transparent tracking-tight">
                      {plan.credits}
                    </span>
                  </div>

                  {/* Credit Label */}
                  <p className="text-[#757575] font-medium mb-8">
                    크레딧
                  </p>

                  {/* Price */}
                  <div className="mb-6">
                    <span
                      className="text-[#424242] tracking-tight"
                      style={{
                        fontSize: '2rem',
                        fontWeight: '500',
                        fontVariantNumeric: 'tabular-nums',
                        letterSpacing: '-0.02em',
                      }}
                    >
                      ₩{plan.price.toLocaleString()}
                    </span>
                  </div>

                  {/* CTA Button */}
                  <Button
                    className={`w-full h-13 rounded-xl font-semibold text-base transition-all duration-300 ${
                      plan.isPopular && (hoveredCard === null || hoveredCard === plan.id)
                        ? 'bg-gradient-to-r from-[#66BB6A] to-[#388E3C] text-white border-0 hover:shadow-lg hover:shadow-[#66BB6A]/40 hover:scale-[1.02]'
                        : 'bg-white/50 text-[#66BB6A] border-2 border-[#66BB6A]/30 hover:bg-gradient-to-r hover:from-[#66BB6A] hover:to-[#388E3C] hover:text-white hover:border-transparent hover:scale-[1.02]'
                    }`}
                    onClick={() => handlePurchase(plan)}
                    disabled={loadingId === plan.id}
                  >
                    {loadingId === plan.id ? "구매 중..." : "구매하기"}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* Footer Info */}
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <div className="flex items-center gap-2 text-[#757575] text-sm">
            <CreditCard className="w-5 h-5 text-[#66BB6A]" />
            <span className="font-medium">안전한 결제</span>
          </div>
          <div className="flex items-center gap-2 text-[#757575] text-sm">
            <Lock className="w-5 h-5 text-[#66BB6A]" />
            <span className="font-medium">SSL 암호화</span>
          </div>
          <div className="flex items-center gap-2 text-[#757575] text-sm">
            <Zap className="w-5 h-5 text-[#66BB6A]" />
            <span className="font-medium">즉시 충전</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
