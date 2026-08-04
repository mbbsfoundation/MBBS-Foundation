export default function Home() {
  return (
    <main className="min-h-screen bg-white text-slate-900">

      {/* HEADER */}
            {/* HERO */}
            {/* ================= CPR SANJEEVANI ================= */}

<section className="border-y border-sky-200 bg-gradient-to-r from-sky-50 via-blue-50 to-cyan-50 py-10">
  <div className="mx-auto max-w-6xl px-6">

    <div className="max-w-3xl">

      <p className="text-sm font-bold uppercase tracking-[0.25em] text-red-700">
        🇮🇳 National Public Health Initiative
      </p>

      <h2 className="mt-3 text-3xl font-extrabold text-slate-900 md:text-4xl">
        CPR Sanjeevani
      </h2>

      <p className="mt-4 text-lg leading-8 text-slate-700">
        A nationwide initiative by the Indian Academy of Pediatrics to empower citizens with lifesaving CPR skills. Learn CPR, find training venues, and access individual completion certificates through the official CPR portal.
      </p>

      <div className="mt-6 flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">

        <a
          href="/cprday"
          className="w-full sm:w-auto rounded-xl bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 px-6 sm:px-7 py-3.5 font-bold text-white shadow-lg transition hover:from-sky-700 hover:to-purple-700 flex items-center justify-center gap-2 text-center"
        >
          ❤️ CPR Sanjeevani Portal →
        </a>

        <a
          href="https://www.facebook.com/share/g/1DF14f2Npr/"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full sm:w-auto rounded-xl border border-blue-600 bg-blue-50 px-6 py-3.5 font-semibold text-blue-700 transition hover:bg-blue-100 flex items-center justify-center gap-2 text-center"
        >
          Join CPR Sanjeevani Facebook Group →
        </a>

      </div>

    </div>

  </div>
</section>

{/* ================= END CPR SANJEEVANI ================= */}
      <section className="mx-auto max-w-6xl px-6 py-20 md:grid md:grid-cols-2 md:gap-12">

        <div>
          <h1 className="text-4xl font-bold md:text-5xl">
            Build the doctor within
          </h1>
          <p className="mt-4 text-xl font-medium text-red-700">
  A complete guide for MBBS students in India
</p>

          <p className="mt-6 text-lg text-slate-600">
            MBBS Foundation is more than a book. It is a practical and evidence-based guide for first-year MBBS students. It helps you transition from school to medical college while building essential skills in 
            CPR, first aid, communication, ethics, and real-world clinical thinking. Designed for Indian medical students, young doctors and other healthcare providers, it goes beyond textbooks to prepare you for the reality of becoming a doctor. 
            As you step into medical college from school, this book invites you to pause and learn at this threshold. It is a crossing-over: into responsibility, into compassion and into the lifelong identity of being a doctor. 
            It aligns with the competency-based curriculum, yet it offers far more than a list can capture. 
Step mindfully, and what lies beyond will shape not only your studies, but your life.
Forever!

          </p>

          <div className="mt-8 flex gap-4">
            <a href="/book" className="rounded-xl bg-black px-6 py-3 text-white">
              Explore Book
            </a>
            <a href="/about" className="rounded-xl border px-6 py-3">
              Learn More
            </a>
          </div>
        </div>

        <div className="flex justify-center mt-10 md:mt-0">
  <div className="w-80 md:w-[420px] rounded-2xl overflow-hidden shadow-2xl ring-1 ring-slate-200 bg-white">
    <img
      src="/book.png"
      alt="MBBS Foundation Book"
      className="w-full h-full object-cover transition duration-300 hover:scale-105"
    />
  </div>
</div>


      </section>
      
      <section className="w-full bg-gradient-to-r from-blue-50 to-slate-50 py-16 mt-16">
  <div className="mx-auto max-w-6xl px-6 text-center">

    <p className="text-lg md:text-xl font-semibold text-blue-700 uppercase tracking-[0.3em]">
      NEET 2026 Special
    </p>

    <h2 className="mt-4 text-3xl md:text-4xl font-bold text-slate-900">
      Just appeared for NEET?
    </h2>

    <p className="mt-4 text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
      The journey doesn’t end here—it begins. MBBS Foundation helps you take your first confident step into medical college with clarity, skills, and real-world understanding.
    </p>

    <p className="mt-4 text-base font-medium text-red-700">
      🎓 Founder’s Circle Access available for early learners
    </p>
    <p className="mt-3 text-sm text-slate-500">
  Trusted by early MBBS learners across India
</p>

    {/* Premium Choice Cards (Clickable) */}
<div className="mt-8 grid gap-4 md:grid-cols-2 max-w-3xl mx-auto">

  {/* STUDENT */}
  <a
    href="neet"
    target="_blank"
    rel="noopener noreferrer"
    className="group rounded-xl border p-5 bg-white transition hover:shadow-xl hover:-translate-y-1"
  >
    <p className="font-semibold text-lg text-slate-900 group-hover:text-blue-700">
      I am a NEET student
    </p>
    <p className="text-sm text-slate-500 mt-1">
      Start MBBS with clarity and confidence
    </p>
  </a>

  {/* PARENT */}
  <a
    href="neet"
    target="_blank"
    rel="noopener noreferrer"
    className="group rounded-xl border p-5 bg-white transition hover:shadow-xl hover:-translate-y-1"
  >
    <p className="font-semibold text-lg text-slate-900 group-hover:text-blue-700">
      I am a parent / mentor
    </p>
    <p className="text-sm text-slate-500 mt-1">
      Guide your child’s medical journey
    </p>
  </a>

</div>

{/* CTA */}
<div className="mt-10">
  <a
    href="neet"
    target="_blank"
    rel="noopener noreferrer"
    className="inline-block rounded-xl bg-black px-8 py-4 text-lg text-white transition hover:bg-slate-800 hover:scale-105"
  >
    Start Your MBBS Journey →
  </a>
</div>

  </div>
</section>

      {/* FEATURES */}
      <section className="mx-auto max-w-6xl px-6 py-16 grid gap-6 md:grid-cols-3">
  {[
    {
      title: "Foundations of Understanding Medicine",
      desc: "Understanding the science, systems, and structure of medicine, while developing professional identity and ethical foundation.",
    },
    {
      title: "Foundations of Living Medicine",
      desc: "Trains your hands and heart in CPR and first aid—so you can turn knowledge into action and take the first life-saving steps when every second matters.",
    },
    {
      title: "Hidden Curriculum",
      desc: "Transition from school to MBBS - The unwritten lessons and soft skills needed to survive and thrive in medicine—shaping real doctors beyond textbooks.",
    },
  ].map((item, i) => (
    <div
      key={i}
      className="rounded-2xl border p-6 shadow-sm transition hover:shadow-lg hover:-translate-y-1"
    >
      <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
      <p className="text-gray-600 leading-relaxed">{item.desc}</p>
    </div>
  ))}
</section>

    <section className="mx-auto max-w-6xl px-6 py-16">

  <div className="grid md:grid-cols-2 gap-10 items-center border rounded-2xl p-8 shadow-sm">

    <div>
      <p className="text-sm uppercase tracking-[0.2em] text-red-700 font-semibold">
        Featured Book
      </p>

      <h2 className="mt-3 text-3xl font-semibold">
        MBBS Foundation: Your First Book of Medicine
      </h2>

      <p className="mt-4 text-slate-600">
        A modern guide for MBBS students covering transition, ethics, CPR,
        first aid, communication, and the hidden curriculum of medicine.
      </p>

      <div className="mt-6 flex flex-wrap gap-4">
        <a
          href="https://www.amazon.in/dp/B0GTZFSP17?&tag=notionpcom-21"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl bg-red-700 px-6 py-3 text-white"
        >
          Buy on Amazon
        </a>

        <a
          href="https://notionpress.com/author/1356076"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl border px-6 py-3"
        >
          Buy on Notion Press
        </a>
        <a
          href="https://www.flipkart.com/mbbs-foundation/p/itm36fc9614bbf64?pid=9798903921355&affid=editornoti&affid=editornoti"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl border px-6 py-3"
        >
          Buy on Flipkart
        </a>
      </div>

      <p className="mt-3 text-sm text-slate-500">
        Direct purchase from MBBS Foundation coming soon.
      </p>
    </div>

    <div className="flex justify-center">
      <img src="/book.png" className="w-72 rounded-xl shadow-lg" />
    </div>

  </div>

</section>
<section className="mx-auto max-w-6xl px-6 py-16">
  <div className="grid gap-8 md:grid-cols-3 text-center">

    <div>
      <h3 className="text-3xl font-semibold text-red-700">100+</h3>
      <p className="mt-2 text-slate-600">Chapters covering complete MBBS foundation</p>
    </div>

    <div>
      <h3 className="text-3xl font-semibold text-red-700">Student-first</h3>
      <p className="mt-2 text-slate-600">Designed specifically for Indian MBBS journey</p>
    </div>

    <div>
      <h3 className="text-3xl font-semibold text-red-700">Skills + Mindset</h3>
      <p className="mt-2 text-slate-600">Beyond textbooks: CPR, communication, survival</p>
    </div>

  </div>
</section>
<section className="mx-auto max-w-6xl px-6 py-16">

  <div className="max-w-3xl">
    <p className="text-sm uppercase tracking-[0.2em] text-red-700 font-semibold">
      Why MBBS Foundation
    </p>

    <h2 className="mt-3 text-3xl font-semibold">
      Medicine is more than knowledge. It is a way of life.
    </h2>

    <p className="mt-6 text-lg text-slate-600 leading-8">
      Medical education has traditionally focused on knowledge and clinical skills.
      But the journey from school to medical college is much deeper.
      It is a transformation — intellectual, emotional, and professional.
    </p>

    <p className="mt-4 text-slate-600 leading-8">
      MBBS Foundation is designed to bridge this gap. It helps students not only
      learn medicine, but understand it, live it, and grow within it.
    </p>
  </div>

  <div className="mt-12 grid gap-6 md:grid-cols-3">

    <div className="border rounded-xl p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
      <h3 className="font-semibold text-xl">Science</h3>
      <p className="mt-2 text-slate-600">
        Strong academic foundation aligned with modern medical curriculum.
      </p>
    </div>

    <div className="border rounded-xl p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
      <h3 className="font-semibold text-xl">Skill</h3>
      <p className="mt-2 text-slate-600">
        CPR, first aid, communication, and real-world clinical readiness.
      </p>
    </div>

    <div className="border rounded-xl p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
      <h3 className="font-semibold text-xl">Service</h3>
      <p className="mt-2 text-slate-600">
        Compassion, empathy, and the deeper purpose of being a doctor.
      </p>
    </div>

  </div>
  <div className="mt-16 text-center">
  <p className="text-sm uppercase text-slate-500">
    Learn & Explore
  </p>

  <h2 className="text-2xl font-semibold mt-2">
    Start your journey into medicine
  </h2>

  <a
    href="/blog"
    className="mt-4 inline-block rounded-xl border px-6 py-3 hover:bg-slate-50"
  >
    Visit Blog →
  </a>
</div>

</section>
<section className="mx-auto max-w-6xl px-6 py-16">
  <h2 className="text-center text-3xl font-semibold">
    Voices from Students & Mentors
  </h2>

  <p className="mt-4 text-center text-slate-600">
    Reflections from readers, students, parents, and mentors
  </p>

  {(() => {
    const reviews = [
      {
        role: "Student",
        text: "This is the book I wish I had on my first day of MBBS. It doesn’t just teach medicine—it prepares you for the journey.",
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
        detail:
          "Director Professor, Orthopaedics, Safdarjung Hospital & VMMC, New Delhi",
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
        detail:
          "Lecturer and mentor for school children and college students, Karauli",
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
        detail:
          "Senior Urologist & Renal Transplant Surgeon, Suvira Hospital Jaipur",
      },
      {
        role: "Mentor",
        text: "Excellent book to read for new medical students starting their medical journey. Based on author's vast clinical experience.",
        name: "Dr Sunil Kumar Garg",
        detail:
          "Senior Consultant ENT and Skull Base Surgeon, Apex Hospital Malviya Nagar, Jaipur",
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
        name: "Dr janarthanan Alwarsamy",
        detail: "MD pediatrics, Chennai",
      },
    ];

    return (
      <div className="mt-10 overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="review-track flex w-max gap-6">
          {[...reviews, ...reviews].map((review, index) => (
            <div
              key={index}
              className="w-[320px] shrink-0 rounded-2xl border border-slate-100 bg-slate-50 p-6"
            >
              <p className="text-sm font-semibold uppercase tracking-wide text-red-700">
                {review.role}
              </p>

              <p className="mt-3 text-yellow-500">★★★★★</p>

              <p className="mt-3 italic text-slate-700">
                “{review.text}”
              </p>

              <p className="mt-4 font-semibold text-slate-900">
                — {review.name}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                {review.detail}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  })()}

  <div className="mt-12 text-center">
    <p className="text-sm uppercase tracking-[0.2em] text-red-700 font-semibold">
      Share Your Experience
    </p>

    <h3 className="mt-3 text-2xl font-semibold">
      Have you read MBBS Foundation: Your First Book of Medicine?
    </h3>

    <p className="mt-3 text-slate-600">
      Your feedback helps guide future medical students.
    </p>

    <div className="mt-6">
      <a
        href="https://forms.gle/SQhXxBX9oMDLg5a36"
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-xl bg-red-700 px-8 py-3 text-white text-lg transition hover:bg-red-800"
      >
        Submit Your Review
      </a>
    </div>

    <p className="mt-4 text-sm text-slate-500">
      Takes less than 1 minute
    </p>
  </div>
</section>
<section className="mx-auto max-w-6xl px-6 py-16">

  <div className="max-w-3xl">
    <p className="text-sm uppercase tracking-[0.2em] text-red-700 font-semibold">
      What’s Coming Next
    </p>

    <h2 className="mt-3 text-3xl font-semibold">
      A complete medical learning ecosystem
    </h2>

    <p className="mt-6 text-lg text-slate-600 leading-8">
      MBBS Foundation is evolving into a platform that goes beyond books — 
      bringing practical training, real-world skills, and mentorship to 
      medical students and young doctors.
    </p>
  </div>

  <div className="mt-12 grid gap-6 md:grid-cols-3">

    <div className="border rounded-xl p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div className="border border-red-200 rounded-xl p-6 bg-red-50 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">

  <h3 className="font-semibold text-xl text-red-700">
    CPR Training
  </h3>

  <p className="mt-2 text-slate-700">
    Structured online IAP CPR awareness and training module
  </p>

  <p className="mt-3 text-sm font-medium text-green-600">
    ● Available
  </p>

  <a
    href="https://docs.google.com/forms/d/e/1FAIpQLSeu6FIbHPzutVTxC-yhQ0hc09yniIgWRTuIYPYDkZMWx_aptA/viewform"
    target="_blank"
    rel="noopener noreferrer"
    className="mt-4 inline-block rounded-xl bg-black px-5 py-2 text-white transition hover:bg-slate-800"
  >
    Complete the module and recieve your IAP CPR Aware Citizen Certificate Now
  </a>

</div>
    </div>

    <div className="border rounded-xl p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
      <h3 className="font-semibold text-xl">First Aid & Skills</h3>
      <p className="mt-2 text-slate-600">
        Essential life-saving skills and practical medical training modules.
      </p>
      <p className="mt-3 text-sm text-slate-500">Coming Soon</p>
    </div>

    <div className="border rounded-xl p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
      <h3 className="font-semibold text-xl">Mentorship & Guidance</h3>
      <p className="mt-2 text-slate-600">
        Guidance from experienced doctors to help students navigate their journey.
      </p>
      <p className="mt-3 text-sm text-slate-500">Coming Soon</p>
    </div>

  </div>

</section>
<section className="mx-auto max-w-6xl px-6 pb-20 pt-10">

  <div className="rounded-3xl bg-slate-950 p-10 text-white md:p-14">

    <p className="text-sm uppercase tracking-[0.2em] text-red-400 font-semibold">
      Start Your Journey
    </p>

    <h2 className="mt-3 text-3xl font-semibold md:text-4xl">
      Your first step into medicine begins here.
    </h2>

    <p className="mt-5 max-w-2xl text-slate-300 leading-8">
      Whether you are a new MBBS student, a parent, or an aspiring doctor,
      MBBS Foundation is designed to guide, support, and inspire your journey.
    </p>

    <div className="mt-8 flex flex-wrap gap-4">

      <a
        href="/book"
        className="rounded-xl bg-white px-6 py-3 text-slate-950 font-medium"
      >
        Explore the Book
      </a>

      <a
        href="https://www.amazon.in/dp/B0GTZFSP17?&tag=notionpcom-21"
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-xl border border-slate-500 px-6 py-3"
      >
        Buy on Amazon
      </a>
      <a
        href="https://notionpress.com/in/read/mbbs-foundation"
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-xl border border-slate-500 px-6 py-3"
      >
        Buy on Notion Press
      </a>
      <a
        href="https://www.flipkart.com/mbbs-foundation/p/itm36fc9614bbf64?pid=9798903921355&affid=editornoti&affid=editornoti"
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-xl border border-slate-500 px-6 py-3"
      >
        Buy on Flipkart
      </a>
      <a
  href="https://wa.me/918340793824"
  target="_blank"
  className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 rounded-full bg-green-500 px-4 sm:px-5 py-2.5 sm:py-3 text-sm sm:text-base font-semibold text-white shadow-2xl transition hover:bg-green-600"
>
  Chat on WhatsApp
</a>

    </div>

  </div>

</section>
</main>
  );
}