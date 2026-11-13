import React from "react";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "MBBS Foundation | Online Learning Programme & Medical Education Guide",
  description:
    "A structured online learning programme and foundational guide based on 'MBBS Foundation: Your First Book of Medicine', aligned with the NMC competency-based medical education framework for MBBS students and healthcare professionals across India.",
};

export default function Home() {
  const reviews = [
    {
      role: "Student",
      text: "This is the book I wish I had on my first day of MBBS. It doesn't just teach medicine—it prepares you for the journey.",
      name: "Sanjil Maheshwari",
      detail: "3rd-year MBBS student",
    },
    {
      role: "Student",
      text: "A rare blend of practical guidance and emotional grounding. It helped me understand not just what to study, but how to survive and grow in MBBS.",
      name: "Sowmya",
      detail: "1st Year MBBS Student",
    },
    {
      role: "Mentor",
      text: "This book fills a critical gap in early medical education by addressing the transition from student to doctor with clarity, empathy, and structure.",
      name: "Dr Ashish Jaiman",
      detail: "Director Professor, Orthopaedics, Safdarjung Hospital & VMMC, New Delhi",
    },
    {
      role: "Mentor",
      text: "An insightful and well-structured resource that goes beyond textbooks to shape clinical thinking, professional values, and resilience in young doctors.",
      name: "Dr Manish Pathak",
      detail: "Professor & Head, Pediatric Surgery, AIIMS Jodhpur",
    },
    {
      role: "Mentor",
      text: "Must read for every medico.",
      name: "Dr Omprakash",
      detail: "MD Physiology",
    },
    {
      role: "Parent",
      text: "Best book for the dedicated doctors.",
      name: "Chandresh Goyal",
      detail: "Lecturer and mentor for school children and college students, Karauli",
    },
    {
      role: "Other",
      text: "Very informative and knowledgeable book for all batches of MBBS, particularly first-year students.",
      name: "Md Salam",
      detail: "Staff in Dean office, AIIMS Patna",
    },
    {
      role: "Mentor",
      text: "It provides basic concepts in a clear, concise, and easy-to-understand manner, which helps build a strong foundation.",
      name: "Dr Mahendra Singh Punia",
      detail: "Senior Urologist & Renal Transplant Surgeon, Suvira Hospital Jaipur",
    },
    {
      role: "Mentor",
      text: "Excellent book to read for new medical students starting their medical journey. Based on author's vast clinical experience.",
      name: "Dr Sunil Kumar Garg",
      detail: "Senior Consultant ENT and Skull Base Surgeon, Apex Hospital Malviya Nagar, Jaipur",
    },
    {
      role: "Mentor",
      text: "New innovative idea, will be very helpful to budding doctors.",
      name: "Dr Mani Kant Srivastava",
      detail: "Senior Pediatrician, Patna",
    },
    {
      role: "Mentor",
      text: "All good topics covered.",
      name: "Dr Shivra Batra",
      detail: "Microbiologist Jaipur",
    },
    {
      role: "Mentor",
      text: "A very comprehensive book covering all aspects; a must-have for MBBS students starting their medical career.",
      name: "Dr Abhilash Agrawal",
      detail: "Senior Pediatrician, Vardan Clinic, Surajkund, Faridabad",
    },
    {
      role: "Mentor",
      text: "Simple, practical, and informative — a great book for beginners in medicine.",
      name: "Dr Janarthanan Alwarsamy",
      detail: "MD Pediatrics, Chennai",
    },
  ];

  return (
    <main className="min-h-screen bg-white text-slate-900 font-sans">
      {/* =================================================================== */}
      {/* 1. PRIMARY HOMEPAGE HERO — ONLINE LEARNING PROGRAMME                */}
      {/* =================================================================== */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 via-red-50/20 to-white border-b border-slate-200/80 pt-8 sm:pt-12 pb-12 sm:pb-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 rounded-full bg-red-100/80 border border-red-200 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-red-900 mb-3.5 sm:mb-4">
              <span>🩺</span>
              <span>MBBS FOUNDATION &bull; ONLINE LEARNING PROGRAMME</span>
            </div>

            {/* Heading */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-950 leading-[1.14]">
              Learn Beyond the Textbook.{" "}
              <span className="text-red-700">Become the Doctor Within.</span>
            </h1>

            {/* Refined Short Description */}
            <p className="mt-4 sm:mt-5 text-base sm:text-lg lg:text-xl text-slate-700 leading-relaxed max-w-2xl font-normal">
              A structured, self-paced learning programme based on &lsquo;MBBS Foundation: Your First Book of Medicine&rsquo;, aligned with the National Medical Commission&apos;s competency-based medical education framework. Explore clinical knowledge, essential skills, professionalism and the human side of medicine.
            </p>

            {/* Three Highlights */}
            <div className="mt-7 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 max-w-2xl">
              <div className="rounded-2xl border border-slate-200 bg-white/95 p-3.5 sm:p-4 shadow-2xs">
                <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 block">Curriculum</span>
                <span className="text-sm font-black text-slate-900 mt-0.5 block">14 Learning Modules</span>
              </div>
              <div className="rounded-2xl border border-teal-200 bg-teal-50/80 p-3.5 sm:p-4 shadow-2xs">
                <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-teal-800 block">First Module</span>
                <span className="text-sm font-black text-teal-950 mt-0.5 block">REVIVE &bull; Available Now</span>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white/95 p-3.5 sm:p-4 shadow-2xs">
                <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 block">Credentials</span>
                <span className="text-sm font-black text-slate-900 mt-0.5 block">Verifiable Module Certificates</span>
              </div>
            </div>

            {/* Clearly Differentiated CTAs */}
            <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              <Link
                href="/mbbs-foundation/learn"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 hover:bg-red-700 text-white font-bold px-7 py-3.5 sm:py-4 text-sm sm:text-base shadow-md hover:shadow-lg transition cursor-pointer"
              >
                <span>Explore Online Learning</span>
                <span>&rarr;</span>
              </Link>
              <Link
                href="/mbbs-foundation/learn/modules/revive"
                className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-teal-700 bg-teal-50/70 hover:bg-teal-100 text-teal-900 font-bold px-6 py-3 sm:py-3.5 text-sm sm:text-base transition cursor-pointer"
              >
                <span>Start REVIVE Module</span>
                <span>&rarr;</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* 2. CPR SANJEEVANI (Compact Visually Distinct Banner)                */}
      {/* =================================================================== */}
      <section className="border-b border-sky-200 bg-gradient-to-r from-sky-50 via-blue-50 to-cyan-50 py-6 sm:py-7">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="max-w-2xl space-y-1">
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-sky-200/80 text-sky-900 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider">
                  National Public Health Initiative
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  Indian Academy of Pediatrics
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900">
                CPR Sanjeevani
              </h2>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                A nationwide initiative by the Indian Academy of Pediatrics to empower citizens and health providers with lifesaving CPR skills across India.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
              <Link
                href="/cprday"
                className="rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 px-5 py-2.5 font-bold text-white text-xs sm:text-sm shadow-2xs transition text-center"
              >
                ❤️ CPR Sanjeevani Portal &rarr;
              </Link>
              <a
                href="https://www.facebook.com/share/g/1DF14f2Npr/"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-blue-300 bg-white hover:bg-blue-50 px-4 py-2.5 font-semibold text-blue-800 text-xs sm:text-sm transition text-center"
              >
                Join Facebook Group &rarr;
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* 3. BOOK INTRODUCTION                                               */}
      {/* =================================================================== */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:grid md:grid-cols-2 md:gap-12 items-center">
        <div>
          <span className="text-xs font-black uppercase tracking-[0.2em] text-red-700 block mb-2">
            The Foundational Handbook
          </span>
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-950">
            Build the doctor within
          </h2>
          <p className="mt-2 text-base sm:text-lg font-semibold text-red-700">
            A complete guide for MBBS students in India
          </p>

          <p className="mt-4 text-sm sm:text-base text-slate-600 leading-relaxed">
            <em>MBBS Foundation: Your First Book of Medicine</em> is a practical, evidence-based guide designed to help medical students navigate the crucial transition from school to medical college. Aligned with the competency-based curriculum, it builds essential foundations in CPR, first aid, clinical communication, ethics (AETCOM), and real-world professional readiness.
          </p>

          <p className="mt-3 text-xs sm:text-sm text-slate-500 font-semibold tracking-wide uppercase">
            Science &bull; Skill &bull; Service
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              href="/book"
              className="rounded-xl bg-slate-950 hover:bg-slate-800 px-6 py-3 text-xs sm:text-sm font-bold text-white shadow-2xs transition"
            >
              Explore Book
            </Link>
            <Link
              href="/mbbs-foundation/learn"
              className="rounded-xl border border-red-300 bg-red-50/60 hover:bg-red-100 text-red-900 px-5 py-3 text-xs sm:text-sm font-bold transition"
            >
              Explore Online Learning &rarr;
            </Link>
            <Link
              href="/about"
              className="rounded-xl border border-slate-300 hover:bg-slate-50 px-4 py-3 text-xs sm:text-sm font-medium text-slate-700 transition"
            >
              About Author
            </Link>
          </div>
        </div>

        <div className="flex justify-center mt-8 md:mt-0">
          <div className="w-56 sm:w-72 md:w-[340px] rounded-2xl overflow-hidden shadow-xl ring-1 ring-slate-200 bg-white">
            <img
              src="/book.png"
              alt="MBBS Foundation Book: Your First Book of Medicine"
              className="w-full h-full object-cover transition duration-300 hover:scale-105"
            />
          </div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* 4. THREE CURRICULUM PILLARS                                         */}
      {/* =================================================================== */}
      <section className="bg-slate-50/70 border-y border-slate-200/80 py-12 sm:py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
            <span className="text-xs font-black uppercase tracking-[0.2em] text-red-700 block mb-1">
              Holistic Framework
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950">
              Three Pillars of Foundational Medicine
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {[
              {
                title: "Foundations of Understanding Medicine",
                desc: "Understanding the science, systems, and clinical structure of medicine, while developing professional identity, ethics, and academic resilience.",
                tag: "Science",
              },
              {
                title: "Foundations of Living Medicine",
                desc: "Training hands and mind in CPR, emergency response, and first aid—turning theoretical knowledge into life-saving action when seconds matter.",
                tag: "Skill",
              },
              {
                title: "The Hidden Curriculum",
                desc: "Navigating the unwritten expectations, clinical etiquette, patient empathy, and communication skills required to thrive as a physician.",
                tag: "Service",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs transition hover:shadow-md hover:-translate-y-0.5"
              >
                <span className="inline-block rounded-full bg-slate-100 text-slate-700 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider mb-2.5">
                  {item.tag}
                </span>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Compact Stats */}
          <div className="mt-10 pt-8 border-t border-slate-200/80 grid gap-5 grid-cols-1 sm:grid-cols-3 text-center">
            <div>
              <h3 className="text-2xl sm:text-3xl font-black text-red-700">100+ Chapters</h3>
              <p className="mt-1 text-xs sm:text-sm text-slate-600">Covering complete MBBS foundation</p>
            </div>
            <div>
              <h3 className="text-2xl sm:text-3xl font-black text-red-700">Student-First</h3>
              <p className="mt-1 text-xs sm:text-sm text-slate-600">Designed specifically for Indian MBBS education</p>
            </div>
            <div>
              <h3 className="text-2xl sm:text-3xl font-black text-red-700">Skills + Mindset</h3>
              <p className="mt-1 text-xs sm:text-sm text-slate-600">Beyond textbooks: CPR, ethics, communication</p>
            </div>
          </div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* 5. FEATURED BOOK SECTION                                            */}
      {/* =================================================================== */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12 sm:py-14">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-center border border-slate-200/90 rounded-3xl p-6 sm:p-10 shadow-2xs bg-white">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-red-700 font-bold">
              Featured Handbook
            </p>

            <h2 className="mt-2 text-2xl sm:text-3xl font-black text-slate-950">
              MBBS Foundation: Your First Book of Medicine
            </h2>

            <p className="mt-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
              A comprehensive handbook for first-year MBBS students covering curriculum transition, medical ethics, CPR, first aid, communication, and the hidden curriculum of medical practice.
            </p>

            {/* Clearly Separated Online Learning Link */}
            <div className="mt-5 p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-xs font-bold text-slate-700 block mb-1">
                Prefer structured digital modules?
              </span>
              <Link
                href="/mbbs-foundation/learn"
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-red-700 hover:text-red-800 transition"
              >
                <span>Explore Online Learning Programme</span>
                <span>&rarr;</span>
              </Link>
            </div>

            {/* Purchase Options */}
            <div className="mt-5 pt-4 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2.5">
                Order Hardcover / Paperback
              </span>
              <div className="flex flex-wrap gap-2.5">
                <a
                  href="https://www.amazon.in/dp/B0GTZFSP17?&tag=notionpcom-21"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl bg-red-700 hover:bg-red-800 px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-2xs transition"
                >
                  Buy on Amazon
                </a>
                <a
                  href="https://notionpress.com/author/1356076"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl border border-slate-300 hover:bg-slate-50 px-4 py-2 text-xs sm:text-sm font-semibold text-slate-800 transition"
                >
                  Buy on Notion Press
                </a>
                <a
                  href="https://www.flipkart.com/mbbs-foundation/p/itm36fc9614bbf64?pid=9798903921355&affid=editornoti&affid=editornoti"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl border border-slate-300 hover:bg-slate-50 px-4 py-2 text-xs sm:text-sm font-semibold text-slate-800 transition"
                >
                  Buy on Flipkart
                </a>
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <img
              src="/book.png"
              alt="MBBS Foundation Handbook"
              className="w-52 sm:w-60 rounded-2xl shadow-lg ring-1 ring-slate-200"
            />
          </div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* 6. LEARN & EXPLORE                                                  */}
      {/* =================================================================== */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10 text-center">
        <div className="max-w-2xl mx-auto rounded-3xl border border-slate-200 bg-slate-50/70 p-6 sm:p-8 space-y-3.5">
          <p className="text-xs uppercase tracking-widest text-slate-500 font-bold">
            Learn &amp; Explore
          </p>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">
            Start Your Journey into Medicine
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
            Access structured interactive learning modules or read reflective articles on medical training and clinical skills.
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5">
            <Link
              href="/mbbs-foundation/learn"
              className="rounded-xl bg-slate-900 hover:bg-slate-800 px-5 py-2.5 text-xs sm:text-sm font-bold text-white transition shadow-2xs"
            >
              Online Learning Modules &rarr;
            </Link>
            <Link
              href="/blog"
              className="rounded-xl border border-slate-300 hover:bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 transition"
            >
              Visit Blog &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* 7. WHAT'S COMING NEXT                                               */}
      {/* =================================================================== */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12 sm:py-14">
        <div className="max-w-3xl mb-8">
          <p className="text-xs uppercase tracking-[0.2em] text-red-700 font-bold">
            What&apos;s Coming Next
          </p>
          <h2 className="mt-2 text-2xl sm:text-3xl font-black text-slate-950">
            A Complete Medical Learning Ecosystem
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
            MBBS Foundation is evolving beyond the book into an integrated academic platform offering practical modules, clinical skills, and educational guidance for medical students.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {/* Active Card: Online Learning Programme / REVIVE */}
          <div className="rounded-2xl border-2 border-teal-600 bg-teal-50/50 p-5 sm:p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-800">
                  Online Learning Programme
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-teal-100 text-teal-900 px-2.5 py-0.5 text-[11px] font-black uppercase">
                  ● REVIVE Available Now
                </span>
              </div>
              <h3 className="font-black text-base sm:text-lg text-slate-900 mt-1">
                REVIVE — CPR &amp; Choking Relief
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-700 leading-relaxed">
                Begin with REVIVE — a structured module covering CPR and relief of choking, with presentations, instructional videos, an online assessment and a verifiable completion certificate.
              </p>
            </div>
            <div className="mt-5 pt-3.5 border-t border-teal-200">
              <Link
                href="/mbbs-foundation/learn/modules/revive"
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-teal-800 hover:bg-teal-900 px-4 py-2.5 text-xs sm:text-sm font-bold text-white transition shadow-2xs"
              >
                <span>Explore REVIVE</span>
                <span>&rarr;</span>
              </Link>
            </div>
          </div>

          {/* Upcoming Card: First Aid & Skills */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Clinical Skills
                </span>
                <span className="inline-block rounded-full bg-slate-100 text-slate-600 px-2.5 py-0.5 text-[11px] font-bold uppercase">
                  Coming Soon
                </span>
              </div>
              <h3 className="font-bold text-base sm:text-lg text-slate-900 mt-1">First Aid &amp; Skills</h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                Essential life-saving emergency skills, patient triage, and practical clinical procedures designed for first-year medicos.
              </p>
            </div>
            <div className="mt-5 pt-3.5 border-t border-slate-100 text-xs text-slate-400 font-medium">
              Curriculum in active preparation
            </div>
          </div>

          {/* Upcoming Card: Mentorship & Guidance */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Transition Support
                </span>
                <span className="inline-block rounded-full bg-slate-100 text-slate-600 px-2.5 py-0.5 text-[11px] font-bold uppercase">
                  Coming Soon
                </span>
              </div>
              <h3 className="font-bold text-base sm:text-lg text-slate-900 mt-1">Mentorship &amp; Guidance</h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                Structured mentorship and academic guidance from senior clinical faculty to help students thrive in medical college.
              </p>
            </div>
            <div className="mt-5 pt-3.5 border-t border-slate-100 text-xs text-slate-400 font-medium">
              Curriculum in active preparation
            </div>
          </div>
        </div>

        {/* Community IAP Citizen CPR Certificate Link Preserved */}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div>
            <strong>Looking for the community awareness citizen certificate?</strong> Access the older IAP CPR Aware Citizen form for public awareness training.
          </div>
          <a
            href="https://docs.google.com/forms/d/e/1FAIpQLSeu6FIbHPzutVTxC-yhQ0hc09yniIgWRTuIYPYDkZMWx_aptA/viewform"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 font-semibold text-slate-800 hover:bg-slate-100 transition"
          >
            IAP Citizen Form &rarr;
          </a>
        </div>
      </section>

      {/* =================================================================== */}
      {/* 8. TESTIMONIALS / VOICES FROM STUDENTS & MENTORS                   */}
      {/* =================================================================== */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12 sm:py-14 border-t border-slate-200/80">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <p className="text-xs uppercase tracking-[0.2em] text-red-700 font-bold">
            Reader Reflections
          </p>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-950 mt-1">
            Voices from Students &amp; Mentors
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-600">
            Authentic reflections from medical students, faculty, and clinical mentors
          </p>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-2xs">
          <div className="review-track flex w-max gap-4 sm:gap-5">
            {reviews.map((review, index) => (
              <div
                key={index}
                className="w-[280px] sm:w-[320px] shrink-0 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 sm:p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-red-700">
                      {review.role}
                    </span>
                    <span className="text-amber-500 text-xs">★★★★★</span>
                  </div>
                  <p className="mt-3 text-xs sm:text-sm italic text-slate-700 leading-relaxed">
                    &ldquo;{review.text}&rdquo;
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200/60">
                  <p className="text-xs font-bold text-slate-900">&mdash; {review.name}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{review.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 text-center">
          <a
            href="https://forms.gle/SQhXxBX9oMDLg5a36"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-red-700 hover:bg-red-800 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-2xs transition"
          >
            <span>Submit Your Review</span>
            <span>&rarr;</span>
          </a>
          <p className="mt-2 text-[11px] text-slate-400">Takes less than 1 minute</p>
        </div>
      </section>

      {/* =================================================================== */}
      {/* 9. NATIONAL CONSULTATION & STUDENT VOICE                           */}
      {/* =================================================================== */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-7 sm:py-9">
        <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-6 sm:p-9 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="max-w-2xl space-y-1.5">
            <span className="text-xs font-black uppercase tracking-[0.2em] text-red-400">
              National Initiative
            </span>
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white">
              National Consultation &amp; Student Voice
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Medical education works best when the voices of both teachers and students are heard. Join the National Professional Consultation or Student Voice initiative and help us understand how students can begin MBBS better prepared.
            </p>
          </div>
          <div className="shrink-0 w-full md:w-auto">
            <Link
              href="/mbbs-foundation/consultation"
              className="w-full md:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-xs transition"
            >
              <span>Join the Consultation</span>
              <span>&rarr;</span>
            </Link>
          </div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* 10. NEET SECTION (Compact Guidance Section)                         */}
      {/* =================================================================== */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-7 sm:py-9">
        <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5 sm:p-7 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="max-w-2xl space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Medical School Transition
            </span>
            <h3 className="text-lg sm:text-xl font-black text-slate-900">
              Preparing for Medical College?
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              The transition from NEET preparation to medical education is a profound shift in mindset and responsibility. Explore our practical guides covering counselling, college selection, academic expectations, and transition readiness.
            </p>
          </div>
          <div className="shrink-0 w-full md:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Link
              href="/neet-to-mbbs"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 px-5 py-2.5 text-xs sm:text-sm font-bold text-white transition shadow-2xs"
            >
              <span>Explore NEET-to-MBBS Guide</span>
              <span>&rarr;</span>
            </Link>
          </div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* 11. START YOUR JOURNEY (Primary LMS Action)                         */}
      {/* =================================================================== */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-3 pb-14 sm:pb-16">
        <div className="rounded-3xl bg-slate-950 p-6 sm:p-10 text-white">
          <p className="text-xs uppercase tracking-[0.2em] text-red-400 font-bold">
            Start Your Journey
          </p>

          <h2 className="mt-2 text-2xl sm:text-3xl font-black">
            Your first step into medicine begins here.
          </h2>

          <p className="mt-2.5 max-w-2xl text-xs sm:text-sm text-slate-300 leading-relaxed">
            Whether you are a new MBBS student, a doctor, a parent, or an aspiring healthcare professional, MBBS Foundation is designed to guide, equip, and inspire your path in medicine.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-2.5 sm:gap-3.5">
            <Link
              href="/mbbs-foundation/learn"
              className="rounded-xl bg-white hover:bg-slate-100 px-5 py-3 text-xs sm:text-sm font-bold text-slate-950 transition shadow-xs"
            >
              Explore Online Learning &rarr;
            </Link>

            <Link
              href="/book"
              className="rounded-xl border border-slate-600 hover:bg-white/10 px-5 py-3 text-xs sm:text-sm font-semibold text-white transition"
            >
              Explore the Book
            </Link>

            <a
              href="https://www.amazon.in/dp/B0GTZFSP17?&tag=notionpcom-21"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-slate-700 hover:bg-white/5 px-4 py-3 text-xs sm:text-sm text-slate-300 transition"
            >
              Buy on Amazon
            </a>
            <a
              href="https://notionpress.com/in/read/mbbs-foundation"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-slate-700 hover:bg-white/5 px-4 py-3 text-xs sm:text-sm text-slate-300 transition"
            >
              Buy on Notion Press
            </a>
            <a
              href="https://www.flipkart.com/mbbs-foundation/p/itm36fc9614bbf64?pid=9798903921355&affid=editornoti&affid=editornoti"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-slate-700 hover:bg-white/5 px-4 py-3 text-xs sm:text-sm text-slate-300 transition"
            >
              Buy on Flipkart
            </a>
          </div>
        </div>

        {/* Floating WhatsApp chat widget */}
        <a
          href="https://wa.me/918340793824"
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 rounded-full bg-green-500 hover:bg-green-600 px-4 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-white shadow-2xl transition flex items-center gap-2"
          aria-label="Chat on WhatsApp"
        >
          <span>💬</span>
          <span>Chat on WhatsApp</span>
        </a>
      </section>
    </main>
  );
}
