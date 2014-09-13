/**
 * A model for link previews
 */
'use strict';

var mongoose = require('mongoose');

var linkPreviewModel = function () {
	var linkPreviewSchema = mongoose.Schema({
		url: {type: String, required: true, unique: true},
		canonical_url: {type: String, required: true},
		loadFailed: Boolean,
		title: String,
		description: String,
		contentType: String,
		mediaType: String,
		images: [{
			original_image: String,
			downsized_image: String
		}],
		videos: [{
			url: String,
			secureUrl: String,
			type: String,
			width: Number,
			height: Number
		}],
		audios: [String]
	});

	return mongoose.model('LinkPreview', linkPreviewSchema);
};

module.exports = new linkPreviewModel();