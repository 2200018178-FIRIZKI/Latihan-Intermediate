import {
  generateLoaderAbsoluteTemplate,
  generateReportItemTemplate,
  generateReportsListEmptyTemplate,
  generateReportsListErrorTemplate,
} from '../../templates';
import HomePresenter from './home-presenter';
import Map from '../../utils/map';
import * as StoryAPI from '../../data/api'; // Import semua fungsi API sebagai StoryAPI

export default class HomePage {
  #presenter = null;
  #map = null;

  async render() {
    return `
      <section>
        <div class="stories-list__map__container">
          <div id="map" class="stories-list__map"></div>
          <div id="map-loading-container"></div>
        </div>
      </section>
      <section class="container">
        <h1 class="section-title">Daftar Cerita</h1>
        <div class="stories-list__container">
          <div id="stories-list"></div> 
          <div id="stories-list-loading-container"></div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    this.#presenter = new HomePresenter({
      view: this,
      model: StoryAPI, // <-- sekarang StoryAPI sudah terdefinisi
    });
    await this.#presenter.initialGalleryAndMap();
  }

  populateStoriesList(stories) {
    const storiesListContainer = document.getElementById('stories-list');
    if (!storiesListContainer) {
      console.error('Element with ID "stories-list" not found.');
      return;
    }

    if (!stories || stories.length === 0) {
      this.populateStoriesListEmpty();
      return;
    }

    // Create row wrapper for every 3 stories
    const rows = stories.reduce((acc, story, index) => {
      const rowIndex = Math.floor(index / 3);
      
      if (!acc[rowIndex]) {
        acc[rowIndex] = [];
      }
      
      this.#addStoryMarkerToMap(story);
      
      const storyHtml = generateReportItemTemplate({
        id: story.id,
        name: story.name,
        description: story.description,
        photoUrl: story.photoUrl,
        createdAt: story.createdAt,
      });
      
      acc[rowIndex].push(storyHtml);
      return acc;
    }, []);

    // Convert rows array to HTML
    const htmlContent = rows.map(row => `
      <div class="stories-row">
        ${row.map(story => `
          <div class="story-column">
            ${story}
          </div>
        `).join('')}
      </div>
    `).join('');

    storiesListContainer.innerHTML = `
      <div class="stories-grid">
        ${htmlContent}
      </div>
    `;
  }

  /**
   * Adds a marker for the story to the map, if map is initialized and story has location data.
   * @param {Object} story - The story object containing location data.
   */
  #addStoryMarkerToMap(story) {
    if (this.#map && typeof story.lat === 'number' && typeof story.lon === 'number') {
      const coordinate = [story.lat, story.lon];
      const markerOptions = { alt: story.name || 'Story Location' };
      const popupContent = `
        <strong>${story.name || 'Pengguna'}</strong><br>
        ${story.description ? story.description.substring(0, 70) + (story.description.length > 70 ? '...' : '') : 'Tidak ada deskripsi.'}
        ${story.photoUrl ? `<br><img src="${story.photoUrl}" alt="Story image" style="width:100px; margin-top:5px;">` : ''}
      `;
      const popupOptions = { content: popupContent };
      this.#map.addMarker(coordinate, markerOptions, popupOptions);
    }
  }

  populateStoriesListEmpty() {
    const storiesListContainer = document.getElementById('stories-list');
    if (storiesListContainer) {
      // Menggunakan generateReportsListEmptyTemplate
      storiesListContainer.innerHTML = generateReportsListEmptyTemplate('Belum ada cerita yang tersedia.');
    }
  }

  populateStoriesListError(message) {
    const storiesListContainer = document.getElementById('stories-list');
    if (storiesListContainer) {
      // Menggunakan generateReportsListErrorTemplate
      storiesListContainer.innerHTML = generateReportsListErrorTemplate(message || 'Gagal memuat cerita.');
    }
  }

  async initialMap() {
    try {
      this.showMapLoading();
      this.#map = await Map.build('#map', {
        zoom: 8,
        locate: true,
      });
    } catch (error) {
      console.error('Failed to initialize map:', error);
      const mapContainer = document.getElementById('map');
      if (mapContainer) {
        mapContainer.innerHTML = '<p class="error-message">Peta tidak dapat dimuat.</p>';
      }
    } finally {
      this.hideMapLoading();
    }
  }

  showMapLoading() {
    const mapLoadingContainer = document.getElementById('map-loading-container');
    if (mapLoadingContainer) {
      mapLoadingContainer.innerHTML = generateLoaderAbsoluteTemplate();
    }
  }

  hideMapLoading() {
    const mapLoadingContainer = document.getElementById('map-loading-container');
    if (mapLoadingContainer) {
      mapLoadingContainer.innerHTML = '';
    }
  }

  showStoriesLoading() {
    const storiesListLoadingContainer = document.getElementById('stories-list-loading-container');
    if (storiesListLoadingContainer) {
      storiesListLoadingContainer.innerHTML = generateLoaderAbsoluteTemplate();
    }
  }

  hideStoriesLoading() {
    const storiesListLoadingContainer = document.getElementById('stories-list-loading-container');
    if (storiesListLoadingContainer) {
      storiesListLoadingContainer.innerHTML = '';
    }
  }
}

const renderHomePage = async () => {
  const spinner = document.getElementById('spinner');
  const container = document.getElementById('story-list');

  if (!container) {
    console.error('Element #story-list tidak ditemukan!');
    if (spinner) spinner.style.display = 'none';
    return;
  }

  try {
    const data = await StoryAPI.getAllStories();
    if (data.error) {
      container.innerHTML = `<p>Gagal memuat data: ${data.message}</p>`;
    } else {
      container.innerHTML = data.listStory.map(story => `
        <div class="story-card">
          <img src="${story.photoUrl}" alt="${story.name}" width="100">
          <h3>${story.name}</h3>
          <p>${story.description}</p>
        </div>
      `).join('');
    }
  } catch (err) {
    container.innerHTML = `<p>Terjadi kesalahan: ${err.message}</p>`;
  } finally {
    if (spinner) spinner.style.display = 'none';
  }
};

export { renderHomePage };