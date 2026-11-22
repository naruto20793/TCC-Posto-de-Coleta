const Medico = require("../models/Medico");
const Unidade = require("../models/UnidadeSaude");
const Servico = require("../models/Servico");
const Agendamento = require("../models/Agendamento");
const { id, fail } = require("../utils/http");
const { dayTimes, validateBooking, minutes } = require("./schedule");
async function activeUnit(value, service, session, lock = false) {
  const query = { _id: id(value), ativo: true };
  const unit = lock
    ? await Unidade.findOneAndUpdate(
        query,
        { $inc: { versao: 1 } },
        { new: true, session },
      )
    : await Unidade.findOne(query).session(session || null);
  if (!unit) fail(400, "Selecione uma unidade de saúde ativa.");
  if (service && !unit.servicos.some((s) => String(s) === String(service)))
    fail(400, "Este serviço não é oferecido pela unidade.");
  return unit;
}
async function examContext(query, user, session, lock = false) {
  const service = await Servico.findOne({
    _id: id(query.servico),
    ativo: true,
  }).session(session || null);
  if (!service || service.tipo !== "exame")
    fail(400, "Selecione um serviço do tipo exame.");
  const unit = await activeUnit(query.unidade, service._id, session, lock);
  const filter = { ativo: true, unidade: unit._id };
  if (
    query.especialidade &&
    service.especialidade &&
    id(query.especialidade) !== String(service.especialidade)
  )
    fail(400, "Especialidade incompatível com o exame.");
  if (service.especialidade || query.especialidade)
    filter.especialidades = service.especialidade || id(query.especialidade);
  if (user.role === "medico") filter._id = user.perfil.id;
  const doctors = await Medico.find(filter)
    .sort({ _id: 1 })
    .session(session || null);
  return { service, unit, doctors };
}
async function available(doctors, day, session) {
  const bookings = await Agendamento.find({
    medico: { $in: doctors.map((d) => d._id) },
    data: new Date(day),
    status: { $in: ["agendado", "confirmado"] },
  })
    .select("medico hora duracao")
    .session(session || null);
  return doctors.map((doctor) => ({
    doctor,
    horarios: dayTimes(doctor, day).filter((hour) => {
      try {
        validateBooking(day, hour, 30, doctor);
      } catch {
        return false;
      }
      const start = minutes(hour);
      return !bookings.some(
        (r) =>
          String(r.medico) === String(doctor._id) &&
          start < minutes(r.hora) + r.duracao &&
          start + 30 > minutes(r.hora),
      );
    }),
  }));
}
module.exports = { activeUnit, examContext, available };
