<template>
	<div ref="editorElement" :class="{ [font]: true, disabled, bordered }"></div>

	<v-drawer
		v-model="imageDrawerOpen"
		:title="t('interfaces.file-image.description')"
		:persistent="true"
		icon="image"
		@cancel="closeImageDrawer"
	>
		<div class="uploader-drawer-content">
			<template v-if="selectedImage">
				<div class="grid">
					<div class="field">
						<div class="file-preview">
							<div class="image">
								<v-image
									:src="`/assets/${selectedImage.fileId}?key=system-large-contain`"
									:width="selectedImage.width"
									:height="selectedImage.height"
									:alt="selectedImage.title"
								/>
							</div>
						</div>
					</div>
					<div class="field">
						<div class="type-label">{{ t('title') }}</div>
						<v-input v-model="selectedImage.title" />
					</div>
					<div class="field">
						<div class="type-label">{{ t('description') }}</div>
						<v-textarea v-model="selectedImage.description" />
					</div>
					<div class="field">
						<div class="type-label">Link zu folgender URL</div>
						<v-input v-model="selectedImage.linkUrl" />
					</div>
					<div class="field half">
						<div class="type-label">{{ t('width') }}</div>
						<v-input
							v-model="selectedImage.displayWidth"
							type="number"
							@update:model-value="matchDisplayHeight"
						/>
					</div>
					<div class="field half-right">
						<div class="type-label">{{ t('height') }}</div>
						<v-input
							v-model="selectedImage.displayHeight"
							type="number"
							@update:model-value="matchDisplayWidth"
						/>
					</div>
					<div class="field">
						<div class="type-label">Rokka Hash</div>
						<v-input v-model="selectedImage.rokkaHash" disabled />
					</div>
				</div>
			</template>
			<v-upload v-else :multiple="false" from-library from-url :folder="folder" @input="onImageSelect" />
		</div>

		<template #actions>
			<v-button v-tooltip.bottom="t('save_image')" icon rounded @click="handleFile(selectedImage)">
				<v-icon name="check" />
			</v-button>
		</template>
	</v-drawer>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, withDefaults } from 'vue';
import { useI18n } from 'vue-i18n';
import { useApi, useStores } from '@directus/extensions-sdk';
import EditorJS, { OutputData } from '@editorjs/editorjs';
import isEqual from 'lodash/isEqual';
import cloneDeep from 'lodash/cloneDeep';
import useDirectusToken from './use-directus-token';
import useImage from './use-image';
import getTools from './tools';
import getTranslations from './translations';

const props = withDefaults(
	defineProps<{
		disabled?: boolean;
		autofocus?: boolean;
		value?: Record<string, any> | null;
		bordered?: boolean;
		placeholder?: string;
		tools?: string[];
		folder?: string;
		font?: 'sans-serif' | 'monospace' | 'serif';
	}>(),
	{
		value: null,
		bordered: true,
		tools: () => [
			'header',
			'paragraph',
			'nestedlist',
			'quote',
			'image',
			'embed',
			'inlinesmall',
			'delimiter',
			'inverteddelimiter',
			'button',
			'iframe',
			'raw',
		],
		font: 'sans-serif',
	}
);

const emit = defineEmits<{ input: [value: EditorJS.OutputData | null] }>();

const { t } = useI18n();

const { useCollectionsStore } = useStores();
const collectionStore = useCollectionsStore();

const api = useApi();
const { addTokenToURL } = useDirectusToken(api);
const {
	imageDrawerOpen,
	selectedImage,
	closeImageDrawer,
	openImageDrawer,
	onImageSelect,
	onImageEdit,
	setFileHandler,
	handleFile,
	getImagePreviewUrl,
	getRokkaHash,
} = useImage(api, addTokenToURL);

const editorjsRef = ref<EditorJS>();
const editorjsIsReady = ref(false);
const editorElement = ref<HTMLElement>();
const haveFilesAccess = Boolean(collectionStore.getCollection('directus_files'));
const haveValuesChanged = ref(false);

const tools = getTools(
	{
		baseURL: api.defaults.baseURL,
		setFileHandler,
		t: {
			no_file_selected: t('no_file_selected'),
		},
		openImageDrawer,
		onImageEdit,
		getImagePreviewUrl,
		getRokkaHash,
	},
	props.tools,
	haveFilesAccess
);

