import { ArrowRight } from "@phosphor-icons/react/dist/csr/ArrowRight";
import { ArrowsLeftRight } from "@phosphor-icons/react/dist/csr/ArrowsLeftRight";
import { Check } from "@phosphor-icons/react/dist/csr/Check";
import { Copy } from "@phosphor-icons/react/dist/csr/Copy";
import { DownloadSimple } from "@phosphor-icons/react/dist/csr/DownloadSimple";
import { FileText } from "@phosphor-icons/react/dist/csr/FileText";
import { Fingerprint } from "@phosphor-icons/react/dist/csr/Fingerprint";
import { GlobeHemisphereWest } from "@phosphor-icons/react/dist/csr/GlobeHemisphereWest";
import { House } from "@phosphor-icons/react/dist/csr/House";
import { Info } from "@phosphor-icons/react/dist/csr/Info";
import { Lightning } from "@phosphor-icons/react/dist/csr/Lightning";
import { LockKey } from "@phosphor-icons/react/dist/csr/LockKey";
import { Moon } from "@phosphor-icons/react/dist/csr/Moon";
import { Receipt } from "@phosphor-icons/react/dist/csr/Receipt";
import { ShieldCheck } from "@phosphor-icons/react/dist/csr/ShieldCheck";
import { Sun } from "@phosphor-icons/react/dist/csr/Sun";
import { TerminalWindow } from "@phosphor-icons/react/dist/csr/TerminalWindow";
import { UploadSimple } from "@phosphor-icons/react/dist/csr/UploadSimple";
import { X } from "@phosphor-icons/react/dist/csr/X";
import { Hash } from "@phosphor-icons/react/dist/csr/Hash";

const icons = {
  home: House, file: FileText, receipt: Receipt, compare: ArrowsLeftRight,
  info: Info, lock: LockKey, arrow: ArrowRight, upload: UploadSimple,
  check: Check, different: X, copy: Copy, download: DownloadSimple,
  fingerprint: Fingerprint, shield: ShieldCheck, lightning: Lightning,
  globe: GlobeHemisphereWest, terminal: TerminalWindow, sun: Sun,
  moon: Moon, hash: Hash,
};
export type IconName = keyof typeof icons;

export function Icon({ name, className = "" }: { name: IconName; className?: string }) {
  const Glyph = icons[name];
  return <Glyph className={`icon ${className}`} size={20} weight="regular" aria-hidden="true" />;
}
