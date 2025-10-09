import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  fetchSignInMethodsForEmail,
} from "firebase/auth";
import { auth, googleProvider } from "../lib/firebase";
import { useAuthStore } from "../store/useAuthStore";

// If you place the logo in /public, this works:
const logoUrl = "/smartshooter-logo.svg";

export default function Login() {
  const { user, init } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [emailCache, setEmailCache] = useState("");

  useEffect(() => {
    const unsub = init();
    return () => unsub && unsub();
  }, [init]);

  useEffect(() => {
    if (user) navigate("/dashboard");
  }, [user, navigate]);

  const signInGoogle = async () => {
    setErr("");
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      setErr(codeToMessage(e.code) || "Google sign-in failed.");
    } finally {
      setLoading(false);
    }
  };

  const signInEmail = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);

    const email = e.target.email.value.trim();
    const pass = e.target.password.value.trim();
    setEmailCache(email);

    try {
      // 1) try normal sign-in
      await signInWithEmailAndPassword(auth, email, pass);
      return;
    } catch (e1) {
      // 2) disambiguate with provider lookup
      try {
        const methods = await fetchSignInMethodsForEmail(auth, email);

        if (methods.length === 0) {
          // no account => register
          if (pass.length < 6) throw new Error("weak-password");
          await createUserWithEmailAndPassword(auth, email, pass);
          return;
        }

        if (methods.includes("password")) {
          setErr("Wrong password. You can try again or use “Forgot password?” to reset.");
          return;
        }

        if (methods.includes("google.com")) {
          setErr("This email is linked to Google sign-in. Use “Continue with Google”.");
          return;
        }

        setErr(`This email uses provider(s): ${methods.join(", ")}. Use the matching provider.`);
      } catch (lookupErr) {
        setErr(codeToMessage(lookupErr.code) || "Sign-in failed.");
      } finally {
        setLoading(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const onResetPassword = async () => {
    setErr("");
    if (!emailCache) {
      setErr("Enter your email above first, then click “Forgot password?”.");
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, emailCache);
      setErr("Password reset email sent. Check your inbox.");
    } catch (e) {
      setErr(codeToMessage(e.code) || "Could not send reset email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 relative overflow-hidden">
      {/* soft grid background */}
      <div className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(50%_40%_at_50%_40%,black,transparent)]">
        <div className="h-full w-full bg-[linear-gradient(to_right,rgba(0,0,0,.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,.04)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,.05)_1px,transparent_1px)] bg-[size:28px_28px]" />
      </div>

      <main className="relative z-10 grid min-h-screen place-items-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-neutral-200/70 bg-white/90 shadow-xl backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-900/80">
            <div className="p-8">
              {/* Brand header */}
              <div className="mb-6 flex items-center gap-3">
                <img
                  src={logoUrl}
                  alt="SmartShooter"
                  className="h-10 w-10"
                  onError={(e) => { e.currentTarget.style.display = "none"; }}
                />
                <div className="leading-tight">
                  <h1 className="text-xl font-semibold text-neutral-900 dark:text-white">
                    SmartShooter
                  </h1>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    Sign in to continue
                  </p>
                </div>
              </div>

              {err && (
                <div
                  role="alert"
                  className="mb-4 rounded-xl border border-red-300/60 bg-red-50/80 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300"
                >
                  {err}
                </div>
              )}

              {/* Google */}
              <button
                type="button"
                onClick={signInGoogle}
                disabled={loading}
                className="mb-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-70 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-750"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-5 w-5">
                  <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.6 32.9 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 3l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c10 0 19-7.3 19-20 0-1.3-.1-2.7-.4-3.5z"/>
                  <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16.3 18.9 14 24 14c3 0 5.7 1.1 7.8 3l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.6 8.4 6.3 14.7z"/>
                  <path fill="#4CAF50" d="M24 44c5.1 0 10-1.9 13.6-5.4l-6.3-5.2C29.2 36 26.8 37 24 37c-5.2 0-9.6-3.1-11.3-7.6l-6.6 5C9.4 39.6 16.1 44 24 44z"/>
                  <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.3 3.1-4.5 5-8.3 5-5.2 0-9.6-3.1-11.3-7.6l-6.6 5C9.4 39.6 16.1 44 24 44c10 0 19-7.3 19-20 0-1.3-.1-2.7-.4-3.5z"/>
                </svg>
                Continue with Google
              </button>

              {/* Divider */}
              <div className="relative my-5">
                <div className="h-px w-full bg-neutral-200 dark:bg-neutral-800" />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-xs text-neutral-400 dark:bg-neutral-900">
                  or
                </span>
              </div>

              <form onSubmit={signInEmail} className="space-y-4">
                <label className="block">
                  <span className="sr-only">Email</span>
                  <input
                    name="email"
                    type="email"
                    placeholder="Email"
                    onChange={(e) => setEmailCache(e.target.value.trim())}
                    className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-3 text-sm text-neutral-900 placeholder-neutral-400 outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-orange-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                    required
                  />
                </label>

                <label className="block">
                  <span className="sr-only">Password</span>
                  <input
                    name="password"
                    type="password"
                    placeholder="Password (min 6 chars)"
                    className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-3 text-sm text-neutral-900 placeholder-neutral-400 outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-orange-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                    required
                    minLength={6}
                  />
                </label>

                <div className="flex items-center justify-between">
                  <button
                    type="submit"
                    disabled={loading}
                    className="relative inline-flex w-[60%] items-center justify-center gap-2 rounded-xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-70 dark:bg-black"
                  >
                    <span className="absolute inset-0 rounded-xl ring-1 ring-black/5 dark:ring-white/5" />
                    {loading ? "Signing in..." : "Sign in / Register"}
                  </button>

                  <button
                    type="button"
                    onClick={onResetPassword}
                    disabled={loading}
                    className="ml-3 text-sm font-medium text-orange-600 hover:text-orange-500 focus:outline-none focus:underline dark:text-orange-400"
                    title="Sends a reset email to the address entered above"
                  >
                    Forgot password?
                  </button>
                </div>
              </form>
            </div>

            {/* orange accent bar */}
            <div className="h-2 rounded-b-2xl bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500" />
          </div>
        </div>
      </main>
    </div>
  );
}

function codeToMessage(code) {
  switch (code) {
    case "auth/operation-not-allowed": return "Enable Email/Password in Firebase Auth → Sign-in method.";
    case "auth/invalid-email": return "Invalid email format.";
    case "auth/weak-password": return "Password should be at least 6 characters.";
    case "auth/wrong-password":
    case "auth/invalid-credential": return "Wrong password.";
    case "auth/email-already-in-use": return "Email already in use.";
    default: return "";
  }
}
