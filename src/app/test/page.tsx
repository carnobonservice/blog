"use client";

import { useCurrentAccount, useCurrentNetwork } from "@mysten/dapp-kit-react";
import { Play, RotateCcw, Terminal } from "lucide-react";
import { useCallback, useState } from "react";

const starterCode = `// This code runs only in your browser.
log("Testing the local sandbox");

const numbers = [1, 2, 3, 4];
const total = numbers.reduce((sum, number) => sum + number, 0);

return {
  total,
  wallet: account?.address ?? "No wallet connected",
  network,
};`;

type ConsoleEntry = {
  type: "log" | "result" | "error";
  message: string;
};

function formatValue(value: unknown) {
  if (typeof value === "string") return value;

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export default function TestPage() {
  const account = useCurrentAccount();
  const network = useCurrentNetwork();
  const [code, setCode] = useState(starterCode);
  const [entries, setEntries] = useState<ConsoleEntry[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runCode = useCallback(async () => {
    setIsRunning(true);
    const nextEntries: ConsoleEntry[] = [];
    const log = (...values: unknown[]) => {
      nextEntries.push({
        type: "log",
        message: values.map(formatValue).join(" "),
      });
    };

    try {
      // This intentionally executes only text entered on this local test page.
      const execute = new Function(
        "account",
        "network",
        "log",
        `return (async () => {\n${code}\n})()`,
      ) as (
        currentAccount: typeof account,
        currentNetwork: typeof network,
        logger: (...values: unknown[]) => void,
      ) => Promise<unknown>;

      const result = await execute(account, network, log);
      nextEntries.push({ type: "result", message: formatValue(result) });
    } catch (error) {
      nextEntries.push({
        type: "error",
        message: error instanceof Error ? error.stack ?? error.message : String(error),
      });
    } finally {
      setEntries(nextEntries);
      setIsRunning(false);
    }
  }, [account, code, network]);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Developer tools</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Test runner</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Run small browser-side JavaScript snippets and inspect the output without leaving this page.
          </p>
        </div>
        <div className="rounded-lg border bg-card px-3 py-2 text-sm">
          <span className="text-muted-foreground">Network: </span>
          <span className="font-medium">{network}</span>
        </div>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <StatusCard label="Wallet" value={account ? "Connected" : "Not connected"} />
        <StatusCard label="Address" value={account?.address ?? "Connect a wallet to test wallet context"} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-2 font-medium">
              <Terminal className="size-4" />
              Code
            </div>
            <button
              className="inline-flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              onClick={() => setCode(starterCode)}
              type="button"
            >
              <RotateCcw className="size-3.5" /> Reset
            </button>
          </div>
          <textarea
            aria-label="JavaScript test code"
            className="min-h-96 w-full resize-y bg-zinc-950 p-4 font-mono text-sm leading-6 text-zinc-100 outline-none"
            onChange={(event) => setCode(event.target.value)}
            spellCheck={false}
            value={code}
          />
          <div className="flex items-center justify-between border-t px-4 py-3">
            <p className="text-xs text-muted-foreground"><code>account</code>, <code>network</code>, and <code>log()</code> are available.</p>
            <button
              className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isRunning}
              onClick={runCode}
              type="button"
            >
              <Play className="size-4" /> {isRunning ? "Running…" : "Run code"}
            </button>
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h2 className="font-medium">Debug output</h2>
            {entries.length > 0 && (
              <button className="text-sm text-muted-foreground hover:text-foreground" onClick={() => setEntries([])} type="button">
                Clear
              </button>
            )}
          </div>
          <div aria-live="polite" className="min-h-96 bg-zinc-950 p-4 font-mono text-sm leading-6 text-zinc-100">
            {entries.length === 0 ? (
              <p className="text-zinc-500">Run code to see logs, a return value, or an error stack here.</p>
            ) : (
              <div className="space-y-4">
                {entries.map((entry, index) => (
                  <pre className={entry.type === "error" ? "whitespace-pre-wrap text-red-300" : entry.type === "result" ? "whitespace-pre-wrap text-emerald-300" : "whitespace-pre-wrap text-zinc-200"} key={`${entry.type}-${index}`}>
                    <span className="mr-2 select-none text-zinc-500">{entry.type === "result" ? "←" : entry.type === "error" ? "!" : ">"}</span>
                    {entry.message}
                  </pre>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      <p className="mt-5 text-xs text-muted-foreground">
        This is a local developer helper. Only run code you trust: snippets have the same browser access as this page.
      </p>
    </main>
  );
}

function StatusCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 truncate font-mono text-sm" title={value}>{value}</p>
    </div>
  );
}
