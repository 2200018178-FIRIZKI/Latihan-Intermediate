// File: src/scripts/pages/new/new-presenter.js

export default class NewPresenter {
  #view;
  #model; // Ini akan menjadi alias untuk file api.js Anda (misalnya, StoryAPI)

  constructor({ view, model }) {
    this.#view = view;
    this.#model = model;
  }

  // Metode showNewFormMap() yang ada di kode Anda sebelumnya kemungkinan tidak lagi
  // diperlukan di presenter jika view (NewPage) sudah menginisialisasi petanya
  // sendiri di afterRender() atau jika tidak ada orkestrasi khusus peta
  // yang perlu dilakukan presenter pada fase ini.
  // Jika NewPage.afterRender() sudah memanggil NewPage.initialMap(),
  // maka metode ini di presenter bisa dihilangkan.

  /**
   * Menangani pengiriman data cerita baru ke API.
   * Menerima formData yang sudah disiapkan oleh View.
   * @param {FormData} formData - Berisi description, photo, dan opsional lat, lon.
   */
  async submitNewStory(formData) {
    // 1. Tampilkan tombol loading di View
    if (typeof this.#view.showSubmitLoadingButton === 'function') {
      this.#view.showSubmitLoadingButton();
    } else {
      console.error('NewPresenter: this.#view.showSubmitLoadingButton is not a function. Check NewPage.js');
    }

    try {
      // 2. Panggil fungsi API untuk menambahkan cerita baru.
      // Pastikan 'addNewStory' adalah nama fungsi yang benar di file api.js Anda
      // yang melakukan POST /stories dengan FormData dan menyertakan token.
      const response = await this.#model.addNewStory(formData);

      // Lakukan pengecekan dasar pada respons
      if (!response || typeof response.ok === 'undefined') {
        console.error('NewPresenter: Invalid response from API when adding story:', response);
        throw new Error('Respons tidak valid dari API saat menambahkan cerita.');
      }

      if (!response.ok) {
        // Jika API mengembalikan status error
        console.error('NewPresenter: Failed to add new story (API response not OK):', response);
        if (typeof this.#view.storyAddFailed === 'function') {
          // Gunakan response.message jika ada, atau pesan default
          this.#view.storyAddFailed(response.message || 'Gagal mengunggah cerita. Silakan coba lagi.');
        }
        return; // Hentikan eksekusi lebih lanjut jika gagal
      }

      // Jika berhasil, panggil callback sukses di View
      // Respon sukses dari POST /stories biasanya: { "error": false, "message": "success" }
      if (typeof this.#view.storySuccessfullyAdded === 'function') {
        this.#view.storySuccessfullyAdded(response.message || 'Cerita berhasil diunggah!');
      } else {
        console.error('NewPresenter: this.#view.storySuccessfullyAdded is not a function. Check NewPage.js');
      }

    } catch (error) { // Menangkap error jaringan atau error JavaScript lainnya
      console.error('NewPresenter: Unexpected error submitting new story:', error);
      if (typeof this.#view.storyAddFailed === 'function') {
        this.#view.storyAddFailed(error.message || 'Terjadi kesalahan. Tidak dapat mengunggah cerita.');
      }
    } finally {
      // 3. Selalu sembunyikan tombol loading di View, apapun hasilnya
      if (typeof this.#view.hideSubmitLoadingButton === 'function') {
        this.#view.hideSubmitLoadingButton();
      } else {
        console.error('NewPresenter: this.#view.hideSubmitLoadingButton is not a function. Check NewPage.js');
      }
    }
  }

  // Anda bisa menambahkan metode lain di sini jika NewPage memerlukannya,
  // misalnya jika Anda memutuskan Presenter yang harus memanggil view.initialMap().
  // Contoh:
  // async initializePageFeatures() {
  //   if (typeof this.#view.initialMap === 'function') {
  //     await this.#view.initialMap();
  //   }
  //   // Logika lain jika ada
  // }
}