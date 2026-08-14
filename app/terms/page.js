'use client';

import Link from 'next/link';
import { ArrowLeft, Compass } from 'lucide-react';

const EFFECTIVE_DATE = 'August 14, 2026';
const CONTACT_EMAIL = 'support@wannagoapp.com'; // TODO: replace with your real support address
const COMPANY_NAME = 'WannaGo'; // TODO: replace with your registered legal entity name if you form one
const GOVERNING_STATE = '[YOUR STATE/JURISDICTION]'; // TODO: fill in before publishing

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-[#0A0C10] text-[#E2E8F0]">
      <header className="bg-[#12151E]/95 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3 max-w-3xl">
          <Link href="/profile" className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-[#DC2626]" />
            <h1 className="text-lg font-bold text-white">Terms of Service</h1>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 pb-24">
        <p className="text-sm text-[#94A3B8] mb-8">Effective date: {EFFECTIVE_DATE}</p>

        <div className="space-y-8 text-sm leading-relaxed">
          <section>
            <p>
              These Terms of Service ("Terms") govern your access to and use of WannaGo (the "Service"). By creating
              an account or using the Service, you agree to these Terms. If you do not agree, do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">1. Eligibility</h2>
            <p>
              You must be at least 18 years old to use WannaGo. By creating an account, you represent that you meet
              this requirement and that all information you provide is accurate.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">2. The Service</h2>
            <p>
              WannaGo helps users find and connect with nearby people for shared activities, using a live,
              location-based "radar" broadcast feature, messaging, activity scheduling, and an AI-assisted concierge.
              We may add, change, or remove features at any time.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">3. Your Account</h2>
            <p>
              You're responsible for maintaining the confidentiality of your login credentials and for all activity
              under your account. Notify us immediately if you suspect unauthorized access.
            </p>
          </section>

          <section className="bg-[#DC2626]/10 border border-[#DC2626]/30 rounded-2xl p-4">
            <h2 className="text-lg font-bold text-white mb-3">4. In-Person Meetups — Please Read Carefully</h2>
            <p>
              WannaGo helps you find and arrange meetups with other users, but <strong className="text-white">we do
              not conduct criminal background checks, identity verification, or any other vetting of users</strong>,
              and we cannot guarantee the identity, intentions, or conduct of any person you meet through the app.
              You are solely responsible for your own safety and the decisions you make when interacting with, and
              meeting, other users.
            </p>
            <p className="mt-3">By using WannaGo's meetup features, you agree to:</p>
            <ul className="list-disc list-inside space-y-1 mt-2 text-[#E2E8F0]/90">
              <li>Meet new connections in public, well-lit locations, especially for a first meetup</li>
              <li>Tell a friend or family member where you're going and who you're meeting</li>
              <li>Never share financial information, passwords, or other sensitive personal data with other users</li>
              <li>Trust your judgment — use the in-app Emergency Exit / cancel-meetup feature, and leave immediately,
                if a situation feels unsafe</li>
              <li>Contact local emergency services directly if you are ever in danger — WannaGo is not a substitute
                for emergency services and cannot dispatch help on your behalf</li>
            </ul>
            <p className="mt-3">
              <strong className="text-white">You assume all risk</strong> arising from your interactions with other
              users and any in-person meetups arranged through the Service, to the fullest extent permitted by law.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">5. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc list-inside space-y-1 mt-2 text-[#E2E8F0]/90">
              <li>Harass, threaten, stalk, or endanger other users</li>
              <li>Impersonate another person or misrepresent your identity, age, or affiliation</li>
              <li>Post false, misleading, or defamatory reviews</li>
              <li>Use the Service for any unlawful purpose, or to solicit, advertise, or scam other users</li>
              <li>Attempt to access another user's account or interfere with the Service's operation or security</li>
              <li>Scrape, reverse-engineer, or misuse the Service or its data</li>
            </ul>
            <p className="mt-2">
              We may suspend or terminate accounts that violate these Terms, at our discretion, with or without
              notice.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">6. User Content</h2>
            <p>
              You retain ownership of content you post (photos, messages, reviews, profile information), but you
              grant WannaGo a license to host, display, and distribute it as necessary to operate the Service. You're
              responsible for the content you post and confirm you have the right to share it.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">7. Radar Boosts & Virtual Credits</h2>
            <p>
              WannaGo may offer optional virtual credits ("Radar Boosts") that temporarily expand your visibility or
              search radius. Credits have no cash value, are non-transferable, and are subject to change or removal
              at our discretion. If and when real payments are introduced for credits or subscriptions, updated terms
              covering pricing, billing, and refunds will be provided before you're charged.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">8. Termination</h2>
            <p>
              You may stop using the Service and delete your account at any time. We may suspend or terminate your
              access to the Service for violation of these Terms or for any other reason, at our discretion.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">9. Disclaimer of Warranties</h2>
            <p>
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE," WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED,
              INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT. WE DO
              NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE, OR THAT MATCHES OR
              INFORMATION PROVIDED THROUGH THE SERVICE WILL BE ACCURATE OR SAFE.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">10. Limitation of Liability</h2>
            <p>
              TO THE FULLEST EXTENT PERMITTED BY LAW, {COMPANY_NAME.toUpperCase()} SHALL NOT BE LIABLE FOR ANY
              INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF DATA, PROFITS, OR
              GOODWILL, ARISING FROM YOUR USE OF THE SERVICE OR ANY INTERACTION OR MEETUP WITH ANOTHER USER, EVEN IF
              ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">11. Governing Law</h2>
            <p>
              These Terms are governed by the laws of {GOVERNING_STATE}, without regard to conflict-of-law
              principles.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">12. Changes to These Terms</h2>
            <p>
              We may update these Terms from time to time. If we make material changes, we'll notify you through the
              app or by email before they take effect. Continued use of the Service after changes take effect
              constitutes acceptance of the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">13. Contact Us</h2>
            <p>Questions about these Terms? Reach us at {CONTACT_EMAIL}.</p>
          </section>

          <p className="text-xs text-[#94A3B8] pt-6 border-t border-white/10">
            This document is a general-purpose template and has not been reviewed by a lawyer. Please have qualified
            legal counsel review it — especially Sections 4 (In-Person Meetups), 9, and 10 (liability) — and fill in
            the bracketed placeholders (governing state, legal entity name, support email) before relying on it for a
            live product with real users and real-world meetups.
          </p>
        </div>
      </main>
    </div>
  );
}
