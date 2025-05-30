// File: src/scripts/pages/story-detail/story-detail-page.js

import { parseActivePathname } from '../../routes/url-parser'; // Diubah sesuai error sebelumnya
import StoryDetailPresenter from './story-detail-presenter';
import * as StoryAPI from '../../data/api';

import {
  generateLoaderAbsoluteTemplate,
  generateStoryDetailTemplate,
  generateStoryDetailErrorTemplate, // Diubah sesuai error sebelumnya
} from '../../templates';

// 1. PASTIKAN IMPORT Map UTILITY ANDA SUDAH AKTIF DAN PATH-NYA BENAR
import Map from '../../utils/map'; // Hapus komentar ini dan sesuaikan path jika perlu

export default class StoryDetailPage {
  #presenter;
  #storyId;
  #storyDetailContentElement;
  #loadingContainerElement;
  #mapInstance = null; // 2. Tambahkan atau aktifkan properti ini

  async render() {
    return `
      <section class="container story-detail-page-container" aria-live="polite">
        <div id="story-detail-loading-container" class="loading-container-absolute"></div>
        <article id="story-detail-content" class="story-detail-content">
          <h2>Memuat Detail Cerita...</h2>
        </article>
      </section>
    `;
  }

  async afterRender() {
    this.#storyDetailContentElement = document.getElementById('story-detail-content');
    this.#loadingContainerElement = document.getElementById('story-detail-loading-container');

    if (!this.#storyDetailContentElement || !this.#loadingContainerElement) {
      console.error('Elemen DOM krusial (#story-detail-content atau #story-detail-loading-container) tidak ditemukan.');
      document.body.innerHTML = '<p>Error: Struktur halaman tidak lengkap.</p>';
      return;
    }

    const urlParts = parseActivePathname(); // Menggunakan fungsi yang diimpor langsung
    this.#storyId = urlParts.id;

    if (!this.#storyId) {
      console.error('ID Cerita tidak ditemukan di URL untuk halaman detail.');
      this.displayError('Halaman tidak valid atau ID Cerita tidak ditemukan.');
      return;
    }
    
    console.log('StoryDetailPage afterRender - Mengambil detail untuk storyId:', this.#storyId);

    this.#presenter = new StoryDetailPresenter({
      view: this,
      model: StoryAPI,
      storyId: this.#storyId,
    });

    await this.#presenter.fetchStoryDetail();
  }

  displayStoryDetail(story) {
    if (!this.#storyDetailContentElement) return;

    this.#storyDetailContentElement.innerHTML = generateStoryDetailTemplate(story);
    
    // 3. AKTIFKAN PEMANGGILAN INISIALISASI PETA
    if (typeof story.lat === 'number' && typeof story.lon === 'number' && typeof this._initializeMapForDetail === 'function') {
      // Reset instance peta lama sebelum membuat yang baru (penting untuk navigasi SPA)
      if (this.#mapInstance && typeof this.#mapInstance.remove === 'function') {
        this.#mapInstance.remove(); // Hapus peta lama jika ada metode remove()
      }
      this.#mapInstance = null; // Setel ulang instance
      this._initializeMapForDetail(story.lat, story.lon, story.name); 
    } else {
      // Jika tidak ada lat/lon, pastikan kontainer peta (jika ada) tidak menampilkan pesan loading terus
      const mapContainer = document.getElementById('story-map-detail');
      if (mapContainer) {
        mapContainer.innerHTML = '<p style="text-align:center; padding:10px;">Lokasi tidak tersedia untuk cerita ini.</p>';
      }
    }

    this.hideLoading();
  }

  displayError(message) {
    if (!this.#storyDetailContentElement) return;
    // Menggunakan generateStoryDetailErrorTemplate yang sudah disesuaikan namanya
    this.#storyDetailContentElement.innerHTML = generateStoryDetailErrorTemplate(message || 'Gagal memuat detail cerita. Silakan coba lagi nanti.');
    this.hideLoading();
  }

  showLoading() {
    if (!this.#loadingContainerElement || !this.#storyDetailContentElement) return;
    this.#loadingContainerElement.innerHTML = generateLoaderAbsoluteTemplate();
    this.#loadingContainerElement.style.display = 'block';
    this.#storyDetailContentElement.innerHTML = '';
  }

  hideLoading() {
    if (!this.#loadingContainerElement) return;
    this.#loadingContainerElement.innerHTML = '';
    this.#loadingContainerElement.style.display = 'none';
  }

  // 4. AKTIFKAN DAN SESUAIKAN METODE INISIALISASI PETA INI
  async _initializeMapForDetail(lat, lon, storyCreatorName = 'Lokasi Cerita') {
    // Pastikan Anda memiliki elemen <div id="story-map-detail"></div>
    // di dalam HTML yang dihasilkan oleh generateStoryDetailTemplate(story).
    const mapContainer = document.getElementById('story-map-detail'); 
    
    if (mapContainer) { 
      mapContainer.innerHTML = ''; // Bersihkan pesan "Peta akan dimuat..." atau error sebelumnya
      try {
        // Tampilkan loading sederhana di kontainer peta jika perlu
        // mapContainer.innerHTML = generateLoaderAbsoluteTemplate(); // Atau loader yang lebih kecil

        this.#mapInstance = await Map.build('#story-map-detail', { // Menggunakan utilitas Map Anda
          center: [lat, lon],
          zoom: 16, // Zoom yang lebih dekat untuk detail
          // Opsi lain untuk peta Anda, misal: scrollWheelZoom: false
        });

        if (this.#mapInstance) {
            const markerOptions = { title: storyCreatorName }; // Opsi untuk marker
            const popupOptions = { content: `<strong>${storyCreatorName}</strong><br>Lokasi cerita.` }; // Opsi untuk popup
            this.#mapInstance.addMarker([lat, lon], markerOptions, popupOptions);
            // Anda bisa juga membuka popup secara default jika diinginkan
            // this.#mapInstance.openPopupOnMarker([lat, lon]); // Jika utilitas Anda mendukung
        } else {
            throw new Error("Map.build tidak mengembalikan instance peta.");
        }
      } catch (error) {
        console.error('Gagal menginisialisasi peta di halaman detail:', error);
        if(mapContainer) mapContainer.innerHTML = '<p class="error-message" style="text-align:center; padding:20px;">Peta tidak dapat dimuat.</p>';
      }
    } else {
      console.warn('Kontainer peta dengan ID "story-map-detail" tidak ditemukan di DOM.');
    }
  }
}