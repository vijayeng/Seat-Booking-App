const folders = [
  "app",
  "components",
  "lib",
  "services",
  "prisma",
  "middleware",
  "types",
];

const tooling = [
  "Next.js 15 with App Router",
  "TypeScript in strict mode",
  "Tailwind CSS",
  "Prisma ORM",
  "PostgreSQL-ready datasource",
  "ESLint",
  "Environment variable template",
];

export function ProjectScaffoldOverview() {
  return (
    <main className="min-h-screen px-6 py-16">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <section className="rounded-[2rem] border border-white/70 bg-white/75 p-8 shadow-[0_30px_80px_-48px_rgba(15,23,42,0.45)] backdrop-blur">
          <p className="text-sm font-medium uppercase tracking-[0.32em] text-sky-700">
            Next.js 15 Starter
          </p>
          <h1 className="mt-4 max-w-2xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            Production-ready project structure, ready for seat booking features.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
            This setup includes the requested framework, styling, ORM, database,
            linting, and folder conventions without adding any business logic
            yet.
          </p>
        </section>

        <div className="grid gap-6 md:grid-cols-2">
          <section className="rounded-[1.5rem] border border-slate-200 bg-[var(--card)] p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Folder Structure
            </h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              {folders.map((folder) => (
                <li
                  key={folder}
                  className="rounded-xl border border-slate-200 bg-white/80 px-4 py-3 font-mono"
                >
                  /{folder}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-[1.5rem] border border-slate-200 bg-[var(--card)] p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Included Tooling
            </h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              {tooling.map((item) => (
                <li
                  key={item}
                  className="rounded-xl border border-slate-200 bg-white/80 px-4 py-3"
                >
                  {item}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </main>
  );
}
