import BaseAttachesTool from '@editorjs/attaches';
import Uploader from './editorjs-uploader.js';

/**
 * Patch allows custom uploader.
 * https://github.com/editor-js/attaches/blob/master/src/index.js
 */
export class AttachesTool extends BaseAttachesTool {
	constructor(params: {
		config: { uploader: any };
		block: { save: () => Promise<any> };
		api: { blocks: { update: (arg0: any, arg1: any) => void } };
	}) {
		super(params);

		this.config.uploader = params.config.uploader;

		this.uploader = new Uploader({
			config: this.config,
			onUpload: (response: any) => this.onUpload(response),
			onError: (error: any) => this.uploadingFailed(error),
		});

		this.onUpload = (response: any) => {
			super.onUpload(response);

			params.block.save().then((state) => {
				params.api.blocks.update(state.id, state.data);
			});
		};
	}

	showFileData() {
		super.showFileData();

		if (this.data.file && this.data.file.url) {
			const downloadButton = this.nodes.wrapper.querySelector('a.cdx-attaches__download-button');

			if (downloadButton) {
				downloadButton.href = this.uploader.config.uploader.addTokenToURL(this.data.file.url);
			}
		}
	}
}
