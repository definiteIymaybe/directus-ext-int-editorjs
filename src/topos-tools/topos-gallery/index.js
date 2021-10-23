// eslint-disable-next-line require-jsdoc
import Uploader from '../../editorjs-uploader';
import buttonIcon from './svg/button-icon.svg';
import IconLeft from './svg/icon-left.svg';
import IconRight from './svg/icon-left.svg';
import IconClose from './svg/close.svg';
import ToolboxIcon from './svg/toolbox.svg';

const galleryClassNamePrefix = `cdxcarousel`;

// eslint-disable-next-line require-jsdoc
export default class SimpleCarousel {
	/**
	 * @param {CarousellData} data - previously saved data
	 * @param {CarouselConfig} config - user config for Tool
	 * @param {object} api - Editor.js API
	 */
	constructor({ data, config, api }) {
		this.api = api;
		this.data = data;
		Object.assign(this, { IconClose, IconLeft, IconRight });
		this.config = {
			endpoints: config.endpoints || '',
			additionalRequestData: config.additionalRequestData || {},
			additionalRequestHeaders: config.additionalRequestHeaders || {},
			field: config.field || 'image',
			types: config.types || 'image/*',
			captionPlaceholder: this.api.i18n.t('Подпись'),
			sourcePlaceholder: this.api.i18n.t('Источник'),
			buttonContent: config.buttonContent || '',
			uploader: config.uploader || undefined,
		};
		/**
		 * Module for file uploading
		 */
		this.uploader = new Uploader({
			config: this.config,
			onUpload: (response) => this.onUpload(response),
			onError: (error) => this.uploadingFailed(error),
		});
	}

	/**
	 * CSS classes
	 * @constructor
	 */
	get CSS() {
		return {
			baseClass: this.api.styles.block,
			loading: this.api.styles.loader,
			input: this.api.styles.input,
			button: this.api.styles.button,

			/**
			 * Tool's classes
			 */
			wrapper: `${galleryClassNamePrefix}-wrapper`,
			addButton: `${galleryClassNamePrefix}-addImage`,
			block: `${galleryClassNamePrefix}-block`,
			item: `${galleryClassNamePrefix}-item`,
			removeBtn: `${galleryClassNamePrefix}-removeBtn`,
			leftBtn: `${galleryClassNamePrefix}-leftBtn`,
			rightBtn: `${galleryClassNamePrefix}-rightBtn`,
			inputUrl: `${galleryClassNamePrefix}-inputUrl`,
			caption: `${galleryClassNamePrefix}-caption`,
			source: `${galleryClassNamePrefix}-source`,
			list: `${galleryClassNamePrefix}-list`,
			imagePreloader: 'image-tool__image-preloader',
		};
	}

	/**
	 * Get Tool toolbox settings
	 * icon - Tool icon's SVG
	 * title - title to show in toolbox
	 *
	 * @return {{icon: string, title: string}}
	 */
	static get toolbox() {
		return {
			title: 'Carousel',
			icon: ToolboxIcon,
		};
	}

	/**
	 * Renders Block content
	 * @public
	 *
	 * @return {HTMLDivElement}
	 */
	render() {
		/*
		 * Structure
		 * <wrapper>
		 *  <list>
		 *    <item/>
		 *    ...
		 *  </list>
		 *  <addButton>
		 * </wrapper>
		 */
		// Создаем базу для начала
		this.wrapper = make('div', [this.CSS.wrapper]);
		this.list = make('div', [this.CSS.list]);
		this.addButton = this.createAddButton();

		this.list.appendChild(this.addButton);
		this.wrapper.appendChild(this.list);
		if (this.data.length > 0) {
			console.log('load_item render', this.data);
			for (const load of this.data) {
				console.log('load', load, JSON.stringify(load));
				const { url, caption, source } = load;
				const loadItem = this.createNewItem({ url, captionText: caption, sourceText: source });

				this.list.insertBefore(loadItem, this.addButton);
			}
		}
		return this.wrapper;
	}

