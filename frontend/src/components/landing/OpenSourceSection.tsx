'use client';
import Link from 'next/link';

export default function OpenSourceSection() {
  return (
    <>
      {/* Open Source Strip */}
      <section className="bg-surface border-y border-border py-12 px-6">
        <div className="max-w-[1100px] mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <p className="section-label mb-2">Open Source</p>
            <h3 className="font-serif text-2xl text-text-1 mb-2">Inspect every line. Fork freely.</h3>
            <p className="text-sm text-text-3 max-w-[480px] leading-relaxed">
              Chronos Vault is MIT licensed. The smart contracts, factory, and this interface are fully open sourced on GitHub.
              Security researchers, auditors, and the curious are all welcome.
            </p>
          </div>
          <div className="shrink-0 w-full md:w-auto">
            <a href="https://github.com/timburman/Chronos-Vault" target="_blank" rel="noopener noreferrer" className="block w-full md:w-auto">
              <button className="btn-secondary w-full justify-center">View on GitHub</button>
            </a>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-bg py-28 px-6 text-center">
        <p className="section-label mb-4">Start now</p>
        <h2 className="font-serif text-4xl md:text-5xl text-text-1 max-w-[600px] mx-auto mb-6 leading-tight">
          Secure your legacy in under five minutes.
        </h2>
        <p className="text-base text-text-3 mb-10 max-w-[500px] mx-auto">
          No sign-up. No custody. Just your wallet and a smart contract.
        </p>
        <Link href="/dashboard">
          <button className="btn-accent text-base py-3.5 px-8">
            Launch Your Vault
          </button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6 bg-bg-alt">
        <div className="max-w-[1100px] mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
          <span className="font-serif text-text-3 text-sm">Chronos Vault</span>
          <span className="text-xs text-text-4">MIT License · Non-custodial · Open Source</span>
        </div>
      </footer>
    </>
  );
}
