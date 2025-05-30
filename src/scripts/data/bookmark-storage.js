const STORAGE_KEY = 'BOOKMARKED_STORIES';

const BookmarkStorage = {
  getAllBookmarks() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  },

  saveBookmark(story) {
    const bookmarks = this.getAllBookmarks();
    bookmarks.push(story);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
  },

  removeBookmark(storyId) {
    const bookmarks = this.getAllBookmarks();
    const filteredBookmarks = bookmarks.filter((story) => story.id !== storyId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredBookmarks));
  },

  isBookmarked(storyId) {
    const bookmarks = this.getAllBookmarks();
    return bookmarks.some((story) => story.id === storyId);
  },
};

export default BookmarkStorage;