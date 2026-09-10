import React, { useState } from "react";
import { AlertTriangle, Instagram } from "lucide-react";
import api from "./api";
import Logo from "./Logo";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function GoogleMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 16.3 4 9.6 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.5-5.2l-6.2-5.2C29.3 35.4 26.8 36 24 36c-5.3 0-9.6-3.1-11.3-7.6l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.7l6.2 5.2C40.3 36.5 44 30.8 44 24c0-1.3-.1-2.7-.4-3.5z" />
    </svg>
  );
}

function FacebookMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" fill="#1877F2">
      <path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.4v7A10 10 0 0 0 22 12Z" />
    </svg>
  );
}

export default function AuthScreen({ onAuthed, gateReason, onCancel, guestLimit = 5 }) {
  const [mode, setMode] = useState(gateReason ? "signup" : "login"); // "login" | "signup"
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [instagramNotice, setInstagramNotice] = useState(false);

  const params = new URLSearchParams(window.location.search);
  const authErrorParam = params.get("auth_error");
  const oauthError =
    authErrorParam === "google_no_email" || authErrorParam === "facebook_no_email"
      ? "That account has no verified email address to sign in with. Try email/password instead."
      : "";

  const validate = () => {
    if (mode === "signup" && name.trim().length < 2) return "Enter your name.";
    if (!EMAIL_RE.test(email.trim())) return "Enter a valid email address.";
    if (password.length < 8) return "Password must be at least 8 characters.";
    return "";
  };

  const submit = async (e) => {
    e.preventDefault();
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setError("");
    setBusy(true);
    try {
      const res =
        mode === "signup"
          ? await api.signup(name.trim(), email.trim(), password)
          : await api.login(email.trim(), password);
      onAuthed(res.data.user);
    } catch (err) {
      setError(err?.response?.data?.error || "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="bgArt" />
      <div className="bgVeil" style={{ opacity: 0.62 }} />

      <div className="authWrap">
        <div className="authCard">
          <div className="emblem authEmblem">
            <Logo size={24} />
          </div>
          <h1 className="landingTitle">AyodhyaAI</h1>
          <p className="brandTagline">Your AI Guide to the Ramayana, the Gita &amp; the Puranas</p>
          <p className="landingSubtitle">
            Sign in to carry this conversation with you — your indexed texts and citations, saved across
            visits. Jai Siya Ram.
          </p>

          {gateReason === "forced" && (
            <p className="gateBanner">
              You've used all {guestLimit} free questions as a guest. Sign in to keep chatting — this
              conversation will be saved to your account.
            </p>
          )}

          <div className="authTabs">
            <button
              type="button"
              className={"authTab" + (mode === "login" ? " active" : "")}
              onClick={() => {
                setMode("login");
                setError("");
              }}
            >
              Log in
            </button>
            <button
              type="button"
              className={"authTab" + (mode === "signup" ? " active" : "")}
              onClick={() => {
                setMode("signup");
                setError("");
              }}
            >
              Sign up
            </button>
          </div>

          <div className="oauthRow">
            <a className="oauthBtn" href={api.googleLoginUrl}>
              <GoogleMark />
              Continue with Google
            </a>
            <a className="oauthBtn" href={api.facebookLoginUrl}>
              <FacebookMark />
              Continue with Facebook
            </a>
            <button
              type="button"
              className="oauthBtn"
              onClick={() => setInstagramNotice(true)}
            >
              <Instagram size={16} color="#E4405F" />
              Continue with Instagram
            </button>
            {instagramNotice && (
              <p className="oauthNotice">
                Instagram doesn't offer a standalone consumer sign-in anymore — Meta folded it into their
                business API. Please use Google or Facebook, or continue with email below.
              </p>
            )}
          </div>

          <div className="authDivider">
            <span>or continue with email</span>
          </div>

          <form className="authForm" onSubmit={submit}>
            {mode === "signup" && (
              <input
                className="input authInput"
                placeholder="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
            )}
            <input
              className="input authInput"
              placeholder="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            <input
              className="input authInput"
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
            />

            {(error || oauthError) && (
              <p className="authError">
                <AlertTriangle size={13} /> {error || oauthError}
              </p>
            )}

            <button className="btnPrimary" type="submit" disabled={busy} data-testid="authSubmit">
              {busy ? "Please wait…" : mode === "signup" ? "Create account" : "Log in"}
            </button>
          </form>

          <p className="authFooterNote">
            {mode === "login" ? "New here?" : "Already have an account?"}{" "}
            <button
              type="button"
              className="authSwitchLink"
              onClick={() => {
                setMode(mode === "login" ? "signup" : "login");
                setError("");
              }}
            >
              {mode === "login" ? "Create an account" : "Log in instead"}
            </button>
          </p>

          {onCancel && (
            <button type="button" className="authCancelLink" onClick={onCancel}>
              Continue as guest
            </button>
          )}
        </div>
      </div>
    </>
  );
}
