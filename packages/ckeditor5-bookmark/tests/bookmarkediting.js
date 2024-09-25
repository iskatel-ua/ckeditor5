/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/* global document */

import BookmarkEditing from '../src/bookmarkediting.js';
import InsertBookmarkCommand from '../src/insertbookmarkcommand.js';
import UpdateBookmarkCommand from '../src/updatebookmarkcommand.js';

import { Enter } from '@ckeditor/ckeditor5-enter';
import { Heading } from '@ckeditor/ckeditor5-heading';
import { Paragraph } from '@ckeditor/ckeditor5-paragraph';
import { Image } from '@ckeditor/ckeditor5-image';
import { Undo } from '@ckeditor/ckeditor5-undo';
import { Link } from '@ckeditor/ckeditor5-link';
import { Bold } from '@ckeditor/ckeditor5-basic-styles';
import { GeneralHtmlSupport } from '@ckeditor/ckeditor5-html-support';
import { SelectAll } from '@ckeditor/ckeditor5-select-all';

import ClassicTestEditor from '@ckeditor/ckeditor5-core/tests/_utils/classictesteditor.js';

import { Element } from '@ckeditor/ckeditor5-engine';
import { setData as setModelData, getData as getModelData } from '@ckeditor/ckeditor5-engine/src/dev-utils/model.js';
import { getData as getViewData } from '@ckeditor/ckeditor5-engine/src/dev-utils/view.js';
import { isWidget, getLabel } from '@ckeditor/ckeditor5-widget/src/utils.js';

