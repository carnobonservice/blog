import Link from "next/link";
import { ArrowLeft, Bell, CalendarDays, Compass, Mail, type LucideIcon } from "lucide-react";

const content: Record<"discover" | "events" | "notifications" | "messages", { icon: LucideIcon; eyebrow: string; title: string; description: string; action: string }> = {
  discover: { icon: Compass, eyebrow: "EXPLORE", title: "Find your people", description: "Discover creators, conversations, and communities that match what you care about.", action: "Browse people" },
  events: { icon: CalendarDays, eyebrow: "COMMUNITY", title: "What’s happening next", description: "Join conversations, creator meetups, and small gatherings around your favorite ideas.", action: "Explore events" },
  notifications: { icon: Bell, eyebrow: "ACTIVITY", title: "You’re all caught up", description: "Likes, replies, follows, and invitations will appear here as your community grows.", action: "Discover posts" },
  messages: { icon: Mail, eyebrow: "INBOX", title: "Your conversations", description: "Start a conversation with someone you follow and build a closer community.", action: "Discover people" },
};

export function SocialPlaceholderPage({ page }: { page: keyof typeof content }) {
  const { icon: Icon, eyebrow, title, description, action } = content[page];
  const destination = page === "events" ? "/events" : "/discover";

  return <main className="min-h-[calc(100vh-4rem)] bg-[#f8f8fb] px-4 py-8 sm:px-6"><section className="mx-auto max-w-2xl rounded-3xl border border-black/5 bg-white p-7 text-center shadow-sm sm:p-12"><Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-violet-700"><ArrowLeft className="size-4" /> Back to home</Link><div className="mx-auto mt-9 grid size-16 place-items-center rounded-2xl bg-violet-100 text-violet-700"><Icon className="size-7" /></div><p className="mt-6 text-xs font-bold tracking-[0.18em] text-violet-600">{eyebrow}</p><h1 className="mt-2 text-3xl font-bold tracking-tight">{title}</h1><p className="mx-auto mt-4 max-w-md leading-6 text-muted-foreground">{description}</p><Link href={destination} className="mt-8 inline-flex rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700">{action}</Link></section></main>;
}
