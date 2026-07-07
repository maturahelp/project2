/** Bulgarian message templates for booking events. */

import { formatSofiaDateTime } from "@/lib/booking/time";

export type BookingInfo = {
  serviceTitle: string | null;
  startAt: string; // UTC ISO
  maistorName: string | null;
  contactPhone: string | null;
  address: string | null;
};

const when = (iso: string) => formatSofiaDateTime(iso);
const svc = (t: string | null) => t ?? "услуга";

export function requestedToMaistor(b: BookingInfo) {
  return {
    subject: "Нова заявка за час — Майстор24",
    text:
      `Имате нова заявка за час.\n\n` +
      `Услуга: ${svc(b.serviceTitle)}\n` +
      `Кога: ${when(b.startAt)}\n` +
      `Телефон за връзка: ${b.contactPhone ?? "—"}\n` +
      (b.address ? `Адрес: ${b.address}\n` : "") +
      `\nВлезте в таблото, за да потвърдите или откажете заявката.`,
  };
}

export function confirmedToClient(b: BookingInfo) {
  return {
    subject: "Часът ви е потвърден — Майстор24",
    text:
      `Вашата резервация е потвърдена!\n\n` +
      `Майстор: ${b.maistorName ?? "—"}\n` +
      `Услуга: ${svc(b.serviceTitle)}\n` +
      `Кога: ${when(b.startAt)}\n\n` +
      `Очаквайте майстора в уговорения час.`,
  };
}

export function declinedToClient(b: BookingInfo) {
  return {
    subject: "Часът ви е отказан — Майстор24",
    text:
      `За съжаление резервацията ви беше отказана.\n\n` +
      `Майстор: ${b.maistorName ?? "—"}\n` +
      `Услуга: ${svc(b.serviceTitle)}\n` +
      `Кога: ${when(b.startAt)}\n\n` +
      `Може да опитате с друг свободен час или друг майстор.`,
  };
}

export function completedToClient(b: BookingInfo, reviewUrl: string) {
  return {
    subject: "Оценете услугата — Майстор24",
    text:
      `Услугата при ${b.maistorName ?? "майстора"} е завършена.\n\n` +
      `Услуга: ${svc(b.serviceTitle)}\n` +
      `Кога: ${when(b.startAt)}\n\n` +
      `Ще се радваме да оставите отзив:\n${reviewUrl}`,
  };
}

export function reminderToClient(b: BookingInfo) {
  return {
    subject: "Напомняне за вашия час утре — Майстор24",
    text:
      `Напомняме ви за предстоящия час.\n\n` +
      `Майстор: ${b.maistorName ?? "—"}\n` +
      `Услуга: ${svc(b.serviceTitle)}\n` +
      `Кога: ${when(b.startAt)}\n`,
  };
}

export function reminderToMaistor(b: BookingInfo) {
  return {
    subject: "Напомняне: имате час утре — Майстор24",
    text:
      `Напомняме ви за предстоящ час с клиент.\n\n` +
      `Услуга: ${svc(b.serviceTitle)}\n` +
      `Кога: ${when(b.startAt)}\n` +
      `Телефон на клиента: ${b.contactPhone ?? "—"}\n` +
      (b.address ? `Адрес: ${b.address}\n` : ""),
  };
}
