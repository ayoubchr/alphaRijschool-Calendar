import { FaFacebookF, FaInstagram, FaTiktok, FaWhatsapp } from "react-icons/fa6";
import { SOCIALS } from "@/lib/site";

const ICONS = {
  whatsapp: FaWhatsapp,
  instagram: FaInstagram,
  tiktok: FaTiktok,
  facebook: FaFacebookF,
} as const;

export function SocialIcons({ tone = "on-red" }: { tone?: "on-red" | "on-dark" }) {
  const className =
    tone === "on-red"
      ? "inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white hover:text-brand-red"
      : "inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-brand-red";

  return (
    <ul className="flex items-center gap-2">
      {SOCIALS.map((social) => {
        const Icon = ICONS[social.icon];
        return (
          <li key={social.label}>
            <a href={social.href} target="_blank" rel="noreferrer" aria-label={social.label} className={className}>
              <Icon className="h-3.5 w-3.5" aria-hidden />
            </a>
          </li>
        );
      })}
    </ul>
  );
}
