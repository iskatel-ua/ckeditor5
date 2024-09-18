/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

import type {
	Bookmark,
	BookmarkEditing,
	InsertBookmarkCommand,
	UpdateBookmarkCommand
} from './index.js';

declare module '@ckeditor/ckeditor5-core' {
	interface PluginsMap {
		[ Bookmark.pluginName ]: Bookmark;
		[ BookmarkEditing.pluginName ]: BookmarkEditing;
	}

	interface CommandsMap {
		insertBookmark: InsertBookmarkCommand;
		updateBookmark: UpdateBookmarkCommand;
	}
}
