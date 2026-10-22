import React from 'react';
import { QrCode } from 'lucide-react';
export default function Footer() {
  return (
    <footer className="footer">
      <a className="brand" href="#">
        <span className="brandmark">
          <QrCode size={18} />
        </span>
        local<span className="brand-light">tix</span>
        <span className="brand-dot">.</span>
      </a>
      <span>Made for the love of local.</span>
      <span>© 2026 LOCALTIX</span>
    </footer>
  );
}
