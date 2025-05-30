// File: src/scripts/pages/new/new-page.js

import NewPresenter from './new-presenter';
import { convertBase64ToBlob } from '../../utils'; // Pastikan path ini benar
import * as StoryAPI from '../../data/api';
import { generateLoaderAbsoluteTemplate } from '../../templates';
import Camera from '../../utils/camera';
import Map from '../../utils/map';

export default class NewPage {
  #presenter;
  #form;
  #camera;
  #isCameraOpen = false;
  #currentPhotoFile = null; // Akan menyimpan File object atau Blob
  #map = null;
  // Referensi elemen DOM
  #descriptionInput;
  #photoInput;
  #photoInputButton;
  #openCameraButton;
  #cameraContainer;
  #cameraVideo;
  #cameraCanvas;
  #cameraSelect;
  #cameraTakeButton;
  #photoPreviewContainer;
  #latitudeInput;
  #longitudeInput;
  #mapElement;
  #mapLoadingContainer;
  #submitButtonContainer;

  async render() {
    return `
      <section>
        <div class="new-story__header">
          <div class="container">
            <h1 class="new-story__header__title">Buat Cerita Baru</h1>
            <p class="new-story__header__description">
              Bagikan ceritamu dengan melengkapi formulir di bawah ini.<br>
              Pastikan foto dan deskripsi jelas. Foto cerita wajib diisi.
            </p>
          </div>
        </div>
      </section>

      <section class="container">
        <div class="new-form__container">
          <form id="new-story-form" class="new-form">
            <div class="form-control">
              <label for="description-input" class="new-form__description__title">Deskripsi Cerita <span class="required-asterisk">*</span></label>
              <div class="new-form__description__container">
                <textarea id="description-input" name="description" placeholder="Tuliskan ceritamu di sini..." rows="5" required></textarea>
              </div>
            </div>
            <div class="form-control">
              <label for="photo-input-button" class="new-form__photo__title">Foto Cerita <span class="required-asterisk">*</span></label>
              <div id="photo-more-info" class="form-text">Unggah satu foto untuk ceritamu (maks. 1MB).</div>
              <div class="new-form__photo__container">
                <div class="new-form__photo__buttons">
                  <button id="photo-input-button" class="btn btn-outline" type="button">Pilih dari Galeri</button>
                  <input id="photo-input" name="photo" type="file" accept="image/*" hidden="hidden" aria-describedby="photo-more-info">
                  <button id="open-camera-button" class="btn btn-outline" type="button">Buka Kamera</button>
                </div>
                <div id="camera-container" class="new-form__camera__container">
                  <video id="camera-video" class="new-form__camera__video" autoplay playsinline>Video stream not available.</video>
                  <canvas id="camera-canvas" class="new-form__camera__canvas" style="display:none;"></canvas>
                  <div class="new-form__camera__tools">
                    <select id="camera-select" style="margin-bottom: 10px;"></select>
                    <div class="new-form__camera__tools_buttons">
                      <button id="camera-take-button" class="btn" type="button">Ambil Gambar</button>
                    </div>
                  </div>
                </div>
                <div id="photo-preview-container" class="new-form__photo__preview" style="margin-top:10px;"></div>
              </div>
            </div>
            <div class="form-control">
              <div class="new-form__location__title">Lokasi (Opsional)</div>
              <div class="new-form__location__container">
                <div class="new-form__location__map__container">
                  <div id="new-story-map" class="new-form__location__map" style="height: 300px; background-color: #f0f0f0;"></div>
                  <div id="map-loading-container"></div>
                </div>
                <div class="new-form__location__lat-lng" style="margin-top: 10px;">
                  <input type="number" id="latitude-input" name="latitude" placeholder="Latitude" step="any" readonly style="margin-right: 5px; max-width: 150px;">
                  <input type="number" id="longitude-input" name="longitude" placeholder="Longitude" step="any" readonly style="max-width: 150px;">
                </div>
              </div>
            </div>
            <div class="form-buttons">
              <span id="submit-button-container">
                <button class="btn" type="submit">Unggah Cerita</button>
              </span>
              <a class="btn btn-outline" href="#/">Batal</a>
            </div>
          </form>
        </div>
      </section>
    `;
  }

