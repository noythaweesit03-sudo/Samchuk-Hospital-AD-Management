/**
 * Date formatting utilities for Thai enterprise UI with Buddhist Era (พ.ศ.) and unambiguous timezones.
 */

export function formatThaiDateTime(isoString?: string | null): string {
  if (!isoString) return 'ไม่ระบุ';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return 'ไม่ระบุ';

    const day = d.getDate();
    const monthsThai = [
      'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
      'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
    ];
    const month = monthsThai[d.getMonth()];
    const yearBe = d.getFullYear() + 543;
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const seconds = d.getSeconds().toString().padStart(2, '0');

    return `${day} ${month} ${yearBe} ${hours}:${minutes}:${seconds} น. (ICT)`;
  } catch {
    return 'ไม่ระบุ';
  }
}

export function formatUtcTime(isoString?: string | null): string {
  if (!isoString) return 'N/A';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
  } catch {
    return 'N/A';
  }
}
