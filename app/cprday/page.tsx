import Link from "next/link";
import Countdown from "../../components/cprday/Countdown";

const participationGroups = [
  {
    icon: "🏥",
    title: "Hospitals and Medical Colleges",
    description:
      "Government and private hospitals, medical colleges, nursing colleges and other healthcare institutions.",
    style: "border-red-100 bg-red-50",
  },
  {
    icon: "🏫",
    title: "Schools and Educational Institutions",
    description:
      "Schools, colleges and universities may host age-appropriate CPR awareness and hands-on sessions.",
    style: "border-sky-100 bg-sky-50",
  },
  {
    icon: "👮",
    title: "Police and Security Services",
    description:
      "Police personnel, security teams, emergency responders and other uniformed services.",
    style: "border-indigo-100 bg-indigo-50",
  },
  {
    icon: "🪖",
    title: "Armed Forces and Public Services",
    description:
      "Armed forces, government organisations, transport services and civic agencies.",
    style: "border-orange-100 bg-orange-50",
  },
  {
    icon: "🏢",
    title: "Workplaces and Industries",
    description:
      "Companies, factories, offices, professional groups and organised workplaces.",
    style: "border-emerald-100 bg-emerald-50",
  },
  {
    icon: "🤝",
    title: "Community Organisations",
    description:
      "IAP branches, NGOs, residential societies, clubs, media organisations and community groups.",
    style: "border-cyan-100 bg-cyan-50",
  },
];

const eventPathway = [
  {
    number: "1",
    title: "Register the Course",
    description:
      "Register the proposed CPR course through the official IAP ALS–BLS platform and retain the course code when received.",
    style: "border-sky-200 bg-sky-600",
  },
  {
    number: "2",
    title: "Confirm Venue and Courses",
    description:
      "Enter the venue, available resources and one or more courses planned at that venue.",
    style: "border-cyan-200 bg-cyan-600",
  },
  {
    number: "3",
    title: "Create Publicity Material",
    description:
      "Generate uniform venue banners, course posters, invitations, badges and participant-registration QR codes.",
    style: "border-indigo-200 bg-indigo-600",
  },
  {
    number: "4",
    title: "Conduct the Training",
    description:
      "Provide standardised demonstration followed by supervised hands-on CPR practice for registered participants.",
    style: "border-orange-200 bg-orange-500",
  },
  {
    number: "5",
    title: "Confirm and Report",
    description:
      "Confirm participation, generate certificates and submit the final course and venue report.",
    style: "border-emerald-200 bg-emerald-600",
  },
];