onMounted(async () => {
	editorjsRef.value = new EditorJS({
		i18n: getTranslations(t),
		logLevel: 'ERROR' as EditorJS.LogLevels,
		holder: editorElement.value,
		readOnly: false,
		placeholder: props.placeholder,
		minHeight: 72,
		onChange: (api) => emitValue(api),
		tools: tools,
	});


	await editorjsRef.value.isReady;
	editorjsIsReady.value = true;

	const sanitizedValue = sanitizeValue(props.value);

	if (sanitizedValue) {
		await editorjsRef.value.render(sanitizedValue);
	}

	if (props.autofocus) {
		editorjsRef.value.focus();
	}
});

onUnmounted(() => {
	editorjsRef.value?.destroy();
});

watch(
	() => props.value,
	async (newVal: any, oldVal: any) => {
		// First value will be set in 'onMounted'
		if (!editorjsRef.value || !editorjsIsReady.value) return;

		if (haveValuesChanged.value) {
			haveValuesChanged.value = false;
			return;
		}

		if (isEqual(newVal?.blocks, oldVal?.blocks)) return;

		try {
			const sanitizedValue = sanitizeValue(newVal);

			if (sanitizedValue) {
				await editorjsRef.value.render(sanitizedValue);
			} else {
				editorjsRef.value.clear();
			}
		} catch (error) {
			window.console.warn('editorjs-extension: %s', error);
		}
	},
);

function matchDisplayHeight(width: number) {
	if (!selectedImage.value || !selectedImage.value.width || !selectedImage.value.height) {
		return;
	}
	selectedImage.value.displayHeight = Math.round((selectedImage.value.height / selectedImage.value.width) * width);
}

function matchDisplayWidth(height: number) {
	if (!selectedImage.value || !selectedImage.value.width || !selectedImage.value.height) {
		return;
	}
	selectedImage.value.displayWidth = Math.round((selectedImage.value.width / selectedImage.value.height) * height);
}

async function emitValue(context: EditorJS.API) {
	if (props.disabled || !context || !context.saver) return;

	try {
		const result = await context.saver.save();

		haveValuesChanged.value = true;

		if (!result || result.blocks.length < 1) {
			emit('input', null);
			return;
		}

		if (isEqual(result.blocks, props.value?.blocks)) return;

		emit('input', result);
	} catch (error) {
		window.console.warn('editorjs-extension: %s', error);
	}
}

function sanitizeValue(value: any): OutputData | null {
	if (!value || typeof value !== 'object' || !value.blocks || value.blocks.length < 1) return null;

	return cloneDeep({
		time: value?.time || Date.now(),
		version: value?.version || '0.0.0',
		blocks: value.blocks,
	});
}
</script>

<style lang="scss" scoped>
@import './form-grid';

.grid {
	@include form-grid;
}

.btn--default {
	color: #fff !important;
	background-color: #0d6efd;
	border-color: #0d6efd;
}
.btn--gray {
	color: #fff !important;
	background-color: #7c7c7c;
	border-color: #7c7c7c;
}

.disabled {
	color: var(--theme--form--field--input--foreground-subdued);
	background-color: var(--theme--form--field--input--background-subdued);
	border-color: var(--theme--form--field--input--border-color);
	pointer-events: none;
}

.bordered {
	padding: var(--theme--form--field--input--padding) max(32px, calc(var(--theme--form--field--input--padding) + 16px));
	background-color: var(--theme--background);
	border: var(--theme--border-width) solid var(--theme--form--field--input--border-color);
	border-radius: var(--theme--border-radius);

	&:hover {
		border-color: var(--theme--form--field--input--border-color-hover);
	}

	&:focus-within {
		border-color: var(--theme--form--field--input--border-color-focus);
	}
}

.monospace {
	font-family: var(--theme--fonts--monospace--font-family);
}

.serif {
	font-family: var(--theme--fonts--serif--font-family);
}

.sans-serif {
	font-family: var(--theme--fonts--sans--font-family);
}

.uploader-drawer-content {
	padding: var(--content-padding);
	padding-top: 0;
	padding-bottom: var(--content-padding);
}

/* Source: https://github.com/directus/directus/blob/main/app/src/views/private/components/file-preview.vue */
.file-preview {
	position: relative;
	max-width: calc((var(--form-column-max-width) * 2) + var(--theme--form--column-gap));

	img {
		display: block;
		z-index: 1;
		margin: 0 auto;
		width: auto;
		height: auto;
		max-width: 100%;
		max-height: 400px;
		object-fit: contain;
		border-radius: var(--theme--border-radius);
		background-color: var(--theme--background-normal);
	}

	.image {
		border-radius: var(--theme--border-radius);
		background-color: var(--theme--background-normal);
	}


	.image {
		img {
			z-index: 1;
			display: block;
			margin: 0 auto;
		}
	}
}
</style>
