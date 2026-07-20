"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function ResetPasswordForm() {
  const params = useSearchParams();
  const token = params.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();

    if (password.length < 8) {
      return setError("Şifre en az 8 karakter olmalı.");
    }

    if (password !== confirm) {
      return setError("Şifreler eşleşmiyor.");
    }

    setBusy(true);
    setError("");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setError(data.error || "Bir şeyler ters gitti.");
        return;
      }

      setDone(true);
    } catch {
      setError("Sunucuya ulaşılamadı. Tekrar dene.");
    } finally {
      setBusy(false);
    }
  };

  if (!token) {
    return (
      <Wrap title="Geçersiz bağlantı">
        <p className="text-sm text-stone-500">
          Bu bağlantı eksik ya da hatalı görünüyor.
        </p>

        <Link
          href="/"
          className="mt-6 inline-block text-xs uppercase tracking-wide text-stone-500 hover:text-stone-900"
        >
          ← Mağazaya dön
        </Link>
      </Wrap>
    );
  }

  if (done) {
    return (
      <Wrap title="Şifre güncellendi ✓">
        <p className="text-sm text-stone-500">
          Yeni şifrenle giriş yapabilirsin.
        </p>

        <Link
          href="/"
          className="mt-6 inline-block rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-stone-50 hover:bg-stone-700"
        >
          Giriş yap
        </Link>
      </Wrap>
    );
  }

  return (
    <Wrap title="Yeni şifre belirle">
      <form onSubmit={submit} className="space-y-3">
        <input
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError("");
          }}
          type="password"
          placeholder="Yeni şifre (en az 8 karakter)"
          autoComplete="new-password"
          className="w-full rounded border border-stone-300 px-3 py-2.5 text-sm outline-none focus:border-stone-900"
        />

        <input
          value={confirm}
          onChange={(e) => {
            setConfirm(e.target.value);
            setError("");
          }}
          type="password"
          placeholder="Yeni şifre (tekrar)"
          autoComplete="new-password"
          className="w-full rounded border border-stone-300 px-3 py-2.5 text-sm outline-none focus:border-stone-900"
        />

        {error && (
          <p className="text-xs text-red-600">{error}</p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-full bg-stone-900 py-2.5 text-sm font-medium text-stone-50 hover:bg-stone-700 disabled:opacity-50"
        >
          {busy ? "Güncelleniyor…" : "Şifreyi güncelle"}
        </button>
      </form>
    </Wrap>
  );
}

function Wrap({ title, children }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-5 py-16">
      <div className="rounded-lg border border-stone-200 bg-stone-50 p-6">
        <h1 className="mb-4 text-lg font-medium">{title}</h1>
        {children}
      </div>
    </div>
  );
}