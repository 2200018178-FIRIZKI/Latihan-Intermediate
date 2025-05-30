import RegisterPresenter from './register-presenter';
// Pastikan path '../../../data/api' sudah benar sesuai struktur folder Anda
import * as RuangKisahAPI from '../../../data/api';

export default class RegisterPage {
  #presenter = null;

  async render() {
    return `
      <section class="register-container">
        <div class="register-form-container">
          <h1 class="register__title">Daftar akun</h1>

          <form id="register-form" class="register-form">
            <div class="form-control">
              <label for="name-input" class="register-form__name-title">Nama lengkap</label>
              <div class="register-form__title-container">
                <input id="name-input" type="text" name="name" placeholder="Masukkan nama lengkap Anda" required>
              </div>
            </div>
            <div class="form-control">
              <label for="email-input" class="register-form__email-title">Email</label>
              <div class="register-form__title-container">
                <input id="email-input" type="email" name="email" placeholder="Contoh: nama@email.com" required>
              </div>
            </div>
            <div class="form-control">
              <label for="password-input" class="register-form__password-title">Password</label>
              <div class="register-form__title-container">
                <input id="password-input" type="password" name="password" placeholder="Masukkan password baru" required minlength="8">
              </div>
            </div>
            <div class="form-buttons register-form__form-buttons">
              <div id="submit-button-container">
                <button class="btn" type="submit">Daftar akun</button>
              </div>
              <p class="register-form__already-have-account">Sudah punya akun? <a href="#/login">Masuk</a></p>
            </div>
          </form>
          
          <div id="register-error-message" class="error-message"></div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    this.#presenter = new RegisterPresenter({
      view: this,
      model: RuangKisahAPI, 
    });

    this.#setupForm();
  }

  #setupForm() {
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
      registerForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const data = {
          name: document.getElementById('name-input').value,
          email: document.getElementById('email-input').value,
          password: document.getElementById('password-input').value,
        };
        
        await this.#presenter.getRegistered(data);
      });
    }
  }

  registeredSuccessfully(message) {
    console.log('Registrasi Berhasil:', message); 
   
    alert('Registrasi berhasil! Anda akan diarahkan ke halaman login.'); 
    
    location.hash = '#/login';
  }

  registeredFailed(message) {
    console.error('Registrasi Gagal:', message); 

   
    alert(message || 'Terjadi kesalahan saat registrasi.'); 
  }

  showSubmitLoadingButton() {
    const submitButtonContainer = document.getElementById('submit-button-container');
    if (submitButtonContainer) {
      submitButtonContainer.innerHTML = `
        <button class="btn" type="submit" disabled>
          <i class="fas fa-spinner loader-button"></i> Mendaftar...
        </button>
      `;
    }
  }

  hideSubmitLoadingButton() {
    const submitButtonContainer = document.getElementById('submit-button-container');
    if (submitButtonContainer) {
      submitButtonContainer.innerHTML = `
        <button class="btn" type="submit">Daftar akun</button>
      `;
    }
  }
}