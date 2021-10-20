import { defineInterface } from '@directus/shared/utils';
import InterfaceComponent from './interface.vue';

export default defineInterface({
	id: 'extension-editorjs',
	name: 'Editor.js',
	description: 'Block-styled editor for rich media stories, outputs clean data in JSON using Editor.js',
	icon: 'add_circle',
	component: InterfaceComponent,
	types: ['json'],
	options: [
		{
			field: 'placeholder',
			name: '$t:placeholder',
			meta: {
				width: 'half',
				interface: 'text-input',
			},
		},
		{
			field: 'font',
			name: '$t:font',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'select-dropdown',
				options: {
					choices: [
						{ text: '$t:sans_serif', value: 'sans-serif' },
						{ text: '$t:monospace', value: 'monospace' },
						{ text: '$t:serif', value: 'serif' },
					],
				},
			},
			schema: {
				default_value: 'sans-serif',
			},
		},
		{
			field: 'tools',
			name: '$t:interfaces.input-rich-text-html.toolbar',
			type: 'json',
			schema: {
				default_value: ['header', 'list', 'code', 'image', 'paragraph', 'delimiter', 'checklist', 'quote', 'underline'],
			},
			meta: {
				width: 'half',
				interface: 'select-multiple-dropdown',
				options: {
					choices: [
						{ value: 'alert', text: 'Alert' },
						{ value: 'attaches', text: 'Attaches' },
						{ value: 'checklist', text: 'Checklist' },
						{ value: 'carousel', text: 'Checklist' },
						{ value: 'code', text: 'Code' },
						{ value: 'delimiter', text: 'Delimiter' },
						{ value: 'embed', text: 'Embed' },
						{ value: 'footnote', text: 'Footnote' },
						{ value: 'header', text: 'Header' },
						{ value: 'image', text: 'Image' },
						{ value: 'inlinecode', text: 'Inline Code' },
						{ value: 'list', text: 'List' },
						{ value: 'marker', text: 'Marker' },
						{ value: 'paragraph', text: 'Paragraph' },
						{ value: 'personality', text: 'Personality' },
						{ value: 'quote', text: 'Quote' },
						{ value: 'raw', text: 'Raw HTML' },
						{ value: 'simpleimage', text: 'Simple Image' },
						{ value: 'strikethrough', text: 'Strikethrough' },
						{ value: 'table', text: 'Table' },
						{ value: 'textalign', text: 'Align' },
						{ value: 'underline', text: 'Underline' },
						{ value: 'warning', text: 'Warning' },
					],
				},
			},
		},
		{
			field: 'bordered',
			name: 'Border',
			type: 'boolean',
			meta: {
				width: 'half',
				interface: 'toggle',
			},
			schema: {
				default_value: true,
			},
		},
		{
			field: 'folder',
			name: '$t:interfaces.system-folder.folder',
			type: 'uuid',
			meta: {
				width: 'full',
				interface: 'system-folder',
				note: '$t:interfaces.system-folder.field_hint',
			},
			schema: {
				default_value: undefined,
			},
		},
	],
});
