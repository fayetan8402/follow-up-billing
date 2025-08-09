
import { useState } from "react";
import Head from "next/head";
import { supabase } from "@/lib/supabaseClient";

export default function Login() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  async function signIn(e: any) {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined } });
    if (error) alert(error.message);
    else setSent(true);
  }
  return (
    <Head><title>Follow Up Billing — Sign In</title><meta name="viewport" content="width=device-width, initial-scale=1"/></Head>
    <div className="mx-auto grid min-h-screen place-items-center p-4">
      <div className="card max-w-md w-full p-6">
        <h1 className="text-xl font-bold mb-4 text-center">Sign in</h1>
        <form onSubmit={signIn} className="grid gap-3">
          <input className="rounded-2xl border p-3" placeholder="Email address" type="email" value={email} onChange={e=>setEmail(e.target.value)} />
          <button className="btn btn-primary" type="submit">Send Login Link</button>
        </form>
        {sent && <p className="mt-3 text-sm text-green-700">Check your inbox for the login link.</p>}
      </div>
    </div>
  );
}