describe( 'BookmarkEditing', () => {
	// eslint-disable-next-line max-len
	const domUIElement = '<span class="ck-bookmark__icon"><svg class="ck ck-icon ck-reset_all-excluded" viewBox="0 0 14 16"><path class="ck-icon__fill" d="M2 14.436V2a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v12.436a.5.5 0 0 1-.819.385l-3.862-3.2a.5.5 0 0 0-.638 0l-3.862 3.2A.5.5 0 0 1 2 14.436Z"></path></svg></span>';

	let editor, element, model, view, converter;

	beforeEach( async () => {
		element = document.createElement( 'div' );
		document.body.appendChild( element );

		const config = {
			language: 'en',
			plugins: [ BookmarkEditing, Enter, Bold, Image, Heading, Paragraph, Undo, Link, SelectAll ]
		};

		editor = await createEditor( element, config );

		model = editor.model;
		view = editor.editing.view;
		converter = view.domConverter;
	} );

	afterEach( async () => {
		element.remove();
		await editor.destroy();
	} );

	it( 'defines plugin name', () => {
		expect( BookmarkEditing.pluginName ).to.equal( 'BookmarkEditing' );
	} );

	describe( 'init', () => {
		it( 'adds an "insertBookmark" command', () => {
			expect( editor.commands.get( 'insertBookmark' ) ).to.be.instanceOf( InsertBookmarkCommand );
		} );

		it( 'adds an "updateBookmark" command', () => {
			expect( editor.commands.get( 'updateBookmark' ) ).to.be.instanceOf( UpdateBookmarkCommand );
		} );
	} );

	describe( 'schema definition', () => {
		it( 'should set proper schema rules', () => {
			expect( model.schema.isRegistered( 'bookmark' ) ).to.be.true;
			expect( model.schema.isObject( 'bookmark' ) ).to.be.true;
			expect( model.schema.isInline( 'bookmark' ) ).to.be.true;

			expect( model.schema.checkAttribute( [ 'paragraph', 'bookmark' ], 'linkHref' ) ).to.be.false;
			expect( model.schema.checkAttribute( [ 'paragraph', 'bookmark' ], 'id' ) ).to.be.false;
			expect( model.schema.checkAttribute( [ 'paragraph', 'bookmark' ], 'bookmarkId' ) ).to.be.true;
			expect( model.schema.checkChild( [ 'paragraph' ], 'bookmark' ) ).to.be.true;
		} );
	} );

	describe( 'dataDowncast', () => {
		it( 'should properly downcast bookmark', () => {
			setModelData( model, '<paragraph><bookmark bookmarkId="foo"></bookmark></paragraph>' );

			expect( editor.getData() ).to.equal(
				'<p>' +
					'<a id="foo"></a>' +
				'</p>'
			);
		} );

		it( 'should properly downcast bookmark with text before', () => {
			setModelData( model, '<paragraph>Example text<bookmark bookmarkId="foo"></bookmark></paragraph>' );

			expect( editor.getData() ).to.equal(
				'<p>' +
					'Example text' +
					'<a id="foo"></a>' +
				'</p>'
			);
		} );

		it( 'should properly downcast bookmark with text and space before', () => {
			// The setModelData() is stripping a whitespace before the bookmark element.
			// Problem is solved when selection markers are placed after the whitespace.
			setModelData( model, '<paragraph>text []<bookmark bookmarkId="foo"></bookmark></paragraph>' );

			expect( editor.getData() ).to.equal(
				'<p>' +
					'text' +
					' ' +
					'<a id="foo"></a>' +
				'</p>'
			);
		} );

		it( 'should properly downcast bookmark with text after', () => {
			setModelData( model, '<paragraph><bookmark bookmarkId="foo"></bookmark>Example text</paragraph>' );

			expect( editor.getData() ).to.equal(
				'<p>' +
					'<a id="foo"></a>' +
					'Example text' +
				'</p>'
			);
		} );

		it( 'should properly downcast bookmark with space and text after', () => {
			// The setModelData() is stripping a whitespace after the bookmark element.
			// Problem is solved when selection markers are placed before the whitespace.
			setModelData( model, '<paragraph><bookmark bookmarkId="foo"></bookmark>[] text</paragraph>' );

			expect( editor.getData() ).to.equal(
				'<p>' +
					'<a id="foo"></a>' +
					' ' +
					'text' +
				'</p>'
			);
		} );

		it( 'should properly downcast bookmark with surrounded text', () => {
			setModelData( model, '<paragraph>Example<bookmark bookmarkId="foo"></bookmark>text</paragraph>' );

			expect( editor.getData() ).to.equal(
				'<p>' +
					'Example' +
					'<a id="foo"></a>' +
					'text' +
				'</p>'
			);
		} );

		it( 'should properly downcast bookmark with surrounded text with spaces before and after bookmark', () => {
			// The setModelData() is stripping a whitespace before/after the bookmark element.
			// Problem is solved when selection markers are placed before/after the whitespace.
			setModelData( model, '<paragraph>text []<bookmark bookmarkId="foo"></bookmark>[] text</paragraph>' );

			expect( editor.getData() ).to.equal(
				'<p>' +
					'text' +
					' ' +
					'<a id="foo"></a>' +
					' ' +
					'text' +
				'</p>'
			);
		} );

		it( 'should properly downcast bookmark within a heading', () => {
			setModelData( model, '<heading1><bookmark bookmarkId="foo"></bookmark></heading1>' );

			expect( editor.getData() ).to.equal(
				'<h2>' +
					'<a id="foo"></a>' +
				'</h2>'
			);
		} );

		it( 'should properly change `bookmarkId` attribute of existing bookmark', () => {
			setModelData( model, '<paragraph><bookmark bookmarkId="foo"></bookmark></paragraph>' );

			expect( editor.getData() ).to.equal(
				'<p>' +
					'<a id="foo"></a>' +
				'</p>'
			);

			editor.model.change(
				writer => writer.setAttribute( 'bookmarkId', 'bar', writer.model.document.getRoot().getChild( 0 ).getChild( 0 ) )
			);

			expect( editor.getData() ).to.equal(
				'<p>' +
					'<a id="bar"></a>' +
				'</p>'
			);
		} );
	} );

	describe( 'editingDowncast', () => {
		it( 'should properly downcast bookmark', () => {
			setModelData( model, '<paragraph><bookmark bookmarkId="foo"></bookmark></paragraph>' );

			expect( getViewData( view, { withoutSelection: true } ) ).to.equal(
				'<p>' +
					'<a class="ck-bookmark ck-widget" contenteditable="false" id="foo">' +
						'<span class="ck-bookmark__icon"></span>' +
					'</a>' +
				'</p>'
			);
		} );

		it( 'should properly downcast bookmark with text before', () => {
			setModelData( model, '<paragraph>Example text<bookmark bookmarkId="foo"></bookmark></paragraph>' );

			expect( getViewData( view, { withoutSelection: true } ) ).to.equal(
				'<p>' +
					'Example text' +
					'<a class="ck-bookmark ck-widget" contenteditable="false" id="foo">' +
						'<span class="ck-bookmark__icon"></span>' +
					'</a>' +
				'</p>'
			);
		} );

		it( 'should properly downcast bookmark with text and space before', () => {
			// The setModelData() is stripping a whitespace before the bookmark element.
			// Problem is solved when selection markers are placed after the whitespace.
			setModelData( model, '<paragraph>text []<bookmark bookmarkId="foo"></bookmark></paragraph>' );

			expect( getViewData( view, { withoutSelection: true } ) ).to.equal(
				'<p>' +
					'text' +
					' ' +
					'<a class="ck-bookmark ck-widget" contenteditable="false" id="foo">' +
						'<span class="ck-bookmark__icon"></span>' +
					'</a>' +
				'</p>'
			);
		} );

		it( 'should properly downcast bookmark with text after', () => {
			setModelData( model, '<paragraph><bookmark bookmarkId="foo"></bookmark>Example text</paragraph>' );

			expect( getViewData( view, { withoutSelection: true } ) ).to.equal(
				'<p>' +
					'<a class="ck-bookmark ck-widget" contenteditable="false" id="foo">' +
						'<span class="ck-bookmark__icon"></span>' +
					'</a>' +
					'Example text' +
				'</p>'
			);
		} );

		it( 'should properly downcast bookmark with space and text after', () => {
			// The setModelData() is stripping a whitespace after the bookmark element.
			// Problem is solved when selection markers are placed before the whitespace.
			setModelData( model, '<paragraph><bookmark bookmarkId="foo"></bookmark>[] text</paragraph>' );

			expect( getViewData( view, { withoutSelection: true } ) ).to.equal(
				'<p>' +
					'<a class="ck-bookmark ck-widget" contenteditable="false" id="foo">' +
						'<span class="ck-bookmark__icon"></span>' +
					'</a>' +
					' ' +
					'text' +
				'</p>'
			);
		} );

		it( 'should properly downcast bookmark with surrounded text', () => {
			setModelData( model, '<paragraph>Example<bookmark bookmarkId="foo"></bookmark>text</paragraph>' );

			expect( getViewData( view, { withoutSelection: true } ) ).to.equal(
				'<p>' +
					'Example' +
					'<a class="ck-bookmark ck-widget" contenteditable="false" id="foo">' +
						'<span class="ck-bookmark__icon"></span>' +
					'</a>' +
					'text' +
				'</p>'
			);
		} );

		it( 'should properly downcast bookmark with surrounded text with spaces before and after bookmark', () => {
			// The setModelData() is stripping a whitespace before/after the bookmark element.
			// Problem is solved when selection markers are placed before/after the whitespace.
			setModelData( model, '<paragraph>Example []<bookmark bookmarkId="foo"></bookmark>[] text</paragraph>' );

			expect( getViewData( view, { withoutSelection: true } ) ).to.equal(
				'<p>' +
					'Example' +
					' ' +
					'<a class="ck-bookmark ck-widget" contenteditable="false" id="foo">' +
						'<span class="ck-bookmark__icon"></span>' +
					'</a>' +
					' ' +
					'text' +
				'</p>'
			);
		} );

		it( 'should properly downcast bookmark inside heading', () => {
			setModelData( model, '<heading1><bookmark bookmarkId="foo"></bookmark></heading1>' );

			expect( getViewData( view, { withoutSelection: true } ) ).to.equal(
				'<h2>' +
					'<a class="ck-bookmark ck-widget" contenteditable="false" id="foo">' +
						'<span class="ck-bookmark__icon"></span>' +
					'</a>' +
				'</h2>'
			);
		} );

		it( 'should properly change `bookmarkId` attribute of existing bookmark', () => {
			setModelData( model, '<paragraph><bookmark bookmarkId="foo"></bookmark></paragraph>' );

			expect( getViewData( view, { withoutSelection: true } ) ).to.equal(
				'<p>' +
					'<a class="ck-bookmark ck-widget" contenteditable="false" id="foo">' +
						'<span class="ck-bookmark__icon"></span>' +
					'</a>' +
				'</p>'
			);

			editor.model.change(
				writer => writer.setAttribute( 'bookmarkId', 'bar', writer.model.document.getRoot().getChild( 0 ).getChild( 0 ) )
			);

			expect( getViewData( view, { withoutSelection: true } ) ).to.equal(
				'<p>' +
					'<a class="ck-bookmark ck-widget" contenteditable="false" id="bar">' +
						'<span class="ck-bookmark__icon"></span>' +
					'</a>' +
				'</p>'
			);
		} );

		it( 'should properly downcast bookmark with proper type', () => {
			setModelData( model, '<paragraph><bookmark bookmarkId="foo"></bookmark></paragraph>' );

			expect( getViewData( view, { withoutSelection: true, showType: true } ) ).to.equal(
				'<container:p>' +
					'<container:a class="ck-bookmark ck-widget" contenteditable="false" id="foo">' +
						'<ui:span class="ck-bookmark__icon"></ui:span>' +
					'</container:a>' +
				'</container:p>'
			);
		} );

		it( 'should have properly structured UI element', () => {
			setModelData( model, '<paragraph><bookmark bookmarkId="foo"></bookmark></paragraph>' );

			// Get the `bookmark` widget.
			const bookmarkWidget = view.document.getRoot().getChild( 0 ).getChild( 0 );

			expect( isWidget( bookmarkWidget ) ).to.be.true;
			expect( getLabel( bookmarkWidget ) ).to.equal( 'foo bookmark widget' );

			expect( bookmarkWidget.name ).to.equal( 'a' );
			expect( bookmarkWidget.hasClass( 'ck-bookmark' ) ).to.be.true;
			expect( bookmarkWidget.childCount ).to.equal( 1 );

			const iconContainer = bookmarkWidget.getChild( 0 );

			expect( iconContainer.is( 'uiElement' ) ).to.be.true;
			expect( iconContainer.isEmpty ).to.be.true;

			expect( bookmarkWidget.getFillerOffset ).is.a( 'function' );
			expect( bookmarkWidget.getFillerOffset() ).to.equal( null );
		} );

		it( 'should not add any filler', () => {
			setModelData( model, '<paragraph>[<bookmark bookmarkId="foo"></bookmark>]</paragraph>' );

			const element = view.document.selection.getSelectedElement();
			const domElement = converter.viewToDom( element );

			expect( domElement.outerHTML ).to.equal(
				'<a class="ck-bookmark ck-widget ck-widget_selected" id="foo" contenteditable="false">' +
					domUIElement +
				'</a>' );

			expect( domElement.children.length ).to.equal( 1 );
		} );
	} );

	describe( 'upcast', () => {
		it( 'should properly convert an `a` with `id` attribute', () => {
			editor.setData( '<p><a id="foo"></a></p>' );

			expect( getModelData( model, { withoutSelection: true } ) ).to.equal(
				'<paragraph><bookmark bookmarkId="foo"></bookmark></paragraph>'
			);
		} );

		it( 'should properly convert an `a` with `id` attribute with text before', () => {
			editor.setData( '<p>Example text<a id="foo"></a></p>' );

			expect( getModelData( model, { withoutSelection: true } ) ).to.equal(
				'<paragraph>Example text<bookmark bookmarkId="foo"></bookmark></paragraph>'
			);
		} );

		it( 'should properly convert an `a` with `id` attribute with text before with space', () => {
			editor.setData( '<p>text <a id="foo"></a></p>' );

			expect( getModelData( model, { withoutSelection: true } ) ).to.equal(
				'<paragraph>text <bookmark bookmarkId="foo"></bookmark></paragraph>'
			);
		} );

		it( 'should properly convert an `a` with `id` attribute with text after', () => {
			editor.setData( '<p><a id="foo"></a>Example text</p>' );

			expect( getModelData( model, { withoutSelection: true } ) ).to.equal(
				'<paragraph><bookmark bookmarkId="foo"></bookmark>Example text</paragraph>'
			);
		} );

		it( 'should properly convert an `a` with `id` attribute with text after with space', () => {
			editor.setData( '<p><a id="foo"></a> text</p>' );

			expect( getModelData( model, { withoutSelection: true } ) ).to.equal(
				'<paragraph><bookmark bookmarkId="foo"></bookmark> text</paragraph>'
			);
		} );

		it( 'should properly convert an `a` with `id` attribute surrounded with text', () => {
			editor.setData( '<p>Example<a id="foo"></a>text</p>' );

			expect( getModelData( model, { withoutSelection: true } ) ).to.equal(
				'<paragraph>Example<bookmark bookmarkId="foo"></bookmark>text</paragraph>'
			);
		} );

		it( 'should properly convert an `a` with `id` attribute text with spaces before and after', () => {
			editor.setData( '<p>Example <a id="foo"></a> text</p>' );

			expect( getModelData( model, { withoutSelection: true } ) ).to.equal(
				'<paragraph>Example <bookmark bookmarkId="foo"></bookmark> text</paragraph>'
			);
		} );

		it( 'should not convert an `a` with `id` attribute and with text inside', () => {
			editor.setData( '<p><a id="foo">foobar</a></p>' );

			expect( getModelData( model, { withoutSelection: true } ) ).to.equal(
				'<paragraph>foobar</paragraph>'
			);
		} );

		it( 'should not convert an `a` with `id` and `href` attribute and without text inside', () => {
			editor.setData( '<p><a id="foo" href="www.ckeditor.com"></a></p>' );

			expect( getModelData( model, { withoutSelection: true } ) ).to.equal(
				'<paragraph></paragraph>'
			);
		} );

		it( 'should not convert `a` with `id` and `href` attribute and with text inside', () => {
			editor.setData( '<p><a id="foo" href="www.ckeditor.com">foobar</a></p>' );

			expect( getModelData( model, { withoutSelection: true } ) ).to.equal(
				'<paragraph><$text linkHref="www.ckeditor.com">foobar</$text></paragraph>'
			);
		} );

		it( 'should not convert `p` with `id` attribute', () => {
			editor.setData( '<p id="foo"></p>' );

			expect( getModelData( model, { withoutSelection: true } ) ).to.equal(
				'<paragraph></paragraph>'
			);
		} );

		it( 'should not convert `p` with `id` attribute and text inside', () => {
			editor.setData( '<p id="foo">bar</p>' );

			expect( getModelData( model, { withoutSelection: true } ) ).to.equal(
				'<paragraph>bar</paragraph>'
			);
		} );

		it( 'should not convert `h2` with `id` attribute', () => {
			editor.setData( '<h2 id="foo"></h2>' );

			expect( getModelData( model, { withoutSelection: true } ) ).to.equal(
				'<heading1></heading1>'
			);
		} );

		it( 'should not convert `h2` with `id` attribute and text inside', () => {
			editor.setData( '<h2 id="foo">bar</h2>' );

			expect( getModelData( model, { withoutSelection: true } ) ).to.equal(
				'<heading1>bar</heading1>'
			);
		} );

		describe( 'with GHS enabled', () => {
			let element, editor, model;
			beforeEach( async () => {
				element = document.createElement( 'div' );
				document.body.appendChild( element );

				const config = {
					language: 'en',
					plugins: [ BookmarkEditing, Enter, Image, Heading, Paragraph, Undo, Link, GeneralHtmlSupport ],
					htmlSupport: {
						allow: [
							{
								name: /^.*$/,
								styles: true,
								attributes: true,
								classes: true
							}
						]
					}
				};

				editor = await createEditor( element, config );

				model = editor.model;
			} );

			afterEach( async () => {
				element.remove();
				await editor.destroy();
			} );

			it( 'should properly convert an `a` with `id` attribute', () => {
				editor.setData( '<p><a id="foo"></a></p>' );

				expect( getModelData( model, { withoutSelection: true } ) ).to.equal(
					'<paragraph><bookmark bookmarkId="foo"></bookmark></paragraph>'
				);
			} );

			it( 'should not convert an `a` with `id` attribute and with text inside', () => {
				editor.setData( '<p><a id="foo">foobar</a></p>' );

				expect( getModelData( model, { withoutSelection: true } ) ).to.equal(
					'<paragraph><$text htmlA="{"attributes":{"id":"foo"}}">foobar</$text></paragraph>'
				);
			} );
		} );
	} );

	describe( '_bookmarkElements', () => {
		it( 'should properly add bookmark to _bookmarkElements map', () => {
			const bookmarkEditing = editor.plugins.get( 'BookmarkEditing' );

			expect( bookmarkEditing._bookmarkElements.size ).to.equal( 0 );

			editor.setData( '<p><a id="foo"></a></p>' );

			expect( bookmarkEditing._bookmarkElements.size ).to.equal( 1 );
		} );

		it( 'should properly add all bookmarks to _bookmarkElements map', () => {
			const bookmarkEditing = editor.plugins.get( 'BookmarkEditing' );

			expect( bookmarkEditing._bookmarkElements.size ).to.equal( 0 );

			editor.setData(
				'<p>' +
					'<a id="foo"></a>' +
				'</p>' +
				'<p>' +
					'text before<a id="bar"></a>' +
				'</p>' +
				'<p>' +
					'space before bookmark <a id="baz"></a>' +
				'</p>' +
				'<p>' +
					'<a id="xyz"></a>text after' +
				'</p>' +
				'<p>' +
					'<a id="bookmark_01"></a> space after bookmark' +
				'</p>' +
				'<p>' +
					'space before bookmark <a id="another_bookmark_name"></a> space after bookmark' +
				'</p>'
			);

			expect( bookmarkEditing._bookmarkElements.size ).to.equal( 6 );
		} );

		it( 'should properly add all bookmarks to _bookmarkElements map even with duplicated ids', () => {
			const bookmarkEditing = editor.plugins.get( 'BookmarkEditing' );

			expect( bookmarkEditing._bookmarkElements.size ).to.equal( 0 );

			editor.setData(
				'<p>' +
					'<a id="foo"></a>' +
				'</p>' +
				'<p>' +
					'<a id="bar"></a>' +
				'</p>' +
				'<p>' +
					'<a id="baz"></a>' +
				'</p>' +
				'<p>' +
					'<a id="foo"></a>duplicate' +
				'</p>' +
				'<p>' +
					'<a id="foo"></a>another duplicate' +
				'</p>'
			);

			expect( bookmarkEditing._bookmarkElements.size ).to.equal( 5 );
		} );

		it( 'should properly remove all bookmarks from _bookmarkElements map after removed all content', () => {
			const bookmarkEditing = editor.plugins.get( 'BookmarkEditing' );

			expect( bookmarkEditing._bookmarkElements.size ).to.equal( 0 );

			editor.setData(
				'<p>' +
					'<a id="foo"></a>' +
				'</p>' +
				'<p>' +
					'text before<a id="bar"></a>' +
				'</p>' +
				'<p>' +
					'space before bookmark <a id="baz"></a>' +
				'</p>' +
				'<p>' +
					'<a id="xyz"></a>text after' +
				'</p>' +
				'<p>' +
					'<a id="bookmark_01"></a> space after bookmark' +
				'</p>' +
				'<p>' +
					'space before bookmark <a id="another_bookmark_name"></a> space after bookmark' +
				'</p>'
			);

			expect( bookmarkEditing._bookmarkElements.size ).to.equal( 6 );

			editor.execute( 'selectAll' );
			editor.execute( 'delete' );

			expect( bookmarkEditing._bookmarkElements.size ).to.equal( 0 );

			expect( getModelData( model, { withoutSelection: true } ) ).to.equal(
				'<paragraph></paragraph>'
			);
		} );

		it( 'should properly remove all bookmarks from _bookmarkElements map which were in a removed paragraph', () => {
			const bookmarkEditing = editor.plugins.get( 'BookmarkEditing' );

			expect( bookmarkEditing._bookmarkElements.size ).to.equal( 0 );

			editor.setData(
				'<p>' +
					'<a id="foo"></a>' +
				'</p>' +
				'<p>' +
					'foo<a id="bar"></a><a id="baz"></a><a id="xyz"></a>bar' +
				'</p>'
			);

			expect( bookmarkEditing._bookmarkElements.size ).to.equal( 4 );

			const root = editor.model.document.getRoot();

			// Move start selection at the end of first paragraph and end of the selection to the end of 2nd paragraph.
			editor.model.change( writer => {
				writer.setSelection( writer.createRange(
					writer.createPositionAt( root.getChild( 0 ), 1 ),
					writer.createPositionAt( root.getChild( 1 ), 9 )
				), true );
			} );

			// Remove everything what is selected.
			editor.execute( 'delete' );

			expect( bookmarkEditing._bookmarkElements.size ).to.equal( 1 );

			expect( getModelData( model, { withoutSelection: true } ) ).to.equal(
				'<paragraph><bookmark bookmarkId="foo"></bookmark></paragraph>'
			);
		} );
	} );

	describe( 'getElementForBookmarkId', () => {
		it( 'returns a bookmark element if exists with passed id', () => {
			const bookmarkEditing = editor.plugins.get( 'BookmarkEditing' );

			editor.setData(
				'<p>' +
					'<a id="foo"></a>' +
				'</p>' +
				'<p>' +
					'<a id="bar"></a>' +
				'</p>' +
				'<p>' +
					'<a id="baz"></a>' +
				'</p>'
			);

			expect( bookmarkEditing.getElementForBookmarkId( 'foo' ) ).is.instanceof( Element );
			expect( bookmarkEditing.getElementForBookmarkId( 'foo' ).getAttribute( 'bookmarkId' ) ).is.equal( 'foo' );
		} );

		it( 'returns null when there is no bookmark with passed id', () => {
			const bookmarkEditing = editor.plugins.get( 'BookmarkEditing' );

			editor.setData(
				'<p>' +
					'<a id="foo"></a>' +
				'</p>' +
				'<p>' +
					'<a id="bar"></a>' +
				'</p>' +
				'<p>' +
					'<a id="baz"></a>' +
				'</p>'
			);

			expect( bookmarkEditing.getElementForBookmarkId( 'xyz' ) ).is.null;
		} );
	} );
} );

async function createEditor( element, config ) {
	const editor = await ClassicTestEditor.create( element, config );

	return editor;
}
