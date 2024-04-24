import SimpleImageTool from '@editorjs/simple-image';
import ParagraphTool from '@editorjs/paragraph';
import QuoteTool from '@editorjs/quote';
import ChecklistTool from '@editorjs/checklist';
import DelimiterTool from '@editorjs/delimiter';
import TableTool from '@editorjs/table';
import CodeTool from '@editorjs/code';
import HeaderTool from '@editorjs/header';
import UnderlineTool from '@editorjs/underline';
import EmbedTool from '@editorjs/embed';
import RawToolTool from '@editorjs/raw';
import InlineCodeTool from '@editorjs/inline-code';
import StrikethroughTool from '@itech-indrustries/editorjs-strikethrough';
import AlignmentTuneTool from 'editorjs-text-alignment-blocktune';
import NestedListTool from '../../editor-js-nested-list/dist/nested-list';
import { ImageTool } from './custom-plugins/plugin-image-patch';
import { AttachesTool } from './custom-plugins/plugin-attaches-patch';
import InvertedDelimiterTool from '../../editorjs-inverted-delimiter/dist/bundle';
import InlineSmallTool from '../../editorjs-inline-small/dist/bundle';
import ButtonTool from '../../editorjs-button/dist/bundle';
import IframeTool from '../../editorjs-iframe/dist/bundle';
import { EditorJsImage } from './use-image';

export type UploaderConfig = {
	baseURL: string | undefined;
	setFileHandler: (handler: any) => void;
	t: Record<string, string>;
	openImageDrawer: () => void;
	onImageEdit: (image: EditorJsImage) => void;
	getImagePreviewUrl: (imageUrl: string) => string;
	getRokkaHash: (imageId: string) => Promise<string>;
};

export default function getTools(
	uploaderConfig: UploaderConfig,
	selection: Array<string>,
	haveFilesAccess: boolean,
): Record<string, object> {
	const tools: Record<string, any> = {};
	const fileRequiresTools = ['attaches', 'image'];

	const defaults: Record<string, any> = {
		header: {
			class: HeaderTool,
			inlineToolbar: true,
			config: {
				levels: [2, 3, 4],
				defaultLevel: 2,
			},
		},
		list: {
			class: NestedListTool,
			inlineToolbar: false,
		},
		nestedlist: {
			class: NestedListTool,
			inlineToolbar: true,
		},
		embed: {
			class: EmbedTool,
			inlineToolbar: true,
			config: {
				services: {
					youtube: true,
					vimeo: true,
				},
			},
		},
		paragraph: {
			class: ParagraphTool,
			inlineToolbar: true,
		},
		code: {
			class: CodeTool,
		},
		underline: {
			class: UnderlineTool,
		},
		strikethrough: {
			class: StrikethroughTool,
		},
		table: {
			class: TableTool,
			inlineToolbar: true,
		},
		quote: {
			class: QuoteTool,
			inlineToolbar: true,
		},
		inlinecode: {
			class: InlineCodeTool,
		},
		inlinesmall: {
			class: InlineSmallTool,
		},
		delimiter: {
			class: DelimiterTool,
		},
		raw: {
			class: RawToolTool,
		},
		checklist: {
			class: ChecklistTool,
			inlineToolbar: true,
		},
		simpleimage: {
			class: SimpleImageTool,
		},
		image: {
			class: ImageTool,
			config: {
				uploader: uploaderConfig,
			},
		},
		attaches: {
			class: AttachesTool,
			config: {
				uploader: uploaderConfig,
			},
		},
		alignmentTune: {
			class: AlignmentTuneTool,
		},
		inverteddelimiter: {
			class: InvertedDelimiterTool,
		},
		button: {
			class: ButtonTool,
		},
		iframe: {
			class: IframeTool,
		},
	};

	for (const toolName of selection) {
		if (!haveFilesAccess && fileRequiresTools.includes(toolName)) continue;

		if (toolName in defaults) {
			tools[toolName] = defaults[toolName];
		}
	}

	// Add alignment to all tools that support it if it's enabled.
	// editor.js tools means we need to already declare alignment in the tools object before we can assign it to other tools.
	if ('alignmentTune' in tools) {
		if ('paragraph' in tools) {
			tools['paragraph'].tunes = ['alignmentTune'];
		}

		if ('header' in tools) {
			tools['header'].tunes = ['alignmentTune'];
		}

		if ('quote' in tools) {
			tools['quote'].tunes = ['alignmentTune'];
		}
	}

	return tools;
}
