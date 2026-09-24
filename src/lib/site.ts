export const PHONE = "+32 486 29 53 75";
export const PHONE_HREF = "tel:+32486295375";
export const EMAIL = "rijschoolalpha@gmail.com";
export const ADDRESS = "Turnhoutsebaan 76B, 2100 Antwerpen";
export const MAP_HREF = "https://maps.google.com/?q=Turnhoutsebaan+76B,+2100+Antwerpen";
export const WHATSAPP_HREF = "https://wa.me/32486295375";

export const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/over-ons", label: "Over ons" },
  { href: "/theorie", label: "Theorie" },
  { href: "/tarieven-pakketten", label: "Tarieven" },
  { href: "/veelgestelde-vragen", label: "FAQ" },
  { href: "/contact", label: "Contact" },
] as const;

export const SOCIALS = [
  { href: WHATSAPP_HREF, label: "WhatsApp", icon: "whatsapp" },
  { href: "https://www.instagram.com/rijschoolalpha/", label: "Instagram", icon: "instagram" },
  { href: "https://www.tiktok.com/@alpha.rijschool1", label: "TikTok", icon: "tiktok" },
  { href: "https://www.facebook.com/alpharijschool.be", label: "Facebook", icon: "facebook" },
] as const;
