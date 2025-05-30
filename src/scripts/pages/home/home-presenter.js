// File: src/scripts/pages/home/home-presenter.js

export default class HomePresenter {
  #view;
  #model; // Ini akan menjadi alias untuk file api.js Anda (StoryAPI)

  constructor({ view, model }) {
    this.#view = view;
    this.#model = model;
  }

  /**
   * Metode yang dipanggil oleh HomePage setelah render awal.
   * Bertugas untuk menginisialisasi peta dan galeri/daftar cerita.
   */
  async initialGalleryAndMap() {
    // 1. Tampilkan loading untuk daftar cerita di View
    // Ini adalah perbaikan utama untuk error TypeError Anda
    if (typeof this.#view.showStoriesLoading === 'function') {
      this.#view.showStoriesLoading();
    } else {
      console.error('HomePresenter: this.#view.showStoriesLoading is not a function. Check HomePage.js');
      // Anda bisa menampilkan error umum ke pengguna jika loading tidak bisa ditampilkan
      // this.#view.populateStoriesListError('Gagal memuat tampilan awal.');
      // return; // Hentikan eksekusi jika fungsi view penting tidak ada
    }

    // 2. Inisialisasi Peta melalui View
    // View (HomePage) memiliki metode initialMap yang menangani loading peta sendiri
    if (typeof this.#view.initialMap === 'function') {
      try {
        await this.#view.initialMap();
      } catch (mapError) {
        console.error('HomePresenter: Error during map initialization via view:', mapError);
        // Mungkin tampilkan pesan error spesifik peta di view jika ada metodenya
      }
    } else {
      console.warn('HomePresenter: this.#view.initialMap is not a function. Map initialization skipped by presenter.');
    }

    // 3. Ambil dan tampilkan daftar cerita
    try {
      // Panggil fungsi getAllStories dari model (api.js)
      // Anda bisa menambahkan parameter paginasi atau filter di sini jika perlu
      // contoh: const response = await this.#model.getAllStories({ page: 1, size: 10 });
      const response = await this.#model.getAllStories({}); // Ambil default (halaman pertama)

      if (!response || typeof response.ok === 'undefined') {
        throw new Error('Respons tidak valid dari API cerita.');
      }

      if (!response.ok) {
        // Jika API mengembalikan status error (misalnya, masalah server, unauthorized)
        console.error('HomePresenter: Failed to fetch stories (API response not OK):', response);
        if (typeof this.#view.populateStoriesListError === 'function') {
          this.#view.populateStoriesListError(response.message || 'Gagal memuat cerita dari server.');
        }
        return; // Keluar jika gagal mengambil data cerita
      }

      // Jika berhasil dan ada listStory
      if (response.listStory && Array.isArray(response.listStory)) {
        if (response.listStory.length > 0) {
          if (typeof this.#view.populateStoriesList === 'function') {
            this.#view.populateStoriesList(response.listStory);
          } else {
            console.error('HomePresenter: this.#view.populateStoriesList is not a function.');
          }
        } else {
          // Jika listStory kosong
          if (typeof this.#view.populateStoriesListEmpty === 'function') {
            this.#view.populateStoriesListEmpty();
          } else {
            console.error('HomePresenter: this.#view.populateStoriesListEmpty is not a function.');
          }
        }
      } else {
        // Jika listStory tidak ada atau bukan array, meskipun response.ok true
        console.error('HomePresenter: Invalid story list data in API response:', response);
        if (typeof this.#view.populateStoriesListError === 'function') {
          this.#view.populateStoriesListError('Data cerita tidak valid diterima dari server.');
        }
      }

    } catch (error) { // Menangkap error jaringan atau error JavaScript lainnya
      console.error('HomePresenter: Unexpected error fetching stories:', error);
      if (typeof this.#view.populateStoriesListError === 'function') {
        this.#view.populateStoriesListError(error.message || 'Terjadi kesalahan saat mengambil data cerita.');
      }
    } finally {
      // Selalu sembunyikan loading untuk daftar cerita, apapun hasilnya
      if (typeof this.#view.hideStoriesLoading === 'function') {
        this.#view.hideStoriesLoading();
      } else {
        console.error('HomePresenter: this.#view.hideStoriesLoading is not a function.');
      }
    }
  }

  // Anda bisa menambahkan metode presenter lain di sini jika diperlukan
  // misalnya, untuk menangani filter, paginasi, dll.
}