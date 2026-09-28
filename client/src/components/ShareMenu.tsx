import { Check, Clock3, Copy, Mail, Share2, Twitter } from "lucide-react";
import { useState } from "react";
import { api, type ShareResponse } from "@/lib/api";

type ShareMenuProps = {
  resourceType: "item" | "mood_board";
  resourceId: number;
  title: string;
  compact?: boolean;
};

const expiryOptions = [
  { value: "", label: "Never expires" },
  { value: "1", label: "Expires in 1 day" },
  { value: "7", label: "Expires in 7 days" },
  { value: "30", label: "Expires in 30 days" },
];

export default function ShareMenu({ resourceType, resourceId, title, compact = false }: ShareMenuProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [working, setWorking] = useState(false);
  const [expiryDays, setExpiryDays] = useState("");
  const [lastShare, setLastShare] = useState<ShareResponse | null>(null);

  const createLink = async (): Promise<string> => {
    const days = expiryDays ? Number(expiryDays) : null;
    const response: ShareResponse = resourceType === "item"
      ? await api.shareItem(resourceId, days)
      : await api.shareMoodBoard(resourceId, days);
    setLastShare(response);
    return `${window.location.origin}${response.path}`;
  };

  const copyLink = async () => {
    setWorking(true);
    try {
      const url = await createLink();
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } finally {
      setWorking(false);
    }
  };

  const nativeShare = async () => {
    setWorking(true);
    try {
      const url = await createLink();
      if (navigator.share) await navigator.share({ title, text: `A Trendly ${resourceType === "item" ? "discovery" : "mood board"}: ${title}`, url });
      else await navigator.clipboard.writeText(url);
      setCopied(!navigator.share);
      window.setTimeout(() => setCopied(false), 1800);
    } finally {
      setWorking(false);
    }
  };

  const socialShare = async (network: "x" | "pinterest" | "email") => {
    setWorking(true);
    try {
      const url = await createLink();
      const encodedUrl = encodeURIComponent(url);
      const encodedTitle = encodeURIComponent(title);
      const target = network === "x"
        ? `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`
        : network === "pinterest"
          ? `https://pinterest.com/pin/create/button/?url=${encodedUrl}&description=${encodedTitle}`
          : `mailto:?subject=${encodedTitle}&body=${encodedUrl}`;
      window.open(target, network === "email" ? "_self" : "_blank", "noopener,noreferrer");
      setOpen(false);
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className={`share-wrap ${compact ? "share-wrap-compact" : ""}`}>
      <button type="button" className="share-trigger" aria-expanded={open} onClick={() => setOpen(value => !value)}>
        {copied ? <Check size={16} /> : <Share2 size={16} />}<span>{copied ? "Link copied" : "Share"}</span>
      </button>
      {open && <div className="share-menu" role="menu">
        <p className="share-menu-label">Share this {resourceType === "item" ? "discovery" : "board"}</p>
        <label className="share-expiry"><Clock3 size={14} /><span>Link lifetime</span><select aria-label="Share link expiration" value={expiryDays} onChange={event => { setExpiryDays(event.target.value); setLastShare(null); }} disabled={working}>{expiryOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
        {lastShare?.expires_at && <p className="share-expiry-note">This link expires {new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(lastShare.expires_at))}.</p>}
        <button type="button" onClick={() => void nativeShare()} disabled={working} role="menuitem"><Share2 size={15} />Share from device</button>
        <button type="button" onClick={() => void copyLink()} disabled={working} role="menuitem"><Copy size={15} />Copy direct link</button>
        <button type="button" onClick={() => void socialShare("pinterest")} disabled={working} role="menuitem"><span className="social-letter">P</span>Share to Pinterest</button>
        <button type="button" onClick={() => void socialShare("x")} disabled={working} role="menuitem"><Twitter size={15} />Share to X</button>
        <button type="button" onClick={() => void socialShare("email")} disabled={working} role="menuitem"><Mail size={15} />Send by email</button>
      </div>}
    </div>
  );
}
