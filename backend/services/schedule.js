const { fail } = require("../utils/http");
const weekdays = [
  "domingo",
  "segunda",
  "terça",
  "quarta",
  "quinta",
  "sexta",
  "sábado",
];
function dateKey(value) {
  const key = value instanceof Date ? value.toISOString().slice(0, 10) : value;
  if (
    typeof key !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(key) ||
    !Number.isFinite(Date.parse(key)) ||
    new Date(key).toISOString().slice(0, 10) !== key
  )
    fail(400, "Data inválida.");
  return key;
}
function minutes(hora) {
  if (typeof hora !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(hora))
    fail(400, "Horário inválido.");
  return Number(hora.slice(0, 2)) * 60 + Number(hora.slice(3));
}
function slots(data, hora, duracao) {
  const day = dateKey(data),
    start = minutes(hora);
  if (
    !Number.isInteger(duracao) ||
    duracao < 15 ||
    duracao > 240 ||
    start + duracao > 1440
  )
    fail(400, "Duração inválida.");
  return Array.from({ length: duracao }, (_, i) => `${day}@${start + i}`);
}
function validateBooking(data, hora, duracao, medico) {
  const day = dateKey(data);
  const start = minutes(hora);
  const instant = Date.parse(`${day}T${hora}:00-03:00`);
  if (instant <= Date.now() || instant > Date.now() + 90 * 86400000)
    fail(400, "Agende entre agora e os próximos 90 dias.");
  const custom = dayOverride(medico, day);
  if (custom !== undefined) {
    if (duracao !== 30 || !custom.includes(hora))
      fail(409, "Horário não liberado pelo administrador para esta data.");
    return slots(day, hora, duracao);
  }
  const schedule = medico.horarioDisponivel;
  const weekday = weekdays[new Date(`${day}T12:00:00Z`).getUTCDay()];
  if (
    !schedule?.diasSemana?.includes(weekday) ||
    start < minutes(schedule.horaInicio) ||
    start + duracao > minutes(schedule.horaFim)
  )
    fail(409, "Horário fora do expediente do profissional.");
  return slots(day, hora, duracao);
}
const defaultSchedule = {
  diasSemana: weekdays.slice(1, 6),
  horaInicio: "08:00",
  horaFim: "17:00",
};
function validateSchedule(value) {
  if (
    !value ||
    !Array.isArray(value.diasSemana) ||
    !value.diasSemana.length ||
    value.diasSemana.some((d) => !weekdays.includes(d)) ||
    new Set(value.diasSemana).size !== value.diasSemana.length
  )
    fail(400, "Selecione dias da semana válidos, sem repetições.");
  const start = minutes(value.horaInicio),
    end = minutes(value.horaFim);
  if (end - start < 30)
    fail(
      400,
      "O expediente deve comportar ao menos uma consulta de 30 minutos.",
    );
  return {
    diasSemana: [...value.diasSemana],
    horaInicio: value.horaInicio,
    horaFim: value.horaFim,
  };
}
function dayOverride(medico, day) {
  const map = medico.horariosPorData;
  return map?.get ? map.get(day) : map?.[day];
}
function validateDay(value) {
  const day = dateKey(value);
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
  }).format(new Date());
  if (
    day < today ||
    Date.parse(`${day}T00:00:00-03:00`) > Date.now() + 90 * 86400000
  )
    fail(400, "Escolha uma data entre hoje e os próximos 90 dias.");
  return day;
}
function validateTimes(value) {
  if (!Array.isArray(value) || value.length > 48)
    fail(400, "Informe até 48 horários de 30 minutos.");
  const sorted = value
    .map((time) => ({ time, start: minutes(time) }))
    .sort((a, b) => a.start - b.start);
  if (
    sorted.some(
      (item, i) =>
        item.start + 30 > 1440 ||
        (i > 0 && item.start < sorted[i - 1].start + 30),
    )
  )
    fail(
      400,
      "Os horários devem comportar consultas de 30 minutos sem sobreposição.",
    );
  return sorted.map((item) => item.time);
}
function dayTimes(medico, day) {
  const custom = dayOverride(medico, day);
  if (custom !== undefined) return [...custom];
  const schedule = medico.horarioDisponivel;
  if (
    !schedule?.diasSemana?.includes(
      weekdays[new Date(`${dateKey(day)}T12:00:00Z`).getUTCDay()],
    )
  )
    return [];
  const result = [];
  for (
    let start = minutes(schedule.horaInicio);
    start + 30 <= minutes(schedule.horaFim);
    start += 30
  )
    result.push(
      `${String(Math.floor(start / 60)).padStart(2, "0")}:${String(start % 60).padStart(2, "0")}`,
    );
  return result;
}
function availabilityMessage(medico, day) {
  const end = Date.parse(`${day}T23:59:59-03:00`);
  const start = Date.parse(`${day}T00:00:00-03:00`);
  if (end <= Date.now() || start > Date.now() + 90 * 86400000)
    return "Escolha uma data entre hoje e os próximos 90 dias.";
  if (!dayTimes(medico, day).length)
    return dayOverride(medico, day) !== undefined
      ? "Não há horários liberados pelo administrador para esta data."
      : "Este profissional não atende neste dia da semana. Escolha uma data do expediente ou solicite a liberação ao administrador.";
  return "Não há horários livres nesta data. Os horários de atendimento estão ocupados ou já passaram. Escolha outra data.";
}
module.exports = {
  availabilityMessage,
  dayOverride,
  validateDay,
  validateTimes,
  dayTimes,
  dateKey,
  minutes,
  slots,
  validateBooking,
  validateSchedule,
  defaultSchedule,
};
