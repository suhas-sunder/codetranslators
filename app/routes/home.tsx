import type { Route } from "./+types/home";
import * as React from "react";
import { useMemo, useRef, useState } from "react";

/* ========================
   SEO
======================== */
export function meta({}: Route.MetaArgs) {
  const title = "Code Translators — Morse, Binary, Hex, Base64 and more";
  const description =
    "Free, fast, and accurate code translators. Convert text to Morse, Binary, Hex, Base64, URL encode or decode, ROT13 or custom Caesar, and inspect Unicode. Copy with one click.";
  return [
    { title },
    { name: "description", content: description },
    { name: "viewport", content: "width=device-width, initial-scale=1" },
    { name: "theme-color", content: "#0ea5e9" }, // sky accent
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
  ];
}

export function loader({ context }: Route.LoaderArgs) {
  return { message: context?.VALUE_FROM_EXPRESS ?? "Translate everything" };
}

/* ========================
   Utilities
======================== */
const classNames = (...xs: Array<string | false | null | undefined>) =>
  xs.filter(Boolean).join(" ");

function copyToClipboard(text: string) {
  return navigator.clipboard?.writeText(text);
}

/* ========================
   Primitives
======================== */
function Section({
  id,
  title,
  subtitle,
  children,
}: {
  id?: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            {title}
          </h2>
          {subtitle ? <p className="mt-2 text-slate-600">{subtitle}</p> : null}
        </header>
        <div>{children}</div>
      </div>
    </section>
  );
}

function Card({
  children,
  title,
  aside,
}: {
  children: React.ReactNode;
  title?: string;
  aside?: React.ReactNode;
}) {
  return (
    <div className="relative rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      {(title || aside) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title ? (
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          ) : (
            <div />
          )}
          {aside}
        </div>
      )}
      {children}
    </div>
  );
}

