"use client";
import { useState } from "react";
import Link from "next/link";
import { CtaButton } from "../../components/CtaButton";

const steps = [
  { key: "forWho", label: "Для кого эта песня?", placeholder: "Для моего друга, для жены, для коллеги" },
  { key: "occasion", label: "По какому поводу?", placeholder: "День рождения, предложение, поддержка" },
  { key: "message", label: "Что вы хотите сказать?", placeholder: "Хочу поблагодарить за поддержку и сказать, как он мне дорог" },
  { key: "contact", label: "Как с вами связаться?", placeholder: "Email или телефон" }
] as const;

type FormState = Record<(typeof steps)[number]["key"], string> & { captcha: string };

export default function OrderPage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>({ forWho: "", occasion: "", message: "", contact: "", captcha: "" });

  const current = steps[step];
  const canNext = form[current.key].trim().length > 2;
  const isLast = step === steps.length - 1;

  const next = () => { if (isLast) return; setStep(step + 1); };
  const prev = () => setStep(Math.max(0, step - 1));

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Здесь будет реальная отправка на API с CAPTCHA
    alert("Мы бережно отнесёмся к вашей истории.");
  };

  return (
    <main className="px-4 py-10 md:px-8 lg:px-12 space-y-8">
      <div className="space-y-2 max-w-3xl">
        <h1 className="text-3xl font-semibold">Заказать песню</h1>
        <p className="text-[var(--muted)]">Заполните шаги — мы превратим вашу историю в музыку.</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-6 max-w-3xl">
        <div className="space-y-3">
          <p className="text-sm text-[var(--muted)]">Шаг {step + 1} из {steps.length}</p>
          <label className="block space-y-2">
            <span className="text-[var(--fg)] font-semibold">{current.label}</span>
            <textarea
              className="w-full rounded-2xl bg-[color-mix(in srgb,var(--bg) 70%,transparent)] border border-[var(--border-strong)] px-4 py-3 text-sm text-[var(--fg)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-[var(--focus-ring)]"
              rows={step === 2 ? 5 : 3}
              placeholder={current.placeholder}
              value={form[current.key]}
              onChange={(e) => setForm({ ...form, [current.key]: e.target.value })}
              required
            />
          </label>
          <div className="flex items-center gap-2">
            {step > 0 && (
              <button
                type="button"
                onClick={prev}
                className="px-4 py-2 rounded-xl bg-[color-mix(in srgb,var(--bg) 70%,transparent)] border border-[var(--border)] text-sm text-[var(--fg)] focus:outline-none focus:ring-[var(--focus-ring)]"
              >
                Назад
              </button>
            )}
            {!isLast && (
              <button
                type="button"
                onClick={next}
                disabled={!canNext}
                className="px-4 py-2 rounded-xl bg-[var(--accent)] text-black text-sm font-semibold disabled:opacity-50 focus:outline-none focus:ring-[var(--focus-ring)]"
              >
                Далее
              </button>
            )}
          </div>
        </div>

        {isLast && (
          <div className="space-y-3">
            <label className="block space-y-2">
              <span className="text-[var(--fg)] font-semibold">Введите CAPTCHA</span>
              <input
                className="w-full rounded-2xl bg-[color-mix(in srgb,var(--bg) 70%,transparent)] border border-[var(--border-strong)] px-4 py-3 text-sm text-[var(--fg)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-[var(--focus-ring)]"
                placeholder="CAPTCHA"
                value={form.captcha}
                onChange={(e) => setForm({ ...form, captcha: e.target.value })}
                required
              />
            </label>
            <CtaButton full type="submit">Отправить запрос</CtaButton>
            <p className="text-sm text-[var(--muted)]">Мы бережно отнесёмся к вашей истории.</p>
          </div>
        )}
      </form>

      <div className="space-y-2 p-4 rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-[var(--shadow-card)] max-w-3xl">
        <p className="text-sm text-[var(--muted)]">Так будет выглядеть ваш подарок</p>
        <p className="text-[var(--muted)] text-sm">Перед подтверждением мы покажем предпросмотр страницы подарка.</p>
        <Link href="/g/sample" className="text-[var(--accent)] text-sm">Открыть пример</Link>
      </div>
    </main>
  );
}
