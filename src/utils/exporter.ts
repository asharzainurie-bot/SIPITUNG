import { Report } from '../types';

export function exportReportsToCSV(reports: Report[], filename = 'Rekap_Laporan_SIPITUNG.csv') {
  if (!reports || reports.length === 0) return;

  const headers = [
    'No Ticket',
    'Waktu Lapor',
    'Nama Pelapor',
    'No WhatsApp',
    'Alamat Kejadian',
    'Latitude',
    'Longitude',
    'Kategori',
    'Jenis Kejadian',
    'Waktu Kejadian',
    'Korban Meninggal',
    'Korban Luka Berat',
    'Korban Luka Ringan',
    'Korban Mengungsi',
    'Rumah Rusak',
    'Status',
    'Catatan Petugas',
    'Petugas Assigned',
    'Deskripsi'
  ];

  const rows = reports.map(r => [
    `"${r.ticketId}"`,
    `"${new Date(r.createdAt).toLocaleString('id-ID')}"`,
    `"${r.namaPelapor.replace(/"/g, '""')}"`,
    `"${r.noWhatsapp}"`,
    `"${r.alamat.replace(/"/g, '""')}"`,
    r.latitude,
    r.longitude,
    `"${r.kategori.toUpperCase()}"`,
    `"${r.jenisKejadian.toUpperCase()}"`,
    `"${r.waktuKejadian}"`,
    r.korban?.meninggal || 0,
    r.korban?.lukaBerat || 0,
    r.korban?.lukaRingan || 0,
    r.korban?.mengungsi || 0,
    r.korban?.rumahRusak || 0,
    `"${r.status.toUpperCase()}"`,
    `"${(r.catatanPetugas || '').replace(/"/g, '""')}"`,
    `"${(r.petugasAssigned || '').replace(/"/g, '""')}"`,
    `"${(r.deskripsi || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function printSingleReportPDF(report: Report) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const html = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <title>SIPITUNG - Tanda Bukti Laporan ${report.ticketId}</title>
      <style>
        body { font-family: 'Arial', sans-serif; padding: 25px; color: #1e293b; max-width: 800px; margin: 0 auto; }
        .header { text-align: center; border-bottom: 3px double #dc2626; padding-bottom: 12px; margin-bottom: 20px; }
        .header h1 { color: #dc2626; margin: 0; font-size: 22px; text-transform: uppercase; }
        .header p { margin: 4px 0 0 0; font-size: 13px; color: #64748b; }
        .ticket-badge { background: #fee2e2; color: #991b1b; padding: 6px 14px; display: inline-block; font-weight: bold; font-size: 16px; border-radius: 6px; margin-bottom: 15px; border: 1px solid #fca5a5; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th, td { border: 1px solid #cbd5e1; padding: 10px; font-size: 13px; text-align: left; }
        th { background: #f8fafc; font-weight: bold; width: 30%; }
        .status-box { padding: 4px 10px; border-radius: 4px; font-weight: bold; font-size: 12px; display: inline-block; text-transform: uppercase; }
        .status-pending { background: #fef3c7; color: #92400e; }
        .status-diproses { background: #dbeafe; color: #1e40af; }
        .status-selesai { background: #dcfce7; color: #166534; }
        .status-ditolak { background: #fee2e2; color: #991b1b; }
        .footer { margin-top: 30px; text-align: right; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 15px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>SIPITUNG - SIAGA PITULUNGAN</h1>
        <p>Sistem Informasi & Posko Pengendalian Aduan Bencana Alam & Gangguan Trantibum</p>
      </div>

      <div style="text-align: center;">
        <span class="ticket-badge">Laporan ID: ${report.ticketId}</span>
      </div>

      <table>
        <tr><th>Waktu Melapor</th><td>${new Date(report.createdAt).toLocaleString('id-ID')}</td></tr>
        <tr><th>Nama Pelapor</th><td>${report.namaPelapor}</td></tr>
        <tr><th>No. WhatsApp Pelapor</th><td>${report.noWhatsapp}</td></tr>
        <tr><th>Desa (Kecamatan Tulis)</th><td><strong>Desa ${report.desa || '-'}</strong></td></tr>
        <tr><th>Jenis Kejadian</th><td><strong>${report.jenisKejadian.toUpperCase()}</strong> (${report.kategori.toUpperCase()})</td></tr>
        <tr><th>Waktu Kejadian</th><td>${report.waktuKejadian}</td></tr>
        <tr><th>Alamat Kejadian</th><td>${report.alamat}</td></tr>
        <tr><th>Kordinat GPS</th><td>${report.latitude}, ${report.longitude}</td></tr>
        <tr><th>Dampak / Korban</th><td>Meninggal: ${report.korban?.meninggal || 0} | Luka: ${(report.korban?.lukaBerat || 0) + (report.korban?.lukaRingan || 0)} | Mengungsi: ${report.korban?.mengungsi || 0} | Rumah Rusak: ${report.korban?.rumahRusak || 0}</td></tr>
        <tr><th>Deskripsi Kejadian</th><td>${report.deskripsi}</td></tr>
        <tr><th>Status Penanganan</th><td><span class="status-box status-${report.status}">${report.status.toUpperCase()}</span></td></tr>
        <tr><th>Petugas Penanggung Jawab</th><td>${report.petugasAssigned || 'Belum ditugaskan'}</td></tr>
        <tr><th>Catatan Tindak Lanjut</th><td>${report.catatanPetugas || 'Dalam proses tindak lanjut posko.'}</td></tr>
      </table>

      ${report.mediaUrl ? `<div style="margin-top: 15px; text-align: center;"><p style="font-size:12px; color:#64748b;">Lampiran Media Kejadian:</p><img src="${report.mediaUrl}" style="max-width: 100%; max-height: 250px; border-radius: 6px; border: 1px solid #cbd5e1;" /></div>` : ''}

      <div class="footer">
        <p>Dokumen Resmi Hasil Cetak Sistem Posko Kedaruratan SIPITUNG</p>
        <p>Dicetak pada: ${new Date().toLocaleString('id-ID')}</p>
      </div>
      <script>
        window.onload = function() { window.print(); }
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}
