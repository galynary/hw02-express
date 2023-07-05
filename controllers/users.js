const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const gravatar = require("gravatar");
const path = require("path");
const fs = require("fs/promises");
const Jimp = require("jimp");
const { SECRET_KEY } = process.env;

const { User } = require("../models/user");

const { ctrlWrapper, HttpError } = require("../helpers");

const avatarsDir = path.join(__dirname, "../", "public", "avatars");

const register = async (req, res) => {
	const { email, password } = req.body;
	const user = await User.findOne({ email });

	if (user) {
		throw HttpError(409, "Email in use");
	}

	// хешуємо пароль npm i bcryptjs
	const hashPassword = await bcrypt.hash(password, 10);
	const avatarURL = gravatar.url(email);

	const newUser = await User.findOne({
		...req.body,
		password: hashPassword,
		avatarURL,
	});
	return res.status(201).json({
		email: newUser.email,
		name: newUser.name,
	});
};

const login = async (req, res) => {
	const { email, password } = req.body;
	const user = await User.findOne({ email });
	const passwordCompare = await bcrypt.compare(password, user.password);
	// перевіряємо паролі, який ввели з тим, який є, чи співпадають
	if (!user || !passwordCompare) {
		throw HttpError(401, "Email or password is wrong");
	}

	const payload = {
		id: user._id,
	};

	// час життя токену   expiresIn: "23h"
	const token = jwt.sign(payload, SECRET_KEY, { expiresIn: "23h" });
	await User.findByIdAndUpdate(user._id, { token });

	res.json({
		token,
	});
};

const logout = async (req, res) => {
	const { _id } = req.user;

	await User.findByIdAndUpdate(_id, { token: "" });

	res.status(204).json({
		message: "Logout success",
	});
};

const getcurrent = async (req, res) => {
	const { email, subscription } = req.user;

	res.json({
		email,
		subscription,
	});
};

const updateAvatar = async (req, res) => {
	const { _id } = req.user;
	const { path: tempUpload, originalname } = req.file;
	const image = await Jimp.read(tempUpload);
	await image.resize(250, 250);
	await image.writeAsync(tempUpload);

	const filename = `${_id}_${originalname}`;
	const resultUpload = path.join(avatarsDir, filename);
	await fs.rename(tempUpload, resultUpload);
	const avatarURL = path.join("avatars", filename);
	await User.findByIdAndUpdate(_id, { avatarURL });
	return res.json({
		avatarURL,
	});
};
module.exports = {
	register: ctrlWrapper(register),
	login: ctrlWrapper(login),
	logout: ctrlWrapper(logout),
	getcurrent: ctrlWrapper(getcurrent),
	updateAvatar: ctrlWrapper(updateAvatar),
};
