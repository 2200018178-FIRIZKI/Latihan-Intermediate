export default class RegisterPresenter {
  #view;
  #model;

  constructor({ view, model }) {
    this.#view = view;
    this.#model = model; // Ini adalah alias untuk file api.js Anda
  }

  async getRegistered({ name, email, password }) {
    this.#view.showSubmitLoadingButton(); // Memberitahu View untuk menampilkan loading
    try {
      // PENYESUAIAN 1: Pastikan nama fungsi ini 'registerUser' (atau nama yang sesuai
      // di file api.js Anda yang memanggil endpoint /register dari Story API).
      // Jika di api.js Anda fungsi tersebut masih bernama 'getRegistered' dan sudah benar
      // menargetkan API Cerita, maka gunakan nama tersebut.
      const response = await this.#model.registerUser({ name, email, password });

      if (!response.ok) { // Penanganan jika API mengembalikan error (misal: email sudah terdaftar, validasi gagal)
        console.error('Register attempt failed (API response not OK):', response);
        this.#view.registeredFailed(response.message || 'Proses registrasi gagal.');
        return;
      }

      // PENYESUAIAN 2: View Anda (register-page.js) memiliki: registeredSuccessfully(message)
      // Respon sukses dari API register Story API adalah: { "error": false, "message": "User Created" }
      // Jadi, kita hanya meneruskan response.message.
      this.#view.registeredSuccessfully(response.message);

    } catch (error) { // Penanganan jika terjadi error jaringan atau error tak terduga lainnya
      console.error('Register attempt failed (unexpected error):', error);
      this.#view.registeredFailed(error.message || 'Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      this.#view.hideSubmitLoadingButton(); // Memberitahu View untuk menyembunyikan loading, apapun hasilnya
    }
  }
}