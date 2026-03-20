"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push("/");
      } else {
        const data = await res.json();
        setError(data.error || "Login failed");
      }
    } catch (err) {
      setError("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center", 
      minHeight: "100vh", 
      backgroundColor: "var(--background)" 
    }}>
      <div className="card" style={{ maxWidth: "400px", width: "100%", padding: "40px" }}>
        <h1 className="title" style={{ fontSize: "20px", textAlign: "center", marginBottom: "8px" }}>BisMate Gate</h1>
        <p className="body-text text-secondary" style={{ textAlign: "center", marginBottom: "24px", fontSize: "14px" }}>
          Internal access only.
        </p>

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label className="label">Password</label>
            <input 
              type="password" 
              className="input" 
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="result-panel result-error" style={{ fontSize: "13px" }}>
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: "100%" }}
            disabled={loading || !password}
          >
            {loading ? "Authenticating..." : "Unlock Access"}
          </button>
        </form>
      </div>
    </div>
  );
}
