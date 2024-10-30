const { Types } = require("mongoose");

const convertToObjectIdMongodb = (id) => {
  return new Types.ObjectId(id);
};

module.exports = { convertToObjectIdMongodb };