	// eslint-disable-next-line require-jsdoc
	save(blockContent) {
		const list = blockContent.getElementsByClassName(this.CSS.item);
		const data = [];

		console.log('save: list', list);

		if (list.length > 0) {
			for (const item of list) {
				console.log('save: list: item', item);
				if (item && item.firstChild && item.firstChild.value) {
					console.log('save item.firstChild', item.firstChild.value, item.firstChild);
					console.log('save item', item);
					console.log('save item.childNodes', item.childNodes);
					// console.log('item.firstChild', item.firstChild.value, item.firstChild);
					// console.log('item.childNodes[1]', item.childNodes[1].value, item.childNodes[1]);
					// console.log('item.lastChild', item.lastChild.value, item.lastChild);
					// console.log('item.childNodes[2]', item.childNodes[2].value, item.childNodes[2]);

					// 0: input.cdxcarousel-inputUrl
					// 1: div.cdxcarousel-removeBtn
					// 2: div.cdxcarousel-leftBtn
					// 3: div.cdxcarousel-rightBtn
					// 4: div.image-tool__image-preloader
					// 5: img
					// 6: input.cdxcarousel-caption.cdx-input
					// 7: input.cdxcarousel-caption.cdx-input

					const itemData = {
						url: item.getElementsByClassName(`${galleryClassNamePrefix}-inputUrl`)[0].value,
						caption: item.getElementsByClassName(`${galleryClassNamePrefix}-caption`)[0].value,
						source: item.getElementsByClassName(`${galleryClassNamePrefix}-source`)[0].value,
					};

					console.log('save pushing itemData', itemData);
					data.push(itemData);
				}
			}
		}
		return data;
	}

	/**
	 * Create Image block
	 * @public
	 *
	 * @param {string} url - url of saved or upload image
	 * @param {string} caption - caption of image
	 *
	 * Structure
	 * <item>
	 *  <url/>
	 *  <removeButton/>
	 *  <img/>
	 *  <caption>
	 * </item>
	 *
	 * @return {HTMLDivElement}
	 */
	createNewItem(props = {}) {
		console.log('== ! createNewItem (props)', props);

		const { url, captionText, sourceText } = props;

		// Create item, remove button and field for image url
		const block = make('div', [this.CSS.block]);
		const item = make('div', [this.CSS.item]);
		const removeBtn = make('div', [this.CSS.removeBtn]);
		const leftBtn = make('div', [this.CSS.leftBtn]);
		const rightBtn = make('div', [this.CSS.rightBtn]);
		const imageUrl = make('input', [this.CSS.inputUrl]);
		const imagePreloader = make('div', [this.CSS.imagePreloader]);

		imageUrl.value = url;
		leftBtn.innerHTML = this.IconLeft;
		leftBtn.style = 'padding: 8px;';
		leftBtn.addEventListener('click', () => {
			const index = Array.from(block.parentNode.children).indexOf(block);
			if (index != 0) {
				block.parentNode.insertBefore(block, block.parentNode.children[index - 1]);
			}
		});
		rightBtn.innerHTML = this.IconRight;
		rightBtn.style = 'padding: 8px;';
		rightBtn.addEventListener('click', () => {
			const index = Array.from(block.parentNode.children).indexOf(block);
			if (index != block.parentNode.children.length - 2) {
				block.parentNode.insertBefore(block, block.parentNode.children[index + 2]);
			}
		});
		removeBtn.innerHTML = this.IconClose;
		removeBtn.addEventListener('click', () => {
			block.remove();
		});
		removeBtn.style.display = 'none';

		item.appendChild(imageUrl);
		item.appendChild(removeBtn);
		item.appendChild(leftBtn);
		item.appendChild(rightBtn);
		block.appendChild(item);
		/*
		 * If data already yet
		 * We create Image view
		 */
		if (url) {
			if (item && item.childNodes) {
				console.log('!!', item.childNodes);
			}
			console.log('createNewItem -> _createImage', { url, item, captionText, sourceText, removeBtn });
			this._createImage({ url, item, captionText, sourceText, removeBtn });
		} else {
			item.appendChild(imagePreloader);
		}
		return block;
	}