  async afterRender() {
    this.#presenter = new NewPresenter({ view: this, model: StoryAPI });
    this.#currentPhotoFile = null;
    this.#cacheDOMElements();
    if (typeof this.initialMap === 'function') {
      this.initialMap().catch(error => {
        console.error("Gagal menginisialisasi peta di afterRender:", error);
        if (this.#mapLoadingContainer) this.#mapLoadingContainer.innerHTML = '<p class="error-message">Peta tidak dapat dimuat.</p>';
      });
    }
    this.#setupFormEventListeners();
    this.#displayPhotoPreview();
  }

  #cacheDOMElements() {
    this.#form = document.getElementById('new-story-form');
    this.#descriptionInput = document.getElementById('description-input');
    this.#photoInput = document.getElementById('photo-input');
    this.#photoInputButton = document.getElementById('photo-input-button');
    this.#openCameraButton = document.getElementById('open-camera-button');
    this.#cameraContainer = document.getElementById('camera-container');
    this.#cameraVideo = document.getElementById('camera-video');
    this.#cameraCanvas = document.getElementById('camera-canvas');
    this.#cameraSelect = document.getElementById('camera-select');
    this.#cameraTakeButton = document.getElementById('camera-take-button');
    this.#photoPreviewContainer = document.getElementById('photo-preview-container');
    this.#latitudeInput = document.getElementById('latitude-input');
    this.#longitudeInput = document.getElementById('longitude-input');
    this.#mapElement = document.getElementById('new-story-map');
    this.#mapLoadingContainer = document.getElementById('map-loading-container');
    this.#submitButtonContainer = document.getElementById('submit-button-container');
  }

  #setupFormEventListeners() {
    if (!this.#form) {
      console.error('Form #new-story-form tidak ditemukan.');
      return;
    }

    this.#form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const description = this.#descriptionInput.value;
      const latitude = this.#latitudeInput.value;
      const longitude = this.#longitudeInput.value;

      if (!description.trim()) {
        this.storyAddFailed('Deskripsi cerita wajib diisi.');
        return;
      }
      if (!this.#currentPhotoFile) {
        this.storyAddFailed('Foto cerita wajib diunggah.');
        return;
      }

      const formData = new FormData();
      formData.append('description', description);

      // --- PERBAIKAN UTAMA: Memastikan objek File dengan nama dikirim ---
      if (this.#currentPhotoFile) {
        let fileToAppend = this.#currentPhotoFile;
        let photoFileName = 'story-photo.bin'; // Default filename

        // Coba dapatkan nama asli jika ada (dari objek File)
        if (fileToAppend.name) {
            photoFileName = fileToAppend.name;
        } else if (fileToAppend.type) { // Jika Blob dan tidak ada nama, buat nama dari tipe MIME
            const MimeTypes = { // Daftar sederhana untuk ekstensi umum
              'image/jpeg': 'jpg',
              'image/png': 'png',
              'image/gif': 'gif',
              'image/webp': 'webp',
            };
            const extension = MimeTypes[fileToAppend.type] || fileToAppend.type.split('/')[1] || 'bin';
            photoFileName = `photo-${Date.now()}.${extension}`;
        }
        
        // Jika #currentPhotoFile adalah Blob murni (tanpa nama), konversi ke File object
        // Ini memberikan metadata yang lebih lengkap yang mungkin dibutuhkan server.
        if (fileToAppend instanceof Blob && !(fileToAppend instanceof File)) {
            fileToAppend = new File([fileToAppend], photoFileName, { type: fileToAppend.type });
            console.log('Blob dikonversi menjadi File object:', fileToAppend);
        }
        
        formData.append('photo', fileToAppend, photoFileName); // Kirim objek File atau Blob (jika sudah punya nama)

        console.log('--- DEBUGGING PHOTO FOR FORMDATA ---');
        console.log('Filename yang digunakan untuk append:', photoFileName);
        console.log('Objek yang di-append sebagai "photo":', fileToAppend);
        console.log('Instance of File?', fileToAppend instanceof File);
        console.log('Instance of Blob?', fileToAppend instanceof Blob); // Bisa true untuk File juga, karena File adalah turunan Blob
        console.log('Nama properti objek yang di-append:', fileToAppend.name);
        console.log('Ukuran properti objek yang di-append:', fileToAppend.size);
        console.log('Tipe properti objek yang di-append:', fileToAppend.type);
        console.log('--- END DEBUGGING PHOTO ---');
      }
      // --- AKHIR PERBAIKAN FOTO ---