export default function CPRDayPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      {/* Campaign hero */}

      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-red-950 to-slate-950" />

        <div className="absolute -left-32 top-20 h-80 w-80 rounded-full bg-red-600/20 blur-3xl" />

        <div className="absolute -right-32 bottom-10 h-80 w-80 rounded-full bg-sky-600/15 blur-3xl" />

        <div className="relative mx-auto flex min-h-[88vh] max-w-7xl flex-col items-center justify-center px-6 py-20 text-center lg:px-8">
          <p className="rounded-full border border-red-400/40 bg-red-500/10 px-5 py-2 text-sm font-semibold uppercase tracking-[0.22em] text-red-200">
            Indian Academy of Pediatrics
          </p>

          <h1 className="mt-8 max-w-6xl text-5xl font-black uppercase leading-[1.05] tracking-tight sm:text-6xl md:text-7xl lg:text-8xl">
            National IAP
            <span className="block text-red-500">CPR Day 2026</span>
          </h1>

          <div className="mt-8 inline-flex items-center rounded-2xl border border-white/20 bg-white/10 px-7 py-4 shadow-2xl backdrop-blur">
            <span className="text-xl font-extrabold tracking-wide sm:text-2xl">
              21 July 2026
            </span>
          </div>

          <h2 className="mt-9 text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
            Every Citizen Can Save a Life
          </h2>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300 sm:text-xl">
            Join a nationwide public health movement to build a CPR-aware and
            CPR-ready India through standardised demonstration and supervised
            hands-on CPR training.
          </p>

          <Countdown />

          <div className="mt-10 flex w-full flex-col justify-center gap-4 sm:w-auto sm:flex-row">
            <Link
              href="/cprday/register"
              className="rounded-xl bg-red-600 px-8 py-4 text-base font-bold text-white shadow-lg transition hover:bg-red-500 focus:outline-none focus:ring-4 focus:ring-red-500/40"
            >
              Confirm Your Venue and Courses
            </Link>

            <a
              href="#how-it-works"
              className="rounded-xl border border-white/30 bg-white/10 px-8 py-4 text-base font-bold text-white backdrop-blur transition hover:bg-white/20 focus:outline-none focus:ring-4 focus:ring-white/20"
            >
              See How It Works
            </a>
          </div>

          {/* Campaign status strip */}

          <div className="mt-12 w-full max-w-6xl overflow-hidden rounded-2xl border border-sky-300/40 bg-gradient-to-r from-sky-200 via-cyan-100 to-sky-200 shadow-2xl">
            <div className="flex flex-wrap items-center justify-center gap-4 px-6 py-5 text-sm font-semibold text-slate-900 md:gap-5 md:px-8 md:text-base">
              <span className="flex items-center gap-2">
                📅
                <span className="font-black text-sky-900">
                  21 July 2026
                </span>
              </span>

              <span className="hidden text-sky-700/50 md:block">|</span>

              <span className="flex items-center gap-2">
                🇮🇳
                <span className="font-black text-sky-900">542</span>
                Events Registered
              </span>

              <span className="hidden text-sky-700/50 md:block">|</span>

              <span className="flex items-center gap-2">
                👨‍⚕️
                <span className="font-black text-sky-900">18,450</span>
                Citizens to be Trained
              </span>

              <span className="hidden text-sky-700/50 lg:block">|</span>

              <span className="hidden items-center gap-2 lg:flex">
                🏥
                <span className="font-black text-sky-900">187</span>
                Institutions Participating
              </span>
            </div>
          </div>

          <div className="mt-16 grid w-full max-w-5xl gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <p className="text-3xl font-black text-red-400">Pan-India</p>

              <p className="mt-2 text-sm leading-6 text-slate-300">
                Institutions and communities participating across India
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <p className="text-3xl font-black text-red-400">Hands-on</p>

              <p className="mt-2 text-sm leading-6 text-slate-300">
                Supervised CPR practice using training manikins
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <p className="text-3xl font-black text-red-400">Free</p>

              <p className="mt-2 text-sm leading-6 text-slate-300">
                Public CPR awareness and training initiative
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About the campaign */}

      <section className="bg-white px-6 py-20 text-slate-900">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-red-700">
              About the Campaign
            </p>

            <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl md:text-5xl">
              National IAP CPR Day 2026
            </h2>

            <p className="mt-6 text-lg leading-8 text-slate-600">
              National IAP CPR Day is a nationwide public health initiative of
              the Indian Academy of Pediatrics to improve awareness of cardiac
              arrest and promote hands-on cardiopulmonary resuscitation
              training among citizens.
            </p>

            <p className="mt-5 text-lg leading-8 text-slate-600">
              On <strong>21 July 2026</strong>, IAP ALS and BLS Instructors,
              CPR Champions, healthcare professionals, institutions, IAP
              branches, schools and community organisations across India will
              conduct standardised CPR awareness and practical training
              sessions.
            </p>

            <p className="mt-5 text-lg leading-8 text-slate-600">
              The campaign aims to help ordinary citizens recognise an
              emergency, activate help and begin effective chest compressions
              until professional care becomes available.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/cprday/register"
                className="rounded-xl bg-red-700 px-7 py-4 text-center font-bold text-white shadow-lg transition hover:bg-red-600 focus:outline-none focus:ring-4 focus:ring-red-200"
              >
                Confirm Your Event
              </Link>

              <a
                href="#how-it-works"
                className="rounded-xl border border-slate-300 bg-white px-7 py-4 text-center font-bold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-200"
              >
                How It Works
              </a>
            </div>
          </div>

          <div className="rounded-3xl border border-sky-200 bg-gradient-to-br from-sky-50 via-white to-cyan-50 p-7 shadow-xl sm:p-9">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-sky-700">
              Standard Training Model
            </p>

            <div className="mt-7 space-y-6">
              <CampaignFeature
                number="1"
                numberStyle="bg-red-100 text-red-700"
                title="Instructor-led course"
                description="A qualified IAP ALS or BLS Instructor leads the training team."
              />

              <CampaignFeature
                number="2"
                numberStyle="bg-orange-100 text-orange-700"
                title="Demonstration and practice"
                description="Participants receive a standardised demonstration followed by supervised hands-on CPR practice."
              />

              <CampaignFeature
                number="3"
                numberStyle="bg-sky-100 text-sky-700"
                title="Up to 100 participants"
                description="One course is planned for approximately 100 participants with adequate team support and practice stations."
              />

              <CampaignFeature
                number="4"
                numberStyle="bg-emerald-100 text-emerald-700"
                title="Minimum two manikins"
                description="At least two CPR manikins and a combined team of instructors and CPR Champions are recommended."
              />
            </div>

            <div className="mt-8 rounded-2xl border border-sky-200 bg-white/80 p-5">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-sky-700">
                Campaign Date
              </p>

              <p className="mt-2 text-2xl font-black text-slate-900">
                21 July 2026
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}

      <section
        id="how-it-works"
        className="scroll-mt-24 bg-slate-50 px-6 py-20 text-slate-900"
      >
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-sky-700">
              Event Pathway
            </p>

            <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl md:text-5xl">
              From Course Registration to Final Report
            </h2>

            <p className="mt-5 text-lg leading-8 text-slate-600">
              The CPR Day platform complements the official course
              registration process and supports event publicity, participant
              management, certificates and reporting.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-5">
            {eventPathway.map((step) => (
              <div
                key={step.number}
                className={`rounded-2xl border bg-white p-6 shadow-sm ${
                  step.style.split(" ")[0]
                }`}
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl text-xl font-black text-white ${
                    step.style.split(" ")[1]
                  }`}
                >
                  {step.number}
                </div>

                <h3 className="mt-5 text-xl font-bold">{step.title}</h3>

                <p className="mt-3 leading-7 text-slate-600">
                  {step.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/cprday/register"
              className="inline-flex rounded-xl bg-sky-700 px-8 py-4 font-bold text-white shadow-lg transition hover:bg-sky-600 focus:outline-none focus:ring-4 focus:ring-sky-200"
            >
              Confirm Venue and Courses
            </Link>
          </div>
        </div>
      </section>

      {/* Who can participate */}

      <section className="bg-white px-6 py-20 text-slate-900">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-red-700">
              Nationwide Participation
            </p>

            <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl md:text-5xl">
              Who Can Host a CPR Day Event?
            </h2>

            <p className="mt-5 text-lg leading-8 text-slate-600">
              CPR Day courses may be conducted in healthcare, educational,
              workplace and community settings with an appropriate venue,
              trained team and adequate CPR manikins.
            </p>
          </div>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {participationGroups.map((group) => (
              <div
                key={group.title}
                className={`rounded-2xl border p-6 shadow-sm ${group.style}`}
              >
                <p className="text-3xl" aria-hidden="true">
                  {group.icon}
                </p>

                <h3 className="mt-4 text-xl font-bold">{group.title}</h3>

                <p className="mt-3 leading-7 text-slate-600">
                  {group.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-12 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center sm:p-8">
            <h3 className="text-2xl font-bold text-slate-900">
              Typical course planning requirement
            </h3>

            <p className="mx-auto mt-4 max-w-3xl text-lg leading-8 text-slate-600">
              One course may include up to approximately 100 participants with
              at least two CPR manikins and a combined team of three to five
              instructors and CPR Champions. Multiple courses may be planned at
              the same venue.
            </p>

            <Link
              href="/cprday/register"
              className="mt-7 inline-flex rounded-xl bg-red-700 px-8 py-4 font-bold text-white shadow-lg transition hover:bg-red-600 focus:outline-none focus:ring-4 focus:ring-red-200"
            >
              Confirm an Event
            </Link>
          </div>
        </div>
      </section>

      {/* Registration gateway */}

      <section
        id="register-event"
        className="scroll-mt-24 bg-gradient-to-br from-sky-50 via-white to-cyan-50 px-6 py-20 text-slate-900"
      >
        <div className="mx-auto max-w-6xl">
          <div className="grid overflow-hidden rounded-3xl border border-sky-200 bg-white shadow-2xl lg:grid-cols-[1.1fr_0.9fr]">
            <div className="p-8 sm:p-10 lg:p-12">
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-sky-700">
                Event Coordinators
              </p>

              <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl md:text-5xl">
                Confirm Your CPR Day Venue and Courses
              </h2>

              <p className="mt-6 text-lg leading-8 text-slate-600">
                The official course remains registered through{" "}
                <strong>iapalsbls.com</strong>. Use this platform to confirm the
                venue, teams, participant groups, available manikins and one or
                more CPR courses being conducted at the venue.
              </p>

              <div className="mt-8 space-y-4">
                <GatewayItem text="Enter common venue and host-institution information." />

                <GatewayItem text="Add one or more courses with separate timings and participant groups." />

                <GatewayItem text="Record the course coordinator, lead instructor, other instructors and CPR Champions." />

                <GatewayItem text="Prepare for banner, badge, QR-code and participant-registration generation." />
              </div>
            </div>

            <div className="flex flex-col justify-center bg-slate-950 p-8 text-white sm:p-10 lg:p-12">
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-sky-300">
                CPR Day Portal
              </p>

              <h3 className="mt-4 text-3xl font-black tracking-tight">
                Create Your Operational Event Record
              </h3>

              <p className="mt-5 leading-7 text-slate-300">
                One venue may contain one or several courses. Each course can
                have its own coordinator, instructor team, participants and
                official course code.
              </p>

              <div className="mt-8 flex flex-col gap-4">
                <Link
                  href="/cprday/register"
                  className="rounded-xl bg-sky-500 px-7 py-4 text-center font-bold text-slate-950 shadow-lg transition hover:bg-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-300/40"
                >
                  Confirm Venue and Courses
                </Link>

                <Link
                  href="/cprday/login"
                  className="rounded-xl border border-white/30 bg-white/10 px-7 py-4 text-center font-bold text-white transition hover:bg-white/20 focus:outline-none focus:ring-4 focus:ring-white/20"
                >
                  Coordinator Login
                </Link>
              </div>

              <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-sm font-bold text-sky-300">
                  Keep these details ready
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Official course code, venue PIN code, IAP Branch name where
                  involved, manikin availability and the names, mobile numbers
                  and email addresses of all course-team members.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Future platform functions */}

      <section className="bg-slate-950 px-6 py-20 text-white">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-sky-300">
              After Event Confirmation
            </p>

            <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl md:text-5xl">
              One Dashboard for the Complete CPR Day Workflow
            </h2>

            <p className="mt-5 text-lg leading-8 text-slate-300">
              After confirming the venue and courses, coordinators will manage
              publicity material, participant registration, badges,
              certificates and reporting from one dashboard.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <FutureAction
              title="Banners and Posters"
              description="Generate uniform venue banners, course posters, invitations and QR codes."
            />

            <FutureAction
              title="Team Badges"
              description="Generate badges for coordinators, instructors and CPR Champions before the course."
            />

            <FutureAction
              title="Participant Management"
              description="Register participants individually, through QR codes, assisted entry or bulk upload."
            />

            <FutureAction
              title="Certificates and Reports"
              description="Confirm participation, generate certificates and submit course-wise and venue-level reports."
            />
          </div>
        </div>
      </section>
    </main>
  );
}

type CampaignFeatureProps = {
  number: string;
  numberStyle: string;
  title: string;
  description: string;
};

function CampaignFeature({
  number,
  numberStyle,
  title,
  description,
}: CampaignFeatureProps) {
  return (
    <div className="flex gap-4">
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl font-black ${numberStyle}`}
      >
        {number}
      </div>

      <div>
        <h3 className="text-lg font-bold text-slate-900">{title}</h3>

        <p className="mt-1 leading-7 text-slate-600">{description}</p>
      </div>
    </div>
  );
}

function GatewayItem({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sm font-black text-sky-700">
        ✓
      </span>

      <p className="leading-7 text-slate-700">{text}</p>
    </div>
  );
}

type FutureActionProps = {
  title: string;
  description: string;
};

function FutureAction({ title, description }: FutureActionProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500 text-lg font-black text-slate-950">
        ✓
      </div>

      <h3 className="mt-5 text-xl font-bold">{title}</h3>

      <p className="mt-3 leading-7 text-slate-300">{description}</p>
    </div>
  );
}