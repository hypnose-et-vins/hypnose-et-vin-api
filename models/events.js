const Joi = require("joi").extend(require("@joi/date"));
const definedAttributesToSqlSet = require("../helpers/definedAttributesToSQLSet.js");
const { ValidationError, RecordNotFoundError } = require("../error-types");
const db = require("../db.js");

// validate datas on update or create
const validate = async (attributes, options = { udpatedRessourceId: null }) => {
  const { udpatedRessourceId } = options;
  const forUpdate = !!udpatedRessourceId;
  const schema = Joi.object().keys({
    date: forUpdate
      ? Joi.date().format("YYYY-MM-DD").messages({
          format:
            "Le format de la date n'est pas correct. Merci de saisir une date sous la forme ",
        })
      : Joi.date().format("YYYY-MM-DD").required().messages({
          "any.required": "La date est manquante",
          format:
            "Le format de la date n'est pas correct. Merci de saisir une date sous la forme ",
        }),
    title: forUpdate
      ? Joi.string().max(100).messages({
          "string.max":
            "Le titre de l'événement ne doit pas excéder 100 caractères'",
        })
      : Joi.string().required().max(100).messages({
          "any.required": "Le titre de l'événement est manquant",
          "string.max":
            "Le titre de l'événement ne doit pas excéder 100 caractères'",
        }),
    price: forUpdate
      ? Joi.number().messages({
          number: "Le prix contient des caractères invalides",
        })
      : Joi.number().required().messages({
          "any.required": "Le prix est manquant",
          number: "Le prix contient des caractères invalides",
        }),
    availabilities: forUpdate
      ? Joi.number().messages({
          number: "La quantité disponible contient des caractères invalides",
        })
      : Joi.number().required().messages({
          "any.required": "Le prix est manquant",
          number: "La quantité disponible contient des caractères invalides",
        }),
    description: forUpdate
      ? Joi.string().messages({
          "string.empty": "La description est manquante",
        })
      : Joi.string().required().messages({
          "string.empty": "La description est manquante",
        }),
    moderator_id: forUpdate
      ? Joi.number().integer().messages({
          number: "Le modérateur n'est pas valide",
          integer: "Le modérateur n'est pas valide",
        })
      : Joi.number().integer().required().messages({
          number: "Le modérateur n'est pas valide",
          integer: "Le modérateur n'est pas valide",
        }),
    duration_seconds: forUpdate
      ? Joi.number().integer().messages({
          number: "La durée n'est pas valide",
          integer: "La durée n'est pas valide",
        })
      : Joi.number().integer().required().messages({
          "any.required": "La durée est manquante",
          number: "La durée n'est pas valide",
          integer: "La durée n'est pas valide",
        }),
    address_id: forUpdate
      ? Joi.number().integer().messages({
          number: "L'adresse n'est pas valide",
          integer: "L'adresse n'est pas valide",
        })
      : Joi.number().integer().required().messages({
          "any.required": "L'adresse est manquante",
          number: "L'adresse n'est pas valide",
          integer: "L'adresse n'est pas valide",
        }),
    main_picture_url: Joi.string().max(255).messages({
      "string.max": "Le lien de l'image dépasse la limite de 255 caractères",
    }),
    wine_id: forUpdate
      ? Joi.number().integer().messages({
          number: "Le vin n'est pas valide",
          integer: "Le vin n'est pas valide",
        })
      : Joi.number().integer().required().messages({
          "any.required": "Le vin est manquant",
          number: "Le vin n'est pas valide",
          integer: "Le vin n'est pas valide",
        }),
  });
  const { error } = schema.validate(attributes, {
    abortEarly: false,
  });
  if (error)
    throw new ValidationError([
      {
        message: error.details.map((err) => err.message),
        path: ["joi"],
        type: "unique",
      },
    ]);
};

/// MODELS ///

// find one event by his id
const findOneEvent = async (id, failIfNotFound = true) => {
  const eventId = id;
  const rows = await db.query(
    "SELECT e.*, w.name, w.vigneron, w.producteur, w.image AS wine_image, u.firstname, u.lastname, u.photo_url, u.role, a.street, a.city, a.zipcode FROM event AS e JOIN address AS a ON e.address_id = a.id JOIN user AS u ON e.moderator_id = u.id JOIN wine AS w ON e.wine_id = w.id WHERE e.id=?",
    [eventId]
  );
  if (rows.length) {
    delete rows[0].encrypted_password;
    return rows[0];
  }
  if (failIfNotFound) throw new RecordNotFoundError("event", eventId);
  return null;
};

// find all events in database
const findAllEvents = async (req) => {
  let request =
    "SELECT e.*, w.name, w.vigneron, w.producteur, w.image, u.firstname, u.lastname, u.photo_url, u.role, a.street, a.city, a.zipcode FROM event AS e JOIN address AS a ON e.address_id = a.id JOIN user AS u ON e.moderator_id = u.id JOIN wine AS w ON e.wine_id = w.id";
  if (req) {
    if (req.query.after && req.query.before) {
      request += ` WHERE date BETWEEN '${req.query.after}' AND '${req.query.before}' ORDER BY date`;
    }
    if (req.query.sort) {
      const parsedSort = JSON.parse(req.query.sort);
      request += ` ORDER BY ${parsedSort[0]} ${parsedSort[1]}`;
    }
    if (req.query.range) {
      const parsedRange = JSON.parse(req.query.range);
      request += ` LIMIT ${parsedRange[0]} OFFSET ${parsedRange[1]}`;
    }
  }
  return db.query(request);
};

// create an event
const createEvent = async (datas) => {
  await validate(datas);
  return db
    .query(`INSERT INTO event SET ${definedAttributesToSqlSet(datas)}`, datas)
    .then((res) => findOneEvent(res.insertId));
};

// delete one event by his Id
const deleteEvent = async (id, failIfNotFound = true) => {
  const res = await db.query("DELETE FROM event WHERE id=?", [id]);
  if (res.affectedRows !== 0) {
    return true;
  }
  if (failIfNotFound) throw new RecordNotFoundError("event", id);
  return false;
};
// update one event by his id

const updateEvent = async (id, newAttributes) => {
  const namedAttributes = definedAttributesToSqlSet(newAttributes);
  return db
    .query(`UPDATE event SET ${namedAttributes} WHERE id = :id`, {
      ...newAttributes,
      id,
    })
    .then(() => findOneEvent(id));
};

module.exports = {
  findAllEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  findOneEvent,
};
