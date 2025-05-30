export default class LoginPresenter {
  #view;
  #model; 
  #authModel; 

  constructor({ view, model, authModel }) {
    this.#view = view;
    this.#model = model;
    this.#authModel = authModel;
  }

  async getLogin({ email, password }) {
    this.#view.showSubmitLoadingButton(); 
    try {
      
      const response = await this.#model.loginUser({ email, password });

      if (!response.ok) {
       
        console.error('Login attempt failed (API response not OK):', response);
        this.#view.loginFailed(response.message || 'Login gagal. Periksa kembali email dan password Anda.');
        return;
      }

     
      if (response.loginResult && response.loginResult.token) {
        
        const tokenSaved = this.#authModel.putAccessToken(response.loginResult.token);

        if (tokenSaved) {
          this.#view.loginSuccessfully(response.message || 'Login berhasil!');
        } else {
         
          console.error('Login successful, but failed to save access token.');
          this.#view.loginFailed('Login berhasil, tetapi gagal menyimpan sesi. Silakan coba lagi.');
        }
      } else {
        
        console.error('Login attempt failed (API response OK, but no token):', response);
        this.#view.loginFailed('Login gagal. Respons tidak valid dari server.');
      }

    } catch (error) {
      console.error('Login attempt failed (unexpected error):', error);
      this.#view.loginFailed(error.message || 'Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      this.#view.hideSubmitLoadingButton(); 
    }
  }
}