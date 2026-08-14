'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Compass, Users, MapPin, Zap, Flame, Award, ChevronRight } from 'lucide-react';

export default function Home() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 120, damping: 14 }
    }
  };

  const liveActivities = [
    { name: "Sarah M.", activity: "Sunset Trail Run", location: "Central Park", distance: "0.8 mi away", rating: "5.0 ★" },
    { name: "Alex K.", activity: "Espresso & Co-working", location: "Blue Bottle Coffee", distance: "1.2 mi away", rating: "4.9 ★" },
    { name: "Marcus V.", activity: "Pickup Basketball", location: "Rucker Park", distance: "2.1 mi away", rating: "5.0 ★" },
  ];

  const features = [
    {
      title: "Real-Time Radar Discovery",
      description: "Broadcast your activity intent and discover partners within a customizable radius instantly.",
      icon: <Compass className="w-7 h-7 text-[#DC2626]" />,
      badge: "LIVE RADAR"
    },
    {
      title: "Smart Partner Matching",
      description: "Filter by skill level, activity style, accessibility requirements, and connection intent.",
      icon: <Users className="w-7 h-7 text-[#FBBF24]" />,
      badge: "AI MATCHED"
    },
    {
      title: "Seamless Meetup Coordination",
      description: "In-app pre-match chat, location route sharing, and instant meetup confirmation cards.",
      icon: <MapPin className="w-7 h-7 text-white" />,
      badge: "INSTANT RSVP"
    }
  ];

  return (
    <div className="relative min-h-screen bg-[#0A0C10] text-[#F8FAFC] flex flex-col items-center overflow-hidden selection:bg-[#DC2626] selection:text-white">
      {/* Background Lighting Gradients */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-[#DC2626]/20 via-[#991B1B]/10 to-transparent rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-[#FBBF24]/10 rounded-full blur-[160px] pointer-events-none" />

      {/* Navigation Layer */}
      <nav className="w-full max-w-7xl mx-auto px-6 py-6 flex justify-between items-center z-50">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#DC2626] to-[#991B1B] flex items-center justify-center shadow-[0_0_20px_rgba(220,38,38,0.6)]">
            <Compass className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-black tracking-tight text-white">
            Wanna<span className="text-[#DC2626] drop-shadow-[0_0_10px_rgba(220,38,38,0.8)]">Go</span>
          </span>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex gap-4 items-center"
        >
          <Link href="/dashboard" className="text-sm font-semibold text-[#94A3B8] hover:text-white transition-colors hidden sm:block">
            Explore Radar
          </Link>
          <Link href="/dashboard">
            <span className="bg-[#DC2626] hover:bg-[#B91C1C] text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-[0_0_25px_rgba(220,38,38,0.5)] transition-all duration-300 flex items-center gap-2">
              Launch Radar <Zap className="w-4 h-4 text-[#FBBF24] fill-[#FBBF24]" />
            </span>
          </Link>
        </motion.div>
      </nav>

      {/* Hero Section */}
      <motion.main 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex-1 w-full max-w-5xl mx-auto px-6 flex flex-col items-center justify-center relative mt-8 md:mt-16 z-10 text-center"
      >
        <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#12151E] border border-[#DC2626]/30 mb-6 shadow-[0_0_20px_rgba(220,38,38,0.2)]">
          <span className="flex h-2 w-2 rounded-full bg-[#DC2626] animate-pulse shadow-[0_0_8px_#DC2626]"></span>
          <span className="text-xs font-bold text-[#E2E8F0] tracking-wide uppercase">The Premium Social Activity Network</span>
        </motion.div>

        <motion.h1 
          variants={itemVariants} 
          className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-[1.1]"
        >
          Spontaneous Plans, <br className="hidden sm:block"/>
          <span className="text-crimson-gradient">Made Effortlessly Social.</span>
        </motion.h1>

        <motion.p 
          variants={itemVariants}
          className="text-base md:text-lg text-[#94A3B8] max-w-2xl mb-10 leading-relaxed"
        >
          No more dead-end group chats. Select an activity, set your radar radius, and connect live with like-minded people ready to go right now.
        </motion.p>

        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 items-center justify-center w-full max-w-md mb-12">
          <Link href="/dashboard" className="w-full sm:w-auto">
            <motion.button 
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="w-full sm:w-auto px-8 py-4 bg-[#DC2626] hover:bg-[#B91C1C] text-white rounded-2xl font-bold text-lg shadow-[0_0_35px_rgba(220,38,38,0.6)] transition-all flex items-center justify-center gap-3 border border-red-500/30"
            >
              <span>Find Activities Near Me</span>
              <ArrowRight className="w-5 h-5 text-white" />
            </motion.button>
          </Link>
        </motion.div>

        {/* Live Social Ticker Mockup */}
        <motion.div variants={itemVariants} className="w-full max-w-2xl bg-[#12151E]/90 border border-white/10 rounded-2xl p-4 shadow-[0_20px_40px_rgba(0,0,0,0.6)] backdrop-blur-xl mb-16">
          <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-[#DC2626] animate-pulse" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">Live Activity Radar Feed</span>
            </div>
            <span className="text-[11px] font-semibold text-[#FBBF24] bg-[#FBBF24]/10 px-2.5 py-0.5 rounded-full border border-[#FBBF24]/20">
              12 Users Broadcasting
            </span>
          </div>

          <div className="space-y-2.5">
            {liveActivities.map((act, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-[#1A1E2B]/80 border border-white/5 hover:border-[#DC2626]/40 transition-colors">
                <div className="flex items-center gap-3 text-left">
                  <div className="w-9 h-9 rounded-full bg-[#DC2626]/20 border border-[#DC2626]/40 flex items-center justify-center font-bold text-white text-xs">
                    {act.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{act.activity}</p>
                    <p className="text-xs text-[#94A3B8]">{act.name} • {act.location}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-[#FBBF24] block">{act.rating}</span>
                  <span className="text-[11px] text-[#94A3B8]">{act.distance}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.main>

      {/* Feature Grid */}
      <div className="w-full max-w-6xl mx-auto px-6 py-16 border-t border-white/5 relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black text-white mb-2">Designed for Action</h2>
          <p className="text-[#94A3B8]">Everything you need to turn digital intent into real-world experiences.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="dark-glass-card p-6 relative group hover:border-[#DC2626]/40 transition-all duration-300"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="p-3.5 rounded-xl bg-[#1A1E2B] border border-white/10 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <span className="text-[10px] font-bold text-[#FBBF24] bg-[#FBBF24]/10 border border-[#FBBF24]/20 px-2.5 py-1 rounded-full">
                  {feature.badge}
                </span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-[#94A3B8] leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full border-t border-white/5 py-8 text-center text-xs text-[#94A3B8] space-y-2">
        <p>© 2026 WannaGo Social Activity Platform. Built for spontaneous real-world connections.</p>
        <p className="flex items-center justify-center gap-3">
          <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
          <span className="text-white/20">•</span>
          <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
        </p>
      </footer>
    </div>
  );
}

