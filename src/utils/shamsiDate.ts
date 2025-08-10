import moment from "jalali-moment";

export function toShamsi(date: Date): string {
  return moment(date).locale("fa").format("jYYYY/jMM/jDD");
}