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
      return; // success
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
          // account exists with password => wrong password
          setErr("Wrong password. You can try again or use “Forgot password?” to reset.");
          return;
        }

        if (methods.includes("google.com")) {
          setErr("This email is linked to Google sign-in. Use “Continue with Google”.");
          return;
        }

        // some other provider
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
    <div className="min-h-screen grid place-items-center p-6 bg-gray-50">
      <div className="w-full max-w-md bg-white p-6 rounded-2xl shadow">
        <h1 className="text-2xl font-semibold mb-4">SmartShooter — Sign in</h1>

        {err && (
          <div className="mb-3 text-sm border border-red-200 bg-red-50 text-red-700 rounded-xl p-2">
            {err}
          </div>
        )}

        <button
          onClick={signInGoogle}
          disabled={loading}
          className="w-full rounded-xl border p-3 mb-4 disabled:opacity-60"
        >
          Continue with Google
        </button>

        <form onSubmit={signInEmail} className="space-y-3">
          <input
            name="email"
            type="email"
            placeholder="Email"
            onChange={(e) => setEmailCache(e.target.value.trim())}
            className="w-full border rounded-xl p-3"
            required
          />
          <input
            name="password"
            type="password"
            placeholder="Password (min 6 chars)"
            className="w-full border rounded-xl p-3"
            required
            minLength={6}
          />
          <div className="flex justify-between items-center">
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-black text-white p-3 disabled:opacity-60 w-[60%]"
            >
              Sign in / Register
            </button>
            <button
              type="button"
              onClick={onResetPassword}
              disabled={loading}
              className="text-sm underline ml-3"
              title="Sends a reset email to the address entered above"
            >
              Forgot password?
            </button>
          </div>
        </form>
      </div>
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
