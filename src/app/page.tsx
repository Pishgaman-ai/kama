"use client";
import React from "react";
import { Radio } from "lucide-react";
import Image from "next/image";

export default function EduHelperHomepage() {
  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <RolesSection />
      <Hero />
      <BenefitsSection />
      <ContactFormSection />
    </div>
  );
}

function Hero() {
  return (
    <section className="w-full py-4 sm:py-6 md:py-8 lg:py-12">
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
        <div className="relative bg-brand-purple rounded-2xl sm:rounded-3xl md:rounded-[40px] lg:rounded-[50px] overflow-hidden">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 p-6 sm:p-8 md:p-10 lg:p-12 xl:p-16">
            {/* Content Section */}
            <div className="flex flex-col justify-center space-y-6 md:space-y-8 order-2 lg:order-1">
              <div className="flex items-center gap-2 border-2 border-white rounded-lg px-4 py-2 w-fit backdrop-blur-sm bg-white/10">
                <Radio className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                <span className="text-xs sm:text-sm font-bold text-white">
                  پیشگامان هوش مصنوعی
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-[40px] font-bold text-white leading-tight">
                مدیریت، آموزش و تحلیل عملکرد دانش‌آموزان
                <br className="hidden sm:block" />
                <span className="block mt-2">
                  همه در یک پلتفرم واحد با هوش مصنوعی
                </span>
              </h1>

              <div className="space-y-4 md:space-y-5">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center mt-0.5">
                    <svg
                      className="w-4 h-4 text-white"
                      viewBox="0 0 20 20"
                      fill="none"
                    >
                      <path
                        d="M7 10L9 12L13 8"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <p className="text-sm sm:text-base md:text-lg text-white/95 leading-relaxed">
                    والدین و دانش‌آموزان همیشه از وضعیت تحصیلی خود باخبرند
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center mt-0.5">
                    <svg
                      className="w-4 h-4 text-white"
                      viewBox="0 0 20 20"
                      fill="none"
                    >
                      <path
                        d="M7 10L9 12L13 8"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <p className="text-sm sm:text-base md:text-lg text-white/95 leading-relaxed">
                    معلمان با کمک AI پاسخ‌های تشریحی را به‌صورت خودکار تصحیح
                    می‌کنند
                  </p>
                </div>
              </div>

              <button className="bg-brand-yellow hover:bg-yellow-400 text-black font-bold text-sm sm:text-base md:text-lg py-3.5 sm:py-4 px-8 sm:px-10 md:px-12 rounded-full w-full sm:w-auto transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl">
                امتحان رایگان دمو
              </button>
            </div>

            {/* Image Section */}
            <div className="relative flex items-center justify-center lg:justify-end order-1 lg:order-2 min-h-[300px] sm:min-h-[350px] lg:min-h-[400px]">
              <div className="image-crisp-edges">
                <Image
                  src="/Hero-pic.png"
                  alt="دانش آموز"
                  width={480}
                  height={400}
                  className="w-full max-w-[280px] sm:max-w-[350px] md:max-w-[400px] lg:max-w-[480px] h-auto object-contain relative z-0"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function BenefitsSection() {
  const benefits = [
    {
      number: "1",
      title: "تصحیح خودکار و سریع با هوش مصنوعی",
      description:
        "با کاما: سؤالات تشریحی رو به‌صورت خودکار و دقیق نمره‌گذاری کن، بدون اتلاف وقت. بدون کاما: ساعت‌ها وقتت صرف تصحیح برگه‌ها می‌شه و احتمال خطای انسانی همیشه هست.",
      image: "/1.png",
      imageClass: "w-20 sm:w-24 md:w-28 lg:w-32",
    },
    {
      number: "2",
      title: "گزارش‌ها و تحلیل‌های هوشمند",
      description:
        "با کاما: نمودارهای آماده از پیشرفت دانش‌آموزان، عملکرد کلاس‌ها و مقایسه‌ی معلمان در اختیار داری. بدون کاما: داده‌ها پراکنده‌ست، تحلیل عملکرد باید دستی انجام بشه، و دید کلی از مدرسه نداری.",
      image: "/2.png",
      imageClass: "w-24 sm:w-28 md:w-32 lg:w-36",
    },
    {
      number: "3",
      title: "ارتباط کامل بین معلم، دانش‌آموز و والدین",
      description:
        "با کاما: والدین همیشه در جریان نمرات و فعالیت فرزندشون هستن، بدون نیاز به تماس یا دفتر مدرسه. بدون کاما: عدم شفافیت بین خانواده و مدرسه باعث کاهش همکاری و افت عملکرد می‌شه.",
      image: "/3.png",
      imageClass: "w-24 sm:w-28 md:w-32 lg:w-36",
    },
    {
      number: "4",
      title: "مدیریت متمرکز برای مدیران مدارس",
      description:
        "با کاما: از یک پنل ساده می‌تونی معلم‌ها، کلاس‌ها و امتحان‌ها رو کنترل کنی. بدون کاما: مدیریت اطلاعات بین چند فایل و گروه پخش می‌شه و هماهنگی بین بخش‌ها سخت‌تر می‌شه.",
      image: "/4.png",
      imageClass: "w-28 sm:w-32 md:w-36 lg:w-40",
    },
  ];

  return (
    <section className="w-full py-12 sm:py-16 md:py-20 lg:py-24 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
        <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-center text-black mb-8 sm:mb-12 md:mb-16 leading-relaxed px-4">
          اگر هنوز از کاما استفاده نمی‌کنید...
          <br />
          <span className="text-brand-purple">
            در واقع دارید این ۱ + ۴ چیز مهم رو از دست می‌دید
          </span>
        </h2>

        <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mb-6 sm:mb-8">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 flex flex-col sm:flex-row items-start gap-4 sm:gap-6 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02]"
            >
              {benefit.image && (
                <div className="flex-shrink-0 mx-auto sm:mx-0">
                  <div className="image-crisp-edges">
                    <Image
                      src={benefit.image}
                      alt=""
                      width={144}
                      height={144}
                      className={`${benefit.imageClass} h-auto object-contain`}
                      loading="lazy"
                    />
                  </div>
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3 sm:mb-4">
                  <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-brand-purple">
                    {benefit.number}
                  </span>
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-black">
                    {benefit.title}
                  </h3>
                </div>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 flex flex-col sm:flex-row items-center gap-6 sm:gap-8 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex-1 text-center sm:text-right">
            <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-black mb-3 sm:mb-4">
              و به زودی تجربه‌ی یادگیری هیجان‌انگیزتر!
            </h3>
            <p className="text-sm sm:text-base md:text-lg text-gray-700 leading-relaxed">
              با اضافه شدن سیستم امتیاز، نشان و چالش‌های دوستانه، کاما به محیطی
              جذاب‌تر برای یادگیری و پیشرفت تبدیل می‌شود.
            </p>
          </div>
          <div className="image-crisp-edges">
            <Image
              src="/5.png"
              alt="جایزه"
              width={144}
              height={144}
              className="w-24 sm:w-28 md:w-32 lg:w-36 h-auto object-contain"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function RolesSection() {
  const roles = [
    {
      title: "مدیر مدرسه",
      description:
        "از اینجا می‌توانید همه چیز را در مدرسه‌ی خود مدیریت کنید. از ثبت معلم‌ها و دانش‌آموزان تا برگزاری آزمون‌ها و مشاهده‌ی عملکرد کلی.",
      tags: ["نمودارهای عملکردی", "گزارش‌های هوشمند"],
      buttonText: "ورود به داشبورد مدیر",
      dashboardLabel: "داشبورد مدیریتی",
      bgColor: "bg-brand-purple",
      image: "/manager.png",
      role: "principal",
    },
    {
      title: "معلم",
      description:
        "سؤالات را طراحی کنید، نمره‌دهی را به هوش مصنوعی بسپارید، و عملکرد دانش‌آموزان خود را در لحظه ببینید.",
      tags: ["تصحیح", "تحلیل پاسخ‌ها"],
      buttonText: "ورود به داشبورد معلم",
      dashboardLabel: "داشبورد معلمین",
      bgColor: "bg-brand-orange",
      image: "/teacher.png",
      role: "teacher",
    },
    {
      title: "دانش‌آموز",
      description:
        "در آزمون‌ها شرکت کنید، نمره‌ی خود را بلافاصله ببینید و مسیر پیشرفتتان را دنبال کنید.",
      tags: ["تمرین و آزمون", "کارنامه‌ی تحلیلی"],
      buttonText: "ورود به داشبورد دانش‌آموز",
      dashboardLabel: "داشبورد دانش‌آموزان",
      bgColor: "bg-brand-green",
      image: "/student.png",
      role: "student",
    },
    {
      title: "والدین",
      description:
        "از وضعیت تحصیلی فرزند خود همیشه باخبر باشید. نمرات، پیشرفت و فعالیت‌های آموزشی در یک نگاه.",
      tags: ["گزارش کامل", "مسیر رشد تحصیلی فرزندتان"],
      buttonText: "ورود به داشبورد والدین",
      dashboardLabel: "داشبورد والدین",
      bgColor: "bg-brand-violet",
      image: "/parents.png",
      role: "parent",
    },
  ];

  const handleRoleSelect = (role: string) => {
    // Redirect to sign-in page with role parameter
    window.location.href = `/signin?role=${role}`;
  };

  return (
    <section className="w-full py-6 sm:py-8 md:py-10 lg:py-12 bg-white">
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
        <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          {roles.map((role, index) => (
            <div
              key={index}
              className={`${role.bgColor} rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 text-white relative overflow-hidden min-h-[320px] sm:min-h-[350px] flex flex-col hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl`}
            >
              <div className="flex gap-2 mb-6 sm:mb-8 flex-wrap relative z-10">
                {role.tags.map((tag, tagIndex) => (
                  <div
                    key={tagIndex}
                    className="border-2 border-white rounded-lg px-3 py-1.5 backdrop-blur-sm bg-white/10"
                  >
                    <span className="text-xs sm:text-sm font-bold">{tag}</span>
                  </div>
                ))}
              </div>

              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4 relative z-10">
                {role.title}
              </h3>

              <p className="text-sm sm:text-base leading-relaxed mb-6 sm:mb-8 flex-1 relative z-10 max-w-full sm:max-w-[280px]">
                {role.description}
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mt-auto relative z-10">
                <button
                  className="bg-white hover:bg-gray-100 text-black font-bold text-sm sm:text-base py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 active:scale-95 shadow-md"
                  onClick={() => handleRoleSelect(role.role)}
                >
                  <span>{role.buttonText}</span>
                  <svg
                    className="w-5 h-5 sm:w-6 sm:h-6"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <path
                      d="M5 13H16.86L13.23 17.36C13.146 17.4611 13.0826 17.5778 13.0437 17.7034C13.0047 17.829 12.9909 17.961 13.003 18.0919C13.0274 18.3564 13.1558 18.6003 13.36 18.77C13.5642 18.9397 13.8275 19.0214 14.0919 18.997C14.3564 18.9726 14.6003 18.8442 14.77 18.64L19.77 12.64C19.8036 12.5923 19.8337 12.5421 19.86 12.49C19.86 12.44 19.91 12.41 19.93 12.36C19.9753 12.2453 19.9991 12.1233 20 12C19.9991 11.8767 19.9753 11.7547 19.93 11.64C19.93 11.59 19.88 11.56 19.86 11.51C19.8337 11.4579 19.8036 11.4077 19.77 11.36L14.77 5.36C14.676 5.24712 14.5582 5.15634 14.4252 5.09412C14.2921 5.0319 14.1469 4.99976 14 5C13.7663 4.99955 13.5399 5.08092 13.36 5.23C13.2587 5.31395 13.175 5.41705 13.1137 5.5334C13.0523 5.64975 13.0145 5.77705 13.0025 5.90803C12.9904 6.03901 13.0043 6.17108 13.0433 6.29668C13.0824 6.42229 13.1458 6.53895 13.23 6.64L16.86 11H5C4.73478 11 4.48043 11.1054 4.29289 11.2929C4.10536 11.4804 4 11.7348 4 12C4 12.2652 4.10536 12.5196 4.29289 12.7071C4.48043 12.8946 4.73478 13 5 13Z"
                      fill="currentColor"
                    />
                  </svg>
                </button>
                <span className="text-xs sm:text-sm font-bold text-center sm:text-right opacity-90">
                  {role.dashboardLabel}
                </span>
              </div>

              <div className="absolute left-4 sm:left-6 md:left-8 top-4 sm:top-6 md:top-8 w-[120px] h-[120px] sm:w-[140px] sm:h-[140px] md:w-[167px] md:h-[167px] rounded-full overflow-hidden">
                <div className="image-crisp-edges">
                  <Image
                    src={role.image}
                    alt={role.title}
                    width={167}
                    height={167}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Added descriptive text below the roles section */}
        <div className="mt-12 text-center">
          <p className="text-lg sm:text-xl md:text-2xl font-bold text-black mb-2">
            کاما برای هر کاربر تجربه‌ای متفاوت و هدفمند فراهم کرده است
          </p>
          <p className="text-base sm:text-lg md:text-xl font-bold text-brand-purple">
            کافی‌ست نقش خود را انتخاب کنید تا وارد محیط اختصاصی شوید.
          </p>
        </div>
      </div>
    </section>
  );
}

function ContactFormSection() {
  return (
    <section className="w-full py-12 sm:py-16 md:py-20 lg:py-24 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
        <div className="bg-brand-purple rounded-2xl sm:rounded-3xl md:rounded-[40px] p-6 sm:p-8 md:p-12 lg:p-16 shadow-xl">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="text-white space-y-4 sm:space-y-6 text-center lg:text-right">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[42px] font-extrabold leading-tight">
                می‌خواهید ببینید کاما چطور کار می‌کند؟
              </h2>
              <p className="text-base sm:text-lg md:text-xl font-bold leading-relaxed opacity-95">
                فرم زیر را پر کنید تا کارشناسان ما در کمتر از ۱۵ دقیقه با شما
                تماس بگیرند و یک نسخه‌ی نمایشی از سیستم را برایتان فعال کنند.
              </p>
            </div>

            <div className="space-y-4 sm:space-y-5">
              <input
                type="text"
                placeholder="نام و نام خانوادگی"
                className="w-full bg-white rounded-full px-5 sm:px-6 md:px-8 py-3.5 sm:py-4 text-gray-800 placeholder:text-gray-400 text-sm sm:text-base md:text-lg font-bold text-right focus:outline-none focus:ring-4 focus:ring-white/30 transition-all"
              />
              <input
                type="text"
                placeholder="شماره تماس یا ایمیل"
                className="w-full bg-white rounded-full px-5 sm:px-6 md:px-8 py-3.5 sm:py-4 text-gray-800 placeholder:text-gray-400 text-sm sm:text-base md:text-lg font-bold text-right focus:outline-none focus:ring-4 focus:ring-white/30 transition-all"
              />
              <button className="w-full bg-brand-yellow hover:bg-yellow-400 text-black font-bold text-base sm:text-lg md:text-xl py-3.5 sm:py-4 px-6 rounded-full transition-all duration-200 hover:scale-[1.02] active:scale-95 shadow-lg hover:shadow-xl">
                درخواست دمو
              </button>
              <p className="text-sm sm:text-base md:text-lg font-bold text-white text-center pt-2">
                بدون نیاز به نصب — اجرا روی هر دستگاهی
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
