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
module.exports = {
  dateKey,
  minutes,
  slots,
  validateBooking,
  validateSchedule,
  defaultSchedule,
};
