import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { QRCodeSVG } from 'qrcode.react';
import { Download } from 'lucide-react';
import { downloadFile, admissionStatus } from './bookingTools';

export function ticketDocument(booking) {
  const content = renderToStaticMarkup(
    <main>
      <header>
        <b>LOCALTIX</b>
        <h1>Your event tickets</h1>
        <p>
          One QR code admits one person. Entry is verified at the door;
          cancelled tickets are invalid.
        </p>
      </header>
      {(booking.tickets || []).map((ticket, index) => (
        <article key={ticket.id}>
          <div>
            <p>
              ADMISSION {index + 1} OF {booking.quantity}
            </p>
            <h2>{booking.eventTitle}</h2>
            <dl>
              <dt>Date & time</dt>
              <dd>
                {new Date(booking.startsAt).toLocaleString('en-IN', {
                  dateStyle: 'full',
                  timeStyle: 'short',
                })}
              </dd>
              <dt>Venue</dt>
              <dd>{booking.venue}</dd>
              <dt>Guest</dt>
              <dd>{booking.customerName}</dd>
              <dt>Booking reference</dt>
              <dd>{booking.reference}</dd>
              <dt>Booking total</dt>
              <dd>
                INR {Number(booking.total).toFixed(2)} for {booking.quantity}{' '}
                ticket(s)
              </dd>
              <dt>Status when downloaded</dt>
              <dd>
                {booking.status} · {admissionStatus(booking)}
              </dd>
            </dl>
          </div>
          <div className="qr">
            <QRCodeSVG
              value={ticket.qrPayload}
              size={200}
              level="H"
              includeMargin
            />
            <b>{ticket.seatLabel}</b>
            <p>
              {ticket.status === 'CHECKED_IN'
                ? 'Already checked in'
                : 'General admission · one entry'}
            </p>
          </div>
        </article>
      ))}
    </main>,
  );
  return (
    '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>LocalTix tickets</title><style>body{font:15px/1.5 system-ui,sans-serif;background:#f2f5ef;color:#1d3124;margin:24px}main{max-width:850px;margin:auto}header{margin-bottom:24px}article{background:white;border:1px solid #b9c7b7;border-radius:16px;padding:28px;display:flex;gap:28px;justify-content:space-between;margin-bottom:24px;break-inside:avoid}h2{margin:0 0 20px;overflow-wrap:anywhere}dt{font-size:11px;text-transform:uppercase;color:#586654;margin-top:12px}dd{margin:0;overflow-wrap:anywhere}.qr{text-align:center;align-self:center;flex-shrink:0}.qr b{display:block}.qr p{font-size:12px}button{display:block;margin:0 auto 24px;background:#294638;color:white;border:0;padding:14px 20px;border-radius:8px;cursor:pointer}@media(max-width:600px){article{flex-direction:column}}@media print{body{margin:0;background:white}button{display:none}article{box-shadow:none;border-radius:0}}</style></head><body><button onclick="window.print()">Print / Save as PDF</button>' +
    content +
    '</body></html>'
  );
}
export default function TicketDownload({ booking, onError }) {
  if (booking.status === 'CANCELLED' || !booking.tickets?.length) return null;
  return (
    <div className="download-ticket">
      <button
        className="secondary-btn"
        onClick={() => {
          try {
            downloadFile(
              ticketDocument(booking),
              'text/html;charset=utf-8',
              `LocalTix-${booking.reference}.html`,
            );
          } catch {
            onError('Could not download the tickets. Please try again.');
          }
        }}
      >
        <Download size={16} /> Download tickets
      </button>
      <small>
        Offline ticket file with QR codes. Open it to print or save as PDF.
      </small>
    </div>
  );
}
