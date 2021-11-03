<template>
	<v-dialog v-if="haveFilesAccess" :model-value="fileHandler !== null" @update:model-value="unsetFileHandler" @esc="unsetFileHandler">
		<v-card>
			<v-card-title>
				<i18n-t keypath="upload_from_device" />
			</v-card-title>
			<v-card-text>
				<v-upload
					:ref="uploaderComponentElement"
					:multiple="false"
					:folder="folder"
					from-library
					from-url
					@input="handleFile"
				/>
			</v-card-text>
			<v-card-actions>
				<v-button secondary @click="unsetFileHandler">
					<i18n-t keypath="cancel" />
				</v-button>
			</v-card-actions>
		</v-card>
	</v-dialog>
	<div ref="editorElement" :class="className"></div>
</template>

<script language="js">
import { defineComponent, ref, onMounted, onUnmounted, watch, inject } from 'vue';
import debounce from 'debounce';
import EditorJS from '@editorjs/editorjs';

// Plugins
import SimpleImageTool from '@editorjs/simple-image';
import ParagraphTool from './topos-tools/topos-paragraph';
import QuoteTool from './topos-tools/topos-quote';
import WarningTool from '@editorjs/warning';
import ChecklistTool from '@editorjs/checklist';
import DelimiterTool from '@editorjs/delimiter';
import TableTool from '@editorjs/table';
import CodeTool from '@editorjs/code';
import HeaderTool from '@editorjs/header';
import UnderlineTool from '@editorjs/underline';
import EmbedTool from '@editorjs/embed';
import MarkerTool from '@editorjs/marker';
import RawToolTool from '@editorjs/raw';
import InlineCodeTool from '@editorjs/inline-code';
import TextAlignTool from '@canburaks/text-align-editorjs';
import AlertTool from 'editorjs-alert';
import StrikethroughTool from '@itech-indrustries/editorjs-strikethrough';
import ListTool from './custom-plugins/plugin-list-patch';
import ImageTool from './custom-plugins/plugin-image-patch';
import AttachesTool from './custom-plugins/plugin-attaches-patch';
import PersonalityTool from './custom-plugins/plugin-personality-patch';
import FootnotesTune from '@editorjs/footnotes';
import Carousel from './topos-tools/topos-gallery';
import EditorJSLayout from 'editorjs-layout';

