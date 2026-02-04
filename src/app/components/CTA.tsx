"use client";
import React from "react";
import { ArrowRight, ShieldCheck } from "lucide-react";

export default function CTA() {
  return (
    <section className="relative py-24 px-4">
      <div className="max-w-5xl mx-auto relative z-10">
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-3xl blur-2xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
          <div className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-3xl p-12 md:p-16 text-center overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMC41IiBvcGFjaXR5PSIwLjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>
            <div className="relative">
              <div className="inline-block p-3 bg-white/20 backdrop-blur-xl rounded-2xl mb-6">
                <ShieldCheck className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-white mb-6 leading-tight">
                آماده‌اید کلاس درس خود را متحول کنید؟
              </h2>
              <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
                به مدارس پایلوت بپیوندید و آینده آموزش را امروز تجربه کنید
              </p>
              <button className="group/btn relative px-10 py-5 bg-white text-purple-600 rounded-2xl font-black text-lg overflow-hidden hover:scale-105 transition-transform">
                <span className="relative flex items-center space-x-2 space-x-reverse">
                  <span>همین حالا شروع کنید</span>
                  <ArrowRight className="w-5 h-5 rotate-180 group-hover/btn:translate-x-1 transition-transform" />
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