      if (latitude && longitude) {
        formData.append('lat', parseFloat(latitude));
        formData.append('lon', parseFloat(longitude));
      }
      
      await this.#presenter.submitNewStory(formData);
    });

    if (this.#photoInput && this.#photoInputButton) {
      this.#photoInput.addEventListener('change', async (event) => {
        if (event.target.files && event.target.files[0]) {
          await this.#handleNewPhoto(event.target.files[0]);
        }
      });
      this.#photoInputButton.addEventListener('click', () => {
        this.#photoInput?.click();
      });
    }
    
    if (this.#cameraContainer && this.#openCameraButton) {
      this.#openCameraButton.addEventListener('click', async (event) => {
        this.#cameraContainer.classList.toggle('open');
        this.#isCameraOpen = this.#cameraContainer.classList.contains('open');
        if (this.#isCameraOpen) {
          event.currentTarget.textContent = 'Tutup Kamera';
          this.#setupCamera(); 
          if(this.#camera) await this.#camera.launch();
        } else {
          event.currentTarget.textContent = 'Buka Kamera';
          if(this.#camera) this.#camera.stop();
        }
      });
    }
  }

  async #handleNewPhoto(imageSource) {
    if (!imageSource) return;
    let fileToSet = imageSource;
    if (typeof imageSource === 'string' && imageSource.startsWith('data:image')) {
      try {
        const mimeType = imageSource.substring(imageSource.indexOf(':') + 1, imageSource.indexOf(';'));
        fileToSet = await convertBase64ToBlob(imageSource, mimeType || 'image/png');
      } catch (error) {
        console.error("Error converting base64 to blob:", error);
        this.storyAddFailed('Gagal memproses gambar dari kamera.'); return;
      }
    }
    if (!(fileToSet instanceof File) && !(fileToSet instanceof Blob)) {
      console.error("Invalid image source type after processing:", fileToSet);
      this.storyAddFailed('Sumber gambar tidak valid.'); return;
    }
    this.#currentPhotoFile = fileToSet;
    await this.#displayPhotoPreview();
    if (this.#isCameraOpen && this.#cameraContainer && this.#openCameraButton) {
      this.#cameraContainer.classList.remove('open');
      this.#openCameraButton.textContent = 'Buka Kamera';
      this.#isCameraOpen = false;
      if(this.#camera) this.#camera.stop();
    }
  }

  async #displayPhotoPreview() {
    if (!this.#photoPreviewContainer) return;
    const oldImageElement = this.#photoPreviewContainer.querySelector('img');
    if (oldImageElement && oldImageElement.src && oldImageElement.src.startsWith('blob:')) {
        URL.revokeObjectURL(oldImageElement.src);
    }
    this.#photoPreviewContainer.innerHTML = ''; 

    if (this.#currentPhotoFile) {
      const imageUrl = URL.createObjectURL(this.#currentPhotoFile);
      const imgElement = document.createElement('img');
      imgElement.src = imageUrl;
      imgElement.alt = 'Preview foto cerita';
      imgElement.style.maxWidth = '100%';
      imgElement.style.maxHeight = '250px';
      imgElement.style.marginTop = '10px';
      imgElement.style.objectFit = 'contain';

      const removeButton = document.createElement('button');
      removeButton.type = 'button';
      removeButton.id = 'remove-photo-button';
      removeButton.className = 'btn btn-sm btn-danger new-form__photo__remove-btn';
      removeButton.textContent = 'Hapus Foto';
      removeButton.style.marginTop = '5px';
      removeButton.style.display = 'block';
      removeButton.addEventListener('click', () => {
        URL.revokeObjectURL(imageUrl);
        this.#currentPhotoFile = null;
        this.#displayPhotoPreview(); 
        if(this.#photoInput) this.#photoInput.value = '';
      });
      
      this.#photoPreviewContainer.appendChild(imgElement);
      this.#photoPreviewContainer.appendChild(removeButton);
    }
  }
  
  #setupCamera() {
    // ... (logika setup kamera Anda, pastikan elemen ada)
    if (!this.#camera && this.#cameraVideo && this.#cameraSelect && this.#cameraCanvas) {
      this.#camera = new Camera({
        video: this.#cameraVideo,
        cameraSelect: this.#cameraSelect,
        canvas: this.#cameraCanvas,
      });
    }
    if (this.#cameraTakeButton && this.#camera) {
      const newButton = this.#cameraTakeButton.cloneNode(true); // Mencegah listener ganda
      if(this.#cameraTakeButton.parentNode) {
        this.#cameraTakeButton.parentNode.replaceChild(newButton, this.#cameraTakeButton);
      }
      this.#cameraTakeButton = newButton; // Update referensi
      this.#cameraTakeButton.addEventListener('click', async () => {
        if (this.#camera) {
          const imageBase64 = await this.#camera.takePicture(); 
          if (imageBase64) await this.#handleNewPhoto(imageBase64);
        }
      });
    }
  }

  async initialMap() {
    // ... (logika initialMap Anda, pastikan elemen ada)
    if (!this.#mapElement || !this.#latitudeInput || !this.#longitudeInput) return;
    if (this.#map) return; 
    try {
      this.showMapLoading();
      this.#map = await Map.build('#new-story-map', { zoom: 15, locate: true });
      const centerCoordinate = this.#map.getCenter();
      const lat = centerCoordinate.lat || centerCoordinate.latitude;
      const lng = centerCoordinate.lng || centerCoordinate.longitude;
      if (lat !== undefined && lng !== undefined) {
        this.#updateLatLngInput(lat, lng);
        let draggableMarker = this.#map.addMarker([lat, lng], { draggable: true });
        draggableMarker.addEventListener('move', (event) => {
          const coordinate = event.target.getLatLng(); 
          this.#updateLatLngInput(coordinate.lat, coordinate.lng);
        });
        this.#map.addMapEventListener('click', (event) => { 
          draggableMarker.setLatLng(event.latlng); 
          this.#updateLatLngInput(event.latlng.lat, event.latlng.lng);
        });
      } else {
        console.warn("Gagal mendapatkan koordinat tengah dari peta.");
      }
    } catch (error) {
      console.error('Gagal menginisialisasi peta di NewPage:', error);
      if(this.#mapElement) this.#mapElement.innerHTML = '<p class="error-message">Peta tidak dapat dimuat.</p>';
    } finally {
      this.hideMapLoading();
    }
  }

  #updateLatLngInput(latitude, longitude) {
    if (this.#latitudeInput && typeof latitude === 'number') this.#latitudeInput.value = parseFloat(latitude).toFixed(6);
    if (this.#longitudeInput && typeof longitude === 'number') this.#longitudeInput.value = parseFloat(longitude).toFixed(6);
  }

  storySuccessfullyAdded(message) {
    console.log('Story Added Successfully:', message);
    alert(message || 'Cerita berhasil ditambahkan!'); 
    this.clearForm();
    location.hash = '#/'; 
  }

  storyAddFailed(message) {
    console.error('Story Add Failed:', message);
    alert(message || 'Gagal menambahkan cerita. Silakan coba lagi.');
  }

  clearForm() {
    if (this.#form) this.#form.reset();
    const currentPreviewImage = this.#photoPreviewContainer?.querySelector('img');
    if(this.#currentPhotoFile && currentPreviewImage?.src && currentPreviewImage.src.startsWith('blob:')) {
        URL.revokeObjectURL(currentPreviewImage.src);
    }
    this.#currentPhotoFile = null;
    this.#displayPhotoPreview(); 
    if (this.#latitudeInput) this.#latitudeInput.value = '';
    if (this.#longitudeInput) this.#longitudeInput.value = '';
  }

  showSubmitLoadingButton() {
    if (this.#submitButtonContainer) {
      this.#submitButtonContainer.innerHTML = `
        <button class="btn" type="submit" disabled>
          <i class="fas fa-spinner loader-button"></i> Mengunggah...
        </button>
      `;
    }
  }

  hideSubmitLoadingButton() {
    if (this.#submitButtonContainer) {
      this.#submitButtonContainer.innerHTML = `
        <button class="btn" type="submit">Unggah Cerita</button>
      `;
    }
  }

  showMapLoading() {
    if (this.#mapLoadingContainer) {
      this.#mapLoadingContainer.innerHTML = generateLoaderAbsoluteTemplate();
      this.#mapLoadingContainer.style.display = 'block';
    }
  }

  hideMapLoading() {
    if (this.#mapLoadingContainer) {
      this.#mapLoadingContainer.innerHTML = '';
      this.#mapLoadingContainer.style.display = 'none';
    }
  }
}