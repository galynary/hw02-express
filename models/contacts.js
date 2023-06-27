<<<<<<< HEAD
const fs = require("fs/promises");
const path = require("path");
const { nanoid } = require("nanoid");
const contactsPath = path.join(__dirname, "contacts.json");

const listContacts = async () => {
	const data = await fs.readFile(contactsPath);
	const contacts = JSON.parse(data);
	return contacts;
};

const getContactById = async (id) => {
	const contacts = await listContacts();
	const result = contacts.find((item) => item.id === id);
	console.log(result);
	if (!result) return null;
	return result;
};

const removeContact = async (id) => {
	const contacts = await listContacts();
	const idx = contacts.findIndex((item) => item.id === id);
	if (idx === -1) return null;
	const [removeContact] = contacts.splice(idx, 1);
	await fs.writeFile(contactsPath, JSON.stringify(contacts, null, 2));
	return removeContact;
};

const addContact = async (body) => {
	const contacts = await listContacts();
	const newContact = { id: nanoid(), ...body };
	contacts.push(newContact);
	await fs.writeFile(contactsPath, JSON.stringify(contacts));
	return newContact;
};

const updateContact = async (id, body) => {
	const contacts = await listContacts();
	const idx = contacts.findIndex((item) => item.id === id);
	if (idx === -1) return null;
	contacts[idx] = { ...body, id };
	await fs.writeFile(contactsPath, JSON.stringify(contacts));
	return contacts[idx];
};

module.exports = {
	listContacts,
	getContactById,
	removeContact,
	addContact,
	updateContact,
};
=======
const { Schema, model } = require("mongoose");
const Joi = require("joi");
const { handleMongooseError } = require("../helpers");

const emailRegexp = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/;
const phoneRegexp = /^\(\d{3}\)\d{2}-\d{2}-\d{3}$/;

const contactSchema = new Schema(
	{
		name: {
			type: String,
			required: [true, "Set name for contact"],
		},
		email: {
			type: String,
			match: emailRegexp,
			required: [true, "Set email for contact"],
		},
		phone: {
			type: String,
			match: phoneRegexp,
			required: [true, "Set phone for contact"],
		},
		favorite: {
			type: Boolean,
			default: false,
		},
		owner: {
			type: Schema.Types.ObjectId,
			ref: "user",
		},
	},
	{ versionKey: false, timestamps: true }
);

contactSchema.post("save", handleMongooseError);

const addSchema = Joi.object({
	name: Joi.string().required(),
	email: Joi.string().pattern(emailRegexp).required(),
	phone: Joi.string().pattern(phoneRegexp).required(),
	favorite: Joi.boolean(),
});

const updateSchema = Joi.object({
	name: Joi.string(),
	email: Joi.string().pattern(emailRegexp).required(),
	phone: Joi.string().pattern(phoneRegexp).required(),
	favorite: Joi.boolean(),
});

const updateFavoriteSchema = Joi.object({
	favorite: Joi.boolean().required(),
});

const Contact = model("contact", contactSchema);

module.exports = { Contact, addSchema, updateFavoriteSchema, updateSchema };
>>>>>>> 04-auth
