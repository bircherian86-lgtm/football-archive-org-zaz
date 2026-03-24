'use client';

import { Mail, Send, Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// A simple component for a contact item
function ContactItem({ icon, label, value, href, subValue }: { icon: React.ReactNode, label: string, value: string, href?: string, subValue?: string }) {
    const content = href ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            {value}
        </a>
    ) : (
        <span>{value}</span>
    );

    return (
        <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                {icon}
            </div>
            <div>
                <p className="font-semibold">{label}</p>
                <div className="text-muted-foreground">
                    {content}
                    {subValue && <span className="ml-2">{subValue}</span>}
                </div>
            </div>
        </div>
    );
}


export default function ContactPage() {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-12 md:px-6">
      <div className="mb-12 flex flex-col items-center text-center">
        <Info className="mb-4 h-16 w-16 text-primary"/>
        <h1 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-primary">
          Info & Contact
        </h1>
        <p className="mt-4 max-w-xl text-muted-foreground">
          Get in touch or find more information here.
        </p>
      </div>

      <Card className="border-white/10 bg-black/40 backdrop-blur-lg shadow-xl shadow-black/40">
        <CardHeader>
          <CardTitle className="text-primary">Contact Details</CardTitle>
          <CardDescription>
            For any inquiries, credits, or takedown requests, please use the channels below.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <ContactItem 
                icon={<Mail size={20} />}
                label="Email"
                value="bircherian86@gmail.com"
                href="mailto:bircherian86@gmail.com"
            />
            <ContactItem 
                icon={<Send size={20} />}
                label="Telegram"
                value="Telegram Server"
                href="https://t.me/+mh1OalrXtj83NDc0"
                subValue="(@zazsocool)"
            />
            <ContactItem 
                icon={
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M20.283,3.717a1.06,1.06,0,0,0-1.5,0L13.05,9.451a8.438,8.438,0,0,0-4.32,0L3.217,3.717a1.06,1.06,0,0,0-1.5,0,1.06,1.06,0,0,0,0,1.5l4.383,4.383a8.4,8.4,0,0,0-2.316,5.817A1.06,1.06,0,0,0,5.1,16.733a8.384,8.384,0,0,0,6.9,4.267,8.384,8.384,0,0,0,6.9-4.267,1.06,1.06,0,0,0,1.316-1.316,8.4,8.4,0,0,0-2.316-5.817l4.383-4.383A1.06,1.06,0,0,0,20.283,3.717ZM8.417,14.633a1.06,1.06,0,1,1,1.06-1.06A1.06,1.06,0,0,1,8.417,14.633Zm7.166,0a1.06,1.06,0,1,1,1.06-1.06A1.06,1.06,0,0,1,15.583,14.633Z" />
                    </svg>
                }
                label="Discord"
                value="LunaLikesSLS"
            />
        </CardContent>
      </Card>
      
      <Card className="mt-8 border-white/10 bg-black/40 backdrop-blur-lg shadow-xl shadow-black/40">
        <CardHeader>
            <CardTitle className="text-primary/90">Credits & Takedowns</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground">
                If you are the owner of any content and would like it to be removed or would like to be properly credited, please do not hesitate to contact me via one of the methods above. I will respond as soon as possible.
            </p>
        </CardContent>
      </Card>

      <Card className="mt-8 border-white/10 bg-black/40 backdrop-blur-lg shadow-xl shadow-black/40">
        <CardHeader>
          <CardTitle className="text-primary/90">Rules &amp; Terms (Mini)</CardTitle>
          <CardDescription>
            Short overview of how content and behavior are handled on this site.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div>
            <p className="font-semibold text-primary">1. Acceptance of Terms</p>
            <p>
              By using this website, you agree to these rules and terms. If you do not agree, please do not use the site.
            </p>
          </div>

          <div>
            <p className="font-semibold text-primary">2. Copyright &amp; Ownership</p>
            <p>
              Content that includes the official logo/watermark is owned by <span className="font-semibold">zaz</span>. All other clips and materials remain the property of their respective owners. We do not claim ownership of third‑party content that appears here.
            </p>
          </div>

          <div>
            <p className="font-semibold text-primary">3. Limited Use</p>
            <p>
              You may not copy, redistribute, modify, or republish logo‑branded content without written permission. Unauthorized use may result in removal requests or further action.
            </p>
          </div>

          <div>
            <p className="font-semibold text-primary">4. Third‑Party Content &amp; Takedowns</p>
            <p>
              This site may include embedded videos, clips, references, and user submissions. All rights to third‑party materials belong to their original creators. If you believe your copyrighted material has been used improperly, contact{' '}
              <a href="mailto:bircherian86@gmail.com" className="text-primary hover:underline">
                bircherian86@gmail.com
              </a>{' '}
              and we will review and remove content where appropriate.
            </p>
          </div>

          <div>
            <p className="font-semibold text-primary">5. Community Rules</p>
            <p>
              Users must not harass, threaten, or abuse others; post illegal, harmful, or explicit content; impersonate others; spam or advertise without permission; or attempt to hack, exploit, or disrupt the site. We reserve the right to remove content or ban users at our discretion.
            </p>
          </div>

          <div>
            <p className="font-semibold text-primary">6. No Warranties &amp; Liability</p>
            <p>
              This website is provided &quot;as is&quot; without guarantees of accuracy, availability, or reliability. To the fullest extent permitted by law, zaz / Football Clips Archive is not liable for damages arising from use of the site, user‑generated content, or third‑party links and services.
            </p>
          </div>

          <div>
            <p className="font-semibold text-primary">7. Changes</p>
            <p>
              These rules and terms may be updated at any time. Continued use of the site means you accept the latest version.
            </p>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