function TextArea({
  value,
  onChange,
  placeholder,
  rows = 6,
  label,
  id,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  label?: string;
  id?: string;
}) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  return (
    <div className="flex flex-col gap-2">
      {label ? (
        <label htmlFor={id} className="text-sm font-medium text-slate-800">
          {label}
        </label>
      ) : null}
      <textarea
        id={id}
        ref={textareaRef}
        className="w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm outline-none focus:border-sky-500"
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

function OutputBox({
  value,
  rows = 6,
  ariaLabel = "Output",
}: {
  value: string;
  rows?: number;
  ariaLabel?: string;
}) {
  const readonlyRef = useRef<HTMLTextAreaElement | null>(null);
  return (
    <div className="relative">
      <textarea
        ref={readonlyRef}
        readOnly
        aria-label={ariaLabel}
        className="w-full resize-y rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900 shadow-sm outline-none"
        rows={rows}
        value={value}
      />
      <div className="absolute right-2 top-2">
        <button
          onClick={() => copyToClipboard(value)}
          className="rounded-md border border-sky-600 bg-sky-600 px-3 py-1 text-sm font-medium text-white hover:bg-sky-700"
        >
          Copy
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex items-center justify-between gap-4 text-sm text-slate-800">
      <span>{label}</span>
      <div>{children}</div>
    </label>
  );
}

/* ========================
   Translators: Logic
======================== */
// Morse
const MORSE: Record<string, string> = {
  A: ".-",
  B: "-...",
  C: "-.-.",
  D: "-..",
  E: ".",
  F: "..-.",
  G: "--.",
  H: "....",
  I: "..",
  J: ".---",
  K: "-.-",
  L: ".-..",
  M: "--",
  N: "-.",
  O: "---",
  P: ".--.",
  Q: "--.-",
  R: ".-.",
  S: "...",
  T: "-",
  U: "..-",
  V: "...-",
  W: ".--",
  X: "-..-",
  Y: "-.--",
  Z: "--..",
  "0": "-----",
  "1": ".----",
  "2": "..---",
  "3": "...--",
  "4": "....-",
  "5": ".....",
  "6": "-....",
  "7": "--...",
  "8": "---..",
  "9": "----.",
  ".": ".-.-.-",
  ",": "--..--",
  "?": "..--..",
  "'": ".----.",
  "!": "-.-.--",
  "/": "-..-.",
  "(": "-.--.",
  ")": "-.--.-",
  "&": ".-...",
  ":": "---...",
  ";": "-.-.-.",
  "=": "-...-",
  "+": ".-.-.",
  "-": "-....-",
  _: "..--.-", // underscore (fixed)
  '"': ".-..-.",
  $: "...-..-",
  "@": ".--.-.",
};
const REVMORSE: Record<string, string> = Object.fromEntries(
  Object.entries(MORSE).map(([k, v]) => [v, k])
);

function toMorse(
  text: string,
  letterSep: string,
  wordSep: string,
  keepUnknown = false
) {
  return text
    .toUpperCase()
    .split(" ")
    .map((word) =>
      [...word]
        .map((ch) => {
          const code = MORSE[ch];
          if (!code) return keepUnknown ? ch : "";
          return code;
        })
        .filter((s) => s !== "")
        .join(letterSep)
    )
    .join(wordSep);
}

function fromMorse(
  code: string,
  letterSep: string,
  wordSep: string,
  strict = false
) {
  // Normalize dots/dashes and whitespace variants
  const normalizePunctuation = (s: string) =>
    s
      .replace(/[–—−]/g, "-") // en/em dashes to hyphen
      .replace(/[·•∙]/g, ".") // dot-like symbols to '.'
      .replace(/​|‌|‍|﻿/g, "") // zero-width
      .trim();

  const cleaned = normalizePunctuation(code);

  // Escape user-provided separators for regex usage
  const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const wsep = wordSep ? esc(wordSep) : "";
  const lsep = letterSep ? esc(letterSep) : "";

  // Word splitter accepts (a) explicit wordSep, (b) optional-space '/' optional-space, (c) 3+ spaces
  const wordSplitter = new RegExp(
    [wsep && `(?:${wsep})`, "(?:\\s*/\\s*)", "(?:\\s{3,})"]
      .filter(Boolean)
      .join("|"),
    "g"
  );

  // Split into words
  const words = cleaned.split(wordSplitter).filter((w) => w.length > 0);

  // Letter splitter prefers the provided separator; fallback to single space(s)
  const letterSplitter = new RegExp(lsep ? lsep : "\\s+", "g");

  const decodedWords = words.map((w) =>
    w
      .split(letterSplitter)
      .filter((sym) => sym.length > 0)
      .map((sym) => {
        const t = REVMORSE[sym];
        if (!t) return strict ? "�" : "";
        return t;
      })
      .join("")
  );

  return decodedWords.join(" ");
}

// Binary and Hex
function textToBinary(
  text: string,
  groupSize = 8,
  delimiter = " ",
  upper = false
) {
  const bits = [...text].map((ch) => {
    const code = ch.codePointAt(0)!;
    const bin = code.toString(2);
    const padded =
      groupSize > 0
        ? bin.padStart(Math.ceil(bin.length / groupSize) * groupSize, "0")
        : bin;
    return padded;
  });
  const out = bits.join(delimiter);
  return upper ? out.toUpperCase() : out;
}
function binaryToText(binary: string) {
  const cleaned = binary
    .trim()
    .replace(/[^01\s]/g, " ")
    .replace(/\s+/g, " ");
  if (!cleaned) return "";
  const bytes = cleaned.split(" ").filter(Boolean);
  try {
    const chars = bytes.map((b) => String.fromCodePoint(parseInt(b, 2)));
    return chars.join("");
  } catch {
    return "Invalid binary sequence";
  }
}

function textToHex(
  text: string,
  delimiter = " ",
  upper = true,
  bytesPerGroup = 1
) {
  const bytes = new TextEncoder().encode(text);
  const parts: string[] = [];
  for (let i = 0; i < bytes.length; i++) {
    const hex = bytes[i].toString(16).padStart(2, "0");
    parts.push(upper ? hex.toUpperCase() : hex);
    if (bytesPerGroup > 1 && (i + 1) % bytesPerGroup === 0) {
      parts.push(delimiter);
    }
  }
  return parts.join(delimiter).replace(new RegExp(`${delimiter}+$`), "");
}
function hexToText(hex: string) {
  const cleaned = hex.replace(/[^0-9a-fA-F]/g, "");
  if (cleaned.length % 2 !== 0) return "Invalid hex length";
  const bytes = new Uint8Array(cleaned.length / 2);
  for (let i = 0; i < cleaned.length; i += 2) {
    bytes[i / 2] = parseInt(cleaned.slice(i, i + 2), 16);
  }
  try {
    return new TextDecoder().decode(bytes);
  } catch {
    return "Invalid hex sequence";
  }
}

// Base64
function textToBase64(text: string) {
  try {
    return btoa(unescape(encodeURIComponent(text)));
  } catch {
    return "Encoding error";
  }
}
function base64ToText(b64: string) {
  try {
    return decodeURIComponent(escape(atob(b64)));
  } catch {
    return "Invalid Base64";
  }
}

// ROT / Caesar
function rot(text: string, shift: number) {
  const a = "a".charCodeAt(0);
  const z = "z".charCodeAt(0);
  const A = "A".charCodeAt(0);
  const Z = "Z".charCodeAt(0);
  const wrap = (code: number, start: number) =>
    ((((code - start + shift) % 26) + 26) % 26) + start;
  return [...text]
    .map((ch) => {
      const c = ch.charCodeAt(0);
      if (c >= a && c <= z) return String.fromCharCode(wrap(c, a));
      if (c >= A && c <= Z) return String.fromCharCode(wrap(c, A));
      return ch;
    })
    .join("");
}

// URL
const urlEncode = (s: string) => encodeURIComponent(s);
const urlDecode = (s: string) => {
  try {
    return decodeURIComponent(s);
  } catch {
    return "Invalid URL encoding";
  }
};

// Unicode inspector
function inspectUnicode(s: string) {
  return [...s].map((ch) => {
    const cp = ch.codePointAt(0)!;
    const hex = "U+" + cp.toString(16).toUpperCase().padStart(4, "0");
    return { ch, dec: cp, hex };
  });
}

/* ========================
   Translator Cards
======================== */
function MorseCard() {
  const [input, setInput] = useState("SOS help!");
  const [letterSep, setLetterSep] = useState(" ");
  const [wordSep, setWordSep] = useState(" / ");
  const [keepUnknown, setKeepUnknown] = useState(false);
  const [strict, setStrict] = useState(false);

  const encoded = useMemo(
    () => toMorse(input, letterSep, wordSep, keepUnknown),
    [input, letterSep, wordSep, keepUnknown]
  );

  const [decodeIn, setDecodeIn] = useState(
    "... --- ... / .... . .-.. .--. -.-.--"
  );
  const decoded = useMemo(
    () => fromMorse(decodeIn, letterSep, wordSep, strict),
    [decodeIn, letterSep, wordSep, strict]
  );

  return (
    <Card
      title="Morse Code"
      aside={
        <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-800">
          Encode and decode
        </span>
      }
    >
      <div className="grid gap-8">
        <div className="flex flex-col gap-4">
          <TextArea
            id="morse-in"
            label="Text to Morse"
            value={input}
            onChange={setInput}
            placeholder="Type plain text"
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Field label="Letter separator">
              <input
                className="w-28 rounded border border-slate-300 bg-white px-2 py-1 text-sm"
                value={letterSep}
                onChange={(e) => setLetterSep(e.target.value)}
              />
            </Field>
            <Field label="Word separator">
              <input
                className="w-28 rounded border border-slate-300 bg-white px-2 py-1 text-sm"
                value={wordSep}
                onChange={(e) => setWordSep(e.target.value)}
              />
            </Field>
            <Field label="Keep unknown chars">
              <input
                type="checkbox"
                checked={keepUnknown}
                onChange={(e) => setKeepUnknown(e.target.checked)}
              />
            </Field>
          </div>
          <OutputBox value={encoded} ariaLabel="Morse output" />
        </div>

        <div className="flex flex-col gap-4">
          <TextArea
            id="morse-de"
            label="Morse to Text"
            value={decodeIn}
            onChange={setDecodeIn}
            placeholder="Enter Morse using your separators"
          />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-slate-800">
              <input
                type="checkbox"
                checked={strict}
                onChange={(e) => setStrict(e.target.checked)}
              />
              Strict decode, unknown as �
            </label>
          </div>
          <OutputBox value={decoded} ariaLabel="Morse decoded" />
        </div>
      </div>
    </Card>
  );
}

function BinaryHexCard() {
  const [input, setInput] = useState("Hello, world!");
  const [groupSize, setGroupSize] = useState(8);
  const [delimiter, setDelimiter] = useState(" ");
  const [upper, setUpper] = useState(false);

  const binOut = useMemo(
    () => textToBinary(input, groupSize, delimiter, upper),
    [input, groupSize, delimiter, upper]
  );

  const [binIn, setBinIn] = useState(
    "01001000 01100101 01101100 01101100 01101111"
  );
  const binDecoded = useMemo(() => binaryToText(binIn), [binIn]);

  const [hexDelim, setHexDelim] = useState(" ");
  const [hexUpper, setHexUpper] = useState(true);
  const [hexGroup, setHexGroup] = useState(1);

  const hexOut = useMemo(
    () => textToHex(input, hexDelim, hexUpper, hexGroup),
    [input, hexDelim, hexUpper, hexGroup]
  );

  const [hexIn, setHexIn] = useState("48 65 6C 6C 6F 2C 20 77 6F 72 6C 64 21");
  const hexDecoded = useMemo(() => hexToText(hexIn), [hexIn]);

  return (
    <Card
      title="Binary and Hex"
      aside={
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800">
          Byte inspector
        </span>
      }
    >
      <div className="grid gap-8">
        <div className="flex flex-col gap-4">
          <TextArea label="Text" value={input} onChange={setInput} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Field label="Binary group size">
              <input
                type="number"
                min={1}
                className="w-24 rounded border border-slate-300 bg-white px-2 py-1 text-sm"
                value={groupSize}
                onChange={(e) =>
                  setGroupSize(parseInt(e.target.value || "8", 10))
                }
              />
            </Field>
            <Field label="Delimiter">
              <input
                className="w-24 rounded border border-slate-300 bg-white px-2 py-1 text-sm"
                value={delimiter}
                onChange={(e) => setDelimiter(e.target.value)}
              />
            </Field>
            <Field label="Uppercase">
              <input
                type="checkbox"
                checked={upper}
                onChange={(e) => setUpper(e.target.checked)}
              />
            </Field>
          </div>
          <OutputBox value={binOut} ariaLabel="Binary output" />
          <TextArea
            label="Binary to Text"
            value={binIn}
            onChange={setBinIn}
            rows={4}
          />
          <OutputBox value={binDecoded} rows={2} ariaLabel="Binary decoded" />
        </div>

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Field label="Hex delimiter">
              <input
                className="w-24 rounded border border-slate-300 bg-white px-2 py-1 text-sm"
                value={hexDelim}
                onChange={(e) => setHexDelim(e.target.value)}
              />
            </Field>
            <Field label="Uppercase">
              <input
                type="checkbox"
                checked={hexUpper}
                onChange={(e) => setHexUpper(e.target.checked)}
              />
            </Field>
            <Field label="Bytes per group">
              <input
                type="number"
                min={1}
                className="w-24 rounded border border-slate-300 bg-white px-2 py-1 text-sm"
                value={hexGroup}
                onChange={(e) =>
                  setHexGroup(parseInt(e.target.value || "1", 10))
                }
              />
            </Field>
          </div>
          <OutputBox value={hexOut} ariaLabel="Hex output" />
          <TextArea
            label="Hex to Text"
            value={hexIn}
            onChange={setHexIn}
            rows={4}
          />
          <OutputBox value={hexDecoded} rows={2} ariaLabel="Hex decoded" />
        </div>
      </div>
    </Card>
  );
}

function Base64UrlCard() {
  const [input, setInput] = useState(
    "The quick brown fox jumps over 13 lazy dogs."
  );
  const b64 = useMemo(() => textToBase64(input), [input]);
  const [b64In, setB64In] = useState(btoa("Hello"));
  const b64Out = useMemo(() => base64ToText(b64In), [b64In]);

  const [urlIn, setUrlIn] = useState(
    "https://codetranslators.com/?q=hello world"
  );
  const urlEnc = useMemo(() => urlEncode(urlIn), [urlIn]);
  const [encIn, setEncIn] = useState(urlEnc);
  const urlDec = useMemo(() => urlDecode(encIn), [encIn]);

  return (
    <Card
      title="Base64 and URL"
      aside={
        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-900">
          Web safe
        </span>
      }
    >
      <div className="grid gap-8">
        <div className="flex flex-col gap-4">
          <TextArea label="Text to Base64" value={input} onChange={setInput} />
          <OutputBox value={b64} ariaLabel="Base64 output" />
          <TextArea
            label="Base64 to Text"
            value={b64In}
            onChange={setB64In}
            rows={3}
          />
          <OutputBox value={b64Out} rows={2} ariaLabel="Base64 decoded" />
        </div>
        <div className="flex flex-col gap-4">
          <TextArea
            label="URL to encode"
            value={urlIn}
            onChange={setUrlIn}
            rows={3}
          />
          <OutputBox value={urlEnc} rows={2} ariaLabel="URL encoded" />
          <TextArea
            label="URL encoded to decode"
            value={encIn}
            onChange={setEncIn}
            rows={3}
          />
          <OutputBox value={urlDec} rows={2} ariaLabel="URL decoded" />
        </div>
      </div>
    </Card>
  );
}

function RotUnicodeCard() {
  const [input, setInput] = useState("Attack At Dawn");
  const [shift, setShift] = useState(13);
  const rotOut = useMemo(() => rot(input, shift), [input, shift]);

  const [uniIn, setUniIn] = useState("Hi 🌊🚀");
  const uni = useMemo(() => inspectUnicode(uniIn), [uniIn]);

  return (
    <Card
      title="ROT and Unicode Inspector"
      aside={
        <span className="rounded-full bg-fuchsia-100 px-3 py-1 text-xs font-medium text-fuchsia-900">
          Text tools
        </span>
      }
    >
      <div className="grid gap-8">
        <div className="flex flex-col gap-4">
          <TextArea label="ROT / Caesar" value={input} onChange={setInput} />
          <div className="flex items-center gap-4">
            <label className="text-sm text-slate-800">Shift</label>
            <input
              type="range"
              min={-25}
              max={25}
              value={shift}
              onChange={(e) => setShift(parseInt(e.target.value, 10))}
              className="w-56"
            />
            <span className="text-sm tabular-nums text-slate-800">{shift}</span>
          </div>
          <OutputBox value={rotOut} ariaLabel="ROT output" />
        </div>

        <div className="flex flex-col gap-4">
          <TextArea
            label="Unicode inspector"
            value={uniIn}
            onChange={setUniIn}
            rows={3}
          />
          <div className="overflow-auto rounded-lg border border-slate-200">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-3 py-2 font-semibold text-slate-800">
                    Char
                  </th>
                  <th className="px-3 py-2 font-semibold text-slate-800">
                    Code point
                  </th>
                  <th className="px-3 py-2 font-semibold text-slate-800">
                    Hex
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {uni.map((row, i) => (
                  <tr key={i} className="bg-white">
                    <td className="px-3 py-2 font-medium text-slate-900">
                      {row.ch}
                    </td>
                    <td className="px-3 py-2 text-slate-800">{row.dec}</td>
                    <td className="px-3 py-2 text-slate-800">{row.hex}</td>
                  </tr>
                ))}
                {uni.length === 0 && (
                  <tr>
                    <td className="px-3 py-3 text-slate-600" colSpan={3}>
                      Enter text to inspect characters
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Card>
  );
}

/* ========================
   Page
======================== */
export default function Home({ loaderData }: Route.ComponentProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <a href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-sky-600 shadow-sm" />
            <span className="text-lg font-semibold tracking-tight text-slate-900">
              Code Translators
            </span>
          </a>
          <nav className="hidden items-center gap-6 sm:flex">
            <a
              href="#features"
              className="text-sm text-slate-700 hover:text-slate-900"
            >
              Features
            </a>
            <a
              href="#translators"
              className="text-sm text-slate-700 hover:text-slate-900"
            >
              Translators
            </a>
            <a
              href="#faq"
              className="text-sm text-slate-700 hover:text-slate-900"
            >
              FAQ
            </a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
              Translate code effortlessly
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base text-slate-700 sm:text-lg">
              Morse, Binary, Hex, Base64, URL, and ROT tools that feel instant.
              Free to use and privacy friendly. Everything runs in your browser.
            </p>
          </div>
        </div>
      </section>

      {/* Translators */}
      <Section
        id="translators"
        title="Translators"
        subtitle="Pick a tool and start converting. It's that easy."
      >
        <div className="grid gap-8">
          <MorseCard />
          <BinaryHexCard />
          <Base64UrlCard />
          <RotUnicodeCard />
        </div>
      </Section>

      {/* Features */}
      <Section
        id="features"
        title="Built for speed and accuracy"
        subtitle="Reliable conversions with options that pros expect."
      >
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: "Client only",
              desc: "No servers reading your text. Everything runs locally.",
              badge: "Privacy",
              cls: "bg-emerald-100 text-emerald-900",
            },
            {
              title: "Copy ready",
              desc: "One click copy on every output. Pasting just works.",
              badge: "Fast",
              cls: "bg-sky-100 text-sky-900",
            },
            {
              title: "Advanced options",
              desc: "Custom separators, grouping, case, and strict decodes.",
              badge: "Control",
              cls: "bg-amber-100 text-amber-900",
            },
            {
              title: "Accessible",
              desc: "High contrast and keyboard friendly.",
              badge: "A11y",
              cls: "bg-indigo-100 text-indigo-900",
            },
            {
              title: "Lightweight",
              desc: "No bloat, just tools that work.",
              badge: "Simple",
              cls: "bg-slate-100 text-slate-900",
            },
            {
              title: "Open to more",
              desc: "Hashing, QR, and UUIDs can be added.",
              badge: "Roadmap",
              cls: "bg-fuchsia-100 text-fuchsia-900",
            },
          ].map((f, i) => (
            <div
              key={i}
              className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div
                className={classNames(
                  "mb-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
                  f.cls
                )}
              >
                {f.badge}
              </div>
              <h3 className="text-lg font-semibold text-slate-900">
                {f.title}
              </h3>
              <p className="mt-1 text-sm text-slate-700">{f.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section
        id="guides"
        title="Guides"
        subtitle="Clear, practical explanations that help you convert text accurately."
      >
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Card title="What is Morse code?">
            <div className="text-slate-700 text-sm space-y-2">
              <p>
                Morse code encodes letters and digits as dots and dashes. Use a
                single space between letters and a slash between words for
                reliable decoding. Custom separators are supported in our tool.
              </p>
              <ul className="list-disc pl-5">
                <li>Letters map to short and long signals</li>
                <li>Word separator defaults to “/”</li>
                <li>Strict mode flags unknown symbols</li>
              </ul>
            </div>
          </Card>

          <Card title="Binary vs Hex">
            <div className="text-slate-700 text-sm space-y-2">
              <p>
                Binary shows bits directly, while hexadecimal groups bytes into
                two-digit pairs, which is easier to read and copy. Both
                represent the same data.
              </p>
              <ul className="list-disc pl-5">
                <li>Binary grouping improves readability</li>
                <li>Hex bytes are compact for logs and docs</li>
                <li>Round-trip conversions preserve content</li>
              </ul>
            </div>
          </Card>

          <Card title="What is Base64?">
            <div className="text-slate-700 text-sm space-y-2">
              <p>
                Base64 turns bytes into safe ASCII for transport or embedding.
                It is not encryption, only encoding.
              </p>
              <ul className="list-disc pl-5">
                <li>Great for data URIs and storage</li>
                <li>Padding with “=” keeps length aligned</li>
                <li>Works with any Unicode input</li>
              </ul>
            </div>
          </Card>

          <Card title="URL encoding explained">
            <div className="text-slate-700 text-sm space-y-2">
              <p>
                URL encoding replaces reserved characters with percent escapes.
                Encode query strings to avoid breaking links.
              </p>
              <ul className="list-disc pl-5">
                <li>Spaces become %20</li>
                <li>Non ASCII becomes UTF 8 percent escapes</li>
                <li>Decode safely to read parameters</li>
              </ul>
            </div>
          </Card>

          <Card title="ROT and Caesar ciphers">
            <div className="text-slate-700 text-sm space-y-2">
              <p>
                ROT shifts letters by a fixed amount, such as ROT13. It is
                simple text obfuscation, not secure cryptography.
              </p>
              <ul className="list-disc pl-5">
                <li>Shift A to Z and a to z</li>
                <li>Numbers and symbols are unchanged</li>
                <li>Use negative shifts to reverse quickly</li>
              </ul>
            </div>
          </Card>

          <Card title="Accessibility and accuracy">
            <div className="text-slate-700 text-sm space-y-2">
              <p>
                The translators run locally in your browser. High contrast UI,
                keyboard support, and copy buttons keep workflow fast and
                reliable.
              </p>
              <ul className="list-disc pl-5">
                <li>No servers reading your text</li>
                <li>One click copy on every output</li>
                <li>Customizable separators and grouping</li>
              </ul>
            </div>
          </Card>
        </div>
      </Section>

      {/* SEO: Guides */}
      <Section
        id="guides"
        title="Guides"
        subtitle="Learn the differences between encodings and when to use them."
      >
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Card title="Morse Code Basics">
            <p className="text-slate-700 text-sm">
              Morse code encodes letters, digits, and punctuation as dots and
              dashes. It is still used in aviation, ham radio, and emergency
              signaling. Our translator converts text to Morse and back
              instantly with custom separators for clarity.
            </p>
          </Card>
          <Card title="Binary and Hexadecimal">
            <p className="text-slate-700 text-sm">
              Binary is the fundamental language of computers, representing all
              data as 0s and 1s. Hexadecimal, or hex, compresses binary into
              human-friendly pairs. Use hex for debugging, data inspection, and
              representing raw bytes in logs.
            </p>
          </Card>
          <Card title="Base64 Encoding">
            <p className="text-slate-700 text-sm">
              Base64 turns text and binary data into a safe ASCII format for
              storage and transmission. It is commonly used in JSON, email
              (MIME), and embedding images or files directly into HTML and CSS.
            </p>
          </Card>
          <Card title="URL Encoding">
            <p className="text-slate-700 text-sm">
              URL encoding replaces unsafe characters with percent escapes so
              links can carry spaces, Unicode, or reserved symbols. This
              prevents errors when sharing URLs with parameters like queries or
              IDs.
            </p>
          </Card>
          <Card title="ROT and Caesar Ciphers">
            <p className="text-slate-700 text-sm">
              ROT shifts the alphabet by a fixed number of positions, such as
              ROT13. It is often used for puzzles, obfuscation, and historical
              cryptography. Our slider lets you adjust shifts from -25 to +25
              instantly.
            </p>
          </Card>
          <Card title="Unicode Inspector">
            <p className="text-slate-700 text-sm">
              Unicode powers modern text, covering emojis, scripts, and special
              characters. The inspector reveals code points and hex values so
              you can debug encoding issues or study character sets.
            </p>
          </Card>
        </div>
      </Section>

      {/* SEO: Examples */}
      <Section
        id="examples"
        title="Examples"
        subtitle="Common conversions you can try right away."
      >
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Card title="Text to Morse">
            <p className="text-sm text-slate-700">
              Example: "HELLO" → .... . .-.. .-.. ---
            </p>
          </Card>
          <Card title="Binary Conversion">
            <p className="text-sm text-slate-700">
              Example: "A" → 01000001 (binary), "Hello" → 01001000 01100101
              01101100 01101100 01101111
            </p>
          </Card>
          <Card title="Hexadecimal Conversion">
            <p className="text-sm text-slate-700">
              Example: "Hi" → 48 69 in hex. Great for inspecting text encoding
              at byte level.
            </p>
          </Card>
          <Card title="Base64 Encoding">
            <p className="text-sm text-slate-700">
              Example: "Hello" → SGVsbG8=. Often used in APIs and email
              attachments.
            </p>
          </Card>
          <Card title="URL Encoding">
            <p className="text-sm text-slate-700">
              Example: "hello world" → hello%20world. Useful in query parameters
              and redirects.
            </p>
          </Card>
          <Card title="ROT13 Cipher">
            <p className="text-sm text-slate-700">
              Example: "Attack At Dawn" → "Nggnpx Ng Qnja". Reversible by
              applying ROT13 again.
            </p>
          </Card>
        </div>
      </Section>

      {/* SEO: Benefits */}
      <Section
        id="benefits"
        title="Why use Code Translators?"
        subtitle="Key reasons professionals and learners choose these tools."
      >
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Card title="Fast and local">
            <p className="text-slate-700 text-sm">
              Everything runs in your browser, instantly, with no server
              round-trips.
            </p>
          </Card>
          <Card title="Privacy friendly">
            <p className="text-slate-700 text-sm">
              Your input never leaves your computer. No logs, no tracking, no
              storage.
            </p>
          </Card>
          <Card title="Copy ready">
            <p className="text-slate-700 text-sm">
              Every output includes a one-click copy button so you can paste
              into code, documentation, or messages without errors.
            </p>
          </Card>
          <Card title="Educational">
            <p className="text-slate-700 text-sm">
              Understand how encodings and ciphers work through clear outputs
              and Unicode inspection.
            </p>
          </Card>
          <Card title="Cross-platform">
            <p className="text-slate-700 text-sm">
              Works on desktop and mobile browsers with no installation
              required.
            </p>
          </Card>
          <Card title="Future ready">
            <p className="text-slate-700 text-sm">
              Roadmap includes hashing (SHA, MD5), QR codes, and UUID
              generators.
            </p>
          </Card>
        </div>
      </Section>

      {/* SEO: Common Questions */}
      <Section
        id="common-questions"
        title="Common Questions"
        subtitle="Direct answers to what people search for most often."
      >
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Card title="How to convert text to binary?">
            <p className="text-slate-700 text-sm">
              Enter plain text like "Hello" and get binary instantly: 01001000
              01100101 01101100 01101100 01101111. This is useful for computer
              science classes, debugging low-level code, or teaching how
              computers store characters.
            </p>
          </Card>
          <Card title="How to decode Morse code online?">
            <p className="text-slate-700 text-sm">
              Paste dots and dashes like "... --- ..." to see "SOS". Our tool
              supports custom letter and word separators, so it works with
              formats from ham radio logs to historic cipher puzzles.
            </p>
          </Card>
          <Card title="What is Base64 used for?">
            <p className="text-slate-700 text-sm">
              Base64 is used to embed images in HTML/CSS, send files safely in
              email, and represent binary data in JSON APIs. It ensures all
              characters are safe ASCII for transport. You can encode and decode
              instantly here.
            </p>
          </Card>
          <Card title="How to encode URLs?">
            <p className="text-slate-700 text-sm">
              Spaces and special characters can break links. URL encoding
              replaces them with percent codes: "hello world" → "hello%20world".
              Use this tool to make links safe for sharing, forms, and
              redirects.
            </p>
          </Card>
          <Card title="Is ROT13 secure?">
            <p className="text-slate-700 text-sm">
              ROT13 is not encryption but simple letter shifting. It’s common in
              forums, puzzles, and spoiler protection. Apply ROT13 twice to get
              the original text back.
            </p>
          </Card>
          <Card title="How to inspect Unicode?">
            <p className="text-slate-700 text-sm">
              Enter any emoji, symbol, or character to see its Unicode code
              point (like 😀 → U+1F600). This helps developers debug encoding
              problems or find exact symbols for documents and code.
            </p>
          </Card>
        </div>
      </Section>

      {/* SEO: Use Cases */}
      <Section
        id="use-cases"
        title="Use Cases"
        subtitle="When and why you might need a code translator."
      >
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Card title="Learning and education">
            <p className="text-slate-700 text-sm">
              Perfect for students studying computer science, networking, or
              cryptography. See instantly how text maps to binary, hex, Morse,
              and ROT13.
            </p>
          </Card>
          <Card title="Software development">
            <p className="text-slate-700 text-sm">
              Developers use these tools to debug encodings, prepare safe URLs,
              test API payloads, and verify Base64 data. Copy outputs directly
              into code.
            </p>
          </Card>
          <Card title="Cybersecurity and forensics">
            <p className="text-slate-700 text-sm">
              Inspect encoded payloads, decode suspicious data, or check ROT
              obfuscation. Great for CTF competitions and forensic analysis.
            </p>
          </Card>
          <Card title="Web and email content">
            <p className="text-slate-700 text-sm">
              Encode files and attachments into Base64 for email or inline HTML.
              Generate safe URLs that won’t break in browsers or query strings.
            </p>
          </Card>
          <Card title="Hobby and puzzles">
            <p className="text-slate-700 text-sm">
              Decode Morse from ham radio logs, solve cryptic crosswords, or
              experiment with ROT ciphers in online communities.
            </p>
          </Card>
          <Card title="Cross-language testing">
            <p className="text-slate-700 text-sm">
              Check Unicode characters across different browsers and systems to
              ensure consistent display of emojis and symbols.
            </p>
          </Card>
        </div>
      </Section>

      {/* SEO: Step-by-step Guides */}
      <Section
        id="how-to"
        title="Step-by-step Guides"
        subtitle="Quick instructions for common tasks."
      >
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Card title="Convert text to Hex">
            <ol className="list-decimal pl-5 text-slate-700 text-sm space-y-1">
              <li>Open the Binary & Hex card below.</li>
              <li>Type your message into the input field.</li>
              <li>Choose hex delimiter and case options.</li>
              <li>Copy the generated hex output.</li>
            </ol>
          </Card>
          <Card title="Decode Base64">
            <ol className="list-decimal pl-5 text-slate-700 text-sm space-y-1">
              <li>Go to the Base64 & URL card.</li>
              <li>Paste any Base64 string into the “Base64 to Text” field.</li>
              <li>Click copy to save the decoded plain text.</li>
            </ol>
          </Card>
          <Card title="ROT13 a message">
            <ol className="list-decimal pl-5 text-slate-700 text-sm space-y-1">
              <li>Go to the ROT & Unicode card.</li>
              <li>Type or paste your text.</li>
              <li>Set the slider to 13 (or another value).</li>
              <li>Copy the obfuscated text for puzzles or forums.</li>
            </ol>
          </Card>
        </div>
      </Section>

      {/* FAQ */}
      <Section id="faq" title="FAQ">
        <div className="grid gap-5 md:grid-cols-2">
          {[
            {
              q: "Do you store my input?",
              a: "No. Everything runs in your browser. There are no network calls for the translators.",
            },
            {
              q: "Can I link to a specific tool?",
              a: "Yes. Use the section anchors like #translators. If you want deep linking into a specific card, I can add URL params.",
            },
            {
              q: "Can I use these offline?",
              a: "If your browser has cached the page, the translators will continue to work offline.",
            },
            {
              q: "Can you add Hashing or QR?",
              a: "Yes. SHA family, MD5, and QR encode/decode can be added next.",
            },
          ].map((item, idx) => (
            <Card key={idx} title={item.q}>
              <p className="text-slate-700">{item.a}</p>
            </Card>
          ))}
        </div>
      </Section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 sm:flex-row sm:px-6 lg:px-8">
          <p className="text-sm text-slate-600">
            © {new Date().getFullYear()} Code Translators. All rights reserved.
          </p>
          <a
            href="#translators"
            className="rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-sky-700"
          >
            Open translators
          </a>
        </div>
      </footer>

      {/* JSON-LD for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "Code Translators",
            url: "https://codetranslators.com",
            description:
              "Free, fast, and accurate code translators. Convert text to Morse, Binary, Hex, Base64, URL encode or decode, ROT13 or custom Caesar, and inspect Unicode. Copy with one click.",
            potentialAction: {
              "@type": "SearchAction",
              target: "https://codetranslators.com/?q={search_term_string}",
              "query-input": "required name=search_term_string",
            },
            mainEntity: [
              {
                "@type": "WebPage",
                name: "Translators",
                url: "https://codetranslators.com/#translators",
                description:
                  "Morse, Binary, Hex, Base64, URL, ROT, Unicode tools.",
              },
              {
                "@type": "WebPage",
                name: "Features",
                url: "https://codetranslators.com/#features",
                description:
                  "Speed, privacy, accessibility, and advanced options.",
              },
              {
                "@type": "WebPage",
                name: "Guides",
                url: "https://codetranslators.com/#guides",
                description:
                  "Practical explanations for encoding and decoding.",
              },
              {
                "@type": "WebPage",
                name: "Examples",
                url: "https://codetranslators.com/#examples",
                description:
                  "Common conversions for Morse, Binary, Hex, Base64, URL, ROT.",
              },
              {
                "@type": "WebPage",
                name: "Benefits",
                url: "https://codetranslators.com/#benefits",
                description:
                  "Why professionals and learners use Code Translators.",
              },
              {
                "@type": "WebPage",
                name: "Common Questions",
                url: "https://codetranslators.com/#common-questions",
                description: "Direct answers to frequently asked questions.",
              },
              {
                "@type": "WebPage",
                name: "Use Cases",
                url: "https://codetranslators.com/#use-cases",
                description: "When and why you need a code translator.",
              },
              {
                "@type": "WebPage",
                name: "Step-by-step Guides",
                url: "https://codetranslators.com/#how-to",
                description: "Quick instructions for common tasks.",
              },
              {
                "@type": "WebPage",
                name: "FAQ",
                url: "https://codetranslators.com/#faq",
                description:
                  "Frequently asked questions about privacy, features, and roadmap.",
              },
            ],
          }),
        }}
      />
    </div>
  );
}