	/**
	 * Create Image View
	 * @public
	 *
	 * @param {string} url - url of saved or upload image
	 * @param {HTMLDivElement} item - block of created image
	 * @param {string} captionText - caption of image
	 * @param {HTMLDivElement} removeBtn - button for remove image block
	 *
	 * @return {HTMLDivElement}
	 */
	_createImage(props = {}) {
		console.log('_createImage (props)', props);
		const { url, item, captionText = '', sourceText = '', removeBtn } = props;

		const image = document.createElement('img');
		image.src = url;

		const caption = make('input', [this.CSS.caption, this.CSS.input]);
		caption.placeholder = this.config.captionPlaceholder;
		caption.value = captionText;

		const source = make('input', [this.CSS.source, this.CSS.input]);
		source.placeholder = this.config.sourcePlaceholder;
		source.value = sourceText;

		removeBtn.style.display = 'flex';

		item.appendChild(image);
		item.appendChild(caption);
		item.appendChild(source);
	}

	/**
	 * File uploading callback
	 * @private
	 *
	 * @param {Response} response
	 */
	onUpload(response) {
		console.log('carousel.onUpload (response)', response);

		if (!response.success || !response.file) {
			return this.uploadingFailed(`incorrect response: ${JSON.stringify(response)}`);
		} else {
			console.log('carousel.onUpload: this', this.list);
			const imageIndex = this.list.childNodes.length - 2;

			const createImageProps = {
				url: response.file.url,
				item: this.list.childNodes[imageIndex].firstChild,
				captionText: response.file.description || '',
				sourceText: response.file.source || '',
				removeBtn: this.list.childNodes[imageIndex].firstChild.childNodes[1],
			};

			console.log('onUpload -> createImage', createImageProps);

			this._createImage(createImageProps);
			this.list.childNodes[imageIndex].firstChild.childNodes[2].style.backgroundImage = '';
			this.list.childNodes[imageIndex].firstChild.firstChild.value = response.file.url;
			this.list.childNodes[imageIndex].firstChild.classList.add(`${galleryClassNamePrefix}-item--empty`);
		}
	}

	/**
	 * Handle uploader errors
	 * @private
	 *
	 * @param {string} errorText
	 */
	uploadingFailed(errorText) {
		console.log('Gallery : uploading failed because of', errorText);

		this.api.notifier.show({
			message: this.api.i18n.t('Can not upload an image, try another'),
			style: 'error',
		});
	}

	/**
	 * Shows uploading preloader
	 * @param {string} src - preview source
	 */
	showPreloader(src) {
		this.nodes.imagePreloader.style.backgroundImage = `url(${src})`;
	}

	// eslint-disable-next-line require-jsdoc
	onSelectFile(x) {
		console.log('carousel.onSelectFile', x);
		// Создаем элемент
		this.uploader.uploadSelectedFile({
			onPreview: (src) => {
				const newItem = this.createNewItem();
				newItem.firstChild.lastChild.style.backgroundImage = `url(${src})`;
				console.log('preload', newItem.firstChild.lastChild);
				this.list.insertBefore(newItem, this.addButton);
				console.log('onPreview src', src);
			},
		});
	}

	/**
	 * Create add button
	 * @private
	 */
	createAddButton() {
		const addButton = make('div', [this.CSS.button, this.CSS.addButton]);
		const block = make('div', [this.CSS.block]);

		addButton.innerHTML = `${buttonIcon} Add Image`;
		addButton.addEventListener('click', () => {
			this.onSelectFile();
		});
		block.appendChild(addButton);

		return block;
	}
}

/**
 * Helper for making Elements with attributes
 *
 * @param  {string} tagName           - new Element tag name
 * @param  {array|string} classNames  - list or name of CSS class
 * @param  {Object} attributes        - any attributes
 * @return {Element}
 */
export const make = function make(tagName, classNames = null, attributes = {}) {
	const el = document.createElement(tagName);

	if (Array.isArray(classNames)) {
		el.classList.add(...classNames);
	} else if (classNames) {
		el.classList.add(classNames);
	}

	for (const attrName in attributes) {
		el[attrName] = attributes[attrName];
	}

	return el;
};
