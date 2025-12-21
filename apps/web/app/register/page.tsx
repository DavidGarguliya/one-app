export default function RegisterPage() {
  return (
    <main className="px-4 md:px-8 lg:px-12 py-10">
      <div className="max-w-md mx-auto space-y-4">
        <h1 className="text-2xl font-semibold text-[var(--fg)]">Регистрация</h1>
        <form className="space-y-3">
          <label className="space-y-1 text-sm text-[var(--fg)]/80">
            <span>Email</span>
            <input
              type="email"
              className="w-full rounded-xl bg-[color-mix(in srgb,var(--bg) 70%,transparent)] border border-[var(--border-strong)] px-4 py-2 text-[var(--fg)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-[var(--focus-ring)]"
              required
            />
          </label>
          <label className="space-y-1 text-sm text-[var(--fg)]/80">
            <span>Пароль</span>
            <input
              type="password"
              className="w-full rounded-xl bg-[color-mix(in srgb,var(--bg) 70%,transparent)] border border-[var(--border-strong)] px-4 py-2 text-[var(--fg)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-[var(--focus-ring)]"
              required
            />
          </label>
          <button type="submit" className="w-full rounded-full bg-[var(--accent)] text-black font-semibold px-4 py-2">Зарегистрироваться</button>
        </form>
        <p className="text-sm text-[var(--fg)]/70">Уже есть аккаунт? <a href="/login" className="text-[var(--accent)]">Войти</a></p>
      </div>
    </main>
  );
}
