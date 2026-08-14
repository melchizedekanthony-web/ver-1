'use client';

import Link from 'next/link';
import { ArrowLeft, Compass } from 'lucide-react';

const EFFECTIVE_DATE = 'August 14, 2026';
const CONTACT_EMAIL = 'support@wannagoapp.com'; // TODO: replace with your real support address

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#0A0C10] text-[#E2E8F0]">
      <header className="bg-[#12151E]/95 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3 max-w-3xl">
          <Link href="/profile" className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-[#DC2626]" />
            <h1 className="text-lg font-bold text-white">Privacy Policy</h1>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 pb-24">
        <p className="text-sm text-[#94A3B8] mb-8">Effective date: {EFFECTIVE_DATE}</p>

        <div className="space-y-8 text-sm leading-relaxed">
          <section>
            <p>
              WannaGo ("WannaGo," "we," "us," or "our") operates a mobile and web application that helps people find
              nearby activity partners in real time. This Privacy Policy explains what information we collect, how we
              use it, and the choices you have. By creating an account or using WannaGo, you agree to the collection
              and use of information as described here. If you don't agree, please don't use the app.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">1. Information We Collect</h2>
            <p className="font-semibold text-white mt-3 mb-1">Account & profile information</p>
            <p>
              Name, email address, date of birth, gender, password (stored in hashed form, never in plain text),
              profile photo, activity interests, fitness level, and other details you choose to add to your profile.
            </p>
            <p className="font-semibold text-white mt-3 mb-1">Location data</p>
            <p>
              WannaGo's core feature is showing you nearby people who are also actively looking for an activity
              partner ("broadcasting"). When you choose to broadcast, we collect your device's real-time GPS
              coordinates and use them to find and show you other users broadcasting within your selected radius, and
              to show those other users your approximate distance from them. We only collect precise location while
              you are actively broadcasting or otherwise using location-dependent features — we do not track your
              location in the background when the app is closed or when you're not broadcasting.
            </p>
            <p className="font-semibold text-white mt-3 mb-1">Content you create</p>
            <p>
              Messages you send to other users, photos and videos you upload, activity plans you create, and reviews
              or ratings you leave for meetup partners.
            </p>
            <p className="font-semibold text-white mt-3 mb-1">Usage & device information</p>
            <p>
              Basic technical information such as IP address, browser/device type, and how you interact with the app,
              collected automatically to help us operate and secure the service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">2. How We Use Information</h2>
            <p>We use the information above to:</p>
            <ul className="list-disc list-inside space-y-1 mt-2 text-[#E2E8F0]/90">
              <li>Match you with compatible, nearby activity partners and operate the live radar/broadcast feature</li>
              <li>Enable messaging between matched users</li>
              <li>Power the AI Concierge feature, which sends your activity request to OpenAI's API to generate
                suggestions (see "Third Parties" below)</li>
              <li>Show trust signals like ratings and review counts to help you make informed decisions about who to
                meet</li>
              <li>Operate account security, fraud prevention, and safety features (including the in-app Emergency
                Exit / cancel-meetup tool)</li>
              <li>Maintain, improve, and troubleshoot the app</li>
              <li>Communicate with you about your account or the service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">3. What We Share With Other Users</h2>
            <p>
              WannaGo is a social app — by design, some information is visible to other users. When you broadcast or
              appear in someone's matches, other users can see your name, profile photo, activity interests, your
              approximate distance from them, and your public ratings/reviews. They cannot see your exact GPS
              coordinates, email address, or any account information you haven't chosen to make public.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">4. Third Parties We Work With</h2>
            <p>We use a small number of service providers to operate WannaGo. We do not sell your personal information.</p>
            <ul className="list-disc list-inside space-y-1 mt-2 text-[#E2E8F0]/90">
              <li><strong className="text-white">Database hosting (MongoDB):</strong> stores your account and app data securely.</li>
              <li><strong className="text-white">OpenAI:</strong> if you use the AI Concierge, your message to it is sent to OpenAI's API to
                generate a response, subject to OpenAI's own data usage terms.</li>
              <li><strong className="text-white">Map tiles (CartoDB / OpenStreetMap):</strong> used to render the radar map; your approximate
                map position is sent to render map tiles for your view.</li>
              <li><strong className="text-white">Infrastructure/hosting providers</strong> that keep the app online.</li>
            </ul>
            <p className="mt-2">
              We may also disclose information if required by law, to protect the rights, property, or safety of
              WannaGo, our users, or the public, or in connection with a merger, acquisition, or sale of assets.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">5. Data Retention</h2>
            <p>
              We retain your account information for as long as your account is active. Messages and activity history
              are retained to provide the service (e.g. your conversation history, past meetups, and ratings). You can
              request deletion of your account and associated personal data at any time (see Section 7).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">6. Data Security</h2>
            <p>
              We use reasonable administrative and technical safeguards to protect your information, including
              password hashing and authenticated sessions. However, no method of transmission or storage is 100%
              secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">7. Your Choices & Rights</h2>
            <ul className="list-disc list-inside space-y-1 mt-2 text-[#E2E8F0]/90">
              <li>You control when you broadcast your location — you can stop at any time from the Radar screen.</li>
              <li>You can edit or remove information from your profile at any time.</li>
              <li>You can adjust who can see your activity and location in your Privacy Settings.</li>
              <li>You can request a copy of your data or deletion of your account by contacting us at {CONTACT_EMAIL}.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">8. Children's Privacy</h2>
            <p>
              WannaGo is intended for users who are 18 years of age or older. We do not knowingly collect information
              from anyone under 18. If we learn that we've collected information from someone under 18, we will
              delete it.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">9. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. If we make material changes, we'll notify you
              through the app or by email before they take effect.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">10. Contact Us</h2>
            <p>Questions about this Privacy Policy? Reach us at {CONTACT_EMAIL}.</p>
          </section>

          <p className="text-xs text-[#94A3B8] pt-6 border-t border-white/10">
            This document is a general-purpose template and has not been reviewed by a lawyer. Please have qualified
            legal counsel review it — especially the location-data and third-party sections — before relying on it
            for a live product with real users.
          </p>
        </div>
      </main>
    </div>
  );
}
