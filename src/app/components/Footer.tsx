"use client";
import React from "react";
import { Phone, Mail, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full bg-brand-purple py-12 md:py-16">
      <div className="container mx-auto px-4 max-w-[960px]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {/* Brand Section */}
          <div className="text-center md:text-right">
            <h2 className="text-2xl md:text-[32px] font-extrabold text-brand-yellow mb-4">
              کاما
            </h2>
            <p className="text-sm md:text-base font-bold text-white mb-6 leading-relaxed">
              دستیار یادگیری هوشمند برای معلمان، دانش‌آموزان و والدین
            </p>
            <div className="flex justify-center md:justify-end space-x-4 space-x-reverse">
              <div className="w-10 h-10 rounded-full bg-brand-yellow/20 flex items-center justify-center">
                <Phone className="w-5 h-5 text-brand-yellow" />
              </div>
              <div className="w-10 h-10 rounded-full bg-brand-yellow/20 flex items-center justify-center">
                <Mail className="w-5 h-5 text-brand-yellow" />
              </div>
            </div>
          </div>

          {/* Links Section */}
          <div className="text-center md:text-right">
            <h3 className="text-lg font-extrabold text-brand-yellow mb-4">
              لینک‌های مفید
            </h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="#"
                  className="text-white hover:text-brand-yellow transition-colors text-sm md:text-base font-bold"
                >
                  صفحه اصلی
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-white hover:text-brand-yellow transition-colors text-sm md:text-base font-bold"
                >
                  درباره کاما
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-white hover:text-brand-yellow transition-colors text-sm md:text-base font-bold"
                >
                  امکانات
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-white hover:text-brand-yellow transition-colors text-sm md:text-base font-bold"
                >
                  تماس با ما
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Section */}
          <div className="text-center md:text-right">
            <h3 className="text-lg font-extrabold text-brand-yellow mb-4">
              تماس با ما
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-center md:justify-end gap-2">
                <Phone className="w-5 h-5 text-brand-yellow" />
                <span className="text-white text-sm md:text-base font-bold">
                  021-22877895
                </span>
              </div>
              <div className="flex items-center justify-center md:justify-end gap-2">
                <Mail className="w-5 h-5 text-brand-yellow" />
                <span className="text-white text-sm md:text-base font-bold">
                  info@eduhelper.com
                </span>
              </div>
              <div className="flex items-center justify-center md:justify-end gap-2">
                <MapPin className="w-5 h-5 text-brand-yellow" />
                <span className="text-white text-sm md:text-base font-bold">
                  تهران، ایران
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-brand-yellow/20 mt-12 pt-8 text-center">
          <p className="text-sm font-bold text-white">
            © ۱۴۰۴ - تمام حقوق محفوظ است
          </p>
        </div>
      </div>
    </footer>
  );
}