export default defineComponent({
	props: {
		value: {
			type: Object,
			default: null,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		placeholder: {
			type: String,
			default: null,
		},
		tools: {
			type: Array,
			default: () => [
				'header',
				'list',
				'code',
				'image',
				'paragraph',
				'delimiter',
				'checklist',
				'quote',
				'underline',
				'footnote',
			],
		},
		tunes: ['footnote'],
		font: {
			type: String,
			default: 'sans-serif',
		},
		bordered: {
			type: Boolean,
			default: true,
		},
		folder: {
			type: String,
			default: undefined,
		},
	},
	emits: ['input', 'error'],
	setup(props, { emit, attrs }) {
		const api = inject('api');
		const { useCollectionsStore } = inject('stores');
		const collectionStore = useCollectionsStore();

		const editorjsInstance = ref(null);
		const uploaderComponentElement = ref(null);
		const editorElement = ref(null);
		const fileHandler = ref(null);
		const haveFilesAccess = Boolean(collectionStore.getCollection('directus_files'));

		const editorValueEmitter = debounce((context) => {
			if (props.disabled || !context) return;

			context.saver
				.save()
				.then((result) => {
					if (!result || result.blocks.length < 1) {
						emit('input', null);
					} else {
						emit('input', result);
					}
				})
				.catch(() => emit('error', 'Cannot get content'));
		}, 250);

		onMounted(() => {
			editorjsInstance.value = new EditorJS({
				// @ts-ignore
				logLevel: 'VERBOSE',
				holder: editorElement.value,
				data: getPreparedValue(props.value),
				// Readonly makes troubles in some cases, also requires all plugins to implement it.
				// https://github.com/codex-team/editor.js/issues/1669
				readOnly: false,
				placeholder: props.placeholder,
				tools: buildToolsOptions(),
				minHeight: 24,
				onChange: editorValueEmitter,
			});

			if (attrs.autofocus) {
				editorjsInstance.value.focus();
			}
		});

		onUnmounted(() => {
			if (!editorjsInstance.value) return;
			editorjsInstance.value.destroy();
		});

		watch(
			() => props.value,
			(newVal, oldVal) => {
				if (
					!editorjsInstance.value ||
					// @TODO use better method for comparing.
					JSON.stringify(newVal?.blocks) === JSON.stringify(oldVal?.blocks)
				) {
					return;
				}

				editorjsInstance.value.isReady.then(() => {
					if (
						editorjsInstance.value.configuration.holder.contains(document.activeElement) ||
						fileHandler.value !== null
					) {
						return;
					}

					editorjsInstance.value.render(getPreparedValue(newVal));
				});
			}
		);

		return {
			editorjsInstance,
			editorElement,
			uploaderComponentElement,
			fileHandler,
			className: {
				[props.font]: true,
				bordered: props.bordered,
			},
			haveFilesAccess,

			// Methods
			editorValueEmitter,
			unsetFileHandler,
			setFileHandler,
			handleFile,
			getUploadFieldElement,
			addTokenToURL,
			getPreparedValue,
			buildToolsOptions,
		};

		function unsetFileHandler() {
			fileHandler.value = null;
		}

		function setFileHandler(handler) {
			fileHandler.value = handler;
		}

		function handleFile(event) {
			console.log('handleFile (event)', event);
			fileHandler.value(event);
			unsetFileHandler();
		}

		function getUploadFieldElement() {
			return uploaderComponentElement;
		}

		function getPreparedValue(value) {
			if (typeof value !== 'object') {
				return {
					time: null,
					version: 0,
					blocks: [],
				};
			}

			return {
				time: value?.time,
				version: value?.version,
				blocks: value?.blocks || [],
			};
		}

		/**
		 * @returns {{}}
		 */
		function buildToolsOptions() {
			const uploaderConfig = {
				addTokenToURL,
				baseURL: api.defaults.baseURL,
				picker: setFileHandler,
				getUploadFieldElement,
			};

			const defaults = {
				alert: {
					class: AlertTool,
				},
				attaches: {
					class: AttachesTool,
					config: {
						uploader: uploaderConfig,
					},
				},
				carousel: {
					class: Carousel,
					config: {
						uploader: uploaderConfig,
					},
				},
				checklist: {
					class: ChecklistTool,
					inlineToolbar: true,
				},
				code: {
					class: CodeTool,
				},
				delimiter: {
					class: DelimiterTool,
				},
				embed: {
					class: EmbedTool,
					inlineToolbar: true,
				},
				footnote: {
					class: FootnotesTune,
					inlineToolbar: true,
					shortcut: 'CMD+SHIFT+F',
				},
				header: {
					class: HeaderTool,
					inlineToolbar: true,
					shortcut: 'CMD+SHIFT+H',
				},
				image: {
					class: ImageTool,
					config: {
						uploader: uploaderConfig,
					},
				},
				inlinecode: {
					class: InlineCodeTool,
					shortcut: 'CMD+SHIFT+I',
				},
				layout: {
					class: EditorJSLayout.LayoutBlockTool,
					config: {
						EditorJS,
						editorJSConfig: {},
						enableLayoutEditing: true,
						enableLayoutSaving: true,
						initialData: {
							itemContent: {
								1: {
									blocks: [],
								},
							},
							layout: {
								type: 'container',
								id: '',
								className: '',
								style: 'border: 1px solid #000000; ',
								children: [
									{
										type: 'item',
										id: '',
										className: '',
										style: 'border: 1px solid #000000; display: inline-block; ',
										itemContentId: '1',
									},
								],
							},
						},
					},
					shortcut: 'CMD+SHIFT+L',
					toolbox: {
						icon: `
              <svg xmlns='http://www.w3.org/2000/svg' width="16" height="16" viewBox='0 0 512 512'>
                <rect x='128' y='128' width='336' height='336' rx='57' ry='57' fill='none' stroke='currentColor' stroke-linejoin='round' stroke-width='32'/>
                <path d='M383.5 128l.5-24a56.16 56.16 0 00-56-56H112a64.19 64.19 0 00-64 64v216a56.16 56.16 0 0056 56h24' fill='none' stroke='currentColor' stroke-linecap='round' stroke-linejoin='round' stroke-width='32'/>
              </svg>
            `,
						title: '2 columns',
					},
				},
				list: {
					class: ListTool,
					inlineToolbar: true,
					shortcut: 'CMD+SHIFT+1',
				},
				marker: {
					class: MarkerTool,
					shortcut: 'CMD+SHIFT+M',
				},
				paragraph: {
					class: ParagraphTool,
					inlineToolbar: true,
					tunes: ['footnote'],
				},
				personality: {
					class: PersonalityTool,
					config: {
						uploader: uploaderConfig,
					},
				},
				quote: {
					class: QuoteTool,
					inlineToolbar: true,
					shortcut: 'CMD+SHIFT+O',
				},
				raw: {
					class: RawToolTool,
				},
				simpleimage: {
					class: SimpleImageTool,
				},
				strikethrough: {
					class: StrikethroughTool,
				},
				table: {
					class: TableTool,
					inlineToolbar: true,
				},
				textalign: {
					class: TextAlignTool,
					inlineToolbar: true,
					shortcut: 'CMD+SHIFT+A',
				},
				underline: {
					class: UnderlineTool,
					shortcut: 'CMD+SHIFT+U',
				},
				warning: {
					class: WarningTool,
					inlineToolbar: true,
					shortcut: 'CMD+SHIFT+W',
				},
			};

			// Build current tools config.
			const tools = {};
			const fileRequiresTools = ['attaches', 'personality', 'image'];
			for (const toolName of props.tools) {
				if (!haveFilesAccess && fileRequiresTools.includes(toolName)) continue;
				// @ts-ignore
				if (toolName in defaults) {
					tools[toolName.toString()] = defaults[toolName];
				}
			}

			return tools;
		}

		function addQueryToPath(path, query) {
			const queryParams = [];

			for (const [key, value] of Object.entries(query)) {
				queryParams.push(`${key}=${value}`);
			}

			return path.includes('?') ? `${path}&${queryParams.join('&')}` : `${path}?${queryParams.join('&')}`;
		}

		function getToken() {
<<<<<<< HEAD
			return (
				api.defaults.headers?.['Authorization']?.split(' ')[1] ||
				api.defaults.headers?.common?.['Authorization']?.split(' ')[1] ||
				null
			);
=======
			return api.defaults.headers?.['Authorization']?.split(' ')[1]
				|| api.defaults.headers?.common?.['Authorization']?.split(' ')[1]
				|| null;
>>>>>>> main
		}

		function addTokenToURL(url, token) {
			const accessToken = token || getToken();
			if (!accessToken) return url;
			return addQueryToPath(url, {
				access_token: accessToken,
			});
		}
	},
});
</script>

<style lang="css" scoped>
.bordered {
	padding: var(--input-padding);
	background-color: var(--background-page);
	border: var(--border-width) solid var(--border-normal);
	border-radius: var(--border-radius);
}

.bordered:hover {
	border-color: var(--border-normal-alt);
}

.bordered:focus-within {
	border-color: var(--primary);
}

.monospace {
	font-family: var(--family-monospace);
}

.serif {
	font-family: var(--family-serif);
}

.sans-serif {
	font-family: var(--family-sans-serif);
}
</style>

<style src="./editorjs-content-reset.css"></style>
<style src="./editorjs-components.css"></style>
<style src="./topos-tools/topos-image/index.scss" lang="scss"></style>
<style src="./topos-tools/topos-gallery/index.css"></style>
