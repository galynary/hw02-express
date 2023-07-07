const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const gravatar = require("gravatar");
const path = require("path");
const fs = require("fs/promises");
const Jimp = require("jimp");
const { SECRET_KEY, BASE_URL } = process.env;
const { v4 } = require("uuid");
const { User } = require("../models/user");
const { ctrlWrapper, HttpError, sendEmail } = require("../helpers");

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
	const verificationToken = v4();

	const newUser = await User.findOne({
		...req.body,
		password: hashPassword,
		avatarURL,
		verificationToken,
	});

	const verifyEmail = {
		to: email,
		subject: "Verify email",
		html: `<a target="_blank" href="${BASE_URL}/users/verify/${verificationToken}" >Click verify email</a>`,
	};

	await sendEmail(verifyEmail);

	res.status(201).json({
		user: {
			email: newUser.email,
			subscription: newUser.subscription,
		},
	});
};

const verifyEmail = async (req, res) => {
	const { verificationToken } = req.params;
	const user = await User.findOne({ verificationToken });
	if (!user) {
		throw HttpError(404, "User not found");
	}

	await User.findByIdAndUpdate(user._id, {
		verify: true,
		verificationToken: null,
	});

	res.status(200).json({
		message: "Verification successful",
	});
};

const resendVerifyEmail = async (req, res) => {
	const { email } = req.body;
	const user = await User.findOne({ email });
	if (!user) {
		throw HttpError(400, "missing required field email");
	}
	if (user.verify) {
		throw HttpError(400, "Verification has already been passed");
	}

	const verifyEmail = {
		to: email,
		subject: "Verify email",
		html: `<a target="_blank" href="${BASE_URL}/users/verify/${user.verificationToken}" >Click verify email</a>`,
	};

	await sendEmail(verifyEmail);

	res.status(200).json({
		message: "Verification email sent",
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

	res
		.status(200)
		.json({ token, user: { email, subscription: user.subscription } });
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

	res.status(200).json({
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
	verifyEmail: ctrlWrapper(verifyEmail),
	resendVerifyEmail: ctrlWrapper(resendVerifyEmail),
	login: ctrlWrapper(login),
	logout: ctrlWrapper(logout),
	getcurrent: ctrlWrapper(getcurrent),
	updateAvatar: ctrlWrapper(updateAvatar),
};
