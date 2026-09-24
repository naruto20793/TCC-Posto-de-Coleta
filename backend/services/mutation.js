const mongoose = require("mongoose");
const audit = require("./audit");
module.exports = async function mutation(req, action, prefix, write) {
  const session = await mongoose.startSession();
  let record;
  try {
    await session.withTransaction(async () => {
      record = await write(session);
      await audit(req, action, `${prefix}:${record.id}`, session);
    });
    return record;
  } finally {
    await session.endSession();
  }
};
